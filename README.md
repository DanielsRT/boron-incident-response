# Boron: Incident Response Dashboard

A distributed event-processing platform for security incident detection and response. Ingests high-volume Azure security telemetry, applies pluggable rule-based threat detection, normalizes alerts into Elasticsearch, and exposes insights through a responsive React dashboard.

<img width="1202" height="921" alt="Screenshot 2025-09-03 012451" src="https://github.com/user-attachments/assets/c2a58fcb-f7b8-4d03-80da-d1ef26ed7122" />

---

## Architecture Overview

```
Azure Log Analytics → FastAPI Backend → Logstash Pipeline → Elasticsearch → React Dashboard
                          ↓
                    Celery Workers (Redis Queue)
                          ↓
                    Redis Cache Layer
```

### Design Rationale

**Async-First Backend**: Decouples API request handling from computationally expensive rule evaluation using Celery workers. Prevents blocking I/O when querying Azure Log Analytics or evaluating thousands of security rules.

**Microservices Separation**: Logstash as a dedicated ETL layer abstracts normalization logic from application code—enables independent scaling and reusability. Backend remains stateless for horizontal scaling.

**Elasticsearch for Security Analytics**: Full-text search, time-series aggregations, and complex boolean queries needed for forensic analysis and alert correlation. Redis caching layer reduces repeated queries on hot datasets.

---

## Technical Stack & Justifications

### Backend (Python 3.11+)
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | FastAPI | Type-safe async/await, automatic OpenAPI docs, minimal boilerplate—critical for maintaining alert SLAs |
| **Task Queue** | Celery + Redis | Battle-tested distributed task orchestration; replaces simple threading for horizontal worker scaling |
| **Search & Storage** | Elasticsearch | Inverted indices enable sub-100ms security queries; time-series optimization for retention policies |
| **Caching** | Redis | In-memory cache to watermark for real-time dashboard updates; message broker for Celery workers |
| **Testing** | pytest + pytest-cov | 82 tests across unit/integration; CI-compatible coverage reporting |

### Frontend (TypeScript + React 19)
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | React 19 | Strict mode compatibility ensures maintainability; concurrent rendering for unblocked UI during large alert ingestion |
| **Language** | TypeScript | Type safety in security domain prevents null-dereference bugs; improved IDE autocomplete for Alert/Rule schemas |
| **Build Tool** | Vite | 10x faster HMR than webpack—critical for rapid incident response dashboard iteration |
| **Styling** | Tailwind CSS | Utility-first approach reduces CSS payload; consistent design system across 76 passing tests |
| **Testing** | Jest + React Testing Library | Accessibility-first assertions; zero console warnings enforced |

### Infrastructure
- **Docker Compose**: Reproducible local dev environment mimicking production topology
- **Logstash 8+**: Stateless ETL pipeline; independent versioning from backend
- **TLS/SSL**: Certificate generation scripts for zero-trust internal communication

---

## Core Features

### Backend Features
- **Azure Integration**: Queries SecurityEvent logs via Azure Log Analytics REST API with connection pooling
- **Real-time Processing**: Celery tasks decouple API responses from alert generation; sub-second latency achievable with Redis pub/sub
- **REST API**: FastAPI exposes typed endpoints (`GET /alerts`, `POST /rules/test`); self-documenting via OpenAPI
- **Observability Ready**: Structured logging for correlation IDs; ECS-compatible JSON output

### Frontend Features
- **Performance**: React 19 concurrent rendering prevents UI freezes during 10k+ alert paginated loads
- **Real-time Updates**: WebSocket-ready architecture for dashboard refresh without polling
- **Advanced Filtering**: Client-side filtering with server-side pagination for 10k+ alerts
- **Responsive Design**: Mobile-first Tailwind; zero accessibility violations
- **State Management**: Minimal props drilling via context; typed Redux alternative not required at this scale

### Detection Rules (Extensible)
1. **Brute Force Detection**: Multiple failed logins from single IP + time-windowed threshold
2. **Privilege Escalation**: Detects user additions to sensitive AAD groups (requires audit log ingestion)
3. **Suspicious Process Execution**: Rule-based matching against known malware command-line signatures

---

## Project Structure

```
boron-incident-response/
├── backend/                          # Python FastAPI + Celery
│   ├── app/
│   │   ├── core/config.py           # Environment-based config management
│   │   ├── alert/                   # Detection rules & alert lifecycle
│   │   │   ├── model.py            # Pydantic schemas (type validation)
│   │   │   ├── service.py          # Business logic (rule eval, dedup)
│   │   │   ├── tasks.py            # Celery task definitions
│   │   │   └── router.py           # FastAPI endpoints (/alerts, /stats)
│   │   └── log/service.py          # Azure Log Analytics client
│   ├── tests/                       # 82 tests across unit/integration
│   ├── scripts/                     # Deployment helpers
│   ├── main.py                      # Uvicorn entrypoint
│   └── requirements.txt
│
├── frontend/                         # TypeScript React + Vite
│   ├── src/
│   │   ├── components/              # Reusable Alert, Filter, Stat components
│   │   ├── services/                # API client (with auth interceptors)
│   │   ├── types/                   # TypeScript interfaces (Alert, Rule, etc.)
│   │   └── App.tsx                  # Root component + routing
│   ├── tests/                       # 76 tests, Jest + React Testing Library
│   └── vite.config.ts
│
├── logstash/
│   └── pipeline/logstash.conf       # Normalization: Azure → ECS schema
│
└── docker-compose.yml               # Full stack orchestration
```

---

## Getting Started

### Prerequisites
- Docker & Docker Compose 2.0+
- Azure Service Principal (for Log Analytics query permissions)
- Node.js 18+ (for frontend development)

### Quick Start
```bash
# 1. Clone and setup environment
git clone <repo>
cd boron-incident-response
cp .env.example .env  # Configure Azure credentials

# 2. Spin up infrastructure
docker-compose up -d

# 3. Verify services
curl http://localhost:8000/health    # FastAPI
curl http://localhost:3000           # React dashboard
```

See **TESTING.md** for comprehensive test execution and CI/CD setup.

---

## Testing & Quality

### Test Coverage
| Suite | Count | Tool | Coverage |
|-------|-------|------|----------|
| **Backend** | 82 tests | pytest | Run with `pytest --cov=app` |
| **Frontend** | 76 tests | Jest + RTL | Run with `npm test -- --coverage` |
| **React Warnings** | 0 | Strict Mode | Enforced in CI pipeline |

### Running Tests Locally
```bash
# Frontend
cd frontend && npm test -- --watchAll=false --coverage

# Backend
cd backend && pytest --cov=app --cov-report=html
```

---

## Deployment Considerations

### Horizontal Scaling
- **Frontend**: Stateless React SPA—serve via any CDN (Cloudflare, CloudFront)
- **Backend**: Stateless FastAPI replicas behind load balancer; Celery workers scale independently
- **Queue**: Redis Cluster or managed Azure Cache for Redis in production

### High Availability
- Elasticsearch cluster with 3+ master nodes and dedicated data nodes
- Logstash stateless pipelines with load balancing
- FastAPI health checks on `GET /health` for load balancer integration

### Security Posture
- TLS 1.3 for all inter-service communication
- Azure Service Principal with least-privilege role (SecurityEventReader)
- Elasticsearch X-Pack authentication
- API rate limiting per detection rule (prevent DOS on rule engine)

---

## Tech Decisions Summary

| Decision | Alternative | Trade-off |
|----------|-------------|-----------|
| Celery + Redis | AWS Lambda + SQS | Stateful workers vs. vendor lock-in; chose flexibility |
| Elasticsearch | DuckDB + S3 | OLAP speed vs. OLTP query freshness; chose OLAP for high refresh and low complex relational math requirements |
| React + TypeScript | Vue.js + TS | Ecosystem maturity and job market; chose React |
| Logstash | Custom ETL sidecar | Operational overhead vs. battle-tested tool; chose maintainability |

---

## Contributing

1. Write tests first (TDD for security code)
2. Run coverage locally before PR
3. Follow type hints (no `Any` without justification)
4. Update TESTING.md if adding new test suites

---

## License

MIT
