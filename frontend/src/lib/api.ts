import axios from "axios";

const api = axios.create({
  baseURL: "https://taskflow-production-4aa5.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("taskflow_token")
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("taskflow_token");
      localStorage.removeItem("taskflow_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
