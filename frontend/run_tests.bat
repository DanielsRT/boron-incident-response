@echo off
REM Frontend test script for Windows

echo ===============================================
echo         FRONTEND TEST SUITE
echo ===============================================
echo.

REM Check if Node.js and npm are available
echo Checking Node.js and npm installation...
node --version
npm --version
echo.

REM Install dependencies if needed
echo Installing/updating dependencies...
npm install
echo.

REM Run basic tests first
echo ===============================================
echo         RUNNING UNIT TESTS
echo ===============================================
npm test -- --watchAll=false --verbose
echo.

REM Run tests with detailed coverage report
echo ===============================================
echo         RUNNING TESTS WITH COVERAGE
echo ===============================================
npm run test:coverage
echo.

REM Run CI-style tests with filtered coverage
echo ===============================================
echo         DETAILED COVERAGE ANALYSIS
echo ===============================================
npm run test:ci
echo.

echo ===============================================
echo         FRONTEND TESTS COMPLETED!
echo ===============================================
echo.
echo Coverage reports generated:
echo - Terminal output above
echo - HTML report: coverage/lcov-report/index.html
echo.
echo Summary:
echo - All tests have been executed
echo - Coverage metrics displayed
echo - Check coverage/ folder for detailed HTML reports
echo.

pause
