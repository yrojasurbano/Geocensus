/**
 * stat-card.component.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Card estadístico reutilizable con micro-gráfico de barras via ngx-echarts.
 *
 * CORRECCIONES v2:
 *  ✔ Eliminado @swimlane/ngx-echarts (paquete inexistente / incorrecto).
 *  ✔ Eliminado NgxChartsModule / ngx-charts-bar-vertical (librería diferente).
 *  ✔ Reemplazado por NgxEchartsDirective + EChartsOption (ngx-echarts).
 *  ✔ La directiva [echarts] toma el tamaño del contenedor CSS; no necesita [view].
 *
 * USO:
 *   <app-stat-card
 *     title="Densidad Poblacional"
 *     value="27.7"
 *     unit="hab/km²"
 *     subtitle="Superficie: 1,285,215 km²"
 *     accentColor="#F59E0B"
 *     [chartData]="densityBarData()"
 *     [trend]="3.4">
 *   </app-stat-card>
 *
 * REGLA DE DISEÑO:
 *   • Todos los cards tienen la misma altura fija (h-[188px]).
 *   • El gráfico ocupa el espacio inferior restante.
 *   • Usar en grid con columnas equitativas, p.ej.:
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

// ── ngx-echarts ─────────────────────────────────────────────────────────────
// Solo se importa la DIRECTIVA standalone.
// El motor ECharts se registra globalmente en app.config.ts con
// importProvidersFrom(NgxEchartsModule.forRoot({ echarts })).
// ─────────────────────────────────────────────────────────────────────────────
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption }   from 'echarts';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos re-exportados para uso externo
// ─────────────────────────────────────────────────────────────────────────────
export interface StatCardDataPoint {
  name:  string;
  value: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgxEchartsDirective,  // ← directiva [echarts] para usar en el template
  ],
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
          <!-- Icono dinámico (content projection) -->
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

      <!-- ── Micro-gráfico ECharts (ocupa el resto del espacio) ─────── -->
      <!-- style height necesario: ngx-echarts necesita altura explícita en el host -->
      <div class="flex-1 min-h-0 w-full" style="min-height: 60px;">
        <div echarts
             [options]="chartOptions()"
             [theme]="''"
             [autoResize]="true"
             style="width: 100%; height: 100%;">
        </div>
      </div>
    </div>
  `,
})
export class StatCardComponent {

  // ── Inputs (Angular signal-based inputs) ───────────────────────────────────
  title       = input.required<string>();
  value       = input.required<string | number>();
  unit        = input<string>('');
  subtitle    = input<string>('');
  accentColor = input<string>('#0057A4');
  chartData   = input.required<StatCardDataPoint[]>();
  showXAxis   = input<boolean>(true);
  trend       = input<number | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────

  /** Color de fondo del icono: accentColor + alpha 10% en hex */
  iconBgColor = computed(() => this.accentColor() + '1A');

  /**
   * Opciones ECharts para el micro-gráfico de barras.
   * Se recalculan automáticamente cuando cambian chartData o accentColor.
   */
  chartOptions = computed<EChartsOption>(() => {
    const data    = this.chartData();
    const color   = this.accentColor();
    const showX   = this.showXAxis();

    return {
      animation: true,
      animationDuration: 600,
      grid: {
        left:          0,
        right:         0,
        top:           4,
        bottom:        showX ? 22 : 4,
        containLabel:  showX,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        textStyle: { fontSize: 10 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<b>${p.name}</b>: ${p.value}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.name),
        show: showX,
        axisLabel: {
          fontSize:  8,
          color:     '#9CA3AF',
          interval:  0,
          rotate:    data.length > 5 ? 30 : 0,
          overflow:  'truncate',
          width:     40,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          type:       'bar',
          barMaxWidth: 20,
          barMinWidth:  4,
          data: data.map(d => ({
            value:     d.value,
            itemStyle: {
              color,
              borderRadius: [3, 3, 0, 0],
            },
          })),
          emphasis: {
            itemStyle: { opacity: 0.8 },
          },
        },
      ],
    };
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// EJEMPLO DE USO EN EL COMPONENTE PADRE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * En app.component.ts (o el componente de dashboard):
 *
 * import { StatCardComponent, StatCardDataPoint } from './components/stat-card.component';
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
 *     [trend]="3.4">
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