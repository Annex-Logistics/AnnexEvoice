import { NotImplementedException } from '@nestjs/common';

import type { StorageProvider } from './storage.provider.js';

// TODO(NEXT #11): implement with @google-cloud/storage once a GCP project and
// bucket exist (bucket from GCS_BUCKET_INVOICES, V4 signed read URLs). Not wired
// yet because nothing here can be verified without real credentials.
export class GcsStorageProvider implements StorageProvider {
  readonly name = 'gcs';

  async put(): Promise<void> {
    throw new NotImplementedException('GCS storage is not implemented yet');
  }

  async signedReadUrl(): Promise<string> {
    throw new NotImplementedException('GCS storage is not implemented yet');
  }
}
