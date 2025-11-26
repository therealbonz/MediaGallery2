#!/bin/bash

# Cleanup handler
cleanup() {
    echo "Shutting down..."
    kill $RUBY_PID 2>/dev/null
    kill $VITE_PID 2>/dev/null
    exit 0
}
trap cleanup EXIT INT TERM

# Start Ruby backend on port 3001
echo "Starting Ruby backend on port 3001..."
cd /home/runner/workspace/backend && bundle exec ruby app.rb &
RUBY_PID=$!

# Wait for Ruby server to start
sleep 3

# Check if Ruby is running
if kill -0 $RUBY_PID 2>/dev/null; then
    echo "Ruby backend started successfully (PID: $RUBY_PID)"
else
    echo "Failed to start Ruby backend"
    exit 1
fi

# Start Vite dev server on port 5000
echo "Starting Vite frontend on port 5000..."
cd /home/runner/workspace
npx vite --host 0.0.0.0 --port 5000 &
VITE_PID=$!

echo "Both servers started. Ruby on :3001, Vite on :5000"

# Wait for both processes
wait
