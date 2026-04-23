// RUTA: src/app/components/features/innovaciones/innovaciones-tecnologicas.ts

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
  selector: 'app-innovaciones-tecnologicas',
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
      <div class="w-full bg-gradient-to-r from-[#0056a1] to-[#33b3a9] shrink-0 py-20 px-6 md:px-16 lg:px-24">
        <!-- Mismo max-w que el body principal -->
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-8 h-0.5 bg-white/50 rounded-full"></div>
          </div>
          <!-- Título en 2 líneas -->
          <h1 class="text-4x1 md:text-5xl font-black text-white leading-snug">
            Innovaciones<br>Tecnológicas
          </h1>
          <p class="mt-3 text-base md:text-lg font-bold tracking-widest">
            <span style="color:#00d2f1;">Los Censos Nacionales 2025 </span><span class="text-white">incorporaron herramientas tecnológicas 
            que permitieron mejorar la calidad de la información, optimizar el trabajo 
            de campo y facilitar la participación de la población.</span>
            </p>
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
                     class="w-14 h-14 object-contain transition-all duration-200"
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
             SECCIÓN 1 — GEOLOCALIZACION
             Layout: texto izquierda amplio + imagen mapa derecha
        ─────────────────────────────────────────────────────────── -->
        <section id="geolocalizacion"
         class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
  <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

    <!-- Texto — columna izquierda -->
    <div>
     <div class="flex items-center gap-3 mb-5">
    <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
    <h2 class="text-2xl md:text-3xl tracking-widest">
        <span class="font-black text-[#0056a1]">Geolocalización</span><br>
        <span class="font-black text-[#0056a1]">de las viviendas</span>
    </h2>
    </div>

            <!-- Párrafo 1 -->
        <div class="flex items-start gap-3 mb-6">
        <div class="rounded-sm shrink-0 mt-1" style="width:25px;height:25px;background-color:#038dd3;"></div>
        <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
            Antes del operativo censal, se realizó un trabajo precensal
            en el que se georreferenció cada puerta de las viviendas
            en zonas urbanas y rurales. Esto permitió asignar un
            código único a cada vivienda y elaborar croquis digitales
            que facilitaron la ubicación en campo por parte del personal censal.
        </p>
        </div>

        <!-- Párrafo 2 -->
        <div class="flex items-start gap-3 mb-6">
        <div class="rounded-sm shrink-0 mt-1" style="width:25px;height:25px;background-color:#33b3a9;"></div>
        <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
            Durante el censo, el/la censista registró en tiempo real la
            ubicación geográfica de cada vivienda, vinculando directamente
            esta información con las respuestas del cuestionario.
        </p>
        </div>

      <!-- Párrafo 3 -->
      <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
        Esta herramienta no solo mejoró la precisión de los datos recogidos,
        sino que también permite generar mapas focalizados para la planificación
        de políticas públicas, considerando información sobre viviendas, servicios,
        infraestructura, riesgos, entre otros temas de interés.
      </p>
    </div>

    <!-- Imagen — columna derecha -->
    <div class="hidden md:flex flex-col items-center justify-center">
      <img src="foto-censo.png" alt="Mapa del Perú"
           class="w-[32rem] h-auto object-contain drop-shadow-lg">
    </div>

  </div>
</section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 2 — Censo en linea
             Layout: fondo degradé teal + 3 cards numeradas (centro elevada)
        ─────────────────────────────────────────────────────────── -->
        <section id="censos"
         class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
  <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

    <!-- Texto — columna izquierda -->
    <div>
     <div class="flex items-center gap-3 mb-5">
    <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
    <h2 class="text-2xl md:text-3xl tracking-widest">
        <span class="font-black text-[#0056a1]">Censo en Línea</span><br>
    </h2>
    </div>
      <!-- Párrafo 1 -->
      <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
        Modalidad digital que permitió a una persona del hogar (informante calificado) 
        registrar la información de todos sus integrantes a través de una plataforma web, desde cualquier 
        dispositivo con internet.<br><br>
        Complementó el censo presencial, facilitando la recolección 
        de datos en viviendas donde no fue posible realizar la entrevista. 
        Además, contó con un servicio de atención (Call Center) 
        para brindar orientación durante el proceso.
      </p>
      <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
        <div class="flex justify-left items-center gap-3 py-8">
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
        </div>

    </div>

    <!-- Imagen — columna derecha -->
    <div class="hidden md:flex flex-col items-center justify-center">
      <img src="foto-censo.png" alt="Mapa del Perú"
           class="w-[32rem] h-auto object-contain drop-shadow-lg">
    </div>

  </div>
</section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 3 — COBERTURA Y PERIODO
             Layout: estadísticas grandes en cuadrícula 2×2
        ─────────────────────────────────────────────────────────── -->
        <section id="hibrido"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
        <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

            <!-- Texto — columna izquierda -->
            <div>
            <div class="flex items-center gap-3 mb-5">
            <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
            <h2 class="text-2xl md:text-3xl tracking-widest">
                <span class="font-black text-[#0056a1]">Capacitación</span><br>
                <span class="font-black text-[#0056a1]">Hibrída</span><br>
            </h2>
            </div>
            <!-- Párrafo 1 -->
            <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
                La formación del personal censal combinó sesiones presenciales con 
                herramientas virtuales (e-learning), permitiendo reforzar 
                contenidos y acceder a la información de manera ágil.<br>
                Este enfoque facilitó una capacitación más flexible y eficiente 
                en todos los niveles operativos.
            </p>
            <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
                <div class="flex justify-left items-center gap-3 py-8">
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
                </div>

            </div>

            <!-- Imagen — columna derecha -->
            <div class="hidden md:flex flex-col items-center justify-center">
            <img src="foto-censo.png" alt="Mapa del Perú"
                class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>

        </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 4 — Uso de Codigo QR
             Layout: fondo gris claro + 3 tarjetas horizontales
        ─────────────────────────────────────────────────────────── -->
        <section id="usoqr"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
        <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

            <!-- Texto — columna izquierda -->
            <div>
            <div class="flex items-center gap-3 mb-5">
            <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
            <h2 class="text-2xl md:text-3xl tracking-widest">
                <span class="font-black text-[#0056a1]">Uso de código QR</span><br>
                <span class="font-black text-[#0056a1]">para identificación</span><br>
            </h2>
            </div>
            <!-- Párrafo 1 -->
            <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
                Se implementó el uso de códigos QR en las credenciales del 
                personal censal como medida de seguridad y transparencia.
                Al escanearlo desde un celular u otro dispositivo, la ciudadanía 
                podía verificar en tiempo real la identidad del personal censal 
                en la página oficial del INEI, accediendo a datos como nombres, DNI, 
                cargo y fotografía, lo que contribuyó a generar mayor confianza durante el operativo.

            </p>
            <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
                <div class="flex justify-left items-center gap-3 py-8">
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
                </div>

            </div>

            <!-- Imagen — columna derecha -->
            <div class="hidden md:flex flex-col items-center justify-center">
            <img src="foto-censo.png" alt="Mapa del Perú"
                class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>

        </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 5 — CÉDULA CENSAL
             Layout: centrado, título + intro + grid 5 secciones
        ─────────────────────────────────────────────────────────── -->
        <section id="dispositivo"
                 class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
        <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

            <!-- Texto — columna izquierda -->
            <div>
            <div class="flex items-center gap-3 mb-5">
            <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
            <h2 class="text-2xl md:text-3xl tracking-widest">
                <span class="font-black text-[#0056a1]">Uso de dispositivos</span><br>
                <span class="font-black text-[#0056a1]">móviles para captura</span><br>
                <span class="font-black text-[#0056a1]">de datos</span><br>
            </h2>
            </div>
            <!-- Párrafo 1 -->
            <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
                Se reemplazaron los cuestionarios en papel por cuestionarios 
                electrónicos instalados en tabletas mediante un aplicativo. 
                Para el operativo censal se distribuyeron 40 mil dispositivos a 
                nivel nacional, utilizados por los/las censistas durante las entrevistas en campo.<br>
                Las tabletas estuvieron adaptadas para jornadas prolongadas 
                de trabajo e incluyeron cargadores portátiles, especialmente 
                para zonas alejadas.

            </p>
            <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
                <div class="flex justify-left items-center gap-3 py-8">
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
                </div>

            </div>

            <!-- Imagen — columna derecha -->
            <div class="hidden md:flex flex-col items-center justify-center">
            <img src="foto-censo.png" alt="Mapa del Perú"
                class="w-[32rem] h-auto object-contain drop-shadow-lg">
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
        <section id="cuestionario"
         class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
        <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

            <!-- Texto — columna izquierda -->
            <div>
            <div class="flex items-center gap-3 mb-5">
            <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
            <h2 class="text-2xl md:text-3xl tracking-widest">
                <span class="font-black text-[#0056a1]">Uso de cuestionario</span><br>
                <span class="font-black text-[#0056a1]">electrónico</span><br>
            </h2>
            </div>
            <!-- Párrafo 1 -->
            <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
                La Cédula Censal de Población y Vivienda se implementó 
                como un aplicativo digital en tabletas que contaban con sistema GPS para 
                registrar la ubicación de cada vivienda.<br>
                El cuestionario electrónico permitió validaciones automáticas 
                y flujos lógicos, reduciendo errores y asegurando mayor calidad 
                en la información. Además, los datos fueron encriptados, 
                garantizando la seguridad y confidencialidad de la información recopilada.
            </p>
            <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
                <div class="flex justify-left items-center gap-3 py-8">
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
                </div>

            </div>

            <!-- Imagen — columna derecha -->
            <div class="hidden md:flex flex-col items-center justify-center">
            <img src="foto-censo.png" alt="Mapa del Perú"
                class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>

        </div>
        </section>

        <!-- ────────────────────────────────────────────────────────
             SECCIÓN 7 — RECOJO DE INFORMACIÓN
             Layout: pasos numerados verticales
        ─────────────────────────────────────────────────────────── -->
        <section id="alerta"
          class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
        <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

            <!-- Texto — columna izquierda -->
            <div>
            <div class="flex items-center gap-3 mb-5">
            <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
            <h2 class="text-2xl md:text-3xl tracking-widest">
                <span class="font-black text-[#0056a1]">Alertas</span><br>
                <span class="font-black text-[#0056a1]">de seguridad</span><br>
            </h2>
            </div>
            <!-- Párrafo 1 -->
            <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
                Se incorporó, por primera vez, un botón de alerta en las tabletas como medida 
                de protección para el personal censal, marcando un hito en la seguridad durante 
                este tipo de operativos. <br>
                Este sistema permitía enviar una señal silenciosa a una central 
                de monitoreo, facilitando la coordinación de apoyo inmediato 
                del Serenazgo o de la Policía Nacional del Perú, según la ubicación del/de la censista.
            </p>
            <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
                <div class="flex justify-left items-center gap-3 py-8">
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
                </div>

            </div>

            <!-- Imagen — columna derecha -->
            <div class="hidden md:flex flex-col items-center justify-center">
            <img src="foto-censo.png" alt="Mapa del Perú"
                class="w-[32rem] h-auto object-contain drop-shadow-lg">
            </div>

        </div>
        </section>
<!-- ────────────────────────────────────────────────────────
             SECCIÓN 8 — RECOJO DE INFORMACIÓN
             Layout: pasos numerados verticales
        ─────────────────────────────────────────────────────────── -->
        <section id="monitoreo"
         class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
  <div class="max-w-5xl mx-auto w-full">

    <!-- Layout principal: contenido izquierda + imagen derecha -->
    <div class="flex flex-col md:flex-row gap-10 items-center">

      <!-- Columna izquierda: texto + tarjetas + cuadros decorativos -->
      <div class="flex-1 min-w-0">

        <!-- Título -->
        <div class="flex items-center gap-3 mb-5">
          <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
          <h2 class="text-2xl md:text-3xl font-black text-[#0056a1] tracking-widest">Monitoreo censal</h2>
        </div>

        <!-- Párrafo intro -->
        <p class="text-gray-700 leading-relaxed text-sm md:text-base text-justify mb-3">
          Se implementó un sistema de monitoreo que permitió seguir, en tiempo real, el avance y la calidad
          del operativo censal, a partir de indicadores de cobertura y calidad. Esta herramienta facilitó
          la toma de decisiones oportunas, permitiendo aplicar acciones preventivas y correctivas a nivel
          logístico, técnico y operativo.
        </p>

        <!-- Subtítulo funcionalidades -->
        <p class="text-gray-700 text-sm md:text-base font-medium mb-4">Principales funcionalidades:</p>

        <!-- 2 tarjetas de funcionalidades -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <!-- Tarjeta 01 -->
          <div class="flex flex-col items-center text-center gap-3 bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
            <span class="text-4xl font-black text-[#0056a1] leading-none self-start">01</span>
            <div class="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                 style="border-color: #0056a1;">
              <img src="icono-cobertura.png" alt="Avance de cobertura"
                   class="w-10 h-10 object-contain"
                   style="filter: invert(18%) sepia(90%) saturate(1200%) hue-rotate(200deg);">
            </div>
            <p class="font-black text-gray-800 text-sm">Avance de cobertura:</p>
            <p class="text-xs text-gray-600 leading-relaxed text-center">
              Permitió conocer el progreso de viviendas censadas a nivel nacional, con información
              actualizada que se enviaba de las tabletas directamente al sistema de monitoreo.
            </p>
          </div>

          <!-- Tarjeta 02 -->
          <div class="flex flex-col items-center text-center gap-3 bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
            <span class="text-4xl font-black text-[#33b3a9] leading-none self-start">02</span>
            <div class="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                 style="border-color: #33b3a9;">
              <img src="icono-investigacion.png" alt="Seguimiento del personal"
                   class="w-10 h-10 object-contain"
                   style="filter: invert(55%) sepia(60%) saturate(400%) hue-rotate(130deg);">
            </div>
            <p class="font-black text-gray-800 text-sm">Seguimiento del personal:</p>
            <p class="text-xs text-gray-600 leading-relaxed text-center">
              Incorporó el monitoreo en tiempo real del recorrido de censistas y jefes/as de sección
              mediante el envío periódico de su ubicación (coordenadas GPS), fortaleciendo
              tanto la supervisión como la seguridad.
            </p>
          </div>

        </div>

        <!-- Cuadros decorativos (dentro de la columna izquierda) -->
        <div class="flex justify-start items-center gap-3 pt-6">
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
          <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
        </div>

      </div>
      <!-- /Columna izquierda -->

      <!-- Columna derecha: imagen -->
      <div class="hidden md:flex flex-col items-center justify-center flex-shrink-0">
        <img src="foto-censo.png" alt="Mapa del Perú"
             class="w-72 lg:w-80 h-auto object-contain drop-shadow-lg">
      </div>

    </div>
    <!-- /Layout principal -->

  </div>
</section>
<!-- ────────────────────────────────────────────────────────
             SECCIÓN 9 — RECOJO DE INFORMACIÓN
             Layout: pasos numerados verticales
        ─────────────────────────────────────────────────────────── -->
        <section id="nube"
          class="min-h-[var(--section-h)] flex items-center border-b border-gray-100 px-6 md:px-16 lg:px-24 py-12">
        <div class="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_360px] gap-10 items-center">

            <!-- Texto — columna izquierda -->
            <div>
            <div class="flex items-center gap-3 mb-5">
            <div class="w-1 h-10 bg-gradient-to-b from-[#0056a1] to-[#33b3a9] rounded-full"></div>
            <h2 class="text-2xl md:text-3xl tracking-widest">
                <span class="font-black text-[#0056a1]">Uso de tecnología en la</span><br>
                <span class="font-black text-[#0056a1]">nube (Cloud computing)</span><br>
            </h2>
            </div>
            <!-- Párrafo 1 -->
            <p class="text-gray-700 leading-relaxed text-xl md:text-1xl text-justify">
                <span class="font-black text-[#f8bd13]">Este extracto de parrafo no ha sido enviado</span> 
                de protección para el personal censal, marcando un hito en la seguridad durante 
                este tipo de operativos. <br>
                Este sistema permitía enviar una señal silenciosa a una central 
                de monitoreo, facilitando la coordinación de apoyo inmediato 
                del Serenazgo o de la Policía Nacional del Perú, según la ubicación del/de la censista.
            </p>
            <!-- ─── 3 cuadros decorativos ─────────────────────────────── -->
                <div class="flex justify-left items-center gap-3 py-8">
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#0056a1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#508dd1;"></div>
                <div class="rounded-sm shrink-0" style="width:25px;height:25px;background-color:#33b3a9;"></div>
                </div>

            </div>

            <!-- Imagen — columna derecha -->
            <div class="hidden md:flex flex-col items-center justify-center">
            <img src="foto-censo.png" alt="Mapa del Perú"
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
export class InnovacionesTecnologicasComponent implements AfterViewInit, OnDestroy {

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
    { id: 'geolocalizacion',   label: 'Geolocalización',                  icon: 'icono-objetivo.png'      },
    { id: 'censos',             label: 'Censo en línea',                  icon: 'icono-utilidad.png'      },
    { id: 'hibrido',            label: 'Capacitación hibrida',            icon: 'icono-cobertura.png'     },
    { id: 'usoqr',              label: 'Uso de QR',                       icon: 'icono-investigacion.png' },
    { id: 'dispositivo',        label: 'Uso de Dispositivos móviles',     icon: 'icono-cedula.png'        },
    { id: 'cuestionario',       label: 'Cuestionario electrónico',        icon: 'icono-periodo.png'       },
    { id: 'alerta',             label: 'Alertas de seguridad',            icon: 'icono-recojo-inf.png'    },
    { id: 'monitoreo',          label: 'Monitoreo censal',                icon: 'icono-informante.png'    },
    { id: 'nube',               label: 'Tecnología en la nube',           icon: 'icono-informante.png'    },
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