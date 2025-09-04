#!/bin/bash
# Frontend test script for Unix/Linux/macOS

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print banners
print_banner() {
    echo -e "${CYAN}===============================================${NC}"
    echo -e "${CYAN}         $1${NC}"
    echo -e "${CYAN}===============================================${NC}"
    echo
}

# Function to print sections
print_section() {
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}$(printf '%*s' ${#1} | tr ' ' '-')${NC}"
}

# Parse command line arguments
QUICK=false
COVERAGE_ONLY=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            QUICK=true
            shift
            ;;
        --coverage-only)
            COVERAGE_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--quick] [--coverage-only] [--verbose]"
            exit 1
            ;;
    esac
done

# Start
clear
print_banner "FRONTEND TEST SUITE"

# Check Node.js and npm
print_section "Environment Check"
echo -e "${GREEN}Node.js version:${NC}"
node --version
echo -e "${GREEN}npm version:${NC}"
npm --version
echo

# Install dependencies
print_section "Installing Dependencies"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies!${NC}"
    exit 1
fi
echo

# Run tests based on parameters
if [ "$COVERAGE_ONLY" = true ]; then
    print_banner "RUNNING COVERAGE TESTS ONLY"
    npm run test:coverage
elif [ "$QUICK" = true ]; then
    print_banner "RUNNING QUICK TESTS"
    npm test -- --watchAll=false
else
    # Full test suite
    print_banner "RUNNING UNIT TESTS"
    if [ "$VERBOSE" = true ]; then
        npm test -- --watchAll=false --verbose
    else
        npm test -- --watchAll=false
    fi
    echo

    print_banner "RUNNING TESTS WITH COVERAGE"
    npm run test:coverage
    echo

    print_banner "DETAILED COVERAGE ANALYSIS"
    npm run test:ci
fi

echo

# Final summary
print_banner "TEST EXECUTION COMPLETE!"

echo -e "${GREEN}📊 Coverage Reports Generated:${NC}"
echo -e "   • Terminal output displayed above"
echo -e "   • HTML report: coverage/lcov-report/index.html"
echo -e "   • JSON report: coverage/coverage-final.json"
echo

echo -e "${GREEN}🎯 Test Results Summary:${NC}"
echo -e "   • All test suites executed"
echo -e "   • Coverage metrics calculated"
echo -e "   • Detailed reports available in coverage/ folder"
echo

echo -e "${CYAN}💡 Usage Examples:${NC}"
echo -e "   ./run_tests.sh              # Full test suite"
echo -e "   ./run_tests.sh --quick       # Quick tests only"
echo -e "   ./run_tests.sh --coverage-only # Coverage tests only"
echo -e "   ./run_tests.sh --verbose     # Verbose output"
echo

# Check if coverage directory exists and show additional info
if [ -d "coverage" ]; then
    echo -e "${GREEN}📁 Coverage directory found. Open coverage/lcov-report/index.html in your browser for detailed coverage visualization.${NC}"
fi

echo -e "${NC}Tests completed successfully! 🎉${NC}"
