// Web fallback: expo-sqlite's wasm build doesn't bundle with Metro,
// so the browser build persists to localStorage instead.
const Storage = {
  getItemSync(key: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItemSync(key: string, value: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
};

export default Storage;
