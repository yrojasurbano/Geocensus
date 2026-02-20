import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col relative font-sans">

      <!-- ── CABECERA (requerida por spec) ── -->
      <div class="flex justify-between items-center mb-4 z-10 h-16 flex-shrink-0">
        <div>
          <h3 class="text-xl font-bold text-[#009FE3] leading-none">POBLACIÓN CENSADA</h3>
          <span class="text-sm font-bold text-black uppercase block mt-1 transition-all">
            {{ hoveredRegion() ? hoveredRegion().name : 'PERÚ (NACIONAL)' }}
          </span>
        </div>
        <div class="text-right">
          <h2 class="text-3xl font-bold text-[#9E1F3D] transition-all duration-200">
            {{ (hoveredRegion() ? hoveredRegion().total : totalNational()) | number }}
          </h2>
          <span class="text-[10px] text-gray-400 font-bold uppercase">Habitantes Totales</span>
        </div>
      </div>

      <!-- ── ÁREA DEL MAPA ── -->
      <div class="relative flex-1 bg-[#FFF5F5] rounded-lg overflow-hidden border border-rose-100 flex items-center justify-center min-h-0">

        <!-- Spinner de carga -->
        @if (isLoading()) {
          <div class="flex flex-col items-center gap-3 text-gray-400">
            <div class="w-10 h-10 border-4 border-[#C5328A]/20 border-t-[#C5328A] rounded-full animate-spin"></div>
            <span class="text-xs font-semibold uppercase tracking-widest">Cargando mapa...</span>
          </div>
        }

        <!-- Error de carga -->
        @if (loadError() && !isLoading()) {
          <div class="flex flex-col items-center gap-3 text-red-400 p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-sm font-bold text-gray-700">No se pudo cargar el mapa</p>
              <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                Verifica que el archivo<br>
                <code class="bg-gray-100 px-1 py-0.5 rounded text-gray-600">departamento_geometria.json</code><br>
                esté en la carpeta<br>
                <code class="bg-gray-100 px-1 py-0.5 rounded text-gray-600">src/assets/</code>
              </p>
            </div>
            <button (click)="loadGeoJson()"
                    class="text-xs px-4 py-1.5 bg-[#C5328A] text-white rounded-lg hover:bg-[#a02474] transition-colors font-semibold">
              Reintentar
            </button>
          </div>
        }

        <!-- Mapa renderizado -->
        @if (!isLoading() && !loadError() && mapRegions().length > 0) {

          <!-- Leyenda -->
          <div class="absolute bottom-3 left-3 bg-white/95 p-2.5 rounded-lg shadow-md z-10 border border-rose-100 pointer-events-none">
            <p class="text-[8px] font-black text-gray-500 mb-1.5 uppercase tracking-widest">Densidad Poblacional</p>
            <div class="space-y-1">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#7B1A2B"></span>
                <span class="text-[8px] text-gray-600 font-bold">Muy Alta</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#C2264B"></span>
                <span class="text-[8px] text-gray-600 font-bold">Alta</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#E8748A"></span>
                <span class="text-[8px] text-gray-600 font-bold">Media</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-rose-200" style="background:#F7B8C3"></span>
                <span class="text-[8px] text-gray-600 font-bold">Baja</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-rose-100" style="background:#FDE8EC"></span>
                <span class="text-[8px] text-gray-600 font-bold">Muy Baja</span>
              </div>
            </div>
          </div>

          <!-- Tooltip -->
          @if (hoveredRegion()) {
            <div class="absolute top-3 right-3 z-20 bg-gray-900/96 text-white p-3 rounded-xl shadow-2xl
                        min-w-[200px] max-w-[230px] animate-fade-in border border-gray-700 pointer-events-none">
              <div class="text-[8px] text-rose-400 uppercase font-black mb-0.5 tracking-widest">Población Censada</div>
              <div class="text-sm font-bold text-white mb-2 border-b border-gray-700 pb-1.5 leading-tight">
                {{ hoveredRegion().name }}
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-[8px] text-gray-400 uppercase font-bold">Total</span>
                <span class="text-sm font-black text-white">{{ hoveredRegion().total | number }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-800">
                <div>
                  <div class="flex items-center gap-1 mb-0.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-[#5A9CF8] flex-shrink-0"></div>
                    <span class="text-[8px] text-gray-400 font-bold uppercase">Hombres</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-white block">{{ hoveredRegion().men | number }}</span>
                  <span class="text-[8px] text-gray-500">
                    {{ (hoveredRegion().total > 0 ? hoveredRegion().men / hoveredRegion().total * 100 : 0) | number:'1.1-1' }}%
                  </span>
                </div>
                <div>
                  <div class="flex items-center gap-1 mb-0.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-[#E91E63] flex-shrink-0"></div>
                    <span class="text-[8px] text-gray-400 font-bold uppercase">Mujeres</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-white block">{{ hoveredRegion().women | number }}</span>
                  <span class="text-[8px] text-gray-500">
                    {{ (hoveredRegion().total > 0 ? hoveredRegion().women / hoveredRegion().total * 100 : 0) | number:'1.1-1' }}%
                  </span>
                </div>
              </div>
              <div class="flex justify-between items-center mt-2 pt-1.5 border-t border-gray-800">
                <span class="text-[8px] text-gray-400 uppercase font-bold">Densidad</span>
                <span class="text-xs font-bold text-yellow-400">
                  {{ hoveredRegion().density | number:'1.1-2' }} hab/km²
                </span>
              </div>
            </div>
          }

          <!-- SVG del mapa -->
          <div class="w-full h-full p-2 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 400 600"
                 class="h-full w-auto max-h-full drop-shadow-md"
                 style="aspect-ratio: 400/600;">

              <!-- Definición de iconos H/M reutilizables -->
              <defs>
                <path id="ic-male"
                  d="M6 0.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm-5.5 7a5.5 5.5 0 0 0-0.5 2.5h12a5.5 5.5 0 0 0-0.5-2.5 5 5 0 0 1-11 0z"/>
                <path id="ic-female"
                  d="M6 0.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm-5.5 7a5.5 5.5 0 0 0-0.5 2.5h4.5v3h2v-3h4.5a5.5 5.5 0 0 0-0.5-2.5 5 5 0 0 1-11 0z"/>
              </defs>

              <!-- Polígonos departamentales -->
              <g>
                @for (region of mapRegions(); track region.id) {
                  <path
                    [attr.d]="region.path"
                    [attr.fill]="getColor(region.densityScore)"
                    stroke="#ffffff"
                    stroke-width="0.6"
                    class="cursor-pointer"
                    [style.opacity]="hoveredRegion() && hoveredRegion()?.id !== region.id ? '0.3' : '1'"
                    [style.transition]="'opacity 0.25s ease, filter 0.25s ease'"
                    [style.filter]="hoveredRegion()?.id === region.id
                      ? 'brightness(0.85) drop-shadow(0 0 4px rgba(197,50,138,0.6))'
                      : 'none'"
                    (mouseenter)="onRegionHover(region)"
                    (mouseleave)="onRegionLeave()">
                  </path>
                }
              </g>

              <!-- Etiquetas de departamentos -->
              <g class="pointer-events-none">
                @for (region of mapRegions(); track region.id) {
                  @if (region.scaleFactor > 0.12) {
                    <text
                      [attr.x]="region.center.x"
                      [attr.y]="region.center.y - region.iconSize - 1"
                      text-anchor="middle"
                      font-size="5.5"
                      font-weight="900"
                      font-family="sans-serif"
                      letter-spacing="-0.3"
                      style="paint-order:stroke; stroke:#ffffff; stroke-width:2.5px; fill:#2d1a1e; text-transform:uppercase;">
                      {{ region.name }}
                    </text>
                  }
                }
              </g>

              <!-- Iconos de sexo por departamento -->
              <g class="pointer-events-none">
                @for (region of mapRegions(); track region.id) {
                  @if (region.scaleFactor > 0.07) {
                    <use href="#ic-male"
                         [attr.x]="region.center.x - region.iconSize - 0.5"
                         [attr.y]="region.center.y"
                         [attr.width]="region.iconSize"
                         [attr.height]="region.iconSize"
                         fill="#5A9CF8"
                         opacity="0.9"/>
                    <use href="#ic-female"
                         [attr.x]="region.center.x + 0.5"
                         [attr.y]="region.center.y"
                         [attr.width]="region.iconSize"
                         [attr.height]="region.iconSize"
                         fill="#E91E63"
                         opacity="0.9"/>
                  }
                }
              </g>
            </svg>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.97) translateY(-3px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.15s ease-out forwards; }
  `],
})
export class MapViewerComponent implements OnInit {

  private http = inject(HttpClient);

  // ── Estado reactivo ───────────────────────────────────────────────────────
  hoveredRegion = signal<any | null>(null);
  isLoading     = signal(true);
  loadError     = signal(false);

  /** GeoJSON cargado vía HttpClient */
  private geoJsonData = signal<any | null>(null);

  // ── Proyección ────────────────────────────────────────────────────────────
  private readonly BOUNDS = {
    minLon: -81.5, maxLon: -68.5,
    minLat: -18.5, maxLat:   0.0,
  };
  private readonly SVG = { w: 400, h: 600 };

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadGeoJson();
  }

  /**
   * Carga el GeoJSON desde la carpeta /assets usando HttpClient.
   *
   * VENTAJAS sobre el import estático:
   *  ✓ No requiere "resolveJsonModule" en tsconfig
   *  ✓ El archivo nunca se incluye en el bundle JS (mejor rendimiento)
   *  ✓ Muestra error claro si el archivo no existe
   *  ✓ Compatible con cualquier versión de Angular/TypeScript
   *
   * REQUISITO: el archivo debe estar en  src/assets/departamento_geometria.json
   * Angular sirve los assets en /assets/  durante ng serve y ng build.
   */
  loadGeoJson(): void {
    this.isLoading.set(true);
    this.loadError.set(false);
    this.geoJsonData.set(null);

    this.http.get<any>('assets/departamento_geometria.json').subscribe({
      next:  (data) => { this.geoJsonData.set(data); this.isLoading.set(false); },
      error: (err)  => { console.error('[MapViewer] Error cargando GeoJSON:', err); this.isLoading.set(false); this.loadError.set(true); },
    });
  }

  // ── Computed: regiones procesadas ─────────────────────────────────────────
  mapRegions = computed(() => {
    const geo = this.geoJsonData();
    if (!geo?.features) return [];

    const features: any[] = geo.features;

    // Máximo poblacional para normalizar el score de color
    let maxPop = 0;
    features.forEach(f => {
      const p = f.properties;
      const t = Number(p.POBTOTAL) || (Number(p.POBHOMBRE) + Number(p.POBMUJER));
      if (t > maxPop) maxPop = t;
    });

    return features.map((feature, index) => {
      const p       = feature.properties;
      const men     = Number(p.POBHOMBRE) || 0;
      const women   = Number(p.POBMUJER)  || 0;
      const total   = Number(p.POBTOTAL)  || (men + women);
      const density = Number(p.DENSIDAD)  || 0;

      const svg         = this.projectGeometry(feature.geometry);
      const scaleFactor = maxPop > 0 ? Math.sqrt(total) / Math.sqrt(maxPop) : 0;
      const iconSize    = 6 + scaleFactor * 18;
      const densScore   = maxPop > 0 ? total / maxPop : 0;

      return {
        id: p.UBIGEO || index,
        name: (p.NOMBDEP || 'SIN NOMBRE') as string,
        total, men, women, density,
        path: svg.path,
        center: svg.center,
        densityScore: densScore,
        scaleFactor,
        iconSize,
      };
    });
  });

  totalNational = computed(() =>
    this.mapRegions().reduce((acc, r) => acc + r.total, 0)
  );

  // ── Paleta pastel-roja (5 niveles) ───────────────────────────────────────
  getColor(score: number): string {
    if (score > 0.80) return '#7B1A2B';
    if (score > 0.50) return '#C2264B';
    if (score > 0.30) return '#E8748A';
    if (score > 0.10) return '#F7B8C3';
    return '#FDE8EC';
  }

  // ── Proyección GeoJSON → coordenadas SVG ─────────────────────────────────
  private projectGeometry(geometry: any): { path: string; center: { x: number; y: number } } {
    if (!geometry) return { path: '', center: { x: 0, y: 0 } };

    let pathStr = '';
    let sumX = 0, sumY = 0, count = 0;

    const project = (coord: number[]) => ({
      x: ((coord[0] - this.BOUNDS.minLon) / (this.BOUNDS.maxLon - this.BOUNDS.minLon)) * this.SVG.w,
      y: (1 - (coord[1] - this.BOUNDS.minLat) / (this.BOUNDS.maxLat - this.BOUNDS.minLat)) * this.SVG.h,
    });

    const processRing = (coords: number[][]) => {
      let s = '';
      coords.forEach((c, i) => {
        const p = project(c);
        s += (i === 0 ? 'M' : 'L') + `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
        sumX += p.x; sumY += p.y; count++;
      });
      return s + 'Z ';
    };

    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((r: number[][]) => (pathStr += processRing(r)));
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((poly: number[][][]) =>
        poly.forEach((r: number[][]) => (pathStr += processRing(r)))
      );
    }

    return {
      path:   pathStr,
      center: { x: count ? sumX / count : 0, y: count ? sumY / count : 0 },
    };
  }

  onRegionHover(region: any): void { this.hoveredRegion.set(region); }
  onRegionLeave(): void            { this.hoveredRegion.set(null);   }
}