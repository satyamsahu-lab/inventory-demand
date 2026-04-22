import axios from "axios";
import toast from "react-hot-toast";
import { loaderStart, loaderStop } from "./loader";

const USER_STORAGE_KEY = "user_storefront_auth";

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

publicApi.interceptors.request.use((config) => {
  const key = `${config.method ?? "get"}:${config.url ?? ""}`;
  (config as any).__loaderKey = key;
  loaderStart(key);
  return config;
});

publicApi.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

publicApi.interceptors.response.use(
  (res) => {
    const key = (res.config as any).__loaderKey;
    if (key) loaderStop(key);
    return res;
  },
  (err) => {
    const key = err?.config?.__loaderKey;
    if (key) loaderStop(key);

    if (err?.response?.status === 401) {
      // For storefront, we might just want to clear local state
      // and let the UI handle the "Login Required" modal
      localStorage.removeItem(USER_STORAGE_KEY);
    }

    return Promise.reject(err);
  },
);
