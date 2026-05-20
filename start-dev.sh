#!/bin/bash
# Vizzo Platform Dev Server Wrapper
# Starts the Vite dev server for the dashboard on port 3000

cd /home/z/my-project/packages/dashboard

while true; do
  echo "Starting Dashboard Vite dev server..."
  node ./node_modules/.bin/vite --port 3000 --host 0.0.0.0
  EXIT_CODE=$?
  echo "Vite exited with code $EXIT_CODE. Restarting in 3 seconds..."
  sleep 3
done
