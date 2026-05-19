/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    AfterViewInit,
    OnDestroy,
    PLATFORM_ID,
    inject,
    signal,
    computed,
    HostListener,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeroIconComponent } from '../ui/hero-icon.component';

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

// ── Indicator data structures ────────────────────────────────────────────────
interface IndicatorItem {
    key: string;
    label: string;
}

interface ThemeGroup {
    key: string;
    label: string;
    indicators: IndicatorItem[];
}

interface IndicatorCategory {
    key: 'poblacion' | 'vivienda' | 'hogar';
    label: string;
    themes: ThemeGroup[];
}

// ── Census / nivel types ──────────────────────────────────────────────────────
type CensusType = 'poblacion_vivienda' | 'comunidades_indigenas';
export type NivelGeoType = 'Departamental' | 'Provincial' | 'Distrital';

// ── SVG map constants ─────────────────────────────────────────────────────────
const MOCK_DEP: Record<string, Record<string, number>> = {
    '01':{ pob_censada:432000, edad_promedio:28.4,razon_sexo:101.2,densidad_total:1.4 },
    '02':{ pob_censada:891000, edad_promedio:30.2,razon_sexo:97.8, densidad_total:2.3 },
    '03':{ pob_censada:326000, edad_promedio:26.9,razon_sexo:95.4, densidad_total:1.2 },
    '04':{ pob_censada:1289000,edad_promedio:32.5,razon_sexo:98.6, densidad_total:3.1 },
    '05':{ pob_censada:462000, edad_promedio:27.3,razon_sexo:94.1, densidad_total:1.3 },
    '06':{ pob_censada:398000, edad_promedio:26.5,razon_sexo:96.3, densidad_total:1.8 },
    '07':{ pob_censada:843000, edad_promedio:33.8,razon_sexo:99.1, densidad_total:6.9 },
    '08':{ pob_censada:519000, edad_promedio:28.1,razon_sexo:96.8, densidad_total:2.1 },
    '09':{ pob_censada:287000, edad_promedio:25.8,razon_sexo:93.2, densidad_total:1.0 },
    '10':{ pob_censada:445000, edad_promedio:27.1,razon_sexo:97.4, densidad_total:1.5 },
    '11':{ pob_censada:378000, edad_promedio:32.1,razon_sexo:98.4, densidad_total:2.8 },
    '12':{ pob_censada:556000, edad_promedio:29.4,razon_sexo:98.1, densidad_total:2.1 },
    '13':{ pob_censada:712000, edad_promedio:30.8,razon_sexo:97.6, densidad_total:3.4 },
    '14':{ pob_censada:634000, edad_promedio:31.4,razon_sexo:96.8, densidad_total:3.2 },
    '15':{ pob_censada:10628000,edad_promedio:34.2,razon_sexo:96.4,densidad_total:7.2 },
    '16':{ pob_censada:476000, edad_promedio:27.6,razon_sexo:104.8,densidad_total:0.8 },
    '17':{ pob_censada:389000, edad_promedio:28.3,razon_sexo:108.4,densidad_total:0.6 },
    '18':{ pob_censada:267000, edad_promedio:34.6,razon_sexo:102.4,densidad_total:2.4 },
    '19':{ pob_censada:412000, edad_promedio:28.7,razon_sexo:104.2,densidad_total:1.1 },
    '20':{ pob_censada:894000, edad_promedio:30.1,razon_sexo:96.2, densidad_total:2.6 },
    '21':{ pob_censada:367000, edad_promedio:27.4,razon_sexo:96.8, densidad_total:1.2 },
    '22':{ pob_censada:423000, edad_promedio:28.9,razon_sexo:102.6,densidad_total:1.4 },
    '23':{ pob_censada:315000, edad_promedio:33.4,razon_sexo:100.8,densidad_total:3.6 },
    '24':{ pob_censada:489000, edad_promedio:30.6,razon_sexo:103.4,densidad_total:2.1 },
    '25':{ pob_censada:221000, edad_promedio:28.8,razon_sexo:105.6,densidad_total:0.9 },
};

const PALETTE = ['#caeae4','#86cec0','#33b3a9','#2d9b90','#4c8c80'];
const B = { minLon: -81.5, maxLon: -68.5, minLat: -18.5, maxLat: 0.3 };
const S = { w: 380, h: 550 };

// ── Indicator categories / themes / indicators ────────────────────────────────
const INDICATOR_CATEGORIES: IndicatorCategory[] = [
    {
        key: 'poblacion',
        label: 'POBLACIÓN',
        themes: [
            {
                key: 'demografia',
                label: 'DEMOGRAFÍA',
                indicators: [
                    { key: 'pob_censada',          label: 'Población censada' },
                    { key: 'pob_hombres',           label: 'Población censada hombres' },
                    { key: 'pob_mujeres',           label: 'Población censada mujeres' },
                    { key: 'pob_0_14',             label: 'Población censada de 0 a 14 años' },
                    { key: 'pob_15_59',            label: 'Población censada de 15 a 59 años' },
                    { key: 'pob_60_mas',           label: 'Población censada de 60 y más años' },
                    { key: 'edad_promedio',        label: 'Edad promedio' },
                    { key: 'edad_mediana',         label: 'Edad mediana' },
                    { key: 'razon_sexo',           label: 'Razón hombre – mujer' },
                    { key: 'indice_envejecimiento',label: 'Índice de envejecimiento' },
                    { key: 'dep_total',            label: 'Relación de dependencia total' },
                    { key: 'dep_juvenil',          label: 'Relación de dependencia juvenil' },
                    { key: 'dep_adulta',           label: 'Relación de dependencia adulta' },
                    { key: 'densidad_total',       label: 'Densidad de la población censada' },
                    { key: 'densidad_adulta_mayor',label: 'Densidad de la población adulta mayor' },
                ],
            },
            {
                key: 'fecundidad',
                label: 'FECUNDIDAD',
                indicators: [
                    { key: 'mef_censadas',         label: 'Mujeres en edad fértil censadas' },
                    { key: 'prom_hijos_15_49',     label: 'Promedio de hijos/as nacidos/as vivos para mujeres entre 15 y 49 años' },
                    { key: 'pct_mujeres_con_hijos',label: 'Porcentaje de mujeres entre 15 y 49 años con hijos/as' },
                    { key: 'pct_mujeres_sin_hijos',label: 'Porcentaje de mujeres entre 15 y 49 años sin hijos/as' },
                ],
            },
            {
                key: 'migracion',
                label: 'MIGRACIÓN',
                indicators: [
                    { key: 'migrante_interno',     label: 'Población censada migrante interna reciente' },
                    { key: 'migrante_internac',    label: 'Población censada migrante internacional reciente' },
                    { key: 'inmigrante_internac',  label: 'Población censada inmigrante internacional' },
                    { key: 'emigracion_internac',  label: 'Emigración internacional' },
                ],
            },
            {
                key: 'estado_civil',
                label: 'ESTADO CIVIL, IDENTIDAD Y SEGURO DE SALUD',
                indicators: [
                    { key: 'pob_12_unida',         label: 'Población censada de 12 y más años actualmente unida' },
                    { key: 'pob_anterior_unida',   label: 'Población censada anteriormente unida' },
                    { key: 'pob_soltera',          label: 'Población censada soltera' },
                    { key: 'pob_con_dni',          label: 'Población censada con DNI' },
                    { key: 'inmigrante_con_doc',   label: 'Población censada inmigrante internacional con documento de identidad' },
                    { key: 'pob_con_seguro',       label: 'Población censada con cobertura de seguro de salud' },
                ],
            },
            {
                key: 'educacion',
                label: 'EDUCACIÓN',
                indicators: [
                    { key: 'tasa_asistencia',      label: 'Tasa de asistencia escolar' },
                    { key: 'asiste_dentro',        label: 'Población que asiste dentro del distrito' },
                    { key: 'asiste_fuera',         label: 'Población que asiste fuera del distrito' },
                    { key: 'secundaria_completa',  label: 'Secundaria completa o superior' },
                    { key: 'tasa_alfabetismo',     label: 'Tasa de alfabetismo' },
                    { key: 'uso_tic',              label: 'Uso de dispositivos TIC' },
                    { key: 'uso_internet',         label: 'Uso de internet' },
                ],
            },
            {
                key: 'discapacidad',
                label: 'DISCAPACIDAD',
                indicators: [
                    { key: 'pob_discapacidad',     label: 'Población censada con discapacidad' },
                    { key: 'disc_0_14',            label: 'Discapacidad de 0 a 14 años' },
                    { key: 'disc_15_59',           label: 'Discapacidad de 15 a 59 años' },
                    { key: 'disc_60_mas',          label: 'Discapacidad de 60 y más años' },
                    { key: 'disc_ver',             label: 'Discapacidad para ver' },
                    { key: 'disc_oir',             label: 'Discapacidad para oír' },
                    { key: 'disc_comunicarse',     label: 'Discapacidad para comunicarse' },
                    { key: 'disc_caminar',         label: 'Discapacidad para caminar' },
                    { key: 'disc_cuidado',         label: 'Discapacidad para cuidado personal' },
                    { key: 'disc_concentrarse',    label: 'Discapacidad para concentrarse' },
                    { key: 'disc_relacionarse',    label: 'Discapacidad para relacionarse' },
                    { key: 'edad_prom_disc',       label: 'Edad promedio de población con discapacidad' },
                    { key: 'hogares_disc',         label: 'Hogares con al menos una persona con discapacidad' },
                ],
            },
            {
                key: 'etnicidad',
                label: 'ETNICIDAD',
                indicators: [
                    { key: 'pob_indigena',         label: 'Población indígena u originaria' },
                    { key: 'pob_afroperuana',      label: 'Población afroperuana' },
                    { key: 'aprendio_quechua',     label: 'Aprendió quechua' },
                    { key: 'aprendio_aimara',      label: 'Aprendió aimara' },
                    { key: 'aprendio_lengua_indig',label: 'Aprendió lengua indígena' },
                ],
            },
            {
                key: 'economica',
                label: 'CARACTERÍSTICAS ECONÓMICAS',
                indicators: [
                    { key: 'pob_edad_trabajar',    label: 'Población en edad de trabajar' },
                    { key: 'pob_ocupada',          label: 'Población ocupada' },
                    { key: 'pob_desempleada',      label: 'Población desempleada' },
                    { key: 'pob_inactiva',         label: 'Población inactiva' },
                    { key: 'pob_ocup_dentro',      label: 'Población ocupada dentro del distrito' },
                    { key: 'pob_ocup_fuera',       label: 'Población ocupada fuera del distrito' },
                ],
            },
        ],
    },
    {
        key: 'vivienda',
        label: 'VIVIENDA',
        themes: [
            {
                key: 'caract_vivienda',
                label: 'CARACTERÍSTICAS DE LA VIVIENDA',
                indicators: [
                    { key: 'viviendas_censadas',   label: 'Viviendas censadas' },
                    { key: 'viviendas_ocupadas',   label: 'Viviendas ocupadas' },
                    { key: 'viviendas_desocupadas',label: 'Viviendas desocupadas' },
                    { key: 'departamentos_edif',   label: 'Departamentos en edificio o condominio' },
                    { key: 'viv_calidad_adecuada', label: 'Viviendas con calidad adecuada' },
                    { key: 'prom_habitaciones',    label: 'Promedio de habitaciones' },
                ],
            },
            {
                key: 'servicios_basicos',
                label: 'SERVICIOS BÁSICOS',
                indicators: [
                    { key: 'acceso_agua',          label: 'Acceso a agua' },
                    { key: 'servicio_higienico',   label: 'Servicio higiénico' },
                    { key: 'energia_electrica',    label: 'Energía eléctrica' },
                ],
            },
        ],
    },
    {
        key: 'hogar',
        label: 'HOGAR',
        themes: [
            {
                key: 'composicion_hogar',
                label: 'COMPOSICIÓN DEL HOGAR',
                indicators: [
                    { key: 'hogares_censados',     label: 'Hogares censados' },
                    { key: 'prom_personas',        label: 'Promedio de personas' },
                    { key: 'hogares_unipersonales',label: 'Hogares unipersonales' },
                    { key: 'hogares_con_ninos',    label: 'Hogares con niños' },
                    { key: 'hogares_adulto_mayor', label: 'Hogares con adultos mayores' },
                    { key: 'responsable_hombre',   label: 'Responsable hombre' },
                    { key: 'responsable_mujer',    label: 'Responsable mujer' },
                ],
            },
            {
                key: 'equipamiento',
                label: 'EQUIPAMIENTO DEL HOGAR',
                indicators: [
                    { key: 'conexion_internet',    label: 'Conexión a internet' },
                    { key: 'telefono_celular',     label: 'Teléfono celular' },
                    { key: 'computadora',          label: 'Computadora/laptop/tableta' },
                    { key: 'auto_camioneta',       label: 'Auto o camioneta' },
                ],
            },
        ],
    },
];

// ── Base maps ────────────────────────────────────────────────────────────────
interface BaseMap { key: string; label: string; service: string; overlayService?: string; icon: string; }

const BASE_MAPS: BaseMap[] = [
    { key: 'streets',   label: 'Calles',       service: 'World_Street_Map',  icon: '🛣️'  },
    { key: 'topo',      label: 'Topográfico',  service: 'World_Topo_Map',    icon: '⛰️'  },
    { key: 'satellite', label: 'Satelital',    service: 'World_Imagery',     icon: '🛰️'  },
    { key: 'hybrid',    label: 'Híbrido',      service: 'World_Imagery',
      overlayService: 'Reference/World_Reference_Overlay',                   icon: '🗺️'  },
];

@Component({
    selector: 'app-geoportal',
    standalone: true,
    imports: [CommonModule, RouterLink, MatTooltipModule, HeroIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `

    <!-- ══════════════════════════════════════════════════════════════════════
         GEOPORTAL — SECCIÓN RAÍZ
    ══════════════════════════════════════════════════════════════════════ -->
    <section
      class="bg-[#f4f7f9] w-full flex flex-col font-sans text-gray-800 h-screen overflow-hidden"
      (click)="closeAllDropdowns()">

      <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50
                     flex justify-between items-center
                     px-3 py-1 sm:px-6 sm:py-1.5 md:px-10 md:py-1.5 lg:px-12 lg:py-2
                     w-full shrink-0">

        <!-- Logos -->
        <div class="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI"
                 class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain">
          </div>
          <div class="w-px h-6 md:h-7 bg-gray-200 hidden md:block"></div>
          <img src="logo_cpv.png" alt="Logo CPV 2025"
               class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain hidden md:block">
        </div>

        <!-- Nav desktop -->
        <nav class="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium tracking-wide"
             style="color:#0056a1">
          <button routerLink="/"
            class="hover:text-secondary transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/intermedia"
            class="hover:text-secondary transition-colors uppercase relative group font-black underline">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/publicaciones" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
            Publicaciones
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
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
                <div class="h-1 w-full" style="background:linear-gradient(to right,#038dd3,#33b3a9)"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700
                               hover:bg-blue-50 hover:text-[#038dd3]
                               transition-all flex items-center gap-2 group/item">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#038dd3]
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

        <!-- Hamburger móvil -->
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
        <div class="lg:hidden bg-white border-b border-gray-100 shadow-md z-40 px-4 py-3 flex flex-col gap-1 shrink-0"
             style="animation: dropdownIn 0.18s ease-out forwards"
             (click)="$event.stopPropagation()">
          <button routerLink="/" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide">Inicio</button>
          <button routerLink="/resultados" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-black text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide underline">Resultados</button>
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
                <button [routerLink]="item.route" (click)="censosOpen.set(false); mobileMenuOpen.set(false)"
                  class="text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  {{ item.label }}
                </button>
              }
            </div>
          }
          <button routerLink="/noticias" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide">Noticias</button>
        </div>
      }

      <!-- ══ BOTONES DE TIPO DE CENSO ════════════════════════════════════════ -->
      <div class="bg-white border-b border-gray-100 shrink-0 px-3 sm:px-6 md:px-8 py-2
                  flex flex-wrap items-center gap-2"
           style="box-shadow:0 2px 8px rgba(3,141,211,0.10)">
        <button
          (click)="setCensusType('poblacion_vivienda'); $event.stopPropagation()"
          class="census-toggle-btn relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                 text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-200
                 focus:outline-none group overflow-hidden min-h-[36px]"
          [style]="censusType() === 'poblacion_vivienda'
            ? 'background:#038dd3;color:#fff;box-shadow:0 4px 12px rgba(3,141,211,0.35)'
            : 'background:#e8f4fb;color:#038dd3;box-shadow:none'">
          <app-hero-icon [name]="'users'" class="w-4 h-4 shrink-0"></app-hero-icon>
          <span class="hidden xs:inline sm:inline">Población y vivienda</span>
          <span class="xs:hidden sm:hidden">Pob. y vivienda</span>
          @if (censusType() !== 'poblacion_vivienda') {
            <span class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 bg-[#038dd3] pointer-events-none rounded-lg"></span>
          }
        </button>
        <button
          (click)="setCensusType('comunidades_indigenas'); $event.stopPropagation()"
          class="census-toggle-btn relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                 text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-200
                 focus:outline-none group overflow-hidden min-h-[36px]"
          [style]="censusType() === 'comunidades_indigenas'
            ? 'background:#038dd3;color:#fff;box-shadow:0 4px 12px rgba(3,141,211,0.35)'
            : 'background:#e8f4fb;color:#038dd3;box-shadow:none'">
          <app-hero-icon [name]="'globe-americas'" class="w-4 h-4 shrink-0"></app-hero-icon>
          <span>Com. indígenas</span>
          @if (censusType() !== 'comunidades_indigenas') {
            <span class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 bg-[#038dd3] pointer-events-none rounded-lg"></span>
          }
        </button>
        <button routerLink="/intermedia"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0056a1] text-[#0056a1]
                 font-semibold text-xs tracking-wide hover:bg-[#0056a1] hover:text-white
                 transition-all duration-200 shrink-0 min-h-[36px]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </button>
      </div>

      <!-- ══ MAIN — LAYOUT RESPONSIVO ══════════════════════════════════════════
           Desktop (md+): 40/60 side by side
           Mobile: mapa full-width + panel como bottom sheet
      ══════════════════════════════════════════════════════════════════════ -->
      <div class="flex flex-1 min-h-0 overflow-hidden">

        <!-- ─────────────────────────────────────────────────────────────────
             PANEL IZQUIERDO
             Desktop: columna fija 40%
             Mobile: bottom sheet deslizable (controlado por .mobile-open)
        ───────────────────────────────────────────────────────────────────── -->
        <div class="geo-left-panel" [class.mobile-open]="mobilePanelOpen()">

          <!-- ── Handle + título móvil ──────────────────────────────── -->
          <div class="md:hidden shrink-0 flex flex-col items-center pt-2 pb-1 px-4 border-b border-gray-100">
            <div class="w-10 h-1 bg-gray-300 rounded-full mb-2"></div>
            <div class="w-full flex items-center justify-between">
              <span class="text-xs font-black text-[#0056a1] uppercase tracking-widest">
                Indicadores
              </span>
              <button (click)="mobilePanelOpen.set(false); $event.stopPropagation()"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- ══ SUBCONTENEDOR 1: NIVEL DE VISUALIZACIÓN ══════════════════ -->
          <div class="shrink-0 px-3 pt-3 pb-2 border-b border-gray-100">

            <!-- Etiqueta sección — solo desktop -->
            <div class="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Nivel de visualización
            </div>

            <!-- Botones de nivel geográfico -->
            <div class="flex gap-1.5 mb-3">
              @for (nivel of NIVELES_GEO; track nivel) {
                <button
                  (click)="setNivelGeo(nivel); $event.stopPropagation()"
                  class="flex-1 relative py-2 md:py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200
                         focus:outline-none group overflow-hidden min-h-[36px]"
                  [style]="nivelGeo() === nivel
                    ? 'background:#0056a1;color:#fff;box-shadow:0 3px 8px rgba(0,86,161,0.30)'
                    : 'background:#eef2f9;color:#0056a1'">
                  {{ nivel }}
                  @if (nivelGeo() !== nivel) {
                    <span class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[#0056a1] transition-opacity duration-200 pointer-events-none rounded-lg"></span>
                  }
                </button>
              }
            </div>

            <!-- Dropdowns geográficos -->
            <div class="flex flex-col gap-1.5" (click)="$event.stopPropagation()">

              <!-- Dropdown Departamento -->
              <div class="relative">
                <button
                  (click)="toggleGeoDropdown('dep')"
                  [disabled]="false"
                  class="geo-dropdown-btn w-full flex items-center justify-between
                         px-3 py-2 md:py-1.5 rounded-lg border text-xs font-semibold
                         transition-all duration-200 focus:outline-none min-h-[40px] md:min-h-0"
                  [style]="'background:#fff;border-color:#e5e7eb;color:#374151'"
                  [class.opacity-40]="false"
                  [class.cursor-not-allowed]="false">
                  <span class="flex items-center gap-2 truncate">
                    <span class="text-[10px] font-black text-[#038dd3] shrink-0">DEP</span>
                    <span class="truncate">{{ geoDepLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform"
                    [class.rotate-180]="openGeoDropdown() === 'dep'"></app-hero-icon>
                </button>

                @if (openGeoDropdown() === 'dep') {
                  <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                       style="animation: dropdownIn 0.15s ease-out forwards; max-height:220px; overflow-y:auto">
                    @if (nivelGeo() === 'Departamental') {
                      <div class="sticky top-0 bg-white border-b border-gray-100 flex">
                        <button (click)="selectAllDeps()" class="flex-1 py-2.5 text-[10px] font-black text-[#038dd3] hover:bg-blue-50 transition-colors">
                          ✓ Seleccionar todos
                        </button>
                        <button (click)="deselectAllDeps()" class="flex-1 py-2.5 text-[10px] font-black text-red-400 hover:bg-red-50 transition-colors">
                          ✗ Deseleccionar todos
                        </button>
                      </div>
                      @for (dep of departments(); track dep.ccdd) {
                        <button
                          (click)="toggleDepMulti(dep.ccdd)"
                          class="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-700
                                 hover:bg-blue-50 hover:text-[#038dd3] transition-all text-left">
                          <span class="w-4 h-4 border-2 rounded shrink-0 flex items-center justify-center transition-colors"
                                [style]="selectedDeps().includes(dep.ccdd) ? 'border-color:#038dd3;background:#038dd3' : 'border-color:#d1d5db'">
                            @if (selectedDeps().includes(dep.ccdd)) {
                              <span style="color:white;font-size:9px;font-weight:900">✓</span>
                            }
                          </span>
                          {{ dep.name }}
                        </button>
                      }
                    } @else {
                      <button (click)="selectDepSingle(null)"
                        class="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-400
                               hover:bg-gray-50 transition-colors italic">
                        — Todos los departamentos —
                      </button>
                      @for (dep of departments(); track dep.ccdd) {
                        <button
                          (click)="selectDepSingle(dep)"
                          class="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700
                                 hover:bg-blue-50 hover:text-[#038dd3] transition-all"
                          [class.bg-blue-50]="selectedCCDD() === dep.ccdd"
                          [class.text-blue-700]="selectedCCDD() === dep.ccdd">
                          {{ dep.name }}
                        </button>
                      }
                    }
                  </div>
                }
              </div>

              <!-- Dropdown Provincia -->
              <div class="relative">
                <button
                  (click)="isGeoProvActive() && toggleGeoDropdown('prov')"
                  class="geo-dropdown-btn w-full flex items-center justify-between
                         px-3 py-2 md:py-1.5 rounded-lg border text-xs font-semibold
                         transition-all duration-200 focus:outline-none min-h-[40px] md:min-h-0"
                  [style]="isGeoProvActive() ? 'background:#fff;border-color:#e5e7eb;color:#374151' : 'background:#f9fafb;border-color:#f3f4f6;color:#d1d5db'"
                  [class.cursor-not-allowed]="!isGeoProvActive()">
                  <span class="flex items-center gap-2 truncate">
                    <span class="text-[10px] font-black shrink-0"
                          [style]="isGeoProvActive() ? 'color:#33b3a9' : 'color:#d1d5db'">PROV</span>
                    <span class="truncate">{{ geoProvLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 shrink-0 transition-transform"
                    [class.text-gray-400]="isGeoProvActive()"
                    [class.text-gray-200]="!isGeoProvActive()"
                    [class.rotate-180]="openGeoDropdown() === 'prov'"></app-hero-icon>
                </button>

                @if (openGeoDropdown() === 'prov' && isGeoProvActive()) {
                  <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                       style="animation: dropdownIn 0.15s ease-out forwards; max-height:220px; overflow-y:auto">
                    <button (click)="selectProv('')"
                      class="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-400
                             hover:bg-gray-50 transition-colors italic">
                      — Todas las provincias —
                    </button>
                    @for (prov of provinces(); track prov.code) {
                      <button (click)="selectProv(prov.code)"
                        class="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700
                               hover:bg-teal-50 hover:text-[#33b3a9] transition-all"
                        [class.bg-teal-50]="selectedProv() === prov.code"
                        [class.text-teal-700]="selectedProv() === prov.code">
                        {{ prov.name }}
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Dropdown Distrito -->
              <div class="relative">
                <button
                  (click)="isGeoDistActive() && toggleGeoDropdown('dist')"
                  class="geo-dropdown-btn w-full flex items-center justify-between
                         px-3 py-2 md:py-1.5 rounded-lg border text-xs font-semibold
                         transition-all duration-200 focus:outline-none min-h-[40px] md:min-h-0"
                  [style]="isGeoDistActive() ? 'background:#fff;border-color:#e5e7eb;color:#374151' : 'background:#f9fafb;border-color:#f3f4f6;color:#d1d5db'"
                  [class.cursor-not-allowed]="!isGeoDistActive()">
                  <span class="flex items-center gap-2 truncate">
                    <span class="text-[10px] font-black shrink-0"
                          [style]="isGeoDistActive() ? 'color:#0056a1' : 'color:#d1d5db'">DIST</span>
                    <span class="truncate">{{ geoDistLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 shrink-0 transition-transform"
                    [class.text-gray-400]="isGeoDistActive()"
                    [class.text-gray-200]="!isGeoDistActive()"
                    [class.rotate-180]="openGeoDropdown() === 'dist'"></app-hero-icon>
                </button>

                @if (openGeoDropdown() === 'dist' && isGeoDistActive()) {
                  <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                       style="animation: dropdownIn 0.15s ease-out forwards; max-height:220px; overflow-y:auto">
                    <button (click)="selectDist('')"
                      class="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-400
                             hover:bg-gray-50 transition-colors italic">
                      — Todos los distritos —
                    </button>
                    @for (dist of districts(); track dist.code) {
                      <button (click)="selectDist(dist.code)"
                        class="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700
                               hover:bg-blue-50 hover:text-[#0056a1] transition-all"
                        [class.bg-blue-50]="selectedDist() === dist.code"
                        [class.text-blue-700]="selectedDist() === dist.code">
                        {{ dist.name }}
                      </button>
                    }
                  </div>
                }
              </div>

            </div><!-- /dropdowns -->
          </div><!-- /subcontenedor 1 -->

          <!-- ══ SUBCONTENEDOR 2: INDICADORES ════════════════════════════════ -->
          <div class="flex-1 flex flex-col min-h-0 overflow-hidden px-3 pt-2.5 pb-2">

            <!-- Etiqueta sección -->
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 shrink-0">
              Indicadores
            </div>

            <!-- Botones categoría: POBLACIÓN / VIVIENDA / HOGAR -->
            <div class="flex gap-1.5 mb-3 shrink-0">
              @for (cat of INDICATOR_CATEGORIES; track cat.key) {
                <button
                  (click)="setActiveCategory(cat.key); $event.stopPropagation()"
                  class="flex-1 py-2 md:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold
                         transition-all duration-200 focus:outline-none relative group overflow-hidden
                         min-h-[36px]"
                  [style]="activeCategory() === cat.key
                    ? 'background:#038dd3;color:#fff;box-shadow:0 3px 10px rgba(3,141,211,0.35)'
                    : 'background:#e8f4fb;color:#038dd3'">
                  {{ cat.label }}
                  @if (activeCategory() !== cat.key) {
                    <span class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[#038dd3] transition-opacity pointer-events-none rounded-lg"></span>
                  }
                </button>
              }
            </div>

            <!-- Grid temas + indicadores -->
            <div class="flex flex-1 min-h-0 gap-2 overflow-hidden">

              <!-- Columna izquierda: Temas temáticos -->
              <div class="w-2/5 flex flex-col gap-0.5 overflow-y-auto pr-1 scroll-smooth" style="scrollbar-width:thin;scrollbar-color:#e5e7eb transparent">
                @for (theme of activeThemes(); track theme.key) {
                  <button
                    (click)="setActiveTheme(theme.key); $event.stopPropagation()"
                    class="w-full text-left px-2.5 py-2.5 md:py-2 rounded-lg text-[10px] font-bold
                           leading-tight transition-all duration-200 focus:outline-none relative group overflow-hidden
                           min-h-[36px]"
                    [style]="activeThemeKey() === theme.key
                      ? 'background:#0056a1;color:#fff;box-shadow:0 2px 6px rgba(0,86,161,0.25)'
                      : 'background:#f1f5f9;color:#475569'">
                    {{ theme.label }}
                    @if (activeThemeKey() !== theme.key) {
                      <span class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[#0056a1] transition-opacity pointer-events-none rounded-lg"></span>
                    }
                  </button>
                }
              </div>

              <!-- Columna derecha: Indicadores del tema seleccionado -->
              <div class="flex-1 overflow-y-auto scroll-smooth" style="scrollbar-width:thin;scrollbar-color:#e5e7eb transparent">
                @for (ind of activeIndicators(); track ind.key) {
                  <button
                    (click)="setActiveIndicatorItem(ind.key); $event.stopPropagation()"
                    class="w-full flex items-center gap-2 px-2.5 py-2.5 md:py-2 rounded-lg text-[10px]
                           font-semibold leading-tight text-left mb-0.5 transition-all duration-200
                           focus:outline-none group relative min-h-[36px]"
                    [style]="activeIndicatorKey() === ind.key
                      ? 'background:#e8f4fb;color:#038dd3;box-shadow:0 1px 4px rgba(3,141,211,0.15)'
                      : 'color:#4b5563'">
                    <span class="shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors"
                          [style]="activeIndicatorKey() === ind.key ? 'background:#038dd3' : 'background:#e8f4fb'">
                      <app-hero-icon [name]="'chart-bar-square'" class="w-3 h-3"
                        [style.color]="activeIndicatorKey() === ind.key ? '#fff' : '#038dd3'"></app-hero-icon>
                    </span>
                    <span class="leading-tight">{{ ind.label }}</span>
                    @if (activeIndicatorKey() !== ind.key) {
                      <span class="absolute inset-0 opacity-0 group-hover:opacity-5 bg-[#038dd3] transition-opacity pointer-events-none rounded-lg"></span>
                    }
                  </button>
                }
                @if (activeIndicators().length === 0) {
                  <div class="text-xs text-gray-400 text-center py-4 italic">
                    Selecciona un tema
                  </div>
                }
              </div>

            </div><!-- /grid temas+indicadores -->
          </div><!-- /subcontenedor 2 -->

        </div><!-- /geo-left-panel -->

        <!-- ─────────────────────────────────────────────────────────────────
             PANEL DERECHO: MAPA — ocupa 60% en desktop, 100% en móvil
        ───────────────────────────────────────────────────────────────────── -->
        <div class="flex-1 flex flex-col overflow-hidden bg-[#f4f7f9]">

          <!-- Mapa SVG + controles -->
          <div class="flex-1 bg-white m-2 rounded-xl shadow-sm border border-gray-100
                      flex flex-col overflow-hidden relative min-h-0">

            <div #mapContainerDiv
                 class="flex-1 relative min-h-0 overflow-hidden"
                 [style]="activeBaseMap() ? '' : 'background:#ffffff'">

              <!-- ─── Panel superior izquierdo: nombre geo + valor + indicador ─── -->
              <div class="absolute top-3 left-3 z-10 pointer-events-none select-none
                          bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-2 shadow-md border border-gray-100"
                   style="min-width:120px;max-width:180px">
                <div class="text-[9px] font-black tracking-wide mb-0.5" style="color:#038dd3">
                  {{ mapGeoDisplayTitle() }}
                </div>
                <div class="text-base md:text-lg font-black text-gray-900 leading-none tracking-tighter">
                  {{ mapDisplayValue() }}
                </div>
                <div class="text-[9px] font-bold text-gray-400 tracking-wide mt-0.5 leading-tight">
                  {{ activeIndicatorLabel() }}
                </div>
              </div>

              <!-- ─── Controles del mapa: Zoom / Home / Capas ─── -->
              <div class="absolute top-3 right-3 z-20 flex flex-col gap-1.5" (click)="$event.stopPropagation()">

                <!-- Zoom + -->
                <button (click)="zoomIn()"
                  matTooltip="Acercar" matTooltipClass="custom-tooltip"
                  class="map-ctrl-btn w-9 h-9 md:w-8 md:h-8 bg-white rounded-lg shadow-md border border-gray-200
                         flex items-center justify-center text-gray-500
                         hover:border-[#038dd3] hover:text-[#038dd3]
                         transition-all duration-200 focus:outline-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="w-4 h-4">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>

                <!-- Zoom - -->
                <button (click)="zoomOut()"
                  matTooltip="Alejar" matTooltipClass="custom-tooltip"
                  class="map-ctrl-btn w-9 h-9 md:w-8 md:h-8 bg-white rounded-lg shadow-md border border-gray-200
                         flex items-center justify-center text-gray-500
                         hover:border-[#038dd3] hover:text-[#038dd3]
                         transition-all duration-200 focus:outline-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>

                <!-- Home / Reset -->
                <button (click)="resetMapView()"
                  matTooltip="Restablecer vista" matTooltipClass="custom-tooltip"
                  class="map-ctrl-btn w-9 h-9 md:w-8 md:h-8 bg-white rounded-lg shadow-md border border-gray-200
                         flex items-center justify-center text-gray-500
                         hover:border-[#038dd3] hover:text-[#038dd3]
                         transition-all duration-200 focus:outline-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                    <polyline points="9 21 9 13 15 13 15 21"/>
                  </svg>
                </button>

                <!-- Selector de mapa base -->
                <div class="relative">
                  <button (click)="toggleBaseMapMenu()"
                    matTooltip="Cambiar mapa base" matTooltipClass="custom-tooltip"
                    class="map-ctrl-btn w-9 h-9 md:w-8 md:h-8 rounded-lg shadow-md border
                           flex items-center justify-center
                           transition-all duration-200 focus:outline-none"
                    [style]="showBaseMapMenu()
                      ? 'background:#038dd3;border-color:#038dd3;color:#fff'
                      : 'background:#fff;border-color:#e5e7eb;color:#6b7280'"
                    [class.hover:border-blue-400]="!showBaseMapMenu()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                      <polyline points="2 17 12 22 22 17"/>
                      <polyline points="2 12 12 17 22 12"/>
                    </svg>
                  </button>

                  @if (showBaseMapMenu()) {
                    <div class="absolute right-10 top-0 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                         style="width:148px; animation: dropdownIn 0.15s ease-out forwards">
                      <div class="h-1 w-full" style="background:linear-gradient(to right,#038dd3,#33b3a9)"></div>
                      <div class="py-1 px-1">
                        <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 pt-1.5 pb-1">
                          Mapa base
                        </div>
                        @for (bm of BASE_MAPS; track bm.key) {
                          <button
                            (click)="setBaseMap(bm.key)"
                            class="w-full flex items-center gap-2 px-2 py-2 md:py-1.5 rounded-lg text-xs font-semibold
                                   transition-all duration-150 focus:outline-none mb-0.5"
                            [style]="activeBaseMap() === bm.key
                              ? 'background:#e8f4fb;color:#038dd3'
                              : 'color:#374151'"
                            [class.hover:bg-gray-50]="activeBaseMap() !== bm.key">
                            <span class="text-sm leading-none">{{ bm.icon }}</span>
                            <span>{{ bm.label }}</span>
                            @if (activeBaseMap() === bm.key) {
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                                   stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 ml-auto shrink-0">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            }
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>

              </div><!-- /controles mapa -->

              <!-- ─── Estados de carga y error ─── -->
              @if (isMapLoading() || isMapLoadingProv() || isMapLoadingDist()) {
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400" style="z-index:10">
                  <div class="w-10 h-10 border-4 border-[#038dd3]/20 border-t-[#038dd3] rounded-full animate-spin"></div>
                  <span class="text-sm font-bold tracking-wide">Cargando mapa...</span>
                </div>
              }

              @if ((mapLoadError() || mapLoadErrorProv() || mapLoadErrorDist()) && !isMapLoading() && !isMapLoadingProv() && !isMapLoadingDist()) {
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" style="z-index:10">
                  <app-hero-icon [name]="'exclamation-triangle'" class="w-10 h-10 text-red-400"></app-hero-icon>
                  <div>
                    <p class="text-sm font-bold text-gray-700">No se pudo cargar el mapa</p>
                    <p class="text-xs text-gray-400 mt-1">Verifica los archivos de geometría en <code class="bg-gray-100 px-1 rounded">public/</code></p>
                  </div>
                  <button (click)="reloadActiveGeoJson()"
                    class="text-xs px-4 py-1.5 rounded-lg text-white font-semibold transition-colors"
                    style="background:#038dd3">
                    Reintentar
                  </button>
                </div>
              }

              @if (mapRegions().length > 0) {

                <!-- Tooltip coroplético — adaptado para móvil -->
                <div class="absolute top-14 right-3 z-20 pointer-events-none"
                     style="animation: fadeIn 0.15s ease-out">
                  @if (hoveredRegion() || selectedRegion()) {
                    <div class="bg-gray-900/95 text-white p-2.5 md:p-3 rounded-xl shadow-2xl
                                min-w-[150px] max-w-[180px] md:max-w-[200px] border border-[#038dd3]/40">
                      <div class="text-[8px] uppercase font-black tracking-widest mb-0.5"
                           style="color:#5ec4f5">
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
                      <div class="flex flex-col py-0.5 rounded px-1 mb-2 gap-0.5"
                           style="background:rgba(3,141,211,0.12)">
                        <span class="text-[8px] font-bold uppercase leading-tight"
                              style="color:#5ec4f5">
                          {{ activeIndicatorLabel() }}
                        </span>
                        <span class="text-sm font-black leading-none"
                              style="color:#a8dffd">
                          {{ getDisplayValueForRegion(hoveredRegion() ?? selectedRegion()!) }}
                        </span>
                      </div>
                      <div class="border-t border-gray-700 pt-1.5">
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
                        <div class="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-gray-700">
                          <span class="text-[8px] font-bold uppercase text-gray-400">Densidad de la población</span>
                          <span class="text-[8px] font-black text-white">
                            {{ fmtD((hoveredRegion() ?? selectedRegion())!.density, 1) }}
                            <span class="text-[7px] text-gray-400">hab/km²</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- ── Mapa base ── -->
                @if (activeBaseMap() && settledBasemapUrl()) {
                  <img [src]="settledBasemapUrl()"
                       class="absolute inset-0 w-full h-full"
                       style="object-fit:fill;pointer-events:none;display:block;z-index:0"
                       draggable="false" alt=""/>
                  @if (activeBaseMap() === 'hybrid' && settledOverlayUrl()) {
                    <img [src]="settledOverlayUrl()"
                         class="absolute inset-0 w-full h-full"
                         style="object-fit:fill;pointer-events:none;display:block;z-index:1"
                         draggable="false" alt=""/>
                  }
                }

                <!-- SVG del mapa -->
                <svg
                  [attr.viewBox]="svgViewBox()"
                  class="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                  style="display:block;z-index:2;">

                  <rect width="100%" height="100%"
                    [attr.fill]="activeBaseMap() ? 'transparent' : '#ffffff'"
                    rx="0"/>

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
                      {{ activeIndicatorLabel() }}
                    </div>
                    <div class="mb-1.5"></div>
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

              }<!-- /mapRegions -->

            </div><!-- /flex-1 relative -->

            <!-- Nota metodológica -->
            <div class="shrink-0 border-t border-gray-100 bg-gray-50/80 px-3 py-2 text-[9px] text-gray-500 leading-relaxed">
              <span class="font-black text-gray-600">Nota:</span><br>
              <div class="mt-1">
                1/ Comprende los 43 distritos de la provincia de Lima.<br>
                2/ Comprende las provincias de Barranca, Cajatambo, Canta, Cañete, Huaral, Huarochirí, Huaura, Oyón y Yauyos.<br>
                3/ Los números entre paréntesis de la leyenda corresponden al número de DEPARTAMENTOS que se encuentran en el rango.
              </div>
            </div>

          </div><!-- /mapa card -->

        </div><!-- /panel derecho -->

      </div><!-- /main layout -->

      <!-- ══ FAB MÓVIL: Abrir panel de indicadores ══════════════════════════
           Solo visible en móvil (md:hidden), fijo en la esquina inferior derecha
      ══════════════════════════════════════════════════════════════════════ -->
      <button
        class="md:hidden fixed bottom-5 right-4 z-40 flex items-center gap-2
               px-4 py-3 rounded-full shadow-xl font-bold text-sm text-white
               transition-transform duration-200 active:scale-95"
        style="background:linear-gradient(135deg,#038dd3,#0056a1);box-shadow:0 6px 20px rgba(3,141,211,0.5)"
        (click)="toggleMobilePanel($event)">
        <!-- Icono filtro/lista -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span>Indicadores</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="w-3.5 h-3.5 transition-transform"
             [class.rotate-180]="mobilePanelOpen()">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>

      <!-- Backdrop oscuro detrás del panel móvil -->
      @if (mobilePanelOpen()) {
        <div class="md:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-[2px]"
             style="animation: fadeIn 0.2s ease-out"
             (click)="mobilePanelOpen.set(false)"></div>
      }

    </section>
    `,
    styles: [`
    :host {
        display: block;
        height: 100vh;
        overflow: hidden;
    }

    /* ── Panel izquierdo responsive ─────────────────────────────────────────
       Móvil (< 768px): bottom sheet deslizable desde abajo
       Desktop (≥ 768px): columna fija lateral
    ──────────────────────────────────────────────────────────────────────── */
    .geo-left-panel {
        /* Mobile: bottom sheet */
        position: fixed;
        inset-inline: 0;
        bottom: 0;
        z-index: 40;
        width: 100%;
        max-height: 0;
        height: 0;
        background: #fff;
        border-radius: 1.25rem 1.25rem 0 0;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.14);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: height 0.32s cubic-bezier(0.32, 0.72, 0, 1),
                    max-height 0.32s cubic-bezier(0.32, 0.72, 0, 1);
        border-right: none;
    }

    .geo-left-panel.mobile-open {
        height: 74vh;
        max-height: 74vh;
    }

    @media (min-width: 768px) {
        .geo-left-panel {
            /* Desktop: columna lateral estática */
            position: relative;
            inset-inline: auto;
            bottom: auto;
            z-index: auto;
            width: 40%;
            min-width: 280px;
            max-width: 400px;
            height: auto !important;
            max-height: none !important;
            border-radius: 0;
            box-shadow: none;
            border-right: 1px solid #e5e7eb;
            transition: none;
        }
    }

    /* ── Tooltip Angular Material ───────────────────────────────────────── */
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

    /* ── Scrollbars elegantes ──────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }
    ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

    .geo-dropdown-btn:hover:not([disabled]) {
        border-color: #038dd3 !important;
        box-shadow: 0 0 0 3px rgba(3,141,211,0.08);
    }
    .map-ctrl-btn:active {
        transform: scale(0.92);
    }
    .census-toggle-btn {
        user-select: none;
    }

    /* ── Mejoras touch en móvil ────────────────────────────────────────── */
    @media (max-width: 767px) {
        .map-ctrl-btn {
            touch-action: manipulation;
        }
        .geo-dropdown-btn {
            touch-action: manipulation;
        }
    }
    `]
})
export class GeoportalComponent implements OnInit, AfterViewInit, OnDestroy {

    // ── Header nav ─────────────────────────────────────────────────────────
    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);

    censosMenu = [
        { label: 'Censo de Derecho',          route: '/censo-derecho' },
        { label: 'Características técnicas',  route: '/aspectos-generales' },
        { label: 'Innovaciones Tecnológicas', route: '/innovaciones' },
        { label: 'Normatividad censal',        route: '/normativa' },
        { label: 'Documentación Técnica',      route: '/documentacion-tecnica' },
    ];

    // ── Panel móvil (bottom sheet) ──────────────────────────────────────────
    mobilePanelOpen = signal(false);
    toggleMobilePanel(e?: Event) { e?.stopPropagation(); this.mobilePanelOpen.update(v => !v); }

    @HostListener('document:click')
    onDocumentClick() {
        this.censosOpen.set(false);
        this.mobileMenuOpen.set(false);
        this.openGeoDropdown.set(null);
    }

    toggleCensos(e: Event)      { e.stopPropagation(); this.censosOpen.update(v => !v); }
    toggleMobileMenu(e: Event)  { e.stopPropagation(); this.mobileMenuOpen.update(v => !v); }
    closeAllDropdowns()         { this.openGeoDropdown.set(null); this.censosOpen.set(false); this.showBaseMapMenu.set(false); }

    // ── Tipo de censo ───────────────────────────────────────────────────────
    censusType = signal<CensusType>('poblacion_vivienda');
    setCensusType(t: CensusType) { this.censusType.set(t); }

    // ── Nivel geográfico ────────────────────────────────────────────────────
    readonly NIVELES_GEO: NivelGeoType[] = ['Departamental', 'Provincial', 'Distrital'];
    nivelGeo        = signal<NivelGeoType>('Departamental');
    openGeoDropdown = signal<'dep'|'prov'|'dist'|null>(null);

    isGeoProvActive = computed(() => this.nivelGeo() !== 'Departamental');
    isGeoDistActive = computed(() => this.nivelGeo() === 'Distrital');

    setNivelGeo(nivel: NivelGeoType): void {
        this.nivelGeo.set(nivel);
        this.selectedCCDD.set('');
        this.selectedDeps.set([]);
        this.selectedProv.set('');
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        if (nivel === 'Provincial') this.loadGeoJsonProv();
        if (nivel === 'Distrital') { this.loadGeoJsonProv(); this.loadGeoJsonDist(); }
        const bv = this.baseVB();
        this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: bv.x, y: bv.y, w: bv.w, h: bv.h });
    }

    // ── Selección departamental multi-select ────────────────────────────────
    selectedDeps    = signal<string[]>([]);

    selectAllDeps()  { this.selectedDeps.set(this.departments().map(d => d.ccdd)); }
    deselectAllDeps(){ this.selectedDeps.set([]); this.selectedMapGeoKey.set(''); }

    toggleDepMulti(ccdd: string): void {
        this.selectedDeps.update(cur => {
            if (cur.includes(ccdd)) return cur.filter(c => c !== ccdd);
            return [...cur, ccdd];
        });
    }

    // ── Selección departamental single (para Provincial/Distrital) ──────────
    selectedCCDD = signal<string>('');
    selectedProv = signal<string>('');
    selectedDist = signal<string>('');

    geoDepLabel = computed(() => {
        const nivel = this.nivelGeo();
        if (nivel === 'Departamental') {
            const selected = this.selectedDeps();
            if (!selected.length) return 'Seleccionar departamentos';
            if (selected.length === this.departments().length) return 'Todos los departamentos';
            if (selected.length === 1) return this.departments().find(d => d.ccdd === selected[0])?.name ?? selected[0];
            return `${selected.length} departamentos`;
        }
        const ccdd = this.selectedCCDD();
        if (!ccdd) return 'Todos los departamentos';
        return this.departments().find(d => d.ccdd === ccdd)?.name ?? ccdd;
    });

    geoProvLabel = computed(() => {
        const code = this.selectedProv();
        if (!code) return 'Todas las provincias';
        return this.provinces().find(p => p.code === code)?.name ?? code;
    });

    geoDistLabel = computed(() => {
        const code = this.selectedDist();
        if (!code) return 'Todos los distritos';
        return this.districts().find(d => d.code === code)?.name ?? code;
    });

    toggleGeoDropdown(key: 'dep'|'prov'|'dist'): void {
        this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key);
    }

    selectDepSingle(dept: { ccdd: string; name: string } | null): void {
        this.selectedCCDD.set(dept?.ccdd ?? '');
        this.selectedProv.set('');
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);
        if (dept) {
            this.loadGeoJsonProv();
            this.fitRegionByCCDD(dept.ccdd);
        } else {
            const bv = this.baseVB();
            this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: bv.x, y: bv.y, w: bv.w, h: bv.h });
        }
    }

    selectProv(code: string): void {
        this.selectedProv.set(code);
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);
        if (code) {
            this.nivelGeo.set('Distrital');
            this.loadGeoJsonDist();
        }
    }

    selectDist(code: string): void {
        this.selectedDist.set(code);
        this.selectedMapGeoKey.set('');
        this.openGeoDropdown.set(null);
    }

    // ── Computed: opciones de provincias y distritos ────────────────────────
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

    // ── Indicadores: categoría / tema / indicador ───────────────────────────
    readonly INDICATOR_CATEGORIES = INDICATOR_CATEGORIES;

    activeCategory     = signal<'poblacion'|'vivienda'|'hogar'>('poblacion');
    activeThemeKey     = signal<string>('demografia');
    activeIndicatorKey = signal<string>('pob_censada');

    activeThemes = computed<ThemeGroup[]>(() => {
        return INDICATOR_CATEGORIES.find(c => c.key === this.activeCategory())?.themes ?? [];
    });

    activeIndicators = computed<IndicatorItem[]>(() => {
        const themes = this.activeThemes();
        return themes.find(t => t.key === this.activeThemeKey())?.indicators ?? [];
    });

    activeIndicatorLabel = computed<string>(() => {
        const all = INDICATOR_CATEGORIES.flatMap(c => c.themes).flatMap(t => t.indicators);
        return all.find(i => i.key === this.activeIndicatorKey())?.label ?? 'Población censada';
    });

    setActiveCategory(key: 'poblacion'|'vivienda'|'hogar'): void {
        this.activeCategory.set(key);
        const themes = INDICATOR_CATEGORIES.find(c => c.key === key)?.themes ?? [];
        if (themes.length) {
            this.activeThemeKey.set(themes[0].key);
            const inds = themes[0].indicators;
            if (inds.length) this.activeIndicatorKey.set(inds[0].key);
        }
    }

    setActiveTheme(key: string): void {
        this.activeThemeKey.set(key);
        const inds = this.activeThemes().find(t => t.key === key)?.indicators ?? [];
        if (inds.length) this.activeIndicatorKey.set(inds[0].key);
    }

    setActiveIndicatorItem(key: string): void {
        this.activeIndicatorKey.set(key);
    }

    // ── Mapa base + ResizeObserver ────────────────────────────────────────────
    readonly BASE_MAPS = BASE_MAPS;
    activeBaseMap   = signal<string>('topo');
    showBaseMapMenu = signal<boolean>(false);

    /** Dimensiones reales del contenedor del mapa (actualizadas por ResizeObserver) */
    containerW = signal<number>(600);
    containerH = signal<number>(800);

    @ViewChild('mapContainerDiv') mapContainerDivRef!: ElementRef<HTMLDivElement>;
    private resizeObs?: ResizeObserver;

    /**
     * ViewBox expandido que tiene EXACTAMENTE el mismo aspect ratio que el contenedor.
     * Esto permite usar preserveAspectRatio="none" SIN distorsionar los paths de Perú,
     * porque el viewBox ya coincide con el ratio del div.
     * Perú queda centrado en el espacio expandido.
     */
    baseVB = computed(() => {
        const cw = this.containerW();
        const ch = this.containerH();
        if (!cw || !ch) return { x: 0, y: 0, w: S.w, h: S.h };

        const contRatio = cw / ch;
        const svgRatio  = S.w / S.h;   // 380/550 ≈ 0.6909

        if (contRatio > svgRatio) {
            // Contenedor más ancho que Perú → expandir horizontalmente
            const w = S.h * contRatio;
            return { x: -(w - S.w) / 2, y: 0, w, h: S.h };
        } else {
            // Contenedor más alto → expandir verticalmente
            const h = S.w / contRatio;
            return { x: 0, y: -(h - S.h) / 2, w: S.w, h };
        }
    });

    /** ViewBox "estabilizado" — se actualiza solo cuando termina la animación de zoom/pan */
    settledViewBox = signal<string>(`0 0 ${S.w} ${S.h}`);
    private settledVBObj = computed(() => {
        const [x, y, w, h] = this.settledViewBox().split(' ').map(Number);
        return { x, y, w, h };
    });

    /** Convierte coordenadas SVG → bbox geográfico para petición ESRI */
    private svgToGeoBbox(vb: { x: number; y: number; w: number; h: number }) {
        const toLon = (sx: number) => sx / S.w * (B.maxLon - B.minLon) + B.minLon;
        const toLat = (sy: number) => (1 - sy / S.h) * (B.maxLat - B.minLat) + B.minLat;
        return {
            minLon: toLon(vb.x).toFixed(5),
            maxLon: toLon(vb.x + vb.w).toFixed(5),
            minLat: toLat(vb.y + vb.h).toFixed(5),
            maxLat: toLat(vb.y).toFixed(5),
        };
    }

    /** Construye URL de ESRI MapServer Export */
    private buildEsriUrl(
        service: string,
        geo: { minLon: string; maxLon: string; minLat: string; maxLat: string },
        transparent = false
    ): string {
        const pw  = Math.max(this.containerW(), 380);
        const ph  = Math.max(this.containerH(), 550);
        const fmt = transparent ? 'png&transparent=true' : 'jpg';
        return `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/export`
             + `?bbox=${geo.minLon},${geo.minLat},${geo.maxLon},${geo.maxLat}`
             + `&bboxSR=4326&size=${pw},${ph}&imageSR=4326&format=${fmt}&f=image`;
    }

    /** URL del mapa base (se actualiza solo al terminar animación) */
    settledBasemapUrl = computed<string>(() => {
        const key = this.activeBaseMap();
        if (!key) return '';
        const bm  = BASE_MAPS.find(b => b.key === key);
        if (!bm)  return '';
        return this.buildEsriUrl(bm.service, this.svgToGeoBbox(this.settledVBObj()), false);
    });

    /** URL del overlay de etiquetas para modo Híbrido */
    settledOverlayUrl = computed<string>(() => {
        if (this.activeBaseMap() !== 'hybrid') return '';
        const bm = BASE_MAPS.find(b => b.key === 'hybrid');
        if (!bm?.overlayService) return '';
        return this.buildEsriUrl(bm.overlayService, this.svgToGeoBbox(this.settledVBObj()), true);
    });

    toggleBaseMapMenu(): void { this.showBaseMapMenu.update(v => !v); }

    setBaseMap(key: string): void {
        this.activeBaseMap.set(key);
        this.showBaseMapMenu.set(false);
    }

    /** Resetea el viewBox al base expandido (para home y resize) */
    private resetToBaseViewBox(): void {
        const bv  = this.baseVB();
        const str = `${bv.x.toFixed(2)} ${bv.y.toFixed(2)} ${bv.w.toFixed(2)} ${bv.h.toFixed(2)}`;
        this.svgViewBox.set(str);
        this.settledViewBox.set(str);
    }

    // ── Estado mapa ─────────────────────────────────────────────────────────
    isBrowser             = false;
    selectedMapGeoKey     = signal<string>('');
    isMapLoading          = signal<boolean>(false);
    mapLoadError          = signal<boolean>(false);
    isMapLoadingProv      = signal<boolean>(false);
    mapLoadErrorProv      = signal<boolean>(false);
    isMapLoadingDist      = signal<boolean>(false);
    mapLoadErrorDist      = signal<boolean>(false);

    private rawGeoJson     = signal<any>(null);
    private rawGeoJsonProv = signal<any>(null);
    private rawGeoJsonDist = signal<any>(null);

    private readonly TOTAL_NAC = 36_596_527;

    svgViewBox    = signal<string>(`0 0 ${S.w} ${S.h}`);
    private svgAnimFrame: number | null = null;

    // ── Panel superior izquierdo del mapa ───────────────────────────────────
    mapGeoDisplayTitle = computed<string>(() => {
        const dist  = this.selectedDist();
        const prov  = this.selectedProv();
        const ccdd  = this.selectedCCDD();

        const depName = ccdd
            ? (this.departments().find(d => d.ccdd === ccdd)?.name ?? ccdd)
            : 'Perú (Nacional)';
        const provName = prov
            ? (this.provinces().find(p => p.code === prov)?.name ?? prov)
            : null;
        const distName = dist
            ? (this.districts().find(d => d.code === dist)?.name ?? dist)
            : null;

        if (distName && provName) return `${depName} / ${provName} / ${distName}`;
        if (provName)             return `${depName} / ${provName}`;
        return depName;
    });

    mapDisplayValue = computed<string>(() => {
        const regions = this.mapRegions();
        if (!regions.length) return this.fmt(this.TOTAL_NAC);
        const key = this.activeIndicatorKey();
        const sel = this.selectedRegion();
        if (sel) {
            const v = this.getIndicatorValueForKey(sel, key);
            return this.fmt(v);
        }
        const total = regions.reduce((acc, r) => acc + r.total, 0);
        return this.fmt(total || this.TOTAL_NAC);
    });

    // ── Regiones del mapa ───────────────────────────────────────────────────
    private parsedRegions = computed<Omit<MapRegion, 'color'>[]>(() => {
        const nivel = this.nivelGeo();

        if (nivel === 'Departamental') {
            const geo = this.rawGeoJson();
            if (!geo?.features) return [];
            // Si hay selección multi, filtrar
            const selDeps = this.selectedDeps();
            let features = geo.features as any[];
            if (selDeps.length) features = features.filter(f => selDeps.includes(String(f.properties.CCDD)));
            return features.map((f, idx) => {
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
            const ccdd = this.selectedCCDD();
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

        // Distrital
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
        if (!raws.length) return [];

        const key    = this.activeIndicatorKey();
        const vals   = raws.map(r => this.getIndicatorValueForKey(r as MapRegion, key));
        const sorted = [...vals].sort((a, b) => a - b);
        const n      = sorted.length;

        const quintileBounds = [0,1,2,3,4].map(i =>
            sorted[Math.min(Math.floor((i+1)*n/5)-1, n-1)]
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

        const raw = (geo.features as any[]).map((f: any) => ({
            ccdd: String(f.properties.CCDD),
            name: String(f.properties.NOMBDEP),
        }));

        const isLimaMet = (d: {name: string}) =>
            d.name.toLowerCase().includes('lima') && !d.name.toLowerCase().includes('región') && !d.name.toLowerCase().includes('region');
        const isRegLima = (d: {name: string}) =>
            d.name.toLowerCase().includes('región lima') || d.name.toLowerCase().includes('region lima');

        const limaMet = raw.find(isLimaMet);
        const regLima = raw.find(isRegLima);
        const resto   = raw.filter(d => !isLimaMet(d) && !isRegLima(d));
        const sorted  = [...resto].sort((a, b) => parseInt(a.ccdd, 10) - parseInt(b.ccdd, 10));
        const idx     = sorted.findIndex(d => d.ccdd === '14');
        const insertAt = idx >= 0 ? idx + 1 : sorted.length;
        const extras: typeof sorted = [];
        if (limaMet) extras.push(limaMet);
        if (regLima) extras.push(regLima);
        sorted.splice(insertAt, 0, ...extras);
        return sorted;
    });

    colorBreaks = computed<ColorBreak[]>(() => {
        const regions = this.mapRegions();
        const key     = this.activeIndicatorKey();
        if (!regions.length) return [];

        const vals   = regions.map(r => this.getIndicatorValueForKey(r, key));
        const sorted = [...vals].sort((a, b) => a - b);
        const n      = sorted.length;

        return Array.from({ length: 5 }, (_, i) => {
            const startIdx = Math.floor(i * n / 5);
            const endIdx   = Math.min(Math.floor((i+1)*n/5)-1, n-1);
            const bMin     = sorted[startIdx];
            const bMax     = sorted[endIdx];
            const count    = vals.filter(v => v >= bMin && v <= bMax).length;
            const label    = `${this.fmt(bMin)} – ${this.fmt(bMax)} (${count})`;
            return { min: bMin, max: bMax, color: PALETTE[i], label, count };
        });
    });

    selectedRegion = computed<MapRegion | null>(() => {
        const key = this.selectedMapGeoKey();
        if (!key) return null;
        return this.mapRegions().find(r => r.geoKey === key) ?? null;
    });

    // ── Hover ───────────────────────────────────────────────────────────────
    hoveredRegion = signal<MapRegion | null>(null);
    onRegionHover(r: MapRegion): void { this.hoveredRegion.set(r); }
    onRegionLeave(): void             { this.hoveredRegion.set(null); }

    // ── Inyecciones ─────────────────────────────────────────────────────────
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);
    private router     = inject(Router);

    constructor() {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    ngOnInit(): void {
        this.loadGeoJson();
    }

    ngAfterViewInit(): void {
        if (!this.isBrowser || !this.mapContainerDivRef) return;
        this.resizeObs = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                this.containerW.set(Math.round(width));
                this.containerH.set(Math.round(height));
                // Resetear viewBox al nuevo base expandido (mantiene Perú centrado)
                this.resetToBaseViewBox();
            }
        });
        this.resizeObs.observe(this.mapContainerDivRef.nativeElement);
    }

    ngOnDestroy(): void {
        this.resizeObs?.disconnect();
    }

    // ── Carga GeoJSON ────────────────────────────────────────────────────────
    loadGeoJson(): void {
        if (this.rawGeoJson()) return;
        this.isMapLoading.set(true);
        this.mapLoadError.set(false);
        this.http.get<any>('/departamento_geometria.json').subscribe({
            next:  data => { this.rawGeoJson.set(data);     this.isMapLoading.set(false); },
            error: ()   => { this.isMapLoading.set(false);  this.mapLoadError.set(true); },
        });
    }

    loadGeoJsonProv(): void {
        if (this.rawGeoJsonProv()) return;
        this.isMapLoadingProv.set(true);
        this.mapLoadErrorProv.set(false);
        this.http.get<any>('/provincia_geometria.json').subscribe({
            next:  data => { this.rawGeoJsonProv.set(data);    this.isMapLoadingProv.set(false); },
            error: ()   => { this.isMapLoadingProv.set(false); this.mapLoadErrorProv.set(true); },
        });
    }

    loadGeoJsonDist(): void {
        if (this.rawGeoJsonDist()) return;
        this.isMapLoadingDist.set(true);
        this.mapLoadErrorDist.set(false);
        this.http.get<any>('/distrito_geometria.json').subscribe({
            next:  data => { this.rawGeoJsonDist.set(data);    this.isMapLoadingDist.set(false); },
            error: ()   => { this.isMapLoadingDist.set(false); this.mapLoadErrorDist.set(true); },
        });
    }

    reloadActiveGeoJson(): void {
        const nivel = this.nivelGeo();
        if      (nivel === 'Departamental') { this.rawGeoJson.set(null);     this.loadGeoJson(); }
        else if (nivel === 'Provincial')    { this.rawGeoJsonProv.set(null); this.loadGeoJsonProv(); }
        else                               { this.rawGeoJsonDist.set(null); this.loadGeoJsonDist(); }
    }

    // ── Formateadores ────────────────────────────────────────────────────────
    fmt(n: number): string {
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    fmtD(n: number, dec = 1): string {
        return n.toFixed(dec).replace('.', ',');
    }

    // ── Proyección GeoJSON → SVG ─────────────────────────────────────────────
    private project(geom: any): { path: string; center: { x: number; y: number } } {
        if (!geom) return { path: '', center: { x:0, y:0 } };

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

        return { path, center: { x: n ? sx/n : 0, y: n ? sy/n : 0 } };
    }

    // ── Helpers de estilo SVG ────────────────────────────────────────────────
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

    // ── Helpers de indicadores ───────────────────────────────────────────────
    getIndicatorValueForKey(r: MapRegion, key: string): number {
        if (key === 'pob_censada'    || key === 'viviendas_censadas' || key === 'hogares_censados')
            return r.total;
        if (key === 'pob_hombres')   return r.male;
        if (key === 'pob_mujeres')   return r.female;
        if (key === 'densidad_total') return r.density;
        return MOCK_DEP[r.ccdd]?.[key] ?? r.total;
    }

    getDisplayValueForRegion(r: MapRegion): string {
        const v = this.getIndicatorValueForKey(r, this.activeIndicatorKey());
        return this.fmt(v);
    }

    // ── Eventos del mapa ─────────────────────────────────────────────────────
    onRegionClick(r: MapRegion): void {
        if (this.selectedMapGeoKey() === r.geoKey) {
            this.selectedMapGeoKey.set('');
            const bv = this.baseVB();
            this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: bv.x, y: bv.y, w: bv.w, h: bv.h });
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

    // ── Helpers tooltip ──────────────────────────────────────────────────────
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

    // ── Controles de zoom ────────────────────────────────────────────────────
    zoomIn(): void {
        const { x, y, w, h } = this.parseViewBox(this.svgViewBox());
        const factor = 0.75;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const nw = w * factor;
        const nh = h * factor;
        this.animateViewBox({ x, y, w, h }, { x: cx - nw/2, y: cy - nh/2, w: nw, h: nh }, 300);
    }

    zoomOut(): void {
        const { x, y, w, h } = this.parseViewBox(this.svgViewBox());
        const bv     = this.baseVB();
        const factor = 1.33;
        const cx     = x + w / 2;
        const cy     = y + h / 2;
        const nw     = Math.min(w * factor, bv.w);
        const nh     = Math.min(h * factor, bv.h);
        this.animateViewBox({ x, y, w, h }, { x: cx - nw/2, y: cy - nh/2, w: nw, h: nh }, 300);
    }

    resetMapView(): void {
        this.selectedCCDD.set('');
        this.selectedDeps.set([]);
        this.selectedProv.set('');
        this.selectedDist.set('');
        this.selectedMapGeoKey.set('');
        this.nivelGeo.set('Departamental');
        this.openGeoDropdown.set(null);
        // Volver al viewBox base expandido (llena el contenedor con Perú centrado)
        const bv  = this.baseVB();
        this.animateViewBox(this.parseViewBox(this.svgViewBox()), { x: bv.x, y: bv.y, w: bv.w, h: bv.h });
    }

    // ── SVG fitBounds ────────────────────────────────────────────────────────
    private fitRegion(r: MapRegion): void {
        const nivel = this.nivelGeo();
        let geo: any;
        let matchFn: (f: any) => boolean;

        if (nivel === 'Departamental') {
            geo     = this.rawGeoJson();
            matchFn = (f) => String(f.properties.CCDD) === r.geoKey;
        } else if (nivel === 'Provincial') {
            geo     = this.rawGeoJsonProv();
            matchFn = (f) => String(f.properties.CCDD) + String(f.properties.CCPP) === r.geoKey;
        } else {
            geo     = this.rawGeoJsonDist();
            matchFn = (f) => String(f.properties.UBIGEO) === r.geoKey;
        }

        if (!geo?.features) return;
        const feature = geo.features.find((f: any) => matchFn(f));
        if (!feature) return;

        const bb     = this.getGeoBBox(feature.geometry);
        const toLon  = (lon: number) => ((lon - B.minLon) / (B.maxLon - B.minLon)) * S.w;
        const toLat  = (lat: number) => (1 - (lat - B.minLat) / (B.maxLat - B.minLat)) * S.h;

        const svgMinX = toLon(bb.minLon);
        const svgMaxX = toLon(bb.maxLon);
        const svgMinY = toLat(bb.maxLat);
        const svgMaxY = toLat(bb.minLat);

        const PAD = 50;
        this.animateViewBox(
            this.parseViewBox(this.svgViewBox()),
            { x: svgMinX - PAD, y: svgMinY - PAD, w: (svgMaxX - svgMinX) + PAD*2, h: (svgMaxY - svgMinY) + PAD*2 }
        );
    }

    private fitRegionByCCDD(ccdd: string): void {
        const tryFit = () => {
            const geo = this.rawGeoJsonProv();
            if (!geo?.features) { setTimeout(() => tryFit(), 200); return; }
            const features = (geo.features as any[]).filter(f => String(f.properties.CCDD) === ccdd);
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
            const PAD = 20;
            this.animateViewBox(
                this.parseViewBox(this.svgViewBox()),
                { x: toLon(minLon) - PAD, y: toLat(maxLat) - PAD,
                  w: (toLon(maxLon) - toLon(minLon)) + PAD*2,
                  h: (toLat(minLat) - toLat(maxLat)) + PAD*2 }
            );
        };
        tryFit();
    }

    private getGeoBBox(geom: any): { minLon: number; maxLon: number; minLat: number; maxLat: number } {
        let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
        const pc = (c: number[]) => {
            if (c[0] < minLon) minLon = c[0]; if (c[0] > maxLon) maxLon = c[0];
            if (c[1] < minLat) minLat = c[1]; if (c[1] > maxLat) maxLat = c[1];
        };
        const pr = (ring: number[][]) => ring.forEach(pc);
        if (geom.type === 'Polygon') {
            geom.coordinates.forEach((ring: number[][]) => pr(ring));
        } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach((poly: number[][][]) => poly.forEach((ring: number[][]) => pr(ring)));
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
        if (this.svgAnimFrame !== null) { cancelAnimationFrame(this.svgAnimFrame); this.svgAnimFrame = null; }

        const start = performance.now();
        const tick  = (now: number) => {
            const elapsed = now - start;
            const t    = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
            const x = from.x + (to.x - from.x) * ease;
            const y = from.y + (to.y - from.y) * ease;
            const w = from.w + (to.w - from.w) * ease;
            const h = from.h + (to.h - from.h) * ease;
            const vbStr = `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`;
            this.svgViewBox.set(vbStr);
            if (t < 1) {
                this.svgAnimFrame = requestAnimationFrame(tick);
            } else {
                this.svgAnimFrame = null;
                this.settledViewBox.set(vbStr); // actualiza bbox del mapa base
            }
        };
        this.svgAnimFrame = requestAnimationFrame(tick);
    }
}