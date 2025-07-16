# BORON-INCIDENT-RESPONSE

A full-stack Python and React web app capable of querying security events through Azure API or optionally parsing through file logs. This application uses Logstash as a data processing pipeline to Elasticsearch and Kibana to sort and visualize security events to a web-based Incident Response Dashboard

## Project Structure

```
soc-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entrypoint
│   │   ├── config.py               # Configuration, logging, settings
│   │   ├── ingestion/              # Legacy/custom pullers (optional)
│   │   │   ├── client.py           # Azure API puller (if used)
│   │   │   └── scheduler.py        # Periodic tasks (e.g., cron jobs)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│
├── logstash/                      # Logstash configuration
│   ├── config/
│   │   └── logstash.yml           # overrides
│   └── pipeline/
│       └── logstash.conf          # TCP & file inputs, filters, ES output
│
├── infrastructure/                
│   ├── docker/
|       └── docker-compose.yml
|       └── dev.env
│   ├── scripts/                   # Docker
|       └── backend/
|       └── frontend/              
│
├── .dockerignore
├── .gitignore
└── README.md
```
