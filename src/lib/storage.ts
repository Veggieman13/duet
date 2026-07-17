// On iOS/Android, persist via SQLite-backed key-value storage.
// The web version of this module lives in storage.web.ts.
import KV from 'expo-sqlite/kv-store';

const Storage = {
  getItemSync(key: string): string | null {
    return KV.getItemSync(key);
  },
  setItemSync(key: string, value: string): void {
    KV.setItemSync(key, value);
  },
  removeItemSync(key: string): void {
    KV.removeItemSync(key);
  },
};

export default Storage;
