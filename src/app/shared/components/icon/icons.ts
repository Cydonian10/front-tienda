export type IconShape =
  | { readonly type: 'path'; readonly d: string }
  | { readonly type: 'circle'; readonly cx: number; readonly cy: number; readonly r: number };

/** Trusted SVG geometry. Add names here instead of repeating SVGs in templates. */
export const ICONS = {
  menu: [{ type: 'path', d: 'M4 6h16M4 12h16M4 18h11' }],
  close: [{ type: 'path', d: 'm6 6 12 12M18 6 6 18' }],
  'chevron-down': [{ type: 'path', d: 'm6 9 6 6 6-6' }],
  'chevron-right': [{ type: 'path', d: 'm9 6 6 6-6 6' }],
  'chevron-left': [{ type: 'path', d: 'm15 6-6 6 6 6' }],
  plus: [{ type: 'path', d: 'M12 5v14M5 12h14' }],
  grid: [{ type: 'path', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' }],
  check: [{ type: 'path', d: 'm5 12 4 4L19 6' }],
  user: [
    { type: 'circle', cx: 12, cy: 7, r: 4 },
    { type: 'path', d: 'M5 21v-2a7 7 0 0 1 14 0v2' },
  ],
  'at-sign': [
    { type: 'circle', cx: 12, cy: 12, r: 4 },
    { type: 'path', d: 'M16 8v6a2 2 0 0 0 4 0v-2a8 8 0 1 0-3 6.24' },
  ],
  'id-card': [
    {
      type: 'path',
      d: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM6 9h5m-5 4h3m6-4h3m-3 4h3',
    },
  ],
  calendar: [
    {
      type: 'path',
      d: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM16 2v4M8 2v4M3 10h18',
    },
  ],
  key: [
    { type: 'circle', cx: 7.5, cy: 15.5, r: 4.5 },
    { type: 'path', d: 'm11 12 9-9 2 2-3 3 2 2-3 3-2-2' },
  ],
  upload: [{ type: 'path', d: 'M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4' }],
  file: [
    {
      type: 'path',
      d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h6',
    },
  ],
  settings: [
    {
      type: 'path',
      d: 'm12 3 2 2.5 3.2-.2.8 3.1 2.7 1.7-1.7 2.7.2 3.2-3.1.8-1.7 2.7-2.7-1.7-3.2.2-.8-3.1-2.7-1.7 1.7-2.7-.2-3.2 3.1-.8L12 3Z',
    },
    { type: 'circle', cx: 12, cy: 12, r: 3 },
  ],
  shield: [{ type: 'path', d: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM12 10v4M12 7v.01' }],
  'shield-check': [{ type: 'path', d: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM9 12l2 2 4-4' }],
  users: [
    {
      type: 'path',
      d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    },
  ],
  sun: [
    { type: 'circle', cx: 12, cy: 12, r: 4 },
    {
      type: 'path',
      d: 'M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    },
  ],
  moon: [{ type: 'path', d: 'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z' }],
  success: [
    { type: 'circle', cx: 12, cy: 12, r: 9 },
    { type: 'path', d: 'm8 12 2.5 2.5L16 9' },
  ],
  error: [
    { type: 'circle', cx: 12, cy: 12, r: 9 },
    { type: 'path', d: 'm9 9 6 6m0-6-6 6' },
  ],
  warning: [
    { type: 'path', d: 'm12 3 10 17H2L12 3Z' },
    { type: 'path', d: 'M12 9v4m0 3h.01' },
  ],
  info: [
    { type: 'circle', cx: 12, cy: 12, r: 9 },
    { type: 'path', d: 'M12 11v6m0-10h.01' },
  ],
  mail: [
    { type: 'path', d: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z' },
    { type: 'path', d: 'm3 7 9 6 9-6' },
  ],
  lock: [
    { type: 'path', d: 'M6 10h12a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2Z' },
    { type: 'path', d: 'M8 10V7a4 4 0 0 1 8 0v3' },
  ],
  eye: [
    { type: 'path', d: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z' },
    { type: 'circle', cx: 12, cy: 12, r: 2.5 },
  ],
  'eye-off': [
    { type: 'path', d: 'm3 3 18 18' },
    {
      type: 'path',
      d: 'M10.6 6.1A8.9 8.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.1 2.8M14.1 14.2a3 3 0 0 1-4.3-4.3M6.6 6.7C3.9 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1 0 2-.2 2.9-.5',
    },
  ],
} as const satisfies Record<string, readonly IconShape[]>;

export type IconName = keyof typeof ICONS;
