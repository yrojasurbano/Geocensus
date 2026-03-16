// RUTA: src/app/components/comparativa/comparativa-territorial.ts

import {
    Component,
    ChangeDetectionStrategy,
    signal,
    computed,
    PLATFORM_ID,
    inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HeroIconComponent } from '../ui/hero-icon.component';

// ── Tipos ────────────────────────────────────────────────────────────────────
export type NivelType = 'Departamental' | 'Provincial' | 'Distrital';

export interface FilaDep {
    departamento: string;
    superficie:   number;
    poblacion:    number;
    hombres:      number;
    mujeres:      number;
    razon:        number;
    densidad:     number;
    pctUrbano:    number;
    edadMediana:  number;
    p65:          number;
    pct65:        number;
}
export interface FilaProv extends FilaDep { provincia: string; }
export interface FilaDist extends FilaProv { distrito: string; }
export type FilaTabla = FilaDep | FilaProv | FilaDist;

interface DropdownItem { label: string; checked: boolean; }

// ── DATA — Departamental (25 depts + Lima split) ────────────────────────────
const MOCK_DEP: FilaDep[] = [
    { departamento:'AMAZONAS',        superficie:  39_249, poblacion:  426_806, hombres:  218_643, mujeres:  208_163, razon:105.0, densidad:   10.9, pctUrbano: 41.2, edadMediana:25.1, p65:  28_882, pct65: 6.8 },
    { departamento:'ANCASH',          superficie:  35_915, poblacion:1_180_638, hombres:  582_219, mujeres:  598_419, razon: 97.3, densidad:   32.9, pctUrbano: 69.8, edadMediana:27.8, p65:  99_174, pct65: 8.4 },
    { departamento:'APURIMAC',        superficie:  20_896, poblacion:  476_936, hombres:  237_044, mujeres:  239_892, razon: 98.8, densidad:   22.8, pctUrbano: 55.3, edadMediana:26.4, p65:  42_447, pct65: 8.9 },
    { departamento:'AREQUIPA',        superficie:  63_345, poblacion:1_497_438, hombres:  738_094, mujeres:  759_344, razon: 97.2, densidad:   23.6, pctUrbano: 91.8, edadMediana:30.1, p65: 130_277, pct65: 8.7 },
    { departamento:'AYACUCHO',        superficie:  43_815, poblacion:  668_213, hombres:  328_956, mujeres:  339_257, razon: 97.0, densidad:   15.3, pctUrbano: 59.4, edadMediana:26.8, p65:  56_798, pct65: 8.5 },
    { departamento:'CAJAMARCA',       superficie:  33_318, poblacion:1_453_671, hombres:  725_908, mujeres:  727_763, razon: 99.7, densidad:   43.6, pctUrbano: 34.8, edadMediana:25.2, p65: 107_572, pct65: 7.4 },
    { departamento:'PROV. CONST. DEL CALLAO',          superficie:     147, poblacion:1_129_854, hombres:  556_220, mujeres:  573_634, razon: 97.0, densidad:7_685.4, pctUrbano:100.0, edadMediana:30.4, p65:  84_739, pct65: 7.5 },
    { departamento:'CUSCO',           superficie:  71_987, poblacion:1_357_075, hombres:  671_504, mujeres:  685_571, razon: 98.0, densidad:   18.8, pctUrbano: 62.8, edadMediana:27.2, p65: 105_851, pct65: 7.8 },
    { departamento:'HUANCAVELICA',    superficie:  22_131, poblacion:  374_062, hombres:  184_793, mujeres:  189_269, razon: 97.6, densidad:   16.9, pctUrbano: 37.5, edadMediana:24.8, p65:  30_299, pct65: 8.1 },
    { departamento:'HUANUCO',         superficie:  36_849, poblacion:  762_223, hombres:  381_285, mujeres:  380_938, razon:100.1, densidad:   20.7, pctUrbano: 51.4, edadMediana:25.6, p65:  53_356, pct65: 7.0 },
    { departamento:'ICA',             superficie:  21_328, poblacion:  975_182, hombres:  487_042, mujeres:  488_140, razon: 99.8, densidad:   45.7, pctUrbano: 91.9, edadMediana:30.2, p65:  78_015, pct65: 8.0 },
    { departamento:'JUNIN',           superficie:  44_197, poblacion:1_370_274, hombres:  683_244, mujeres:  687_030, razon: 99.4, densidad:   31.0, pctUrbano: 72.2, edadMediana:28.0, p65: 104_141, pct65: 7.6 },
    { departamento:'LA LIBERTAD',     superficie:  25_500, poblacion:2_016_771, hombres:  990_040, mujeres:1_026_731, razon: 96.4, densidad:   79.1, pctUrbano: 78.4, edadMediana:27.8, p65: 151_258, pct65: 7.5 },
    { departamento:'LAMBAYEQUE',      superficie:  14_231, poblacion:1_362_689, hombres:  655_024, mujeres:  707_665, razon: 92.6, densidad:   95.8, pctUrbano: 81.7, edadMediana:29.1, p65: 113_103, pct65: 8.3 },
    { departamento:'LIMA METROPOLITANA 1/', superficie:   2_672, poblacion: 9_485_405, hombres:4_617_742, mujeres:4_867_663, razon: 94.9, densidad:3_550.1, pctUrbano:100.0, edadMediana:32.1, p65: 873_281, pct65: 9.2 },
    { departamento:'REGION LIMA 2/',        superficie:  32_130, poblacion:   640_647, hombres:  312_101, mujeres:  328_546, razon: 95.0, densidad:   19.9, pctUrbano: 73.5, edadMediana:27.4, p65:  58_316, pct65: 9.1 },
    { departamento:'LORETO',          superficie: 368_852, poblacion:1_027_559, hombres:  527_346, mujeres:  500_213, razon:105.4, densidad:    2.8, pctUrbano: 65.2, edadMediana:22.9, p65:  49_323, pct65: 4.8 },
    { departamento:'MADRE DE DIOS',   superficie:  85_183, poblacion:  173_811, hombres:   95_596, mujeres:   78_215, razon:122.2, densidad:    2.0, pctUrbano: 71.4, edadMediana:24.5, p65:   6_782, pct65: 3.9 },
    { departamento:'MOQUEGUA',        superficie:  15_734, poblacion:  192_740, hombres:   98_455, mujeres:   94_285, razon:104.4, densidad:   12.2, pctUrbano: 86.0, edadMediana:32.1, p65:  18_310, pct65: 9.5 },
    { departamento:'PASCO',           superficie:  25_320, poblacion:  271_904, hombres:  139_388, mujeres:  132_516, razon:105.2, densidad:   10.7, pctUrbano: 66.5, edadMediana:25.5, p65:  15_227, pct65: 5.6 },
    { departamento:'PIURA',           superficie:  35_892, poblacion:2_047_954, hombres:1_011_232, mujeres:1_036_722, razon: 97.5, densidad:   57.1, pctUrbano: 74.5, edadMediana:27.4, p65: 155_644, pct65: 7.6 },
    { departamento:'PUNO',            superficie:  71_999, poblacion:1_268_441, hombres:  630_014, mujeres:  638_427, razon: 98.7, densidad:   17.6, pctUrbano: 53.6, edadMediana:26.9, p65: 101_475, pct65: 8.0 },
    { departamento:'SAN MARTIN',      superficie:  51_253, poblacion:  974_160, hombres:  512_133, mujeres:  462_027, razon:110.8, densidad:   19.0, pctUrbano: 69.3, edadMediana:25.8, p65:  46_760, pct65: 4.8 },
    { departamento:'TACNA',           superficie:  16_076, poblacion:  395_533, hombres:  199_748, mujeres:  195_785, razon:102.0, densidad:   24.6, pctUrbano: 88.7, edadMediana:31.5, p65:  34_016, pct65: 8.6 },
    { departamento:'TUMBES',          superficie:   4_669, poblacion:  252_261, hombres:  130_892, mujeres:  121_369, razon:107.8, densidad:   54.0, pctUrbano: 84.5, edadMediana:27.1, p65:  13_874, pct65: 5.5 },
    { departamento:'UCAYALI',         superficie: 102_411, poblacion:  609_794, hombres:  316_521, mujeres:  293_273, razon:107.9, densidad:    6.0, pctUrbano: 74.2, edadMediana:23.7, p65:  25_611, pct65: 4.2 },
];

// ── DATA — Provincial (Ayacucho) ─────────────────────────────────────────────
const MOCK_PROV: FilaProv[] = [
    { departamento:'AYACUCHO', provincia:'HUAMANGA',             superficie:  2_981, poblacion: 302_206, hombres: 144_872, mujeres: 157_334, razon: 92.1, densidad: 101.4, pctUrbano: 83.1, edadMediana:27.2, p65:  23_572, pct65: 7.8 },
    { departamento:'AYACUCHO', provincia:'CANGALLO',             superficie:  1_916, poblacion:  33_598, hombres:  16_231, mujeres:  17_367, razon: 93.5, densidad:  17.5, pctUrbano: 26.4, edadMediana:22.8, p65:   3_427, pct65:10.2 },
    { departamento:'AYACUCHO', provincia:'HUANCA SANCOS',        superficie:  2_862, poblacion:  11_580, hombres:   5_640, mujeres:   5_940, razon: 94.9, densidad:   4.0, pctUrbano: 41.3, edadMediana:24.1, p65:   1_321, pct65:11.4 },
    { departamento:'AYACUCHO', provincia:'HUANTA',               superficie:  3_878, poblacion:  98_341, hombres:  48_562, mujeres:  49_779, razon: 97.6, densidad:  25.4, pctUrbano: 53.2, edadMediana:25.6, p65:   7_966, pct65: 8.1 },
    { departamento:'AYACUCHO', provincia:'LA MAR',               superficie:  4_394, poblacion:  74_426, hombres:  37_219, mujeres:  37_207, razon:100.0, densidad:  16.9, pctUrbano: 32.1, edadMediana:23.4, p65:   5_656, pct65: 7.6 },
    { departamento:'AYACUCHO', provincia:'LUCANAS',              superficie: 14_494, poblacion:  63_458, hombres:  31_546, mujeres:  31_912, razon: 98.9, densidad:   4.4, pctUrbano: 52.7, edadMediana:28.5, p65:   6_853, pct65:10.8 },
    { departamento:'AYACUCHO', provincia:'PARINACOCHAS',         superficie:  5_968, poblacion:  23_215, hombres:  11_589, mujeres:  11_626, razon: 99.7, densidad:   3.9, pctUrbano: 49.8, edadMediana:27.9, p65:   2_577, pct65:11.1 },
    { departamento:'AYACUCHO', provincia:'PAUCAR DEL SARA SARA', superficie:  2_069, poblacion:  11_427, hombres:   5_657, mujeres:   5_770, razon: 98.0, densidad:   5.5, pctUrbano: 43.1, edadMediana:30.2, p65:   1_371, pct65:12.0 },
    { departamento:'AYACUCHO', provincia:'SUCRE',                superficie:  1_785, poblacion:  14_289, hombres:   7_003, mujeres:   7_286, razon: 96.1, densidad:   8.0, pctUrbano: 28.9, edadMediana:28.8, p65:   1_672, pct65:11.7 },
    { departamento:'AYACUCHO', provincia:'VICTOR FAJARDO',       superficie:  2_161, poblacion:  19_987, hombres:   9_778, mujeres:  10_209, razon: 95.8, densidad:   9.2, pctUrbano: 35.4, edadMediana:27.1, p65:   2_059, pct65:10.3 },
    { departamento:'AYACUCHO', provincia:'VILCAS HUAMÁN',        superficie:  1_307, poblacion:  20_686, hombres:  10_859, mujeres:   9_827, razon:110.5, densidad:  15.8, pctUrbano: 30.2, edadMediana:24.7, p65:   1_882, pct65: 9.1 },
];

// ── DATA — Distrital (Huamanga) ──────────────────────────────────────────────
const MOCK_DIST: FilaDist[] = [
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'AYACUCHO',                          superficie:   18.9, poblacion:105_418, hombres: 49_312, mujeres: 56_106, razon: 87.9, densidad:5_579.8, pctUrbano:100.0, edadMediana:29.8, p65:  7_485, pct65: 7.1 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ACOCRO',                            superficie:  469.5, poblacion:  9_842, hombres:  4_843, mujeres:  4_999, razon: 96.9, densidad:   21.0, pctUrbano: 20.3, edadMediana:23.5, p65:    925, pct65: 9.4 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ACOS VINCHOS',                      superficie:  298.6, poblacion:  4_211, hombres:  2_050, mujeres:  2_161, razon: 94.9, densidad:   14.1, pctUrbano: 15.8, edadMediana:22.1, p65:    455, pct65:10.8 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'CARMEN ALTO',                       superficie:   22.5, poblacion: 38_621, hombres: 18_844, mujeres: 19_777, razon: 95.3, densidad:1_716.5, pctUrbano: 98.4, edadMediana:28.4, p65:  2_279, pct65: 5.9 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'CHIARA',                            superficie:  316.4, poblacion:  5_803, hombres:  2_834, mujeres:  2_969, razon: 95.5, densidad:   18.3, pctUrbano: 22.6, edadMediana:24.2, p65:    563, pct65: 9.7 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'OCROS',                             superficie:  414.1, poblacion:  4_982, hombres:  2_412, mujeres:  2_570, razon: 93.8, densidad:   12.0, pctUrbano: 19.4, edadMediana:23.8, p65:    558, pct65:11.2 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'PACAYCASA',                         superficie:   86.2, poblacion:  3_891, hombres:  1_897, mujeres:  1_994, razon: 95.1, densidad:   45.1, pctUrbano: 30.2, edadMediana:24.0, p65:    393, pct65:10.1 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'QUINUA',                            superficie:  211.5, poblacion:  5_647, hombres:  2_741, mujeres:  2_906, razon: 94.3, densidad:   26.7, pctUrbano: 25.8, edadMediana:23.9, p65:    593, pct65:10.5 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SAN JOSE DE TICLLAS',               superficie:  138.7, poblacion:  2_318, hombres:  1_120, mujeres:  1_198, razon: 93.5, densidad:   16.7, pctUrbano: 14.9, edadMediana:22.6, p65:    276, pct65:11.9 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SAN JUAN BAUTISTA',                 superficie:   31.6, poblacion: 68_344, hombres: 33_192, mujeres: 35_152, razon: 94.4, densidad:2_162.8, pctUrbano: 99.1, edadMediana:29.2, p65:  4_306, pct65: 6.3 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SANTIAGO DE PISCHA',                superficie:  198.3, poblacion:  1_492, hombres:    730, mujeres:    762, razon: 95.8, densidad:    7.5, pctUrbano: 12.4, edadMediana:22.0, p65:    181, pct65:12.1 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SOCOS',                             superficie:  276.5, poblacion:  4_920, hombres:  2_393, mujeres:  2_527, razon: 94.7, densidad:   17.8, pctUrbano: 18.2, edadMediana:23.2, p65:    512, pct65:10.4 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'TAMBILLO',                          superficie:  196.8, poblacion:  4_371, hombres:  2_120, mujeres:  2_251, razon: 94.2, densidad:   22.2, pctUrbano: 24.1, edadMediana:23.6, p65:    428, pct65: 9.8 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'VINCHOS',                           superficie:  500.2, poblacion: 11_206, hombres:  5_478, mujeres:  5_728, razon: 95.6, densidad:   22.4, pctUrbano: 17.5, edadMediana:22.9, p65:  1_154, pct65:10.3 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'JESUS NAZARENO',                    superficie:    9.8, poblacion: 25_087, hombres: 12_150, mujeres: 12_937, razon: 93.9, densidad:2_560.9, pctUrbano:100.0, edadMediana:28.9, p65:  1_806, pct65: 7.2 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ANDRES AVELINO CACERES DORREGARAY', superficie:   11.2, poblacion:  6_050, hombres:  3_011, mujeres:  3_039, razon: 99.1, densidad:  540.2, pctUrbano: 95.6, edadMediana:27.5, p65:    520, pct65: 8.6 },
];

const DEPS_LIST  = MOCK_DEP.map(r => r.departamento);
const PROVS_LIST = MOCK_PROV.map(r => r.provincia);
const DISTS_LIST = MOCK_DIST.map(r => r.distrito);

function allChecked(labels: string[]): DropdownItem[] {
    return labels.map(label => ({ label, checked: true }));
}

// ═══════════════════════════════════════════════════════════════════════════════
@Component({
    selector: 'app-comparativa-territorial',
    standalone: true,
    imports: [CommonModule, RouterLink, MatTooltipModule, HeroIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section
                class="bg-[#f4f7f9] h-full flex flex-col font-sans text-gray-800"
                (click)="closeAll()">

            <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
            <header class="bg-white shadow-sm px-4 md:px-6 xl:px-10 2xl:px-16 py-3 md:py-2 flex flex-col md:flex-row
                 justify-between items-center gap-4 md:gap-0
                 sticky top-0 z-50 shrink-0 h-auto md:h-16 xl:h-20">

                <!-- Logos -->
                <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <div class="flex items-center cursor-pointer" routerLink="/">
                        <img src="logo_inei_azul.png" alt="Logo INEI" class="h-10 md:h-12 xl:h-14 w-auto object-contain">
                    </div>
                    <div class="h-6 md:h-8 xl:h-10 w-px bg-gray-200 mx-1 md:mx-2"></div>
                    <div class="flex items-center">
                        <img src="logo_cpv.png" alt="Logo CPV 2025" class="h-10 md:h-12 xl:h-14 w-auto object-contain">
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                    <div class="flex bg-gray-100 p-1 rounded-xl gap-1">
                        <button
                                routerLink="/dashboard"
                                class="px-3 xl:px-5 py-1.5 xl:py-2 rounded-lg text-sm xl:text-base font-bold transition-all text-gray-400 hover:text-gray-600 tracking-wide">
                            Primeros Resultados
                        </button>
                        <button
                                class="px-3 xl:px-5 py-1.5 xl:py-2 rounded-lg text-sm xl:text-base font-bold shadow-sm bg-gradient-to-r from-[#0056a1] to-[#33b3a9] text-white tracking-wide cursor-default">
                            Comparativo Territorial
                        </button>
                    </div>
                    <button routerLink="/"
                            class="w-10 h-10 xl:w-12 xl:h-12 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
                        <app-hero-icon [name]="'x-mark'" class="w-6 h-6 xl:w-7 xl:h-7"></app-hero-icon>
                    </button>
                </div>
            </header>

            <!-- ══ FILTER BAR ═══════════════════════════════════════════════════════ -->
            <div
                    class="bg-white border-b border-gray-100 shadow-sm px-3 md:px-5 xl:px-10 2xl:px-16 py-2.5 xl:py-3
           flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 xl:gap-4
           sticky top-16 xl:top-20 z-40 shrink-0"
                    (click)="$event.stopPropagation()">

                <!-- Icono Filtros -->
                <div class="flex items-center gap-2 shrink-0">
                    <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0056a1] to-[#33b3a9] flex items-center justify-center">
                        <app-hero-icon [name]="'funnel'" class="w-3.5 h-3.5 text-white"></app-hero-icon>
                    </div>
                    <span class="text-[9px] font-black text-gray-400 tracking-widest uppercase">Nivel Geográfico</span>
                </div>

                <div class="h-px md:h-7 md:w-px bg-gray-200 shrink-0 w-full md:w-auto"></div>

                <!-- Controles — wrap en móvil -->
                <div class="flex flex-wrap items-center gap-2 flex-1 w-full">

                    <!-- ★ Nivel Geográfico -->
                    <div class="relative">
                        <button
                                (click)="toggleDropdown('nivel'); $event.stopPropagation()"
                                class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#0056a1] to-[#1a75aa]
                 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all
                 min-w-[148px] justify-between">
          <span class="flex items-center gap-1.5">
            <app-hero-icon [name]="'map'" class="w-3.5 h-3.5 opacity-80"></app-hero-icon>
              {{ nivelActivo() }}
          </span>
                            <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                                           [class.rotate-180]="openDropdown() === 'nivel'">
                            </app-hero-icon>
                        </button>
                        @if (openDropdown() === 'nivel') {
                            <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden"
                                 (click)="$event.stopPropagation()">
                                <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nivel geográfico</span>
                                </div>
                                @for (n of NIVELES; track n) {
                                    <button
                                            (click)="setNivel(n)"
                                            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                                            [class.bg-gradient-to-r]="nivelActivo() === n"
                                            [class.from-[#0056a1]]="nivelActivo() === n"
                                            [class.to-[#1a75aa]]="nivelActivo() === n"
                                            [class.text-white]="nivelActivo() === n"
                                            [class.text-gray-700]="nivelActivo() !== n"
                                            [class.hover:bg-blue-50]="nivelActivo() !== n">
                <span class="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                      [class.border-white]="nivelActivo() === n"
                      [class.border-gray-300]="nivelActivo() !== n">
                  @if (nivelActivo() === n) {
                      <span class="w-2 h-2 bg-white rounded-full block"></span>
                  }
                </span>
                                        <span class="font-bold">{{ n }}</span>
                                    </button>
                                }
                            </div>
                        }
                    </div>

                    <!-- Separador -->
                    <div class="h-7 w-px bg-gray-200 hidden md:block shrink-0"></div>

                    <!-- ★ Departamento -->
                    <div class="relative">
                        <button
                                (click)="toggleDropdown('dep'); $event.stopPropagation()"
                                class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all
                 min-w-[160px] justify-between">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
            <span class="text-gray-400 mr-0.5">Dep.:</span>{{ depLabel() }}
          </span>
                            <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 text-gray-400 transition-transform"
                                           [class.rotate-180]="openDropdown() === 'dep'">
                            </app-hero-icon>
                        </button>
                        @if (openDropdown() === 'dep') {
                            <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-60 overflow-hidden"
                                 (click)="$event.stopPropagation()">
                                <label class="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors text-xs font-bold text-gray-600">
                                    <input type="checkbox" [checked]="allDepsOn()" (change)="toggleAllDeps()"
                                           class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3.5 h-3.5">
                                    Seleccionar todas
                                </label>
                                <div class="max-h-60 overflow-y-auto">
                                    @for (item of depsItems(); track item.label; let i = $index) {
                                        <label class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-xs text-gray-700 transition-colors">
                                            <input type="checkbox" [checked]="item.checked" (change)="toggleDep(i)"
                                                   class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3.5 h-3.5">
                                            {{ item.label }}
                                        </label>
                                    }
                                </div>
                            </div>
                        }
                    </div>

                    <!-- ★ Provincia -->
                    <div class="relative">
                        <button
                                (click)="isProvActive() && toggleDropdown('prov'); $event.stopPropagation()"
                                class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all min-w-[160px] justify-between"
                                [class.bg-gray-50]="isProvActive()"
                                [class.border-gray-200]="isProvActive()"
                                [class.text-gray-700]="isProvActive()"
                                [class.hover:bg-gray-100]="isProvActive()"
                                [class.bg-gray-50/50]="!isProvActive()"
                        [class.border-gray-100]="!isProvActive()"
                        [class.text-gray-300]="!isProvActive()"
                        [class.cursor-not-allowed]="!isProvActive()">
                        <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  [class.bg-[#1a75aa]]="isProvActive()"
                  [class.bg-gray-200]="!isProvActive()">
            </span>
            <span [class.text-gray-400]="isProvActive()" [class.text-gray-300]="!isProvActive()" class="mr-0.5">Prov.:</span>{{ provLabel() }}
          </span>
                        <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                                       [class.text-gray-400]="isProvActive()"
                                       [class.text-gray-200]="!isProvActive()"
                                       [class.rotate-180]="openDropdown() === 'prov'">
                        </app-hero-icon>
                        </button>
                        @if (openDropdown() === 'prov' && isProvActive()) {
                            <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-64 overflow-hidden"
                                 (click)="$event.stopPropagation()">
                                <label class="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors text-xs font-bold text-gray-600">
                                    <input type="checkbox" [checked]="allProvsOn()" (change)="toggleAllProvs()"
                                           class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3.5 h-3.5">
                                    Seleccionar todas
                                </label>
                                <div class="max-h-60 overflow-y-auto">
                                    @for (item of provsItems(); track item.label; let i = $index) {
                                        <label class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-xs text-gray-700 transition-colors">
                                            <input type="checkbox" [checked]="item.checked" (change)="toggleProv(i)"
                                                   class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3.5 h-3.5">
                                            {{ item.label }}
                                        </label>
                                    }
                                </div>
                            </div>
                        }
                    </div>

                    <!-- ★ Distrito -->
                    <div class="relative">
                        <button
                                (click)="isDistActive() && toggleDropdown('dist'); $event.stopPropagation()"
                                class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all min-w-[155px] justify-between"
                                [class.bg-gray-50]="isDistActive()"
                                [class.border-gray-200]="isDistActive()"
                                [class.text-gray-700]="isDistActive()"
                                [class.hover:bg-gray-100]="isDistActive()"
                                [class.bg-gray-50/50]="!isDistActive()"
                        [class.border-gray-100]="!isDistActive()"
                        [class.text-gray-300]="!isDistActive()"
                        [class.cursor-not-allowed]="!isDistActive()">
                        <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  [class.bg-[#33b3a9]]="isDistActive()"
                  [class.bg-gray-200]="!isDistActive()">
            </span>
            <span [class.text-gray-400]="isDistActive()" [class.text-gray-300]="!isDistActive()" class="mr-0.5">Dist.:</span>{{ distLabel() }}
          </span>
                        <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform"
                                       [class.text-gray-400]="isDistActive()"
                                       [class.text-gray-200]="!isDistActive()"
                                       [class.rotate-180]="openDropdown() === 'dist'">
                        </app-hero-icon>
                        </button>
                        @if (openDropdown() === 'dist' && isDistActive()) {
                            <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-80 overflow-hidden"
                                 (click)="$event.stopPropagation()">
                                <label class="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-teal-50 transition-colors text-xs font-bold text-gray-600">
                                    <input type="checkbox" [checked]="allDistsOn()" (change)="toggleAllDists()"
                                           class="rounded border-gray-300 text-[#33b3a9] focus:ring-[#33b3a9] w-3.5 h-3.5">
                                    Seleccionar todos
                                </label>
                                <div class="max-h-60 overflow-y-auto">
                                    @for (item of distItems(); track item.label; let i = $index) {
                                        <label class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-teal-50 text-xs text-gray-700 transition-colors">
                                            <input type="checkbox" [checked]="item.checked" (change)="toggleDist(i)"
                                                   class="rounded border-gray-300 text-[#33b3a9] focus:ring-[#33b3a9] w-3.5 h-3.5">
                                            {{ item.label }}
                                        </label>
                                    }
                                </div>
                            </div>
                        }
                    </div>

                    <!-- Botón Restablecer -->
                    <button
                            (click)="resetFiltros()"
                            class="flex items-center gap-1.5 text-gray-400 hover:text-[#0056a1] transition-colors text-xs font-black tracking-wide shrink-0 group ml-auto md:ml-0">
                        <app-hero-icon [name]="'arrow-path'" class="w-4 h-4 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
                        Restablecer Filtros
                    </button>

                </div>
            </div>

            <!-- ══ CUERPO ════════════════════════════════════════════════════════════ -->
            <main class="flex-1 h-0 flex flex-col min-h-0 p-2 md:p-3 xl:p-4 2xl:p-6">
                <div class="flex-1 h-0 bg-white rounded-xl border border-gray-100 shadow-sm
                overflow-hidden flex flex-col">

                    <!-- Barra de estado -->
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between
                  px-3 md:px-4 xl:px-6 py-2 xl:py-3 bg-[#0056a1]/5 border-b border-[#0056a1]/10 shrink-0 gap-2 sm:gap-0">
                        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <span class="flex items-center gap-1.5 text-[10px] xl:text-[11px] font-black text-[#0056a1] uppercase tracking-widest">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 10h18M3 14h18M10 3v18M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/>
            </svg>
            Cuadro {{ nivelActivo() }}
          </span>
                            <span class="h-3 w-px bg-gray-300 hidden sm:block"></span>
                            <span class="text-[10px] text-gray-500 font-bold">
            {{ filasTabla().length }} registro{{ filasTabla().length !== 1 ? 's' : '' }}
          </span>
                        </div>

                        <!-- ★ Botón de descarga Excel -->
                        <button
                                (click)="exportarExcel()"
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#1a7a4a] to-[#22a060]
                       text-white rounded-lg text-[11px] font-bold shadow-sm hover:shadow-md transition-all shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            Descargar Excel
                        </button>
                    </div>

                    <!-- ── Tabla con scroll horizontal ── -->
                    <div class="overflow-auto flex-1 min-h-0 -webkit-overflow-scrolling-touch">
                        <table class="w-full text-[13px] xl:text-[14px] 2xl:text-[15px] border-collapse" style="min-width:600px">

                            <!-- ── THEAD ── -->
                            <thead class="sticky top-0 z-10">

                            <!-- Fila 1: grupos -->
                            <tr>
                                <!-- Ubicación Geográfica -->
                                <th
                                        class="bg-[#002d5c] text-white px-3 xl:px-5 py-1.5 xl:py-2 text-left font-bold uppercase tracking-wider text-[11px] xl:text-[12px] border-r border-white/20"
                                        [attr.colspan]="nivelActivo() === 'Departamental' ? 1 : nivelActivo() === 'Provincial' ? 2 : 3">
                                    Ubicación Geográfica
                                </th>
                                <!-- Población Censada (3 cols) -->
                                <th class="bg-[#002d5c] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px] border-r border-white/20" colspan="3">
                                    Población Censada
                                </th>
                                <!-- Indicadores Demográficos (3 cols: Razón, Edad Mediana, Edad Media) -->
                                <th class="bg-[#002d5c] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px] border-r border-white/20" colspan="3">
                                    Indicadores Demográficos
                                </th>
                                <!-- Adultos Mayores (2 cols) -->
                                <th class="bg-[#002d5c] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px]" colspan="2">
                                    Adultos Mayores (60+)
                                </th>
                            </tr>

                            <!-- Fila 2: columnas individuales con ordenamiento -->
                            <tr>
                                <!-- Departamento siempre visible -->
                                <th class="bg-[#0056a1] text-white px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('departamento'); $event.stopPropagation()"
                                            class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                        Departamento
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='departamento'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='departamento'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='departamento'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='departamento'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                @if (nivelActivo() === 'Provincial' || nivelActivo() === 'Distrital') {
                                    <th class="bg-[#0056a1] text-white px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                        <button (click)="sortBy('provincia'); $event.stopPropagation()"
                                                class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                            Provincia
                                            <span class="flex flex-col leading-none ml-0.5">
                                                <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='provincia'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='provincia'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                                <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='provincia'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='provincia'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                            </span>
                                        </button>
                                    </th>
                                }
                                @if (nivelActivo() === 'Distrital') {
                                    <th class="bg-[#0056a1] text-white px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                        <button (click)="sortBy('distrito'); $event.stopPropagation()"
                                                class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                            Distrito
                                            <span class="flex flex-col leading-none ml-0.5">
                                                <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='distrito'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='distrito'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                                <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='distrito'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='distrito'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                            </span>
                                        </button>
                                    </th>
                                }
                                <!-- Población Total -->
                                <th class="bg-[#248cb3] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('poblacion'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        Total
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='poblacion'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='poblacion'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='poblacion'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='poblacion'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                <!-- Hombres -->
                                <th class="bg-[#248cb3] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('hombres'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        Hombres
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hombres'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='hombres'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hombres'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='hombres'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                <!-- Mujeres -->
                                <th class="bg-[#248cb3] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('mujeres'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        Mujeres
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='mujeres'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='mujeres'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='mujeres'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='mujeres'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                <!-- Razón H/M -->
                                <th class="bg-[#2da3b0] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('razon'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        Razón Hombre/Mujer
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='razon'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='razon'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='razon'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='razon'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                <!-- Edad Mediana -->
                                <th class="bg-[#2da3b0] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('edadMediana'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        Edad<br><span class="text-teal-100 font-normal text-[11px]">Mediana</span>
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='edadMediana'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='edadMediana'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='edadMediana'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='edadMediana'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                <!-- Edad Media -->
                                <th class="bg-[#2da3b0] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('edadMedia'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        Edad<br><span class="text-teal-100 font-normal text-[11px]">Media</span>
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='edadMedia'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='edadMedia'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='edadMedia'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='edadMedia'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                <!-- Personas 60+ -->
                                <th class="bg-[#33b3a9] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                                    <button (click)="sortBy('p65'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        Personas 60 y más años
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='p65'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='p65'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='p65'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='p65'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                                <!-- % 60+ -->
                                <th class="bg-[#33b3a9] text-white px-3 py-2 text-right font-semibold whitespace-nowrap text-[12px]">
                                    <button (click)="sortBy('pct65'); $event.stopPropagation()"
                                            class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                                        % 60 y más años
                                        <span class="flex flex-col leading-none ml-0.5">
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='pct65'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='pct65'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                                            <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='pct65'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='pct65'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                                        </span>
                                    </button>
                                </th>
                            </tr>
                            </thead>

                            <!-- ── TBODY ── -->
                            <tbody>

                                <!-- ★ FILA NACIONAL — siempre fija en la parte superior, no se ordena -->
                                @if (filasTabla().length > 0) {
                                    <tr class="border-b-2 border-[#0056a1]/30 bg-[#0056a1]/8 font-bold sticky-nacional">

                                        <td
                                                class="px-3 py-2.5 text-gray-900 text-[12px] font-black uppercase tracking-wider border-r border-gray-200"
                                                [attr.colspan]="nivelActivo() === 'Departamental' ? 1 : nivelActivo() === 'Provincial' ? 2 : 3">
                                            <span class="flex items-center gap-1.5">
                                                <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                                                NACIONAL
                                            </span>
                                        </td>
                                        <!-- Población total nacional -->
                                        <td class="px-3 py-2.5 text-right font-mono font-black text-gray-900 text-[13px] border-r border-gray-200">
                                            {{ fmtN(totales().pob) }}
                                        </td>
                                        <!-- Hombres nacional -->
                                        <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">
                                            {{ fmtN(totales().hom) }}
                                        </td>
                                        <!-- Mujeres nacional -->
                                        <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">
                                            {{ fmtN(totales().muj) }}
                                        </td>
                                        <!-- Razón nacional -->
                                        <td class="px-3 py-2.5 text-right text-gray-900 text-[12px] font-bold border-r border-gray-200">
                                            {{ fmtR(totales().razon) }}
                                        </td>
                                        <!-- Edad Mediana nacional (promedio simple) -->
                                        <td class="px-3 py-2.5 text-right font-mono text-gray-900 text-[13px] border-r border-gray-200">
                                            {{ fmtR(totales().edadMediana) }}
                                        </td>
                                        <!-- Edad Media nacional -->
                                        <td class="px-3 py-2.5 text-right font-mono text-gray-900 text-[13px] border-r border-gray-200">
                                            {{ fmtR(totales().edadMedia) }}
                                        </td>
                                        <!-- Personas 60+ nacional -->
                                        <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">
                                            {{ fmtN(totales().p65) }}
                                        </td>
                                        <!-- % 60+ nacional -->
                                        <td class="px-3 py-2.5 text-right text-gray-900 text-[12px] font-bold">
                                            {{ fmtPct(totales().pct65) }}
                                        </td>
                                    </tr>
                                }

                                @if (filasTabla().length === 0) {
                                    <tr>
                                        <td colspan="20" class="text-center py-16 text-gray-400">
                                            <div class="flex flex-col items-center gap-3">
                                                <app-hero-icon [name]="'face-frown'" class="w-10 h-10 text-gray-300"></app-hero-icon>
                                                <p class="text-sm font-bold text-gray-500">Sin registros para mostrar</p>
                                                <p class="text-xs text-gray-400">Activa al menos un elemento en cada filtro</p>
                                            </div>
                                        </td>
                                    </tr>
                                }

                                @for (fila of filasOrdenadas(); track $index; let even = $even) {
                                    <tr
                                            class="border-b border-gray-100 transition-colors hover:bg-[#0056a1]/5"
                                            [class.bg-white]="!even"
                                            [class.bg-blue-50/20]="even">

                                            <!-- Departamento -->
                                    <td class="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                      {{ fila.departamento }}
                  </span>
                                    </td>

                                    <!-- Provincia -->
                                    @if (nivelActivo() === 'Provincial' || nivelActivo() === 'Distrital') {
                                        <td class="px-3 py-2 text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                                            {{ asProv(fila).provincia }}
                                        </td>
                                    }

                                    <!-- Distrito -->
                                    @if (nivelActivo() === 'Distrital') {
                                        <td class="px-3 py-2 text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                                            {{ asDist(fila).distrito }}
                                        </td>
                                    }

                                    <!-- Población total -->
                                    <td class="px-3 py-2 text-right font-mono font-bold text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                                        {{ fmtN(fila.poblacion) }}
                                    </td>

                                    <!-- Hombres -->
                                    <td class="px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                                        {{ fmtN(fila.hombres) }}
                                    </td>

                                    <!-- Mujeres -->
                                    <td class="px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                                        {{ fmtN(fila.mujeres) }}
                                    </td>

                                    <!-- Razón H/M -->
                                    <td class="px-3 py-2 text-right text-gray-900 whitespace-nowrap border-r border-gray-100 text-[12px] font-bold">
                                        {{ fmtR(fila.razon) }}
                                    </td>

                                    <!-- Edad mediana -->
                                    <td class="px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                                        {{ fmtR(fila.edadMediana) }}
                                    </td>

                                    <!-- Edad media (calculada por departamento como edad mediana ponderada) -->
                                    <td class="px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                                        {{ fmtR(calcEdadMedia(fila)) }}
                                    </td>

                                    <!-- Personas 60+ -->
                                    <td class="px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px] font-semibold">
                                        {{ fmtN(fila.p65) }}
                                    </td>

                                    <!-- % 60+ -->
                                    <td class="px-3 py-2 text-right text-gray-900 whitespace-nowrap text-[12px] font-bold">
                                        {{ fmtPct(fila.pct65) }}
                                    </td>

                                    </tr>
                                }
                            </tbody>

                        </table>
                    </div><!-- /overflow-auto -->

                    <!-- Nota metodológica -->
                    <div class="flex items-start gap-2 px-3 md:px-4 xl:px-6 py-2.5 xl:py-3 bg-amber-50 border-t border-amber-100 shrink-0">
                        <svg class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clip-rule="evenodd"/>
                        </svg>
                        <p class="text-[10px] xl:text-[11px] text-amber-800 leading-relaxed">
                            <strong>Nota metodológica:</strong> 1/ Comprende los 43 distritos de la provincia de Lima.
                            <br>2/ Comprende las provincias de Barranca, Cajatambo, Canta, Cañete, Huaral, Huarochirí,
Huaura, Oyón y Yauyos.
                            Datos de nivel provincial y distrital corresponden a Ayacucho–Huamanga (datos de referencia).
                        </p>
                    </div>

                </div>
            </main>

        </section>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
            height: 100vh;
            overflow: hidden;
        }
        /* Tabla con scroll horizontal suave en móvil */
        .overflow-auto {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        }
        .overflow-auto::-webkit-scrollbar { height: 5px; width: 5px; }
        .overflow-auto::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }
        /* Fila NACIONAL: fondo sutil diferenciado */
        .sticky-nacional {
            background-color: rgba(0, 86, 161, 0.06);
            border-top: 2px solid rgba(0, 86, 161, 0.2);
            border-bottom: 2px solid rgba(0, 86, 161, 0.2);
        }
        /* Optimización 1920×1080 */
        @media (min-width: 1280px) {
            table td, table th {
                padding-left: 1rem;
                padding-right: 1rem;
            }
        }
        @media (min-width: 1920px) {
            table {
                font-size: 15px;
            }
            table td, table th {
                padding-top: 0.625rem;
                padding-bottom: 0.625rem;
                padding-left: 1.25rem;
                padding-right: 1.25rem;
            }
        }
    `],
})
export class ComparativaTerritorialComponent {

    // ── Nivel ─────────────────────────────────────────────────────────────────
    readonly NIVELES: NivelType[] = ['Departamental', 'Provincial', 'Distrital'];
    nivelActivo = signal<NivelType>('Departamental');

    setNivel(n: NivelType): void {
        this.nivelActivo.set(n);
        this.depsItems.set(allChecked(DEPS_LIST));
        this.provsItems.set(allChecked(PROVS_LIST));
        this.distItems.set(allChecked(DISTS_LIST));
        this.openDropdown.set(null);
        this.sortCol.set(null);
        this.sortDir.set('asc');
    }

    // ── Dropdowns ─────────────────────────────────────────────────────────────
    openDropdown = signal<'nivel' | 'dep' | 'prov' | 'dist' | null>(null);

    toggleDropdown(key: 'nivel' | 'dep' | 'prov' | 'dist'): void {
        this.openDropdown.set(this.openDropdown() === key ? null : key);
    }

    closeAll(): void { this.openDropdown.set(null); }

    // ── Ordenamiento ──────────────────────────────────────────────────────────
    sortCol = signal<string | null>(null);
    sortDir = signal<'asc' | 'desc'>('asc');

    sortBy(col: string): void {
        if (this.sortCol() === col) {
            this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortCol.set(col);
            this.sortDir.set('asc');
        }
    }

    // ── Items con check ────────────────────────────────────────────────────────
    depsItems  = signal<DropdownItem[]>(allChecked(DEPS_LIST));
    provsItems = signal<DropdownItem[]>(allChecked(PROVS_LIST));
    distItems  = signal<DropdownItem[]>(allChecked(DISTS_LIST));

    private _toggle(sig: ReturnType<typeof signal<DropdownItem[]>>, i: number) {
        const a = [...sig()]; a[i] = { ...a[i], checked: !a[i].checked }; sig.set(a);
    }
    private _toggleAll(sig: ReturnType<typeof signal<DropdownItem[]>>) {
        const allOn = sig().every(x => x.checked);
        sig.set(sig().map(x => ({ ...x, checked: !allOn })));
    }

    toggleDep(i: number)  { this._toggle(this.depsItems, i); }
    toggleProv(i: number) { this._toggle(this.provsItems, i); }
    toggleDist(i: number) { this._toggle(this.distItems, i); }
    toggleAllDeps()       { this._toggleAll(this.depsItems); }
    toggleAllProvs()      { this._toggleAll(this.provsItems); }
    toggleAllDists()      { this._toggleAll(this.distItems); }

    // ── Restablecer: vuelve a Departamental ──────────────────────────────────
    resetFiltros(): void {
        this.nivelActivo.set('Departamental');
        this.depsItems.set(allChecked(DEPS_LIST));
        this.provsItems.set(allChecked(PROVS_LIST));
        this.distItems.set(allChecked(DISTS_LIST));
        this.openDropdown.set(null);
        this.sortCol.set(null);
        this.sortDir.set('asc');
    }

    // ── Computed helpers ───────────────────────────────────────────────────────
    allDepsOn  = computed(() => this.depsItems().every(x => x.checked));
    allProvsOn = computed(() => this.provsItems().every(x => x.checked));
    allDistsOn = computed(() => this.distItems().every(x => x.checked));

    cntDeps  = computed(() => this.depsItems().filter(x => x.checked).length);
    cntProvs = computed(() => this.provsItems().filter(x => x.checked).length);
    cntDists = computed(() => this.distItems().filter(x => x.checked).length);

    isProvActive = computed(() => this.nivelActivo() !== 'Departamental');
    isDistActive = computed(() => this.nivelActivo() === 'Distrital');

    depLabel  = computed(() => this.cntDeps()  === DEPS_LIST.length  ? 'Todos los dep.' : `${this.cntDeps()} dep. sel.`);
    provLabel = computed(() => this.cntProvs() === PROVS_LIST.length ? 'Todas las prov.' : `${this.cntProvs()} prov. sel.`);
    distLabel = computed(() => this.cntDists() === DISTS_LIST.length ? 'Todos los dist.' : `${this.cntDists()} dist. sel.`);

    // ── Datos filtrados ────────────────────────────────────────────────────────
    private selDeps  = computed(() => new Set(this.depsItems().filter(x => x.checked).map(x => x.label)));
    private selProvs = computed(() => new Set(this.provsItems().filter(x => x.checked).map(x => x.label)));
    private selDists = computed(() => new Set(this.distItems().filter(x => x.checked).map(x => x.label)));

    filasTabla = computed<FilaTabla[]>(() => {
        const nivel = this.nivelActivo();
        const deps  = this.selDeps();
        const provs = this.selProvs();
        const dists = this.selDists();
        if (nivel === 'Departamental') return MOCK_DEP.filter(r => deps.has(r.departamento));
        if (nivel === 'Provincial')  return MOCK_PROV.filter(r => deps.has(r.departamento) && provs.has(r.provincia));
        return MOCK_DIST.filter(r => deps.has(r.departamento) && provs.has(r.provincia) && dists.has(r.distrito));
    });

    // ── Datos ordenados (excluye la fila NACIONAL) ────────────────────────────
    filasOrdenadas = computed<FilaTabla[]>(() => {
        const rows = [...this.filasTabla()];
        const col  = this.sortCol();
        const dir  = this.sortDir();
        if (!col) return rows;
        return rows.sort((a, b) => {
            const va = (a as any)[col] ?? 0;
            const vb = (b as any)[col] ?? 0;
            if (typeof va === 'string') {
                return dir === 'asc' ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es');
            }
            return dir === 'asc' ? va - vb : vb - va;
        });
    });

    // ── Totales / NACIONAL ─────────────────────────────────────────────────────
    totales = computed(() => {
        const rows = this.filasTabla();
        const pob  = rows.reduce((a, r) => a + r.poblacion, 0);
        const hom  = rows.reduce((a, r) => a + r.hombres, 0);
        const muj  = rows.reduce((a, r) => a + r.mujeres, 0);
        const sup  = rows.reduce((a, r) => a + r.superficie, 0);
        const p65  = rows.reduce((a, r) => a + r.p65, 0);
        const razon       = muj  ? +(hom / muj * 100).toFixed(1) : 0;
        const dens        = sup  ? +(pob / sup).toFixed(1) : 0;
        const pct65       = pob  ? +(p65 / pob * 100).toFixed(1) : 0;
        // Edad mediana: promedio ponderado por población
        const edadMediana = pob
            ? +(rows.reduce((a, r) => a + r.edadMediana * r.poblacion, 0) / pob).toFixed(1)
            : 0;
        // Edad media: promedio simple entre filas
        const edadMedia   = rows.length
            ? +(rows.reduce((a, r) => a + r.edadMediana, 0) / rows.length).toFixed(1)
            : 0;
        return { pob, hom, muj, sup, p65, razon, dens, pct65, edadMediana, edadMedia };
    });

    // ── Edad media por fila (estimada: coincide con edadMediana individual) ──
    calcEdadMedia(fila: FilaTabla): number {
        // Para cada fila individual, la edad media se aproxima a la edad mediana
        // (dato disponible en el censo). Si se dispone de un campo propio, reemplazar.
        return fila.edadMediana;
    }

    // ── Cast helpers ───────────────────────────────────────────────────────────
    asProv(f: FilaTabla): FilaProv { return f as FilaProv; }
    asDist(f: FilaTabla): FilaDist { return f as FilaDist; }

    /** Enteros grandes: espacio como separador de miles → 1 234 567 */
    fmtN(n: number): string   { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
    /** Decimal con coma → 25,4 */
    fmtD(n: number): string   { return n.toFixed(1).replace('.', ','); }
    /** Porcentaje con coma decimal → 8,4% */
    fmtPct(n: number): string { return n.toFixed(1).replace('.', ',') + '%'; }
    /** Ratio/valor con coma decimal → 97,3 */
    fmtR(n: number): string   { return n.toFixed(1).replace('.', ','); }

    // ── Exportar a Excel (CSV con BOM UTF-8) ──────────────────────────────────
    exportarExcel(): void {
        const nivel = this.nivelActivo();
        const rows  = this.filasTabla();
        const t     = this.totales();

        // Cabeceras
        const headers: string[] = [];
        headers.push('Departamento');
        if (nivel === 'Provincial' || nivel === 'Distrital') headers.push('Provincia');
        if (nivel === 'Distrital') headers.push('Distrito');
        headers.push(
            'Población Total', 'Hombres', 'Mujeres',
            'Razón H/M', 'Edad Mediana', 'Edad Media',
            'Personas 60+', '% 60+'
        );

        const csvRows: string[] = [headers.join(';')];

        // Fila NACIONAL
        const nacCols: string[] = ['NACIONAL'];
        if (nivel === 'Provincial' || nivel === 'Distrital') nacCols.push('');
        if (nivel === 'Distrital') nacCols.push('');
        nacCols.push(
            t.pob.toString(), t.hom.toString(), t.muj.toString(),
            t.razon.toFixed(1).replace('.', ','),
            t.edadMediana.toFixed(1).replace('.', ','),
            t.edadMedia.toFixed(1).replace('.', ','),
            t.p65.toString(),
            t.pct65.toFixed(1).replace('.', ',') + '%'
        );
        csvRows.push(nacCols.join(';'));

        // Filas de datos
        for (const fila of rows) {
            const cols: string[] = [fila.departamento];
            if (nivel === 'Provincial' || nivel === 'Distrital') cols.push((fila as FilaProv).provincia);
            if (nivel === 'Distrital') cols.push((fila as FilaDist).distrito);
            cols.push(
                fila.poblacion.toString(),
                fila.hombres.toString(),
                fila.mujeres.toString(),
                fila.razon.toFixed(1).replace('.', ','),
                fila.edadMediana.toFixed(1).replace('.', ','),
                this.calcEdadMedia(fila).toFixed(1).replace('.', ','),
                fila.p65.toString(),
                fila.pct65.toFixed(1).replace('.', ',') + '%'
            );
            csvRows.push(cols.join(';'));
        }

        // Descarga
        const csv  = '\uFEFF' + csvRows.join('\n'); // BOM para Excel
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `comparativa-${nivel.toLowerCase()}-cpv2025.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}