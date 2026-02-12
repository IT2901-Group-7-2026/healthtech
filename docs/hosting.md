<sub>This assumes a standard Ubuntu server. It should still be easy to follow for other distros, but not Windows server.</sub>

You need to create a VM on some sort of server (like OpenStack). This picks up after you have SSH-ed into it.

### Installation

```bash
# Update the package list
sudo apt-get update

# Install Docker, Docker Compose, and Git
sudo apt-get install -y docker.io docker-compose-v2 git

# Add your user to the docker group so you don't need 'sudo' for docker commands
sudo usermod -aG docker $USER

# IMPORTANT: Log out and log back in for group changes to take effect
exit
```

### Clone the project

SSH back into your server and run:

```bash
git clone https://github.com/tdt4290-group2/healthtech.git
cd healthtech
```

### Environment variables

```bash
cp backend/.env.example backend/.env
# Update your DB passwords and secrets
nano backend/.env

cp frontend/.env.example frontend/.env
# Update any frontend-specific variables
# NOTE: By default, set VITE_API_URL to /api/ because of Traefik routing
nano frontend/.env
```

### Run database migrations

The migrator service in our `docker-compose.prod.yml` is set up to run the migrations automatically when you launch the app, but you can also run them manually if you want more control or need to troubleshoot.

```bash
# IMPORTANT: Read the text above
docker compose --env-file ./backend/.env -f docker-compose.prod.yml run --rm migrator
```

### Seed the database (optional)

**NOTE:** See [root README](../README.md) for instructions about seeding.

You should avoid using SCP to copy the files because of their size. Use a program like WinSCP/Cyberduck/FileZilla to upload the files, or use rsync:

```bash
# Update all paths (/backend/seed and ./your-file.pem) as needed.
# - "HOST" is the IP address of your server (the same you SSH into)
# - The other paths are on YOUR computer, not the server.
#
#                     vvvvvvvvvvvvvv  vvvvvvvvvvvvv              vvvvvv
rsync -avP -e "ssh -i ./your-key.pem" /backend/seed/*.csv ubuntu@<HOST>:~/healthtech/backend/seed/ -i ./your-file.pem

# If you are on WSL, you might need to copy the .pem to WSL and use that file instead, since WSL sometimes messes with file permissions.
#   cd ~/healthtech
#   mkdir -p ~/.ssh
#   cp /mnt/c/Users/.../my-key.pem ~/.ssh/
#   chmod 600 ~/.ssh/my-key.pem
```

### Launch the application

Build and start all services (database, backend, frontend, and Traefik) from the root directory:

```bash
docker compose --env-file ./backend/.env -f docker-compose.prod.yml up --build -d

# To kill the app:
#   docker compose --env-file ./backend/.env -f docker-compose.prod.yml down
# If you also want to kill volumes (like the database), add the -v flag:
#   docker compose --env-file ./backend/.env -f docker-compose.prod.yml down -v

# If you run into caching issues, you can try:
#   docker compose --env-file ./backend/.env -f docker-compose.prod.yml build --no-cache backend
```

Note that our Traefik configuration is made for using an IP address instead of a domain. If you want to use a domain, you need to update the `Host` rules in `infra/traefik/traefik.yml` and ensure your DNS points to your server.

### Maintenance and logs

Check if everything is running correctly:

```bash
# See status of all containers
docker compose --env-file ./backend/.env -f docker-compose.prod.yml ps

# Follow logs for a specific container (you can find names from the previous command)
docker compose --env-file ./backend/.env -f docker-compose.prod.yml logs -f backend
docker compose --env-file ./backend/.env -f docker-compose.prod.yml logs -f frontend
docker compose --env-file ./backend/.env -f docker-compose.prod.yml logs -f timescaledb
```

---

Your app is now accessible at:

- Frontend: `http://<your-server-ip>`
- API: `http://<your-server-ip>/api`
