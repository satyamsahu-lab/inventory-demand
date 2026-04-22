import axios from "axios";
import toast from "react-hot-toast";

import { getToken } from "./token";
import { loaderStart, loaderStop } from "./loader";
import { clearAuth } from "../store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const key = `${config.method ?? "get"}:${config.url ?? ""}`;
  (config as any).__loaderKey = key;
  loaderStart(key);
  return config;
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    const key = (res.config as any).__loaderKey;
    if (key) loaderStop(key);
    return res;
  },
  (err) => {
    const key = err?.config?.__loaderKey;
    if (key) loaderStop(key);

    if (err?.response?.status === 401) {
      clearAuth();
      // Only show toast and redirect if we're not already on the login page
      if (!window.location.pathname.includes("/login")) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  },
);
