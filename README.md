# Security Incident Response Dashboard

A security incident response system built with ELK Stack, Python FastAPI backend, and React frontend. This system implements a pluggable detection engine that analyzes Azure SecurityEvent logs, applies configurable detection rules, and generates normalized incidents stored in Elasticsearch through Logstash, providing a real-time React dashboard to monitor and respond to incidents.



<img width="1202" height="921" alt="Screenshot 2025-09-03 012451" src="https://github.com/user-attachments/assets/c2a58fcb-f7b8-4d03-80da-d1ef26ed7122" />

## Architecture

```
Azure Log Analytics → Python Backend → Logstash → Elasticsearch → React Dashboard
                           ↓
                        Redis Cache
```

## Features

### Backend Features
- **Azure Integration**: Fetches SecurityEvent logs from Azure Log Analytics
- **Real-time Processing**: Celery-based background task processing
- **Alert Engine**: Configurable rule-based alert generation with multiple detection rules
- **REST API**: FastAPI-based API for frontend integration
- **Caching**: Redis-based caching for improved performance

### Frontend Features
- **Modern Dashboard**: React + Tailwind CSS responsive dashboard with React 19 compatibility
- **Real-time Updates**: Auto-refreshing alert feed
- **Advanced Filtering**: Filter alerts by severity, status, and search terms
- **Alert Management**: View detailed alert information and statistics
- **Responsive Design**: Works on desktop and mobile devices
- **Clean Architecture**: Zero console warnings, optimized for React 19

### Alert Rules Implemented
1. **Multiple Failed Logins**: Detects multiple failed login attempts from the same IP
2. **Privilege Escalation**: Monitors for users being added to privileged groups
3. **Suspicious Process Activity**: Alerts on execution of potentially malicious processes

## Project Structure

```
boron-incident-response/
├── backend/
│   ├── app/                  
│   │   ├── __init__.py
│   │   ├── celery_utils.py
│   │   ├── core/                       # App-level configs
│   │   │   └── config.py
│   │   ├── alert/
│   │   │   ├── __init__.py         # FastAPI router (e.g., router = APIRouter())
│   │   │   ├── model.py            # Schema & ORM models
│   │   │   ├── tasks.py            # Tasks (e.g., background alert jobs)
│   │   │   └── service.py          # Business logic for alerts
│   │   └── log/
│   │       ├── __init__.py         # /query-logs endpoint
│   │       └── service.py          # Azure Log Analytics + query logic
│   ├── scripts/                  
│   │   ├── generate-certs.sh            # localhost certificates generation script
│   │   ├── backend/                     # Backend start scripts
│   │   └── celery/                      # Celery start scripts
│   ├── main.py                # FastAPI entrypoint
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── services/                   # API and MSAL/AAD hooks
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── logstash/
│   ├── config/
│   └── pipeline/
│       └── logstash.conf              # TCP input + Azure file input + ES output
│
├── .gitignore
├── docker-compose.yml
├── README.md
└── TESTING.md

```

## Testing

### Quick Test Commands
```bash
# Frontend tests with coverage
cd frontend
npm test                    # Interactive mode
npm test -- --watchAll=false  # Single run
npm run test:coverage      # With coverage report

# Backend tests with coverage  
cd backend
pytest                     # All tests
pytest --cov=app --cov-report=term  # With coverage
```

### Test Status
- **Frontend**: 76 tests passing, zero React DOM warnings
- **Backend**: 82 tests across unit and integration suites
- **React 19 Compatibility**: Fully compatible with latest React version
- **Coverage Reports**: Available for both frontend and backend

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

## Technical Stack

### Frontend
- **React 19.1.1** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Jest + React Testing Library** for testing
- **Custom components** optimized for React 19

### Backend
- **Python 3.11+** with FastAPI
- **Celery** for background tasks
- **Elasticsearch** for search and analytics
- **Redis** for caching and task queue
- **pytest** for comprehensive testing

### Infrastructure
- **Docker Compose** for local development
- **Logstash** for data pipeline
- **Azure Log Analytics** integration
- **TLS/SSL** certificate generation

```
