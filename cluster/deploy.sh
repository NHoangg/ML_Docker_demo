#!/bin/bash
# Script to deploy the retail revenue forecasting system to Docker Swarm

# Ensure swarm mode is initialized
if ! docker info | grep -q "Swarm: active"; then
    echo "Initializing Docker Swarm..."
    docker swarm init
fi

# Build images
echo "Building Docker images..."
docker compose -f docker/docker-compose.yml build

# Deploy stack
echo "Deploying to Docker Swarm..."
docker stack deploy -c docker/docker-compose.yml retail_system

echo "Deployment complete. Use 'docker service ls' to verify."
