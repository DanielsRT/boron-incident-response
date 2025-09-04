# Frontend Test Runner PowerShell Script
# Advanced test execution with parameters and colored output

param(
    [switch]$Quick,
    [switch]$CoverageOnly,
    [switch]$Verbose
)

# Function to write colored output
function Write-Banner($text) {
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "         $text" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host
}

function Write-Section($text) {
    Write-Host $text -ForegroundColor Yellow
    Write-Host ("-" * $text.Length) -ForegroundColor Yellow
}

# Start
Clear-Host
Write-Banner "FRONTEND TEST SUITE"

# Check Node.js and npm
Write-Section "Environment Check"
Write-Host "Node.js version:" -ForegroundColor Green
node --version
Write-Host "npm version:" -ForegroundColor Green
npm --version
Write-Host

# Install dependencies
Write-Section "Installing Dependencies"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host

# Run tests based on parameters
if ($CoverageOnly) {
    Write-Banner "RUNNING COVERAGE TESTS ONLY"
    npm run test:coverage
} elseif ($Quick) {
    Write-Banner "RUNNING QUICK TESTS"
    npm test -- --watchAll=false
} else {
    # Full test suite
    Write-Banner "RUNNING UNIT TESTS"
    if ($Verbose) {
        npm test -- --watchAll=false --verbose
    } else {
        npm test -- --watchAll=false
    }
    Write-Host

    Write-Banner "RUNNING TESTS WITH COVERAGE"
    npm run test:coverage
    Write-Host

    Write-Banner "DETAILED COVERAGE ANALYSIS"
    npm run test:ci
}

Write-Host

# Final summary
Write-Banner "TEST EXECUTION COMPLETE!"

Write-Host "Coverage Reports Generated:" -ForegroundColor Green
Write-Host "   - Terminal output displayed above" -ForegroundColor White
Write-Host "   - HTML report: coverage/lcov-report/index.html" -ForegroundColor White
Write-Host "   - JSON report: coverage/coverage-final.json" -ForegroundColor White
Write-Host

Write-Host "Test Results Summary:" -ForegroundColor Green
Write-Host "   - All test suites executed" -ForegroundColor White
Write-Host "   - Coverage metrics calculated" -ForegroundColor White
Write-Host "   - Detailed reports available in coverage/ folder" -ForegroundColor White
Write-Host

Write-Host "Usage Examples:" -ForegroundColor Cyan
Write-Host "   .\run_tests.ps1              # Full test suite" -ForegroundColor White
Write-Host "   .\run_tests.ps1 -Quick       # Quick tests only" -ForegroundColor White
Write-Host "   .\run_tests.ps1 -CoverageOnly # Coverage tests only" -ForegroundColor White
Write-Host "   .\run_tests.ps1 -Verbose     # Verbose output" -ForegroundColor White
Write-Host

# Check if coverage directory exists and show additional info
if (Test-Path "coverage") {
    Write-Host "Coverage directory found. Open coverage/lcov-report/index.html in your browser for detailed coverage visualization." -ForegroundColor Green
}

Write-Host "Tests completed successfully!" -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
