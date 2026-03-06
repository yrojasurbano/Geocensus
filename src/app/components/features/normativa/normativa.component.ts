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

      <!-- HEADER con Normativa activa -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 flex justify-between items-center px-6 py-3 md:px-12 md:py-4 w-full">
        <div class="flex items-center gap-8">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-10 md:h-12 w-auto object-contain">
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
                <div class="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                     style="animation: dropdownIn 0.18s ease-out forwards">
                  <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                  <ul class="py-1">
                    @for (item of censosMenu; track item.label) {
                      <li>
                        <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                          class="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2 group/item transition-all"
                          [class.text-primary]="item.active"
                          [class.font-black]="item.active"
                          [class.bg-primary\/5]="item.active"
                          [class.text-gray-700]="!item.active"
                          [class.hover\:bg-gradient-to-r]="!item.active"
                          [class.hover\:from-primary\/10]="!item.active"
                          [class.hover\:to-secondary\/10]="!item.active"
                          [class.hover\:text-primary]="!item.active">
                          <span class="w-1.5 h-1.5 rounded-full shrink-0 transition-opacity"
                                [class.bg-primary]="item.active"
                                [class.bg-gradient-to-br]="!item.active"
                                [class.from-primary]="!item.active"
                                [class.to-secondary]="!item.active"
                                [class.opacity-100]="item.active"
                                [class.opacity-0]="!item.active"
                                [class.group-hover\/item\:opacity-100]="!item.active"></span>
                          {{ item.label }}
                          @if (item.active) {
                            <mat-icon class="!text-sm !w-4 !h-4 ml-auto text-primary">check_circle</mat-icon>
                          }
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
        </div>
        <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45" class="h-9 w-auto object-contain hidden md:block">
      </header>

      <!-- HERO STRIP — activo en Normativa -->
      <div class="bg-gradient-to-r from-[#0056a1] to-[#33b3a9] py-10 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-1 bg-white/60 rounded-full"></div>
            <span class="text-white/70 text-xs font-bold uppercase tracking-widest">Censos 2025</span>
          </div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl md:text-4xl font-black text-white">Normativa</h1>
            <!-- Indicador visual de sección activa -->
            <span class="hidden md:inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
              <span class="w-2 h-2 rounded-full bg-[#f8bd13] animate-pulse"></span>
              Sección activa
            </span>
          </div>
          <p class="text-white/80 mt-2 text-sm md:text-base max-w-2xl">Marco legal, disposiciones y resoluciones que regulan la realización del CPV 2025.</p>
        </div>
      </div>

      <!-- MAIN -->
      <main class="flex-1 py-12 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">

          <!-- Indicador de sección activa -->
          <div class="flex items-center gap-3 mb-8 p-4 bg-[#0056a1]/5 rounded-2xl border border-[#0056a1]/10">
            <mat-icon class="text-[#0056a1]">bookmark</mat-icon>
            <div>
              <div class="text-sm font-black text-[#0056a1]">Normativa — Sección activa</div>
              <div class="text-xs text-gray-500">Marco jurídico y regulatorio del Censo de Población y Vivienda 2025</div>
            </div>
          </div>

          <!-- Filtros de tipo de documento -->
          <div class="flex flex-wrap gap-2 mb-6">
            @for (tipo of tiposFiltro; track tipo.label) {
              <button
                (click)="filtroActivo.set(tipo.value)"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                [class.bg-primary]="filtroActivo() === tipo.value"
                [class.text-white]="filtroActivo() === tipo.value"
                [class.shadow-md]="filtroActivo() === tipo.value"
                [class.bg-gray-100]="filtroActivo() !== tipo.value"
                [class.text-gray-600]="filtroActivo() !== tipo.value"
                [class.hover\:bg-gray-200]="filtroActivo() !== tipo.value">
                {{ tipo.label }}
              </button>
            }
          </div>

          <!-- Data Table -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse" style="min-width:600px">
                <thead>
                  <tr>
                    <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider w-14">N°</th>
                    <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Descripción del Documento</th>
                    <th class="bg-[#0056a1] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-28">Tipo</th>
                    <th class="bg-[#0056a1] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-24">Tamaño</th>
                    <th class="bg-[#33b3a9] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-24">Descarga</th>
                  </tr>
                </thead>
                <tbody>
                  @for (doc of documentosFiltrados(); track doc.id; let even = $even; let i = $index) {
                    <tr class="border-b border-gray-50 transition-colors hover:bg-[#0056a1]/4"
                        [class.bg-white]="!even" [class.bg-gray-50/50]="even">
                      <td class="px-4 py-3 text-xs font-black text-gray-400 text-center">{{ doc.id }}</td>
                      <td class="px-4 py-3">
                        <div class="font-semibold text-gray-800 text-sm leading-snug">{{ doc.titulo }}</div>
                        <div class="text-xs text-gray-400 mt-0.5">{{ doc.referencia }}</div>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                              [style.background]="doc.tipoColor + '18'"
                              [style.color]="doc.tipoColor">
                          {{ doc.tipo }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center text-xs font-mono text-gray-500">{{ doc.tamano }}</td>
                      <td class="px-4 py-3 text-center">
                        <a href="#" class="inline-flex items-center justify-center gap-1 text-[#0056a1] hover:text-[#33b3a9] transition-colors group">
                          <!-- Icono PDF SVG -->
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
              <span class="text-xs text-gray-400">{{ documentosFiltrados().length }} documentos encontrados</span>
              <span class="text-xs text-gray-400">Última actualización: junio 2025</span>
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
        <div class="max-w-7xl mx-auto flex flex-col items-center md:items-end gap-4 w-full">
          <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
          <p class="text-sm text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-300">Síguenos:</span>
            <div class="flex gap-3">
              <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
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
  censosOpen   = signal(false);
  filtroActivo = signal<string>('todos');

  censosMenu = [
    { label: 'Aspectos Generales',    route: '/aspectos-generales', active: false },
    { label: 'Organización',          route: '/organizacion',        active: false },
    { label: 'Normativa',             route: '/normativa',           active: true  },
    { label: 'Documentación Técnica', route: '/documentacion-tecnica', active: false },
  ];

  tiposFiltro = [
    { label: 'Todos',          value: 'todos' },
    { label: 'Ley',            value: 'Ley' },
    { label: 'Decreto',        value: 'Decreto' },
    { label: 'Resolución',     value: 'Resolución' },
    { label: 'Directiva',      value: 'Directiva' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }
  toggleCensos(e: Event) { e.stopPropagation(); this.censosOpen.update(v => !v); }

  documentos = [
    { id:  1, titulo: 'Ley Nº 17532 — Ley Orgánica del INEI',                                                         referencia: 'Diario Oficial El Peruano, 1969',   tipo: 'Ley',        tipoColor: '#343b9f', tamano: '1.2 MB' },
    { id:  2, titulo: 'Ley Nº 25129 — Ley del Sistema Nacional de Estadística',                                        referencia: 'Diario Oficial El Peruano, 1990',   tipo: 'Ley',        tipoColor: '#343b9f', tamano: '890 KB' },
    { id:  3, titulo: 'Decreto Supremo Nº 003-2025-PCM — Aprobación de los Censos Nacionales 2025',                    referencia: 'PCM, enero 2025',                   tipo: 'Decreto',    tipoColor: '#0056a1', tamano: '2.1 MB' },
    { id:  4, titulo: 'Decreto Supremo Nº 019-2025-PCM — Reglamento Operativo del CPV 2025',                           referencia: 'PCM, marzo 2025',                   tipo: 'Decreto',    tipoColor: '#0056a1', tamano: '3.4 MB' },
    { id:  5, titulo: 'Resolución Jefatural Nº 015-2025-INEI — Metodología censal',                                    referencia: 'INEI, febrero 2025',                tipo: 'Resolución', tipoColor: '#038dd3', tamano: '1.8 MB' },
    { id:  6, titulo: 'Resolución Jefatural Nº 032-2025-INEI — Manual de instrucciones para empadronadores',           referencia: 'INEI, marzo 2025',                  tipo: 'Resolución', tipoColor: '#038dd3', tamano: '5.2 MB' },
    { id:  7, titulo: 'Directiva Nº 001-2025-INEI/DTDES — Normas para el procesamiento de cédulas censales',           referencia: 'INEI, abril 2025',                  tipo: 'Directiva',  tipoColor: '#33b3a9', tamano: '2.7 MB' },
    { id:  8, titulo: 'Directiva Nº 002-2025-INEI/DTDES — Procedimiento de crítica y codificación',                    referencia: 'INEI, abril 2025',                  tipo: 'Directiva',  tipoColor: '#33b3a9', tamano: '1.4 MB' },
    { id:  9, titulo: 'Resolución Ministerial Nº 085-2025-PCM — Conformación de la Comisión Interinstitucional',       referencia: 'PCM, enero 2025',                   tipo: 'Resolución', tipoColor: '#038dd3', tamano: '760 KB' },
    { id: 10, titulo: 'Decreto Supremo Nº 041-2025-PCM — Medidas de seguridad de datos censales',                      referencia: 'PCM, abril 2025',                   tipo: 'Decreto',    tipoColor: '#0056a1', tamano: '1.1 MB' },
    { id: 11, titulo: 'Directiva Nº 003-2025-INEI/DTDES — Protocolo de supervisión y control de calidad en campo',    referencia: 'INEI, marzo 2025',                  tipo: 'Directiva',  tipoColor: '#33b3a9', tamano: '3.0 MB' },
    { id: 12, titulo: 'Resolución Jefatural Nº 048-2025-INEI — Plan de difusión y comunicación CPV 2025',              referencia: 'INEI, febrero 2025',                tipo: 'Resolución', tipoColor: '#038dd3', tamano: '980 KB' },
  ];

  documentosFiltrados = () => {
    const filtro = this.filtroActivo();
    return filtro === 'todos' ? this.documentos : this.documentos.filter(d => d.tipo === filtro);
  };
}