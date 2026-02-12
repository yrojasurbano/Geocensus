import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CensusService } from './services/census.service';

// Importación de Componentes
import { HeaderComponent } from './components/header.component';
import { SidebarComponent } from './components/sidebar.component'; // Nuevo componente del diseño actualizado
import { PyramidChartComponent } from './components/pyramid-chart.component';
import { MapViewerComponent } from './components/map-viewer.component';
import { DataTableComponent } from './components/data-table.component';

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
    HeaderComponent, 
    SidebarComponent, // Asegúrate de tener este componente creado o elimínalo si aún no existe
    PyramidChartComponent,
    MapViewerComponent,
    DataTableComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  census = inject(CensusService);
  stats = this.census.globalStats;

  // ==========================================
  // 0. RETORNO A CARATULA
  // ==========================================
goBackToLanding() {
  this.showLanding.set(true);
}



  // ==========================================
  // 1. ESTADO DE LA CARÁTULA (LANDING PAGE)
  // ==========================================
  showLanding = signal(true);

  enterDashboard() {
    this.showLanding.set(false);
  }

  // ==========================================
  // 2. ESTADO DE LA BARRA DE HERRAMIENTAS
  // (Funcionalidad original del Dashboard)
  // ==========================================
  isResultadosOpen = signal(false);
  isCensoMenuOpen = signal(false);

  toggleResultados() {
    this.isResultadosOpen.update(val => !val);
    this.isCensoMenuOpen.set(false); // Cierra el otro menú para evitar solapamiento
  }

  toggleCensoMenu() {
    this.isCensoMenuOpen.update(val => !val);
    this.isResultadosOpen.set(false); // Cierra el otro menú para evitar solapamiento
  }

  // ==========================================
  // 3. LÓGICA DEL CHATBOT (GEOBOT)
  // ==========================================
  isOpen = signal(false);
  isTyping = signal(false);
  userMessage = signal('');
  
  messages = signal<ChatMessage[]>([
    { 
      text: '¡Hola! Soy GeoBot 🤖, tu asistente virtual del INEI. ¿En qué puedo ayudarte a buscar información sobre el Censo 2025?', 
      sender: 'bot', 
      time: new Date() 
    }
  ]);

  quickActions: QuickAction[] = [
    { label: '📊 Datos de Lima', query: 'Muéstrame la población de Lima' },
    { label: '🗺️ Mapas de Densidad', query: 'Ver mapa de densidad poblacional' },
    { label: '📉 Pirámide de Edad', query: 'Analizar estructura por edades' },
    { label: '📥 Exportar Reporte', query: 'Cómo descargar los datos' }
  ];

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  sendMessage(text: string = this.userMessage()) {
    if (!text.trim()) return;

    // 1. Agregar mensaje del usuario
    this.messages.update(msgs => [...msgs, { text, sender: 'user', time: new Date() }]);
    this.userMessage.set('');
    this.isTyping.set(true);

    // 2. Simular respuesta del Bot
    setTimeout(() => {
      const responseText = this.getBotResponse(text);
      this.messages.update(msgs => [...msgs, { text: responseText, sender: 'bot', time: new Date() }]);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 1500);
  }

  getBotResponse(query: string): string {
    const q = query.toLowerCase();
    
    if (q.includes('lima') || q.includes('población')) {
        return 'Según los resultados preliminares, Lima tiene una población de 10,126,052 habitantes, representando la mayor concentración demográfica del país.';
    }
    
    if (q.includes('mapa') || q.includes('densidad')) {
        return 'Puedes visualizar la densidad en el mapa interactivo a la derecha. Los colores más oscuros (rojo) indican mayor densidad poblacional por km².';
    }
    
    if (q.includes('pirámide') || q.includes('edad')) {
        return 'La pirámide poblacional muestra una reducción en la base (menos nacimientos) y un ensanchamiento en la cima, indicando un envejecimiento demográfico.';
    }
    
    if (q.includes('exportar') || q.includes('descargar')) {
        return 'Para exportar datos, utiliza el botón "Exportar" situado en la parte superior derecha de la tabla de datos departamentales.';
    }
    
    return 'Entiendo tu consulta. Para ese nivel de detalle, te sugiero filtrar por departamento usando la barra lateral izquierda o seleccionar una región en el mapa.';
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-scroll-area');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }
}