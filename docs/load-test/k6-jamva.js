// Jamva application-level load test (k6). NOT RUN YET. Run it only against a STAGING deployment, never production.
//   k6 run -e BASE=https://jamva-staging.vercel.app -e STAGE=100 docs/load-test/k6-jamva.js
// STAGE = peak virtual users: 100, 500, 1000, 2500 or 5000. Ramp 2 min, hold 8 min, ramp down 1 min.
import http from "k6/http"; import { check, sleep } from "k6";
const BASE = __ENV.BASE, PEAK = Number(__ENV.STAGE || 100);
export const options = {
  stages: [{ duration: "2m", target: PEAK }, { duration: "8m", target: PEAK }, { duration: "1m", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<1500"] },
};
export default function () {
  const r = Math.random();
  if (r < 0.5) { check(http.get(`${BASE}/`), { home: (x) => x.status === 200 }); }
  else if (r < 0.8) { check(http.get(`${BASE}/restaurants`), { list: (x) => x.status === 200 }); }
  else if (r < 0.9) { check(http.get(`${BASE}/street-vendors`), { sv: (x) => x.status === 200 }); }
  else { check(http.get(`${BASE}/api/health`), { health: (x) => x.status === 200 }); }
  sleep(5 + Math.random() * 10);
}
