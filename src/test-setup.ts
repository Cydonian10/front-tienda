// Node can expose its own localStorage instead of jsdom's browser storage.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: (globalThis as typeof globalThis & { jsdom: { window: Window } }).jsdom.window.localStorage,
});
