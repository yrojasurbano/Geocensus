import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

/**
 * MAP-VIEWER COMPONENT
 *
 * Ruta del archivo: src/components/map-viewer.component.ts
 *
 * GeoJSON cargado en runtime desde:  src/assets/departamento_geometria.json
 * Angular sirve /assets/ directamente durante ng serve y ng build.
 * No se necesita import estático ni resolveJsonModule en tsconfig.
 *
 * Campos esperados en cada feature.properties del GeoJSON:
 *   UBIGEO   → código de departamento
 *   NOMBDEP  → nombre del departamento
 *   POBTOTAL → población total censada
 *   POBHOMBRE → población masculina
 *   POBMUJER  → población femenina
 *   DENSIDAD  → densidad poblacional (hab/km²)
 */
@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col relative font-sans">

      <!-- ── CABECERA ── -->
      <div class="flex justify-between items-center mb-3 flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold text-[#009FE3] leading-none">POBLACIÓN CENSADA</h3>
          <span class="text-sm font-bold text-gray-800 uppercase block mt-0.5 transition-all duration-200">
            {{ hoveredRegion() ? hoveredRegion().name : 'PERÚ (NACIONAL)' }}
          </span>
        </div>
        <div class="text-right">
          <h2 class="text-2xl font-black text-[#9E1F3D] transition-all duration-200">
            {{ (hoveredRegion() ? hoveredRegion().total : totalNational()) | number }}
          </h2>
          <span class="text-[9px] text-gray-400 font-bold uppercase">Habitantes</span>
        </div>
      </div>

      <!-- ── ÁREA DEL MAPA ── -->
      <div class="relative flex-1 bg-[#FFF5F5] rounded-xl overflow-hidden border border-rose-100 flex items-center justify-center min-h-0">

        <!-- Spinner -->
        @if (isLoading()) {
          <div class="flex flex-col items-center gap-3 text-gray-400">
            <div class="w-10 h-10 border-4 border-[#C5328A]/20 border-t-[#C5328A] rounded-full animate-spin"></div>
            <span class="text-xs font-semibold uppercase tracking-widest">Cargando mapa...</span>
          </div>
        }

        <!-- Error -->
        @if (loadError() && !isLoading()) {
          <div class="flex flex-col items-center gap-3 p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-sm font-bold text-gray-700">No se pudo cargar el mapa</p>
              <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                Verifica que el archivo<br>
                <code class="bg-gray-100 px-1 rounded">departamento_geometria.json</code><br>
                esté en <code class="bg-gray-100 px-1 rounded">src/assets/</code>
              </p>
            </div>
            <button (click)="loadGeoJson()"
                    class="text-xs px-4 py-1.5 bg-[#C5328A] text-white rounded-lg hover:bg-[#a02474] transition-colors font-semibold">
              Reintentar
            </button>
          </div>
        }

        <!-- Mapa SVG -->
        @if (!isLoading() && !loadError() && mapRegions().length > 0) {

          <!-- Leyenda -->
          <div class="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm p-2.5 rounded-lg shadow border border-rose-100 pointer-events-none">
            <p class="text-[7px] font-black text-gray-500 mb-1.5 uppercase tracking-widest">Densidad Poblacional</p>
            <div class="space-y-1">
              @for (item of legend; track item.label) {
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        [style.background]="item.color"
                        [style.border]="item.border ? '1px solid #fecdd3' : 'none'">
                  </span>
                  <span class="text-[8px] text-gray-600 font-semibold">{{ item.label }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Tooltip -->
          @if (hoveredRegion()) {
            <div class="absolute top-2 right-2 z-20 bg-gray-900/95 text-white p-3 rounded-xl shadow-2xl
                        min-w-[190px] border border-gray-700 pointer-events-none tooltip-anim">
              <p class="text-[8px] text-rose-400 uppercase font-black tracking-widest mb-1">Población Censada</p>
              <p class="text-sm font-bold text-white border-b border-gray-700 pb-1.5 mb-2 leading-tight">
                {{ hoveredRegion().name }}
              </p>
              <div class="flex justify-between mb-2">
                <span class="text-[8px] text-gray-400 uppercase font-bold">Total</span>
                <span class="text-sm font-black">{{ hoveredRegion().total | number }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 border-t border-gray-800 pt-1.5">
                <div>
                  <div class="flex items-center gap-1 mb-0.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-[#5A9CF8]"></div>
                    <span class="text-[7px] text-gray-400 font-bold uppercase">Hombres</span>
                  </div>
                  <p class="text-xs font-bold">{{ hoveredRegion().men | number }}</p>
                  <p class="text-[8px] text-gray-400">
                    {{ hoveredRegion().total > 0 ? (hoveredRegion().men / hoveredRegion().total * 100 | number:'1.1-1') : '0' }}%
                  </p>
                </div>
                <div>
                  <div class="flex items-center gap-1 mb-0.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-[#E91E63]"></div>
                    <span class="text-[7px] text-gray-400 font-bold uppercase">Mujeres</span>
                  </div>
                  <p class="text-xs font-bold">{{ hoveredRegion().women | number }}</p>
                  <p class="text-[8px] text-gray-400">
                    {{ hoveredRegion().total > 0 ? (hoveredRegion().women / hoveredRegion().total * 100 | number:'1.1-1') : '0' }}%
                  </p>
                </div>
              </div>
              <div class="flex justify-between border-t border-gray-800 pt-1.5 mt-1.5">
                <span class="text-[8px] text-gray-400 uppercase font-bold">Densidad</span>
                <span class="text-xs font-bold text-yellow-400">
                  {{ hoveredRegion().density | number:'1.1-2' }} hab/km²
                </span>
              </div>
            </div>
          }

          <!-- SVG Map -->
          <div class="w-full h-full p-2 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 400 600"
                 class="h-full w-auto max-h-full drop-shadow"
                 style="aspect-ratio:400/600;">

              <!-- Departamentos -->
              <g>
                @for (r of mapRegions(); track r.id) {
                  <path
                    [attr.d]="r.path"
                    [attr.fill]="getColor(r.densityScore)"
                    stroke="#ffffff"
                    stroke-width="1.5"
                    class="cursor-pointer"
                    [style.opacity]="hoveredRegion() && hoveredRegion()?.id !== r.id ? '0.28' : '1'"
                    [style.transition]="'opacity 0.2s, filter 0.2s'"
                    [style.filter]="hoveredRegion()?.id === r.id ? 'brightness(0.85) drop-shadow(0 0 4px rgba(197,50,138,0.55))' : 'none'"
                    (mouseenter)="onHover(r)"
                    (mouseleave)="onLeave()">
                  </path>
                }
              </g>

              <!-- Etiquetas -->
              <g class="pointer-events-none">
                @for (r of mapRegions(); track r.id) {
                  @if (r.scaleFactor > 0.12) {
                    <text
                      [attr.x]="r.center.x"
                      [attr.y]="r.center.y - r.iconSize - 1"
                      text-anchor="middle"
                      font-size="5.5"
                      font-weight="900"
                      font-family="sans-serif"
                      style="paint-order:stroke; stroke:#fff; stroke-width:2.5; fill:#3b0764; text-transform:uppercase;">
                      {{ r.name }}
                    </text>
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
    .tooltip-anim {
      animation: tipIn 0.15s ease-out forwards;
    }
    @keyframes tipIn {
      from { opacity:0; transform:scale(0.96) translateY(-4px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }
  `],
})
export class MapViewerComponent implements OnInit {

  private http = inject(HttpClient);

  // ── Estado ─────────────────────────────────────────────────────────────────
  hoveredRegion = signal<any | null>(null);
  isLoading     = signal(true);
  loadError     = signal(false);
  private raw   = signal<any | null>(null);

  // ── Leyenda del mapa ───────────────────────────────────────────────────────
  readonly legend = [
    { label: 'Muy Alta', color: '#7B1A2B', border: false },
    { label: 'Alta',     color: '#C2264B', border: false },
    { label: 'Media',    color: '#E8748A', border: false },
    { label: 'Baja',     color: '#F7B8C3', border: true  },
    { label: 'Muy Baja', color: '#FDE8EC', border: true  },
  ];

  // ── Proyección geográfica ──────────────────────────────────────────────────
  private readonly B = { minLon: -81.5, maxLon: -68.5, minLat: -18.5, maxLat: 0.0 };
  private readonly S = { w: 400, h: 600 };

  // ── Ciclo de vida ──────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadGeoJson(); }

  loadGeoJson(): void {
    this.isLoading.set(true);
    this.loadError.set(false);
    this.raw.set(null);

    this.http.get<any>('assets/departamento_geometria.json').subscribe({
      next:  d  => { this.raw.set(d); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.loadError.set(true); },
    });
  }

  // ── Regiones computadas ────────────────────────────────────────────────────
  mapRegions = computed(() => {
    const geo = this.raw();
    if (!geo?.features) return [];

    const features: any[] = geo.features;
    let maxPop = 0;
    features.forEach(f => {
      const p = f.properties;
      const t = Number(p.POBTOTAL) || (Number(p.POBHOMBRE) + Number(p.POBMUJER));
      if (t > maxPop) maxPop = t;
    });

    return features.map((f, idx) => {
      const p   = f.properties;
      const men   = Number(p.POBHOMBRE) || 0;
      const women = Number(p.POBMUJER)  || 0;
      const total = Number(p.POBTOTAL)  || (men + women);
      const density = Number(p.DENSIDAD) || 0;

      const svg   = this.project(f.geometry);
      const sf    = maxPop > 0 ? Math.sqrt(total) / Math.sqrt(maxPop) : 0;
      const score = maxPop > 0 ? total / maxPop : 0;

      return {
        id: p.UBIGEO || idx,
        name: String(p.NOMBDEP || 'SIN NOMBRE'),
        total, men, women, density,
        path: svg.path,
        center: svg.center,
        densityScore: score,
        scaleFactor: sf,
        iconSize: 6 + sf * 18,
      };
    });
  });

  totalNational = computed(() => this.mapRegions().reduce((a, r) => a + r.total, 0));

  // ── Paleta pastel-roja ─────────────────────────────────────────────────────
  getColor(score: number): string {
    if (score > 0.80) return '#7B1A2B';
    if (score > 0.50) return '#C2264B';
    if (score > 0.30) return '#E8748A';
    if (score > 0.10) return '#F7B8C3';
    return '#FDE8EC';
  }

  // ── Proyección GeoJSON → SVG ───────────────────────────────────────────────
  private project(geom: any): { path: string; center: { x: number; y: number } } {
    if (!geom) return { path: '', center: { x: 0, y: 0 } };

    let path = '', sx = 0, sy = 0, n = 0;

    const pt = (c: number[]) => ({
      x: ((c[0] - this.B.minLon) / (this.B.maxLon - this.B.minLon)) * this.S.w,
      y: (1 - (c[1] - this.B.minLat) / (this.B.maxLat - this.B.minLat)) * this.S.h,
    });

    const ring = (coords: number[][]) => {
      let s = '';
      coords.forEach((c, i) => {
        const p = pt(c);
        s += (i ? 'L' : 'M') + `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
        sx += p.x; sy += p.y; n++;
      });
      return s + 'Z ';
    };

    if (geom.type === 'Polygon') {
      geom.coordinates.forEach((r: number[][]) => (path += ring(r)));
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((poly: number[][][]) =>
        poly.forEach((r: number[][]) => (path += ring(r)))
      );
    }

    return { path, center: { x: n ? sx / n : 0, y: n ? sy / n : 0 } };
  }

  onHover(r: any): void { this.hoveredRegion.set(r);    }
  onLeave():       void { this.hoveredRegion.set(null);  }
}