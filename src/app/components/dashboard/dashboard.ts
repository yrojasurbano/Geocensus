/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HeroIconComponent } from '../ui/hero-icon.component';

import * as echarts from 'echarts/core';
import { BarChart, PieChart, MapChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  TitleComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, PieChart, MapChart,
  TooltipComponent, LegendComponent, GridComponent,
  VisualMapComponent, TitleComponent, CanvasRenderer
]);

interface DeptItem {
  ccdd: string;
  name: string;
  total: number;
  male: number;
  female: number;
  density: number;
}

interface ColorBreak {
  min: number;
  max: number;
  color: string;
  label: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-[#f4f7f9] min-h-screen h-auto flex flex-col font-sans text-gray-800 overflow-auto md:overflow-hidden">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <header class="bg-white shadow-sm px-4 md:px-6 py-3 md:py-2 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 relative md:sticky top-0 z-50 h-auto md:h-16 shrink-0">
        <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div class="flex items-center gap-2 cursor-pointer" routerLink="/">
            <div class="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
              <app-hero-icon [name]="'building-library'" class="w-5 h-5 md:w-6 md:h-6"></app-hero-icon>
            </div>
            <div class="flex flex-col leading-none">
              <span class="font-bold text-lg md:text-xl tracking-tight text-primary">INEI</span>
              <span class="text-[9px] md:text-[10px] font-bold tracking-widest text-gray-400">Instituto Nacional</span>
            </div>
          </div>
          <div class="h-6 md:h-8 w-px bg-gray-200 mx-1 md:mx-2"></div>
          <div class="flex items-center gap-2">
            <div class="text-right leading-tight">
              <div class="text-[9px] md:text-[10px] font-bold text-gray-400 tracking-wide">Censos Nacionales</div>
              <div class="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">2025</div>
            </div>
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-sm">
              <app-hero-icon [name]="'chart-bar'" class="w-4 h-4 md:w-5 md:h-5"></app-hero-icon>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-end">
          <div class="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto justify-center">
            <button class="w-full md:w-auto px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm bg-gradient-to-r from-[#0056a1] to-[#33b3a9] text-white tracking-wide">
              Resultados Preliminares
            </button>
          </div>
          <button routerLink="/" class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
            <app-hero-icon [name]="'x-mark'" class="w-6 h-6"></app-hero-icon>
          </button>
        </div>
      </header>

      <!-- ── Filter Bar ─────────────────────────────────────────────────── -->
      <div class="flex flex-col md:grid md:grid-cols-6 gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm sticky top-0 md:top-16 z-40 shrink-0">
        <div class="w-full md:col-span-2 bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-white flex flex-row items-center justify-center gap-6 shadow-md relative overflow-hidden group text-left">
          <div class="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div class="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
            <app-hero-icon [name]="'users'" class="w-8 h-8"></app-hero-icon>
          </div>
          <div class="relative z-10 flex flex-col min-w-0">
            <div class="text-xs font-bold opacity-80 tracking-wide mb-0.5 truncate">{{ displayedTitle() }}</div>
            <div class="text-3xl md:text-4xl font-black tracking-tighter">{{ displayedPopulation() }}</div>
            <div class="text-[10px] font-semibold opacity-70 tracking-wide mt-0.5">Población Censada</div>
          </div>
        </div>
        <div class="w-full md:col-span-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pl-0 md:pl-4 pt-2 md:pt-0">
          <button (click)="resetFilters()"
            class="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm font-black tracking-wide shrink-0 group">
            <app-hero-icon [name]="'arrow-path'" class="w-5 h-5 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
            Restablecer Filtros
          </button>
          <div class="hidden md:block h-10 w-px bg-gray-200 shrink-0"></div>
          <div class="flex gap-3 w-full md:w-auto justify-center">
            <div class="relative w-full md:w-72">
              <select
                class="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                [ngModel]="selectedCCDD()"
                (ngModelChange)="onDeptChange($event)">
                <option value="">Departamento: Todos</option>
                @for (dept of departments(); track dept.ccdd) {
                  <option [value]="dept.ccdd">{{ dept.name }}</option>
                }
              </select>
              <app-hero-icon [name]="'chevron-down'" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"></app-hero-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Main Grid ──────────────────────────────────────────────────── -->
      <div class="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 overflow-y-auto md:overflow-hidden min-h-0">

        <!-- Col 1 – Indicadores Sexo -->
        <div class="col-span-1 flex flex-col gap-3 min-h-0">
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center h-[140px] relative">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-black text-gray-400 tracking-wide">Razón de Sexo</span>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Relación de hombres por cada 100 mujeres" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="flex items-center justify-around">
              <div class="flex flex-col items-center">
                <app-hero-icon [name]="'man'" type="solid" class="w-12 h-12 text-[#0056a1]"></app-hero-icon>
                <span class="text-2xl font-black text-gray-800">94.3</span>
                <span class="text-[10px] font-bold text-gray-400">Hombres</span>
              </div>
              <div class="text-sm font-bold text-gray-300">/</div>
              <div class="flex flex-col items-center">
                <app-hero-icon [name]="'woman'" type="solid" class="w-12 h-12 text-[#33b3a9]"></app-hero-icon>
                <span class="text-2xl font-black text-gray-800">100</span>
                <span class="text-[10px] font-bold text-gray-400">Mujeres</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col relative">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Población por Sexo</h4>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Distribución de la población según sexo" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="flex-1 min-h-[100px]">
              @if (isBrowser) {
                <div echarts [options]="pieOptionsSex" class="w-full h-full"></div>
              }
            </div>
            <div class="flex justify-center gap-6 mt-2">
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1 mb-1">
                  <app-hero-icon [name]="'man'" type="solid" class="w-4 h-4 text-[#0056a1]"></app-hero-icon>
                  <span class="text-xs font-bold text-gray-500">Hombres</span>
                </div>
                <span class="text-lg font-black text-gray-800 leading-none">17,596,527</span>
                <span class="text-xs text-gray-400">48.1%</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1 mb-1">
                  <app-hero-icon [name]="'woman'" type="solid" class="w-4 h-4 text-[#33b3a9]"></app-hero-icon>
                  <span class="text-xs font-bold text-gray-500">Mujeres</span>
                </div>
                <span class="text-lg font-black text-gray-800 leading-none">18,999,999</span>
                <span class="text-xs text-gray-400">51.9%</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Habitantes por kilómetro cuadrado" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'squares-2x2'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Densidad</div>
              <div class="text-3xl font-black text-gray-800">25.4 <span class="text-sm font-bold text-gray-400">hab/km²</span></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Relación de niños (0-14) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'face-smile'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Dep. Juvenil</div>
              <div class="text-3xl font-black text-gray-800">34.2%</div>
            </div>
          </div>
        </div>

        <!-- Col 2 – Indicadores Edad -->
        <div class="col-span-1 flex flex-col gap-3 min-h-0">
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Relación adultos mayores (65+) por cada 100 jóvenes (0-14)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'clock'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Índice Envejecimiento</div>
              <div class="text-3xl font-black text-gray-800">45.6%</div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col relative">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Grupos de Edad</h4>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Distribución de la población por grandes grupos de edad" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="flex-1 min-h-[100px]">
              @if (isBrowser) {
                <div echarts [options]="pieOptionsAge" class="w-full h-full"></div>
              }
            </div>
            <div class="flex flex-col gap-3 mt-2 px-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-[#0056a1]"></div>
                  <span class="text-xs font-bold text-gray-500">0 a 14 años</span>
                </div>
                <div class="text-right leading-none">
                  <span class="text-base font-black text-gray-800 block">3,274,648</span>
                  <span class="text-xs text-gray-400">(17.7%)</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-[#33b3a9]"></div>
                  <span class="text-xs font-bold text-gray-500">15 a 64 años</span>
                </div>
                <div class="text-right leading-none">
                  <span class="text-base font-black text-gray-800 block">12,618,546</span>
                  <span class="text-xs text-gray-400">(68.3%)</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-[#facc15]"></div>
                  <span class="text-xs font-bold text-gray-500">65 años o más</span>
                </div>
                <div class="text-right leading-none">
                  <span class="text-base font-black text-gray-800 block">2,587,238</span>
                  <span class="text-xs text-gray-400">(14.0%)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Relación de dependientes (0-14 y 65+) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'user-group'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Dep. Total</div>
              <div class="text-3xl font-black text-gray-800">52.1%</div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Relación adultos mayores (65+) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'briefcase'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Dep. Adulto</div>
              <div class="text-3xl font-black text-gray-800">17.9%</div>
            </div>
          </div>
        </div>

        <!-- Cols 3-4 – Pirámide -->
        <div class="col-span-1 md:col-span-2 flex flex-col gap-3 min-h-0">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
              <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Promedio de edad de la población" matTooltipClass="custom-tooltip"></app-hero-icon>
              <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <app-hero-icon [name]="'calculator'" class="w-8 h-8"></app-hero-icon>
              </div>
              <div>
                <div class="text-xs font-black text-gray-400 tracking-wide">Edad Media</div>
                <div class="text-3xl font-black text-gray-800">31.2 <span class="text-sm font-bold text-gray-400">años</span></div>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
              <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary" matTooltip="Edad que divide la población en dos grupos iguales" matTooltipClass="custom-tooltip"></app-hero-icon>
              <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <app-hero-icon [name]="'scale'" class="w-8 h-8"></app-hero-icon>
              </div>
              <div>
                <div class="text-xs font-black text-gray-400 tracking-wide">Edad Mediana</div>
                <div class="text-3xl font-black text-gray-800">29.8 <span class="text-sm font-bold text-gray-400">años</span></div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden min-h-0 relative">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-base font-black text-gray-800 tracking-wide">Pirámide Poblacional</h3>
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
            <div class="flex-1 min-h-[300px]">
              @if (isBrowser) {
                <div echarts [options]="pyramidOptions" class="w-full h-full"></div>
              }
            </div>
          </div>
        </div>

        <!-- ── Cols 5-6: MAPA COROPLÉTICO ───────────────────────────────── -->
        <div class="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-[420px] md:min-h-0">

          <!-- Overlay: título y población dinámica -->
          <div class="absolute top-4 left-4 z-10 pointer-events-none select-none">
            <div class="text-[11px] font-black text-primary tracking-wide mb-0.5">{{ displayedTitle() }}</div>
            <div class="text-2xl font-black text-gray-900 tracking-tighter leading-none">{{ displayedPopulation() }}</div>
            <div class="text-[9px] font-bold text-gray-400 tracking-wide mt-0.5">Población Censada</div>
          </div>

          <app-hero-icon
            [name]="'information-circle'"
            class="absolute top-4 right-4 z-20 w-5 h-5 text-gray-400 cursor-pointer hover:text-primary transition-colors pointer-events-auto"
            matTooltip="Mapa coroplético por departamento. Hover para detalles, click para seleccionar."
            matTooltipClass="custom-tooltip">
          </app-hero-icon>

          <!-- Contenedor del mapa -->
          <div class="flex-1 w-full h-full min-h-0">
            @if (isBrowser && mapReady()) {
              <div
                echarts
                [options]="mapOptions"
                class="w-full h-full"
                (chartInit)="onMapChartInit($event)">
              </div>
            } @else {
              <div class="w-full h-full flex items-center justify-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <span class="text-sm font-bold text-gray-300 tracking-wide">Cargando mapa...</span>
                </div>
              </div>
            }
          </div>

          <!-- Leyenda 5 rangos cuantílicos -->
          @if (colorBreaks().length) {
            <div class="absolute bottom-4 right-4 z-10 bg-white/96 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100 pointer-events-none">
              <div class="text-[8px] font-black text-gray-400 tracking-widest uppercase mb-2">Población Total</div>
              <div class="flex flex-col gap-1.5">
                @for (brk of colorBreaks().slice().reverse(); track brk.min) {
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-3 rounded-sm shrink-0" [style.background-color]="brk.color"></div>
                    <span class="text-[9px] font-semibold text-gray-600 whitespace-nowrap">{{ brk.label }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

      </div>
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
  `]
})
export class DashboardComponent implements OnInit {

  pieOptionsSex:  EChartsOption = {};
  pieOptionsAge:  EChartsOption = {};
  pyramidOptions: EChartsOption = {};
  mapOptions:     EChartsOption = {};

  isBrowser           = false;
  selectedCCDD        = signal<string>('');
  departments         = signal<DeptItem[]>([]);
  displayedTitle      = signal<string>('Perú (Nacional)');
  displayedPopulation = signal<string>('36,596,527');
  colorBreaks         = signal<ColorBreak[]>([]);
  mapReady            = signal<boolean>(false);

  private readonly TOTAL_NAC = 36_596_527;
  private mapInstance: any = null;
  private prevSelectedName  = '';

  private platformId = inject(PLATFORM_ID);
  private http       = inject(HttpClient);
  private cdr        = inject(ChangeDetectorRef);
  private ngZone     = inject(NgZone);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initCharts();
      this.loadMapData();
    }
  }

  // ── Formatear número ─────────────────────────────────────────────────
  // Arrow function para que sea capturable como const en closures de ECharts
  private readonly fmtNum = (n: number): string =>
    Number(n).toLocaleString('es-PE');

  // ── Carga del GeoJSON y construcción del mapa ─────────────────────────
  async loadMapData(): Promise<void> {
    try {
      const geoJson = await this.http
        .get<{ features: any[] }>('/departamento_geometria.json')
        .toPromise();

      if (!geoJson?.features?.length) {
        console.error('[GEOCENSUS] GeoJSON vacío o inválido');
        return;
      }

      // ── Registrar mapa en ECharts ─────────────────────────────────────
      echarts.registerMap('peru', geoJson as any);

      // ── Construir lista de departamentos ──────────────────────────────
      const depts: DeptItem[] = geoJson.features
        .map((f: any) => ({
          ccdd:    String(f.properties.CCDD),
          name:    String(f.properties.NOMBDEP),   // ← mayúsculas exactas del GeoJSON
          total:   Number(f.properties.POBTOTAL)  || 0,
          male:    Number(f.properties.POBHOMBRE) || 0,
          female:  Number(f.properties.POBMUJER)  || 0,
          density: Number(f.properties.DENSIDAD)  || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));

      this.departments.set(depts);

      // ── Clasificación cuantílica en 5 rangos ─────────────────────────
      // Con 25 departamentos → 5 grupos de 5 cada uno
      const sortedVals = depts.map(d => d.total).sort((a, b) => a - b);
      const n          = sortedVals.length;  // 25
      const groupSize  = Math.floor(n / 5);  // 5

      // Paleta: transición lineal #0056a1 → #33b3a9
      const PALETTE = ['#0056a1', '#1a75aa', '#248cb3', '#2da3b0', '#33b3a9'];

      // Capturar fmtNum como const local (ECharts callbacks no tienen `this`)
      const fmtNum = this.fmtNum;

      const breaks: ColorBreak[] = Array.from({ length: 5 }, (_, i) => {
        const startIdx = i * groupSize;
        const endIdx   = i === 4 ? n - 1 : (i + 1) * groupSize - 1;
        const bMin     = sortedVals[startIdx];
        const bMax     = sortedVals[endIdx];
        return {
          min:   bMin,
          max:   bMax,
          color: PALETTE[i],
          label: `${fmtNum(bMin)} – ${fmtNum(bMax)}`,
        };
      });

      this.colorBreaks.set(breaks);

      // ── Función para obtener color según valor ────────────────────────
      // (usada en series data y capturada en closures de tooltip)
      const getColor = (val: number): string => {
        for (let i = 4; i >= 0; i--) {
          if (val >= breaks[i].min) return breaks[i].color;
        }
        return PALETTE[0];
      };

      // ── Datos de la serie — color asignado directamente ───────────────
      // ⚠ CLAVE: usar `itemStyle.areaColor` (NO `itemStyle.color`)
      //   El visualMap de ECharts no aplica color automáticamente a series map;
      //   hay que ponerlo explícitamente en cada dato.
      const seriesData = depts.map(d => ({
        name:    d.name,
        value:   d.total,
        male:    d.male,
        female:  d.female,
        density: d.density,
        ccdd:    d.ccdd,
        itemStyle: {
          areaColor: getColor(d.total),
        },
      }));

      // ── Construcción de EChartsOption ─────────────────────────────────
      // REGLA: ninguna función interna puede usar `this` — todo capturado como const
      this.mapOptions = {
        backgroundColor: 'transparent',

        tooltip: {
          trigger: 'item',
          showDelay: 0,
          transitionDuration: 0.1,
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 0,
          extraCssText: `
            box-shadow: 0 8px 32px rgba(0,0,0,0.14);
            border-radius: 14px;
            overflow: hidden;
            min-width: 200px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          `,
          formatter(params: any): string {
            if (!params?.data) {
              return `<div style="padding:12px 14px;font-weight:700;color:#9ca3af;font-size:11px">
                ${params.name}<br><span style="font-size:10px">Sin datos</span>
              </div>`;
            }
            const d       = params.data;
            const total   = fmtNum(d.value);
            const male    = fmtNum(d.male);
            const female  = fmtNum(d.female);
            const pctM    = d.value > 0 ? ((d.male   / d.value) * 100).toFixed(1) : '0.0';
            const pctF    = d.value > 0 ? ((d.female / d.value) * 100).toFixed(1) : '0.0';
            const density = d.density;
            return `
              <div style="padding:12px 14px">
                <div style="font-weight:900;font-size:11px;color:#0056a1;
                            text-transform:uppercase;letter-spacing:.08em;
                            padding-bottom:8px;margin-bottom:8px;
                            border-bottom:1px solid #f3f4f6">
                  ${d.name}
                </div>
                <div style="display:flex;flex-direction:column;gap:5px;font-size:11px">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px">
                    <span style="color:#6b7280;font-weight:600">Pob. Total</span>
                    <span style="font-weight:900;color:#111827;font-size:14px">${total}</span>
                  </div>
                  <div style="background:#f8fafc;border-radius:8px;padding:7px 9px;
                              display:flex;flex-direction:column;gap:5px;margin:2px 0">
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
                      <span style="color:#0056a1;font-weight:700;display:flex;align-items:center;gap:4px">
                        <span style="font-size:13px;line-height:1">♂</span> Hombres
                      </span>
                      <span style="font-weight:800;color:#0056a1">
                        ${male}
                        <span style="font-weight:400;color:#9ca3af;font-size:9px;margin-left:2px">(${pctM}%)</span>
                      </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
                      <span style="color:#33b3a9;font-weight:700;display:flex;align-items:center;gap:4px">
                        <span style="font-size:13px;line-height:1">♀</span> Mujeres
                      </span>
                      <span style="font-weight:800;color:#33b3a9">
                        ${female}
                        <span style="font-weight:400;color:#9ca3af;font-size:9px;margin-left:2px">(${pctF}%)</span>
                      </span>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:12px;
                              padding-top:3px;border-top:1px solid #f3f4f6;margin-top:1px">
                    <span style="color:#6b7280;font-weight:600">Densidad</span>
                    <span style="font-weight:700;color:#374151">${density} hab/km²</span>
                  </div>
                </div>
              </div>`;
          },
        },

        series: [
          {
            name:          'Población Censada',
            type:          'map',
            map:           'peru',
            roam:          false,          // ← MAPA FIJO, sin pan ni zoom
            layoutCenter:  ['50%', '52%'],
            layoutSize:    '98%',
            selectedMode:  'single',

            // Etiquetas en centroide de cada departamento
            label: {
              show:            true,
              fontSize:        8,
              fontWeight:      'bold',
              color:           '#000000',
              textBorderColor: '#ffffff',
              textBorderWidth: 2,
              overflow:        'truncate',
              formatter:       (params: any) => params.name,
            },

            // Estilo base del polígono (fallback si un depto no tiene dato)
            itemStyle: {
              borderColor: '#FFFFFF',
              borderWidth: 1.5,
              areaColor:   '#d1d5db',
            },

            // Hover
            emphasis: {
              disabled: false,
              label: {
                show:            true,
                fontSize:        9,
                fontWeight:      'bold',
                color:           '#000000',
                textBorderColor: '#ffffff',
                textBorderWidth: 2,
              },
              itemStyle: {
                areaColor:   '#facc15',
                borderColor: '#ffffff',
                borderWidth: 2,
                shadowBlur:  8,
                shadowColor: 'rgba(0,0,0,0.25)',
              },
            },

            // Selección (combo o click)
            select: {
              label: {
                show:            true,
                fontSize:        9,
                fontWeight:      'bold',
                color:           '#000000',
                textBorderColor: '#ffffff',
                textBorderWidth: 2,
              },
              itemStyle: {
                areaColor:   '#f97316',
                borderColor: '#ffffff',
                borderWidth: 2.5,
                shadowBlur:  12,
                shadowColor: 'rgba(249,115,22,0.35)',
              },
            },

            // ⚠ Cada item trae su propio itemStyle.areaColor
            data: seriesData,
          },
        ],
      };

      this.mapReady.set(true);
      this.cdr.markForCheck();

    } catch (err) {
      console.error('[GEOCENSUS] Error al cargar GeoJSON:', err);
    }
  }

  // ── Recibe instancia ECharts desde ngx-echarts ────────────────────────
  onMapChartInit(instance: any): void {
    this.mapInstance = instance;

    // Capturar todo lo necesario como const (no usar `this` en callbacks)
    const fmtNum     = this.fmtNum;
    const ngZone     = this.ngZone;
    const totalNac   = this.TOTAL_NAC;
    const getDepts   = () => this.departments();
    const getSelCCDD = () => this.selectedCCDD();
    const setTitle   = (t: string) => this.displayedTitle.set(t);
    const setPop     = (p: string) => this.displayedPopulation.set(p);

    // mouseover → actualizar cabecera
    instance.on('mouseover', { seriesIndex: 0 }, (params: any) => {
      if (!params?.data) return;
      ngZone.run(() => {
        setTitle(params.data.name);
        setPop(fmtNum(params.data.value));
      });
    });

    // mouseout → restaurar valor (seleccionado o nacional)
    instance.on('mouseout', { seriesIndex: 0 }, () => {
      ngZone.run(() => {
        const sel = getDepts().find(d => d.ccdd === getSelCCDD());
        if (sel) {
          setTitle(sel.name);
          setPop(fmtNum(sel.total));
        } else {
          setTitle('Perú (Nacional)');
          setPop(fmtNum(totalNac));
        }
      });
    });

    // click → sincronizar combo selector
    instance.on('click', { seriesIndex: 0 }, (params: any) => {
      if (!params?.data) return;
      ngZone.run(() => {
        const dept = getDepts().find(d => d.name === params.data.name);
        if (!dept) return;
        // toggle: doble click deselecciona
        if (getSelCCDD() === dept.ccdd) {
          this.clearSelection();
        } else {
          this.applySelection(dept.name, dept.ccdd, dept.total);
        }
      });
    });
  }

  // ── Combo selector ────────────────────────────────────────────────────
  onDeptChange(ccdd: string): void {
    if (!ccdd) {
      this.clearSelection();
      return;
    }
    const dept = this.departments().find(d => d.ccdd === ccdd);
    if (dept) this.applySelection(dept.name, dept.ccdd, dept.total);
  }

  // ── Botón Restablecer ─────────────────────────────────────────────────
  resetFilters(): void {
    this.clearSelection();
  }

  // ── Helpers de selección ──────────────────────────────────────────────
  private applySelection(name: string, ccdd: string, total: number): void {
    if (this.mapInstance) {
      // Quitar selección anterior
      if (this.prevSelectedName) {
        this.mapInstance.dispatchAction({
          type: 'unselect', seriesIndex: 0, name: this.prevSelectedName,
        });
      }
      // Aplicar nueva selección
      this.mapInstance.dispatchAction({
        type: 'select', seriesIndex: 0, name,
      });
    }
    this.prevSelectedName = name;
    this.selectedCCDD.set(ccdd);
    this.displayedTitle.set(name);
    this.displayedPopulation.set(this.fmtNum(total));
    this.cdr.markForCheck();
  }

  private clearSelection(): void {
    if (this.mapInstance && this.prevSelectedName) {
      this.mapInstance.dispatchAction({
        type: 'unselect', seriesIndex: 0, name: this.prevSelectedName,
      });
    }
    this.prevSelectedName = '';
    this.selectedCCDD.set('');
    this.displayedTitle.set('Perú (Nacional)');
    this.displayedPopulation.set(this.fmtNum(this.TOTAL_NAC));
    this.cdr.markForCheck();
  }

  // ── Gráficos estáticos ────────────────────────────────────────────────
  initCharts(): void {
    this.pieOptionsSex = {
      tooltip: { trigger: 'item' },
      legend:  { show: false },
      color:   ['#0056a1', '#33b3a9'],
      series: [{
        name: 'Sexo', type: 'pie',
        radius: ['50%', '80%'],
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
      tooltip: { trigger: 'item' },
      legend:  { show: false },
      color:   ['#0056a1', '#33b3a9', '#facc15'],
      series: [{
        name: 'Edad', type: 'pie',
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: 3274648,  name: '0-14 años' },
          { value: 12618546, name: '15-64 años' },
          { value: 2587238,  name: '65+ años' },
        ],
      }],
    };

    const ageGroups  = ['0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','75-79','80+'];
    const maleData   = [-2.5,-2.8,-3.0,-3.2,-3.5,-3.8,-4.0,-3.8,-3.5,-3.2,-3.0,-2.8,-2.5,-2.0,-1.5,-1.0,-0.5];
    const femaleData = [ 2.4, 2.7, 2.9, 3.1, 3.4, 3.7, 3.9, 3.7, 3.4, 3.1, 2.9, 2.7, 2.4, 1.9, 1.4, 0.9, 0.4];

    this.pyramidOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter(params: any): string {
          let html = `<div style="font-weight:900;font-size:10px;margin-bottom:4px">${params[0].name} años</div>`;
          params.forEach((p: any) => {
            html += `<div style="display:flex;justify-content:space-between;gap:16px;font-size:9px">
              <span style="color:#9ca3af;font-weight:600">${p.seriesName}</span>
              <span style="font-weight:900">${Math.abs(p.value)}%</span>
            </div>`;
          });
          return html;
        },
      },
      grid: { left: '2%', right: '2%', bottom: '0%', top: '5%', containLabel: true },
      xAxis: [{ type: 'value', axisLabel: { show: false }, splitLine: { show: false } }],
      yAxis: [{
        type: 'category',
        axisTick: { show: false },
        axisLine: { show: false },
        data: ageGroups,
        axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#999' },
      }],
      series: [
        { name: 'Hombres', type: 'bar', stack: 'Total', data: maleData,   itemStyle: { color: '#0056a1', borderRadius: [4, 0, 0, 4] } },
        { name: 'Mujeres', type: 'bar', stack: 'Total', data: femaleData, itemStyle: { color: '#33b3a9', borderRadius: [0, 4, 4, 0] } },
      ],
    };
  }
}