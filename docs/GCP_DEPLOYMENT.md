# GCP Compute Engine Deployment Guide

Deploy the Product Combo Manager to GCP Compute Engine.

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
2. GCP project created with billing enabled
3. Docker installed locally

## Step 1: Enable Required APIs

```bash
gcloud services enable compute.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

## Step 2: Set Up Secret Manager

Store sensitive environment variables:

```bash
# Create secrets
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-
echo -n "your-openrouter-api-key" | gcloud secrets create openrouter-api-key --data-file=-
echo -n "your-service-account-email" | gcloud secrets create sheets-email --data-file=-

# For private key (save to file first, then upload)
gcloud secrets create sheets-private-key --data-file=private-key.txt
```

## Step 3: Create Artifact Registry Repository

```bash
# Set project ID
export PROJECT_ID=$(gcloud config get-value project)
export REGION=asia-east1

# Create repository
gcloud artifacts repositories create app-images \
  --repository-format=docker \
  --location=$REGION

# Configure Docker auth
gcloud auth configure-docker $REGION-docker.pkg.dev
```

## Step 4: Build and Push Docker Image

```bash
# Build image
docker build -t product-combo-manager .

# Tag for Artifact Registry
docker tag product-combo-manager \
  $REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest

# Push
docker push $REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest
```

## Step 5: Create Compute Engine VM

```bash
# Create VM with Container-Optimized OS
gcloud compute instances create-with-container product-combo-manager \
  --zone=$REGION-a \
  --machine-type=e2-small \
  --container-image=$REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest \
  --tags=http-server \
  --scopes=cloud-platform
```

## Step 6: Configure Firewall

```bash
gcloud compute firewall-rules create allow-http-3000 \
  --allow=tcp:3000 \
  --target-tags=http-server \
  --description="Allow HTTP on port 3000"
```

## Step 7: Set Environment Variables on VM

SSH into the VM and create `.env` file:

```bash
gcloud compute ssh product-combo-manager --zone=$REGION-a

# On the VM, create .env file
cat > .env << 'EOF'
NEXT_PUBLIC_BASE_URL=https://www.mrliving.com.tw
NEXT_PUBLIC_MEDIA_URL=https://media.mrliving.com.tw
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=your-key
OPENROUTER_API_KEY=your-key
EOF

# Restart container with env file
docker stop $(docker ps -q)
docker run -d -p 3000:3000 --env-file .env --shm-size=256m \
  $REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest
```

## Manual Redeploy

```bash
# On your local machine
docker build -t product-combo-manager .
docker tag product-combo-manager $REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest
docker push $REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest

# SSH to VM and pull new image
gcloud compute ssh product-combo-manager --zone=$REGION-a
docker pull $REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest
docker stop $(docker ps -q)
docker run -d -p 3000:3000 --env-file .env --shm-size=256m \
  $REGION-docker.pkg.dev/$PROJECT_ID/app-images/product-combo-manager:latest
```

## Access the App

Get the external IP:

```bash
gcloud compute instances describe product-combo-manager \
  --zone=$REGION-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

Access: `http://<EXTERNAL_IP>:3000`

---

## Future: CI/CD Pipeline

See `.github/workflows/deploy.yml` (to be created) for GitHub Actions workflow.

## Future: Custom Domain + SSL

1. Reserve static IP
2. Set up Cloud DNS
3. Configure HTTPS Load Balancer with managed SSL certificate
