import axios from "axios";

// Par défaut l'API est appelée en relatif (/api) : le serveur Vite la relaie vers
// le backend (voir vite.config.ts). VITE_API_URL permet de cibler un autre serveur.
const apiBaseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("smartcitywaste_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("smartcitywaste_token");
      localStorage.removeItem("smartcitywaste_user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;