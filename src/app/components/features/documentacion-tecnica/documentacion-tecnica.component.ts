// RUTA: src/app/components/features/documentacion-tecnica/documentacion-tecnica.component.ts

import { Component, ChangeDetectionStrategy, signal, computed, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

type Tab1 = 'informes' | 'metodologicos' | 'consultas';
type Tab2Met = 'cedulas' | 'manuales' | 'programa';
type Tab2Con = 'interpretar' | 'glosario' | 'contacto';

@Component({
  selector: 'app-documentacion-tecnica',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen w-full flex flex-col bg-white font-sans">

      <!-- ══ HEADER (patrón news.ts) ════════════════════════════════════════════ -->
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

      <!-- ══ HERO STRIP ══════════════════════════════════════════════════════════ -->
      <div class="bg-gradient-to-r from-[#0056a1] to-[#33b3a9] py-10 px-6 md:px-12 lg:px-24">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-1 bg-white/60 rounded-full"></div>
            <span class="text-white/70 text-xs font-bold uppercase tracking-widest">Censos 2025</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-white">Documentación Técnica</h1>
          <p class="text-white/80 mt-2 text-sm md:text-base max-w-2xl">Informes, metodología, cédulas y recursos para la consulta e interpretación del CPV 2025.</p>
        </div>
      </div>

      <!-- ══ ÁREA PRINCIPAL CON FONDO DEGRADADO ════════════════════════════════ -->
      <main class="flex-1 py-10 px-4 md:px-10 lg:px-20" style="background: rgb(238 238 238)">
        <div class="max-w-6xl mx-auto">

          <!-- ── Tabs Nivel 1 ───────────────────────────────────────────────── -->
          <div class="flex gap-1 md:gap-2 mb-6 flex-wrap">
            @for (tab of tabs1; track tab.value) {
              <button
                (click)="tab1.set(tab.value)"
                class="px-5 py-2.5 rounded-t-xl text-sm font-black transition-all"
                [class.bg-white]="tab1() === tab.value"
                [class.text-primary]="tab1() === tab.value"
                [class.shadow-md]="tab1() === tab.value"
                [class.bg-\[\#33b3a9\]]="tab1() !== tab.value"
                [class.text-white]="tab1() !== tab.value"
                [class.hover\:brightness-125]="tab1() !== tab.value">
                <div class="flex items-center gap-2">
                  <mat-icon class="!text-base !w-4 !h-4">{{ tab.icon }}</mat-icon>
                  {{ tab.label }}
                </div>
              </button>
            }
          </div>

          <!-- ── Contenedor de contenido (blanco sobre degradado) ────────────── -->
          <div class="bg-white rounded-2xl rounded-tl-none shadow-2xl overflow-hidden">
            
            <!-- ════ TAB 2: DOCUMENTOS METODOLÓGICOS ═════════════════════════ -->
            @if (tab1() === 'metodologicos') {
              <div class="p-6 md:p-8">
                <h2 class="text-xl font-black text-gray-800 mb-2">Documentos Metodológicos</h2>
                <!-- Sub-tabs Nivel 2 -->
                <div class="flex gap-1 mb-6 border-b border-gray-100 flex-wrap">
                  @for (sub of subTabsMet; track sub.value) {
                    <button
                      (click)="tab2Met.set(sub.value)"
                      class="px-5 py-2 text-sm font-bold transition-all relative"
                      [class.text-primary]="tab2Met() === sub.value"
                      [class.border-b-2]="tab2Met() === sub.value"
                      [class.border-primary]="tab2Met() === sub.value"
                      [class.text-gray-400]="tab2Met() !== sub.value"
                      [class.hover\:text-gray-600]="tab2Met() !== sub.value">
                      {{ sub.label }}
                    </button>
                  }
                </div>

                <!-- Sub-tab: Cédulas -->
                @if (tab2Met() === 'cedulas') {
                  <div>
                    <p class="text-xs text-gray-500 mb-4">Cédulas censales utilizadas en el levantamiento del CPV 2025.</p>
                    <div class="overflow-x-auto rounded-xl border border-gray-100">
                      <table class="w-full text-sm border-collapse" style="min-width:480px">
                        <thead>
                          <tr>
                            <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Nombre</th>
                            <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Descripción</th>
                            <th class="bg-[#33b3a9] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-24">Descarga</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (doc of cedulas; track doc.id; let even = $even) {
                            <tr class="border-b border-gray-50 hover:bg-[#0056a1]/4 transition-colors"
                                [class.bg-white]="!even" [class.bg-gray-50/50]="even">
                              <td class="px-4 py-3 font-semibold text-gray-800 text-sm">{{ doc.nombre }}</td>
                              <td class="px-4 py-3 text-xs text-gray-500">{{ doc.descripcion }}</td>
                              <td class="px-4 py-3 text-center">
                                <a href="#" class="inline-flex items-center justify-center text-[#0056a1] hover:text-[#33b3a9] transition-colors group">
                                  <svg viewBox="0 0 24 24" class="w-7 h-7 group-hover:scale-110 transition-transform" fill="none">
                                    <rect x="3" y="2" width="18" height="20" rx="3" fill="#e53e3e" opacity="0.12"/>
                                    <rect x="3" y="2" width="18" height="20" rx="3" stroke="#e53e3e" stroke-width="1.5" fill="none"/>
                                    <text x="12" y="14.5" font-family="Arial,sans-serif" font-size="6" font-weight="900" fill="#e53e3e" text-anchor="middle">PDF</text>
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- Sub-tab: Manuales -->
                @if (tab2Met() === 'manuales') {
                  <div>
                    <p class="text-xs text-gray-500 mb-4">Manuales operativos para el personal de campo del CPV 2025.</p>
                    <div class="overflow-x-auto rounded-xl border border-gray-100">
                      <table class="w-full text-sm border-collapse" style="min-width:480px">
                        <thead>
                          <tr>
                            <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Nombre</th>
                            <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Descripción</th>
                            <th class="bg-[#33b3a9] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-24">Descarga</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (doc of manuales; track doc.id; let even = $even) {
                            <tr class="border-b border-gray-50 hover:bg-[#0056a1]/4 transition-colors"
                                [class.bg-white]="!even" [class.bg-gray-50/50]="even">
                              <td class="px-4 py-3 font-semibold text-gray-800 text-sm">{{ doc.nombre }}</td>
                              <td class="px-4 py-3 text-xs text-gray-500">{{ doc.descripcion }}</td>
                              <td class="px-4 py-3 text-center">
                                <a href="#" class="inline-flex items-center justify-center text-[#0056a1] hover:text-[#33b3a9] transition-colors group">
                                  <svg viewBox="0 0 24 24" class="w-7 h-7 group-hover:scale-110 transition-transform" fill="none">
                                    <rect x="3" y="2" width="18" height="20" rx="3" fill="#e53e3e" opacity="0.12"/>
                                    <rect x="3" y="2" width="18" height="20" rx="3" stroke="#e53e3e" stroke-width="1.5" fill="none"/>
                                    <text x="12" y="14.5" font-family="Arial,sans-serif" font-size="6" font-weight="900" fill="#e53e3e" text-anchor="middle">PDF</text>
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- Sub-tab: Programa Censal -->
                @if (tab2Met() === 'programa') {
                  <div>
                    <p class="text-xs text-gray-500 mb-4">Programas censales que organizan y coordinan los operativos del CPV 2025.</p>
                    <div class="overflow-x-auto rounded-xl border border-gray-100">
                      <table class="w-full text-sm border-collapse" style="min-width:480px">
                        <thead>
                          <tr>
                            <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Nombre</th>
                            <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Descripción</th>
                            <th class="bg-[#33b3a9] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-24">Descarga</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (doc of programa; track doc.id; let even = $even) {
                            <tr class="border-b border-gray-50 hover:bg-[#0056a1]/4 transition-colors"
                                [class.bg-white]="!even" [class.bg-gray-50/50]="even">
                              <td class="px-4 py-3 font-semibold text-gray-800 text-sm">{{ doc.nombre }}</td>
                              <td class="px-4 py-3 text-xs text-gray-500">{{ doc.descripcion }}</td>
                              <td class="px-4 py-3 text-center">
                                <a href="#" class="inline-flex items-center justify-center text-[#0056a1] hover:text-[#33b3a9] transition-colors group">
                                  <svg viewBox="0 0 24 24" class="w-7 h-7 group-hover:scale-110 transition-transform" fill="none">
                                    <rect x="3" y="2" width="18" height="20" rx="3" fill="#e53e3e" opacity="0.12"/>
                                    <rect x="3" y="2" width="18" height="20" rx="3" stroke="#e53e3e" stroke-width="1.5" fill="none"/>
                                    <text x="12" y="14.5" font-family="Arial,sans-serif" font-size="6" font-weight="900" fill="#e53e3e" text-anchor="middle">PDF</text>
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
              </div>
            }
            <!-- ════ TAB 1: INFORMES TÉCNICOS ════════════════════════════════ -->
            @if (tab1() === 'informes') {
              <div class="p-6 md:p-8">
                <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h2 class="text-xl font-black text-gray-800">Informes Técnicos</h2>
                    <p class="text-xs text-gray-500 mt-0.5">Documentos de análisis y resultados oficiales del CPV 2025</p>
                  </div>
                  <a href="#" class="inline-flex items-center gap-2 bg-[#0056a1] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#0056a1]/90 transition-colors">
                    <mat-icon class="!text-base !w-4 !h-4">download</mat-icon>
                    Descargar todos
                  </a>
                </div>
                <div class="overflow-x-auto rounded-xl border border-gray-100">
                  <table class="w-full text-sm border-collapse" style="min-width:560px">
                    <thead>
                      <tr>
                        <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Nombre</th>
                        <th class="bg-[#002d5c] text-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Descripción</th>
                        <th class="bg-[#33b3a9] text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-24">Descarga</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (doc of informesTecnicos; track doc.id; let even = $even) {
                        <tr class="border-b border-gray-50 hover:bg-[#0056a1]/4 transition-colors"
                            [class.bg-white]="!even" [class.bg-gray-50/50]="even">
                          <td class="px-4 py-3 font-semibold text-gray-800 text-sm">{{ doc.nombre }}</td>
                          <td class="px-4 py-3 text-xs text-gray-500 max-w-xs">{{ doc.descripcion }}</td>
                          <td class="px-4 py-3 text-center">
                            <a href="#" class="inline-flex items-center justify-center text-[#0056a1] hover:text-[#33b3a9] transition-colors group">
                              <svg viewBox="0 0 24 24" class="w-7 h-7 group-hover:scale-110 transition-transform" fill="none">
                                <rect x="3" y="2" width="18" height="20" rx="3" fill="#e53e3e" opacity="0.12"/>
                                <rect x="3" y="2" width="18" height="20" rx="3" stroke="#e53e3e" stroke-width="1.5" fill="none"/>
                                <text x="12" y="14.5" font-family="Arial,sans-serif" font-size="6" font-weight="900" fill="#e53e3e" text-anchor="middle">PDF</text>
                              </svg>
                            </a>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
            <!-- ════ TAB 3: CONSULTAS ════════════════════════════════════════ -->
            @if (tab1() === 'consultas') {
              <div class="p-6 md:p-8">
                <h2 class="text-xl font-black text-gray-800 mb-2">Consultas</h2>
                <!-- Sub-tabs Nivel 2 -->
                <div class="flex gap-1 mb-6 border-b border-gray-100 flex-wrap">
                  @for (sub of subTabsCon; track sub.value) {
                    <button
                      (click)="tab2Con.set(sub.value)"
                      class="px-5 py-2 text-sm font-bold transition-all"
                      [class.text-primary]="tab2Con() === sub.value"
                      [class.border-b-2]="tab2Con() === sub.value"
                      [class.border-primary]="tab2Con() === sub.value"
                      [class.text-gray-400]="tab2Con() !== sub.value"
                      [class.hover\:text-gray-600]="tab2Con() !== sub.value">
                      {{ sub.label }}
                    </button>
                  }
                </div>

                <!-- Sub-tab: Interpretar -->
                @if (tab2Con() === 'interpretar') {
                  <div>
                    <p class="text-sm text-gray-600 leading-relaxed mb-6">
                      Guía para la lectura e interpretación correcta de los datos estadísticos del CPV 2025.
                      Ideal para investigadores, periodistas, funcionarios públicos y ciudadanía en general.
                    </p>
                    <div class="grid md:grid-cols-2 gap-4 mb-8">
                      @for (concepto of conceptosClave; track concepto.titulo) {
                        <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div class="flex items-center gap-2 mb-2">
                            <div class="w-2 h-2 rounded-full bg-[#0056a1]"></div>
                            <h4 class="font-black text-sm text-gray-800">{{ concepto.titulo }}</h4>
                          </div>
                          <p class="text-xs text-gray-500 leading-relaxed">{{ concepto.descripcion }}</p>
                        </div>
                      }
                    </div>
                    <div class="bg-[#0056a1]/5 rounded-2xl p-6 border border-[#0056a1]/10 mb-6">
                      <h4 class="font-black text-sm text-[#0056a1] mb-4">Preguntas Frecuentes</h4>
                      <div class="space-y-3">
                        @for (faq of faqs; track faq.pregunta) {
                          <div class="bg-white rounded-xl p-4 border border-gray-100">
                            <p class="font-bold text-sm text-gray-800 mb-1">{{ faq.pregunta }}</p>
                            <p class="text-xs text-gray-500 leading-relaxed">{{ faq.respuesta }}</p>
                          </div>
                        }
                      </div>
                    </div>
                    <a href="#" class="inline-flex items-center gap-2 bg-[#0056a1] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#0056a1]/90 transition-colors">
                      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" fill="white" opacity="0.2"/><rect x="3" y="2" width="18" height="20" rx="3" stroke="white" stroke-width="1.5" fill="none"/><text x="12" y="14.5" font-family="Arial,sans-serif" font-size="5" font-weight="900" fill="white" text-anchor="middle">PDF</text></svg>
                      Descargar guía completa
                    </a>
                  </div>
                }

                <!-- Sub-tab: Glosario -->
                @if (tab2Con() === 'glosario') {
                  <div>
                    <p class="text-xs text-gray-500 mb-6">Definiciones oficiales de los conceptos y términos técnicos utilizados en el CPV 2025.</p>
                    <div class="space-y-3">
                      @for (term of glosario; track term.termino) {
                        <div class="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#0056a1]/20 transition-colors">
                          <div class="shrink-0">
                            <span class="inline-block w-8 h-8 rounded-lg bg-[#0056a1] text-white text-xs font-black flex items-center justify-center">
                              {{ term.termino[0] }}
                            </span>
                          </div>
                          <div>
                            <h4 class="font-black text-sm text-gray-800">{{ term.termino }}</h4>
                            <p class="text-xs text-gray-500 leading-relaxed mt-1">{{ term.definicion }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Sub-tab: Contáctanos -->
                @if (tab2Con() === 'contacto') {
                  <div>
                    <div class="grid md:grid-cols-2 gap-8">
                      <!-- Información de contacto -->
                      <div class="space-y-4">
                        @for (c of contactos; track c.label) {
                          <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [style.background]="c.color + '18'">
                              <mat-icon [style.color]="c.color" class="!text-xl">{{ c.icon }}</mat-icon>
                            </div>
                            <div>
                              <div class="text-xs font-black text-gray-400 uppercase tracking-wider">{{ c.label }}</div>
                              <div class="text-sm font-semibold text-gray-800 mt-0.5">{{ c.valor }}</div>
                            </div>
                          </div>
                        }
                      </div>
                      <!-- Redes sociales -->
                      <div>
                        <h4 class="font-black text-sm text-gray-700 mb-4 uppercase tracking-wider">Redes Sociales</h4>
                        <div class="grid grid-cols-3 gap-3">
                          @for (red of redes; track red.nombre) {
                            <a [href]="red.url" target="_blank"
                               class="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#0056a1]/30 hover:bg-[#0056a1]/5 transition-all group">
                              <div [innerHTML]="red.svgIcon" class="w-8 h-8 group-hover:scale-110 transition-transform"></div>
                              <span class="text-[10px] font-bold text-gray-500">{{ red.nombre }}</span>
                            </a>
                          }
                        </div>
                        <!-- Dirección central -->
                        <div class="mt-5 p-4 bg-[#0056a1]/5 rounded-xl border border-[#0056a1]/10">
                          <div class="flex items-center gap-2 mb-1">
                            <mat-icon class="text-[#0056a1] !text-lg">location_on</mat-icon>
                            <span class="text-xs font-black text-[#0056a1] uppercase tracking-wider">Sede Central INEI</span>
                          </div>
                          <p class="text-xs text-gray-600">Av. General Garzón 658, Jesús María, Lima 15072</p>
                          <p class="text-xs text-gray-400 mt-1">Horario de atención: Lun–Vie 8:30 – 17:00 h</p>
                        </div>
                      </div>
                    </div>
                  </div>
                }

              </div>
            }
            <!-- /tabs -->
          </div>
        </div>
      </main>

      <!-- ══ FOOTER ══════════════════════════════════════════════════════════════ -->
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
export class DocumentacionTecnicaComponent {

  // ── State ──────────────────────────────────────────────────────────────────
  censosOpen = signal(false);
  tab1       = signal<Tab1>('metodologicos');
  tab2Met    = signal<Tab2Met>('cedulas');
  tab2Con    = signal<Tab2Con>('interpretar');

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }
  toggleCensos(e: Event) { e.stopPropagation(); this.censosOpen.update(v => !v); }

  // ── Nav ────────────────────────────────────────────────────────────────────
  censosMenu = [
    { label: 'Características del censo',     route: '/aspectos-generales' },
    { label: 'Innovaciones censales',           route: '/innovaciones' },
    { label: 'Etapas Censales',           route: '/organizacion' },
    { label: 'Normatividad censal',              route: '/normativa' },
    { label: 'Documentación Técnica',  route: '/documentacion-tecnica' },
  ];

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabs1 = [
    { label: 'Documentos Metodológicos',   value: 'metodologicos'  as Tab1, icon: 'description' },
    { label: 'Informes Técnicos',          value: 'informes'       as Tab1, icon: 'assessment' },
    { label: 'Consultas',                  value: 'consultas'      as Tab1, icon: 'help_outline' },
  ];
  subTabsMet = [
    { label: 'Cédulas',  value: 'cedulas'  as Tab2Met },
    { label: 'Manuales', value: 'manuales' as Tab2Met },
    { label: 'Programa Censal', value: 'programa' as Tab2Met },
  ];
  subTabsCon = [
    { label: '¿Cómo interpretar los datos?', value: 'interpretar' as Tab2Con },
    { label: 'Glosario',                     value: 'glosario'    as Tab2Con },
    { label: 'Contáctanos',                  value: 'contacto'    as Tab2Con },
  ];

  // ── Datos: Informes Técnicos ──────────────────────────────────────────────
  informesTecnicos = [
    { id:1, nombre:'Resultados Preliminares — Población Nacional',   descripcion:'Cifras iniciales de población total, urbana y rural por departamento.',       tamano:'4.8 MB' },
    { id:2, nombre:'Resultados Preliminares — Vivienda',             descripcion:'Condiciones habitacionales, servicios básicos y materiales predominantes.',    tamano:'3.2 MB' },
    { id:3, nombre:'Ficha Técnica del CPV 2025',                     descripcion:'Metodología, cobertura geográfica, período de empadronamiento y errores.',     tamano:'1.1 MB' },
    { id:4, nombre:'Indicadores de Cobertura Censal',                descripcion:'Tasa de cobertura, omisiones y comparación con proyecciones poblacionales.',   tamano:'2.0 MB' },
    { id:5, nombre:'Informe de Comunidades Nativas e Indígenas',     descripcion:'Resultados del censo de comunidades indígenas de la Amazonía y Andes.',        tamano:'5.6 MB' },
  ];

  // ── Datos: Cédulas ─────────────────────────────────────────────────────────
  cedulas = [
    { id:1, nombre:'Cédula Censal de Población y Vivienda',         descripcion:'Cuestionario utilizado para registrar información de la vivienda, el hogar y las personas durante el censo.' },
    { id:2, nombre:'Cédula de Comunidades Indígenas',               descripcion:'Cuestionario aplicado para recoger información de las comunidades indígenas durante el censo.' },
   ];

  // ── Datos: Manuales ────────────────────────────────────────────────────────
  manuales = [
    { id:1, nombre:'Manual del Coordinador Departamental Censal - Población y Vivienda',             descripcion:'Guía para organizar y supervisar el operativo censal de población y vivienda a nivel departamental.' },
    { id:2, nombre:'Manual del Coordinador Departamental - Comunidades Indígenas',             descripcion:'Guía para coordinar y supervisar el operativo censal en comunidades indígenas a nivel departamental. ' },
    { id:3, nombre:'Manual del Coordinador de Subsede Departamental Censal de Población y Vivienda',    descripcion:'Guía para apoyar la coordinación y supervisión del censo de población y vivienda desde la subsede departamental.' },
    { id:4, nombre:'Manual del Supervisor del Sector Censal - Población y Vivienda',     descripcion:'Guía para supervisar y orientar el levantamiento de información en los sectores censales de población y vivienda.' },
    { id:5, nombre:'Manual del Jefe de Sección Censal - Población de Vivienda', descripcion:'Documento que establece las funciones y procedimientos para la organización y control del trabajo censal en la sección.' },
    { id:6, nombre:'Manual del Jefe de Brigada Censal - Comunidades Indígenas', descripcion:'Documento que establece las funciones y procedimientos para la organización y supervisión del operativo censal en comunidades indígenas.' },
    { id:7, nombre:'Manual del Censista - Población y Vivienda', descripcion:'Documento que establece las instrucciones para la recolección de información de población y vivienda durante el censo nacional. ' },
    { id:8, nombre:'Manual del Censista - Comunidades Indígenas', descripcion:'Documento que establece las instrucciones para la recolección de información en comunidades indígenas durante el empadronamiento censal.' },
    { id:9, nombre:'Manual de Reasignación - Población y Vivienda', descripcion:'Documento que establece los procedimientos para la reasignación de cargas de trabajo en el operativo censal de población y vivienda.' },
    { id:10, nombre:'Instructivo del Uso de la Tableta (Tableta Lenovo)', descripcion:'Documento que describe el uso y manejo de la tableta para el registro de información durante el trabajo censal. ' },
    { id:11, nombre:'Instructivo del Censo en Línea para el Personal Operativo', descripcion:'Documento que establece las instrucciones para el registro y gestión de información en el sistema de censo en línea.' },
    { id:12, nombre:'Instructivo del Asistente Virtual Yanapaq 2025', descripcion:'Documento que describe el uso del asistente virtual Yanapaq como apoyo al operativo censal.' },
    { id:13, nombre:'Instructivo de Módulo del Jefe de Sección - Población y Vivienda', descripcion:'Documento que establece las instrucciones para el uso del módulo a utilizar el jefe de sección durante el operativo censal.' },
    { id:14, nombre:'Instructivo del Operativo de Viviendas Colectivas', descripcion:'Documento que describe los procedimientos para el registro de información en viviendas colectivas durante el censo.' },
    { id:15, nombre:'Instructivo del Operativo de Personas sin Vivienda', descripcion:'Documento que establece los procedimientos para registrar información de personas sin vivienda (vivencia en calle).' },
  ];

   // ── Datos: programa ────────────────────────────────────────────────────────
  programa = [
    { id:1, nombre:'Programa Censal - Población y Vivienda',             descripcion:'Plan que organiza y coordina el operativo censal de población y vivienda.' },
    { id:2, nombre:'Programa Censal - Población y Vivienda',             descripcion:'Plan que organiza y coordina el operativo censal de población y vivienda.' },
    ];

  // ── Datos: Interpretar ─────────────────────────────────────────────────────
  conceptosClave = [
    { titulo:'Tasa de Crecimiento Intercensal',  descripcion:'Mide el cambio porcentual anual de la población entre dos censos. Se expresa como porcentaje promedio anual.' },
    { titulo:'Relación de Masculinidad',         descripcion:'Número de hombres por cada 100 mujeres. Un valor > 100 indica predominio masculino y < 100 predominio femenino.' },
    { titulo:'Densidad Poblacional',             descripcion:'Cociente entre la población total y la superficie en km². Expresa la concentración territorial de habitantes.' },
    { titulo:'Edad Mediana',                     descripcion:'Valor que divide la distribución etaria en dos partes iguales. Indica si la población es joven o envejecida.' },
    { titulo:'Población Urbana',                 descripcion:'Aquella residente en centros poblados con 2,000 o más habitantes, conforme a la definición del INEI.' },
    { titulo:'Índice de Envejecimiento',         descripcion:'Razón entre la población de 65 años o más y la población de 0 a 14 años, multiplicada por 100.' },
  ];

  faqs = [
    { pregunta:'¿Los datos son definitivos?',         respuesta:'No. Se trata de resultados preliminares sujetos a revisión y actualización en la publicación definitiva del INEI.' },
    { pregunta:'¿Cómo se calcula la tasa de omisión?', respuesta:'A través de una Encuesta Post-Censal (EPC) que evalúa la cobertura comparando las cifras censales con estimaciones estadísticas independientes.' },
    { pregunta:'¿Qué significa "vivienda particular"?', respuesta:'Toda vivienda destinada a ser ocupada por uno o más hogares de manera habitual. Excluye hoteles, hospitales, cuarteles y similares.' },
  ];

  // ── Datos: Glosario ────────────────────────────────────────────────────────
  glosario = [
    { termino:'Censo',              definicion:'Operación estadística que recopila datos de todos los individuos u objetos de una población en un momento determinado.' },
    { termino:'Cédula Censal',      definicion:'Formulario oficial mediante el cual se registran las respuestas del empadronado durante la visita del censista.' },
    { termino:'Empadronamiento',    definicion:'Proceso de registro de personas y viviendas realizado por empadronadores entrenados en cada unidad geográfica asignada.' },
    { termino:'Hogar Censal',       definicion:'Persona o conjunto de personas que comparten una vivienda y satisfacen sus necesidades alimenticias de forma conjunta.' },
    { termino:'Manzana Censal',     definicion:'Unidad básica de trabajo de campo delimitada por vías o límites naturales, utilizada para organizar el empadronamiento.' },
    { termino:'Sección Censal',     definicion:'Agrupación de manzanas censales asignada a un empadronador para su cobertura completa durante la jornada censal.' },
    { termino:'Segmento Censal',    definicion:'Subdivisión de la sección utilizada en áreas rurales donde la unidad manzana no es aplicable por dispersión geográfica.' },
    { termino:'Tasa de Omisión',    definicion:'Porcentaje de personas o viviendas que no fueron captadas durante el empadronamiento. Se estima con la Encuesta Post-Censal.' },
  ];

  // ── Datos: Contactos ───────────────────────────────────────────────────────
  contactos = [
    { label:'Teléfono Central',  icon:'phone',      color:'#0056a1', valor:'(01) 203-2600 / 203-2700' },
    { label:'Correo Institucional', icon:'email',   color:'#33b3a9', valor:'censos2025@inei.gob.pe' },
    { label:'Mesa de Partes',    icon:'inbox',      color:'#038dd3', valor:'Av. General Garzón 658, Jesús María' },
    { label:'Biblioteca Virtual',icon:'library_books', color:'#343b9f', valor:'www.inei.gob.pe/biblioteca' },
  ];

  redes = [
    { nombre:'Twitter / X',  url:'https://x.com/INEI_oficial',                    svgIcon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>` },
    { nombre:'Facebook',     url:'https://www.facebook.com/INEIpaginaOficial',    svgIcon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1877f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>` },
    { nombre:'Instagram',    url:'https://www.instagram.com/inei_peru',           svgIcon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e1306c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>` },
    { nombre:'YouTube',      url:'https://www.youtube.com/@INEIPeru',             svgIcon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>` },
    { nombre:'TikTok',       url:'https://www.tiktok.com/@ineiperu',              svgIcon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#010101" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>` },
    { nombre:'LinkedIn',     url:'https://www.linkedin.com/company/inei-peru',   svgIcon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0077b5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>` },
  ];
}