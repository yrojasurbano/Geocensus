/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    PLATFORM_ID,
    inject,
    signal,
    computed,
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
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

// ── Interfaces ──────────────────────────────────────────────────────────────
interface MapRegion {
    id: number;
    /** Clave única según nivel: ccdd(2) | ccdd+ccpp(4) | ubigeo(6) */
    geoKey: string;
    ccdd: string;    // siempre el código de departamento (2 dígitos)
    ccpp: string;    // código de provincia (2 dígitos; vacío en nivel dept)
    ccdi: string;    // código de distrito (2 dígitos; vacío en nivel dept/prov)
    name: string;
    total: number;
    male: number;
    female: number;
    density: number;
    path: string;
    center: { x: number; y: number };
    color: string;   // color coroplético asignado
}

/** Opción de selección en los dropdowns de provincia y distrito */
interface GeoOption {
    code: string;    // ccpp para provincias; ubigeo para distritos
    name: string;
}

interface ColorBreak {
    min: number;
    max: number;
    color: string;
    label: string;
}

// ── Indicadores de mapa ─────────────────────────────────────────────────────
type MapIndicatorKey =
    | 'poblacion' | 'edad_media' | 'edad_mediana' | 'razon_sexo'
    | 'indice_envejecimiento' | 'dep_total' | 'dep_juvenil' | 'dep_adulta'
    | 'densidad_total' | 'densidad_65';

interface IndicatorDef {
    key: MapIndicatorKey;
    label: string;
    unit: string;
    decimals: number;
}

const INDICATORS: IndicatorDef[] = [
    { key: 'poblacion',             label: 'Población Censada',           unit: '',         decimals: 0 },
    { key: 'edad_media',            label: 'Edad Media',                unit: ' años',    decimals: 1 },
    { key: 'edad_mediana',          label: 'Edad Mediana',              unit: ' años',    decimals: 1 },
    { key: 'razon_sexo',            label: 'Razón de Sexo H/M',        unit: '',         decimals: 1 },
    { key: 'indice_envejecimiento', label: 'Índice de Envejecimiento',  unit: '%',        decimals: 1 },
    { key: 'dep_total',             label: 'Rel. Dependencia Total',    unit: '%',        decimals: 1 },
    { key: 'dep_juvenil',           label: 'Rel. Dependencia Juvenil',  unit: '%',        decimals: 1 },
    { key: 'dep_adulta',            label: 'Rel. Dependencia Adulta',   unit: '%',        decimals: 1 },
    { key: 'densidad_total',        label: 'Densidad Pob. Censada',       unit: ' hab/km²', decimals: 1 },
    { key: 'densidad_65',           label: 'Densidad Pob. 60+',        unit: ' hab/km²', decimals: 2 },
];

// Datos mock por departamento (ccdd '01'–'25')
const MOCK_DEP: Record<string, Record<string, number>> = {
    '01':{ edad_media:28.4,edad_mediana:25.8,razon_sexo:101.2,indice_envejecimiento:28.4,dep_total:62.1,dep_juvenil:50.3,dep_adulta:11.8,densidad_65:1.4 },
    '02':{ edad_media:30.2,edad_mediana:27.6,razon_sexo:97.8, indice_envejecimiento:38.2,dep_total:58.4,dep_juvenil:44.6,dep_adulta:13.8,densidad_65:2.3 },
    '03':{ edad_media:26.9,edad_mediana:24.1,razon_sexo:95.4, indice_envejecimiento:29.6,dep_total:65.3,dep_juvenil:52.8,dep_adulta:12.5,densidad_65:1.2 },
    '04':{ edad_media:32.5,edad_mediana:29.8,razon_sexo:98.6, indice_envejecimiento:46.3,dep_total:51.8,dep_juvenil:38.4,dep_adulta:13.4,densidad_65:3.1 },
    '05':{ edad_media:27.3,edad_mediana:24.5,razon_sexo:94.1, indice_envejecimiento:30.2,dep_total:64.7,dep_juvenil:52.1,dep_adulta:12.6,densidad_65:1.3 },
    '06':{ edad_media:26.5,edad_mediana:23.8,razon_sexo:96.3, indice_envejecimiento:27.4,dep_total:67.2,dep_juvenil:55.4,dep_adulta:11.8,densidad_65:1.8 },
    '07':{ edad_media:33.8,edad_mediana:31.2,razon_sexo:99.1, indice_envejecimiento:52.4,dep_total:48.6,dep_juvenil:34.8,dep_adulta:13.8,densidad_65:6.9 },
    '08':{ edad_media:28.1,edad_mediana:25.4,razon_sexo:96.8, indice_envejecimiento:31.5,dep_total:62.8,dep_juvenil:50.4,dep_adulta:12.4,densidad_65:2.1 },
    '09':{ edad_media:25.8,edad_mediana:23.1,razon_sexo:93.2, indice_envejecimiento:26.8,dep_total:68.4,dep_juvenil:56.8,dep_adulta:11.6,densidad_65:1.0 },
    '10':{ edad_media:27.1,edad_mediana:24.3,razon_sexo:97.4, indice_envejecimiento:28.9,dep_total:65.8,dep_juvenil:53.4,dep_adulta:12.4,densidad_65:1.5 },
    '11':{ edad_media:32.1,edad_mediana:29.4,razon_sexo:98.4, indice_envejecimiento:44.6,dep_total:53.2,dep_juvenil:39.8,dep_adulta:13.4,densidad_65:2.8 },
    '12':{ edad_media:29.4,edad_mediana:26.7,razon_sexo:98.1, indice_envejecimiento:36.4,dep_total:59.6,dep_juvenil:46.2,dep_adulta:13.4,densidad_65:2.1 },
    '13':{ edad_media:30.8,edad_mediana:28.1,razon_sexo:97.6, indice_envejecimiento:40.2,dep_total:56.4,dep_juvenil:42.8,dep_adulta:13.6,densidad_65:3.4 },
    '14':{ edad_media:31.4,edad_mediana:28.7,razon_sexo:96.8, indice_envejecimiento:41.8,dep_total:54.8,dep_juvenil:41.2,dep_adulta:13.6,densidad_65:3.2 },
    '15':{ edad_media:34.2,edad_mediana:31.5,razon_sexo:96.4, indice_envejecimiento:56.8,dep_total:47.2,dep_juvenil:32.8,dep_adulta:14.4,densidad_65:7.2 },
    '16':{ edad_media:27.6,edad_mediana:24.9,razon_sexo:104.8,indice_envejecimiento:27.6,dep_total:63.4,dep_juvenil:51.8,dep_adulta:11.6,densidad_65:0.8 },
    '17':{ edad_media:28.3,edad_mediana:25.6,razon_sexo:108.4,indice_envejecimiento:24.8,dep_total:60.8,dep_juvenil:50.4,dep_adulta:10.4,densidad_65:0.6 },
    '18':{ edad_media:34.6,edad_mediana:32.1,razon_sexo:102.4,indice_envejecimiento:51.2,dep_total:49.4,dep_juvenil:36.2,dep_adulta:13.2,densidad_65:2.4 },
    '19':{ edad_media:28.7,edad_mediana:26.0,razon_sexo:104.2,indice_envejecimiento:30.8,dep_total:61.4,dep_juvenil:49.8,dep_adulta:11.6,densidad_65:1.1 },
    '20':{ edad_media:30.1,edad_mediana:27.4,razon_sexo:96.2, indice_envejecimiento:37.8,dep_total:58.8,dep_juvenil:45.4,dep_adulta:13.4,densidad_65:2.6 },
    '21':{ edad_media:27.4,edad_mediana:24.7,razon_sexo:96.8, indice_envejecimiento:29.4,dep_total:64.2,dep_juvenil:52.4,dep_adulta:11.8,densidad_65:1.2 },
    '22':{ edad_media:28.9,edad_mediana:26.2,razon_sexo:102.6,indice_envejecimiento:28.2,dep_total:61.8,dep_juvenil:50.6,dep_adulta:11.2,densidad_65:1.4 },
    '23':{ edad_media:33.4,edad_mediana:30.7,razon_sexo:100.8,indice_envejecimiento:48.6,dep_total:50.4,dep_juvenil:37.2,dep_adulta:13.2,densidad_65:3.6 },
    '24':{ edad_media:30.6,edad_mediana:27.9,razon_sexo:103.4,indice_envejecimiento:34.8,dep_total:57.6,dep_juvenil:45.2,dep_adulta:12.4,densidad_65:2.1 },
    '25':{ edad_media:28.8,edad_mediana:26.1,razon_sexo:105.6,indice_envejecimiento:26.4,dep_total:61.2,dep_juvenil:50.8,dep_adulta:10.4,densidad_65:0.9 },
};

// ── Paleta coroplética: primario → secundario ───────────────────────────────
const PALETTE = ['#0056a1', '#1a75aa', '#248cb3', '#2da3b0', '#33b3a9'];

// ── Tipos de selección geográfica ──────────────────────────────────────────
export type NivelGeoType = 'Departamental' | 'Provincial' | 'Distrital';

// ── Bounds geográficos de Perú ──────────────────────────────────────────────
const B = { minLon: -81.5, maxLon: -68.5, minLat: -18.5, maxLat: 0.3 };

// ── Dimensiones del canvas SVG ──────────────────────────────────────────────
const S = { w: 380, h: 550 };


@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
    providers: [provideEchartsCore({ echarts })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section class="bg-[#f4f7f9] h-screen w-full flex flex-col font-sans text-gray-800 overflow-auto md:overflow-hidden"
             (click)="closeGeoDropdowns()">

      <header class="bg-white shadow-sm px-4 md:px-6 2xl:px-8 py-3 md:py-2 2xl:py-3 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 relative md:sticky top-0 z-50 h-auto md:h-16 2xl:h-[72px] shrink-0">
        <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI" class="h-10 md:h-12 2xl:h-14 w-auto object-contain">
          </div>
          <div class="h-6 md:h-8 w-px bg-gray-200 mx-1 md:mx-2"></div>
          <div class="flex items-center">
            <img src="logo_cpv.png" alt="Logo CPV 2025" class="h-10 md:h-12 2xl:h-14 w-auto object-contain">
          </div>
        </div>
        <div class="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-end">
          <div class="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              class="px-4 py-1.5 2xl:px-6 2xl:py-2 rounded-lg text-sm 2xl:text-base font-bold transition-all shadow-sm bg-gradient-to-r from-[#0056a1] to-[#33b3a9] text-white tracking-wide cursor-default">
              Primeros Resultados
            </button>
            <button
              routerLink="/comparativa"
              class="px-4 py-1.5 2xl:px-6 2xl:py-2 rounded-lg text-sm 2xl:text-base font-bold transition-all text-gray-400 hover:text-gray-600 tracking-wide">
              Comparativo Territorial
            </button>
          </div>
          <button routerLink="/" class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
            <app-hero-icon [name]="'x-mark'" class="w-6 h-6"></app-hero-icon>
          </button>
        </div>
      </header>

      <div class="flex flex-col md:grid md:grid-cols-6 gap-3 px-4 md:px-6 2xl:px-8 py-3 2xl:py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 md:top-16 2xl:top-[72px] z-40 shrink-0">

        <div class="w-full md:col-span-2 bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-white flex flex-row items-center justify-center gap-6 shadow-md relative overflow-hidden group text-left">
          <div class="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div class="absolute top-3 right-3 z-10 flex items-center gap-2">
            <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
              <app-hero-icon [name]="'globe-americas'"
                (click)="setMapIndicator('poblacion')"
                class="w-5 h-5 cursor-pointer transition-all"
                [class.animate-pulse]="activeIndicator() !== 'poblacion'"
                [class.scale-125]="activeIndicator() === 'poblacion'"
                [style.color]="activeIndicator() === 'poblacion' ? '#0056a1' : '#343b9f'">
              </app-hero-icon>
            </span>
            <span matTooltip="Población censada a nivel nacional o por departamento seleccionado" matTooltipClass="custom-tooltip" class="inline-flex items-center">
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-white/70"></app-hero-icon>
            </span>
          </div>
          <div class="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
            <app-hero-icon [name]="'users'" class="w-8 h-8"></app-hero-icon>
          </div>
          <div class="relative z-10 flex flex-col min-w-0">
            <div class="text-xs font-bold opacity-80 tracking-wide mb-0.5 truncate">{{ displayedTitle() }}</div>
            <div class="text-3xl md:text-4xl 2xl:text-5xl font-black tracking-tighter">{{ displayedPopulation() }}</div>
            <div class="text-[10px] font-semibold opacity-70 tracking-wide mt-0.5">Población Censada</div>
          </div>
        </div>

        <!-- ── Selector geográfico multi-nivel ────────────────────────── -->
        <div class="w-full md:col-span-4 flex flex-wrap items-center justify-end gap-2 pl-0 md:pl-2 pt-2 md:pt-0"
             (click)="$event.stopPropagation()">

          <!-- Restablecer -->
          <button
            (click)="resetFilters()"
            class="flex items-center gap-1.5 text-gray-400 hover:text-[#0056a1] transition-colors text-xs font-black tracking-wide shrink-0 group">
            <app-hero-icon [name]="'arrow-path'" class="w-4 h-4 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
            <span class="hidden md:inline">Restablecer Filtros</span>
          </button>

          <div class="hidden md:block h-7 w-px bg-gray-200 shrink-0"></div>

          <!-- ★ Nivel -->
          <div class="relative">
            <button
              (click)="toggleGeoDropdown('nivel'); $event.stopPropagation()"
              class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#0056a1] to-[#1a75aa]
                     text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all
                     min-w-[130px] justify-between">
              <span class="flex items-center gap-1.5">
                <app-hero-icon [name]="'map'" class="w-3.5 h-3.5 opacity-80"></app-hero-icon>
                {{ nivelGeo() }}
              </span>
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                [class.rotate-180]="openGeoDropdown() === 'nivel'">
              </app-hero-icon>
            </button>
            @if (openGeoDropdown() === 'nivel') {
              <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden"
                   (click)="$event.stopPropagation()">
                <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nivel geográfico</span>
                </div>
                @for (n of NIVELES_GEO; track n) {
                  <button
                    (click)="setNivelGeo(n)"
                    class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                    [class.bg-gradient-to-r]="nivelGeo() === n"
                    [class.from-\[\#0056a1\]]="nivelGeo() === n"
                    [class.to-\[\#1a75aa\]]="nivelGeo() === n"
                    [class.text-white]="nivelGeo() === n"
                    [class.text-gray-700]="nivelGeo() !== n"
                    [class.hover\:bg-blue-50]="nivelGeo() !== n">
                    <span class="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                      [class.border-white]="nivelGeo() === n"
                      [class.border-gray-300]="nivelGeo() !== n">
                      @if (nivelGeo() === n) {
                        <span class="w-2 h-2 bg-white rounded-full block"></span>
                      }
                    </span>
                    <span class="font-bold">{{ n }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <!-- ★ Departamento -->
          <div class="relative">
            <button
              (click)="toggleGeoDropdown('dep'); $event.stopPropagation()"
              class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                     text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all
                     min-w-[148px] justify-between">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                <span class="text-gray-400 mr-0.5">Dep.:</span>
                <span class="truncate max-w-[80px]">{{ geoDepLabel() }}</span>
              </span>
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 text-gray-400 transition-transform"
                [class.rotate-180]="openGeoDropdown() === 'dep'">
              </app-hero-icon>
            </button>
            @if (openGeoDropdown() === 'dep') {
              <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-60 overflow-hidden"
                   (click)="$event.stopPropagation()">
                <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar departamento</span>
                </div>
                <div class="max-h-60 overflow-y-auto">
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
              class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all min-w-[148px] justify-between"
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
                <span class="truncate max-w-[70px]">{{ geoProvLabel() }}</span>
              </span>
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                [class.text-gray-400]="isGeoProvActive()"
                [class.text-gray-200]="!isGeoProvActive()"
                [class.rotate-180]="openGeoDropdown() === 'prov'">
              </app-hero-icon>
            </button>
            @if (openGeoDropdown() === 'prov' && isGeoProvActive()) {
              <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-64 overflow-hidden"
                   (click)="$event.stopPropagation()">
                <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar provincia</span>
                </div>
                <div class="max-h-60 overflow-y-auto">
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
              class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all min-w-[140px] justify-between"
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
                <span class="truncate max-w-[65px]">{{ geoDistLabel() }}</span>
              </span>
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                [class.text-gray-400]="isGeoDistActive()"
                [class.text-gray-200]="!isGeoDistActive()"
                [class.rotate-180]="openGeoDropdown() === 'dist'">
              </app-hero-icon>
            </button>
            @if (openGeoDropdown() === 'dist' && isGeoDistActive()) {
              <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-80 overflow-hidden"
                   (click)="$event.stopPropagation()">
                <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar distrito</span>
                </div>
                <div class="max-h-60 overflow-y-auto">
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

        </div>
      </div>

      <div class="flex-1 p-3 2xl:p-5 overflow-y-auto md:overflow-hidden min-h-0 flex flex-col">

        <!-- ══ GRID PRINCIPAL: 6 cols — col1, col2, col3-4 (pirámide), col5-6 (mapa) ══ -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 2xl:gap-4 min-h-0 md:overflow-hidden">

        <!-- ══ COL 1: chart=13fr cards=10fr cada uno → chart 30% más alto ══ -->
        <div class="col-span-1 xl:row-span-2 grid grid-rows-[13fr_10fr_10fr_10fr] gap-3 min-h-0 overflow-hidden">

          <!-- Población por sexo -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="flex justify-between items-center mb-2 shrink-0">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Población por sexo</h4>
              <span matTooltip="Distribución de la población según sexo" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-400"></app-hero-icon>
              </span>
            </div>
            <div class="flex-1 min-h-0">
              @if (isBrowser) {
                <div echarts [options]="pieOptionsSex" class="w-full h-full"></div>
              }
            </div>
            <div class="flex justify-center gap-6 mt-2 shrink-0">
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1 mb-1">
                  <app-hero-icon [name]="'man'" type="solid" class="w-4 h-4 text-[#0056a1]"></app-hero-icon>
                  <span class="text-xs font-bold text-gray-500">Hombres</span>
                </div>
                <span class="text-lg 2xl:text-xl font-black text-gray-800 leading-none">17 596 527</span>
                <span class="text-xs text-gray-400">48,1%</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1 mb-1">
                  <app-hero-icon [name]="'woman'" type="solid" class="w-4 h-4 text-[#33b3a9]"></app-hero-icon>
                  <span class="text-xs font-bold text-gray-500">Mujeres</span>
                </div>
                <span class="text-lg 2xl:text-xl font-black text-gray-800 leading-none">18 999 999</span>
                <span class="text-xs text-gray-400">51,9%</span>
              </div>
            </div>
          </div>

          <!-- Edad Media -->
          <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'globe-americas'"
                  (click)="setMapIndicator('edad_media')"
                  class="w-4 h-4 cursor-pointer transition-all animate-pulse"
                  [class.animate-none]="activeIndicator() === 'edad_media'"
                  [class.scale-125]="activeIndicator() === 'edad_media'"
                  [style.color]="activeIndicator() === 'edad_media' ? '#0056a1' : '#343b9f'">
                </app-hero-icon>
              </span>
              <span matTooltip="Promedio de edad de la población" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
              </span>
            </div>
            <div class="flex items-center gap-3 flex-1 min-h-0">
              <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <app-hero-icon [name]="'calculator'" class="w-6 h-6"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] font-black text-gray-400 tracking-wide leading-none mb-1">Edad Media</div>
                <div class="text-2xl font-black text-gray-800 leading-none">31,2 <span class="text-xs font-bold text-gray-400">años</span></div>
              </div>
            </div>
          </div>

          <!-- Razón H/M -->
          <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'globe-americas'"
                  (click)="setMapIndicator('razon_sexo')"
                  class="w-4 h-4 cursor-pointer transition-all animate-pulse"
                  [class.animate-none]="activeIndicator() === 'razon_sexo'"
                  [class.scale-125]="activeIndicator() === 'razon_sexo'"
                  [style.color]="activeIndicator() === 'razon_sexo' ? '#0056a1' : '#343b9f'">
                </app-hero-icon>
              </span>
              <span matTooltip="Número de hombres por cada 100 mujeres" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
              </span>
            </div>
            <div class="flex items-center gap-3 mb-1.5 shrink-0">
              <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <div class="flex gap-0.5">
                  <app-hero-icon [name]="'man'" type="solid" class="w-4 h-4 text-[#0056a1]"></app-hero-icon>
                  <app-hero-icon [name]="'woman'" type="solid" class="w-4 h-4 text-[#33b3a9]"></app-hero-icon>
                </div>
              </div>
              <div class="text-[10px] font-black text-gray-400 tracking-wide leading-none">Razón hombre - mujer</div>
            </div>

            <div class="flex-1 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 min-h-0">

              <!-- Fila 1: etiqueta -->
              <span class="text-[10px] font-bold text-gray-500 leading-none">Hay</span>
              <!-- Fila 1: icono + valor -->
              <div class="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0056a1" class="w-5 h-5 shrink-0">
                  <path d="M12 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5zM8.25 9.75A.75.75 0 0 1 9 9h6a.75.75 0 0 1 .74.63l.76 5.25a.75.75 0 0 1-1.49.17L14.5 12.5H14v7.25a.75.75 0 0 1-1.5 0V16h-1v3.75a.75.75 0 0 1-1.5 0V12.5h-.5l-.5 2.55a.75.75 0 1 1-1.48-.2l.75-5.08z"/>
                </svg>
                <span class="text-2xl font-black text-[#0056a1] leading-none">94,3</span>
              </div>

              <!-- Fila 2: etiqueta -->
              <span class="text-[10px] font-bold text-gray-500 leading-none">Por cada</span>
              <!-- Fila 2: icono + valor -->
              <div class="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#33b3a9" class="w-5 h-5 shrink-0">
                  <path d="M12 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5zM9 9.75a.75.75 0 0 0-.72.97l.75 2.5a.75.75 0 0 0 .72.53h.5v6a.75.75 0 0 0 1.5 0v-2.5h.5v2.5a.75.75 0 0 0 1.5 0v-6h.5a.75.75 0 0 0 .72-.53l.75-2.5a.75.75 0 0 0-.72-.97H9z"/>
                </svg>
                <span class="text-2xl font-black text-[#33b3a9] leading-none">100 Mujeres</span>
              </div>

            </div>
          </div>

          <!-- Rel. Dep. Total -->
          <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'globe-americas'"
                  (click)="setMapIndicator('dep_total')"
                  class="w-4 h-4 cursor-pointer transition-all animate-pulse"
                  [class.animate-none]="activeIndicator() === 'dep_total'"
                  [class.scale-125]="activeIndicator() === 'dep_total'"
                  [style.color]="activeIndicator() === 'dep_total' ? '#0056a1' : '#343b9f'">
                </app-hero-icon>
              </span>
              <span matTooltip="Número de personas de 0 a 14 años y de 60 y más años, por cada 100 personas de 15 a 59 años" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
              </span>
            </div>
            <div class="flex items-center gap-3 flex-1 min-h-0">
              <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <app-hero-icon [name]="'user-group'" class="w-6 h-6"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] font-black text-gray-400 tracking-wide leading-none mb-1">Rel. de dependencia total</div>
                <div class="text-2xl font-black text-gray-800 leading-none">52,1%</div>
              </div>
            </div>
          </div>

        </div><!-- /col 1 -->
        <!-- ══ COL 2: chart=13fr cards=10fr cada uno → chart 30% más alto ══ -->
        <div class="col-span-1 xl:row-span-2 grid grid-rows-[13fr_10fr_10fr_10fr] gap-3 min-h-0 overflow-hidden">

          <!-- Grandes Grupos de Edad -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="flex justify-between items-center mb-2 shrink-0">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Población por grandes grupos de edad</h4>
              <span matTooltip="Distribución de la población por grandes grupos de edad" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-400"></app-hero-icon>
              </span>
            </div>
            <div class="flex-1 min-h-0">
              @if (isBrowser) {
                <div echarts [options]="pieOptionsAge" class="w-full h-full"></div>
              }
            </div>
            <div class="grid grid-cols-3 gap-1 mt-1.5 border-t border-gray-50 pt-1.5 shrink-0">
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1 mb-0.5">
                  <div class="w-2 h-2 rounded-full bg-[#0056a1] shrink-0"></div>
                  <span class="text-[9px] font-bold text-gray-400">0–14 años</span>
                </div>
                <span class="text-sm font-black text-gray-800 leading-none">3 274 648</span>
                <span class="text-[9px] text-gray-400">(17,7%)</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1 mb-0.5">
                  <div class="w-2 h-2 rounded-full bg-[#33b3a9] shrink-0"></div>
                  <span class="text-[9px] font-bold text-gray-400">15–59 años</span>
                </div>
                <span class="text-sm font-black text-gray-800 leading-none">12 618 546</span>
                <span class="text-[9px] text-gray-400">(68,3%)</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1 mb-0.5">
                  <div class="w-2 h-2 rounded-full bg-[#facc15] shrink-0"></div>
                  <span class="text-[9px] font-bold text-gray-400">60 y más años</span>
                </div>
                <span class="text-sm font-black text-gray-800 leading-none">2 587 238</span>
                <span class="text-[9px] text-gray-400">(14,0%)</span>
              </div>
            </div>
          </div>

          <!-- Edad Mediana -->
          <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
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
            <div class="flex items-center gap-3 flex-1 min-h-0">
              <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <app-hero-icon [name]="'scale'" class="w-6 h-6"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] font-black text-gray-400 tracking-wide leading-none mb-1">Edad Mediana</div>
                <div class="text-2xl font-black text-gray-800 leading-none">29,8 <span class="text-xs font-bold text-gray-400">años</span></div>
              </div>
            </div>
          </div>

          <!-- Índice de Envejecimiento -->
          <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'globe-americas'"
                  (click)="setMapIndicator('indice_envejecimiento')"
                  class="w-4 h-4 cursor-pointer transition-all animate-pulse"
                  [class.animate-none]="activeIndicator() === 'indice_envejecimiento'"
                  [class.scale-125]="activeIndicator() === 'indice_envejecimiento'"
                  [style.color]="activeIndicator() === 'indice_envejecimiento' ? '#0056a1' : '#343b9f'">
                </app-hero-icon>
              </span>
              <span matTooltip="Número de personas de 60 y más años, por cada 100 personas de 0 a 14 años" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
              </span>
            </div>
            <div class="flex items-center gap-3 flex-1 min-h-0">
              <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <app-hero-icon [name]="'clock'" class="w-6 h-6"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] font-black text-gray-400 tracking-wide leading-none mb-1">Índice de Envejecimiento</div>
                <div class="text-2xl font-black text-gray-800 leading-none">45,6%</div>
              </div>
            </div>
          </div>

          <!-- Rel. Dep. Juvenil -->
          <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-0">
            <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'globe-americas'"
                  (click)="setMapIndicator('dep_juvenil')"
                  class="w-4 h-4 cursor-pointer transition-all animate-pulse"
                  [class.animate-none]="activeIndicator() === 'dep_juvenil'"
                  [class.scale-125]="activeIndicator() === 'dep_juvenil'"
                  [style.color]="activeIndicator() === 'dep_juvenil' ? '#0056a1' : '#343b9f'">
                </app-hero-icon>
              </span>
              <span matTooltip="Número de personas de 0 a 14 años, por cada 100 personas de 15 a 59 años" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
              </span>
            </div>
            <div class="flex items-center gap-3 flex-1 min-h-0">
              <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <app-hero-icon [name]="'face-smile'" class="w-6 h-6"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] font-black text-gray-400 tracking-wide leading-none mb-1">Rel. de dependencia juvenil</div>
                <div class="text-2xl font-black text-gray-800 leading-none">34,2%</div>
              </div>
            </div>
          </div>

        </div><!-- /col 2 -->
        <!-- ══ COL 3-4: Pirámide (flex-1) + 3 indicadores (h-[76px]) ══ -->
        <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:row-span-2 flex flex-col gap-3 min-h-0 overflow-hidden">

          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden min-h-0 relative">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-base font-black text-gray-800 tracking-wide">Pirámide poblacional</h3>
              <div class="flex gap-4 text-xs font-bold">
                <div class="flex items-center gap-1.5">
                  <app-hero-icon [name]="'man'" type="solid" class="w-3 h-3 text-[#0056a1]"></app-hero-icon>
                  <span class="text-gray-500">Hombres</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <app-hero-icon [name]="'woman'" type="solid" class="w-3 h-3 text-[#33b3a9]"></app-hero-icon>
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

          <!-- Fila inferior col3-4: Rel. Dep. Adulta · Densidad Censada · Densidad 60+ -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">

            <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden h-[76px]">
              <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('dep_adulta')"
                    class="w-3.5 h-3.5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'dep_adulta'"
                    [class.scale-125]="activeIndicator() === 'dep_adulta'"
                    [style.color]="activeIndicator() === 'dep_adulta' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Número de personas de 60 y más años, por cada 100 personas de 15 a 59 años" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <app-hero-icon [name]="'briefcase'" class="w-4 h-4"></app-hero-icon>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] font-black text-gray-400 tracking-wide leading-tight">Rel. de dependencia adulta</div>
                  <div class="text-lg font-black text-gray-800 leading-none mt-0.5">17,9%</div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden h-[76px]">
              <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('densidad_total')"
                    class="w-3.5 h-3.5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'densidad_total'"
                    [class.scale-125]="activeIndicator() === 'densidad_total'"
                    [style.color]="activeIndicator() === 'densidad_total' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Habitantes por kilómetro cuadrado" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <app-hero-icon [name]="'squares-2x2'" class="w-4 h-4"></app-hero-icon>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] font-black text-gray-400 tracking-wide leading-tight">Densidad Pob. Censada</div>
                  <div class="text-lg font-black text-gray-800 leading-none mt-0.5">25,4 <span class="text-[9px] font-bold text-gray-400">hab/km²</span></div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden h-[76px]">
              <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'globe-americas'"
                    (click)="setMapIndicator('densidad_65')"
                    class="w-3.5 h-3.5 cursor-pointer transition-all animate-pulse"
                    [class.animate-none]="activeIndicator() === 'densidad_65'"
                    [class.scale-125]="activeIndicator() === 'densidad_65'"
                    [style.color]="activeIndicator() === 'densidad_65' ? '#0056a1' : '#343b9f'">
                  </app-hero-icon>
                </span>
                <span matTooltip="Habitantes de 60 y más años por kilómetro cuadrado" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-8 h-8 rounded-lg bg-[#33b3a9]/10 flex items-center justify-center text-[#33b3a9] shrink-0">
                  <app-hero-icon [name]="'squares-2x2'" class="w-4 h-4"></app-hero-icon>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] font-black text-gray-400 tracking-wide leading-tight">Densidad de la población adulta mayor</div>
                  <div class="text-lg font-black text-gray-800 leading-none mt-0.5">3,6 <span class="text-[9px] font-bold text-gray-400">hab/km²</span></div>
                </div>
              </div>
            </div>

          </div><!-- /fila inferior col3-4 -->

        </div><!-- /col 3-4 -->

        <!-- ══ MAPA — col-span-2, row-span-2 (ocupa toda la altura) ══ -->
        <div class="col-span-1 md:col-span-2 xl:row-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[420px] md:min-h-0">

          <div class="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">

            <div class="absolute top-3 left-3 z-10 pointer-events-none select-none">
              <div class="text-[10px] font-black text-primary tracking-wide mb-0.5">{{ displayedTitle() }}</div>
              <div class="text-xl font-black text-gray-900 tracking-tighter leading-none">
                @if (hoveredRegion()) {
                  {{ getActiveValue(hoveredRegion()!) }}
                } @else if (selectedRegion()) {
                  {{ getActiveValue(selectedRegion()!) }}
                } @else if (activeIndicator() === 'poblacion') {
                  {{ displayedPopulation() }}
                } @else { — }
              </div>
              <div class="text-[9px] font-bold text-gray-400 tracking-wide mt-0.5">{{ activeIndicatorDef().label }}</div>
            </div>

            <app-hero-icon
              [name]="'information-circle'"
              class="absolute top-3 right-3 z-20 w-5 h-5 text-gray-400"
              [matTooltip]="nivelGeo() === 'Departamental'
                ? 'Hover para ver datos del departamento. Click para seleccionar.'
                : nivelGeo() === 'Provincial'
                  ? 'Hover para ver datos de la provincia. Click para seleccionar.'
                  : 'Hover para ver datos del distrito. Click para seleccionar.'"
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

              @if (hoveredRegion()) {
                <div class="absolute top-2 right-2 z-20 bg-gray-900/95 text-white p-3 rounded-xl
                            shadow-2xl min-w-[190px] border border-gray-700 pointer-events-none"
                     style="animation: fadeIn 0.15s ease-out">
                  <p class="text-[8px] text-[#33b3a9] uppercase font-black tracking-widest mb-1">{{ activeIndicatorDef().label }}</p>
                  <p class="text-sm font-bold text-white border-b border-gray-700 pb-1.5 mb-2 leading-tight">
                    {{ hoveredRegion()!.name }}
                  </p>
                  <div class="flex justify-between mb-2">
                    <span class="text-[8px] text-gray-400 uppercase font-bold">Pob. Censada</span>
                    <span class="text-sm font-black">{{ fmt(hoveredRegion()!.total) }}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 border-t border-gray-800 pt-1.5">
                    <div>
                      <div class="flex items-center gap-1 mb-0.5">
                        <div class="w-1.5 h-1.5 rounded-full bg-[#0056a1]"></div>
                        <span class="text-[7px] text-gray-400 font-bold uppercase">Hombres</span>
                      </div>
                      <p class="text-xs font-bold">{{ fmt(hoveredRegion()!.male) }}</p>
                      <p class="text-[8px] text-gray-400">
                        {{ hoveredRegion()!.total > 0 ? fmtPct((hoveredRegion()!.male / hoveredRegion()!.total) * 100) : '0%' }}
                      </p>
                    </div>
                    <div>
                      <div class="flex items-center gap-1 mb-0.5">
                        <div class="w-1.5 h-1.5 rounded-full bg-[#33b3a9]"></div>
                        <span class="text-[7px] text-gray-400 font-bold uppercase">Mujeres</span>
                      </div>
                      <p class="text-xs font-bold">{{ fmt(hoveredRegion()!.female) }}</p>
                      <p class="text-[8px] text-gray-400">
                        {{ hoveredRegion()!.total > 0 ? fmtPct((hoveredRegion()!.female / hoveredRegion()!.total) * 100) : '0%' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex justify-between border-t border-gray-800 pt-1.5 mt-1.5">
                    <span class="text-[8px] text-gray-400 uppercase font-bold">Densidad</span>
                    <span class="text-xs font-bold text-yellow-400">{{ fmtD(hoveredRegion()!.density) }} hab/km²</span>
                  </div>
                </div>
              }

              @if (selectedRegion() && !hoveredRegion()) {
                <div class="absolute top-2 right-2 z-20 bg-gray-900/95 text-white p-3 rounded-xl
                            shadow-2xl min-w-[190px] border border-amber-500/50 pointer-events-none"
                     style="animation: fadeIn 0.15s ease-out">
                  <p class="text-[8px] text-amber-400 uppercase font-black tracking-widest mb-1">Seleccionado</p>
                  <p class="text-sm font-bold text-white border-b border-gray-700 pb-1.5 mb-2 leading-tight">
                    {{ selectedRegion()!.name }}
                  </p>
                  <div class="flex justify-between mb-2">
                    <span class="text-[8px] text-gray-400 uppercase font-bold">Total</span>
                    <span class="text-sm font-black">{{ fmt(selectedRegion()!.total) }}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 border-t border-gray-800 pt-1.5">
                    <div>
                      <div class="flex items-center gap-1 mb-0.5">
                        <div class="w-1.5 h-1.5 rounded-full bg-[#0056a1]"></div>
                        <span class="text-[7px] text-gray-400 font-bold uppercase">Hombres</span>
                      </div>
                      <p class="text-xs font-bold">{{ fmt(selectedRegion()!.male) }}</p>
                    </div>
                    <div>
                      <div class="flex items-center gap-1 mb-0.5">
                        <div class="w-1.5 h-1.5 rounded-full bg-[#33b3a9]"></div>
                        <span class="text-[7px] text-gray-400 font-bold uppercase">Mujeres</span>
                      </div>
                      <p class="text-xs font-bold">{{ fmt(selectedRegion()!.female) }}</p>
                    </div>
                  </div>
                </div>
              }

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
                    (mouseenter)="onHover(r)"
                    (mouseleave)="onLeave()"
                    (click)="onRegionClick(r)"
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
              </svg>

              @if (colorBreaks().length) {
                <div class="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-100 pointer-events-none">
                  <div class="text-[8px] font-black text-gray-400 tracking-widest uppercase mb-1.5">{{ activeIndicatorDef().label }}</div>
                  <div class="flex flex-col gap-1">
                    @for (brk of colorBreaks().slice().reverse(); track brk.min) {
                      <div class="flex items-center gap-1.5">
                        <div class="w-4 h-3 rounded-sm shrink-0" [style.background-color]="brk.color"></div>
                        <span class="text-[8px] font-semibold text-gray-600 whitespace-nowrap">{{ brk.label }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>

        </div><!-- /map col -->

        </div><!-- /charts row grid -->

      </div><!-- /main content wrapper -->
    </section>
  `,
    styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      :host { height: auto; overflow: auto; }
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
  `]
})
export class DashboardComponent implements OnInit {

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
    openGeoDropdown  = signal<'nivel'|'dep'|'prov'|'dist'|null>(null);
    /** Almacena código CCPP (2 dígitos) de la provincia seleccionada */
    selectedProv     = signal<string>('');
    /** Almacena UBIGEO (6 dígitos) del distrito seleccionado */
    selectedDist     = signal<string>('');

    isGeoProvActive  = computed(() => this.nivelGeo() !== 'Departamental');
    isGeoDistActive  = computed(() => this.nivelGeo() === 'Distrital');

    /** Lista dinámica de provincias — si hay departamento seleccionado, filtra por él */
    provinces = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonProv();
        if (!geo?.features) return [];
        const ccdd = this.selectedCCDD();
        const features = ccdd
            ? (geo.features as any[]).filter(f => String(f.properties.CCDD) === ccdd)
            : (geo.features as any[]);
        return features
            .map(f => ({ code: String(f.properties.CCPP), name: String(f.properties.NOMBPROV) }))
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    });

    /** Lista dinámica de distritos — si hay provincia seleccionada filtra por ccdd+ccpp; si solo dept, filtra por ccdd */
    districts = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonDist();
        if (!geo?.features) return [];
        const ccdd = this.selectedCCDD();
        const ccpp = this.selectedProv();
        let features = geo.features as any[];
        if (ccdd) features = features.filter(f => String(f.properties.CCDD) === ccdd);
        if (ccpp) features = features.filter(f => String(f.properties.CCPP) === ccpp);
        return features
            .map(f => ({ code: String(f.properties.UBIGEO), name: String(f.properties.NOMBDIST) }))
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));
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

    toggleGeoDropdown(key: 'nivel'|'dep'|'prov'|'dist'): void {
        this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key);
    }
    closeGeoDropdowns(): void { this.openGeoDropdown.set(null); }

    setNivelGeo(n: NivelGeoType): void {
        this.nivelGeo.set(n);
        if (n === 'Departamental') { this.selectedProv.set(''); this.selectedDist.set(''); }
        if (n === 'Provincial')    { this.selectedDist.set(''); }
        this.selectedMapGeoKey.set('');
        // Carga diferida del GeoJSON correspondiente
        if (n !== 'Departamental') this.loadGeoJsonProv();
        if (n === 'Distrital')     this.loadGeoJsonDist();
        this.openGeoDropdown.set(null);
    }

    selectDep(dept: { ccdd: string; name: string } | null): void {
        this.selectedCCDD.set(dept?.ccdd ?? '');
        this.selectedProv.set('');
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);
        // Volver a vista completa al cambiar departamento
        this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: 0, y: 0, w: S.w, h: S.h });
    }

    selectProv(code: string): void {
        this.selectedProv.set(code);
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);
    }

    selectDist(code: string): void {
        this.selectedDist.set(code);
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);
    }

    // ── Estado primitivo (señales manuales) ───────────────────────────────
    isBrowser             = false;
    selectedCCDD          = signal<string>('');
    /** Clave geoKey de la región sobre la que está el cursor */
    hoveredGeoKey         = signal<string>('');
    /** Clave geoKey de la región seleccionada en el mapa (click) */
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

    // ── Constantes ────────────────────────────────────────────────────────
    private readonly TOTAL_NAC = 36_596_527;

    // ── Estado derivado (computed) ────────────────────────────────────────

    /** ViewBox dinámica del mapa SVG — animada en fitBounds */
    svgViewBox = signal<string>(`0 0 ${S.w} ${S.h}`);
    private svgAnimFrame: number | null = null;

    /** Indicador activo para colorear el mapa (default: población total) */
    activeIndicator = signal<MapIndicatorKey>('poblacion');

    /** Definición del indicador activo */
    activeIndicatorDef = computed<IndicatorDef>(
        () => INDICATORS.find(d => d.key === this.activeIndicator())!
    );

    /** Regiones parseadas sin color (recalculado al cambiar nivel o selección) */
    private parsedRegions = computed<Omit<MapRegion, 'color'>[]>(() => {
        const nivel = this.nivelGeo();

        // ── Nivel Departamental ──────────────────────────────────────────
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

        // ── Nivel Provincial ─────────────────────────────────────────────
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

        // ── Nivel Distrital ──────────────────────────────────────────────
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

    /** Regiones con color coroplético según indicador activo */
    mapRegions = computed<MapRegion[]>(() => {
        const raws = this.parsedRegions();
        const key  = this.activeIndicator();
        if (!raws.length) return [];

        const vals   = raws.map(r => this.getIndicatorValue(r as MapRegion, key));
        const sorted = [...vals].sort((a, b) => a - b);
        const n  = sorted.length;
        const gs = Math.max(1, Math.floor(n / 5));
        const thr = [1, 2, 3, 4].map(i => sorted[Math.min(i * gs, n - 1)]);

        return raws.map((r, i) => {
            const v = vals[i];
            let tier = 0;
            for (let t = 0; t < thr.length; t++) { if (v > thr[t]) tier = t + 1; }
            return { ...r, color: PALETTE[tier] } as MapRegion;
        });
    });

    /** Lista de departamentos para el combo selector — siempre desde el JSON de deptos */
    departments = computed(() => {
        const geo = this.rawGeoJson();
        if (!geo?.features) return [];
        return (geo.features as any[])
            .map((f: any) => ({ ccdd: String(f.properties.CCDD), name: String(f.properties.NOMBDEP) }))
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    });

    /** 5 rangos cuantílicos para la leyenda */
    colorBreaks = computed<ColorBreak[]>(() => {
        const regions = this.mapRegions();
        const key     = this.activeIndicator();
        const def     = this.activeIndicatorDef();
        if (!regions.length) return [];

        const sorted = regions.map(r => this.getIndicatorValue(r, key)).sort((a, b) => a - b);
        const n  = sorted.length;
        const gs = Math.max(1, Math.floor(n / 5));
        const fmtV = (v: number) => key === 'poblacion'
            ? this.fmt(v)
            : this.fmtD(v, def.decimals) + def.unit;

        return Array.from({ length: 5 }, (_, i) => {
            const bMin = sorted[i * gs];
            const bMax = sorted[Math.min((i + 1) * gs - 1, n - 1)];
            return { min: bMin, max: bMax, color: PALETTE[i], label: `${fmtV(bMin)} – ${fmtV(bMax)}` };
        });
    });

    /** Región sobre la que está el cursor */
    hoveredRegion = computed<MapRegion | null>(() => {
        const key = this.hoveredGeoKey();
        if (!key) return null;
        return this.mapRegions().find(r => r.geoKey === key) ?? null;
    });

    /** Región seleccionada desde el mapa (click) */
    selectedRegion = computed<MapRegion | null>(() => {
        const key = this.selectedMapGeoKey();
        if (!key) return null;
        return this.mapRegions().find(r => r.geoKey === key) ?? null;
    });

    /**
     * Título de la cabecera: seleccionado en mapa > dept seleccionado > Nacional.
     * El hover NO modifica el card; solo afecta el tooltip negro del mapa.
     */
    displayedTitle = computed<string>(() => {
        const sel = this.selectedRegion();
        if (sel) return sel.name;
        const ccdd = this.selectedCCDD();
        if (ccdd) return this.departments().find(d => d.ccdd === ccdd)?.name ?? 'Perú (Nacional)';
        return 'Perú (Nacional)';
    });

    /**
     * Población de la cabecera: seleccionado en mapa > dept seleccionado > Nacional.
     * El hover NO modifica el card; solo afecta el tooltip negro del mapa.
     */
    displayedPopulation = computed<string>(() => {
        const sel = this.selectedRegion();
        if (sel) return this.fmt(sel.total);
        return this.fmt(this.TOTAL_NAC);
    });

    // ── Inyecciones ───────────────────────────────────────────────────────
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);

    constructor() {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    // ── Ciclo de vida ─────────────────────────────────────────────────────
    ngOnInit(): void {
        this.initCharts();
        // Cargar GeoJSON en cualquier plataforma (SSR safe: solo HTTP)
        this.loadGeoJson();
    }

    // ── Carga del GeoJSON por nivel ───────────────────────────────────────
    loadGeoJson(): void {
        if (this.rawGeoJson()) return; // ya cargado
        this.isMapLoading.set(true);
        this.mapLoadError.set(false);
        this.http.get<any>('/departamento_geometria.json').subscribe({
            next:  data => { this.rawGeoJson.set(data); this.isMapLoading.set(false); },
            error: ()   => { this.isMapLoading.set(false); this.mapLoadError.set(true); },
        });
    }

    loadGeoJsonProv(): void {
        if (this.rawGeoJsonProv()) return; // ya cargado
        this.isMapLoadingProv.set(true);
        this.mapLoadErrorProv.set(false);
        this.http.get<any>('/provincia_geometria.json').subscribe({
            next:  data => { this.rawGeoJsonProv.set(data); this.isMapLoadingProv.set(false); },
            error: ()   => { this.isMapLoadingProv.set(false); this.mapLoadErrorProv.set(true); },
        });
    }

    loadGeoJsonDist(): void {
        if (this.rawGeoJsonDist()) return; // ya cargado
        this.isMapLoadingDist.set(true);
        this.mapLoadErrorDist.set(false);
        this.http.get<any>('/distrito_geometria.json').subscribe({
            next:  data => { this.rawGeoJsonDist.set(data); this.isMapLoadingDist.set(false); },
            error: ()   => { this.isMapLoadingDist.set(false); this.mapLoadErrorDist.set(true); },
        });
    }

    /** Reintenta cargar el GeoJSON del nivel activo (botón de error) */
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

    // ── Formateadores de números (estilo INEI Perú) ──────────────────────
    /** Enteros grandes: punto como separador de miles  → 1.234.567 */
    fmt(n: number): string {
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    /** Decimales con coma como separador decimal → 94,3  |  25,4 */
    fmtD(n: number, dec = 1): string {
        return n.toFixed(dec).replace('.', ',');
    }
    /** Porcentajes con coma decimal → 48,1% */
    fmtPct(n: number, dec = 1): string {
        return n.toFixed(dec).replace('.', ',') + '%';
    }

    // ── Proyección GeoJSON → SVG ──────────────────────────────────────────
    private project(geom: any): { path: string; center: { x: number; y: number } } {
        if (!geom) return { path: '', center: { x: 0, y: 0 } };

        let path = '';
        let sx = 0, sy = 0, n = 0;

        /** Convierte [lng, lat] a coordenadas SVG */
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

        return {
            path,
            center: { x: n ? sx / n : 0, y: n ? sy / n : 0 },
        };
    }

    // ── Helpers de estilo SVG ─────────────────────────────────────────────

    getRegionFill(r: MapRegion): string {
        const hovKey = this.hoveredRegion()?.geoKey;
        const selKey = this.selectedRegion()?.geoKey;
        if (hovKey === r.geoKey) return '#f8bd13';
        if (selKey === r.geoKey && !hovKey) return '#f8bd13';
        return r.color;
    }

    getRegionOpacity(r: MapRegion): string {
        const hov = this.hoveredRegion();
        const sel = this.selectedRegion();
        if (hov) return hov.geoKey === r.geoKey ? '1' : '0.30';
        if (sel) return sel.geoKey === r.geoKey ? '1' : '0.35';
        return '0.88';
    }

    getStrokeWidth(r: MapRegion): string {
        if (this.hoveredRegion()?.geoKey === r.geoKey)  return '1.5';
        if (this.selectedRegion()?.geoKey === r.geoKey) return '2';
        return '1.5';
    }

    getLabelOpacity(r: MapRegion): string {
        const hov = this.hoveredRegion();
        const sel = this.selectedRegion();
        if (hov) return hov.geoKey === r.geoKey ? '1' : '0.12';
        if (sel) return sel.geoKey === r.geoKey ? '1' : '0.15';
        return '1';
    }

    // ── Eventos del mapa SVG ──────────────────────────────────────────────

    onHover(r: MapRegion): void {
        this.hoveredGeoKey.set(r.geoKey);
    }

    onLeave(): void {
        this.hoveredGeoKey.set('');
    }

    onRegionClick(r: MapRegion): void {
        // Toggle: doble click deselecciona y restaura la vista
        if (this.selectedMapGeoKey() === r.geoKey) {
            this.selectedMapGeoKey.set('');
            this.animateViewBox(
                this.parseViewBox(this.svgViewBox()),
                { x: 0, y: 0, w: S.w, h: S.h }
            );
        } else {
            this.selectedMapGeoKey.set(r.geoKey);
            this.fitRegion(r);
            // Sincronizar con el selector de nivel correspondiente
            const nivel = this.nivelGeo();
            if (nivel === 'Departamental') {
                this.selectedCCDD.set(r.ccdd);
            } else if (nivel === 'Provincial') {
                this.selectedProv.set(r.ccpp);
            } else {
                this.selectedDist.set(r.geoKey); // ubigeo
            }
        }
    }

    // ── Botón Restablecer ─────────────────────────────────────────────────
    resetFilters(): void {
        this.selectedCCDD.set('');
        this.hoveredGeoKey.set('');
        this.selectedMapGeoKey.set('');
        this.selectedProv.set('');
        this.selectedDist.set('');
        this.nivelGeo.set('Departamental');
        this.openGeoDropdown.set(null);
        // Restaurar vista completa del mapa
        this.animateViewBox(
            this.parseViewBox(this.svgViewBox()),
            { x: 0, y: 0, w: S.w, h: S.h }
        );
    }

    // ── Indicador de mapa ────────────────────────────────────────────────

    /** Valor numérico del indicador para una región */
    getIndicatorValue(r: MapRegion, key: MapIndicatorKey): number {
        if (key === 'poblacion')      return r.total;
        if (key === 'densidad_total') return r.density;
        // Para indicadores derivados se usa el mock por departamento como fallback
        return MOCK_DEP[r.ccdd]?.[key as string] ?? 0;
    }

    /** Valor formateado del indicador activo para mostrar en el mapa */
    getActiveValue(r: MapRegion): string {
        const key = this.activeIndicator();
        const def = this.activeIndicatorDef();
        const v   = this.getIndicatorValue(r, key);
        return key === 'poblacion' ? this.fmt(v) : this.fmtD(v, def.decimals) + def.unit;
    }

    /** Activa un indicador: colorea el mapa y actualiza la leyenda */
    setMapIndicator(key: MapIndicatorKey): void {
        this.activeIndicator.set(key);
    }

    // ── SVG fitBounds — zoom suave al departamento seleccionado ─────────────────

    /**
     * Calcula el bounding box SVG del polígono y ejecuta animateViewBox
     * con un padding de 50 unidades SVG, emulando map.fitBounds de Mapbox.
     */
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

        // 1. Calcular bounding box geográfico (lng/lat)
        const bb = this.getGeoBBox(feature.geometry);

        // 2. Proyectar a coordenadas SVG
        const toLon = (lon: number) => ((lon - B.minLon) / (B.maxLon - B.minLon)) * S.w;
        const toLat = (lat: number) => (1 - (lat - B.minLat) / (B.maxLat - B.minLat)) * S.h;

        const svgMinX = toLon(bb.minLon);
        const svgMaxX = toLon(bb.maxLon);
        const svgMinY = toLat(bb.maxLat); // lat máximo → Y mínimo (SVG invertido)
        const svgMaxY = toLat(bb.minLat);

        // 3. Aplicar padding de 50px SVG para animación suave tipo fitBounds
        const PAD = 50;
        const target = {
            x: svgMinX - PAD,
            y: svgMinY - PAD,
            w: (svgMaxX - svgMinX) + PAD * 2,
            h: (svgMaxY - svgMinY) + PAD * 2,
        };

        // 4. Animar desde la viewBox actual hacia el target
        this.animateViewBox(this.parseViewBox(this.svgViewBox()), target);
    }

    /**
     * Extrae el bounding box (minLon, maxLon, minLat, maxLat) de una geometría GeoJSON.
     */
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

    /**
     * Parsea el string de viewBox "x y w h" a un objeto numérico.
     */
    private parseViewBox(vb: string): { x: number; y: number; w: number; h: number } {
        const [x, y, w, h] = vb.split(' ').map(Number);
        return { x, y, w, h };
    }

    /**
     * Anima la viewBox del SVG desde `from` hasta `to` con easing easeInOut
     * en 500ms, produciendo el efecto suave equivalente a map.fitBounds.
     */
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
            // easeInOutQuad
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

    // ── Gráficos ECharts (pie + pirámide) ─────────────────────────────────────
    initCharts(): void {
        this.pieOptionsSex = {
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    const val = Number(params.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    const pct = Number(params.percent).toFixed(1).replace('.', ',') + '%';
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${params.name}</div>
                  <div style="font-size:12px;font-weight:700;color:${params.color}">${val} <span style="color:#9ca3af;font-size:10px">(${pct})</span></div>`;
                },
            },
            legend:  { show: false },
            color:   ['#0056a1', '#33b3a9'],
            series: [{
                name: 'Sexo', type: 'pie', radius: ['50%', '80%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                data: [
                    { value: 17596527, name: 'Hombres' },
                    { value: 18999999, name: 'Mujeres' },
                ],
            }],
        };

        this.pieOptionsAge = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'none' },
                formatter: (params: any) => {
                    const p = params[0];
                    const pct = ['17,7%', '68,3%', '14,0%'][p.dataIndex] ?? '';
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div>
                  <div style="font-size:12px;font-weight:700;color:${p.color}">${Number(p.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} <span style="color:#9ca3af;font-size:10px">(${pct})</span></div>`;
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
                max: (val: any) => Math.round(val.max * 1.40),
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
                    fontSize: 9,
                    fontWeight: 'bold',
                    color: '#6b7280',
                    formatter: (p: any) => ['17,7%', '68,3%', '14,0%'][p.dataIndex] ?? '',
                },
                data: [
                    { value: 3274648,  itemStyle: { color: '#0056a1' } },
                    { value: 12618546, itemStyle: { color: '#33b3a9' } },
                    { value: 2587238,  itemStyle: { color: '#f8bd13' } },
                ],
            }],
        };

        const ageGroups  = ['0-4 años','5-9 años','10-14 años','15-19 años','20-24 años','25-29 años','30-34 años','35-39 años','40-44 años','45-49 años','50-54 años','55-59 años','60-64 años','65-69 años','70-74 años','75-79 años','80-84 años','85 y más'];
        const maleData   = [-2.5,-2.8,-3.0,-3.2,-3.5,-3.8,-4.0,-3.8,-3.5,-3.2,-3.0,-2.8,-2.5,-2.0,-1.5,-1.0,-0.5,-0.5];
        const femaleData = [ 2.4, 2.7, 2.9, 3.1, 3.4, 3.7, 3.9, 3.7, 3.4, 3.1, 2.9, 2.7, 2.4, 1.9, 1.4, 0.9, 0.4,0.4];

        // Valores absolutos estimados sobre el total de población censada
        const TOTAL = this.TOTAL_NAC;
        const maleAbs   = maleData.map(v  => Math.round(Math.abs(v) / 100 * TOTAL));
        const femaleAbs = femaleData.map(v => Math.round(v           / 100 * TOTAL));

        this.pyramidOptions = {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter(params: any): string {
                    let html = `<div style="font-weight:900;font-size:10px;margin-bottom:4px">${params[0].name}</div>`;
                    params.forEach((p: any) => {
                        const absVal = Number(p.data?.abs ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
                // Eje X simétrico: negativo (Hombres) ← 0 → positivo (Mujeres)
                min: -5,
                max:  5,
                interval: 1,
                axisLine: { show: true, lineStyle: { color: '#d1d5db', width: 1 } },
                axisTick: { show: true, lineStyle: { color: '#d1d5db' } },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#f3f4f6', type: 'dashed' },
                },
                // Línea vertical central en 0 más destacada
                axisLabel: {
                    show: true,
                    fontSize: 8,
                    fontWeight: 'bold',
                    color: '#9ca3af',
                    // Muestra valor absoluto + símbolo %
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
                    // Etiqueta inline con valor absoluto del porcentaje (sin signo)
                    label: {
                        show: false, // se muestran en tooltip; activar si se desea inline
                    },
                },
                {
                    name: 'Mujeres', type: 'bar', stack: 'Total',
                    data: femaleData.map((v, i) => ({ value: v, abs: femaleAbs[i] })),
                    itemStyle: { color: '#33b3a9', borderRadius: [0, 4, 4, 0] },
                    label: { show: false },
                },
                // Serie auxiliar invisible que dibuja la línea central (x=0)
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