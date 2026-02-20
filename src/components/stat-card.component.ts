/**
 * stat-card.component.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Ejemplo de Card estadístico reutilizable con micro-gráfico ngx-charts.
 *
 * USO:
 *   <app-stat-card
 *     title="Densidad Poblacional"
 *     value="27.7"
 *     unit="hab/km²"
 *     subtitle="Superficie: 1,285,215 km²"
 *     accentColor="#F59E0B"
 *     [chartData]="densityBarData()"
 *     [colorScheme]="amberColorScheme">
 *   </app-stat-card>
 *
 * REGLA DE DISEÑO:
 *   • Todos los cards tienen la misma altura fija (h-[188px]).
 *   • El gráfico ocupa el espacio inferior restante con [view]="[0, 70]"
 *     para que no desborde ni quede vacío.
 *   • Proporcionalidad: usar en un grid con columnas equitativas, p.ej.:
 *       <div class="grid grid-cols-2 gap-3"> ... </div>
 * ──────────────────────────────────────────────────────────────────────────
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ngx-charts — NgxChartsModule incluye todos los gráficos
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos re-exportados para uso externo
// ─────────────────────────────────────────────────────────────────────────────
export interface StatCardDataPoint {
  name: string;
  value: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100
             hover:shadow-md transition-shadow duration-200
             flex flex-col h-[188px] p-4 overflow-hidden"
      [style.borderLeftColor]="accentColor()"
      style="border-left-width: 3px; border-left-style: solid;">

      <!-- ── Cabecera ─────────────────────────────────────────────── -->
      <div class="flex items-start justify-between mb-2 flex-shrink-0">
        <div class="flex items-center gap-2">
          <!-- Icono dinámico (slot SVG) -->
          <div class="p-1.5 rounded-lg" [style.backgroundColor]="iconBgColor()">
            <ng-content select="[slot=icon]"></ng-content>
          </div>
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider leading-tight">
            {{ title() }}
          </span>
        </div>
        <!-- Badge de variación interanual -->
        @if (trend() !== null) {
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                [class]="trend()! >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-500'">
            {{ trend()! >= 0 ? '▲' : '▼' }} {{ trend()! | number:'1.1-1' }}%
          </span>
        }
      </div>

      <!-- ── Valor principal ───────────────────────────────────────── -->
      <div class="flex items-end gap-1 flex-shrink-0 mb-0.5">
        <span class="text-3xl font-black leading-none" [style.color]="accentColor()">
          {{ value() }}
        </span>
        @if (unit()) {
          <span class="text-xs text-gray-400 font-bold mb-0.5">{{ unit() }}</span>
        }
      </div>

      <!-- ── Subtítulo ─────────────────────────────────────────────── -->
      @if (subtitle()) {
        <p class="text-[10px] text-gray-400 font-medium flex-shrink-0 mb-2">{{ subtitle() }}</p>
      }

      <!-- ── Micro-gráfico ngx-charts (ocupa el resto del espacio) ── -->
      <div class="flex-1 min-h-0 w-full">
        <ngx-charts-bar-vertical
          [results]="chartData()"
          [view]="chartView()"
          [scheme]="resolvedColorScheme()"
          [showXAxisLabel]="false"
          [showYAxisLabel]="false"
          [xAxis]="showXAxis()"
          [yAxis]="false"
          [roundEdges]="true"
          [animations]="true"
          [barPadding]="4"
          [gradient]="false"
          [tooltipDisabled]="false"
          class="block w-full">
        </ngx-charts-bar-vertical>
      </div>
    </div>
  `,
})
export class StatCardComponent {
  // ── Inputs (Angular 19 signal-based inputs) ────────────────────────────────
  title       = input.required<string>();
  value       = input.required<string | number>();
  unit        = input<string>('');
  subtitle    = input<string>('');
  accentColor = input<string>('#0057A4');
  chartData   = input.required<StatCardDataPoint[]>();
  colorScheme = input<Color | null>(null);
  showXAxis   = input<boolean>(true);
  trend       = input<number | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────

  /** Color de fondo del icono derivado del accentColor con opacidad 10% */
  iconBgColor = computed(() => this.accentColor() + '1A'); // hex + alpha 10%

  /**
   * Vista del gráfico: ancho 0 para que ngx-charts tome el 100% del contenedor
   * con CSS; alto fijo en px para que no rebase el card.
   */
  chartView = computed<[number, number]>(() => [0, 70]);

  /** Si no se pasa colorScheme, construye uno por defecto con el accentColor */
  resolvedColorScheme = computed<Color>(() => {
    return this.colorScheme() ?? {
      name: 'auto',
      selectable: false,
      group: ScaleType.Ordinal,
      domain: [this.accentColor()],
    };
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// EJEMPLO DE USO EN EL COMPONENTE PADRE (fragmento de dashboard)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * En app.component.ts (o el componente de dashboard):
 *
 * import { StatCardComponent, StatCardDataPoint } from './components/stat-card.component';
 * import { Color, ScaleType } from '@swimlane/ngx-charts';
 *
 * amberScheme: Color = {
 *   name: 'amber', selectable: false, group: ScaleType.Ordinal,
 *   domain: ['#F59E0B'],
 * };
 *
 * densityData: StatCardDataPoint[] = [
 *   { name: 'Costa',    value: 136.2 },
 *   { name: 'Sierra',   value:  22.4 },
 *   { name: 'Selva',    value:   3.8 },
 *   { name: 'Nacional', value:  27.7 },
 * ];
 *
 * En el template:
 *
 * <div class="grid grid-cols-2 gap-3">
 *   <app-stat-card
 *     title="Densidad Pob. Total"
 *     value="27.7"
 *     unit="hab/km²"
 *     subtitle="Superficie: 1,285,215 km²"
 *     accentColor="#F59E0B"
 *     [chartData]="densityData"
 *     [colorScheme]="amberScheme"
 *     [trend]="3.4">
 *     <!-- Icono proyectado al slot -->
 *     <svg slot="icon" xmlns="http://www.w3.org/2000/svg"
 *          class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 *       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
 *             d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0
 *                l-4.244-4.243a8 8 0 1111.314 0z" />
 *       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
 *             d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
 *     </svg>
 *   </app-stat-card>
 * </div>
 */