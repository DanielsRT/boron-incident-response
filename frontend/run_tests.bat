@echo off
REM Frontend test script for Windows

echo Running frontend tests...

REM Install dependencies if needed
npm install

REM Run tests with coverage
echo Running tests with coverage...
npm run test:coverage

echo Frontend tests completed!
