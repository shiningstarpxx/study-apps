function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

export function getStorageItem(key) {
  return getStorage()?.getItem(key) ?? null;
}

export function setStorageItem(key, value) {
  const storage = getStorage();
  if (!storage) return value;
  storage.setItem(key, value);
  return value;
}

export function removeStorageItem(key) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(key);
}

export function getJSONItem(key, fallback = null) {
  try {
    const raw = getStorageItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setJSONItem(key, value) {
  setStorageItem(key, JSON.stringify(value));
  return value;
}
