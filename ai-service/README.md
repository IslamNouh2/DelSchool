# AI Student Risk Engine - microservice documentation

## Overview
This directory contains the Python-based AI microservice for calculating the risk level of students based on their features (Attendance, Average Grade, Behavior Score, and Homework Completion). 

It is connected to the DelSchool backend via a NestJS controller: `POST /api/ai/risk/:studentId`.

## Setup & Running the ML Service

We have implemented this Risk Engine using **only built-in Python libraries** to ensure maximum compatibility with any environment and avoid build errors (like pip failures on C++ or Rust dependencies).

1. **Start the Microservice:**
   From this terminal folder (`ai-service`), run the python script directly. No `pip install` required!
   ```bash
   python main.py
   ```
   The service will start on `http://localhost:8000`. It must be running for the NestJS backend's `/api/ai/risk/:studentId` endpoint to work!

## Example JSON Request & Response

### 1. Request to NestJS
To test the AI risk engine, use an HTTP client (like Postman or cURL) to call your NestJS backend.
For a student with ID `1` in your database, your backend runs on port `47005` (or whatever `PORT` is in your `.env`) with an `/api` prefix:

```http
POST http://localhost:47005/api/ai/risk/1
Content-Type: application/json
```

*Note: The NestJS script fetches the student data from Prisma automatically. It only requires the `studentId`.*

### 2. NestJS payload sent to Python ML (Internal view)
This is what the NestJS backend sends under the hood to `http://localhost:8000/predict`:
```json
{
  "attendance": 85.5,
  "averageGrade": 72.0,
  "behaviorScore": 88.0,
  "homeworkCompletion": 90.0
}
```

### 3. Response from NestJS API
NestJS handles the response, updates the `riskLevel` field in the database, and returns the result to you:
```json
{
  "studentId": 1,
  "riskLevel": "MEDIUM",
  "recommendation": "Student may require some guidance. Recommend weekly check-ins and tutoring."
}
```

## Unit Testing Suggestions

To ensure the system works reliably over time, we highly suggest creating the following automated tests:

### 1. NestJS Unit Tests (`ai.service.spec.ts`)
- **Mock PrismaService:** Ensure `studentRiskProfile.findUnique` correctly returns mock data, and `upsert` is called with the expected fields.
- **Mock HTTP Fetch:** Mock Node's built-in `fetch` to return `{ riskLevel: "HIGH", recommendation: "abc..." }` and check that the NestJS `AiService` parses it accurately.
- **Error Handling:** Verify that the service throws an `InternalServerErrorException` if the python server is down.

### 2. Python Unit Tests (`test_main.py`)
- Use Python's built-in `unittest` module.
- Mock an HTTP POST request to the `RequestHandler` using `urllib.request`.
- Send various combinations of scores to `/predict` and assert that the thresholds trigger logic properly.
  - Test case 1: Very high scores -> Expect "LOW" risk.
  - Test case 2: Borderline scores -> Expect "MEDIUM" risk.
  - Test case 3: Low attributes -> Expect "HIGH" risk.
