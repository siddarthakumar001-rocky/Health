import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://health-931r.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("admin_token");
  const role = localStorage.getItem("userRole");

  // If calling an admin route OR user has admin role, use admin_token if available
  const isAdminPath = config.url.startsWith("/api/admin");
  const activeToken = (isAdminPath || role === "admin") ? adminToken : token;

  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }
  
  return config;
});

// Response interceptor for easy data access and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} Status: ${response.status}`, response.data);
    return response.data;
  },
  (error) => {
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url;
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    console.error(`[API Error] ${method} ${url}:`, message);
    return Promise.reject(new Error(message));
  }
);

export { api };
export default api;