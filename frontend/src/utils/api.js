import axios from "axios";

// Use env override first; fallback to same-origin /api to work behind nginx/proxy
const API_BASE_URL =
  import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid tokens
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login/register page and not during initial token verification
      const currentPath = window.location.pathname;
      if (
        currentPath !== "/login" &&
        currentPath !== "/register" &&
        !currentPath.startsWith("/login") &&
        !currentPath.startsWith("/register")
      ) {
        // Use setTimeout to avoid redirect during render
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
