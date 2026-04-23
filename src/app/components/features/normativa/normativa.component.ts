// RUTA: src/app/components/features/normativa/normativa.component.ts

import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-normativa',
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

      <!-- HERO STRIP — activo en Normativa -->
      <div class="bg-gradient-to-r from-[#0056a1] to-[#33b3a9] py-10 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-1 bg-white/60 rounded-full"></div>
            <span class="text-white/70 text-xs font-bold uppercase tracking-widest">Censos 2025</span>
          </div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl md:text-4xl font-black text-white">Normatividad censal</h1>
          </div>
          <p class="text-white/80 mt-2 text-sm md:text-base max-w-2xl">Marco legal, disposiciones y resoluciones que regulan la realización del CPV 2025.</p>
        </div>
      </div>

      <!-- MAIN -->
      <main class="flex-1 py-12 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">

          <!-- Data Table -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse" style="min-width:520px">
                <thead>
                  <tr>
                    <th class="bg-[#0055a0] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider border border-[#004488]">Normativa</th>
                    <th class="bg-[#038dd3] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider w-44 border border-[#0277b6]">Fecha</th>
                    <th class="bg-[#33b3a9] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-28 border border-[#2a9990]">Descarga</th>
                  </tr>
                </thead>
                <tbody>
                  @for (doc of documentos; track doc.id; let even = $even) {
                    <tr class="transition-colors hover:bg-[#0056a1]/4"
                        [class.bg-white]="!even" [class.bg-gray-50]="even">
                      <td class="px-4 py-3 max-w-md border border-gray-200">
                        <div class="font-bold text-[#038dd3] text-sm leading-snug">{{ doc.titulo }}</div>
                        <div class="text-xs text-gray-600 mt-0.5 leading-relaxed">{{ doc.descripcion }}</div>
                      </td>
                      <td class="px-4 py-3 text-xs text-[#0056a1] whitespace-nowrap font-black border border-gray-200">{{ doc.fecha }}</td>
                      <td class="px-4 py-3 text-center border border-gray-200">
                        <a href="#" class="inline-flex items-center justify-center gap-1 text-[#0056a1] hover:text-[#33b3a9] transition-colors group">
                          <img src="icono-pdf.svg" alt="Descargar PDF"
                               class="w-7 h-7 group-hover:scale-110 transition-transform object-contain">
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Footer de tabla -->
            <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span class="text-xs text-gray-400">{{ documentos.length }} documentos encontrados</span>
              <span class="text-xs text-gray-400">Última actualización: setiembre 2025</span>
            </div>
          </div>

          <!-- Nota legal -->
          <div class="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <mat-icon class="text-amber-500 shrink-0 mt-0.5 !text-lg">info</mat-icon>
            <p class="text-xs text-amber-800 leading-relaxed">
              Los documentos aquí listados corresponden al marco normativo vigente del CPV 2025 y se publican en
              cumplimiento del principio de transparencia y acceso a la información pública (Ley N° 27806).
              Para consultas sobre la autenticidad de los documentos, escribir a
              <span class="font-bold">normativa.censos&#64;inei.gob.pe</span>
            </p>
          </div>

        </div>
      </main>

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
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NormativaComponent {
  censosOpen = signal(false);

  censosMenu = [
    { label: 'Censo de Derecho',  route: '/censo-derecho' },
    { label: 'Características técnicas',  route: '/aspectos-generales' },
    { label: 'Innovaciones Tecnológicas',      route: '/innovaciones' },
    { label: 'Normatividad censal',        route: '/normativa' },
    { label: 'Documentación Técnica',      route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }
  toggleCensos(e: Event) { e.stopPropagation(); this.censosOpen.update(v => !v); }

  documentos = [
    {
      id:  1,
      titulo: 'Ley Nº 13248',
      descripcion: 'Ley de Censos',
      fecha: '24 de agosto de 1959',
    },
    {
      id:  2,
      titulo: 'Ley Nº 21372',
      descripcion: 'Ley del Sistema Estadístico Nacional',
      fecha: '30 de diciembre de 1975',
    },
    {
      id:  3,
      titulo: 'Decreto Supremo Nº 063-2024-PCM',
      descripcion: 'Declaran de interés y prioridad nacional la ejecución de los Censos Nacionales 2025',
      fecha: '25 de junio de 2024',
    },
    {
      id:  4,
      titulo: 'Decreto Supremo Nº 003-2025-PCM',
      descripcion: 'Aprobación de los Censos Nacionales',
      fecha: '03 de enero de 2025',
    },
    {
      id:  5,
      titulo: 'Decreto Supremo Nº 604',
      descripcion: 'Ley De Organización y Funciones del Instituto Nacional de Estadística e Informática',
      fecha: '30 de abril de 1990',
    },
    {
      id:  6,
      titulo: 'Resolución Jefatural Nº 167-2013-INEI',
      descripcion: 'Conformación del CTIEE',
      fecha: '25 de junio de 2013',
    },
    {
      id:  7,
      titulo: 'Resolución Jefatural Nº 043-2025-INEI',
      descripcion: 'Encargan a los/las Directores/as Departamentales el desarrollo de los Censos Nacionales 2025',
      fecha: '25 de febrero de 2025',
    },
    {
      id:  8,
      titulo: 'Resolución Suprema Nº 042-2025-PCM',
      descripcion: 'Creación de la Comisión Multisectorial de los Censos Nacionales 2025',
      fecha: '05 de marzo de 2025',
    },
    {
      id:  9,
      titulo: 'Resolución Jefatural Nº 015-2025-INEI',
      descripcion: 'Aprobación del Plan de Estrategia Publicitaria',
      fecha: '24 de marzo de 2025',
    },
    {
      id: 10,
      titulo: 'Resolución Jefatural Nº 104-2025-INEI',
      descripcion: 'Norma Técnica Censal N° 001-2025-INEI: Metodología censal y obligatoriedad de brindar información veraz en los Censos Nacionales 2025: XIII de Población, VIII de Vivienda y IV de Comunidades Indígenas',
      fecha: '14 de mayo de 2025',
    },
    {
      id: 11,
      titulo: 'Resolución Jefatural Nº 173-2025-INEI',
      descripcion: 'Norma Técnica Censal N° 002-2025-INEI: Organización censal y Comités de Coordinación y apoyo a los Censos Nacionales 2025: XIII de Población, VIII de Vivienda y IV de Comunidades Indígenas',
      fecha: '24 de julio de 2025',
    },
    {
      id: 12,
      titulo: 'Resolución Jefatural Nº 200-2025-INEI',
      descripcion: 'Norma Técnica Censal N° 003-2025-INEI: Censo en Viviendas Colectivas y Personas sin Vivienda',
      fecha: '01 de setiembre de 2025',
    },
  ];
}