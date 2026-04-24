// RUTA: src/app/components/features/aspectos-generales/aspectos-generales.component.ts

import {
  Component,
  ChangeDetectionStrategy,
  signal,
  HostListener,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aspectos-generales',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen w-full flex flex-col bg-white font-sans overflow-hidden">

      <!-- ══════════════════════════════════════════════════════
           HEADER — fijo, z-50
      ═══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm z-50 flex justify-between items-center
                     px-6 py-2 md:px-12 w-full shrink-0">
        <div class="flex items-center gap-4 md:gap-5">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-10 md:h-11 w-auto object-contain">
          <div class="w-px h-8 bg-gray-200 hidden md:block"></div>
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45"
               class="h-8 md:h-10 w-auto object-contain hidden md:block">
        </div>
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide text-[#343b9f]">
          <button routerLink="/" class="hover:text-[#33b3a9] transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/resultados" class="hover:text-[#33b3a9] transition-colors uppercase relative group">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)"
              class="text-[#0056a1] font-bold uppercase relative group flex items-center gap-1">
              Censos 2025
              <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200"
                        [class.rotate-180]="censosOpen()">expand_more</mat-icon>
              <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-[#0056a1]"></span>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards">
                <div class="h-1 w-full bg-gradient-to-r from-[#0056a1] to-[#33b3a9]"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700
                               hover:bg-gradient-to-r hover:from-[#0056a1]/10 hover:to-[#33b3a9]/10
                               hover:text-[#0056a1] transition-all flex items-center gap-2 group/item">
                        <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#0056a1] to-[#33b3a9]
                                     opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"></span>
                        {{ item.label }}
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
          <button routerLink="/noticias" class="hover:text-[#33b3a9] transition-colors uppercase relative group">
            Noticias<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
        </nav>
      </header>

      <!-- ══════════════════════════════════════════════════════
           HERO STRIP — reducido, título en 2 líneas, mismo ancho que body
      ═══════════════════════════════════════════════════════════ -->
      <div class="py-10 px-6 md:px-12 lg:px-16 flex items-center relative overflow-hidden"
             style="background-image: url('imagen-banner.svg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
        <!-- Mismo max-w que el body principal -->
        <div class="max-w-5xl mx-auto">
          <div class="flex items-left gap-3 mb-1">
            <div class="w-8 h-0.5 bg-white/50 rounded-full"></div>
          </div>
          <!-- Título en 2 líneas -->
          <h1 class="text-4x1 md:text-5xl font-black text-white leading-snug">
            Características<br>Técnicas
          </h1>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           ICON NAVBAR — centrado, íconos grandes
      ═══════════════════════════════════════════════════════════ -->
      <div class="w-full bg-white border-b border-gray-100 shadow-sm shrink-0 overflow-x-auto z-40">
        <!-- justify-center centra la fila; en pantallas pequeñas se puede scrollear -->
        <div class="flex justify-center items-stretch gap-2 px-4 py-3 min-w-max mx-auto">
          @for (item of menuItems; track item.id) {
            <div class="flex flex-col items-center gap-1.5 cursor-pointer select-none w-[100px]"
                 (click)="scrollToSection(item.id)">
              <!-- Recuadro — solo el ícono -->
              <button
                class="flex items-center justify-center p-3 rounded-2xl bg-white
                       border transition-all duration-200 w-full aspect-square
                       hover:shadow-lg hover:-translate-y-0.5"
                [style.border-color]="activeSection() === item.id ? '#0056a1' : '#e5e7eb'"
                [style.box-shadow]="activeSection() === item.id
                  ? '0 6px 18px rgba(0,86,161,0.20)'
                  : '0 1px 5px rgba(0,0,0,0.08)'">
                <img [src]="item.icon" [alt]="item.label"
                     class="w-20 h-20 object-contain transition-all duration-200"
                     [style.filter]="activeSection() === item.id ? 'none' : 'grayscale(30%) opacity(0.75)'">
              </button>
              <!-- Etiqueta FUERA del recuadro -->
              <span class="text-[13px] font-semibold text-center leading-tight px-1"
                    [style.color]="activeSection() === item.id ? '#0056a1' : '#6b7280'">
                {{ item.label }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           ZONA DE SCROLL — flex-1, overflow-y-auto
      ═══════════════════════════════════════════════════════════ -->
      <main #scrollContainer class="flex-1 overflow-y-auto scroll-smooth">

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 1 — OBJETIVO
             Layout: texto izquierda amplio + imagen mapa derecha
        ─────────────────────────────────────────────────────────── -->
        <section id="objetivo"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
          <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">
            <!-- Texto -->
            <div>
              <div class="flex items-center gap-3 mb-5">
                <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
                <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Objetivo</h2>
              </div>
              <p class="text-gray-700 leading-relaxed text-xl md:text-2xl text-justify">
                <span style="color:#038dd3; font-weight: bold;">los Censos Nacionales </span> tienen como finalidad recopilar información estadística actualizada sobre
                la población del país, así como sobre sus características demográficas y socioeconómicas.<br><br>
                Asimismo, permiten conocer las condiciones de las viviendas y el acceso a servicios básicos.
                Esta información se obtiene con el mayor nivel de detalle posible y constituye una base
                fundamental para comprender la realidad nacional, así como para el diseño, seguimiento y
                mejora de políticas, programas y planes de desarrollo.
              </p>
            </div>
            <!-- Mapa -->
            <div class="hidden md:flex flex-col items-center justify-center">
              <img src="icono-mapa.svg" alt="Mapa del Perú"
                   class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>
          </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 2 — UTILIDAD
             Layout: fondo degradé teal + 3 cards numeradas (centro elevada)
        ─────────────────────────────────────────────────────────── -->
        <section id="utilidad"
                 class="min-h-[var(--section-h)] flex items-center
                        bg-gradient-to-br from-[#dceefb] to-[#d0f0ed]
                        border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
          <div class="max-w-5xl mx-auto w-full">

            <!-- Título -->
            <div class="flex items-center gap-3 mb-10">
              <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
              <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Utilidad</h2>
            </div>

            <!-- 3 cards numeradas -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-0 items-end">

              <!-- CARD 01 — lateral izquierda -->
              <div class="flex flex-col gap-4 px-6 py-8">
                <span class="text-7xl md:text-8xl font-black text-[#0056a1] leading-none">01</span>
                <p class="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  La información censal permite a los distintos niveles de gobierno (nacional, regional
                  y local) <strong class="text-[#0056a1]">planificar, diseñar e implementar políticas
                  públicas</strong> orientadas al bienestar de la población.
                </p>
              </div>

              <!-- CARD 02 — central destacada (fondo teal sólido, más alta) -->
              <div class="flex flex-col gap-4 px-7 py-10 rounded-2xl shadow-xl"
                   style="background-color: #33b3a9;">
                <span class="text-7xl md:text-8xl font-black text-white leading-none">02</span>
                <p class="text-sm md:text-base text-white leading-relaxed text-justify">
                  <strong>Permite conocer la distribución de la población en el territorio</strong>,
                  lo que ayuda a identificar dónde es necesario invertir en servicios como educación
                  (colegios y universidades), salud (postas y hospitales), entre otros.
                </p>
              </div>

              <!-- CARD 03 — lateral derecha -->
              <div class="flex flex-col gap-4 px-6 py-8">
                <span class="text-7xl md:text-8xl font-black text-[#0056a1] leading-none">03</span>
                <p class="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  Los resultados también son utilizados por la academia (universidades y centros de
                  investigación) para estudios sobre el <strong class="text-[#0056a1]">crecimiento
                  poblacional, la distribución territorial y las características de grupos
                  poblacionales,</strong> incluyendo pueblos indígenas.
                </p>
              </div>

            </div>
          </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 3 — COBERTURA Y PERIODO
             Layout: estadísticas grandes en cuadrícula 2×2
        ─────────────────────────────────────────────────────────── -->
        <section id="cobertura"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
          <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">
            <!-- Texto -->
            <div>
              <div class="flex items-center gap-3 mb-5">
                <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
                <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Cobertura y período de recolección</h2>
              </div>
              <p class="text-gray-700 leading-relaxed text-xl md:text-2xl text-justify">
                <span style="color:#038dd3; font-weight: bold;">los Censos Nacionales </span> se realizaron en todo el territorio nacional durante tres (3) meses, del 04 de agosto al 31 de octubre 
                de 2025.<br><br> Posteriormente, en noviembre de 2025, se desarrolló una 
                etapa adicional de recuperación de información para completar
                los datos en las zonas donde fue necesario.
              </p>
            </div>
            <!-- Mapa -->
            <div class="hidden md:flex flex-col items-center justify-center">
              <img src="foto-censo.png" alt="Foto del censo"
                   class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>
          </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 4 — UNIDADES DE INVESTIGACIÓN
             Layout: fondo gris claro + 3 tarjetas horizontales
        ─────────────────────────────────────────────────────────── -->
        <section id="unidades"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
          <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">
            <!-- Texto -->
            <div>
              <div class="flex items-center gap-3 mb-5">
                <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
                <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Unidades de investigación</h2>
              </div>
              <p class="text-gray-700 leading-relaxed text-xl md:text-2xl text-justify">
                <span style="color:#038dd3; font-weight: bold;">El Censo </span> tuvo como unidades estadísticas de análisis a las 
                personas y a los hogares que integran. En el caso del censo de 
                vivienda, la unidad de análisis fue la vivienda ocupada.
                Esto permitió recoger información tanto a nivel individual 
                como del entorno en el que viven las personas
              </p>
            </div>
            <!-- Mapa -->
            <div class="hidden md:flex flex-col items-center justify-center">
              <img src="foto-censo.png" alt="Foto del censo"
                   class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>
          </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 5 — CÉDULA CENSAL
             Layout: centrado, título + intro + grid 5 secciones
        ─────────────────────────────────────────────────────────── -->
        <section id="cedula"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100
                        px-6 md:px-16 lg:px-24 py-12">
          <div class="max-w-5xl mx-auto w-full">

            <!-- Encabezado — misma línea que el resto de secciones -->
            <div class="flex items-center gap-3 mb-5">
              <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
              <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Cédula Censal</h2>
            </div>

            <!-- Intro -->
            <p class="text-gray-700 leading-relaxed text-base md:text-lg text-justify mb-10">
              La información se recopiló mediante una
              <strong class="text-[#038dd3]">Cédula Censal</strong>
              compuesta por 67 preguntas, organizadas en cinco (5) secciones:
            </p>

            <!-- Fila superior — 3 secciones -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">

              <!-- Sección I -->
              <div class="flex flex-col gap-3">
                <div class="rounded-xl px-5 py-2.5 text-white font-black text-base text-center"
                     style="background-color: #0056a1;">Sección I.</div>
                <p class="font-black text-sm text-gray-800 leading-snug">
                  Localización censal y datos de la vivienda
                </p>
                <p class="text-sm text-gray-600 leading-relaxed text-justify">
                  Recoge información sobre la ubicación geográfica (departamento, provincia, distrito
                  y centro poblado), dirección, georreferenciación, condición de ocupación y número
                  de hogares en la vivienda.
                </p>
              </div>

              <!-- Sección II -->
              <div class="flex flex-col gap-3">
                <div class="rounded-xl px-5 py-2.5 text-white font-black text-base text-center"
                     style="background-color: #33b3a9;">Sección II.</div>
                <p class="font-black text-sm text-gray-800 leading-snug">
                  Características y servicios de la vivienda
                </p>
                <p class="text-sm text-gray-600 leading-relaxed text-justify">
                  Recolecta datos sobre los materiales de construcción (paredes, techos y pisos) y el
                  acceso a servicios básicos como agua, desagüe y electricidad.
                </p>
              </div>

              <!-- Sección III -->
              <div class="flex flex-col gap-3">
                <div class="rounded-xl px-5 py-2.5 text-white font-black text-base text-center"
                     style="background: linear-gradient(90deg, #33b3a9, #7dd3c8);">Sección III.</div>
                <p class="font-black text-sm text-gray-800 leading-snug">
                  Características del hogar
                </p>
                <p class="text-sm text-gray-600 leading-relaxed text-justify">
                  Considera información sobre la tenencia de la vivienda, el tipo de combustible para
                  cocinar, el equipamiento del hogar (electrodomésticos, vehículos, acceso a internet),
                  la disposición de residuos sólidos y la migración internacional de sus integrantes.
                </p>
              </div>

            </div>

            <!-- Fila inferior — 2 secciones centradas -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">

              <!-- Sección IV -->
              <div class="flex flex-col gap-3">
                <div class="rounded-xl px-5 py-2.5 text-white font-black text-base text-center"
                     style="background: linear-gradient(90deg, #7b6fe0, #a78bfa);">Sección IV.</div>
                <p class="font-black text-sm text-gray-800 leading-snug">Personas del hogar</p>
                <p class="text-sm text-gray-600 leading-relaxed text-justify">
                  Registra a las personas que residen habitualmente en la vivienda.
                </p>
              </div>

              <!-- Sección V -->
              <div class="flex flex-col gap-3">
                <div class="rounded-xl px-5 py-2.5 font-black text-base text-center"
                     style="background-color: #b2e8e2; color: #0056a1;">Sección V.</div>
                <p class="font-black text-sm text-gray-800 leading-snug">
                  Características de la población
                </p>
                <p class="text-sm text-gray-600 leading-relaxed text-justify">
                  Recoge información individual como edad, sexo, migración, seguro de salud,
                  discapacidad, identidad, etnicidad, nivel educativo, empleo, uso de tecnologías
                  de la información y comunicación (TIC), estado civil y fecundidad en mujeres a
                  partir de los 12 años.
                </p>
              </div>

            </div>
          </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 6 — PERIODOS DE REFERENCIA
             Layout: fondo tintado + lista de periodos con chips de color
        ─────────────────────────────────────────────────────────── -->
        <!-- ────────────────────────────────────────────────────────
     SECCIÓN 6 — PERIODOS DE REFERENCIA
     Layout: contenido izquierda con grid 2×2 de secciones + foto derecha
─────────────────────────────────────────────────────────── -->
<section id="periodos"
         class="min-h-[var(--section-h)] flex items-center
                bg-gradient-to-br from-[#f0f6ff] to-[#f0fdfa]
                border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
  <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_320px] gap-10 items-center">

    <!-- Columna izquierda: título + intro + grid de secciones -->
    <div>
      <div class="flex items-center gap-3 mb-5">
        <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
        <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Periodos de Referencia</h2>
      </div>

      <p class="text-gray-700 leading-relaxed text-base md:text-lg text-justify mb-8">
        Las preguntas de la
        <strong class="text-[#038dd3]">Cédula Censal</strong>
        consideran distintos periodos de referencia según el tipo de información a recolectar.
      </p>

      <!-- Grid 2×2 de secciones -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

        <!-- Sección II -->
        <div class="flex flex-col gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div class="rounded-xl px-5 py-2.5 text-white font-black text-base text-center"
               style="background-color: #0056a1;">Sección II.</div>
          <p class="font-black text-sm text-gray-800">Vivienda</p>
          <ul class="text-sm text-gray-600 leading-relaxed space-y-1">
            <li>- Día de la entrevista</li>
          </ul>
        </div>

        <!-- Sección III -->
        <div class="flex flex-col gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div class="rounded-xl px-5 py-2.5 text-white font-black text-base text-center"
               style="background-color: #33b3a9;">Sección III.</div>
          <p class="font-black text-sm text-gray-800">Hogar</p>
          <ul class="text-sm text-gray-600 leading-relaxed space-y-1">
            <li>- Migración internacional: últimos 5 años</li>
            <li>- Resto de información: día del empadronamiento</li>
          </ul>
        </div>

        <!-- Sección IV -->
        <div class="flex flex-col gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div class="rounded-xl px-5 py-2.5 text-white font-black text-base text-center"
               style="background: linear-gradient(90deg, #7b6fe0, #a78bfa);">Sección IV.</div>
          <p class="font-black text-sm text-gray-800">Hogar</p>
          <ul class="text-sm text-gray-600 leading-relaxed space-y-1">
            <li>- Día de la entrevista</li>
          </ul>
        </div>

        <!-- Sección V -->
        <div class="flex flex-col gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div class="rounded-xl px-5 py-2.5 font-black text-base text-center"
               style="background-color: #b2e8e2; color: #0056a1;">Sección V.</div>
          <p class="font-black text-sm text-gray-800">Población</p>
          <ul class="text-sm text-gray-600 leading-relaxed space-y-1">
            <li>- Migración: últimos 5 años</li>
            <li>- Uso de TIC: últimos 3 meses</li>
            <li>- Empleo: semana anterior</li>
            <li>- Resto de información: día de la entrevista</li>
          </ul>
        </div>

      </div>
    </div>

    <!-- Columna derecha: foto -->
    <div class="hidden md:flex flex-col items-center justify-center">
      <img src="foto-censo.png" alt="Foto del censo"
           class="w-[32rem] h-auto object-contain drop-shadow-lg">
    </div>

  </div>
</section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 7 — RECOJO DE INFORMACIÓN
             Layout: pasos numerados verticales
        ─────────────────────────────────────────────────────────── -->
        <section id="recojo"
          class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
          <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">
            <!-- Texto -->
            <div>
              <div class="flex items-center gap-3 mb-5">
                <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
                <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Recojo de Información</h2>
              </div>
              <p class="text-gray-700 leading-relaxed text-xl md:text-2xl text-justify">
                Se utilizó la modalidad del <span style="color:#038dd3; font-weight: bold;">Censo Presencial </span>. El/la censista 
                visitó cada vivienda y entrevistó a una persona del hogar, que 
                fue el/la Informante Calificado/a, para registrar la información 
                en la Cédula Censal.<br><br>
                En caso de ausencia temporal o si la persona decidió no res
                ponder en ese momento, se habilitó la opción del Censo en 
                Línea, que permitió responder el cuestionario censal desde un 
                celular o computadora
            </div>
            <!-- Mapa -->
            <div class="hidden md:flex flex-col items-center justify-center">
              <img src="foto-censo.png" alt="Foto del censo"
                   class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>
          </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 8 — INFORMANTE CALIFICADO/A
             Layout: tarjeta central destacada con icono grande
        ─────────────────────────────────────────────────────────── -->
        <section id="informante"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
          <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">
            <!-- Texto -->
            <div>
              <div class="flex items-center gap-3 mb-5">
                <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
                <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] uppercase tracking-widest">Informante calificado/a</h2>
              </div>
              <p class="text-gray-700 leading-relaxed text-xl md:text-2xl text-justify">
                La información fue proporcionada por una persona del hogar 
                mayor de 18 años (responsable del hogar, cónyuge u otro inte
                grante), que conociera los datos de la vivienda y de quienes re
                siden en ella; cuando no fue posible ubicar a esta persona tras 
                varias visitas, se ofreció la alternativa de responder a través del 
                 <span style="color:#038dd3; font-weight: bold;">Censo en Línea </span>.

            </div>
            <!-- Mapa -->
            <div class="hidden md:flex flex-col items-center justify-center">
              <img src="foto-censo.png" alt="Foto del censo"
                   class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>
          </div>
        </section>

        <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
        <div class="flex justify-center items-center gap-3 py-8">
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
        </div>

        <!-- ─── LÍNEA DEGRADÉ 20 px ───────────────────────────────── -->
        <div class="w-full" style="height:20px; background:linear-gradient(to right,#0056a1,#508dd1,#33b3a9);"></div>

        <!-- ─── FOOTER ───────────────────────────────────────────── -->
        <footer class="bg-[#484848] text-white py-6 px-6 md:px-12 lg:px-24">
          <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-6 w-full">
            <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
              <p class="font-bold text-base">Instituto Nacional de Estadística e Informática – INEI</p>
              <p class="text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
              <div class="flex items-center justify-center md:justify-end gap-4 mt-2">
                <span class="text-sm text-gray-300">Síguenos:</span>
                <div class="flex gap-3">
                  <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-[#33b3a9] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                  <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-[#33b3a9] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-[#33b3a9] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </a>
                  <a href="#" class="hover:text-[#33b3a9] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/><path d="M17.49 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>

      </main><!-- /ZONA DE SCROLL -->

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      /* CSS var para la altura de cada sección:
         100vh menos la suma de las bandas fijas:
         header ~60px + hero ~84px + navbar ~108px = 252px */
      --section-h: calc(80vh - 252px);
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    main::-webkit-scrollbar { width: 5px; }
    main::-webkit-scrollbar-track { background: #f1f5f9; }
    main::-webkit-scrollbar-thumb { background: #b0c8e8; border-radius: 99px; }
    main::-webkit-scrollbar-thumb:hover { background: #0056a1; }

    /* Nav horizontal scrollbar delgado */
    .overflow-x-auto::-webkit-scrollbar { height: 3px; }
    .overflow-x-auto::-webkit-scrollbar-thumb { background: #d1dce8; border-radius: 99px; }
  `]
})
export class AspectosGeneralesComponent implements AfterViewInit, OnDestroy {

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  censosOpen    = signal(false);
  activeSection = signal<string>('objetivo');

  censosMenu = [
    { label: 'Censo de Derecho',         route: '/censo-derecho'          },
    { label: 'Características técnicas', route: '/aspectos-generales'     },
    { label: 'Innovaciones Tecnológicas',    route: '/innovaciones'           },
    { label: 'Normatividad censal',      route: '/normativa'              },
    { label: 'Documentación Técnica',    route: '/documentacion-tecnica'  },
  ];

  // ── ÍCONOS ACTUALIZADOS ────────────────────────────────────────────────────
  menuItems = [
    { id: 'objetivo',   label: 'Objetivo',                  icon: 'icono-objetivo.svg'      },
    { id: 'utilidad',   label: 'Utilidad',                  icon: 'icono-utilidad.svg'      },
    { id: 'cobertura',  label: 'Cobertura y periodo',       icon: 'icono-cobertura.svg'     },
    { id: 'unidades',   label: 'Unidades de investigación', icon: 'icono-investigacion.svg' },
    { id: 'cedula',     label: 'Cédula censal',             icon: 'icono-cedula.svg'        },
    { id: 'periodos',   label: 'Periodos de referencia',    icon: 'icono-periodo.svg'       },
    { id: 'recojo',     label: 'Recojo de información',     icon: 'icono-recojo-inf.svg'    },
    { id: 'informante', label: 'Informante calificado/a',   icon: 'icono-informante.svg'    },
  ];

  // ── Datos de secciones ────────────────────────────────────────────────────
  cobertura = [
    { valor: '25',     label: 'Departamentos' },
    { valor: '196',    label: 'Provincias'    },
    { valor: '1,874',  label: 'Distritos'     },
    { valor: '98,416', label: 'Centros Poblados' },
  ];

  unidades = [
    { icon: 'person',     color: '#0056a1', titulo: 'Persona',  descripcion: 'Individuo residente en el territorio nacional en la fecha censal.' },
    { icon: 'group',      color: '#508dd1', titulo: 'Hogar',    descripcion: 'Conjunto de personas que comparten vivienda y presupuesto alimentario.' },
    { icon: 'home',       color: '#33b3a9', titulo: 'Vivienda', descripcion: 'Unidad habitacional con acceso independiente al exterior o a espacios comunes.' },
  ];

  periodos = [
    { rango: 'Fecha censal',   color: '#0056a1', descripcion: 'Condición de actividad económica, estado civil y alfabetismo.' },
    { rango: 'Últimos 12 meses', color: '#508dd1', descripcion: 'Residencia habitual, nacimientos ocurridos y defunciones.' },
    { rango: 'Últimos 5 años',  color: '#33b3a9', descripcion: 'Lugar de residencia anterior para medir migración interna.' },
  ];

  pasos = [
    { num: '1', titulo: 'Capacitación de empadronadores',  descripcion: 'Personal formado en el uso de tabletas y protocolos de entrevista.' },
    { num: '2', titulo: 'Entrevista cara a cara',          descripcion: 'Aplicación del cuestionario electrónico al informante del hogar.' },
    { num: '3', titulo: 'Validación en campo',             descripcion: 'Controles automáticos en la tableta para reducir errores de captura.' },
    { num: '4', titulo: 'Supervisión en tiempo real',      descripcion: 'Plataformas digitales conectadas al sistema central del INEI.' },
  ];

  requisitosInformante = [
    'Ser residente habitual del hogar.',
    'Tener 18 años o más.',
    'Conocer las características de todos los miembros del hogar.',
  ];

  private observer?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // ── Scroll al hacer click en ícono ────────────────────────────────────────
  scrollToSection(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const container = this.scrollContainer?.nativeElement;
    const el = document.getElementById(id);
    if (el && container) {
      // scrollIntoView actúa sobre el documento; usamos scrollTop del contenedor
      const offset = el.offsetTop - container.offsetTop;
      container.scrollTo({ top: offset, behavior: 'smooth' });
      this.activeSection.set(id);
    }
  }

  // ── IntersectionObserver (root = <main>) ─────────────────────────────────
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          this.activeSection.set(visible[0].target.id);
        }
      },
      { root: container, threshold: 0.3 }
    );

    this.menuItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) this.observer!.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }

  toggleCensos(e: Event) {
    e.stopPropagation();
    this.censosOpen.update(v => !v);
  }
}