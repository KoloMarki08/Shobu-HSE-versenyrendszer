using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Models; // Ha esetleg máshogy nevezted a mappát/projektet, ezt a szót írd át!

var builder = WebApplication.CreateBuilder(args);

// --- INNEN INDUL AZ ADATBÁZIS BEÁLLÍTÁS ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
// --- ITT A VÉGE AZ ADATBÁZIS BEÁLLÍTÁSNAK ---

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

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
    catch (Exception ex)
    {
        Console.WriteLine($"[BACKEND HIBA - {context.Request.Path}]: {ex.Message}");
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            error = "Szerveroldali adatbázis- vagy feldolgozási hiba történt.",
            details = ex.Message
        });
    }
});

app.Use(async (context, next) =>
{
    // 1. Biztonsági HTTP Fejlécek (Clickjacking és XSS ellen)
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

    // 2. API Írásvédelem (POST, PUT, DELETE csak érvényes Tokennel!)
    var method = context.Request.Method.ToUpper();
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[BIZTONSÁGI / ADATBÁZIS NAPLÓ]: {ex.Message}");
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { error = "Belső szerverhiba történt." });
    }
});

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.Run();