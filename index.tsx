// index.tsx — Entry point de la aplicación GeoCensus
// ─────────────────────────────────────────────────────────────────────────────

// CORRECCIÓN NG0908: Zone.js debe importarse ANTES que cualquier cosa de Angular
import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent }         from './src/app/app.component';
import { appConfig }            from './src/app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));