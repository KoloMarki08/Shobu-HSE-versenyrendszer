using System.Net;
using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Hubs;
using Versenyrendszer.Models; // Ha esetleg máshogy nevezted a mappát/projektet, ezt a szót írd át!
using Versenyrendszer.Services;

var builder = WebApplication.CreateBuilder(args);

// --- INNEN INDUL AZ ADATBÁZIS BEÁLLÍTÁS ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
ServerVersion serverVersion;
try
{
    serverVersion = ServerVersion.AutoDetect(connectionString);
}
catch
{
    // Ha az adatbázis (shobu_verseny_db) még nem létezik az első induláskor, alapértelmezett MariaDB/MySQL verzióval indulunk,
    // hogy a lenti db.Database.Migrate() automatikusan létre tudja hozni magát az adatbázist és a táblákat is!
    serverVersion = new MariaDbServerVersion(new Version(10, 4, 32));
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));
// --- ITT A VÉGE AZ ADATBÁZIS BEÁLLÍTÁSNAK ---

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<LiveArenaStateService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<EmailService>();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

static bool IsAllowedCorsOrigin(string? origin)
{
    if (string.IsNullOrWhiteSpace(origin) || !Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    var host = uri.Host;
    if (string.Equals(host, "tatamimaster.hu", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(host, "www.tatamimaster.hu", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(host, "127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(host, "::1", StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    if (IPAddress.TryParse(host, out var ip) && ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
    {
        var b = ip.GetAddressBytes();
        if (b[0] == 10) return true;
        if (b[0] == 192 && b[1] == 168) return true;
        if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true;
        if (b[0] == 127) return true;
    }

    return false;
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.SetIsOriginAllowed(IsAllowedCorsOrigin)
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials());
});

var app = builder.Build();

// Automatikus adatbázis- és táblalétrehozás (EF Core Migrations) + alapadatok feltöltése induláskor,
// így új szerveren (pl. Szerverem.hu) külön SQL importálás vagy Update-Database parancs nélkül is azonnal felépül minden!
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();

        await AuthService.EnsureDefaultUsersAndHashesAsync(db);

        if (!db.Tournaments.Any())
        {
            db.Tournaments.Add(new Tournament
            {
                Name = "Shobu HSE Országos Bajnokság 2026",
                Date = new DateTime(2026, 5, 20),
                Status = "ÉLŐ / NYITVA",
                Organizer = "Vácrátóti HSE - Tornai Bálint"
            });
            db.SaveChanges();
        }

        if (!db.Tatamis.Any())
        {
            db.Tatamis.AddRange(
                new Tatami { Name = "Tatami A" },
                new Tatami { Name = "Tatami B" },
                new Tatami { Name = "Tatami C" }
            );
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ADATBÁZIS AUTOMATIKUS INICIALIZÁLÁS FIGYELMEZTETÉS]: {ex.Message}");
    }
}

// CORS engedélyezése legelsőként, hogy minden válaszra (SSE stream, SignalR, OPTIONS preflight, hibakódok) rákerüljön
app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Globális hibakezelő: megakadályozza a szerver leállását adatbázis/konverziós hiba esetén
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
    {
        // Kliens oldali kapcsolatbontás (pl. élő SSE stream bezárása)
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[BACKEND HIBA - {context.Request.Path}]: {ex.Message}");
        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Szerveroldali adatbázis- vagy feldolgozási hiba történt.",
                details = ex.Message
            });
        }
    }
});

app.Use(async (context, next) =>
{
    // 1. Biztonsági HTTP Fejlécek (Clickjacking, MIME-sniffing és XSS ellen)
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

    // 2. Szerveroldali API hitelesítés és szerepkör-védelem
    var method = context.Request.Method.ToUpperInvariant();
    var path = (context.Request.Path.Value ?? string.Empty).TrimEnd('/');

    if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) && method != "OPTIONS")
    {
        var authService = context.RequestServices.GetRequiredService<AuthService>();
        var caller = authService.ValidateToken(AuthService.ExtractTokenFromRequest(context.Request));

        bool isUsersRead = string.Equals(method, "GET", StringComparison.Ordinal) &&
                           (path.Equals("/api/Users", StringComparison.OrdinalIgnoreCase) ||
                            path.StartsWith("/api/Users/", StringComparison.OrdinalIgnoreCase));

        bool isPublicAuthWrite = string.Equals(method, "POST", StringComparison.Ordinal) &&
                                 (path.Equals("/api/Users/login", StringComparison.OrdinalIgnoreCase) ||
                                  path.Equals("/api/Users/register", StringComparison.OrdinalIgnoreCase) ||
                                  path.Equals("/api/Users", StringComparison.OrdinalIgnoreCase));

        bool isProtectedWrite = (method == "POST" || method == "PUT" || method == "DELETE") && !isPublicAuthWrite;

        if (isUsersRead || isProtectedWrite)
        {
            if (!caller.Valid)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json; charset=utf-8";
                await context.Response.WriteAsJsonAsync(new { error = "Hitelesítés szükséges! Jelentkezz be újra." });
                return;
            }

            bool isSuperAdminResetEndpoint =
                path.Equals("/api/Tournaments/reset-seed", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/api/Tournaments/reset-empty", StringComparison.OrdinalIgnoreCase);

            bool isAdminEndpoint = isUsersRead ||
                                   path.StartsWith("/api/Tournaments", StringComparison.OrdinalIgnoreCase) ||
                                   path.StartsWith("/api/Categories", StringComparison.OrdinalIgnoreCase) ||
                                   path.StartsWith("/api/Tatamis", StringComparison.OrdinalIgnoreCase) ||
                                   path.StartsWith("/api/Users", StringComparison.OrdinalIgnoreCase);

            bool isJudgeOrAdminEndpoint = path.StartsWith("/api/Matches", StringComparison.OrdinalIgnoreCase) ||
                                          path.StartsWith("/api/LiveArena/tatami", StringComparison.OrdinalIgnoreCase);

            bool isCoachOrHigherEndpoint = path.StartsWith("/api/Competitors", StringComparison.OrdinalIgnoreCase) ||
                                           path.StartsWith("/api/Registrations", StringComparison.OrdinalIgnoreCase) ||
                                           path.StartsWith("/api/LiveArena/shared", StringComparison.OrdinalIgnoreCase) ||
                                           path.StartsWith("/api/LiveArena/notify", StringComparison.OrdinalIgnoreCase);

            bool allowed = true;
            if (isSuperAdminResetEndpoint)
            {
                allowed = caller.Role == "ADMIN" && AuthService.IsSuperAdmin(caller.Username);
            }
            else if (isAdminEndpoint)
            {
                allowed = caller.Role == "ADMIN";
            }
            else if (isJudgeOrAdminEndpoint)
            {
                allowed = caller.Role == "ADMIN" || caller.Role == "JUDGE";
            }
            else if (isCoachOrHigherEndpoint)
            {
                allowed = caller.Role == "ADMIN" || caller.Role == "JUDGE" || caller.Role == "COACH";
            }

            if (!allowed)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json; charset=utf-8";
                var errMsg = isSuperAdminResetEndpoint
                    ? "Az adatbázis lenullázása és a gyári mintaadatok betöltése kizárólag a KoloMarki fiókkal engedélyezett!"
                    : "Nincs megfelelő jogosultság ehhez a művelethez.";
                await context.Response.WriteAsJsonAsync(new { error = errMsg });
                return;
            }
        }
    }

    // 3. Automatikus élő szinkronizációs értesítés adatváltozáskor (POST / PUT / DELETE)
    try
    {
        await next();

        if ((method == "POST" || method == "PUT" || method == "DELETE") &&
            context.Response.StatusCode >= 200 && context.Response.StatusCode < 400)
        {
            if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) &&
                !path.StartsWith("/api/LiveArena", StringComparison.OrdinalIgnoreCase) &&
                !path.StartsWith("/api/Auth", StringComparison.OrdinalIgnoreCase) &&
                !path.Equals("/api/Users/login", StringComparison.OrdinalIgnoreCase))
            {
                var liveArena = context.RequestServices.GetRequiredService<LiveArenaStateService>();
                if (path.EndsWith("/reset-seed", StringComparison.OrdinalIgnoreCase))
                {
                    liveArena.ResetAll();
                }
                else
                {
                    liveArena.NotifyDatabaseChanged(path);
                }
            }
        }
    }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
    {
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[BIZTONSÁGI / ADATBÁZIS NAPLÓ]: {ex.Message}");
        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { error = "Belső szerverhiba történt." });
        }
    }
});

// Helyi Wi-Fi / LAN (pl. 192.168.x.x:5008) kéréseket nem irányítunk át önaláírt localhost HTTPS-re,
// így a telefonok és okos TV-k tanúsítványhiba nélkül csatlakoznak a csarnokban!
app.UseWhen(
    ctx => app.Environment.IsDevelopment() &&
           (string.Equals(ctx.Request.Host.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(ctx.Request.Host.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)),
    subApp => subApp.UseHttpsRedirection()
);

app.UseAuthorization();
app.MapControllers();
app.MapHub<LiveArenaHub>("/hubs/arena");

app.Lifetime.ApplicationStarted.Register(() =>
{
    var lanIps = LiveArenaStateService.GetLocalLanIpv4Addresses();
    var ipInfo = lanIps.Count > 0 ? string.Join(", ", lanIps.Select(ip => $"http://{ip}:5008")) : "nincs aktív Wi-Fi/LAN IP";
    Console.WriteLine("========================================================================");
    Console.WriteLine("[TATAMI MASTER LIVE ARENA] Valós idejű C# Backend AKTÍV!");
    Console.WriteLine("  -> Élő SSE Stream:   https://localhost:7045/api/LiveArena/stream");
    Console.WriteLine("  -> SignalR Hub:      https://localhost:7045/hubs/arena");
    Console.WriteLine($"  -> Csarnok LAN API:  {ipInfo}");
    Console.WriteLine("========================================================================");
});

app.Run();
