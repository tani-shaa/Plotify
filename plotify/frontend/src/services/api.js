import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — but NOT on auth endpoints (login/register)
// Those handle their own errors so we don't redirect mid-login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Use a small delay so React state can settle before reload
      setTimeout(() => { window.location.href = "/login"; }, 100);
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login    = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const getMe    = ()     => api.get("/auth/me");

// ── Properties ────────────────────────────────────────────────────────────────
export const getProperties    = (params)   => api.get("/properties", { params });
export const getProperty      = (id)       => api.get(`/properties/${id}`);
export const createProperty   = (data)     => api.post("/properties", data);
export const updateProperty   = (id, data) => api.put(`/properties/${id}`, data);

// ── Transfers ─────────────────────────────────────────────────────────────────
export const getTransfers            = (params) => api.get("/transfers", { params });
export const getTransfer             = (id)     => api.get(`/transfers/${id}`);
export const requestTransfer         = (data)   => api.post("/transfers", data);
export const approveTransfer         = (id)     => api.put(`/transfers/${id}/approve`);
export const rejectTransfer          = (id)     => api.put(`/transfers/${id}/reject`);
export const getTransfersForProperty = (propId) => api.get(`/transfers/property/${propId}`);

// ── Documents ─────────────────────────────────────────────────────────────────
export const uploadDocument = (formData) =>
  api.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const verifyDocument = (formData) =>
  api.post("/documents/verify", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getDocumentsForProperty = (propId) =>
  api.get(`/documents/property/${propId}`);

// ── Insights ──────────────────────────────────────────────────────────────────
export const getStats       = () => api.get("/insights/stats");
export const getAnomalies   = () => api.get("/insights/anomalies");
export const getChainStatus = () => api.get("/insights/chain-status");

export default api;
