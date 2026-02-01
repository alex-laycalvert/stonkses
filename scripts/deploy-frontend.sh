#!/usr/bin/env bash
set -e

# Deploy frontend from monorepo root
cd "$(dirname "$0")/.."

# Copy .vercel config to root temporarily
mkdir -p .vercel
cp apps/frontend/.vercel/project.json .vercel/project.json

# Deploy
vercel deploy "$@"

# Clean up
rm -rf .vercel
