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
            <source src="video_web.mp4" type="video/mp4">
            Tu navegador no soporta la etiqueta de video.
          </video>
          <div class="absolute inset-0 bg-black/50"></div>
        </div>

        <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
        <header class="relative z-20 flex justify-between items-center px-6 py-3 md:px-12 md:py-4 text-white w-full shrink-0">

          <!-- ── Logos (izquierda) ────────────────────────────────────────── -->
          <div class="flex items-center gap-4 md:gap-6">
            <img 
              ngSrc="logo_inei_white.png" 
              alt="Logo INEI" 
              width="180" 
              height="50"
              priority
              class="h-20 md:h-22 2xl:h-24 w-auto object-contain drop-shadow-md"
            >
            <div class="w-px h-8 md:h-10 bg-white/30"></div>
            <img 
              ngSrc="logo_cpv_white.svg" 
              alt="Logo CPV 2025" 
              width="160" 
              height="50"
              priority
              class="h-24 md:h-28 2xl:h-28 w-auto object-contain drop-shadow-md"
            >
          </div>

          <!-- ── Nav (derecha) ────────────────────────────────────────────── -->
          <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
            <button routerLink="/" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Inicio
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/resultados" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Resultados
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <!-- ★ Botón Publicaciones -->
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

              <h1 class="text-4xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-xl relative z-10">
                CENSOS <br/>
                NACIONALES 
                <span class="text-white inline">
                  2025
                  <div class="inline-block w-3 h-3 2xl:w-4 2xl:h-4 bg-secondary rounded-sm align-baseline ml-1"></div>
                </span>
              </h1>
              
              <div class="flex flex-col sm:flex-row gap-4 relative z-10">
                <button 
                  routerLink="/resultados"
                  class="bg-gradient-to-br from-primary to-secondary hover:brightness-110 text-white font-bold py-3 px-8 rounded-[30px] shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-base tracking-wide w-max"
                >
                  <mat-icon>bar_chart</mat-icon>
                  RESULTADOS
                </button>              
              </div>
            </div>
          </div>

          <!-- ★ Cards — bg-black/10 + backdrop-blur-[3px] para menos distorsión -->
          <div class="w-full px-6 md:px-12 lg:px-16 mt-12 2xl:mt-16 relative z-10">
            <div class="max-w-4xl 2xl:max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center
                        bg-black/10 backdrop-blur-[3px] p-6 2xl:p-10 rounded-3xl border border-white/10 shadow-lg">

              <!-- Población Censada — valor fijo, sin contador -->
              <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                <mat-icon class="!w-10 !h-10 2xl:!w-12 2xl:!h-12 !text-[2.5rem] 2xl:!text-[3rem] mb-2 2xl:mb-3 drop-shadow-md text-primary-light">groups</mat-icon>
                <span class="text-xs md:text-sm 2xl:text-base font-medium tracking-widest uppercase opacity-90 drop-shadow-md text-center">Población Censada</span>
                <span class="text-3xl md:text-4xl 2xl:text-[2.75rem] font-black mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                  {{ formatNumber(poblacionCensada) }}
                </span>
              </div>

              <div class="hidden md:block w-px h-24 2xl:h-32 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-4 2xl:mx-8"></div>
              <div class="block md:hidden w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent my-6"></div>

              <!-- Hombres — valor fijo -->
              <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                <mat-icon class="!w-10 !h-10 2xl:!w-12 2xl:!h-12 !text-[2.5rem] 2xl:!text-[3rem] mb-2 2xl:mb-3 drop-shadow-md text-primary-light">man</mat-icon>
                <span class="text-xs md:text-sm 2xl:text-base font-medium tracking-widest uppercase opacity-90 drop-shadow-md text-center">Hombres</span>
                <span class="text-3xl md:text-4xl 2xl:text-[2.75rem] font-black mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                  {{ formatNumber(poblacionMasculina) }}
                </span>
              </div>

              <div class="hidden md:block w-px h-24 2xl:h-32 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-4 2xl:mx-8"></div>
              <div class="block md:hidden w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent my-6"></div>

              <!-- Mujeres — valor fijo -->
              <div class="flex-1 flex flex-col items-center w-full text-white transform transition-transform hover:scale-105">
                <mat-icon class="!w-10 !h-10 2xl:!w-12 2xl:!h-12 !text-[2.5rem] 2xl:!text-[3rem] mb-2 2xl:mb-3 drop-shadow-md text-primary-light">woman</mat-icon>
                <span class="text-xs md:text-sm 2xl:text-base font-medium tracking-widest uppercase opacity-90 drop-shadow-md text-center">Mujeres</span>
                <span class="text-3xl md:text-4xl 2xl:text-[2.75rem] font-black mt-1 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 text-center w-full">
                  {{ formatNumber(poblacionFemenina) }}
                </span>
              </div>

            </div>
          </div>
          <!-- /Cards -->

        </div>
        <!-- /CUERPO -->

      </div>

      <div class="w-full h-[10px] bg-gradient-to-r from-primary to-secondary z-20 shrink-0"></div>

      <div class="bg-[#EEEEEE] flex flex-col z-20 shrink-0">
        <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24">
          <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-6 w-full">
            <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
              <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
              <p class="text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
              <div class="flex items-center justify-center md:justify-end gap-4 mt-2">
                <span class="text-sm text-gray-300">Síguenos:</span>
                <div class="flex gap-3">
                  <!-- Facebook -->
                  <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-secondary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                  <!-- ★ X (ex Twitter) — icono actualizado -->
                  <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-secondary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <!-- Instagram -->
                  <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-secondary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </a>
                  <!-- WhatsApp -->
                  <a href="#" class="hover:text-secondary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                      <path d="M17.49 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
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

  censosMenu = [
    { label: 'Características del censo',     route: '/aspectos-generales' },
    { label: 'Innovaciones censales',     route: '/innovaciones' },
    { label: 'Etapas censales',           route: '/organizacion' },
    { label: 'Normatividad censal',              route: '/normativa' },
    { label: 'Documentación Técnica',  route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }

  toggleCensos(event: Event) {
    event.stopPropagation();
    this.censosOpen.update(v => !v);
  }

  // ★ Valores estáticos — se eliminó el efecto contador animado
  readonly poblacionCensada   = 36_480_432;
  readonly poblacionMasculina = 18_480_432;
  readonly poblacionFemenina  = 13_480_432;

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
    }
  }

  formatNumber(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  }

  toggleSearch() {
    this.searchOpen.update(v => !v);
  }
}