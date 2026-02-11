import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  template: `
    <header class="bg-[#C2264B] text-white flex flex-col">
      <!-- Top Bar -->
      <div class="flex justify-between items-center px-6 py-2 border-b border-rose-800">
        <div class="flex items-center gap-4">
           <!-- Mock INEI Logo -->
           <div class="flex flex-col items-center leading-none">
              <div class="flex gap-0.5">
                  <div class="w-2 h-4 bg-blue-400"></div>
                  <div class="w-2 h-3 bg-blue-300 self-end"></div>
                  <div class="w-2 h-5 bg-blue-500"></div>
              </div>
              <span class="font-black text-2xl tracking-tighter mt-1">INEI</span>
              <span class="text-[5px] uppercase tracking-widest text-rose-200">Instituto Nacional de Estadística</span>
           </div>
        </div>

        <h1 class="text-xl font-bold uppercase tracking-wide hidden md:block">Sistema de Consulta de Resultados Preliminares para los Censos Nacionales 2025</h1>

        <div class="flex items-center gap-3 text-right">
            <div>
                <div class="text-[10px] text-rose-200 uppercase font-bold">INEI</div>
                <div class="text-xs font-mono">1.256.456 Visitantes</div>
            </div>
            <div class="bg-rose-800 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <!--<div class="bg-white text-gray-500 shadow-sm z-10">
          <div class="container mx-auto max-w-7xl flex justify-center gap-12">
            <button class="py-3 px-4 border-b-4 border-[#C2264B] text-[#C2264B] font-bold text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                ¿QUIÉNES SOMOS?
            </button>
            <button class="py-3 px-4 hover:bg-gray-50 font-medium text-sm flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ¿DÓNDE VIVIMOS?
            </button>
            <button class="py-3 px-4 hover:bg-gray-50 font-medium text-sm flex items-center gap-2 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                 </svg>
                ¿CÓMO VIVIMOS?
            </button>
          </div>
      </div> -->
    </header>
  `
})
export class HeaderComponent {}
