# Task Pomodoro — DevSecOps Project

A full-stack Pomodoro task manager built to demonstrate a complete DevSecOps workflow: containerization, infrastructure as code, container orchestration, and automated security scanning in CI/CD.

## Live Stack

- **Frontend/Backend:** Next.js 16 (App Router), TypeScript
- **Database:** PostgreSQL 16, accessed via Prisma ORM
- **Containerization:** Docker (multi-stage build)
- **Infrastructure as Code:** Terraform (Docker provider)
- **Orchestration:** Kubernetes (via minikube)
- **CI/CD:** GitHub Actions
- **DevSecOps / Security Tooling:** Gitleaks (secrets scanning), Checkov (IaC misconfiguration scanning), ESLint + Prettier (code quality gates), all enforced as automated checks on every pull request

## Features

- Task creation and completion tracking (persisted to Postgres)
- 25-minute Pomodoro timer with start/pause/reset
- Fully containerized local development environment
- Infrastructure provisioned declaratively with Terraform
- Kubernetes manifests for orchestrated deployment (Deployments, Services, Secrets, PersistentVolumeClaim)

## Architecture

```
┌─────────────┐      ┌──────────────────┐
│   Browser   │ ───▶ │  Next.js App     │
└─────────────┘      │  (Pod, K8s)      │
                      └────────┬─────────┘
                               │ internal DNS
                               ▼
                      ┌──────────────────┐
                      │  PostgreSQL      │
                      │  (Pod, K8s)      │
                      │  + PVC storage   │
                      └──────────────────┘
```

Postgres is exposed only via a `ClusterIP` Service (internal-only, not reachable from outside the cluster). The app is exposed via a `NodePort` Service for external access.

## Running Locally (no containers)

```bash
npm install
npx prisma db push
npm run dev
```

Requires a `.env` file with `DATABASE_URL` pointing at a running Postgres instance.

## Running with Docker

```bash
docker network create pomodoro-network
docker run --name pomodoro-db --network pomodoro-network \
  -e POSTGRES_PASSWORD=localdevpass -e POSTGRES_DB=task_pomodoro \
  -p 5433:5432 -d postgres:16

docker build -t pomodoro-app:local .
docker run --name pomodoro-app --network pomodoro-network \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:localdevpass@pomodoro-db:5432/task_pomodoro" \
  -d pomodoro-app:local
```

## Running with Terraform

```bash
docker build -t pomodoro-app:local .
cd local-infra
terraform init
terraform apply -auto-approve
```

Terraform provisions the network and both containers declaratively. The app image is built separately (outside Terraform) and referenced by name — mirroring how CI/CD builds an image and infrastructure tooling deploys it, rather than infra tooling handling builds itself.

## Running with Kubernetes (minikube)

```bash
minikube start --driver=docker
minikube image load pomodoro-app:local

kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

kubectl apply -f k8s/app-secret.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml

minikube service pomodoro-service
```

## CI/CD Pipeline (DevSecOps)

Security scanning is integrated directly into the pipeline as a required check, not a separate manual step — this is the core DevSecOps principle the project demonstrates: security gates run automatically on every change, before code merges.

Every push to `dev`/`main` and every pull request to `main` triggers:

| Job | What it does |
|---|---|
| `ci-checks` | ESLint, Prettier format check, production build |
| `secrets-scan` | Gitleaks — scans full commit history for hardcoded secrets/credentials |
| `terraform-scan` | Checkov — scans Terraform config for infrastructure misconfigurations |

All security scans run in `soft_fail` mode during development to surface findings without blocking merges; this would be tightened to hard-fail in a production setting.

## Security Notes

- Database is never exposed outside the Kubernetes cluster (`ClusterIP`, not `NodePort`)
- Secrets are managed via Kubernetes `Secret` objects, not hardcoded in manifests
- Multi-stage Docker build minimizes final image size and attack surface
- `.env*` files are gitignored; no credentials are committed to the repository

## Future Enhancements

- Container image vulnerability scanning (Trivy) in CI
- Checkov scanning extended to Kubernetes manifests
- Migration from local Docker-provider Terraform to a real cloud provider (AWS/Azure/GCP)