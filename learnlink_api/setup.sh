#!/bin/bash

# Create necessary directories
mkdir -p uploads
mkdir -p logs

# Install dependencies
pnpm install

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until psql postgres -c '\q' 2>/dev/null; do
  sleep 1
done

# Create database if it doesn't exist
psql postgres -c "SELECT 1 FROM pg_database WHERE datname = 'learnlink'" | grep -q 1 || psql postgres -c "CREATE DATABASE learnlink"

# Create postgres user if it doesn't exist
psql postgres -c "SELECT 1 FROM pg_roles WHERE rolname = 'postgres'" | grep -q 1 || psql postgres -c "CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgres' SUPERUSER"

# Grant privileges
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE learnlink TO postgres"

# Run schema
psql -U postgres -d learnlink -f config/schema.sql

echo "Setup complete!" 