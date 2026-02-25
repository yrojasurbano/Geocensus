// postcss.config.js — Tailwind CSS v4 + Angular CLI
// ─────────────────────────────────────────────────────────────────────────────
// Tailwind v4 ya NO usa tailwind.config.js.
// La configuración ahora es CSS-first (ver src/styles.css).
// Este archivo le dice a Angular CLI (esbuild/PostCSS) que use el plugin de Tailwind v4.
// ─────────────────────────────────────────────────────────────────────────────
export default {
  plugins: {
    '@tailwindcss/postcss': {},  // plugin oficial de Tailwind v4 para PostCSS
    'autoprefixer': {},
  },
};