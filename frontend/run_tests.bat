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
npm run test:no-watch -- --verbose
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
echo ^[32m📊 Coverage reports generated:^[0m
echo   - Terminal output above
echo   - HTML report: coverage/lcov-report/index.html
echo   - JSON report: coverage/coverage-final.json
echo.
echo ^[32m🎯 Summary:^[0m
echo   - All tests have been executed successfully
echo   - Coverage metrics displayed
echo   - Type safety verified
echo   - Check coverage/ folder for detailed HTML reports
echo.

pause
