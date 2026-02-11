import { Component, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
// Importación del GeoJSON
import * as geoData from '../assets/departamento_geometria.json';

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col relative font-sans">
      
      <div class="flex justify-between items-center mb-4 z-10 h-16">
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

      <div class="relative flex-1 bg-[#F8F9FA] rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
        
        <div class="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md z-10 border border-gray-100 pointer-events-none">
          <p class="text-[9px] font-black text-gray-500 mb-2 uppercase tracking-widest">Densidad Poblacional</p>
          <div class="space-y-1">
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-[#9E1F3D]"></span><span class="text-[9px] text-gray-600 font-bold">Muy Alta</span></div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-[#D95F0E]"></span><span class="text-[9px] text-gray-600 font-bold">Alta</span></div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-[#FE9929]"></span><span class="text-[9px] text-gray-600 font-bold">Media</span></div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-[#FFF7BC] border border-gray-200"></span><span class="text-[9px] text-gray-600 font-bold">Baja</span></div>
          </div>
        </div>

        @if(hoveredRegion()) {
           <div class="absolute top-4 right-4 z-20 bg-gray-900/95 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[220px] animate-fade-in border border-gray-700 pointer-events-none">
               <div class="text-[10px] text-blue-400 uppercase font-black mb-1 tracking-widest">Detalle Regional</div>
               <div class="text-lg font-bold text-white mb-2 border-b border-gray-700 pb-2">{{ hoveredRegion().name }}</div>
               
               <div class="space-y-3">
                   <div class="flex justify-between items-end">
                       <span class="text-[10px] text-gray-400 uppercase font-bold">Densidad</span>
                       <span class="text-sm font-bold text-yellow-400">{{ hoveredRegion().density | number:'1.1-2' }} <small class="text-[9px]">hab/km²</small></span>
                   </div>
                   
                   <div class="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                       <div class="flex flex-col">
                           <span class="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                               <div class="w-2 h-2 rounded-full bg-[#009FE3]"></div> Hombres
                           </span>
                           <span class="text-md font-mono font-bold text-white">{{ hoveredRegion().men | number }}</span>
                       </div>
                       <div class="flex flex-col">
                           <span class="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                               <div class="w-2 h-2 rounded-full bg-[#E91E63]"></div> Mujeres
                           </span>
                           <span class="text-md font-mono font-bold text-white">{{ hoveredRegion().women | number }}</span>
                       </div>
                   </div>
               </div>
           </div>
        }

        <div class="w-full h-full p-4 flex items-center justify-center">
             <svg viewBox="0 0 400 600" class="h-full w-auto drop-shadow-2xl" style="aspect-ratio: 400/600;">
               <defs>
                 <path id="icon-male" d="M12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2ZM12 10C15.97 10 19.2 12.8 19.9 16.5C19.95 16.8 19.7 17 19.4 17H4.6C4.3 17 4.05 16.75 4.1 16.5C4.8 12.8 8.03 10 12 10Z" />
                 <path id="icon-female" d="M12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2ZM4.1 16.5C4.8 12.8 8.03 10 12 10C15.97 10 19.2 12.8 19.9 16.5C19.95 16.8 19.7 17 19.4 17H16V22H14V17H10V22H8V17H4.6C4.3 17 4.05 16.75 4.1 16.5Z" />
               </defs>
               
               <g>
                   @for (region of mapRegions(); track region.id) {
                     <path 
                        [attr.d]="region.path" 
                        [attr.fill]="getColor(region.densityScore)"
                        stroke="#ffffff"
                        stroke-width="0.6"
                        class="cursor-pointer transition-all duration-300 hover:brightness-110"
                        [class.opacity-30]="hoveredRegion() && hoveredRegion()?.id !== region.id"
                        (mouseenter)="onRegionHover(region)"
                        (mouseleave)="onRegionLeave()"
                        >
                     </path>
                   }
               </g>

               <g class="pointer-events-none">
                  @for (region of mapRegions(); track region.id) {
                    @if(region.scaleFactor > 0.1) {
                      <text 
                        [attr.x]="region.center.x" 
                        [attr.y]="region.center.y - (region.iconSize.male / 1.5)" 
                        text-anchor="middle"
                        class="text-[7px] font-black uppercase tracking-tighter"
                        style="paint-order: stroke; stroke: #ffffff; stroke-width: 2.5px; fill: #000000;">
                        {{ region.name }}
                      </text>
                    }
                  }
               </g>

               <g class="pointer-events-none">
                   @for (region of mapRegions(); track region.id) {
                       @if(region.scaleFactor > 0.05) { 
                           <use href="#icon-male" 
                                [attr.x]="region.center.x - (region.iconSize.male) + 0.5" 
                                [attr.y]="region.center.y"
                                [attr.width]="region.iconSize.male" 
                                [attr.height]="region.iconSize.male"
                                fill="#009FE3" />
                           
                           <use href="#icon-female" 
                                [attr.x]="region.center.x - 0.5" 
                                [attr.y]="region.center.y"
                                [attr.width]="region.iconSize.female" 
                                [attr.height]="region.iconSize.female"
                                fill="#E91E63" />
                       }
                   }
               </g>
             </svg>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn 0.15s ease-out forwards; }
  `]
})
export class MapViewerComponent {
  
  hoveredRegion = signal<any | null>(null);
  private geoJsonData: any = (geoData as any).default || geoData;

  mapRegions = computed(() => {
    const features = this.geoJsonData.features;
    if (!features) return [];

    // --- Calibración de Escalas ---
    let maxPop = 0;
    let maxDens = 0;
    let minDens = Infinity;

    features.forEach((f: any) => {
        const p = f.properties;
        const total = Number(p.POBTOTAL) || (Number(p.POBHOMBRE) + Number(p.POBMUJER));
        const dens = Number(p.DENSIDAD) || 0;
        if (total > maxPop) maxPop = total;
        if (dens > maxDens) maxDens = dens;
        if (dens < minDens && dens > 0) minDens = dens;
    });

    const logMaxDens = Math.log(maxDens || 1);
    const logMinDens = Math.log(minDens || 0.1);

    return features.map((feature: any, index: number) => {
        const p = feature.properties;
        
        // Asignación de variables según tu JSON
        const men = Number(p.POBHOMBRE) || 0;
        const women = Number(p.POBMUJER) || 0;
        const total = Number(p.POBTOTAL) || (men + women);
        const density = Number(p.DENSIDAD) || 0;

        const geo = this.convertGeoJsonToSvg(feature.geometry);

        // Score de Densidad para color
        const logDens = Math.log(density || 0.1);
        let densityScore = (logDens - logMinDens) / (logMaxDens - logMinDens);
        densityScore = Math.max(0, Math.min(1, densityScore));

        // Factor de escala para iconos (Raíz cuadrada para balance visual)
        const scaleFactor = Math.sqrt(total) / Math.sqrt(maxPop);
        const baseSize = 8 + (scaleFactor * 22);

        return {
            id: p.UBIGEO || index, 
            name: p.NOMBDEP || 'SIN NOMBRE',
            total, men, women, density,
            path: geo.path,
            center: geo.center,
            densityScore,
            scaleFactor,
            iconSize: {
                male: baseSize * (total > 0 ? (men / total) * 2 : 1),
                female: baseSize * (total > 0 ? (women / total) * 2 : 1)
            }
        };
    });
  });

  totalNational = computed(() => this.mapRegions().reduce((acc, curr) => acc + curr.total, 0));

  getColor(score: number): string {
    if (score > 0.8) return '#9E1F3D';
    if (score > 0.6) return '#D95F0E';
    if (score > 0.4) return '#FE9929';
    if (score > 0.2) return '#FEC44F';
    return '#FFF7BC';
  }

  private readonly MAP_BOUNDS = { minLon: -81.5, maxLon: -68.5, minLat: -18.5, maxLat: -0.0 };
  private readonly SVG_SIZE = { w: 400, h: 600 };

  convertGeoJsonToSvg(geometry: any): { path: string, center: {x: number, y: number} } {
    if (!geometry) return { path: '', center: {x: 0, y: 0} };
    let pathString = '';
    let sumX = 0, sumY = 0, count = 0;
    
    const project = (coord: number[]) => {
        const x = ((coord[0] - this.MAP_BOUNDS.minLon) / (this.MAP_BOUNDS.maxLon - this.MAP_BOUNDS.minLon)) * this.SVG_SIZE.w;
        const y = (1 - ((coord[1] - this.MAP_BOUNDS.minLat) / (this.MAP_BOUNDS.maxLat - this.MAP_BOUNDS.minLat))) * this.SVG_SIZE.h;
        return { x, y };
    };

    const processRing = (ring: number[][]) => {
        let ringPath = '';
        ring.forEach((coord, i) => {
            const p = project(coord);
            ringPath += (i === 0 ? 'M' : 'L') + `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
            sumX += p.x; sumY += p.y; count++;
        });
        return ringPath + 'Z ';
    };

    if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach((r: any) => pathString += processRing(r));
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((poly: any) => poly.forEach((r: any) => pathString += processRing(r)));
    }

    return { path: pathString, center: { x: count ? sumX/count : 0, y: count ? sumY/count : 0 } };
  }

  onRegionHover(region: any) { this.hoveredRegion.set(region); }
  onRegionLeave() { this.hoveredRegion.set(null); }
}