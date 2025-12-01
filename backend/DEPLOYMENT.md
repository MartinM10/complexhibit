# Deployment Guide

This guide covers different deployment strategies for the Complexhibit API.

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Docker Compose (Full Stack)](#docker-compose-full-stack)
- [Cloud Deployment](#cloud-deployment)
- [Production Checklist](#production-checklist)

## Local Development

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd frontend-next/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.template .env
# Edit .env with your settings

# Run development server
python -m uvicorn app.main:app --reload --port 8000
```

Access the API at http://localhost:8000/api/v1/docs

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t complexhibit-api .

# Run container
docker run -d \
  --name complexhibit-api \
  -p 8000:8000 \
  --env-file .env \
  complexhibit-api
```

### With Custom Port

```bash
docker run -d \
  --name complexhibit-api \
  -p 9000:8000 \
  --env-file .env \
  complexhibit-api
```

## Docker Compose (Full Stack)

Deploy API + Virtuoso triplestore:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Services

- **API**: http://localhost:8000/api/v1/
- **Virtuoso**: http://localhost:8890/sparql
- **Virtuoso Conductor**: http://localhost:8890/conductor

## Cloud Deployment

### AWS (Elastic Beanstalk)

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   eb init -p docker complexhibit-api
   ```

3. **Create Environment**
   ```bash
   eb create complexhibit-prod
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

5. **Set Environment Variables**
   ```bash
   eb setenv URI_ONTOLOGIA=https://w3id.org/OntoExhibit/ \
            VIRTUOSO_URL=your-virtuoso-url \
            DJANGO_SECRET_KEY=your-secret-key
   ```

### AWS (ECS/Fargate)

1. **Push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
   docker tag complexhibit-api:latest YOUR_ECR_URL/complexhibit-api:latest
   docker push YOUR_ECR_URL/complexhibit-api:latest
   ```

2. **Create Task Definition** (JSON)
   ```json
   {
     "family": "complexhibit-api",
     "containerDefinitions": [{
       "name": "api",
       "image": "YOUR_ECR_URL/complexhibit-api:latest",
       "portMappings": [{
         "containerPort": 8000,
         "protocol": "tcp"
       }],
       "environment": [
         {"name": "DEPLOY_PATH", "value": "/api/v1"}
       ],
       "secrets": [
         {"name": "DJANGO_SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
       ]
     }]
   }
   ```

3. **Create Service**
   ```bash
   aws ecs create-service \
     --cluster your-cluster \
     --service-name complexhibit-api \
     --task-definition complexhibit-api \
     --desired-count 2 \
     --launch-type FARGATE
   ```

### Google Cloud (Cloud Run)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/YOUR_PROJECT/complexhibit-api

# Deploy
gcloud run deploy complexhibit-api \
  --image gcr.io/YOUR_PROJECT/complexhibit-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DEPLOY_PATH=/api/v1
```

### Heroku

```bash
# Login
heroku login

# Create app
heroku create complexhibit-api

# Set environment variables
heroku config:set URI_ONTOLOGIA=https://w3id.org/OntoExhibit/
heroku config:set VIRTUOSO_URL=your-virtuoso-url

# Deploy
git push heroku main
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings:
   - **Type**: Docker
   - **Dockerfile**: `Dockerfile`
3. Set environment variables in dashboard
4. Deploy

## Production Checklist

### Security

- [ ] Use HTTPS (SSL/TLS certificates)
- [ ] Set strong `DJANGO_SECRET_KEY`
- [ ] Configure CORS properly (not `["*"]`)
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Implement API key authentication
- [ ] Regular security updates

### Performance

- [ ] Enable caching (Redis)
- [ ] Use CDN for static assets
- [ ] Configure connection pooling
- [ ] Set up load balancer
- [ ] Enable gzip compression
- [ ] Optimize database queries

### Monitoring

- [ ] Set up logging (CloudWatch, Stackdriver, etc.)
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure alerts
- [ ] Enable APM (Application Performance Monitoring)

### Reliability

- [ ] Set up health checks
- [ ] Configure auto-scaling
- [ ] Implement circuit breakers
- [ ] Set up backup strategy
- [ ] Test disaster recovery

### Documentation

- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbooks for common issues
- [ ] Document environment variables

## Environment Variables

### Required

```env
URI_ONTOLOGIA=https://w3id.org/OntoExhibit/
VIRTUOSO_URL=http://your-virtuoso:8890/sparql
DJANGO_SECRET_KEY=your-secret-key-here
DEFAULT_GRAPH_URL=http://your-virtuoso:8890/DAV/home/dba/rdf_sink
```

### Optional

```env
DEPLOY_PATH=/api/v1
USER_SERVICE_URL=http://your-user-service
DATABASE_STARDOG=your-database
ENDPOINT_STARDOG=http://your-stardog:5820
USERNAME_STARDOG=admin
PASSWORD_STARDOG=admin
```

## Scaling

### Horizontal Scaling

```bash
# Docker Swarm
docker service scale complexhibit-api=5

# Kubernetes
kubectl scale deployment complexhibit-api --replicas=5
```

### Load Balancing

#### Nginx Configuration

```nginx
upstream complexhibit_api {
    server api1:8000;
    server api2:8000;
    server api3:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://complexhibit_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port 8000
   lsof -i :8000
   # Kill process
   kill -9 PID
   ```

2. **Environment variables not loading**
   - Check `.env` file exists
   - Verify file permissions
   - Check for syntax errors in `.env`

3. **SPARQL connection errors**
   - Verify Virtuoso is running
   - Check network connectivity
   - Verify SPARQL endpoint URL

4. **Docker build fails**
   - Clear Docker cache: `docker system prune -a`
   - Check Dockerfile syntax
   - Verify base image availability

## Support

For deployment issues:
- Check [GitHub Issues](https://github.com/MartinM10/ontoexhibit-api/issues)
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Contact maintainers

---

**Last Updated**: 2025-11-26
