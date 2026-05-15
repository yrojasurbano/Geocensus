import { Routes } from '@angular/router';
import { HeroComponent } from './components/hero/hero';
import { NewsComponent } from './components/news/news';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ComparativaTerritorialComponent } from './components/comparativa/comparativa-territorial';
import { PublicacionesComponent } from './components/publicaciones/publicaciones.component';
import { DashboardCensadaComponent} from './components/dashboard/dashboard-censada'
import { DashboardTerritorialComponent} from './components/dashboard/dashboard-territorial'
import { DashboardEvolucionComponent} from './components/dashboard/dashboard-evolucion'
import { DashboardTematicoComponent} from './components/dashboard/dashboard-tematico'
import {DescargaDatosComponent} from './components/descarga/descarga-datos'

// SE ELIMINÓ: import { IntermediaComponent } from './components/intermedia/intermedia';

export const routes: Routes = [
  { path: '', component: HeroComponent },
  { path: 'noticias', component: NewsComponent },
  { path: 'resultados', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'comparativa', component: ComparativaTerritorialComponent },
  { path: 'publicaciones', component: PublicacionesComponent },
  { path: 'dashboard-censada', component: DashboardCensadaComponent},
  { path: 'dashboard-territorial', component: DashboardTerritorialComponent},
  { path: 'dashboard-evolucion', component: DashboardEvolucionComponent},
  { path: 'dashboard-tematico', component: DashboardTematicoComponent},
  { path: 'descarga-datos', component: DescargaDatosComponent},

  // ── Censos 2025 ─────────────────────────────────────────────────────────────
  {
    path: 'aspectos-generales',
    loadComponent: () =>
      import('./components/features/aspectos-generales/aspectos-generales.component')
        .then(m => m.AspectosGeneralesComponent),
  },
  {
    path: 'innovaciones',
    loadComponent: () =>
      import('./components/features/innovaciones/innovaciones-tecnologicas')
        .then(m => m.InnovacionesTecnologicasComponent),
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
    path: 'intermedia',
    loadComponent: () =>
      import('./components/intermedia/intermedia') // Ruta verificada: src/app/components/intermedia/intermedia.ts
        .then(m => m.IntermediaComponent),
  },
  {
    path: 'documentacion-tecnica',
    loadComponent: () =>
      import('./components/features/documentacion-tecnica/documentacion-tecnica.component')
        .then(m => m.DocumentacionTecnicaComponent),
  },
  {
    path: 'censo-derecho',
    loadComponent: () =>
      import('./components/features/censoderecho/censo-derecho')
        .then(m => m.CensoderechoComponent),
  },

  { path: '**', redirectTo: '' },
];