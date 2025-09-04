@echo off
REM Backend test script for Windows

echo Running backend tests...

REM Install test dependencies
pip install -r requirements-test.txt

REM Run unit tests
echo Running unit tests...
python -m pytest tests/unit/ -v --cov=app/alerts --cov-report=term-missing

REM Run integration tests
echo Running integration tests...
python -m pytest tests/integration/ -v

REM Run all tests with coverage
echo Running all tests with coverage...
python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing

echo Backend tests completed!
