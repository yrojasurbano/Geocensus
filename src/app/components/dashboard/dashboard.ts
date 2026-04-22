/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    PLATFORM_ID,
    inject,
    signal,
    computed,
    HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HeroIconComponent } from '../ui/hero-icon.component';

// ECharts — únicamente para gráficos de pie y pirámide
import * as echarts from 'echarts/core';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, GraphicComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, GraphicComponent, MarkLineComponent, CanvasRenderer]);

// ── Interfaces ──────────────────────────────────────────────────────────────
interface MapRegion {
    id: number;
    /** Clave única según nivel: ccdd(2) | ccdd+ccpp(4) | ubigeo(6) */
    geoKey: string;
    ccdd: string;
    ccpp: string;
    ccdi: string;
    name: string;
    total: number;
    male: number;
    female: number;
    density: number;
    path: string;
    center: { x: number; y: number };
    color: string;
}

interface GeoOption {
    code: string;
    name: string;
    sortKey?: string;
}

interface ColorBreak {
    min: number;
    max: number;
    color: string;
    label: string;
    count: number;
}

// ── Indicadores de mapa ─────────────────────────────────────────────────────
type MapIndicatorKey =
    | 'poblacion' | 'edad_promedio' | 'edad_mediana' | 'razon_sexo'
    | 'indice_envejecimiento' | 'dep_total' | 'dep_juvenil' | 'dep_adulta'
    | 'densidad_total' | 'densidad_65';

interface IndicatorDef {
    key: MapIndicatorKey;
    label: string;
    unit: string;
    decimals: number;
}

const INDICATORS: IndicatorDef[] = [
    { key: 'poblacion',             label: 'Población censada',                    unit: '',         decimals: 0 },
    { key: 'edad_promedio',         label: 'Edad promedio',                        unit: ' años',    decimals: 1 },
    { key: 'edad_mediana',          label: 'Edad mediana',                         unit: ' años',    decimals: 1 },
    { key: 'razon_sexo',            label: 'Razón hombre – mujer',                 unit: '',         decimals: 1 },
    { key: 'indice_envejecimiento', label: 'Índice de envejecimiento',             unit: '',         decimals: 1 },
    { key: 'dep_total',             label: 'Relación de dependencia total',        unit: '',         decimals: 1 },
    { key: 'dep_juvenil',           label: 'Relación dependencia juvenil',         unit: '',         decimals: 1 },
    { key: 'dep_adulta',            label: 'Relación dependencia adulta',          unit: '',         decimals: 1 },
    { key: 'densidad_total',        label: 'Densidad población censada',           unit: ' hab/km²', decimals: 1 },
    { key: 'densidad_65',           label: 'Densidad población 60 años y más',    unit: ' hab/km²', decimals: 2 },
];

const MOCK_DEP: Record<string, Record<string, number>> = {
    '01':{ edad_promedio:28.4,edad_mediana:25.8,razon_sexo:101.2,indice_envejecimiento:28.4,dep_total:62.1,dep_juvenil:50.3,dep_adulta:11.8,densidad_65:1.4 },
    '02':{ edad_promedio:30.2,edad_mediana:27.6,razon_sexo:97.8, indice_envejecimiento:38.2,dep_total:58.4,dep_juvenil:44.6,dep_adulta:13.8,densidad_65:2.3 },
    '03':{ edad_promedio:26.9,edad_mediana:24.1,razon_sexo:95.4, indice_envejecimiento:29.6,dep_total:65.3,dep_juvenil:52.8,dep_adulta:12.5,densidad_65:1.2 },
    '04':{ edad_promedio:32.5,edad_mediana:29.8,razon_sexo:98.6, indice_envejecimiento:46.3,dep_total:51.8,dep_juvenil:38.4,dep_adulta:13.4,densidad_65:3.1 },
    '05':{ edad_promedio:27.3,edad_mediana:24.5,razon_sexo:94.1, indice_envejecimiento:30.2,dep_total:64.7,dep_juvenil:52.1,dep_adulta:12.6,densidad_65:1.3 },
    '06':{ edad_promedio:26.5,edad_mediana:23.8,razon_sexo:96.3, indice_envejecimiento:27.4,dep_total:67.2,dep_juvenil:55.4,dep_adulta:11.8,densidad_65:1.8 },
    '07':{ edad_promedio:33.8,edad_mediana:31.2,razon_sexo:99.1, indice_envejecimiento:52.4,dep_total:48.6,dep_juvenil:34.8,dep_adulta:13.8,densidad_65:6.9 },
    '08':{ edad_promedio:28.1,edad_mediana:25.4,razon_sexo:96.8, indice_envejecimiento:31.5,dep_total:62.8,dep_juvenil:50.4,dep_adulta:12.4,densidad_65:2.1 },
    '09':{ edad_promedio:25.8,edad_mediana:23.1,razon_sexo:93.2, indice_envejecimiento:26.8,dep_total:68.4,dep_juvenil:56.8,dep_adulta:11.6,densidad_65:1.0 },
    '10':{ edad_promedio:27.1,edad_mediana:24.3,razon_sexo:97.4, indice_envejecimiento:28.9,dep_total:65.8,dep_juvenil:53.4,dep_adulta:12.4,densidad_65:1.5 },
    '11':{ edad_promedio:32.1,edad_mediana:29.4,razon_sexo:98.4, indice_envejecimiento:44.6,dep_total:53.2,dep_juvenil:39.8,dep_adulta:13.4,densidad_65:2.8 },
    '12':{ edad_promedio:29.4,edad_mediana:26.7,razon_sexo:98.1, indice_envejecimiento:36.4,dep_total:59.6,dep_juvenil:46.2,dep_adulta:13.4,densidad_65:2.1 },
    '13':{ edad_promedio:30.8,edad_mediana:28.1,razon_sexo:97.6, indice_envejecimiento:40.2,dep_total:56.4,dep_juvenil:42.8,dep_adulta:13.6,densidad_65:3.4 },
    '14':{ edad_promedio:31.4,edad_mediana:28.7,razon_sexo:96.8, indice_envejecimiento:41.8,dep_total:54.8,dep_juvenil:41.2,dep_adulta:13.6,densidad_65:3.2 },
    '15':{ edad_promedio:34.2,edad_mediana:31.5,razon_sexo:96.4, indice_envejecimiento:56.8,dep_total:47.2,dep_juvenil:32.8,dep_adulta:14.4,densidad_65:7.2 },
    '16':{ edad_promedio:27.6,edad_mediana:24.9,razon_sexo:104.8,indice_envejecimiento:27.6,dep_total:63.4,dep_juvenil:51.8,dep_adulta:11.6,densidad_65:0.8 },
    '17':{ edad_promedio:28.3,edad_mediana:25.6,razon_sexo:108.4,indice_envejecimiento:24.8,dep_total:60.8,dep_juvenil:50.4,dep_adulta:10.4,densidad_65:0.6 },
    '18':{ edad_promedio:34.6,edad_mediana:32.1,razon_sexo:102.4,indice_envejecimiento:51.2,dep_total:49.4,dep_juvenil:36.2,dep_adulta:13.2,densidad_65:2.4 },
    '19':{ edad_promedio:28.7,edad_mediana:26.0,razon_sexo:104.2,indice_envejecimiento:30.8,dep_total:61.4,dep_juvenil:49.8,dep_adulta:11.6,densidad_65:1.1 },
    '20':{ edad_promedio:30.1,edad_mediana:27.4,razon_sexo:96.2, indice_envejecimiento:37.8,dep_total:58.8,dep_juvenil:45.4,dep_adulta:13.4,densidad_65:2.6 },
    '21':{ edad_promedio:27.4,edad_mediana:24.7,razon_sexo:96.8, indice_envejecimiento:29.4,dep_total:64.2,dep_juvenil:52.4,dep_adulta:11.8,densidad_65:1.2 },
    '22':{ edad_promedio:28.9,edad_mediana:26.2,razon_sexo:102.6,indice_envejecimiento:28.2,dep_total:61.8,dep_juvenil:50.6,dep_adulta:11.2,densidad_65:1.4 },
    '23':{ edad_promedio:33.4,edad_mediana:30.7,razon_sexo:100.8,indice_envejecimiento:48.6,dep_total:50.4,dep_juvenil:37.2,dep_adulta:13.2,densidad_65:3.6 },
    '24':{ edad_promedio:30.6,edad_mediana:27.9,razon_sexo:103.4,indice_envejecimiento:34.8,dep_total:57.6,dep_juvenil:45.2,dep_adulta:12.4,densidad_65:2.1 },
    '25':{ edad_promedio:28.8,edad_mediana:26.1,razon_sexo:105.6,indice_envejecimiento:26.4,dep_total:61.2,dep_juvenil:50.8,dep_adulta:10.4,densidad_65:0.9 },
};

const PALETTE = ['#caeae4','#86cec0','#33b3a9','#2d9b90','#4c8c80'];
//const PALETTE = ['#c9eae3','#33b3a9','#038dd2','#8383fc','#0055a0'];

export type NivelGeoType = 'Departamental' | 'Provincial' | 'Distrital';

const B = { minLon: -81.5, maxLon: -68.5, minLat: -18.5, maxLat: 0.3 };
const S = { w: 380, h: 550 };


@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
    providers: [provideEchartsCore({ echarts })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `

    <!-- ══════════════════════════════════════════════════════════════════════
         SECCIÓN RAÍZ
         • Móvil/Tablet  : scroll vertical libre (overflow-auto, altura auto)
         • Desktop xl+   : pantalla completa fija (h-screen, overflow-hidden)
    ══════════════════════════════════════════════════════════════════════ -->
    <section
      class="bg-[#f4f7f9] w-full flex flex-col font-sans text-gray-800
             overflow-auto xl:h-screen xl:overflow-hidden"
      (click)="closeGeoDropdowns()">

      <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50
                     flex justify-between items-center
                     px-4 py-2 sm:px-6 sm:py-3 md:px-10 md:py-3 lg:px-12 lg:py-4
                     w-full shrink-0">

        <!-- Logos -->
        <div class="flex items-center gap-3 md:gap-4 lg:gap-5">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI"
                 class="h-9 sm:h-10 md:h-11 lg:h-14 w-auto object-contain">
          </div>
          <div class="w-px h-7 md:h-9 bg-gray-200 hidden md:block"></div>
          <img src="logo_cpv.png" alt="Logo CPV 2025"
               class="h-9 sm:h-10 md:h-11 lg:h-12 w-auto object-contain hidden md:block">
        </div>

        <!-- Nav desktop -->
        <nav class="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium tracking-wide"
             style="color:#0056a1">
          <button routerLink="/"
            class="hover:text-secondary transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/resultados"
            class="hover:text-secondary transition-colors uppercase relative group font-black underline">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)"
              class="hover:text-secondary transition-colors uppercase relative group flex items-center gap-1">
              Censos 2025
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                [class.rotate-180]="censosOpen()"></app-hero-icon>
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards"
                   (click)="$event.stopPropagation()">
                <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700
                               hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10
                               hover:text-primary transition-all flex items-center gap-2 group/item">
                        <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-secondary
                                     opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"></span>
                        {{ item.label }}
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
          <button routerLink="/noticias"
            class="hover:text-secondary transition-colors uppercase relative group">
            Noticias<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
        </nav>

        <!-- Hamburger — solo visible en móvil/tablet (<lg) -->
        <button
          (click)="toggleMobileMenu($event)"
          class="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg
                 hover:bg-gray-100 transition-colors gap-1.5"
          aria-label="Menú">
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.rotate-45]="mobileMenuOpen()"
                [class.translate-y-2]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.opacity-0]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.-rotate-45]="mobileMenuOpen()"
                [class.-translate-y-2]="mobileMenuOpen()"></span>
        </button>
      </header>

      <!-- Menú móvil desplegable -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden bg-white border-b border-gray-100 shadow-md z-40 px-4 py-3
                    flex flex-col gap-1"
             style="animation: dropdownIn 0.18s ease-out forwards"
             (click)="$event.stopPropagation()">
          <button routerLink="/" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Inicio
          </button>
          <button routerLink="/resultados" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-black text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide underline">
            Resultados
          </button>
          <!-- Censos submenu en móvil -->
          <button (click)="toggleCensos($event)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide
                   flex items-center justify-between">
            Censos 2025
            <app-hero-icon [name]="'chevron-down'" class="w-4 h-4 transition-transform"
              [class.rotate-180]="censosOpen()"></app-hero-icon>
          </button>
          @if (censosOpen()) {
            <div class="pl-4 flex flex-col gap-0.5 border-l-2 border-blue-100 ml-3">
              @for (item of censosMenu; track item.label) {
                <button [routerLink]="item.route"
                  (click)="censosOpen.set(false); mobileMenuOpen.set(false)"
                  class="text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-600
                         hover:bg-gray-50 transition-colors">
                  {{ item.label }}
                </button>
              }
            </div>
          }
          <button routerLink="/noticias" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Noticias
          </button>
        </div>
      }

      <!-- ══ BARRA DE FILTROS ════════════════════════════════════════════════
           Móvil:   columna única — card población encima, filtros abajo
           Tablet:  grid 2 cols
           Desktop: grid 6 cols
      ══════════════════════════════════════════════════════════════════════ -->
      <div class="bg-white border-b border-gray-100 shadow-sm sticky z-40
                  top-[53px] sm:top-[57px] md:top-[61px] lg:top-[65px]
                  px-3 py-2 sm:px-4 sm:py-3 md:px-6 lg:px-6 2xl:px-8
                  flex flex-col md:grid md:grid-cols-6 gap-2 md:gap-3 shrink-0"
           (click)="$event.stopPropagation()">

        <!-- Card Población total -->
        <div class="w-full md:col-span-2
                    bg-gradient-to-r from-primary to-secondary rounded-xl p-3 md:p-4
                    text-white flex flex-row items-center justify-center gap-4 md:gap-6
                    shadow-md relative overflow-hidden group text-left">
          <div class="absolute right-0 top-0 w-20 h-20 bg-white/10 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
          <div class="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
              <app-hero-icon [name]="'globe-americas'"
                (click)="setMapIndicator('poblacion')"
                class="w-4 h-4 md:w-5 md:h-5 cursor-pointer transition-all"
                [class.animate-pulse]="activeIndicator() !== 'poblacion'"
                [class.scale-125]="activeIndicator() === 'poblacion'"
                [style.color]="activeIndicator() === 'poblacion' ? '#0056a1' : '#343b9f'">
              </app-hero-icon>
            </span>
            <span matTooltip="Cantidad de residentes habituales" matTooltipClass="custom-tooltip" class="inline-flex items-center">
              <app-hero-icon [name]="'information-circle'" class="w-4 h-4 md:w-5 md:h-5 text-white/70"></app-hero-icon>
            </span>
          </div>
          <div class="p-2 md:p-3 rounded-full relative z-10">
            <img src="pobcensada.svg" class="w-12 h-12 md:w-16 md:h-16" style="filter: brightness(0) invert(1);">
          </div>
          <div class="relative z-10 flex flex-col min-w-0">
            <div class="text-[10px] md:text-xs font-bold opacity-80 tracking-wide mb-0.5 truncate">{{ displayedTitle() }}</div>
            <div class="text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-black tracking-tighter">{{ displayedPopulation() }}</div>
            <div class="text-[9px] md:text-[10px] font-semibold opacity-70 tracking-wide mt-0.5">Población Censada</div>
          </div>
        </div>

        <!-- Selector geográfico -->
        <div class="w-full md:col-span-4 flex flex-col gap-2 pl-0 md:pl-2 justify-center"
             (click)="$event.stopPropagation()">

          <!-- Botones de vista -->
          <div class="flex justify-end">
            <div class="flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                class="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-sm
                       bg-gradient-to-r from-[#0056a1] to-[#33b3a9] text-white tracking-wide cursor-default">
                Primeros Resultados
              </button>
              <button
                routerLink="/comparativa"
                class="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all
                       text-gray-400 hover:text-gray-600 tracking-wide">
                Comparativo Territorial
              </button>
            </div>
          </div>

          <!-- Dropdowns geográficos -->
          <div class="flex flex-wrap items-center justify-end gap-2">

            <!-- Restablecer filtros -->
            <button
              (click)="resetFilters()"
              class="flex items-center gap-1.5 text-gray-400 hover:text-[#0056a1]
                     transition-colors text-xs font-black tracking-wide shrink-0 group">
              <app-hero-icon [name]="'arrow-path'"
                class="w-4 h-4 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
              <span class="hidden sm:inline">Restablecer Filtros</span>
            </button>

            <div class="hidden sm:block h-7 w-px bg-gray-200 shrink-0"></div>

            <!-- ★ Departamento -->
            <div class="relative">
              <button
                (click)="toggleGeoDropdown('dep'); $event.stopPropagation()"
                class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                       text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all
                       min-w-[130px] sm:min-w-[148px] justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                  <span class="text-gray-400 mr-0.5">Dep.:</span>
                  <span class="truncate max-w-[70px] sm:max-w-[80px]">{{ geoDepLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 text-gray-400 transition-transform"
                  [class.rotate-180]="openGeoDropdown() === 'dep'">
                </app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'dep') {
                <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                             shadow-xl z-50 w-56 sm:w-60 overflow-hidden"
                     (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar departamento</span>
                  </div>
                  <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                    <button
                      (click)="selectDep(null)"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedCCDD() === ''"
                      [class.from-\[\#0056a1\]]="selectedCCDD() === ''"
                      [class.to-\[\#1a75aa\]]="selectedCCDD() === ''"
                      [class.text-white]="selectedCCDD() === ''"
                      [class.text-gray-700]="selectedCCDD() !== ''"
                      [class.hover\:bg-blue-50]="selectedCCDD() !== ''">
                      <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        [class.border-white]="selectedCCDD() === ''"
                        [class.border-gray-300]="selectedCCDD() !== ''">
                        @if (selectedCCDD() === '') {
                          <span class="w-2 h-2 bg-white rounded-full block"></span>
                        }
                      </span>
                      <span class="font-bold italic text-xs">Todos los departamentos</span>
                    </button>
                    @for (dept of departments(); track dept.ccdd) {
                      <button
                        (click)="selectDep(dept)"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedCCDD() === dept.ccdd"
                        [class.from-\[\#0056a1\]]="selectedCCDD() === dept.ccdd"
                        [class.to-\[\#1a75aa\]]="selectedCCDD() === dept.ccdd"
                        [class.text-white]="selectedCCDD() === dept.ccdd"
                        [class.text-gray-700]="selectedCCDD() !== dept.ccdd"
                        [class.hover\:bg-blue-50]="selectedCCDD() !== dept.ccdd">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedCCDD() === dept.ccdd"
                          [class.border-gray-300]="selectedCCDD() !== dept.ccdd">
                          @if (selectedCCDD() === dept.ccdd) {
                            <span class="w-2 h-2 bg-white rounded-full block"></span>
                          }
                        </span>
                        <span class="font-semibold">{{ dept.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- ★ Provincia -->
            <div class="relative">
              <button
                (click)="isGeoProvActive() && toggleGeoDropdown('prov'); $event.stopPropagation()"
                class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all
                       min-w-[130px] sm:min-w-[148px] justify-between"
                [class.bg-gray-50]="isGeoProvActive()"
                [class.border-gray-200]="isGeoProvActive()"
                [class.text-gray-700]="isGeoProvActive()"
                [class.hover\:bg-gray-100]="isGeoProvActive()"
                [class.bg-gray-50\/50]="!isGeoProvActive()"
                [class.border-gray-100]="!isGeoProvActive()"
                [class.text-gray-300]="!isGeoProvActive()"
                [class.cursor-not-allowed]="!isGeoProvActive()">
                <span class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0"
                    [class.bg-\[\#1a75aa\]]="isGeoProvActive()"
                    [class.bg-gray-200]="!isGeoProvActive()"></span>
                  <span class="mr-0.5"
                    [class.text-gray-400]="isGeoProvActive()"
                    [class.text-gray-300]="!isGeoProvActive()">Prov.:</span>
                  <span class="truncate max-w-[60px] sm:max-w-[70px]">{{ geoProvLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                  [class.text-gray-400]="isGeoProvActive()"
                  [class.text-gray-200]="!isGeoProvActive()"
                  [class.rotate-180]="openGeoDropdown() === 'prov'">
                </app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'prov' && isGeoProvActive()) {
                <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                             shadow-xl z-50 w-60 sm:w-64 overflow-hidden"
                     (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar provincia</span>
                  </div>
                  <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                    <button
                      (click)="selectProv('')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedProv() === ''"
                      [class.from-\[\#0056a1\]]="selectedProv() === ''"
                      [class.to-\[\#1a75aa\]]="selectedProv() === ''"
                      [class.text-white]="selectedProv() === ''"
                      [class.text-gray-700]="selectedProv() !== ''"
                      [class.hover\:bg-blue-50]="selectedProv() !== ''">
                      <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        [class.border-white]="selectedProv() === ''"
                        [class.border-gray-300]="selectedProv() !== ''">
                        @if (selectedProv() === '') {
                          <span class="w-2 h-2 bg-white rounded-full block"></span>
                        }
                      </span>
                      <span class="font-bold italic">Todas las provincias</span>
                    </button>
                    @for (p of provinces(); track p.code) {
                      <button
                        (click)="selectProv(p.code)"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedProv() === p.code"
                        [class.from-\[\#0056a1\]]="selectedProv() === p.code"
                        [class.to-\[\#1a75aa\]]="selectedProv() === p.code"
                        [class.text-white]="selectedProv() === p.code"
                        [class.text-gray-700]="selectedProv() !== p.code"
                        [class.hover\:bg-blue-50]="selectedProv() !== p.code">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedProv() === p.code"
                          [class.border-gray-300]="selectedProv() !== p.code">
                          @if (selectedProv() === p.code) {
                            <span class="w-2 h-2 bg-white rounded-full block"></span>
                          }
                        </span>
                        <span class="font-semibold">{{ p.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- ★ Distrito -->
            <div class="relative">
              <button
                (click)="isGeoDistActive() && toggleGeoDropdown('dist'); $event.stopPropagation()"
                class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all
                       min-w-[120px] sm:min-w-[140px] justify-between"
                [class.bg-gray-50]="isGeoDistActive()"
                [class.border-gray-200]="isGeoDistActive()"
                [class.text-gray-700]="isGeoDistActive()"
                [class.hover\:bg-gray-100]="isGeoDistActive()"
                [class.bg-gray-50\/50]="!isGeoDistActive()"
                [class.border-gray-100]="!isGeoDistActive()"
                [class.text-gray-300]="!isGeoDistActive()"
                [class.cursor-not-allowed]="!isGeoDistActive()">
                <span class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0"
                    [class.bg-\[\#33b3a9\]]="isGeoDistActive()"
                    [class.bg-gray-200]="!isGeoDistActive()"></span>
                  <span class="mr-0.5"
                    [class.text-gray-400]="isGeoDistActive()"
                    [class.text-gray-300]="!isGeoDistActive()">Dist.:</span>
                  <span class="truncate max-w-[55px] sm:max-w-[65px]">{{ geoDistLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                  [class.text-gray-400]="isGeoDistActive()"
                  [class.text-gray-200]="!isGeoDistActive()"
                  [class.rotate-180]="openGeoDropdown() === 'dist'">
                </app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'dist' && isGeoDistActive()) {
                <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                             shadow-xl z-50 w-72 sm:w-80 overflow-hidden"
                     (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar distrito</span>
                  </div>
                  <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                    <button
                      (click)="selectDist('')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedDist() === ''"
                      [class.from-\[\#0056a1\]]="selectedDist() === ''"
                      [class.to-\[\#1a75aa\]]="selectedDist() === ''"
                      [class.text-white]="selectedDist() === ''"
                      [class.text-gray-700]="selectedDist() !== ''"
                      [class.hover\:bg-blue-50]="selectedDist() !== ''">
                      <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        [class.border-white]="selectedDist() === ''"
                        [class.border-gray-300]="selectedDist() !== ''">
                        @if (selectedDist() === '') {
                          <span class="w-2 h-2 bg-white rounded-full block"></span>
                        }
                      </span>
                      <span class="font-bold italic">Todos los distritos</span>
                    </button>
                    @for (d of districts(); track d.code) {
                      <button
                        (click)="selectDist(d.code)"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedDist() === d.code"
                        [class.from-\[\#0056a1\]]="selectedDist() === d.code"
                        [class.to-\[\#1a75aa\]]="selectedDist() === d.code"
                        [class.text-white]="selectedDist() === d.code"
                        [class.text-gray-700]="selectedDist() !== d.code"
                        [class.hover\:bg-blue-50]="selectedDist() !== d.code">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedDist() === d.code"
                          [class.border-gray-300]="selectedDist() !== d.code">
                          @if (selectedDist() === d.code) {
                            <span class="w-2 h-2 bg-white rounded-full block"></span>
                          }
                        </span>
                        <span class="font-semibold">{{ d.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

          </div><!-- /fila dropdowns -->
        </div><!-- /col-span-4 -->
      </div><!-- /barra de filtros -->


      <!-- ══ CONTENIDO PRINCIPAL ════════════════════════════════════════════
           Wrapper que en xl activa scroll interno para que el header quede fijo
      ══════════════════════════════════════════════════════════════════════ -->
      <div class="flex-1 p-3 md:p-4 2xl:p-5 xl:overflow-hidden xl:min-h-0 flex flex-col">

        <!-- ══ GRID PRINCIPAL ═══════════════════════════════════════════════
             Móvil  (< md) : 1 columna, cada sección con altura propia
             Tablet (md)   : 2 columnas (indicadores | pirámide+mapa apilados)
             Desktop (xl)  : 6 columnas, 2 filas — layout original completo
        ══════════════════════════════════════════════════════════════════ -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6
                    gap-3 2xl:gap-4 xl:min-h-0 xl:overflow-hidden">

          <!-- ══ BLOQUE INDICADORES ═════════════════════════════════════════
               Móvil  : 2 columnas con alturas auto
               Desktop xl: 2 columnas con grid-rows fijas (layout original)
          ══════════════════════════════════════════════════════════════════ -->
          <div class="col-span-1 md:col-span-1 xl:col-span-2 xl:row-span-2
                      grid grid-cols-2 gap-3
                      xl:grid-rows-[8fr_3fr_3fr_3fr_3fr] xl:min-h-0 xl:overflow-hidden">

            <!-- ── FILA 1: Gráficos Sexo + Grandes Grupos ──────────────── -->

            <!-- Población por Sexo -->
            <div class="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden
                        min-h-[180px] sm:min-h-[200px] xl:min-h-0">
              <div class="flex justify-between items-center mb-2 shrink-0">
                <h4 class="text-[10px] sm:text-xs font-black text-black tracking-wide leading-tight">Población por sexo</h4>
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('poblacion')"
                    class="w-4 h-4 cursor-pointer transition-all"
                    [class.animate-pulse]="activeIndicator() !== 'poblacion'"
                    [class.scale-125]="activeIndicator() === 'poblacion'"
                    [style.color]="activeIndicator() === 'poblacion' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
              </div>
              <div class="flex-1 min-h-0">
                @if (isBrowser) {
                  <div echarts [options]="pieOptionsSex" class="w-full h-full"></div>
                }
              </div>
              <div class="flex justify-center gap-4 md:gap-6 mt-2 shrink-0">
                <div class="flex flex-col items-center">
                  <div class="flex items-center gap-1 mb-1">
                    <img src="hombre.svg" class="w-6 h-6 md:w-8 md:h-8">
                    <span class="text-[10px] sm:text-xs font-bold text-gray-500">Hombres</span>
                  </div>
                  <span class="text-sm md:text-base 2xl:text-lg font-black text-gray-800 leading-none">{{ fmt(cardData().male) }}</span>
                  <span class="text-[10px] text-gray-400">{{ fmtD(cardData().total > 0 ? cardData().male / cardData().total * 100 : 0, 1) }}%</span>
                </div>
                <div class="flex flex-col items-center">
                  <div class="flex items-center gap-1 mb-1">
                    <img src="mujer.svg" class="w-6 h-6 md:w-8 md:h-8"
                         style="filter: invert(65%) sepia(30%) saturate(700%) hue-rotate(132deg) brightness(92%) contrast(87%);">
                    <span class="text-[10px] sm:text-xs font-bold text-gray-500">Mujeres</span>
                  </div>
                  <span class="text-sm md:text-base 2xl:text-lg font-black text-gray-800 leading-none">{{ fmt(cardData().female) }}</span>
                  <span class="text-[10px] text-gray-400">{{ fmtD(cardData().total > 0 ? cardData().female / cardData().total * 100 : 0, 1) }}%</span>
                </div>
              </div>
            </div>

            <!-- Grandes Grupos de Edad -->
            <div class="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden
                        min-h-[180px] sm:min-h-[200px] xl:min-h-0">
              <div class="flex justify-between items-center mb-2 shrink-0">
                <h4 class="text-[10px] sm:text-xs font-black text-black tracking-wide leading-tight pr-2">
                  Población por grandes grupos de edad
                </h4>
                <span matTooltip="Por efecto del redondeo de cifras a un decimal, los porcentajes pueden no sumar exactamente 100%"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center shrink-0">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-400"></app-hero-icon>
                </span>
              </div>
              <div class="flex-1 min-h-0">
                @if (isBrowser) {
                  <div echarts [options]="pieOptionsAge" class="w-full h-full"></div>
                }
              </div>
            </div>

            <!-- ── FILA 2: Edad Promedio + Edad Mediana (card fusionado) ── -->
            <div class="col-span-1 bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex items-stretch relative overflow-hidden min-h-[72px] xl:min-h-0 gap-0">

              <!-- Indicador: Edad Promedio -->
              <div class="flex-1 flex flex-col relative min-w-0 pr-2">
                <div class="absolute top-0 right-2 flex items-center gap-1 z-10">
                  <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                    <app-hero-icon [name]="'globe-americas'"
                      (click)="setMapIndicator('edad_promedio')"
                      class="w-4 h-4 cursor-pointer transition-all animate-pulse"
                      [class.animate-none]="activeIndicator() === 'edad_promedio'"
                      [class.scale-125]="activeIndicator() === 'edad_promedio'"
                      [style.color]="activeIndicator() === 'edad_promedio' ? '#0056a1' : '#343b9f'">
                    </app-hero-icon>
                  </span>
                  <span matTooltip="Promedio aritmético de las edades" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                    <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-1 min-h-0 pt-0.5">
                  <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] rounded-lg flex items-center justify-center shrink-0">
                    <img src="epromedio.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                  </div>
                  <div class="min-w-0">
                    <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Edad promedio</div>
                    <div class="text-lg md:text-xl font-black text-gray-800 leading-none mt-0.5">
                      {{ fmtD(cardMock()['edad_promedio'], 1) }}
                      <span class="text-[10px] md:text-xs font-bold text-gray-400">años</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Divisor vertical -->
              <div class="w-px bg-gray-100 self-stretch shrink-0"></div>

              <!-- Indicador: Edad Mediana -->
              <div class="flex-1 flex flex-col relative min-w-0 pl-2">
                <div class="absolute top-0 right-0 flex items-center gap-1 z-10">
                  <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                    <app-hero-icon [name]="'globe-americas'"
                      (click)="setMapIndicator('edad_mediana')"
                      class="w-4 h-4 cursor-pointer transition-all animate-pulse"
                      [class.animate-none]="activeIndicator() === 'edad_mediana'"
                      [class.scale-125]="activeIndicator() === 'edad_mediana'"
                      [style.color]="activeIndicator() === 'edad_mediana' ? '#0056a1' : '#343b9f'">
                    </app-hero-icon>
                  </span>
                  <span matTooltip="Edad que divide la población en dos grupos iguales" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                    <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-1 min-h-0 pt-0.5">
                  <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] rounded-lg flex items-center justify-center shrink-0">
                    <img src="emediana.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                  </div>
                  <div class="min-w-0">
                    <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Edad mediana</div>
                    <div class="text-lg md:text-xl font-black text-gray-800 leading-none mt-0.5">
                      {{ fmtD(cardMock()['edad_mediana'], 1) }}
                      <span class="text-[10px] md:text-xs font-bold text-gray-400">años</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            

            <!-- ── FILA 2 COL 2: Razón hombre-mujer ──────────────────────── -->
            <div class="col-span-1 bg-white rounded-xl px-3 md:px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-[72px] xl:min-h-0">
  
  <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
    <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
      <app-hero-icon 
        [name]="'globe-americas'"
        (click)="setMapIndicator('razon_sexo')"
        class="w-3.5 h-3.5 xl:w-5 xl:h-5 cursor-pointer transition-all animate-pulse"
        [class.animate-none]="activeIndicator() === 'razon_sexo'"
        [class.scale-125]="activeIndicator() === 'razon_sexo'"
        [style.color]="activeIndicator() === 'razon_sexo' ? '#0056a1' : '#343b9f'">
      </app-hero-icon>
    </span>
    <span matTooltip="Número de hombres por cada 100 mujeres" matTooltipClass="custom-tooltip" class="inline-flex items-center">
      <app-hero-icon [name]="'information-circle'" class="w-5.5 h-5.5 text-gray-300"></app-hero-icon>
    </span>
  </div>

  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-none mb-2 shrink-0 text-left">
    Razón hombre – mujer
  </div>

  <div class="flex-1 flex items-center justify-start gap-3 md:gap-4 min-h-0">
    
    <div class="flex items-center gap-2 shrink-0">
      <img src="hombre.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[45px] xl:h-[66px] shrink-0" alt="Hombre">
      <div class="flex flex-col leading-tight items-start">
        <span class="text-[9px] xl:text-xs font-semibold text-gray-500">Hay</span>
        <span class="text-base md:text-lg xl:text-2xl font-black text-[#000000] leading-none">
          {{ fmtD(cardMock()['razon_sexo'], 1) }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <img src="mujer.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[45px] xl:h-[66px] shrink-0" alt="Mujer"
           style="filter: invert(65%) sepia(30%) saturate(700%) hue-rotate(132deg) brightness(92%) contrast(87%);">
      <div class="flex flex-col leading-tight items-start">
        <span class="text-[9px] xl:text-xs font-semibold text-gray-500">por cada</span>
        <span class="text-base md:text-lg xl:text-2xl font-black text-[#000000] leading-none">
          100 <span class="text-[9px] xl:text-xs font-semibold text-gray-500">mujeres</span>
        </span>
      </div>
    </div>
  </div>
</div>

            <!-- ── FILA 3: Índice Envejecimiento + Dep. Total ───────────── -->

            <!-- Índice de Envejecimiento -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[72px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('indice_envejecimiento')"
                    class="w-4 h-4 xl:w-5 xl:h-5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'indice_envejecimiento'"
                    [class.scale-125]="activeIndicator() === 'indice_envejecimiento'"
                    [style.color]="activeIndicator() === 'indice_envejecimiento' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Número de personas de 60 y más años, por cada 100 personas de 0 a 14 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="envejecimiento.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Índice de envejecimiento</div>
                  <div class="text-lg md:text-xl xl:text-2xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['indice_envejecimiento'], 1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Relación Dependencia Total -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[72px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('dep_total')"
                    class="w-4 h-4 xl:w-5 xl:h-5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'dep_total'"
                    [class.scale-125]="activeIndicator() === 'dep_total'"
                    [style.color]="activeIndicator() === 'dep_total' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Número de personas de 0 a 14 años y de 60 y más años, por cada 100 personas de 15 a 59 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="rel_dep_total.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Relación de dependencia total</div>
                  <div class="text-lg md:text-xl xl:text-2xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['dep_total'], 1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ── FILA 4: Dep. Juvenil + Dep. Adulta ──────────────────── -->

            <!-- Relación Dependencia Juvenil -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[72px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('dep_juvenil')"
                    class="w-4 h-4 xl:w-5 xl:h-5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'dep_juvenil'"
                    [class.scale-125]="activeIndicator() === 'dep_juvenil'"
                    [style.color]="activeIndicator() === 'dep_juvenil' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Número de personas de 0 a 14 años, por cada 100 personas de 15 a 59 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="rel_dep_juvenil.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Relación de dependencia juvenil</div>
                  <div class="text-lg md:text-xl xl:text-2xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['dep_juvenil'], 1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Relación Dependencia Adulta -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[72px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('dep_adulta')"
                    class="w-4 h-4 xl:w-5 xl:h-5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'dep_adulta'"
                    [class.scale-125]="activeIndicator() === 'dep_adulta'"
                    [style.color]="activeIndicator() === 'dep_adulta' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Número de personas de 60 y más años, por cada 100 personas de 15 a 59 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="rel_dep_adulta.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Relación de dependencia adulta</div>
                  <div class="text-lg md:text-xl xl:text-2xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['dep_adulta'], 1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ── FILA 5: Densidad Total + Densidad 60+ ────────────────── -->

            <!-- Densidad Población Censada -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[72px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('densidad_total')"
                    class="w-4 h-4 xl:w-5 xl:h-5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'densidad_total'"
                    [class.scale-125]="activeIndicator() === 'densidad_total'"
                    [style.color]="activeIndicator() === 'densidad_total' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Cantidad de habitantes por kilómetro cuadrado"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="densidad_pobtotal.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Densidad de población censada</div>
                  <div class="text-lg md:text-xl xl:text-2xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardData().density, 1) }}
                    <span class="text-[10px] md:text-xs xl:text-sm font-bold text-gray-400">hab/km²</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Densidad Población Adulta Mayor -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[72px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('densidad_65')"
                    class="w-4 h-4 xl:w-5 xl:h-5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'densidad_65'"
                    [class.scale-125]="activeIndicator() === 'densidad_65'"
                    [style.color]="activeIndicator() === 'densidad_65' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Número de habitantes de 60 y más años por kilómetro cuadrado"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="densidad_pam.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[66px] xl:h-[66px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Densidad de la población adulta mayor</div>
                  <div class="text-lg md:text-xl xl:text-2xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['densidad_65'], 2) }}
                    <span class="text-[10px] md:text-xs xl:text-sm font-bold text-gray-400">hab/km²</span>
                  </div>
                </div>
              </div>
            </div>

          </div><!-- /bloque indicadores -->


          <!-- ══ PIRÁMIDE POBLACIONAL ════════════════════════════════════════
               Móvil  : 1 col, altura fija 400px
               Tablet : 1 col, altura fija 420px
               Desktop xl: 2 cols, full height
          ══════════════════════════════════════════════════════════════════ -->
          <div class="col-span-1 md:col-span-1 xl:col-span-2 xl:row-span-2
                      min-h-[380px] sm:min-h-[420px] md:min-h-[460px] xl:min-h-0">
            <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100
                        h-full flex flex-col overflow-hidden relative">
              <div class="flex justify-between items-center mb-3 md:mb-4 shrink-0">
                <h3 class="text-sm md:text-base font-black text-gray-800 tracking-wide">Pirámide poblacional</h3>
                <div class="flex gap-3 md:gap-4 text-xs font-bold">
                  <div class="flex items-center gap-1.5">
                    <img src="hombre.svg" class="w-5 h-5 md:w-6 md:h-6">
                    <span class="text-gray-500">Hombres</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <img src="mujer.svg" class="w-5 h-5 md:w-6 md:h-6"
                         style="filter: invert(65%) sepia(30%) saturate(700%) hue-rotate(132deg) brightness(92%) contrast(87%);">
                    <span class="text-gray-500">Mujeres</span>
                  </div>
                </div>
              </div>
              <div class="flex-1 min-h-0">
                @if (isBrowser) {
                  <div echarts [options]="pyramidOptions" class="w-full h-full"></div>
                }
              </div>
            </div>
          </div><!-- /pirámide -->


          <!-- ══ MAPA ══════════════════════════════════════════════════════════
               Móvil  : 1 col, altura fija 480px
               Tablet : 2 cols (ocupa ambas), altura fija 500px
               Desktop xl: 2 cols, full height con nota al pie
          ══════════════════════════════════════════════════════════════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:row-span-2
                      flex flex-col gap-2
                      min-h-[460px] sm:min-h-[500px] md:min-h-[520px] xl:min-h-0">

            <!-- Mapa SVG -->
            <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100
                        flex flex-col overflow-hidden min-h-0">
              <div class="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">

                <!-- Indicador superior izquierdo -->
                <div class="absolute top-3 left-3 z-10 pointer-events-none select-none">
                  <div class="text-[10px] font-black text-primary tracking-wide mb-0.5">{{ mapIndicatorTitle() }}</div>
                  <div class="text-lg md:text-xl font-black text-gray-900 tracking-tighter leading-none">
                    {{ mapIndicatorValue() }}
                  </div>
                  <div class="text-[9px] font-bold text-gray-400 tracking-wide mt-0.5">{{ activeIndicatorDef().label }}</div>
                </div>

                <app-hero-icon
                  [name]="'information-circle'"
                  class="absolute top-3 right-3 z-20 w-5 h-5 text-gray-400"
                  matTooltip="Seleccionar un departamento para ver sus datos"
                  matTooltipClass="custom-tooltip">
                </app-hero-icon>

                @if (isMapLoading() || isMapLoadingProv() || isMapLoadingDist()) {
                  <div class="flex flex-col items-center gap-3 text-gray-400">
                    <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <span class="text-sm font-bold tracking-wide">Cargando mapa...</span>
                  </div>
                }

                @if ((mapLoadError() || mapLoadErrorProv() || mapLoadErrorDist()) && !isMapLoading() && !isMapLoadingProv() && !isMapLoadingDist()) {
                  <div class="flex flex-col items-center gap-3 p-6 text-center">
                    <div class="w-10 h-10 text-red-400">
                      <app-hero-icon [name]="'exclamation-triangle'" class="w-10 h-10"></app-hero-icon>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-gray-700">No se pudo cargar el mapa</p>
                      <p class="text-xs text-gray-400 mt-1">Verifica que los archivos de geometría estén en <code class="bg-gray-100 px-1 rounded">public/</code></p>
                    </div>
                    <button (click)="reloadActiveGeoJson()"
                      class="text-xs px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                      Reintentar
                    </button>
                  </div>
                }

                @if (mapRegions().length > 0) {

                  <!-- Tooltip región hover/seleccionada -->
                  <div class="absolute top-2 right-2 z-20 pointer-events-none"
                       style="animation: fadeIn 0.15s ease-out">
                    @if (hoveredRegion() || selectedRegion()) {
                      <div class="bg-gray-900/95 text-white p-3 rounded-xl shadow-2xl
                                  min-w-[160px] sm:min-w-[190px] max-w-[200px]
                                  border border-amber-500/50">
                        <div class="text-[8px] text-amber-400 uppercase font-black tracking-widest mb-0.5">
                          {{ nivelGeo() === 'Departamental' ? 'Departamento' : nivelGeo() === 'Provincial' ? 'Provincia' : 'Distrito' }}
                        </div>
                        @if (nivelGeo() === 'Provincial') {
                          <div class="text-[8px] text-gray-400 font-semibold mb-0.5">
                            Dep.: {{ getDepNameForRegion(hoveredRegion() ?? selectedRegion()!) }}
                          </div>
                        }
                        @if (nivelGeo() === 'Distrital') {
                          <div class="text-[8px] text-gray-400 font-semibold mb-0.5">
                            Dep.: {{ getDepNameForRegion(hoveredRegion() ?? selectedRegion()!) }}
                          </div>
                          <div class="text-[8px] text-gray-400 font-semibold mb-0.5">
                            Prov.: {{ getProvNameForRegion(hoveredRegion() ?? selectedRegion()!) }}
                          </div>
                        }
                        <p class="text-sm font-bold text-white border-b border-gray-700 pb-1.5 mb-2 leading-tight">
                          {{ (hoveredRegion() ?? selectedRegion())!.name }}
                        </p>
                        <div class="flex flex-col py-0.5 bg-amber-500/10 rounded px-1 mb-2 gap-0.5">
                          <span class="text-[8px] font-bold uppercase text-amber-300 leading-tight">
                            {{ activeIndicatorDef().label }}
                          </span>
                          <span class="text-sm font-black text-amber-200 leading-none">
                            {{ getActiveValueByKey((hoveredRegion() ?? selectedRegion())!, activeIndicator()) }}
                          </span>
                        </div>
                        <div class="border-t border-gray-700 pt-1.5 mb-1.5">
                          <div class="text-[7px] font-black uppercase text-gray-400 tracking-widest mb-1">Población por sexo</div>
                          <div class="flex justify-between items-center mb-0.5">
                            <span class="text-[8px] font-bold text-[#6fa8d4]">Hombres</span>
                            <span class="text-[8px] font-black text-white">
                              {{ fmt((hoveredRegion() ?? selectedRegion())!.male) }}
                              <span class="text-[7px] font-semibold text-gray-400">
                                ({{ fmtD((hoveredRegion() ?? selectedRegion())!.total > 0
                                    ? (hoveredRegion() ?? selectedRegion())!.male / (hoveredRegion() ?? selectedRegion())!.total * 100
                                    : 0, 1) }}%)
                              </span>
                            </span>
                          </div>
                          <div class="flex justify-between items-center">
                            <span class="text-[8px] font-bold text-[#33b3a9]">Mujeres</span>
                            <span class="text-[8px] font-black text-white">
                              {{ fmt((hoveredRegion() ?? selectedRegion())!.female) }}
                              <span class="text-[7px] font-semibold text-gray-400">
                                ({{ fmtD((hoveredRegion() ?? selectedRegion())!.total > 0
                                    ? (hoveredRegion() ?? selectedRegion())!.female / (hoveredRegion() ?? selectedRegion())!.total * 100
                                    : 0, 1) }}%)
                              </span>
                            </span>
                          </div>
                        </div>
                        <div class="border-t border-gray-700 pt-1.5">
                          <div class="flex flex-col gap-0.5">
                            <span class="text-[8px] font-bold uppercase text-gray-400">
                              Densidad de la población censada
                            </span>
                            <span class="text-[8px] font-black text-white">
                              {{ fmtD((hoveredRegion() ?? selectedRegion())!.density, 1) }}
                              <span class="text-[7px] text-gray-400">hab/km²</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- SVG del mapa -->
                  <svg
                    [attr.viewBox]="svgViewBox()"
                    class="w-full h-full max-h-full"
                    preserveAspectRatio="xMidYMid meet"
                    style="display:block;">

                    <rect width="100%" height="100%" fill="#ffffff" rx="0"/>

                    @for (r of mapRegions(); track r.geoKey) {
                      <path
                        [attr.d]="r.path"
                        [attr.fill]="getRegionFill(r)"
                        stroke="#FFFFFF"
                        [attr.stroke-width]="getStrokeWidth(r)"
                        [attr.opacity]="getRegionOpacity(r)"
                        style="cursor:pointer; transition: opacity 0.15s ease"
                        (click)="onRegionClick(r)"
                        (mouseenter)="onRegionHover(r)"
                        (mouseleave)="onRegionLeave()"
                      />
                    }

                    @if (nivelGeo() !== 'Distrital') {
                      @for (r of mapRegions(); track r.geoKey) {
                        <text
                          [attr.x]="r.center.x"
                          [attr.y]="r.center.y"
                          text-anchor="middle"
                          dominant-baseline="middle"
                          font-size="5.5"
                          font-weight="700"
                          fill="#000000"
                          stroke="#ffffff"
                          stroke-width="2"
                          paint-order="stroke fill"
                          [attr.opacity]="getLabelOpacity(r)"
                          style="pointer-events:none; user-select:none; font-family:-apple-system,sans-serif"
                        >{{ r.name }}</text>
                      }
                    }
                    @if (nivelGeo() === 'Distrital') {
                      @for (r of mapRegions(); track r.geoKey) {
                        <text
                          [attr.x]="r.center.x"
                          [attr.y]="r.center.y"
                          text-anchor="middle"
                          dominant-baseline="middle"
                          font-size="3.5"
                          font-weight="700"
                          fill="#000000"
                          stroke="#ffffff"
                          stroke-width="1.5"
                          paint-order="stroke fill"
                          [attr.opacity]="getLabelOpacity(r)"
                          style="pointer-events:none; user-select:none; font-family:-apple-system,sans-serif"
                        >{{ r.name }}</text>
                      }
                    }
                  </svg>

                  <!-- Leyenda coroplética -->
                  @if (colorBreaks().length) {
                    <div class="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm
                                rounded-xl p-2 md:p-2.5 shadow-lg border border-gray-100 pointer-events-none">
                      <div class="text-[8px] font-black text-gray-400 tracking-widest uppercase leading-tight">
                        {{ activeIndicatorDef().label }}
                      </div>
                      @if (activeIndicatorDef().unit) {
                        <div class="text-[8px] font-semibold text-gray-400 mb-1.5">({{ activeIndicatorDef().unit.trim() }})</div>
                      } @else {
                        <div class="mb-1.5"></div>
                      }
                      <div class="flex flex-col gap-1">
                        @for (brk of colorBreaks().slice().reverse(); track brk.min) {
                          <div class="flex items-center gap-1.5">
                            <div class="w-3.5 h-2.5 md:w-4 md:h-3 rounded-sm shrink-0" [style.background-color]="brk.color"></div>
                            <span class="text-[7px] md:text-[8px] font-semibold text-gray-600 whitespace-nowrap">{{ brk.label }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            </div><!-- /mapa -->

            <!-- Nota metodológica -->
            <div class="shrink-0 bg-white/90 border border-gray-100 rounded-xl
                        px-3 py-2 text-[9px] sm:text-[10px] text-gray-500 leading-relaxed shadow-sm">
              <span class="font-black text-gray-600">Nota:</span>
              1/ Comprende los 43 distritos de la provincia de Lima.
              <br>
              2/ Comprende las provincias de Barranca, Cajatambo, Canta, Cañete, Huaral, Huarochirí, Huaura, Oyón y Yauyos.
            </div>

          </div><!-- /mapa col + nota -->

        </div><!-- /grid principal -->

      </div><!-- /main content wrapper -->
    </section>
  `,
    styles: [`
    :host {
      display: block;
      /* Móvil/Tablet: flujo normal */
      min-height: 100vh;
      overflow: visible;
    }
    /* Desktop xl+: pantalla completa fija */
    @media (min-width: 1280px) {
      :host {
        height: 100vh;
        overflow: hidden;
      }
    }

    ::ng-deep .custom-tooltip {
      background-color: white !important;
      color: #333 !important;
      border-radius: 12px !important;
      padding: 10px 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,.1) !important;
      border: 1px solid #e5e7eb !important;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent implements OnInit {

    // ── Header nav ────────────────────────────────────────────────────────
    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);

    censosMenu = [
        { label: 'Censo de Derecho',  route: '/censo-derecho' },
        { label: 'Características técnicas',  route: '/aspectos-generales' },
        { label: 'Innovaciones censales',      route: '/innovaciones' },
        { label: 'Normatividad censal',        route: '/normativa' },
        { label: 'Documentación Técnica',      route: '/documentacion-tecnica' },
    ];

    @HostListener('document:click')
    onDocumentClick() {
        this.censosOpen.set(false);
        this.mobileMenuOpen.set(false);
    }

    toggleCensos(e: Event) { e.stopPropagation(); this.censosOpen.update(v => !v); }
    toggleMobileMenu(e: Event) { e.stopPropagation(); this.mobileMenuOpen.update(v => !v); }

    // ── ECharts ───────────────────────────────────────────────────────────
    pieOptionsSex:  EChartsOption = {};
    pieOptionsAge:  EChartsOption = {};
    pyramidOptions: EChartsOption = {};

    // ── Dimensiones SVG expuestas al template ─────────────────────────────
    readonly svgW = S.w;
    readonly svgH = S.h;

    // ── Geo selector — nivel + prov + dist ───────────────────────────────
    readonly NIVELES_GEO: NivelGeoType[] = ['Departamental', 'Provincial', 'Distrital'];

    nivelGeo         = signal<NivelGeoType>('Departamental');
    openGeoDropdown  = signal<'dep'|'prov'|'dist'|null>(null);
    selectedProv     = signal<string>('');
    selectedDist     = signal<string>('');

    isGeoProvActive  = computed(() => this.nivelGeo() !== 'Departamental');
    isGeoDistActive  = computed(() => this.nivelGeo() === 'Distrital');

    // REQ 5: Provincias ordenadas por CCDD+CCPP
    provinces = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonProv();
        if (!geo?.features) return [];
        const ccdd = this.selectedCCDD();
        const features = ccdd
            ? (geo.features as any[]).filter(f => String(f.properties.CCDD) === ccdd)
            : (geo.features as any[]);
        return features
            .map(f => ({
                code:    String(f.properties.CCPP),
                name:    String(f.properties.NOMBPROV),
                sortKey: String(f.properties.CCDD) + String(f.properties.CCPP),
            }))
            .sort((a, b) => (a.sortKey ?? '').localeCompare(b.sortKey ?? ''));
    });

    // REQ 5: Distritos ordenados por UBIGEO
    districts = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonDist();
        if (!geo?.features) return [];
        const ccdd = this.selectedCCDD();
        const ccpp = this.selectedProv();
        let features = geo.features as any[];
        if (ccdd) features = features.filter(f => String(f.properties.CCDD) === ccdd);
        if (ccpp) features = features.filter(f => String(f.properties.CCPP) === ccpp);
        return features
            .map(f => ({
                code:    String(f.properties.UBIGEO),
                name:    String(f.properties.NOMBDIST),
                sortKey: String(f.properties.UBIGEO),
            }))
            .sort((a, b) => (a.sortKey ?? '').localeCompare(b.sortKey ?? ''));
    });

    geoDepLabel  = computed(() => {
        const ccdd = this.selectedCCDD();
        if (!ccdd) return 'Todas';
        return this.departments().find(d => d.ccdd === ccdd)?.name ?? ccdd;
    });
    geoProvLabel = computed(() => {
        const code = this.selectedProv();
        if (!code) return 'Todas';
        return this.provinces().find(p => p.code === code)?.name ?? code;
    });
    geoDistLabel = computed(() => {
        const code = this.selectedDist();
        if (!code) return 'Todos';
        return this.districts().find(d => d.code === code)?.name ?? code;
    });

    toggleGeoDropdown(key: 'dep'|'prov'|'dist'): void {
        this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key);
    }
    closeGeoDropdowns(): void { this.openGeoDropdown.set(null); }

    selectDep(dept: { ccdd: string; name: string } | null): void {
        this.selectedCCDD.set(dept?.ccdd ?? '');
        this.selectedProv.set('');
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);

        if (dept) {
            this.nivelGeo.set('Provincial');
            this.loadGeoJsonProv();
            this.fitRegionByCCDD(dept.ccdd);
        } else {
            this.nivelGeo.set('Departamental');
            this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: 0, y: 0, w: S.w, h: S.h });
        }
    }

    private fitRegionByCCDD(ccdd: string): void {
        const tryFit = () => {
            const geo = this.rawGeoJsonProv();
            if (!geo?.features) {
                setTimeout(() => tryFit(), 200);
                return;
            }
            const features = (geo.features as any[]).filter(
                f => String(f.properties.CCDD) === ccdd
            );
            if (!features.length) return;

            let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
            features.forEach(f => {
                const bb = this.getGeoBBox(f.geometry);
                if (bb.minLon < minLon) minLon = bb.minLon;
                if (bb.maxLon > maxLon) maxLon = bb.maxLon;
                if (bb.minLat < minLat) minLat = bb.minLat;
                if (bb.maxLat > maxLat) maxLat = bb.maxLat;
            });

            const toLon = (lon: number) => ((lon - B.minLon) / (B.maxLon - B.minLon)) * S.w;
            const toLat = (lat: number) => (1 - (lat - B.minLat) / (B.maxLat - B.minLat)) * S.h;

            const svgMinX = toLon(minLon);
            const svgMaxX = toLon(maxLon);
            const svgMinY = toLat(maxLat);
            const svgMaxY = toLat(minLat);

            const PAD = 20;
            const target = {
                x: svgMinX - PAD,
                y: svgMinY - PAD,
                w: (svgMaxX - svgMinX) + PAD * 2,
                h: (svgMaxY - svgMinY) + PAD * 2,
            };
            this.animateViewBox(this.parseViewBox(this.svgViewBox()), target);
        };
        tryFit();
    }

    selectProv(code: string): void {
        this.selectedProv.set(code);
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);

        if (code) {
            this.nivelGeo.set('Distrital');
            this.loadGeoJsonDist();
        } else if (this.selectedCCDD()) {
            this.nivelGeo.set('Provincial');
        }
    }

    selectDist(code: string): void {
        this.selectedDist.set(code);
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);
    }

    // ── Estado primitivo ──────────────────────────────────────────────────
    isBrowser             = false;
    selectedCCDD          = signal<string>('');
    selectedMapGeoKey     = signal<string>('');
    isMapLoading          = signal<boolean>(false);
    mapLoadError          = signal<boolean>(false);
    isMapLoadingProv      = signal<boolean>(false);
    mapLoadErrorProv      = signal<boolean>(false);
    isMapLoadingDist      = signal<boolean>(false);
    mapLoadErrorDist      = signal<boolean>(false);

    // ── GeoJSON crudo por nivel ────────────────────────────────────────────
    private rawGeoJson     = signal<any>(null);
    private rawGeoJsonProv = signal<any>(null);
    private rawGeoJsonDist = signal<any>(null);

    private readonly TOTAL_NAC = 36_596_527;

    // ── Estado derivado ────────────────────────────────────────────────────
    svgViewBox = signal<string>(`0 0 ${S.w} ${S.h}`);
    private svgAnimFrame: number | null = null;

    activeIndicator = signal<MapIndicatorKey>('poblacion');

    activeIndicatorDef = computed<IndicatorDef>(
        () => INDICATORS.find(d => d.key === this.activeIndicator())!
    );

    tooltipIndicators = computed<IndicatorDef[]>(() =>
        INDICATORS.filter(i => i.key !== 'densidad_total' && i.key !== 'densidad_65')
    );

    private parsedRegions = computed<Omit<MapRegion, 'color'>[]>(() => {
        const nivel = this.nivelGeo();

        if (nivel === 'Departamental') {
            const geo = this.rawGeoJson();
            if (!geo?.features) return [];
            return (geo.features as any[]).map((f, idx) => {
                const p   = f.properties;
                const svg = this.project(f.geometry);
                return {
                    id:      Number(f.id) || idx,
                    geoKey:  String(p.CCDD),
                    ccdd:    String(p.CCDD),
                    ccpp:    '',
                    ccdi:    '',
                    name:    String(p.NOMBDEP),
                    total:   Number(p.POBTOTAL)  || 0,
                    male:    Number(p.POBHOMBRE) || 0,
                    female:  Number(p.POBMUJER)  || 0,
                    density: Number(p.DENSIDAD)  || 0,
                    path:    svg.path,
                    center:  svg.center,
                };
            });
        }

        if (nivel === 'Provincial') {
            const geo = this.rawGeoJsonProv();
            if (!geo?.features) return [];
            const ccdd     = this.selectedCCDD();
            const features = ccdd
                ? (geo.features as any[]).filter(f => String(f.properties.CCDD) === ccdd)
                : (geo.features as any[]);
            return features.map((f, idx) => {
                const p   = f.properties;
                const svg = this.project(f.geometry);
                return {
                    id:      Number(f.id) || idx,
                    geoKey:  String(p.CCDD) + String(p.CCPP),
                    ccdd:    String(p.CCDD),
                    ccpp:    String(p.CCPP),
                    ccdi:    '',
                    name:    String(p.NOMBPROV),
                    total:   Number(p.POBTOTAL)  || 0,
                    male:    Number(p.POBHOMBRE) || 0,
                    female:  Number(p.POBMUJER)  || 0,
                    density: Number(p.DENSIDAD)  || 0,
                    path:    svg.path,
                    center:  svg.center,
                };
            });
        }

        const geo = this.rawGeoJsonDist();
        if (!geo?.features) return [];
        const ccdd = this.selectedCCDD();
        const ccpp = this.selectedProv();
        let features = geo.features as any[];
        if (ccdd) features = features.filter(f => String(f.properties.CCDD) === ccdd);
        if (ccpp) features = features.filter(f => String(f.properties.CCPP) === ccpp);
        return features.map((f, idx) => {
            const p   = f.properties;
            const svg = this.project(f.geometry);
            return {
                id:      Number(f.id) || idx,
                geoKey:  String(p.UBIGEO),
                ccdd:    String(p.CCDD),
                ccpp:    String(p.CCPP),
                ccdi:    String(p.CCDI),
                name:    String(p.NOMBDIST),
                total:   Number(p.POBTOTAL)  || 0,
                male:    Number(p.POBHOMBRE) || 0,
                female:  Number(p.POBMUJER)  || 0,
                density: Number(p.DENSIDAD)  || 0,
                path:    svg.path,
                center:  svg.center,
            };
        });
    });

    mapRegions = computed<MapRegion[]>(() => {
        const raws = this.parsedRegions();
        const key  = this.activeIndicator();
        if (!raws.length) return [];

        const vals   = raws.map(r => this.getIndicatorValue(r as MapRegion, key));
        const sorted = [...vals].sort((a, b) => a - b);
        const n      = sorted.length;

        const quintileBounds = [0, 1, 2, 3, 4].map(i =>
            sorted[Math.min(Math.floor((i + 1) * n / 5) - 1, n - 1)]
        );

        return raws.map((r, i) => {
            const v = vals[i];
            let tier = 0;
            for (let t = 0; t < 4; t++) {
                if (v > quintileBounds[t]) tier = t + 1;
            }
            return { ...r, color: PALETTE[tier] } as MapRegion;
        });
    });

    departments = computed(() => {
        const geo = this.rawGeoJson();
        if (!geo?.features) return [];

        const raw = (geo.features as any[])
            .map((f: any) => ({
                ccdd: String(f.properties.CCDD),
                name: String(f.properties.NOMBDEP),
            }));

        const isLimaMet  = (d: {name: string}) =>
            d.name.toLowerCase().includes('lima') && !d.name.toLowerCase().includes('región') && !d.name.toLowerCase().includes('region');
        const isRegLima  = (d: {name: string}) =>
            d.name.toLowerCase().includes('región lima') || d.name.toLowerCase().includes('region lima');

        const limaMet  = raw.find(isLimaMet);
        const regLima  = raw.find(isRegLima);
        const resto    = raw.filter(d => !isLimaMet(d) && !isRegLima(d));

        const sorted = [...resto].sort((a, b) => parseInt(a.ccdd, 10) - parseInt(b.ccdd, 10));

        const lambIdx  = sorted.findIndex(d => d.ccdd === '14');
        const insertAt = lambIdx >= 0 ? lambIdx + 1 : sorted.length;

        const extras: typeof sorted = [];
        if (limaMet)  extras.push(limaMet);
        if (regLima)  extras.push(regLima);

        sorted.splice(insertAt, 0, ...extras);

        return sorted;
    });

    colorBreaks = computed<ColorBreak[]>(() => {
        const regions = this.mapRegions();
        const key     = this.activeIndicator();
        const def     = this.activeIndicatorDef();
        if (!regions.length) return [];

        const vals   = regions.map(r => this.getIndicatorValue(r, key));
        const sorted = [...vals].sort((a, b) => a - b);
        const n      = sorted.length;

        const fmtVal = (v: number): string => {
            if (key === 'poblacion') return this.fmt(v);
            return this.fmtD(v, def.decimals);
        };

        return Array.from({ length: 5 }, (_, i) => {
            const startIdx = Math.floor(i * n / 5);
            const endIdx   = Math.min(Math.floor((i + 1) * n / 5) - 1, n - 1);
            const bMin     = sorted[startIdx];
            const bMax     = sorted[endIdx];
            const count    = vals.filter(v => v >= bMin && v <= bMax).length;
            const label    = `${fmtVal(bMin)} – ${fmtVal(bMax)} (${count})`;
            return { min: bMin, max: bMax, color: PALETTE[i], label, count };
        });
    });

    selectedRegion = computed<MapRegion | null>(() => {
        const key = this.selectedMapGeoKey();
        if (!key) return null;
        return this.mapRegions().find(r => r.geoKey === key) ?? null;
    });

    cardData = computed<{ total: number; male: number; female: number; density: number; ccdd: string }>(() => {
        const sel = this.selectedRegion();
        if (sel) return { total: sel.total, male: sel.male, female: sel.female, density: sel.density, ccdd: sel.ccdd };

        const dist = this.selectedDist();
        if (dist) {
            const geo = this.rawGeoJsonDist();
            const feat = geo?.features?.find((f: any) => String(f.properties.UBIGEO) === dist);
            if (feat) {
                const p = feat.properties;
                return { total: Number(p.POBTOTAL)||0, male: Number(p.POBHOMBRE)||0, female: Number(p.POBMUJER)||0, density: Number(p.DENSIDAD)||0, ccdd: String(p.CCDD) };
            }
        }

        const prov = this.selectedProv();
        if (prov) {
            const geo = this.rawGeoJsonProv();
            const feat = geo?.features?.find((f: any) => String(f.properties.CCPP) === prov);
            if (feat) {
                const p = feat.properties;
                return { total: Number(p.POBTOTAL)||0, male: Number(p.POBHOMBRE)||0, female: Number(p.POBMUJER)||0, density: Number(p.DENSIDAD)||0, ccdd: String(p.CCDD) };
            }
        }

        const ccdd = this.selectedCCDD();
        if (ccdd) {
            const geo = this.rawGeoJson();
            const feat = geo?.features?.find((f: any) => String(f.properties.CCDD) === ccdd);
            if (feat) {
                const p = feat.properties;
                return { total: Number(p.POBTOTAL)||0, male: Number(p.POBHOMBRE)||0, female: Number(p.POBMUJER)||0, density: Number(p.DENSIDAD)||0, ccdd: String(p.CCDD) };
            }
        }

        return { total: this.TOTAL_NAC, male: 17_596_527, female: 18_999_999, density: 25.4, ccdd: '' };
    });

    cardMock = computed<Record<string, number>>(() => {
        const ccdd = this.cardData().ccdd;
        if (ccdd && MOCK_DEP[ccdd]) return MOCK_DEP[ccdd];
        return { edad_promedio: 31.2, edad_mediana: 29.8, razon_sexo: 94.3, indice_envejecimiento: 45.6, dep_total: 52.1, dep_juvenil: 34.2, dep_adulta: 17.9, densidad_65: 3.6 };
    });

    displayedTitle = computed<string>(() => {
        const sel = this.selectedRegion();
        if (sel) return sel.name;
        const dist = this.selectedDist();
        if (dist) return this.districts().find(d => d.code === dist)?.name ?? dist;
        const prov = this.selectedProv();
        if (prov) return this.provinces().find(p => p.code === prov)?.name ?? prov;
        const ccdd = this.selectedCCDD();
        if (ccdd) return this.departments().find(d => d.ccdd === ccdd)?.name ?? 'Perú (Nacional)';
        return 'Perú (Nacional)';
    });

    displayedPopulation = computed<string>(() => {
        return this.fmt(this.cardData().total);
    });

    // ── Inyecciones ───────────────────────────────────────────────────────
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);

    constructor() {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    ngOnInit(): void {
        this.initCharts();
        this.loadGeoJson();
    }

    // ── Carga del GeoJSON por nivel ───────────────────────────────────────
    loadGeoJson(): void {
        if (this.rawGeoJson()) return;
        this.isMapLoading.set(true);
        this.mapLoadError.set(false);
        this.http.get<any>('/departamento_geometria.json').subscribe({
            next:  data => { this.rawGeoJson.set(data); this.isMapLoading.set(false); },
            error: ()   => { this.isMapLoading.set(false); this.mapLoadError.set(true); },
        });
    }

    loadGeoJsonProv(): void {
        if (this.rawGeoJsonProv()) return;
        this.isMapLoadingProv.set(true);
        this.mapLoadErrorProv.set(false);
        this.http.get<any>('/provincia_geometria.json').subscribe({
            next:  data => { this.rawGeoJsonProv.set(data); this.isMapLoadingProv.set(false); },
            error: ()   => { this.isMapLoadingProv.set(false); this.mapLoadErrorProv.set(true); },
        });
    }

    loadGeoJsonDist(): void {
        if (this.rawGeoJsonDist()) return;
        this.isMapLoadingDist.set(true);
        this.mapLoadErrorDist.set(false);
        this.http.get<any>('/distrito_geometria.json').subscribe({
            next:  data => { this.rawGeoJsonDist.set(data); this.isMapLoadingDist.set(false); },
            error: ()   => { this.isMapLoadingDist.set(false); this.mapLoadErrorDist.set(true); },
        });
    }

    reloadActiveGeoJson(): void {
        const nivel = this.nivelGeo();
        if (nivel === 'Departamental') {
            this.rawGeoJson.set(null);
            this.loadGeoJson();
        } else if (nivel === 'Provincial') {
            this.rawGeoJsonProv.set(null);
            this.loadGeoJsonProv();
        } else {
            this.rawGeoJsonDist.set(null);
            this.loadGeoJsonDist();
        }
    }

    // ── Formateadores ─────────────────────────────────────────────────────
    fmt(n: number): string {
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    fmtD(n: number, dec = 1): string {
        return n.toFixed(dec).replace('.', ',');
    }
    fmtPct(n: number, dec = 1): string {
        return n.toFixed(dec).replace('.', ',') + '%';
    }

    // ── Proyección GeoJSON → SVG ──────────────────────────────────────────
    private project(geom: any): { path: string; center: { x: number; y: number } } {
        if (!geom) return { path: '', center: { x: 0, y: 0 } };

        let path = '';
        let sx = 0, sy = 0, n = 0;

        const pt = (c: number[]) => ({
            x: ((c[0] - B.minLon) / (B.maxLon - B.minLon)) * S.w,
            y: (1 - (c[1] - B.minLat) / (B.maxLat - B.minLat)) * S.h,
        });

        const ring = (coords: number[][]) => {
            let s = '';
            coords.forEach((c, i) => {
                const p = pt(c);
                s += (i === 0 ? 'M' : 'L') + `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
                sx += p.x; sy += p.y; n++;
            });
            return s + 'Z ';
        };

        if (geom.type === 'Polygon') {
            geom.coordinates.forEach((r: number[][]) => (path += ring(r)));
        } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach((poly: number[][][]) =>
                poly.forEach((r: number[][]) => (path += ring(r)))
            );
        }

        return { path, center: { x: n ? sx / n : 0, y: n ? sy / n : 0 } };
    }

    // ── Helpers de estilo SVG ─────────────────────────────────────────────
    getRegionFill(r: MapRegion): string {
        const selKey = this.selectedRegion()?.geoKey;
        if (selKey === r.geoKey) return '#f8bd13';
        return r.color;
    }

    getRegionOpacity(r: MapRegion): string {
        const sel = this.selectedRegion();
        if (sel) return sel.geoKey === r.geoKey ? '1' : '0.35';
        return '0.88';
    }

    getStrokeWidth(r: MapRegion): string {
        if (this.selectedRegion()?.geoKey === r.geoKey) return '1.2';
        const nivel = this.nivelGeo();
        if (nivel === 'Provincial' || nivel === 'Distrital') return '0.5';
        return '0.8';
    }

    getLabelOpacity(r: MapRegion): string {
        const sel = this.selectedRegion();
        if (sel) return sel.geoKey === r.geoKey ? '1' : '0.15';
        return '1';
    }

    onRegionClick(r: MapRegion): void {
        if (this.selectedMapGeoKey() === r.geoKey) {
            this.selectedMapGeoKey.set('');
            this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: 0, y: 0, w: S.w, h: S.h });
        } else {
            this.selectedMapGeoKey.set(r.geoKey);
            this.fitRegion(r);
            const nivel = this.nivelGeo();
            if (nivel === 'Departamental') {
                this.selectedCCDD.set(r.ccdd);
                this.nivelGeo.set('Provincial');
                this.loadGeoJsonProv();
            } else if (nivel === 'Provincial') {
                this.selectedProv.set(r.ccpp);
                this.nivelGeo.set('Distrital');
                this.loadGeoJsonDist();
            } else {
                this.selectedDist.set(r.geoKey);
            }
        }
    }

    resetFilters(): void {
        this.selectedCCDD.set('');
        this.selectedMapGeoKey.set('');
        this.selectedProv.set('');
        this.selectedDist.set('');
        this.nivelGeo.set('Departamental');
        this.openGeoDropdown.set(null);
        this.activeIndicator.set('poblacion');
        this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: 0, y: 0, w: S.w, h: S.h });
    }

    // ── Indicador de mapa ─────────────────────────────────────────────────
    getIndicatorValue(r: MapRegion, key: MapIndicatorKey): number {
        if (key === 'poblacion')      return r.total;
        if (key === 'densidad_total') return r.density;
        return MOCK_DEP[r.ccdd]?.[key as string] ?? 0;
    }

    getActiveValue(r: MapRegion): string {
        const key = this.activeIndicator();
        const def = this.activeIndicatorDef();
        const v   = this.getIndicatorValue(r, key);
        return key === 'poblacion' ? this.fmt(v) : this.fmtD(v, def.decimals) + def.unit;
    }

    getActiveValueByKey(r: MapRegion, key: MapIndicatorKey): string {
        const def = INDICATORS.find(d => d.key === key)!;
        const v   = this.getIndicatorValue(r, key);
        return key === 'poblacion' ? this.fmt(v) : this.fmtD(v, def.decimals) + def.unit;
    }

    setMapIndicator(key: MapIndicatorKey): void {
        this.activeIndicator.set(key);
    }

    getDepNameForRegion(r: MapRegion): string {
        return this.departments().find(d => d.ccdd === r.ccdd)?.name ?? r.ccdd;
    }

    getProvNameForRegion(r: MapRegion): string {
        const geo = this.rawGeoJsonProv();
        if (!geo?.features) return r.ccpp;
        const feat = (geo.features as any[]).find(f =>
            String(f.properties.CCDD) === r.ccdd && String(f.properties.CCPP) === r.ccpp
        );
        return feat ? String(feat.properties.NOMBPROV) : r.ccpp;
    }

    // ── Hover sobre polígonos del mapa ────────────────────────────────────
    hoveredRegion = signal<MapRegion | null>(null);

    onRegionHover(r: MapRegion): void { this.hoveredRegion.set(r); }
    onRegionLeave(): void             { this.hoveredRegion.set(null); }

    // ── Indicador superior izquierdo del mapa ─────────────────────────────
    mapIndicatorTitle = computed<string>(() => {
        const sel = this.selectedRegion();
        if (sel) return sel.name;
        const ccdd = this.selectedCCDD();
        if (ccdd) return this.departments().find(d => d.ccdd === ccdd)?.name ?? 'Perú (Nacional)';
        return 'Perú (Nacional)';
    });

    mapIndicatorValue = computed<string>(() => {
        const sel = this.selectedRegion();
        const key = this.activeIndicator();
        const def = this.activeIndicatorDef();
        if (sel) {
            const v = this.getIndicatorValue(sel, key);
            return key === 'poblacion' ? this.fmt(v) : this.fmtD(v, def.decimals) + def.unit;
        }
        if (key === 'poblacion') return this.fmt(this.TOTAL_NAC);
        const NACIONAL: Partial<Record<MapIndicatorKey, number>> = {
            edad_promedio: 31.2, edad_mediana: 29.8, razon_sexo: 94.3,
            indice_envejecimiento: 45.6, dep_total: 52.1, dep_juvenil: 34.2,
            dep_adulta: 17.9, densidad_total: 25.4, densidad_65: 3.6,
        };
        const v = NACIONAL[key];
        return v !== undefined ? this.fmtD(v, def.decimals) + def.unit : '—';
    });

    // ── SVG fitBounds ─────────────────────────────────────────────────────
    private fitRegion(r: MapRegion): void {
        const nivel = this.nivelGeo();
        let geo: any;
        let matchFn: (f: any) => boolean;

        if (nivel === 'Departamental') {
            geo = this.rawGeoJson();
            matchFn = (f) => String(f.properties.CCDD) === r.geoKey;
        } else if (nivel === 'Provincial') {
            geo = this.rawGeoJsonProv();
            matchFn = (f) => String(f.properties.CCDD) + String(f.properties.CCPP) === r.geoKey;
        } else {
            geo = this.rawGeoJsonDist();
            matchFn = (f) => String(f.properties.UBIGEO) === r.geoKey;
        }

        if (!geo?.features) return;
        const feature = geo.features.find((f: any) => matchFn(f));
        if (!feature) return;

        const bb = this.getGeoBBox(feature.geometry);

        const toLon = (lon: number) => ((lon - B.minLon) / (B.maxLon - B.minLon)) * S.w;
        const toLat = (lat: number) => (1 - (lat - B.minLat) / (B.maxLat - B.minLat)) * S.h;

        const svgMinX = toLon(bb.minLon);
        const svgMaxX = toLon(bb.maxLon);
        const svgMinY = toLat(bb.maxLat);
        const svgMaxY = toLat(bb.minLat);

        const PAD = 50;
        const target = {
            x: svgMinX - PAD,
            y: svgMinY - PAD,
            w: (svgMaxX - svgMinX) + PAD * 2,
            h: (svgMaxY - svgMinY) + PAD * 2,
        };

        this.animateViewBox(this.parseViewBox(this.svgViewBox()), target);
    }

    private getGeoBBox(geom: any): { minLon: number; maxLon: number; minLat: number; maxLat: number } {
        let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;

        const processCoord = (c: number[]) => {
            if (c[0] < minLon) minLon = c[0];
            if (c[0] > maxLon) maxLon = c[0];
            if (c[1] < minLat) minLat = c[1];
            if (c[1] > maxLat) maxLat = c[1];
        };

        const processRing = (ring: number[][]) => ring.forEach(processCoord);

        if (geom.type === 'Polygon') {
            geom.coordinates.forEach((ring: number[][]) => processRing(ring));
        } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach((poly: number[][][]) =>
                poly.forEach((ring: number[][]) => processRing(ring))
            );
        }

        return { minLon, maxLon, minLat, maxLat };
    }

    private parseViewBox(vb: string): { x: number; y: number; w: number; h: number } {
        const [x, y, w, h] = vb.split(' ').map(Number);
        return { x, y, w, h };
    }

    private animateViewBox(
        from: { x: number; y: number; w: number; h: number },
        to:   { x: number; y: number; w: number; h: number },
        duration = 500
    ): void {
        if (!this.isBrowser) return;

        if (this.svgAnimFrame !== null) {
            cancelAnimationFrame(this.svgAnimFrame);
            this.svgAnimFrame = null;
        }

        const start = performance.now();

        const tick = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const x = from.x + (to.x - from.x) * ease;
            const y = from.y + (to.y - from.y) * ease;
            const w = from.w + (to.w - from.w) * ease;
            const h = from.h + (to.h - from.h) * ease;

            this.svgViewBox.set(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);

            if (t < 1) {
                this.svgAnimFrame = requestAnimationFrame(tick);
            } else {
                this.svgAnimFrame = null;
            }
        };

        this.svgAnimFrame = requestAnimationFrame(tick);
    }

    // ── Gráficos ECharts ──────────────────────────────────────────────────
    initCharts(): void {

        this.pieOptionsSex = {
            tooltip: {
                show: true,
                trigger: 'item',
                formatter: (params: any) => {
                    const total = 18999999 + 17596527;
                    const abs   = params.value as number;
                    const pct   = ((abs / total) * 100).toFixed(1).replace('.', ',');
                    const absStr = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:4px">${params.name}</div>
                            <div style="font-size:13px;font-weight:900;color:${params.color}">${absStr}</div>
                            <div style="font-size:10px;font-weight:700;color:#9ca3af">${pct}%</div>`;
                },
            },
            legend:  { show: false },
            color:   ['#33b3a9', '#0056a1'],
            series: [{
                name: 'Sexo', type: 'pie', radius: ['50%', '80%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                data: [
                    { value: 18999999, name: 'Mujeres' },
                    { value: 17596527, name: 'Hombres' },
                ],
            }],
        };

        this.pieOptionsAge = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'none' },
                formatter: (params: any) => {
                    const p   = params[0];
                    const abs = [3274648, 12618546, 2587238][p.dataIndex] ?? 0;
                    const pct = ['17,7%', '68,3%', '14,0%'][p.dataIndex] ?? '';
                    const absStr = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div>
                  <div style="font-size:12px;font-weight:700;color:${p.color}">${absStr} <span style="color:#9ca3af;font-size:10px">(${pct})</span></div>`;
                },
            },
            grid: { top: 26, right: 6, bottom: 22, left: 6, containLabel: true },
            xAxis: {
                type: 'category',
                data: ['0–14 años', '15–59 años', '60 y más años'],
                axisTick:  { show: false },
                axisLine:  { show: false },
                axisLabel: {
                    fontSize: 9,
                    fontWeight: 'bold',
                    color: '#9ca3af',
                    interval: 0,
                    overflow: 'truncate',
                },
            },
            yAxis: {
                type: 'value',
                show: false,
                max: (val: any) => Math.round(val.max * 1.55),
            },
            series: [{
                name: 'Población Censada',
                type: 'bar',
                barMaxWidth: 40,
                barCategoryGap: '28%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                label: {
                    show: true,
                    position: 'top',
                    formatter: (p: any) => {
                        const absVals = [3274648, 12618546, 2587238];
                        const pcts    = ['17,7%', '68,3%', '14,0%'];
                        const abs     = absVals[p.dataIndex] ?? 0;
                        const pct     = pcts[p.dataIndex] ?? '';
                        const absStr  = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                        return `{abs|${absStr}}\n{pct|${pct}}`;
                    },
                    rich: {
                        abs: { fontSize: 8,  fontWeight: 'bold', color: '#6b7280', lineHeight: 11 },
                        pct: { fontSize: 9,  fontWeight: 'bold', color: '#6b7280', lineHeight: 13 },
                    },
                },
                data: [
                    { value: 3274648,  itemStyle: { color: '#038dd3' } },
                    { value: 12618546, itemStyle: { color: '#caeae4' } },
                    { value: 2587238,  itemStyle: { color: '#8383fd' } },
                ],
            }],
        };

        const ageGroups  = ['0-4 años','5-9 años','10-14 años','15-19 años','20-24 años','25-29 años','30-34 años','35-39 años','40-44 años','45-49 años','50-54 años','55-59 años','60-64 años','65-69 años','70-74 años','75-79 años','80-84 años','85 y más años'];
        const maleData   = [-2.5,-2.8,-3.0,-3.2,-3.5,-3.8,-4.0,-3.8,-3.5,-3.2,-3.0,-2.8,-2.5,-2.0,-1.5,-1.0,-0.5,-0.5];
        const femaleData = [ 2.4, 2.7, 2.9, 3.1, 3.4, 3.7, 3.9, 3.7, 3.4, 3.1, 2.9, 2.7, 2.4, 1.9, 1.4, 0.9, 0.4, 0.4];

        const TOTAL     = this.TOTAL_NAC;
        const maleAbs   = maleData.map(v  => Math.round(Math.abs(v) / 100 * TOTAL));
        const femaleAbs = femaleData.map(v => Math.round(v           / 100 * TOTAL));

        this.pyramidOptions = {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter(params: any): string {
                    let html = `<div style="font-weight:900;font-size:10px;margin-bottom:4px">${params[0].name}</div>`;
                    params.forEach((p: any) => {
                        const absVal = Number(p.data?.abs ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                        const pct    = Math.abs(p.value).toFixed(1).replace('.', ',');
                        html += `<div style="display:flex;justify-content:space-between;gap:16px;font-size:9px;margin-top:2px">
              <span style="color:#9ca3af;font-weight:600">${p.seriesName}</span>
              <span style="font-weight:900">${absVal} <span style="color:#9ca3af;font-weight:500">(${pct}%)</span></span>
            </div>`;
                    });
                    return html;
                },
            },
            grid: { left: 0, right: 0, bottom: 0, top: 0, containLabel: true },
            xAxis: [{
                type: 'value',
                min: -5,
                max:  5,
                interval: 1,
                axisLine:  { show: true, lineStyle: { color: '#d1d5db', width: 1 } },
                axisTick:  { show: true, lineStyle: { color: '#d1d5db' } },
                splitLine: { show: true, lineStyle: { color: '#f3f4f6', type: 'dashed' } },
                axisLabel: {
                    show: true,
                    fontSize: 8,
                    fontWeight: 'bold',
                    color: '#9ca3af',
                    formatter: (v: number) => v === 0 ? '0' : Math.abs(v) + '%',
                },
            }],
            yAxis: [{
                type: 'category',
                data: ageGroups,
                axisTick:  { show: false },
                axisLine:  { show: true, lineStyle: { color: '#d1d5db', width: 1 } },
                axisLabel: { fontSize: 8.5, fontWeight: 'bold', color: '#6b7280', margin: 6 },
                splitLine: { show: false },
            }],
            graphic: [{
                type: 'text',
                left: 4,
                top: 2,
                style: {
                    text: 'Edad',
                    fontSize: 8.5,
                    fontWeight: 'bold',
                    fill: '#6b7280',
                    fontFamily: '-apple-system, sans-serif',
                },
            }],
            series: [
                {
                    name: 'Hombres', type: 'bar', stack: 'Total',
                    data: maleData.map((v, i) => ({ value: v, abs: maleAbs[i] })),
                    itemStyle: { color: '#0056a1', borderRadius: [4, 0, 0, 4] },
                    label: { show: false },                    
                },
                {
                    name: 'Mujeres', type: 'bar', stack: 'Total',
                    data: femaleData.map((v, i) => ({ value: v, abs: femaleAbs[i] })),
                    itemStyle: { color: '#33b3a9', borderRadius: [0, 4, 4, 0] },
                    label: { show: false },
                },
                {
                    name: '_center',
                    type: 'line',
                    data: ageGroups.map(() => 0),
                    symbol: 'none',
                    lineStyle: { color: '#9ca3af', width: 1.5, type: 'solid' },
                    tooltip: { show: false },
                    silent: true,
                    z: 10,
                },
            ],
        };
    }
}