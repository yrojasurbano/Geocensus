import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MenuCard {
  title: string;
  description: string;
  iconKey: string;
  action: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  template: `
    <aside class="w-full lg:w-80 bg-[#f1f6ff] flex flex-col h-full border-r border-blue-100/50">
      
      <!-- Contenedor de Tarjetas -->
      <div class="p-4 space-y-4 overflow-y-auto custom-scrollbar h-full">
        
        @for (item of menuItems; track item.title) {
          <div class="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-200 flex items-center gap-4 select-none relative overflow-hidden">
            
            <!-- Decoración Hover -->
            <div class="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

            <!-- Icono Circular -->
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-[#f1f6ff] group-hover:bg-blue-100 transition-colors flex items-center justify-center text-[#009FE3]">
              <!-- Switch de Iconos para evitar problemas de sanitización con innerHTML -->
              @switch (item.iconKey) {
                @case ('chart') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                }
                @case ('map') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                }
                @case ('building') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                }
                @case ('globe') {
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                }
                @case ('download') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                }
              }
            </div>

            <!-- Contenido -->
            <div class="flex-1 min-w-0 z-10">
              <h3 class="font-bold text-gray-800 text-sm leading-tight group-hover:text-[#009FE3] transition-colors mb-1">
                {{ item.title }}
              </h3>
              <p class="text-[10px] text-gray-500 leading-snug line-clamp-2">
                {{ item.description }}
              </p>
            </div>

            <!-- Flecha -->
            <div class="flex-shrink-0 text-gray-300 group-hover:text-[#009FE3] transition-colors transform group-hover:translate-x-1 duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>

          </div>
        }

      </div>
    </aside>
  `
})
export class SidebarComponent {
  
  menuItems: MenuCard[] = [
    {
      title: 'Dashboard de indicadores',
      description: 'Consulta los principales resultados del censo 2025. Mediante indicadores.',
      iconKey: 'chart',
      action: 'dashboard'
    },
    {
      title: 'Dashboard Geográfico',
      description: 'Visualiza los principales indicadores de resultados del censo 2025. Mediante indicadores.',
      iconKey: 'map',
      action: 'geo-dashboard'
    },
    {
      title: 'Visualizador manzanas',
      description: 'Visualiza los principales indicadores de resultados del censo 2025. Mediante indicadores.',
      iconKey: 'building',
      action: 'manzanas'
    },
    {
      title: 'Redatam web',
      description: 'Visualiza los principales indicadores de resultados del censo 2025. Mediante indicadores.',
      iconKey: 'globe',
      action: 'redatam'
    },
    {
      title: 'Descargar síntesis',
      description: 'Visualiza los principales indicadores de resultados del censo 2025. Mediante indicadores.',
      iconKey: 'download',
      action: 'download'
    }
  ];
}