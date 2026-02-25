// src/main.ts
// ─────────────────────────────────────────────────────────────────────────────
// Entry point de la aplicación Angular (Standalone API).
// Angular CLI apunta a este archivo desde angular.json → "browser": "src/main.ts"
// ─────────────────────────────────────────────────────────────────────────────

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent }         from './app/app.component';
import { appConfig }            from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));