import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient }  from '@angular/common/http';

// ── ngx-echarts ──────────────────────────────────────────────────────────────
// provideEchartsCore NO existe en ngx-echarts.
// La forma correcta para apps Standalone Angular 17+ es importProvidersFrom
// con NgxEchartsModule.forRoot(), pasando el motor eagerly.
// ─────────────────────────────────────────────────────────────────────────────
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts          from 'echarts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideHttpClient(),

    // Registra NGX_ECHARTS_CONFIG globalmente (resuelve NG0201)
    importProvidersFrom(
      NgxEchartsModule.forRoot({ echarts }),
    ),
  ],
};