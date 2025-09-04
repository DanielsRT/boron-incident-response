#!/bin/bash

# Backend test script
echo "Running backend tests..."

# Install test dependencies
pip install -r requirements-test.txt

# Run unit tests
echo "Running unit tests..."
python -m pytest tests/unit/ -v --cov=app/alerts --cov-report=term-missing

# Run integration tests
echo "Running integration tests..."
python -m pytest tests/integration/ -v

# Run all tests with coverage
echo "Running all tests with coverage..."
python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing

echo "Backend tests completed!"
