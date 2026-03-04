import {Routes} from '@angular/router';
import {HeroComponent} from './components/hero/hero';
import {NewsComponent} from './components/news/news';
import {DashboardComponent} from './components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: HeroComponent },
  { path: 'noticias', component: NewsComponent },
  { path: 'resultados', component: DashboardComponent },
  { path: '**', redirectTo: '' }
];
