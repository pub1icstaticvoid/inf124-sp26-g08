// Central API helper — all fetch calls go through here.
// If your backend port or host ever changes, update one line.
const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const apiGet    = (path)         => request(path);
export const apiPost   = (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) });
export const apiPut    = (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) });
export const apiDelete = (path)         => request(path, { method: 'DELETE' });