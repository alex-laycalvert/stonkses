#!/usr/bin/env bash
set -e

# Deploy backend from monorepo root
cd "$(dirname "$0")/.."

# Copy .vercel config to root temporarily
mkdir -p .vercel
cp apps/backend/.vercel/project.json .vercel/project.json

# Deploy
vercel deploy "$@"

# Clean up
rm -rf .vercel
