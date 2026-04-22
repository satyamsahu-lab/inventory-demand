import { useSyncExternalStore } from "react";

type UserAuthState = {
  token: string | null;
  user: any | null;
  cartCount: number;
};

const USER_STORAGE_KEY = "user_storefront_auth";

let state: UserAuthState = {
  token: null,
  user: null,
  cartCount: 0,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function load() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
      cartCount: parsed?.cartCount ?? 0,
    };
  } catch {
    // ignore
  }
}

function persist() {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state));
}

load();

export const userAuthActions = {
  setUserAuth: (payload: { token: string; user: any }) => {
    state = {
      ...state,
      token: payload.token,
      user: payload.user,
    };
    persist();
    emit();
  },
  logout: () => {
    state = { token: null, user: null, cartCount: 0 };
    persist();
    emit();
  },
  updateCartCount: (count: number) => {
    if (state.cartCount === count) return;
    state = { ...state, cartCount: count };
    persist();
    emit();
  },
};

export function useUserAuth() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );

  return {
    ...snapshot,
    isLoggedIn: !!snapshot.token,
    ...userAuthActions,
  };
}
