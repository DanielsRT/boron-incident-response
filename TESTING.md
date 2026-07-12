# Testing Guide - Boron Incident Response System

## Overview
Testing guide for the Boron Incident Response System covering frontend (React/TypeScript) and backend (FastAPI/Python) testing. The test suite ensures system reliability by preventing data corruption, API failures, and security vulnerabilities in production incident response workflows.

## Frontend Testing

### Quick Commands
```bash
# Bash
./run_tests.sh              # Full test suite
./run_tests.sh --quick       # Quick tests only
./run_tests.sh --coverage-only # Coverage tests only
./run_tests.sh --verbose     # Verbose output

# PowerShell
.\run_tests.ps1              # Full test suite
.\run_tests.ps1 -Quick       # Quick tests only
.\run_tests.ps1 -CoverageOnly # Coverage tests only
.\run_tests.ps1 -Verbose     # Verbose output

# Batch (no parameters supported)
run_tests.bat               # Full test suite

# NPM Scripts
npm run test:no-watch       # Quick clean test run
npm run test:coverage       # Coverage analysis
npm run test:ci             # CI-style filtered coverage
```

### Test Structure
```
frontend/src/
├── __tests__/
│   ├── components/        # Component rendering and interaction tests
│   ├── services/         # API communication and data fetching tests
│   └── types/           # Type safety and data validation tests
├── testUtils.ts         # Mock helpers and test utilities
└── setupTests.ts        # Test configuration and global mocks
```

### What Frontend Tests Prevent

**UI Rendering Issues**: Ensures alert cards, dashboards, and data tables render correctly with proper data binding. Prevents users from seeing broken layouts or missing critical incident information.

**Component Interaction Failures**: Validates button clicks, form submissions, and state updates work as expected. Prevents user actions from failing silently or triggering unintended behavior.

**API Communication Errors**: Mocks backend services to verify frontend correctly calls endpoints and handles responses. Prevents malformed requests or improper error handling that would fail in production.

**React 19 Compatibility**: Tests eliminate DOM prop warnings and verify components work properly with React 19. Prevents console clutter and potential future compatibility issues as React updates.

**Data Integrity**: Type-checked components and services prevent data corruption during transformation and storage. Ensures incident data flows correctly through the application.

### React 19 Compatibility Notes
**Resolution of React DOM Warnings**: As of September 2025, the project successfully resolved React DOM prop warnings that occurred with React 19.1.1 + Recharts 3.1.2:

**Issue**: Recharts was passing unknown DOM props to DOM elements, causing React 19 to emit warnings.

**Solution**: Replaced Recharts chart components with custom table-based visualizations in:
- `AlertStatsOverview.tsx`: 24h activity chart → responsive data table
- Maintained all functionality while ensuring React 19 compatibility
- Zero console warnings during test execution

**Benefits**: 
- Clean test console output for reliable CI/CD
- Better React 19 compatibility
- Responsive table design
- No dependency on third-party charting libraries

### Current Status
- **Full test coverage** of critical UI components and services with **zero React DOM warnings**
- **Test Coverage**: Available via jest with HTML reports in `coverage/`
- **React 19 Compatibility**: Components updated to eliminate DOM prop warnings
- **Clean Console Output**: No warnings or errors during test execution

## Backend Testing

### Quick Commands
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run by test type
pytest -m "unit"           # Unit tests only
pytest -m "integration"   # Integration tests only
pytest -m "slow"          # Slow running tests

# Run specific test files
pytest tests/unit/test_alert_service.py
pytest tests/integration/test_alert_routes.py

# Verbose output with details
pytest -v -s

# Automated scripts
.\run_tests.bat    # Windows
./run_tests.sh     # Unix/Linux
```

### Test Structure
```
backend/
├── tests/
│   ├── conftest.py           # Global fixtures and configuration
│   ├── test_config.py        # Mock setup and environment config
│   ├── fixtures/             # Shared test data for reproducibility
│   ├── unit/                 # Isolated business logic tests
│   │   ├── test_alert_models.py      # Alert validation and rule engine
│   │   ├── test_alert_service.py     # Elasticsearch operations and alert lifecycle
│   │   └── test_log_service.py       # Log fetching and Azure integration
│   └── integration/          # End-to-end API and service interaction tests
│       └── test_alert_routes.py      # FastAPI endpoint behavior and edge cases
├── pyproject.toml           # Pytest configuration
└── requirements-test.txt    # Test dependencies
```

### What Backend Tests Prevent

**Database Operations Failures**: Unit tests validate Elasticsearch operations including indexing, searching, and status updates. Prevents data loss, incorrect queries, or corrupted alert indices in production.

**Alert Generation Logic Errors**: Tests verify alert rules execute correctly, severity levels are assigned properly, and duplicate detection works. Prevents missing critical alerts or false positives that could misdirect incident response.

**Data Validation Issues**: Model tests ensure alerts meet schema requirements and business rules. Prevents malformed data from reaching the database or causing API contract violations.

**External Service Integration Failures**: Comprehensive mocking of Azure, Elasticsearch, and Redis services prevents external dependencies from causing cascading failures. Tests verify fallback behavior and timeout handling.

**API Endpoint Problems**: Integration tests validate all API routes handle success and error cases correctly. Prevents 500 errors, improper status codes, or incomplete responses that would break the frontend.

**Authentication and Access Control**: Tests verify token generation, Azure identity integration, and permission checking. Prevents unauthorized access to sensitive incident data.

**Log Processing and Caching**: Service tests ensure log fetching, transformation, and Redis caching work correctly. Prevents missed security logs or stale cached data.

### Test Coverage

**Elasticsearch Operations**: Index creation, document search, update status, bulk operations
- Prevents: Data not being stored, lost alerts, incorrect query results

**Alert Generation**: Rule matching, severity calculation, duplicate detection, alert creation
- Prevents: Missed critical security events, false positives, duplicate incident reports

**Azure Log Integration**: Authentication token management, log retrieval, data transformation
- Prevents: Failed log ingestion, expired credentials, malformed log data

**API Endpoints**: All major routes tested for success and failure scenarios
- Prevents: Broken frontend-backend communication, incorrect error responses

**Mock Strategy**: Elasticsearch, Azure Services, and Redis are fully mocked to isolate tests
- Prevents: Test dependencies on external infrastructure, unreliable test execution

### Current Status
- **Comprehensive test coverage** of critical incident response workflows
- **Unit and Integration test suites** covering business logic and API contracts
- **Coverage reports**: Available via pytest-cov in `htmlcov/`
- **External service mocking**: Fully isolated tests with reproducible test data
- **CI/CD ready**: Tests execute reliably without external dependencies

## Environment Setup

### Prerequisites
```bash
# Frontend
node >= 18.0.0, npm >= 8.0.0

# Backend  
python >= 3.11, pip >= 21.0.0
```

### Test Environment Variables
```bash
FASTAPI_CONFIG=testing
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db
CELERY_BROKER_URL=redis://localhost:6379/1
REACT_APP_API_URL=http://localhost:8000
```

### Docker Testing
```bash
# Start test stack
docker-compose -f docker-compose.test.yml up -d

# Run tests in containers
docker-compose exec backend pytest
docker-compose exec frontend npm test
```

## Common Issues & Solutions

### Frontend
**Watch mode appearing**: Use `npm test -- --watchAll=false`
**Async test failures**: Use `waitFor()` for async assertions
**Axios mocking issues**: Check `setupTests.ts` configuration
**React DOM warnings**: Resolved by replacing Recharts with custom table components (React 19 compatibility)

### Backend
**Database connection errors**: Ensure test database exists
**Import errors**: Check PYTHONPATH and install with `pip install -e .`

### Docker
**Elasticsearch users not created**: Check entrypoint script in `backend/scripts/backend/entrypoint`
**Networking issues**: Verify docker-compose network configuration

## Quick Reference

### Essential Commands
```bash
# Frontend with coverage
cd frontend && npm run test:coverage

# Backend with coverage  
cd backend && pytest --cov=app --cov-report=term

# All tests in Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### File Locations
- Frontend tests: `frontend/src/__tests__/`
- Backend tests: `backend/tests/`
- Coverage reports: `frontend/coverage/`, `backend/htmlcov/`
- Test utilities: `frontend/src/testUtils.ts`

### Best Practices
- Use descriptive test names that explain what risk they prevent
- Follow Arrange-Act-Assert pattern for clarity
- Mock external dependencies to ensure test reliability
- Keep tests independent and repeatable
- Run tests before pushing changes to prevent regressions

Last updated: September 12, 2025
