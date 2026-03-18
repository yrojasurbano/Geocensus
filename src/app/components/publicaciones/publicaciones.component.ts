// RUTA: src/app/components/features/publicaciones/publicaciones.component.ts

import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen w-full flex flex-col bg-white font-sans">

      <!-- HEADER -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 flex justify-between items-center px-6 py-3 md:px-12 md:py-4 w-full">
        <!-- Logos izquierda -->
        <div class="flex items-center gap-4 md:gap-5">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-10 md:h-12 w-auto object-contain">
          <div class="w-px h-8 md:h-10 bg-gray-200 hidden md:block"></div>
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45"
               class="h-8 md:h-10 w-auto object-contain hidden md:block">
        </div>
        <!-- Nav derecha -->
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide text-[#343b9f]">
            <button routerLink="/" class="hover:text-secondary transition-colors uppercase relative group">
              Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/resultados" class="hover:text-secondary transition-colors uppercase relative group">
              Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/publicaciones" class="hover:text-secondary transition-colors uppercase relative group">
              Publicaciones<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <div class="relative">
              <button (click)="toggleCensos($event)"
                class="text-primary font-bold uppercase relative group flex items-center gap-1">
                Censos 2025
                <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200" [class.rotate-180]="censosOpen()">expand_more</mat-icon>
                <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"></span>
              </button>
              @if (censosOpen()) {
                <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                     style="animation: dropdownIn 0.18s ease-out forwards">
                  <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                  <ul class="py-1">
                    @for (item of censosMenu; track item.label) {
                      <li>
                        <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                          class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary transition-all flex items-center gap-2 group/item">
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
      </header>

      <!-- ══ HERO STRIP ══════════════════════════════════════════════════════ -->
      <div class="bg-gradient-to-r from-[#0056a1] to-[#33b3a9] py-10 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-1 bg-white/60 rounded-full"></div>
            <span class="text-white/70 text-xs font-bold uppercase tracking-widest">Censos Nacionales 2025</span>
          </div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl md:text-4xl font-black text-white">Publicaciones</h1>
            
          </div>
          <p class="text-white/80 mt-2 text-sm md:text-base max-w-2xl">
            Documentos oficiales, boletines estadísticos e informes técnicos publicados en el marco del CPV 2025.
          </p>
        </div>
      </div>

      <!-- ══ MAIN ════════════════════════════════════════════════════════════ -->
      <main class="flex-1 py-12 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">
          
          <!-- Barra de búsqueda + filtros de tipo -->
          <div class="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
            
            <!-- Buscador -->
            <div class="relative w-full sm:w-64">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 !text-base">search</mat-icon>
              <input
                type="text"
                placeholder="Buscar publicación..."
                [value]="textoBusqueda()"
                (input)="textoBusqueda.set($any($event.target).value)"
                class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              >
            </div>
          </div>

          <!-- Data Table -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse" style="min-width:480px">
                <thead>
                  <tr>
                    <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Título del Documento</th>
                    <th class="bg-[#0056a1] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Descripción</th>
                    <th class="bg-[#33b3a9] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-24">Descarga</th>
                  </tr>
                </thead>
                <tbody>
                  @if (publicacionesFiltradas().length === 0) {
                    <tr>
                      <td colspan="3" class="py-16 text-center text-gray-400">
                        <mat-icon class="!text-4xl text-gray-200 block mx-auto mb-2">search_off</mat-icon>
                        <p class="text-sm font-bold text-gray-500">No se encontraron publicaciones</p>
                        <p class="text-xs mt-1">Intenta con otro filtro o término de búsqueda</p>
                      </td>
                    </tr>
                  }
                  @for (pub of publicacionesFiltradas(); track pub.id; let even = $even) {
                    <tr class="border-b border-gray-50 transition-colors hover:bg-[#0056a1]/4"
                        [class.bg-white]="!even" [class.bg-gray-50/50]="even">
                      <td class="px-4 py-3 max-w-[240px]">
                        <div class="font-semibold text-gray-800 text-sm leading-snug">{{ pub.titulo }}</div>
                        <div class="text-xs text-gray-400 mt-0.5">{{ pub.referencia }}</div>
                      </td>
                      <td class="px-4 py-3 max-w-[260px]">
                        <p class="text-xs text-gray-600 leading-relaxed line-clamp-2">{{ pub.descripcion }}</p>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <a [href]="pub.enlace" target="_blank"
                           class="inline-flex items-center justify-center gap-1 text-[#0056a1] hover:text-[#33b3a9] transition-colors group">
                          <svg viewBox="0 0 24 24" class="w-7 h-7 group-hover:scale-110 transition-transform" fill="none">
                            <rect x="3" y="2" width="18" height="20" rx="3" fill="#e53e3e" opacity="0.12"/>
                            <rect x="3" y="2" width="18" height="20" rx="3" stroke="#e53e3e" stroke-width="1.5" fill="none"/>
                            <text x="12" y="14.5" font-family="Arial,sans-serif" font-size="6" font-weight="900"
                                  fill="#e53e3e" text-anchor="middle">PDF</text>
                            <line x1="7" y1="17" x2="17" y2="17" stroke="#e53e3e" stroke-width="1" opacity="0.4"/>
                          </svg>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Footer de tabla -->
            <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <span class="text-xs text-gray-400">{{ publicacionesFiltradas().length }} publicacion{{ publicacionesFiltradas().length !== 1 ? 'es' : '' }} encontrada{{ publicacionesFiltradas().length !== 1 ? 's' : '' }}</span>
              <span class="text-xs text-gray-400">Última actualización: junio 2025</span>
            </div>
          </div>

          <!-- Nota informativa -->
          <div class="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <mat-icon class="text-amber-500 shrink-0 mt-0.5 !text-lg">info</mat-icon>
            <p class="text-xs text-amber-800 leading-relaxed">
              Las publicaciones aquí listadas son documentos oficiales del INEI producidos en el marco del
              Censo de Población y Vivienda 2025. Se publican en cumplimiento del principio de transparencia
              y acceso a la información pública (Ley N° 27806).
              Para consultas, escribir a
              <span class="font-bold">publicaciones.censos&#64;inei.gob.pe</span>
            </p>
          </div>

        </div>
      </main>

      <!-- ══ FOOTER ══════════════════════════════════════════════════════════ -->
      <!-- FOOTER -->
      <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24">
        <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-6 w-full">
          <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
            <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
            <p class="text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
            <div class="flex items-center justify-center md:justify-end gap-4 mt-2">
              <span class="text-sm text-gray-300">Síguenos:</span>
              <div class="flex gap-3">
                <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
                <a href="#" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/><path d="M17.49 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PublicacionesComponent {
  censosOpen    = signal(false);
  filtroActivo  = signal<string>('todas');
  textoBusqueda = signal<string>('');

  censosMenu = [
    { label: 'Características del censo',    route: '/aspectos-generales', active: false },
    { label: 'Innovaciones censales',    route: '/innovaciones', active: false },
    { label: 'Etapas censales',          route: '/organizacion',        active: false },
    { label: 'Normatividad censal',             route: '/normativa',           active: true  },
    { label: 'Documentación Técnica', route: '/documentacion-tecnica', active: false },
  ];

  categoriasFiltro = [
    { label: 'Todas',             value: 'todas' },
    { label: 'Boletín',          value: 'Boletín' },
    { label: 'Informe Técnico',  value: 'Informe Técnico' },
    { label: 'Resultados',       value: 'Resultados' },
    { label: 'Metodología',      value: 'Metodología' },
    { label: 'Atlas',            value: 'Atlas' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }
  toggleCensos(e: Event) { e.stopPropagation(); this.censosOpen.update(v => !v); }

  publicaciones = [
    {
      id: 1,
      titulo: 'Primeros Resultados — Población Censada del Perú 2025',
      referencia: 'INEI, junio 2025',
      descripcion: 'Publicación con los primeros resultados del Censo de Población y Vivienda 2025, incluyendo cifras nacionales y departamentales de población total, hombres y mujeres.',
      categoria: 'Resultados',
      categoriaColor: '#0056a1',
      peso: '8.4 MB',
      enlace: '#',
    },
    {
      id: 2,
      titulo: 'Boletín N° 01 — Características Demográficas de la Población 2025',
      referencia: 'INEI / DTDES, mayo 2025',
      descripcion: 'Análisis de las principales características demográficas: estructura por edad y sexo, razón de masculinidad y distribución urbano-rural.',
      categoria: 'Boletín',
      categoriaColor: '#33b3a9',
      peso: '4.2 MB',
      enlace: '#',
    },
    {
      id: 3,
      titulo: 'Informe Técnico — Metodología del Censo de Población y Vivienda 2025',
      referencia: 'INEI / DIAE, marzo 2025',
      descripcion: 'Documento metodológico que describe el diseño censal, los operativos de campo, instrumentos de recolección y procesos de crítica y codificación.',
      categoria: 'Metodología',
      categoriaColor: '#343b9f',
      peso: '6.7 MB',
      enlace: '#',
    },
    {
      id: 4,
      titulo: 'Atlas Censal del Perú 2025 — Distribución Territorial de la Población',
      referencia: 'INEI / Cartografía, junio 2025',
      descripcion: 'Atlas cartográfico con mapas coropléticos departamentales, provinciales y distritales de los principales indicadores demográficos del CPV 2025.',
      categoria: 'Atlas',
      categoriaColor: '#038dd3',
      peso: '22.1 MB',
      enlace: '#',
    },
    {
      id: 5,
      titulo: 'Boletín N° 02 — Envejecimiento Poblacional en el Perú 2025',
      referencia: 'INEI / DTDES, junio 2025',
      descripcion: 'Análisis del proceso de envejecimiento demográfico: índice de envejecimiento, edad media y mediana, y relación de dependencia adulta por departamento.',
      categoria: 'Boletín',
      categoriaColor: '#33b3a9',
      peso: '3.8 MB',
      enlace: '#',
    },
    {
      id: 6,
      titulo: 'Informe Técnico — Cobertura y Calidad del CPV 2025',
      referencia: 'INEI / DIAE, mayo 2025',
      descripcion: 'Evaluación de la cobertura censal mediante encuesta postcensal, análisis de omisiones y errores de cobertura por ámbito geográfico y grupo poblacional.',
      categoria: 'Informe Técnico',
      categoriaColor: '#343b9f',
      peso: '5.1 MB',
      enlace: '#',
    },
    {
      id: 7,
      titulo: 'Resultados Definitivos — Censos Nacionales 2025 (Tomo I)',
      referencia: 'INEI, junio 2025',
      descripcion: 'Tomo I de los resultados definitivos del CPV 2025. Contiene tablas de población por departamento, provincia y distrito, desagregadas por sexo y grupos de edad.',
      categoria: 'Resultados',
      categoriaColor: '#0056a1',
      peso: '14.3 MB',
      enlace: '#',
    },
    {
      id: 8,
      titulo: 'Boletín N° 03 — Fecundidad y Mortalidad en el Perú 2025',
      referencia: 'INEI / DTDES, junio 2025',
      descripcion: 'Indicadores de natalidad, mortalidad general e infantil, esperanza de vida al nacer y tasa global de fecundidad estimados a partir del CPV 2025.',
      categoria: 'Boletín',
      categoriaColor: '#33b3a9',
      peso: '3.3 MB',
      enlace: '#',
    },
    {
      id: 9,
      titulo: 'Informe Técnico — Densidad Poblacional y Concentración Urbana 2025',
      referencia: 'INEI / DIAE, junio 2025',
      descripcion: 'Análisis de la densidad de población censada y la población de 60 y más años por kilómetro cuadrado, con comparación respecto al CPV 2017.',
      categoria: 'Informe Técnico',
      categoriaColor: '#343b9f',
      peso: '4.6 MB',
      enlace: '#',
    },
    {
      id: 10,
      titulo: 'Metodología — Marco Cartográfico del CPV 2025',
      referencia: 'INEI / Cartografía, enero 2025',
      descripcion: 'Descripción del proceso de actualización cartográfica previa al censo: delimitación de áreas de empadronamiento, validación de límites político-administrativos y georeferenciación.',
      categoria: 'Metodología',
      categoriaColor: '#343b9f',
      peso: '9.8 MB',
      enlace: '#',
    },
    {
      id: 11,
      titulo: 'Atlas Censal del Perú 2025 — Indicadores de Envejecimiento',
      referencia: 'INEI / Cartografía, junio 2025',
      descripcion: 'Volumen especial del Atlas Censal con cartografía detallada de los indicadores de envejecimiento: índice de envejecimiento, densidad de adultos mayores y relación de dependencia.',
      categoria: 'Atlas',
      categoriaColor: '#038dd3',
      peso: '18.5 MB',
      enlace: '#',
    },
    {
      id: 12,
      titulo: 'Resultados Definitivos — Censos Nacionales 2025 (Tomo II: Vivienda)',
      referencia: 'INEI, junio 2025',
      descripcion: 'Tomo II de los resultados definitivos del CPV 2025. Contiene estadísticas sobre el parque habitacional: tipo de vivienda, material de construcción, acceso a servicios básicos.',
      categoria: 'Resultados',
      categoriaColor: '#0056a1',
      peso: '12.7 MB',
      enlace: '#',
    },
  ];

  publicacionesFiltradas = () => {
    let lista = this.publicaciones;
    const filtro = this.filtroActivo();
    const busqueda = this.textoBusqueda().toLowerCase().trim();
    if (filtro !== 'todas') {
      lista = lista.filter(p => p.categoria === filtro);
    }
    if (busqueda) {
      lista = lista.filter(p =>
        p.titulo.toLowerCase().includes(busqueda) ||
        p.descripcion.toLowerCase().includes(busqueda) ||
        p.referencia.toLowerCase().includes(busqueda)
      );
    }
    return lista;
  };
}