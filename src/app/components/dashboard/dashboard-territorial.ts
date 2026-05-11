// RUTA: src/app/components/comparativa/comparativa-territorial.ts

import {
    Component,
    ChangeDetectionStrategy,
    signal,
    computed,
    PLATFORM_ID,
    inject,
    HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HeroIconComponent } from '../ui/hero-icon.component';
import * as XLSX from 'xlsx';

// ── Tipos ────────────────────────────────────────────────────────────────────
export type NivelType = 'Departamental' | 'Provincial' | 'Distrital';

export interface FilaDep {
    departamento:        string;
    superficie:          number;
    poblacion:           number;
    hombres:             number;
    mujeres:             number;
    razon:               number;
    densidad:            number;
    pctUrbano:           number;
    edadMediana:         number;
    p65:                 number;
    pct65:               number;
    indiceEnvejecimiento: number;
    // ── Vivienda ──
    vivCensadas:         number;
    vivOcupadas:         number;
    vivDesocupadas:      number;
    vivCon1Hogar:        number;
    vivCon2masHogares:   number;
    // ── Hogar ──
    hogCensados:         number;
    hogPromPersonas:     number;
    hogPctUnipersonal:   number;
    hogPctConNinos:      number;
    hogPctAdultosMayores: number;
}
export interface FilaProv extends FilaDep { provincia: string; }
export interface FilaDist extends FilaProv { distrito: string; }
export type FilaTabla = FilaDep | FilaProv | FilaDist;

interface DropdownItem { label: string; checked: boolean; }

// ── DATA — Departamental ────────────────────────────────────────────────────
const MOCK_DEP: FilaDep[] = [
    { departamento:'AMAZONAS',        superficie:  39_249, poblacion:  426_806, hombres:  218_643, mujeres:  208_163, razon:105.0, densidad:   10.9, pctUrbano: 41.2, edadMediana:25.1, p65:  28_882, pct65: 6.8, indiceEnvejecimiento: 28.4,  vivCensadas: 139_000, vivOcupadas: 121_500, vivDesocupadas: 17_500, vivCon1Hogar: 115_800, vivCon2masHogares:  5_700,  hogCensados: 124_200, hogPromPersonas: 3.44, hogPctUnipersonal: 15.2, hogPctConNinos: 62.1, hogPctAdultosMayores: 30.5 },
    { departamento:'ANCASH',          superficie:  35_915, poblacion:1_180_638, hombres:  582_219, mujeres:  598_419, razon: 97.3, densidad:   32.9, pctUrbano: 69.8, edadMediana:27.8, p65:  99_174, pct65: 8.4, indiceEnvejecimiento: 38.2,  vivCensadas: 388_000, vivOcupadas: 330_000, vivDesocupadas: 58_000, vivCon1Hogar: 316_000, vivCon2masHogares: 14_000,  hogCensados: 338_400, hogPromPersonas: 3.49, hogPctUnipersonal: 16.8, hogPctConNinos: 58.4, hogPctAdultosMayores: 34.2 },
    { departamento:'APURIMAC',        superficie:  20_896, poblacion:  476_936, hombres:  237_044, mujeres:  239_892, razon: 98.8, densidad:   22.8, pctUrbano: 55.3, edadMediana:26.4, p65:  42_447, pct65: 8.9, indiceEnvejecimiento: 29.6,  vivCensadas: 158_000, vivOcupadas: 136_000, vivDesocupadas: 22_000, vivCon1Hogar: 130_000, vivCon2masHogares:  6_000,  hogCensados: 139_600, hogPromPersonas: 3.42, hogPctUnipersonal: 14.6, hogPctConNinos: 60.2, hogPctAdultosMayores: 32.1 },
    { departamento:'AREQUIPA',        superficie:  63_345, poblacion:1_497_438, hombres:  738_094, mujeres:  759_344, razon: 97.2, densidad:   23.6, pctUrbano: 91.8, edadMediana:30.1, p65: 130_277, pct65: 8.7, indiceEnvejecimiento: 46.3,  vivCensadas: 518_000, vivOcupadas: 456_000, vivDesocupadas: 62_000, vivCon1Hogar: 441_000, vivCon2masHogares: 15_000,  hogCensados: 468_000, hogPromPersonas: 3.20, hogPctUnipersonal: 21.4, hogPctConNinos: 52.3, hogPctAdultosMayores: 38.6 },
    { departamento:'AYACUCHO',        superficie:  43_815, poblacion:  668_213, hombres:  328_956, mujeres:  339_257, razon: 97.0, densidad:   15.3, pctUrbano: 59.4, edadMediana:26.8, p65:  56_798, pct65: 8.5, indiceEnvejecimiento: 30.2,  vivCensadas: 220_000, vivOcupadas: 188_000, vivDesocupadas: 32_000, vivCon1Hogar: 180_000, vivCon2masHogares:  8_000,  hogCensados: 193_600, hogPromPersonas: 3.45, hogPctUnipersonal: 14.8, hogPctConNinos: 62.4, hogPctAdultosMayores: 31.8 },
    { departamento:'CAJAMARCA',       superficie:  33_318, poblacion:1_453_671, hombres:  725_908, mujeres:  727_763, razon: 99.7, densidad:   43.6, pctUrbano: 34.8, edadMediana:25.2, p65: 107_572, pct65: 7.4, indiceEnvejecimiento: 27.4,  vivCensadas: 435_000, vivOcupadas: 368_000, vivDesocupadas: 67_000, vivCon1Hogar: 352_000, vivCon2masHogares: 16_000,  hogCensados: 376_500, hogPromPersonas: 3.86, hogPctUnipersonal: 12.3, hogPctConNinos: 65.8, hogPctAdultosMayores: 27.4 },
    { departamento:'PROV. CONST. DEL CALLAO', superficie: 147, poblacion:1_129_854, hombres: 556_220, mujeres: 573_634, razon: 97.0, densidad:7_685.4, pctUrbano:100.0, edadMediana:30.4, p65: 84_739, pct65: 7.5, indiceEnvejecimiento: 44.8,  vivCensadas: 335_000, vivOcupadas: 309_000, vivDesocupadas: 26_000, vivCon1Hogar: 298_000, vivCon2masHogares: 11_000,  hogCensados: 317_500, hogPromPersonas: 3.56, hogPctUnipersonal: 18.2, hogPctConNinos: 56.4, hogPctAdultosMayores: 36.8 },
    { departamento:'CUSCO',           superficie:  71_987, poblacion:1_357_075, hombres:  671_504, mujeres:  685_571, razon: 98.0, densidad:   18.8, pctUrbano: 62.8, edadMediana:27.2, p65: 105_851, pct65: 7.8, indiceEnvejecimiento: 31.5,  vivCensadas: 430_000, vivOcupadas: 368_000, vivDesocupadas: 62_000, vivCon1Hogar: 352_000, vivCon2masHogares: 16_000,  hogCensados: 378_500, hogPromPersonas: 3.58, hogPctUnipersonal: 15.6, hogPctConNinos: 60.8, hogPctAdultosMayores: 32.4 },
    { departamento:'HUANCAVELICA',    superficie:  22_131, poblacion:  374_062, hombres:  184_793, mujeres:  189_269, razon: 97.6, densidad:   16.9, pctUrbano: 37.5, edadMediana:24.8, p65:  30_299, pct65: 8.1, indiceEnvejecimiento: 26.8,  vivCensadas: 118_000, vivOcupadas:  98_000, vivDesocupadas: 20_000, vivCon1Hogar:  93_600, vivCon2masHogares:  4_400,  hogCensados: 100_200, hogPromPersonas: 3.73, hogPctUnipersonal: 13.2, hogPctConNinos: 64.5, hogPctAdultosMayores: 29.6 },
    { departamento:'HUANUCO',         superficie:  36_849, poblacion:  762_223, hombres:  381_285, mujeres:  380_938, razon:100.1, densidad:   20.7, pctUrbano: 51.4, edadMediana:25.6, p65:  53_356, pct65: 7.0, indiceEnvejecimiento: 28.9,  vivCensadas: 244_000, vivOcupadas: 207_000, vivDesocupadas: 37_000, vivCon1Hogar: 197_600, vivCon2masHogares:  9_400,  hogCensados: 212_500, hogPromPersonas: 3.59, hogPctUnipersonal: 13.8, hogPctConNinos: 63.2, hogPctAdultosMayores: 29.8 },
    { departamento:'ICA',             superficie:  21_328, poblacion:  975_182, hombres:  487_042, mujeres:  488_140, razon: 99.8, densidad:   45.7, pctUrbano: 91.9, edadMediana:30.2, p65:  78_015, pct65: 8.0, indiceEnvejecimiento: 40.2,  vivCensadas: 319_000, vivOcupadas: 283_000, vivDesocupadas: 36_000, vivCon1Hogar: 272_000, vivCon2masHogares: 11_000,  hogCensados: 290_500, hogPromPersonas: 3.36, hogPctUnipersonal: 19.4, hogPctConNinos: 54.6, hogPctAdultosMayores: 37.2 },
    { departamento:'JUNIN',           superficie:  44_197, poblacion:1_370_274, hombres:  683_244, mujeres:  687_030, razon: 99.4, densidad:   31.0, pctUrbano: 72.2, edadMediana:28.0, p65: 104_141, pct65: 7.6, indiceEnvejecimiento: 34.8,  vivCensadas: 440_000, vivOcupadas: 383_000, vivDesocupadas: 57_000, vivCon1Hogar: 367_000, vivCon2masHogares: 16_000,  hogCensados: 393_500, hogPromPersonas: 3.48, hogPctUnipersonal: 17.2, hogPctConNinos: 58.8, hogPctAdultosMayores: 34.6 },
    { departamento:'LA LIBERTAD',     superficie:  25_500, poblacion:2_016_771, hombres:  990_040, mujeres:1_026_731, razon: 96.4, densidad:   79.1, pctUrbano: 78.4, edadMediana:27.8, p65: 151_258, pct65: 7.5, indiceEnvejecimiento: 36.4,  vivCensadas: 621_000, vivOcupadas: 549_000, vivDesocupadas: 72_000, vivCon1Hogar: 526_000, vivCon2masHogares: 23_000,  hogCensados: 564_500, hogPromPersonas: 3.57, hogPctUnipersonal: 16.4, hogPctConNinos: 58.2, hogPctAdultosMayores: 34.8 },
    { departamento:'LAMBAYEQUE',      superficie:  14_231, poblacion:1_362_689, hombres:  655_024, mujeres:  707_665, razon: 92.6, densidad:   95.8, pctUrbano: 81.7, edadMediana:29.1, p65: 113_103, pct65: 8.3, indiceEnvejecimiento: 41.8,  vivCensadas: 431_000, vivOcupadas: 383_000, vivDesocupadas: 48_000, vivCon1Hogar: 368_000, vivCon2masHogares: 15_000,  hogCensados: 393_500, hogPromPersonas: 3.46, hogPctUnipersonal: 18.6, hogPctConNinos: 56.8, hogPctAdultosMayores: 36.4 },
    { departamento:'LIMA METROPOLITANA 1/', superficie: 2_672, poblacion:9_485_405, hombres:4_617_742, mujeres:4_867_663, razon: 94.9, densidad:3_550.1, pctUrbano:100.0, edadMediana:32.1, p65: 873_281, pct65: 9.2, indiceEnvejecimiento: 56.8,  vivCensadas:2_938_000, vivOcupadas:2_715_000, vivDesocupadas:223_000, vivCon1Hogar:2_632_000, vivCon2masHogares: 83_000,  hogCensados:2_795_000, hogPromPersonas: 3.39, hogPctUnipersonal: 22.4, hogPctConNinos: 50.8, hogPctAdultosMayores: 41.2 },
    { departamento:'REGION LIMA 2/',  superficie:  32_130, poblacion:  640_647, hombres:  312_101, mujeres:  328_546, razon: 95.0, densidad:   19.9, pctUrbano: 73.5, edadMediana:27.4, p65:  58_316, pct65: 9.1, indiceEnvejecimiento: 44.6,  vivCensadas: 205_000, vivOcupadas: 177_000, vivDesocupadas: 28_000, vivCon1Hogar: 169_000, vivCon2masHogares:  8_000,  hogCensados: 181_500, hogPromPersonas: 3.53, hogPctUnipersonal: 19.8, hogPctConNinos: 54.4, hogPctAdultosMayores: 38.2 },
    { departamento:'LORETO',          superficie: 368_852, poblacion:1_027_559, hombres:  527_346, mujeres:  500_213, razon:105.4, densidad:    2.8, pctUrbano: 65.2, edadMediana:22.9, p65:  49_323, pct65: 4.8, indiceEnvejecimiento: 16.2,  vivCensadas: 267_000, vivOcupadas: 234_000, vivDesocupadas: 33_000, vivCon1Hogar: 222_000, vivCon2masHogares: 12_000,  hogCensados: 238_500, hogPromPersonas: 4.31, hogPctUnipersonal: 10.4, hogPctConNinos: 68.6, hogPctAdultosMayores: 22.8 },
    { departamento:'MADRE DE DIOS',   superficie:  85_183, poblacion:  173_811, hombres:   95_596, mujeres:   78_215, razon:122.2, densidad:    2.0, pctUrbano: 71.4, edadMediana:24.5, p65:   6_782, pct65: 3.9, indiceEnvejecimiento: 13.8,  vivCensadas:  50_000, vivOcupadas:  44_000, vivDesocupadas:  6_000, vivCon1Hogar:  41_800, vivCon2masHogares:  2_200,  hogCensados:  45_200, hogPromPersonas: 3.85, hogPctUnipersonal: 11.8, hogPctConNinos: 65.2, hogPctAdultosMayores: 24.6 },
    { departamento:'MOQUEGUA',        superficie:  15_734, poblacion:  192_740, hombres:   98_455, mujeres:   94_285, razon:104.4, densidad:   12.2, pctUrbano: 86.0, edadMediana:32.1, p65:  18_310, pct65: 9.5, indiceEnvejecimiento: 51.2,  vivCensadas:  67_000, vivOcupadas:  59_000, vivDesocupadas:  8_000, vivCon1Hogar:  57_000, vivCon2masHogares:  2_000,  hogCensados:  60_500, hogPromPersonas: 3.19, hogPctUnipersonal: 22.6, hogPctConNinos: 50.4, hogPctAdultosMayores: 42.8 },
    { departamento:'PASCO',           superficie:  25_320, poblacion:  271_904, hombres:  139_388, mujeres:  132_516, razon:105.2, densidad:   10.7, pctUrbano: 66.5, edadMediana:25.5, p65:  15_227, pct65: 5.6, indiceEnvejecimiento: 24.8,  vivCensadas:  84_000, vivOcupadas:  72_000, vivDesocupadas: 12_000, vivCon1Hogar:  68_800, vivCon2masHogares:  3_200,  hogCensados:  73_800, hogPromPersonas: 3.68, hogPctUnipersonal: 14.4, hogPctConNinos: 62.8, hogPctAdultosMayores: 28.4 },
    { departamento:'PIURA',           superficie:  35_892, poblacion:2_047_954, hombres:1_011_232, mujeres:1_036_722, razon: 97.5, densidad:   57.1, pctUrbano: 74.5, edadMediana:27.4, p65: 155_644, pct65: 7.6, indiceEnvejecimiento: 37.8,  vivCensadas: 614_000, vivOcupadas: 548_000, vivDesocupadas: 66_000, vivCon1Hogar: 526_000, vivCon2masHogares: 22_000,  hogCensados: 563_500, hogPromPersonas: 3.63, hogPctUnipersonal: 15.6, hogPctConNinos: 60.4, hogPctAdultosMayores: 32.8 },
    { departamento:'PUNO',            superficie:  71_999, poblacion:1_268_441, hombres:  630_014, mujeres:  638_427, razon: 98.7, densidad:   17.6, pctUrbano: 53.6, edadMediana:26.9, p65: 101_475, pct65: 8.0, indiceEnvejecimiento: 34.2,  vivCensadas: 384_000, vivOcupadas: 326_000, vivDesocupadas: 58_000, vivCon1Hogar: 311_000, vivCon2masHogares: 15_000,  hogCensados: 334_500, hogPromPersonas: 3.79, hogPctUnipersonal: 14.2, hogPctConNinos: 63.8, hogPctAdultosMayores: 30.4 },
    { departamento:'SAN MARTIN',      superficie:  51_253, poblacion:  974_160, hombres:  512_133, mujeres:  462_027, razon:110.8, densidad:   19.0, pctUrbano: 69.3, edadMediana:25.8, p65:  46_760, pct65: 4.8, indiceEnvejecimiento: 17.6,  vivCensadas: 281_000, vivOcupadas: 248_000, vivDesocupadas: 33_000, vivCon1Hogar: 237_000, vivCon2masHogares: 11_000,  hogCensados: 254_500, hogPromPersonas: 3.83, hogPctUnipersonal: 12.6, hogPctConNinos: 64.8, hogPctAdultosMayores: 26.8 },
    { departamento:'TACNA',           superficie:  16_076, poblacion:  395_533, hombres:  199_748, mujeres:  195_785, razon:102.0, densidad:   24.6, pctUrbano: 88.7, edadMediana:31.5, p65:  34_016, pct65: 8.6, indiceEnvejecimiento: 48.6,  vivCensadas: 136_000, vivOcupadas: 119_000, vivDesocupadas: 17_000, vivCon1Hogar: 114_000, vivCon2masHogares:  5_000,  hogCensados: 122_000, hogPromPersonas: 3.24, hogPctUnipersonal: 20.8, hogPctConNinos: 52.6, hogPctAdultosMayores: 40.4 },
    { departamento:'TUMBES',          superficie:   4_669, poblacion:  252_261, hombres:  130_892, mujeres:  121_369, razon:107.8, densidad:   54.0, pctUrbano: 84.5, edadMediana:27.1, p65:  13_874, pct65: 5.5, indiceEnvejecimiento: 22.4,  vivCensadas:  77_000, vivOcupadas:  69_000, vivDesocupadas:  8_000, vivCon1Hogar:  66_200, vivCon2masHogares:  2_800,  hogCensados:  70_800, hogPromPersonas: 3.56, hogPctUnipersonal: 16.4, hogPctConNinos: 58.8, hogPctAdultosMayores: 32.6 },
    { departamento:'UCAYALI',         superficie: 102_411, poblacion:  609_794, hombres:  316_521, mujeres:  293_273, razon:107.9, densidad:    6.0, pctUrbano: 74.2, edadMediana:23.7, p65:  25_611, pct65: 4.2, indiceEnvejecimiento: 14.6,  vivCensadas: 174_000, vivOcupadas: 153_000, vivDesocupadas: 21_000, vivCon1Hogar: 146_000, vivCon2masHogares:  7_000,  hogCensados: 157_500, hogPromPersonas: 3.87, hogPctUnipersonal: 11.2, hogPctConNinos: 67.4, hogPctAdultosMayores: 24.2 },
];

// ── DATA — Provincial (Ayacucho) ─────────────────────────────────────────────
const MOCK_PROV: FilaProv[] = [
    { departamento:'AYACUCHO', provincia:'HUAMANGA',             superficie:  2_981, poblacion: 302_206, hombres: 144_872, mujeres: 157_334, razon: 92.1, densidad: 101.4, pctUrbano: 83.1, edadMediana:27.2, p65:  23_572, pct65: 7.8, indiceEnvejecimiento: 36.4,  vivCensadas:  98_000, vivOcupadas:  87_000, vivDesocupadas: 11_000, vivCon1Hogar:  83_500, vivCon2masHogares:  3_500,  hogCensados:  89_800, hogPromPersonas: 3.37, hogPctUnipersonal: 17.4, hogPctConNinos: 56.8, hogPctAdultosMayores: 36.2 },
    { departamento:'AYACUCHO', provincia:'CANGALLO',             superficie:  1_916, poblacion:  33_598, hombres:  16_231, mujeres:  17_367, razon: 93.5, densidad:  17.5, pctUrbano: 26.4, edadMediana:22.8, p65:   3_427, pct65:10.2, indiceEnvejecimiento: 42.8,  vivCensadas:  12_500, vivOcupadas:  10_200, vivDesocupadas:  2_300, vivCon1Hogar:   9_750, vivCon2masHogares:    450,  hogCensados:  10_400, hogPromPersonas: 3.23, hogPctUnipersonal: 13.8, hogPctConNinos: 63.4, hogPctAdultosMayores: 32.6 },
    { departamento:'AYACUCHO', provincia:'HUANCA SANCOS',        superficie:  2_862, poblacion:  11_580, hombres:   5_640, mujeres:   5_940, razon: 94.9, densidad:   4.0, pctUrbano: 41.3, edadMediana:24.1, p65:   1_321, pct65:11.4, indiceEnvejecimiento: 50.6,  vivCensadas:   4_200, vivOcupadas:   3_400, vivDesocupadas:    800, vivCon1Hogar:   3_260, vivCon2masHogares:    140,  hogCensados:   3_480, hogPromPersonas: 3.33, hogPctUnipersonal: 14.2, hogPctConNinos: 61.8, hogPctAdultosMayores: 33.4 },
    { departamento:'AYACUCHO', provincia:'HUANTA',               superficie:  3_878, poblacion:  98_341, hombres:  48_562, mujeres:  49_779, razon: 97.6, densidad:  25.4, pctUrbano: 53.2, edadMediana:25.6, p65:   7_966, pct65: 8.1, indiceEnvejecimiento: 31.2,  vivCensadas:  32_000, vivOcupadas:  27_500, vivDesocupadas:  4_500, vivCon1Hogar:  26_300, vivCon2masHogares:  1_200,  hogCensados:  28_200, hogPromPersonas: 3.49, hogPctUnipersonal: 15.2, hogPctConNinos: 62.4, hogPctAdultosMayores: 31.8 },
    { departamento:'AYACUCHO', provincia:'LA MAR',               superficie:  4_394, poblacion:  74_426, hombres:  37_219, mujeres:  37_207, razon:100.0, densidad:  16.9, pctUrbano: 32.1, edadMediana:23.4, p65:   5_656, pct65: 7.6, indiceEnvejecimiento: 27.4,  vivCensadas:  22_500, vivOcupadas:  18_800, vivDesocupadas:  3_700, vivCon1Hogar:  17_900, vivCon2masHogares:    900,  hogCensados:  19_300, hogPromPersonas: 3.86, hogPctUnipersonal: 12.4, hogPctConNinos: 66.8, hogPctAdultosMayores: 28.6 },
    { departamento:'AYACUCHO', provincia:'LUCANAS',              superficie: 14_494, poblacion:  63_458, hombres:  31_546, mujeres:  31_912, razon: 98.9, densidad:   4.4, pctUrbano: 52.7, edadMediana:28.5, p65:   6_853, pct65:10.8, indiceEnvejecimiento: 48.2,  vivCensadas:  24_000, vivOcupadas:  18_900, vivDesocupadas:  5_100, vivCon1Hogar:  18_050, vivCon2masHogares:    850,  hogCensados:  19_400, hogPromPersonas: 3.27, hogPctUnipersonal: 16.8, hogPctConNinos: 60.2, hogPctAdultosMayores: 35.4 },
    { departamento:'AYACUCHO', provincia:'PARINACOCHAS',         superficie:  5_968, poblacion:  23_215, hombres:  11_589, mujeres:  11_626, razon: 99.7, densidad:   3.9, pctUrbano: 49.8, edadMediana:27.9, p65:   2_577, pct65:11.1, indiceEnvejecimiento: 49.4,  vivCensadas:   8_600, vivOcupadas:   7_000, vivDesocupadas:  1_600, vivCon1Hogar:   6_700, vivCon2masHogares:    300,  hogCensados:   7_200, hogPromPersonas: 3.22, hogPctUnipersonal: 16.4, hogPctConNinos: 61.4, hogPctAdultosMayores: 34.8 },
    { departamento:'AYACUCHO', provincia:'PAUCAR DEL SARA SARA', superficie:  2_069, poblacion:  11_427, hombres:   5_657, mujeres:   5_770, razon: 98.0, densidad:   5.5, pctUrbano: 43.1, edadMediana:30.2, p65:   1_371, pct65:12.0, indiceEnvejecimiento: 55.8,  vivCensadas:   4_400, vivOcupadas:   3_400, vivDesocupadas:  1_000, vivCon1Hogar:   3_260, vivCon2masHogares:    140,  hogCensados:   3_500, hogPromPersonas: 3.26, hogPctUnipersonal: 17.8, hogPctConNinos: 59.4, hogPctAdultosMayores: 36.8 },
    { departamento:'AYACUCHO', provincia:'SUCRE',                superficie:  1_785, poblacion:  14_289, hombres:   7_003, mujeres:   7_286, razon: 96.1, densidad:   8.0, pctUrbano: 28.9, edadMediana:28.8, p65:   1_672, pct65:11.7, indiceEnvejecimiento: 53.2,  vivCensadas:   5_200, vivOcupadas:   4_100, vivDesocupadas:  1_100, vivCon1Hogar:   3_930, vivCon2masHogares:    170,  hogCensados:   4_200, hogPromPersonas: 3.40, hogPctUnipersonal: 15.6, hogPctConNinos: 62.8, hogPctAdultosMayores: 33.2 },
    { departamento:'AYACUCHO', provincia:'VICTOR FAJARDO',       superficie:  2_161, poblacion:  19_987, hombres:   9_778, mujeres:  10_209, razon: 95.8, densidad:   9.2, pctUrbano: 35.4, edadMediana:27.1, p65:   2_059, pct65:10.3, indiceEnvejecimiento: 44.6,  vivCensadas:   7_000, vivOcupadas:   5_700, vivDesocupadas:  1_300, vivCon1Hogar:   5_470, vivCon2masHogares:    230,  hogCensados:   5_850, hogPromPersonas: 3.42, hogPctUnipersonal: 14.8, hogPctConNinos: 63.6, hogPctAdultosMayores: 32.4 },
    { departamento:'AYACUCHO', provincia:'VILCAS HUAMÁN',        superficie:  1_307, poblacion:  20_686, hombres:  10_859, mujeres:   9_827, razon:110.5, densidad:  15.8, pctUrbano: 30.2, edadMediana:24.7, p65:   1_882, pct65: 9.1, indiceEnvejecimiento: 38.6,  vivCensadas:   7_200, vivOcupadas:   5_900, vivDesocupadas:  1_300, vivCon1Hogar:   5_640, vivCon2masHogares:    260,  hogCensados:   6_050, hogPromPersonas: 3.42, hogPctUnipersonal: 13.6, hogPctConNinos: 64.8, hogPctAdultosMayores: 31.8 },
];

// ── DATA — Distrital (Huamanga) ──────────────────────────────────────────────
const MOCK_DIST: FilaDist[] = [
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'AYACUCHO',                          superficie:   18.9, poblacion:105_418, hombres: 49_312, mujeres: 56_106, razon: 87.9, densidad:5_579.8, pctUrbano:100.0, edadMediana:29.8, p65:  7_485, pct65: 7.1, indiceEnvejecimiento: 35.6,  vivCensadas:  36_000, vivOcupadas:  32_800, vivDesocupadas:  3_200, vivCon1Hogar:  31_650, vivCon2masHogares:  1_150,  hogCensados:  33_900, hogPromPersonas: 3.11, hogPctUnipersonal: 21.2, hogPctConNinos: 52.4, hogPctAdultosMayores: 38.8 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ACOCRO',                            superficie:  469.5, poblacion:  9_842, hombres:  4_843, mujeres:  4_999, razon: 96.9, densidad:   21.0, pctUrbano: 20.3, edadMediana:23.5, p65:    925, pct65: 9.4, indiceEnvejecimiento: 42.2,  vivCensadas:   3_200, vivOcupadas:   2_700, vivDesocupadas:    500, vivCon1Hogar:   2_590, vivCon2masHogares:    110,  hogCensados:   2_760, hogPromPersonas: 3.57, hogPctUnipersonal: 13.4, hogPctConNinos: 63.8, hogPctAdultosMayores: 30.2 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ACOS VINCHOS',                      superficie:  298.6, poblacion:  4_211, hombres:  2_050, mujeres:  2_161, razon: 94.9, densidad:   14.1, pctUrbano: 15.8, edadMediana:22.1, p65:    455, pct65:10.8, indiceEnvejecimiento: 48.4,  vivCensadas:   1_400, vivOcupadas:   1_150, vivDesocupadas:    250, vivCon1Hogar:   1_100, vivCon2masHogares:     50,  hogCensados:   1_180, hogPromPersonas: 3.57, hogPctUnipersonal: 13.8, hogPctConNinos: 64.2, hogPctAdultosMayores: 29.8 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'CARMEN ALTO',                       superficie:   22.5, poblacion: 38_621, hombres: 18_844, mujeres: 19_777, razon: 95.3, densidad:1_716.5, pctUrbano: 98.4, edadMediana:28.4, p65:  2_279, pct65: 5.9, indiceEnvejecimiento: 26.8,  vivCensadas:  12_800, vivOcupadas:  11_700, vivDesocupadas:  1_100, vivCon1Hogar:  11_280, vivCon2masHogares:    420,  hogCensados:  12_000, hogPromPersonas: 3.22, hogPctUnipersonal: 19.4, hogPctConNinos: 54.8, hogPctAdultosMayores: 37.2 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'CHIARA',                            superficie:  316.4, poblacion:  5_803, hombres:  2_834, mujeres:  2_969, razon: 95.5, densidad:   18.3, pctUrbano: 22.6, edadMediana:24.2, p65:    563, pct65: 9.7, indiceEnvejecimiento: 43.8,  vivCensadas:   1_900, vivOcupadas:   1_580, vivDesocupadas:    320, vivCon1Hogar:   1_510, vivCon2masHogares:     70,  hogCensados:   1_620, hogPromPersonas: 3.58, hogPctUnipersonal: 13.2, hogPctConNinos: 65.4, hogPctAdultosMayores: 30.8 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'OCROS',                             superficie:  414.1, poblacion:  4_982, hombres:  2_412, mujeres:  2_570, razon: 93.8, densidad:   12.0, pctUrbano: 19.4, edadMediana:23.8, p65:    558, pct65:11.2, indiceEnvejecimiento: 50.8,  vivCensadas:   1_700, vivOcupadas:   1_380, vivDesocupadas:    320, vivCon1Hogar:   1_320, vivCon2masHogares:     60,  hogCensados:   1_420, hogPromPersonas: 3.51, hogPctUnipersonal: 14.4, hogPctConNinos: 63.6, hogPctAdultosMayores: 31.4 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'PACAYCASA',                         superficie:   86.2, poblacion:  3_891, hombres:  1_897, mujeres:  1_994, razon: 95.1, densidad:   45.1, pctUrbano: 30.2, edadMediana:24.0, p65:    393, pct65:10.1, indiceEnvejecimiento: 45.2,  vivCensadas:   1_250, vivOcupadas:   1_060, vivDesocupadas:    190, vivCon1Hogar:   1_015, vivCon2masHogares:     45,  hogCensados:   1_090, hogPromPersonas: 3.57, hogPctUnipersonal: 14.2, hogPctConNinos: 63.8, hogPctAdultosMayores: 30.8 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'QUINUA',                            superficie:  211.5, poblacion:  5_647, hombres:  2_741, mujeres:  2_906, razon: 94.3, densidad:   26.7, pctUrbano: 25.8, edadMediana:23.9, p65:    593, pct65:10.5, indiceEnvejecimiento: 47.2,  vivCensadas:   1_850, vivOcupadas:   1_540, vivDesocupadas:    310, vivCon1Hogar:   1_475, vivCon2masHogares:     65,  hogCensados:   1_580, hogPromPersonas: 3.57, hogPctUnipersonal: 13.8, hogPctConNinos: 64.4, hogPctAdultosMayores: 30.6 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SAN JOSE DE TICLLAS',               superficie:  138.7, poblacion:  2_318, hombres:  1_120, mujeres:  1_198, razon: 93.5, densidad:   16.7, pctUrbano: 14.9, edadMediana:22.6, p65:    276, pct65:11.9, indiceEnvejecimiento: 53.6,  vivCensadas:     780, vivOcupadas:     640, vivDesocupadas:    140, vivCon1Hogar:     612, vivCon2masHogares:     28,  hogCensados:     656, hogPromPersonas: 3.53, hogPctUnipersonal: 13.6, hogPctConNinos: 64.8, hogPctAdultosMayores: 30.2 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SAN JUAN BAUTISTA',                 superficie:   31.6, poblacion: 68_344, hombres: 33_192, mujeres: 35_152, razon: 94.4, densidad:2_162.8, pctUrbano: 99.1, edadMediana:29.2, p65:  4_306, pct65: 6.3, indiceEnvejecimiento: 29.4,  vivCensadas:  21_800, vivOcupadas:  20_100, vivDesocupadas:  1_700, vivCon1Hogar:  19_370, vivCon2masHogares:    730,  hogCensados:  20_700, hogPromPersonas: 3.30, hogPctUnipersonal: 20.4, hogPctConNinos: 53.6, hogPctAdultosMayores: 38.4 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SANTIAGO DE PISCHA',                superficie:  198.3, poblacion:  1_492, hombres:    730, mujeres:    762, razon: 95.8, densidad:    7.5, pctUrbano: 12.4, edadMediana:22.0, p65:    181, pct65:12.1, indiceEnvejecimiento: 54.6,  vivCensadas:     520, vivOcupadas:     420, vivDesocupadas:    100, vivCon1Hogar:     402, vivCon2masHogares:     18,  hogCensados:     432, hogPromPersonas: 3.46, hogPctUnipersonal: 13.4, hogPctConNinos: 65.2, hogPctAdultosMayores: 30.4 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SOCOS',                             superficie:  276.5, poblacion:  4_920, hombres:  2_393, mujeres:  2_527, razon: 94.7, densidad:   17.8, pctUrbano: 18.2, edadMediana:23.2, p65:    512, pct65:10.4, indiceEnvejecimiento: 46.8,  vivCensadas:   1_640, vivOcupadas:   1_360, vivDesocupadas:    280, vivCon1Hogar:   1_302, vivCon2masHogares:     58,  hogCensados:   1_390, hogPromPersonas: 3.54, hogPctUnipersonal: 13.8, hogPctConNinos: 64.6, hogPctAdultosMayores: 30.4 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'TAMBILLO',                          superficie:  196.8, poblacion:  4_371, hombres:  2_120, mujeres:  2_251, razon: 94.2, densidad:   22.2, pctUrbano: 24.1, edadMediana:23.6, p65:    428, pct65: 9.8, indiceEnvejecimiento: 44.2,  vivCensadas:   1_450, vivOcupadas:   1_200, vivDesocupadas:    250, vivCon1Hogar:   1_148, vivCon2masHogares:     52,  hogCensados:   1_230, hogPromPersonas: 3.55, hogPctUnipersonal: 14.0, hogPctConNinos: 64.2, hogPctAdultosMayores: 30.6 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'VINCHOS',                           superficie:  500.2, poblacion: 11_206, hombres:  5_478, mujeres:  5_728, razon: 95.6, densidad:   22.4, pctUrbano: 17.5, edadMediana:22.9, p65:  1_154, pct65:10.3, indiceEnvejecimiento: 46.2,  vivCensadas:   3_600, vivOcupadas:   2_960, vivDesocupadas:    640, vivCon1Hogar:   2_830, vivCon2masHogares:    130,  hogCensados:   3_030, hogPromPersonas: 3.70, hogPctUnipersonal: 12.8, hogPctConNinos: 66.4, hogPctAdultosMayores: 29.2 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'JESUS NAZARENO',                    superficie:    9.8, poblacion: 25_087, hombres: 12_150, mujeres: 12_937, razon: 93.9, densidad:2_560.9, pctUrbano:100.0, edadMediana:28.9, p65:  1_806, pct65: 7.2, indiceEnvejecimiento: 33.4,  vivCensadas:   8_200, vivOcupadas:   7_550, vivDesocupadas:    650, vivCon1Hogar:   7_270, vivCon2masHogares:    280,  hogCensados:   7_770, hogPromPersonas: 3.23, hogPctUnipersonal: 20.8, hogPctConNinos: 53.2, hogPctAdultosMayores: 38.6 },
    { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ANDRES AVELINO CACERES DORREGARAY', superficie:   11.2, poblacion:  6_050, hombres:  3_011, mujeres:  3_039, razon: 99.1, densidad:  540.2, pctUrbano: 95.6, edadMediana:27.5, p65:    520, pct65: 8.6, indiceEnvejecimiento: 38.8,  vivCensadas:   1_980, vivOcupadas:   1_820, vivDesocupadas:    160, vivCon1Hogar:   1_752, vivCon2masHogares:     68,  hogCensados:   1_870, hogPromPersonas: 3.24, hogPctUnipersonal: 19.6, hogPctConNinos: 54.8, hogPctAdultosMayores: 37.4 },
];

const DEPS_LIST  = MOCK_DEP.map(r => r.departamento);
const PROVS_LIST = MOCK_PROV.map(r => r.provincia);
const DISTS_LIST = MOCK_DIST.map(r => r.distrito);

function allChecked(labels: string[]): DropdownItem[] {
    return labels.map(label => ({ label, checked: true }));
}

@Component({
    selector: 'app-comparativa-territorial',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, MatTooltipModule, HeroIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="bg-[#f4f7f9] h-full flex flex-col font-sans text-gray-800" (click)="closeAll()">

      <!-- ══ HEADER ═══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 flex justify-between items-center
                     px-4 py-1 sm:px-6 sm:py-1.5 md:px-10 lg:px-12 lg:py-2 w-full shrink-0">
        <div class="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div class="flex items-center cursor-pointer" routerLink="/">
            <img src="logo_inei_azul.png" alt="Logo INEI" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain">
          </div>
          <div class="w-px h-6 md:h-7 bg-gray-200 hidden md:block"></div>
          <img src="logo_cpv.png" alt="Logo CPV 2025" class="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain hidden md:block">
        </div>
        <nav class="hidden lg:flex items-center gap-5 xl:gap-6 text-base font-medium tracking-wide" style="color:#0056a1">
          <button routerLink="/" class="hover:text-secondary transition-colors uppercase relative group">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/intermedia" class="hover:text-secondary transition-colors uppercase relative group font-black underline">
            Resultados<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/publicaciones" class="hover:text-secondary transition-colors uppercase relative group">
            Publicaciones<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)" class="hover:text-secondary transition-colors uppercase relative group flex items-center gap-1">
              Censos 2025
              <app-hero-icon [name]="'chevron-down'" class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="censosOpen()"></app-hero-icon>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards" (click)="$event.stopPropagation()">
                <div class="h-1 w-full bg-gradient-to-r from-primary to-secondary"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-base font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary transition-all flex items-center gap-2 group/item">
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
        <button (click)="toggleMobileMenu($event)" class="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors gap-1.5" aria-label="Menú">
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.rotate-45]="mobileMenuOpen()" [class.translate-y-2]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.opacity-0]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.-rotate-45]="mobileMenuOpen()" [class.-translate-y-2]="mobileMenuOpen()"></span>
        </button>
      </header>

      @if (mobileMenuOpen()) {
        <div class="lg:hidden bg-white border-b border-gray-100 shadow-md z-40 px-4 py-3 flex flex-col gap-1 shrink-0"
             style="animation: dropdownIn 0.18s ease-out forwards" (click)="$event.stopPropagation()">
          <button routerLink="/" (click)="mobileMenuOpen.set(false)" class="text-left px-3 py-2.5 rounded-xl text-base font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">Inicio</button>
          <button routerLink="/resultados" (click)="mobileMenuOpen.set(false)" class="text-left px-3 py-2.5 rounded-xl text-base font-black text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide underline">Resultados</button>
          <button routerLink="/noticias" (click)="mobileMenuOpen.set(false)" class="text-left px-3 py-2.5 rounded-xl text-base font-bold text-[#0056a1] hover:bg-blue-50 transition-colors uppercase tracking-wide">Noticias</button>
        </div>
      }

      <!-- ══ BOTONERA DE SECCIONES + FILTROS GEO ═══════════════════════════ -->
      <div class="w-full shrink-0" style="background:#ffffff; box-shadow: 0 2px 8px rgba(0,86,161,0.15);">
        <div class="flex items-center px-3 sm:px-5 py-1.5 gap-2" (click)="$event.stopPropagation()">
          <!-- Sección buttons (left) -->
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            @for (btn of navSections; track btn.id) {
              <button [routerLink]="btn.route ?? null"
                (click)="btn.route ? null : setActiveSection(btn.id)"
                class="relative flex flex-row items-center justify-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full
                       text-[11px] sm:text-[12px] font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none group shrink-0"
                [style]="isBtnActive(btn) ? 'background:#003d7a;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);' : 'background:#0056a1;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.15);'">
                <app-hero-icon [name]="btn.icon" class="w-3.5 h-3.5 shrink-0 text-white"></app-hero-icon>
                <span class="text-white">{{ btn.label }}</span>
                @if (!isBtnActive(btn)) {
                  <span class="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-200 pointer-events-none rounded-full bg-white"></span>
                }
              </button>
            }
          </div>
          <!-- Filtros Geo (right) -->
          <div class="ml-auto flex items-center gap-2 overflow-x-auto">
            <button (click)="resetFiltros()" class="flex items-center gap-1 text-gray-400 hover:text-[#0056a1] transition-colors text-[10px] font-black tracking-wide shrink-0 group whitespace-nowrap">
              <app-hero-icon [name]="'arrow-path'" class="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
              <span>Restablecer</span>
            </button>
            <div class="h-6 w-px bg-gray-200 shrink-0"></div>
            <!-- Nivel -->
            <div class="relative shrink-0">
              <button (click)="toggleDropdown('nivel'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#0056a1] to-[#1a75aa] text-white rounded-xl text-[10px] font-bold shadow-sm transition-all whitespace-nowrap justify-between" style="min-width:120px">
                <span class="flex items-center gap-1">
                  <app-hero-icon [name]="'map'" class="w-3 h-3 opacity-80"></app-hero-icon>
                  <span>{{ nivelActivo() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 transition-transform" [class.rotate-180]="openDropdown() === 'nivel'"></app-hero-icon>
              </button>
              @if (openDropdown() === 'nivel') {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-52 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nivel geográfico</span>
                  </div>
                  @for (n of NIVELES; track n) {
                    <button (click)="setNivel(n)"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                      [class.bg-gradient-to-r]="nivelActivo() === n" [class.from-\[\#0056a1\]]="nivelActivo() === n" [class.to-\[\#1a75aa\]]="nivelActivo() === n"
                      [class.text-white]="nivelActivo() === n" [class.text-gray-700]="nivelActivo() !== n" [class.hover\:bg-blue-50]="nivelActivo() !== n">
                      <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="nivelActivo() === n" [class.border-gray-300]="nivelActivo() !== n">
                        @if (nivelActivo() === n) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold">{{ n }}</span>
                    </button>
                  }
                </div>
              }
            </div>
            <div class="h-6 w-px bg-gray-200 shrink-0"></div>
            <!-- Departamento -->
            <div class="relative shrink-0">
              <button (click)="toggleDropdown('dep'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-all whitespace-nowrap justify-between" style="min-width:120px">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                  <span class="text-gray-400">Dep.:</span>
                  <span class="truncate max-w-[70px]">{{ depLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 text-gray-400 transition-transform" [class.rotate-180]="openDropdown() === 'dep'"></app-hero-icon>
              </button>
              @if (openDropdown() === 'dep') {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-60 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar departamentos</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <label class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors text-[10px] font-bold text-gray-600 border-b border-gray-100">
                      <input type="checkbox" [checked]="allDepsOn()" (change)="toggleAllDeps()" class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3 h-3">
                      Seleccionar todas
                    </label>
                    @for (item of depsItems(); track item.label; let i = $index) {
                      <label class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-[11px] text-gray-700 transition-colors">
                        <input type="checkbox" [checked]="item.checked" (change)="toggleDep(i)" class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3 h-3">
                        {{ item.label }}
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
            <!-- Provincia -->
            <div class="relative shrink-0">
              <button (click)="isProvActive() && toggleDropdown('prov'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-bold transition-all whitespace-nowrap justify-between" style="min-width:110px"
                [class.bg-gray-50]="isProvActive()" [class.border-gray-200]="isProvActive()" [class.text-gray-700]="isProvActive()" [class.hover\:bg-gray-100]="isProvActive()"
                [class.bg-gray-50\/50]="!isProvActive()" [class.border-gray-100]="!isProvActive()" [class.text-gray-300]="!isProvActive()" [class.cursor-not-allowed]="!isProvActive()">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" [class.bg-\[\#1a75aa\]]="isProvActive()" [class.bg-gray-200]="!isProvActive()"></span>
                  <span [class.text-gray-400]="isProvActive()" [class.text-gray-300]="!isProvActive()">Prov.:</span>
                  <span class="truncate max-w-[60px]">{{ provLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 transition-transform"
                  [class.text-gray-400]="isProvActive()" [class.text-gray-200]="!isProvActive()" [class.rotate-180]="openDropdown() === 'prov'"></app-hero-icon>
              </button>
              @if (openDropdown() === 'prov' && isProvActive()) {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-60 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar provincias</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <label class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors text-[10px] font-bold text-gray-600 border-b border-gray-100">
                      <input type="checkbox" [checked]="allProvsOn()" (change)="toggleAllProvs()" class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3 h-3">
                      Seleccionar todas
                    </label>
                    @for (item of provsItems(); track item.label; let i = $index) {
                      <label class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-[11px] text-gray-700 transition-colors">
                        <input type="checkbox" [checked]="item.checked" (change)="toggleProv(i)" class="rounded border-gray-300 text-[#0056a1] focus:ring-[#0056a1] w-3 h-3">
                        {{ item.label }}
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
            <!-- Distrito -->
            <div class="relative shrink-0">
              <button (click)="isDistActive() && toggleDropdown('dist'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-bold transition-all whitespace-nowrap justify-between" style="min-width:110px"
                [class.bg-gray-50]="isDistActive()" [class.border-gray-200]="isDistActive()" [class.text-gray-700]="isDistActive()" [class.hover\:bg-gray-100]="isDistActive()"
                [class.bg-gray-50\/50]="!isDistActive()" [class.border-gray-100]="!isDistActive()" [class.text-gray-300]="!isDistActive()" [class.cursor-not-allowed]="!isDistActive()">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" [class.bg-\[\#33b3a9\]]="isDistActive()" [class.bg-gray-200]="!isDistActive()"></span>
                  <span [class.text-gray-400]="isDistActive()" [class.text-gray-300]="!isDistActive()">Dist.:</span>
                  <span class="truncate max-w-[60px]">{{ distLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 transition-transform"
                  [class.text-gray-400]="isDistActive()" [class.text-gray-200]="!isDistActive()" [class.rotate-180]="openDropdown() === 'dist'"></app-hero-icon>
              </button>
              @if (openDropdown() === 'dist' && isDistActive()) {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-72 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar distritos</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <label class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-teal-50 transition-colors text-[10px] font-bold text-gray-600 border-b border-gray-100">
                      <input type="checkbox" [checked]="allDistsOn()" (change)="toggleAllDists()" class="rounded border-gray-300 text-[#33b3a9] focus:ring-[#33b3a9] w-3 h-3">
                      Seleccionar todos
                    </label>
                    @for (item of distItems(); track item.label; let i = $index) {
                      <label class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-teal-50 text-[11px] text-gray-700 transition-colors">
                        <input type="checkbox" [checked]="item.checked" (change)="toggleDist(i)" class="rounded border-gray-300 text-[#33b3a9] focus:ring-[#33b3a9] w-3 h-3">
                        {{ item.label }}
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- ══ BARRA DE FILTROS SECUNDARIA — fila 1: navegación ═════════════ -->
      <div class="bg-white border-b border-gray-100 shadow-sm sticky z-40
                  top-[38px] sm:top-[43px] md:top-[47px] lg:top-[50px]
                  px-2 py-1.5 md:px-4 shrink-0
                  flex flex-nowrap items-center gap-2 overflow-x-auto"
           (click)="$event.stopPropagation()">

        <!-- Pill: Ind. Principales (ACTIVO por defecto) | Ind. Temáticos (inactivo) -->
        <div class="flex bg-gray-100 p-0.5 rounded-xl gap-0.5 shrink-0">
          <button class="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold shadow-sm bg-gradient-to-r from-[#0056a1] to-[#33b3a9] text-white tracking-wide whitespace-nowrap cursor-default">
            Ind. Principales
          </button>
          <button routerLink="/comparativa" class="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-gray-400 hover:text-gray-600 tracking-wide whitespace-nowrap transition-all">
            Ind. Temáticos
          </button>
        </div>

        <!-- Sub-botones: Indicadores | Comparativo territorial (ACTIVO) | Evolución -->
        <div class="flex bg-gradient-to-r from-[#0056a1]/10 to-[#33b3a9]/10 border border-[#0056a1]/20 p-0.5 rounded-xl gap-0.5 shrink-0">
          @for (tab of viewTabs; track tab.route) {
            <button [routerLink]="tab.route"
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all whitespace-nowrap"
              [style]="isViewTabActive(tab.route) ? 'background:#fff;color:#0056a1;box-shadow:0 1px 4px rgba(0,0,0,0.10);' : 'color:#9ca3af;'">
              <app-hero-icon [name]="tab.icon" class="w-3 h-3 shrink-0"></app-hero-icon>
              <span>{{ tab.label }}</span>
            </button>
          }
        </div>

        <!-- Ámbito actual -->
        <div class="ml-auto shrink-0 flex items-center gap-1.5 bg-[#0056a1]/5 border border-[#0056a1]/20 rounded-lg px-2 py-1">
          <app-hero-icon [name]="'map-pin'" class="w-3 h-3 text-[#0056a1] shrink-0"></app-hero-icon>
          <span class="text-[10px] font-black text-[#0056a1] whitespace-nowrap">{{ tituloTabla() }}</span>
        </div>

      </div><!-- /barra filtros fila 1 -->

      <!-- ══ BARRA DE FILTROS — fila 2: categorías temáticas ═══════════════ -->
      <div class="bg-white border-b border-gray-200 shrink-0 flex items-center justify-start gap-0 px-2"
           (click)="$event.stopPropagation()">
        @for (cat of categoryTabs; track cat.id; let last = $last) {
          <button (click)="setActiveCategory(cat.id)"
            class="relative flex flex-col items-center justify-center gap-0.5 px-6 py-1.5 transition-all group"
            [style]="activeCategory() === cat.id
              ? 'color:#0056a1;'
              : 'color:#9ca3af;'">
            <!-- icono -->
            <div class="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                 [style]="activeCategory() === cat.id
                   ? 'background:linear-gradient(135deg,#0056a1,#33b3a9);box-shadow:0 2px 6px rgba(0,86,161,0.30);'
                   : 'background:#f3f4f6;'">
              <app-hero-icon [name]="cat.icon"
                class="w-4 h-4 transition-colors"
                [class.text-white]="activeCategory() === cat.id"
                [class.text-gray-400]="activeCategory() !== cat.id">
              </app-hero-icon>
            </div>
            <!-- label -->
            <span class="text-[9px] font-black tracking-wide uppercase whitespace-nowrap leading-none">{{ cat.label }}</span>
            <!-- indicator line -->
            @if (activeCategory() === cat.id) {
              <span class="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#0056a1] to-[#33b3a9]"></span>
            }
          </button>
          @if (!last) {
            <span class="w-px h-8 bg-gray-100 shrink-0"></span>
          }
        }
      </div><!-- /barra filtros fila 2 -->

      <!-- ══ CUERPO ════════════════════════════════════════════════════════════ -->
      <main class="flex-1 h-0 flex flex-col min-h-0 p-2 md:p-3 xl:p-4 2xl:p-6">
        <div class="flex-1 h-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

          <!-- Barra de estado -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between
                      px-3 md:px-4 xl:px-6 py-2 xl:py-3 bg-[#0056a1]/5 border-b border-[#0056a1]/10 shrink-0 gap-2 sm:gap-0">
            <span class="flex items-center gap-1.5 text-[10px] xl:text-[11px] font-black text-[#0056a1] uppercase tracking-widest">
              {{ tituloTabla() }}
            </span>
            <button (click)="exportarExcel()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#1a7a4a] to-[#22a060]
                           text-white rounded-lg text-[11px] font-bold shadow-sm hover:shadow-md transition-all shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Descargar Excel
            </button>
          </div>

          <!-- Tabla -->
          <div class="overflow-auto flex-1 min-h-0 -webkit-overflow-scrolling-touch">
            <table class="w-full text-[13px] xl:text-[14px] 2xl:text-[15px] border-collapse" style="min-width:600px">

              <thead class="sticky top-0 z-10">

              <!-- ════════════════════════════════════════════════════════════
                   FILA 1: GRUPOS CABECERA — condicional por categoría
              ════════════════════════════════════════════════════════════ -->
              <tr>
                <!-- Ubicación Geográfica: colspan dinámico (igual para todas las categorías) -->
                <th class="bg-[#002d5c] text-white px-3 xl:px-5 py-1.5 xl:py-2 text-left font-bold uppercase tracking-wider text-[11px] xl:text-[12px] border-r border-white/20"
                    [attr.colspan]="nivelActivo() === 'Departamental' ? 1 : nivelActivo() === 'Provincial' ? 2 : 3">
                  Ubicación Geográfica
                </th>

                <!-- ── POBLACIÓN ── -->
                @if (activeCategory() === 'poblacion') {
                  <th class="bg-[#002d5c] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px] border-r border-white/20" colspan="3">
                    Población Censada
                  </th>
                  <th class="bg-[#1a4d7a] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px]" colspan="2">
                    Indicadores Demográficos
                  </th>
                }

                <!-- ── VIVIENDA ── -->
                @if (activeCategory() === 'vivienda') {
                  <th class="bg-[#004d3a] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px] border-r border-white/20" colspan="3">
                    Viviendas
                  </th>
                  <th class="bg-[#1a3d2a] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px]" colspan="2">
                    Por N° de Hogares
                  </th>
                }

                <!-- ── HOGAR ── -->
                @if (activeCategory() === 'hogar') {
                  <th class="bg-[#4a2c7a] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px] border-r border-white/20" colspan="2">
                    Hogares
                  </th>
                  <th class="bg-[#2d1b4e] text-white px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px]" colspan="3">
                    Composición del Hogar
                  </th>
                }
              </tr>

              <!-- ════════════════════════════════════════════════════════════
                   FILA 2: SUB-COLUMNAS CON ORDENAMIENTO
              ════════════════════════════════════════════════════════════ -->
              <tr>
                <!-- ── Columnas geográficas (siempre presentes) ── -->
                <th class="bg-[#0056a1] text-white px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                  <button (click)="sortBy('departamento'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                    Departamento
                    <span class="flex flex-col leading-none ml-0.5">
                      <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='departamento'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='departamento'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                      <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='departamento'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='departamento'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                    </span>
                  </button>
                </th>
                @if (nivelActivo() === 'Provincial' || nivelActivo() === 'Distrital') {
                  <th class="bg-[#0056a1] text-white px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <button (click)="sortBy('provincia'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
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
                    <button (click)="sortBy('distrito'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                      Distrito
                      <span class="flex flex-col leading-none ml-0.5">
                        <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='distrito'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='distrito'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                        <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='distrito'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='distrito'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                      </span>
                    </button>
                  </th>
                }

                <!-- ── POBLACIÓN: sub-columnas ── -->
                @if (activeCategory() === 'poblacion') {
                  <th class="bg-[#248cb3] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Cantidad de residentes habituales" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('poblacion'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Población censada
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='poblacion'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='poblacion'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='poblacion'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='poblacion'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#248cb3] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <button (click)="sortBy('hombres'); $event.stopPropagation()" class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                      Población censada hombres
                      <span class="flex flex-col leading-none ml-0.5">
                        <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hombres'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='hombres'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                        <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hombres'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='hombres'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                      </span>
                    </button>
                  </th>
                  <th class="bg-[#248cb3] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <button (click)="sortBy('mujeres'); $event.stopPropagation()" class="flex items-center gap-1 justify-end w-full hover:opacity-80 transition-opacity">
                      Población censada mujeres
                      <span class="flex flex-col leading-none ml-0.5">
                        <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='mujeres'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='mujeres'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                        <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='mujeres'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='mujeres'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                      </span>
                    </button>
                  </th>
                  <th class="bg-[#2e6096] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Número de hombres por cada 100 mujeres" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('razon'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Razón Hombre - mujer
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='razon'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='razon'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='razon'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='razon'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#2e6096] text-white px-3 py-2 text-right font-semibold whitespace-nowrap text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Porcentaje de la población con 60 o más años de edad" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('pct65'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Porcentaje de personas de 60 y más años
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='pct65'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='pct65'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='pct65'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='pct65'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                }

                <!-- ── VIVIENDA: sub-columnas ── -->
                @if (activeCategory() === 'vivienda') {
                  <th class="bg-[#1a8a56] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Total de viviendas registradas en el censo" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('vivCensadas'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Viviendas censadas
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivCensadas'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='vivCensadas'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivCensadas'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='vivCensadas'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#1a8a56] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Viviendas con al menos un hogar residente" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('vivOcupadas'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Viviendas ocupadas
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivOcupadas'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='vivOcupadas'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivOcupadas'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='vivOcupadas'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#1a8a56] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Viviendas sin residentes habituales al momento del censo" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('vivDesocupadas'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Viviendas desocupadas
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivDesocupadas'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='vivDesocupadas'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivDesocupadas'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='vivDesocupadas'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#22603e] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Viviendas ocupadas por un único hogar" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('vivCon1Hogar'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Viviendas con 1 hogar
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivCon1Hogar'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='vivCon1Hogar'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivCon1Hogar'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='vivCon1Hogar'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#22603e] text-white px-3 py-2 text-right font-semibold whitespace-nowrap text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Viviendas ocupadas por dos o más hogares" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('vivCon2masHogares'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Vviviendas Con 2 ó más hogares
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivCon2masHogares'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='vivCon2masHogares'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='vivCon2masHogares'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='vivCon2masHogares'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                }

                <!-- ── HOGAR: sub-columnas ── -->
                @if (activeCategory() === 'hogar') {
                  <th class="bg-[#6b4bc0] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Total de hogares registrados en el censo" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('hogCensados'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Hogares censados
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogCensados'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='hogCensados'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogCensados'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='hogCensados'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#6b4bc0] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Número promedio de personas que conforman cada hogar" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('hogPromPersonas'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Promedio de personas por hogar
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPromPersonas'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='hogPromPersonas'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPromPersonas'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='hogPromPersonas'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#4a2c7a] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Porcentaje de hogares conformados por una sola persona" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('hogPctUnipersonal'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Porcentaje de hogares unipersonales
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPctUnipersonal'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='hogPctUnipersonal'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPctUnipersonal'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='hogPctUnipersonal'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#4a2c7a] text-white px-3 py-2 text-right font-semibold whitespace-nowrap border-r border-white/20 text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Porcentaje de hogares con al menos un niño/a menor de 15 años" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('hogPctConNinos'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Porcentaje de hogares con niños/as
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPctConNinos'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='hogPctConNinos'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPctConNinos'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='hogPctConNinos'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                  <th class="bg-[#4a2c7a] text-white px-3 py-2 text-right font-semibold whitespace-nowrap text-[12px]">
                    <div class="flex items-center gap-1 justify-end w-full">
                      <span matTooltip="Porcentaje de hogares con al menos una persona de 60 o más años" matTooltipClass="tt-blanco" class="inline-flex items-center cursor-default">
                        <svg class="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                      </span>
                      <button (click)="sortBy('hogPctAdultosMayores'); $event.stopPropagation()" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        Porcentaje de hogares con personas adultas mayores
                        <span class="flex flex-col leading-none ml-0.5">
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPctAdultosMayores'&&sortDir()==='asc'" [class.opacity-30]="!(sortCol()==='hogPctAdultosMayores'&&sortDir()==='asc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                          <svg class="w-2.5 h-2.5" [class.opacity-100]="sortCol()==='hogPctAdultosMayores'&&sortDir()==='desc'" [class.opacity-30]="!(sortCol()==='hogPctAdultosMayores'&&sortDir()==='desc')" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10z"/></svg>
                        </span>
                      </button>
                    </div>
                  </th>
                }
              </tr>
              </thead>

              <!-- ── TBODY ── -->
              <tbody>
                @if (filasTabla().length > 0) {
                  <!-- ── FILA PERÚ (totales nacionales) ── -->
                  <tr class="border-b-2 border-[#0056a1]/30 bg-[#0056a1]/8 font-bold sticky-nacional">
                    <td class="px-3 py-2.5 text-gray-900 text-[12px] font-black uppercase tracking-wider border-r border-gray-200"
                        [attr.colspan]="nivelActivo() === 'Departamental' ? 1 : nivelActivo() === 'Provincial' ? 2 : 3">
                      <span class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                        PERÚ
                      </span>
                    </td>

                    <!-- Población totales -->
                    @if (activeCategory() === 'poblacion') {
                      <td class="px-3 py-2.5 text-right font-mono font-black text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().pob) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().hom) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().muj) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtR(totalesNacional().razon) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px]">{{ fmtD(totalesNacional().pct65) }}%</td>
                    }

                    <!-- Vivienda totales -->
                    @if (activeCategory() === 'vivienda') {
                      <td class="px-3 py-2.5 text-right font-mono font-black text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().vivCensadas) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().vivOcupadas) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().vivDesocupadas) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().vivCon1Hogar) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px]">{{ fmtN(totalesNacional().vivCon2masHogares) }}</td>
                    }

                    <!-- Hogar totales -->
                    @if (activeCategory() === 'hogar') {
                      <td class="px-3 py-2.5 text-right font-mono font-black text-gray-900 text-[13px] border-r border-gray-200">{{ fmtN(totalesNacional().hogCensados) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtD(totalesNacional().hogPromPersonas) }}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtD(totalesNacional().hogPctUnipersonal) }}%</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px] border-r border-gray-200">{{ fmtD(totalesNacional().hogPctConNinos) }}%</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-gray-900 text-[13px]">{{ fmtD(totalesNacional().hogPctAdultosMayores) }}%</td>
                    }
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
                  <tr class="border-b border-gray-100 transition-colors hover:bg-[#0056a1]/5"
                      [class.bg-white]="!even" [class.bg-blue-50/20]="even">

                    <!-- Columnas geográficas -->
                    <td class="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">
                      <span class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                        {{ fila.departamento }}
                      </span>
                    </td>
                    @if (nivelActivo() === 'Provincial' || nivelActivo() === 'Distrital') {
                      <td class="px-3 py-2 text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ asProv(fila).provincia }}</td>
                    }
                    @if (nivelActivo() === 'Distrital') {
                      <td class="px-3 py-2 text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ asDist(fila).distrito }}</td>
                    }

                    <!-- ── POBLACIÓN: celdas de datos ── -->
                    @if (activeCategory() === 'poblacion') {
                      <td class="px-3 py-2 text-right font-mono font-bold text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ fmtN(fila.poblacion) }}</td>
                      <td class="px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ fmtN(fila.hombres) }}</td>
                      <td class="px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ fmtN(fila.mujeres) }}</td>
                      <td class="px-3 py-2 text-right font-mono whitespace-nowrap border-r border-gray-100 text-[13px]"
                          [class.text-blue-700]="fila.razon > 100"
                          [class.text-rose-600]="fila.razon < 97"
                          [class.text-gray-700]="fila.razon >= 97 && fila.razon <= 100">
                        {{ fmtR(fila.razon) }}
                      </td>
                      <td class="px-3 py-2 text-right font-mono whitespace-nowrap text-[13px]"
                          [class.text-amber-700]="fila.pct65 >= 9"
                          [class.text-gray-700]="fila.pct65 < 9">
                        {{ fmtD(fila.pct65) }}%
                      </td>
                    }

                    <!-- ── VIVIENDA: celdas de datos ── -->
                    @if (activeCategory() === 'vivienda') {
                      <td class="px-3 py-2 text-right font-mono font-bold text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ fmtN(fila.vivCensadas) }}</td>
                      <td class="px-3 py-2 text-right font-mono text-emerald-700 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ fmtN(fila.vivOcupadas) }}</td>
                      <td class="px-3 py-2 text-right font-mono whitespace-nowrap border-r border-gray-100 text-[13px]"
                          [class.text-rose-600]="fila.vivDesocupadas / fila.vivCensadas > 0.20"
                          [class.text-amber-600]="fila.vivDesocupadas / fila.vivCensadas > 0.12 && fila.vivDesocupadas / fila.vivCensadas <= 0.20"
                          [class.text-gray-700]="fila.vivDesocupadas / fila.vivCensadas <= 0.12">
                        {{ fmtN(fila.vivDesocupadas) }}
                      </td>
                      <td class="px-3 py-2 text-right font-mono text-gray-700 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ fmtN(fila.vivCon1Hogar) }}</td>
                      <td class="px-3 py-2 text-right font-mono text-gray-700 whitespace-nowrap text-[13px]">{{ fmtN(fila.vivCon2masHogares) }}</td>
                    }

                    <!-- ── HOGAR: celdas de datos ── -->
                    @if (activeCategory() === 'hogar') {
                      <td class="px-3 py-2 text-right font-mono font-bold text-gray-900 whitespace-nowrap border-r border-gray-100 text-[13px]">{{ fmtN(fila.hogCensados) }}</td>
                      <td class="px-3 py-2 text-right font-mono whitespace-nowrap border-r border-gray-100 text-[13px]"
                          [class.text-amber-700]="fila.hogPromPersonas >= 4.0"
                          [class.text-blue-700]="fila.hogPromPersonas < 3.2"
                          [class.text-gray-700]="fila.hogPromPersonas >= 3.2 && fila.hogPromPersonas < 4.0">
                        {{ fmtD(fila.hogPromPersonas) }}
                      </td>
                      <td class="px-3 py-2 text-right font-mono whitespace-nowrap border-r border-gray-100 text-[13px]"
                          [class.text-blue-700]="fila.hogPctUnipersonal >= 20"
                          [class.text-gray-700]="fila.hogPctUnipersonal < 20">
                        {{ fmtD(fila.hogPctUnipersonal) }}%
                      </td>
                      <td class="px-3 py-2 text-right font-mono whitespace-nowrap border-r border-gray-100 text-[13px]"
                          [class.text-emerald-700]="fila.hogPctConNinos >= 60"
                          [class.text-gray-700]="fila.hogPctConNinos < 60">
                        {{ fmtD(fila.hogPctConNinos) }}%
                      </td>
                      <td class="px-3 py-2 text-right font-mono whitespace-nowrap text-[13px]"
                          [class.text-amber-700]="fila.hogPctAdultosMayores >= 38"
                          [class.text-gray-700]="fila.hogPctAdultosMayores < 38">
                        {{ fmtD(fila.hogPctAdultosMayores) }}%
                      </td>
                    }

                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Nota metodológica -->
          <div class="flex items-start gap-2 px-3 md:px-4 xl:px-6 py-2.5 xl:py-3 bg-amber-50 border-t border-amber-100 shrink-0">
            <svg class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"/>
            </svg>
            <p class="text-[10px] xl:text-[11px] text-amber-800 leading-relaxed">
              <strong>Nota:</strong> 1/ Comprende los 43 distritos de la provincia de Lima.
              <br>2/ Comprende las provincias de Barranca, Cajatambo, Canta, Cañete, Huaral, Huarochirí,
                  Huaura, Oyón y Yauyos.
              @if (activeCategory() === 'vivienda') {
                <br>Los valores de viviendas desocupadas resaltados en rojo indican una tasa de desocupación superior al 20%.
              }
              @if (activeCategory() === 'hogar') {
                <br>Los promedios de personas por hogar destacados indican valores altos (≥4,0) o bajos (&lt;3,2) respecto al promedio nacional.
              }
            </p>
          </div>

        </div>
      </main>

    </section>
    `,
    styles: [`
        :host { display: block; width: 100%; height: 100vh; overflow: hidden; }

        @keyframes dropdownIn {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .overflow-auto {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        }
        .overflow-auto::-webkit-scrollbar { height: 5px; width: 5px; }
        .overflow-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

        .sticky-nacional {
            background-color: rgba(0, 86, 161, 0.06);
            border-top: 2px solid rgba(0, 86, 161, 0.2);
            border-bottom: 2px solid rgba(0, 86, 161, 0.2);
        }

        @media (min-width: 1280px) {
            table td, table th { padding-left: 1rem; padding-right: 1rem; }
        }
        @media (min-width: 1920px) {
            table { font-size: 15px; }
            table td, table th { padding-top: .625rem; padding-bottom: .625rem; padding-left: 1.25rem; padding-right: 1.25rem; }
        }

        /* ── Tooltip blanco compacto ── */
        ::ng-deep .mat-mdc-tooltip.tt-blanco .mat-mdc-tooltip-surface {
            background-color: #ffffff !important;
            color: #374151 !important;
            font-size: 9px !important;
            font-weight: 500 !important;
            line-height: 1.4 !important;
            padding: 5px 8px !important;
            border-radius: 6px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14) !important;
            border: 1px solid #e5e7eb !important;
            max-width: 200px !important;
            white-space: normal !important;
        }
    `],
})
export class DashboardTerritorialComponent {

    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);

    // ── View tabs ─────────────────────────────────────────────────────────────
    readonly viewTabs = [
        { label: 'Indicadores',             icon: 'chart-bar',         route: '/dashboard-censada' },
        { label: 'Comparativo territorial', icon: 'map',               route: '/dashboard-territorial' },
        { label: 'Evolución',               icon: 'arrow-trending-up', route: '/dashboard-evolucion' },
    ];
    isViewTabActive(route: string): boolean {
        return this.router.url === route || this.router.url.startsWith(route + '/');
    }

    // ── Botonera de secciones ─────────────────────────────────────────────────
    navSections: { id: string; label: string; icon: string; route?: string }[] = [
        { id: 'poblacion_total',       label: 'Indicadores de Población total',                icon: 'chart-bar',     route: '/dashboard'},
        { id: 'poblacion_viviendas',   label: 'Indicadores de población y viviendas censadas', icon: 'home',            route: '/dashboard-censada' },
        { id: 'comunidades_indigenas', label: 'Indicadores de comunidades indígenas',          icon: 'globe-americas', route: '/dashboard-ccomunidades' },
    ];
    activeSection = signal<string>('poblacion_total');
    setActiveSection(id: string): void { this.activeSection.set(id); }

    // ── Category sub-nav ──────────────────────────────────────────────────────
    categoryTabs: { id: string; label: string; icon: string }[] = [
        { id: 'poblacion', label: 'Población', icon: 'users' },
        { id: 'vivienda',  label: 'Vivienda',  icon: 'users' },
        { id: 'hogar',     label: 'Hogar',     icon: 'users' },
    ];
    activeCategory = signal<string>('poblacion');
    setActiveCategory(id: string): void {
        this.activeCategory.set(id);
        // Limpiar ordenamiento al cambiar de categoría
        this.sortCol.set(null);
        this.sortDir.set('asc');
    }

    private router = inject(Router);

    isBtnActive(btn: { id: string; route?: string }): boolean {
        if (btn.route) {
            return this.router.url === btn.route
                || this.router.url.startsWith(btn.route + '/');
        }
        return this.activeSection() === btn.id;
    }

    censosMenu = [
        { label: 'Censo de Derecho',         route: '/censo-derecho' },
        { label: 'Características técnicas',  route: '/aspectos-generales' },
        { label: 'Innovaciones Tecnológicas', route: '/innovaciones' },
        { label: 'Normatividad censal',       route: '/normativa' },
        { label: 'Documentación Técnica',     route: '/documentacion-tecnica' },
    ];

    @HostListener('document:click')
    onDocumentClick() {
        this.censosOpen.set(false);
        this.mobileMenuOpen.set(false);
    }
    toggleCensos(e: Event)     { e.stopPropagation(); this.censosOpen.update(v => !v); }
    toggleMobileMenu(e: Event) { e.stopPropagation(); this.mobileMenuOpen.update(v => !v); }

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

    openDropdown = signal<'nivel' | 'dep' | 'prov' | 'dist' | null>(null);
    toggleDropdown(key: 'nivel' | 'dep' | 'prov' | 'dist'): void {
        this.openDropdown.set(this.openDropdown() === key ? null : key);
    }
    closeAll(): void { this.openDropdown.set(null); this.mobileMenuOpen.set(false); }

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

    resetFiltros(): void {
        this.nivelActivo.set('Departamental');
        this.depsItems.set(allChecked(DEPS_LIST));
        this.provsItems.set(allChecked(PROVS_LIST));
        this.distItems.set(allChecked(DISTS_LIST));
        this.openDropdown.set(null);
        this.sortCol.set(null);
        this.sortDir.set('asc');
    }

    allDepsOn  = computed(() => this.depsItems().every(x => x.checked));
    allProvsOn = computed(() => this.provsItems().every(x => x.checked));
    allDistsOn = computed(() => this.distItems().every(x => x.checked));

    cntDeps  = computed(() => this.depsItems().filter(x => x.checked).length);
    cntProvs = computed(() => this.provsItems().filter(x => x.checked).length);
    cntDists = computed(() => this.distItems().filter(x => x.checked).length);

    isProvActive = computed(() => this.nivelActivo() !== 'Departamental');
    isDistActive = computed(() => this.nivelActivo() === 'Distrital');

    depLabel  = computed(() => this.cntDeps()  === DEPS_LIST.length  ? 'Todas las reg.' : `${this.cntDeps()} reg. sel.`);
    provLabel = computed(() => this.cntProvs() === PROVS_LIST.length ? 'Todas las prov.' : `${this.cntProvs()} prov. sel.`);
    distLabel = computed(() => this.cntDists() === DISTS_LIST.length ? 'Todos los dist.' : `${this.cntDists()} dist. sel.`);

    private selDeps  = computed(() => new Set(this.depsItems().filter(x => x.checked).map(x => x.label)));
    private selProvs = computed(() => new Set(this.provsItems().filter(x => x.checked).map(x => x.label)));
    private selDists = computed(() => new Set(this.distItems().filter(x => x.checked).map(x => x.label)));

    filasTabla = computed<FilaTabla[]>(() => {
        const nivel = this.nivelActivo();
        const deps  = this.selDeps();
        const provs = this.selProvs();
        const dists = this.selDists();
        if (nivel === 'Departamental') return MOCK_DEP.filter(r => deps.has(r.departamento));
        if (nivel === 'Provincial')    return MOCK_PROV.filter(r => deps.has(r.departamento) && provs.has(r.provincia));
        return MOCK_DIST.filter(r => deps.has(r.departamento) && provs.has(r.provincia) && dists.has(r.distrito));
    });

    filasOrdenadas = computed<FilaTabla[]>(() => {
        const rows = [...this.filasTabla()];
        const col  = this.sortCol();
        const dir  = this.sortDir();
        if (!col) return rows;
        return rows.sort((a, b) => {
            const va = (a as any)[col] ?? 0;
            const vb = (b as any)[col] ?? 0;
            if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es');
            return dir === 'asc' ? va - vb : vb - va;
        });
    });

    tituloTabla = computed<string>(() => {
        const nivel    = this.nivelActivo();
        const cat      = this.categoryTabs.find(c => c.id === this.activeCategory())?.label ?? 'Población';
        const geoLabel = nivel === 'Departamental' ? 'DEPARTAMENTO'
                       : nivel === 'Provincial'    ? 'PROVINCIA'
                       : 'DISTRITO';
        return `Comparativo de ${cat} por ${geoLabel}`;
    });

    /** Totales nacionales calculados sobre el dataset completo (no filtrado) */
    totalesNacional = computed(() => {
        const nivel = this.nivelActivo();
        const rows: FilaTabla[] = nivel === 'Departamental' ? MOCK_DEP
                                : nivel === 'Provincial'    ? MOCK_PROV
                                : MOCK_DIST;

        // ── Población ──
        const pob  = rows.reduce((a, r) => a + r.poblacion, 0);
        const hom  = rows.reduce((a, r) => a + r.hombres, 0);
        const muj  = rows.reduce((a, r) => a + r.mujeres, 0);
        const sup  = rows.reduce((a, r) => a + r.superficie, 0);
        const p65  = rows.reduce((a, r) => a + r.p65, 0);
        const razon       = muj ? +(hom / muj * 100).toFixed(1) : 0;
        const dens        = sup ? +(pob / sup).toFixed(1) : 0;
        const pct65       = pob ? +(p65 / pob * 100).toFixed(1) : 0;
        const edadMediana = pob
            ? +(rows.reduce((a, r) => a + r.edadMediana * r.poblacion, 0) / pob).toFixed(1) : 0;
        const edadMedia   = rows.length
            ? +(rows.reduce((a, r) => a + r.edadMediana, 0) / rows.length).toFixed(1) : 0;
        const indiceEnvejecimiento = pob
            ? +(rows.reduce((a, r) => a + r.indiceEnvejecimiento * r.poblacion, 0) / pob).toFixed(1) : 0;

        // ── Vivienda ──
        const vivCensadas       = rows.reduce((a, r) => a + r.vivCensadas, 0);
        const vivOcupadas       = rows.reduce((a, r) => a + r.vivOcupadas, 0);
        const vivDesocupadas    = rows.reduce((a, r) => a + r.vivDesocupadas, 0);
        const vivCon1Hogar      = rows.reduce((a, r) => a + r.vivCon1Hogar, 0);
        const vivCon2masHogares = rows.reduce((a, r) => a + r.vivCon2masHogares, 0);

        // ── Hogar ──
        const hogCensados = rows.reduce((a, r) => a + r.hogCensados, 0);
        // Promedio personas = población total / hogares totales
        const hogPromPersonas = hogCensados
            ? +(pob / hogCensados).toFixed(2) : 0;
        // Ponderados por hogares censados
        const hogPctUnipersonal    = hogCensados
            ? +(rows.reduce((a, r) => a + r.hogPctUnipersonal    * r.hogCensados, 0) / hogCensados).toFixed(1) : 0;
        const hogPctConNinos       = hogCensados
            ? +(rows.reduce((a, r) => a + r.hogPctConNinos        * r.hogCensados, 0) / hogCensados).toFixed(1) : 0;
        const hogPctAdultosMayores = hogCensados
            ? +(rows.reduce((a, r) => a + r.hogPctAdultosMayores  * r.hogCensados, 0) / hogCensados).toFixed(1) : 0;

        return {
            pob, hom, muj, sup, p65, razon, dens, pct65, edadMediana, edadMedia, indiceEnvejecimiento,
            vivCensadas, vivOcupadas, vivDesocupadas, vivCon1Hogar, vivCon2masHogares,
            hogCensados, hogPromPersonas, hogPctUnipersonal, hogPctConNinos, hogPctAdultosMayores,
        };
    });

    calcEdadMedia(fila: FilaTabla): number { return fila.edadMediana; }
    asProv(f: FilaTabla): FilaProv { return f as FilaProv; }
    asDist(f: FilaTabla): FilaDist { return f as FilaDist; }

    fmtN(n: number): string   { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
    fmtD(n: number): string   { return n.toFixed(1).replace('.', ','); }
    fmtPct(n: number): string { return n.toFixed(1).replace('.', ',') + '%'; }
    fmtR(n: number): string   { return n.toFixed(1).replace('.', ','); }

    exportarExcel(): void {
        const nivel = this.nivelActivo();
        const rows  = this.filasOrdenadas();
        const t     = this.totalesNacional();
        const cat   = this.activeCategory();
        const catLabel = this.categoryTabs.find(c => c.id === cat)?.label ?? 'Población';

        // ── Columnas de ubicación geográfica ──
        const geoHeaders: string[] = ['Departamento'];
        if (nivel === 'Provincial' || nivel === 'Distrital') geoHeaders.push('Provincia');
        if (nivel === 'Distrital') geoHeaders.push('Distrito');
        const gc = geoHeaders.length;

        // ── Cabeceras de grupo y sub-columnas por categoría ──
        let groupRow1Labels: string[]  = [];
        let groupRow1Spans:  number[]  = [];
        let subHeaders:      string[]  = [];
        let peruCells:       (string | number)[] = [];

        if (cat === 'poblacion') {
            groupRow1Labels = ['Población Censada', '', '', 'Indicadores Demográficos', ''];
            groupRow1Spans  = [3, 2];
            subHeaders      = ['Población ', 'Hombres', 'Mujeres', 'Razón H/M', '% 60 y más'];
            peruCells       = [t.pob, t.hom, t.muj, t.razon, t.pct65];
        } else if (cat === 'vivienda') {
            groupRow1Labels = ['Viviendas', '', '', 'Por N° de Hogares', ''];
            groupRow1Spans  = [3, 2];
            subHeaders      = ['V. Censadas', 'V. Ocupadas', 'V. Desocupadas', 'Con 1 hogar', 'Con 2+ hogares'];
            peruCells       = [t.vivCensadas, t.vivOcupadas, t.vivDesocupadas, t.vivCon1Hogar, t.vivCon2masHogares];
        } else {
            groupRow1Labels = ['Hogares', '', 'Composición del Hogar', '', ''];
            groupRow1Spans  = [2, 3];
            subHeaders      = ['H. Censados', 'Prom. personas', '% Unipersonales', '% Con niños/as', '% Adultos mayores'];
            peruCells       = [t.hogCensados, t.hogPromPersonas, t.hogPctUnipersonal, t.hogPctConNinos, t.hogPctAdultosMayores];
        }

        // ── Fila 1: cabeceras de grupo ──
        const row1: string[] = [];
        for (let i = 0; i < gc; i++) row1.push(i === 0 ? 'Ubicación Geográfica' : '');
        groupRow1Labels.forEach(l => row1.push(l));

        // ── Fila 2: sub-columnas ──
        const row2: string[] = [...geoHeaders, ...subHeaders];

        // ── Fila PERÚ ──
        const peruRow: (string | number)[] = ['PERÚ'];
        for (let i = 1; i < gc; i++) peruRow.push('');
        peruCells.forEach(c => peruRow.push(c));

        // ── Filas de datos ──
        const dataRows = rows.map(fila => {
            const cols: (string | number)[] = [fila.departamento];
            if (nivel === 'Provincial' || nivel === 'Distrital') cols.push((fila as FilaProv).provincia);
            if (nivel === 'Distrital') cols.push((fila as FilaDist).distrito);

            if (cat === 'poblacion') {
                cols.push(fila.poblacion, fila.hombres, fila.mujeres, fila.razon, fila.pct65);
            } else if (cat === 'vivienda') {
                cols.push(fila.vivCensadas, fila.vivOcupadas, fila.vivDesocupadas, fila.vivCon1Hogar, fila.vivCon2masHogares);
            } else {
                cols.push(fila.hogCensados, fila.hogPromPersonas, fila.hogPctUnipersonal, fila.hogPctConNinos, fila.hogPctAdultosMayores);
            }
            return cols;
        });

        // ── Construir hoja ──
        const aoa = [row1, row2, peruRow, ...dataRows];
        const ws  = XLSX.utils.aoa_to_sheet(aoa);

        // Anchos de columna
        const colWidths: { wch: number }[] = [];
        for (let i = 0; i < gc; i++) colWidths.push({ wch: i === 0 ? 32 : 22 });
        subHeaders.forEach(() => colWidths.push({ wch: 16 }));
        ws['!cols'] = colWidths;

        // Fusiones
        const merges: XLSX.Range[] = [];
        if (gc > 1) merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: gc - 1 } });
        let colOffset = gc;
        groupRow1Spans.forEach(span => {
            merges.push({ s: { r: 0, c: colOffset }, e: { r: 0, c: colOffset + span - 1 } });
            colOffset += span;
        });
        for (let i = 0; i < gc; i++) {
            merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } });
        }
        ws['!merges'] = merges;

        // ── Workbook y descarga ──
        const wb   = XLSX.utils.book_new();
        const hoja = `Comp. ${catLabel} ${nivel}`;
        XLSX.utils.book_append_sheet(wb, ws, hoja);
        XLSX.writeFile(wb, `comparativo-${catLabel.toLowerCase()}-${nivel.toLowerCase()}-cpv2025.xlsx`);
    }
}