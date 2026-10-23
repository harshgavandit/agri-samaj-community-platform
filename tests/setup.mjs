import { AsyncLocalStorage } from "node:async_hooks";

// Next's server bootstrap normally supplies this global before importing its
// request/cache stores. Unit tests import route modules directly in plain Node.
if (!globalThis.AsyncLocalStorage)
  globalThis.AsyncLocalStorage = AsyncLocalStorage;
