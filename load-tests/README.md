# k6 Load Testing

This directory contains load testing scripts for the DelSchool API using [k6](https://k6.io/).

## Prerequisites

You must have k6 installed on your system.

### Installation

- **Windows**:
  ```powershell
  winget install grafana.k6
  ```
  or
  ```powershell
  choco install k6
  ```
- **macOS**:
  ```bash
  brew install k6
  ```
- **Linux**:
  Follow the [official installation guide](https://k6.io/docs/getting-started/installation/).

## Running Tests

### 1. Basic Load Test
To run the performance test with the default configuration (ramping up to 20 users):
```bash
k6 run performance-test.js
```

### 2. Overriding Environment Variables
You can override the target URL or credentials using environment variables:
```bash
k6 run -e BASE_URL=https://your-staging-api.com/api -e ADMIN_EMAIL=test@example.com performance-test.js
```

### 3. Quick Smoke Test
To verify the script works with a single user:
```bash
k6 run --vus 1 --duration 10s performance-test.js
```

## Test Scenario
The script performs the following actions:
1. **Health Check**: GET `/api/`
2. **Login**: POST `/api/auth/login`
3. **Profile Access**: GET `/api/auth/me` (Authenticated)

## Thresholds
Currently configured thresholds:
- **95th percentile latency**: < 500ms
- **Failure rate**: < 1%
