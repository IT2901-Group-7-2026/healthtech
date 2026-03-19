<sub>This assumes a standard Ubuntu server. It should still be easy to follow for other distros, but not Windows server.</sub>

You need to create and host a VM on some cloud provider. We use NTNUs StackIT (OpenStack). This documentation assumed you have already deployed the VM and picks up right after you have SSH-ed into it.

# Hosting the application

### Installation

```bash
# Update the package list
sudo apt-get update

# Install Docker, Docker Compose, Git and .NET SDK
sudo apt-get install -y docker.io docker-compose-v2 git dotnet-sdk-10.0

# Add your user to the docker group so you don't need 'sudo' for docker commands
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
exit

# ----
# SSH back into your server and run:

git clone https://github.com/tdt4290-group2/healthtech.git
cd healthtech
```

### Environment variables

```bash
# Create the directory
mkdir ~/env

# Copy the .env.example files
cp ~/healthtech/frontend/.env.example ~/env/frontend.env
cp ~/healthtech/backend/.env.example ~/env/backend.env

# Update your secrets
nano ~/env/frontend.env
nano ~/env/backend.env
```

### Run database migrations

The migrator service in our `docker-compose.prd.yml` is set up to run the migrations automatically when you launch the app, but you can also run them manually if you want more control or need to troubleshoot.

```bash
# IMPORTANT: Read the text above
cd ~/healthtech

docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml run --rm migrator
```

### Launch the application

Build and start all services (database, backend, frontend, and Traefik) from the root directory:

```bash
cd ~/healthtech

docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml up --build -d
# NOTE: You should seed (if needed) AFTER you have ran this command. See below chapter

# To kill the app:
#   docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml down
# If you also want to kill volumes (the database):
#   docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml down -v

# If you run into caching issues, you can try building first, then running:
#   docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml build --no-cache
#   docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml up -d
```

Note that our Traefik configuration is made for using an IP address instead of a domain. If you want to use a domain, you need to update the `Host` rules in `infra/traefik/traefik.yml` and ensure your DNS points to your server.

### Seed the database (optional)

**NOTE:** See [root README](../README.md) for instructions about seeding.

You should avoid using SCP to copy the files because of their size. Use a program like WinSCP/Cyberduck/FileZilla to upload the files, or use rsync **from your local machine** (NOT when SSH-ed into the server):

```bash
# IMPORTANT: This command is ran from your local machine, NOT the server (you should NOT be SSH-ed in when you run this)

cd healthtech/backend/seed

rsync -avP -e "ssh -i ./your-key.pem" *.csv ubuntu@<HOST>:~/healthtech/backend/seed/ -i ./your-file.pem

# If you are on WSL, you might need to copy the .pem to WSL and use that file instead, since WSL sometimes messes with file permissions.

# cd ~/healthtech

# mkdir -p ~/.ssh

# cp /mnt/c/Users/.../my-key.pem ~/.ssh/

# chmod 600 ~/.ssh/my-key.pem
```

Then, to actually seed the database:

```bash
cd ~/healthtech

docker exec -it healthtech-db psql -U postgres -d healthtech -f /seed/seed.sql

```

### Maintenance and logs

Check if everything is running correctly:

```bash
cd ~/healthtech

# See status of all containers
docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml ps

# Follow logs for a specific container (you can find names from the previous command)
docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml logs -f backend
docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml logs -f frontend
docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml logs -f db
docker compose --env-file ~/env/backend.env -f docker-compose.prd.yml logs -f traefik
```

---

Your app is now accessible at `http://<your-server-ip>`, so long the containers are running and the IP is properly forwarded.

# Hosting the Github actions runner

Our CI/CD pipeline is set up to run lint/test on Github's hosted runners, and the deployment on our own self-hosted runner. This is to avoid having to SSH into the server, where we had trouble with NTNU blocking requests to port 22 from Github's hosted runners.

You need to set up the runner like Github describes in [their documentation](https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners).

Use the following command once to set up the runner as a service that starts on boot:

```bash
cd ~/actions-runner

sudo ./svc.sh install
```

Then, use the following commands as needed:

```bash
cd ~/actions-runner

sudo ./svc.sh status
sudo ./svc.sh start
sudo ./svc.sh stop
sudo ./svc.sh uninstall
```
