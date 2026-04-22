import { useEffect, useSyncExternalStore } from "react";

type AuthState = {
  token: string | null;
  user: any | null;
  permissions: Array<{ module_name: string; action: string }>;
};

const STORAGE_KEY = "inventory_demand_auth";

let state: AuthState = {
  token: null,
  user: null,
  permissions: [],
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
      permissions: parsed?.permissions ?? [],
    };
  } catch {
    // ignore
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: state.token,
      user: state.user,
      permissions: state.permissions,
    }),
  );
}

load();

export function clearAuth() {
  state = { token: null, user: null, permissions: [] };
  persist();
  emit();
}

export function useAuth() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );

  useEffect(() => {
    // no-op for now
  }, []);

  return {
    ...snapshot,
    setAuth: (payload: any) => {
      state = {
        token: payload?.token ?? null,
        user: payload?.user ?? null,
        permissions: payload?.permissions ?? [],
      };
      persist();
      emit();
    },
    clear: clearAuth,
  };
}
