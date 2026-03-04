import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen w-full flex flex-col overflow-hidden">
      
      <!-- Replicated Header -->
      <header class="absolute top-0 left-0 right-0 z-50 flex justify-between items-start px-6 py-3 md:px-12 md:py-4 text-[#343b9f] w-full">
        <div class="flex items-center gap-8 mt-1">
          <div class="flex items-center gap-3">            
            <div class="flex items-center">
              <img 
                ngSrc="logo_inei_azul.png" 
                alt="Logo INEI" 
                width="180" 
                height="50"
                priority
                class="h-16 md:h-18 w-auto object-contain drop-shadow-md"
              >
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide ml-8">
            <button routerLink="/" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Inicio
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/resultados" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Resultados
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink=" " class="hover:text-secondary transition-colors duration-300 uppercase relative group">
              Censos 2025
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/noticias" class="text-secondary transition-colors duration-300 uppercase relative group">
              Noticias
              <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-secondary transition-all"></span>
            </button>
          </nav>
        </div>

        <div class="absolute right-0 top-4 h-16 pl-8 pr-6 bg-white rounded-l-[50px] flex items-center justify-center shadow-2xl z-30 hidden md:flex">
          <div>
            <div class="flex items-center">
              <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45" class="h-10 w-auto object-contain">
            </div>
          </div>
        </div>
      </header>

      <!-- Section 1: News Carousel -->
      <section class="min-h-[50vh] bg-[#EEEEEE] pt-20 pb-8 px-6 md:px-12 lg:px-24 flex flex-col relative group/news">
        <div class="flex justify-center items-center mb-6">
          <h2 class="text-2xl md:text-3xl font-black text-[#038dd3] uppercase tracking-tight">NOTICIAS</h2>
        </div>

        <div class="flex-1 relative px-0 md:px-12">
          <!-- Navigation Arrows (Hidden on mobile) -->
          <button class="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-gray-300 items-center justify-center hover:bg-white transition-colors z-10">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button class="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-gray-300 items-center justify-center hover:bg-white transition-colors z-10">
            <mat-icon>chevron_right</mat-icon>
          </button>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 md:pb-0">
            @for (item of newsItems; track item.id) {
              <div class="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow h-full min-h-[280px]">
                <div class="relative h-48 md:h-32 shrink-0">
                  <img [ngSrc]="item.image" fill class="object-cover" alt="News">
                  <div class="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{{item.tag}}</div>
                </div>
                <div class="p-4 flex flex-col flex-1">
                  <h3 class="font-bold text-sm text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">{{item.title}}</h3>
                  <p class="text-xs text-gray-500 line-clamp-3 md:line-clamp-2">{{item.excerpt}}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Section 2: Video Carousel -->
      <section class="min-h-[50vh] bg-gradient-to-r from-primary to-secondary py-8 px-6 md:px-12 lg:px-24 flex flex-col text-white relative">
        <div class="flex justify-center items-center mb-6 relative z-10">
          <h2 class="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#038dd3] drop-shadow-sm bg-white/80 px-4 py-1 rounded-full">VIDEOS</h2>
        </div>

        <div class="flex-1 relative overflow-hidden px-0 md:px-12 flex items-center justify-center">
          <!-- Navigation Arrows -->
          <button (click)="prevVideo()" class="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors z-20">
            <mat-icon class="text-white">chevron_left</mat-icon>
          </button>
          <button (click)="nextVideo()" class="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors z-20">
            <mat-icon class="text-white">chevron_right</mat-icon>
          </button>

          <div class="w-full max-w-4xl aspect-video relative rounded-2xl overflow-hidden shadow-2xl">
            @if (videoItems[currentVideoIndex()]; as video) {
              <div class="absolute inset-0">
                <img [ngSrc]="video.thumbnail" fill class="object-cover" alt="Video">
                <div class="absolute inset-0 flex items-center justify-center bg-black/20 group cursor-pointer">
                  <div class="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <mat-icon class="text-3xl md:text-4xl">play_arrow</mat-icon>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 class="text-lg md:text-xl font-bold line-clamp-2">{{video.title}}</h3>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NewsComponent {
  currentVideoIndex = signal(0);

  nextVideo() {
    this.currentVideoIndex.update(i => (i + 1) % this.videoItems.length);
  }

  prevVideo() {
    this.currentVideoIndex.update(i => (i - 1 + this.videoItems.length) % this.videoItems.length);
  }

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
      title: 'Resultados preliminares muestran crecimiento demográfico sostenido',
      excerpt: 'El análisis inicial destaca un aumento del 12% en la población urbana.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
      tag: 'Estadística'
    },
    {
      id: 3,
      title: 'Uso de tecnología satelital optimiza la cartografía censal',
      excerpt: 'Nuevas herramientas permiten una precisión sin precedentes en la ubicación de viviendas.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop',
      tag: 'Tecnología'
    }
  ];

  videoItems = [
    {
      id: 1,
      title: '¿Cómo recibir al empadronador?',
      thumbnail: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Importancia de los Censos 2025',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Testimonios: El censo en la selva',
      thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Resumen de la jornada nacional',
      thumbnail: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=2006&auto=format&fit=crop'
    }
  ];
}
