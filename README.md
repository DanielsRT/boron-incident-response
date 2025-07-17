# BORON-INCIDENT-RESPONSE

A Python and ELK app capable of requesting security events from Azure API and querying through Kibana. This application uses Logstash as a data processing pipeline to Elasticsearch and Kibana to sort and visualize security events as a web-based Incident Response Dashboard

## Project Structure

```
boron-incident-response/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint
│   │   ├── core/                       # App-level configs
│   │   │   └── config.py
│   │   └── features/                   # One folder per domain feature
│   │       └── log/
│   │           ├── __init__.py         # /query-logs endpoint
│   │           └── service.py          # Azure Log Analytics + query logic
|   |
│   ├── scripts/                        # Bash start scripts
│   │   ├── backend                     
│   |   |   ├── entrypoint              # Docker shell entry point
│   │   │   └── start                   # backend start script
│   │   └── celery/                     # App-level configs
│   |       ├── beat
│   │       |   └── start               # Celery beat start script
│   │       └── worker
│   │           └── start               # Celery worker start script
|   |     
|   ├── Dockerfile
│   └── requirements.txt
│
├── logstash/
│   └── pipeline/
│       └── logstash.conf               # TCP input + Azure file input + ES output
|
├── docker-compose.yml
├── dev.env
├── .gitignore
└── README.md

```
