terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_network" "pomodoro_net" {
  name = "pomodoro-network"
}

resource "docker_image" "postgres" {
  name = "postgres:16"
}

resource "docker_container" "db" {
  name  = "pomodoro-db-tf"
  image = docker_image.postgres.image_id
  networks_advanced {
    name = docker_network.pomodoro_net.name
  }
  env = [
    "POSTGRES_PASSWORD=${var.db_password}",
    "POSTGRES_DB=task_pomodoro"
  ]
  ports {
    internal = 5432
    external = 5433
  }
}

resource "docker_container" "app" {
  name  = "pomodoro-app-tf"
  image = "pomodoro-app:local"
  networks_advanced {
    name = docker_network.pomodoro_net.name
  }
  env = [
    "DATABASE_URL=postgresql://postgres:${var.db_password}@pomodoro-db-tf:5432/task_pomodoro"
  ]
  ports {
    internal = 3000
    external = 3000
  }
  depends_on = [docker_container.db]
}