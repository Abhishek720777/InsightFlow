// Central API URL — reads from Vite env var in production, falls back to localhost for dev
let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
if (API_BASE.endsWith('/')) {
  API_BASE = API_BASE.slice(0, -1);
}
export default API_BASE;
