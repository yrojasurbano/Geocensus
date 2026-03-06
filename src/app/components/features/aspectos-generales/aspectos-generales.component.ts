// RUTA: src/app/components/features/aspectos-generales/aspectos-generales.component.ts

import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aspectos-generales',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen w-full flex flex-col bg-white font-sans">

      <!-- HEADER -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 flex justify-between items-center px-6 py-3 md:px-12 md:py-4 w-full">
        <div class="flex items-center gap-8">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-10 md:h-12 w-auto object-contain">
          <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide text-[#343b9f]">
            <button routerLink="/" class="hover:text-secondary transition-colors uppercase relative group">
              Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/resultados" class="hover:text-secondary transition-colors uppercase relative group">
              Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <div class="relative">
              <button (click)="toggleCensos($event)"
                class="text-primary font-bold uppercase relative group flex items-center gap-1">
                Censos 2025
                <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200" [class.rotate-180]="censosOpen()">expand_more</mat-icon>
                <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"></span>
              </button>
              @if (censosOpen()) {
                <div class="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                     style="animation: dropdownIn 0.18s ease-out forwards">
                  <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                  <ul class="py-1">
                    @for (item of censosMenu; track item.label) {
                      <li>
                        <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                          class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary transition-all flex items-center gap-2 group/item">
                          <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-secondary opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"></span>
                          {{ item.label }}
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
            <button routerLink="/noticias" class="hover:text-secondary transition-colors uppercase relative group">
              Noticias<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
          </nav>
        </div>
        <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45" class="h-9 w-auto object-contain hidden md:block">
      </header>

      <!-- HERO STRIP -->
      <div class="bg-gradient-to-r from-[#0056a1] to-[#33b3a9] py-10 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-1 bg-white/60 rounded-full"></div>
            <span class="text-white/70 text-xs font-bold uppercase tracking-widest">Censos 2025</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-white">Aspectos Generales</h1>
          <p class="text-white/80 mt-2 text-sm md:text-base max-w-2xl">Historia, antecedentes y fundamentos del proceso censal en el Perú.</p>
        </div>
      </div>

      <!-- MAIN -->
      <main class="flex-1 py-12 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">

          <!-- Intro -->
          <section class="mb-14">
            <div class="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 class="text-2xl font-black text-[#0056a1] mb-4">¿Qué son los Censos Nacionales?</h2>
                <p class="text-gray-600 leading-relaxed mb-4">
                  Los Censos Nacionales de Población y Vivienda constituyen la operación estadística más importante que realiza el Estado peruano.
                  Permiten conocer el tamaño, estructura y distribución de la población, así como las características de las viviendas a nivel nacional, regional y local.
                </p>
                <p class="text-gray-600 leading-relaxed">
                  Su realización está mandatada por la Ley N° 25129 y el Reglamento de Organización y Funciones del INEI.
                  Los resultados sirven como base para la planificación del desarrollo nacional y la asignación de recursos del Estado.
                </p>
              </div>
              <div class="bg-[#f4f7f9] rounded-3xl h-64 flex items-center justify-center border border-gray-100">
                <div class="text-center p-8">
                  <mat-icon class="!w-16 !h-16 !text-[4rem] text-[#0056a1]/30">groups</mat-icon>
                  <p class="text-xs text-gray-400 mt-3 font-medium uppercase tracking-wider">Imagen ilustrativa</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Timeline -->
          <section class="mb-14">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-1 h-8 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
              <h2 class="text-2xl font-black text-gray-800">Historia de los Censos en el Perú</h2>
            </div>
            <div class="relative">
              <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0056a1] via-[#33b3a9] to-[#f8bd13] hidden md:block"></div>
              <div class="space-y-6">
                @for (h of timeline; track h.anio) {
                  <div class="flex gap-6 md:gap-10 items-start">
                    <div class="flex flex-col items-center shrink-0 md:w-12">
                      <div class="w-4 h-4 rounded-full border-2 border-[#0056a1] bg-white z-10 hidden md:block"></div>
                      <span class="text-[10px] font-black text-[#0056a1] mt-1 hidden md:block">{{ h.anio }}</span>
                    </div>
                    <div class="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div class="flex items-start gap-4">
                        <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" [style.background]="h.color + '18'">
                          <mat-icon [style.color]="h.color" class="!text-xl">{{ h.icon }}</mat-icon>
                        </div>
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="text-[11px] font-black text-white px-2 py-0.5 rounded-full" [style.background]="h.color">{{ h.anio }}</span>
                            <h3 class="font-black text-sm text-gray-800">{{ h.titulo }}</h3>
                          </div>
                          <p class="text-xs text-gray-500 leading-relaxed">{{ h.descripcion }}</p>
                          @if (h.dato) {
                            <div class="mt-2 inline-flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                              <mat-icon class="!text-xs !w-3 !h-3 text-[#33b3a9]">people</mat-icon>
                              <span class="text-[11px] font-bold text-gray-600">{{ h.dato }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- Objetivos -->
          <section class="mb-14">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-1 h-8 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
              <h2 class="text-2xl font-black text-gray-800">Objetivos del CPV 2025</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              @for (obj of objetivos; track obj.titulo) {
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0056a1] to-[#33b3a9] flex items-center justify-center mb-4">
                    <mat-icon class="text-white !text-xl">{{ obj.icon }}</mat-icon>
                  </div>
                  <h3 class="font-black text-sm text-gray-800 mb-2">{{ obj.titulo }}</h3>
                  <p class="text-xs text-gray-500 leading-relaxed">{{ obj.descripcion }}</p>
                </div>
              }
            </div>
          </section>

          <!-- Cobertura -->
          <section class="bg-gradient-to-br from-[#0056a1]/5 to-[#33b3a9]/5 rounded-3xl p-8 border border-[#0056a1]/10">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              @for (s of cobertura; track s.label) {
                <div>
                  <div class="text-3xl md:text-4xl font-black text-[#0056a1]">{{ s.valor }}</div>
                  <div class="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">{{ s.label }}</div>
                </div>
              }
            </div>
          </section>

        </div>
      </main>

      <!-- FOOTER -->
      <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24">
        <div class="max-w-7xl mx-auto flex flex-col items-center md:items-end gap-4 w-full">
          <p class="font-bold text-base text-center md:text-right">Instituto Nacional de Estadística e Informática – INEI</p>
          <p class="text-sm text-gray-300 text-center md:text-right">Av. General Garzón 658. Jesús María. Lima - Perú</p>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-300">Síguenos:</span>
            <div class="flex gap-3">
              <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AspectosGeneralesComponent {
  censosOpen = signal(false);

  censosMenu = [
    { label: 'Aspectos Generales',    route: '/aspectos-generales' },
    { label: 'Organización',          route: '/organizacion' },
    { label: 'Normativa',             route: '/normativa' },
    { label: 'Documentación Técnica', route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }
  toggleCensos(e: Event) { e.stopPropagation(); this.censosOpen.update(v => !v); }

  timeline = [
    { anio: '1836', icon: 'history_edu',   color: '#343b9f', titulo: 'Primer Censo de la República',          descripcion: 'Primer recuento oficial bajo el gobierno de Andrés de Santa Cruz. Marcó el inicio de la estadística demográfica nacional.', dato: 'Aprox. 1,37 M hab.' },
    { anio: '1940', icon: 'explore',       color: '#0056a1', titulo: 'Primer Censo Nacional Moderno',          descripcion: 'Metodología moderna incorporando variables de vivienda y características socioeconómicas.',                                  dato: '7,0 M hab.' },
    { anio: '1961', icon: 'location_city', color: '#038dd3', titulo: 'Censos Nacionales VII',                  descripcion: 'Primera vez con preguntas sobre migración y nivel educativo. Reveló el inicio del proceso de urbanización acelerada.',     dato: '9,9 M hab.' },
    { anio: '1972', icon: 'apartment',     color: '#33b3a9', titulo: 'Censos Nacionales VIII',                 descripcion: 'Introducción de la automatización en el procesamiento de datos con computadoras de primera generación.',                   dato: '13,5 M hab.' },
    { anio: '1993', icon: 'computer',      color: '#0056a1', titulo: 'Censos Nacionales IX y V',               descripcion: 'Primer censo con lectura óptica de cédulas. Documentó el impacto del conflicto armado y la migración rural-urbana.',       dato: '22,0 M hab.' },
    { anio: '2007', icon: 'bar_chart',     color: '#343b9f', titulo: 'Censos Nacionales XI y VI',              descripcion: 'GPS para cartografía y telefonía celular para supervisión. Primera cobertura total de comunidades nativas.',               dato: '28,2 M hab.' },
    { anio: '2017', icon: 'devices',       color: '#038dd3', titulo: 'Censos Nacionales XII y VII',            descripcion: 'Uso masivo de dispositivos móviles (PDA). Censo de Comunidades Indígenas realizado en paralelo.',                         dato: '31,2 M hab.' },
    { anio: '2025', icon: 'satellite_alt', color: '#33b3a9', titulo: 'Censos Nacionales 2025 — CPV 2025',      descripcion: 'Geolocalización satelital, plataformas digitales en tiempo real e integración con registros administrativos del Estado.',   dato: null },
  ];

  objetivos = [
    { icon: 'groups',      titulo: 'Cuantificar la Población',    descripcion: 'Determinar el volumen, crecimiento, estructura y distribución espacial de la población residente en el territorio nacional.' },
    { icon: 'home',        titulo: 'Caracterizar las Viviendas',  descripcion: 'Conocer las condiciones habitacionales, el acceso a servicios básicos y la tenencia de vivienda a nivel distrital.' },
    { icon: 'analytics',   titulo: 'Planificar el Desarrollo',    descripcion: 'Proveer información estadística de base para la formulación de políticas públicas y la asignación del presupuesto nacional.' },
    { icon: 'map',         titulo: 'Actualizar la Cartografía',   descripcion: 'Renovar el marco cartográfico del país e identificar nuevos centros poblados con límites territoriales precisos.' },
    { icon: 'school',      titulo: 'Medir Indicadores Sociales',  descripcion: 'Obtener indicadores de educación, salud, empleo y pobreza que no pueden calcularse con registros administrativos.' },
    { icon: 'public',      titulo: 'Cumplir Estándares ONU',      descripcion: 'Responder a las recomendaciones de la CEPAL y la ONU para la producción de estadísticas censales comparables.' },
  ];

  cobertura = [
    { valor: '25',     label: 'Departamentos' },
    { valor: '196',    label: 'Provincias' },
    { valor: '1,874',  label: 'Distritos' },
    { valor: '98,416', label: 'Centros Poblados' },
  ];
}