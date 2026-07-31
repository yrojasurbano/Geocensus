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
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, GraphicComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, GraphicComponent, MarkLineComponent, CanvasRenderer]);

// ── Interfaces ──────────────────────────────────────────────────────────────
interface GeoOption { code: string; name: string; sortKey?: string; }

export type NivelGeoType    = 'Departamental' | 'Provincial' | 'Distrital';
export type NivelFiltroType = 'politico_administrativo' | 'region_natural';
export type AreaFiltroType  = 'total' | 'urbano' | 'rural';

const REGIONES_NATURALES: { key: string; label: string; color: string; ccddList: string[] }[] = [
    { key: 'costa',  label: 'Costa',  color: '#0056a1', ccddList: ['07','11','13','14','15','20','24'] },
    { key: 'sierra', label: 'Sierra', color: '#038dd3', ccddList: ['02','03','04','05','06','08','09','10','12','18','19','21','23'] },
    { key: 'selva',  label: 'Selva',  color: '#33b3a9', ccddList: ['01','16','17','22','25'] },
];

const AREA_POP_FACTORS: Record<AreaFiltroType, { pop: number; male: number; female: number; density: number }> = {
    total:  { pop: 1.000, male: 1.000, female: 1.000, density: 1.000 },
    urbano: { pop: 0.774, male: 0.768, female: 0.780, density: 1.820 },
    rural:  { pop: 0.226, male: 0.232, female: 0.220, density: 0.180 },
};

const AREA_RATE_DELTA: Record<AreaFiltroType, Partial<Record<string, number>>> = {
    total:  {},
    urbano: { edad_promedio:+2.3, edad_mediana:+2.1, razon_sexo:-3.2, indice_envejecimiento:+8.2, dep_total:-5.3, dep_juvenil:-4.1, dep_adulta:-1.2, densidad_65:+2.8,
              prom_personas:-0.3, pct_unipersonales:+3.8, pct_con_ninos:-4.2, pct_adulto_mayor:+2.4 },
    rural:  { edad_promedio:-1.8, edad_mediana:-2.4, razon_sexo:+8.4, indice_envejecimiento:-8.2, dep_total:+5.3, dep_juvenil:+4.1, dep_adulta:+1.2, densidad_65:-1.4,
              prom_personas:+0.4, pct_unipersonales:-3.8, pct_con_ninos:+4.2, pct_adulto_mayor:-2.4 },
};

// ── Mock Población ───────────────────────────────────────────────────────────
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

// ── Mock Vivienda ───────────────────────────────────────────────────────────
const MOCK_VIV: Record<string, Record<string, number>> = {
    '01':{ viv_particulares:119200,viv_colectivas:3100,viv_ocupadas:97800,viv_desocupadas:24500,viv_1hogar:90400,viv_2hogar:6100,viv_3hogar:1080,viv_4ymas:220 },
    '02':{ viv_particulares:305400,viv_colectivas:7950,viv_ocupadas:250000,viv_desocupadas:63350,viv_1hogar:230900,viv_2hogar:15500,viv_3hogar:2750,viv_4ymas:850 },
    '03':{ viv_particulares:132400,viv_colectivas:3450,viv_ocupadas:108400,viv_desocupadas:27450,viv_1hogar:100100,viv_2hogar:6730,viv_3hogar:1190,viv_4ymas:380 },
    '04':{ viv_particulares:434200,viv_colectivas:11300,viv_ocupadas:355800,viv_desocupadas:89700,viv_1hogar:328800,viv_2hogar:22100,viv_3hogar:3910,viv_4ymas:990 },
    '05':{ viv_particulares:193700,viv_colectivas:5050,viv_ocupadas:158900,viv_desocupadas:39850,viv_1hogar:146800,viv_2hogar:9860,viv_3hogar:1750,viv_4ymas:490 },
    '06':{ viv_particulares:388600,viv_colectivas:10100,viv_ocupadas:317800,viv_desocupadas:80900,viv_1hogar:293600,viv_2hogar:19700,viv_3hogar:3490,viv_4ymas:1010 },
    '07':{ viv_particulares:327600,viv_colectivas:8520,viv_ocupadas:268000,viv_desocupadas:68120,viv_1hogar:247700,viv_2hogar:16600,viv_3hogar:2940,viv_4ymas:760 },
    '08':{ viv_particulares:380200,viv_colectivas:9890,viv_ocupadas:310900,viv_desocupadas:79190,viv_1hogar:287200,viv_2hogar:19280,viv_3hogar:3410,viv_4ymas:1010 },
    '09':{ viv_particulares:100700,viv_colectivas:2620,viv_ocupadas:82500,viv_desocupadas:20820,viv_1hogar:76200,viv_2hogar:5130,viv_3hogar:910,viv_4ymas:260 },
    '10':{ viv_particulares:254700,viv_colectivas:6630,viv_ocupadas:208200,viv_desocupadas:53130,viv_1hogar:192300,viv_2hogar:12920,viv_3hogar:2290,viv_4ymas:690 },
    '11':{ viv_particulares:285700,viv_colectivas:7440,viv_ocupadas:233500,viv_desocupadas:59640,viv_1hogar:215700,viv_2hogar:14490,viv_3hogar:2570,viv_4ymas:740 },
    '12':{ viv_particulares:374200,viv_colectivas:9740,viv_ocupadas:306100,viv_desocupadas:77840,viv_1hogar:282800,viv_2hogar:19000,viv_3hogar:3360,viv_4ymas:940 },
    '13':{ viv_particulares:579300,viv_colectivas:15080,viv_ocupadas:473400,viv_desocupadas:120980,viv_1hogar:437300,viv_2hogar:29370,viv_3hogar:5210,viv_4ymas:1520 },
    '14':{ viv_particulares:379800,viv_colectivas:9890,viv_ocupadas:310500,viv_desocupadas:79190,viv_1hogar:286900,viv_2hogar:19260,viv_3hogar:3420,viv_4ymas:920 },
    '15':{ viv_particulares:3082400,viv_colectivas:80200,viv_ocupadas:2521800,viv_desocupadas:640800,viv_1hogar:2329700,viv_2hogar:156300,viv_3hogar:27750,viv_4ymas:8050 },
    '16':{ viv_particulares:297900,viv_colectivas:7750,viv_ocupadas:243100,viv_desocupadas:62550,viv_1hogar:224600,viv_2hogar:15090,viv_3hogar:2680,viv_4ymas:730 },
    '17':{ viv_particulares:50200,viv_colectivas:1310,viv_ocupadas:41100,viv_desocupadas:10410,viv_1hogar:37900,viv_2hogar:2550,viv_3hogar:452,viv_4ymas:198 },
    '18':{ viv_particulares:60300,viv_colectivas:1570,viv_ocupadas:49400,viv_desocupadas:12470,viv_1hogar:45600,viv_2hogar:3060,viv_3hogar:543,viv_4ymas:197 },
    '19':{ viv_particulares:78400,viv_colectivas:2040,viv_ocupadas:64100,viv_desocupadas:16340,viv_1hogar:59200,viv_2hogar:3980,viv_3hogar:705,viv_4ymas:215 },
    '20':{ viv_particulares:592900,viv_colectivas:15430,viv_ocupadas:484300,viv_desocupadas:124030,viv_1hogar:447400,viv_2hogar:30020,viv_3hogar:5320,viv_4ymas:1560 },
    '21':{ viv_particulares:358300,viv_colectivas:9330,viv_ocupadas:293100,viv_desocupadas:74530,viv_1hogar:270800,viv_2hogar:18180,viv_3hogar:3220,viv_4ymas:900 },
    '22':{ viv_particulares:266300,viv_colectivas:6930,viv_ocupadas:218100,viv_desocupadas:55130,viv_1hogar:201500,viv_2hogar:13520,viv_3hogar:2390,viv_4ymas:690 },
    '23':{ viv_particulares:113800,viv_colectivas:2960,viv_ocupadas:93100,viv_desocupadas:23660,viv_1hogar:86000,viv_2hogar:5780,viv_3hogar:1020,viv_4ymas:300 },
    '24':{ viv_particulares:69600,viv_colectivas:1810,viv_ocupadas:56900,viv_desocupadas:14510,viv_1hogar:52600,viv_2hogar:3530,viv_3hogar:625,viv_4ymas:145 },
    '25':{ viv_particulares:160600,viv_colectivas:4180,viv_ocupadas:131100,viv_desocupadas:33680,viv_1hogar:121100,viv_2hogar:8140,viv_3hogar:1440,viv_4ymas:420 },
};

// ── Mock Hogar ──────────────────────────────────────────────────────────────
const MOCK_HOG: Record<string, Record<string, number>> = {
    '01':{ hog_censados:90200,prom_personas:4.2,pct_unipersonales:11.3,pct_con_ninos:58.4,pct_adulto_mayor:18.6 },
    '02':{ hog_censados:232000,prom_personas:3.8,pct_unipersonales:14.2,pct_con_ninos:52.1,pct_adulto_mayor:23.8 },
    '03':{ hog_censados:100400,prom_personas:4.1,pct_unipersonales:12.4,pct_con_ninos:56.8,pct_adulto_mayor:20.2 },
    '04':{ hog_censados:330000,prom_personas:3.1,pct_unipersonales:20.6,pct_con_ninos:41.3,pct_adulto_mayor:32.4 },
    '05':{ hog_censados:148000,prom_personas:4.0,pct_unipersonales:13.1,pct_con_ninos:54.6,pct_adulto_mayor:22.4 },
    '06':{ hog_censados:296000,prom_personas:4.3,pct_unipersonales:10.8,pct_con_ninos:59.2,pct_adulto_mayor:17.4 },
    '07':{ hog_censados:249000,prom_personas:3.1,pct_unipersonales:19.4,pct_con_ninos:43.7,pct_adulto_mayor:29.6 },
    '08':{ hog_censados:289000,prom_personas:3.6,pct_unipersonales:15.8,pct_con_ninos:49.3,pct_adulto_mayor:25.6 },
    '09':{ hog_censados:77000,prom_personas:4.4,pct_unipersonales:10.2,pct_con_ninos:61.4,pct_adulto_mayor:16.8 },
    '10':{ hog_censados:193000,prom_personas:4.1,pct_unipersonales:12.6,pct_con_ninos:57.3,pct_adulto_mayor:19.8 },
    '11':{ hog_censados:217000,prom_personas:3.3,pct_unipersonales:17.8,pct_con_ninos:44.8,pct_adulto_mayor:30.2 },
    '12':{ hog_censados:285000,prom_personas:3.7,pct_unipersonales:15.4,pct_con_ninos:50.6,pct_adulto_mayor:24.4 },
    '13':{ hog_censados:440000,prom_personas:3.5,pct_unipersonales:16.2,pct_con_ninos:48.4,pct_adulto_mayor:26.8 },
    '14':{ hog_censados:288000,prom_personas:3.4,pct_unipersonales:16.8,pct_con_ninos:46.2,pct_adulto_mayor:28.4 },
    '15':{ hog_censados:2344000,prom_personas:3.0,pct_unipersonales:22.8,pct_con_ninos:38.6,pct_adulto_mayor:35.8 },
    '16':{ hog_censados:226000,prom_personas:4.5,pct_unipersonales:10.4,pct_con_ninos:62.8,pct_adulto_mayor:15.2 },
    '17':{ hog_censados:38000,prom_personas:3.8,pct_unipersonales:14.6,pct_con_ninos:52.4,pct_adulto_mayor:16.4 },
    '18':{ hog_censados:46000,prom_personas:3.0,pct_unipersonales:21.4,pct_con_ninos:40.2,pct_adulto_mayor:33.6 },
    '19':{ hog_censados:60000,prom_personas:3.9,pct_unipersonales:13.8,pct_con_ninos:53.2,pct_adulto_mayor:20.6 },
    '20':{ hog_censados:450000,prom_personas:3.6,pct_unipersonales:15.6,pct_con_ninos:50.2,pct_adulto_mayor:24.8 },
    '21':{ hog_censados:272000,prom_personas:4.2,pct_unipersonales:11.6,pct_con_ninos:57.8,pct_adulto_mayor:21.2 },
    '22':{ hog_censados:203000,prom_personas:3.8,pct_unipersonales:14.4,pct_con_ninos:52.8,pct_adulto_mayor:19.8 },
    '23':{ hog_censados:86000,prom_personas:3.2,pct_unipersonales:19.8,pct_con_ninos:42.6,pct_adulto_mayor:31.4 },
    '24':{ hog_censados:53000,prom_personas:3.5,pct_unipersonales:16.4,pct_con_ninos:48.8,pct_adulto_mayor:25.6 },
    '25':{ hog_censados:122000,prom_personas:4.1,pct_unipersonales:12.2,pct_con_ninos:56.4,pct_adulto_mayor:17.8 },
};

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
    providers: [provideEchartsCore({ echarts })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section
      class="bg-[#efefef] w-full flex flex-col font-sans text-gray-800 h-screen overflow-hidden"
      (click)="closeGeoDropdowns()">

      <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50
                     flex justify-between items-center
                     px-4 py-1 sm:px-6 sm:py-1.5 md:px-10 md:py-1.5 lg:px-12 lg:py-2
                     w-full shrink-0">
        <div class="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain">
          </div>
          <div class="w-px h-6 md:h-7 bg-gray-200 hidden md:block"></div>
          <img src="logo_cpv.png" alt="Logo CPV 2025" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain hidden md:block">
        </div>
        <nav class="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium tracking-wide" style="color:#0056a1">
          <button routerLink="/" class="hover:text-secondary transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/intermedia" class="hover:text-secondary transition-colors uppercase relative group">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/publicaciones" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
            Publicaciones<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
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
          <button routerLink="/noticias" class="hover:text-secondary transition-colors uppercase relative group">
            Noticias<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
        </nav>
        <button (click)="toggleMobileMenu($event)"
          class="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg
                 hover:bg-gray-100 transition-colors gap-1.5" aria-label="Menú">
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.rotate-45]="mobileMenuOpen()" [class.translate-y-2]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.opacity-0]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.-rotate-45]="mobileMenuOpen()" [class.-translate-y-2]="mobileMenuOpen()"></span>
        </button>
      </header>

      <!-- Menú móvil -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden bg-white border-b border-gray-100 shadow-md z-40 px-4 py-3 flex flex-col gap-1"
             style="animation: dropdownIn 0.18s ease-out forwards"
             (click)="$event.stopPropagation()">
          <button routerLink="/" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Inicio
          </button>
          <button routerLink="/intermedia" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Resultados
          </button>
          <button (click)="toggleCensos($event)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide flex items-center justify-between">
            Censos 2025
            <app-hero-icon [name]="'chevron-down'" class="w-4 h-4 transition-transform"
              [class.rotate-180]="censosOpen()"></app-hero-icon>
          </button>
          @if (censosOpen()) {
            <div class="pl-4 flex flex-col gap-0.5 border-l-2 border-blue-100 ml-3">
              @for (item of censosMenu; track item.label) {
                <button [routerLink]="item.route"
                  (click)="censosOpen.set(false); mobileMenuOpen.set(false)"
                  class="text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  {{ item.label }}
                </button>
              }
            </div>
          }
          <button routerLink="/noticias" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Noticias
          </button>
        </div>
      }

      <!-- ══ BOTONERA DE SECCIONES ══════════════════════════════════════════ -->
      <div class="w-full shrink-0"
           style="background:#efefef; box-shadow: 0 2px 8px rgba(0,86,161,0.10);">
        <div class="flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-5 md:px-6 py-1.5 sm:py-2">
          @for (btn of navSections; track btn.id) {
            <button
              [routerLink]="btn.route"
              class="relative flex flex-row items-center justify-center gap-1.5 sm:gap-2
                     px-3 sm:px-4 md:px-5 py-1 sm:py-1.5 rounded-full
                     text-[10px] sm:text-[11px] md:text-xs font-semibold text-center leading-tight
                     whitespace-nowrap transition-all duration-200 ease-out focus:outline-none group shrink-0"
              [style]="isBtnActive(btn)
                ? 'background:linear-gradient(90deg,#003d7a 0%,#1a8c7a 100%); color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.25);'
                : 'background:#efefef; color:#4b5563; box-shadow:none;'">              
              <span class="transition-colors duration-200"
                    [class.text-white]="isBtnActive(btn)"
                    [class.text-gray-600]="!isBtnActive(btn)">
                {{ btn.label }}
              </span>
              @if (!isBtnActive(btn)) {
                <span class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none rounded-full bg-gray-900"></span>
              }
            </button>
          }
        </div>
      </div>

      <!-- ══ BARRA DE FILTROS ════════════════════════════════════════════════ -->
      <div class="sticky z-40 shrink-0
                  top-[38px] sm:top-[43px] md:top-[47px] lg:top-[50px]
                  px-3 md:px-4 2xl:px-5 py-2"
           (click)="$event.stopPropagation()">
        <div class="bg-white border border-gray-200 shadow-sm
                    px-3 py-2 sm:px-4 md:px-5 2xl:px-6
                    flex flex-wrap items-center gap-2 md:gap-3"
             style="border-radius:12px">

          <!-- Ind. Principales / Ind. Temáticos -->
          <div class="flex items-center gap-1 shrink-0" (click)="$event.stopPropagation()">

            <!-- Agrupación Indicadores principales con sub-opciones en contenedor #efefef -->
            <div class="flex items-center rounded-xl shrink-0" style="background:#efefef">
              <button (click)="toggleNavSection('principales')"
                class="flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold
                       tracking-wide whitespace-nowrap transition-all duration-200 rounded-xl"
                [style]="expandedSection() === 'principales'
                  ? 'background:#caeae4;color:#424242;'
                  : 'color:#6b7280;'">                
                <span>Indicadores principales</span>
                <app-hero-icon [name]="'chevron-right'"
                  class="w-3 h-3 shrink-0 transition-transform duration-200"
                  [class.rotate-90]="expandedSection() === 'principales'"></app-hero-icon>
              </button>
            </div>

            <!-- Ind. Temáticos -->
            <button routerLink="/dashboard-tematico" (click)="$event.stopPropagation()"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs
                     font-bold tracking-wide whitespace-nowrap transition-all shrink-0"
              [style]="isViewTabActive('/dashboard-tematico')
                ? 'background:#33b3a9;color:#fff;'
                : 'background:#f3f4f6;color:#6b7280;'">
              
              <span>Indicadores temáticos</span>
              <app-hero-icon [name]="'chevron-right'" class="w-3 h-3 shrink-0"></app-hero-icon>
            </button>

          </div>

          <!-- Separador -->
          <div class="hidden sm:block h-7 w-px bg-gray-200 shrink-0"></div>

          <!-- Geo-dropdowns -->
          <div class="flex flex-wrap items-center gap-2 ml-auto">

            <!-- Restablecer filtros -->
            <button (click)="resetFilters()"
              class="flex items-center gap-1.5 text-gray-400 hover:text-[#0056a1]
                     transition-colors text-xs font-black tracking-wide shrink-0 group">
              <app-hero-icon [name]="'arrow-path'"
                class="w-4 h-4 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
              <span class="hidden sm:inline">Restablecer Filtros</span>
            </button>

            <div class="hidden sm:block h-7 w-px bg-gray-200 shrink-0"></div>

            <!-- División Territorial -->
            <div class="flex flex-col items-start gap-0.5 shrink-0" (click)="$event.stopPropagation()">
              <span class="text-[9px] font-black text-gray-400  tracking-widest px-0.5 leading-none hidden sm:block">
                Ámbito geográfico
              </span>
              <div class="relative">
                <button (click)="openNivelDropdown.update(v => !v)"
                  class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold
                         transition-all duration-200 focus:outline-none border whitespace-nowrap"
                  [style]="openNivelDropdown()
                    ? 'background:#003d7a; color:#fff; border-color:#003d7a'
                    : 'background:#0056a1; color:#fff; border-color:#0056a1'">
                  <span class="hidden sm:inline">{{ activeNivelDef().label }}</span>
                  <app-hero-icon [name]="'chevron-down'"
                    class="w-3 h-3 shrink-0 transition-transform duration-200"
                    [class.rotate-180]="openNivelDropdown()"></app-hero-icon>
                </button>
                @if (openNivelDropdown()) {
                  <div class="absolute left-0 top-full mt-1.5 bg-white rounded-xl border border-gray-200
                               shadow-xl z-50 overflow-hidden"
                       style="min-width:188px; animation:dropdownIn 0.15s ease-out"
                       (click)="$event.stopPropagation()">
                    <div class="h-0.5 w-full" style="background:linear-gradient(to right,#0056a1,#038dd3,#33b3a9)"></div>
                    <div class="px-3 pt-2 pb-1">
                      <span class="text-[9px] font-black text-gray-400  tracking-widest">Ámbito Geográfico</span>
                    </div>
                    @for (n of NIVELES_FILTRO; track n.key) {
                      <button (click)="setNivelFiltro(n.key); openNivelDropdown.set(false)"
                        class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors duration-150"
                        [class.text-white]="nivelFiltro() === n.key"
                        [class.text-gray-700]="nivelFiltro() !== n.key"
                        [class.hover\:bg-gray-50]="nivelFiltro() !== n.key"
                        [style.background]="nivelFiltro() === n.key ? '#0056a1' : ''">
                        <span class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                          [class.border-white]="nivelFiltro() === n.key"
                          [style.border-color]="nivelFiltro() !== n.key ? '#0056a1' : ''">
                          @if (nivelFiltro() === n.key) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        @if (n.icon) {
                          <app-hero-icon [name]="n.icon" class="w-3.5 h-3.5 shrink-0"
                            [class.text-white]="nivelFiltro() === n.key"
                            [style.color]="nivelFiltro() !== n.key ? '#0056a1' : ''"></app-hero-icon>
                        }
                        <span class="font-semibold flex-1">{{ n.label }}</span>
                      </button>
                    }
                    <div class="h-1"></div>
                  </div>
                }
              </div>
            </div>

            <div class="hidden sm:block h-7 w-px bg-gray-200 shrink-0"></div>

            <!-- ★ Región Natural -->
            @if (nivelFiltro() === 'region_natural') {
              <div class="relative shrink-0">
                <button (click)="openRegionDropdown.update(v => !v)"
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                         text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all
                         min-w-[140px] sm:min-w-[156px] justify-between">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:#33b3a9"></span>
                    <span class="text-gray-400 mr-0.5">Región:</span>
                    <span class="truncate max-w-[72px]">{{ regionNaturalLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 text-gray-400 transition-transform"
                    [class.rotate-180]="openRegionDropdown()"></app-hero-icon>
                </button>
                @if (openRegionDropdown()) {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-48 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="h-0.5 w-full" style="background:linear-gradient(to right,#33b3a9,#038dd3)"></div>
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400  tracking-widest">Región natural</span>
                    </div>
                    <button (click)="selectRegionNatural('')"
                      class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                      [class.text-white]="selectedRegionNatural() === ''"
                      [class.text-gray-700]="selectedRegionNatural() !== ''"
                      [class.hover\:bg-teal-50]="selectedRegionNatural() !== ''"
                      [style.background]="selectedRegionNatural() === '' ? '#33b3a9' : ''">
                      <span class="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center"
                        [class.border-white]="selectedRegionNatural() === ''"
                        [class.border-gray-300]="selectedRegionNatural() !== ''">
                        @if (selectedRegionNatural() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic">Todas las regiones</span>
                    </button>
                    @for (rn of REGIONES_NATURALES; track rn.key) {
                      <button (click)="selectRegionNatural(rn.key)"
                        class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                        [class.text-white]="selectedRegionNatural() === rn.key"
                        [class.text-gray-700]="selectedRegionNatural() !== rn.key"
                        [class.hover\:bg-gray-50]="selectedRegionNatural() !== rn.key"
                        [style.background]="selectedRegionNatural() === rn.key ? rn.color : ''">
                        <span class="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedRegionNatural() === rn.key"
                          [style.border-color]="selectedRegionNatural() !== rn.key ? rn.color : ''">
                          @if (selectedRegionNatural() === rn.key) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold flex-1">{{ rn.label }}</span>
                        <span class="w-2 h-2 rounded-full shrink-0 opacity-70"
                          [style.background]="selectedRegionNatural() !== rn.key ? rn.color : 'rgba(255,255,255,0.6)'"></span>
                      </button>
                    }
                    <div class="h-1"></div>
                  </div>
                }
              </div>
            }

            <!-- ★ Departamento (oculto en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
              <div class="flex flex-col gap-0.5">
                <span class="text-[9px] font-bold text-gray-400  tracking-widest px-1">Departamento</span>
                <div class="relative">
                <button (click)="toggleGeoDropdown('dep'); $event.stopPropagation()"
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                         text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all
                         min-w-[130px] sm:min-w-[148px] justify-between">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                    <span class="truncate max-w-[90px] sm:max-w-[100px]">{{ geoDepLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 text-gray-400 transition-transform"
                    [class.rotate-180]="openGeoDropdown() === 'dep'"></app-hero-icon>
                </button>
                @if (openGeoDropdown() === 'dep') {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-56 sm:w-60 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar departamento</span>
                    </div>
                    <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                      <button (click)="selectDep(null)"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedCCDD() === ''" [class.from-\[\#0056a1\]]="selectedCCDD() === ''" [class.to-\[\#1a75aa\]]="selectedCCDD() === ''"
                        [class.text-white]="selectedCCDD() === ''" [class.text-gray-700]="selectedCCDD() !== ''" [class.hover\:bg-blue-50]="selectedCCDD() !== ''">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedCCDD() === ''" [class.border-gray-300]="selectedCCDD() !== ''">
                          @if (selectedCCDD() === '') { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-bold italic text-xs">Todos los departamentos</span>
                      </button>
                      @for (dept of departments(); track dept.ccdd) {
                        <button (click)="selectDep(dept)"
                          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                          [class.bg-gradient-to-r]="selectedCCDD() === dept.ccdd" [class.from-\[\#0056a1\]]="selectedCCDD() === dept.ccdd" [class.to-\[\#1a75aa\]]="selectedCCDD() === dept.ccdd"
                          [class.text-white]="selectedCCDD() === dept.ccdd" [class.text-gray-700]="selectedCCDD() !== dept.ccdd" [class.hover\:bg-blue-50]="selectedCCDD() !== dept.ccdd">
                          <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            [class.border-white]="selectedCCDD() === dept.ccdd" [class.border-gray-300]="selectedCCDD() !== dept.ccdd">
                            @if (selectedCCDD() === dept.ccdd) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold">{{ dept.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
              </div>
            }

            <!-- ★ Provincia (oculta en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
              <div class="flex flex-col gap-0.5">
                <span class="text-[9px] font-bold  tracking-widest px-1"
                  [class.text-gray-400]="isGeoProvActive()"
                  [class.text-gray-300]="!isGeoProvActive()">Provincia</span>
                <div class="relative">
                <button (click)="isGeoProvActive() && toggleGeoDropdown('prov'); $event.stopPropagation()"
                  class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all
                         min-w-[130px] sm:min-w-[148px] justify-between"
                  [class.bg-gray-50]="isGeoProvActive()" [class.border-gray-200]="isGeoProvActive()"
                  [class.text-gray-700]="isGeoProvActive()" [class.hover\:bg-gray-100]="isGeoProvActive()"
                  [class.bg-gray-50\/50]="!isGeoProvActive()" [class.border-gray-100]="!isGeoProvActive()"
                  [class.text-gray-300]="!isGeoProvActive()" [class.cursor-not-allowed]="!isGeoProvActive()">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0"
                      [class.bg-\[\#1a75aa\]]="isGeoProvActive()" [class.bg-gray-200]="!isGeoProvActive()"></span>
                    <span class="truncate max-w-[80px] sm:max-w-[90px]">{{ geoProvLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                    [class.text-gray-400]="isGeoProvActive()" [class.text-gray-200]="!isGeoProvActive()"
                    [class.rotate-180]="openGeoDropdown() === 'prov'"></app-hero-icon>
                </button>
                @if (openGeoDropdown() === 'prov' && isGeoProvActive()) {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-60 sm:w-64 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar provincia</span>
                    </div>
                    <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                      <button (click)="selectProv('')"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedProv() === ''" [class.from-\[\#0056a1\]]="selectedProv() === ''" [class.to-\[\#1a75aa\]]="selectedProv() === ''"
                        [class.text-white]="selectedProv() === ''" [class.text-gray-700]="selectedProv() !== ''" [class.hover\:bg-blue-50]="selectedProv() !== ''">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedProv() === ''" [class.border-gray-300]="selectedProv() !== ''">
                          @if (selectedProv() === '') { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-bold italic">Todas las provincias</span>
                      </button>
                      @for (p of provinces(); track p.code) {
                        <button (click)="selectProv(p.code)"
                          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                          [class.bg-gradient-to-r]="selectedProv() === p.code" [class.from-\[\#0056a1\]]="selectedProv() === p.code" [class.to-\[\#1a75aa\]]="selectedProv() === p.code"
                          [class.text-white]="selectedProv() === p.code" [class.text-gray-700]="selectedProv() !== p.code" [class.hover\:bg-blue-50]="selectedProv() !== p.code">
                          <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            [class.border-white]="selectedProv() === p.code" [class.border-gray-300]="selectedProv() !== p.code">
                            @if (selectedProv() === p.code) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold">{{ p.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
              </div>
            }

            <!-- ★ Distrito (oculto en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
              <div class="flex flex-col gap-0.5">
                <span class="text-[9px] font-bold  tracking-widest px-1"
                  [class.text-gray-400]="isGeoDistActive()"
                  [class.text-gray-300]="!isGeoDistActive()">Distrito</span>
                <div class="relative">
                <button (click)="isGeoDistActive() && toggleGeoDropdown('dist'); $event.stopPropagation()"
                  class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all
                         min-w-[120px] sm:min-w-[140px] justify-between"
                  [class.bg-gray-50]="isGeoDistActive()" [class.border-gray-200]="isGeoDistActive()"
                  [class.text-gray-700]="isGeoDistActive()" [class.hover\:bg-gray-100]="isGeoDistActive()"
                  [class.bg-gray-50\/50]="!isGeoDistActive()" [class.border-gray-100]="!isGeoDistActive()"
                  [class.text-gray-300]="!isGeoDistActive()" [class.cursor-not-allowed]="!isGeoDistActive()">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0"
                      [class.bg-\[\#33b3a9\]]="isGeoDistActive()" [class.bg-gray-200]="!isGeoDistActive()"></span>
                    <span class="truncate max-w-[75px] sm:max-w-[85px]">{{ geoDistLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                    [class.text-gray-400]="isGeoDistActive()" [class.text-gray-200]="!isGeoDistActive()"
                    [class.rotate-180]="openGeoDropdown() === 'dist'"></app-hero-icon>
                </button>
                @if (openGeoDropdown() === 'dist' && isGeoDistActive()) {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-72 sm:w-80 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar distrito</span>
                    </div>
                    <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                      <button (click)="selectDist('')"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedDist() === ''" [class.from-\[\#0056a1\]]="selectedDist() === ''" [class.to-\[\#1a75aa\]]="selectedDist() === ''"
                        [class.text-white]="selectedDist() === ''" [class.text-gray-700]="selectedDist() !== ''" [class.hover\:bg-blue-50]="selectedDist() !== ''">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedDist() === ''" [class.border-gray-300]="selectedDist() !== ''">
                          @if (selectedDist() === '') { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-bold italic">Todos los distritos</span>
                      </button>
                      @for (d of districts(); track d.code) {
                        <button (click)="selectDist(d.code)"
                          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                          [class.bg-gradient-to-r]="selectedDist() === d.code" [class.from-\[\#0056a1\]]="selectedDist() === d.code" [class.to-\[\#1a75aa\]]="selectedDist() === d.code"
                          [class.text-white]="selectedDist() === d.code" [class.text-gray-700]="selectedDist() !== d.code" [class.hover\:bg-blue-50]="selectedDist() !== d.code">
                          <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            [class.border-white]="selectedDist() === d.code" [class.border-gray-300]="selectedDist() !== d.code">
                            @if (selectedDist() === d.code) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold">{{ d.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
              </div>
            }

            <!-- ★ Área (después de Distrito, oculta en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
              <div class="flex flex-col items-start gap-0.5 shrink-0" (click)="$event.stopPropagation()">
                <span class="text-[9px] font-black text-gray-400  tracking-widest px-0.5 leading-none hidden sm:block">Área de residencia</span>
                <div class="relative">
                  <button (click)="openAreaDropdown.update(v => !v)"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                           transition-all duration-200 focus:outline-none border whitespace-nowrap"
                    [style]="openAreaDropdown()
                      ? 'background:#dcdcdc; color:#374151; border-color:#d1d5db'
                      : 'background:#efefef; color:#374151; border-color:#e5e7eb'">
                    <span>{{ areaLabel() }}</span>
                    <app-hero-icon [name]="'chevron-down'"
                      class="w-3 h-3 shrink-0 transition-transform duration-200"
                      [class.rotate-180]="openAreaDropdown()"></app-hero-icon>
                  </button>
                  @if (openAreaDropdown()) {
                    <div class="absolute right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-200
                                 shadow-xl z-50 overflow-hidden"
                         style="min-width:148px; animation:dropdownIn 0.15s ease-out"
                         (click)="$event.stopPropagation()">
                      <div class="h-0.5 w-full" style="background:#d1d5db"></div>
                      <div class="px-3 pt-2 pb-1">
                        <span class="text-[9px] font-black text-gray-400  tracking-widest">Seleccionar área</span>
                      </div>
                      @for (a of AREAS_FILTRO; track a.key) {
                        <button (click)="areaFiltro.set(a.key); openAreaDropdown.set(false)"
                          class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                          [class.text-white]="areaFiltro() === a.key"
                          [class.text-gray-700]="areaFiltro() !== a.key"
                          [class.hover\:bg-gray-50]="areaFiltro() !== a.key"
                          [style.background]="areaFiltro() === a.key ? '#6b7280' : ''">
                          <span class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                            [class.border-white]="areaFiltro() === a.key"
                            [style.border-color]="areaFiltro() !== a.key ? '#6b7280' : ''">
                            @if (areaFiltro() === a.key) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold flex-1">{{ a.label }}</span>
                        </button>
                      }
                      <div class="h-1"></div>
                    </div>
                  }
                </div>
              </div>
            }

          </div><!-- /geo-dropdowns -->
        </div><!-- /inner filtros redondeado -->
      </div><!-- /sticky wrapper barra de filtros -->

      <!-- ══ SUB-NAV VISTAS INDICADORES PRINCIPALES ═══════════════════════════ -->
      <div class="w-full shrink-0 px-3 md:px-4 2xl:px-5 pb-1.5"
           style="background:#efefef;">
        <div class="flex items-center gap-1">
          @for (tab of viewTabs; track tab.route) {
            <button [routerLink]="tab.route"
              class="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] sm:text-xs
                     font-bold tracking-wide transition-all whitespace-nowrap"
              [style]="isViewTabActive(tab.route)
                ? 'background:#caeae4;color:#424242;'
                : 'color:#9ca3af;'">
              <span>{{ tab.label }}</span>
            </button>
          }
        </div>
      </div>

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
               Desktop xl: 2 columnas con grid-rows fijas (layout actualizado)
               Row 1 (10%): KPI Población Censada (2 cols)
               Row 2 (~52%): Gráficos Sexo + Grandes Grupos
               Rows 3-6 (10% c/u): KPIs secundarios
          ══════════════════════════════════════════════════════════════════ -->
          <div class="col-span-1 md:col-span-1 xl:col-span-2 xl:row-span-2
                      grid grid-cols-2 gap-3
                      xl:grid-rows-[1fr_6fr_1fr_1fr_1fr] xl:min-h-0 xl:overflow-hidden">

            <!-- ── ROW 1: KPI Principal — Población Censada (col-span-2) ── -->
            <div class="col-span-2 bg-gradient-to-r from-primary to-secondary rounded-xl
                        px-3 md:px-4 py-2 shadow-md border border-primary/20
                        text-white flex flex-row items-center gap-3 md:gap-5
                        relative overflow-hidden group min-h-[60px] xl:min-h-0">
              <!-- Decoración -->
              <div class="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
              <!-- Acciones -->
              <div class="absolute top-1.5 right-2 z-10 flex items-center gap-1.5">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  
                </span>
                <span matTooltip="Cantidad de residentes habituales" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/60"></app-hero-icon>
                </span>
              </div>
              <!-- Ícono -->
              <div class="shrink-0 relative z-10">
                <img src="pobcensada.svg" class="w-8 h-8 md:w-10 md:h-10 xl:w-9 xl:h-9" style="filter: brightness(0) invert(1);">
              </div>
              <!-- Datos -->
              <div class="relative z-10 flex flex-col min-w-0">
                <div class="text-[9px] md:text-[10px] font-bold opacity-80 tracking-wide truncate">{{ displayedTitle() }}</div>
                <div class="text-xl sm:text-2xl md:text-3xl xl:text-2xl 2xl:text-3xl font-black tracking-tighter leading-none">{{ displayedPopulation() }}</div>
                <div class="text-[8px] md:text-[9px] font-semibold opacity-70 tracking-wide mt-0.5">Población Censada</div>
              </div>
            </div>

            <!-- ── ROW 2: Gráficos Sexo + Grandes Grupos ──────────────── -->

            <!-- Población por Sexo -->
            <div class="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden
                        min-h-[180px] sm:min-h-[200px] xl:min-h-0">
              <div class="flex justify-between items-center mb-2 shrink-0">
                <h4 class="text-[10px] sm:text-xs font-black text-black tracking-wide leading-tight">Población por sexo</h4>
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  
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

            <!-- ── ROW 3: Edad Promedio + Edad Mediana / Razón hombre-mujer ── -->
            <div class="col-span-1 bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex items-stretch relative overflow-hidden min-h-[56px] xl:min-h-0 gap-0">

              <!-- Indicador: Edad Promedio -->
              <div class="flex-1 flex flex-col relative min-w-0 pr-2">
                <div class="absolute top-0 right-2 flex items-center gap-1 z-10">
                  <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                    
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
            

            <!-- ── ROW 3 COL 2: Razón hombre-mujer ──────────────────────── -->
            <div class="col-span-1 bg-white rounded-xl px-3 md:px-4 py-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-[56px] xl:min-h-0">
  
  <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
    <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
      
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
          {{ fmtD(cardMock()['razon_sexo'], 1) }} <span class="text-[9px] xl:text-xs font-semibold text-gray-500">hombres</span>
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

            <!-- ── ROW 4: Índice Envejecimiento + Dep. Total ───────────── -->

            <!-- Índice de Envejecimiento -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[56px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  
                </span>
                <span matTooltip="Número de personas de 60 y más años, por cada 100 personas de 0 a 14 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="envejecimiento.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Índice de envejecimiento</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['indice_envejecimiento'], 1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Relación Dependencia Total -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[56px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  
                </span>
                <span matTooltip="Número de personas de 0 a 14 años y de 60 y más años, por cada 100 personas de 15 a 59 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="rel_dep_total.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Relación de dependencia total</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['dep_total'], 1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ── ROW 5: Dep. Juvenil + Dep. Adulta ──────────────────── -->

            <!-- Relación Dependencia Juvenil -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[56px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  
                </span>
                <span matTooltip="Número de personas de 0 a 14 años, por cada 100 personas de 15 a 59 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="rel_dep_juvenil.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Relación de dependencia juvenil</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['dep_juvenil'], 1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Relación Dependencia Adulta -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden min-h-[56px] xl:min-h-0">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Ver en mapa" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  
                </span>
                <span matTooltip="Número de personas de 60 y más años, por cada 100 personas de 15 a 59 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-1 min-h-0">
                <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px] rounded-lg flex items-center justify-center shrink-0">
                  <img src="rel_dep_adulta.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] xl:w-[50px] xl:h-[50px]">
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Relación de dependencia adulta</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(cardMock()['dep_adulta'], 1) }}
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

          <!-- ═══════════════════════════════════════════════════════════════
               COL 5 — INDICADORES DE VIVIENDA
               1. KPI Viviendas (10%)  2. Particulares/Colectivas (25%)
               3. Ocupación (25%)      4. Número de hogares (40%)
          ═══════════════════════════════════════════════════════════════════ -->
          <div class="col-span-1 xl:row-span-2 xl:min-h-0 flex flex-col gap-1.5 2xl:gap-2 min-h-0">

            <!-- 1. KPI: Viviendas Censadas — 10% -->
            <div class="bg-gradient-to-br from-[#0056a1] to-[#33b3a9] rounded-xl p-2.5 text-white
                        flex items-center gap-2.5 relative overflow-hidden" style="flex: 1 0 0; min-height:0;">
              <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full pointer-events-none"></div>
              <div class="flex items-center justify-center shrink-0 relative z-10">
                <img src="dashboards/vivcensada.svg" class="w-[25px] h-[25px] md:w-[28px] md:h-[28px] xl:w-[30px] xl:h-[30px]" style="filter:brightness(0) invert(1)">
              </div>
              <div class="min-w-0 relative z-10 flex-1">
                <div class="text-[12px] font-bold   tracking-widest leading-none">Viviendas censadas</div>
                <div class="text-3xl 2xl:text-4xl font-black tracking-tight leading-tight mt-0.5">{{ fmt(viviendaCensadaTotal()) }}</div>
                <div class="flex gap-2 mt-1 text-[9.5px] font-semibold opacity-75">
              
                </div>
              </div>
              <span matTooltip="Total de viviendas particulares y colectivas registradas en el censo" matTooltipClass="custom-tooltip"
                    class="absolute top-1.5 right-1.5 inline-flex">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/40"></app-hero-icon>
              </span>
            </div>

            <!-- 2. KPI: Viviendas particulares -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden" style="flex: 1 0 0; min-height:0;">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Total de viviendas de uso exclusivo de uno o varios hogares" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2.5 flex-1 min-h-0">
                <div class="w-[40px] h-[40px] md:w-[49px] md:h-[49px] xl:w-[50px] xl:h-[50px]
                                 flex items-center justify-center shrink-0">
                  <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] rounded-lg flex items-center justify-center shrink-0">
                    <img src="vivparticular.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Viviendas particulares</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmt(viviendaMock()['viv_particulares']) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. KPI: Viviendas colectivas -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden" style="flex: 1 0 0; min-height:0;">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Viviendas destinadas a grupos de personas bajo normas de convivencia comunes (hospitales, conventos, cárceles, etc.)" matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2.5 flex-1 min-h-0">
                <div class="w-[40px] h-[40px] md:w-[49px] md:h-[49px] xl:w-[50px] xl:h-[50px]
                                 flex items-center justify-center shrink-0">
                  <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] rounded-lg flex items-center justify-center shrink-0">
                    <img src="dashboards/vivcolectiva.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Viviendas colectivas</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmt(viviendaMock()['viv_colectivas']) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Gráfico: Tipo de vivienda particular (HBar) -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-2.5 overflow-hidden" style="flex: 5.5 0 0; min-height:0;">
              <div class="flex items-center justify-between shrink-0 mb-1">
                <div class="flex items-center gap-1">
                  
                  <span class="text-[13px] font-black text-gray-700 leading-tight">Tipo de vivienda particular</span>
                </div>
                <span matTooltip="Distribución de viviendas particulares según tipo de estructura o construcción" matTooltipClass="custom-tooltip" class="inline-flex shrink-0">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex-1 min-h-0">
                @if (isBrowser) {
                  <div echarts [options]="vivTipoParticularChartOptions()" class="w-full h-full"></div>
                }
              </div>
              <div class="shrink-0 mt-1 pt-1 border-t border-gray-100">
                <p class="text-[9px] text-gray-400 leading-tight">1/ Comprende choza o cabaña, vivienda improvisada, local no destinado para habitación humana y otro tipo de vivienda.</p>
              </div>
            </div>

            <!-- 5. Gráfico: Condición de ocupación de la vivienda (columnas) -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-2.5 overflow-hidden" style="flex: 2.5 0 0; min-height:0;">
              <div class="flex items-center justify-between shrink-0 mb-1">
                <div class="flex items-center gap-1">                  
                  <span class="text-[13px] font-black text-gray-700 leading-tight">Condición de ocupación de la vivienda</span>
                </div>
                <span matTooltip="Estado de ocupación de las viviendas particulares al momento del empadronamiento" matTooltipClass="custom-tooltip" class="inline-flex shrink-0">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex-1 min-h-0">
                @if (isBrowser) {
                  <div echarts [options]="vivCondOcupChartOptions()" class="w-full h-full"></div>
                }
              </div>
            </div>

          </div><!-- /col 5 -->

          <!-- ═══════════════════════════════════════════════════════════════
               COL 6 — INDICADORES DE HOGAR
               1. Hogares censados (10%)   2. Miembros del hogar (50%)
               3. Prom. personas (15%)     4. Con niños (15%)
               5. Con adultos mayores (10%)
          ═══════════════════════════════════════════════════════════════════ -->
          <div class="col-span-1 xl:row-span-2 xl:min-h-0 flex flex-col gap-1.5 2xl:gap-2 min-h-0">

            <!-- 1. Hogares Censados — 10% (gradient púrpura) -->
            <div class="bg-gradient-to-br from-[#038dd3] to-[#33b3a9] rounded-xl p-2.5 text-white
                        flex items-center gap-2.5 relative overflow-hidden" style="flex: 1 0 0; min-height:0;">
              <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full pointer-events-none"></div>
               <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full pointer-events-none"></div>
              <div class="flex items-center justify-center shrink-0 relative z-10">
                <img src="dashboards/hogarcensado.svg" class="w-[25px] h-[25px] md:w-[28px] md:h-[28px] xl:w-[30px] xl:h-[30px]" style="filter:brightness(0) invert(1)">
              </div>
              <div class="min-w-0 relative z-10 flex-1">
                <div class="text-[12px] font-bold tracking-widest leading-none">Hogares censados</div>
                <div class="text-3xl 2xl:text-4xl font-black tracking-tight leading-tight mt-0.5">{{ fmt(hogarMock()['hog_censados']) }}</div>
              </div>
             

              <span matTooltip="Total de hogares censados: grupo de personas con presupuesto alimentario común" matTooltipClass="custom-tooltip"
                    class="absolute top-1.5 right-1.5 inline-flex">
                <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/40"></app-hero-icon>
              </span>
            </div>

            <!-- 2. Hogares según número de miembros del hogar -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-2.5 overflow-hidden" style="flex: 6 0 0; min-height:0;">
              <div class="flex items-center justify-between shrink-0 mb-1">
                <div class="flex items-center gap-1">                  
                  <span class="text-[13px] font-black color = #424242 leading-tight">Hogares según número de personas que lo conforman</span>
                </div>
                <span matTooltip="Distribución porcentual de hogares según el número de personas que los conforman" matTooltipClass="custom-tooltip" class="inline-flex shrink-0">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex-1 flex flex-col justify-around min-h-0 overflow-hidden">
                <!-- 1 persona -->
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">                    
                    <span class="text-[11px] font-bold color = #464646 leading-tight flex-1">Con 1 persona</span>
                    <span class="text-[13px] font-black color = #464646 tabular-nums shrink-0">{{ fmtD(hogarMock()['pct_unipersonales'], 1) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full overflow-hidden" style="height:14px">
                    <div class="h-full rounded-full" style="background:#0056a1"
                         [style.width.%]="hogarMock()['pct_unipersonales']"></div>
                  </div>
                </div>
                <!-- 2 personas -->
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">                   
                    <span class="text-[11px] font-bold color = #464646 leading-tight flex-1">Con 2 personas</span>
                    <span class="text-[13px] font-black color = #464646 tabular-nums shrink-0">{{ fmtD((100 - hogarMock()['pct_unipersonales']) * 0.235, 1) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full overflow-hidden" style="height:14px">
                    <div class="h-full rounded-full" style="background:#038dd3"
                         [style.width.%]="(100 - hogarMock()['pct_unipersonales']) * 0.235"></div>
                  </div>
                </div>
                <!-- 3 personas -->
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">                    
                    <span class="text-[11px] font-bold color = #464646 leading-tight flex-1">Con 3 personas</span>
                    <span class="text-[13px] font-black color = #464646 tabular-nums shrink-0">{{ fmtD((100 - hogarMock()['pct_unipersonales']) * 0.220, 1) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full overflow-hidden" style="height:14px">
                    <div class="h-full rounded-full" style="background:#33b3a9"
                         [style.width.%]="(100 - hogarMock()['pct_unipersonales']) * 0.220"></div>
                  </div>
                </div>
                <!-- 4 personas -->
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">                    
                    <span class="text-[11px] font-bold color = #464646 leading-tight flex-1">Con 4 personas</span>
                    <span class="text-[13px] font-black color = #464646 tabular-nums shrink-0">{{ fmtD((100 - hogarMock()['pct_unipersonales']) * 0.215, 1) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full overflow-hidden" style="height:14px">
                    <div class="h-full rounded-full" style="background:#caeae4"
                         [style.width.%]="(100 - hogarMock()['pct_unipersonales']) * 0.215"></div>
                  </div>
                </div>
                <!-- 5 personas -->
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">                    
                    <span class="text-[11px] font-bold color = #464646 leading-tight flex-1">Con 5 personas</span>
                    <span class="text-[13px] font-black color = #464646 tabular-nums shrink-0">{{ fmtD((100 - hogarMock()['pct_unipersonales']) * 0.195, 1) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full overflow-hidden" style="height:14px">
                    <div class="h-full rounded-full" style="background:#8383fd"
                         [style.width.%]="(100 - hogarMock()['pct_unipersonales']) * 0.195"></div>
                  </div>
                </div>
                <!-- 6 a más personas -->
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">                   
                    <span class="text-[11px] font-bold color = #464646 leading-tight flex-1">Con 6 a más personas</span>
                    <span class="text-[13px] font-black color = #464646 tabular-nums shrink-0">{{ fmtD((100 - hogarMock()['pct_unipersonales']) * 0.135, 1) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full overflow-hidden" style="height:14px">
                    <div class="h-full rounded-full" style="background:#038dd3"
                         [style.width.%]="(100 - hogarMock()['pct_unipersonales']) * 0.135"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Promedio de Personas por Hogar — card KPI -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden" style="flex: 1.5 0 0; min-height:0;">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Promedio de personas que habitan en cada hogar censado"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2.5 flex-1 min-h-0">
                <div class="w-[46px] h-[46px] md:w-[52px] md:h-[52px] xl:w-[48px] xl:h-[48px]
                             flex items-center justify-center shrink-0">
                  <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] rounded-lg flex items-center justify-center shrink-0">
                    <img src="hogarpromedio.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Promedio de personas por hogar</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(hogarMock()['prom_personas'], 1) }}
                    <span class="text-[10px] md:text-xs font-bold text-gray-400">personas</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Hogares con Niños/as — card KPI -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden" style="flex: 1.5 0 0; min-height:0;">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Porcentaje de hogares con al menos un niño o niña menor de 15 años"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2.5 flex-1 min-h-0">
                <div class="w-[46px] h-[46px] md:w-[52px] md:h-[52px] xl:w-[48px] xl:h-[48px]
                              flex items-center justify-center shrink-0">
                  <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] rounded-lg flex items-center justify-center shrink-0">
                    <img src="hogar-ninos.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Hogares con niños/as</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(hogarMock()['pct_con_ninos'], 1) }}
                    <span class="text-[10px] md:text-xs font-bold text-gray-400">%</span>
                  </div>
                  
                </div>
              </div>
            </div>

            <!-- 5. Hogares con Adultas/os Mayores — card KPI -->
            <div class="bg-white rounded-xl px-3 md:px-4 py-2 shadow-sm border border-gray-100
                        flex flex-col relative overflow-hidden" style="flex: 1 0 0; min-height:0;">
              <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span matTooltip="Porcentaje de hogares con al menos una persona de 60 años o más"
                      matTooltipClass="custom-tooltip" class="inline-flex items-center">
                  <app-hero-icon [name]="'information-circle'" class="w-4 h-4 xl:w-5 xl:h-5 text-gray-300"></app-hero-icon>
                </span>
              </div>
              <div class="flex items-center gap-2.5 flex-1 min-h-0">
                <div class="w-[46px] h-[46px] md:w-[52px] md:h-[52px] xl:w-[48px] xl:h-[48px]                            
                 flex items-center justify-center shrink-0">
                  <div class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] rounded-lg flex items-center justify-center shrink-0">
                    <img src="hogar-admayor.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] xl:text-xs font-black text-black tracking-wide leading-tight">Hogares con adultas/os mayores</div>
                  <div class="text-lg md:text-xl xl:text-xl font-black text-gray-800 leading-none mt-0.5">
                    {{ fmtD(hogarMock()['pct_adulto_mayor'], 1) }}
                    <span class="text-[10px] md:text-xs font-bold text-gray-400">%</span>
                  </div>                  
                </div>
              </div>
            </div>



          </div><!-- /col 6 -->

        </div><!-- /grid 6 cols -->
      </div><!-- /main -->

    </section>
  `,
    styles: [`
    :host { display: block; min-height: 100vh; }
    ::ng-deep .custom-tooltip {
      background-color: white !important; color: #333 !important; border-radius: 12px !important;
      padding: 10px 14px !important; font-size: 12px !important; font-weight: 600 !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,.1) !important; border: 1px solid #e5e7eb !important;
      max-width: 240px !important; white-space: normal !important;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardCensadaComponent implements OnInit {

    // ── Header nav ───────────────────────────────────────────────────────
    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);
    censosMenu = [
        { label: 'Censo de Derecho',         route: '/censo-derecho' },
        { label: 'Características técnicas', route: '/aspectos-generales' },
        { label: 'Innovaciones tecnológicas', route: '/innovaciones' },
        { label: 'Normatividad censal',       route: '/normativa' },
        { label: 'Actividades censales',        route: '/actividades' },
        { label: 'Documentación Técnica',     route: '/documentacion-tecnica' },
    ];

    @HostListener('document:click')
    onDocumentClick() {
        this.censosOpen.set(false);
        this.mobileMenuOpen.set(false);
        this.openGeoDropdown.set(null);
        this.openRegionDropdown.set(false);
        this.openNivelDropdown.set(false);
        this.openAreaDropdown.set(false);
    }

    toggleCensos(e: Event)     { e.stopPropagation(); this.censosOpen.update(v => !v); }
    toggleMobileMenu(e: Event) { e.stopPropagation(); this.mobileMenuOpen.update(v => !v); }

    // ── View tabs en barra de filtros ─────────────────────────────────────
  readonly viewTabs = [
        { label: 'Indicadores',             icon: 'chart-bar',         route: '/dashboard-censada' },
        { label: 'Comparativo territorial', icon: 'map',               route: '/dashboard-territorial' },
        { label: 'Evolución',               icon: 'arrow-trending-up', route: '/dashboard-evolucion' },
    ];

    readonly tematicTabs = [
    // Nueva entrada vinculada a tu archivo dashboard-tematico.ts
    { label: 'General Temático', icon: 'squares-2x2',    route: '/dashboard-tematico' }, 
    
    { label: 'Educación',        icon: 'academic-cap',  route: '/dashboard-educacion' },
    { label: 'Salud',            icon: 'heart',         route: '/dashboard-salud' },
    { label: 'Economía',         icon: 'banknotes',     route: '/dashboard-economia' },
];

    // ── Sección expandida en barra de filtros ─────────────────────────────
    expandedSection = signal<'principales' | 'tematicos' | null>('principales');

    toggleNavSection(section: 'principales' | 'tematicos'): void {
        this.expandedSection.update(v => v === section ? null : section);
    }

    isViewTabActive(route: string): boolean {
        return this.router.url === route || this.router.url.startsWith(route + '/');
    }

    // ── Botonera de secciones (barra superior) ───────────────────────────
    readonly navSections = [
        { id: 'poblacion_total',     label: 'Indicadores de población total',                icon: 'chart-bar',      route: '/dashboard' },
        { id: 'poblacion_viviendas', label: 'Indicadores de población y viviendas censadas', icon: 'home',           route: '/dashboard-censada' },
        { id: 'poblacion_comunidades', label: 'Indicadores de comunidades indígenas', icon: 'home',            route: '/indicadores-comunidades-indigenas' },
      
    ];

    private router = inject(Router);
    isBtnActive(btn: { id: string; route?: string }): boolean {
        return this.router.url === btn.route || this.router.url.startsWith((btn.route ?? '') + '/');
    }

    // ── Leyenda gráfico hogares ───────────────────────────────────────────
    readonly vivHogarLegend = [
        { label: 'Con 1 hogar',   color: '#0056a1' },
        { label: 'Con 2 hogares', color: '#33b3a9' },
        { label: 'Con 3 hogares', color: '#038dd3' },
        { label: 'Con 4 y más',   color: '#343b9f' },
    ];

    // ── Geo state ─────────────────────────────────────────────────────────
    readonly NIVELES_GEO: NivelGeoType[] = ['Departamental', 'Provincial', 'Distrital'];
    nivelGeo        = signal<NivelGeoType>('Departamental');
    openGeoDropdown = signal<'dep' | 'prov' | 'dist' | null>(null);
    selectedCCDD    = signal<string>('');
    selectedProv    = signal<string>('');
    selectedDist    = signal<string>('');

    // ── Nivel de filtro geográfico ─────────────────────────────────────────
    readonly NIVELES_FILTRO: { key: NivelFiltroType; label: string; icon: string; color: string }[] = [
        { key: 'politico_administrativo', label: 'División territorial', icon: '',            color: '#0056a1' },
        { key: 'region_natural',          label: 'Región Natural',          icon: '', color: '#33b3a9' },
    ];
    readonly REGIONES_NATURALES = REGIONES_NATURALES;

    nivelFiltro           = signal<NivelFiltroType>('politico_administrativo');
    selectedRegionNatural = signal<string>('');
    openRegionDropdown    = signal<boolean>(false);
    openNivelDropdown     = signal<boolean>(false);

    activeNivelDef = computed(() =>
        this.NIVELES_FILTRO.find(n => n.key === this.nivelFiltro()) ?? this.NIVELES_FILTRO[0]
    );
    regionNaturalLabel = computed(() => {
        const key = this.selectedRegionNatural();
        return REGIONES_NATURALES.find(r => r.key === key)?.label ?? 'Todos';
    });

    // ── Filtro de área ─────────────────────────────────────────────────────
    readonly AREAS_FILTRO: { key: AreaFiltroType; label: string }[] = [
        { key: 'total',  label: 'Todas'  },
        { key: 'urbano', label: 'Urbano' },
        { key: 'rural',  label: 'Rural'  },
    ];
    areaFiltro       = signal<AreaFiltroType>('total');
    openAreaDropdown = signal<boolean>(false);
    areaLabel        = computed(() => this.AREAS_FILTRO.find(a => a.key === this.areaFiltro())?.label ?? 'Total');
    private areaPopFactor = computed(() => AREA_POP_FACTORS[this.areaFiltro()]);
    private areaRateDelta = computed(() => AREA_RATE_DELTA[this.areaFiltro()]);

    isGeoProvActive = computed(() =>
        this.nivelFiltro() === 'politico_administrativo' && this.nivelGeo() !== 'Departamental'
    );
    isGeoDistActive = computed(() =>
        this.nivelFiltro() === 'politico_administrativo' && this.nivelGeo() === 'Distrital'
    );

    private rawGeoJson     = signal<any>(null);
    private rawGeoJsonProv = signal<any>(null);
    private rawGeoJsonDist = signal<any>(null);

    // ── Listas para dropdowns ─────────────────────────────────────────────
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
        if (limaMet) extras.push(limaMet); if (regLima) extras.push(regLima);
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

    geoDepLabel  = computed(() => { const c = this.selectedCCDD(); return c ? (this.departments().find(d => d.ccdd === c)?.name ?? c) : 'Todos'; });
    geoProvLabel = computed(() => { const c = this.selectedProv();  return c ? (this.provinces().find(p => p.code === c)?.name ?? c) : 'Todos'; });
    geoDistLabel = computed(() => { const c = this.selectedDist();  return c ? (this.districts().find(d => d.code === c)?.name ?? c) : 'Todos'; });

    toggleGeoDropdown(key: 'dep' | 'prov' | 'dist'): void { this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key); }
    closeGeoDropdowns(): void {
        this.openGeoDropdown.set(null);
        this.openRegionDropdown.set(false);
        this.openNivelDropdown.set(false);
        this.openAreaDropdown.set(false);
    }

    setNivelFiltro(nivel: NivelFiltroType): void {
        this.nivelFiltro.set(nivel);
        this.openGeoDropdown.set(null);
        this.openRegionDropdown.set(false);
        this.openNivelDropdown.set(false);
        this.selectedRegionNatural.set('');
        if (nivel === 'region_natural') {
            this.selectedCCDD.set(''); this.selectedProv.set(''); this.selectedDist.set('');
            this.nivelGeo.set('Departamental');
        }
    }

    selectRegionNatural(key: string): void {
        this.selectedRegionNatural.set(key);
        this.openRegionDropdown.set(false);
    }

    selectDep(dept: { ccdd: string; name: string } | null): void {
        this.selectedCCDD.set(dept?.ccdd ?? '');
        this.selectedProv.set(''); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (dept) {
            this.nivelGeo.set('Provincial'); this.loadGeoJsonProv();
        } else { this.nivelGeo.set('Departamental'); }
    }

    selectProv(code: string): void {
        this.selectedProv.set(code); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (code) {
            this.nivelGeo.set('Distrital'); this.loadGeoJsonDist();
        } else if (this.selectedCCDD()) { this.nivelGeo.set('Provincial'); }
    }

    selectDist(code: string): void { this.selectedDist.set(code); this.openGeoDropdown.set(null); }

    resetFilters(): void {
        this.selectedCCDD.set(''); this.selectedProv.set(''); this.selectedDist.set('');
        this.selectedRegionNatural.set('');
        this.nivelGeo.set('Departamental'); this.nivelFiltro.set('politico_administrativo');
        this.openGeoDropdown.set(null); this.openRegionDropdown.set(false);
        this.openNivelDropdown.set(false); this.openAreaDropdown.set(false);
        this.areaFiltro.set('total');
    }

    // ── Datos reactivos de tarjetas ───────────────────────────────────────
    private readonly TOTAL_NAC = 36_596_527;

    cardData = computed<{ total: number; male: number; female: number; density: number; ccdd: string }>(() => {
        const f = this.areaPopFactor();
        const applyF = (p: any) => ({
            total:   Math.round((Number(p.POBTOTAL)  ||0) * f.pop),
            male:    Math.round((Number(p.POBHOMBRE) ||0) * f.male),
            female:  Math.round((Number(p.POBMUJER)  ||0) * f.female),
            density: +((Number(p.DENSIDAD)||0) * f.density).toFixed(2),
            ccdd:    String(p.CCDD),
        });
        const dist = this.selectedDist();
        if (dist) {
            const feat = this.rawGeoJsonDist()?.features?.find((fn: any) => String(fn.properties.UBIGEO) === dist);
            if (feat) return applyF(feat.properties);
        }
        const prov = this.selectedProv();
        if (prov) {
            const feat = this.rawGeoJsonProv()?.features?.find((fn: any) => String(fn.properties.CCPP) === prov);
            if (feat) return applyF(feat.properties);
        }
        const ccdd = this.selectedCCDD();
        if (ccdd) {
            const feat = this.rawGeoJson()?.features?.find((fn: any) => String(fn.properties.CCDD) === ccdd);
            if (feat) return applyF(feat.properties);
        }
        return {
            total:   Math.round(this.TOTAL_NAC   * f.pop),
            male:    Math.round(17_596_527        * f.male),
            female:  Math.round(18_999_999        * f.female),
            density: +(25.4 * f.density).toFixed(2),
            ccdd:    '',
        };
    });

    cardMock = computed<Record<string, number>>(() => {
        const ccdd  = this.cardData().ccdd;
        const base  = (ccdd && MOCK_DEP[ccdd]) ? MOCK_DEP[ccdd]
            : { edad_promedio: 31.2, edad_mediana: 29.8, razon_sexo: 94.3, indice_envejecimiento: 45.6, dep_total: 52.1, dep_juvenil: 34.2, dep_adulta: 17.9, densidad_65: 3.6 };
        const delta = this.areaRateDelta();
        const out: Record<string, number> = {};
        for (const k of Object.keys(base)) out[k] = +(base[k] + (delta[k] ?? 0)).toFixed(1);
        return out;
    });

    viviendaMock = computed<Record<string, number>>(() => {
        const ccdd  = this.cardData().ccdd;
        const base  = (ccdd && MOCK_VIV[ccdd]) ? MOCK_VIV[ccdd]
            : { viv_particulares: 10_348_200, viv_colectivas: 276_280, viv_ocupadas: 8_462_040, viv_desocupadas: 2_162_440, viv_1hogar: 7_818_080, viv_2hogar: 524_000, viv_3hogar: 92_800, viv_4ymas: 27_160 };
        const f = this.areaPopFactor().pop;
        const out: Record<string, number> = {};
        for (const k of Object.keys(base)) out[k] = Math.round(base[k] * f);
        return out;
    });

    viviendaCensadaTotal = computed<number>(() => {
        const d = this.viviendaMock();
        return d['viv_particulares'] + d['viv_colectivas'];
    });

    hogarMock = computed<Record<string, number>>(() => {
        const ccdd  = this.cardData().ccdd;
        const base  = (ccdd && MOCK_HOG[ccdd]) ? MOCK_HOG[ccdd]
            : { hog_censados: 9_861_890, prom_personas: 3.2, pct_unipersonales: 18.4, pct_con_ninos: 44.6, pct_adulto_mayor: 28.3 };
        const f     = this.areaPopFactor().pop;
        const delta = this.areaRateDelta();
        const out: Record<string, number> = {};
        for (const k of Object.keys(base)) {
            out[k] = k === 'hog_censados'
                ? Math.round(base[k] * f)
                : +(base[k] + (delta[k] ?? 0)).toFixed(2);
        }
        return out;
    });

    displayedTitle      = computed<string>(() => {
        const dist = this.selectedDist(); if (dist) return this.districts().find(d => d.code === dist)?.name ?? dist;
        const prov = this.selectedProv(); if (prov) return this.provinces().find(p => p.code === prov)?.name ?? prov;
        const ccdd = this.selectedCCDD(); if (ccdd) return this.departments().find(d => d.ccdd === ccdd)?.name ?? 'Perú';
        return 'Perú';
    });
    displayedPopulation = computed<string>(() => this.fmt(this.cardData().total));

    // ── ECharts Vivienda (computed reactivos — fontWeight corregido a number) ─
    viviendaTipoChartOptions = computed<EChartsOption>(() => {
        const d     = this.viviendaMock();
        const part  = d['viv_particulares']; const col = d['viv_colectivas']; const total = part + col;
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => { const p = params[0]; const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} <span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`; },
            },
            grid: { top: 38, right: 6, bottom: 4, left: 6, containLabel: true },
            xAxis: {
                type: 'category',
                data: ['🏠 Particulares', '🏢 Colectivas'],
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', interval: 0, overflow: 'break' },
            },
            yAxis: { type: 'value', show: false, max: (v: any) => Math.round(v.max * 1.75) },
            series: [{
                type: 'bar', barMaxWidth: 48, barCategoryGap: '38%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                data: [{ value: part, itemStyle: { color: '#0056a1' } }, { value: col, itemStyle: { color: '#33b3a9' } }],
                label: {
                    show: true, position: 'top',
                    formatter: (p: any) => { const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `{num|${this.fmt(p.value as number)}}\n{pct|${pct}%}`; },
                    rich: {
                        num: { fontSize: 8, fontWeight: 'bold', color: '#374151', lineHeight: 12 },
                        pct: { fontSize: 8, fontWeight: 600,    color: '#9ca3af', lineHeight: 11 },
                    },
                },
            }],
        };
    });

    ocupacionChartOptions = computed<EChartsOption>(() => {
        const d    = this.viviendaMock();
        const ocup = d['viv_ocupadas']; const desoc = d['viv_desocupadas']; const total = ocup + desoc;
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => { const p = params[0]; const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} <span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`; },
            },
            grid: { top: 38, right: 6, bottom: 4, left: 6, containLabel: true },
            xAxis: {
                type: 'category',
                data: ['🔑 Ocupadas', '🚪 Desocupadas'],
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', interval: 0, overflow: 'break' },
            },
            yAxis: { type: 'value', show: false, max: (v: any) => Math.round(v.max * 1.75) },
            series: [{
                type: 'bar', barMaxWidth: 48, barCategoryGap: '38%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                data: [{ value: ocup, itemStyle: { color: '#038dd3' } }, { value: desoc, itemStyle: { color: '#343b9f' } }],
                label: {
                    show: true, position: 'top',
                    formatter: (p: any) => { const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `{num|${this.fmt(p.value as number)}}\n{pct|${pct}%}`; },
                    rich: {
                        num: { fontSize: 8, fontWeight: 'bold', color: '#374151', lineHeight: 12 },
                        pct: { fontSize: 8, fontWeight: 600,    color: '#9ca3af', lineHeight: 11 },
                    },
                },
            }],
        };
    });

    // ── ECharts: Tipo de vivienda particular (barras horizontales) ──────────
    vivTipoParticularChartOptions = computed<EChartsOption>(() => {
        const d    = this.viviendaMock();
        const part = d['viv_particulares'];
        const cats = [
            'Casa independiente',
            'Departamento en edificio o en block',
            'Vivienda en quinta',
            'Vivienda en casa de vecindad',
            'Otro tipo de vivienda particular 1/',
        ];
        const pcts   = [0.732, 0.158, 0.029, 0.018, 0.063];
        const vals   = pcts.map(p => Math.round(part * p));
        const total  = vals.reduce((a, b) => a + b, 0);
        const colors = ['#0056a1', '#038dd3', '#33b3a9', '#caeae4', '#8282fb'];
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => { const p = params[0]; const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} <span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`; },
            },
            grid: { top: 4, right: 56, bottom: 4, left: 4, containLabel: true },
            xAxis: { type: 'value', show: false, max: (v: any) => Math.round(v.max * 1.45) },
            yAxis: {
                type: 'category', data: cats, inverse: true,
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 10, fontWeight: 'bold', color: '#424242', width: 130, overflow: 'break' },
            },
            series: [{
                type: 'bar', barMaxWidth: 18, barCategoryGap: '28%',
                itemStyle: { borderRadius: [0, 4, 4, 0] },
                data: vals.map((v, i) => ({ value: v, itemStyle: { color: colors[i % colors.length] } })),
                label: {
                    show: true, position: 'right',
                    formatter: (p: any) => { const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `{num|${this.fmt(p.value as number)}}  {pct|${pct}%}`; },
                    rich: {
                        num: { fontSize: 9, fontWeight: 'bold', color: '#424242' },
                        pct: { fontSize: 8.5, fontWeight: 600 as any, color: '#9ca3af' },
                    },
                },
            }],
        };
    });

    // ── ECharts: Condición de ocupación de la vivienda (columnas) ────────────
    vivCondOcupChartOptions = computed<EChartsOption>(() => {
        const d    = this.viviendaMock();
        const ocup = d['viv_ocupadas']; const desoc = d['viv_desocupadas'];
        const cats = [
            'Ocupada con personas presentes',
            'Ocupada con personas ausentes',
            'De uso ocasional o transitoria',
            'Desocupada',
        ];
        const vals   = [Math.round(ocup * 0.92), Math.round(ocup * 0.08), Math.round(desoc * 0.40), Math.round(desoc * 0.60)];
        const total  = vals.reduce((a, b) => a + b, 0);
        const colors = ['#0056a1', '#038dd3', '#33b3a9', '#caeae4'];
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => { const p = params[0]; const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} <span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`; },
            },
            grid: { top: 36, right: 6, bottom: 4, left: 6, containLabel: true },
            xAxis: {
                type: 'category', data: cats,
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 7.5, fontWeight: 'bold', color: '#6b7280', interval: 0, overflow: 'break', width: 60 },
            },
            yAxis: { type: 'value', show: false, max: (v: any) => Math.round(v.max * 1.75) },
            series: [{
                type: 'bar', barMaxWidth: 44, barCategoryGap: '28%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                data: vals.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
                label: {
                    show: true, position: 'top',
                    formatter: (p: any) => { const pct = ((p.value / total) * 100).toFixed(1).replace('.', ','); return `{num|${this.fmt(p.value as number)}}\n{pct|${pct}%}`; },
                    rich: {
                        num: { fontSize: 7.5, fontWeight: 'bold', color: '#374151', lineHeight: 12 },
                        pct: { fontSize: 7.5, fontWeight: 600 as any, color: '#9ca3af', lineHeight: 11 },
                    },
                },
            }],
        };
    });

    hogaresPorNumeroChartOptions = computed<EChartsOption>(() => {
        const d  = this.viviendaMock();
        const v1 = d['viv_1hogar']; const v2 = d['viv_2hogar'];
        const v3 = d['viv_3hogar']; const v4 = d['viv_4ymas'];
        const total = v1 + v2 + v3 + v4;
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    const p = params[0];
                    const pct = ((p.value / total) * 100).toFixed(1).replace('.', ',');
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div>`
                         + `<div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} `
                         + `<span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`;
                },
            },
            grid: { top: 40, right: 6, bottom: 4, left: 6, containLabel: true },
            xAxis: {
                type: 'category',
                data: ['🏠 1 hogar', '🏘 2 hogares', '🏗 3 hogares', '🏙 4 y más'],
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 8.5, fontWeight: 'bold', color: '#6b7280', interval: 0, overflow: 'break' },
            },
            yAxis: { type: 'value', show: false, max: (v: any) => Math.round(v.max * 1.75) },
            series: [{
                type: 'bar', barMaxWidth: 44, barCategoryGap: '32%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                data: [
                    { value: v1, itemStyle: { color: '#0056a1' } },
                    { value: v2, itemStyle: { color: '#33b3a9' } },
                    { value: v3, itemStyle: { color: '#038dd3' } },
                    { value: v4, itemStyle: { color: '#343b9f' } },
                ],
                label: {
                    show: true, position: 'top',
                    formatter: (p: any) => {
                        const pct = ((p.value / total) * 100).toFixed(1).replace('.', ',');
                        return `{num|${this.fmt(p.value as number)}}\n{pct|${pct}%}`;
                    },
                    rich: {
                        num: { fontSize: 8, fontWeight: 'bold', color: '#374151', lineHeight: 12 },
                        pct: { fontSize: 8, fontWeight: 600,    color: '#9ca3af', lineHeight: 11 },
                    },
                },
            }],
        };
    });

    miembrosHogarChartOptions = computed<EChartsOption>(() => {
        const h     = this.hogarMock();
        const uni   = h['pct_unipersonales'];
        const rest  = 100 - uni;
        // Distribución aproximada basada en pct_unipersonales y patrones demográficos típicos del Perú
        const pct2  = +(rest * 0.235).toFixed(1);
        const pct3  = +(rest * 0.220).toFixed(1);
        const pct4  = +(rest * 0.215).toFixed(1);
        const pct5  = +(rest * 0.195).toFixed(1);
        const pct6m = +(100 - uni - pct2 - pct3 - pct4 - pct5).toFixed(1);
        const cats  = ['👤 1 persona', '👥 2 personas', '👨‍👩‍👦 3 personas', '👨‍👩‍👧‍👦 4 personas', '🏘 5 personas', '🏙 6 a más'];
        const vals  = [uni, pct2, pct3, pct4, pct5, pct6m];
        const colors = ['#343b9f', '#0056a1', '#038dd3', '#33b3a9', '#343b9f', '#0056a1'];
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div>`
                         + `<div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmtD(p.value, 1)}% de hogares</div>`;
                },
            },
            grid: { top: 42, right: 6, bottom: 4, left: 6, containLabel: true },
            xAxis: {
                type: 'category',
                data: cats,
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 8, fontWeight: 'bold', color: '#6b7280', interval: 0, overflow: 'break' },
            },
            yAxis: { type: 'value', show: false, max: (v: any) => Math.round(v.max * 1.75) },
            series: [{
                type: 'bar', barMaxWidth: 52, barCategoryGap: '8%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                data: vals.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
                label: {
                    show: true, position: 'top',
                    formatter: (p: any) => `{pct|${this.fmtD(p.value, 1)}%}`,
                    rich: {
                        pct: { fontSize: 8.5, fontWeight: 'bold', color: '#374151', lineHeight: 13 },
                    },
                },
            }],
        };
    });

    // ── ECharts estáticos ─────────────────────────────────────────────────
    isBrowser = false;
    pieOptionsSex:  EChartsOption = {};
    pieOptionsAge:  EChartsOption = {};
    pyramidOptions: EChartsOption = {};

    // ── Inyecciones ───────────────────────────────────────────────────────
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);

    constructor() { this.isBrowser = isPlatformBrowser(this.platformId); }

    ngOnInit(): void { this.initCharts(); this.loadGeoJson(); }

    // ── Carga GeoJSON ─────────────────────────────────────────────────────
    loadGeoJson(): void {
        if (this.rawGeoJson()) return;
        this.http.get<any>('/departamento_geometria.json').subscribe({
            next:  data  => this.rawGeoJson.set(data),
            error: ()    => {},
        });
    }

    loadGeoJsonProv(): void {
        if (this.rawGeoJsonProv()) return;
        this.http.get<any>('/provincia_geometria.json').subscribe({
            next:  data => this.rawGeoJsonProv.set(data),
            error: ()   => {},
        });
    }

    loadGeoJsonDist(): void {
        if (this.rawGeoJsonDist()) return;
        this.http.get<any>('/distrito_geometria.json').subscribe({
            next:  data => this.rawGeoJsonDist.set(data),
            error: ()   => {},
        });
    }

    // ── Utilidades ────────────────────────────────────────────────────────
    fmt(n: number): string  { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    fmtD(n: number, dec = 1): string { return n.toFixed(dec).replace('.', ','); }

    // ── Inicialización de gráficos estáticos ─────────────────────────────
    initCharts(): void {
        // Gráfico: Población por sexo (donut)
        this.pieOptionsSex = {
            tooltip: {
                show: true, trigger: 'item',
                formatter: (params: any) => {
                    const total = 18_999_999 + 17_596_527;
                    const abs   = params.value as number;
                    const pct   = ((abs / total) * 100).toFixed(1).replace('.', ',');
                    const absStr = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:4px">${params.name}</div><div style="font-size:13px;font-weight:900;color:${params.color}">${absStr}</div><div style="font-size:10px;font-weight:700;color:#9ca3af">${pct}%</div>`;
                },
            },
            legend: { show: false },
            color: ['#33b3a9', '#0056a1'],
            series: [{
                name: 'Sexo', type: 'pie', radius: ['50%', '80%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                data: [
                    { value: 18_999_999, name: 'Mujeres' },
                    { value: 17_596_527, name: 'Hombres' },
                ],
            }],
        };

        // Gráfico: Población por grandes grupos de edad (barras verticales)
        this.pieOptionsAge = {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'none' },
                formatter: (params: any) => {
                    const p = params[0];
                    const abs = [3_274_648, 12_618_546, 2_587_238][p.dataIndex] ?? 0;
                    const pct = ['17,7%', '68,3%', '14,0%'][p.dataIndex] ?? '';
                    const absStr = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${absStr} <span style="color:#9ca3af;font-size:10px">(${pct})</span></div>`;
                },
            },
            grid: { top: 26, right: 6, bottom: 22, left: 6, containLabel: true },
            xAxis: { type: 'category', data: ['0–14 años', '15–59 años', '60 y más años'], axisTick: { show: false }, axisLine: { show: false }, axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#9ca3af', interval: 0, overflow: 'truncate' } },
            yAxis: { type: 'value', show: false, max: (val: any) => Math.round(val.max * 1.55) },
            series: [{
                name: 'Población Censada', type: 'bar', barMaxWidth: 40, barCategoryGap: '28%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                label: {
                    show: true, position: 'top',
                    formatter: (p: any) => {
                        const absVals = [3_274_648, 12_618_546, 2_587_238];
                        const pcts   = ['17,7%', '68,3%', '14,0%'];
                        const abs    = absVals[p.dataIndex] ?? 0;
                        const absStr = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                        return `{abs|${absStr}}\n{pct|${pcts[p.dataIndex] ?? ''}}`;
                    },
                    rich: {
                        abs: { fontSize: 7,  fontWeight: 'bold', color: '#6b7280', lineHeight: 11 },
                        pct: { fontSize: 8.5, fontWeight: 'bold', color: '#6b7280', lineHeight: 13 },
                    },
                },
                data: [
                    { value: 3_274_648,  itemStyle: { color: '#038dd3' } },
                    { value: 12_618_546, itemStyle: { color: '#caeae4' } },
                    { value: 2_587_238,  itemStyle: { color: '#8383fd' } },
                ],
            }],
        };

        // Gráfico: Pirámide poblacional (barras horizontales simétricas)
        const ageGroups  = ['0-4 años','5-9 años','10-14 años','15-19 años','20-24 años','25-29 años','30-34 años','35-39 años','40-44 años','45-49 años','50-54 años','55-59 años','60-64 años','65-69 años','70-74 años','75-79 años','80-84 años','85 y más años'];
        const maleData   = [-2.5,-2.8,-3.0,-3.2,-3.5,-3.8,-4.0,-3.8,-3.5,-3.2,-3.0,-2.8,-2.5,-2.0,-1.5,-1.0,-0.5,-0.5];
        const femaleData = [ 2.4, 2.7, 2.9, 3.1, 3.4, 3.7, 3.9, 3.7, 3.4, 3.1, 2.9, 2.7, 2.4, 1.9, 1.4, 0.9, 0.4, 0.4];
        const TOTAL      = this.TOTAL_NAC;
        const maleAbs    = maleData.map(v   => Math.round(Math.abs(v) / 100 * TOTAL));
        const femaleAbs  = femaleData.map(v => Math.round(v           / 100 * TOTAL));

        this.pyramidOptions = {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter(params: any): string {
                    let html = `<div style="font-weight:900;font-size:10px;margin-bottom:4px">${params[0].name}</div>`;
                    params.forEach((p: any) => {
                        const absVal = Number(p.data?.abs ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                        const pct    = Math.abs(p.value).toFixed(1).replace('.', ',');
                        html += `<div style="display:flex;justify-content:space-between;gap:16px;font-size:9px;margin-top:2px"><span style="color:#9ca3af;font-weight:600">${p.seriesName}</span><span style="font-weight:900">${absVal} <span style="color:#9ca3af;font-weight:500">(${pct}%)</span></span></div>`;
                    });
                    return html;
                },
            },
            grid: { left: 0, right: 0, bottom: 0, top: 0, containLabel: true },
            xAxis: [{
                type: 'value', min: -5, max: 5, interval: 1,
                axisLine:  { show: true,  lineStyle: { color: '#d1d5db', width: 1 } },
                axisTick:  { show: true,  lineStyle: { color: '#d1d5db' } },
                splitLine: { show: true,  lineStyle: { color: '#f3f4f6', type: 'dashed' } },
                axisLabel: { show: true,  fontSize: 8, fontWeight: 'bold', color: '#9ca3af', formatter: (v: number) => v === 0 ? '0' : Math.abs(v) + '%' },
            }],
            yAxis: [{
                type: 'category', data: ageGroups,
                axisTick: { show: false },
                axisLine: { show: true,  lineStyle: { color: '#d1d5db', width: 1 } },
                axisLabel: { fontSize: 8.5, fontWeight: 'bold', color: '#6b7280', margin: 6 },
                splitLine: { show: false },
            }],
            graphic: [{ type: 'text', left: 4, top: 2, style: { text: 'Edad', fontSize: 8.5, fontWeight: 'bold', fill: '#6b7280', fontFamily: '-apple-system, sans-serif' } }],
            series: [
                {
                    name: 'Hombres', type: 'bar', stack: 'Total',
                    data: maleData.map((v, i) => ({ value: v, abs: maleAbs[i] })),
                    itemStyle: { color: '#0056a1', borderRadius: [4, 0, 0, 4] }, label: { show: false },
                },
                {
                    name: 'Mujeres', type: 'bar', stack: 'Total',
                    data: femaleData.map((v, i) => ({ value: v, abs: femaleAbs[i] })),
                    itemStyle: { color: '#33b3a9', borderRadius: [0, 4, 4, 0] }, label: { show: false },
                },
                {
                    name: '_center', type: 'line', data: ageGroups.map(() => 0),
                    symbol: 'none', lineStyle: { color: '#9ca3af', width: 1.5, type: 'solid' },
                    tooltip: { show: false }, silent: true, z: 10,
                },
            ],
        };
    }
}
