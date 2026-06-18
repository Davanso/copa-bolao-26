import axios from "axios";
import { notifySessionExpired, storedToken } from "./authSession";

function defaultApiUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3333";
  }

  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3333";
  }

  return `http://${hostname}:3333`;
}

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? defaultApiUrl();

export const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = storedToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? "");

    if (status === 401 && !requestUrl.includes("/auth/login")) {
      notifySessionExpired();
    }

    return Promise.reject(error);
  },
);
