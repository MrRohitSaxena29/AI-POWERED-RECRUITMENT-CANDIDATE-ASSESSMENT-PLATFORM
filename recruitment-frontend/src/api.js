import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
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
