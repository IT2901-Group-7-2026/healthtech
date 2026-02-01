# HealthTech

## Requirements

- [Docker](https://www.docker.com/get-started)
- [.NET SDK 10](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [node](https://nodejs.org/en)
- [pnpm](https://pnpm.io/)

## Documentation

- [Onboarding: READ IF ITS YOUR FIRST TIME OPENING THIS REPO](./docs/onboarding.md)
- [Tech Stack](./docs/tech-stack.md)

## Getting Started

### Set up environment variables

You need two `.env` files for the project to run correctly:

- `/backend/.env`
- `/frontend/.env`

Make a copy of the `.env.example` file in each respective directory. Remember to change the default database password (`your_secure_password_here`) in the variables POSTGRES_PASSWORD and DATABASE_URL.

### Run the backend

First, download the files `NoiseData.csv`, `DustData.csv`, `VibrationData.csv` from [https://drive.proton.me/urls/FYRKP45DT8#CyS2vd2gzQHH](https://drive.proton.me/urls/FYRKP45DT8#CyS2vd2gzQHH) and place them in the `/backend/seed/` directory.

You may also have to download `ef`, which you can do by running: `dotnet tool install --global dotnet-ef`

Then run the following commands:

```sh
# Navigate to the backend directory
cd backend

# Start the database
docker compose up -d

# Run migrations
dotnet ef database update --project src

# Seed the database with sample data
docker exec -it timescaledb psql -U postgres -d mydb -f /seed/seed.sql

# Start the backend
dotnet watch run --project src

# The backend will be running at http://localhost:5063
```

### Run the Frontend

In a new terminal, run the following commands:

```sh
# Navigate to the frontend directory
cd frontend

# Install dependencies
pnpm install

# Start the frontend
pnpm dev

# The frontend will be running at http://localhost:5173
```

## Run tests

```sh
# Navigate to the backend directory
cd backend

# Run tests
dotnet test
```

## Linting and Formatting in Frontend

In the frontend directory, you can run the following commands:

```sh
# Check for linting errors and apply safe fixes
pnpm lint

# Check for formatting errors and apply safe fixes
pnpm format

# Do both in one check
pnpm check
```

## Frontend Deployment

### Build for Production

First, build your app for production:

```sh
pnpm build
```

Then run the app in production mode:

```sh
pnpm start
```

Now you'll need to pick a host to deploy it to.

### Example Deployment of Whole Application Stack

An example deployment configuration is available in [an example file](docker-compose-deployment-example.yml).
This configuration uses traefik as a reverse proxy, with letsencrypt as a certificate resolver.

#### Important Notes About Docker Images for Deployment

The frontend needs to be rebuilt for the correct API URL. This value is taken from the `VITE_BASE_URL` variable in the `.env` file. Also note that both frontend and backend dockerfiles support multi-architecture builds, such as `linux/arm64`, but are not built with this support for the GitHub container registry. Both images need to be rebuilt if this is needed.

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.
Make sure to deploy the output of `pnpm run build`
As this is a single page application (no server-side rendering), we only create a client-side bundle under `build/client/`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   └── client/    # Client-side code
```
