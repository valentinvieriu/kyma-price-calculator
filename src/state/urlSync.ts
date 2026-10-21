import { createStore } from 'jotai';
import {
  configSnapshotAtom,
  decodeSnapshot,
  encodeSnapshot,
  isDefaultSnapshot,
} from './configSnapshot';

type Store = ReturnType<typeof createStore>;

// The configuration lives in the URL hash (static hosting, never sent to a
// server), so any estimate can be bookmarked or shared as a link.
const HASH_KEY = 'config';

function readHash(): string | null {
  return new URLSearchParams(window.location.hash.slice(1)).get(HASH_KEY);
}

export function syncConfigWithUrl(store: Store) {
  const encoded = readHash();
  const snapshot = encoded ? decodeSnapshot(encoded) : null;
  if (snapshot) store.set(configSnapshotAtom, snapshot);

  return store.sub(configSnapshotAtom, () => {
    const current = store.get(configSnapshotAtom);
    const hash = isDefaultSnapshot(current)
      ? ''
      : `#${HASH_KEY}=${encodeSnapshot(current)}`;
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}${hash}`);
  });
}
