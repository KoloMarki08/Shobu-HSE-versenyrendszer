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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();