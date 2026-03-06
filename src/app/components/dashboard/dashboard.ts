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
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HeroIconComponent } from '../ui/hero-icon.component';

// ECharts — únicamente para gráficos de pie y pirámide
import * as echarts from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, PieChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

// ── Interfaces ──────────────────────────────────────────────────────────────
interface MapRegion {
  id: number;
  ccdd: string;
  name: string;
  total: number;
  male: number;
  female: number;
  density: number;
  path: string;
  center: { x: number; y: number };
  color: string;   // color coroplético asignado
}

interface ColorBreak {
  min: number;
  max: number;
  color: string;
  label: string;
}

// ── Paleta coroplética: primario → secundario ───────────────────────────────
const PALETTE = ['#0056a1', '#1a75aa', '#248cb3', '#2da3b0', '#33b3a9'];

// ── Umbrales cuantílicos precomputados (25 deptos, grupos de 5) ─────────────
const THRESHOLDS = [347639, 721047, 1083519, 1341012];

// ── Bounds geográficos de Perú ──────────────────────────────────────────────
const B = { minLon: -81.5, maxLon: -68.5, minLat: -18.5, maxLat: 0.3 };

// ── Dimensiones del canvas SVG ──────────────────────────────────────────────
const S = { w: 380, h: 550 };


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-[#f4f7f9] h-auto md:h-screen flex flex-col font-sans text-gray-800 overflow-auto md:overflow-hidden">

      <header class="bg-white shadow-sm px-4 md:px-6 py-3 md:py-2 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 relative md:sticky top-0 z-50 h-auto md:h-16 shrink-0">
        <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI" class="h-10 md:h-12 w-auto object-contain">
          </div>
          <div class="h-6 md:h-8 w-px bg-gray-200 mx-1 md:mx-2"></div>
          <div class="flex items-center">
            <img src="logo_cpv.png" alt="Logo CPV 2025" class="h-10 md:h-12 w-auto object-contain">
          </div>
        </div>
        <div class="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-end">
          <div class="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm bg-gradient-to-r from-[#0056a1] to-[#33b3a9] text-white tracking-wide cursor-default">
              Resultados Preliminares
            </button>
            <button
              routerLink="/comparativa"
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-gray-400 hover:text-gray-600 tracking-wide">
              Comparativo Territorial
            </button>
          </div>
          <button routerLink="/" class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
            <app-hero-icon [name]="'x-mark'" class="w-6 h-6"></app-hero-icon>
          </button>
        </div>
      </header>

      <div class="flex flex-col md:grid md:grid-cols-6 gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm sticky top-0 md:top-16 z-40 shrink-0">

        <div class="w-full md:col-span-2 bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-white flex flex-row items-center justify-center gap-6 shadow-md relative overflow-hidden group text-left">
          <div class="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div class="absolute top-3 right-3 z-10 flex items-center gap-2">
            <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
              matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
            <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-white/70"
              matTooltip="Población total censada a nivel nacional o por región seleccionada" matTooltipClass="custom-tooltip"></app-hero-icon>
          </div>
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
                <option value="">Región: Todos</option>
                @for (dept of departments(); track dept.ccdd) {
                  <option [value]="dept.ccdd">{{ dept.name }}</option>
                }
              </select>
              <app-hero-icon [name]="'chevron-down'" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"></app-hero-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 md:grid-rows-[1fr] gap-3 overflow-y-auto md:overflow-hidden min-h-0">

        <div class="col-span-1 flex flex-col gap-3 min-h-0 overflow-hidden">

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col relative overflow-hidden min-h-0">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Población por Sexo</h4>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                matTooltip="Distribución de la población según sexo" matTooltipClass="custom-tooltip"></app-hero-icon>
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
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                matTooltip="Promedio de edad de la población" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'calculator'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Edad Media</div>
              <div class="text-3xl font-black text-gray-800">31.2 <span class="text-sm font-bold text-gray-400">años</span></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center h-[140px] relative">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-black text-gray-400 tracking-wide">Razón de Sexo H/M</span>
              <div class="flex items-center gap-2">
                <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                  matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
                <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                  matTooltip="Relación de hombres por cada 100 mujeres" matTooltipClass="custom-tooltip"></app-hero-icon>
              </div>
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

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                matTooltip="Relación dependientes (0-14 y 65+) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'user-group'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Rel. Dependencia Total</div>
              <div class="text-3xl font-black text-gray-800">52.1%</div>
            </div>
          </div>

        </div>

        <div class="col-span-1 flex flex-col gap-3 min-h-0 overflow-hidden">

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col relative overflow-hidden min-h-0">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Grupos de Edad</h4>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                matTooltip="Distribución de la población por grandes grupos de edad" matTooltipClass="custom-tooltip"></app-hero-icon>
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
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                matTooltip="Edad que divide la población en dos grupos iguales" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'scale'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Edad Mediana</div>
              <div class="text-3xl font-black text-gray-800">29.8 <span class="text-sm font-bold text-gray-400">años</span></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                matTooltip="Relación adultos mayores (65+) por cada 100 jóvenes (0-14)" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'clock'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Índice de Envejecimiento</div>
              <div class="text-3xl font-black text-gray-800">45.6%</div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                matTooltip="Relación niños (0-14) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'face-smile'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Rel. de Dependencia Juvenil</div>
              <div class="text-3xl font-black text-gray-800">34.2%</div>
            </div>
          </div>

        </div>

        <div class="col-span-1 md:col-span-2 flex flex-col gap-3 min-h-0 overflow-hidden">

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
            <div class="flex-1 min-h-0">
              @if (isBrowser) {
                <div echarts [options]="pyramidOptions" class="w-full h-full"></div>
              }
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">

            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 h-[140px] relative">
              <div class="absolute top-3 right-3 flex items-center gap-2">
                <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                  matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
                <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                  matTooltip="Relación adultos mayores (65+) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
              </div>
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <app-hero-icon [name]="'briefcase'" class="w-7 h-7"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-black text-gray-400 tracking-wide leading-tight">Rel. Dependencia Adulta</div>
                <div class="text-2xl font-black text-gray-800 mt-1">17.9%</div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 h-[140px] relative">
              <div class="absolute top-3 right-3 flex items-center gap-2">
                <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                  matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
                <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                  matTooltip="Habitantes totales por kilómetro cuadrado" matTooltipClass="custom-tooltip"></app-hero-icon>
              </div>
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <app-hero-icon [name]="'squares-2x2'" class="w-7 h-7"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-black text-gray-400 tracking-wide leading-tight">Densidad Pob. Total</div>
                <div class="text-2xl font-black text-gray-800 mt-1">25.4 <span class="text-xs font-bold text-gray-400">hab/km²</span></div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 h-[140px] relative">
              <div class="absolute top-3 right-3 flex items-center gap-2">
                <app-hero-icon [name]="'globe-americas'" class="w-5 h-5 cursor-pointer transition-colors animate-pulse" style="color:#343b9f"
                  matTooltip="Ver en mapa" matTooltipClass="custom-tooltip"></app-hero-icon>
                <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-gray-400"
                  matTooltip="Habitantes de 65 años o más por kilómetro cuadrado" matTooltipClass="custom-tooltip"></app-hero-icon>
              </div>
              <div class="w-12 h-12 rounded-xl bg-[#33b3a9]/10 flex items-center justify-center text-[#33b3a9] shrink-0">
                <app-hero-icon [name]="'squares-2x2'" class="w-7 h-7"></app-hero-icon>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-black text-gray-400 tracking-wide leading-tight">Densidad Pob. 65+</div>
                <div class="text-2xl font-black text-gray-800 mt-1">3.6 <span class="text-xs font-bold text-gray-400">hab/km²</span></div>
              </div>
            </div>

          </div>
          </div>

        <div class="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[420px] md:min-h-0">

          <div class="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">

            <div class="absolute top-3 left-3 z-10 pointer-events-none select-none">
              <div class="text-[10px] font-black text-primary tracking-wide mb-0.5">{{ displayedTitle() }}</div>
              <div class="text-xl font-black text-gray-900 tracking-tighter leading-none">{{ displayedPopulation() }}</div>
              <div class="text-[9px] font-bold text-gray-400 tracking-wide mt-0.5">Población Censada</div>
            </div>

            <app-hero-icon
              [name]="'information-circle'"
              class="absolute top-3 right-3 z-20 w-5 h-5 text-gray-400"
              matTooltip="Hover para ver datos del departamento. Click para seleccionar."
              matTooltipClass="custom-tooltip">
            </app-hero-icon>

            @if (isMapLoading()) {
              <div class="flex flex-col items-center gap-3 text-gray-400">
                <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <span class="text-sm font-bold tracking-wide">Cargando mapa...</span>
              </div>
            }

            @if (mapLoadError() && !isMapLoading()) {
              <div class="flex flex-col items-center gap-3 p-6 text-center">
                <div class="w-10 h-10 text-red-400">
                  <app-hero-icon [name]="'exclamation-triangle'" class="w-10 h-10"></app-hero-icon>
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-700">No se pudo cargar el mapa</p>
                  <p class="text-xs text-gray-400 mt-1">Verifica que <code class="bg-gray-100 px-1 rounded">departamento_geometria.json</code> esté en <code class="bg-gray-100 px-1 rounded">public/</code></p>
                </div>
                <button (click)="loadGeoJson()"
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
                  <p class="text-[8px] text-[#33b3a9] uppercase font-black tracking-widest mb-1">Población Censada</p>
                  <p class="text-sm font-bold text-white border-b border-gray-700 pb-1.5 mb-2 leading-tight">
                    {{ hoveredRegion()!.name }}
                  </p>
                  <div class="flex justify-between mb-2">
                    <span class="text-[8px] text-gray-400 uppercase font-bold">Total</span>
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
                        {{ hoveredRegion()!.total > 0 ? ((hoveredRegion()!.male / hoveredRegion()!.total) * 100).toFixed(1) : '0' }}%
                      </p>
                    </div>
                    <div>
                      <div class="flex items-center gap-1 mb-0.5">
                        <div class="w-1.5 h-1.5 rounded-full bg-[#33b3a9]"></div>
                        <span class="text-[7px] text-gray-400 font-bold uppercase">Mujeres</span>
                      </div>
                      <p class="text-xs font-bold">{{ fmt(hoveredRegion()!.female) }}</p>
                      <p class="text-[8px] text-gray-400">
                        {{ hoveredRegion()!.total > 0 ? ((hoveredRegion()!.female / hoveredRegion()!.total) * 100).toFixed(1) : '0' }}%
                      </p>
                    </div>
                  </div>
                  <div class="flex justify-between border-t border-gray-800 pt-1.5 mt-1.5">
                    <span class="text-[8px] text-gray-400 uppercase font-bold">Densidad</span>
                    <span class="text-xs font-bold text-yellow-400">{{ hoveredRegion()!.density }} hab/km²</span>
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
                [attr.viewBox]="'0 0 ' + svgW + ' ' + svgH"
                class="w-full h-full max-h-full"
                preserveAspectRatio="xMidYMid meet"
                style="display:block;">

                <rect width="100%" height="100%" fill="#ffffff" rx="0"/>

                @for (r of mapRegions(); track r.id) {
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

                @for (r of mapRegions(); track r.id) {
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
              </svg>

              @if (colorBreaks().length) {
                <div class="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-100 pointer-events-none">
                  <div class="text-[8px] font-black text-gray-400 tracking-widest uppercase mb-1.5">Población Total</div>
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

  // ── Estado primitivo (señales manuales) ───────────────────────────────
  isBrowser       = false;
  selectedCCDD    = signal<string>('');
  hoveredCCDD     = signal<string>('');
  isMapLoading    = signal<boolean>(false);
  mapLoadError    = signal<boolean>(false);

  // ── GeoJSON crudo ──────────────────────────────────────────────────────
  private rawGeoJson = signal<any>(null);

  // ── Constantes ────────────────────────────────────────────────────────
  private readonly TOTAL_NAC = 36_596_527;

  // ── Estado derivado (computed) ────────────────────────────────────────

  /** Regiones procesadas con paths SVG y color coroplético */
  mapRegions = computed<MapRegion[]>(() => {
    const geo = this.rawGeoJson();
    if (!geo?.features) return [];

    return (geo.features as any[]).map((f, idx) => {
      const p       = f.properties;
      const total   = Number(p.POBTOTAL)  || 0;
      const male    = Number(p.POBHOMBRE) || 0;
      const female  = Number(p.POBMUJER)  || 0;
      const density = Number(p.DENSIDAD)  || 0;
      const svg     = this.project(f.geometry);

      // Color por umbral cuantílico
      let tier = 0;
      for (let i = 0; i < THRESHOLDS.length; i++) {
        if (total >= THRESHOLDS[i]) tier = i + 1;
      }

      return {
        id:      Number(f.id) || idx,
        ccdd:    String(p.CCDD),
        name:    String(p.NOMBDEP),
        total, male, female, density,
        path:    svg.path,
        center:  svg.center,
        color:   PALETTE[tier],
      } as MapRegion;
    });
  });

  /** Lista de departamentos para el combo selector */
  departments = computed(() =>
    [...this.mapRegions()]
      .map(r => ({ ccdd: r.ccdd, name: r.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  );

  /** 5 rangos cuantílicos para la leyenda */
  colorBreaks = computed<ColorBreak[]>(() => {
    const regions = this.mapRegions();
    if (!regions.length) return [];

    const sorted = regions.map(r => r.total).sort((a, b) => a - b);
    const n  = sorted.length;
    const gs = Math.floor(n / 5);

    return Array.from({ length: 5 }, (_, i) => {
      const bMin = sorted[i * gs];
      const bMax = sorted[Math.min((i + 1) * gs - 1, n - 1)];
      return {
        min:   bMin,
        max:   bMax,
        color: PALETTE[i],
        label: `${this.fmt(bMin)} – ${this.fmt(bMax)}`,
      };
    });
  });

  /** Región sobre la que está el cursor */
  hoveredRegion = computed<MapRegion | null>(() => {
    const ccdd = this.hoveredCCDD();
    if (!ccdd) return null;
    return this.mapRegions().find(r => r.ccdd === ccdd) ?? null;
  });

  /** Región seleccionada desde el combo o click */
  selectedRegion = computed<MapRegion | null>(() => {
    const ccdd = this.selectedCCDD();
    if (!ccdd) return null;
    return this.mapRegions().find(r => r.ccdd === ccdd) ?? null;
  });

  /**
   * Título de la cabecera: hover > seleccionado > Nacional.
   * Computed puro — se actualiza automáticamente.
   */
  displayedTitle = computed<string>(() => {
    const hov = this.hoveredRegion();
    if (hov) return hov.name;
    const sel = this.selectedRegion();
    if (sel) return sel.name;
    return 'Perú (Nacional)';
  });

  /**
   * Población de la cabecera: hover > seleccionado > Nacional.
   */
  displayedPopulation = computed<string>(() => {
    const hov = this.hoveredRegion();
    if (hov) return this.fmt(hov.total);
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

  // ── Carga del GeoJSON ─────────────────────────────────────────────────
  loadGeoJson(): void {
    this.isMapLoading.set(true);
    this.mapLoadError.set(false);
    this.rawGeoJson.set(null);

    this.http.get<any>('/departamento_geometria.json').subscribe({
      next:  data => { this.rawGeoJson.set(data); this.isMapLoading.set(false); },
      error: ()   => { this.isMapLoading.set(false); this.mapLoadError.set(true); },
    });
  }

  // ── Formateador de números (público para uso en template) ─────────────
  fmt(n: number): string {
    return Number(n).toLocaleString('es-PE');
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
    // Seleccionado → ámbar; hover → amarillo; default → color coroplético
    if (this.selectedRegion()?.ccdd === r.ccdd && !this.hoveredRegion()) {
      return '#f8bd13'; // amarillo selección
    }
    if (this.hoveredRegion()?.ccdd === r.ccdd) {
      return '#f8bd13'; // amarillo hover
    }
    return r.color;
  }

  getRegionOpacity(r: MapRegion): string {
    const hov = this.hoveredRegion();
    const sel = this.selectedRegion();

    if (hov) return hov.ccdd === r.ccdd ? '1' : '0.30';
    if (sel) return sel.ccdd === r.ccdd ? '1' : '0.35';
    return '0.88';
  }

  getStrokeWidth(r: MapRegion): string {
    if (this.hoveredRegion()?.ccdd === r.ccdd)  return '2.5';
    if (this.selectedRegion()?.ccdd === r.ccdd) return '3';
    return '1.5';
  }

  getLabelOpacity(r: MapRegion): string {
    const hov = this.hoveredRegion();
    const sel = this.selectedRegion();
    if (hov) return hov.ccdd === r.ccdd ? '1' : '0.12';
    if (sel) return sel.ccdd === r.ccdd ? '1' : '0.15';
    return '1';
  }

  // ── Eventos del mapa SVG ──────────────────────────────────────────────

  onHover(r: MapRegion): void {
    this.hoveredCCDD.set(r.ccdd);
  }

  onLeave(): void {
    this.hoveredCCDD.set('');
  }

  onRegionClick(r: MapRegion): void {
    // Toggle: doble click deselecciona
    if (this.selectedCCDD() === r.ccdd) {
      this.selectedCCDD.set('');
    } else {
      this.selectedCCDD.set(r.ccdd);
    }
  }

  // ── Combo selector ────────────────────────────────────────────────────
  onDeptChange(ccdd: string): void {
    this.selectedCCDD.set(ccdd);
  }

  // ── Botón Restablecer ─────────────────────────────────────────────────
  resetFilters(): void {
    this.selectedCCDD.set('');
    this.hoveredCCDD.set('');
  }

  // ── Gráficos ECharts (pie + pirámide) ─────────────────────────────────
  initCharts(): void {
    this.pieOptionsSex = {
      tooltip: { trigger: 'item' },
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
          const pct = ['17.7%', '68.3%', '14.0%'][p.dataIndex] ?? '';
          return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div>
                  <div style="font-size:12px;font-weight:700;color:${p.color}">${Number(p.value).toLocaleString('es-PE')} <span style="color:#9ca3af;font-size:10px">(${pct})</span></div>`;
        },
      },
      grid: { top: 8, right: 6, bottom: 24, left: 6, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['0–14 años', '15–64 años', '65+ años'],
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
        max: (val: any) => Math.round(val.max * 1.18),
      },
      series: [{
        name: 'Población',
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
          formatter: (p: any) => ['17.7%', '68.3%', '14.0%'][p.dataIndex] ?? '',
        },
        data: [
          { value: 3274648,  itemStyle: { color: '#0056a1' } },
          { value: 12618546, itemStyle: { color: '#33b3a9' } },
          { value: 2587238,  itemStyle: { color: '#f8bd13' } },
        ],
      }],
    };

    const ageGroups  = ['0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','75-79','80+'];
    const maleData   = [-2.5,-2.8,-3.0,-3.2,-3.5,-3.8,-4.0,-3.8,-3.5,-3.2,-3.0,-2.8,-2.5,-2.0,-1.5,-1.0,-0.5];
    const femaleData = [ 2.4, 2.7, 2.9, 3.1, 3.4, 3.7, 3.9, 3.7, 3.4, 3.1, 2.9, 2.7, 2.4, 1.9, 1.4, 0.9, 0.4];

    this.pyramidOptions = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
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
        type: 'category', axisTick: { show: false }, axisLine: { show: false },
        data: ageGroups,
        axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#999' },
      }],
      series: [
        { name: 'Hombres', type: 'bar', stack: 'Total', data: maleData,   itemStyle: { color: '#0056a1', borderRadius: [4,0,0,4] } },
        { name: 'Mujeres', type: 'bar', stack: 'Total', data: femaleData, itemStyle: { color: '#33b3a9', borderRadius: [0,4,4,0] } },
      ],
    };
  }
}