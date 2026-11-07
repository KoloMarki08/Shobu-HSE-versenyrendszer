using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Hubs;
using Versenyrendszer.Models; // Ha esetleg máshogy nevezted a mappát/projektet, ezt a szót írd át!
using Versenyrendszer.Services;

var builder = WebApplication.CreateBuilder(args);

// --- INNEN INDUL AZ ADATBÁZIS BEÁLLÍTÁS ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
// --- ITT A VÉGE AZ ADATBÁZIS BEÁLLÍTÁSNAK ---

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<LiveArenaStateService>();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.SetIsOriginAllowed(_ => true)
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials());
});

var app = builder.Build();

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
    // 1. Biztonsági HTTP Fejlécek (Clickjacking és XSS ellen)
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

    // 2. Automatikus élő szinkronizációs értesítés adatváltozáskor (POST / PUT / DELETE)
    var method = context.Request.Method.ToUpperInvariant();
    try
    {
        await next();

        if ((method == "POST" || method == "PUT" || method == "DELETE") &&
            context.Response.StatusCode >= 200 && context.Response.StatusCode < 400)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) &&
                !path.StartsWith("/api/LiveArena", StringComparison.OrdinalIgnoreCase) &&
                !path.StartsWith("/api/Auth", StringComparison.OrdinalIgnoreCase))
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
    ctx => string.Equals(ctx.Request.Host.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(ctx.Request.Host.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase),
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
