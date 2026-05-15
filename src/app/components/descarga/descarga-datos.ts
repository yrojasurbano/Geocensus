import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  computed,
  signal
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

// ─── Domain Types ─────────────────────────────────────────────────────────────

type IconoTema =
  | 'demografico'      | 'fecundidad'       | 'migracion'        | 'identidad'
  | 'educacion'        | 'discapacidad'      | 'etnicidad'        | 'economico'
  | 'vivienda_caract'  | 'servicios_basicos' | 'hogar_caract'     | 'equipamiento';

interface ArchivoDescarga {
  readonly descripcion: string;
  readonly tamano:      number; // MB
}

interface TemaDescarga {
  readonly id:       string;
  readonly nombre:   string;
  readonly icono:    IconoTema;
  readonly archivos: readonly ArchivoDescarga[];
}

interface Pestana {
  readonly id:    PestanaContenido;
  readonly label: string;
}

type NavPrincipal     = 'predefinidos' | 'interactivos';
type NavTopBar        = 'cuadros'      | 'microdatos'  | 'redatam';
type PestanaContenido = 'poblacion'    | 'vivienda'    | 'hogar';

// ─── Static Data ──────────────────────────────────────────────────────────────

const TEMAS_POBLACION: readonly TemaDescarga[] = [
  {
    id: 'demografico', nombre: 'Indicadores demográficos', icono: 'demografico',
    archivos: [
      { descripcion: 'Población censada y principales indicadores demográficos', tamano: 2.4 }
    ]
  },
  {
    id: 'fecundidad', nombre: 'Fecundidad', icono: 'fecundidad',
    archivos: [
      { descripcion: 'Características de la fecundidad de la población femenina', tamano: 1.8 },
      { descripcion: 'Sobrevivencia de hijas e hijos nacidos vivos',              tamano: 1.2 }
    ]
  },
  {
    id: 'migracion', nombre: 'Migración', icono: 'migracion',
    archivos: [
      { descripcion: 'Migración reciente',        tamano: 1.6 },
      { descripcion: 'Migración de toda la vida', tamano: 1.9 }
    ]
  },
  {
    id: 'identidad', nombre: 'Estado civil, identidad y seguro de salud', icono: 'identidad',
    archivos: [
      { descripcion: 'Características de la población por estado civil', tamano: 2.1 },
      { descripcion: 'Tenencia de documento de identidad',               tamano: 1.4 },
      { descripcion: 'Cobertura de seguro de salud',                     tamano: 1.7 }
    ]
  },
  {
    id: 'educacion', nombre: 'Educación', icono: 'educacion',
    archivos: [
      { descripcion: 'Características de la población por asistencia escolar', tamano: 2.3 },
      { descripcion: 'Nivel educativo alcanzado',                              tamano: 2.8 },
      { descripcion: 'Condición de alfabetismo',                               tamano: 1.5 },
      { descripcion: 'Uso de las tecnologías de la información',               tamano: 1.9 }
    ]
  },
  {
    id: 'discapacidad', nombre: 'Discapacidad', icono: 'discapacidad',
    archivos: [
      { descripcion: 'Características de la población por condición de discapacidad', tamano: 2.2 }
    ]
  },
  {
    id: 'etnicidad', nombre: 'Etnicidad', icono: 'etnicidad',
    archivos: [
      { descripcion: 'Autoidentificación étnica',                              tamano: 1.6 },
      { descripcion: 'Idiomas o lenguas que aprendieron a hablar en su niñez', tamano: 1.8 }
    ]
  },
  {
    id: 'economico', nombre: 'Características económicas', icono: 'economico',
    archivos: [
      { descripcion: 'Características de la Población en Edad de Trabajar', tamano: 3.1 },
      { descripcion: 'Condición de actividad',                              tamano: 2.7 },
      { descripcion: 'Ocupación principal',                                 tamano: 2.4 },
      { descripcion: 'Rama de actividad económica',                        tamano: 2.9 }
    ]
  }
];

const TEMAS_VIVIENDA: readonly TemaDescarga[] = [
  {
    id: 'vivienda_caract', nombre: 'Características de la vivienda', icono: 'vivienda_caract',
    archivos: [
      { descripcion: 'Tipo de vivienda particular',                            tamano: 1.8 },
      { descripcion: 'Materiales de construcción de paredes, techos y pisos', tamano: 2.6 },
      { descripcion: 'Número de habitaciones',                                tamano: 1.4 }
    ]
  },
  {
    id: 'servicios_basicos', nombre: 'Servicios básicos de la vivienda', icono: 'servicios_basicos',
    archivos: [
      { descripcion: 'Procedencia del agua',                 tamano: 1.9 },
      { descripcion: 'Conexión del servicio higiénico',      tamano: 1.7 },
      { descripcion: 'Procedencia de la energía eléctrica', tamano: 1.5 }
    ]
  }
];

const TEMAS_HOGAR: readonly TemaDescarga[] = [
  {
    id: 'hogar_caract', nombre: 'Características del hogar', icono: 'hogar_caract',
    archivos: [
      { descripcion: 'Condición de tenencia de la vivienda que ocupan los hogares',        tamano: 2.1 },
      { descripcion: 'Uso exclusivo del servicio higiénico',                               tamano: 1.6 },
      { descripcion: 'Energía o combustible que usan para cocinar',                        tamano: 1.8 },
      { descripcion: 'Formas de eliminación de residuos',                                  tamano: 1.7 },
      { descripcion: 'Emigración internacional de personas que fueron miembros del hogar', tamano: 2.3 }
    ]
  },
  {
    id: 'equipamiento', nombre: 'Equipamiento del hogar', icono: 'equipamiento',
    archivos: [
      { descripcion: 'Tenencia de medios de transporte, electrodomésticos y artefactos', tamano: 2.8 },
      { descripcion: 'Tenencia de dispositivos TICs',                                    tamano: 2.4 }
    ]
  }
];

const ICON_PATHS: Record<IconoTema, string> = {
  demografico:
    'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  fecundidad:
    'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  migracion:
    'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  identidad:
    'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  educacion:
    'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
  discapacidad:
    'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
  etnicidad:
    'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 01.284-2.253',
  economico:
    'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z',
  vivienda_caract:
    'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  servicios_basicos:
    'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  hogar_caract:
    'M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819',
  equipamiento:
    'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0h.008v.008H21V5.25z'
};

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-descarga-datos',
  standalone: true,
  imports: [RouterLink, CommonModule, MatIconModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrap">

      <!-- ══════════════════════════ HEADER ══════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50
                     flex justify-between items-center
                     px-4 py-2 sm:px-6 sm:py-3 md:px-10 md:py-3 lg:px-14 xl:px-16 w-full">

        <div class="flex items-center gap-3 md:gap-4">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-9 sm:h-10 md:h-11 lg:h-12 w-auto object-contain">
          <div class="w-px h-7 md:h-9 bg-gray-200 hidden sm:block"></div>
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45"
               class="h-7 md:h-9 lg:h-10 w-auto object-contain hidden sm:block">
        </div>

        <nav class="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium tracking-wide text-[#343b9f]">
          <button routerLink="/"
            class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Inicio
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/pagina-intermedia"
            class="text-[#0056a1] font-bold uppercase relative text-xs lg:text-sm">
            Resultados
            <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-[#038dd3]"></span>
          </button>
          <button routerLink="/publicaciones"
            class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Publicaciones
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)"
              class="hover:text-[#038dd3] transition-colors uppercase relative group flex items-center gap-1 text-xs lg:text-sm">
              Censos 2025
              <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200"
                        [class.rotate-180]="censosOpen()">expand_more</mat-icon>
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards">
                <div class="h-1 w-full" style="background: linear-gradient(to right, #0056a1, #33b3a9)"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700
                               hover:bg-blue-50 hover:text-[#0056a1] transition-all flex items-center gap-2 group/item">
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
            class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Noticias
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
        </nav>
      </header>
      <!-- /HEADER -->

      <!-- ══════════════ BARRA DE NAVEGACIÓN PRINCIPAL ══════════════ -->
      <div class="bg-white border-b border-gray-200
                  px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-2
                  flex items-center justify-between gap-2 flex-wrap">

        <div class="flex items-center gap-0.5 md:gap-1 flex-wrap">
          <button (click)="setNavTop('cuadros')"
            [class]="navTopActiva() === 'cuadros'
              ? 'nav-primary-btn nav-primary-btn--active group'
              : 'nav-primary-btn group'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125M21.75 8.25v1.5c0 .621-.504 1.125-1.125 1.125m0 0h-17.25" />
            </svg>
            CUADROS
          </button>

          <span class="text-gray-200 select-none px-1 hidden sm:block text-lg font-thin">|</span>

          <button (click)="setNavTop('microdatos')"
            [class]="navTopActiva() === 'microdatos'
              ? 'nav-primary-btn nav-primary-btn--active group'
              : 'nav-primary-btn group'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            MICRODATOS
          </button>

          <span class="text-gray-200 select-none px-1 hidden sm:block text-lg font-thin">|</span>

          <button (click)="setNavTop('redatam')"
            [class]="navTopActiva() === 'redatam'
              ? 'nav-primary-btn nav-primary-btn--accent nav-primary-btn--accent--active group'
              : 'nav-primary-btn nav-primary-btn--accent group'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            IR A REDATAM
          </button>
        </div>

        <button routerLink="/intermedia"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-[#0056a1] text-[#0056a1]
                 font-semibold text-xs tracking-wide hover:bg-[#0056a1] hover:text-white
                 transition-all duration-200 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          HOME
        </button>
      </div>

      <!-- ④ SEGUNDA BARRA — alineada a la IZQUIERDA con colores SÓLIDOS -->
      <div class="bg-[#f0f2f7] border-b border-gray-200
                  px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-2
                  flex items-center justify-start gap-2">

        <button (click)="setNav('predefinidos')"
          [class]="navActiva() === 'predefinidos' ? 'nav-sec-btn nav-sec-btn--active' : 'nav-sec-btn'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125M21.75 8.25v1.5c0 .621-.504 1.125-1.125 1.125m0 0h-17.25" />
          </svg>
          CUADROS PREDEFINIDOS
        </button>

        <button (click)="setNav('interactivos')"
          [class]="navActiva() === 'interactivos' ? 'nav-sec-btn nav-sec-btn--active' : 'nav-sec-btn'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          CUADROS INTERACTIVOS
        </button>
      </div>

      <!-- ══════════════ MAIN — centrado como normativa (max-w-5xl mx-auto) ══════════════ -->
      <main class="flex-1 bg-[#f4f6f9] py-10 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">

          <!-- ─────────── CUADROS PREDEFINIDOS ─────────── -->
          @if (navActiva() === 'predefinidos') {

            <!-- ⑤ Tabs con fill SÓLIDO -->
            <div class="flex items-center gap-2 mb-5 flex-wrap">
              @for (tab of pestanas; track tab.id) {
                <button
                  (click)="setPestana(tab.id)"
                  [class]="pestanaActiva() === tab.id ? 'tab-pill tab-pill--active' : 'tab-pill'">
                  {{ tab.label }}
                </button>
              }
            </div>

            <!-- ① Tabla estilo normativa: rounded-2xl border border-gray-200 shadow-sm -->
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm border-collapse" style="min-width:520px">

                  <thead>
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wider
                                 text-white border border-[#2b3192] w-[22%]"
                          style="background-color:#343b9f">TEMA</th>
                      <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wider
                                 text-white border border-[#004488]"
                          style="background-color:#0056a1">DESCRIPCIÓN</th>
                      <th class="px-4 py-3 text-center text-xs font-black uppercase tracking-wider
                                 text-white border border-[#0277b6] w-[10%]"
                          style="background-color:#038dd3">TAMAÑO</th>
                      <th class="px-4 py-3 text-center text-xs font-black uppercase tracking-wider
                                 text-white border border-[#2a9990] w-[10%]"
                          style="background-color:#33b3a9">DESCARGAR</th>
                    </tr>
                  </thead>

                  <!-- ② Una fila por tema — descripciones unidas en una celda -->
                  <tbody>
                    @for (tema of temasActivos(); track tema.id; let even = $even) {
                      <tr class="transition-colors hover:bg-[#0056a1]/4"
                          [class.bg-white]="!even" [class.bg-gray-50]="even">

                        <!-- TEMA -->
                        <td class="px-4 py-3 border border-gray-200 align-top">
                          <div class="flex items-start gap-2">
                            <div class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                                 style="background-color:rgba(52,59,159,0.09)">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                   viewBox="0 0 24 24" stroke-width="1.5"
                                   stroke="#343b9f" class="w-3.5 h-3.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      [attr.d]="iconPaths[tema.icono]"/>
                              </svg>
                            </div>
                            <span class="font-bold text-[#343b9f] text-xs leading-snug">
                              {{ tema.nombre }}
                            </span>
                          </div>
                        </td>

                        <!-- DESCRIPCIÓN — todas en una celda -->
                        <td class="px-4 py-3 border border-gray-200 align-top">
                          @if (tema.archivos.length === 1) {
                            <span class="text-xs text-gray-600 leading-relaxed">
                              {{ tema.archivos[0].descripcion }}
                            </span>
                          } @else {
                            <ul class="space-y-1.5">
                              @for (archivo of tema.archivos; track archivo.descripcion) {
                                <li class="flex items-start gap-1.5 text-xs text-gray-600 leading-relaxed">
                                  <span class="mt-1.5 w-1 h-1 rounded-full bg-[#038dd3] shrink-0 block"></span>
                                  {{ archivo.descripcion }}
                                </li>
                              }
                            </ul>
                          }
                        </td>

                        <!-- TAMAÑO — total del tema -->
                        <td class="px-4 py-3 border border-gray-200 text-center align-middle">
                          <span class="text-xs font-black text-[#0056a1] whitespace-nowrap">
                            {{ getTamanoTema(tema) | number:'1.1-1' }}&nbsp;MB
                          </span>
                        </td>

                        <!-- DESCARGAR — un Excel por tema -->
                        <td class="px-4 py-3 border border-gray-200 text-center align-middle">
                          <button (click)="descargarTema(tema)"
                            [title]="'Descargar: ' + tema.nombre"
                            class="inline-flex items-center justify-center w-9 h-9 rounded-lg
                                   hover:scale-110 active:scale-95 transition-transform duration-150
                                   hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#107C41]/40">
                            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
                                 class="w-7 h-7" role="img" aria-label="Archivo Excel">
                              <rect width="28" height="28" rx="4" fill="#107C41"/>
                              <path d="M7 9l3.5 5L7 19h2.3l2.7-3.9L14.7 19H17l-3.5-5 3.4-5h-2.2l-2.6 3.8L9.3 9z"
                                    fill="white"/>
                              <rect x="17.5" y="9"    width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.88"/>
                              <rect x="17.5" y="12.8" width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.88"/>
                              <rect x="17.5" y="16.5" width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.72"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Footer de tabla -->
              <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <span class="text-xs text-gray-400">
                  {{ temasActivos().length }} temas encontrados
                </span>
                <span class="text-xs text-gray-400">
                  Tamaño total:
                  <strong class="text-gray-600">{{ totalTamano() | number:'1.1-1' }} MB</strong>
                </span>
              </div>
            </div>

            <!-- Botón Descargar todos — color sólido #0056a1 -->
            <div class="mt-5 flex justify-end">
              <button (click)="descargarTodos()"
                class="flex items-center gap-3 px-7 py-3 rounded-xl text-white font-bold text-sm
                       bg-[#0056a1] hover:bg-[#004d94] shadow-md hover:shadow-lg
                       active:scale-95 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke-width="2" stroke="currentColor" class="w-5 h-5 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar todos
                <span class="bg-white/20 rounded-lg px-2.5 py-0.5 text-xs font-bold">
                  {{ totalTamano() | number:'1.1-1' }}&nbsp;MB
                </span>
              </button>
            </div>

          }
          <!-- /CUADROS PREDEFINIDOS -->

          <!-- ─────────── CUADROS INTERACTIVOS ─────────── -->
          @if (navActiva() === 'interactivos') {
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden
                        min-h-[380px] flex flex-col items-center justify-center p-8 md:p-14 text-center gap-6">

              <div class="w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center bg-[#e8eef6]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke-width="1.5" stroke="#0056a1" class="w-9 h-9">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>

              <div class="max-w-md">
                <h2 class="text-xl font-extrabold text-[#343b9f] mb-3 tracking-tight">Cuadros Interactivos</h2>
                <p class="text-gray-500 text-sm leading-relaxed">
                  Explore y personalice los datos del Censo Nacional 2025 mediante la
                  plataforma interactiva <strong class="text-[#0056a1]">REDATAM</strong>.
                  Genere cuadros a medida con filtros geográficos, temáticos y poblacionales.
                </p>
              </div>

              <button class="flex items-center gap-2.5 px-7 py-3 rounded-xl text-white font-bold text-sm
                             bg-[#0056a1] hover:bg-[#004d94] shadow-md hover:shadow-lg
                             active:scale-95 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Ir a REDATAM
              </button>
            </div>
          }

        </div>
      </main>
      <!-- /MAIN -->

      <!-- ══════════════════════════ FOOTER ══════════════════════════ -->
      <footer class="bg-[#484848] text-white py-6 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16">
        <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end
                    items-center md:items-end gap-4 w-full">
          <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
            <p class="font-bold text-sm md:text-base">Instituto Nacional de Estadística e Informática – INEI</p>
            <p class="text-xs md:text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
            <div class="flex items-center justify-center md:justify-end gap-4 mt-2 flex-wrap">
              <span class="text-xs md:text-sm text-gray-300">Síguenos:</span>
              <div class="flex gap-3">
                <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA"
                   class="hover:text-[#33b3a9] transition-colors" aria-label="Facebook INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                <a href="https://x.com/INEI_oficial?lang=es"
                   class="hover:text-[#33b3a9] transition-colors" aria-label="X INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/inei_peru/?hl=es"
                   class="hover:text-[#33b3a9] transition-colors" aria-label="Instagram INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a href="#" class="hover:text-[#33b3a9] transition-colors" aria-label="WhatsApp INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-wrap {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: #f4f6f9;
      overflow-x: hidden;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Nav principal izquierdo ── */
    .nav-primary-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      color: #343b9f;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      transition: background-color 0.18s;
      white-space: nowrap;
    }
    .nav-primary-btn:hover { background-color: rgba(52,59,159,0.07); }
    .nav-primary-btn--active {
      background-color: #343b9f;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(52,59,159,0.28);
    }
    .nav-primary-btn--active:hover { background-color: #2b3192; }
    .nav-primary-btn--accent { color: #038dd3; }
    .nav-primary-btn--accent:hover { background-color: rgba(3,141,211,0.07); }
    .nav-primary-btn--accent--active {
      background-color: #038dd3;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(3,141,211,0.28);
    }
    .nav-primary-btn--accent--active:hover { background-color: #0277b6; }
    .nav-primary-underline {
      position: absolute; bottom: 0; left: 0; width: 0; height: 2px;
      border-radius: 9999px; transition: width 0.2s;
    }
    .nav-primary-btn:hover .nav-primary-underline { width: 100%; }

    /* ④ Segunda barra — colores SÓLIDOS, alineada a la izquierda */
    .nav-sec-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #d1d5db;
      background-color: #ffffff;
      color: #343b9f;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      white-space: nowrap;
      transition: border-color 0.18s, color 0.18s, background-color 0.18s, box-shadow 0.18s;
    }
    .nav-sec-btn:hover { border-color: #0056a1; color: #0056a1; }

    /* ③ Activo: fondo sólido #0056a1 — sin degradé */
    .nav-sec-btn--active {
      background-color: #0056a1;
      border-color: #0056a1;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(0,86,161,0.28);
    }
    .nav-sec-btn--active:hover { background-color: #004d94; border-color: #004d94; }

    /* ⑤ Tabs con fill SÓLIDO */
    .tab-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.82rem;
      font-weight: 600;
      border: 1px solid #d1d5db;
      background-color: #ffffff;
      color: #6b7280;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s;
    }
    .tab-pill:hover { background-color: #f0f4fa; border-color: #0056a1; color: #0056a1; }

    /* Activo: fill sólido #0056a1 */
    .tab-pill--active {
      background-color: #0056a1;
      border-color: #0056a1;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0,86,161,0.25);
    }
    .tab-pill--active:hover { background-color: #004d94; border-color: #004d94; }

    table { border-spacing: 0; }
  `]
})
export class DescargaDatosComponent {

  // ── State ─────────────────────────────────────────────────────────────────
  readonly censosOpen    = signal<boolean>(false);
  readonly navTopActiva  = signal<NavTopBar>('cuadros');
  readonly navActiva     = signal<NavPrincipal>('predefinidos');
  readonly pestanaActiva = signal<PestanaContenido>('poblacion');

  // ── Constantes expuestas al template ─────────────────────────────────────
  readonly iconPaths = ICON_PATHS;

  readonly censosMenu = [
    { label: 'Censo de Derecho',          route: '/censo-derecho'        },
    { label: 'Características técnicas',  route: '/aspectos-generales'   },
    { label: 'Innovaciones Tecnológicas', route: '/innovaciones'          },
    { label: 'Normatividad censal',       route: '/normativa'             },
    { label: 'Documentación Técnica',     route: '/documentacion-tecnica' },
  ] as const;

  readonly pestanas: readonly Pestana[] = [
    { id: 'poblacion', label: 'Población' },
    { id: 'vivienda',  label: 'Vivienda'  },
    { id: 'hogar',     label: 'Hogar'     },
  ] as const;

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly temasActivos = computed((): readonly TemaDescarga[] => {
    switch (this.pestanaActiva()) {
      case 'poblacion': return TEMAS_POBLACION;
      case 'vivienda':  return TEMAS_VIVIENDA;
      case 'hogar':     return TEMAS_HOGAR;
    }
  });

  readonly totalTamano = computed((): number => {
    const raw = this.temasActivos().reduce((s, t) => s + this.getTamanoTema(t), 0);
    return Math.round(raw * 10) / 10;
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  getTamanoTema(tema: TemaDescarga): number {
    const raw = tema.archivos.reduce((s, a) => s + a.tamano, 0);
    return Math.round(raw * 10) / 10;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  setNavTop(nav: NavTopBar): void {
    this.navTopActiva.set(nav);
  }

  setNav(nav: NavPrincipal): void {
    this.navActiva.set(nav);
    if (nav === 'predefinidos') { this.pestanaActiva.set('poblacion'); }
  }

  setPestana(pestana: PestanaContenido): void {
    this.pestanaActiva.set(pestana);
  }

  descargarTema(tema: TemaDescarga): void {
    // Production: trigger HTTP GET to presigned URL or asset endpoint
    console.info('[DescargaDatos] Descargando tema:', tema.nombre);
  }

  descargarTodos(): void {
    this.temasActivos().forEach(t => this.descargarTema(t));
  }

  // ── Host listeners ────────────────────────────────────────────────────────
  @HostListener('document:click')
  onDocumentClick(): void { this.censosOpen.set(false); }

  toggleCensos(event: Event): void {
    event.stopPropagation();
    this.censosOpen.update(v => !v);
  }
}