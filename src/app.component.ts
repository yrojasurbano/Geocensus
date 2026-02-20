import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CensusService } from './services/census.service';

// Componentes propios
import { PyramidChartComponent } from './components/pyramid-chart.component';
import { MapViewerComponent } from './components/map-viewer.component';

// ngx-charts — NgxChartsModule incluye todos los gráficos
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import * as shape from 'd3-shape';

type ActiveView = 'poblacion' | 'comparativo';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  time: Date;
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
    PyramidChartComponent,
    MapViewerComponent,
    NgxChartsModule,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  census = inject(CensusService);
  stats  = this.census.globalStats;

  // ─────────────────────────────────────────────────────────────
  // DIMENSIONES FIJAS PARA NGX-CHARTS
  // Soluciona el bug de "gráficos que solo renderizan al hover"
  // ngx-charts necesita dimensiones numéricas al momento de la
  // creación del componente. Con [view]="[0, h]" delega el ancho
  // al DOM pero el cálculo falla si el contenedor no está visible.
  // ─────────────────────────────────────────────────────────────

  /** Ancho del bloque izquierdo de métricas (~54% del viewport, menos padding) */
  chartWidth     = 460;
  /** Mitad del ancho (para cards en grid de 2 columnas con gap) */
  chartHalfWidth = 210;

  /** Recalcular dimensiones al cambiar el tamaño de la ventana */
  @HostListener('window:resize')
  onResize(): void {
    this.recalcChartDimensions();
  }

  ngOnInit(): void {
    this.recalcChartDimensions();
  }

  private recalcChartDimensions(): void {
    const vw = window.innerWidth;

    if (vw >= 1280) {
      // Desktop grande: bloque izq ≈ 54% - 32px padding
      this.chartWidth     = Math.floor(vw * 0.54) - 48;
      this.chartHalfWidth = Math.floor((this.chartWidth - 12) / 2);
    } else if (vw >= 1024) {
      // Desktop: bloque izq ≈ 54%
      this.chartWidth     = Math.floor(vw * 0.54) - 32;
      this.chartHalfWidth = Math.floor((this.chartWidth - 12) / 2);
    } else if (vw >= 768) {
      // Tablet: columna única, ancho completo menos padding
      this.chartWidth     = vw - 32;
      this.chartHalfWidth = Math.floor((this.chartWidth - 12) / 2);
    } else {
      // Móvil
      this.chartWidth     = vw - 24;
      this.chartHalfWidth = Math.floor((this.chartWidth - 8) / 2);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ESTADO LANDING / DASHBOARD
  // ─────────────────────────────────────────────────────────────
  showLanding = signal(true);
  enterDashboard(): void { this.showLanding.set(false); }
  goBackToLanding(): void { this.showLanding.set(true); }

  // ─────────────────────────────────────────────────────────────
  // VISTAS Y FILTROS
  // ─────────────────────────────────────────────────────────────
  activeView = signal<ActiveView>('poblacion');
  setActiveView(view: ActiveView): void { this.activeView.set(view); }

  selectedDepartmentValue = '';
  selectedDepartment = signal<string>('');

  departments: string[] = [
    'AMAZONAS', 'ÁNCASH', 'APURÍMAC', 'AREQUIPA', 'AYACUCHO',
    'CAJAMARCA', 'CALLAO', 'CUSCO', 'HUANCAVELICA', 'HUÁNUCO',
    'ICA', 'JUNÍN', 'LA LIBERTAD', 'LAMBAYEQUE', 'LIMA',
    'LORETO', 'MADRE DE DIOS', 'MOQUEGUA', 'PASCO', 'PIURA',
    'PUNO', 'SAN MARTÍN', 'TACNA', 'TUMBES', 'UCAYALI',
  ];

  onDepartmentChange(department: string): void {
    this.selectedDepartment.set(department);
    // Conectar con: this.census.setDepartmentFilter(department);
  }

  // ─────────────────────────────────────────────────────────────
  // PALETAS DE COLOR (ngx-charts Color type)
  // ─────────────────────────────────────────────────────────────
  lifecycleColorScheme: Color = {
    name: 'lifecycle', selectable: false, group: ScaleType.Ordinal,
    domain: ['#5A9CF8', '#D45D79'],
  };

  sexRatioColorScheme: Color = {
    name: 'sexratio', selectable: false, group: ScaleType.Ordinal,
    domain: ['#5A9CF8', '#D45D79'],
  };

  orangeColorScheme: Color = {
    name: 'orange', selectable: false, group: ScaleType.Ordinal,
    domain: ['#F59E0B', '#FCD34D'],
  };

  amberColorScheme: Color = {
    name: 'amber', selectable: false, group: ScaleType.Ordinal,
    domain: ['#F59E0B'],
  };

  roseColorScheme: Color = {
    name: 'rose', selectable: false, group: ScaleType.Ordinal,
    domain: ['#F43F5E'],
  };

  /** Curva D3 para líneas suavizadas */
  curveBasis = shape.curveBasis;

  // ─────────────────────────────────────────────────────────────
  // DATOS PARA MICRO-GRÁFICOS (computed signals)
  // ─────────────────────────────────────────────────────────────

  lifecycleChartData = computed(() => [
    { name: '0-14',  series: [{ name: 'Hombres', value: 15.2 }, { name: 'Mujeres', value: 14.5 }] },
    { name: '15-29', series: [{ name: 'Hombres', value: 13.8 }, { name: 'Mujeres', value: 13.4 }] },
    { name: '30-44', series: [{ name: 'Hombres', value: 10.5 }, { name: 'Mujeres', value: 10.9 }] },
    { name: '45-59', series: [{ name: 'Hombres', value:  7.8 }, { name: 'Mujeres', value:  8.3 }] },
    { name: '60+',   series: [{ name: 'Hombres', value:  7.2 }, { name: 'Mujeres', value:  8.4 }] },
  ]);

  sexRatioChartData = computed(() => [
    { name: 'Hombres', value: 17450120 },
    { name: 'Mujeres', value: 18228558 },
  ]);

  agingIndexTrendData = computed(() => [{
    name: 'Índice Envejecimiento',
    series: [
      { name: '1993', value: 14.1 },
      { name: '2005', value: 19.8 },
      { name: '2007', value: 21.3 },
      { name: '2017', value: 29.7 },
      { name: '2025', value: 37.9 },
    ],
  }]);

  densityBarData = computed(() => [
    { name: 'Costa',    value: 136.2 },
    { name: 'Sierra',   value:  22.4 },
    { name: 'Selva',    value:   3.8 },
    { name: 'Nacional', value:  27.7 },
  ]);

  densityElderlyBarData = computed(() => [
    { name: 'Costa',    value: 21.5 },
    { name: 'Sierra',   value:  4.1 },
    { name: 'Selva',    value:  0.8 },
    { name: 'Nacional', value:  4.2 },
  ]);

  // ─────────────────────────────────────────────────────────────
  // MENÚS (legado)
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // GEOBOT — CHATBOT
  // ─────────────────────────────────────────────────────────────
  isOpen   = signal(false);
  isTyping = signal(false);

  userMessageValue = '';

  messages = signal<ChatMessage[]>([{
    text: '¡Hola! Soy GeoBot 🤖, tu asistente virtual del INEI. ¿En qué puedo ayudarte sobre el Censo 2025?',
    sender: 'bot',
    time: new Date(),
  }]);

  quickActions: QuickAction[] = [
    { label: '📊 Datos de Lima',     query: 'Muéstrame la población de Lima' },
    { label: '🗺️ Mapas de Densidad', query: 'Ver mapa de densidad poblacional' },
    { label: '📉 Pirámide de Edad',  query: 'Analizar estructura por edades' },
    { label: '📥 Exportar Reporte',  query: 'Cómo descargar los datos' },
  ];

  toggleChat(): void { this.isOpen.update(v => !v); }

  sendMessage(text: string | null = null): void {
    const messageText = text ?? this.userMessageValue;
    if (!messageText.trim()) return;

    this.messages.update(msgs => [...msgs, { text: messageText, sender: 'user', time: new Date() }]);
    this.userMessageValue = '';
    this.isTyping.set(true);

    setTimeout(() => {
      const responseText = this.getBotResponse(messageText);
      this.messages.update(msgs => [...msgs, { text: responseText, sender: 'bot', time: new Date() }]);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 1500);
  }

  getBotResponse(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('lima') || q.includes('población'))
      return 'Lima tiene una población preliminar de 10,126,052 hab., la mayor del país.';
    if (q.includes('mapa') || q.includes('densidad'))
      return 'El mapa interactivo a la derecha muestra la densidad por departamento. Pasa el cursor para ver el detalle.';
    if (q.includes('pirámide') || q.includes('edad'))
      return 'La pirámide muestra reducción en la base y ensanchamiento en la cima: envejecimiento demográfico.';
    if (q.includes('exportar') || q.includes('descargar'))
      return 'Usa el botón "Documentos" en el menú superior para acceder a los reportes descargables.';
    return 'Para ese nivel de detalle, filtra por departamento con el selector del encabezado o selecciona una región en el mapa.';
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector('.chat-scroll-area');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}