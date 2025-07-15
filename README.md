BORON-INCIDENT-RESPONSE

soc-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entrypoint
│   │   ├── core/                   # Configuration, logging, settings
│   │   │   ├── config.py
│   │   │   └── logging.py
│   │   ├── models/                 # Pydantic schemas & DB models
│   │   │   ├── alert.py
│   │   │   ├── incident.py
│   │   │   ├── user.py
│   │   │   └── log_entry.py        # schema for Azure/Logstash events
│   │   ├── api/                    # Routers / endpoints
│   │   │   ├── v1/
│   │   │   │   ├── alerts.py
│   │   │   │   ├── incidents.py
│   │   │   │   ├── users.py
│   │   │   │   └── logs.py          # Azure Log Analytics route (/query-logs)
│   │   ├── services/               # Business logic & external integrations
│   │   │   ├── es_client.py        # Elasticsearch wrapper
│   │   │   ├── alert_service.py
│   │   │   ├── incident_service.py
│   │   │   └── azure_client.py     # Token cache + Log Analytics queries
│   │   ├── ingestion/              # Legacy/custom pullers (optional)
│   │   │   ├── client.py           # Azure API puller (if used)
│   │   │   └── scheduler.py        # Periodic tasks (e.g., cron jobs)
│   │   ├── tasks/                  # Celery tasks (threat intel, geoip)
│   │   │   ├── threat_intel.py
│   │   │   └── geoip.py
│   │   └── dependencies.py         # DI, OAuth2 scopes, security
│   ├── tests/                      # Pytest suite
│   │   ├── conftest.py
│   │   └── test_*.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # React Router views
│   │   ├── services/               # axios/MSAL API wrappers
│   │   ├── store/                  # Zustand/Redux
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── styles/                 # Tailwind/Tailswift configs
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── logstash/                      # Logstash configuration
│   ├── config/
│   │   └── logstash.yml           # overrides
│   └── pipeline/
│       └── logstash.conf          # TCP & file inputs, filters, ES output
│
├── infrastructure/                # IaC & k8s
│   ├── k8s/
│   ├── terraform/
│   └── azure-pipelines.yml        # CI/CD
│
├── .env                           # Secrets (e.g. ELASTIC_PASSWORD, AZURE_*)
├── docker-compose.yml             # Orchestrates backend, frontend, ELK, Logstash, Redis
├── .gitignore
├── docs/                          # Architecture diagrams, runbooks
└── README.md


Key additions:

backend/app/api/v1/logs.py: exposes /query-logs endpoint using the FastAPI Azure integration script.

backend/app/services/azure_client.py: encapsulates OAuth2 token caching and Kusto query logic.

.env at root now includes both Elastic credentials and Azure credentials.

logstash/pipeline/logstash.conf supports both local TCP input and file input (if you choose to dump Azure data to a file).