import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentStat } from '../services/census.service';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg p-4 h-full flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h4 class="font-bold text-gray-800 text-sm">Resultados por Departamento</h4>
          <p class="text-[10px] text-gray-400">Análisis demográfico poblacional absoluto y porcentual.</p>
        </div>
        <div class="flex gap-2">
            <input type="text" placeholder="Buscar departamento..." class="bg-gray-100 text-xs px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-400 w-32">
            <button class="bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-50">Filtrar</button>
            <button class="bg-[#C2264B] text-white px-2 py-1 rounded text-xs hover:bg-[#A01E3C]">Exportar</button>
        </div>
      </div>

      <div class="overflow-auto flex-1 max-h-[400px]">
        <table class="w-full text-[10px] text-left border-collapse">
          <thead class="bg-[#C2264B] text-white sticky top-0 z-10">
            <tr>
              <th class="p-2 font-semibold w-10">UBIGEO</th>
              <th class="p-2 font-semibold">DEPARTAMENTOS</th>
              <th class="p-2 font-semibold text-right" colspan="2">ABSOLUTO</th>
              <th class="p-2 font-semibold text-right" colspan="2">PORCENTUAL</th>
            </tr>
            <tr class="bg-[#A01E3C]">
                <th class="p-1"></th>
                <th class="p-1"></th>
                <th class="p-1 text-right">HOMBRES</th>
                <th class="p-1 text-right">MUJERES</th>
                <th class="p-1 text-right">HOMBRES</th>
                <th class="p-1 text-right">MUJERES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (row of data(); track row.id) {
              <tr class="hover:bg-rose-50 transition-colors">
                <td class="p-2 text-gray-500 bg-gray-50 font-mono">{{ row.id }}</td>
                <td class="p-2 font-medium text-gray-700">{{ row.name }}</td>
                <td class="p-2 text-right text-gray-600">{{ row.maleCount | number }}</td>
                <td class="p-2 text-right text-gray-600">{{ row.femaleCount | number }}</td>
                <td class="p-2 text-right text-blue-500 font-medium">{{ row.malePerc | percent:'1.4-4' }}</td>
                <td class="p-2 text-right text-rose-500 font-medium">{{ row.femalePerc | percent:'1.4-4' }}</td>
              </tr>
            }
          </tbody>
          <tfoot class="bg-gray-50 sticky bottom-0 font-bold text-gray-700 border-t border-gray-200 text-[10px]">
             <tr>
                <td colspan="2" class="p-2 text-right">TOTAL NACIONAL</td>
                <td class="p-2 text-right text-[#C2264B]">4,114,118</td>
                <td class="p-2 text-right text-[#C2264B]">3,998,662</td>
                <td class="p-2 text-right">100.00</td>
                <td class="p-2 text-right">100.00</td>
             </tr>
          </tfoot>
        </table>
      </div>
      <div class="mt-2 text-[9px] text-gray-400 flex justify-between items-center">
        <span>Mostrando 25 de 25 departamentos</span>
        <div class="flex gap-1">
            <button class="px-2 py-0.5 border rounded hover:bg-gray-100"><</button>
            <button class="px-2 py-0.5 border rounded hover:bg-gray-100">></button>
        </div>
      </div>
    </div>
  `
})
export class DataTableComponent {
  data = input.required<DepartmentStat[]>();
}
