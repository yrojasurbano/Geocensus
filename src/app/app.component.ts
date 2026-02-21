import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CensusService } from '../services/census.service';

import { PyramidChartComponent }           from '../components/pyramid-chart.component';
import { MapViewerComponent }              from '../components/map-viewer.component';
import { InformesComponent }               from '../components/informes.component';
import { ComparativaTerritorialComponent } from '../components/comparativa-territorial.component'; // ← NUEVO

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption }   from 'echarts';

type ActiveView = 'poblacion' | 'comparativo';

interface ChatMessage {
  text:   string;
  sender: 'user' | 'bot';
  time:   Date;
}

interface QuickAction {
  label: string;
  query: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxEchartsDirective,
    PyramidChartComponent,
    MapViewerComponent,
    InformesComponent,
    ComparativaTerritorialComponent, // ← NUEVO
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  census = inject(CensusService);
  stats  = this.census.globalStats;

  ngOnInit(): void {}

  // ── Vistas principales ───────────────────────────────────────────────────
  showLanding     = signal(true);
  showInformes    = signal(false);
  showComparativa = signal(false); // ← NUEVO

  enterDashboard(): void {
    this.showLanding.set(false);
    this.showInformes.set(false);
    this.showComparativa.set(false);
  }

  goBackToLanding(): void {
    this.showLanding.set(true);
    this.showInformes.set(false);
    this.showComparativa.set(false);
  }

  enterInformes(): void {
    this.showLanding.set(false);
    this.showInformes.set(true);
    this.showComparativa.set(false);
  }

  goBackToDashboard(): void {
    this.showInformes.set(false);
    this.showComparativa.set(false);
    this.showLanding.set(false);
  }

  // ← NUEVO: entra a la vista comparativa territorial
  enterComparativa(): void {
    this.showLanding.set(false);
    this.showInformes.set(false);
    this.showComparativa.set(true);
  }

  // ── Vista activa del dashboard ───────────────────────────────────────────
  activeView = signal<ActiveView>('poblacion');
  setActiveView(view: ActiveView): void { this.activeView.set(view); }

  // ── Filtro de departamentos ──────────────────────────────────────────────
  selectedDepartmentValue = '';
  selectedDepartment      = signal<string>('');

  departments: string[] = [
    'AMAZONAS','ÁNCASH','APURÍMAC','AREQUIPA','AYACUCHO',
    'CAJAMARCA','CALLAO','CUSCO','HUANCAVELICA','HUÁNUCO',
    'ICA','JUNÍN','LA LIBERTAD','LAMBAYEQUE','LIMA',
    'LORETO','MADRE DE DIOS','MOQUEGUA','PASCO','PIURA',
    'PUNO','SAN MARTÍN','TACNA','TUMBES','UCAYALI',
  ];

  onDepartmentChange(dep: string): void {
    this.selectedDepartment.set(dep);
  }

  // ── ECharts options ──────────────────────────────────────────────────────
  lifecycleOptions = computed<EChartsOption>(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p: any) => p.map((s: any) => `${s.marker}${s.seriesName}: <b>${s.value}%</b>`).join('<br/>') },
    grid: { left: 4, right: 4, top: 6, bottom: 18, containLabel: true },
    xAxis: { type: 'category', data: ['0-14','15-29','30-44','45-59','60+'],
      axisLabel: { fontSize: 9, color: '#9CA3AF' }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { show: false },
    series: [
      { name: 'Hombres', type: 'bar', barMaxWidth: 20, itemStyle: { color: '#5A9CF8', borderRadius: [3,3,0,0] }, data: [15.2,13.8,10.5,7.8,7.2] },
      { name: 'Mujeres', type: 'bar', barMaxWidth: 20, itemStyle: { color: '#D45D79', borderRadius: [3,3,0,0] }, data: [14.5,13.4,10.9,8.3,8.4] },
    ],
    animationDuration: 700,
  }));

  sexRatioOptions = computed<EChartsOption>(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: <b>{d}%</b>' },
    series: [{ type: 'pie', radius: ['48%','75%'], center: ['50%','50%'],
      data: [
        { name: 'Hombres', value: 17450120, itemStyle: { color: '#5A9CF8' } },
        { name: 'Mujeres', value: 18228558, itemStyle: { color: '#D45D79' } },
      ],
      label: { show: false }, labelLine: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.25)' } },
    }],
    animationDuration: 700,
  }));

  agingTrendOptions = computed<EChartsOption>(() => ({
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: <b>${p[0].value} pts</b>` },
    grid: { left: 4, right: 4, top: 4, bottom: 18, containLabel: true },
    xAxis: { type: 'category', data: ['1993','2005','2007','2017','2025'],
      axisLabel: { fontSize: 9, color: '#9CA3AF' }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { show: false },
    series: [{ type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
      data: [14.1,19.8,21.3,29.7,37.9], lineStyle: { color: '#F59E0B', width: 2.5 },
      itemStyle: { color: '#F59E0B' },
      areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1,
        colorStops: [{ offset:0, color:'rgba(245,158,11,0.30)' },{ offset:1, color:'rgba(245,158,11,0.02)' }] } },
    }],
    animationDuration: 700,
  }));

  densityTotalOptions = computed<EChartsOption>(() => ({
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: <b>${p[0].value} hab/km²</b>` },
    grid: { left: 8, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { show: false },
    yAxis: { type: 'category', data: ['Selva','Sierra','Nacional','Costa'],
      axisLabel: { fontSize: 9, color: '#9CA3AF' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{ type: 'bar', barMaxWidth: 14,
      data: [
        { value: 3.8,   itemStyle: { color: '#FDE68A', borderRadius: [0,3,3,0] } },
        { value: 22.4,  itemStyle: { color: '#FCD34D', borderRadius: [0,3,3,0] } },
        { value: 27.7,  itemStyle: { color: '#FBBF24', borderRadius: [0,3,3,0] } },
        { value: 136.2, itemStyle: { color: '#F59E0B', borderRadius: [0,3,3,0] } },
      ],
      label: { show: true, position: 'right', fontSize: 9, color: '#6B7280', formatter: '{c}' },
    }],
    animationDuration: 700,
  }));

  densityElderlyOptions = computed<EChartsOption>(() => ({
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: <b>${p[0].value} hab/km²</b>` },
    grid: { left: 8, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { show: false },
    yAxis: { type: 'category', data: ['Selva','Sierra','Nacional','Costa'],
      axisLabel: { fontSize: 9, color: '#9CA3AF' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{ type: 'bar', barMaxWidth: 14,
      data: [
        { value: 0.8,  itemStyle: { color: '#FCA5A5', borderRadius: [0,3,3,0] } },
        { value: 4.1,  itemStyle: { color: '#F87171', borderRadius: [0,3,3,0] } },
        { value: 4.2,  itemStyle: { color: '#EF4444', borderRadius: [0,3,3,0] } },
        { value: 21.5, itemStyle: { color: '#DC2626', borderRadius: [0,3,3,0] } },
      ],
      label: { show: true, position: 'right', fontSize: 9, color: '#6B7280', formatter: '{c}' },
    }],
    animationDuration: 700,
  }));

  // ── Menús ────────────────────────────────────────────────────────────────
  isCensoMenuOpen    = signal(false);
  isResultadosOpen   = signal(false);
  isInformesMenuOpen = signal(false);

  closeAllMenus(): void {
    this.isCensoMenuOpen.set(false);
    this.isResultadosOpen.set(false);
    this.isInformesMenuOpen.set(false);
  }
  toggleCensoMenu():    void { const s = this.isCensoMenuOpen();    this.closeAllMenus(); this.isCensoMenuOpen.set(!s); }
  toggleResultados():   void { const s = this.isResultadosOpen();   this.closeAllMenus(); this.isResultadosOpen.set(!s); }
  toggleInformesMenu(): void { const s = this.isInformesMenuOpen(); this.closeAllMenus(); this.isInformesMenuOpen.set(!s); }

  // ── GeoBot ───────────────────────────────────────────────────────────────
  isOpen   = signal(false);
  isTyping = signal(false);
  userMessageValue = '';

  messages = signal<ChatMessage[]>([{
    text:   '¡Hola! Soy GeoBot 🤖, tu asistente del INEI. ¿En qué puedo ayudarte sobre el Censo 2025?',
    sender: 'bot',
    time:   new Date(),
  }]);

  quickActions: QuickAction[] = [
    { label: '📊 Datos de Lima',    query: 'Muéstrame la población de Lima' },
    { label: '🗺️ Densidad',         query: 'Ver mapa de densidad poblacional' },
    { label: '📉 Pirámide de Edad', query: 'Analizar estructura por edades' },
    { label: '📥 Exportar',         query: 'Cómo descargar los datos' },
  ];

  toggleChat(): void { this.isOpen.update(v => !v); }

  sendMessage(text: string | null = null): void {
    const msg = (text ?? this.userMessageValue).trim();
    if (!msg) return;
    this.messages.update(m => [...m, { text: msg, sender: 'user', time: new Date() }]);
    this.userMessageValue = '';
    this.isTyping.set(true);
    setTimeout(() => {
      this.messages.update(m => [...m, { text: this.getBotResponse(msg), sender: 'bot', time: new Date() }]);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 1400);
  }

  getBotResponse(q: string): string {
    q = q.toLowerCase();
    if (q.includes('lima') || q.includes('población'))
      return 'Lima tiene 10,126,052 hab. según resultados preliminares del CPV 2025.';
    if (q.includes('mapa') || q.includes('densidad'))
      return 'El mapa interactivo muestra la densidad por departamento. Pasa el cursor para ver el detalle.';
    if (q.includes('pirámide') || q.includes('edad'))
      return 'La pirámide muestra reducción en la base: proceso de envejecimiento demográfico.';
    if (q.includes('exportar') || q.includes('descargar'))
      return 'Usa el botón "Documentos" en el menú superior para reportes descargables.';
    return 'Filtra por departamento con el selector del encabezado o selecciona una región en el mapa.';
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector('.chat-scroll-area');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}