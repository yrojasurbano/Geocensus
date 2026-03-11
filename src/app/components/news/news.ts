import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen w-full flex flex-col overflow-hidden bg-[#EEEEEE]">
      
      <header class="absolute top-0 left-0 right-0 z-50 flex justify-between items-start px-6 py-3 md:px-12 md:py-4 2xl:px-24 2xl:py-8 text-[#343b9f] w-full">
        <div class="flex items-center gap-8 mt-1">
          <div class="flex items-center">
            <img 
              ngSrc="logo_inei_azul.png" 
              alt="Logo INEI" 
              width="240" 
              height="70"
              priority
              class="h-16 md:h-18 2xl:h-24 w-auto object-contain"
            >
          </div>

          <nav class="hidden md:flex items-center gap-6 2xl:gap-12 text-sm 2xl:text-lg font-medium tracking-wide ml-8">
            <button routerLink="/" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Inicio
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/resultados" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Resultados
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>

            <div class="relative">
              <button
                (click)="toggleCensos($event)"
                class="hover:text-secondary transition-colors duration-300 uppercase relative group flex items-center gap-1">
                Censos 2025
                <mat-icon class="!text-base 2xl:!text-xl transition-transform duration-200"
                  [class.rotate-180]="censosOpen()">expand_more</mat-icon>
                <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
              </button>
              @if (censosOpen()) {
                <div class="absolute top-full left-0 mt-3 w-72 2xl:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                  <ul class="py-1">
                    @for (item of censosMenu; track item.label) {
                      <li>
                        <button [routerLink]="item.route" (click)="censosOpen.set(false)" class="w-full text-left px-5 py-3 2xl:px-6 2xl:py-4 text-sm 2xl:text-base font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          {{ item.label }}
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>

            <button routerLink="/noticias" class="text-secondary transition-colors duration-300 uppercase relative group font-bold">
              Noticias
              <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-secondary transition-all"></span>
            </button>
          </nav>
        </div>

        <div class="absolute right-0 top-4 2xl:top-8 h-16 2xl:h-24 pl-8 pr-6 2xl:pr-12 bg-white rounded-l-[50px] flex items-center justify-center shadow-2xl z-30 hidden md:flex">
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="200" height="60" class="h-10 2xl:h-16 w-auto object-contain">
        </div>
      </header>

      <section class="flex-1 flex flex-col justify-center bg-[#EEEEEE] pt-28 2xl:pt-40 pb-8 px-6 md:px-12 lg:px-24 2xl:px-48 overflow-hidden">
        <div class="flex justify-center items-center mb-6 2xl:mb-12 shrink-0">
          <h2 class="text-2xl md:text-3xl 2xl:text-5xl font-black text-[#038dd3] uppercase tracking-tighter">NOTICIAS</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 2xl:gap-12 max-w-[1800px] mx-auto w-full flex-1 min-h-0">
          @for (item of newsItems; track item.id) {
            <div class="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
              <div class="relative h-1/2 shrink-0">
                <img [ngSrc]="item.image" fill class="object-cover transition-transform duration-700 group-hover:scale-110" alt="News">
                <div class="absolute top-4 left-4 bg-primary text-white text-[10px] 2xl:text-xs font-bold px-3 py-1 rounded-full uppercase shadow-lg">{{item.tag}}</div>
              </div>
              <div class="p-4 2xl:p-8 flex flex-col justify-between flex-1 min-h-0">
                <div>
                  <h3 class="font-bold text-base 2xl:text-xl text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-tight">{{item.title}}</h3>
                  <p class="text-xs 2xl:text-base text-gray-500 line-clamp-2 leading-relaxed">{{item.excerpt}}</p>
                </div>
                <div class="pt-2 flex items-center text-primary font-bold text-xs 2xl:text-sm">
                  Leer más <mat-icon class="ml-1 !w-4 !h-4 2xl:!w-6 !h-6 !text-base 2xl:!text-xl">chevron_right</mat-icon>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <section class="flex-1 flex flex-col justify-center bg-gradient-to-br from-primary to-secondary py-8 2xl:py-16 px-6 md:px-12 lg:px-24 2xl:px-48 text-white relative overflow-hidden">
        <div class="flex justify-center items-center mb-6 2xl:mb-10 relative z-10 shrink-0">
          <h2 class="text-2xl md:text-3xl 2xl:text-5xl font-black uppercase text-white tracking-tight flex items-center gap-4">
            <span class="w-12 2xl:w-20 h-1 bg-white/40"></span>
            VIDEOS
            <span class="w-12 2xl:w-20 h-1 bg-white/40"></span>
          </h2>
        </div>

        <div class="relative max-w-[1000px] 2xl:max-w-[1400px] mx-auto w-full flex items-center justify-center flex-1 min-h-0">
          <button (click)="prevVideo()" class="absolute -left-6 2xl:-left-20 top-1/2 -translate-y-1/2 w-10 h-10 2xl:w-16 2xl:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all z-20 shadow-xl border border-white/20">
            <mat-icon class="text-white !text-2xl 2xl:!text-4xl">chevron_left</mat-icon>
          </button>
          
          <div class="w-full h-full max-h-[400px] 2xl:max-h-[600px] relative rounded-[30px] 2xl:rounded-[50px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white/10 aspect-video">
            @if (videoItems[currentVideoIndex()]; as video) {
              <div class="absolute inset-0">
                <img [ngSrc]="video.thumbnail" fill class="object-cover" alt="Video">
                <div class="absolute inset-0 flex items-center justify-center bg-black/30 group cursor-pointer hover:bg-black/10 transition-colors">
                  <div class="w-16 h-16 2xl:w-24 2xl:h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl border border-white/30">
                    <mat-icon class="!text-4xl 2xl:!text-6xl">play_arrow</mat-icon>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-6 2xl:p-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <h3 class="text-lg 2xl:text-3xl font-bold max-w-2xl leading-tight">{{video.title}}</h3>
                </div>
              </div>
            }
          </div>

          <button (click)="nextVideo()" class="absolute -right-6 2xl:-right-20 top-1/2 -translate-y-1/2 w-10 h-10 2xl:w-16 2xl:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all z-20 shadow-xl border border-white/20">
            <mat-icon class="text-white !text-2xl 2xl:!text-4xl">chevron_right</mat-icon>
          </button>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; }
    /* Eliminamos cualquier scroll global del componente */
    :host ::ng-deep body { overflow: hidden; }
  `]
})
export class NewsComponent {
  currentVideoIndex = signal(0);
  censosOpen        = signal(false);

  censosMenu = [
    { label: 'Aspectos Generales',     route: '/aspectos-generales' },
    { label: 'Organización',           route: '/organizacion' },
    { label: 'Normativa',              route: '/normativa' },
    { label: 'Documentación Técnica',  route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }

  toggleCensos(event: Event) {
    event.stopPropagation();
    this.censosOpen.update(v => !v);
  }

  nextVideo() { this.currentVideoIndex.update(i => (i + 1) % this.videoItems.length); }
  prevVideo() { this.currentVideoIndex.update(i => (i - 1 + this.videoItems.length) % this.videoItems.length); }

  newsItems = [
    {
      id: 1,
      title: 'INEI inicia empadronamiento en zonas de difícil acceso',
      excerpt: 'Brigadas especiales se desplazan por vía fluvial para llegar a comunidades nativas.',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop',
      tag: 'Nacional'
    },
    {
      id: 2,
      title: 'Resultados preliminares muestran crecimiento demográfico',
      excerpt: 'El análisis destaca un aumento considerable en la población urbana.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
      tag: 'Estadística'
    },
    {
      id: 3,
      title: 'Uso de tecnología satelital optimiza la cartografía censal',
      excerpt: 'Herramientas GIS permiten precisión sin precedentes en la ubicación.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop',
      tag: 'Tecnología'
    }
  ];

  videoItems = [
    {
      id: 1,
      title: '¿Cómo recibir al empadronador de forma segura?',
      thumbnail: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'La importancia de los Censos 2025 para el futuro del país',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'
    }
  ];
}