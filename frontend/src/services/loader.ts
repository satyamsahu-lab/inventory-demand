import { useSyncExternalStore } from 'react';

type LoaderState = {
  keys: Record<string, number>;
};

let state: LoaderState = { keys: {} };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function loaderStart(key: string) {
  state = {
    keys: {
      ...state.keys,
      [key]: (state.keys[key] ?? 0) + 1
    }
  };
  emit();
}

export function loaderStop(key: string) {
  const cur = state.keys[key] ?? 0;
  const next = Math.max(0, cur - 1);
  const keys = { ...state.keys, [key]: next };
  state = { keys };
  emit();
}

export function isLoading(key?: string) {
  if (!key) {
    return Object.values(state.keys).some((v) => v > 0);
  }
  return (state.keys[key] ?? 0) > 0;
}

export function useLoader(key?: string) {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );

  const active = key
    ? (snapshot.keys[key] ?? 0) > 0
    : Object.values(snapshot.keys).some((v) => v > 0);

  return { active };
}
