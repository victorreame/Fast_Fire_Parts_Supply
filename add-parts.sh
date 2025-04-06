#!/bin/bash

echo "Starting part addition process..."

# Run the simplified seed-parts script
echo "Adding 100 parts to the database (50 as best sellers) and generating SVGs..."
npx tsx server/quick-seed-parts.ts

echo "Process completed! Added parts and SVGs as needed."
