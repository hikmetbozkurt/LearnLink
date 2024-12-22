#!/bin/bash

# Install dependencies
npm install

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Setup database
psql -U postgres -c "CREATE DATABASE learnlink;" || true
psql -U postgres -d learnlink -f config/schema.sql

# Start the server
npm start 