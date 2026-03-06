import { Routes } from '@angular/router';
import { HeroComponent }                  from './components/hero/hero';
import { NewsComponent }                  from './components/news/news';
import { DashboardComponent }             from './components/dashboard/dashboard';
import { ComparativaTerritorialComponent } from './components/comparativa/comparativa-territorial';

export const routes: Routes = [
  { path: '',            component: HeroComponent },
  { path: 'noticias',   component: NewsComponent },
  { path: 'resultados', component: DashboardComponent },
  { path: 'dashboard',  component: DashboardComponent },
  { path: 'comparativa', component: ComparativaTerritorialComponent },

  // ── Censos 2025 ──────────────────────────────────────────────────────────────
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

  { path: '**', redirectTo: '' },
];