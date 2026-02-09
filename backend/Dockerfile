# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY src/*.csproj ./src/
RUN dotnet restore src/*.csproj -r linux-x64

# Copy the rest of the source code
COPY . .

# Install Dotnet EF to bundle it later
RUN dotnet tool install --global dotnet-ef --version 10.*
ENV PATH="$PATH:/root/.dotnet/tools"

# Build
WORKDIR /app/src
RUN dotnet build *.csproj -c Release --no-restore

# Create the EF Core bundle, which allows us to run migrations without having the .NET SDK in the final image
RUN dotnet ef migrations bundle --self-contained -r linux-x64 --configuration Release -o /app/out/efbundle --no-build

# Build
RUN dotnet publish *.csproj -c Release -r linux-x64 -o /app/out --no-restore --self-contained

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/out .

# Make the efbundle executable
RUN chmod +x ./efbundle

EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
