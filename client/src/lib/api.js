export async function api(path, options = {}) {
  const res = await fetch(`/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await res.json().catch(() => ({ ok: false, error: { message: 'Network error' } }));
  if (!json.ok) throw new Error(json.error?.message || 'Request failed');
  return json.data;
}
