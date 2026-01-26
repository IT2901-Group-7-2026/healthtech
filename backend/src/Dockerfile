# Multi-architecture Dockerfile with ARM64 support
# Build with: docker buildx build --platform linux/arm64,linux/amd64 -t your-image:tag .

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETARCH
WORKDIR /App

# Copy everything
COPY . ./

# Restore as distinct layers with architecture-specific runtime
RUN dotnet restore -a $TARGETARCH

# Build and publish a release for the target architecture
RUN dotnet publish -a $TARGETARCH --no-restore -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /App
COPY --from=build /App/out .
ENTRYPOINT ["dotnet", "backend.dll"]
