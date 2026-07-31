/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component, ChangeDetectionStrategy, OnInit, Input,
    PLATFORM_ID, inject, signal, computed, HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HeroIconComponent } from '../ui/hero-icon.component';

import * as echarts from 'echarts/core';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, GraphicComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, GraphicComponent, MarkLineComponent, CanvasRenderer]);

// ── Interfaces ──────────────────────────────────────────────────────────────
interface GeoOption { code: string; name: string; sortKey?: string; }

export type NivelGeoType    = 'Departamental' | 'Provincial' | 'Distrital';
export type AreaFiltroType  = 'total' | 'campesina' | 'nativa';

// ── Tarjeta KPI reutilizable (hero / card) ───────────────────────────────────
@Component({
    selector: 'app-comunidad-kpi',
    standalone: true,
    imports: [CommonModule, MatTooltipModule, HeroIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="h-full rounded-xl relative overflow-hidden flex items-center gap-2.5"
         [class]="variant === 'hero'
           ? 'px-3 md:px-4 py-2 md:py-2.5 text-white shadow-md'
           : 'bg-white px-3 md:px-4 py-2 shadow-sm border border-gray-100'"
         [style.background]="variant === 'hero' ? gradient : null">
      @if (variant === 'hero') {
        <div class="absolute right-0 top-0 w-20 h-20 bg-white/10 rounded-full -mr-6 -mt-6 pointer-events-none"></div>
      }
      <div class="shrink-0 relative z-10 flex items-center justify-center"
           [class]="variant === 'hero' ? 'w-8 h-8 md:w-10 md:h-10' : 'w-[42px] h-[42px] md:w-[49px] md:h-[49px]'">
        <img [src]="icon" class="w-full h-full object-contain"
             [style.filter]="variant === 'hero' ? 'brightness(0) invert(1)' : (iconFilter || null)">
      </div>
      <div class="min-w-0 relative z-10 flex-1">
        <div class="font-black tracking-wide leading-tight"
             [class]="variant === 'hero' ? 'text-[10px] md:text-xs opacity-80' : 'text-[9px] xl:text-xs text-black'">
          {{ label }}
        </div>
        <div class="font-black tracking-tight leading-none mt-0.5"
             [class]="variant === 'hero' ? 'text-xl sm:text-2xl md:text-3xl xl:text-2xl 2xl:text-3xl' : 'text-lg md:text-xl xl:text-xl text-gray-800'">
          {{ value }}<span class="text-[10px] md:text-xs font-bold ml-0.5" [class]="variant === 'hero' ? 'opacity-70' : 'text-gray-400'">{{ unit }}</span>
        </div>
        @if (pct) {
          <div class="font-black leading-none mt-1 text-base md:text-lg xl:text-lg" [class]="variant === 'hero' ? 'opacity-90' : 'text-gray-500'">{{ pct }}</div>
        }
        @if (sub) {
          <div class="text-[10px] font-bold mt-0.5" [class]="variant === 'hero' ? 'opacity-75' : 'text-gray-400'">{{ sub }}</div>
        }
      </div>
      <span [matTooltip]="tooltip" matTooltipClass="custom-tooltip" class="absolute top-1.5 right-1.5 inline-flex z-10">
        <app-hero-icon [name]="'information-circle'" class="w-4 h-4" [class.text-white\/50]="variant === 'hero'" [class.text-gray-300]="variant !== 'hero'"></app-hero-icon>
      </span>
    </div>
  `,
    styles: [`:host { display: block; height: 100%; }`],
})
export class ComunidadKpiCardComponent {
    @Input() variant: 'hero' | 'card' = 'card';
    @Input() label = '';
    @Input() value = '';
    @Input() unit = '';
    @Input() sub = '';
    @Input() pct = '';
    @Input() icon = '';
    @Input() iconFilter = '';
    @Input() tooltip = '';
    @Input() gradient = 'linear-gradient(135deg,#038dd3 0%,#33b3a9 100%)';
}

// ── Tarjeta de gráfico reutilizable (pie / barras) ───────────────────────────
@Component({
    selector: 'app-comunidad-chart',
    standalone: true,
    imports: [CommonModule, NgxEchartsDirective, MatTooltipModule, HeroIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="h-full bg-white rounded-xl p-3 md:p-3.5 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
      <div class="flex justify-between items-start gap-2 mb-1 shrink-0">
        <h4 class="text-[10px] sm:text-xs font-black text-black tracking-wide leading-tight">{{ title }}</h4>
        <span [matTooltip]="tooltip" matTooltipClass="custom-tooltip" class="inline-flex items-center shrink-0">
          <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
        </span>
      </div>
      <div class="flex-1 min-h-0">
        @if (isBrowser && options) {
          <div echarts [options]="options" class="w-full h-full"></div>
        }
      </div>
      @if (items.length) {
        <div class="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-1 shrink-0">
          @for (it of items; track it.label) {
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full shrink-0" [style.background]="it.color"></span>
              <span class="text-[9px] sm:text-[10px] font-bold text-gray-500">{{ it.label }}</span>
            </div>
          }
        </div>
      }
      @if (note) {
        <div class="shrink-0 mt-1 pt-1 border-t border-gray-100">
          <p class="text-[8.5px] text-gray-400 leading-tight">{{ note }}</p>
        </div>
      }
    </div>
  `,
    styles: [`:host { display: block; height: 100%; }`],
})
export class ComunidadChartCardComponent {
    @Input() title = '';
    @Input() tooltip = '';
    @Input() note = '';
    @Input() options: EChartsOption | null = null;
    @Input() isBrowser = false;
    @Input() items: { label: string; color: string }[] = [];
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, MatTooltipModule, HeroIconComponent, ComunidadKpiCardComponent, ComunidadChartCardComponent],
    providers: [provideEchartsCore({ echarts })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section
      class="bg-[#efefef] w-full flex flex-col font-sans text-gray-800 h-screen overflow-hidden"
      (click)="closeGeoDropdowns()">

      <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50
                     flex justify-between items-center
                     px-4 py-1 sm:px-6 sm:py-1.5 md:px-10 md:py-1.5 lg:px-12 lg:py-2
                     w-full shrink-0">
        <div class="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain">
          </div>
          <div class="w-px h-6 md:h-7 bg-gray-200 hidden md:block"></div>
          <img src="logo_cpv.png" alt="Logo CPV 2025" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain hidden md:block">
        </div>
        <nav class="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium tracking-wide" style="color:#0056a1">
          <button routerLink="/" class="hover:text-secondary transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/intermedia" class="hover:text-secondary transition-colors uppercase relative group">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/publicaciones" class="hover:text-secondary transition-colors duration-300 uppercase relative group">
            Publicaciones<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)"
              class="hover:text-secondary transition-colors uppercase relative group flex items-center gap-1">
              Censos 2025
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                [class.rotate-180]="censosOpen()"></app-hero-icon>
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards"
                   (click)="$event.stopPropagation()">
                <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700
                               hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10
                               hover:text-primary transition-all flex items-center gap-2 group/item">
                        <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-secondary
                                     opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"></span>
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
        <button (click)="toggleMobileMenu($event)"
          class="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg
                 hover:bg-gray-100 transition-colors gap-1.5" aria-label="Menú">
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.rotate-45]="mobileMenuOpen()" [class.translate-y-2]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.opacity-0]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all"
                [class.-rotate-45]="mobileMenuOpen()" [class.-translate-y-2]="mobileMenuOpen()"></span>
        </button>
      </header>

      <!-- Menú móvil -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden bg-white border-b border-gray-100 shadow-md z-40 px-4 py-3 flex flex-col gap-1"
             style="animation: dropdownIn 0.18s ease-out forwards"
             (click)="$event.stopPropagation()">
          <button routerLink="/" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Inicio
          </button>
          <button routerLink="/intermedia" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Resultados
          </button>
          <button (click)="toggleCensos($event)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1]
                   hover:bg-blue-50 transition-colors uppercase tracking-wide flex items-center justify-between">
            Censos 2025
            <app-hero-icon [name]="'chevron-down'" class="w-4 h-4 transition-transform"
              [class.rotate-180]="censosOpen()"></app-hero-icon>
          </button>
          @if (censosOpen()) {
            <div class="pl-4 flex flex-col gap-0.5 border-l-2 border-blue-100 ml-3">
              @for (item of censosMenu; track item.label) {
                <button [routerLink]="item.route"
                  (click)="censosOpen.set(false); mobileMenuOpen.set(false)"
                  class="text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  {{ item.label }}
                </button>
              }
            </div>
          }
          <button routerLink="/noticias" (click)="mobileMenuOpen.set(false)"
            class="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">
            Noticias
          </button>
        </div>
      }

      <!-- ══ BOTONERA DE SECCIONES ══════════════════════════════════════════ -->
      <div class="w-full shrink-0"
           style="background:#efefef; box-shadow: 0 2px 8px rgba(0,86,161,0.10);">
        <div class="flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-5 md:px-6 py-1.5 sm:py-2">
          @for (btn of navSections; track btn.id) {
            <button
              (click)="goToSection(btn)"
              class="relative flex flex-row items-center justify-center gap-1.5 sm:gap-2
                     px-3 sm:px-4 md:px-5 py-1 sm:py-1.5 rounded-full
                     text-[10px] sm:text-[11px] md:text-xs font-semibold text-center leading-tight
                     whitespace-nowrap transition-all duration-200 ease-out focus:outline-none group shrink-0"
              [style]="isBtnActive(btn)
                ? 'background:linear-gradient(90deg,#003d7a 0%,#1a8c7a 100%); color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.25);'
                : 'background:#efefef; color:#4b5563; box-shadow:none;'">              
              <span class="transition-colors duration-200"
                    [class.text-white]="isBtnActive(btn)"
                    [class.text-gray-600]="!isBtnActive(btn)">
                {{ btn.label }}
              </span>
              @if (!isBtnActive(btn)) {
                <span class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none rounded-full bg-gray-900"></span>
              }
            </button>
          }
        </div>
      </div>

      <!-- ══ BARRA DE FILTROS ════════════════════════════════════════════════ -->
      <div class="sticky z-40 shrink-0
                  top-[38px] sm:top-[43px] md:top-[47px] lg:top-[50px]
                  px-3 md:px-4 2xl:px-5 py-2"
           (click)="$event.stopPropagation()">
        <div class="bg-white border border-gray-200 shadow-sm
                    px-3 py-2 sm:px-4 md:px-5 2xl:px-6
                    flex flex-wrap items-center gap-2 md:gap-3"
             style="border-radius:12px">

          <!-- Ind. Principales / Ind. Temáticos -->
          <div class="flex items-center gap-1 shrink-0" (click)="$event.stopPropagation()">

            <!-- Agrupación Indicadores principales con sub-opciones en contenedor #efefef -->
            <div class="flex items-center rounded-xl shrink-0" style="background:#efefef">
              <button (click)="toggleNavSection('principales')"
                class="flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold
                       tracking-wide whitespace-nowrap transition-all duration-200 rounded-xl"
                [style]="expandedSection() === 'principales'
                  ? 'background:#caeae4;color:#424242;'
                  : 'color:#6b7280;'">                
                <span>Características generales, organización y territorio </span>
                <app-hero-icon [name]="'chevron-right'"
                  class="w-3 h-3 shrink-0 transition-transform duration-200"
                  [class.rotate-90]="expandedSection() === 'principales'"></app-hero-icon>
              </button>
            </div>

            <!-- Ind. Recursos -->
            <button (click)="toggleNavSection('recursos'); $event.stopPropagation()"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs
                     font-bold tracking-wide whitespace-nowrap transition-all shrink-0"
              [style]="expandedSection() === 'recursos'
                ? 'background:#33b3a9;color:#fff;'
                : 'background:#f3f4f6;color:#6b7280;'">

              <span>Recursos naturales, equipamiento y acceso</span>
              <app-hero-icon [name]="'chevron-right'" class="w-3 h-3 shrink-0"></app-hero-icon>
            </button>
             <!-- Ind. Edu -->
            <button (click)="toggleNavSection('educacion'); $event.stopPropagation()"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs
                     font-bold tracking-wide whitespace-nowrap transition-all shrink-0"
              [style]="expandedSection() === 'educacion'
                ? 'background:#33b3a9;color:#fff;'
                : 'background:#f3f4f6;color:#6b7280;'">

              <span>Educación, salud y economía</span>
              <app-hero-icon [name]="'chevron-right'" class="w-3 h-3 shrink-0"></app-hero-icon>
            </button>

          </div>

          <!-- Separador -->
          <div class="hidden sm:block h-7 w-px bg-gray-200 shrink-0"></div>

          <!-- Geo-dropdowns -->
          <div class="flex flex-wrap items-center gap-2 ml-auto">

            <!-- Restablecer filtros -->
            <button (click)="resetFilters()"
              class="flex items-center gap-1.5 text-gray-400 hover:text-[#0056a1]
                     transition-colors text-xs font-black tracking-wide shrink-0 group">
              <app-hero-icon [name]="'arrow-path'"
                class="w-4 h-4 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
              <span class="hidden sm:inline">Restablecer Filtros</span>
            </button>

            <div class="hidden sm:block h-7 w-px bg-gray-200 shrink-0"></div>

            <!-- ★ Departamento -->
              <div class="flex flex-col gap-0.5">
                <span class="text-[9px] font-bold text-gray-400  tracking-widest px-1">Departamento</span>
                <div class="relative">
                <button (click)="toggleGeoDropdown('dep'); $event.stopPropagation()"
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                         text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all
                         min-w-[130px] sm:min-w-[148px] justify-between">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                    <span class="truncate max-w-[90px] sm:max-w-[100px]">{{ geoDepLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 text-gray-400 transition-transform"
                    [class.rotate-180]="openGeoDropdown() === 'dep'"></app-hero-icon>
                </button>
                @if (openGeoDropdown() === 'dep') {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-56 sm:w-60 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar departamento</span>
                    </div>
                    <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                      <button (click)="selectDep(null)"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedCCDD() === ''" [class.from-\[\#0056a1\]]="selectedCCDD() === ''" [class.to-\[\#1a75aa\]]="selectedCCDD() === ''"
                        [class.text-white]="selectedCCDD() === ''" [class.text-gray-700]="selectedCCDD() !== ''" [class.hover\:bg-blue-50]="selectedCCDD() !== ''">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedCCDD() === ''" [class.border-gray-300]="selectedCCDD() !== ''">
                          @if (selectedCCDD() === '') { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-bold italic text-xs">Todos los departamentos</span>
                      </button>
                      @for (dept of departments(); track dept.ccdd) {
                        <button (click)="selectDep(dept)"
                          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                          [class.bg-gradient-to-r]="selectedCCDD() === dept.ccdd" [class.from-\[\#0056a1\]]="selectedCCDD() === dept.ccdd" [class.to-\[\#1a75aa\]]="selectedCCDD() === dept.ccdd"
                          [class.text-white]="selectedCCDD() === dept.ccdd" [class.text-gray-700]="selectedCCDD() !== dept.ccdd" [class.hover\:bg-blue-50]="selectedCCDD() !== dept.ccdd">
                          <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            [class.border-white]="selectedCCDD() === dept.ccdd" [class.border-gray-300]="selectedCCDD() !== dept.ccdd">
                            @if (selectedCCDD() === dept.ccdd) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold">{{ dept.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
              </div>

            <!-- ★ Provincia -->
              <div class="flex flex-col gap-0.5">
                <span class="text-[9px] font-bold  tracking-widest px-1"
                  [class.text-gray-400]="isGeoProvActive()"
                  [class.text-gray-300]="!isGeoProvActive()">Provincia</span>
                <div class="relative">
                <button (click)="isGeoProvActive() && toggleGeoDropdown('prov'); $event.stopPropagation()"
                  class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all
                         min-w-[130px] sm:min-w-[148px] justify-between"
                  [class.bg-gray-50]="isGeoProvActive()" [class.border-gray-200]="isGeoProvActive()"
                  [class.text-gray-700]="isGeoProvActive()" [class.hover\:bg-gray-100]="isGeoProvActive()"
                  [class.bg-gray-50\/50]="!isGeoProvActive()" [class.border-gray-100]="!isGeoProvActive()"
                  [class.text-gray-300]="!isGeoProvActive()" [class.cursor-not-allowed]="!isGeoProvActive()">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0"
                      [class.bg-\[\#1a75aa\]]="isGeoProvActive()" [class.bg-gray-200]="!isGeoProvActive()"></span>
                    <span class="truncate max-w-[80px] sm:max-w-[90px]">{{ geoProvLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                    [class.text-gray-400]="isGeoProvActive()" [class.text-gray-200]="!isGeoProvActive()"
                    [class.rotate-180]="openGeoDropdown() === 'prov'"></app-hero-icon>
                </button>
                @if (openGeoDropdown() === 'prov' && isGeoProvActive()) {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-60 sm:w-64 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar provincia</span>
                    </div>
                    <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                      <button (click)="selectProv('')"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedProv() === ''" [class.from-\[\#0056a1\]]="selectedProv() === ''" [class.to-\[\#1a75aa\]]="selectedProv() === ''"
                        [class.text-white]="selectedProv() === ''" [class.text-gray-700]="selectedProv() !== ''" [class.hover\:bg-blue-50]="selectedProv() !== ''">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedProv() === ''" [class.border-gray-300]="selectedProv() !== ''">
                          @if (selectedProv() === '') { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-bold italic">Todas las provincias</span>
                      </button>
                      @for (p of provinces(); track p.code) {
                        <button (click)="selectProv(p.code)"
                          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                          [class.bg-gradient-to-r]="selectedProv() === p.code" [class.from-\[\#0056a1\]]="selectedProv() === p.code" [class.to-\[\#1a75aa\]]="selectedProv() === p.code"
                          [class.text-white]="selectedProv() === p.code" [class.text-gray-700]="selectedProv() !== p.code" [class.hover\:bg-blue-50]="selectedProv() !== p.code">
                          <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            [class.border-white]="selectedProv() === p.code" [class.border-gray-300]="selectedProv() !== p.code">
                            @if (selectedProv() === p.code) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold">{{ p.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
              </div>

            <!-- ★ Distrito -->
              <div class="flex flex-col gap-0.5">
                <span class="text-[9px] font-bold  tracking-widest px-1"
                  [class.text-gray-400]="isGeoDistActive()"
                  [class.text-gray-300]="!isGeoDistActive()">Distrito</span>
                <div class="relative">
                <button (click)="isGeoDistActive() && toggleGeoDropdown('dist'); $event.stopPropagation()"
                  class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all
                         min-w-[120px] sm:min-w-[140px] justify-between"
                  [class.bg-gray-50]="isGeoDistActive()" [class.border-gray-200]="isGeoDistActive()"
                  [class.text-gray-700]="isGeoDistActive()" [class.hover\:bg-gray-100]="isGeoDistActive()"
                  [class.bg-gray-50\/50]="!isGeoDistActive()" [class.border-gray-100]="!isGeoDistActive()"
                  [class.text-gray-300]="!isGeoDistActive()" [class.cursor-not-allowed]="!isGeoDistActive()">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0"
                      [class.bg-\[\#33b3a9\]]="isGeoDistActive()" [class.bg-gray-200]="!isGeoDistActive()"></span>
                    <span class="truncate max-w-[75px] sm:max-w-[85px]">{{ geoDistLabel() }}</span>
                  </span>
                  <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                    [class.text-gray-400]="isGeoDistActive()" [class.text-gray-200]="!isGeoDistActive()"
                    [class.rotate-180]="openGeoDropdown() === 'dist'"></app-hero-icon>
                </button>
                @if (openGeoDropdown() === 'dist' && isGeoDistActive()) {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-72 sm:w-80 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar distrito</span>
                    </div>
                    <div class="max-h-56 sm:max-h-60 overflow-y-auto">
                      <button (click)="selectDist('')"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedDist() === ''" [class.from-\[\#0056a1\]]="selectedDist() === ''" [class.to-\[\#1a75aa\]]="selectedDist() === ''"
                        [class.text-white]="selectedDist() === ''" [class.text-gray-700]="selectedDist() !== ''" [class.hover\:bg-blue-50]="selectedDist() !== ''">
                        <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedDist() === ''" [class.border-gray-300]="selectedDist() !== ''">
                          @if (selectedDist() === '') { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-bold italic">Todos los distritos</span>
                      </button>
                      @for (d of districts(); track d.code) {
                        <button (click)="selectDist(d.code)"
                          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                          [class.bg-gradient-to-r]="selectedDist() === d.code" [class.from-\[\#0056a1\]]="selectedDist() === d.code" [class.to-\[\#1a75aa\]]="selectedDist() === d.code"
                          [class.text-white]="selectedDist() === d.code" [class.text-gray-700]="selectedDist() !== d.code" [class.hover\:bg-blue-50]="selectedDist() !== d.code">
                          <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            [class.border-white]="selectedDist() === d.code" [class.border-gray-300]="selectedDist() !== d.code">
                            @if (selectedDist() === d.code) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold">{{ d.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
              </div>

            <!-- ★ Tipo de comunidad (después de Distrito) -->
              <div class="flex flex-col items-start gap-0.5 shrink-0" (click)="$event.stopPropagation()">
                <span class="text-[9px] font-black text-gray-400  tracking-widest px-0.5 leading-none hidden sm:block">Tipo de comunidad</span>
                <div class="relative">
                  <button (click)="openAreaDropdown.update(v => !v)"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                           transition-all duration-200 focus:outline-none border whitespace-nowrap"
                    [style]="openAreaDropdown()
                      ? 'background:#dcdcdc; color:#374151; border-color:#d1d5db'
                      : 'background:#efefef; color:#374151; border-color:#e5e7eb'">
                    <span>{{ areaLabel() }}</span>
                    <app-hero-icon [name]="'chevron-down'"
                      class="w-3 h-3 shrink-0 transition-transform duration-200"
                      [class.rotate-180]="openAreaDropdown()"></app-hero-icon>
                  </button>
                  @if (openAreaDropdown()) {
                    <div class="absolute right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-200
                                 shadow-xl z-50 overflow-hidden"
                         style="min-width:148px; animation:dropdownIn 0.15s ease-out"
                         (click)="$event.stopPropagation()">
                      <div class="h-0.5 w-full" style="background:#d1d5db"></div>
                      <div class="px-3 pt-2 pb-1">
                        <span class="text-[9px] font-black text-gray-400  tracking-widest">Seleccionar</span>
                      </div>
                      @for (a of AREAS_FILTRO; track a.key) {
                        <button (click)="areaFiltro.set(a.key); openAreaDropdown.set(false)"
                          class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                          [class.text-white]="areaFiltro() === a.key"
                          [class.text-gray-700]="areaFiltro() !== a.key"
                          [class.hover\:bg-gray-50]="areaFiltro() !== a.key"
                          [style.background]="areaFiltro() === a.key ? '#6b7280' : ''">
                          <span class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                            [class.border-white]="areaFiltro() === a.key"
                            [style.border-color]="areaFiltro() !== a.key ? '#6b7280' : ''">
                            @if (areaFiltro() === a.key) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                          </span>
                          <span class="font-semibold flex-1">{{ a.label }}</span>
                        </button>
                      }
                      <div class="h-1"></div>
                    </div>
                  }
                </div>
              </div>

          </div><!-- /geo-dropdowns -->
        </div><!-- /inner filtros redondeado -->
      </div><!-- /sticky wrapper barra de filtros -->

      <!-- ══ CONTENIDO PRINCIPAL ════════════════════════════════════════════
           Wrapper que en xl activa scroll interno para que el header quede fijo
      ══════════════════════════════════════════════════════════════════════ -->
      <div class="flex-1 p-3 md:p-4 2xl:p-5 xl:overflow-hidden xl:min-h-0 flex flex-col">

      @if (expandedSection() === 'principales') {
        <!-- ══ GRID PRINCIPAL — COMUNIDADES INDÍGENAS ═══════════════════════
             3 secciones x 6 filas: Características | Organización | Tierras
        ══════════════════════════════════════════════════════════════════ -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6
                    gap-3 2xl:gap-4 xl:min-h-0 xl:overflow-hidden">

          <!-- ═══════════ SECCIÓN A — CARACTERÍSTICAS DE LA COMUNIDAD (COL 1-2) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Características de la comunidad</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Fila 1 (COL1+COL2): KPI Comunidades censadas -->
              <app-comunidad-kpi
                class="flex-[1_0_0] min-h-[76px] xl:min-h-0"
                variant="hero"
                [gradient]="'linear-gradient(135deg,#038dd3 0%,#33b3a9 100%)'"
                icon="dashboards/generico.svg"
                label="Comunidades censadas"
                [value]="fmt(comunidadesCensadas)"
                tooltip="Total de comunidades campesinas y nativas empadronadas en el Censo Nacional 2025"
                sub="1/ Incluye comunidades reconocidas y no reconocidas">
              </app-comunidad-kpi>

              <!-- Fila 2: Población total (COL1) + Viviendas censadas (COL2) -->
              <div class="flex flex-col sm:flex-row gap-2 flex-[1_0_0] min-h-[130px] xl:min-h-0">
                <app-comunidad-kpi class="flex-1 min-w-0"
                  variant="card" icon="pobcensada.svg"
                  label="Población total censada en comunidades"
                  [value]="fmt(poblacionTotalComunidades)"
                  tooltip="Cantidad de personas residentes habituales censadas dentro del ámbito de las comunidades">
                </app-comunidad-kpi>
                <app-comunidad-kpi class="flex-1 min-w-0"
                  variant="card" icon="dashboards/vivcensada.svg"
                  label="Viviendas censadas en comunidades"
                  [value]="fmt(viviendasCensadasComunidades)"
                  tooltip="Total de viviendas particulares y colectivas censadas dentro del ámbito de las comunidades">
                </app-comunidad-kpi>
              </div>

              <!-- Filas 3-4: pertenencia a pueblo indígena (COL1) + idioma/lengua (COL2) -->
              <div class="flex flex-col sm:flex-row gap-2 flex-[2_0_0] min-h-[260px] xl:min-h-0">
                <app-comunidad-chart class="flex-1 min-w-0"
                  title="Comunidades según pertenencia a un pueblo indígena u originario"
                  tooltip="Distribución de comunidades según su autoidentificación con un pueblo indígena u originario"
                  note="4/ Autoidentificación declarada por la autoridad o representante comunal entrevistado."
                  [options]="optPertenencia" [isBrowser]="isBrowser"
                  [items]="[{label:'Perteneciente a un pueblo indígena u originario', color:'#0056a1'},{label:'No perteneciente a ningún pueblo indígena u originario', color:'#caeae4'}]">
                </app-comunidad-chart>
                <app-comunidad-chart class="flex-1 min-w-0"
                  title="Comunidades según uso de idioma o lengua indígena u originaria"
                  tooltip="Distribución de comunidades según el uso de una lengua o idioma indígena u originario en su territorio"
                  note="5/ Considera el idioma o lengua predominante utilizado por la mayoría de la población comunal."
                  [options]="optIdioma" [isBrowser]="isBrowser"
                  [items]="[{label:'Se habla una lengua o idioma indígena u originario', color:'#038dd3'},{label:'No se habla un idioma o lengua indígena u originario', color:'#caeae4'}]">
                </app-comunidad-chart>
              </div>

              <!-- Filas 5-6: sexo de autoridades (COL1) + grupo de edad de autoridades (COL2) -->
              <div class="flex flex-col sm:flex-row gap-2 flex-[2_0_0] min-h-[260px] xl:min-h-0">
                <app-comunidad-chart class="flex-1 min-w-0"
                  title="Comunidades según sexo de sus autoridades"
                  tooltip="Distribución de comunidades según el sexo de su autoridad o representante principal"
                  note="6/ Corresponde a la autoridad vigente al momento del empadronamiento (presidente/a comunal u equivalente)."
                  [options]="optSexoAutoridades" [isBrowser]="isBrowser"
                  [items]="[{label:'Hombre', color:'#0056a1'},{label:'Mujer', color:'#33b3a9'}]">
                </app-comunidad-chart>
                <app-comunidad-chart class="flex-1 min-w-0"
                  title="Comunidades según grupo de edad de sus autoridades"
                  tooltip="Distribución de comunidades según el grupo de edad de su autoridad o representante principal"
                  note="7/ Edad declarada por la autoridad comunal al momento de la entrevista."
                  [options]="optEdadAutoridades" [isBrowser]="isBrowser">
                </app-comunidad-chart>
              </div>

            </div>
          </div><!-- /Sección A -->

          <!-- ═══════════ SECCIÓN B — ORGANIZACIÓN DE LA COMUNIDAD (COL 3-4) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Organización de la comunidad</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Filas 1-2: situación de reconocimiento -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según situación de reconocimiento"
                tooltip="Distribución de comunidades según si cuentan con reconocimiento oficial vigente"
                note="8/ Reconocimiento otorgado por la autoridad competente conforme a la normativa vigente."
                [options]="optReconocimiento1" [isBrowser]="isBrowser"
                [items]="[{label:'Reconocidas', color:'#0056a1'},{label:'No están reconocidas', color:'#d1d5db'}]">
              </app-comunidad-chart>

              <!-- Filas 3-4: inscripción como personas jurídicas en registros públicos -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según inscripción como personas jurídicas en registros públicos"
                tooltip="Distribución de comunidades según si están inscritas como personas jurídicas en la Superintendencia Nacional de los Registros Públicos (SUNARP)"
                note="9/ Se considera inscrita cuando cuenta con partida registral vigente como persona jurídica."
                [options]="optInscripcionPJ" [isBrowser]="isBrowser"
                [items]="[{label:'Sí', color:'#038dd3'},{label:'No', color:'#d1d5db'},{label:'Está en trámite', color:'#8383fd'}]">
              </app-comunidad-chart>

              <!-- Fila 5: % mujeres en juntas directivas comunales -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="mujer.svg"
                iconFilter="invert(65%) sepia(30%) saturate(700%) hue-rotate(132deg) brightness(92%) contrast(87%)"
                label="Porcentaje de mujeres en juntas directivas comunales"
                [value]="fmtD(pctMujeresJuntas,1)" unit="%"
                tooltip="Porcentaje de integrantes mujeres en las juntas directivas comunales">
              </app-comunidad-kpi>

              <!-- Fila 6: Comunidades afiliadas a organización representativa o federación -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="dashboards/generico.svg"
                label="Comunidades afiliadas a alguna organización representativa o federación"
                [value]="fmt(comunidadesAfiliadas)"
                [pct]="fmtD(comunidadesAfiliadas / comunidadesCensadas * 100, 1) + '%'"
                tooltip="Comunidades que declaran estar afiliadas a una organización representativa o federación de comunidades">
              </app-comunidad-kpi>

            </div>
          </div><!-- /Sección B -->

          <!-- ═══════════ SECCIÓN C — SITUACIÓN DE TIERRAS (COL 5-6) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Situación de tierras</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Filas 1-2: tenencia de título de propiedad -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según tenencia de título de propiedad"
                tooltip="Distribución de comunidades según si cuentan con título de propiedad de su territorio comunal"
                note="12/ Incluye título individual o colectivo emitido a favor de la comunidad."
                [options]="optTenenciaTitulo" [isBrowser]="isBrowser"
                [items]="[{label:'Sí', color:'#0056a1'},{label:'No', color:'#d1d5db'},{label:'Está en trámite', color:'#8383fd'}]">
              </app-comunidad-chart>

              <!-- Fila 3: título inscrito en registros públicos -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="dashboards/generico.svg"
                label="Comunidades con título de propiedad inscrito en registros públicos"
                [value]="fmt(tituloInscrito)"
                [pct]="fmtD(tituloInscrito / comunidadesCensadas * 100, 1) + '%'"
                tooltip="Comunidades con título de propiedad inscrito en la Superintendencia Nacional de los Registros Públicos (SUNARP)">
              </app-comunidad-kpi>

              <!-- Fila 4: territorio comunal georreferenciado -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="dashboards/logo-mapa.svg"
                label="Comunidades con territorio comunal georreferenciado por el Gobierno Regional"
                [value]="fmt(georreferenciado)"
                [pct]="fmtD(georreferenciado / comunidadesCensadas * 100, 1) + '%'"
                tooltip="Comunidades cuyo territorio comunal ha sido georreferenciado por el Gobierno Regional">
              </app-comunidad-kpi>

              <!-- Filas 5-6: conflictos por posesión de tierras y manejo del agua -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según existencia de conflictos por posesión de tierras y por manejo del agua"
                tooltip="Comunidades que declaran la existencia de conflictos activos por posesión de tierras o por manejo del agua"
                note="15/ Un mismo conflicto puede involucrar a más de una comunidad."
                [options]="optConflictos" [isBrowser]="isBrowser">
              </app-comunidad-chart>

            </div>
          </div><!-- /Sección C -->

        </div><!-- /grid 6 cols -->
      }

      @if (expandedSection() === 'recursos') {
        <!-- ══ GRID PRINCIPAL — RECURSOS NATURALES, EQUIPAMIENTO Y ACCESO ═════
             3 secciones x 8 col / 5 filas: Recursos Naturales | Bienes y servicios
             de comunicación | Vías de acceso y medios de transporte
        ══════════════════════════════════════════════════════════════════ -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8
                    gap-3 2xl:gap-4 xl:min-h-0 xl:overflow-hidden">

          <!-- ═══════════ SECCIÓN A — RECURSOS NATURALES (COL 1-3) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-3 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Recursos Naturales</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Filas 1-2 (COL1-3): afectación por actividades extractivas -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según afectación por actividades extractivas"
                tooltip="Distribución de comunidades según el tipo de actividad extractiva que afecta su territorio"
                note="1/ Una misma comunidad puede reportar más de un tipo de actividad extractiva."
                [options]="optAfectacionExtractivas" [isBrowser]="isBrowser">
              </app-comunidad-chart>

              <!-- Fila 3: agua/sequía (COL1) + ríos/lagos (COL2-3) -->
              <div class="flex flex-col sm:flex-row gap-2 flex-[1_0_0] min-h-[130px] xl:min-h-0">
                <app-comunidad-kpi class="flex-1 min-w-0"
                  variant="card" icon="dashboards/generico.svg"
                  label="Comunidades con afectación por falta de agua o sequía"
                  [value]="fmt(afectacionSequia)"
                  [pct]="fmtD(afectacionSequia / comunidadesCensadas * 100, 1) + '%'"
                  tooltip="Comunidades que declaran afectación por falta de agua o sequía en su territorio">
                </app-comunidad-kpi>
                <app-comunidad-kpi class="flex-[2_0_0] min-w-0"
                  variant="card" icon="dashboards/generico.svg"
                  label="Comunidades con ríos, lagos o estanques"
                  [value]="fmt(conRiosLagos)"
                  [pct]="fmtD(conRiosLagos / comunidadesCensadas * 100, 1) + '%'"
                  tooltip="Comunidades que declaran contar con ríos, lagos o estanques dentro de su territorio">
                </app-comunidad-kpi>
              </div>

              <!-- Filas 4-5: incendios + especies en riesgo (COL1) / estado de las aguas (COL2-3) -->
              <div class="flex flex-col sm:flex-row gap-2 flex-[2_0_0] min-h-[260px] xl:min-h-0">
                <div class="flex flex-col gap-2 flex-1 min-w-0">
                  <app-comunidad-kpi class="flex-1 min-h-[80px]"
                    variant="card" icon="dashboards/generico.svg"
                    label="Comunidades con afectación por incendios forestales"
                    [value]="fmt(afectacionIncendios)"
                    [pct]="fmtD(afectacionIncendios / comunidadesCensadas * 100, 1) + '%'"
                    tooltip="Comunidades que declaran afectación por incendios forestales en su territorio">
                  </app-comunidad-kpi>
                  <app-comunidad-kpi class="flex-1 min-h-[80px]"
                    variant="card" icon="dashboards/generico.svg"
                    label="Comunidades con especies animales y/o vegetales en riesgo de desaparecer"
                    [value]="fmt(especiesEnRiesgo)"
                    [pct]="fmtD(especiesEnRiesgo / comunidadesCensadas * 100, 1) + '%'"
                    tooltip="Comunidades que declaran la presencia de especies animales y/o vegetales en riesgo de desaparecer">
                  </app-comunidad-kpi>
                </div>
                <app-comunidad-chart class="flex-[2_0_0] min-w-0"
                  title="Comunidades según estado de las aguas de ríos, lagos o estanques"
                  tooltip="Distribución de comunidades según el estado de las aguas de sus ríos, lagos o estanques"
                  [options]="optEstadoAguas" [isBrowser]="isBrowser">
                </app-comunidad-chart>
              </div>

            </div>
          </div><!-- /Sección A -->

          <!-- ═══════════ SECCIÓN B — BIENES Y SERVICIOS DE COMUNICACIÓN (COL 4-6) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-3 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Bienes y servicios de comunicación</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Filas 1-3 (COL4-6): tenencia de bienes de uso comunal -->
              <app-comunidad-chart class="flex-[3_0_0] min-h-[300px] xl:min-h-0"
                title="Comunidades según tenencia de bienes de uso comunal"
                tooltip="Distribución de comunidades según los bienes de uso comunal con los que cuentan"
                note="2/ Fuente de energía: paneles solares, generador u otra fuente distinta a la red pública. 3/ Herramientas de uso agrícola o forestal. 4/ Incluye embarcaciones y vehículos motorizados de uso comunal."
                [options]="optBienesComunales" [isBrowser]="isBrowser">
              </app-comunidad-chart>

              <!-- Filas 4-5 (COL4-6): acceso a servicios de comunicación -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según acceso a servicios de comunicación"
                tooltip="Distribución de comunidades según los servicios de comunicación a los que tienen acceso"
                note="5/ Una misma comunidad puede tener acceso a más de un servicio de comunicación."
                [options]="optServiciosComunicacion" [isBrowser]="isBrowser">
              </app-comunidad-chart>

            </div>
          </div><!-- /Sección B -->

          <!-- ═══════════ SECCIÓN C — VÍAS DE ACCESO Y MEDIOS DE TRANSPORTE (COL 7-8) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Vías de acceso y medios de transporte</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Filas 1-3 (COL7-8): tipo de vía de acceso -->
              <app-comunidad-chart class="flex-[3_0_0] min-h-[300px] xl:min-h-0"
                title="Comunidades según tipo de vía de acceso para llegar desde la capital distrital"
                tooltip="Distribución de comunidades según el tipo de vía de acceso utilizada para llegar desde la capital distrital"
                [options]="optTipoVia" [isBrowser]="isBrowser">
              </app-comunidad-chart>

              <!-- Filas 4-5: cantidad de vías (COL7) + KPIs transporte (COL8) -->
              <div class="flex flex-col sm:flex-row gap-2 flex-[2_0_0] min-h-[260px] xl:min-h-0">
                <app-comunidad-chart class="flex-1 min-w-0"
                  title="Comunidades según cantidad de vías de acceso para llegar desde la capital distrital"
                  tooltip="Distribución de comunidades según la cantidad de vías de acceso disponibles para llegar desde la capital distrital"
                  [options]="optCantidadVias" [isBrowser]="isBrowser">
                </app-comunidad-chart>
                <div class="flex flex-col gap-2 flex-1 min-w-0">
                  <app-comunidad-kpi class="flex-1 min-h-[80px]"
                    variant="card" icon="dashboards/generico.svg"
                    label="Comunidades cuyo medio de transporte más utilizado es acémila o a pie"
                    [value]="fmt(transporteAcemilaPie)"
                    [pct]="fmtD(transporteAcemilaPie / comunidadesCensadas * 100, 1) + '%'"
                    tooltip="Comunidades cuyo medio de transporte más utilizado para llegar desde la capital distrital es acémila o a pie">
                  </app-comunidad-kpi>
                  <app-comunidad-kpi class="flex-1 min-h-[80px]"
                    variant="card" icon="dashboards/generico.svg"
                    label="Comunidades que utilizan un medio de transporte cuya frecuencia es semanal, quincenal o mensual"
                    [value]="fmt(transporteFrecuenciaBaja)"
                    [pct]="fmtD(transporteFrecuenciaBaja / comunidadesCensadas * 100, 1) + '%'"
                    tooltip="Comunidades cuyo medio de transporte más utilizado tiene una frecuencia semanal, quincenal o mensual">
                  </app-comunidad-kpi>
                </div>
              </div>

            </div>
          </div><!-- /Sección C -->

        </div><!-- /grid 8 cols -->
      }

      @if (expandedSection() === 'educacion') {
        <!-- ══ GRID PRINCIPAL — EDUCACIÓN, SALUD Y ECONOMÍA ══════════════════
             3 secciones x 6 col / 7 filas: Educación | Salud y medicina
             tradicional | Actividades económicas y de conservación
        ══════════════════════════════════════════════════════════════════ -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6
                    gap-3 2xl:gap-4 xl:min-h-0 xl:overflow-hidden">

          <!-- ═══════════ SECCIÓN A — EDUCACIÓN (COL 1-2) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Educación</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Fila 1: KPI Comunidades con institución educativa -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[76px] xl:min-h-0"
                variant="hero"
                [gradient]="'linear-gradient(135deg,#038dd3 0%,#33b3a9 100%)'"
                icon="dashboards/generico.svg"
                label="Comunidades con institución educativa"
                [value]="fmt(comunidadesConIe)"
                tooltip="Comunidades que cuentan con al menos una institución educativa dentro de su territorio">
              </app-comunidad-kpi>

              <!-- Fila 2: KPI con IE de Educación Intercultural Bilingüe -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="dashboards/generico.svg"
                label="Comunidades con al menos una institución educativa con Educación Intercultural Bilingüe"
                [value]="fmt(ieConEib)"
                [pct]="fmtD(ieConEib / comunidadesCensadas * 100, 1) + '%'"
                tooltip="Comunidades con al menos una institución educativa que brinda Educación Intercultural Bilingüe (EIB)">
              </app-comunidad-kpi>

              <!-- Fila 3: KPI con material educativo intercultural -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="dashboards/generico.svg"
                label="Comunidades que tienen al menos una institución educativa que dispone de material educativo intercultural y/o en lengua indígena u originaria"
                [value]="fmt(ieMaterialIntercultural)"
                [pct]="fmtD(ieMaterialIntercultural / comunidadesCensadas * 100, 1) + '%'"
                tooltip="Comunidades con al menos una institución educativa que dispone de material educativo intercultural y/o en lengua indígena u originaria">
              </app-comunidad-kpi>

              <!-- Filas 4-5: identificación étnica, procedencia y lengua de los profesores -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según identificación étnica, procedencia y lengua de los profesores"
                tooltip="Distribución de comunidades según la identificación étnica, procedencia y lengua de sus profesores"
                [options]="optProfesoresEtnicidad" [isBrowser]="isBrowser">
              </app-comunidad-chart>

              <!-- Filas 6-7: tenencia de bienes/servicios TIC's en instituciones educativas -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según tenencia de bienes/servicios TIC's en las instituciones educativas"
                tooltip="Distribución de comunidades según los bienes y servicios TIC's disponibles en sus instituciones educativas"
                [options]="optTicEducativas" [isBrowser]="isBrowser">
              </app-comunidad-chart>

            </div>
          </div><!-- /Sección A -->

          <!-- ═══════════ SECCIÓN B — SALUD Y MEDICINA TRADICIONAL (COL 3-4) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Salud y medicina tradicional</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Fila 1: KPI Comunidades con establecimiento de salud -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[76px] xl:min-h-0"
                variant="hero"
                [gradient]="'linear-gradient(135deg,#038dd3 0%,#33b3a9 100%)'"
                icon="dashboards/generico.svg"
                label="Comunidades con establecimiento de salud"
                [value]="fmt(comunidadesConSalud)"
                tooltip="Comunidades que cuentan con al menos un establecimiento de salud dentro de su territorio">
              </app-comunidad-kpi>

              <!-- Filas 2-3: categoría de establecimiento de salud -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según categoría de establecimiento de salud"
                tooltip="Distribución de comunidades según la categoría de su establecimiento de salud"
                [options]="optCategoriaEstablecimientoSalud" [isBrowser]="isBrowser"
                [items]="[{label:'Puesto/Posta de salud', color:'#0056a1'},{label:'Centro de salud con internamiento', color:'#038dd3'},{label:'Centro de salud sin internamiento', color:'#33b3a9'},{label:'Otro tipo', color:'#caeae4'}]">
              </app-comunidad-chart>

              <!-- Fila 4: KPI con al menos un profesional de salud -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="dashboards/generico.svg"
                label="Comunidades con al menos un profesional de salud (médico, obstetra, enfermero/a o tecnólogo médico)"
                [value]="fmt(saludProfesional)"
                [pct]="fmtD(saludProfesional / comunidadesCensadas * 100, 1) + '%'"
                tooltip="Comunidades que cuentan con al menos un profesional de salud (médico, obstetra, enfermero/a o tecnólogo médico)">
              </app-comunidad-kpi>

              <!-- Fila 5: KPI prácticas de medicina tradicional -->
              <app-comunidad-kpi class="flex-[1_0_0] min-h-[80px] xl:min-h-0"
                variant="card" icon="dashboards/generico.svg"
                label="Comunidades que realizan prácticas de medicina tradicional"
                [value]="fmt(medicinaTradicional)"
                [pct]="fmtD(medicinaTradicional / comunidadesCensadas * 100, 1) + '%'"
                tooltip="Comunidades que declaran realizar prácticas de medicina tradicional">
              </app-comunidad-kpi>

              <!-- Filas 6-7: persona consultada en caso de enfermedad y/o accidente -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según persona a la que los miembros de la comunidad usualmente consultan en caso de enfermedad y/o accidente"
                tooltip="Distribución de comunidades según a quién consultan usualmente sus miembros en caso de enfermedad y/o accidente"
                note="1/ Médico, obstetra, enfermero/a o tecnólogo médico. 2/ Incluye curandero/a, chamán, partera, yerbero, sabio, entre otros."
                [options]="optConsultaSalud" [isBrowser]="isBrowser">
              </app-comunidad-chart>

            </div>
          </div><!-- /Sección B -->

          <!-- ═══════════ SECCIÓN C — ACTIVIDADES ECONÓMICAS Y DE CONSERVACIÓN (COL 5-6) ═══════════ -->
          <div class="col-span-1 md:col-span-2 xl:col-span-2 xl:min-h-0 flex flex-col gap-2">
            <h3 class="text-[11px] md:text-xs font-black uppercase tracking-wider text-gray-500 px-0.5 shrink-0">Actividades económicas y de conservación</h3>
            <div class="flex-1 flex flex-col gap-2 xl:min-h-0">

              <!-- Filas 1-3: actividad económica realizada -->
              <app-comunidad-chart class="flex-[3_0_0] min-h-[300px] xl:min-h-0"
                title="Comunidades según actividad económica realizada"
                tooltip="Distribución de comunidades según el tipo de actividad económica que realizan"
                note="1/ Incluye otras actividades productivas o empresariales distintas a las categorías listadas."
                [options]="optActividadEconomica" [isBrowser]="isBrowser">
              </app-comunidad-chart>

              <!-- Filas 4-5: uso de prácticas tradicionales y/o ancestrales -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según uso de prácticas tradicionales y/o ancestrales en actividades económicas"
                tooltip="Distribución de comunidades según el uso de prácticas tradicionales y/o ancestrales en sus actividades económicas"
                [options]="optPracticasTradicionales" [isBrowser]="isBrowser">
              </app-comunidad-chart>

              <!-- Filas 6-7: actividad de conservación del medio ambiente -->
              <app-comunidad-chart class="flex-[2_0_0] min-h-[260px] xl:min-h-0"
                title="Comunidades según actividad de conservación del medio ambiente que realizan"
                tooltip="Distribución de comunidades según el tipo de actividad de conservación del medio ambiente que realizan"
                [options]="optActividadConservacion" [isBrowser]="isBrowser">
              </app-comunidad-chart>

            </div>
          </div><!-- /Sección C -->

        </div><!-- /grid 6 cols educación -->
      }
      </div><!-- /main -->

    </section>
  `,
    styles: [`
    :host { display: block; min-height: 100vh; }
    ::ng-deep .custom-tooltip {
      background-color: white !important; color: #333 !important; border-radius: 12px !important;
      padding: 10px 14px !important; font-size: 12px !important; font-weight: 600 !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,.1) !important; border: 1px solid #e5e7eb !important;
      max-width: 240px !important; white-space: normal !important;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardCensadaComponent implements OnInit {

    // ── Header nav ───────────────────────────────────────────────────────
    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);
    censosMenu = [
        { label: 'Censo de Derecho',         route: '/censo-derecho' },
        { label: 'Características técnicas', route: '/aspectos-generales' },
        { label: 'Innovaciones tecnológicas', route: '/innovaciones' },
        { label: 'Normatividad censal',       route: '/normativa' },
        { label: 'Actividades censales',        route: '/actividades' },
        { label: 'Documentación Técnica',     route: '/documentacion-tecnica' },
    ];

    @HostListener('document:click')
    onDocumentClick() {
        this.censosOpen.set(false);
        this.mobileMenuOpen.set(false);
        this.openGeoDropdown.set(null);
        this.openAreaDropdown.set(false);
    }

    toggleCensos(e: Event)     { e.stopPropagation(); this.censosOpen.update(v => !v); }
    toggleMobileMenu(e: Event) { e.stopPropagation(); this.mobileMenuOpen.update(v => !v); }



    readonly tematicTabs = [
    // Nueva entrada vinculada a tu archivo dashboard-tematico.ts
    { label: 'General Temático', icon: 'squares-2x2',    route: '/dashboard-tematico' }, 
    
    { label: 'Educación',        icon: 'academic-cap',  route: '/dashboard-educacion' },
    { label: 'Salud',            icon: 'heart',         route: '/dashboard-salud' },
    { label: 'Economía',         icon: 'banknotes',     route: '/dashboard-economia' },
];

    // ── Sección expandida en barra de filtros ─────────────────────────────
    expandedSection = signal<'principales' | 'tematicos' | 'recursos' | 'educacion' | null>('principales');

    toggleNavSection(section: 'principales' | 'tematicos' | 'recursos' | 'educacion'): void {
        this.expandedSection.update(v => v === section ? null : section);
    }

    isViewTabActive(route: string): boolean {
        return this.router.url === route || this.router.url.startsWith(route + '/');
    }

    // ── Botonera de secciones (barra superior) ───────────────────────────
    readonly navSections = [
        { id: 'poblacion_total',     label: 'Indicadores de población total',                icon: 'chart-bar',      route: '/dashboard' },
        { id: 'poblacion_viviendas', label: 'Indicadores de población y viviendas censadas', icon: 'home',           route: '/dashboard-censada' },
        { id: 'poblacion_comunidades', label: 'Indicadores de comunidades indígenas', icon: 'home',          forceActive: true },

    ];

    private router = inject(Router);
    isBtnActive(btn: { id: string; route?: string; forceActive?: boolean }): boolean {
        if (btn.forceActive) return true;
        return this.router.url === btn.route || this.router.url.startsWith((btn.route ?? '') + '/');
    }

    goToSection(btn: { id: string; route?: string }): void {
        if (!btn.route) return;
        this.router.navigateByUrl(btn.route);
    }

    // ── Leyenda gráfico hogares ───────────────────────────────────────────
    readonly vivHogarLegend = [
        { label: 'Con 1 hogar',   color: '#0056a1' },
        { label: 'Con 2 hogares', color: '#33b3a9' },
        { label: 'Con 3 hogares', color: '#038dd3' },
        { label: 'Con 4 y más',   color: '#343b9f' },
    ];

    // ── Geo state ─────────────────────────────────────────────────────────
    readonly NIVELES_GEO: NivelGeoType[] = ['Departamental', 'Provincial', 'Distrital'];
    nivelGeo        = signal<NivelGeoType>('Departamental');
    openGeoDropdown = signal<'dep' | 'prov' | 'dist' | null>(null);
    selectedCCDD    = signal<string>('');
    selectedProv    = signal<string>('');
    selectedDist    = signal<string>('');

    // ── Filtro de tipo de comunidad ──────────────────────────────────────
    readonly AREAS_FILTRO: { key: AreaFiltroType; label: string }[] = [
        { key: 'total',     label: 'Todas'     },
        { key: 'campesina', label: 'Campesina' },
        { key: 'nativa',    label: 'Nativa'    },
    ];
    areaFiltro       = signal<AreaFiltroType>('total');
    openAreaDropdown = signal<boolean>(false);
    areaLabel        = computed(() => this.AREAS_FILTRO.find(a => a.key === this.areaFiltro())?.label ?? 'Todas');

    isGeoProvActive = computed(() => this.nivelGeo() !== 'Departamental');
    isGeoDistActive = computed(() => this.nivelGeo() === 'Distrital');

    private rawGeoJson     = signal<any>(null);
    private rawGeoJsonProv = signal<any>(null);
    private rawGeoJsonDist = signal<any>(null);

    // ── Listas para dropdowns ─────────────────────────────────────────────
    departments = computed<{ ccdd: string; name: string }[]>(() => {
        const geo = this.rawGeoJson(); if (!geo?.features) return [];
        const raw = (geo.features as any[]).map((f: any) => ({ ccdd: String(f.properties.CCDD), name: String(f.properties.NOMBDEP) }));
        const isLimaMet = (d: { name: string }) => d.name.toLowerCase().includes('lima') && !d.name.toLowerCase().includes('región') && !d.name.toLowerCase().includes('region');
        const isRegLima = (d: { name: string }) => d.name.toLowerCase().includes('región lima') || d.name.toLowerCase().includes('region lima');
        const limaMet = raw.find(isLimaMet); const regLima = raw.find(isRegLima);
        const resto   = raw.filter(d => !isLimaMet(d) && !isRegLima(d));
        const sorted  = [...resto].sort((a, b) => parseInt(a.ccdd, 10) - parseInt(b.ccdd, 10));
        const lambIdx = sorted.findIndex(d => d.ccdd === '14');
        const insertAt = lambIdx >= 0 ? lambIdx + 1 : sorted.length;
        const extras: typeof sorted = [];
        if (limaMet) extras.push(limaMet); if (regLima) extras.push(regLima);
        sorted.splice(insertAt, 0, ...extras);
        return sorted;
    });

    provinces = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonProv(); if (!geo?.features) return [];
        const ccdd = this.selectedCCDD();
        const features = ccdd
            ? (geo.features as any[]).filter(f => String(f.properties.CCDD) === ccdd)
            : (geo.features as any[]);
        return features
            .map(f => ({ code: String(f.properties.CCPP), name: String(f.properties.NOMBPROV), sortKey: String(f.properties.CCDD) + String(f.properties.CCPP) }))
            .sort((a, b) => (a.sortKey ?? '').localeCompare(b.sortKey ?? ''));
    });

    districts = computed<GeoOption[]>(() => {
        const geo  = this.rawGeoJsonDist(); if (!geo?.features) return [];
        const ccdd = this.selectedCCDD(); const ccpp = this.selectedProv();
        let features = geo.features as any[];
        if (ccdd) features = features.filter(f => String(f.properties.CCDD) === ccdd);
        if (ccpp) features = features.filter(f => String(f.properties.CCPP) === ccpp);
        return features
            .map(f => ({ code: String(f.properties.UBIGEO), name: String(f.properties.NOMBDIST), sortKey: String(f.properties.UBIGEO) }))
            .sort((a, b) => (a.sortKey ?? '').localeCompare(b.sortKey ?? ''));
    });

    geoDepLabel  = computed(() => { const c = this.selectedCCDD(); return c ? (this.departments().find(d => d.ccdd === c)?.name ?? c) : 'Todos'; });
    geoProvLabel = computed(() => { const c = this.selectedProv();  return c ? (this.provinces().find(p => p.code === c)?.name ?? c) : 'Todos'; });
    geoDistLabel = computed(() => { const c = this.selectedDist();  return c ? (this.districts().find(d => d.code === c)?.name ?? c) : 'Todos'; });

    toggleGeoDropdown(key: 'dep' | 'prov' | 'dist'): void { this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key); }
    closeGeoDropdowns(): void {
        this.openGeoDropdown.set(null);
        this.openAreaDropdown.set(false);
    }

    selectDep(dept: { ccdd: string; name: string } | null): void {
        this.selectedCCDD.set(dept?.ccdd ?? '');
        this.selectedProv.set(''); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (dept) {
            this.nivelGeo.set('Provincial'); this.loadGeoJsonProv();
        } else { this.nivelGeo.set('Departamental'); }
    }

    selectProv(code: string): void {
        this.selectedProv.set(code); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (code) {
            this.nivelGeo.set('Distrital'); this.loadGeoJsonDist();
        } else if (this.selectedCCDD()) { this.nivelGeo.set('Provincial'); }
    }

    selectDist(code: string): void { this.selectedDist.set(code); this.openGeoDropdown.set(null); }

    resetFilters(): void {
        this.selectedCCDD.set(''); this.selectedProv.set(''); this.selectedDist.set('');
        this.nivelGeo.set('Departamental');
        this.openGeoDropdown.set(null); this.openAreaDropdown.set(false);
        this.areaFiltro.set('total');
    }

    // ── Mock Comunidades indígenas ───────────────────────────────────────
    readonly comunidadesCensadas         = 9_369;
    readonly poblacionTotalComunidades   = 665_183;
    readonly viviendasCensadasComunidades = 187_924;
    readonly pctMujeresJuntas            = 18.4;
    readonly comunidadesAfiliadas        = 6_214;
    readonly tituloInscrito              = 4_102;
    readonly georreferenciado            = 3_588;

    // ── Mock Recursos naturales, equipamiento y acceso ───────────────────
    readonly afectacionSequia            = 3_842;
    readonly conRiosLagos                = 6_215;
    readonly afectacionIncendios         = 1_927;
    readonly especiesEnRiesgo            = 2_568;
    readonly transporteAcemilaPie        = 4_103;
    readonly transporteFrecuenciaBaja    = 2_984;

    // ── Mock Educación, salud y economía ─────────────────────────────────
    readonly comunidadesConIe            = 7_842;
    readonly ieConEib                    = 4_213;
    readonly ieMaterialIntercultural     = 3_650;
    readonly comunidadesConSalud         = 3_988;
    readonly saludProfesional            = 3_120;
    readonly medicinaTradicional         = 5_890;

    // ── ECharts estáticos ─────────────────────────────────────────────────
    isBrowser = false;

    // ── ECharts — indicadores de comunidades ────────────────────────────
    optPertenencia:       EChartsOption = {};
    optIdioma:             EChartsOption = {};
    optSexoAutoridades:    EChartsOption = {};
    optEdadAutoridades:    EChartsOption = {};
    optReconocimiento1:    EChartsOption = {};
    optInscripcionPJ:      EChartsOption = {};
    optTenenciaTitulo:     EChartsOption = {};
    optConflictos:         EChartsOption = {};

    // ── ECharts — recursos naturales, equipamiento y acceso ──────────────
    optAfectacionExtractivas:   EChartsOption = {};
    optEstadoAguas:              EChartsOption = {};
    optBienesComunales:          EChartsOption = {};
    optServiciosComunicacion:    EChartsOption = {};
    optTipoVia:                  EChartsOption = {};
    optCantidadVias:              EChartsOption = {};

    // ── ECharts — educación, salud y economía ────────────────────────────
    optProfesoresEtnicidad:            EChartsOption = {};
    optTicEducativas:                   EChartsOption = {};
    optCategoriaEstablecimientoSalud:   EChartsOption = {};
    optConsultaSalud:                   EChartsOption = {};
    optActividadEconomica:              EChartsOption = {};
    optPracticasTradicionales:          EChartsOption = {};
    optActividadConservacion:           EChartsOption = {};

    // ── Inyecciones ───────────────────────────────────────────────────────
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);

    constructor() { this.isBrowser = isPlatformBrowser(this.platformId); }

    ngOnInit(): void { this.initCharts(); this.loadGeoJson(); }

    // ── Carga GeoJSON ─────────────────────────────────────────────────────
    loadGeoJson(): void {
        if (this.rawGeoJson()) return;
        this.http.get<any>('/departamento_geometria.json').subscribe({
            next:  data  => this.rawGeoJson.set(data),
            error: ()    => {},
        });
    }

    loadGeoJsonProv(): void {
        if (this.rawGeoJsonProv()) return;
        this.http.get<any>('/provincia_geometria.json').subscribe({
            next:  data => this.rawGeoJsonProv.set(data),
            error: ()   => {},
        });
    }

    loadGeoJsonDist(): void {
        if (this.rawGeoJsonDist()) return;
        this.http.get<any>('/distrito_geometria.json').subscribe({
            next:  data => this.rawGeoJsonDist.set(data),
            error: ()   => {},
        });
    }

    // ── Utilidades ────────────────────────────────────────────────────────
    fmt(n: number): string  { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    fmtD(n: number, dec = 1): string { return n.toFixed(dec).replace('.', ','); }

    // ── Inicialización de gráficos estáticos ─────────────────────────────
    initCharts(): void {
        // ── Gráficos: indicadores de comunidades indígenas ──────────────
        this.optPertenencia = this.donutOptions([
            { name: 'Perteneciente a un pueblo indígena u originario',       value: 7_514, color: '#0056a1' },
            { name: 'No perteneciente a ningún pueblo indígena u originario', value: 1_855, color: '#caeae4' },
        ]);
        this.optIdioma = this.donutOptions([
            { name: 'Se habla una lengua o idioma indígena u originario',     value: 6_102, color: '#038dd3' },
            { name: 'No se habla un idioma o lengua indígena u originario',   value: 3_267, color: '#caeae4' },
        ]);
        this.optSexoAutoridades = this.donutOptions([
            { name: 'Hombre', value: 8_102, color: '#0056a1' },
            { name: 'Mujer',  value: 1_267, color: '#33b3a9' },
        ]);
        this.optEdadAutoridades = this.barOptionsSimple(
            ['Menos de 34 años', '35–59 años', '60 años y más'],
            [
                { value: 1_124, color: '#038dd3' },
                { value: 5_902, color: '#33b3a9' },
                { value: 2_343, color: '#8383fd' },
            ],
        );
        this.optReconocimiento1 = this.donutOptions([
            { name: 'Reconocidas',           value: 7_890, color: '#0056a1' },
            { name: 'No están reconocidas',  value: 1_479, color: '#d1d5db' },
        ]);
        this.optInscripcionPJ = this.donutOptions([
            { name: 'Sí',              value: 5_817, color: '#038dd3' },
            { name: 'No',              value: 2_621, color: '#d1d5db' },
            { name: 'Está en trámite', value:   931, color: '#8383fd' },
        ]);
        this.optTenenciaTitulo = this.donutOptions([
            { name: 'Sí',              value: 5_214, color: '#0056a1' },
            { name: 'No',              value: 2_809, color: '#d1d5db' },
            { name: 'Está en trámite', value: 1_346, color: '#8383fd' },
        ]);
        this.optConflictos = this.barOptionsSimple(
            ['Posesión de tierras', 'Manejo del agua'],
            [
                { value: 2_145, color: '#0056a1' },
                { value: 1_389, color: '#33b3a9' },
            ],
        );

        // ── Gráficos: recursos naturales, equipamiento y acceso ─────────
        this.optAfectacionExtractivas = this.barOptionsSimple(
            ['Tala legal de árboles', 'Tala ilegal de bosques', 'Extracción de petróleo y/o gas', 'Minería formal', 'Minería informal y/o ilegal'],
            [
                { value:   612, color: '#0056a1' },
                { value: 1_834, color: '#038dd3' },
                { value:   743, color: '#33b3a9' },
                { value:   891, color: '#8383fd' },
                { value: 2_156, color: '#343b9f' },
            ],
        );
        this.optEstadoAguas = this.barOptionsSimple(
            ['Limpias', 'Parcialmente limpias', 'Contaminadas'],
            [
                { value: 3_980, color: '#0056a1' },
                { value: 3_102, color: '#038dd3' },
                { value: 2_287, color: '#d1d5db' },
            ],
        );
        this.optBienesComunales = this.barOptionsSimple(
            ['Televisor', 'Computadora/laptop', 'Fuente de energía 1/', 'Herramientas 2/', 'Medio de transporte con motor 3/', 'Medio de transporte con motor 4/'],
            [
                { value: 5_820, color: '#0056a1' },
                { value: 1_240, color: '#038dd3' },
                { value: 6_910, color: '#33b3a9' },
                { value: 7_830, color: '#8383fd' },
                { value: 2_140, color: '#343b9f' },
                { value:   980, color: '#caeae4' },
            ],
        );
        this.optServiciosComunicacion = this.barOptionsSimple(
            ['Señal de internet', 'Señal de telefonía', 'Señal de radio', 'Radiofonía de onda corta', 'Señal de TV por cable y/o satelital'],
            [
                { value: 1_230, color: '#0056a1' },
                { value: 3_450, color: '#038dd3' },
                { value: 6_780, color: '#33b3a9' },
                { value: 2_340, color: '#8383fd' },
                { value:   890, color: '#343b9f' },
            ],
        );
        this.optTipoVia = this.hbarOptionsSimple(
            ['Camino de herradura/trocha', 'Camino carrozable', 'Carretera afirmada', 'Carretera asfaltada', 'Vía fluvial', 'Vía aérea', 'Otras vías 1/'],
            [
                { value: 3_120, color: '#0056a1' },
                { value: 4_560, color: '#038dd3' },
                { value:   980, color: '#33b3a9' },
                { value:   310, color: '#8383fd' },
                { value:   280, color: '#343b9f' },
                { value:    45, color: '#caeae4' },
                { value:    74, color: '#9ca3af' },
            ],
        );
        this.optCantidadVias = this.barOptionsSimple(
            ['Una vía', '2 vías', '3 o más vías'],
            [
                { value: 6_210, color: '#0056a1' },
                { value: 2_340, color: '#33b3a9' },
                { value:   819, color: '#8383fd' },
            ],
        );

        // ── Gráficos: educación, salud y economía ────────────────────────
        this.optProfesoresEtnicidad = this.hbarOptionsSimple(
            [
                'Indígenas del/de los pueblo/s indígena/s u originario/s de la comunidad',
                'Indígenas del/de los pueblo/s indígena/s u originario/s de otras comunidades',
                'No indígenas que hablan la/s lengua/s indígena/s u originaria/s de la comunidad',
                'No indígenas que no hablan la/s lengua/s indígena/s u originaria/s de la comunidad',
            ],
            [
                { value: 4_820, color: '#0056a1' },
                { value: 1_340, color: '#038dd3' },
                { value: 2_150, color: '#33b3a9' },
                { value: 1_059, color: '#d1d5db' },
            ],
        );
        this.optTicEducativas = this.barOptionsSimple(
            ['Computadora/laptop', 'Tableta', 'Internet'],
            [
                { value: 6_120, color: '#0056a1' },
                { value: 1_840, color: '#038dd3' },
                { value: 3_260, color: '#33b3a9' },
            ],
        );
        this.optCategoriaEstablecimientoSalud = this.donutOptions([
            { name: 'Puesto/Posta de salud',                 value: 2_340, color: '#0056a1' },
            { name: 'Centro de salud con internamiento',      value:   580, color: '#038dd3' },
            { name: 'Centro de salud sin internamiento',      value:   920, color: '#33b3a9' },
            { name: 'Otro tipo',                              value:   148, color: '#caeae4' },
        ]);
        this.optConsultaSalud = this.hbarOptionsSimple(
            ['Personal de salud 1/', 'Promotor/a de salud', 'Curandero/a, chamán, partera, yerbero, sabio, entre otros 2/', 'Familiares o ellos mismos'],
            [
                { value: 1_780, color: '#0056a1' },
                { value: 2_340, color: '#038dd3' },
                { value: 3_120, color: '#33b3a9' },
                { value: 2_129, color: '#8383fd' },
            ],
        );
        this.optActividadEconomica = this.hbarOptionsSimple(
            ['Agrícolas', 'Pecuarias', 'Caza', 'Piscicultura', 'Artesanales', 'Comercialización', 'Explotación forestal', 'Otras actividades productivas o empresariales 1/', 'Ninguna actividad productiva o empresarial'],
            [
                { value: 7_820, color: '#0056a1' },
                { value: 5_340, color: '#038dd3' },
                { value: 1_230, color: '#33b3a9' },
                { value:   890, color: '#8383fd' },
                { value: 2_140, color: '#343b9f' },
                { value: 1_560, color: '#caeae4' },
                { value:   980, color: '#9ca3af' },
                { value:   650, color: '#0056a1' },
                { value:   410, color: '#d1d5db' },
            ],
        );
        this.optPracticasTradicionales = this.barOptionsSimple(
            ['Agricultura', 'Ganadería', 'Caza', 'Pesca'],
            [
                { value: 6_210, color: '#0056a1' },
                { value: 4_320, color: '#038dd3' },
                { value: 1_450, color: '#33b3a9' },
                { value: 2_340, color: '#8383fd' },
            ],
        );
        this.optActividadConservacion = this.barOptionsSimple(
            ['Protección de fuentes de agua', 'Reforestación con especies nativas', 'Tratamiento de aguas contaminadas por minería', 'Potenciar agricultura sostenible', 'Preservación de especies en peligro', 'Manejo de residuos sólidos', 'Agroforestería', 'Ninguna actividad de conservación'],
            [
                { value: 3_120, color: '#0056a1' },
                { value: 2_340, color: '#038dd3' },
                { value:   980, color: '#33b3a9' },
                { value: 1_560, color: '#8383fd' },
                { value: 1_230, color: '#343b9f' },
                { value: 1_890, color: '#caeae4' },
                { value:   740, color: '#9ca3af' },
                { value: 1_120, color: '#d1d5db' },
            ],
        );
    }

    // ── Helpers de gráficos: donut / barras genéricas ───────────────────────
    private donutOptions(data: { name: string; value: number; color: string }[]): EChartsOption {
        const total = data.reduce((s, d) => s + d.value, 0);
        return {
            tooltip: {
                show: true, trigger: 'item',
                formatter: (p: any) => {
                    const pct = total > 0 ? ((p.value / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} <span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`;
                },
            },
            legend: { show: false },
            color: data.map(d => d.color),
            series: [{
                type: 'pie', radius: ['46%', '74%'], avoidLabelOverlap: true, center: ['50%', '50%'],
                itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                label: {
                    show: true, position: 'outside', fontSize: 9, fontWeight: 'bold', color: '#6b7280',
                    formatter: (p: any) => {
                        const pct = total > 0 ? (((p.value as number) / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                        return `${pct}%`;
                    },
                },
                labelLine: { show: true, length: 5, length2: 5, lineStyle: { color: '#d1d5db' } },
                data: data.map(d => ({ value: d.value, name: d.name })),
            }],
        };
    }

    private barOptionsSimple(categories: string[], data: { value: number; color: string }[]): EChartsOption {
        const total = data.reduce((s, d) => s + d.value, 0);
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'none' },
                formatter: (params: any) => {
                    const p = params[0];
                    const pct = total > 0 ? ((p.value / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} <span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`;
                },
            },
            grid: { top: 26, right: 6, bottom: 22, left: 6, containLabel: true },
            xAxis: {
                type: 'category', data: categories,
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#9ca3af', interval: 0, overflow: 'truncate' },
            },
            yAxis: { type: 'value', show: false, max: (val: any) => Math.round(val.max * 1.35) },
            series: [{
                type: 'bar', barMaxWidth: 46, barCategoryGap: '28%',
                itemStyle: { borderRadius: [6, 6, 0, 0] },
                label: {
                    show: true, position: 'top',
                    formatter: (p: any) => {
                        const pct = total > 0 ? (((p.value as number) / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                        return `{abs|${this.fmt(p.value as number)}}\n{pct|${pct}%}`;
                    },
                    rich: {
                        abs: { fontSize: 9,   fontWeight: 'bold', color: '#374151', lineHeight: 12 },
                        pct: { fontSize: 8.5, fontWeight: 'bold', color: '#6b7280', lineHeight: 12 },
                    },
                },
                data: data.map(d => ({ value: d.value, itemStyle: { color: d.color } })),
            }],
        };
    }

    private hbarOptionsSimple(categories: string[], data: { value: number; color: string }[]): EChartsOption {
        const total = data.reduce((s, d) => s + d.value, 0);
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    const p = params[0];
                    const pct = total > 0 ? ((p.value / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                    return `<div style="font-size:11px;font-weight:900;color:#374151;margin-bottom:2px">${p.name}</div><div style="font-size:12px;font-weight:700;color:${p.color}">${this.fmt(p.value)} <span style="color:#9ca3af;font-size:10px">(${pct}%)</span></div>`;
                },
            },
            grid: { top: 4, right: 52, bottom: 4, left: 4, containLabel: true },
            xAxis: { type: 'value', show: false, max: (v: any) => Math.round(v.max * 1.4) },
            yAxis: {
                type: 'category', data: categories, inverse: true,
                axisTick: { show: false }, axisLine: { show: false },
                axisLabel: { fontSize: 9, fontWeight: 'bold', color: '#424242', width: 120, overflow: 'break' },
            },
            series: [{
                type: 'bar', barMaxWidth: 16, barCategoryGap: '28%',
                itemStyle: { borderRadius: [0, 4, 4, 0] },
                data: data.map(d => ({ value: d.value, itemStyle: { color: d.color } })),
                label: {
                    show: true, position: 'right',
                    formatter: (p: any) => {
                        const pct = total > 0 ? (((p.value as number) / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                        return `{num|${this.fmt(p.value as number)}}  {pct|${pct}%}`;
                    },
                    rich: {
                        num: { fontSize: 9, fontWeight: 'bold', color: '#424242' },
                        pct: { fontSize: 8.5, fontWeight: 'bold' as any, color: '#9ca3af' },
                    },
                },
            }],
        };
    }
}
