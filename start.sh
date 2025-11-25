#!/bin/bash

# Start Ruby backend on port 3001
cd backend && bundle exec ruby app.rb &
RUBY_PID=$!

# Wait for Ruby server to start
sleep 2

# Start Vite dev server on port 5000
cd ..
npx vite --host 0.0.0.0 --port 5000 &
VITE_PID=$!

# Wait for both processes
wait $RUBY_PID $VITE_PID
