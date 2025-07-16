# BORON-INCIDENT-RESPONSE

A full-stack Python and React web app capable of querying security events through Azure API or optionally parsing through file logs. This application uses Logstash as a data processing pipeline to Elasticsearch and Kibana to sort and visualize security events to a web-based Incident Response Dashboard

## Project Structure

```
soc-dashboard/
>>>>>>> 8408f40324398bc669ce725473a4f8eac249075d
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
