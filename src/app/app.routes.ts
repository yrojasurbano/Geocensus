import { Routes } from '@angular/router';
import { HeroComponent }                   from './components/hero/hero';
import { NewsComponent }                   from './components/news/news';
import { DashboardComponent }              from './components/dashboard/dashboard';
import { ComparativaTerritorialComponent } from './components/comparativa/comparativa-territorial';
import { PublicacionesComponent }          from './components/publicaciones/publicaciones.component';
// ── LÍNEA 7: ELIMINADO import eager de CensoderechoComponent ─────────────────
//    (se carga de forma lazy más abajo, igual que el resto de features)

export const routes: Routes = [
  { path: '',            component: HeroComponent },
  { path: 'noticias',    component: NewsComponent },
  { path: 'resultados',  component: DashboardComponent },
  { path: 'dashboard',   component: DashboardComponent },
  { path: 'comparativa', component: ComparativaTerritorialComponent },
  { path: 'publicaciones', component: PublicacionesComponent },
  // ── LÍNEA 20: ELIMINADA ruta eager duplicada de censo-derecho ──────────────

  // ── Censos 2025 ─────────────────────────────────────────────────────────────
  {
    path: 'aspectos-generales',
    loadComponent: () =>
      import('./components/features/aspectos-generales/aspectos-generales.component')
        .then(m => m.AspectosGeneralesComponent),
  },
  {
    path: 'organizacion',
    loadComponent: () =>
      import('./components/features/organizacion/organizacion.component')
        .then(m => m.OrganizacionComponent),
  },
  {
    path: 'normativa',
    loadComponent: () =>
      import('./components/features/normativa/normativa.component')
        .then(m => m.NormativaComponent),
  },
  {
    path: 'documentacion-tecnica',
    loadComponent: () =>
      import('./components/features/documentacion-tecnica/documentacion-tecnica.component')
        .then(m => m.DocumentacionTecnicaComponent),
  },
  {
    // ── LÍNEA 44: CORREGIDO loadcomponent → loadComponent (C mayúscula) ───────
    path: 'censo-derecho',
    loadComponent: () =>
      import('./components/features/censoderecho/censo-derecho')
        .then(m => m.CensoderechoComponent),
  },

  { path: '**', redirectTo: '' },
];