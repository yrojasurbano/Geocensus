import {
  Component,
  ChangeDetectionStrategy,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  PLATFORM_ID,
  Inject,
  HostListener
} from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#EEEEEE]">

      <div class="relative flex-1 flex flex-col min-h-0">

        <div class="absolute inset-0 z-0 overflow-hidden bg-black">
          <video
            #bgVideo
            autoplay
            loop
            [muted]="true"
            playsinline
            class="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto object-cover -translate-x-1/2 -translate-y-1/2 opacity-90"
          >
            <source src="video_web.webm" type="video/webm">
            Tu navegador no soporta la etiqueta de video.
          </video>
          <div class="absolute inset-0 bg-black/20"></div>
        </div>

        <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
        <header class="relative z-20 flex justify-between items-center px-4 py-2 md:px-12 md:py-4 text-white w-full shrink-0">

          <!-- ── Logos (izquierda) ────────────────────────────────────────── -->
          <div class="flex items-center gap-2 md:gap-6">
            <img
              ngSrc="logo_inei_white.png"
              alt="Logo INEI"
              width="180"
              height="50"
              priority
              class="h-9 md:h-24 2xl:h-28 w-auto object-contain drop-shadow-md"
            >
            <div class="w-px h-6 md:h-10 bg-white/30"></div>
            <img
              ngSrc="logo_cpv_white.svg"
              alt="Logo CPV 2025"
              width="160"
              height="50"
              priority
              class="h-11 md:h-28 2xl:h-32 w-auto object-contain drop-shadow-md"
            >
          </div>

          <!-- ── Nav desktop (derecha) ──────────────────────────────────── -->
          <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
            <button routerLink="/" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Inicio
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/intermedia" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Resultados
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/publicaciones" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Publicaciones
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>

            <!-- ── Censos 2025 dropdown ── -->
            <div class="relative">
              <button
                (click)="toggleCensos($event)"
                class="hover:text-secondary transition-colors duration-300 uppercase relative group flex items-center gap-1">
                Censos 2025
                <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200"
                  [class.rotate-180]="censosOpen()">expand_more</mat-icon>
                <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
              </button>
              @if (censosOpen()) {
                <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                     style="animation: dropdownIn 0.18s ease-out forwards">
                  <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                  <ul class="py-1">
                    @for (item of censosMenu; track item.label) {
                      <li>
                        <button
                          [routerLink]="item.route"
                          (click)="censosOpen.set(false)"
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
            <!-- /Censos 2025 -->

            <button routerLink="/noticias" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Noticias
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
          </nav>

          <!-- ── Hamburger (solo móvil) ──────────────────────────────────── -->
          <button
            (click)="toggleMobileMenu($event)"
            class="flex md:hidden items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menú">
            @if (mobileMenuOpen()) {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            }
          </button>

          <!-- ── Mobile nav dropdown ─────────────────────────────────────── -->
          @if (mobileMenuOpen()) {
            <div class="absolute top-full left-0 right-0 z-50 md:hidden bg-black/90 backdrop-blur-md border-t border-white/10"
                 style="animation: dropdownIn 0.18s ease-out forwards">
              <nav class="flex flex-col py-2">
                <button routerLink="/" (click)="mobileMenuOpen.set(false)"
                  class="w-full text-left px-6 py-3 text-sm font-semibold text-white uppercase hover:bg-white/10 transition-colors tracking-wide">
                  Inicio
                </button>
                <button routerLink="/intermedia" (click)="mobileMenuOpen.set(false)"
                  class="w-full text-left px-6 py-3 text-sm font-semibold text-white uppercase hover:bg-white/10 transition-colors tracking-wide">
                  Resultados
                </button>
                <button routerLink="/publicaciones" (click)="mobileMenuOpen.set(false)"
                  class="w-full text-left px-6 py-3 text-sm font-semibold text-white uppercase hover:bg-white/10 transition-colors tracking-wide">
                  Publicaciones
                </button>
                <div class="mx-6 my-1 h-px bg-white/10"></div>
                <span class="px-6 py-1.5 text-[10px] font-bold text-white/50 uppercase tracking-widest">Censos 2025</span>
                @for (item of censosMenu; track item.label) {
                  <button [routerLink]="item.route" (click)="mobileMenuOpen.set(false)"
                    class="w-full text-left px-8 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                    {{ item.label }}
                  </button>
                }
                <div class="mx-6 my-1 h-px bg-white/10"></div>
                <button routerLink="/noticias" (click)="mobileMenuOpen.set(false)"
                  class="w-full text-left px-6 py-3 text-sm font-semibold text-white uppercase hover:bg-white/10 transition-colors tracking-wide">
                  Noticias
                </button>
              </nav>
            </div>
          }

        </header>
        <!-- /HEADER -->

        <!-- ══ CUERPO ══════════════════════════════════════════════════════════ -->
        <div class="relative z-10 flex-1 flex flex-col justify-center min-h-0">

          <!-- Título y botón -->
          <div class="px-6 md:px-12 lg:px-24">
            <div class="max-w-5xl animate-fade-in-up relative w-full">
              <div class="absolute -top-20 -left-20 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-20 blur-3xl -z-10"></div>

              <div class="absolute top-20 left-[340px] transform -translate-x-1/2 -translate-y-1/2 -z-10">
                 <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-15"></div>
                 <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-100"></div>
              </div>

              <div class="w-16 h-1 bg-white mb-3 ml-1"></div>

              <h1 class="text-[1.75rem] sm:text-4xl md:text-6xl font-black text-white leading-tight mb-4 md:mb-6 drop-shadow-xl relative z-10">
                CENSOS <br/>
                NACIONALES
                <span class="text-white inline">
                  2025
                </span>
              </h1>

              <div class="flex flex-col sm:flex-row gap-4 relative z-10">
                <button
                  routerLink="/intermedia"
                  class="bg-gradient-to-br from-primary to-secondary hover:brightness-110 text-white font-bold py-3 px-8 rounded-[30px] shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-base tracking-wide w-max"
                >
                  <mat-icon>bar_chart</mat-icon>
                  RESULTADOS
                </button>
              </div>
            </div>
          </div>

          <!-- ★ Cards -->
          <div class="w-full px-4 md:px-12 lg:px-16 mt-3 md:mt-8 2xl:mt-12 relative z-10">
            <div class="max-w-4xl 2xl:max-w-5xl mx-auto flex flex-col gap-2 md:gap-4 2xl:gap-6
                        bg-black/10 backdrop-blur-[3px] p-3 md:p-6 2xl:p-10 rounded-3xl border border-white/10 shadow-lg">

              <!-- ── Fila 1: Población ── -->
              <div class="grid grid-cols-3 gap-x-1 md:flex md:flex-row md:items-center md:justify-center">

                <!-- Población Total -->
                <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                  <img
                    src="pobtotal.svg"
                    alt="Población Total"
                    class="w-7 h-7 md:w-10 md:h-10 2xl:w-12 2xl:h-12 mb-1 md:mb-2 2xl:mb-3 drop-shadow-md object-contain brightness-0 invert"
                  >
                  <span class="text-[8px] md:text-sm 2xl:text-base font-medium tracking-tight md:tracking-widest uppercase opacity-90 drop-shadow-md text-center leading-tight">Población Total</span>
                  <span class="text-base sm:text-xl md:text-3xl lg:text-4xl 2xl:text-[2.75rem] font-black mt-0.5 md:mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                    {{ formatNumber(poblacionCensada) }}
                  </span>
                </div>

                <div class="hidden md:block w-px h-24 2xl:h-32 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-4 2xl:mx-8"></div>

                <!-- Población Censada -->
                <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                  <img
                    src="pobcensada.svg"
                    alt="pobcensada"
                    class="w-7 h-7 md:w-10 md:h-10 2xl:w-12 2xl:h-12 mb-1 md:mb-2 2xl:mb-3 drop-shadow-md object-contain brightness-0 invert"
                  >
                  <span class="text-[8px] md:text-sm 2xl:text-base font-medium tracking-tight md:tracking-widest uppercase opacity-90 drop-shadow-md text-center leading-tight">Población Censada</span>
                  <span class="text-base sm:text-xl md:text-3xl lg:text-4xl 2xl:text-[2.75rem] font-black mt-0.5 md:mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                    {{ formatNumber(poblacionMasculina) }}
                  </span>
                </div>

                <div class="hidden md:block w-px h-24 2xl:h-32 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-4 2xl:mx-8"></div>

                <!-- Población Omitida -->
                <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                  <img
                    src="pobomitida.svg"
                    alt="pobomitida"
                    class="w-7 h-7 md:w-10 md:h-10 2xl:w-12 2xl:h-12 mb-1 md:mb-2 2xl:mb-3 drop-shadow-md object-contain brightness-0 invert"
                  >
                  <span class="text-[8px] md:text-sm 2xl:text-base font-medium tracking-tight md:tracking-widest uppercase opacity-90 drop-shadow-md text-center leading-tight">Población Omitida</span>
                  <span class="text-base sm:text-xl md:text-3xl lg:text-4xl 2xl:text-[2.75rem] font-black mt-0.5 md:mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                    {{ formatNumber(poblacionFemenina) }}
                  </span>
                </div>

              </div>
              <!-- /Fila 1 -->

              <!-- Separador horizontal entre filas -->
              <div class="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

              <!-- ── Fila 2: Viviendas y Hogares ── -->
              <div class="grid grid-cols-2 gap-x-1 md:flex md:flex-row md:items-center md:justify-center">

                <!-- Viviendas Censadas -->
                <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                  <img
                    src="vivienda.svg"
                    alt="Viviendas"
                    class="w-7 h-7 md:w-10 md:h-10 2xl:w-12 2xl:h-12 mb-1 md:mb-2 2xl:mb-3 drop-shadow-md object-contain brightness-0 invert"
                  >
                  <span class="text-[8px] md:text-sm 2xl:text-base font-medium tracking-tight md:tracking-widest uppercase opacity-90 drop-shadow-md text-center leading-tight">Viviendas Censadas</span>
                  <span class="text-base sm:text-xl md:text-3xl lg:text-4xl 2xl:text-[2.75rem] font-black mt-0.5 md:mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                    {{ formatNumber(viviendasCensadas) }}
                  </span>
                </div>

                <div class="hidden md:block w-px h-24 2xl:h-32 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-4 2xl:mx-8"></div>

                <!-- Hogares Censados -->
                <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                  <img
                    src="hogar.svg"
                    alt="Hogares"
                    class="w-7 h-7 md:w-10 md:h-10 2xl:w-12 2xl:h-12 mb-1 md:mb-2 2xl:mb-3 drop-shadow-md object-contain brightness-0 invert"
                  >
                  <span class="text-[8px] md:text-sm 2xl:text-base font-medium tracking-tight md:tracking-widest uppercase opacity-90 drop-shadow-md text-center leading-tight">Hogares Censados</span>
                  <span class="text-base sm:text-xl md:text-3xl lg:text-4xl 2xl:text-[2.75rem] font-black mt-0.5 md:mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                    {{ formatNumber(hogaresCensados) }}
                  </span>
                </div>

              </div>
              <!-- /Fila 2 -->

            </div>
          </div>
          <!-- /Cards -->

        </div>
        <!-- /CUERPO -->

      </div>

      <div class="w-full h-[10px] bg-gradient-to-r from-primary to-secondary z-20 shrink-0"></div>

      <div class="bg-[#EEEEEE] flex flex-col z-20 shrink-0">
        <footer class="bg-[#484848] text-white py-4 md:py-6 px-4 md:px-12 lg:px-24">
          <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:justify-between w-full gap-3 sm:gap-6">

            <!-- ★ Contador de visitas web -->
            <div class="flex items-center gap-2 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-[#33b3a9] shrink-0"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Visitas al sitio</span>
              <span class="text-[11px] font-black text-[#33b3a9] tabular-nums tracking-wide">
                {{ formatNumber(visitasContador()) }}
              </span>
              <span class="relative flex h-2 w-2 ml-0.5 shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#33b3a9] opacity-60"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#33b3a9]"></span>
              </span>
            </div>

            <!-- Instituto + dirección + redes -->
            <div class="flex flex-col items-center sm:items-end text-center sm:text-right">
              <p class="font-bold text-sm md:text-base">Instituto Nacional de Estadística e Informática – INEI</p>
              <p class="text-xs md:text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
              <div class="flex items-center justify-center sm:justify-end gap-4 mt-2">
                <span class="text-xs md:text-sm text-gray-300">Síguenos:</span>
                <div class="flex gap-3">
                  <!-- Facebook -->
                  <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-secondary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                  <!-- X (ex Twitter) -->
                  <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-secondary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <!-- Instagram -->
                  <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-secondary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </footer>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in-up {
      animation: fadeInUp 1s ease-out forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    @keyframes fadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HeroComponent implements AfterViewInit {
  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;
  searchOpen = signal(false);
  censosOpen = signal(false);
  mobileMenuOpen = signal(false);

  censosMenu = [
    { label: 'Censo de Derecho',  route: '/censo-derecho' },
    { label: 'Características técnicas',  route: '/aspectos-generales' },
    { label: 'Innovaciones Tecnológicas',      route: '/innovaciones' },
    { label: 'Normatividad censal',        route: '/normativa' },
    { label: 'Documentación Técnica',      route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() {
    this.censosOpen.set(false);
    this.mobileMenuOpen.set(false);
  }

  toggleCensos(event: Event) {
    event.stopPropagation();
    this.censosOpen.update(v => !v);
  }

  toggleMobileMenu(event: Event) {
    event.stopPropagation();
    this.mobileMenuOpen.update(v => !v);
    this.censosOpen.set(false);
  }

  readonly poblacionCensada   = 36_480_432;
  readonly poblacionMasculina = 18_480_432;
  readonly poblacionFemenina  = 13_480_432;

  readonly viviendasCensadas  = 11_254_876;
  readonly hogaresCensados    = 10_987_341;

  readonly visitasContador = signal<number>(1_532);
  private readonly VISITAS_KEY  = 'geocensus_visitas';
  private readonly VISITAS_BASE = 1_532;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {

      const video = this.bgVideo?.nativeElement;
      if (video) {
        video.muted = true;
        const tryPlay = () => {
          video.play().catch(err => console.warn('Autoplay bloqueado:', err));
        };
        if (video.readyState >= 3) {
          tryPlay();
        } else {
          video.addEventListener('canplay', tryPlay, { once: true });
          setTimeout(tryPlay, 300);
        }
      }

      const stored  = localStorage.getItem(this.VISITAS_KEY);
      const current = stored ? parseInt(stored, 10) : this.VISITAS_BASE;
      const updated = current + 1;
      localStorage.setItem(this.VISITAS_KEY, String(updated));
      this.visitasContador.set(updated);
    }
  }

  formatNumber(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  toggleSearch() {
    this.searchOpen.update(v => !v);
  }
}
