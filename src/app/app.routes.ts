import {Routes} from '@angular/router';
import {HeroComponent} from './components/hero/hero';
import {NewsComponent} from './components/news/news';
import {DashboardComponent} from './components/dashboard/dashboard';
import { ComparativaTerritorialComponent } from './components/comparativa/comparativa-territorial';

export const routes: Routes = [
  { path: '', component: HeroComponent },
  { path: 'noticias', component: NewsComponent },
  { path: 'resultados', component: DashboardComponent },
  { path: 'dashboard',   component: DashboardComponent },
  { path: 'comparativa', component: ComparativaTerritorialComponent },
  { path: '',            redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

