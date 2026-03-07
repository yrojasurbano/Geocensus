// src/main.ts
// ─────────────────────────────────────────────────────────────────────────────
// Entry point de la aplicación Angular (Standalone API).
// Angular CLI apunta a este archivo desde angular.json → "browser": "src/main.ts"
// ─────────────────────────────────────────────────────────────────────────────
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig }            from './app/app.config';
import {App} from "./app/app";

bootstrapApplication(App, appConfig)
    .catch(err => console.error(err));