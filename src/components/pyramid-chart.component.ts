import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgeGroup } from '../services/census.service';

@Component({
  selector: 'app-pyramid-chart',
  imports: [CommonModule],
  template: `
    <div class="w-full bg-white rounded-lg p-5 flex flex-col h-full">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="text-xl font-bold text-gray-800">Total Nacional | <span class="text-[#C2264B]">Distribución de la población por sexo y Edad</span></h3>
          <p class="text-gray-500 mt-1 font-medium">Pirámide Poblacional</p>
        </div>
        <button class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      <!-- Legend Header (Moved from bottom to top to avoid overlap with bars) -->
      <div class="flex justify-between items-center mb-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
         <div class="flex flex-col items-start">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-[#5A9CF8] rounded-sm"></div>
                <span class="text-xs font-bold text-gray-600">HOMBRES</span>
            </div>
            <span class="text-2xl font-black text-[#5A9CF8] ml-5">48.8%</span>
         </div>
         <p class="text-[10px] text-gray-400 font-mono">Estructura demográfica 2025</p>
         <div class="flex flex-col items-end">
            <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-gray-600">MUJERES</span>
                <div class="w-3 h-3 bg-[#D45D79] rounded-sm"></div>
            </div>
            <span class="text-2xl font-black text-[#D45D79] mr-5">51.2%</span>
         </div>
      </div>

      <div class="w-full relative flex-1 min-h-[350px] flex items-end pb-2">
        <!-- Chart Grid -->
        <div class="w-full h-full flex flex-col justify-end gap-[2px]">
          @for (group of data(); track group.ageRange) {
            <div class="grid grid-cols-[1fr_40px_1fr] items-center gap-4 group hover:bg-gray-50 rounded transition-colors py-[1px]">
              <!-- Male Bar (Right to Left) -->
              <div class="flex justify-end h-3 relative w-full items-center">
                 <span class="mr-2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{{ group.male }}%</span>
                 <div class="h-full bg-[#5A9CF8] rounded-l-sm transition-all duration-500 hover:brightness-90" [style.width.%]="(group.male / maxVal()) * 100"></div>
              </div>
              
              <!-- Label -->
              <div class="text-[10px] text-center text-gray-400 font-mono font-medium">{{ group.ageRange }}</div>

              <!-- Female Bar (Left to Right) -->
              <div class="flex justify-start h-3 relative w-full items-center">
                 <div class="h-full bg-[#D45D79] rounded-r-sm transition-all duration-500 hover:brightness-90" [style.width.%]="(group.female / maxVal()) * 100"></div>
                 <span class="ml-2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{{ group.female }}%</span>
              </div>
            </div>
          }
        </div>
        
        <!-- Center Axis Line -->
        <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 transform -translate-x-1/2 -z-10"></div>
      </div>
    </div>
  `
})
export class PyramidChartComponent {
  data = input.required<AgeGroup[]>();
  
  maxVal = computed(() => {
    // Find max value to normalize bars
    let max = 0;
    this.data().forEach(d => {
      if (d.male > max) max = d.male;
      if (d.female > max) max = d.female;
    });
    return max * 1.1; // Add 10% buffer
  });
}