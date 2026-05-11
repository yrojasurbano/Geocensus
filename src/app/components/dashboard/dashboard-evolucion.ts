// RUTA: src/app/components/evolucion/dashboard-evolucion.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component, ChangeDetectionStrategy, OnInit,
    PLATFORM_ID, inject, signal, computed, HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HeroIconComponent } from '../ui/hero-icon.component';

import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, TooltipComponent, LegendComponent, GridComponent, MarkLineComponent, CanvasRenderer]);

// ── Interfaces ───────────────────────────────────────────────────────────────
interface GeoOption  { code: string; name: string; sortKey?: string; }
export type NivelGeoType = 'Departamental' | 'Provincial' | 'Distrital';

/** Tupla inmutable: [censo 2007, censo 2017, censo 2025] */
type Serie3 = readonly [number, number, number];

interface EvolucionData {
    readonly poblacion:            Serie3;
    readonly hombres:              Serie3;
    readonly mujeres:              Serie3;
    readonly indiceEnvejecimiento: Serie3;
    readonly pct014:               Serie3;
    readonly pct1559:              Serie3;
    readonly pct60mas:             Serie3;
    readonly vivCensadas:          Serie3;
    readonly vivOcupadas:          Serie3;
    readonly vivDesocupadas:       Serie3;
    readonly hogCensados:          Serie3;
    readonly hogPromPersonas:      Serie3;
}

interface TrendInfo { pct: number; up: boolean; label: string; }

// ── Datos ficticios coherentes por año censal ─────────────────────────────────
const CENSOS_YEARS: readonly string[] = ['2007', '2017', '2025'];

const NACIONAL: EvolucionData = {
    poblacion:            [28_220_764, 31_237_385, 36_596_527],
    hombres:              [13_951_778, 15_488_000, 17_596_527],
    mujeres:              [14_268_986, 15_749_385, 18_999_999],
    indiceEnvejecimiento: [22.8, 33.4, 45.6],
    pct014:               [31.2, 27.4, 23.2],
    pct1559:              [61.4, 63.0, 64.4],
    pct60mas:             [7.4,  9.6,  12.4],
    vivCensadas:          [7_102_274,  9_878_124, 10_624_480],
    vivOcupadas:          [6_754_074,  8_231_640,  8_462_040],
    vivDesocupadas:       [  348_200,  1_646_484,  2_162_440],
    hogCensados:          [6_754_074,  8_252_284,  9_861_890],
    hogPromPersonas:      [4.2, 3.8, 3.2],
};

const EVOLUCION_POR_CCDD: Readonly<Record<string, EvolucionData>> = {
    '': NACIONAL,
    '04': { // Arequipa
        poblacion:            [1_152_303,  1_317_278,  1_497_438],
        hombres:              [  562_284,    651_040,    738_094],
        mujeres:              [  590_019,    666_238,    759_344],
        indiceEnvejecimiento: [28.4, 38.6, 46.3],
        pct014:               [28.4, 25.2, 22.0],
        pct1559:              [64.8, 66.4, 68.2],
        pct60mas:             [6.8,  8.4,  9.8],
        vivCensadas:          [  314_006,    434_200,    518_000],
        vivOcupadas:          [  283_218,    355_800,    456_000],
        vivDesocupadas:       [   30_788,     78_400,     62_000],
        hogCensados:          [  283_218,    330_000,    468_000],
        hogPromPersonas:      [3.9, 3.5, 3.2],
    },
    '05': { // Ayacucho
        poblacion:            [  612_489,    616_176,    668_213],
        hombres:              [  302_434,    304_806,    328_956],
        mujeres:              [  310_055,    311_370,    339_257],
        indiceEnvejecimiento: [18.4, 24.2, 30.2],
        pct014:               [36.4, 33.2, 29.8],
        pct1559:              [56.4, 58.4, 61.8],
        pct60mas:             [7.2,  8.4,  8.4],
        vivCensadas:          [  142_480,    193_700,    220_000],
        vivOcupadas:          [  122_694,    158_900,    188_000],
        vivDesocupadas:       [   19_786,     34_800,     32_000],
        hogCensados:          [  122_694,    148_000,    193_600],
        hogPromPersonas:      [4.4, 4.0, 3.5],
    },
    '15': { // Lima Metropolitana
        poblacion:            [7_605_742,  9_485_405, 10_847_000],
        hombres:              [3_732_456,  4_617_742,  5_243_000],
        mujeres:              [3_873_286,  4_867_663,  5_604_000],
        indiceEnvejecimiento: [34.2, 48.6, 62.4],
        pct014:               [27.4, 23.6, 19.8],
        pct1559:              [65.2, 67.4, 69.0],
        pct60mas:             [7.4,  9.0,  11.2],
        vivCensadas:          [2_104_242,  3_082_400,  3_380_000],
        vivOcupadas:          [1_986_348,  2_521_800,  2_715_000],
        vivDesocupadas:       [  117_894,    560_600,    665_000],
        hogCensados:          [1_986_348,  2_344_000,  2_795_000],
        hogPromPersonas:      [3.8, 3.3, 3.0],
    },
    '13': { // La Libertad
        poblacion:            [1_617_050,  1_882_405,  2_016_771],
        hombres:              [  800_364,    931_572,    990_040],
        mujeres:              [  816_686,    950_833,  1_026_731],
        indiceEnvejecimiento: [20.4, 30.2, 36.4],
        pct014:               [32.4, 28.4, 25.2],
        pct1559:              [60.8, 63.0, 67.3],
        pct60mas:             [6.8,  8.6,  7.5],
        vivCensadas:          [  418_600,    579_300,    621_000],
        vivOcupadas:          [  390_480,    473_400,    549_000],
        vivDesocupadas:       [   28_120,    105_900,     72_000],
        hogCensados:          [  390_480,    440_000,    564_500],
        hogPromPersonas:      [4.1, 3.8, 3.6],
    },
};

// ── Colores del sistema de diseño ────────────────────────────────────────────
const CLR = {
    blue:   '#0056a1',
    teal:   '#33b3a9',
    purple: '#8383fd',
    sky:    '#038dd3',
    amber:  '#f59e0b',
    rose:   '#ef4444',
    green:  '#22c55e',
} as const;

@Component({
    selector:    'app-dashboard-evolucion',
    standalone:  true,
    imports:     [CommonModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
    providers:   [provideEchartsCore({ echarts })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section class="bg-[#f4f7f9] w-full flex flex-col font-sans text-gray-800 h-screen overflow-hidden"
             (click)="closeGeoDropdowns()">

      <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 flex justify-between items-center
                     px-4 py-1 sm:px-6 sm:py-1.5 md:px-10 lg:px-12 lg:py-2 w-full shrink-0">
        <div class="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain">
          </div>
          <div class="w-px h-6 md:h-7 bg-gray-200 hidden md:block"></div>
          <img src="logo_cpv.png" alt="Logo CPV 2025" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain hidden md:block">
        </div>
        <nav class="hidden lg:flex items-center gap-5 xl:gap-6 text-base font-medium tracking-wide" style="color:#0056a1">
          <button routerLink="/" class="hover:text-secondary transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/intermedia" class="hover:text-secondary transition-colors uppercase relative group font-black underline">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/publicaciones" class="hover:text-secondary transition-colors uppercase relative group">
            Publicaciones<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)" class="hover:text-secondary transition-colors uppercase relative group flex items-center gap-1">
              Censos 2025
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="censosOpen()"></app-hero-icon>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards" (click)="$event.stopPropagation()">
                <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-base font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary transition-all flex items-center gap-2 group/item">
                        <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-secondary opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"></span>
                        {{ item.label }}
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
          <button routerLink="/noticias" class="hover:text-secondary transition-colors uppercase relative group">
            Noticias<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
        </nav>
        <button (click)="toggleMobileMenu($event)" class="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors gap-1.5" aria-label="Menú">
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.rotate-45]="mobileMenuOpen()" [class.translate-y-2]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.opacity-0]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.-rotate-45]="mobileMenuOpen()" [class.-translate-y-2]="mobileMenuOpen()"></span>
        </button>
      </header>

      @if (mobileMenuOpen()) {
        <div class="lg:hidden bg-white border-b border-gray-100 shadow-md z-40 px-4 py-3 flex flex-col gap-1 shrink-0"
             style="animation: dropdownIn 0.18s ease-out forwards" (click)="$event.stopPropagation()">
          <button routerLink="/" (click)="mobileMenuOpen.set(false)" class="text-left px-3 py-2.5 rounded-xl text-base font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">Inicio</button>
          <button routerLink="/resultados" (click)="mobileMenuOpen.set(false)" class="text-left px-3 py-2.5 rounded-xl text-base font-black text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide underline">Resultados</button>
          <button routerLink="/noticias" (click)="mobileMenuOpen.set(false)" class="text-left px-3 py-2.5 rounded-xl text-base font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">Noticias</button>
        </div>
      }

      <!-- ══ BOTONERA DE SECCIONES + FILTROS GEO ══════════════════════════ -->
      <div class="w-full shrink-0" style="background:#ffffff; box-shadow: 0 2px 8px rgba(0,86,161,0.15);">
        <div class="flex items-center px-3 sm:px-5 py-1.5 gap-2" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            @for (btn of navSections; track btn.id) {
              <button [routerLink]="btn.route"
                class="relative flex flex-row items-center justify-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full
                       text-[11px] sm:text-[12px] font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none group shrink-0"
                [style]="isBtnActive(btn) ? 'background:#003d7a;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);' : 'background:#0056a1;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.15);'">
                <app-hero-icon [name]="btn.icon" class="w-3.5 h-3.5 shrink-0 text-white"></app-hero-icon>
                <span class="text-white">{{ btn.label }}</span>
                @if (!isBtnActive(btn)) {
                  <span class="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-200 pointer-events-none rounded-full bg-white"></span>
                }
              </button>
            }
          </div>

          <!-- Filtros Geo (right) -->
          <div class="ml-auto flex items-center gap-2 overflow-x-auto">
            <button (click)="resetFilters()" class="flex items-center gap-1 text-gray-400 hover:text-[#0056a1] transition-colors text-[10px] font-black tracking-wide shrink-0 group whitespace-nowrap">
              <app-hero-icon [name]="'arrow-path'" class="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
              <span>Restablecer</span>
            </button>
            <div class="h-6 w-px bg-gray-200 shrink-0"></div>
            <!-- Departamento -->
            <div class="relative shrink-0">
              <button (click)="toggleGeoDropdown('dep'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-all whitespace-nowrap justify-between" style="min-width:120px">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                  <span class="text-gray-400">Dep.:</span>
                  <span class="truncate max-w-[70px]">{{ geoDepLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 text-gray-400 transition-transform" [class.rotate-180]="openGeoDropdown() === 'dep'"></app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'dep') {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-56 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar departamento</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <button (click)="selectDep(null)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedCCDD() === ''" [class.from-\[\#0056a1\]]="selectedCCDD() === ''" [class.to-\[\#1a75aa\]]="selectedCCDD() === ''"
                      [class.text-white]="selectedCCDD() === ''" [class.text-gray-700]="selectedCCDD() !== ''" [class.hover\:bg-blue-50]="selectedCCDD() !== ''">
                      <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedCCDD() === ''" [class.border-gray-300]="selectedCCDD() !== ''">
                        @if (selectedCCDD() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic text-[11px]">Todos los departamentos</span>
                    </button>
                    @for (dept of departments(); track dept.ccdd) {
                      <button (click)="selectDep(dept)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedCCDD() === dept.ccdd" [class.from-\[\#0056a1\]]="selectedCCDD() === dept.ccdd" [class.to-\[\#1a75aa\]]="selectedCCDD() === dept.ccdd"
                        [class.text-white]="selectedCCDD() === dept.ccdd" [class.text-gray-700]="selectedCCDD() !== dept.ccdd" [class.hover\:bg-blue-50]="selectedCCDD() !== dept.ccdd">
                        <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedCCDD() === dept.ccdd" [class.border-gray-300]="selectedCCDD() !== dept.ccdd">
                          @if (selectedCCDD() === dept.ccdd) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold">{{ dept.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
            <!-- Provincia -->
            <div class="relative shrink-0">
              <button (click)="isGeoProvActive() && toggleGeoDropdown('prov'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-bold transition-all whitespace-nowrap justify-between" style="min-width:110px"
                [class.bg-gray-50]="isGeoProvActive()" [class.border-gray-200]="isGeoProvActive()" [class.text-gray-700]="isGeoProvActive()" [class.hover\:bg-gray-100]="isGeoProvActive()"
                [class.bg-gray-50\/50]="!isGeoProvActive()" [class.border-gray-100]="!isGeoProvActive()" [class.text-gray-300]="!isGeoProvActive()" [class.cursor-not-allowed]="!isGeoProvActive()">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" [class.bg-\[\#0056a1\]]="isGeoProvActive()" [class.bg-gray-200]="!isGeoProvActive()"></span>
                  <span [class.text-gray-400]="isGeoProvActive()" [class.text-gray-300]="!isGeoProvActive()">Prov.:</span>
                  <span class="truncate max-w-[60px]">{{ geoProvLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 transition-transform"
                  [class.text-gray-400]="isGeoProvActive()" [class.text-gray-200]="!isGeoProvActive()" [class.rotate-180]="openGeoDropdown() === 'prov'"></app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'prov' && isGeoProvActive()) {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-56 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar provincia</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <button (click)="selectProv('')" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedProv() === ''" [class.from-\[\#0056a1\]]="selectedProv() === ''" [class.to-\[\#1a75aa\]]="selectedProv() === ''"
                      [class.text-white]="selectedProv() === ''" [class.text-gray-700]="selectedProv() !== ''" [class.hover\:bg-blue-50]="selectedProv() !== ''">
                      <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedProv() === ''" [class.border-gray-300]="selectedProv() !== ''">
                        @if (selectedProv() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic">Todas las provincias</span>
                    </button>
                    @for (p of provinces(); track p.code) {
                      <button (click)="selectProv(p.code)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedProv() === p.code" [class.from-\[\#0056a1\]]="selectedProv() === p.code" [class.to-\[\#1a75aa\]]="selectedProv() === p.code"
                        [class.text-white]="selectedProv() === p.code" [class.text-gray-700]="selectedProv() !== p.code" [class.hover\:bg-blue-50]="selectedProv() !== p.code">
                        <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedProv() === p.code" [class.border-gray-300]="selectedProv() !== p.code">
                          @if (selectedProv() === p.code) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold">{{ p.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
            <!-- Distrito -->
            <div class="relative shrink-0">
              <button (click)="isGeoDistActive() && toggleGeoDropdown('dist'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-bold transition-all whitespace-nowrap justify-between" style="min-width:110px"
                [class.bg-gray-50]="isGeoDistActive()" [class.border-gray-200]="isGeoDistActive()" [class.text-gray-700]="isGeoDistActive()" [class.hover\:bg-gray-100]="isGeoDistActive()"
                [class.bg-gray-50\/50]="!isGeoDistActive()" [class.border-gray-100]="!isGeoDistActive()" [class.text-gray-300]="!isGeoDistActive()" [class.cursor-not-allowed]="!isGeoDistActive()">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" [class.bg-\[\#33b3a9\]]="isGeoDistActive()" [class.bg-gray-200]="!isGeoDistActive()"></span>
                  <span [class.text-gray-400]="isGeoDistActive()" [class.text-gray-300]="!isGeoDistActive()">Dist.:</span>
                  <span class="truncate max-w-[60px]">{{ geoDistLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 transition-transform"
                  [class.text-gray-400]="isGeoDistActive()" [class.text-gray-200]="!isGeoDistActive()" [class.rotate-180]="openGeoDropdown() === 'dist'"></app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'dist' && isGeoDistActive()) {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-64 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar distrito</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <button (click)="selectDist('')" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedDist() === ''" [class.from-\[\#0056a1\]]="selectedDist() === ''" [class.to-\[\#1a75aa\]]="selectedDist() === ''"
                      [class.text-white]="selectedDist() === ''" [class.text-gray-700]="selectedDist() !== ''" [class.hover\:bg-blue-50]="selectedDist() !== ''">
                      <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedDist() === ''" [class.border-gray-300]="selectedDist() !== ''">
                        @if (selectedDist() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic">Todos los distritos</span>
                    </button>
                    @for (d of districts(); track d.code) {
                      <button (click)="selectDist(d.code)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedDist() === d.code" [class.from-\[\#0056a1\]]="selectedDist() === d.code" [class.to-\[\#1a75aa\]]="selectedDist() === d.code"
                        [class.text-white]="selectedDist() === d.code" [class.text-gray-700]="selectedDist() !== d.code" [class.hover\:bg-blue-50]="selectedDist() !== d.code">
                        <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedDist() === d.code" [class.border-gray-300]="selectedDist() !== d.code">
                          @if (selectedDist() === d.code) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold">{{ d.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div><!-- /filtros geo -->
        </div>
      </div><!-- /botonera -->

      <!-- ══ BARRA DE FILTROS ══════════════════════════════════════════════ -->
      <div class="bg-white border-b border-gray-100 shadow-sm sticky z-40
                  top-[38px] sm:top-[43px] md:top-[47px] lg:top-[50px]
                  px-2 py-1.5 md:px-4 shrink-0
                  flex flex-nowrap items-center gap-2 overflow-x-auto"
           (click)="$event.stopPropagation()">

        <!-- Pill Indicadores Principales / Temáticos -->
        <div class="flex bg-gray-100 p-0.5 rounded-xl gap-0.5 shrink-0">
          <button class="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold shadow-sm bg-gradient-to-r from-[#0056a1] to-[#33b3a9] text-white tracking-wide whitespace-nowrap">
            Ind. Principales
          </button>
          <button routerLink="/comparativa" class="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-gray-400 hover:text-gray-600 tracking-wide whitespace-nowrap transition-all">
            Ind. Temáticos
          </button>
        </div>

        <!-- View tabs: Indicadores | Comparativo | Evolución -->
        <div class="flex bg-gradient-to-r from-[#0056a1]/10 to-[#33b3a9]/10 border border-[#0056a1]/20 p-0.5 rounded-xl gap-0.5 shrink-0">
          @for (tab of viewTabs; track tab.route) {
            <button [routerLink]="tab.route"
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all whitespace-nowrap"
              [style]="isViewTabActive(tab.route) ? 'background:#fff;color:#0056a1;box-shadow:0 1px 4px rgba(0,0,0,0.10);' : 'color:#9ca3af;'">
              <app-hero-icon [name]="tab.icon" class="w-3 h-3 shrink-0"></app-hero-icon>
              <span>{{ tab.label }}</span>
            </button>
          }
        </div>

        <!-- Ámbito geográfico actual -->
        <div class="ml-auto shrink-0 flex items-center gap-1.5 bg-[#0056a1]/5 border border-[#0056a1]/20 rounded-lg px-2 py-1">
          <app-hero-icon [name]="'map-pin'" class="w-3 h-3 text-[#0056a1] shrink-0"></app-hero-icon>
          <span class="text-[10px] font-black text-[#0056a1] whitespace-nowrap">{{ displayedTitle() }}</span>
        </div>

      </div><!-- /barra filtros -->

      <!-- ══ MAIN — Grid de 6 columnas ═════════════════════════════════════ -->
      <main class="flex-1 min-h-0 overflow-hidden p-2 md:p-3 xl:p-4">
        <div class="grid grid-cols-6 gap-2 xl:gap-3 h-full">

          <!-- ─────────────────────────────────────────────────────────────
               COLUMNA 1 — POBLACIÓN (3 gráficos de línea)
          ───────────────────────────────────────────────────────────────── -->
          <div class="col-span-1 flex flex-col gap-2 min-h-0">

            <!-- Cabecera de sección -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0056a1]/6 border border-[#0056a1]/15 shrink-0">
              <app-hero-icon [name]="'users'" class="w-3 h-3 text-[#0056a1]"></app-hero-icon>
              <span class="text-[8.5px] font-black text-[#0056a1] uppercase tracking-widest leading-none">Población</span>
            </div>

            <!-- 1.1 · Población censada -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <span class="text-[8px] font-black text-gray-400  tracking-wider leading-none">Población censada</span>
                @let tp1 = calcTrend(evoData().poblacion);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtShort(evoData().poblacion[2]) }}</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="tp1.up" [class.bg-emerald-50]="tp1.up"
                        [class.text-rose-700]="!tp1.up" [class.bg-rose-50]="!tp1.up">{{ tp1.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="poblacionCensadaOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

            <!-- 1.2 · Población por sexo -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <span class="text-[8px] font-black text-gray-400 tracking-wider leading-none">Población por sexo</span>
                <div class="flex items-center gap-1.5">
                  <span class="flex items-center gap-0.5"><span class="w-2 h-2 rounded-full bg-[#0056a1] shrink-0"></span><span class="text-[7.5px] font-bold text-gray-500">H</span></span>
                  <span class="flex items-center gap-0.5"><span class="w-2 h-2 rounded-full bg-[#33b3a9] shrink-0"></span><span class="text-[7.5px] font-bold text-gray-500">M</span></span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="poblacionSexoOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

            <!-- 1.3 · Índice de envejecimiento -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <span class="text-[8px] font-black text-gray-400 tracking-wider leading-none">Índice de envejecimiento</span>
                @let ti = calcTrend(evoData().indiceEnvejecimiento);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtD(evoData().indiceEnvejecimiento[2]) }}</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="ti.up" [class.bg-emerald-50]="ti.up"
                        [class.text-rose-700]="!ti.up" [class.bg-rose-50]="!ti.up">{{ ti.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="indiceEnvejecimientoOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

          </div><!-- /col 1 -->

          <!-- ─────────────────────────────────────────────────────────────
               COLUMNA 2 — ESTRUCTURA DE EDAD (3 gráficos de línea)
          ───────────────────────────────────────────────────────────────── -->
          <div class="col-span-1 flex flex-col gap-2 min-h-0">

            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#038dd3]/6 border border-[#038dd3]/15 shrink-0">
              <app-hero-icon [name]="'chart-bar'" class="w-3 h-3 text-[#038dd3]"></app-hero-icon>
              <span class="text-[8.5px] font-black text-[#038dd3] uppercase tracking-widest leading-none">Estructura de edad</span>
            </div>

            <!-- 2.1 · % 0 a 14 años -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <span class="text-[8px] font-black text-gray-400 tracking-wider leading-none">Porcentaje de personas de 0 a 14 años</span>
                @let ta = calcTrend(evoData().pct014);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtD(evoData().pct014[2]) }}%</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="ta.up" [class.bg-emerald-50]="ta.up"
                        [class.text-rose-700]="!ta.up" [class.bg-rose-50]="!ta.up">{{ ta.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="pct014Opt()" class="w-full h-full"></div>
                </div>
              }
            </div>

            <!-- 2.2 · % 15 a 59 años -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <span class="text-[8px] font-black text-gray-400 tracking-wider leading-none">Porcentaje de personas de 15 a 59 años</span>
                @let tb = calcTrend(evoData().pct1559);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtD(evoData().pct1559[2]) }}%</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="tb.up" [class.bg-emerald-50]="tb.up"
                        [class.text-rose-700]="!tb.up" [class.bg-rose-50]="!tb.up">{{ tb.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="pct1559Opt()" class="w-full h-full"></div>
                </div>
              }
            </div>

            <!-- 2.3 · % 60 años a más -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <span class="text-[8px] font-black text-gray-400 tracking-wider leading-none">Porcentaje de personas de 60 años a más</span>
                @let tc = calcTrend(evoData().pct60mas);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtD(evoData().pct60mas[2]) }}%</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="tc.up" [class.bg-emerald-50]="tc.up"
                        [class.text-rose-700]="!tc.up" [class.bg-rose-50]="!tc.up">{{ tc.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="pct60masOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

          </div><!-- /col 2 -->

          <!-- ─────────────────────────────────────────────────────────────
               COLUMNAS 3-4 — VIVIENDA (col-span-2, 3 gráficos de área)
          ───────────────────────────────────────────────────────────────── -->
          <div class="col-span-2 flex flex-col gap-2 min-h-0">

            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a7a56]/6 border border-[#1a7a56]/15 shrink-0">
              <app-hero-icon [name]="'home'" class="w-3 h-3 text-[#1a7a56]"></app-hero-icon>
              <span class="text-[8.5px] font-black text-[#1a7a56] uppercase tracking-widest leading-none">Vivienda</span>
              <span class="ml-auto text-[7.5px] font-semibold text-gray-400">Censos: 2007 · 2017 · 2025</span>
            </div>

            <!-- 3.1 · Viviendas censadas -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:#0056a1"></div>
                  <span class="text-[8px] font-black text-gray-400  tracking-wider leading-none">Viviendas censadas</span>
                </div>
                @let tv1 = calcTrend(evoData().vivCensadas);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtShort(evoData().vivCensadas[2]) }}</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="tv1.up" [class.bg-emerald-50]="tv1.up"
                        [class.text-rose-700]="!tv1.up" [class.bg-rose-50]="!tv1.up">{{ tv1.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="vivCensadasOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

            <!-- 3.2 · Viviendas ocupadas -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:#33b3a9"></div>
                  <span class="text-[8px] font-black text-gray-400  tracking-wider leading-none">Viviendas ocupadas</span>
                </div>
                @let tv2 = calcTrend(evoData().vivOcupadas);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtShort(evoData().vivOcupadas[2]) }}</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="tv2.up" [class.bg-emerald-50]="tv2.up"
                        [class.text-rose-700]="!tv2.up" [class.bg-rose-50]="!tv2.up">{{ tv2.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="vivOcupadasOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

            <!-- 3.3 · Viviendas desocupadas -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:#f59e0b"></div>
                  <span class="text-[8px] font-black text-gray-400  tracking-wider leading-none">Viviendas desocupadas</span>
                </div>
                @let tv3 = calcTrend(evoData().vivDesocupadas);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtShort(evoData().vivDesocupadas[2]) }}</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="tv3.up" [class.bg-emerald-50]="tv3.up"
                        [class.text-rose-700]="!tv3.up" [class.bg-rose-50]="!tv3.up">{{ tv3.label }}</span>
                </div>
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="vivDesocupadasOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

          </div><!-- /cols 3-4 vivienda -->

          <!-- ─────────────────────────────────────────────────────────────
               COLUMNAS 5-6 — HOGAR (col-span-2, 2 gráficos de área)
          ───────────────────────────────────────────────────────────────── -->
          <div class="col-span-2 flex flex-col gap-2 min-h-0">

            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8383fd]/6 border border-[#8383fd]/15 shrink-0">
              <app-hero-icon [name]="'home-modern'" class="w-3 h-3 text-[#8383fd]"></app-hero-icon>
              <span class="text-[8.5px] font-black text-[#8383fd] uppercase tracking-widest leading-none">Hogar</span>
              <span class="ml-auto text-[7.5px] font-semibold text-gray-400">Censos: 2007 · 2017 · 2025</span>
            </div>

            <!-- 4.1 · Hogares censados -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:#8383fd"></div>
                  <span class="text-[8px] font-black text-gray-400  tracking-wider leading-none">Hogares censados</span>
                </div>
                @let th1 = calcTrend(evoData().hogCensados);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtShort(evoData().hogCensados[2]) }}</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="th1.up" [class.bg-emerald-50]="th1.up"
                        [class.text-rose-700]="!th1.up" [class.bg-rose-50]="!th1.up">{{ th1.label }}</span>
                </div>
              </div>
              <!-- Tarjeta de resumen -->
              <div class="flex items-center gap-4 px-3 py-2 bg-[#8383fd]/4 border-b border-[#8383fd]/10 shrink-0">
                @for (yr of [0, 1, 2]; track yr) {
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[7.5px] font-bold text-gray-400 leading-none">{{ CENSOS_YEARS[yr] }}</span>
                    <span class="text-[10px] font-black tabular-nums leading-none"
                          [class.text-gray-500]="yr < 2" [class.text-[#8383fd]]="yr === 2">
                      {{ fmtShort(evoData().hogCensados[yr]) }}
                    </span>
                  </div>
                  @if (yr < 2) { <div class="w-px h-6 bg-gray-100 shrink-0"></div> }
                }
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="hogCensadosOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

            <!-- 4.2 · Promedio de personas por hogar -->
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0 border-b border-gray-50">
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:#038dd3"></div>
                  <span class="text-[8px] font-black text-gray-400  tracking-wider leading-none">Promedio de personas por hogar</span>
                </div>
                @let th2 = calcTrend(evoData().hogPromPersonas);
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[11px] font-black text-gray-800 tabular-nums">{{ fmtD(evoData().hogPromPersonas[2], 1) }}</span>
                  <span class="text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                        [class.text-emerald-700]="th2.up" [class.bg-emerald-50]="th2.up"
                        [class.text-rose-700]="!th2.up" [class.bg-rose-50]="!th2.up">{{ th2.label }}</span>
                </div>
              </div>
              <!-- Tarjeta de resumen -->
              <div class="flex items-center gap-4 px-3 py-2 bg-[#038dd3]/4 border-b border-[#038dd3]/10 shrink-0">
                @for (yr of [0, 1, 2]; track yr) {
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[7.5px] font-bold text-gray-400 leading-none">{{ CENSOS_YEARS[yr] }}</span>
                    <span class="text-[10px] font-black tabular-nums leading-none"
                          [class.text-gray-500]="yr < 2" [class.text-[#038dd3]]="yr === 2">
                      {{ fmtD(evoData().hogPromPersonas[yr], 1) }} pers.
                    </span>
                  </div>
                  @if (yr < 2) { <div class="w-px h-6 bg-gray-100 shrink-0"></div> }
                }
              </div>
              @if (isBrowser) {
                <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1">
                  <div echarts [options]="hogPromPersonasOpt()" class="w-full h-full"></div>
                </div>
              }
            </div>

          </div><!-- /cols 5-6 hogar -->

        </div><!-- /grid 6 cols -->
      </main><!-- /main -->

    </section>
  `,
    styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    ::ng-deep .custom-tooltip {
      background-color: white !important; color: #333 !important;
      border-radius: 10px !important; padding: 8px 12px !important;
      font-size: 11px !important; font-weight: 600 !important;
      box-shadow: 0 8px 12px -2px rgba(0,0,0,.1) !important;
      border: 1px solid #e5e7eb !important;
    }
  `],
})
export class DashboardEvolucionComponent implements OnInit {

    // ── Constantes exportadas al template ────────────────────────────────
    readonly CENSOS_YEARS = CENSOS_YEARS;

    // ── Header ───────────────────────────────────────────────────────────
    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);

    readonly censosMenu = [
        { label: 'Censo de Derecho',          route: '/censo-derecho' },
        { label: 'Características técnicas',  route: '/aspectos-generales' },
        { label: 'Innovaciones tecnológicas', route: '/innovaciones' },
        { label: 'Normatividad censal',        route: '/normativa' },
        { label: 'Documentación Técnica',      route: '/documentacion-tecnica' },
    ];

    @HostListener('document:click')
    onDocumentClick(): void { this.censosOpen.set(false); this.mobileMenuOpen.set(false); }
    toggleCensos(e: Event): void     { e.stopPropagation(); this.censosOpen.update(v => !v); }
    toggleMobileMenu(e: Event): void { e.stopPropagation(); this.mobileMenuOpen.update(v => !v); }

    // ── View tabs (barra de filtros) ──────────────────────────────────────
    readonly viewTabs = [
        { label: 'Indicadores',             icon: 'chart-bar',         route: '/dashboard-censada' },
        { label: 'Comparativo territorial', icon: 'map',               route: '/dashboard-territorial' },
        { label: 'Evolución',               icon: 'arrow-trending-up', route: '/dashboard-evolucion' },
    ];

    isViewTabActive(route: string): boolean {
        return this.router.url === route || this.router.url.startsWith(route + '/');
    }

    // ── Botonera de secciones ─────────────────────────────────────────────
    readonly navSections = [
        { id: 'poblacion_total',     label: 'Indicadores de Población total',                icon: 'chart-bar',      route: '/dashboard' },
        { id: 'poblacion_viviendas', label: 'Indicadores de población y viviendas censadas', icon: 'home',           route: '/dashboard-censada' },
        { id: 'comunidades',         label: 'Indicadores de comunidades indígenas',          icon: 'globe-americas', route: '/dashboard-ccomunidades' },
    ];

    /**
     * El botón "poblacion_viviendas" debe mostrarse activo cuando se está en
     * cualquiera de las sub-vistas de esa sección: Indicadores, Comparativo
     * Territorial o Evolución.
     */
    isBtnActive(btn: { id: string; route?: string }): boolean {
        const url = this.router.url;
        if (btn.id === 'poblacion_viviendas') {
            const subRoutes = ['/dashboard-censada', '/dashboard-territorial', '/dashboard-evolucion'];
            return subRoutes.some(r => url === r || url.startsWith(r + '/'));
        }
        return url === btn.route || url.startsWith((btn.route ?? '') + '/');
    }

    // ── Geo state ─────────────────────────────────────────────────────────
    readonly NIVELES_GEO: NivelGeoType[] = ['Departamental', 'Provincial', 'Distrital'];
    nivelGeo        = signal<NivelGeoType>('Departamental');
    openGeoDropdown = signal<'dep' | 'prov' | 'dist' | null>(null);
    selectedCCDD    = signal<string>('');
    selectedProv    = signal<string>('');
    selectedDist    = signal<string>('');

    isGeoProvActive = computed(() => this.nivelGeo() !== 'Departamental');
    isGeoDistActive = computed(() => this.nivelGeo() === 'Distrital');

    private rawGeoJson     = signal<any>(null);
    private rawGeoJsonProv = signal<any>(null);
    private rawGeoJsonDist = signal<any>(null);

    // ── Listas para dropdowns geo ─────────────────────────────────────────
    departments = computed<{ ccdd: string; name: string }[]>(() => {
        const geo = this.rawGeoJson(); if (!geo?.features) return [];
        const raw = (geo.features as any[]).map((f: any) => ({ ccdd: String(f.properties.CCDD), name: String(f.properties.NOMBDEP) }));
        const isLimaMet = (d: { name: string }) => d.name.toLowerCase().includes('lima') && !d.name.toLowerCase().includes('región') && !d.name.toLowerCase().includes('region');
        const isRegLima = (d: { name: string }) => d.name.toLowerCase().includes('región lima') || d.name.toLowerCase().includes('region lima');
        const limaMet = raw.find(isLimaMet); const regLima = raw.find(isRegLima);
        const resto   = raw.filter(d => !isLimaMet(d) && !isRegLima(d));
        const sorted  = [...resto].sort((a, b) => parseInt(a.ccdd, 10) - parseInt(b.ccdd, 10));
        const lambIdx = sorted.findIndex(d => d.ccdd === '14');
        const insertAt = lambIdx >= 0 ? lambIdx + 1 : sorted.length;
        const extras: typeof sorted = [];
        if (limaMet) extras.push(limaMet);
        if (regLima) extras.push(regLima);
        sorted.splice(insertAt, 0, ...extras);
        return sorted;
    });

    provinces = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonProv(); if (!geo?.features) return [];
        const ccdd = this.selectedCCDD();
        const features = ccdd
            ? (geo.features as any[]).filter(f => String(f.properties.CCDD) === ccdd)
            : (geo.features as any[]);
        return features
            .map(f => ({ code: String(f.properties.CCPP), name: String(f.properties.NOMBPROV), sortKey: String(f.properties.CCDD) + String(f.properties.CCPP) }))
            .sort((a, b) => (a.sortKey ?? '').localeCompare(b.sortKey ?? ''));
    });

    districts = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonDist(); if (!geo?.features) return [];
        const ccdd = this.selectedCCDD(); const ccpp = this.selectedProv();
        let features = geo.features as any[];
        if (ccdd) features = features.filter(f => String(f.properties.CCDD) === ccdd);
        if (ccpp) features = features.filter(f => String(f.properties.CCPP) === ccpp);
        return features
            .map(f => ({ code: String(f.properties.UBIGEO), name: String(f.properties.NOMBDIST), sortKey: String(f.properties.UBIGEO) }))
            .sort((a, b) => (a.sortKey ?? '').localeCompare(b.sortKey ?? ''));
    });

    geoDepLabel  = computed(() => { const c = this.selectedCCDD(); return c ? (this.departments().find(d => d.ccdd === c)?.name ?? c) : 'Todas'; });
    geoProvLabel = computed(() => { const c = this.selectedProv();  return c ? (this.provinces().find(p => p.code === c)?.name ?? c) : 'Todas'; });
    geoDistLabel = computed(() => { const c = this.selectedDist();  return c ? (this.districts().find(d => d.code === c)?.name ?? c) : 'Todos'; });

    displayedTitle = computed<string>(() => {
        const dist = this.selectedDist(); if (dist) return this.districts().find(d => d.code === dist)?.name ?? dist;
        const prov = this.selectedProv(); if (prov) return this.provinces().find(p => p.code === prov)?.name ?? prov;
        const ccdd = this.selectedCCDD(); if (ccdd) return this.departments().find(d => d.ccdd === ccdd)?.name ?? 'Perú (Nacional)';
        return 'Perú (Nacional)';
    });

    toggleGeoDropdown(key: 'dep' | 'prov' | 'dist'): void { this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key); }
    closeGeoDropdowns(): void { this.openGeoDropdown.set(null); }

    selectDep(dept: { ccdd: string; name: string } | null): void {
        this.selectedCCDD.set(dept?.ccdd ?? '');
        this.selectedProv.set(''); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (dept) { this.nivelGeo.set('Provincial'); this.loadGeoJsonProv(); }
        else { this.nivelGeo.set('Departamental'); }
    }

    selectProv(code: string): void {
        this.selectedProv.set(code); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (code) { this.nivelGeo.set('Distrital'); this.loadGeoJsonDist(); }
        else if (this.selectedCCDD()) { this.nivelGeo.set('Provincial'); }
    }

    selectDist(code: string): void { this.selectedDist.set(code); this.openGeoDropdown.set(null); }

    resetFilters(): void {
        this.selectedCCDD.set(''); this.selectedProv.set(''); this.selectedDist.set('');
        this.nivelGeo.set('Departamental'); this.openGeoDropdown.set(null);
    }

    // ── Datos de evolución reactivos ──────────────────────────────────────
    /**
     * Retorna el dataset de evolución correspondiente al ámbito seleccionado.
     * Si el departamento no tiene datos ficticios propios, usa el nacional.
     */
    evoData = computed<EvolucionData>(() => {
        const ccdd = this.selectedCCDD();
        return EVOLUCION_POR_CCDD[ccdd] ?? NACIONAL;
    });

    // ── Platform y carga GeoJSON ──────────────────────────────────────────
    isBrowser       = false;
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);
    private router     = inject(Router);

    constructor() { this.isBrowser = isPlatformBrowser(this.platformId); }

    ngOnInit(): void { this.loadGeoJson(); }

    private loadGeoJson(): void {
        if (this.rawGeoJson()) return;
        this.http.get<any>('/departamento_geometria.json').subscribe({ next: d => this.rawGeoJson.set(d), error: () => {} });
    }
    private loadGeoJsonProv(): void {
        if (this.rawGeoJsonProv()) return;
        this.http.get<any>('/provincia_geometria.json').subscribe({ next: d => this.rawGeoJsonProv.set(d), error: () => {} });
    }
    private loadGeoJsonDist(): void {
        if (this.rawGeoJsonDist()) return;
        this.http.get<any>('/distrito_geometria.json').subscribe({ next: d => this.rawGeoJsonDist.set(d), error: () => {} });
    }

    // ── Utilidades de formato ─────────────────────────────────────────────
    fmt(n: number): string { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
    fmtD(n: number, dec = 1): string { return n.toFixed(dec).replace('.', ','); }
    fmtShort(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
        if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
        return n.toString();
    }
    private fmtAxis(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
        if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
        return n.toString();
    }
    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    /** Calcula la variación porcentual entre 2017 y 2025 */
    calcTrend(serie: Serie3): TrendInfo {
        const prev = serie[1]; const curr = serie[2];
        if (!prev) return { pct: 0, up: true, label: '—' };
        const raw  = ((curr - prev) / Math.abs(prev)) * 100;
        const up   = raw >= 0;
        const abs  = Math.abs(raw);
        const label = `${up ? '▲' : '▼'} ${abs.toFixed(1).replace('.', ',')}%`;
        return { pct: abs, up, label };
    }

    // ── Fábrica de opciones ECharts ───────────────────────────────────────
    /** Crea la configuración base para un gráfico de línea o área (serie única). */
    private buildLineOpt(
        data:       Serie3,
        color:      string,
        isPercent = false,
        isDecimal = false,
        showArea  = true,
    ): EChartsOption {
        const formatVal = (v: number) => isPercent
            ? `${this.fmtD(v, 1)}%`
            : isDecimal
                ? this.fmtD(v, 1)
                : this.fmt(v);

        return {
            tooltip: {
                trigger:     'axis',
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding:     [6, 10],
                textStyle:   { color: '#374151', fontSize: 10 },
                formatter:   (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#9ca3af">${p.axisValue}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${color}">${formatVal(p.value as number)}</span>`;
                },
            },
            grid: { top: 8, right: 8, bottom: 18, left: 6, containLabel: true },
            xAxis: {
                type:         'category',
                data:         [...CENSOS_YEARS],
                axisTick:     { show: false },
                axisLine:     { lineStyle: { color: '#f3f4f6' } },
                axisLabel:    { fontSize: 8, fontWeight: 'bold', color: '#9ca3af' },
                boundaryGap:  false,
            },
            yAxis: {
                type:       'value',
                splitLine:  { lineStyle: { color: '#f9fafb', type: 'dashed' } },
                axisLabel:  {
                    fontSize:  7.5, color: '#d1d5db',
                    formatter: isPercent
                        ? (v: number) => `${v}%`
                        : isDecimal
                            ? (v: number) => `${v}`
                            : (v: number) => this.fmtAxis(v),
                },
                min: (val: { min: number }) => Math.floor(val.min * 0.90),
            },
            series: [{
                type:       'line',
                smooth:     true,
                symbolSize: 7,
                symbol:     'circle',
                data:       [...data],
                lineStyle:  { color, width: 2.5 },
                itemStyle:  { color, borderWidth: 2.5, borderColor: '#fff' },
                areaStyle:  showArea ? {
                    color: {
                        type:        'linear' as const,
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops:  [
                            { offset: 0, color: this.hexToRgba(color, 0.22) },
                            { offset: 1, color: this.hexToRgba(color, 0.02) },
                        ],
                    },
                } : undefined,
            }],
        };
    }

    /** Crea la configuración para un gráfico de línea con dos series (sexo). */
    private buildDualLineOpt(
        dataA:  Serie3, dataB:  Serie3,
        colorA: string, colorB: string,
        labelA: string, labelB: string,
    ): EChartsOption {
        return {
            tooltip: {
                trigger:         'axis',
                backgroundColor: '#fff',
                borderColor:     '#e5e7eb',
                borderWidth:     1,
                padding:         [6, 10],
                formatter:       (params: any) => {
                    const yr   = params[0].axisValue as string;
                    const rows = (params as any[])
                        .map(p => `<span style="color:${p.color};font-weight:800">${p.seriesName}:</span> `
                                + `<span style="font-weight:900">${this.fmt(p.value as number)}</span>`)
                        .join('<br>');
                    return `<span style="font-size:9px;font-weight:900;color:#9ca3af">${yr}</span><br>${rows}`;
                },
            },
            legend: { show: false },
            grid:   { top: 8, right: 8, bottom: 18, left: 6, containLabel: true },
            xAxis: {
                type:        'category',
                data:        [...CENSOS_YEARS],
                axisTick:    { show: false },
                axisLine:    { lineStyle: { color: '#f3f4f6' } },
                axisLabel:   { fontSize: 8, fontWeight: 'bold', color: '#9ca3af' },
                boundaryGap: false,
            },
            yAxis: {
                type:      'value',
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
                axisLabel: { fontSize: 7.5, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                min:       (val: { min: number }) => Math.floor(val.min * 0.90),
            },
            series: [
                {
                    name: labelA, type: 'line', smooth: true, symbolSize: 6, symbol: 'circle',
                    data: [...dataA],
                    lineStyle:  { color: colorA, width: 2 },
                    itemStyle:  { color: colorA, borderWidth: 2, borderColor: '#fff' },
                    areaStyle:  { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: this.hexToRgba(colorA, 0.15) }, { offset: 1, color: this.hexToRgba(colorA, 0.01) }] } },
                },
                {
                    name: labelB, type: 'line', smooth: true, symbolSize: 6, symbol: 'circle',
                    data: [...dataB],
                    lineStyle:  { color: colorB, width: 2 },
                    itemStyle:  { color: colorB, borderWidth: 2, borderColor: '#fff' },
                    areaStyle:  { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: this.hexToRgba(colorB, 0.15) }, { offset: 1, color: this.hexToRgba(colorB, 0.01) }] } },
                },
            ],
        };
    }

    // ── Computed: opciones de gráficos — POBLACIÓN ────────────────────────
    poblacionCensadaOpt  = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().poblacion, CLR.blue));
    poblacionSexoOpt     = computed<EChartsOption>(() => this.buildDualLineOpt(this.evoData().hombres, this.evoData().mujeres, CLR.blue, CLR.teal, 'Hombres', 'Mujeres'));
    indiceEnvejecimientoOpt = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().indiceEnvejecimiento, CLR.purple, false, true));

    // ── Computed: opciones de gráficos — ESTRUCTURA DE EDAD ──────────────
    pct014Opt   = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().pct014,   CLR.sky,   true));
    pct1559Opt  = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().pct1559,  CLR.teal,  true));
    pct60masOpt = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().pct60mas, CLR.amber, true));

    // ── Computed: opciones de gráficos — VIVIENDA ─────────────────────────
    vivCensadasOpt    = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().vivCensadas,    CLR.blue));
    vivOcupadasOpt    = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().vivOcupadas,    CLR.teal));
    vivDesocupadasOpt = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().vivDesocupadas, CLR.amber));

    // ── Computed: opciones de gráficos — HOGAR ────────────────────────────
    hogCensadosOpt    = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().hogCensados,    CLR.purple));
    hogPromPersonasOpt = computed<EChartsOption>(() => this.buildLineOpt(this.evoData().hogPromPersonas, CLR.sky, false, true));
}