import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#EEEEEE]">
      
      <!-- Top Section: Hero Image & Main Content (Flex Grow) -->
      <div class="relative flex-1 flex flex-col min-h-0">
        <!-- Background Image -->
        <div class="absolute inset-0 z-0">
          <img 
            ngSrc="https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?q=80&w=2070&auto=format&fit=crop" 
            alt="Biplano Blanco"
            fill
            priority
            class="object-cover w-full h-full"
          />
          <div class="absolute inset-0 bg-black/40"></div>
        </div>

        <!-- Header -->
        <header class="relative z-20 flex justify-between items-start px-6 py-3 md:px-12 md:py-4 text-white w-full shrink-0">
          <div class="flex items-center gap-8 mt-1">
            <!-- Logo Institucional -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xl shadow-lg">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="flex flex-col leading-none">
                <span class="font-bold text-lg tracking-wider hidden sm:block">INEI</span>
                <span class="text-[9px] tracking-widest hidden sm:block opacity-80">INSTITUTO NACIONAL</span>
              </div>
            </div>

            <!-- Nav Group -->
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide ml-8">
              <button class="hover:text-secondary transition-colors duration-300 uppercase relative group">
                Inicio
                <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
              </button>
              <button routerLink="/resultados" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
                Resultados
                <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
              </button>
              <button routerLink="/noticias" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
                Noticias
                <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
              </button>
              
              <!-- Search -->
              <div class="flex items-center relative h-8">
                <div 
                  class="overflow-hidden transition-all duration-500 ease-in-out flex items-center"
                  [style.width]="searchOpen() ? '180px' : '0px'"
                  [style.opacity]="searchOpen() ? '1' : '0'"
                >
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    class="w-full bg-white/10 border border-white/30 rounded-full px-3 py-1 text-xs text-white placeholder-white/60 focus:outline-none focus:bg-white/20 backdrop-blur-sm"
                  >
                </div>
                <button 
                  (click)="toggleSearch()"
                  class="hover:text-secondary transition-colors duration-300 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 ml-1"
                >
                  <mat-icon class="text-lg">search</mat-icon>
                </button>
              </div>
            </nav>
          </div>

          <!-- Logo Censo Container (Right Side) -->
          <div class="absolute right-0 top-4 h-16 pl-8 pr-6 bg-white rounded-l-[50px] flex items-center justify-center shadow-2xl z-30 hidden md:flex">
            <div class="flex items-center gap-2">
              <div class="text-right leading-tight">
                <div class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Censos Nacionales</div>
                <div class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">2025</div>
              </div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg">
                 <mat-icon class="text-lg">analytics</mat-icon>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Hero Content -->
        <div class="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24">
          <div class="max-w-5xl animate-fade-in-up relative">
            
            <!-- Decorative Circles -->
            <div class="absolute -top-20 -left-20 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-20 blur-3xl -z-10"></div>
            
            <!-- Concentric Circles behind text -->
            <div class="absolute top-20 left-[340px] transform -translate-x-1/2 -translate-y-1/2 -z-10">
               <!-- Circle 2 (Outer) - 85% transparency (opacity-15) -->
               <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-15"></div>
               <!-- Circle 1 (Inner) - 0% transparency (opacity-100) -->
               <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-100"></div>
            </div>

            <!-- White line above CENSOS -->
            <div class="w-16 h-1 bg-white mb-3 ml-1"></div>

            <h1 class="text-4xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-xl relative z-10">
              CENSOS <br/>
              NACIONALES 
              <span class="text-white inline-flex items-center gap-2">
                2025
                <div class="w-3 h-3 bg-secondary rounded-sm"></div>
              </span>
            </h1>
            
            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 relative z-10">
              <button 
                routerLink="/resultados"
                class="bg-gradient-to-br from-primary to-secondary hover:brightness-110 text-white font-bold py-3 px-8 rounded-[30px] shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-base tracking-wide"
              >
                <mat-icon>bar_chart</mat-icon>
                RESULTADOS
              </button>
              <button class="bg-transparent border-2 border-white hover:bg-white hover:text-primary text-white font-bold py-3 px-8 rounded-[30px] transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm text-base tracking-wide">
                <mat-icon>description</mat-icon>
                DOCUMENTACIÓN
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Gradient Separator -->
      <div class="w-full h-[10px] bg-gradient-to-r from-primary to-secondary z-20 shrink-0"></div>

      <!-- Bottom Section: Cards & Footer (Shrink-0) -->
      <div class="bg-[#EEEEEE] flex flex-col z-20 shrink-0">
        
        <!-- Quick Access Cards -->
        <div class="px-6 md:px-12 lg:px-24 py-6">
          <div class="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 justify-items-center">
            
            <!-- Card 1 -->
            <div class="flex flex-col items-center gap-3 group cursor-pointer w-full">
              <div class="bg-white rounded-2xl w-32 h-32 md:w-36 md:h-36 flex items-center justify-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                <mat-icon class="!text-[5.5rem] !w-[5.5rem] !h-[5.5rem] bg-[linear-gradient(45deg,#0056a1,#33b3a9)] bg-clip-text text-transparent flex items-center justify-center">dashboard</mat-icon>
              </div>
              <span class="text-center font-bold text-gray-800 text-sm leading-tight group-hover:text-primary transition-colors">Dashboard e<br>indicadores</span>
            </div>

            <!-- Card 2 (Download) -->
            <div class="flex flex-col items-center gap-3 group cursor-pointer w-full">
              <div class="bg-white rounded-2xl w-32 h-32 md:w-36 md:h-36 flex items-center justify-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                <mat-icon class="!text-[5.5rem] !w-[5.5rem] !h-[5.5rem] bg-[linear-gradient(45deg,#0056a1,#33b3a9)] bg-clip-text text-transparent flex items-center justify-center">file_download</mat-icon>
              </div>
              <span class="text-center font-bold text-gray-800 text-sm leading-tight group-hover:text-primary transition-colors">Descargar síntesis<br>de resultados</span>
            </div>

            <!-- Card 3 (FAQ) -->
            <div class="flex flex-col items-center gap-3 group cursor-pointer w-full">
              <div class="bg-white rounded-2xl w-32 h-32 md:w-36 md:h-36 flex items-center justify-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                <mat-icon class="!text-[5.5rem] !w-[5.5rem] !h-[5.5rem] bg-[linear-gradient(45deg,#0056a1,#33b3a9)] bg-clip-text text-transparent flex items-center justify-center">help_outline</mat-icon>
              </div>
              <span class="text-center font-bold text-gray-800 text-sm leading-tight group-hover:text-primary transition-colors">Preguntas<br>frecuentes</span>
            </div>

          </div>
        </div>

        <!-- Institutional Footer -->
        <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24">
          <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-6 w-full">
            
            <!-- Right: Info -->
            <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
              <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
              <p class="text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
              <div class="flex items-center justify-center md:justify-end gap-4 mt-2">
                <span class="text-sm text-gray-300">Síguenos:</span>
                <div class="flex gap-3">
                  <a href="#" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                  <a href="#" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
                  <a href="#" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
                  <a href="#" class="hover:text-secondary transition-colors">
                    <!-- WhatsApp Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /> 
                      <!-- Simplified WhatsApp-like path or use standard path -->
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
    :host {
      display: block;
    }
    .animate-fade-in-up {
      animation: fadeInUp 1s ease-out forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class HeroComponent {
  searchOpen = signal(false);

  toggleSearch() {
    this.searchOpen.update(v => !v);
  }
}
