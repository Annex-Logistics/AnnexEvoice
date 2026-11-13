import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const base = __ENV.API_BASE_URL || 'http://localhost:3000';
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${__ENV.ACCESS_TOKEN}` };
  const body = JSON.stringify({
    customerId: __ENV.CUSTOMER_ID,
    lines: [{ description: 'Load-test item', unitPriceKobo: 100000, quantity: 1 }],
  });
  const create = http.post(`${base}/invoices`, body, { headers });
  check(create, { 'draft 2xx': (r) => r.status >= 200 && r.status < 300 });
  const draft = create.json();
  if (draft && draft.id) {
    const issue = http.post(`${base}/invoices/${draft.id}/issue`, null, { headers });
    check(issue, { 'issue 2xx': (r) => r.status >= 200 && r.status < 300 });
  }
  sleep(1);
}
