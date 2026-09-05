import axios from "axios";

// If loaded in browser on dev server with proxy, relative URL /api avoids all CORS/port issues.
// Otherwise fallback to explicit host.
const getBaseUrl = () => {
  if (process.env.REACT_APP_BASE_URL) {
    return `${process.env.REACT_APP_BASE_URL}/api`;
  }
  // If running on browser, relative path /api triggers webpack dev-server proxy automatically
  if (typeof window !== "undefined" && window.location) {
    return "/api";
  }
  return "http://localhost:8080/api";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to all requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or unauthorized sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid redirect loops if already on login page
      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
