import axios from 'axios';

export const API_BASE_URL = 'http://localhost:4000/api';

// VULN: A04 Cryptographic Failures - CWE-798 Use of Hard-coded Credentials
// An "internal" API key is embedded directly in the client bundle. Anything
// shipped to the browser is visible to end users, so this key is not a
// secret at all once deployed.
export const INTERNAL_API_KEY = 'ak_live_9f8a7b6c5d4e3f2a1b0c';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'X-Internal-Api-Key': INTERNAL_API_KEY },
});

const TOKEN_KEY = 'retirement_planner_token';

export function setToken(token: string) {
  // VULN: A04/A09 Cryptographic & Logging Failures - CWE-522 Insufficiently
  // Protected Credentials
  // The auth token is stored in `localStorage`, which is readable by any
  // JavaScript running on the page (including injected via XSS), unlike an
  // httpOnly cookie. This makes token theft trivial if any XSS exists
  // elsewhere in the app (see PlanDetail.vue).
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
