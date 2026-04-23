// RUTA: src/app/components/features/censoderecho/censo-derecho.ts

import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-censo-derecho',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- CAMBIO 1 — h-screen + flex flex-col para ocupar el 100% del alto de pantalla -->
    <div class="h-screen w-full flex flex-col bg-white font-sans overflow-hidden">

      <!-- ═══════════════════════════════════════════════════════════
           HEADER
      ════════════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 flex justify-between items-center px-6 py-3 md:px-12 md:py-4 w-full shrink-0">
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
          <button routerLink="/" class="hover:text-[#33b3a9] transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/resultados" class="hover:text-[#33b3a9] transition-colors uppercase relative group">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)"
              class="text-[#0056a1] font-bold uppercase relative group flex items-center gap-1">
              Censos 2025
              <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200"
                        [class.rotate-180]="censosOpen()">expand_more</mat-icon>
              <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-[#0056a1]"></span>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards">
                <div class="h-1 w-full bg-gradient-to-r from-[#0056a1] to-[#33b3a9]"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-[#0056a1]/10 hover:to-[#33b3a9]/10 hover:text-[#0056a1] transition-all flex items-center gap-2 group/item">
                        <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#0056a1] to-[#33b3a9] opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"></span>
                        {{ item.label }}
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
          <button routerLink="/noticias" class="hover:text-[#33b3a9] transition-colors uppercase relative group">
            Noticias<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
        </nav>
      </header>

      <!-- ═══════════════════════════════════════════════════════════
           HERO STRIP + SIDEBAR DERECHO
      ════════════════════════════════════════════════════════════════ -->
      <div class="flex w-full shrink-0">

        <!-- Hero strip principal (izquierda) -->
        <div class="bg-gradient-to-r from-[#0056a1] to-[#33b3a9] flex-1 py-10 px-6 md:px-12 lg:px-16 flex items-center">
          <!-- CAMBIO 2 — contenido centrado con max-w y mx-auto -->
          <div class="w-full max-w-4xl mx-auto">
            <div class="flex items-center gap-3 mb-3">
            </div>
            <h1 class="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
              Censo de Derecho
            </h1>
            <p class="mt-3 text-base md:text-lg font-bold uppercase tracking-widest">
              <span class="text-white">NUEVA </span><span style="color:#00d2f1;">MEDICIÓN</span><span class="text-white"> DE LA POBLACIÓN</span>
            </p>
          </div>
        </div>

        <!-- Sidebar derecho -->
        <aside class="hidden md:flex flex-col w-64 lg:w-72 xl:w-80 bg-gradient-to-b from-[#0056a1] via-[#508dd1] to-[#33b3a9] relative overflow-hidden shrink-0">
          <div class="absolute inset-0 opacity-10"
               style="background-image: radial-gradient(circle at 70% 30%, #ffffff 1px, transparent 1px),
                                        radial-gradient(circle at 30% 70%, #ffffff 1px, transparent 1px);
                      background-size: 28px 28px;">
          </div>
          <!-- Mitad superior — imagen referencial -->
          <div class="relative flex-1 flex items-center justify-center border-b border-white/20 py-8 px-6 min-h-[160px]">
            <div class="relative w-full flex flex-col items-center justify-center gap-3">
              <div class="w-28 h-28 rounded-full border-4 border-white/40 bg-white/20 flex items-center justify-center shadow-xl">
                <mat-icon class="!w-14 !h-14 !text-[3.5rem] text-white/80">people_alt</mat-icon>
              </div>
              <p class="text-white/60 text-[10px] uppercase tracking-widest text-center font-semibold">
                Imagen ilustrativa
              </p>
            </div>
          </div>
          <!-- Mitad inferior -->
          <div class="relative flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4 min-h-[160px]">
            <div class="w-10 h-0.5 bg-white/40 rounded-full"></div>
            <div class="text-center">
              <p class="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-1">Metodología</p>
              <p class="text-white font-black text-lg leading-tight">Censo de<br>Derecho</p>
              <p class="text-white/60 text-[10px] uppercase tracking-widest font-bold mt-1">o <em>Jure</em></p>
            </div>
            <div class="w-10 h-0.5 bg-white/40 rounded-full"></div>
            <p class="text-white/70 text-[11px] text-center leading-relaxed">
              Residencia habitual como base del empadronamiento censal 2025
            </p>
          </div>
        </aside>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           BODY PRINCIPAL — flex-1 para ocupar el espacio restante
      ════════════════════════════════════════════════════════════════ -->
      <!-- CAMBIO 3 — flex-1 + overflow-y-auto para llenar el alto disponible -->
      <div class="flex flex-1 w-full overflow-y-auto">

        <!-- Contenido principal -->
        <!-- CAMBIO 4 — padding lateral uniforme + max-w centrado -->
        <main class="flex-1 py-10 px-6 md:px-16 lg:px-24">
          <div class="max-w-4xl mx-auto">

            <!-- Párrafo principal -->
            <section class="mb-10">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-1 h-8 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
                <h2 class="text-xl font-black text-[#0056a1] uppercase tracking-wide">¿Qué es el Censo de Derecho?</h2>
              </div>
              <p class="text-gray-700 leading-loose text-[0.95rem] text-justify">
                En el Perú, <span style="color:#038dd3; font-weight: bold;">los Censos Nacionales </span>se realizaron históricamente bajo la metodología de Censo de
                Hecho o de Facto hasta el año 2017. La excepción fue en el año 2005, cuando se aplicó el enfoque
                de Censo de Derecho o Jure, metodología que también se adoptó en los Censos Nacionales 2025.<br><br> El
                Censo de Derecho consiste en censar a las personas en el lugar donde residen habitualmente. Se
                considera como residencia habitual el lugar donde una persona vive la mayor parte del tiempo en
                los últimos doce (12) meses (al menos seis meses y un día) o donde tiene intención de permanecer
                mientras que, en el Censo de Hecho se censaba a la persona donde había pasado la noche del día
                censal.<br><br> Este enfoque permitió obtener información más precisa para la planificación de políticas
                públicas, al identificar con mayor claridad dónde vive la población y dónde se concentra la
                demanda de servicios.<br><br> Asimismo, en este último censo se incorporaron innovaciones tecnológicas,
                como el uso de tabletas y cuestionarios electrónicos, lo que permitió mejorar los controles de
                calidad en tiempo real y optimizar el proceso censal.<br><br> Este cambio metodológico contó con el
                respaldo de la Comisión Multisectorial de los Censos Nacionales 2025, creada mediante Resolución
                Suprema N.° 042-2025-PCM, y formalizada mediante la Norma Técnica N.° 001-2025-INEI, que
                establece la metodología censal y la obligatoriedad de brindar información, así como el secreto
                estadístico.
              </p>
            </section>

            <!-- CAMBIO 5 — 3 cuadros decorativos: sin contenido, tamaño 25 px, centrados -->
            <section class="mb-10">
              <div class="flex justify-left items-left gap-3">
                <div class="rounded-sm shrink-0" style="width:25px; height:25px; background-color:#0056a1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px; height:25px; background-color:#508dd1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px; height:25px; background-color:#33b3a9;"></div>
              </div>
            </section>
          </div>
        </main>

        <!-- Sidebar derecho continuación visual -->
        <aside class="hidden md:block w-64 lg:w-72 xl:w-80 bg-gradient-to-b from-[#33b3a9]/10 to-transparent shrink-0 border-l border-[#33b3a9]/15">
        </aside>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           LÍNEA DEGRADÉ 20 px
      ════════════════════════════════════════════════════════════════ -->
      <div class="w-full shrink-0" style="height:20px; background: linear-gradient(to right, #0056a1, #508dd1, #33b3a9);"></div>

      <!-- ═══════════════════════════════════════════════════════════
           FOOTER
      ════════════════════════════════════════════════════════════════ -->
      <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24 shrink-0">
        <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-6 w-full">
          <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
            <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
            <p class="text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
            <div class="flex items-center justify-center md:justify-end gap-4 mt-2">
              <span class="text-sm text-gray-300">Síguenos:</span>
              <div class="flex gap-3">
                <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-[#33b3a9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-[#33b3a9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-[#33b3a9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a href="#" class="hover:text-[#33b3a9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
                    <path d="M17.49 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
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
    :host { display: block; height: 100%; }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CensoderechoComponent {
  censosOpen = signal(false);

  censosMenu = [
    { label: 'Censo de Derecho',          route: '/censo-derecho'         },
    { label: 'Características técnicas',  route: '/aspectos-generales'    },
    { label: 'Innovaciones Tecnológicas',     route: '/innovaciones'          },
    { label: 'Normatividad censal',       route: '/normativa'             },
    { label: 'Documentación Técnica',     route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }

  toggleCensos(e: Event) {
    e.stopPropagation();
    this.censosOpen.update(v => !v);
  }
}