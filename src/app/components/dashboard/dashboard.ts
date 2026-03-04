/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ChangeDetectionStrategy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HeroIconComponent } from '../ui/hero-icon.component';

// Import ECharts core and modules
import * as echarts from 'echarts/core';
import { BarChart, PieChart, MapChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, VisualMapComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, 
  PieChart, 
  MapChart, 
  TooltipComponent, 
  LegendComponent, 
  GridComponent, 
  VisualMapComponent, 
  TitleComponent, 
  CanvasRenderer
]);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
  providers: [
    provideEchartsCore({ echarts }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-[#f4f7f9] min-h-screen h-auto flex flex-col font-sans text-gray-800 overflow-auto md:overflow-hidden">
      
      <!-- Dashboard Header -->
      <header class="bg-white shadow-sm px-4 md:px-6 py-3 md:py-2 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 relative md:sticky top-0 z-50 h-auto md:h-16 shrink-0">
        <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <!-- Institutional Logo -->
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

          <!-- Census Logo -->
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

      <!-- Filter Bar (Row 1) -->
      <div class="flex flex-col md:grid md:grid-cols-6 gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm sticky top-0 md:top-16 z-40 shrink-0">
        <!-- Left: Censused Population Card (2 cols) -->
        <div class="w-full md:col-span-2 bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-white flex flex-row items-center justify-center gap-6 shadow-md relative overflow-hidden group text-left">
          <div class="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          
          <div class="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
            <app-hero-icon [name]="'users'" class="w-8 h-8"></app-hero-icon>
          </div>
          
          <div class="relative z-10 flex flex-col">
            <div class="text-sm font-bold opacity-90 tracking-wide mb-1">Población Censada</div>
            <div class="text-3xl md:text-4xl font-black tracking-tighter">36,596,527</div>
          </div>
        </div>

        <!-- Right: Filter Navigation (4 cols) -->
        <div class="w-full md:col-span-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pl-0 md:pl-4 pt-2 md:pt-0">
          <button class="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm font-black tracking-wide shrink-0">
            <app-hero-icon [name]="'arrow-path'" class="w-5 h-5"></app-hero-icon> Restablecer Filtros
          </button>
          
          <div class="hidden md:block h-10 w-px bg-gray-200 shrink-0"></div>

          <div class="flex gap-3 w-full md:w-auto justify-center">
            <div class="relative w-full md:w-72">
              <div class="relative">
                <select class="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Departamento: Todos</option>
                  @for (dept of departments; track dept) {
                    <option [value]="dept">{{dept}}</option>
                  }
                </select>
                <app-hero-icon [name]="'chevron-down'" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"></app-hero-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content (Row 2) -->
      <div class="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 overflow-y-auto md:overflow-hidden min-h-0">
        
        <!-- Column 1 (Indicators) -->
        <div class="col-span-1 flex flex-col gap-3 min-h-0">
          <!-- Sex Ratio -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center h-[140px] relative group">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-black text-gray-400 tracking-wide">Razón de Sexo</span>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Relación de hombres por cada 100 mujeres" matTooltipClass="custom-tooltip"></app-hero-icon>
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

          <!-- Pop by Sex Chart -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col relative">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Población por Sexo</h4>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Distribución de la población según sexo" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="flex-1 min-h-[100px]">
              @if (isBrowser) {
                <div echarts [options]="pieOptionsSex" class="w-full h-full"></div>
              }
            </div>
            <!-- Custom Legend -->
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

          <!-- Pop Density -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Habitantes por kilómetro cuadrado" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'squares-2x2'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Densidad</div>
              <div class="text-3xl font-black text-gray-800">25.4 <span class="text-sm font-bold text-gray-400">hab/km²</span></div>
            </div>
          </div>

          <!-- Youth Dependency -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Relación de niños (0-14) respecto a población en edad activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'face-smile'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Dep. Juvenil</div>
              <div class="text-3xl font-black text-gray-800">34.2%</div>
            </div>
          </div>
        </div>

        <!-- Column 2 (Indicators) -->
        <div class="col-span-1 flex flex-col gap-3 min-h-0">
          <!-- Aging Index -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Relación de adultos mayores (65+) por cada 100 niños y jóvenes (0-14)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'clock'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Índice Envejecimiento</div>
              <div class="text-3xl font-black text-gray-800">45.6%</div>
            </div>
          </div>

          <!-- Pop by Age Groups Chart -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col relative">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-xs font-black text-gray-400 tracking-wide">Grupos de Edad</h4>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Distribución de la población por grandes grupos de edad" matTooltipClass="custom-tooltip"></app-hero-icon>
            </div>
            <div class="flex-1 min-h-[100px]">
              @if (isBrowser) {
                <div echarts [options]="pieOptionsAge" class="w-full h-full"></div>
              }
            </div>
            <!-- Custom Legend -->
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

          <!-- Total Dependency -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Relación de dependientes (0-14 y 65+) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'user-group'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Dep. Total</div>
              <div class="text-3xl font-black text-gray-800">52.1%</div>
            </div>
          </div>

          <!-- Adult Dependency -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
            <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Relación de adultos mayores (65+) respecto a población activa (15-64)" matTooltipClass="custom-tooltip"></app-hero-icon>
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <app-hero-icon [name]="'briefcase'" class="w-8 h-8"></app-hero-icon>
            </div>
            <div>
              <div class="text-xs font-black text-gray-400 tracking-wide">Dep. Adulto</div>
              <div class="text-3xl font-black text-gray-800">17.9%</div>
            </div>
          </div>
        </div>

        <!-- Columns 3 & 4 (Pyramid & Age Stats) -->
        <div class="col-span-1 md:col-span-2 flex flex-col gap-3 min-h-0">
          <div class="grid grid-cols-2 gap-3">
            <!-- Mean Age -->
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
              <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Promedio de edad de la población" matTooltipClass="custom-tooltip"></app-hero-icon>
              <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <app-hero-icon [name]="'calculator'" class="w-8 h-8"></app-hero-icon>
              </div>
              <div>
                <div class="text-xs font-black text-gray-400 tracking-wide">Edad Media</div>
                <div class="text-3xl font-black text-gray-800">31.2 <span class="text-sm font-bold text-gray-400">años</span></div>
              </div>
            </div>
            <!-- Median Age -->
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-[140px] relative">
              <app-hero-icon [name]="'information-circle'" class="absolute top-3 right-3 w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Edad que divide a la población en dos grupos numéricamente iguales" matTooltipClass="custom-tooltip"></app-hero-icon>
              <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <app-hero-icon [name]="'scale'" class="w-8 h-8"></app-hero-icon>
              </div>
              <div>
                <div class="text-xs font-black text-gray-400 tracking-wide">Edad Mediana</div>
                <div class="text-3xl font-black text-gray-800">29.8 <span class="text-sm font-bold text-gray-400">años</span></div>
              </div>
            </div>
          </div>

          <!-- Population Pyramid -->
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden min-h-0 relative">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-base font-black text-gray-800 tracking-wide">Pirámide Poblacional</h3>
              <app-hero-icon [name]="'information-circle'" class="w-5 h-5 text-black cursor-pointer hover:text-primary transition-colors" matTooltip="Distribución de la población por edad y sexo" matTooltipClass="custom-tooltip"></app-hero-icon>
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

        <!-- Columns 5 & 6 (Map) -->
        <div class="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-[400px] md:min-h-0">
          <!-- Map Header Overlay -->
          <div class="absolute top-5 left-5 z-10 pointer-events-none">
            <div class="text-sm font-black text-primary tracking-wide mb-0.5">Perú (Nacional)</div>
            <div class="text-3xl font-black text-gray-800 tracking-tighter">36,596,527</div>
            <div class="text-xs font-bold text-gray-400 tracking-wide">Población Censada</div>
          </div>
          
          <app-hero-icon [name]="'information-circle'" class="absolute top-5 right-5 z-20 w-6 h-6 text-black cursor-pointer hover:text-primary transition-colors pointer-events-auto" matTooltip="Mapa de población por departamentos" matTooltipClass="custom-tooltip"></app-hero-icon>

          <div class="flex-1 w-full h-full">
            @if (isBrowser) {
              <div echarts [options]="mapOptions" class="w-full h-full" (chartInit)="onMapInit()"></div>
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
      :host {
        height: auto;
        overflow: auto;
      }
    }
    ::ng-deep .custom-tooltip {
      background-color: white !important;
      color: #333 !important;
      border-radius: 12px !important;
      padding: 10px 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
      border: 1px solid #e5e7eb !important;
    }
  `]
})
export class DashboardComponent implements OnInit {
  pieOptionsSex: EChartsOption = {};
  pieOptionsAge: EChartsOption = {};
  pyramidOptions: EChartsOption = {};
  mapOptions: EChartsOption = {};
  
  isBrowser = false;
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  departments = [
    'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 
    'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 
    'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 
    'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 
    'Tumbes', 'Ucayali'
  ];

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.initCharts();
      this.loadMapData();
    }
  }

  onMapInit() {
    // Optional: handle map events
  }

  async loadMapData() {
    try {
      const geoJson = await this.http.get('/departamento_geometria.txt').toPromise() as { features: any[] };
      echarts.registerMap('peru', geoJson as any);
      
      this.mapOptions = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderWidth: 0,
          padding: 12,
          textStyle: { color: '#333', fontSize: 11 },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 12px;',
          formatter: (params: any) => {
            const data = params.data || { value: 0, male: 0, female: 0, density: 0 };
            return `
              <div class="font-sans">
                <div class="font-black text-primary text-[10px] tracking-wide mb-2 border-b border-gray-100 pb-1">${params.name}</div>
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between gap-8">
                    <span class="text-gray-400 font-bold text-[8px]">Población Total:</span>
                    <span class="font-black text-gray-800">${data.value.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between gap-8">
                    <span class="text-gray-400 font-bold text-[8px]">Hombres:</span>
                    <span class="font-bold text-gray-700">${data.male.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between gap-8">
                    <span class="text-gray-400 font-bold text-[8px]">Mujeres:</span>
                    <span class="font-bold text-gray-700">${data.female.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between gap-8">
                    <span class="text-gray-400 font-bold text-[8px]">Densidad:</span>
                    <span class="font-bold text-gray-700">${data.density} hab/km²</span>
                  </div>
                </div>
              </div>
            `;
          }
        },
        visualMap: {
          min: 100000,
          max: 10000000,
          left: 'right',
          bottom: '5%',
          text: ['Alto', 'Bajo'],
          realtime: false,
          calculable: true,
          inRange: {
            color: ['#33b3a9', '#0056a1']
          },
          textStyle: {
            fontSize: 10,
            fontWeight: 'bold',
            color: '#999'
          }
        },
        series: [
          {
            name: 'Población',
            type: 'map',
            map: 'peru',
            roam: true,
            emphasis: {
              label: { show: false },
              itemStyle: { areaColor: '#facc15' }
            },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1
            },
            data: geoJson.features.map((f: { properties: any }) => ({
              name: f.properties.NOMBDEP,
              value: f.properties.POBTOTAL,
              male: f.properties.POBHOMBRE,
              female: f.properties.POBMUJER,
              density: f.properties.DENSIDAD
            }))
          }
        ]
      };
    } catch (error) {
      console.error('Error loading map data:', error);
    }
  }

  initCharts() {
    // Pie Chart Sexo
    this.pieOptionsSex = {
      tooltip: { trigger: 'item' },
      legend: { show: false },
      color: ['#0056a1', '#33b3a9'],
      series: [
        {
          name: 'Sexo',
          type: 'pie',
          radius: ['50%', '80%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: [
            { value: 17596527, name: 'Hombres' },
            { value: 18999999, name: 'Mujeres' }
          ]
        }
      ]
    };

    // Pie Chart Edad
    this.pieOptionsAge = {
      tooltip: { trigger: 'item' },
      legend: { show: false },
      color: ['#0056a1', '#33b3a9', '#facc15'],
      series: [
        {
          name: 'Edad',
          type: 'pie',
          radius: ['50%', '80%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: [
            { value: 3274648, name: '0-14 años' },
            { value: 12618546, name: '15-64 años' },
            { value: 2587238, name: '65+ años' }
          ]
        }
      ]
    };

    // Pyramid Chart
    const ageGroups = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80+'];
    const maleData = [-2.5, -2.8, -3.0, -3.2, -3.5, -3.8, -4.0, -3.8, -3.5, -3.2, -3.0, -2.8, -2.5, -2.0, -1.5, -1.0, -0.5];
    const femaleData = [2.4, 2.7, 2.9, 3.1, 3.4, 3.7, 3.9, 3.7, 3.4, 3.1, 2.9, 2.7, 2.4, 1.9, 1.4, 0.9, 0.4];

    this.pyramidOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let res = `<div class="font-sans font-bold text-[10px] mb-1">${params[0].name} años</div>`;
          params.forEach((p: any) => {
            res += `<div class="flex justify-between gap-4 text-[9px]">
                      <span class="text-gray-400">${p.seriesName}:</span>
                      <span class="font-black">${Math.abs(p.value)}%</span>
                    </div>`;
          });
          return res;
        }
      },
      grid: { left: '2%', right: '2%', bottom: '0%', top: '5%', containLabel: true },
      xAxis: [{
        type: 'value',
        axisLabel: { show: false },
        splitLine: { show: false }
      }],
      yAxis: [{
        type: 'category',
        axisTick: { show: false },
        axisLine: { show: false },
        data: ageGroups,
        axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#999' }
      }],
      series: [
        {
          name: 'Hombres',
          type: 'bar',
          stack: 'Total',
          data: maleData,
          itemStyle: { color: '#0056a1', borderRadius: [4, 0, 0, 4] }
        },
        {
          name: 'Mujeres',
          type: 'bar',
          stack: 'Total',
          data: femaleData,
          itemStyle: { color: '#33b3a9', borderRadius: [0, 4, 4, 0] }
        }
      ]
    };
  }
}
