
import { StringPublicKey } from '../utils';

interface StoreConfig {
  // Store Address
  storeAddress?: StringPublicKey;
  // Store was configured via ENV or query params
  isConfigured: boolean;
  // Initial calculating of store address completed (successfully or not)
  isReady: boolean;
  // recalculate store address for specified owner address
  setStoreForOwner: (ownerAddress?: string) => Promise<string | undefined>;
}