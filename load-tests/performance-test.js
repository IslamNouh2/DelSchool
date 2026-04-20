import http from 'k6/http';
import { check, sleep } from 'k6';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:47005/api';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || '123456';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users over 30s
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% of requests must be under 10 seconds locally
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

// ----------------------------------------------------------------------------
// TEST LOGIC
// ----------------------------------------------------------------------------

export default function () {
  // 1. Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // 2. Login Flow
  const loginPayload = JSON.stringify({
    username: ADMIN_EMAIL, // Auth controller expects LoginDto, usually username/password
    password: ADMIN_PASSWORD,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  
  const loginSuccess = check(loginRes, {
    'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  if (loginSuccess && loginRes.status < 400) {
    let token;
    try {
      const loginData = loginRes.json();
      token = loginData.accessToken;
      
      check(loginRes, {
        'has access token': (r) => token !== undefined,
      });
    } catch (e) {
      console.warn(`Could not parse login JSON: ${e}`);
    }

    if (token) {
      const authParams = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      // 3. Get User Profile (Protected Route)
      const profileRes = http.get(`${BASE_URL}/auth/me`, authParams);
      check(profileRes, {
        'profile status is 200': (r) => r.status === 200,
      });

      if (profileRes.status === 200) {
        try {
          const profileData = profileRes.json();
          check(profileRes, {
            'valid user role': (r) => profileData.user.role === 'ADMIN',
          });
        } catch (e) {
          console.warn(`Could not parse profile JSON: ${e}`);
        }
      }
    }
  }

  sleep(1);
}
