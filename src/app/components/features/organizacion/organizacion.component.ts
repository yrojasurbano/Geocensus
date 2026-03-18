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
        <!-- Logos izquierda -->
        <div class="flex items-center gap-4 md:gap-5">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-10 md:h-12 w-auto object-contain">
          <div class="w-px h-8 md:h-10 bg-gray-200 hidden md:block"></div>
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45"
               class="h-8 md:h-10 w-auto object-contain hidden md:block">
        </div>
        <!-- Nav derecha -->
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide text-[#343b9f]">
            <button routerLink="/" class="hover:text-secondary transition-colors uppercase relative group">
              Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/resultados" class="hover:text-secondary transition-colors uppercase relative group">
              Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <button routerLink="/publicaciones" class="hover:text-secondary transition-colors uppercase relative group">
              Publicaciones<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            <div class="relative">
              <button (click)="toggleCensos($event)"
                class="text-primary font-bold uppercase relative group flex items-center gap-1">
                Censos 2025
                <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200" [class.rotate-180]="censosOpen()">expand_more</mat-icon>
                <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"></span>
              </button>
              @if (censosOpen()) {
                <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
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
      </header>

      <!-- HERO STRIP -->
      <div class="bg-gradient-to-r from-[#0056a1] to-[#33b3a9] py-10 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-1 bg-white/60 rounded-full"></div>
            <span class="text-white/70 text-xs font-bold uppercase tracking-widest">Censos 2025</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-white">Etapas censales</h1>
          <p class="text-white/80 mt-2 text-sm md:text-base max-w-2xl">Antes del operativo censal, operativo censal y después del operativo censal</p>
        </div>
      </div>

      <!-- MAIN -->
      <main class="flex-1 py-12 px-6 md:px-12 lg:px-24">
        <div class="max-w-5xl mx-auto">          

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
      <!-- FOOTER -->
      <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24">
        <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-6 w-full">
          <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
            <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
            <p class="text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
            <div class="flex items-center justify-center md:justify-end gap-4 mt-2">
              <span class="text-sm text-gray-300">Síguenos:</span>
              <div class="flex gap-3">
                <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
                <a href="#" class="hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/><path d="M17.49 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg></a>
              </div>
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
    { label: 'Características del censo',     route: '/aspectos-generales' },
    { label: 'Innovaciones censales',     route: '/innovaciones' },
    { label: 'Etapas censales',           route: '/organizacion' },
    { label: 'Normatividad censal',              route: '/normativa' },
    { label: 'Documentación Técnica',  route: '/documentacion-tecnica' },
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
    { numero:'01', titulo:'Antes del operativo censal',           descripcion:'Visita previa a hogares de zonas especiales, comunidades indígenas y áreas de difícil acceso para asegurar la cobertura.',              periodo:'Mar – Abr 2025', colorA:'#038dd3', colorB:'#33b3a9' },
    { numero:'02', titulo:'Operativo censal',      descripcion:'Levantamiento simultáneo en todo el territorio nacional. Aplicación de la cédula censal en cada vivienda particular y colectiva.',      periodo:'May 2025',       colorA:'#33b3a9', colorB:'#0056a1' },
    { numero:'03', titulo:'Después del operativo censal',   descripcion:'Digitalización, validación estadística, tabulación y generación de bases de datos para la publicación de resultados preliminares.',     periodo:'Jun – Dic 2025', colorA:'#343b9f', colorB:'#33b3a9' },
  ];

  recursos = [
    { icon: 'badge',        color: '#0056a1', valor: '33K+',    label: 'Empadronadores' },
    { icon: 'devices',      color: '#33b3a9', valor: '25K+',    label: 'Tablets / PDA' },
    { icon: 'home_work',    color: '#038dd3', valor: '12M+',    label: 'Viviendas' },
    { icon: 'location_on',  color: '#343b9f', valor: '96,416',  label: 'Centros Poblados' },
  ];
}