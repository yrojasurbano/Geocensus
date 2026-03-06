// RUTA: src/app/components/features/organizacion/organizacion.component.ts

import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-organizacion',
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
          <h1 class="text-3xl md:text-4xl font-black text-white">Organización</h1>
          <p class="text-white/80 mt-2 text-sm md:text-base max-w-2xl">Estructura organizacional, jerarquías y fases operativas del Censo de Población y Vivienda 2025.</p>
        </div>
      </div>

      <!-- MAIN -->
      <main class="flex-1 py-12 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">

          <!-- Niveles jerárquicos -->
          <section class="mb-14">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-1 h-8 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
              <h2 class="text-2xl font-black text-gray-800">Estructura Organizacional</h2>
            </div>

            <!-- Nivel 1 — Conducción Nacional -->
            <div class="flex flex-col items-center mb-2">
              <div class="bg-gradient-to-br from-[#0056a1] to-[#343b9f] text-white rounded-2xl px-8 py-5 text-center shadow-lg w-full max-w-sm">
                <mat-icon class="!text-3xl mb-1">account_balance</mat-icon>
                <div class="font-black text-base">Conducción Nacional</div>
                <div class="text-xs text-white/70 mt-1">Jefatura del INEI</div>
              </div>
              <div class="w-0.5 h-8 bg-gray-200"></div>
            </div>

            <!-- Nivel 2 — Dirección Técnica -->
            <div class="flex flex-col items-center mb-2">
              <div class="bg-gradient-to-br from-[#038dd3] to-[#0056a1] text-white rounded-2xl px-8 py-5 text-center shadow-md w-full max-w-md">
                <mat-icon class="!text-2xl mb-1">settings</mat-icon>
                <div class="font-black text-base">Dirección Técnica del Censo</div>
                <div class="text-xs text-white/70 mt-1">Planificación, metodología y control de calidad</div>
              </div>
              <div class="w-0.5 h-8 bg-gray-200"></div>
            </div>

            <!-- Nivel 3 — Coordinaciones -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              @for (coord of coordinaciones; track coord.titulo) {
                <div class="bg-white border-2 border-[#0056a1]/20 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow hover:border-[#0056a1]/50">
                  <div class="w-10 h-10 rounded-full bg-[#0056a1]/10 flex items-center justify-center mx-auto mb-3">
                    <mat-icon class="text-[#0056a1] !text-lg">{{ coord.icon }}</mat-icon>
                  </div>
                  <div class="font-black text-sm text-gray-800">{{ coord.titulo }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ coord.descripcion }}</div>
                </div>
              }
            </div>

            <!-- Conector -->
            <div class="flex justify-center mb-2">
              <div class="w-0.5 h-8 bg-gray-200"></div>
            </div>

            <!-- Nivel 4 — Campo -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              @for (campo of nivelCampo; track campo.titulo) {
                <div class="bg-gradient-to-br from-[#33b3a9]/10 to-[#33b3a9]/5 border border-[#33b3a9]/20 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div class="w-12 h-12 rounded-xl bg-[#33b3a9] flex items-center justify-center shrink-0">
                    <mat-icon class="text-white !text-xl">{{ campo.icon }}</mat-icon>
                  </div>
                  <div>
                    <div class="font-black text-sm text-gray-800">{{ campo.titulo }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ campo.descripcion }}</div>
                    <div class="text-[11px] font-bold text-[#33b3a9] mt-1">{{ campo.cantidad }}</div>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Fases operativas -->
          <section class="mb-14">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-1 h-8 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
              <h2 class="text-2xl font-black text-gray-800">Fases Operativas</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              @for (fase of fases; track fase.numero; let i = $index) {
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4 items-start hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                       [style.background]="'linear-gradient(135deg, ' + fase.colorA + ',' + fase.colorB + ')'">
                    {{ fase.numero }}
                  </div>
                  <div>
                    <h3 class="font-black text-sm text-gray-800 mb-1">{{ fase.titulo }}</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">{{ fase.descripcion }}</p>
                    <div class="mt-2 text-[11px] font-bold text-gray-400 flex items-center gap-1">
                      <mat-icon class="!text-xs !w-3 !h-3">schedule</mat-icon>
                      {{ fase.periodo }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Recursos -->
          <section class="bg-gradient-to-br from-[#0056a1]/5 to-[#33b3a9]/5 rounded-3xl p-8 border border-[#0056a1]/10">
            <h3 class="font-black text-base text-gray-700 mb-6 text-center uppercase tracking-wider">Recursos Movilizados</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              @for (r of recursos; track r.label) {
                <div>
                  <mat-icon class="!text-3xl" [style.color]="r.color">{{ r.icon }}</mat-icon>
                  <div class="text-3xl font-black text-[#0056a1] mt-1">{{ r.valor }}</div>
                  <div class="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">{{ r.label }}</div>
                </div>
              }
            </div>
          </section>

        </div>
      </main>

      <!-- FOOTER -->
      <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24">
        <div class="max-w-7xl mx-auto flex flex-col items-center md:items-end gap-4 w-full">
          <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
          <p class="text-sm text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
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
export class OrganizacionComponent {
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

  coordinaciones = [
    { icon: 'route',     titulo: 'Coordinación de Campo',         descripcion: 'Supervisión de brigadas y jornadas de empadronamiento a nivel nacional.' },
    { icon: 'data_usage',titulo: 'Coordinación de Procesamiento', descripcion: 'Captura digital, validación y consolidación de las cédulas censales.' },
    { icon: 'campaign',  titulo: 'Coordinación de Comunicación',  descripcion: 'Difusión, sensibilización ciudadana y relaciones interinstitucionales.' },
  ];

  nivelCampo = [
    { icon: 'map',       titulo: 'Coordinadores Regionales',   descripcion: 'Responsables de la ejecución en cada departamento del país.',          cantidad: '25 coordinadores (1 por departamento)' },
    { icon: 'groups',    titulo: 'Supervisores Provinciales',  descripcion: 'Apoyo técnico y logístico a las brigadas distritales de empadronadores.', cantidad: '196 supervisores a nivel nacional' },
    { icon: 'person_pin',titulo: 'Jefes de Zona Distrital',    descripcion: 'Control operativo de la cobertura geográfica en cada distrito asignado.',cantidad: '~1,874 jefes de zona' },
    { icon: 'badge',     titulo: 'Empadronadores de Campo',    descripcion: 'Personal de contacto directo con los hogares para el llenado de cédulas.',cantidad: '~85,000 empadronadores capacitados' },
  ];

  fases = [
    { numero:'01', titulo:'Actualización Cartográfica',    descripcion:'Revisión y actualización del mapeado digital de manzanas, sectores y segmentos censales en todo el territorio.',                        periodo:'2023 – 2024',  colorA:'#343b9f', colorB:'#0056a1' },
    { numero:'02', titulo:'Capacitación del Personal',     descripcion:'Formación de coordinadores regionales, supervisores, jefes de zona y empadronadores mediante cursos presenciales y virtuales.',         periodo:'Ene – Mar 2025', colorA:'#0056a1', colorB:'#038dd3' },
    { numero:'03', titulo:'Pre-empadronamiento',           descripcion:'Visita previa a hogares de zonas especiales, comunidades indígenas y áreas de difícil acceso para asegurar la cobertura.',              periodo:'Mar – Abr 2025', colorA:'#038dd3', colorB:'#33b3a9' },
    { numero:'04', titulo:'Empadronamiento Nacional',      descripcion:'Levantamiento simultáneo en todo el territorio nacional. Aplicación de la cédula censal en cada vivienda particular y colectiva.',      periodo:'May 2025',       colorA:'#33b3a9', colorB:'#0056a1' },
    { numero:'05', titulo:'Crítica y Codificación',        descripcion:'Revisión manual y electrónica de consistencia, detección de errores y codificación de variables de respuesta abierta.',                periodo:'May – Jun 2025', colorA:'#0056a1', colorB:'#343b9f' },
    { numero:'06', titulo:'Procesamiento y Resultados',   descripcion:'Digitalización, validación estadística, tabulación y generación de bases de datos para la publicación de resultados preliminares.',     periodo:'Jun – Dic 2025', colorA:'#343b9f', colorB:'#33b3a9' },
  ];

  recursos = [
    { icon: 'badge',        color: '#0056a1', valor: '85K+',    label: 'Empadronadores' },
    { icon: 'devices',      color: '#33b3a9', valor: '85K+',    label: 'Tablets / PDA' },
    { icon: 'home_work',    color: '#038dd3', valor: '10M+',    label: 'Viviendas' },
    { icon: 'location_on',  color: '#343b9f', valor: '98,416',  label: 'Centros Poblados' },
  ];
}