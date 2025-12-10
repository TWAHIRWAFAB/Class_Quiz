# Online Quiz API

A production-ready Node.js API with complete DevOps pipeline.

## Features
- ✅ Express.js REST API
- ✅ Prometheus metrics & monitoring
- ✅ Docker multi-stage builds
- ✅ Kubernetes deployment ready
- ✅ GitHub Actions CI/CD
- ✅ Comprehensive test coverage
- ✅ ELK Stack logging
- ✅ Horizontal Pod Autoscaling

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
```

### Docker
```bash
docker build -t quiz-api:latest .
docker run -p 3000:3000 quiz-api:latest
```

### Docker Compose (Full Stack)
```bash
docker-compose up
```

## API Endpoints
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/:id` - Get quiz

## Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Kibana: http://localhost:5601

## Deployment
See DEVOPS_ROADMAP.md for detailed setup.
# onlineQuizApps
# Class_Quiz
# Class_Quiz
# Class_Quiz
# Test workflow trigger
