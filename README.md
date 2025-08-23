# Security Incident Response Dashboard

A comprehensive security incident response system built with ELK Stack, Python FastAPI backend, and React frontend. This system fetches security events from Azure Log Analytics, processes them through Logstash to Elasticsearch, and provides a real-time dashboard for security analysts to monitor and respond to incidents.

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
- **Modern Dashboard**: React + Tailwind CSS responsive dashboard
- **Real-time Updates**: Auto-refreshing alert feed
- **Advanced Filtering**: Filter alerts by severity, status, and search terms
- **Alert Management**: View detailed alert information and statistics
- **Responsive Design**: Works on desktop and mobile devices

### Alert Rules Implemented
1. **Multiple Failed Logins**: Detects multiple failed login attempts from the same IP
2. **Privilege Escalation**: Monitors for users being added to privileged groups
3. **Suspicious Process Activity**: Alerts on execution of potentially malicious processes

## Project Structure

```
boron-incident-response/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint
│   │   ├── core/                       # App-level configs
│   │   │   ├── config.py
│   │   │   └── logging.py
│   │   ├── features/                   # One folder per domain feature
│   │   │   ├── alert/
│   │   │   │   ├── __init__.py         # FastAPI router (e.g., router = APIRouter())
│   │   │   │   ├── model.py            # Pydantic schema & ORM models
│   │   │   │   ├── tasks.py            # Celery tasks (e.g., background alert jobs)
│   │   │   │   └── service.py          # Business logic for alerts
│   │   │   ├── incident/
│   │   │   │   ├── __init__.py         # FastAPI router
│   │   │   │   ├── model.py
│   │   │   │   ├── tasks.py
│   │   │   │   └── service.py
│   │   │   ├── log/
│   │   │   │   ├── __init__.py         # /query-logs endpoint
│   │   │   │   ├── model.py            # Pydantic schema for log entries
│   │   │   │   ├── service.py          # Azure Log Analytics + query logic
│   │   │   │   ├── tasks.py            # Optionally pull logs on schedule
│   │   │   └── user/
│   │   │       ├── __init__.py
│   │   │       ├── model.py
│   │   │       ├── service.py
│   │   │       └── tasks.py
│   │   ├── dependencies.py             # Auth, DI
│   │   ├── ingestion/                  # Optional manual/legacy pullers
│   │   │   ├── scheduler.py            # Cron/APS scheduler
│   │   │   └── custom_puller.py
│   │   ├── tasks/                      # Global Celery tasks (optional)
│   │   │   ├── threat_intel.py
│   │   │   └── geoip.py
│   ├── tests/                          # Pytest suite
│   │   ├── test_alert.py
│   │   ├── test_incident.py
│   │   ├── test_log.py
│   │   └── conftest.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/                   # API and MSAL/AAD hooks
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── logstash/
│   ├── config/
│   └── pipeline/
│       └── logstash.conf              # TCP input + Azure file input + ES output
│
├── infrastructure/
│   ├── docker/
│   │   ├── dev.env
│   │   └── docker-compose.yml
│   └── scripts/
│       ├── backend/
│       └── frontend/
│
├── .gitignore
├── docs/                              # Diagrams, decisions, API docs
└── README.md

```
