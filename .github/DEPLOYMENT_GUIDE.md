# Phase 6: Deployment Guide

Complete guide for deploying the Online Quiz API to production with rolling updates, blue-green deployment, and auto-scaling.

## Table of Contents

1. [Resource Requirements](#resource-requirements)
2. [Deployment Strategies](#deployment-strategies)
3. [Automatic CD Pipeline](#automatic-cd-pipeline)
4. [Manual Deployment](#manual-deployment)
5. [Monitoring and Rollback](#monitoring-and-rollback)

---

## Resource Requirements

### Pod Resource Allocation

```yaml
Requests (Minimum):
  CPU: 100m (0.1 CPU cores)
  Memory: 128Mi (128 MB)

Limits (Maximum):
  CPU: 500m (0.5 CPU cores)
  Memory: 512Mi (512 MB)
```

### Cluster Requirements

For 3 replicas in production:

```
Total CPU: 3 × 500m = 1500m (1.5 cores)
Total Memory: 3 × 512Mi = 1536Mi (1.5 GB)
```

### Node Sizing Recommendations

```
Small Cluster (dev/staging):
  - 2 nodes with 2 CPU, 4GB RAM each
  
Production Cluster:
  - 3-5 nodes with 4 CPU, 8GB RAM each
  - Recommended: t3.large or similar on AWS
```

### Auto-Scaling Configuration

```
Minimum Replicas: 3 (always running)
Maximum Replicas: 10 (under high load)

Scale-Up Triggers:
  - CPU usage > 70%
  - Memory usage > 80%

Scale-Down Triggers:
  - CPU usage < 70% for 5 minutes
  - Memory usage < 80% for 5 minutes
```

---

## Deployment Strategies

### 1. Rolling Update (Default - Zero Downtime)

Gradually replace old pods with new ones. **Recommended for production.**

**Process:**
```
Old Pods: 3 → 2 → 1 → 0
New Pods: 0 → 1 → 2 → 3
```

**Configuration:**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1          # Allow 1 extra pod during update
    maxUnavailable: 0    # Never allow 0 pods (zero downtime)
```

**Advantages:**
- Zero downtime deployment
- Can rollback if issues detected
- Gradual traffic shift

**Time to Deploy:** 3-5 minutes

### 2. Blue-Green Deployment (Instant Cutover)

Deploy new version alongside old, then switch traffic instantly.

**Process:**
```
Stage 1: Blue (active) + Green (standby)
         ↓ Deploy new version to Green
Stage 2: Test Green in parallel
         ↓ All tests pass
Stage 3: Switch traffic Blue → Green
         ↓ Green is now active
Stage 4: Keep Blue as instant rollback
```

**Advantages:**
- Instant traffic switch
- Easy rollback (switch back immediately)
- Full parallel testing before cutover
- No service degradation

**Time to Deploy:** 1-2 minutes after testing

**Risk:** Slightly higher infrastructure cost (2x pods during deployment)

---

## Automatic CD Pipeline

### Automatic Deployment on Release

When you create a release (git tag), deployment happens automatically:

```
git tag -a v1.1.0 -m "New features"
git push origin v1.1.0
        ↓
GitHub Release created
        ↓
Release workflow builds Docker image
        ↓
Deploy workflow triggered automatically
        ↓
Rolling update to production
```

### View CD Pipeline Status

Go to: **https://github.com/TWAHIRWAFAB/Class_Quiz/actions/workflows/deploy.yml**

### What Happens Automatically

1. ✅ Cluster connection verified
2. ✅ Namespace created (if needed)
3. ✅ Rolling update initiated
4. ✅ Waits for rollout (5 min timeout)
5. ✅ Health checks performed
6. ✅ Automatic rollback on failure
7. ✅ Slack notification sent

---

## Manual Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Configure kubeconfig
export KUBECONFIG=/path/to/kubeconfig.yaml
kubectl cluster-info  # Verify connection
```

### Deploy Using Rolling Update

```bash
# Update image to new version
kubectl set image deployment/quiz-api \
  quiz-api=ghcr.io/twahirwafab/class_quiz:v1.1.0 \
  -n production \
  --record

# Watch the rollout
kubectl rollout status deployment/quiz-api -n production

# View rollout history
kubectl rollout history deployment/quiz-api -n production
```

### Deploy Using Blue-Green Strategy

#### Step 1: Deploy to Green

```bash
# Scale up green deployment
kubectl scale deployment quiz-api-green \
  --replicas=3 \
  -n production

# Wait for green pods to be ready
kubectl rollout status deployment/quiz-api-green -n production
```

#### Step 2: Test Green Deployment

```bash
# Port forward to test
kubectl port-forward svc/quiz-api-green 3000:3000 -n production &

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/questions

# Stop port forward
fg  # Bring to foreground
Ctrl+C
```

#### Step 3: Switch Traffic (Blue → Green)

```bash
# Update main service to point to green
kubectl patch service quiz-api \
  -p '{"spec":{"selector":{"version":"green"}}}' \
  -n production

# Verify traffic switched
kubectl describe service quiz-api -n production
```

#### Step 4: Keep Blue for Rollback

```bash
# If something goes wrong, switch back instantly
kubectl patch service quiz-api \
  -p '{"spec":{"selector":{"version":"blue"}}}' \
  -n production

# Scale down green
kubectl scale deployment quiz-api-green \
  --replicas=0 \
  -n production
```

---

## Monitoring and Rollback

### View Deployment Status

```bash
# Get deployment overview
kubectl get deployment quiz-api -n production

# Watch rolling update in progress
kubectl rollout status deployment/quiz-api -n production --watch

# View all pods
kubectl get pods -n production -l app=quiz-api -o wide
```

### View Application Logs

```bash
# Get pod name
POD=$(kubectl get pods -n production -l app=quiz-api -o jsonpath='{.items[0].metadata.name}')

# View logs
kubectl logs $POD -n production

# Follow logs (streaming)
kubectl logs -f $POD -n production

# View logs from all pods
kubectl logs -f deployment/quiz-api -n production --all-containers=true
```

### Check Pod Health

```bash
# Describe pod (shows events, conditions)
kubectl describe pod $POD -n production

# Check pod readiness
kubectl get pods -n production -l app=quiz-api \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'
```

### View Metrics

```bash
# Pod CPU and memory usage
kubectl top pods -n production -l app=quiz-api

# Node resource usage
kubectl top nodes

# HPA status (auto-scaling)
kubectl get hpa quiz-api-hpa -n production -w
```

### Automatic Rollback

If deployment fails, automatic rollback is triggered:

```bash
# Manual rollback (undo last deployment)
kubectl rollout undo deployment/quiz-api -n production

# Rollback to specific revision
kubectl rollout history deployment/quiz-api -n production
kubectl rollout undo deployment/quiz-api --to-revision=3 -n production

# Wait for rollback to complete
kubectl rollout status deployment/quiz-api -n production
```

---

## Deployment Troubleshooting

### Issue: Pods stuck in Pending

```bash
# Check node resources
kubectl describe nodes

# Check pod events
kubectl describe pod $POD -n production

# Possible causes:
# - Insufficient CPU/memory on nodes
# - No matching node selectors
# - Image pull errors
```

### Issue: Pods CrashLoopBackOff

```bash
# Check logs
kubectl logs $POD -n production

# Check liveness/readiness probes
kubectl describe pod $POD -n production

# Common causes:
# - App fails to start
# - Health check endpoint fails
# - Missing environment variables
```

### Issue: Deployment timeout

```bash
# Increase timeout
kubectl rollout status deployment/quiz-api -n production --timeout=10m

# Check recent events
kubectl get events -n production --sort-by='.lastTimestamp'
```

---

## Performance Tuning

### Increase Pod Resources

For high-traffic scenarios:

```bash
kubectl patch deployment quiz-api -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"quiz-api","resources":{"limits":{"cpu":"1","memory":"1Gi"},"requests":{"cpu":"500m","memory":"512Mi"}}}]}}}}' \
  -n production
```

### Adjust HPA Thresholds

For more aggressive scaling:

```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50  # Scale at 50% instead of 70%
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally (`npm test`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Git tag created (`git tag -a v1.1.0 ...`)
- [ ] GitHub Release created
- [ ] Docker image built and tested
- [ ] Kubernetes manifests reviewed
- [ ] Resource limits appropriate
- [ ] Health checks functional
- [ ] Staging deployment tested
- [ ] Rollback procedure documented
- [ ] Team notified of deployment
- [ ] Monitoring configured
- [ ] Backup/restore plan in place

---

## Next Steps

1. **Setup continuous deployment** - Automatic deploys on releases
2. **Configure monitoring** - Prometheus, Grafana for metrics
3. **Setup logging** - ELK stack or similar for centralized logs
4. **Configure alerting** - PagerDuty, Slack alerts for issues
5. **Load testing** - Verify performance under load

Your deployment pipeline is now production-ready! 🚀
