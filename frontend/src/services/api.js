const API_BASE_URL = "http://127.0.0.1:8000";

export function getAssetUrl(path) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: isFormData
      ? options.headers || {}
      : {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Terjadi kesalahan pada server.");
  }

  return data;
}

export const authApi = {
  login: (payload) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => apiRequest("/users/me"),

  updateMe: (payload) =>
    apiRequest("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload) =>
    apiRequest("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest("/uploads/users", {
      method: "POST",
      body: formData,
    });
  },
};

export const studentApi = {
  getAll: () => apiRequest("/students"),

  getById: (id) => apiRequest(`/students/${id}`),

  create: (payload) =>
    apiRequest("/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiRequest(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    apiRequest(`/students/${id}`, {
      method: "DELETE",
    }),

  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest("/uploads/students", {
      method: "POST",
      body: formData,
    });
  },
};

export const sessionApi = {
  getAll: () => apiRequest("/sessions"),

  getById: (id) => apiRequest(`/sessions/${id}`),

  create: (payload) =>
    apiRequest("/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiRequest(`/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    apiRequest(`/sessions/${id}`, {
      method: "DELETE",
    }),
};

export const monitoringApi = {
  getEmotionLogs: (sessionId) => apiRequest(`/sessions/${sessionId}/emotion-logs`),

  createEmotionLog: (payload) =>
    apiRequest("/emotion-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMarkers: (sessionId) => apiRequest(`/sessions/${sessionId}/markers`),

  createMarker: (payload) =>
    apiRequest("/session-markers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const reportApi = {
  getAll: () => apiRequest("/reports"),

  getById: (id) => apiRequest(`/reports/${id}`),

  getBySessionId: (sessionId) => apiRequest(`/sessions/${sessionId}/report`),

  generate: (sessionId) =>
    apiRequest("/reports/generate", {
      method: "POST",
      body: JSON.stringify({
        session_id: Number(sessionId),
      }),
    }),

  remove: (id) =>
    apiRequest(`/reports/${id}`, {
      method: "DELETE",
    }),
};