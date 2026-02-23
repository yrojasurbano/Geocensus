/**
 * informes.component.ts
 * Ruta: src/app/components/informes.component.ts
 */

import {
  Component,
  signal,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type InformesView   = 'documentos' | 'consultas';
type ConsultasView  = 'glosario' | 'faq' | 'indicadores';
type DocumentosView = 'cedulas' | 'manuales';

interface Cedula {
  titulo: string; descripcion: string; paginas: number;
  version: string; fecha: string; url: string; color: string;
}
interface Manual {
  titulo: string; descripcion: string; paginas: number;
  version: string; fecha: string; dirigido: string;
  icono: string; color: string; url: string;
}
interface GlosarioItem { termino: string; categoria: string; definicion: string; }
interface FaqItem { pregunta: string; respuesta: string; categoria: string; abierto: boolean; }
interface Indicador {
  nombre: string; formula: string; descripcion: string; interpretacion: string;
  ejemplo: string; valor: number; color: string; unidad: string;
  fuente: string; tendencia: 'sube' | 'baja' | 'estable';
}

@Component({
  selector: 'app-informes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-screen w-full overflow-hidden bg-[#F0EEF5] font-sans">

      <!-- ══ HEADER NIVEL 1 — #8B4996 : Logos + título (= Dashboard) ══ -->
      <div class="bg-[#8B4996] text-white flex justify-between items-center px-4 md:px-6 py-2 border-b border-white/10 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-white p-1.5 rounded-md shadow-md flex-shrink-0">
            <img src="assets/images/logo.png" alt="INEI" class="h-8 w-auto object-contain">
          </div>
          <div class="bg-white p-1.5 rounded-md shadow-md flex-shrink-0">
            <img src="assets/images/logo-cpv.png" alt="CPV 2025" class="h-8 w-auto object-contain">
          </div>
          <div class="ml-1 hidden md:flex flex-col">
            <p class="text-[9px] text-purple-200 uppercase tracking-widest font-semibold leading-none mb-0.5">
              Instituto Nacional de Estadística e Informática
            </p>
            <h1 class="text-sm font-black uppercase text-white leading-tight">
              Censos Nacionales de Población y Vivienda
              <span class="text-yellow-300 ml-1">CPV 2025</span>
            </h1>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="text-right hidden sm:block">
            <div class="text-[9px] text-purple-200 uppercase font-bold tracking-widest">INEI — Visitantes</div>
            <div class="text-sm font-mono font-bold">1,256,456</div>
          </div>
          <div class="bg-white/10 border border-white/20 p-1.5 rounded-full hover:bg-white/20 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- ══ HEADER NIVEL 2 — #72387c : Navegación secundaria (= Dashboard) ══ -->
      <nav class="bg-[#72387c] text-white flex items-center justify-end gap-1 px-4 md:px-6 py-1 border-b border-white/10 flex-shrink-0">
        <!-- Inicio -->
        <button (click)="onGoHome()"
                class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white/90 hover:bg-white/15 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </button>
        <div class="w-px h-3.5 bg-white/20 mx-0.5"></div>
        <!-- Primeros Resultados -->
        <button (click)="onGoDashboard()"
                class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white/90 hover:bg-white/15 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Primeros Resultados
        </button>
        <div class="w-px h-3.5 bg-white/20 mx-0.5"></div>
        <!-- Informes y Documentos — ACTIVO en esta vista -->
        <button class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white/20 text-white border border-white/30 cursor-default">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Informes y Documentos
        </button>
      </nav>

      <!-- ══ HEADER NIVEL 3 — #C5328A : Sub-tabs Documentos / Consultas ══ -->
      <div class="bg-[#C5328A] text-white flex items-center px-4 md:px-6 py-1.5 flex-shrink-0 gap-1">
        <!-- Documentos Metodológicos -->
        <button (click)="setView('documentos')"
                [class]="activeView()==='documentos'
                  ? 'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white text-[#C5328A] shadow transition-all'
                  : 'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white/80 hover:bg-white/15 hover:text-white transition-colors'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span class="hidden sm:inline">Documentos Metodológicos</span>
        </button>
        <!-- Consultas -->
        <button (click)="setView('consultas')"
                [class]="activeView()==='consultas'
                  ? 'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white text-[#C5328A] shadow transition-all'
                  : 'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white/80 hover:bg-white/15 hover:text-white transition-colors'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="hidden sm:inline">Consultas</span>
        </button>
      </div>

      <!-- CONTENIDO -->
      <main class="flex-1 overflow-y-auto">

        <!-- ══ DOCUMENTOS METODOLÓGICOS ══ -->
        @if (activeView() === 'documentos') {
          <div class="max-w-7xl mx-auto px-4 md:px-8 py-6 animate-fade-in">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-1 h-8 bg-[#8B4996] rounded-full"></div>
              <div>
                <h2 class="text-xl font-black text-gray-800">Documentos Metodológicos</h2>
                <p class="text-xs text-gray-400 font-medium">CPV 2025 — Instrumentos Oficiales de Recolección y Operación</p>
              </div>
            </div>

            <!-- Sub-nav Documentos -->
            <div class="flex gap-2 mb-6 border-b border-gray-200 pb-3">
              <button (click)="setDocView('cedulas')"
                      [class]="activeDocView()==='cedulas'
                        ? 'flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B4996] text-white text-xs font-black shadow-sm transition-all'
                        : 'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:border-[#8B4996] hover:text-[#8B4996] transition-all'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Cédulas Censales
              </button>
              <button (click)="setDocView('manuales')"
                      [class]="activeDocView()==='manuales'
                        ? 'flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009FE3] text-white text-xs font-black shadow-sm transition-all'
                        : 'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:border-[#009FE3] hover:text-[#009FE3] transition-all'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Manuales Operativos
              </button>
            </div>

            <!-- CÉDULAS -->
            @if (activeDocView() === 'cedulas') {
              <div class="animate-fade-in">
                <p class="text-xs text-gray-500 mb-5 leading-relaxed max-w-3xl">Las cédulas censales son los instrumentos oficiales de recolección del CPV 2025. Fueron diseñadas por el INEI con el apoyo de CEPAL y UNFPA, y validadas en el Censo Piloto 2024 en las provincias de Barranca, Huanta y San Ignacio.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  @for (c of cedulas; track c.titulo) {
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                      <div class="p-6 flex flex-col items-center border-b border-gray-100 relative"
                           [style.background]="'linear-gradient(135deg,' + c.color + '15,' + c.color + '05)'">
                        <div class="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded">PDF</div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-14 w-14 mb-3 group-hover:scale-110 transition-transform"
                             [style.color]="c.color + '90'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 class="text-xs font-black text-gray-800 text-center leading-tight">{{ c.titulo }}</h3>
                        <div class="flex gap-3 mt-2 text-[9px] text-gray-400">
                          <span>{{ c.paginas }} págs.</span><span>·</span><span>v{{ c.version }}</span><span>·</span><span>{{ c.fecha }}</span>
                        </div>
                      </div>
                      <div class="p-4">
                        <p class="text-[10px] text-gray-400 leading-relaxed mb-4">{{ c.descripcion }}</p>
                        <div class="flex gap-2">
                          <a [href]="c.url" target="_blank" rel="noopener"
                             class="flex-1 flex items-center justify-center gap-1.5 text-white text-[10px] font-bold py-2 rounded-lg transition-colors"
                             [style.background]="c.color">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver
                          </a>
                          <a [href]="c.url" download target="_blank" rel="noopener"
                             class="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-lg border transition-colors"
                             [style.color]="c.color" [style.borderColor]="c.color + '60'">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- MANUALES -->
            @if (activeDocView() === 'manuales') {
              <div class="animate-fade-in">
                <p class="text-xs text-gray-500 mb-5 leading-relaxed max-w-3xl">Los manuales operativos del CPV 2025 fueron elaborados para capacitar al personal de campo en todos los niveles. Cada manual está adaptado al rol específico con ejemplos prácticos y guías de decisión para situaciones de campo.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  @for (m of manuales; track m.titulo) {
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                      <div class="p-5 flex flex-col items-center border-b border-gray-100"
                           [style.background]="'linear-gradient(135deg,' + m.color + '15,' + m.color + '05)'">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                             [style.background]="m.color + '20'">
                          <span class="text-3xl">{{ m.icono }}</span>
                        </div>
                        <h3 class="text-xs font-black text-gray-800 text-center leading-tight mb-1">{{ m.titulo }}</h3>
                        <div class="flex gap-2 text-[8px] text-gray-400 mt-1">
                          <span>{{ m.paginas }} págs.</span><span>·</span><span>{{ m.fecha }}</span>
                        </div>
                      </div>
                      <div class="p-4">
                        <div class="mb-2">
                          <span class="text-[8px] font-black uppercase tracking-widest" [style.color]="m.color">Dirigido a:</span>
                          <p class="text-[9px] text-gray-500 font-semibold">{{ m.dirigido }}</p>
                        </div>
                        <p class="text-[9px] text-gray-400 leading-relaxed mb-4">{{ m.descripcion }}</p>
                        <div class="flex gap-1.5">
                          <a [href]="m.url" target="_blank" rel="noopener"
                             class="flex-1 flex items-center justify-center gap-1 text-white text-[9px] font-bold py-2 rounded-lg transition-colors"
                             [style.background]="m.color">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver
                          </a>
                          <a [href]="m.url" download target="_blank" rel="noopener"
                             class="flex-1 flex items-center justify-center gap-1 text-[9px] font-bold py-2 rounded-lg border transition-colors"
                             [style.color]="m.color" [style.borderColor]="m.color + '60'">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- ══ CONSULTAS ══ -->
        @if (activeView() === 'consultas') {
          <div class="max-w-7xl mx-auto px-4 md:px-8 py-6 animate-fade-in">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-1 h-8 bg-[#009FE3] rounded-full"></div>
              <div>
                <h2 class="text-xl font-black text-gray-800">Consultas</h2>
                <p class="text-xs text-gray-400 font-medium">Glosario técnico, preguntas frecuentes e interpretación de indicadores</p>
              </div>
            </div>

            <!-- Sub-nav Consultas -->
            <div class="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
              <button (click)="setConsultaView('glosario')"
                      [class]="activeConsultaView()==='glosario'
                        ? 'flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B4996] text-white text-xs font-black shadow-sm transition-all'
                        : 'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:border-[#8B4996] hover:text-[#8B4996] transition-all'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Glosario de Términos
              </button>
              <button (click)="setConsultaView('faq')"
                      [class]="activeConsultaView()==='faq'
                        ? 'flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009FE3] text-white text-xs font-black shadow-sm transition-all'
                        : 'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:border-[#009FE3] hover:text-[#009FE3] transition-all'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Preguntas Frecuentes
              </button>
              <button (click)="setConsultaView('indicadores')"
                      [class]="activeConsultaView()==='indicadores'
                        ? 'flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C2264B] text-white text-xs font-black shadow-sm transition-all'
                        : 'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:border-[#C2264B] hover:text-[#C2264B] transition-all'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Interpretación de Datos
              </button>
            </div>

            <!-- GLOSARIO -->
            @if (activeConsultaView() === 'glosario') {
              <div class="animate-fade-in">
                <p class="text-xs text-gray-500 mb-5 leading-relaxed max-w-3xl">Listado oficial de términos técnicos del CPV 2025. Las definiciones siguen los estándares metodológicos del INEI, CEPAL y Naciones Unidas para censos de población y vivienda.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  @for (item of glosario; track item.termino) {
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-[#8B4996]/30 transition-all">
                      <div class="flex items-start justify-between mb-2">
                        <p class="text-[11px] font-black text-[#8B4996] uppercase tracking-wide leading-tight">{{ item.termino }}</p>
                        <span class="text-[8px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#8B4996] flex-shrink-0 ml-2">{{ item.categoria }}</span>
                      </div>
                      <p class="text-[10px] text-gray-500 leading-relaxed">{{ item.definicion }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- FAQ -->
            @if (activeConsultaView() === 'faq') {
              <div class="animate-fade-in max-w-4xl">
                <p class="text-xs text-gray-500 mb-5 leading-relaxed">Respuestas oficiales a las consultas más frecuentes sobre el proceso censal, metodología, cobertura y acceso a los resultados del CPV 2025.</p>
                <div class="space-y-2">
                  @for (faq of faqs; track faq.pregunta; let i = $index) {
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-[#009FE3]/30 transition-all">
                      <button (click)="toggleFaq(i)"
                              class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-blue-50/30 transition-colors">
                        <div class="flex items-center gap-3 flex-1">
                          <span class="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[#009FE3] flex-shrink-0">{{ faq.categoria }}</span>
                          <span class="text-xs font-bold text-gray-700 leading-snug pr-4">{{ faq.pregunta }}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg"
                             class="h-4 w-4 text-[#009FE3] flex-shrink-0 transition-transform duration-200"
                             [class.rotate-180]="faq.abierto"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      @if (faq.abierto) {
                        <div class="px-5 pb-4 bg-blue-50/20">
                          <p class="text-[11px] text-gray-500 leading-relaxed border-l-2 border-[#009FE3]/40 pl-3">{{ faq.respuesta }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- INDICADORES -->
            @if (activeConsultaView() === 'indicadores') {
              <div class="animate-fade-in">
                <p class="text-xs text-gray-500 mb-5 leading-relaxed max-w-3xl">Guía metodológica para la lectura e interpretación de los principales indicadores demográficos del CPV 2025. Incluye fórmulas, valores de referencia y análisis comparativo con censos anteriores.</p>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  @for (ind of indicadores; track ind.nombre) {
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                      <div class="flex items-start justify-between mb-3">
                        <div>
                          <h4 class="text-sm font-black text-gray-800 leading-tight">{{ ind.nombre }}</h4>
                          <p class="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">{{ ind.unidad }}</p>
                        </div>
                        <div class="text-right flex-shrink-0 ml-3">
                          <span class="text-xl font-black block" [style.color]="ind.color">{{ ind.ejemplo }}</span>
                          <span class="text-[8px] font-bold uppercase"
                                [class]="ind.tendencia==='sube' ? 'text-emerald-500' : ind.tendencia==='baja' ? 'text-red-500' : 'text-gray-400'">
                            {{ ind.tendencia==='sube' ? '▲ En aumento' : ind.tendencia==='baja' ? '▼ En descenso' : '— Estable' }}
                          </span>
                        </div>
                      </div>
                      <div class="bg-gray-50 rounded-xl px-4 py-3 mb-3 border border-gray-100">
                        <p class="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Fórmula de cálculo</p>
                        <p class="font-mono text-[10px] text-gray-700">{{ ind.formula }}</p>
                      </div>
                      <div class="mb-3">
                        <div class="flex justify-between text-[9px] text-gray-400 font-bold mb-1">
                          <span>Nivel relativo al máximo histórico</span>
                          <span>{{ ind.valor }}%</span>
                        </div>
                        <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div class="h-2.5 rounded-full transition-all duration-700"
                               [style.width]="ind.valor + '%'"
                               [style.background]="'linear-gradient(90deg,' + ind.color + '80,' + ind.color + ')'">
                          </div>
                        </div>
                      </div>
                      <p class="text-[10px] text-gray-500 leading-relaxed mb-2">{{ ind.descripcion }}</p>
                      <div class="bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2">
                        <p class="text-[8px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Interpretación CPV 2025</p>
                        <p class="text-[10px] text-amber-800 leading-relaxed">{{ ind.interpretacion }}</p>
                      </div>
                      <p class="text-[8px] text-gray-300 mt-2 text-right">Fuente: {{ ind.fuente }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- ══ FOOTER — idéntico al Dashboard principal ══ -->
      <footer class="flex-shrink-0 bg-[#3d1d45] text-white py-2 px-4 md:px-6 flex justify-between items-center z-40 border-t border-white/10">
        <div class="hidden md:block">
          <p class="text-[9px] text-purple-300 font-semibold uppercase tracking-widest">Instituto Nacional de Estadística e Informática</p>
          <p class="text-[9px] text-purple-400">Av. General Garzón N° 654-658, Jesús María — Lima, Perú | (01) 203-3000</p>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-[8px] text-purple-400 uppercase tracking-widest hidden sm:block mr-1">Síguenos:</span>
          <a href="#" class="text-purple-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" class="text-purple-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors" aria-label="X">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="#" class="text-purple-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="#" class="text-purple-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors" aria-label="YouTube">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="#" class="text-purple-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors" aria-label="LinkedIn">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
        <p class="text-[8px] text-purple-400 hidden lg:block">© 2026 INEI — CPV 2025</p>
      </footer>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
    .rotate-180 { transform: rotate(180deg); }
  `],
})
export class InformesComponent {

  @Output() goHome      = new EventEmitter<void>();
  @Output() goDashboard     = new EventEmitter<void>();
  @Output() goToComparativa = new EventEmitter<void>();

  activeView         = signal<InformesView>('documentos');
  activeDocView      = signal<DocumentosView>('cedulas');
  activeConsultaView = signal<ConsultasView>('glosario');

  setView(v: InformesView):          void { this.activeView.set(v); }
  setDocView(v: DocumentosView):     void { this.activeDocView.set(v); }
  setConsultaView(v: ConsultasView): void { this.activeConsultaView.set(v); }
  onGoHome():      void { this.goHome.emit(); }
  onGoDashboard():    void { this.goDashboard.emit(); }
  onGoComparativa(): void { this.goToComparativa.emit(); }

  // ── CÉDULAS ───────────────────────────────────────────────────────────────
  readonly cedulas: Cedula[] = [
    { titulo: 'Cédula Censal de Población y Vivienda', descripcion: 'Instrumento principal del CPV 2025. Registra características demográficas, educativas, económicas y de vivienda de toda la población residente en el país.', paginas: 28, version: '3.1', fecha: 'Junio 2025', color: '#8B4996', url: 'https://cdn.www.gob.pe/uploads/document/file/8318253/6930565-cedula-censal-de-poblacion-y-vivienda.pdf?v=1751643857' },
    { titulo: 'Cédula de Comunidades Indígenas', descripcion: 'Formulario especializado para el III Censo de Comunidades Indígenas. Incluye variables de identidad étnica, lengua materna y prácticas culturales propias.', paginas: 18, version: '2.0', fecha: 'Junio 2025', color: '#C2264B', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Cedula_Comunidades.pdf' },
    { titulo: 'Cédula de Hogares en Situación de Calle', descripcion: 'Instrumento diferenciado para el registro de personas sin domicilio fijo, validado con el MIMP y organizaciones de asistencia social.', paginas: 12, version: '1.2', fecha: 'Mayo 2025', color: '#009FE3', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Cedula_Calle.pdf' },
    { titulo: 'Cédula de Viviendas Colectivas', descripcion: 'Formulario para hoteles, albergues, centros penitenciarios y otras instalaciones colectivas. Capta información institucional y de residentes.', paginas: 16, version: '2.1', fecha: 'Mayo 2025', color: '#059669', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Cedula_Colectiva.pdf' },
    { titulo: 'Cédula Piloto CPV 2024', descripcion: 'Versión de prueba utilizada en el Censo Piloto de noviembre 2024 en Barranca, Huanta y San Ignacio. Referencia metodológica comparativa.', paginas: 24, version: '2.8', fecha: 'Noviembre 2024', color: '#F59E0B', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Cedula_Piloto.pdf' },
    { titulo: 'Cédula de Verificación de Cobertura', descripcion: 'Instrumento post-enumeración para estimar la tasa de omisión censal mediante la Encuesta de Cobertura del Censo (ECC 2025).', paginas: 10, version: '1.0', fecha: 'Julio 2025', color: '#7C3AED', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Cedula_Cobertura.pdf' },
  ];

  // ── MANUALES ──────────────────────────────────────────────────────────────
  readonly manuales: Manual[] = [
    { titulo: 'Manual del Censista', descripcion: 'Guía para la entrevista censal, aplicación de cédula, casos especiales y protocolo de cierre de visita.', paginas: 152, version: '3.0', fecha: 'Abril 2025', dirigido: 'Empadronadores de campo', icono: '📋', color: '#8B4996', url: 'https://censos2025.inei.gob.pe/wp-content/uploads/2025/12/Doc.CPV_.08.11_Manual-del-Censista_CPV_actualiz.16.07.25.pdf' },
    { titulo: 'Manual del Jefe de Sección', descripcion: 'Procedimientos de supervisión, verificación de cobertura y reporte de avance diario en campo.', paginas: 98, version: '2.5', fecha: 'Abril 2025', dirigido: 'Jefes de Sección', icono: '👔', color: '#009FE3', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Manual_Jefe.pdf' },
    { titulo: 'Manual del Coordinador Distrital', descripcion: 'Gestión de recursos humanos, logística de materiales y coordinación interinstitucional a nivel distrital.', paginas: 120, version: '2.2', fecha: 'Marzo 2025', dirigido: 'Coordinadores Distritales', icono: '🗂️', color: '#C2264B', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Manual_Coordinador.pdf' },
    { titulo: 'Manual de Campo', descripcion: 'Instrucciones para el recorrido de sectores cartográficos, delimitación de áreas y registro de control GPS.', paginas: 88, version: '2.0', fecha: 'Febrero 2025', dirigido: 'Personal de cartografía', icono: '🗺️', color: '#F59E0B', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Manual_Campo.pdf' },
    { titulo: 'Manual de Consistencia', descripcion: 'Criterios de validación lógica, reglas de imputación y procedimientos de depuración de la base de datos censal.', paginas: 176, version: '1.8', fecha: 'Agosto 2025', dirigido: 'Técnicos de procesamiento', icono: '✅', color: '#059669', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Manual_Consistencia.pdf' },
    { titulo: 'Manual de Comunidades Indígenas', descripcion: 'Adaptaciones metodológicas para zonas de selva y sierra rural, con protocolos interculturales en 47 lenguas.', paginas: 64, version: '1.5', fecha: 'Abril 2025', dirigido: 'Censistas en zonas indígenas', icono: '🌿', color: '#0D9488', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Manual_Indigenas.pdf' },
    { titulo: 'Manual de Supervisión y Control', descripcion: 'Estándares de calidad, indicadores de cobertura y metodología de verificación aleatoria del operativo.', paginas: 80, version: '2.3', fecha: 'Mayo 2025', dirigido: 'Supervisores departamentales', icono: '🔍', color: '#7C3AED', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Manual_Supervision.pdf' },
    { titulo: 'Manual de Capacitación', descripcion: 'Diseño curricular, dinámicas de aprendizaje y guía para instructores del programa de formación de personal censal.', paginas: 112, version: '1.0', fecha: 'Enero 2025', dirigido: 'Instructores y capacitadores', icono: '🎓', color: '#DC2626', url: 'https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/cpv2017/doc/Manual_Capacitacion.pdf' },
  ];

  // ── GLOSARIO ──────────────────────────────────────────────────────────────
  readonly glosario: GlosarioItem[] = [
    { termino: 'Área de Empadronamiento', categoria: 'Cartografía', definicion: 'Unidad geográfica mínima asignada a un censista. Contiene 80–120 viviendas en zonas urbanas y 40–60 en zonas rurales.' },
    { termino: 'Área Urbana', categoria: 'Territorio', definicion: 'Centro poblado con 2,000 o más habitantes, cuyos pobladores se dedican principalmente a actividades no agrícolas.' },
    { termino: 'Área Rural', categoria: 'Territorio', definicion: 'Centro poblado con menos de 2,000 habitantes, con viviendas dispersas o en pequeños núcleos y actividades principalmente agropecuarias.' },
    { termino: 'Censo de Derecho', categoria: 'Metodología', definicion: 'Modalidad censal que registra a la población según su lugar de residencia habitual, independientemente de dónde se encuentre el día del censo.' },
    { termino: 'Censo de Hecho', categoria: 'Metodología', definicion: 'Modalidad que registra a toda persona presente en el territorio en la fecha de empadronamiento, sin importar su residencia habitual.' },
    { termino: 'Centro Poblado', categoria: 'Territorio', definicion: 'Lugar del territorio nacional con nombre propio donde habitan familias o personas bajo vínculos de vecindad reconocidos.' },
    { termino: 'CPV 2025', categoria: 'Institucional', definicion: 'XII Censo de Población, VII de Vivienda y III de Comunidades Indígenas. Ejecutado por el INEI el 22 de junio de 2025.' },
    { termino: 'Densidad Poblacional', categoria: 'Demografía', definicion: 'Número de habitantes por km². Se calcula dividiendo la población total entre la superficie en km². Indicador de concentración territorial.' },
    { termino: 'Día del Censo', categoria: 'Operativo', definicion: 'Fecha oficial de referencia censal. En el CPV 2025 fue el 22 de junio de 2025 a las 00:00 horas.' },
    { termino: 'Empadronador', categoria: 'Personal', definicion: 'Censista responsable de visitar viviendas, aplicar la cédula y registrar características de hogares y sus miembros.' },
    { termino: 'Encuesta de Cobertura', categoria: 'Calidad', definicion: 'Operación post-censal para estimar la tasa de omisión mediante una muestra aleatoria de hogares.' },
    { termino: 'Hogar Censal', categoria: 'Demografía', definicion: 'Persona o grupo que habita bajo un mismo techo y comparte gastos de alimentación. Puede ser unipersonal o multipersonal.' },
    { termino: 'Índice de Envejecimiento', categoria: 'Demografía', definicion: 'Razón entre la población de 60+ años y menores de 15 años, multiplicada por 100. Mide la transición hacia estructuras más envejecidas.' },
    { termino: 'Macrocefalia Urbana', categoria: 'Territorio', definicion: 'Concentración excesiva de la población en una sola ciudad, generalmente la capital. Lima alberga el 34.5% de la población peruana.' },
    { termino: 'Omisión Censal', categoria: 'Calidad', definicion: 'Porcentaje de personas o viviendas no registradas durante el empadronamiento. Se estima mediante la Encuesta de Cobertura Censal.' },
    { termino: 'PEA', categoria: 'Economía', definicion: 'Población Económicamente Activa. Personas de 14 años y más que trabajan o buscan activamente trabajo remunerado.' },
    { termino: 'Pirámide Poblacional', categoria: 'Demografía', definicion: 'Representación gráfica de la estructura por edad y sexo. La base muestra los más jóvenes y el vértice los de mayor edad.' },
    { termino: 'Razón de Masculinidad', categoria: 'Demografía', definicion: 'Número de hombres por cada 100 mujeres. El CPV 2025 registró una razón nacional de 95.7.' },
    { termino: 'Residencia Habitual', categoria: 'Metodología', definicion: 'Lugar donde la persona vive normalmente y tiene sus principales vínculos sociales y familiares. Criterio básico del CPV 2025.' },
    { termino: 'Sector Cartográfico', categoria: 'Cartografía', definicion: 'Unidad de trabajo de campo delimitada cartográficamente, conformada por manzanas o sectores rurales asignados a un jefe de sección.' },
    { termino: 'Tasa de Crecimiento', categoria: 'Demografía', definicion: 'Indicador del incremento relativo de la población en un período, expresado en porcentaje anual.' },
    { termino: 'Tasa de Fecundidad', categoria: 'Demografía', definicion: 'Número promedio de hijos nacidos vivos que tendría una mujer al finalizar su período fértil (15–49 años).' },
    { termino: 'Tasa de Urbanización', categoria: 'Territorio', definicion: 'Porcentaje de la población que reside en áreas urbanas. En 2025 fue de 79.3% a nivel nacional.' },
    { termino: 'UBIGEO', categoria: 'Cartografía', definicion: 'Código de Ubicación Geográfica de seis dígitos que identifica de manera única a cada departamento, provincia y distrito del Perú.' },
    { termino: 'Vivienda Colectiva', categoria: 'Vivienda', definicion: 'Local para alojamiento de grupos sujetos a normas institucionales: hoteles, hospitales, cuarteles, cárceles, conventos.' },
    { termino: 'Vivienda Particular', categoria: 'Vivienda', definicion: 'Local de habitación sin carácter colectivo destinado a uno o más hogares censales. Unidad básica del censo de vivienda.' },
  ];

  // ── FAQ ───────────────────────────────────────────────────────────────────
  faqs: FaqItem[] = [
    { categoria: 'General', pregunta: '¿Qué es el CPV 2025?', respuesta: 'El Censo de Población y Vivienda 2025 es la operación estadística de mayor envergadura ejecutada por el INEI. Registra en un solo momento las características demográficas, socioeconómicas y habitacionales de toda la población peruana. Es el XII Censo de Población, VII de Vivienda y III de Comunidades Indígenas.', abierto: true },
    { categoria: 'General', pregunta: '¿Cuándo se realizó el Censo 2025?', respuesta: 'El día oficial del Censo fue el 22 de junio de 2025. El empadronamiento se extendió hasta el 6 de julio en zonas accesibles y hasta el 20 de agosto en zonas de difícil acceso de la Amazonía y comunidades indígenas alejadas.', abierto: false },
    { categoria: 'Cobertura', pregunta: '¿A quiénes se empadronó?', respuesta: 'Se registró a toda persona que residía habitualmente en el territorio nacional, incluyendo peruanos y extranjeros. También se empadronó a peruanos en el exterior mediante el Módulo de Peruanos No Residentes, ejecutado con la Cancillería.', abierto: false },
    { categoria: 'Cobertura', pregunta: '¿Cómo se censó a las comunidades nativas?', respuesta: 'Las comunidades nativas de la Amazonía fueron censadas mediante brigadas especiales con traductores en 47 lenguas indígenas. Se utilizaron embarcaciones fluviales y helicópteros en las zonas más alejadas. El III Censo de Comunidades usó una cédula diferenciada adaptada culturalmente.', abierto: false },
    { categoria: 'Metodología', pregunta: '¿Cuál fue el método de empadronamiento?', respuesta: 'Se empleó la Entrevista Directa con Residencia Habitual (censo de derecho). Los censistas visitaron cada vivienda para aplicar la cédula cara a cara. En 68 distritos urbanos se complementó con autoempadronamiento digital, que representó el 8.3% del total.', abierto: false },
    { categoria: 'Metodología', pregunta: '¿Cuántos censistas participaron?', respuesta: 'El CPV 2025 movilizó a 286,742 personas entre empadronadores, jefes de sección, supervisores y coordinadores distritales. Fue el operativo de campo más grande ejecutado por el INEI en su historia institucional.', abierto: false },
    { categoria: 'Privacidad', pregunta: '¿Los datos del Censo son confidenciales?', respuesta: 'Sí. La Ley N° 26229 garantiza el secreto estadístico. Los datos solo se usan con fines estadísticos y nunca se divulgan individualmente. El INEI publica únicamente totales y estadísticas agregadas. Ninguna autoridad puede acceder a información individual.', abierto: false },
    { categoria: 'Resultados', pregunta: '¿Cuándo se publicarán los resultados definitivos?', respuesta: 'Los primeros resultados preliminares del CPV 2025 fueron publicados en octubre de 2025. Los resultados definitivos, con ajustes por omisión y revisión metodológica completa, se publicarán progresivamente durante 2026 en inei.gob.pe.', abierto: false },
    { categoria: 'Resultados', pregunta: '¿Dónde puedo acceder a los microdatos?', respuesta: 'Los microdatos anonimizados estarán disponibles en el Sistema de Diseminación Censal del INEI y en datosabiertos.gob.pe. Se requiere registro previo. Los archivos se publicarán en formatos SPSS, Stata, CSV y R durante el primer semestre de 2026.', abierto: false },
    { categoria: 'Tecnología', pregunta: '¿Se usó tecnología digital?', respuesta: 'Sí. Por primera vez en la historia censal peruana, el 34% de los empadronadores usaron tabletas electrónicas (CAPI). El resto usó cédulas en papel con lectura óptica. También se implementó geolocalización GPS para el control cartográfico de cobertura.', abierto: false },
    { categoria: 'Tecnología', pregunta: '¿Qué es el autoempadronamiento digital?', respuesta: 'Es la modalidad donde el jefe de hogar completa la cédula censal vía web sin esperar al censista. Estuvo disponible en 68 distritos urbanos durante los 15 días previos al Día del Censo. Representó el 8.3% del total de hogares empadronados.', abierto: false },
    { categoria: 'Comparativo', pregunta: '¿Qué cambios hubo respecto al CPV 2017?', respuesta: 'El CPV 2025 incorporó 23 nuevas variables frente al censo anterior: identidad de género, acceso a internet, trabajo remoto, uso de energías renovables y condiciones de habitabilidad frente al cambio climático. También se mejoró la captación de población indígena y afrodescendiente.', abierto: false },
  ];

  // ── INDICADORES ───────────────────────────────────────────────────────────
  readonly indicadores: Indicador[] = [
    { nombre: 'Tasa de Crecimiento Intercensal', formula: 'TCP = [(P₂ / P₁)^(1/t) − 1] × 100', descripcion: 'Mide la variación relativa de la población entre dos censos. En el CPV 2025 se calculó respecto al CPV 2017 (8 años).', interpretacion: 'El Perú registró una TCP de 0.81% anual, la más baja desde el inicio de los censos modernos. Confirma la consolidación de la transición demográfica hacia crecimiento lento.', ejemplo: '0.81% anual', valor: 32, color: '#8B4996', unidad: 'Porcentaje anual (%)', fuente: 'INEI — CPV 2025 vs CPV 2017', tendencia: 'baja' },
    { nombre: 'Índice de Envejecimiento', formula: 'IE = (Pob ≥60 años / Pob <15 años) × 100', descripcion: 'Relaciona adultos mayores con menores de 15 años. Un IE superior a 100 indica más adultos mayores que niños.', interpretacion: 'El IE pasó de 29.7 en 2017 a 37.9 en 2025. Regiones como Moquegua (IE=62.3) y Arequipa (IE=55.8) lideran el proceso de envejecimiento.', ejemplo: '37.9 pts', valor: 38, color: '#C2264B', unidad: 'Adultos mayores por cada 100 menores de 15', fuente: 'INEI — CPV 2025', tendencia: 'sube' },
    { nombre: 'Razón de Masculinidad', formula: 'RM = (Pob Masculina / Pob Femenina) × 100', descripcion: 'Indica cuántos hombres existen por cada 100 mujeres. Valores inferiores a 100 indican mayor presencia femenina.', interpretacion: 'La RM nacional es 95.7, coherente con la sobremortalidad masculina. En edades 60+, cae a 83.4 por mayor esperanza de vida femenina.', ejemplo: '95.7', valor: 57, color: '#009FE3', unidad: 'Hombres por cada 100 mujeres', fuente: 'INEI — CPV 2025', tendencia: 'estable' },
    { nombre: 'Tasa Global de Fecundidad', formula: 'TGF = Σ TFx × 5 (grupos quinquenales 15–49)', descripcion: 'Número promedio de hijos por mujer al finalizar su vida fértil. El nivel de reemplazo es 2.1 hijos por mujer.', interpretacion: 'La TGF descendió a 2.3 hijos (era 2.6 en 2017). La mayor caída ocurrió en sierra rural, aunque sigue siendo superior al promedio urbano de 1.8.', ejemplo: '2.3 hijos', valor: 46, color: '#F59E0B', unidad: 'Hijos por mujer (período fértil completo)', fuente: 'INEI — ED 2024 / CPV 2025', tendencia: 'baja' },
    { nombre: 'Tasa de Urbanización', formula: 'TU = (Pob en Áreas Urbanas / Pob Total) × 100', descripcion: 'Porcentaje de la población en centros con 2,000+ habitantes. Refleja el proceso de migración campo-ciudad.', interpretacion: 'El 79.3% de los peruanos reside en áreas urbanas (77.2% en 2017). Lima concentra el 34.5% de la población nacional, evidenciando alta macrocefalia urbana.', ejemplo: '79.3%', valor: 79, color: '#059669', unidad: 'Porcentaje de población urbana (%)', fuente: 'INEI — CPV 2025', tendencia: 'sube' },
    { nombre: 'Densidad Poblacional', formula: 'D = Población Total / Superficie (km²)', descripcion: 'Concentración de habitantes por unidad de área. Permite identificar territorios con presión demográfica y zonas con potencial.', interpretacion: 'Densidad nacional de 27.7 hab/km² con distribución muy desigual: Costa 136.2, Sierra 22.4, Selva 3.8. Lima ciudad supera los 11,000 hab/km².', ejemplo: '27.7 hab/km²', valor: 21, color: '#DC2626', unidad: 'Habitantes por kilómetro cuadrado', fuente: 'INEI — CPV 2025 / IGN', tendencia: 'sube' },
    { nombre: 'Tasa de Dependencia', formula: 'TD = [(Pob <15 + Pob ≥65) / Pob 15–64] × 100', descripcion: 'Relaciona la población dependiente con la población en edad productiva. Indica la carga demográfica sobre la PEA.', interpretacion: 'TD total de 55.3 por cada 100 en edad activa. La dependencia juvenil (40.1) supera a la de adultos mayores (15.2), aunque la brecha se reduce por el envejecimiento.', ejemplo: '55.3', valor: 55, color: '#7C3AED', unidad: 'Personas dependientes por 100 en edad activa', fuente: 'INEI — CPV 2025', tendencia: 'estable' },
    { nombre: 'Esperanza de Vida al Nacer', formula: 'EV = ∫₀^∞ S(x) dx  (tabla de vida abreviada)', descripcion: 'Años promedio que viviría un recién nacido si las condiciones de mortalidad actuales se mantuvieran constantes.', interpretacion: 'La esperanza de vida aumentó a 76.4 años (hombres: 73.8, mujeres: 79.1). Moquegua lidera con 80.2 años promedio. La brecha de género es de 5.3 años.', ejemplo: '76.4 años', valor: 76, color: '#0D9488', unidad: 'Años de vida esperados al nacer', fuente: 'INEI — Tablas de Mortalidad 2023–2025', tendencia: 'sube' },
  ];

  toggleFaq(i: number): void {
    this.faqs = this.faqs.map((f, idx) =>
      idx === i ? { ...f, abierto: !f.abierto } : f
    );
  }
}