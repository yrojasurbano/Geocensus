import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CensusService } from '../services/census.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule],
  template: `
    <aside class="w-80 bg-[#C2264B] text-white flex flex-col h-full shadow-2xl z-20">
      <!-- Title -->
      <div class="p-6 border-b border-rose-800">
        <h2 class="text-2xl font-bold leading-tight">¿Cuántos somos?</h2>
        <p class="text-xs text-rose-200 mt-2 leading-relaxed">
          Resultados definitivos de la población censada. Información detallada sobre crecimiento, estructura por edad y sexo, y distribución geográfica.
        </p>
      </div>

      <!-- Menu Items -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="mt-4 px-4 space-y-2">
          <div class="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-2 px-2">Tema:</div>
          
          <!-- Menu Item: Info General -->
          <div class="rounded-lg overflow-hidden transition-all duration-300"
               [class.bg-white]="activeMenu() === 'general'"
               [class.text-[#C2264B]]="activeMenu() === 'general'"
               [class.text-white]="activeMenu() !== 'general'">
            
            <div (click)="toggleMenu('general')" 
                 class="p-3 font-semibold flex justify-between items-center cursor-pointer hover:bg-rose-800/50 transition-colors"
                 [class.hover:bg-rose-100]="activeMenu() === 'general'">
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Información General</span>
              </div>
              <span class="text-xl font-bold">{{ activeMenu() === 'general' ? '-' : '+' }}</span>
            </div>

            @if (activeMenu() === 'general') {
              <div class="bg-rose-50 px-4 py-2 text-sm text-gray-600 space-y-2 border-t border-rose-100">
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Resumen Ejecutivo
                  </p>
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2">
                     <span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Metodología
                  </p>
              </div>
            }
          </div>

          <!-- Menu Item: Poblacion -->
          <div class="rounded-lg overflow-hidden transition-all duration-300"
               [class.bg-white]="activeMenu() === 'poblacion'"
               [class.text-[#C2264B]]="activeMenu() === 'poblacion'"
               [class.text-white]="activeMenu() !== 'poblacion'">
            
            <div (click)="toggleMenu('poblacion')" 
                 class="p-3 font-semibold flex justify-between items-center cursor-pointer hover:bg-rose-800/50 transition-colors"
                 [class.hover:bg-rose-100]="activeMenu() === 'poblacion'">
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Población</span>
              </div>
              <span class="text-xl font-bold">{{ activeMenu() === 'poblacion' ? '-' : '+' }}</span>
            </div>

            @if (activeMenu() === 'poblacion') {
              <div class="bg-rose-50 px-4 py-2 text-sm text-gray-600 space-y-2 border-t border-rose-100">
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Población Total</p>
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Por Sexo</p>
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Por Edad (Quinquenal)</p>
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Area Urbana/Rural</p>
              </div>
            }
          </div>

           <!-- Menu Item: Indices -->
          <div class="rounded-lg overflow-hidden transition-all duration-300"
               [class.bg-white]="activeMenu() === 'indices'"
               [class.text-[#C2264B]]="activeMenu() === 'indices'"
               [class.text-white]="activeMenu() !== 'indices'">
            
            <div (click)="toggleMenu('indices')" 
                 class="p-3 font-semibold flex justify-between items-center cursor-pointer hover:bg-rose-800/50 transition-colors"
                 [class.hover:bg-rose-100]="activeMenu() === 'indices'">
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Índices Demográficos</span>
              </div>
              <span class="text-xl font-bold">{{ activeMenu() === 'indices' ? '-' : '+' }}</span>
            </div>

            @if (activeMenu() === 'indices') {
              <div class="bg-rose-50 px-4 py-2 text-sm text-gray-600 space-y-2 border-t border-rose-100">
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Edad Media</p>
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Razón de Dependencia</p>
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Índice de Masculinidad</p>
              </div>
            }
          </div>

          <!-- Menu Item: Alfabetismo -->
          <div class="rounded-lg overflow-hidden transition-all duration-300"
               [class.bg-white]="activeMenu() === 'alfabetismo'"
               [class.text-[#C2264B]]="activeMenu() === 'alfabetismo'"
               [class.text-white]="activeMenu() !== 'alfabetismo'">
            
            <div (click)="toggleMenu('alfabetismo')" 
                 class="p-3 font-semibold flex justify-between items-center cursor-pointer hover:bg-rose-800/50 transition-colors"
                 [class.hover:bg-rose-100]="activeMenu() === 'alfabetismo'">
              <div class="flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                 </svg>
                <span>Alfabetismo</span>
              </div>
              <span class="text-xl font-bold">{{ activeMenu() === 'alfabetismo' ? '-' : '+' }}</span>
            </div>

            @if (activeMenu() === 'alfabetismo') {
              <div class="bg-rose-50 px-4 py-2 text-sm text-gray-600 space-y-2 border-t border-rose-100">
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Tasa de Alfabetización</p>
                  <p class="cursor-pointer hover:text-[#C2264B] flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C2264B]"></span> Años promedio de estudio</p>
              </div>
            }
          </div>
        </div>

        <!-- Filters -->
        <div class="mt-8 px-6">
          <div class="flex items-center gap-2 text-xs font-semibold text-rose-300 uppercase tracking-wider mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros Geográficos - Ubigeo
          </div>

          <div class="space-y-4">
            <div class="group">
              <label class="text-[10px] text-rose-200 font-bold uppercase mb-1 block">Departamento</label>
              <div class="relative">
                <select 
                  [ngModel]="census.selectedDepartment()" 
                  (ngModelChange)="census.updateDepartment($event)"
                  class="w-full bg-[#9E1F3D] text-white text-sm rounded-lg p-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer shadow-inner">
                  @for (dept of census.departmentOptions(); track dept.id) {
                    <option [value]="dept.id">{{ dept.name }}</option>
                  }
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div class="group">
              <label class="text-[10px] text-rose-200 font-bold uppercase mb-1 block">Provincia</label>
              <div class="relative">
                <select 
                  [ngModel]="census.selectedProvince()"
                  (ngModelChange)="census.updateProvince($event)"
                  [disabled]="census.selectedDepartment() === '00'"
                  [class.opacity-50]="census.selectedDepartment() === '00'"
                  class="w-full bg-[#9E1F3D] text-white text-sm rounded-lg p-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer shadow-inner">
                  @for (prov of census.provinceOptions(); track prov.id) {
                    <option [value]="prov.id">{{ prov.name }}</option>
                  }
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div class="group">
              <label class="text-[10px] text-rose-200 font-bold uppercase mb-1 block">Distrito</label>
              <div class="relative">
                <select 
                  [ngModel]="census.selectedDistrict()"
                  (ngModelChange)="census.updateDistrict($event)"
                  [disabled]="census.selectedProvince() === '00'"
                  [class.opacity-50]="census.selectedProvince() === '00'"
                  class="w-full bg-[#9E1F3D] text-white text-sm rounded-lg p-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer shadow-inner">
                  @for (dist of census.districtOptions(); track dist.id) {
                    <option [value]="dist.id">{{ dist.name }}</option>
                  }
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Help -->
      <div class="p-6 border-t border-rose-800">
        <a href="#" class="flex items-center gap-2 text-xs text-rose-200 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ¿Necesitas ayuda con los datos?
        </a>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  census = inject(CensusService);
  activeMenu = signal<string | null>('general');

  toggleMenu(menuName: string) {
    this.activeMenu.update(current => current === menuName ? null : menuName);
  }
}