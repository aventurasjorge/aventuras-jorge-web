// Single source of truth for talking to the Railway API.
// Every fetch call in the app should go through here rather than
// hardcoding URLs, so the base URL and error handling stay in one place.

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  // Fails loudly in dev if the env var is missing, instead of silently
  // sending requests to "undefined/..."
  console.error(
    "VITE_API_URL is not set. Copy .env.example to .env.local and fill it in."
  );
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Low-level request helper. Handles the base URL, JSON parsing,
 * and turning non-2xx responses into thrown errors.
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    // Include cookies if/when you add session-based auth later.
    credentials: "include",
  });

  // Handle "no content" responses before trying to parse JSON.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      data?.message || `Request to ${path} failed with ${res.status}`,
      res.status,
      data
    );
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};

export { ApiError };
