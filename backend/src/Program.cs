using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Services;
using Backend.Utils;
using Backend.Validation;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

EnvUtils.LoadEnvFile();
builder.Configuration.AddEnvironmentVariables();

var AllowDevFrontend = "_allowDevFrontend";
var configuration = builder.Configuration;

var allowedHost = configuration["AllowedHost"] ?? "localhost";

builder.Services.AddCors(options =>
{
	options.AddPolicy(
		name: AllowDevFrontend,
		policy =>
		{
			policy
				.SetIsOriginAllowed(origin =>
				{
					var uri = new Uri(origin);
					var host = uri.Host;

					// Allow localhost for development
					if (host == "localhost" || host == "127.0.0.1")
						return true;

					// Allow configured host and its subdomains
					if (host == allowedHost || host.EndsWith($".{allowedHost}"))
						return true;

					return false;
				})
				.AllowAnyHeader()
				.AllowAnyMethod()
				.AllowCredentials();
		}
	);
});

// Convert enum from numbers to camelCase strings in JSON
builder
	.Services.AddControllers()
	.AddJsonOptions(options =>
	{
		options.JsonSerializerOptions.Converters.Add(
			new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)
		);
	});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
	options.UseNpgsql(builder.Configuration.GetValue<string>("DATABASE_URL"))
);

builder.Services.AddScoped<ISensorDataService, SensorDataService>();
builder.Services.AddScoped<ValidateFieldForDataTypeFilter>();
builder.Services.AddScoped<INoteDataService, NoteDataService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserStatusService, UserStatusService>();

var app = builder.Build();

// Migrate database during startup
using (var scope = app.Services.CreateScope())
{
	var services = scope.ServiceProvider;
	try
	{
		var context = services.GetRequiredService<AppDbContext>();
		context.Database.Migrate();
	}
	catch (Exception ex)
	{
		var logger = services.GetRequiredService<ILogger<Program>>();
		logger.LogError(ex, "An error occurred while migrating the database.");
		throw;
	}
}

app.UseCors(AllowDevFrontend);
app.MapControllers();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
}

app.UseHttpsRedirection();

await app.RunAsync();

// This is needed for integration tests
public partial class Program { }
