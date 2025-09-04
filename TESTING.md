# Testing Guide - Boron Incident Response System

## Overview
Testing guide for the Boron Incident Response System covering frontend (React/TypeScript) and backend (FastAPI/Python) testing.

## Frontend Testing

### Quick Commands
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run without watch mode
npm test -- --watchAll=false

# Automated scripts
.\run_tests.bat    # Windows
.\run_tests.ps1    # PowerShell
```

### Test Structure
```
frontend/src/
├── __tests__/
│   ├── components/        # Component tests
│   ├── services/         # API tests
│   └── types/           # Type tests
├── testUtils.ts         # Mock helpers
└── setupTests.ts        # Test configuration
```

### Example Test
```typescript
describe('AlertCard Component', () => {
  it('renders alert information correctly', () => {
    const mockAlert = createMockAlert();
    render(<AlertCard alert={mockAlert} />);
    
    expect(screen.getByText(mockAlert.title)).toBeInTheDocument();
  });
});
```

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

### Current Status
- **82 tests total** across unit and integration test suites
- **Test Categories**: Unit tests (60), Integration tests (16), Model tests (6)
- **Coverage**: Available via pytest-cov with HTML reports in `htmlcov/`
- **Mocking**: Comprehensive Elasticsearch and external service mocking

### Test Structure
```
backend/
├── tests/
│   ├── conftest.py           # Global fixtures and configuration
│   ├── test_config.py        # Mock setup and environment config
│   ├── fixtures/             # Shared test data
│   ├── unit/                 # Unit tests
│   │   ├── test_alert_models.py      # Alert model and rule tests
│   │   ├── test_alert_service.py     # AlertService business logic
│   │   └── test_log_service.py       # LogService and Azure integration
│   └── integration/          # Integration tests
│       └── test_alert_routes.py      # FastAPI endpoint tests
├── pyproject.toml           # Pytest configuration
└── requirements-test.txt    # Test dependencies
```

### Test Categories

#### 1. Unit Tests (60 tests)
**AlertService Tests**: Elasticsearch operations, alert generation, status updates
```python
def test_service_initialization_success(self, mock_elasticsearch):
    service = AlertService()
    assert service.es is not None
    mock_elasticsearch.ping.assert_called_once()
```

**LogService Tests**: Azure log fetching, token management, Redis operations
```python  
def test_fetch_all_security_logs_success(self, mock_log_service):
    logs = mock_log_service.fetch_all_security_logs()
    assert len(logs) > 0
```

**Model Tests**: Alert creation, validation, rule engine
```python
def test_alert_creation(self):
    alert = Alert(title="Test Alert", severity=AlertSeverity.HIGH)
    assert alert.title == "Test Alert"
    assert alert.severity == AlertSeverity.HIGH
```

#### 2. Integration Tests (16 tests)
**API Endpoint Tests**: FastAPI route testing with mocked services
```python
def test_get_alerts_success(self, client, mock_alert_service):
    mock_alert_service.get_alerts.return_value = [sample_alert]
    response = client.get("/alerts/")
    assert response.status_code == 200
```

#### 3. Mock Strategy
**Elasticsearch Mocking**: Prevents actual ES connections during testing
```python
# test_config.py sets up comprehensive ES mocking
class MockElasticsearch:
    def ping(self): return False
    def search(self, *args, **kwargs): return {"hits": {"hits": []}}
```

**Azure Services**: Mocked HTTP requests and authentication
**Redis Operations**: Mocked caching and persistence layer

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
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Keep tests independent
- Run tests before pushing changes

Last updated: September 4, 2025
