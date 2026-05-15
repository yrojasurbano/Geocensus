import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pag-intermedia',
  standalone: true,
  imports: [RouterLink,CommonModule, MatIconModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrap">

      <!-- ══════════════════════════ HEADER ══════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50
                     flex justify-between items-center
                     px-4 py-2 sm:px-6 sm:py-3 md:px-10 md:py-3 lg:px-14 xl:px-16 w-full">

        <!-- Logos izquierda -->
        <div class="flex items-center gap-3 md:gap-4">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-9 sm:h-10 md:h-11 lg:h-12 w-auto object-contain">
          <div class="w-px h-7 md:h-9 bg-gray-200 hidden sm:block"></div>
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45"
               class="h-7 md:h-9 lg:h-10 w-auto object-contain hidden sm:block">
        </div>

        <!-- Nav derecha -->
        <nav class="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium tracking-wide text-[#343b9f]">
          <button routerLink="/" class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Inicio
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>

          <!-- Resultados — activo -->
          <button routerLink="/pagina-intermedia"
            class="text-[#0056a1] font-bold uppercase relative text-xs lg:text-sm">
            Resultados
            <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-[#038dd3]"></span>
          </button>

          <button routerLink="/publicaciones" class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Publicaciones
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>

          <!-- Censos 2025 dropdown -->
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

          <button routerLink="/noticias" class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Noticias
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
        </nav>
      </header>
      <!-- /HEADER -->

      <!-- ══════════════════════════ MAIN BODY ══════════════════════════ -->
      <main class="flex-1 flex flex-col items-center justify-center
                   px-6 py-14 md:py-20 lg:py-24 bg-[#f4f6f9]">

        <!-- Encabezado de sección -->
        <div class="text-center mb-12 md:mb-16 animate-fade-up">
          <div class="inline-flex items-center gap-2 mb-4">
            <span class="h-px w-10 bg-[#343b9f]"></span>
            <span class="text-xs font-semibold tracking-[0.25em] uppercase text-[##343b9f]">Plataforma de Resultados</span>
            <span class="h-px w-10 bg-[#343b9f]"></span>
          </div>
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-black text-[#038dd3] leading-tight">
          Censos Nacionales <span class="text-[#33b3a9]">2025</span></h1>
          <p class="mt-3 text-gray-500 text-sm md:text-base max-w-lg mx-auto">
            Selecciona la categoría que deseas explorar
          </p>
        </div>

        <!-- Grid de tarjetas-botón -->
        <div class="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">

          <!-- ① Indicadores de población total -->
          <button routerLink="/resultados" class="group card-btn border-t-4 border-[#0056a1]">
            <div class="icon-wrap bg-[#0056a1]/10 group-hover:bg-[#0056a1] transition-colors duration-300">
              <!-- Hero Icon: chart-bar -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="w-7 h-7 text-[#0056a1] group-hover:text-white transition-colors duration-300">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <span class="card-label">Indicadores de Población Total</span>
            <span class="card-sub">Cifras censales de la población a nivel nacional</span>
            <span class="card-arrow text-[#0056a1]">→</span>
          </button>

          <!-- ② Indicadores de población y viviendas censadas -->
          <button routerLink="/dashboard-censada" class="group card-btn border-t-4 border-[#038dd3]">
            <div class="icon-wrap bg-[#038dd3]/10 group-hover:bg-[#038dd3] transition-colors duration-300">
              <!-- Hero Icon: building-office (vivienda + personas) -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="w-7 h-7 text-[#038dd3] group-hover:text-white transition-colors duration-300">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span class="card-label">Indicadores de Población y Viviendas Censadas</span>
            <span class="card-sub">Relación entre hogares, viviendas y ocupantes</span>
            <span class="card-arrow text-[#038dd3]">→</span>
          </button>

          <!-- ③ Indicadores de comunidades indígenas -->
          <button routerLink="/resultados/comunidades-indigenas" class="group card-btn border-t-4 border-[#33b3a9]">
            <div class="icon-wrap bg-[#33b3a9]/10 group-hover:bg-[#33b3a9] transition-colors duration-300">
              <!-- Hero Icon: globe-alt -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="w-7 h-7 text-[#33b3a9] group-hover:text-white transition-colors duration-300">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 01.284-2.253m0 0A11.953 11.953 0 0112 10.5" />
              </svg>
            </div>
            <span class="card-label">Indicadores de Comunidades Indígenas</span>
            <span class="card-sub">Datos de pueblos y comunidades originarias del Perú</span>
            <span class="card-arrow text-[#33b3a9]">→</span>
          </button>

          <!-- ④ Geoportal -->
          <button routerLink="/geoportal" class="group card-btn border-t-4 border-[#0056a1]">
            <div class="icon-wrap bg-[#0056a1]/10 group-hover:bg-[#0056a1] transition-colors duration-300">
              <!-- Hero Icon: map -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="w-7 h-7 text-[#0056a1] group-hover:text-white transition-colors duration-300">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <span class="card-label">Geoportal</span>
            <span class="card-sub">Visualización georreferenciada de los resultados censales</span>
            <span class="card-arrow text-[#0056a1]">→</span>
          </button>

          <!-- ⑤ Descarga de datos -->
          <button routerLink="/descarga-datos" class="group card-btn border-t-4 border-[#038dd3]">
            <div class="icon-wrap bg-[#038dd3]/10 group-hover:bg-[#038dd3] transition-colors duration-300">
              <!-- Hero Icon: arrow-down-tray -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="w-7 h-7 text-[#038dd3] group-hover:text-white transition-colors duration-300">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <span class="card-label">Descarga de Datos</span>
            <span class="card-sub">Microdatos y bases censales en formatos abiertos</span>
            <span class="card-arrow text-[#038dd3]">→</span>
          </button>

          <!-- ⑥ Documentación y asistencia -->
          <button routerLink="/documentacion-tecnica" class="group card-btn border-t-4 border-[#33b3a9]">
            <div class="icon-wrap bg-[#33b3a9]/10 group-hover:bg-[#33b3a9] transition-colors duration-300">
              <!-- Hero Icon: question-mark-circle -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="w-7 h-7 text-[#33b3a9] group-hover:text-white transition-colors duration-300">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <span class="card-label">Documentación y Asistencia</span>
            <span class="card-sub">Glosarios, metodología y soporte técnico al usuario</span>
            <span class="card-arrow text-[#33b3a9]">→</span>
          </button>

          <!-- PLACEHOLDER (mantiene alineación en grids de 3 columnas si se agregan más) -->

        </div><!-- /Grid -->

      </main>
      <!-- /MAIN BODY -->

      <!-- ══════════════════════════ FOOTER ══════════════════════════ -->
      <footer class="bg-[#484848] text-white py-6 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16">
        <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-4 w-full">
          <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
            <p class="font-bold text-sm md:text-base">Instituto Nacional de Estadística e Informática – INEI</p>
            <p class="text-xs md:text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
            <div class="flex items-center justify-center md:justify-end gap-4 mt-2 flex-wrap">
              <span class="text-xs md:text-sm text-gray-300">Síguenos:</span>
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
      <!-- /FOOTER -->

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

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-up {
      animation: fadeUp 0.6s ease-out forwards;
    }

    /* ── Tarjeta-botón base ── */
    .card-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      background: #ffffff;
      border-radius: 1rem;
      padding: 1.5rem 1.5rem 1.25rem;
      text-align: left;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      transition: box-shadow 0.25s ease, transform 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .card-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0,86,161,.03) 0%, rgba(51,179,169,.03) 100%);
      opacity: 0;
      transition: opacity 0.25s;
    }

    .card-btn:hover {
      box-shadow: 0 8px 28px rgba(0,86,161,.12);
      transform: translateY(-3px);
    }

    .card-btn:hover::after { opacity: 1; }

    .icon-wrap {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.25rem;
      transition: background 0.3s;
    }

    .card-label {
      font-size: 1rem;
      font-weight: 800;
      color: #1a202c;
      line-height: 1.2;
    }

    .card-sub {
      font-size: 0.78rem;
      color: #6b7280;
      line-height: 1.45;
      flex: 1;
    }

    .card-arrow {
      font-size: 1.1rem;
      font-weight: 700;
      margin-top: 0.25rem;
      transition: transform 0.2s;
    }

    .card-btn:hover .card-arrow {
      transform: translateX(4px);
    }
  `]
})
export class IntermediaComponent {
  censosOpen = signal(false);

  censosMenu = [
    { label: 'Censo de Derecho',         route: '/censo-derecho' },
    { label: 'Características técnicas', route: '/aspectos-generales' },
    { label: 'Innovaciones Tecnológicas',route: '/innovaciones' },
    { label: 'Normatividad censal',      route: '/normativa' },
    { label: 'Documentación Técnica',    route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }

  toggleCensos(event: Event) {
    event.stopPropagation();
    this.censosOpen.update(v => !v);
  }
}