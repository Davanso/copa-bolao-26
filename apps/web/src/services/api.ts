import axios from "axios";

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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? defaultApiUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bolao.token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
