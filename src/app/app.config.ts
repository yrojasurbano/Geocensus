import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

// ─── CRÍTICO: sin provideAnimations(), ngx-charts no inicializa sus ───────────
// componentes SVG correctamente y solo renderiza al hacer hover.             ───
import { provideAnimations } from '@angular/platform-browser/animations';
// ─────────────────────────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),   // necesario para cargar el GeoJSON en map-viewer
    provideAnimations(),   // necesario para que ngx-charts renderice al inicio
  ],
};