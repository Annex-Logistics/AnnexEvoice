import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { StorageProvider } from './storage.provider.js';

// Dev/test only: writes objects to local disk and hands back a file:// URL.
export class MockStorageProvider implements StorageProvider {
  readonly name = 'mock';
  private readonly root = resolve(process.env.STORAGE_LOCAL_DIR ?? '.storage');

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async signedReadUrl(key: string): Promise<string> {
    return pathToFileURL(this.pathFor(key)).href;
  }

  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) throw new Error(`Storage key escapes root: ${key}`);
    return path;
  }
}
