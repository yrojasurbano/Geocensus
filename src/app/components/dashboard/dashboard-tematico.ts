// RUTA: src/app/components/tematico/dashboard-tematico.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component, ChangeDetectionStrategy, OnInit,
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
import { BarChart, PieChart, LineChart, RadarChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, RadarComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, PieChart, LineChart, RadarChart, TooltipComponent, LegendComponent, GridComponent, RadarComponent, CanvasRenderer]);

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES Y TIPOS
// ══════════════════════════════════════════════════════════════════════════════

interface GeoOption { code: string; name: string; sortKey?: string; }
export type NivelGeoType    = 'Departamental' | 'Provincial' | 'Distrital';
export type NivelFiltroType = 'politico_administrativo' | 'region_natural';
export type AreaFiltroType  = 'total' | 'urbano' | 'rural';

const REGIONES_NATURALES: { key: string; label: string; color: string; ccddList: string[] }[] = [
    { key: 'costa',  label: 'Costa',  color: '#0056a1', ccddList: ['07','11','13','14','15','20','24'] },
    { key: 'sierra', label: 'Sierra', color: '#038dd3', ccddList: ['02','03','04','05','06','08','09','10','12','18','19','21','23'] },
    { key: 'selva',  label: 'Selva',  color: '#33b3a9', ccddList: ['01','16','17','22','25'] },
];

interface ThematicSeriesDef {
    readonly name:  string;
    readonly data:  readonly number[];
    readonly color: string;
}

interface ThematicIndicatorDef {
    readonly id:          string;
    readonly title:       string;
    readonly icon:        string;
    readonly type:        'kpi' | 'kpi_list' | 'bar' | 'hbar' | 'column' | 'pie' | 'stacked' | 'grouped_bar' | 'grouped_hbar' | 'grouped_column';
    readonly categories?: readonly string[];
    readonly data?:       readonly number[];
    readonly series?:     readonly ThematicSeriesDef[];
    readonly note?:       string;
    readonly kpiValue?:   string;
    readonly showValues?: boolean;
    readonly span?:       1 | 2 | 3 | 4;
    readonly minHeight?:  number;
}

interface ThematicSectionDef {
    readonly id:         string;
    readonly label:      string;
    readonly icon:       string;
    readonly gridClass:  string;
    readonly indicators: readonly ThematicIndicatorDef[];
}

interface ThematicGroupDef {
    readonly id:       string;
    readonly label:    string;
    readonly icon:     string;
    readonly color:    string;
    readonly sections: readonly ThematicSectionDef[];
}

interface IdentidadColumnGroup {
    readonly label:        string;
    readonly color:        string;
    readonly indicatorIds: readonly string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// SISTEMA DE COLORES — Paleta exclusiva: #0056a1 · #038dd3 · #33b3a9
// ══════════════════════════════════════════════════════════════════════════════

const CLR = {
    blue:   '#0056a1',
    teal:   '#33b3a9',
    purple: '#8282fb',
    sky:    '#038dd3',
    amber:  '#f59e0b',
} as const;

const PIE_COLORS = [
    '#0056a1', '#33b3a9', '#038dd3', '#8282fb',
    '#004a8a', '#27a09c', '#0275af', '#6b6be8',
    '#005fa8', '#3bc4ba',
] as const;

const C6 = ['#0056a1','#038dd3','#33b3a9','#8282fb','#004a8a','#27a09c'] as const;

// ── Constantes de dominio ─────────────────────────────────────────────────────
const DISABILITY_TYPES = [
    'Ver, incluso cuando usa lentes',
    'Oír, incluso cuando usa un audífono para sordera',
    'Hablar o comunicarse, incluso si utiliza la lengua de señas u otra',
    'Caminar o subir y bajar escaleras',
    'Usar brazos y manos para comer, vestirse, bañarse u otras actividades',
    'Recordar y/o concentrarse',
    'Relacionarse con los demás a través de sus pensamientos, sentimientos, emociones o conductas',
] as const;

const ETHNIC_GROUPS = [
    'Quechua', 'Aimara',
    'De un pueblo indígena u originario de la amazonía',
    'De otro pueblo indígena u originario',
    'Negro, moreno, zambo, mulato, pueblo afroperuano o afrodescendiente',
    'Nikkei', 'Tusan', 'Blanco', 'Mestizo', 'Otro',
] as const;

const ESTADO_CIVIL_CATS = ['Conviviente','Separado/a o Exconviviente','Casado/a','Viudo/a','Divorciado/a','Soltero/a'] as const;
const SEGURO_TYPES = ['Seguro integral de salud (SIS)','EsSalud','Seguro de fuerzas armadas','Seguro Privado','Otro seguro','Ninguno'] as const;
const DOC_TYPES = ['Solo tiene partida de nacimiento','Solo tiene carné de extranjería','Solo tiene permiso temporal de permanencia','No tiene documento alguno'] as const;

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE GRUPOS TEMÁTICOS
// ══════════════════════════════════════════════════════════════════════════════

// ── Fecundidad: datos mock ────────────────────────────────────────────────────
const FECU_AGE = ['15-19 años','20-24 años','25-29 años','30-34 años','35-39 años','40-44 años','45-49 años'] as const;
const FECU_CON_HIJOS  = [18.4, 48.2, 68.4, 78.6, 84.2, 87.3, 88.4] as const;
const FECU_SIN_HIJOS  = [81.6, 51.8, 31.6, 21.4, 15.8, 12.7, 11.6] as const;
const FECU_PROM_EDAD  = [0.3,  1.1,  1.8,  2.4,  2.9,  3.2,  3.5 ] as const;
const FECU_EC_CATS    = ['Viuda','Casada','Separada','Divorciada','Conviviente','Soltera'] as const;
const FECU_EC_PROM    = [1.2, 2.6, 2.4, 2.8, 3.1, 4.2] as const;

// ── Migración inmigrante extranjera: datos mock ───────────────────────
const MIGR_GRUPOS_EDAD      = ['0 a 14 años', '15 a 59 años', '60 y más años'] as const;
const MIGR_GRUPOS_EDAD_DATA = [287_293, 2_134_000, 426_000] as const;

const MIGR_PIRAMIDE_GRUPOS = [
    '0 a 4 años',  '5 a 9 años',  '10 a 14 años', '15 a 19 años', '20 a 24 años',
    '25 a 29 años','30 a 34 años','35 a 39 años',  '40 a 44 años', '45 a 49 años',
    '50 a 54 años','55 a 59 años','60 a 64 años',  '65 a 69 años', '70 a 74 años',
    '75 a 79 años','80 a 84 años','85 y más años',
] as const;
const MIGR_PIRAMIDE_HOMBRE = [
    45_293,  52_892,  48_293,  87_293, 234_892, 298_293, 267_892, 198_293,
    142_892, 112_293,  87_892,  62_293,  47_892,  32_293,  22_892,  14_293, 8_892, 4_293,
] as const;
const MIGR_PIRAMIDE_MUJER = [
    43_892,  50_293,  46_892,  92_892, 247_293, 312_892, 278_293, 207_892,
    152_293, 122_892,  92_293,  67_892,  52_293,  37_892,  27_293,  17_892, 11_293, 5_892,
] as const;

const MIGR_SEGURO      = ['Con algún seguro de salud', 'No tiene ningún seguro'] as const;
const MIGR_SEGURO_DATA = [1_234_892, 1_612_401] as const;

const MIGR_NIVEL_EDU      = ['Sin nivel / Inicial', 'Primaria', 'Secundaria', 'Superior no universitaria', 'Superior universitaria'] as const;
const MIGR_NIVEL_EDU_DATA = [127_293, 234_892, 892_293, 547_892, 1_044_923] as const;

const MIGR_PAISES      = ['Venezuela', 'Argentina', 'Chile', 'Colombia', 'Bolivia', 'Estados Unidos'] as const;
const MIGR_PAISES_DATA = [1_234_892, 347_892, 289_293, 234_892, 187_892, 127_892] as const;

// ── Identidad y Protección Social: datos mock ─────────────────────────
const ESTCIV_COL_CATS  = ['Soltero/a', 'Conviviente', 'Casado/a', 'Viudo/a', 'Separado/a'] as const;
const ESTCIV_COL_DATA  = [12_847_293, 4_234_892, 8_234_847, 1_847_293, 892_293] as const;

const ESTCIV_PIR_CATS   = ['Divorciado/a', 'Viudo/a', 'Separado/a', 'Casado/a', 'Conviviente', 'Soltero/a'] as const;
const ESTCIV_PIR_HOMBRE = [110_000, 700_000, 380_000, 4_100_000, 2_100_000, 6_400_000] as const;
const ESTCIV_PIR_MUJER  = [124_892, 1_147_293, 512_293, 4_134_847, 2_134_892, 6_447_293] as const;

const ESTCIV_EDAD_CATS   = ['12 a 17 años', '18 a 29 años', '30 a 44 años', '45 a 59 años', '60 y más años'] as const;
const ESTCIV_ACTUALMENTE = [12_000, 1_420_000, 5_340_000, 3_120_000, 1_940_000] as const;
const ESTCIV_ANTERIORM   = [500, 200_000, 620_000, 950_000, 1_450_000] as const;
const ESTCIV_NUNCA       = [2_980_000, 4_180_000, 2_140_000, 630_000, 410_000] as const;

const DNI_EDAD_CATS  = ['0 a 17 años', '18 a 29 años', '30 a 44 años', '45 a 59 años', '60 y más años'] as const;
const DNI_EDAD_DATA  = [6_234_892, 7_847_293, 9_234_892, 6_847_293, 3_835_630] as const;

const DOC_INMIGR_CATS = ['Tiene DNI', 'Solo tiene carné de extranjería', 'Solo tiene permiso temporal de permanencia', 'Solo tiene partida de nacimiento', 'No tiene documento alguno'] as const;
const DOC_INMIGR_DATA = [892_293, 1_234_892, 347_892, 127_892, 244_314] as const;

const SEG_EDAD_CATS  = ['0 a 17 años', '18 a 29 años', '30 a 44 años', '45 a 59 años', '60 y más años'] as const;
const SEG_EDAD_DATA  = [8_534_892, 6_847_293, 7_234_892, 4_847_293, 1_816_522] as const;

const SEG_TIPO_CATS  = ['Únicamente SIS', 'Únicamente EsSalud', 'Únicamente otro seguro de salud', 'Con 2 o más seguros'] as const;
const SEG_TIPO_DATA  = [18_234_892, 7_847_293, 1_192_293, 2_006_414] as const;

// ── Educación: datos mock ──────────────────────────────────────────────
const EDU_NIVEL_CATS = [
    'Sin nivel', 'Educación inicial', 'Primaria', 'Secundaria', 'Básica especial',
    'Superior no universitaria incompleta', 'Superior no universitaria completa',
    'Superior universitaria incompleta', 'Superior universitaria completa',
    'Maestría / Doctorado',
] as const;
const EDU_NIVEL_DATA = [
    1_234_892, 187_293, 4_847_293, 7_234_892, 47_293,
    892_293, 1_234_892, 687_293, 2_234_892, 347_892,
] as const;

const EDU_NIV_SEX_CATS   = ['Sin nivel / Educación inicial', 'Primaria / Básica especial', 'Secundaria', 'Superior no universitaria', 'Superior universitaria'] as const;
const EDU_NIV_SEX_HOMBRE = [712_293, 2_734_892, 3_817_293, 1_012_293, 1_487_293] as const;
const EDU_NIV_SEX_MUJER  = [709_892, 2_347_293, 3_417_892, 1_112_892, 1_794_892] as const;

const EDU_ALFA_EDAD_CATS = ['15 a 17 años', '18 a 29 años', '30 a 44 años', '45 a 59 años', '60 y más años'] as const;
const EDU_ALFA_EDAD_DATA = [99.1, 99.4, 98.7, 94.2, 81.4] as const;

const EDU_TIC_EDAD_CATS  = ['15 a 17 años', '18 a 29 años', '30 a 44 años', '45 a 59 años', '60 y más años'] as const;
const EDU_TIC_EDAD_DATA  = [89.4, 92.8, 78.4, 58.7, 32.1] as const;

// ── Discapacidad: datos mock ───────────────────────────────────────────
const DISC_PIR_CATS = [
    '5 – 9 años',   '10 – 14 años', '15 – 19 años', '20 – 24 años',
    '25 – 29 años', '30 – 34 años', '35 – 39 años',  '40 – 44 años', '45 – 49 años',
    '50 – 54 años', '55 – 59 años', '60 – 64 años',  '65 – 69 años', '70 – 74 años',
    '75 – 79 años', '80 – 84 años', '85 y más años',
] as const;
const DISC_PIR_HOMBRE = [12_892, 15_293, 18_892, 22_293, 24_892, 27_293, 29_892, 34_293, 38_892, 45_293, 52_892, 67_293, 72_892, 78_293, 62_892, 45_293, 52_892] as const;
const DISC_PIR_MUJER  = [11_293, 14_892, 17_293, 21_892, 23_293, 26_892, 29_293, 33_892, 38_293, 44_892, 51_293, 65_892, 70_293, 76_892, 65_293, 52_892, 67_293] as const;

const DISC_SEGURO_CATS = ['Seguro Integral de Salud (SIS)', 'EsSalud', 'Seguro de Fuerzas Armadas', 'Seguro privado de salud', 'Otro seguro', 'Ninguno'] as const;
const DISC_SEGURO_DATA = [892_293, 347_892, 12_293, 87_892, 24_293, 534_892] as const;

const DISC_EDU_CATS = ['Sin nivel', 'Educación inicial', 'Primaria', 'Secundaria', 'Básica especial', 'Superior no universitaria', 'Superior universitaria', 'Maestría / Doctorado'] as const;
const DISC_EDU_DATA = [234_892, 12_293, 387_892, 412_293, 24_892, 87_293, 124_892, 18_293] as const;

const DISC_ESFERAS_CATS = [
    'Discapacidad para ver', 'Discapacidad para caminar', 'Discapacidad para oír',
    'Discapacidad para relacionarse con los demás', 'Discapacidad para concentrarse',
    'Discapacidad para comunicarse', 'Discapacidad para el cuidado personal',
] as const;
const DISC_ESFERAS_HOMBRE = [268_293, 234_892, 185_293, 112_892, 138_293,  94_892, 138_293] as const;
const DISC_ESFERAS_MUJER  = [355_599, 312_401, 204_599, 121_401, 149_599, 103_401, 174_599] as const;
const DISC_ESFERAS_5_17   = [ 45_293,  28_892,  38_293,  48_892,  62_892,  42_293,  22_892] as const;
const DISC_ESFERAS_18_59  = [198_892, 168_293, 112_892, 124_293, 162_293,  98_892,  98_293] as const;
const DISC_ESFERAS_60MAS  = [379_707, 350_108, 238_707,  61_108,  62_707,  57_108, 191_707] as const;

// ── Etnicidad: datos mock ──────────────────────────────────────────────
const ETNIC_AUTO_CATS = [
    'Mestizo',
    'Blanco',
    'Negro, moreno, zambo, mulato, del pueblo, afroperuano o afrodescendiente',
    'Quechua',
    'Aimara',
    'De un pueblo indígena u originario de la Amazonía',
    'Otro',
    'De otro pueblo indígena u originario',
    'Tusan',
    'Nikkei',
] as const;
const ETNIC_AUTO_DATA  = [18_847_293, 4_234_892, 1_847_293, 5_234_892, 892_293, 347_892, 2_834_293, 234_892, 234_892, 127_892] as const;

const ETNIC_IDIOMA_CATS = [
    'Castellano',
    'Quechua',
    'Aimara',
    'Shipibo-Konibo',
    'Awajún / Aguaruna',
    'Lengua de señas peruana',
    'Otro idioma o lengua extranjera',
    'No escucha / No habla',
    'Otros idiomas o lenguas indígenas u originarias',
    'Asháninka',
] as const;
const ETNIC_IDIOMA_DATA = [26_234_892, 5_847_293, 892_293, 234_892, 187_892, 47_892, 127_892, 32_892, 347_892, 127_892] as const;

const ETNIC_EDAD_CATS     = ['Menores de 18 años', '18 a 29 años', '30 a 44 años', '45 a 59 años', '60 y más años'] as const;
const ETNIC_IND_EDAD_DATA = [2_234_892, 1_847_293, 2_134_892, 1_234_892, 892_293] as const;
const ETNIC_AFR_EDAD_DATA = [87_293, 47_892, 67_293, 47_892, 27_892] as const;

const ETNIC_EDU_CATS = [
    'Sin nivel', 'Educación inicial', 'Primaria', 'Secundaria', 'Básica especial',
    'Superior no universitaria incompleta', 'Superior no universitaria',
    'Superior universitaria', 'Maestría / Doctorado',
] as const;
const ETNIC_IND_EDU_DATA = [734_892, 234_293, 2_847_293, 2_134_892, 47_293, 287_293, 487_293, 634_892, 87_293] as const;
const ETNIC_AFR_EDU_DATA = [47_293, 12_293, 87_892, 67_293, 3_892, 17_293, 21_000, 15_000, 3_292] as const;

const ETNIC_ESTCIV_CATS     = ['Conviviente', 'Casado/a', 'Anteriormente unido/a', 'Soltero/a'] as const;
const ETNIC_IND_ESTCIV_DATA = [1_234_892, 2_293_847, 847_293, 2_518_847] as const;
const ETNIC_AFR_ESTCIV_DATA = [47_293, 87_293, 27_892, 95_293] as const;

// ── PET (Población en Edad de Trabajar): datos mock ─────────────────────
const PET_EDAD_CATS   = ['15 a 17 años', '18 a 29 años', '30 a 44 años', '45 a 59 años', '60 y más años'] as const;
const PET_EDAD_DATA   = [2_134_892, 6_847_293, 8_234_892, 6_234_892, 3_395_324] as const;
const PET_ESTCIV_CATS = ['Soltero/a', 'Divorciado/a', 'Viudo/a', 'Casado/a', 'Separado/a', 'Conviviente'] as const;
const PET_ESTCIV_DATA = [8_234_892, 892_293, 1_234_892, 9_847_293, 2_134_892, 4_503_031] as const;
const PET_EDU_CATS    = ['Sin nivel', 'Educación inicial', 'Primaria', 'Secundaria', 'Básica especial', 'Superior no universitaria', 'Superior universitaria', 'Maestría / Doctorado'] as const;
const PET_EDU_DATA    = [1_234_892, 47_293, 4_847_293, 8_234_892, 124_892, 2_347_293, 6_234_892, 3_776_136] as const;

// ── Vivienda (datos estáticos mock) ──────────────────────────────────────────
const VIV_HOGARES_CATS  = ['Con 1 hogar', 'Con 2 hogares', 'Con 3 hogares', 'Con 4 y más hogares'] as const;
const VIV_HOGARES_DATA  = [15_892_293, 1_847_293, 347_892, 147_414] as const;
const VIV_HABITAC_CATS  = ['1 habitación', '2 habitaciones', '3 habitaciones', '4 habitaciones', '5 habitaciones', '6 y más habitaciones'] as const;
const VIV_HABITAC_DATA  = [4_234_892, 5_847_293, 3_892_293, 2_234_892, 1_192_293, 833_229] as const;
const VIV_CALIDAD_CATS  = ['Vivienda adecuada', 'Vivienda básica', 'Vivienda inadecuada'] as const;
const VIV_CALIDAD_DATA  = [11_234_892, 4_847_293, 2_152_707] as const;
const VIV_PAREDES_CATS  = ['Ladrillo o bloque de cemento', 'Adobe', 'Madera', 'Tapia', 'Triplay / calamina / estera', 'Otro material 1/'] as const;
const VIV_PAREDES_DATA  = [10_234_892, 4_847_293, 892_293, 892_293, 734_892, 633_229] as const;
const VIV_TECHOS_CATS   = ['Concreto armado', 'Madera', 'Tejas', 'Planchas de calamina', 'Fibra de cemento o similares', 'Otro material 1/'] as const;
const VIV_TECHOS_DATA   = [8_234_892, 1_892_293, 1_192_293, 4_847_293, 892_293, 1_175_828] as const;
const VIV_PISOS_CATS    = ['Parquet o madera pulida', 'Láminas asfálticas, vinílicos o similares', 'Losetas, terrazos, cerámicos o similares', 'Madera (pona, tornillo, etc.)', 'Cemento', 'Tierra', 'Otro material 1/'] as const;
const VIV_PISOS_DATA    = [892_293, 347_892, 3_892_293, 892_293, 8_234_892, 3_192_293, 782_936] as const;
const VIV_AGUA_CATS     = ['Red pública', 'Pilón o pileta de uso público', 'Camión cisterna u otro similar', 'Pozo', 'Otro 1/'] as const;
const VIV_AGUA_DATA     = [13_234_892, 892_293, 347_892, 1_892_293, 1_867_522] as const;
const VIV_EXCRET_CATS   = ['Red pública de desagüe dentro de la vivienda', 'Red pública de desagüe dentro del lote o terreno, fuera de la vivienda', 'Letrina (con tratamiento)', 'Pozo séptico, tanque séptico o biodigestor', 'Otro 1/'] as const;
const VIV_EXCRET_DATA   = [10_234_892, 2_192_293, 892_293, 1_892_293, 3_023_121] as const;
const VIV_ENERGIA_CATS  = ['Red pública', 'Panel solar / batería', 'Energía eólica', 'Otro', 'No tiene energía eléctrica'] as const;
const VIV_ENERGIA_DATA  = [14_234_892, 892_293, 127_892, 347_892, 2_631_923] as const;

// ── Hogar (datos estáticos mock) ──────────────────────────────────────────────
const HOG_TOTAL             = 9_861_890;
const HOG_SEXO_CATS         = ['Hombre', 'Mujer'] as const;
const HOG_SEXO_DATA         = [5_847_293, 4_014_597] as const;
const HOG_TENENCIA_CATS     = ['Alquilada', 'Propia, sin título de propiedad', 'Propia, con título de propiedad', 'Cedida por centro de trabajo', 'Cedida por otro hogar o institución', 'Otra forma'] as const;
const HOG_TENENCIA_DATA     = [4_847_293, 1_192_293, 8_234_892, 192_293, 347_892, 234_892] as const;
const HOG_ENERGIA_CATS      = ['Gas balón (GLP)', 'Leña', 'Gas natural (sistema de tuberías)', 'Electricidad', 'Otro', 'No cocinan'] as const;
const HOG_ENERGIA_DATA      = [7_234_892, 1_234_892, 892_293, 347_892, 127_892, 192_293] as const;
const HOG_RESIDUOS_CATS     = ['Por recolector municipal', 'Por recolector informal', 'Se quema', 'Se entierra', 'Otra 1/'] as const;
const HOG_RESIDUOS_DATA     = [7_234_892, 892_293, 892_293, 192_293, 634_812] as const;
const HOG_EMIGR_TOTAL       = 1_234_892;
const HOG_EMIGR_CATS        = ['De 1 a 2 miembros', 'De 3 a 4 miembros', 'De 5 a más miembros'] as const;
const HOG_EMIGR_DATA        = [892_293, 234_892, 107_707] as const;
const HOG_BTICS_TOTAL       = 8_234_892;
const HOG_STICS_TOTAL       = 6_847_293;
const HOG_ARTEFACTOS_CATS   = ['Radio', 'Equipo de sonido', 'Televisor', 'Cocina a gas', 'Horno microondas', 'Refrigeradora o congeladora', 'Lavadora de ropa'] as const;
const HOG_ARTEFACTOS_DATA   = [3_234_892, 4_192_293, 9_234_892, 8_547_293, 3_234_892, 7_847_293, 4_192_293] as const;
const HOG_TRANSPORTE_CATS   = ['Auto/camioneta', 'Motocicleta', 'Bicicleta como medio de transporte', 'Lancha, bote con motor, peque peque o canoa'] as const;
const HOG_TRANSPORTE_DATA   = [3_234_892, 2_847_293, 1_234_892, 347_892] as const;

const THEMATIC_GROUPS: readonly ThematicGroupDef[] = [
    {
        id: 'poblacion', label: 'Población', icon: 'users', color: CLR.blue,
        sections: [
            // ── FECUNDIDAD ─────────────────────────────────────────────────
            {
                id: 'fecundidad', label: 'Fecundidad', icon: 'heart',
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
                indicators: [
                    { id: 'mef_censadas',     title: 'Mujeres en edad fértil censadas',                                              icon: 'users',                type: 'kpi', kpiValue: '8 234 561' },
                    { id: 'prom_hijos_1549',  title: 'Promedio de hijos/as nacidos/as vivos para mujeres entre 15 y 49 años',         icon: 'calculator',           type: 'kpi', kpiValue: '2.3' },
                    { id: 'pct_con_hijos',    title: 'Porcentaje de mujeres entre 15 y 49 años con hijos/as',                         icon: 'chart-bar',            type: 'kpi', kpiValue: '68.4%' },
                    { id: 'pct_sin_hijos',    title: 'Porcentaje de mujeres entre 15 y 49 años sin hijos/as',                         icon: 'chart-bar',            type: 'kpi', kpiValue: '31.6%' },
                    { id: 'hijos_fallecidos', title: 'Hijos fallecidos de las mujeres de 12 y más años de edad (Mortalidad)',          icon: 'exclamation-triangle', type: 'kpi', kpiValue: '847 293' },
                ],
            },
            // ── MIGRACIÓN ──────────────────────────────────────────────────
            {
                id: 'migracion', label: 'Inmigración extranjera', icon: 'arrow-right-circle',
                gridClass: 'grid grid-cols-1 sm:grid-cols-2',
                indicators: [
                    {
                        id: 'migracion_vida', icon: 'map-pin', type: 'bar',
                        title: 'Población censada según lugar de nacimiento (Migración de toda la vida)',
                        categories: ['Aqui, en este distrito', 'En otro distrito', 'En otro país'],
                        data: [18_234_892, 14_847_293, 2_847_293],
                    },
                    {
                        id: 'migracion_reciente', icon: 'clock', type: 'bar',
                        title: 'Población censada según lugar de residencia cinco años antes del censo (Migración reciente)',
                        categories: ['Aqui, en este distrito', 'En otro distrito', 'En otro país'],
                        data: [19_847_293, 13_234_892, 1_932_847],
                    },
                    {
                        id: 'inmigrante_intl', icon: 'globe-alt', type: 'kpi', kpiValue: '2 847 293',
                        title: 'Población censada inmigrante internacional',
                    },
                    {
                        id: 'emigracion_intl', icon: 'arrow-up-right', type: 'kpi', kpiValue: '1 234 892',
                        title: 'Emigración internacional',
                        note: 'Nota metodológica: Esta variable fue recogida a nivel de hogar, por lo que refleja la declaración del jefe/a de hogar respecto a los miembros que emigraron al exterior en los últimos 5 años.',
                    },
                ],
            },
            // ── IDENTIDAD Y PROTECCIÓN SOCIAL ─────────────────────────────
            {
                id: 'identidad_proteccion', label: 'Estado civil, Identidad y seguro de salud', icon: 'shield-check',
                gridClass: 'grid grid-cols-1 lg:grid-cols-3',
                indicators: [
                    // Col 1 — Estado civil
                    { id: 'estado_civil', title: 'Población censada de 12 y más años según estado civil o conyugal', icon: 'user-group', type: 'hbar',
                        categories: [...ESTADO_CIVIL_CATS], data: [4_234_892,892_293,8_234_847,1_847_293,234_892,12_847_293] },
                    { id: 'estado_civil_sexo', title: 'Estado civil o conyugal por sexo', icon: 'users', type: 'grouped_hbar',
                        categories: [...ESTADO_CIVIL_CATS],
                        series: [
                            { name: 'Hombre', color: '#038dd3', data: [2_100_000,380_000,4_100_000,700_000,110_000,6_400_000] },
                            { name: 'Mujer',  color: '#33b3a9', data: [2_134_892,512_293,4_134_847,1_147_293,124_892,6_447_293] },
                        ] },
                    // Col 2 — Documentos de identidad
                    { id: 'tenencia_dni', title: 'Población censada según tenencia de documento de identidad', icon: 'identification', type: 'pie', showValues: true,
                        categories: ['Sí tiene DNI',...DOC_TYPES],
                        data: [34_000_000,1_200_000,500_000,200_000,134_293] },
                    { id: 'dni_sexo', title: 'Población sin DNI según tipo de documento por sexo', icon: 'users', type: 'grouped_hbar',
                        categories: [...DOC_TYPES],
                        series: [
                            { name: 'Hombre', color: '#038dd3', data: [580_000,240_000,95_000,70_293] },
                            { name: 'Mujer',  color: '#33b3a9', data: [620_000,260_000,105_000,64_000] },
                        ] },
                    // Col 3 — Seguro de salud
                    { id: 'cobertura_seguro', title: 'Población censada con cobertura de seguro de salud', icon: 'shield-check', type: 'kpi', kpiValue: '81.5%' },
                    { id: 'tipo_seguro', title: 'Distribución por tipo de seguro de salud', icon: 'chart-bar', type: 'hbar',
                        categories: [...SEGURO_TYPES], data: [18_234_892,7_847_293,1_234_892,2_847_293,892_293,5_834_293] },
                    { id: 'seguro_sexo', title: 'Población con seguro de salud por tipo y sexo', icon: 'users', type: 'grouped_hbar',
                        categories: [...SEGURO_TYPES],
                        series: [
                            { name: 'Hombre', color: '#038dd3', data: [8_500_000,3_700_000,620_000,1_300_000,420_000,2_677_293] },
                            { name: 'Mujer',  color: '#33b3a9', data: [9_734_892,4_147_293,614_892,1_547_293,472_293,3_157_000] },
                        ] },
                    // Wide row — gráficos complejos por edad
                    { id: 'estado_civil_edad', title: 'Estado civil por grandes grupos de edad', icon: 'chart-bar-square', type: 'grouped_bar', minHeight: 300,
                        categories: ['12-14 años','15-19 años','20-29 años','30-49 años','50-59 años','60 y más años'],
                        series: [
                            { name: 'Conviviente',          color: C6[0], data: [5_000,180_000,1_200_000,1_800_000,650_000,400_000] },
                            { name: 'Separado/a',           color: C6[1], data: [500,20_000,180_000,450_000,150_000,92_293] },
                            { name: 'Casado/a',             color: C6[2], data: [200,120_000,2_500_000,4_200_000,1_200_000,215_000] },
                            { name: 'Viudo/a',              color: C6[3], data: [0,500,8_000,100_000,300_000,1_438_793] },
                            { name: 'Divorciado/a',         color: C6[4], data: [0,1_000,30_000,120_000,60_000,23_892] },
                            { name: 'Soltero/a',            color: C6[5], data: [2_900_000,3_800_000,5_500_000,2_100_000,400_000,347_293] },
                        ] },
                    { id: 'dni_edad', title: 'Tipo de documento por grandes grupos de edad', icon: 'identification', type: 'grouped_bar', minHeight: 280,
                        categories: ['<1 año','1-5 años','6-14 años','15-29 años','30-44 años','45-59 años','60+ años'],
                        series: [
                            { name: 'Partida nacimiento',  color: C6[0], data: [180_000,400_000,320_000,180_000,65_000,35_000,20_000] },
                            { name: 'Carné extranjería',   color: C6[1], data: [5_000,20_000,80_000,200_000,130_000,50_000,15_000] },
                            { name: 'Perm. permanencia',   color: C6[2], data: [2_000,8_000,30_000,100_000,40_000,15_000,5_000] },
                            { name: 'Sin documento',       color: C6[3], data: [12_000,28_000,20_000,30_000,22_000,15_000,7_293] },
                        ] },
                    { id: 'seguro_edad', title: 'Seguro de salud por tipo y grupos de edad', icon: 'chart-bar', type: 'grouped_bar', minHeight: 300,
                        categories: ['<1 año','1-14 años','15-29 años','30-44 años','45-59 años','60+ años'],
                        series: [
                            { name: 'SIS',         color: C6[0], data: [600_000,5_200_000,3_800_000,3_200_000,2_400_000,2_934_892] },
                            { name: 'EsSalud',     color: C6[1], data: [100_000,1_200_000,1_800_000,2_500_000,1_800_000,447_293] },
                            { name: 'FF.AA./PNP',  color: C6[2], data: [20_000,150_000,200_000,250_000,180_000,34_892] },
                            { name: 'Privado',     color: C6[3], data: [30_000,400_000,600_000,700_000,500_000,117_293] },
                            { name: 'Otro',        color: C6[4], data: [10_000,80_000,100_000,130_000,100_000,52_293] },
                            { name: 'Ninguno',     color: C6[5], data: [100_000,500_000,800_000,600_000,400_000,756_000] },
                        ] },
                ],
            },
            // ── EDUCACIÓN ──────────────────────────────────────────────────
            {
                id: 'educacion', label: 'Educación', icon: 'academic-cap',
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                indicators: [
                    { id: 'asiste_ce',         title: 'Población censada de 3 a 24 años que asiste a un centro de enseñanza',                  icon: 'academic-cap',        type: 'kpi', kpiValue: '14 293 847' },
                    { id: 'asiste_mismo_dist', title: 'Población de 3 a 24 años que asiste a un centro de enseñanza en su mismo distrito',       icon: 'map-pin',             type: 'kpi', kpiValue: '11 847 293' },
                    { id: 'asiste_otro_dist',  title: 'Población de 3 a 24 años que asiste a un centro de enseñanza en otro distrito',           icon: 'arrow-right',         type: 'kpi', kpiValue: '2 293 847' },
                    { id: 'asiste_otro_pais',  title: 'Población de 3 a 24 años que asiste a un centro de enseñanza en otro país',              icon: 'globe-alt',            type: 'kpi', kpiValue: '152 707' },
                    { id: 'tasa_asistencia',   title: 'Tasa de asistencia escolar de la población censada de 3 a 24 años de edad',              icon: 'chart-bar',            type: 'kpi', kpiValue: '78.3%' },
                    {
                        id: 'nivel_educativo', title: 'Población censada de 15 y más años según nivel educativo alcanzado',
                        icon: 'chart-bar-square', type: 'bar',
                        categories: ['Sin nivel','Educación inicial','Primaria','Secundaria','Básica especial','Sup. no univ. completa','Sup. no univ. incompleta','Sup. univ. incompleta','Sup. univ. completa','Maestría/Doctorado'],
                        data: [892_293,347_892,6_234_892,8_847_293,234_892,1_234_892,2_847_293,1_892_293,3_234_892,347_892,892_293,127_892,234_892],
                    },
                    { id: 'tasa_alfabetismo', title: 'Tasa de alfabetismo de la población de 15 y más años de edad', icon: 'book-open', type: 'kpi', kpiValue: '94.2%' },
                    {
                        id: 'uso_tics', title: "Población censada de 3 y más años según uso de TIC's",
                        icon: 'device-phone-mobile', type: 'column',
                        categories: ['Computadora/laptop','Tableta','Internet','Celular con aplicaciones'],
                        data: [12_234_892,3_847_293,18_293_847,28_834_293],
                    },
                ],
            },
            // ── DISCAPACIDAD ───────────────────────────────────────────────
            {
                id: 'discapacidad', label: 'Discapacidad', icon: 'hand-raised',
                gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                indicators: [
                    { id: 'disc_sexo', title: 'Población con discapacidad según tipo y sexo', icon: 'users', type: 'grouped_hbar', span: 2, minHeight: 280,
                        categories: [...DISABILITY_TYPES],
                        series: [
                            { name: 'Hombre', color: '#038dd3', data: [470_293,225_892,180_293,340_892,195_293,280_892,155_293] },
                            { name: 'Mujer',  color: '#33b3a9', data: [550_892,250_293,210_892,360_293,225_892,310_293,175_892] },
                        ] },
                    { id: 'edad_prom_disc', title: 'Edad promedio de la población con discapacidad', icon: 'calculator', type: 'kpi_list', span: 1, kpiValue: '52.3',
                        categories: [...DISABILITY_TYPES], data: [48.2,54.1,51.3,55.8,50.2,49.7,53.1] },
                    { id: 'edad_mediana_disc', title: 'Edad mediana de la población con discapacidad', icon: 'calculator', type: 'kpi_list', span: 1, kpiValue: '51.0',
                        categories: [...DISABILITY_TYPES], data: [47.0,53.0,50.0,54.0,49.0,48.0,52.0] },
                    { id: 'disc_nivel_edu', title: 'Población con discapacidad según nivel educativo alcanzado', icon: 'academic-cap', type: 'hbar', span: 3, minHeight: 240,
                        categories: ['Sin nivel','Ed. inicial','Primaria','Secundaria','Básica especial','Sup. no univ. incompleta','Sup. no univ. completa','Sup. univ. incompleta','Sup. univ. completa','Maestría/Doctorado'],
                        data: [47_892,127_293,234_892,347_293,547_892,392_293,192_892,127_293,187_892,234_293] },
                    { id: 'hogares_disc', title: 'Hogares con al menos una persona con discapacidad', icon: 'home', type: 'kpi', span: 1, kpiValue: '1 847 293' },
                    { id: 'disc_edad', title: 'Población con discapacidad según tipo y grupos de edad', icon: 'chart-bar', type: 'grouped_column', span: 4, minHeight: 320,
                        categories: ['<1 año','1-5 años','6-14 años','15-29 años','30-44 años','45-59 años','60+ años'],
                        series: [
                            { name: 'Ver (c/lentes)',        color: C6[0], data: [5_000,25_000,60_000,120_000,200_000,280_000,331_293] },
                            { name: 'Oír (c/audífono)',      color: C6[1], data: [2_000,10_000,25_000,60_000,100_000,150_000,129_185] },
                            { name: 'Hablar/comunicarse',    color: C6[2], data: [3_000,15_000,40_000,80_000,110_000,130_000,113_185] },
                            { name: 'Caminar',               color: C6[3], data: [1_000,8_000,30_000,80_000,130_000,200_000,253_185] },
                            { name: 'Usar brazos/manos',     color: C6[4], data: [1_500,7_000,25_000,60_000,100_000,150_000,77_685] },
                            { name: 'Recordar/concentrarse', color: C6[5], data: [2_000,12_000,45_000,90_000,120_000,160_000,162_185] },
                            { name: 'Relacionarse',          color: '#6b6be8', data: [1_000,6_000,20_000,50_000,80_000,100_000,74_000] },
                        ] },
                ],
            },
            // ── IDENTIFICACIÓN ÉTNICA ──────────────────────────────────────
            {
                id: 'identidad_etnica', label: 'Etnicidad', icon: 'globe-americas',
                gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                indicators: [
                    { id: 'id_etnica', title: 'Población censada según identificación étnica', icon: 'globe-americas', type: 'pie', span: 1, showValues: false,
                        categories: [...ETHNIC_GROUPS], data: [5_234_892,892_293,347_892,234_892,1_847_293,127_892,234_892,4_234_892,18_847_293,2_834_293] },
                    { id: 'indigena_sexo', title: 'Población que se identifica como pueblo indígena u originario por sexo', icon: 'users', type: 'grouped_hbar', span: 3, minHeight: 320,
                        categories: [...ETHNIC_GROUPS],
                        series: [
                            { name: 'Hombre', color: '#038dd3', data: [2_600_000,445_000,175_000,120_000,925_000,65_000,120_000,2_120_000,9_420_000,1_420_000] },
                            { name: 'Mujer',  color: '#33b3a9', data: [2_634_892,447_293,172_892,114_892,922_293,62_892,114_892,2_114_892,9_427_293,1_414_293] },
                        ] },
                    { id: 'indigena_edad', title: 'Pueblo indígena u originario por grandes grupos de edad', icon: 'chart-bar', type: 'grouped_bar', span: 4, minHeight: 340,
                        categories: ['0-4 años','5-14 años','15-24 años','25-34 años','35-44 años','45-59 años','60+ años'],
                        series: [
                            { name: 'Quechua',          color: C6[0], data: [580_000,920_000,840_000,780_000,720_000,660_000,734_892] },
                            { name: 'Aimara',           color: C6[1], data: [95_000,155_000,140_000,130_000,120_000,110_000,142_293] },
                            { name: 'Ind. amazonía',    color: C6[2], data: [38_000,62_000,55_000,50_000,47_000,43_000,52_892] },
                            { name: 'Otro indígena',    color: C6[3], data: [25_000,42_000,38_000,35_000,32_000,29_000,33_892] },
                            { name: 'Afroperuano',      color: C6[4], data: [200_000,320_000,290_000,270_000,250_000,230_000,287_293] },
                            { name: 'Nikkei',           color: C6[5], data: [14_000,22_000,20_000,18_000,17_000,15_000,21_892] },
                            { name: 'Tusan',            color: '#6b6be8', data: [25_000,42_000,38_000,35_000,32_000,29_000,33_892] },
                            { name: 'Blanco',           color: '#0275af', data: [460_000,735_000,670_000,620_000,570_000,525_000,654_892] },
                            { name: 'Mestizo',          color: '#3bc4ba', data: [2_040_000,3_260_000,2_970_000,2_750_000,2_530_000,2_330_000,1_917_293] },
                            { name: 'Otro',             color: '#005fa8', data: [307_000,491_000,447_000,414_000,381_000,351_000,443_893] },
                        ] },
                    { id: 'indigena_edu', title: 'Pueblo indígena u originario por nivel educativo', icon: 'academic-cap', type: 'hbar', span: 2, minHeight: 260,
                        categories: ['Sin nivel','Prim. incompleta','Prim. completa','Sec. incompleta','Sec. completa','Sup. no univ. incompleta','Sup. no univ. completa','Sup. univ. incompleta','Sup. univ. completa','Maestría/Doctorado'],
                        data: [1_234_892,890_000,760_000,654_000,1_200_000,320_000,580_000,290_000,420_000,85_000] },
                    { id: 'indigena_tics', title: "Pueblo indígena u originario por uso de TIC's", icon: 'device-phone-mobile', type: 'pie', span: 1, showValues: false,
                        categories: ['Computadora','Tableta','Internet','Celular con aplicaciones'], data: [1_234_892,347_293,3_293_847,5_834_293] },
                    { id: 'indigena_estado_civil', title: 'Pueblo indígena u originario por estado civil', icon: 'user-group', type: 'hbar', span: 1,
                        categories: [...ESTADO_CIVIL_CATS], data: [1_234_892,347_293,2_293_847,847_293,127_892,2_518_847] },
                    { id: 'afro_sexo', title: 'Afroperuano o afrodescendiente por sexo', icon: 'users', type: 'hbar', span: 1,
                        categories: ['Hombre','Mujer'], data: [127_293,147_892] },
                    { id: 'afro_edad', title: 'Afroperuano o afrodescendiente por grupos de edad', icon: 'chart-bar', type: 'hbar', span: 1,
                        categories: ['0-14 años','15-29 años','30-44 años','45-59 años','60+ años'], data: [87_293,134_892,127_293,47_892,27_892] },
                    { id: 'afro_edu', title: 'Afroperuano o afrodescendiente por nivel educativo', icon: 'academic-cap', type: 'hbar', span: 2, minHeight: 240,
                        categories: ['Sin nivel','Prim. incompleta','Prim. completa','Sec. incompleta','Sec. completa','Sup. no univ. incompleta','Sup. no univ. completa','Sup. univ. incompleta','Sup. univ. completa','Maestría/Doctorado'],
                        data: [47_293,32_000,28_000,24_000,48_000,12_000,21_000,10_000,15_000,3_292] },
                    { id: 'afro_tics', title: "Afroperuano o afrodescendiente por uso de TIC's", icon: 'device-phone-mobile', type: 'pie', span: 1, showValues: false,
                        categories: ['Computadora','Tableta','Internet','Celular con aplicaciones'], data: [47_293,12_892,127_293,187_892] },
                    { id: 'afro_estado_civil', title: 'Afroperuano o afrodescendiente por estado civil', icon: 'user-group', type: 'hbar', span: 1,
                        categories: [...ESTADO_CIVIL_CATS], data: [87_293,12_892,47_293,27_892,3_892,95_293] },
                    { id: 'idioma_ninez', title: 'Idioma con el que aprendió a hablar en su niñez', icon: 'chat-bubble-left', type: 'hbar', span: 2,
                        categories: ['Castellano','Quechua','Aimara','Lengua nativa Amazónica','Lengua extranjera','Señas','Otro'],
                        data: [26_234_892,5_847_293,892_293,347_892,127_892,47_892,127_892] },
                ],
            },
            // ── CARACTERÍSTICAS ECONÓMICAS ─────────────────────────────────
            {
                id: 'caracteristicas_economicas', label: 'Población en edad de trabajar', icon: 'briefcase',
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                indicators: [
                    { id: 'pet',               title: 'Población en edad de trabajar',                              icon: 'briefcase',       type: 'kpi',  span: 1, kpiValue: '26 847 293' },
                    { id: 'trabajo_mismo_dist', title: 'Trabajan en mismo distrito',                                  icon: 'map-pin',         type: 'kpi',  span: 1, kpiValue: '9 234 847' },
                    { id: 'trabajo_otro_dist',  title: 'Trabajan en otro distrito',                                   icon: 'arrow-right',     type: 'kpi',  span: 1, kpiValue: '3 847 293' },
                    { id: 'trabajo_otro_pais',  title: 'Trabajan en otro país',                                       icon: 'globe-alt',       type: 'kpi',  span: 1, kpiValue: '284 729' },
                    { id: 'pet_condicion',      title: 'Población en edad de trabajar según condición de actividad',  icon: 'chart-bar',       type: 'hbar', span: 2,
                        categories: ['Ocupado/a','Desocupado/a','Inactiva'], data: [17_234_892,1_847_293,7_765_108] },
                    { id: 'tamano_empresa',     title: 'Población ocupada según tamaño de empresa',                   icon: 'building-office', type: 'hbar', span: 2,
                        categories: ['1 a 10 personas','11 a 50 personas','51 a más personas'], data: [9_234_892,4_847_293,2_192_293] },
                    { id: 'ocup_principal',     title: 'Población ocupada según ocupación principal', icon: 'chart-bar', type: 'hbar', span: 2, minHeight: 260,
                        categories: ['Directivos/Gerentes','Profesionales científicos','Técnicos y profesionales','Apoyo administrativo','Servicios y vendedores','Agricultores calificados','Artesanos y afines','Operadores de maquinaria','Ocupaciones elementales'],
                        data: [892_293,2_847_293,1_234_892,1_847_293,3_234_892,1_192_293,2_847_892,1_234_293,2_847_892] },
                    { id: 'categ_ocupacion',    title: 'Población ocupada según categoría de ocupación', icon: 'chart-bar', type: 'hbar', span: 2, minHeight: 220,
                        categories: ['Empleador/a o patrono/a','Trab. independiente','Empleado/a','Obrero/a','Trab. familiar no rem.','Trabajador/a del hogar'],
                        data: [892_293,4_234_892,6_847_293,3_192_293,892_892,1_034_293] },
                    { id: 'rama_actividad',     title: 'Población ocupada según rama de actividad', icon: 'chart-bar', type: 'hbar', span: 2, minHeight: 260,
                        categories: ['Agricultura y pesca','Minería','Manufactura','Construcción','Comercio','Transporte','Alojamiento/comidas','Información/comunicaciones','Finanzas','Enseñanza','Salud','Adm. pública','Otros servicios'],
                        data: [3_234_892,892_293,2_847_293,1_192_293,3_847_892,1_234_293,892_293,347_892,234_892,1_192_293,892_293,1_234_892,597_892] },
                ],
            },
        ],
    },
    // ── VIVIENDAS ─────────────────────────────────────────────────────────────
    {
        id: 'viviendas', label: 'Viviendas', icon: 'home', color: CLR.teal,
        sections: [
            {
                id: 'caract_tecnicas_viviendas', label: 'Características técnicas de las viviendas', icon: 'home-modern',
                gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                indicators: [
                    { id: 'tipo_vivienda', title: 'Tipo de vivienda particular', icon: 'home', type: 'hbar', span: 2, minHeight: 250,
                        categories: ['Casa independiente','Dep. en edificio','Viv. en quinta','Viv. en casa vecindad','Choza o cabaña','Viv. improvisada','Local no dest. hab.','Otro tipo'],
                        data: [22_234_892,5_847_293,1_192_293,892_293,347_892,234_892,127_892,47_892] },
                    { id: 'condicion_ocupacion', title: 'Condición de ocupación de la vivienda', icon: 'chart-bar', type: 'hbar', span: 2, minHeight: 220,
                        categories: ['Con personas presentes','Con personas ausentes','De uso ocasional','Desocupada en alquiler/venta','Abandonada/en construcción'],
                        data: [18_234_892,1_847_293,847_293,2_192_293,492_293] },
                    { id: 'material_paredes', title: 'Material predominante en paredes exteriores', icon: 'home', type: 'hbar', span: 2,
                        categories: ['Ladrillo/bloque concreto','Piedra con cal/cemento','Adobe','Tapia','Quincha (caña con barro)','Madera','Triplay/calamina/estera','Otro'],
                        data: [16_234_892,892_293,5_847_293,1_192_293,347_892,892_293,234_892,127_892] },
                    { id: 'material_techos', title: 'Material predominante en los techos', icon: 'home', type: 'hbar', span: 2, minHeight: 230,
                        categories: ['Concreto armado','Madera','Tejas','Calamina/fibra cemento','Caña/estera c/barro','Triplay/estera/carrizo','Paja/palmera','Otro'],
                        data: [12_234_892,3_847_293,1_192_293,4_847_293,892_293,347_892,192_293,127_892] },
                    { id: 'material_pisos', title: 'Material predominante en los pisos', icon: 'home', type: 'hbar', span: 2, minHeight: 230,
                        categories: ['Parquet/madera pulida','Láminas asfálticas','Losetas/terrazos','Madera entablada','Cemento','Tierra','Otro'],
                        data: [892_293,347_892,5_234_892,1_192_293,14_847_293,4_234_892,192_293] },
                    { id: 'calidad_vivienda', title: 'Viviendas según calidad de la vivienda', icon: 'star', type: 'pie', span: 1, showValues: false,
                        categories: ['Vivienda adecuada','Vivienda básica','Inadecuada paredes','Inadecuada techos','Inadecuada pisos'],
                        data: [18_234_892,2_847_293,1_192_293,1_347_892,892_293] },
                    { id: 'num_habitaciones', title: 'Número de habitaciones de la vivienda', icon: 'chart-bar', type: 'pie', span: 1, showValues: false,
                        categories: ['1 habitación','2 habitaciones','3 habitaciones','4 habitaciones','5 y más habitaciones'],
                        data: [5_234_892,8_847_293,7_192_293,4_234_892,2_847_293] },
                    { id: 'abastecimiento_agua', title: 'Viv. c/ocupantes según tipo de abastecimiento de agua', icon: 'beaker', type: 'hbar', span: 2, minHeight: 250,
                        categories: ['Red pública dentro viv.','Red pública fuera viv.','Pilón uso público','Camión-cisterna','Pozo','Manantial/puquio','Río/acequia/lago','Otro'],
                        data: [17_234_892,2_847_293,892_293,347_892,1_192_293,234_892,127_892,47_892] },
                    { id: 'eliminacion_excretas', title: 'Viv. c/ocupantes según eliminación de excretas', icon: 'beaker', type: 'hbar', span: 2, minHeight: 230,
                        categories: ['Red pública desagüe (dentro viv.)','Red pública desagüe (fuera viv.)','Letrina','Pozo séptico/biodigestor','Pozo ciego/negro','Río/acequia/canal','Al aire libre','Otro'],
                        data: [14_234_892,1_847_293,892_293,2_192_293,347_892,1_234_892,127_892,234_892] },
                    { id: 'energia_electrica', title: 'Viv. c/ocupantes según suministro de energía eléctrica', icon: 'bolt', type: 'hbar', span: 2,
                        categories: ['Red pública','Panel solar/batería','Generador a diésel','Energía eólica','Otro','No tiene energía eléctrica'],
                        data: [22_234_892,892_293,347_892,127_892,234_892,1_192_293] },
                ],
            },
        ],
    },
    // ── HOGARES ───────────────────────────────────────────────────────────────
    {
        id: 'hogares', label: 'Hogares', icon: 'building-storefront', color: CLR.sky,
        sections: [
            {
                id: 'caract_servicios_hogares', label: 'Características y servicios de los hogares', icon: 'sparkles',
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                indicators: [
                    { id: 'resp_hombre',         title: 'Hogares con responsable de hogar hombre',                                        icon: 'user',                type: 'kpi',    kpiValue: '5 847 293' },
                    { id: 'resp_mujer',           title: 'Hogares con responsable de hogar mujer',                                         icon: 'user',                type: 'kpi',    kpiValue: '4 014 597' },
                    { id: 'tenencia_vivienda',    title: 'Hogares según régimen de tenencia de la vivienda que ocupan',                                     icon: 'home',                type: 'stacked',
                        categories: ['Propia pagada','Propia por invasión','Alquilada','Cedida por empleador','Cedida por familiar','Otra forma'],
                        data: [8_234_892,1_192_293,4_847_293,192_293,347_892,234_892] },
                    { id: 'artefactos',           title: 'Hogares según tenencia de artefactos y electrodomésticos',                       icon: 'device-phone-mobile', type: 'column',
                        categories: ['Televisor','Refrigeradora','Lavadora','Microondas','Cocina','Otro artefacto'],
                        data: [9_234_892,7_847_293,4_192_293,3_234_892,8_547_293,1_192_293] },
                    { id: 'acceso_tics',          title: "Hogares según acceso a TIC's (internet, telefonía)",                             icon: 'device-phone-mobile', type: 'column',
                        categories: ['TV por cable','Teléfono fijo','Celular','Internet','Computadora'],
                        data: [4_234_892,2_847_293,9_192_293,6_234_892,5_347_293] },
                    { id: 'medios_transporte',    title: 'Hogares según tenencia de medios de transporte',                                 icon: 'truck',               type: 'column',
                        categories: ['Automóvil','Camioneta','Mototaxi','Motocicleta','Bicicleta','Otro'],
                        data: [3_234_892,1_192_293,892_293,2_847_293,1_234_892,347_892] },
                    { id: 'energia_cocina',       title: 'Hogares según tipo de energía o combustible que utilizan para cocinar',          icon: 'fire',                type: 'column',
                        categories: ['Gas (balón GLP)','Gas natural','Electricidad','Kerosene/petróleo','Carbón','Leña','Bosta/estiércol','No cocinan'],
                        data: [7_234_892,892_293,347_892,127_892,47_892,1_234_892,347_892,192_293] },
                    { id: 'eliminacion_residuos', title: 'Hogares según formas de eliminación de residuos sólidos',                        icon: 'trash',               type: 'column',
                        categories: ['Recogido por camión recolector','En río/acequia/canal','En campo abierto','Quemado','Enterrado','Otro'],
                        data: [7_234_892,347_892,1_192_293,892_293,127_892,234_892] },
                ],
            },
        ],
    },
];

// ── Grupos de columnas para Identidad y Protección Social ─────────────────────
const IDENTIDAD_COLUMN_GROUPS: readonly IdentidadColumnGroup[] = [
    { label: 'Indicadores de estado civil',                  color: CLR.blue, indicatorIds: ['estado_civil','estado_civil_sexo'] },
    { label: 'Indicadores de tenencia de documento',         color: CLR.teal, indicatorIds: ['tenencia_dni','dni_sexo'] },
    { label: 'Indicadores de cobertura de seguro de salud',  color: CLR.sky,  indicatorIds: ['cobertura_seguro','tipo_seguro','seguro_sexo'] },
];
const IDENTIDAD_WIDE_IDS = ['estado_civil_edad','dni_edad','seguro_edad'] as const;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ══════════════════════════════════════════════════════════════════════════════

@Component({
    selector: 'app-dashboard-tematico',
    standalone: true,
    imports: [CommonModule, NgxEchartsDirective, RouterLink, MatTooltipModule, HeroIconComponent],
    providers: [provideEchartsCore({ echarts })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section class="bg-[#f4f7f9] w-full flex flex-col font-sans text-gray-800 h-screen overflow-hidden"
             (click)="closeGeoDropdowns()">

      <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 flex justify-between items-center
                     px-4 py-1 sm:px-6 sm:py-1.5 md:px-10 lg:px-12 lg:py-2 w-full shrink-0">
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
        <button (click)="toggleMobileMenu($event)" class="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors gap-1.5" aria-label="Menú">
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.rotate-45]="mobileMenuOpen()" [class.translate-y-2]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.opacity-0]="mobileMenuOpen()"></span>
          <span class="w-5 h-0.5 bg-[#0056a1] rounded transition-all" [class.-rotate-45]="mobileMenuOpen()" [class.-translate-y-2]="mobileMenuOpen()"></span>
        </button>
      </header>

      @if (mobileMenuOpen()) {
        <div class="lg:hidden bg-white border-b border-gray-100 shadow-md z-40 px-4 py-3 flex flex-col gap-1 shrink-0"
             style="animation: dropdownIn 0.18s ease-out forwards" (click)="$event.stopPropagation()">
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
        <div class="flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 overflow-x-auto">
          @for (btn of navSections; track btn.id) {
            <button [routerLink]="btn.route"
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
      </div><!-- /botonera -->

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

            <!-- Ind. Principales en contenedor #efefef -->
            <div class="flex items-center rounded-xl shrink-0" style="background:#efefef">
              <button (click)="toggleNavSection('principales')"
              routerLink="/dashboard-censada"
                class="flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold
                       tracking-wide whitespace-nowrap transition-all duration-200 rounded-xl"
                [style]="expandedSection() === 'principales'
                  ? 'background:#caeae4;color:#424242;'
                  : 'color:#6b7280;'">
                
                <span>Indiadores principales</span>
                <app-hero-icon [name]="'chevron-right'"
                  class="w-3 h-3 shrink-0 transition-transform duration-200"
                  [class.rotate-90]="expandedSection() === 'principales'"></app-hero-icon>
              </button>
            </div>

            <!-- Ind. Temáticos — contenedor #efefef con sub-botones de grupos -->
            <div class="flex items-center rounded-xl shrink-0" style="background:#efefef">
              <button (click)="toggleNavSection('tematicos')"
                class="flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold
                       tracking-wide whitespace-nowrap transition-all duration-200 rounded-xl"
                [style]="expandedSection() === 'tematicos'
                  ? 'background:#caeae4;color:#424242;'
                  : 'color:#6b7280;'">                
                <span>Indicadores temáticos</span>
                <app-hero-icon [name]="'chevron-right'"
                  class="w-3 h-3 shrink-0 transition-transform duration-200"
                  [class.rotate-90]="expandedSection() === 'tematicos'"></app-hero-icon>
              </button>
            </div>

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

            <!-- División Territorial / Región Natural -->
            <div class="flex flex-col items-start gap-0.5 shrink-0" (click)="$event.stopPropagation()">
              <span class="text-[9px] font-black text-gray-400 tracking-widest px-0.5 leading-none hidden sm:block">
                Ámbito geográfico
              </span>
              <div class="relative">
                <button (click)="openNivelDropdown.update(v => !v)"
                  class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold
                         transition-all duration-200 focus:outline-none border whitespace-nowrap"
                  [style]="openNivelDropdown()
                    ? 'background:#003d7a; color:#fff; border-color:#003d7a'
                    : 'background:#0056a1; color:#fff; border-color:#0056a1'">
                  @if (activeNivelDef().icon) {
                    
                  }
                  <span class="hidden sm:inline">{{ activeNivelDef().label }}</span>
                  <app-hero-icon [name]="'chevron-down'"
                    class="w-3 h-3 shrink-0 transition-transform duration-200"
                    [class.rotate-180]="openNivelDropdown()"></app-hero-icon>
                </button>
                @if (openNivelDropdown()) {
                  <div class="absolute left-0 top-full mt-1.5 bg-white rounded-xl border border-gray-200
                               shadow-xl z-50 overflow-hidden"
                       style="min-width:188px; animation:dropdownIn 0.15s ease-out"
                       (click)="$event.stopPropagation()">
                    <div class="h-0.5 w-full" style="background:linear-gradient(to right,#0056a1,#038dd3,#caeae4)"></div>
                    <div class="px-3 pt-2 pb-1">
                      <span class="text-[9px] font-black text-gray-400 tracking-widest">Seleciconar Ámbito</span>
                    </div>
                    @for (n of NIVELES_FILTRO; track n.key) {
                      <button (click)="setNivelFiltro(n.key); openNivelDropdown.set(false)"
                        class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors duration-150"
                        [class.text-white]="nivelFiltro() === n.key"
                        [class.text-gray-700]="nivelFiltro() !== n.key"
                        [class.hover\:bg-gray-50]="nivelFiltro() !== n.key"
                        [style.background]="nivelFiltro() === n.key ? '#0056a1' : ''">
                        <span class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                          [class.border-white]="nivelFiltro() === n.key"
                          [style.border-color]="nivelFiltro() !== n.key ? '#0056a1' : ''">
                          @if (nivelFiltro() === n.key) { <span class="w-2 h-2 bg-white rounded-full block"></span> }
                        </span>
                        @if (n.icon) {
                          <app-hero-icon [name]="n.icon" class="w-3.5 h-3.5 shrink-0"
                            [class.text-white]="nivelFiltro() === n.key"
                            [style.color]="nivelFiltro() !== n.key ? '#0056a1' : ''"></app-hero-icon>
                        }
                        <span class="font-semibold flex-1">{{ n.label }}</span>
                      </button>
                    }
                    <div class="h-1"></div>
                  </div>
                }
              </div>
            </div>

            <div class="hidden sm:block h-7 w-px bg-gray-200 shrink-0"></div>

            <!-- ★ Región Natural -->
            @if (nivelFiltro() === 'region_natural') {
              <div class="relative shrink-0">
                <button (click)="openRegionDropdown.update(v => !v)"
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                         text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all
                         min-w-[140px] sm:min-w-[156px] justify-between">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:#33b3a9"></span>
                    <span class="text-gray-400 mr-0.5">Región:</span>
                    <span class="truncate max-w-[72px]">{{ regionNaturalLabel() }}</span>
                  </span>
                  
                </button>
                @if (openRegionDropdown()) {
                  <div class="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl
                               shadow-xl z-50 w-48 overflow-hidden"
                       (click)="$event.stopPropagation()">
                    <div class="h-0.5 w-full" style="background:linear-gradient(to right,#33b3a9,#038dd3)"></div>
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Región natural</span>
                    </div>
                    <button (click)="selectRegionNatural('')"
                      class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                      [class.text-white]="selectedRegionNatural() === ''"
                      [class.text-gray-700]="selectedRegionNatural() !== ''"
                      [class.hover\:bg-teal-50]="selectedRegionNatural() !== ''"
                      [style.background]="selectedRegionNatural() === '' ? '#33b3a9' : ''">
                      <span class="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center"
                        [class.border-white]="selectedRegionNatural() === ''"
                        [class.border-gray-300]="selectedRegionNatural() !== ''">
                        @if (selectedRegionNatural() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic">Todos los departamentos</span>
                    </button>
                    @for (rn of REGIONES_NATURALES; track rn.key) {
                      <button (click)="selectRegionNatural(rn.key)"
                        class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors"
                        [class.text-white]="selectedRegionNatural() === rn.key"
                        [class.text-gray-700]="selectedRegionNatural() !== rn.key"
                        [class.hover\:bg-gray-50]="selectedRegionNatural() !== rn.key"
                        [style.background]="selectedRegionNatural() === rn.key ? rn.color : ''">
                        <span class="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center"
                          [class.border-white]="selectedRegionNatural() === rn.key"
                          [style.border-color]="selectedRegionNatural() !== rn.key ? rn.color : ''">
                          @if (selectedRegionNatural() === rn.key) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold flex-1">{{ rn.label }}</span>
                        <span class="w-2 h-2 rounded-full shrink-0 opacity-70"
                          [style.background]="selectedRegionNatural() !== rn.key ? rn.color : 'rgba(255,255,255,0.6)'"></span>
                      </button>
                    }
                    <div class="h-1"></div>
                  </div>
                }
              </div>
            }

            <!-- ★ Departamento (oculto en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
              <div class="flex flex-col gap-0.5">
                <span class="text-[9px] font-bold text-gray-400 tracking-widest px-1">Departamento</span>
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
            }

            <!-- ★ Provincia (oculta en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
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
            }

            <!-- ★ Distrito (oculto en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
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
            }

            <!-- ★ Área de residencia (oculta en Región Natural) -->
            @if (nivelFiltro() !== 'region_natural') {
              <div class="flex flex-col items-start gap-0.5 shrink-0" (click)="$event.stopPropagation()">
                <span class="text-[9px] font-black text-gray-400 tracking-widest px-0.5 leading-none hidden sm:block">Área de residencia</span>
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
                        <span class="text-[9px] font-black text-gray-400 tracking-widest">Seleccionar área</span>
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
            }

          </div><!-- /geo-dropdowns -->
        </div><!-- /inner barra filtros -->
      </div><!-- /sticky barra filtros -->

      <!-- ══ SUB-NAV INDICADORES TEMÁTICOS ════════════════════════════════════ -->
      <div class="w-full shrink-0 px-3 md:px-4 2xl:px-5 pb-1.5"
           style="background:#efefef;">
        <div class="flex items-center gap-1">
          @for (group of thematicGroups; track group.id) {
            <button (click)="setActiveGroup(group.id)"
              class="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] sm:text-xs
                     font-bold tracking-wide transition-all whitespace-nowrap"
              [style]="activeGroupId() === group.id
                ? 'background:#caeae4;color:#424242;'
                : 'color:#9ca3af;'">
              <span>{{ group.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- ══ SECCIONES TEMÁTICAS (sub-nivel dentro del grupo activo) ══════════ -->
      @if (activeGroup(); as grp) {
        @if (grp.sections.length > 1) {
          <div class="bg-white border-b border-gray-100 shrink-0 px-2 py-1.5 flex items-stretch justify-center gap-1.5 overflow-x-auto"
               (click)="$event.stopPropagation()"
               style="animation: fadeIn 0.18s ease-out forwards">
            @for (sec of grp.sections; track sec.id) {
              <button (click)="setActiveSection(sec.id)"
                class="relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl min-w-[80px] max-w-[130px] border transition-all duration-200 shrink-0"
                [style]="activeSectionId() === sec.id
                  ? 'background:' + grp.color + ';border:1px solid #424242;color:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.15);'
                  : 'background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;'">
                @if (getSectionIcon(sec.id)) {
                  <img [src]="getSectionIcon(sec.id)" class="w-16 h-16 shrink-0"
                       [style.filter]="activeSectionId() === sec.id ? 'brightness(0) invert(1)' : 'none'">
                }
                <span class="text-[8.5px] font-bold text-center leading-tight line-clamp-2">{{ sec.label }}</span>
              </button>
            }
          </div>
        }
      }

      <!-- ══ MAIN ══════════════════════════════════════════════════════════════ -->
      <main class="flex-1 min-h-0 flex flex-col overflow-hidden">

        @if (activeSection(); as sec) {

          <!-- ── FECUNDIDAD: grid 3 col × 6 filas con placement explícito ──── -->
          @if (sec.id === 'fecundidad') {
            <div class="flex-1 min-h-0 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4 xl:px-8 xl:py-5">
              <div class="max-w-6xl xl:max-w-[1400px] mx-auto grid grid-cols-1 gap-3 lg:gap-4 lg:grid-cols-3 lg:h-[680px] xl:h-[780px] 2xl:h-[860px] lg:[grid-template-rows:auto_auto_auto_1fr_auto_auto]">

                <!-- ── C1·R1 ── KPI: MEF ──────────────────────────────────── -->
                <div class="rounded-xl shadow-sm overflow-hidden lg:col-start-1 lg:row-start-1" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                  <div class="px-4 py-3 flex items-center gap-3 relative">
                    <button matTooltip="Mujeres de 15 a 49 años de edad en el momento del censo" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                    </button>
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                      <img src="dashboards/tematicos/fecundidad/mujeres_15_49.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                    </div>
                    <div class="flex-1 min-w-0 pr-5">
                      <p class="text-[10px] font-bold leading-tight mb-0.5 text-white">Mujeres entre 15 y 49 años (mujeres en edad fértil)</p>
                      <p class="text-2xl xl:text-3xl font-black tabular-nums leading-none text-white">8 234 561</p>
                    </div>
                  </div>
                </div>

                <!-- ── C1·R2 ── KPI: Con hijos ───────────────────────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-start-1 lg:row-start-2">
                  <div class="px-4 py-3 flex items-center gap-3 relative">
                    <button matTooltip="Porcentaje de mujeres de 15 a 49 años que declararon tener hijos/as nacidos/as vivos/as" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                    </button>
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                      <img src="dashboards/tematicos/fecundidad/mef_con_hijos.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                    </div>
                    <div class="flex-1 min-w-0 pr-5">
                      <p class="text-[10px] font-bold leading-tight mb-0.5" style="color:#000000">Mujeres entre 15 y 49 años con hijos/as</p>
                      <p class="text-2xl xl:text-3xl font-black tabular-nums leading-none" style="color:#424242">68,4%</p>
                    </div>
                  </div>
                </div>

                <!-- ── C1·R3 ── KPI: Sin hijos ───────────────────────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-start-1 lg:row-start-3">
                  <div class="px-4 py-3 flex items-center gap-3 relative">
                    <button matTooltip="Porcentaje de mujeres de 15 a 49 años sin hijos/as nacidos/as vivos/as" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                    </button>
                     <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                      <img src="dashboards/tematicos/fecundidad/mef_sin_hijos.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                    </div>
                    <div class="flex-1 min-w-0 pr-5">
                      <p class="text-[10px] font-bold leading-tight mb-0.5" style="color:#000000">Mujeres entre 15 y 49 años sin hijos/as</p>
                      <p class="text-2xl xl:text-3xl font-black tabular-nums leading-none" style="color:#424242">31,6%</p>
                    </div>
                  </div>
                </div>

                <!-- ── C1·R4-6 ── Gráfico: MEF por grupo de edad ─────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[260px] sm:min-h-[320px] lg:min-h-0 lg:col-start-1 lg:row-start-4 lg:row-span-3">
                  <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                    <p class="flex-1 text-[10px] font-black text-gray-700 leading-tight min-w-0">Mujeres entre 15 y 49 años según tenencia de hijos/as nacidos/as vivos/as por grupos de edad</p>
                  </div>
                  @if (isBrowser) {
                    <div class="flex-1 min-h-0 px-1 pb-2 pt-1">
                      <div echarts [options]="fecuHijosEdadOpt" class="w-full h-full"></div>
                    </div>
                  }
                </div>

                <!-- ── C2·R1-2 ── KPI: Razón niño/a – mujer ────────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-start-2 lg:row-start-1 lg:row-span-2">
                  <div class="px-4 py-3 relative">
                    <button matTooltip="Número de niños/as de 0-4 años por cada 100 mujeres de 15-49 años" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                    </button>
                    <p class="text-[10px] font-black tracking-wide leading-none mb-3" style="color:#000000">Razón de niño/a - mujer</p>
                    <div class="flex items-center gap-5">
                      <div class="flex items-center gap-2.5">
                        <img src="dashboards/tematicos/fecundidad/razon-nino.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex flex-col leading-tight">
                          <span class="text-[9px] text-gray-400 font-semibold">Hay</span>
                          <span class="text-[22px] xl:text-[30px] font-black tabular-nums leading-none" style="color:#424242">30,5</span>
                          <span class="text-[9px] text-gray-400 font-semibold">niños</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2.5">
                         <img src="dashboards/tematicos/fecundidad/razon-mujer.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex flex-col leading-tight">
                          <span class="text-[9px] text-gray-400 font-semibold">por cada</span>
                          <span class="text-[22px] xl:text-[30px] font-black tabular-nums leading-none" style="color:#424242">100</span>
                          <span class="text-[9px] text-gray-400 font-semibold">mujeres</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ── C2·R3 ── KPI: Promedio hijos 15–49 ───────────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-start-2 lg:row-start-3">
                  <div class="px-4 py-3 flex items-center gap-3 relative">
                    <button matTooltip="Promedio de hijos/as nacidos/as vivos/as declarados por mujeres de 15 a 49 años" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                    </button>
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                      <img src="dashboards/tematicos/fecundidad/prom-hijos-nacidos.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                    </div>
                    <div class="flex-1 min-w-0 pr-5">
                      <p class="text-[10px] font-bold leading-tight mb-0.5" style="color:#000000">Promedio de hijos/as nacidos/as vivos/as para mujeres entre 15 y 49 años</p>
                      <p class="text-2xl xl:text-3xl font-black tabular-nums leading-none" style="color:#424242">2,3 <span class="text-sm xl:text-base font-bold text-gray-400">hijos</span></p>
                    </div>
                  </div>
                </div>

                <!-- ── C2·R4-6 ── Gráfico: Promedio hijos por edad ──────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[260px] sm:min-h-[320px] lg:min-h-0 lg:col-start-2 lg:row-start-4 lg:row-span-3">
                  <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                    <p class="flex-1 text-[10px] font-black text-gray-700 leading-tight min-w-0">Promedio de hijos/as nacidos/as vivos/as por grupos de edad de las mujeres entre 15 y 49 años</p>
                  </div>
                  @if (isBrowser) {
                    <div class="flex-1 min-h-0 px-1 pb-2 pt-1">
                      <div echarts [options]="fecuPromEdadOpt" class="w-full h-full"></div>
                    </div>
                  }
                </div>

                <!-- ── C3·R1 ── KPI: Madres solteras ────────────────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-start-3 lg:row-start-1">
                  <div class="px-4 py-3 flex items-center gap-3 relative">
                    <button matTooltip="Mujeres de 12 y más años que declararon ser madres y tener estado civil soltero" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                    </button>
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                       <img src="dashboards/tematicos/fecundidad/madres-solteras-12-mas.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                    </div>
                    <div class="flex-1 min-w-0 pr-5">
                      <p class="text-[10px] font-bold leading-tight mb-0.5" style="color:#000000">Madres solteras de 12 y más años (nunca casadas o nunca convivientes)</p>
                      <p class="text-2xl xl:text-3xl font-black tabular-nums leading-none" style="color:#424242">1 234 892</p>
                    </div>
                  </div>
                </div>

                <!-- ── C3·R2-4 ── Gráfico: Promedio hijos por estado civil ─ -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[260px] sm:min-h-[320px] lg:min-h-0 lg:col-start-3 lg:row-start-2 lg:row-span-3">
                  <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                    <p class="flex-1 text-[10px] font-black text-gray-700 leading-tight min-w-0">Promedio de hijos/as de mujeres de 12 y más años por estado civil ó conyugal</p>
                  </div>
                  @if (isBrowser) {
                    <div class="flex-1 min-h-0 px-1 pb-2 pt-1">
                      <div echarts [options]="fecuEstCivilOpt" class="w-full h-full"></div>
                    </div>
                  }
                </div>

                <!-- ── C3·R5 ── KPI: Madres adolescentes ─────────────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-start-3 lg:row-start-5">
                  <div class="px-4 py-3 flex items-center gap-3 relative">
                    <button matTooltip="Mujeres de 12 a 17 años que declararon ser madres al momento del censo" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                    </button>
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                       <img src="dashboards/tematicos/fecundidad/madres-adolesc-12-17.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                    </div>
                    <div class="flex-1 min-w-0 pr-5">
                      <p class="text-[10px] font-bold leading-tight mb-0.5" style="color:#000000">Madres adolescentes de 12 a 17 años</p>
                      <p class="text-2xl xl:text-3xl font-black tabular-nums leading-none" style="color:#424242">47 293</p>
                    </div>
                  </div>
                </div>

                <!-- ── C3·R6 ── KPI: Hijos/as fallecidos/as ──────────────── -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-start-3 lg:row-start-6">
                  <div class="px-4 py-3 flex items-center gap-3 relative">
                    <button matTooltip="Total de hijos/as fallecidos/as declarados por mujeres de 12 y más años al momento del censo" matTooltipClass="custom-tooltip"
                            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                      <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                    </button>
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                       <img src="dashboards/tematicos/fecundidad/hijos-fallecidos.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                    </div>
                    <div class="flex-1 min-w-0 pr-5">
                      <p class="text-[10px] font-bold leading-tight mb-0.5" style="color:#000000">Hijos/as fallecidos/as de las mujeres de 12 y más años</p>
                      <p class="text-2xl xl:text-3xl font-black tabular-nums leading-none" style="color:#424242">847 293</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          }

          <!-- ── MIGRACIÓN: Layout 4 columnas centrado ──────────────────── -->
          @if (sec.id === 'migracion') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch lg:h-[700px] lg:[grid-template-rows:700px] lg:overflow-hidden">

                <!-- ════ COLUMNA 1 ════ -->
                <div class="h-full flex flex-col gap-3">

                  <!-- KPI: Población inmigrante extranjera -->
                  <div class="rounded-xl shadow-sm overflow-hidden" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Total de personas nacidas en el extranjero que residen en el país al momento del censo" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/migracion/pob-inmigrante-extranjera.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-0.5" style="color:#ffffff">Población inmigrante extranjera</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">2 847 293</p>
                      </div>
                    </div>
                  </div>

                  <!-- Pie: Por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1" style="min-height:210px">
                    <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                      <p class="flex-1 text-[10px] font-black leading-tight min-w-0" style="color:#000000">Población inmigrante extranjera por sexo</p>
                      <button matTooltip="Distribución de la población inmigrante extranjera según sexo declarado al momento del censo" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 flex items-center justify-center shrink-0 hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    @if (isBrowser) {
                      <div class="flex-1 min-h-0 px-1 pb-2 pt-1" style="min-height:170px">
                        <div echarts [options]="migrSexoPieOpt" class="w-full h-full"></div>
                      </div>
                    }
                  </div>

                  <!-- Barras: Por grandes grupos de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1" style="min-height:190px">
                    <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                      <p class="flex-1 text-[10px] font-black leading-tight min-w-0" style="color:#000000">Población inmigrante extranjera por grandes grupos de edad</p>
                      <button matTooltip="Distribución de la población inmigrante extranjera según grandes grupos de edad" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 flex items-center justify-center shrink-0 hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    @if (isBrowser) {
                      <div class="flex-1 min-h-0 px-1 pb-2 pt-1" style="min-height:150px">
                        <div echarts [options]="migrGruposEdadOpt" class="w-full h-full"></div>
                      </div>
                    }
                  </div>

                  <!-- KPI: Razón hombre - mujer -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div class="px-4 py-3 relative">
                      <button matTooltip="Número de hombres por cada 100 mujeres de la población inmigrante extranjera" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                      <p class="text-[10px] font-black text-black tracking-wide leading-snug mb-3 pr-6">Razón hombre - mujer de la población inmigrante extranjera</p>
                      <div class="flex items-center gap-5">
                        <div class="flex items-center gap-2.5">
                        <img src="dashboards/tematicos/migracion/hombre.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex flex-col leading-tight">
                          <span class="text-[9px] text-gray-400 font-semibold">Hay</span>
                          <span class="text-[22px] xl:text-[30px] font-black tabular-nums leading-none" style="color:#424242">30,5</span>
                          <span class="text-[9px] text-gray-400 font-semibold">niños</span>
                        </div>
                        </div>
                        <div class="flex items-center gap-2.5">
                         <img src="dashboards/tematicos/migracion/mujer.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex flex-col leading-tight">
                          <span class="text-[9px] text-gray-400 font-semibold">por cada</span>
                          <span class="text-[22px] xl:text-[30px] font-black tabular-nums leading-none" style="color:#424242">100</span>
                          <span class="text-[9px] text-gray-400 font-semibold">mujeres</span>
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>

                  

                </div><!-- /col 1 -->

                <!-- ════ COLUMNAS 2 + 3 ════ -->
                <div class="col-span-2 h-full flex flex-col gap-3">

                  <!-- Fila: 3 KPIs -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">

                    <!-- KPI: Edad promedio -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div class="px-3 py-3 flex items-center gap-2 relative">
                        <button matTooltip="Promedio de edad de la población inmigrante extranjera al momento del censo" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                        </button>
                        <img src="dashboards/tematicos/migracion/epromedio.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[9px] font-bold leading-tight mb-1" style="color:#000000">Edad promedio de la población inmigrante extranjera</p>
                          <p class="text-xl font-black tabular-nums leading-none" style="color:#000000">32,4 <span class="text-xs font-bold text-gray-400">años</span></p>
                        </div>
                      </div>
                    </div>

                    <!-- KPI: Edad mediana -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div class="px-3 py-3 flex items-center gap-2 relative">
                        <button matTooltip="Edad mediana de la población inmigrante extranjera al momento del censo" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                        </button>
                        <img src="dashboards/tematicos/migracion/emediana.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[9px] font-bold leading-tight mb-1" style="color:#000000">Edad mediana de la población inmigrante extranjera</p>
                          <p class="text-xl font-black tabular-nums leading-none" style="color:#000000">29,7 <span class="text-xs font-bold text-gray-400">años</span></p>
                        </div>
                      </div>
                    </div>

                    <!-- KPI: Índice de envejecimiento -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div class="px-3 py-3 flex items-center gap-2 relative">
                        <button matTooltip="Razón entre la población de 60 y más años y la de 0 a 14 años, multiplicada por 100" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                        </button>
                        <img src="dashboards/tematicos/migracion/envejecimiento.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[9px] font-bold leading-tight mb-1" style="color:#000000">Índice de envejecimiento de la población inmigrante extranjera</p>
                          <p class="text-xl font-black tabular-nums leading-none" style="color:#000000">148,3</p>
                        </div>
                      </div>
                    </div>

                  </div><!-- /3 KPIs -->

                  <!-- Pirámide poblacional -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1" style="min-height:500px">
                    <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                      <p class="flex-1 text-[10px] font-black leading-tight min-w-0" style="color:#000000">Pirámide poblacional de la población extranjera inmigrante</p>
                      <button matTooltip="Distribución de la población inmigrante extranjera según sexo y grupos quinquenales de edad" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 flex items-center justify-center shrink-0 hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    @if (isBrowser) {
                      <div class="flex-1 min-h-0 px-1 pb-2 pt-1" style="min-height:460px">
                        <div echarts [options]="migrPiramideOpt" class="w-full h-full"></div>
                      </div>
                    }
                  </div>

                </div><!-- /col 2+3 -->

                <!-- ════ COLUMNA 4 ════ -->
                <div class="h-full flex flex-col gap-3">

                  <!-- Pie: Por seguro de salud -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1" style="min-height:210px">
                    <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                      <p class="flex-1 text-[10px] font-black leading-tight min-w-0" style="color:#000000">Población inmigrante extranjera por tenencia de seguro de salud</p>
                      <button matTooltip="Distribución de la población inmigrante extranjera según tenencia de algún tipo de seguro de salud" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 flex items-center justify-center shrink-0 hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    @if (isBrowser) {
                      <div class="flex-1 min-h-0 px-1 pb-2 pt-1" style="min-height:170px">
                        <div echarts [options]="migrSeguroOpt" class="w-full h-full"></div>
                      </div>
                    }
                  </div>

                  <!-- hbar: Por nivel educativo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1" style="min-height:190px">
                    <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                      <p class="flex-1 text-[10px] font-black leading-tight min-w-0" style="color:#000000">Población inmigrante extranjera por nivel educativo alcanzado</p>
                      <button matTooltip="Distribución de la población inmigrante extranjera según nivel educativo alcanzado" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 flex items-center justify-center shrink-0 hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    @if (isBrowser) {
                      <div class="flex-1 min-h-0 px-1 pb-2 pt-1" style="min-height:150px">
                        <div echarts [options]="migrNivelEduOpt" class="w-full h-full"></div>
                      </div>
                    }
                  </div>

                  <!-- hbar: Principales países de origen -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1" style="min-height:210px">
                    <div class="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-gray-50">
                      <p class="flex-1 text-[10px] font-black leading-tight min-w-0" style="color:#000000">Principales países de origen de la población inmigrante extranjera</p>
                      <button matTooltip="Países de nacimiento más frecuentes de la población inmigrante extranjera residente en el país" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 flex items-center justify-center shrink-0 hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    @if (isBrowser) {
                      <div class="flex-1 min-h-0 px-1 pb-2 pt-1" style="min-height:170px">
                        <div echarts [options]="migrPaisesOpt" class="w-full h-full"></div>
                      </div>
                    }
                  </div>

                </div><!-- /col 4 -->

              </div><!-- /grid 4 cols -->
            </div>
          }

          <!-- ── IDENTIDAD Y PROTECCIÓN SOCIAL: 6 columnas ── -->
          @if (sec.id === 'identidad_proteccion') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 lg:items-stretch">

                <!-- ════ COLS 1+2: Estado Civil ════════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3">

                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                       style="background:#0056a118;border-left:3px solid #0056a1">
                    <span class="text-[9px] font-black uppercase tracking-widest" style="color:#0056a1">Estado Civil</span>
                  </div>

                  <!-- Fila 1: Población de 12 y más años por estado civil o conyugal -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:260px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población de 12 y más años por estado civil o conyugal</p>
                      <button matTooltip="Distribución de la población de 12 y más años según su estado civil o conyugal" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="identEstCivColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Fila 2: Estado civil o conyugal por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:215px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Estado civil o conyugal de la población de 12 y más años por sexo</p>
                      <button matTooltip="Pirámide comparativa de estado civil entre hombres y mujeres" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="identEstCivPirOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Fila 3: Estado civil o conyugal por grupo de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:215px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Estado civil o conyugal de la población de 12 y más años por grupo de edad</p>
                      <button matTooltip="Distribución del estado civil según grupos de edad: actualmente unidos, anteriormente unidos y nunca unidos" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="identEstCivEdadOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /cols 1+2 -->

                <!-- ════ COLS 3+4: Identidad ═══════════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3">

                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                       style="background:#038dd318;border-left:3px solid #038dd3">
                    <span class="text-[9px] font-black uppercase tracking-widest" style="color:#038dd3">Identidad</span>
                  </div>

                  <!-- KPI: Población con DNI -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Total de personas que cuentan con Documento Nacional de Identidad (DNI) vigente" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/identidad/poblacion-dni.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Población que tiene DNI</p>
                        <div class="flex items-baseline gap-2">
                          <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">34 000 000</p>                          
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Fila pies DNI por sexo -->
                  <div class="grid grid-cols-2 gap-2 shrink-0">
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:170px">
                      <div class="px-3 py-1.5 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <p class="text-[9px] font-bold leading-tight pr-4" style="color:#000000">Población masculina con tenencia de DNI</p>
                        <button matTooltip="Porcentaje de hombres que cuentan con DNI sobre el total de población masculina" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1">
                        <div echarts [options]="identDniMascPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:170px">
                      <div class="px-3 py-1.5 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <p class="text-[9px] font-bold leading-tight pr-4" style="color:#000000">Población femenina con tenencia de DNI</p>
                        <button matTooltip="Porcentaje de mujeres que cuentan con DNI sobre el total de población femenina" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1">
                        <div echarts [options]="identDniFemPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>
                  </div><!-- /fila pies DNI -->

                  <!-- Columnas: DNI por grupo de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:215px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población que tiene DNI por grupo de edad</p>
                      <button matTooltip="Distribución de personas con DNI según grupos de edad" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="identDniEdadOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas: documentos de inmigrante extranjero -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:215px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población inmigrante extranjera según tipo de documento de identidad</p>
                      <button matTooltip="Tipo de documento de identidad que posee la población inmigrante extranjera residente en el país" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="identDocInmigrOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /cols 3+4 -->

                <!-- ════ COLS 5+6: Seguro de Salud ═════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3">

                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                       style="background:#33b3a918;border-left:3px solid #33b3a9">
                    <span class="text-[9px] font-black uppercase tracking-widest" style="color:#33b3a9">Seguro de Salud</span>
                  </div>

                  <!-- KPI: Con algún seguro de salud -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Total de personas que cuentan con algún tipo de seguro de salud" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/identidad/poblacion-seguro-salud.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Población que tiene algún seguro de salud</p>
                        <div class="flex items-baseline gap-2">
                          <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">29 280 892</p>                         
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Fila pies seguro por sexo -->
                  <div class="grid grid-cols-2 gap-2 shrink-0">
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:170px">
                      <div class="px-3 py-1.5 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <p class="text-[9px] font-bold leading-tight pr-4" style="color:#000000">Población masculina con algún seguro de salud</p>
                        <button matTooltip="Porcentaje de hombres que cuentan con algún seguro de salud sobre el total de población masculina" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1">
                        <div echarts [options]="identSegMascPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:170px">
                      <div class="px-3 py-1.5 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <p class="text-[9px] font-bold leading-tight pr-4" style="color:#000000">Población femenina con algún seguro de salud</p>
                        <button matTooltip="Porcentaje de mujeres que cuentan con algún seguro de salud sobre el total de población femenina" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1">
                        <div echarts [options]="identSegFemPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>
                  </div><!-- /fila pies seguro -->

                  <!-- Columnas: seguro por grupo de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:215px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población con algún seguro de salud por grupo de edad</p>
                      <button matTooltip="Distribución de personas con algún seguro de salud según grupos de edad" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="identSegEdadOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas: seguro por tipo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="height:215px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población con algún seguro de salud según tipo de seguro</p>
                      <button matTooltip="Distribución de la población asegurada según el tipo de seguro de salud que posee" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="identSegTipoOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /cols 5+6 -->

              </div><!-- /grid 6 cols -->
            </div>
          }

          <!-- ── EDUCACIÓN: 6 columnas ─────────────────────────────────────── -->
          @if (sec.id === 'educacion') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-stretch lg:h-[700px] lg:[grid-template-rows:700px] lg:overflow-hidden">

                <!-- ════ COLS 1+2: Nivel Educativo ═══════════════════════════════ -->
                <div class="col-span-2 h-full flex flex-col gap-3">

                 

                  <!-- H-bar: nivel educativo alcanzado -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:280px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población censada de 15 y más años según nivel educativo alcanzado</p>
                      <button matTooltip="Distribución de la población censada de 15 y más años según el mayor nivel educativo alcanzado" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduNivelHbarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas agrupadas: nivel educativo por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:210px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Nivel educativo alcanzado de la población censada de 15 y más años por sexo</p>
                      <button matTooltip="Comparación del nivel educativo alcanzado entre hombres y mujeres de 15 y más años" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduNivelSexColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /cols 1+2 -->

                <!-- ════ COL 3: Asistencia Escolar ════════════════════════════════ -->
                <div class="h-full flex flex-col gap-3">
                  
                  <!-- KPI: tasa asistencia 3-24 años -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Porcentaje de la población de 3 a 24 años que asiste a algún centro de enseñanza" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/educacion/tasa-asistencia-escolar.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#000000">Tasa de asistencia escolar de la población censada de 3 a 24 años</p>
                        <div class="flex items-baseline gap-2">
                          <p class="text-2xl font-black tabular-nums leading-none" style="color:#000000">6 758 293</p>
                          
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- KPI: desplazamiento fuera de distrito -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Población que se desplaza hacia otro distrito para asistir a su centro de enseñanza" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/educacion/poblacion-que-se-desplaza.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#000000">Población que se desplaza fuera de su distrito para asistir a su centro de enseñanza</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#000000">1 234 892</p>
                      </div>
                    </div>
                  </div>

                  <!-- Columnas: asistencia 3-5 años por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Tasa de asistencia escolar de la población censada de 3 a 5 años por sexo</p>
                      <button matTooltip="Tasa de asistencia escolar de la población de 3 a 5 años según sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduAsist3a5ColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas: asistencia 12-16 años por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Tasa de asistencia escolar de la población censada de 12 a 16 años por sexo</p>
                      <button matTooltip="Tasa de asistencia escolar de la población de 12 a 16 años según sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduAsist12a16ColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /col 3 -->

                <!-- ════ COL 4: Asistencia Escolar ════════════════════════════════ -->
                <div class="h-full flex flex-col gap-3">

                  <!-- Columnas: asistencia 3-24 según sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Tasa de asistencia escolar de la población censada de 3 a 24 años según sexo</p>
                      <button matTooltip="Tasa de asistencia escolar de la población de 3 a 24 años según sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduAsist3a24ColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas: asistencia 6-11 años por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Tasa de asistencia escolar de la población censada de 6 a 11 años por sexo</p>
                      <button matTooltip="Tasa de asistencia escolar de la población de 6 a 11 años según sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduAsist6a11ColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas: asistencia 17-24 años por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Tasa de asistencia escolar de la población censada de 17 a 24 años por sexo</p>
                      <button matTooltip="Tasa de asistencia escolar de la población de 17 a 24 años según sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduAsist17a24ColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /col 4 -->

                <!-- ════ COL 5: Alfabetismo ════════════════════════════════════════ -->
                <div class="h-full flex flex-col gap-3">                

                  <!-- KPI: tasa de alfabetismo -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Porcentaje de la población de 15 y más años que sabe leer y escribir" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/educacion/tasa-alfabetismo.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Tasa de alfabetismo de la población censada de 15 y más años</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">94,8%</p>
                      </div>
                    </div>
                  </div>

                  <!-- Columnas: alfabetismo por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Tasa de alfabetismo de la población censada de 15 y más años por sexo</p>
                      <button matTooltip="Tasa de alfabetismo de la población de 15 y más años según sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduAlfaSexColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- H-bar: alfabetismo por grupos de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Tasa de alfabetismo de la población censada de 15 y más años por grupos de edad</p>
                      <button matTooltip="Tasa de alfabetismo de la población de 15 y más años según grupos de edad" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduAlfaEdadHbarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /col 5 -->

                <!-- ════ COL 6: TIC ════════════════════════════════════════════════ -->
                <div class="h-full flex flex-col gap-3">                  

                  <!-- KPI: uso TIC -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Porcentaje de la población de 3 y más años que utilizó al menos una tecnología de información y comunicación" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/educacion/pobcensada_tic.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Población censada de 3 y más años que utilizó al menos una TIC</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">68,4%</p>
                      </div>
                    </div>
                  </div>

                  <!-- Columnas: TIC por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población censada de 3 y más años que utilizó al menos una TIC por sexo</p>
                      <button matTooltip="Uso de TIC por la población de 3 y más años según sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduTicSexColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- H-bar: TIC por grupos de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población censada de 3 y más años que utilizó al menos una TIC por grupos de edad</p>
                      <button matTooltip="Uso de TIC por la población de 3 y más años según grupos de edad" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="eduTicEdadHbarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /col 6 -->

              </div><!-- /grid 6 cols -->
            </div>
          }

          <!-- ── ETNICIDAD: 8 columnas ──────────────────────────────────────── -->
          @if (sec.id === 'identidad_etnica') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-8 gap-3 items-stretch">

                <!-- ════ COLS 1+2: Autoidentificación étnica e Idioma ════════════ -->
                <div class="col-span-2 flex flex-col gap-3 h-full">

                  <!-- Bar: Población según autoidentificación étnica -->
                  <div class="flex-1 min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                      <p class="flex-1 text-[10px] font-bold leading-tight min-w-0" style="color:#000000">Población según autoidentificación étnica</p>
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="etnicAutoBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Bar: Idioma o lengua aprendida en la niñez -->
                  <div class="flex-1 min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                      <p class="flex-1 text-[10px] font-bold leading-tight min-w-0" style="color:#000000">Población censada según idiomas o lenguas con las que aprendió a hablar en su niñez</p>
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="etnicIdiomaBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /cols 1+2 -->

                <!-- ════ COLS 3+4+5: Población indígena u originaria ═════════════ -->
                <div class="col-span-3 flex flex-col gap-3">

                  <!-- Encabezado de bloque -->
                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                       style="background:#0056a118;border-left:3px solid #0056a1">
                    <span class="text-[9px] font-black uppercase tracking-widest" style="color:#0056a1">
                      Población que se autoidentifica como parte de un pueblo indígena u originario
                    </span>
                  </div>

                  <!-- KPI total — fila 1 -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/etnicidad/pobindigena-ordinario.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Población que se autoidentifica como parte de un pueblo indígena u originario</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">8 344 891</p>
                      </div>
                    </div>
                  </div>

                  <!-- Fila 2: pie sexo (2cols) + col grupo de edad (3cols) -->
                  <div class="grid grid-cols-1 lg:grid-cols-5 gap-3" style="min-height:220px">

                    <!-- Pie: Sexo -->
                    <div class="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Sexo</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicIndSexoPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Col: Grupo de edad -->
                    <div class="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Grupo de edad</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicIndEdadColOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                  </div><!-- /fila 2 -->

                  <!-- Filas 3+4: col nivel educativo (2cols) + KPI TIC + KPI analfabeto (1col flex) -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" style="min-height:230px">

                    <!-- Col: Nivel educativo alcanzado -->
                    <div class="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Nivel educativo alcanzado</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicIndEduColOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Columna derecha: KPI TIC + KPI analfabeto -->
                    <div class="flex flex-col gap-3">

                      <!-- KPI: Sí utiliza TIC's -->
                      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div class="px-3 py-3 flex items-start gap-2.5 relative h-full">
                          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                  class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                            <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                          </button>
                          <img src="dashboards/tematicos/etnicidad/si-utiliza-tics.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                          <div class="flex-1 min-w-0 pr-4">
                            <p class="text-[9px] font-bold leading-tight mb-1.5" style="color:#000000">Sí utiliza TIC's</p>
                            <p class="text-lg font-black tabular-nums leading-none mb-0.5" style="color:#000000">3 124 892</p>
                            
                          </div>
                        </div>
                      </div>

                      <!-- KPI: No sabe leer ni escribir -->
                      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div class="px-3 py-3 flex items-start gap-2.5 relative h-full">
                          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                  class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                            <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                          </button>
                          <img src="dashboards/tematicos/etnicidad/pob-no-lee.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                          <div class="flex-1 min-w-0 pr-4">
                            <p class="text-[9px] font-bold leading-tight mb-1.5" style="color:#000000">No sabe leer ni escribir</p>
                            <p class="text-lg font-black tabular-nums leading-none mb-0.5" style="color:#000000">892 293</p>
                            
                          </div>
                        </div>
                      </div>

                    </div><!-- /columna KPIs -->

                  </div><!-- /filas 3+4 -->

                  <!-- Fila 5: radar seguro de salud (3cols) + col estado civil (2cols) -->
                  <div class="grid grid-cols-1 lg:grid-cols-5 gap-3" style="min-height:240px">

                    <!-- Radar: Acceso a seguro de salud -->
                    <div class="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Acceso a seguro de salud</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicIndSeguroSemiPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Col: Estado civil o conyugal -->
                    <div class="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Estado civil o conyugal</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicIndEstcivColOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                  </div><!-- /fila 5 -->

                </div><!-- /cols 3+4+5 indígena -->

                <!-- ════ COLS 6+7+8: Población afroperuana o afrodescendiente ═════ -->
                <div class="col-span-3 flex flex-col gap-3">

                  <!-- Encabezado de bloque -->
                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                       style="background:#33b3a918;border-left:3px solid #33b3a9">
                    <span class="text-[9px] font-black uppercase tracking-widest" style="color:#33b3a9">
                      Población que se autoidentifica como afroperuano o afrodescendiente
                    </span>
                  </div>

                  <!-- KPI total — fila 1 -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/etnicidad/pob-afroperuano.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Población que se autoidentifica como afroperuano o afrodescendiente</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">275 185</p>
                      </div>
                    </div>
                  </div>

                  <!-- Fila 2: pie sexo (2cols) + col grupo de edad (3cols) -->
                  <div class="grid grid-cols-1 lg:grid-cols-5 gap-3" style="min-height:220px">

                    <!-- Pie: Sexo -->
                    <div class="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Sexo</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicAfrSexoPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Col: Grupo de edad -->
                    <div class="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Grupo de edad</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicAfrEdadColOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                  </div><!-- /fila 2 afro -->

                  <!-- Filas 3+4: col nivel educativo (2cols) + KPI TIC + KPI analfabeto (1col flex) -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" style="min-height:230px">

                    <!-- Col: Nivel educativo alcanzado -->
                    <div class="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Nivel educativo alcanzado</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicAfrEduColOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Columna derecha: KPI TIC + KPI analfabeto -->
                    <div class="flex flex-col gap-3">

                      <!-- KPI: Sí utiliza TIC's -->
                      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div class="px-3 py-3 flex items-start gap-2.5 relative h-full">
                          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                  class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                            <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                          </button>
                          <img src="dashboards/tematicos/etnicidad/si-utiliza-tics.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                          <div class="flex-1 min-w-0 pr-4">
                            <p class="text-[9px] font-bold leading-tight mb-1.5" style="color:#000000">Sí utiliza TIC's</p>
                            <p class="text-lg font-black tabular-nums leading-none mb-0.5" style="color:#000000">134 892</p>
                            
                          </div>
                        </div>
                      </div>

                      <!-- KPI: No sabe leer ni escribir -->
                      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div class="px-3 py-3 flex items-start gap-2.5 relative h-full">
                          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                  class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                            <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                          </button>
                          <img src="dashboards/tematicos/etnicidad/pob-no-lee.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                          <div class="flex-1 min-w-0 pr-4">
                            <p class="text-[9px] font-bold leading-tight mb-1.5" style="color:#000000">No sabe leer ni escribir</p>
                            <p class="text-lg font-black tabular-nums leading-none mb-0.5" style="color:#000000">18 293</p>
                          
                          </div>
                        </div>
                      </div>

                    </div><!-- /columna KPIs afro -->

                  </div><!-- /filas 3+4 afro -->

                  <!-- Fila 5: radar seguro de salud (3cols) + col estado civil (2cols) -->
                  <div class="grid grid-cols-1 lg:grid-cols-5 gap-3" style="min-height:240px">

                    <!-- Radar: Acceso a seguro de salud -->
                    <div class="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Acceso a seguro de salud</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicAfrSeguroSemiPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Col: Estado civil o conyugal -->
                    <div class="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start gap-2 shrink-0">
                        <p class="flex-1 text-[9px] font-bold leading-tight min-w-0" style="color:#000000">Estado civil o conyugal</p>
                        <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-1.5">
                        <div echarts [options]="etnicAfrEstcivColOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                  </div><!-- /fila 5 afro -->

                </div><!-- /cols 6+7+8 afro -->

              </div><!-- /grid 8 cols -->
            </div>
          }

          <!-- ── DISCAPACIDAD: filas explícitas, scroll natural ───────────────── -->
          <!-- ── DISCAPACIDAD: 5 columnas ──────────────────────────────────── -->
          @if (sec.id === 'discapacidad') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-stretch lg:h-[700px]">

                <!-- ════ COLS 1+2: Estructura Demográfica ════════════════════════ -->
                <div class="col-span-2 h-full flex flex-col gap-3">

                
                  <!-- Fila 1: 2 KPIs lado a lado -->
                  <div class="grid grid-cols-2 gap-3 shrink-0">

                    <!-- KPI: Población con discapacidad -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div class="px-4 py-3 flex items-center gap-3 relative">
                        <button matTooltip="Total de personas que presentan algún tipo de discapacidad" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                        </button>
                        <img src="dashboards/tematicos/discapacidad/pob-discapacidad.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[10px] font-bold leading-tight mb-1" style="color:#000000">Población de 5 y más años con discapacidad</p>
                          <p class="text-2xl font-black tabular-nums leading-none" style="color:#000000">3 209 257</p>
                        </div>
                      </div>
                    </div>

                    <!-- KPI: Hogares con al menos una persona con discapacidad -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div class="px-4 py-3 flex items-center gap-3 relative">
                        <button matTooltip="Hogares que tienen al menos una persona con algún tipo de discapacidad" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                        </button>
                        <img src="dashboards/tematicos/discapacidad/hogar-discapacidad.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[10px] font-bold leading-tight mb-1" style="color:#000000">Hogares con al menos una persona con discapacidad</p>
                          <p class="text-2xl font-black tabular-nums leading-none" style="color:#000000">2 847 293</p>
                        </div>
                      </div>
                    </div>

                  </div><!-- /fila 1 KPIs -->

                  <!-- Pirámide poblacional (flex-1) -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:420px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Pirámide de la población con discapacidad</p>
                      <button matTooltip="Distribución de la población con discapacidad por grupos de edad y sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="discPiramideOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /cols 1+2 -->

                <!-- ════ COLS 3+4: Salud, Educación y TIC ═════════════════════════ -->
                <div class="col-span-2 h-full flex flex-col gap-3">

                  

                  <!-- Columnas: tipo de seguro de salud -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[180px]">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población con discapacidad por acceso a tipo de seguro de salud</p>
                      <button matTooltip="Distribución de la población con discapacidad según el tipo de seguro de salud al que accede" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="discSeguroColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas: nivel educativo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[180px]">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población con discapacidad por nivel educativo alcanzado</p>
                      <button matTooltip="Distribución de la población con discapacidad según el mayor nivel educativo alcanzado" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="discEduColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Fila inferior: pie asistencia (izq) + 2 KPIs (der) -->
                  <div class="grid grid-cols-2 gap-3 flex-1 min-h-[200px]">

                    <!-- Pie: asistencia a centro de enseñanza -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <p class="text-[10px] font-bold leading-tight pr-4" style="color:#000000">Población con discapacidad de 5 a 24 años por asistencia a un centro de enseñanza</p>
                        <button matTooltip="Distribución de la población con discapacidad de 3 a 24 años según su asistencia a un centro de enseñanza" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-2">
                        <div echarts [options]="discAsistPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Columna derecha: 2 KPIs apilados -->
                    <div class="flex flex-col gap-3">

                      <!-- KPI: no sabe leer ni escribir -->
                      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div class="px-4 py-3 flex items-center gap-3 relative h-full">
                          <button matTooltip="Población con discapacidad que declara no saber leer ni escribir" matTooltipClass="custom-tooltip"
                                  class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                            <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                          </button>
                          <img src="dashboards/tematicos/discapacidad/pob-no-lee.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                          <div class="flex-1 min-w-0 pr-5">
                            <p class="text-[10px] font-bold leading-tight mb-2" style="color:#000000">Población con discapacidad que no sabe leer ni escribir</p>
                            <p class="text-xl font-black tabular-nums leading-none mb-0.5" style="color:#000000">534 892</p>
                           
                          </div>
                        </div>
                      </div>

                      <!-- KPI: uso de TIC's -->
                      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div class="px-4 py-3 flex items-center gap-3 relative h-full">
                          <button matTooltip="Población con discapacidad que hace uso de tecnologías de información y comunicación" matTooltipClass="custom-tooltip"
                                  class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                            <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-gray-300"></app-hero-icon>
                          </button>
                          <img src="dashboards/tematicos/discapacidad/pob-discapacidad-usa-tics.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                          <div class="flex-1 min-w-0 pr-5">
                            <p class="text-[10px] font-bold leading-tight mb-2" style="color:#000000">Población con discapacidad que hace uso de TIC's</p>
                            <p class="text-xl font-black tabular-nums leading-none mb-0.5" style="color:#000000">892 293</p>
                            
                          </div>
                        </div>
                      </div>

                    </div><!-- /columna derecha KPIs -->

                  </div><!-- /fila inferior -->

                </div><!-- /cols 3+4 -->

                <!-- ════ COLS 5+6: Esferas (apiladas 50/50) ══════════════════ -->
                <div class="col-span-2 h-full flex flex-col gap-3">

                  <!-- Fila 1 + 50% fila 2: Esferas por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:220px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población con discapacidad según esfera de funcionamiento por sexo</p>
                      <button matTooltip="Distribución de la población con discapacidad según la esfera de funcionamiento que declara" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="discEsferasHbarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- 50% fila 2 + fila 3: Esferas por grupo de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1" style="min-height:220px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-5" style="color:#000000">Población con discapacidad según esfera de funcionamiento según grupo de edad</p>
                      <button matTooltip="Distribución porcentual de la población con discapacidad por esfera de funcionamiento según grupo de edad: 5-17, 18-59 y 60 y más años" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="discEsferasEdadOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /cols 5+6 -->

              </div><!-- /grid 6 cols -->
            </div>
          }

          <!-- ── VIVIENDA: 6 columnas × 7 filas (3 bloques de 2 cols) ──────── -->
          @if (sec.id === 'caract_tecnicas_viviendas') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-stretch lg:h-[700px] xl:h-[780px] 2xl:h-[860px]">

                <!-- ════ BLOQUE A: Columnas 1-2 ══════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3 h-full">

                  <!-- Fila 1: KPI total viviendas -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Viviendas particulares con al menos un ocupante presente al momento del censo"
                              matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/viviendas/viv-particular-presentes.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Viviendas particulares con ocupantes presentes</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">18 234 892</p>
                      </div>
                    </div>
                  </div>

                  <!-- Filas 2-3: Bar hogares -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:200px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según número de hogares</p>
                      </div>
                      <button matTooltip="Distribución según número de hogares por vivienda" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivHogaresBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Filas 4-5: HBar habitaciones -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:200px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según número de habitaciones de la vivienda</p>
                      </div>
                      <button matTooltip="Distribución según número de habitaciones" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivHabitacionesHBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Filas 6-7: Pie calidad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:200px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según calidad de la vivienda</p>
                      </div>
                      <button matTooltip="Distribución según calidad de la vivienda" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivCalidadPieOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /BLOQUE A -->

                <!-- ════ BLOQUE B: Columnas 3-4 ══════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3 h-full">

                  <!-- Filas 1-3: HBar paredes exteriores -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:3 1 0%;min-height:240px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según material de construcción predominante en las paredes exteriores</p>
                      </div>
                      <button matTooltip="Distribución según material de paredes exteriores" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivParedesHBarOpt" class="w-full h-full"></div>
                    </div>
                    <div class="px-3 pb-2 shrink-0">
                      <p class="text-[7px] text-gray-400 leading-tight">1/ Comprende piedra o sillar con cal o cemento, quincha, piedra con barro y otros materiales.</p>
                    </div>
                  </div>

                  <!-- Filas 4-5: Bar techos -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%;min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según material de construcción predominante en los techos</p>
                      </div>
                      <button matTooltip="Distribución según material de techos" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivTechosBarOpt" class="w-full h-full"></div>
                    </div>
                    <div class="px-3 pb-2 shrink-0">
                      <p class="text-[7px] text-gray-400 leading-tight">1/ Comprende caña o estera con torta de barro o cemento, triplay, estera, carrizo, paja, hoja de palmera o materiales similares.</p>
                    </div>
                  </div>

                  <!-- Filas 6-7: HBar pisos -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%;min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según material de construcción predominante en los pisos</p>
                      </div>
                      <button matTooltip="Distribución según material de pisos" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivPisosHBarOpt" class="w-full h-full"></div>
                    </div>
                    <div class="px-3 pb-2 shrink-0">
                      <p class="text-[7px] text-gray-400 leading-tight">1/ Comprende otros tipos de pisos o materiales similares.</p>
                    </div>
                  </div>

                </div><!-- /BLOQUE B -->

                <!-- ════ BLOQUE C: Columnas 5-6 ══════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3 h-full">

                  <!-- Filas 1-3: Bar agua -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:3 1 0%;min-height:240px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según tipo de abastecimiento de agua</p>
                      </div>
                      <button matTooltip="Distribución según tipo de abastecimiento de agua" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivAguaBarOpt" class="w-full h-full"></div>
                    </div>
                    <div class="px-3 pb-2 shrink-0">
                      <p class="text-[7px] text-gray-400 leading-tight">1/ Comprende manantial, puquio, río, acequia, lago, laguna y otras fuentes de abastecimiento.</p>
                    </div>
                  </div>

                  <!-- Filas 4-5: Bar excretas -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%;min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según forma de eliminación de excretas</p>
                      </div>
                      <button matTooltip="Distribución según forma de eliminación de excretas" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivExcretasBarOpt" class="w-full h-full"></div>
                    </div>
                    <div class="px-3 pb-2 shrink-0">
                      <p class="text-[7px] text-gray-400 leading-tight">1/ Comprende pozo ciego o negro, río, acequia, canal o similar, así como viviendas sin conexión o al aire libre.</p>
                    </div>
                  </div>

                  <!-- Filas 6-7: Bar energía eléctrica -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%;min-height:180px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Viviendas particulares con ocupantes presentes según procedencia del suministro de energía eléctrica</p>
                      </div>
                      <button matTooltip="Distribución según suministro de energía eléctrica" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="vivEnergiaBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /BLOQUE C -->

              </div>
            </div>
          }

          <!-- ── PET (Población en Edad de Trabajar): 4 columnas ──────────── -->
          @if (sec.id === 'caracteristicas_economicas') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch lg:h-[700px] xl:h-[780px] 2xl:h-[860px]">

                <!-- ════ COL 1: Estructura Demográfica ═══════════════════════ -->
                <div class="flex flex-col gap-3 h-full">

                  <!-- KPI: total PET -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Total de personas en edad de trabajar (15 años y más)" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4 text-white/70"></app-hero-icon>
                      </button>
                      <img src="dashboards/tematicos/PET/poblacion-edad-trabajar.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Población en edad de trabajar (población de 14 y más años)</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">26 847 293</p>
                        
                      </div>
                    </div>
                  </div>

                  <!-- Pie: por sexo -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:240px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar por sexo</p>
                      </div>
                      <button matTooltip="Distribución por sexo" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="petSexoPieOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- HBar: por grupos de edad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:220px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar por grupos de edad</p>
                      </div>
                      <button matTooltip="Distribución por grupos de edad" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="petEdadHBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /col 1 -->

                <!-- ════ COL 2: Condiciones Generales ════════════════════════ -->
                <div class="flex flex-col gap-3 h-full">

                  <!-- Semi-circle: seguro de salud -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:200px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar por acceso a seguro de salud</p>
                      </div>
                      <button matTooltip="Distribución por acceso a seguro de salud" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="petSeguroSemiPieOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Semi-circle: discapacidad -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:200px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar con y sin discapacidad</p>
                      </div>
                      <button matTooltip="Distribución por condición de discapacidad" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="petDiscSemiPieOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Columnas: estado civil -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style="min-height:200px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar por estado civil o conyugal</p>
                      </div>
                      <button matTooltip="Distribución por estado civil o conyugal" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="petEstcivColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /col 2 -->

                <!-- ════ COLS 3+4: Educación y Capacidades ═══════════════════ -->
                <div class="col-span-2 flex flex-col gap-3 h-full">

                  <!-- Fila 1: nivel educativo (ancho completo) -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col shrink-0" style="min-height:220px">
                    <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                      <div class="flex items-start gap-1.5">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar por nivel educativo alcanzado</p>
                      </div>
                      <button matTooltip="Distribución por nivel educativo alcanzado" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="petEduColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Fila 2: Pie asistencia + Pie alfabetismo -->
                  <div class="flex-1 min-h-0 grid grid-cols-2 gap-3" style="min-height:240px">

                    <!-- Pie: asistencia a centro de enseñanza -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <div class="flex items-start gap-1.5">
                          <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar por asistencia a un centro de enseñanza</p>
                        </div>
                        <button matTooltip="Distribución por asistencia a un centro de enseñanza" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-2">
                        <div echarts [options]="petAsistPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- Pie: alfabetismo -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <div class="flex items-start gap-1.5">
                          <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar por condición de alfabetismo</p>
                        </div>
                        <button matTooltip="Distribución por condición de alfabetismo" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-2">
                        <div echarts [options]="petAlfaPieOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                  </div><!-- /fila 2 -->

                  <!-- Fila 3: HBar TIC + HBar Internet -->
                  <div class="flex-1 min-h-0 grid grid-cols-2 gap-3" style="min-height:200px">

                    <!-- HBar: uso de dispositivos TIC's -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <div class="flex items-start gap-1.5">
                          <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar según uso de dispositivos TIC's</p>
                        </div>
                        <button matTooltip="Distribución según uso de dispositivos tecnológicos" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-2">
                        <div echarts [options]="petTicHBarOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                    <!-- HBar: uso de internet -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-b border-gray-50 flex items-start justify-between shrink-0">
                        <div class="flex items-start gap-1.5">
                          <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Población en edad de trabajar según uso de internet</p>
                        </div>
                        <button matTooltip="Distribución según uso de internet" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0">
                          <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5 text-gray-300"></app-hero-icon>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-2">
                        <div echarts [options]="petInternetHBarOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                  </div><!-- /fila 3 -->

                </div><!-- /cols 3+4 -->

              </div>
            </div>
          }

          <!-- ── HOGAR: 7 columnas × 5 filas (3 bloques) ─────────────────────── -->
          @if (sec.id === 'caract_servicios_hogares') {
            <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div class="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-7 gap-3 items-stretch lg:h-[700px] xl:h-[780px] 2xl:h-[860px]">

                <!-- ════ BLOQUE A: Columnas 1-2 ══════════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3 h-full">

                  <!-- Fila 1: KPI Hogares censados -->
                  <div class="rounded-xl shadow-sm overflow-hidden shrink-0" style="background:linear-gradient(to right,#0056a1,#33b3a9)">
                    <div class="px-4 py-3 flex items-center gap-3 relative">
                      <button matTooltip="Total de hogares registrados en el Censo de Población y Vivienda 2025" matTooltipClass="custom-tooltip"
                              class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                        <svg class="w-3 h-3 text-white/70 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                      <img src="dashboards/tematicos/hogares/hogar-censado.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      <div class="flex-1 min-w-0 pr-5">
                        <p class="text-[10px] font-bold leading-tight mb-1" style="color:#ffffff">Hogares censados</p>
                        <p class="text-2xl font-black tabular-nums leading-none" style="color:#ffffff">9 861 890</p>
                      </div>
                    </div>
                  </div>

                  <!-- Filas 2-3: Pie sexo del responsable -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%; min-height:200px">
                    <div class="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Hogares según sexo del responsable del hogar</p>
                      <button matTooltip="Distribución de hogares según el sexo del jefe o jefa de hogar" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0 ml-auto">
                        <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="hogSexoPieOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Filas 4-5: HBar tenencia de vivienda -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%; min-height:200px">
                    <div class="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Tenencia de la vivienda que ocupa el hogar</p>
                      <button matTooltip="Régimen de tenencia de la vivienda que ocupa el hogar" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0 ml-auto">
                        <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="hogTenenciaHBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /BLOQUE A -->

                <!-- ════ BLOQUE B: Columnas 3-4-5 ════════════════════════════════ -->
                <div class="col-span-3 flex flex-col gap-3 h-full">

                  <!-- Filas 1-2: HBar energía para cocinar -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%; min-height:200px">
                    <div class="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Hogares según tipo de energía o combustible que utilizan para cocinar</p>
                      <button matTooltip="Tipo de energía o combustible principal utilizado por el hogar para cocinar sus alimentos" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0 ml-auto">
                        <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="hogEnergiaHBarOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Filas 3-4: HBar eliminación residuos sólidos -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%; min-height:200px">
                    <div class="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Hogares según forma de eliminación de residuos sólidos</p>
                      <button matTooltip="Forma en que el hogar elimina sus residuos sólidos o basura" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0 ml-auto">
                        <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="hogResiduosHBarOpt" class="w-full h-full"></div>
                    </div>
                    <div class="px-3 pb-2 shrink-0">
                      <p class="text-[7px] text-gray-400 leading-tight">1/ Comprende residuos que se arrojan a la calle, parque, terreno abandonado, chacra, río, acequia, lago, laguna o mar, así como aquellos utilizados para alimentar animales y otras formas.</p>
                    </div>
                  </div>

                  <!-- Fila 5: KPI emigración (col 3) + Column emigrantes (cols 4-5) -->
                  <div class="flex gap-3" style="flex:1 1 0%; min-height:170px">

                    <!-- KPI hogares con emigrantes internacionales -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:1 1 0%">
                      <div class="px-3 py-3 flex items-start gap-2 relative flex-1">
                        <button matTooltip="Hogares con al menos un miembro que emigró al exterior en los últimos 5 años" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                        <img src="dashboards/tematicos/hogares/hogar-emigrantes.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] shrink-0">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[9px] font-bold leading-tight mb-2" style="color:#000000">Hogares con algún miembro en condición de emigrante internacional</p>
                          <p class="text-xl font-black tabular-nums leading-none" style="color:#000000">1 234 892</p>
                        </div>
                      </div>
                    </div>

                    <!-- Column hogares según N° de emigrantes -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%">
                      <div class="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
                        <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Hogares según número de miembros emigrantes internacionales</p>
                        <button matTooltip="Número de miembros emigrantes internacionales por hogar" matTooltipClass="custom-tooltip"
                                class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0 ml-auto">
                          <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                      <div class="flex-1 min-h-0 p-2">
                        <div echarts [options]="hogEmigrColOpt" class="w-full h-full"></div>
                      </div>
                    </div>

                  </div><!-- /Fila 5 Bloque B -->

                </div><!-- /BLOQUE B -->

                <!-- ════ BLOQUE C: Columnas 6-7 ═════════════════════════════════ -->
                <div class="col-span-2 flex flex-col gap-3 h-full">

                  <!-- Fila 1: KPI bienes TIC + KPI servicios TIC -->
                  <div class="flex gap-3 shrink-0">

                    <!-- KPI bienes TIC -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:1 1 0%">
                      <div class="px-3 py-3 flex items-center gap-2 relative">
                        <button matTooltip="Hogares que poseen al menos un bien TIC (televisor, radio, computadora, celular, etc.)" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                        <img src="dashboards/tematicos/hogares/hogar-con-tic.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] shrink-0">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[9px] font-bold leading-tight mb-2" style="color:#000000">Hogares con tenencia de bienes TIC's</p>
                          <p class="text-xl font-black tabular-nums leading-none" style="color:#000000">8 234 892</p>
                        </div>
                      </div>
                    </div>

                    <!-- KPI servicios TIC -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:1 1 0%">
                      <div class="px-3 py-3 flex items-center gap-2 relative">
                        <button matTooltip="Hogares que acceden a al menos un servicio TIC (internet, telefonía fija, TV cable, etc.)" matTooltipClass="custom-tooltip"
                                class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all">
                          <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                        <img src="dashboards/tematicos/hogares/hogar-acceso-tic.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px] shrink-0">
                        <div class="flex-1 min-w-0 pr-5">
                          <p class="text-[9px] font-bold leading-tight mb-2" style="color:#000000">Hogares con acceso a servicios TIC's</p>
                          <p class="text-xl font-black tabular-nums leading-none" style="color:#000000">6 847 293</p>
                        </div>
                      </div>
                    </div>

                  </div><!-- /Fila 1 Bloque C -->

                  <!-- Filas 2-3: Column artefactos y electrodomésticos -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%; min-height:200px">
                    <div class="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Hogares con tenencia de artefactos y electrodomésticos</p>
                      <button matTooltip="Hogares que poseen cada uno de los artefactos y electrodomésticos listados" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0 ml-auto">
                        <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="hogArtefactosColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                  <!-- Filas 4-5: Column medios de transporte -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style="flex:2 1 0%; min-height:200px">
                    <div class="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
                      <p class="text-[10px] font-bold leading-tight pr-3" style="color:#000000">Hogares con tenencia de medios de transporte</p>
                      <button matTooltip="Hogares que poseen cada uno de los medios de transporte listados" matTooltipClass="custom-tooltip"
                              class="w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all shrink-0 ml-auto">
                        <svg class="w-3 h-3 text-gray-300 hover:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                    <div class="flex-1 min-h-0 p-2">
                      <div echarts [options]="hogTransporteColOpt" class="w-full h-full"></div>
                    </div>
                  </div>

                </div><!-- /BLOQUE C -->

              </div><!-- /grid 7 cols -->
            </div>
          }

          <!-- ── SECCIONES GENÉRICAS: grids que ocupan todo el main ──────────── -->
          @if (sec.id !== 'fecundidad' && sec.id !== 'migracion' && sec.id !== 'identidad_proteccion' && sec.id !== 'educacion' && sec.id !== 'identidad_etnica' && sec.id !== 'discapacidad' && sec.id !== 'caract_tecnicas_viviendas' && sec.id !== 'caracteristicas_economicas' && sec.id !== 'caract_servicios_hogares') {
            <div class="flex-1 min-h-0 flex flex-col p-2 sm:p-3 md:p-4">
              <div [class]="sec.gridClass + ' gap-3 flex-1 min-h-0'"
                   style="grid-auto-rows: minmax(180px, 1fr); align-content: stretch;">
                @for (ind of sec.indicators; track ind.id) {
                  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                       [class]="getColSpanClass(ind.span)"
                       [style]="ind.minHeight ? 'min-height:' + ind.minHeight + 'px' : ''">
                    <div class="flex items-start gap-2.5 px-3 pt-3 pb-2.5 shrink-0 border-b border-gray-50">
                      @if (ind.type === 'kpi' || ind.type === 'kpi_list') {
                        <img src="dashboards/tematicos/genericos/genérico.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
                      }
                      <p class="flex-1 text-[10px] sm:text-[11px] font-black leading-snug pt-0.5 min-w-0" style="color:#000000">{{ ind.title }}</p>
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-50 transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4"
                                       [style]="'color:' + (activeGroup()?.color ?? '#0056a1') + '60'"></app-hero-icon>
                      </button>
                    </div>
                    <ng-container *ngTemplateOutlet="cardBodyTpl;context:{$implicit:ind,color:(activeGroup()?.color??'#0056a1')}"></ng-container>
                    <!-- ngTemplate handles all card body rendering -->
                  </div>
                }
              </div>
            </div>
          }

        }
      <!-- ══ NG-TEMPLATE: cuerpo de card (reutilizable) ═══════════════ -->
      <ng-template #cardBodyTpl let-ind let-color="color">

        <!-- KPI simple -->
        @if (ind.type === 'kpi') {
          <div class="flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3">
            <span class="text-4xl sm:text-5xl font-black tabular-nums tracking-tight leading-none" style="color:#000000">{{ ind.kpiValue ?? '—' }}</span>
           
            @if (ind.note) { <div class="mt-2 w-full bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5"><p class="text-[7.5px] text-amber-700 font-semibold leading-tight">{{ ind.note }}</p></div> }
          </div>
        }

        <!-- KPI con lista de sub-valores por tipo -->
        @if (ind.type === 'kpi_list') {
          <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div class="flex flex-col items-center py-2 px-3 shrink-0">
              <span class="text-3xl sm:text-4xl font-black tabular-nums tracking-tight leading-none" style="color:#000000">{{ ind.kpiValue ?? '—' }}</span>
              <span class="text-[7.5px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">años — promedio general</span>
            </div>
            <div class="h-px mx-3 bg-gray-100 shrink-0"></div>
            <div class="flex-1 min-h-0 overflow-y-auto px-3 py-1 flex flex-col gap-0.5">
              @for (cat of ind.categories ?? []; track cat; let ci = $index) {
                <div class="flex items-center gap-1.5 py-0.5">
                  <div class="w-1.5 h-1.5 rounded-full shrink-0" [style]="'background:'+getPieColor(ci)"></div>
                  <span class="flex-1 text-[7.5px] text-gray-500 leading-tight min-w-0">{{ cat }}</span>
                  <span class="text-[9.5px] font-black shrink-0 tabular-nums" style="color:#000000">{{ (ind.data ?? [])[ci] ?? '—' }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- HTML horizontal bar — nombre encima de barra de progreso -->
        @if (ind.type === 'hbar') {
          <div class="flex-1 min-h-0 overflow-y-auto px-3 pb-2 pt-1.5 flex flex-col gap-0.5">
            @for (cat of ind.categories ?? []; track cat; let ci = $index) {
              <div class="flex flex-col gap-0.5 py-0.5">
                <div class="flex items-start justify-between gap-1.5">
                  <span class="text-[8.5px] sm:text-[9px] font-semibold text-gray-600 leading-tight flex-1 min-w-0">{{ cat }}</span>
                  <span class="text-[9px] sm:text-[10px] font-black text-gray-800 shrink-0 tabular-nums">{{ fmt((ind.data ?? [])[ci] ?? 0) }}</span>
                </div>
                <div class="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                       [style]="'width:'+getHBarPct(ind.data??[],ci)+'%;background:linear-gradient(to right,'+color+','+lightenColor(color)+')'"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- HTML grouped horizontal bar — 2+ barras por categoría -->
        @if (ind.type === 'grouped_hbar') {
          <div class="flex-1 min-h-0 overflow-y-auto px-3 pb-2 pt-1.5 flex flex-col gap-1.5">
            @for (cat of ind.categories ?? []; track cat; let ci = $index) {
              <div class="flex flex-col gap-0.5">
                <span class="text-[8.5px] font-semibold text-gray-700 leading-tight">{{ cat }}</span>
                @for (serie of ind.series ?? []; track serie.name; let si = $index) {
                  <div class="flex items-center gap-1.5">
                    <span class="text-[7px] font-bold shrink-0 text-right" style="width:38px" [style]="'color:'+serie.color">{{ serie.name }}</span>
                    <div class="flex-1 relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                           [style]="'width:'+getGroupedPct(ind,ci,si)+'%;background:'+serie.color"></div>
                    </div>
                    <span class="text-[7.5px] font-black text-gray-700 shrink-0 tabular-nums" style="width:50px;text-align:right">{{ fmt((serie.data??[])[ci]??0) }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ECharts (bar, column, pie, stacked, grouped_bar, grouped_column) -->
        @if (ind.type !== 'kpi' && ind.type !== 'kpi_list' && ind.type !== 'hbar' && ind.type !== 'grouped_hbar' && isBrowser) {
          <div class="flex-1 min-h-0 px-1 pt-1 pb-2" style="min-height:160px">
            <div echarts [options]="getChartOpt(ind, color)" class="w-full h-full"></div>
          </div>
          @if (ind.note) {
            <div class="px-3 pb-2 shrink-0"><div class="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1"><p class="text-[7.5px] text-amber-700 font-semibold leading-tight">{{ ind.note }}</p></div></div>
          }
        }

      </ng-template>

      <!-- ── ng-template: cabecera de card Identidad y Protección Social ── -->
      <ng-template #identHeaderTpl let-ind let-clr="clr">
        <div class="flex items-start gap-2.5 px-3 pt-3 pb-2.5 shrink-0 border-b border-gray-50">
          <img src="dashboards/tematicos/genericos/genérico.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
          <p class="flex-1 text-[10px] sm:text-[11px] font-black leading-snug text-gray-700 pt-0.5 min-w-0">{{ ind.title }}</p>
          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                  class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-50 transition-all">
            <app-hero-icon [name]="'information-circle'" class="w-4 h-4" [style]="'color:' + clr + '60'"></app-hero-icon>
          </button>
        </div>
      </ng-template>

      <!-- ── ng-template: cabecera de card Discapacidad ─────────────────── -->
      <ng-template #discHeaderTpl let-ind>
        <div class="flex items-start gap-2.5 px-3 pt-3 pb-2.5 shrink-0 border-b border-gray-50">
          <img src="dashboards/tematicos/genericos/genérico.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
          <p class="flex-1 text-[10px] sm:text-[11px] font-black leading-snug text-gray-700 pt-0.5 min-w-0">{{ ind.title }}</p>
          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                  class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-50 transition-all">
            <app-hero-icon [name]="'information-circle'" class="w-4 h-4" style="color:#0056a160"></app-hero-icon>
          </button>
        </div>
      </ng-template>

      <!-- ── ng-template: cabecera de card Viviendas ────────────────────── -->
      <ng-template #vivHeaderTpl let-ind>
        <div class="flex items-start gap-2.5 px-3 pt-3 pb-2.5 shrink-0 border-b border-gray-50">
          <img src="dashboards/tematicos/genericos/genérico.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
          <p class="flex-1 text-[10px] sm:text-[11px] font-black leading-snug text-gray-700 pt-0.5 min-w-0">{{ ind.title }}</p>
          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                  class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-50 transition-all">
            <app-hero-icon [name]="'information-circle'" class="w-4 h-4" style="color:#33b3a960"></app-hero-icon>
          </button>
        </div>
      </ng-template>

      <!-- ── ng-template: cabecera de card Características Económicas ───── -->
      <ng-template #econHeaderTpl let-ind let-ci="ci">
        <div class="flex items-start gap-2.5 px-3 pt-3 pb-2.5 shrink-0 border-b border-gray-50">
          <img src="dashboards/tematicos/genericos/genérico.svg" class="w-[49px] h-[49px] md:w-[54px] md:h-[54px]">
          <p class="flex-1 text-[10px] sm:text-[11px] font-black leading-snug text-gray-700 pt-0.5 min-w-0">{{ ind.title }}</p>
          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                  class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-50 transition-all">
            <app-hero-icon [name]="'information-circle'" class="w-4 h-4"
                           [style]="'color:' + getEconColor(ci) + '60'"></app-hero-icon>
          </button>
        </div>
      </ng-template>

      </main><!-- /main -->

    </section>
    `,
    styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    /* ── grid-auto-rows:1fr requiere align-content:stretch (default) ─────── */
    /* ── Para que los gráficos echarts con h-full funcionen en todos los browsers */
    main > div { box-sizing: border-box; }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    ::ng-deep .custom-tooltip {
      background-color: white !important; color: #333 !important;
      border-radius: 10px !important; padding: 8px 12px !important;
      font-size: 11px !important; font-weight: 600 !important;
      box-shadow: 0 8px 12px -2px rgba(0,0,0,.1) !important;
      border: 1px solid #e5e7eb !important;
    }
  `],
})
export class DashboardTematicoComponent implements OnInit {

    // ── Constantes expuestas al template ─────────────────────────────────
    readonly thematicGroups        = THEMATIC_GROUPS;
    readonly identidadColumnGroups = IDENTIDAD_COLUMN_GROUPS;
    readonly identidadWideIds      = IDENTIDAD_WIDE_IDS;

    private readonly sectionIconMap: Record<string, string> = {
        fecundidad:                 'dashboards/tematicos/fecundidad.svg',
        migracion:                  'dashboards/tematicos/migracion.svg',
        identidad_proteccion:       'dashboards/tematicos/identidad.svg',
        educacion:                  'dashboards/tematicos/educacion.svg',
        discapacidad:               'dashboards/tematicos/discapacidad.svg',
        identidad_etnica:           'dashboards/tematicos/etnicidad.svg',
        caracteristicas_economicas: 'dashboards/tematicos/pet.svg',
    };

    getSectionIcon(id: string): string {
        return this.sectionIconMap[id] ?? '';
    }

    // ── Header ───────────────────────────────────────────────────────────
    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);

    readonly censosMenu = [
        { label: 'Censo de Derecho',          route: '/censo-derecho' },
        { label: 'Características técnicas',  route: '/aspectos-generales' },
        { label: 'Innovaciones tecnológicas', route: '/innovaciones' },
        { label: 'Normatividad censal',        route: '/normativa' },
        { label: 'Actividades censales',        route: '/actividades' },
        { label: 'Documentación Técnica',      route: '/documentacion-tecnica' },
    ];

    @HostListener('document:click')
    onDocumentClick(): void { this.censosOpen.set(false); this.mobileMenuOpen.set(false); }
    toggleCensos(e: Event): void     { e.stopPropagation(); this.censosOpen.update(v => !v); }
    toggleMobileMenu(e: Event): void { e.stopPropagation(); this.mobileMenuOpen.update(v => !v); }

    // ── View tabs (barra de filtros — Ind. Principales) ──────────────────
    readonly viewTabs = [
        { label: 'Indicadores',             icon: 'chart-bar',         route: '/dashboard-censada' },
        { label: 'Comparativo territorial', icon: 'map',               route: '/dashboard-territorial' },
        { label: 'Evolución',               icon: 'arrow-trending-up', route: '/dashboard-evolucion' },
    ];

    // ── Temátic tabs (barra de filtros — Ind. Temáticos) ─────────────────
    readonly tematicTabs = [
        { label: 'Indicadores temáticos', icon: 'squares-2x2', route: '/dashboard-tematico' },
        { label: 'Educación',             icon: 'academic-cap',  route: '/dashboard-educacion' },
        { label: 'Salud',                 icon: 'heart',          route: '/dashboard-salud' },
        { label: 'Economía',              icon: 'banknotes',      route: '/dashboard-economia' },
    ];

    // ── Sección expandida en barra de filtros ─────────────────────────────
    expandedSection = signal<'principales' | 'tematicos' | null>('tematicos');

    toggleNavSection(section: 'principales' | 'tematicos'): void {
        this.expandedSection.update(v => v === section ? null : section);
    }

    isViewTabActive(route: string): boolean {
        return this.router.url === route || this.router.url.startsWith(route + '/');
    }

    // ── Botonera de secciones ─────────────────────────────────────────────
    readonly navSections = [
        { id: 'poblacion_total',     label: 'Indicadores de población total',                icon: 'chart-bar', route: '/dashboard' },
        { id: 'poblacion_viviendas', label: 'Indicadores de población y viviendas censadas', icon: 'home',      route: '/dashboard-censada' },
    ];

    isBtnActive(btn: { id: string; route?: string }): boolean {
        const url = this.router.url;
        if (btn.id === 'poblacion_viviendas') {
            const subRoutes = ['/dashboard-censada', '/dashboard-territorial', '/dashboard-evolucion', '/dashboard-tematico'];
            return subRoutes.some(r => url === r || url.startsWith(r + '/'));
        }
        return url === btn.route || url.startsWith((btn.route ?? '') + '/');
    }

    // ── Estado de grupos y secciones temáticas ────────────────────────────
    activeGroupId   = signal<string>('poblacion');
    activeSectionId = signal<string>('fecundidad');

    activeGroup = computed<ThematicGroupDef | undefined>(
        () => THEMATIC_GROUPS.find(g => g.id === this.activeGroupId()),
    );

    activeSection = computed<ThematicSectionDef | undefined>(() => {
        const grp = this.activeGroup();
        if (!grp) return undefined;
        return grp.sections.find(s => s.id === this.activeSectionId());
    });

    setActiveGroup(groupId: string): void {
        if (this.activeGroupId() === groupId) return;
        this.activeGroupId.set(groupId);
        const grp = THEMATIC_GROUPS.find(g => g.id === groupId);
        if (grp?.sections.length) {
            this.activeSectionId.set(grp.sections[0].id);
        }
    }

    setActiveSection(sectionId: string): void {
        this.activeSectionId.set(sectionId);
    }

    // ── Helpers: Fecundidad ───────────────────────────────────────────────
    getFecundidadColor(i: number): string {
        return (['#0056a1', '#038dd3', '#33b3a9', '#038dd3', '#0056a1'] as const)[i] ?? '#0056a1';
    }
    getFecundidadGradient(i: number): string {
        return (['#0056a1,#038dd3', '#038dd3,#33b3a9', '#33b3a9,#038dd3', '#038dd3,#0056a1', '#0056a1,#33b3a9'] as const)[i] ?? '#0056a1,#038dd3';
    }
    getFecundidadIcon(i: number): string {
        return (['user-group', 'heart', 'check-circle', 'user', 'exclamation-circle'] as const)[i] ?? 'chart-bar';
    }

    // ── Fecundidad: constructores de gráficos ─────────────────────────────
    private buildFecuHijosEdadOpt(): EChartsOption {
        const ages = [...FECU_AGE].reverse();
        const con  = [...FECU_CON_HIJOS].reverse();
        const sin  = [...FECU_SIN_HIJOS].reverse();
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:10px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:9px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#424242">${(it.value as number).toFixed(1)}%</span></div>`;
                    });
                    return h;
                },
            },
            legend: { data: ['Con hijos', 'Sin hijos'], top: 2, left: 'center', textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8 },
            grid: { top: 26, right: 8, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: 0, max: 100,
                axisLabel: { fontSize: 7, color: '#424242', formatter: (v: number) => `${v}%` },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: ages,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242' },
            },
            series: [
                { name: 'Con hijos', type: 'bar', stack: 'total', data: con,
                  label: { show: true, position: 'inside' as const, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                           formatter: (p: any) => `${(p.value as number).toFixed(1)}%` },
                  itemStyle: { color: '#038dd3', borderRadius: [0,0,0,0] },
                  barMaxWidth: 20, emphasis: { focus: 'series' as const } },
                { name: 'Sin hijos', type: 'bar', stack: 'total', data: sin,
                  label: { show: true, position: 'inside' as const, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                           formatter: (p: any) => `${(p.value as number).toFixed(1)}%` },
                  itemStyle: { color: '#caeae4', borderRadius: [0,3,3,0] as [number,number,number,number] },
                  barMaxWidth: 20, emphasis: { focus: 'series' as const } },
            ],
        };
    }

    private buildFecuPromEdadOpt(): EChartsOption {
        const ages = [...FECU_AGE].reverse();
        const data = [...FECU_PROM_EDAD].reverse();
        return {
            tooltip: {
                trigger: 'axis', backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:10px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:13px;font-weight:900;color:#424242">${(p.value as number).toFixed(1)} hijos</span>`;
                },
            },
            grid: { top: 10, right: 28, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: 0,
                axisLabel: { fontSize: 7, color: '#424242', formatter: (v: number) => v.toFixed(1) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: ages,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242' },
            },
            series: [{
                type: 'bar', data,
                label: { show: true, position: 'right' as const, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => (p.value as number).toFixed(1) },
                itemStyle: {
                    color: '#038dd3',
                    borderRadius: [0,4,4,0] as [number,number,number,number],
                },
                barMaxWidth: 20, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildFecuEstCivilOpt(): EChartsOption {
        const cats = [...FECU_EC_CATS].reverse();
        const data = [...FECU_EC_PROM].reverse();
        // Colores por categoría (mismo orden que FECU_EC_CATS, luego invertido junto con cats/data)
        const colors = ['#0056a1', '#038dd3', '#4c8c80', '#33b3a9', '#caeae4', '#8383fd'].reverse();
        return {
            tooltip: {
                trigger: 'axis', backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:10px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:13px;font-weight:900;color:#424242">${(p.value as number).toFixed(1)} hijos</span>`;
                },
            },
            grid: { top: 10, right: 28, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: 0,
                axisLabel: { fontSize: 7, color: '#424242', formatter: (v: number) => v.toFixed(1) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242' },
            },
            series: [{
                type: 'bar', data,
                label: { show: true, position: 'right' as const, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => (p.value as number).toFixed(1) },
                itemStyle: {
                    color: (params: any) => colors[params.dataIndex],
                    borderRadius: [0,4,4,0] as [number,number,number,number],
                },
                barMaxWidth: 20, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    // ── Helpers: Migración ────────────────────────────────────────────────
    getMigracionCharts(section: ThematicSectionDef): ThematicIndicatorDef[] {
        return section.indicators.filter(i => i.type !== 'kpi') as ThematicIndicatorDef[];
    }
    getMigracionKpis(section: ThematicSectionDef): ThematicIndicatorDef[] {
        return section.indicators.filter(i => i.type === 'kpi') as ThematicIndicatorDef[];
    }
    getMigracionChartColor(i: number): string {
        return (['#0056a1', '#33b3a9'] as const)[i % 2] ?? '#0056a1';
    }
    getMigracionKpiColor(i: number): string {
        return (['#038dd3', '#0056a1'] as const)[i % 2] ?? '#038dd3';
    }
    getMigracionKpiGradient(i: number): string {
        return (['#038dd3,#33b3a9', '#0056a1,#038dd3'] as const)[i % 2] ?? '#038dd3,#33b3a9';
    }

    // ── Migración: constructores de gráficos ──────────────────────────────
    private buildMigrSexoPieOpt(): EChartsOption {
        const cats   = ['Hombre', 'Mujer'];
        const data   = [1_420_000, 1_427_293];
        const colors = [CLR.blue, CLR.teal];
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:11px;font-weight:900;color:${colors[p.dataIndex]}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${p.percent?.toFixed(1)}%)</span>`,
            },
            legend: {
                orient: 'horizontal', bottom: 0, left: 'center',
                textStyle: { fontSize: 7, color: '#424242' }, itemWidth: 8, itemHeight: 8,
                formatter: (name: string) => { const idx = cats.indexOf(name); return idx >= 0 ? `${name}: ${this.fmt(data[idx])}` : name; },
            },
            series: [{
                type: 'pie', radius: ['30%', '62%'], center: ['50%', '44%'], avoidLabelOverlap: true,
                data: cats.map((name, i) => ({ name, value: data[i], itemStyle: { color: colors[i] } })),
                label: { show: false }, labelLine: { show: false },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    private buildMigrGruposEdadOpt(): EChartsOption {
        const cats = [...MIGR_GRUPOS_EDAD];
        const data = [...MIGR_GRUPOS_EDAD_DATA];
        const gruposColores = ['#038dd3', '#caeae4', '#8383fd'];
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${gruposColores[p.dataIndex]}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 28, left: 4, containLabel: true },
            xAxis: {
                type: 'category', data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break', width: 55 },
            },
            yAxis: {
                type: 'value',
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            series: [{
                type: 'bar',
                data: data.map((v, i) => ({
                    value: v,
                    itemStyle: { color: gruposColores[i], borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
                })),
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                itemStyle: { borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
                barMaxWidth: 40, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildMigrPiramideOpt(): EChartsOption {
        const grupos = [...MIGR_PIRAMIDE_GRUPOS];
        const hombreNeg = MIGR_PIRAMIDE_HOMBRE.map(v => -v);
        const mujer     = [...MIGR_PIRAMIDE_MUJER];
        const maxVal    = Math.max(...MIGR_PIRAMIDE_HOMBRE, ...MIGR_PIRAMIDE_MUJER);
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:9px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#111">${this.fmt(Math.abs(it.value as number))}</span></div>`;
                    });
                    return h;
                },
            },
            legend: {
                data: ['Hombre', 'Mujer'], top: 4, right: 8,
                textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8,
            },
            grid: { top: 28, right: 12, bottom: 16, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: -maxVal * 1.15, max: maxVal * 1.15,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(Math.abs(v)) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: grupos,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [
                {
                    name: 'Hombre', type: 'bar', stack: 'total', data: hombreNeg,
                    itemStyle: { color: CLR.blue, borderRadius: [2, 0, 0, 2] as [number, number, number, number] },
                    barMaxWidth: 18, label: { show: false }, emphasis: { focus: 'series' as const },
                },
                {
                    name: 'Mujer', type: 'bar', stack: 'total', data: mujer,
                    itemStyle: { color: CLR.teal, borderRadius: [0, 2, 2, 0] as [number, number, number, number] },
                    barMaxWidth: 18, label: { show: false }, emphasis: { focus: 'series' as const },
                },
            ],
        };
    }

    private buildMigrSeguroOpt(): EChartsOption {
        const cats: string[] = [...MIGR_SEGURO];
        const data           = [...MIGR_SEGURO_DATA];
        const colors = [CLR.blue, '#33b3a9'];
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:11px;font-weight:900;color:${colors[p.dataIndex]}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${p.percent?.toFixed(1)}%)</span>`,
            },
            legend: {
                orient: 'horizontal', bottom: 0, left: 'center',
                textStyle: { fontSize: 7, color: '#424242', overflow: 'break', width: 90 } as any,
                itemWidth: 8, itemHeight: 8,
                formatter: (name: string) => { const idx = cats.indexOf(name); return idx >= 0 ? `${name}: ${this.fmt(data[idx])}` : name; },
            },
            series: [{
                type: 'pie', radius: ['30%', '62%'], center: ['50%', '42%'], avoidLabelOverlap: true,
                data: cats.map((name, i) => ({ name, value: data[i], itemStyle: { color: colors[i] } })),
                label: { show: false }, labelLine: { show: false },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    private buildMigrNivelEduOpt(): EChartsOption {
        const cats = [...MIGR_NIVEL_EDU].reverse();
        const data = [...MIGR_NIVEL_EDU_DATA].reverse();
        return {
            tooltip: {
                trigger: 'axis', backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 48, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', overflow: 'break', width: 85 },
            },
            series: [{
                type: 'bar', data,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                itemStyle: {
                    color: '#038dd3',
                    borderRadius: [0, 4, 4, 0] as [number, number, number, number],
                },
                barMaxWidth: 20, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildMigrPaisesOpt(): EChartsOption {
        const cats = [...MIGR_PAISES].reverse();
        const data = [...MIGR_PAISES_DATA].reverse();
        const paisesColores: Record<string, string> = {
            'Venezuela': '#0056a1', 'Argentina': '#038dd3', 'Chile': '#4c8c80',
            'Colombia': '#33b3a9', 'Bolivia': '#caeae4', 'Estados Unidos': '#8383fd',
        };
        return {
            tooltip: {
                trigger: 'axis', backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${paisesColores[p.name] ?? CLR.teal}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 48, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [{
                type: 'bar',
                data: cats.map((cat, i) => ({
                    value: data[i],
                    itemStyle: { color: paisesColores[cat] ?? CLR.teal, borderRadius: [0, 4, 4, 0] as [number, number, number, number] },
                })),
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                itemStyle: { borderRadius: [0, 4, 4, 0] as [number, number, number, number] },
                barMaxWidth: 20, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    // ── Identidad y Protección Social: builders ──────────────────────────
    private buildIdentEstCivColOpt(): EChartsOption {
        const colors = [CLR.blue, CLR.sky, CLR.teal, CLR.purple, '#038dd3'];
        const data = [...ESTCIV_COL_DATA].map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i], borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...ESTCIV_COL_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242', interval: 0 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 36,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildIdentEstCivPirOpt(): EChartsOption {
        const hombreNeg = [...ESTCIV_PIR_HOMBRE].map(v => -v);
        const maxVal    = Math.max(...ESTCIV_PIR_HOMBRE, ...ESTCIV_PIR_MUJER);
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:9px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#111">${this.fmt(Math.abs(it.value as number))}</span></div>`;
                    });
                    return h;
                },
            },
            legend: {
                data: ['Hombre', 'Mujer'], top: 2, right: 6,
                textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8,
            },
            grid: { top: 24, right: 10, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: -maxVal * 1.15, max: maxVal * 1.15,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(Math.abs(v)) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: [...ESTCIV_PIR_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [
                {
                    name: 'Hombre', type: 'bar' as const, stack: 'total', data: hombreNeg,
                    itemStyle: { color: CLR.blue, borderRadius: [2, 0, 0, 2] as [number, number, number, number] },
                    barMaxWidth: 18, label: { show: false }, emphasis: { focus: 'series' as const },
                },
                {
                    name: 'Mujer', type: 'bar' as const, stack: 'total', data: [...ESTCIV_PIR_MUJER],
                    itemStyle: { color: CLR.teal, borderRadius: [0, 2, 2, 0] as [number, number, number, number] },
                    barMaxWidth: 18, label: { show: false }, emphasis: { focus: 'series' as const },
                },
            ],
        };
    }

    private buildIdentEstCivEdadOpt(): EChartsOption {
        const cats   = [...ESTCIV_EDAD_CATS].reverse();
        const totals = ESTCIV_EDAD_CATS.map((_, i) =>
            ESTCIV_ACTUALMENTE[i] + ESTCIV_ANTERIORM[i] + ESTCIV_NUNCA[i]);
        const act = [...ESTCIV_ACTUALMENTE].map((v, i) => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const ant = [...ESTCIV_ANTERIORM].map((v, i)   => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const nun = [...ESTCIV_NUNCA].map((v, i)        => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const lblFmt = (p: any) => (p.value as number) >= 6 ? `${(p.value as number).toFixed(1)}%` : '';
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:10px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:9px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#424242">${(it.value as number).toFixed(1)}%</span></div>`;
                    });
                    return h;
                },
            },
            legend: {
                data: ['Actualmente unidos', 'Anteriormente unidos', 'Nunca unidos'],
                top: 2, left: 'center' as const,
                textStyle: { fontSize: 7, color: '#424242' }, itemWidth: 8, itemHeight: 8,
            },
            grid: { top: 26, right: 8, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0, max: 100,
                axisLabel: { fontSize: 7, color: '#424242', formatter: (v: number) => `${v}%` },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242' },
            },
            series: [
                { name: 'Actualmente unidos', type: 'bar' as const, stack: 'total', data: act,
                  label: { show: true, position: 'inside' as const, fontSize: 8, fontWeight: 700 as const, color: '#fff', formatter: lblFmt },
                  itemStyle: { color: '#038dd3' }, barMaxWidth: 20, emphasis: { focus: 'series' as const } },
                { name: 'Anteriormente unidos', type: 'bar' as const, stack: 'total', data: ant,
                  label: { show: true, position: 'inside' as const, fontSize: 8, fontWeight: 700 as const, color: '#424242', formatter: lblFmt },
                  itemStyle: { color: '#caeae4' }, barMaxWidth: 20, emphasis: { focus: 'series' as const } },
                { name: 'Nunca unidos', type: 'bar' as const, stack: 'total', data: nun,
                  label: { show: true, position: 'inside' as const, fontSize: 8, fontWeight: 700 as const, color: '#fff', formatter: lblFmt },
                  itemStyle: { color: '#8383fd', borderRadius: [0, 3, 3, 0] as [number, number, number, number] },
                  barMaxWidth: 20, emphasis: { focus: 'series' as const } },
            ],
        };
    }

    private buildIdentDniPieOpt(conVal: number, sinVal: number, color: string): EChartsOption {
        const total = conVal + sinVal;
        const pct = ((conVal / total) * 100).toFixed(1).replace('.', ',');
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:11px;font-weight:900;color:${color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            graphic: [{
                type: 'text',
                left: 'center', top: '36%',
                style: { text: `${pct}%`, fontSize: 13, fontWeight: 'bold' as const, fill: '#1f2937' },
            }],
            series: [{
                type: 'pie', radius: ['38%', '64%'], center: ['50%', '50%'],
                avoidLabelOverlap: true,
                data: [
                    { name: 'Con documento', value: conVal, itemStyle: { color } },
                    { name: 'Sin documento', value: sinVal, itemStyle: { color: '#e5e7eb' } },
                ],
                label: { show: false }, labelLine: { show: false },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    private buildIdentDniEdadOpt(): EChartsOption {
        const data = [...DNI_EDAD_DATA].map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [4, 4, 0, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 20, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...DNI_EDAD_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data, barMaxWidth: 32,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildIdentDocInmigrOpt(): EChartsOption {
        const data = [...DOC_INMIGR_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#caeae4', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 20, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...DOC_INMIGR_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate: 28,
                             overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data, barMaxWidth: 36,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildIdentSegEdadOpt(): EChartsOption {
        const data = [...SEG_EDAD_DATA].map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [4, 4, 0, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 20, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...SEG_EDAD_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data, barMaxWidth: 32,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildIdentSegTipoOpt(): EChartsOption {
        const data = [...SEG_TIPO_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#8383fd', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 20, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...SEG_TIPO_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate: 20,
                             overflow: 'break' as const, width: 80 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data, barMaxWidth: 44,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    // ── Educación: builders ───────────────────────────────────────────────
    private buildEduNivelHbarOpt(): EChartsOption {
        const cats = [...EDU_NIVEL_CATS].reverse();
        const data = [...EDU_NIVEL_DATA].reverse();
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 48, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [{
                type: 'bar' as const, data,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                itemStyle: {
                    color: '#038dd3',
                    borderRadius: [0, 4, 4, 0] as [number, number, number, number],
                },
                barMaxWidth: 18, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildEduNivelSexColOpt(): EChartsOption {
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:9px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#111">${this.fmt(it.value)}</span></div>`;
                    });
                    return h;
                },
            },
            legend: {
                data: ['Hombre', 'Mujer'], top: 2, right: 6,
                textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8,
            },
            grid: { top: 26, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...EDU_NIV_SEX_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate: 22,
                             overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [
                {
                    name: 'Hombre', type: 'bar' as const, data: [...EDU_NIV_SEX_HOMBRE],
                    itemStyle: { color: CLR.blue, borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
                    barMaxWidth: 18, emphasis: { focus: 'series' as const },
                },
                {
                    name: 'Mujer', type: 'bar' as const, data: [...EDU_NIV_SEX_MUJER],
                    itemStyle: { color: CLR.teal, borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
                    barMaxWidth: 18, emphasis: { focus: 'series' as const },
                },
            ],
        };
    }

    private buildEduAsist2BarColOpt(hVal: number, mVal: number): EChartsOption {
        const maxV = Math.max(hVal, mVal);
        const yMax = maxV < 20 ? 25 : maxV < 70 ? Math.ceil(maxV / 10) * 10 + 8 : 105;
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${(p.value as number).toFixed(1).replace('.', ',')}%</span>`;
                },
            },
            grid: { top: 22, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: ['Hombre', 'Mujer'],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 9, color: '#424242' },
            },
            yAxis: {
                type: 'value' as const, min: 0, max: yMax,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => v + '%' },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{
                type: 'bar' as const, barMaxWidth: 56,
                data: [
                    { value: hVal, itemStyle: { color: CLR.blue, borderRadius: [4, 4, 0, 0] as [number, number, number, number] } },
                    { value: mVal, itemStyle: { color: CLR.teal, borderRadius: [4, 4, 0, 0] as [number, number, number, number] } },
                ],
                label: { show: true, position: 'top' as const, fontSize: 10, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => `${(p.value as number).toFixed(1).replace('.', ',')}%` },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildEduPctHbarOpt(cats: readonly string[], data: readonly number[], color: string): EChartsOption {
        const reversed_cats = [...cats].reverse();
        const reversed_data = [...data].reverse();
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${color}">${(p.value as number).toFixed(1).replace('.', ',')}%</span>`;
                },
            },
            grid: { top: 6, right: 44, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0, max: 100,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => v + '%' },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: reversed_cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [{
                type: 'bar' as const, data: reversed_data,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => `${(p.value as number).toFixed(1).replace('.', ',')}%` },
                itemStyle: {
                    color,
                    borderRadius: [0, 4, 4, 0] as [number, number, number, number],
                },
                barMaxWidth: 20, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    // ── Discapacidad: builders ────────────────────────────────────────────
    private buildDiscPiramideOpt(): EChartsOption {
        const cats      = [...DISC_PIR_CATS];
        const hombreNeg = [...DISC_PIR_HOMBRE].map(v => -v);
        const maxVal    = Math.max(...DISC_PIR_HOMBRE, ...DISC_PIR_MUJER);
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:9px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#111">${this.fmt(Math.abs(it.value as number))}</span></div>`;
                    });
                    return h;
                },
            },
            legend: {
                data: ['Hombre', 'Mujer'], top: 2, right: 6,
                textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8,
            },
            grid: { top: 24, right: 10, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: -maxVal * 1.15, max: maxVal * 1.15,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(Math.abs(v)) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [
                {
                    name: 'Hombre', type: 'bar' as const, stack: 'total', data: hombreNeg,
                    itemStyle: { color: CLR.blue, borderRadius: [2, 0, 0, 2] as [number, number, number, number] },
                    barMaxWidth: 16, label: { show: false }, emphasis: { focus: 'series' as const },
                },
                {
                    name: 'Mujer', type: 'bar' as const, stack: 'total', data: [...DISC_PIR_MUJER],
                    itemStyle: { color: CLR.teal, borderRadius: [0, 2, 2, 0] as [number, number, number, number] },
                    barMaxWidth: 16, label: { show: false }, emphasis: { focus: 'series' as const },
                },
            ],
        };
    }

    private buildDiscSeguroColOpt(): EChartsOption {
        const data = [...DISC_SEGURO_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#038dd3', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 20, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...DISC_SEGURO_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate: 18,
                             overflow: 'break' as const, width: 80 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data, barMaxWidth: 44,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildDiscEduColOpt(): EChartsOption {
        const data = [...DISC_EDU_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#caeae4', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#caeae4">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 20, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...DISC_EDU_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate: 22,
                             overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data, barMaxWidth: 36,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildDiscAsistPieOpt(): EChartsOption {
        const cats: string[] = ['Sí asiste', 'No asiste'];
        const data = [89_293, 47_892];
        const colors = [CLR.sky, '#b9e3f4'];
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:11px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const, bottom: 4, left: 'center' as const,
                textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8,
            },
            series: [{
                type: 'pie', radius: ['34%', '62%'], center: ['50%', '44%'],
                data: cats.map((name, i) => ({ name, value: data[i], itemStyle: { color: colors[i] } })),
                label: {
                    show: true, fontSize: 9, fontWeight: 700 as const,
                    formatter: (p: any) => `${p.name}\n${(p.percent as number).toFixed(1).replace('.', ',')}%`,
                    color: '#424242',
                },
                labelLine: { show: true, length: 8, length2: 12 },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    private buildDiscEsferasHbarOpt(): EChartsOption {
        const cats = [...DISC_ESFERAS_CATS].reverse();
        const totals = DISC_ESFERAS_CATS.map((_, i) => DISC_ESFERAS_HOMBRE[i] + DISC_ESFERAS_MUJER[i]);
        const hom = [...DISC_ESFERAS_HOMBRE].map((v, i) => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const muj = [...DISC_ESFERAS_MUJER].map((v, i)  => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const lblFmt = (p: any) => (p.value as number) >= 6 ? `${(p.value as number).toFixed(1)}%` : '';
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:10px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:9px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#424242">${(it.value as number).toFixed(1)}%</span></div>`;
                    });
                    return h;
                },
            },
            legend: { data: ['Hombre', 'Mujer'], bottom: 0, left: 'center', textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8 },
            grid: { top: 6, right: 8, bottom: 26, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: 0, max: 100,
                axisLabel: { fontSize: 7, color: '#424242', formatter: (v: number) => `${v}%` },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242' },
            },
            series: [
                { name: 'Hombre', type: 'bar', stack: 'total', data: hom,
                  label: { show: true, position: 'inside', fontSize: 8, fontWeight: 700, color: '#fff', formatter: lblFmt },
                  itemStyle: { color: CLR.blue, borderRadius: [0, 0, 0, 0] },
                  barMaxWidth: 20, emphasis: { focus: 'series' } },
                { name: 'Mujer', type: 'bar', stack: 'total', data: muj,
                  label: { show: true, position: 'inside', fontSize: 8, fontWeight: 700, color: '#424242', formatter: lblFmt },
                  itemStyle: { color: '#caeae4', borderRadius: [0, 3, 3, 0] as [number, number, number, number] },
                  barMaxWidth: 20, emphasis: { focus: 'series' } },
            ],
        };
    }

    private buildDiscEsferasEdadOpt(): EChartsOption {
        const cats   = [...DISC_ESFERAS_CATS].reverse();
        const totals = DISC_ESFERAS_CATS.map((_, i) =>
            DISC_ESFERAS_5_17[i] + DISC_ESFERAS_18_59[i] + DISC_ESFERAS_60MAS[i]);
        const j  = [...DISC_ESFERAS_5_17].map((v, i)  => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const a  = [...DISC_ESFERAS_18_59].map((v, i) => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const m  = [...DISC_ESFERAS_60MAS].map((v, i) => +((v / totals[i]) * 100).toFixed(1)).reverse();
        const lblFmt = (p: any) => (p.value as number) >= 6 ? `${(p.value as number).toFixed(1)}%` : '';
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let h = `<div style="font-size:10px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((it: any) => {
                        h += `<div style="display:flex;align-items:center;gap:4px;font-size:9px;margin-bottom:1px">
                            <span style="width:8px;height:8px;border-radius:2px;background:${it.color};display:inline-block;flex-shrink:0"></span>
                            <span style="color:#424242;flex:1">${it.seriesName}</span>
                            <span style="font-weight:900;color:#424242">${(it.value as number).toFixed(1)}%</span></div>`;
                    });
                    return h;
                },
            },
            legend: { data: ['5 - 17 años', '18 - 59 años', '60 y más años'], bottom: 0, left: 'center',
                      textStyle: { fontSize: 8, color: '#424242' }, itemWidth: 8, itemHeight: 8 },
            grid: { top: 6, right: 8, bottom: 30, left: 4, containLabel: true },
            xAxis: {
                type: 'value', min: 0, max: 100,
                axisLabel: { fontSize: 7, color: '#424242', formatter: (v: number) => `${v}%` },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            yAxis: {
                type: 'category', data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242' },
            },
            series: [
                { name: '5 - 17 años', type: 'bar', stack: 'total', data: j,
                  label: { show: true, position: 'inside', fontSize: 8, fontWeight: 700, color: '#fff', formatter: lblFmt },
                  itemStyle: { color: CLR.blue, borderRadius: [0, 0, 0, 0] },
                  barMaxWidth: 20, emphasis: { focus: 'series' } },
                { name: '18 - 59 años', type: 'bar', stack: 'total', data: a,
                  label: { show: true, position: 'inside', fontSize: 8, fontWeight: 700, color: '#fff', formatter: lblFmt },
                  itemStyle: { color: CLR.sky, borderRadius: [0, 0, 0, 0] },
                  barMaxWidth: 20, emphasis: { focus: 'series' } },
                { name: '60 y más años', type: 'bar', stack: 'total', data: m,
                  label: { show: true, position: 'inside', fontSize: 8, fontWeight: 700, color: '#424242', formatter: lblFmt },
                  itemStyle: { color: '#caeae4', borderRadius: [0, 3, 3, 0] as [number, number, number, number] },
                  barMaxWidth: 20, emphasis: { focus: 'series' } },
            ],
        };
    }

    // ── Helpers: Etnicidad ────────────────────────────────────────────────

    private buildEtnicHBarOpt(cats: string[], data: number[]): EChartsOption {
        const revCats = [...cats].reverse();
        const revData = [...data].reverse().map(v => ({
            value: v,
            itemStyle: { color: '#038dd3', borderRadius: [0, 3, 3, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 56, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: revCats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', width: 110, overflow: 'break' as const },
            },
            series: [{
                type: 'bar' as const, data: revData,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                barMaxWidth: 18, emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildEtnicSexoPieOpt(hombreVal: number, mujerVal: number, color1: string, color2: string): EChartsOption {
        const total  = hombreVal + mujerVal;
        const hPct   = (hombreVal / total * 100).toFixed(1).replace('.', ',');
        const mPct   = (mujerVal  / total * 100).toFixed(1).replace('.', ',');
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const,
                bottom: 4, left: 'center' as const,
                textStyle: { fontSize: 9, color: '#424242', fontWeight: 700 as const },
                itemWidth: 10, itemHeight: 10, itemGap: 16,
                formatter: (name: string) =>
                    name === 'Hombre'
                        ? `Hombre  ${hPct}%`
                        : `Mujer  ${mPct}%`,
            },
            series: [{
                type: 'pie',
                radius: ['42%', '68%'],
                center: ['50%', '44%'],
                data: [
                    { name: 'Hombre', value: hombreVal, itemStyle: { color: color1 } },
                    { name: 'Mujer',  value: mujerVal,  itemStyle: { color: color2 } },
                ],
                label: { show: false },
                labelLine: { show: false },
                emphasis: { scale: true, scaleSize: 5 },
            }],
        };
    }

    private buildEtnicEdadColOpt(data: number[], _color: string): EChartsOption {
        const barData = data.map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [4, 4, 0, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 6, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...ETNIC_EDAD_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 52 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 36,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildEtnicEduColOpt(data: number[], _color: string): EChartsOption {
        const barData = data.map(v => ({
            value: v,
            itemStyle: { color: '#caeae4', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#caeae4">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 20, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...ETNIC_EDU_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate: 22,
                             overflow: 'break' as const, width: 68 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 28,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildEtnicSeguroSemiPieOpt(siVal: number, noVal: number, _color: string): EChartsOption {
        const total = siVal + noVal;
        const siPct = (siVal / total * 100).toFixed(1).replace('.', ',');
        const noPct = (noVal / total * 100).toFixed(1).replace('.', ',');
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const,
                bottom: 4, left: 'center' as const,
                textStyle: { fontSize: 9, color: '#424242', fontWeight: 700 as const },
                itemWidth: 10, itemHeight: 10, itemGap: 12,
                formatter: (name: string) =>
                    name === 'Sí tiene seguro' ? `Sí tiene  ${siPct}%` : `No tiene  ${noPct}%`,
            },
            series: [{
                type: 'pie',
                radius: ['42%', '72%'],
                center: ['50%', '62%'],
                startAngle: 180,
                endAngle: 0,
                data: [
                    { name: 'Sí tiene seguro', value: siVal, itemStyle: { color: '#8383fd' } },
                    { name: 'No tiene seguro', value: noVal, itemStyle: { color: '#c9c9ff' } },
                ],
                label: { show: false },
                labelLine: { show: false },
                emphasis: { scale: true, scaleSize: 5 },
            }] as any,
        };
    }

    private buildEtnicEstcivColOpt(data: number[], color: string): EChartsOption {
        const palette = [color, CLR.sky, CLR.teal, '#8383fd'];
        const barData = data.map((v, i) => ({
            value: v,
            itemStyle: { color: palette[i % palette.length], borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 6, bottom: 10, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...ETNIC_ESTCIV_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 44,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    // ── PET: builders ────────────────────────────────────────────────────

    private buildPetSexoPieOpt(hombreVal: number, mujerVal: number): EChartsOption {
        const total = hombreVal + mujerVal;
        const hPct  = (hombreVal / total * 100).toFixed(1).replace('.', ',');
        const mPct  = (mujerVal  / total * 100).toFixed(1).replace('.', ',');
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const, bottom: 4, left: 'center' as const,
                textStyle: { fontSize: 9, color: '#424242', fontWeight: 700 as const },
                itemWidth: 10, itemHeight: 10, itemGap: 16,
                formatter: (name: string) => name === 'Hombre' ? `Hombre  ${hPct}%` : `Mujer  ${mPct}%`,
            },
            series: [{
                type: 'pie', radius: ['38%', '65%'], center: ['50%', '43%'],
                data: [
                    { name: 'Hombre', value: hombreVal, itemStyle: { color: CLR.blue } },
                    { name: 'Mujer',  value: mujerVal,  itemStyle: { color: '#33b3a9' } },
                ],
                label: {
                    show: true, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                    formatter: (p: any) => `${(p.percent as number).toFixed(1).replace('.', ',')}%`,
                },
                labelLine: { show: true, length: 6, length2: 10 },
                emphasis: { scale: true, scaleSize: 5 },
            }],
        };
    }

    private buildPetEdadHBarOpt(): EChartsOption {
        const cats    = [...PET_EDAD_CATS].reverse();
        const colors  = ['#8383fd', '#caeae4', '#33b3a9', '#038dd3', '#0056a1'];
        const data = [...PET_EDAD_DATA].reverse().map((v, i) => ({
            value: v,
            itemStyle: {
                color: colors[i],
                borderRadius: [0, 4, 4, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 56, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 20,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildPetSemiPieOpt(val1: number, val2: number, name1: string, name2: string, color: string, color2 = '#d1d5db'): EChartsOption {
        const total = val1 + val2;
        const pct1  = (val1 / total * 100).toFixed(1).replace('.', ',');
        const pct2  = (val2 / total * 100).toFixed(1).replace('.', ',');
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const, bottom: 4, left: 'center' as const,
                textStyle: { fontSize: 9, color: '#424242', fontWeight: 700 as const },
                itemWidth: 10, itemHeight: 10, itemGap: 12,
                formatter: (name: string) => name === name1 ? `${name1}  ${pct1}%` : `${name2}  ${pct2}%`,
            },
            series: [{
                type: 'pie', radius: ['42%', '70%'], center: ['50%', '58%'],
                startAngle: 180, endAngle: 0,
                data: [
                    { name: name1, value: val1, itemStyle: { color } },
                    { name: name2, value: val2, itemStyle: { color: color2 } },
                ],
                label: {
                    show: true, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                    formatter: (p: any) => `${(p.percent as number).toFixed(1).replace('.', ',')}%`,
                },
                labelLine: { show: true, length: 5, length2: 8 },
                emphasis: { scale: true, scaleSize: 5 },
            }] as any,
        };
    }

    private buildPetEstcivColOpt(): EChartsOption {
        const barData = [...PET_ESTCIV_DATA].map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [4, 4, 0, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 6, bottom: 10, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...PET_ESTCIV_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 68 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 40,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildPetEduColOpt(): EChartsOption {
        const barData = [...PET_EDU_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#caeae4', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#caeae4">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 8, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...PET_EDU_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate: 18,
                             overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 32,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildPetSimplePieOpt(val1: number, val2: number, name1: string, name2: string, color1: string, color2: string): EChartsOption {
        const total = val1 + val2;
        const pct1  = (val1 / total * 100).toFixed(1).replace('.', ',');
        const pct2  = (val2 / total * 100).toFixed(1).replace('.', ',');
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const, bottom: 2, left: 'center' as const,
                textStyle: { fontSize: 8, color: '#424242', fontWeight: 700 as const },
                itemWidth: 9, itemHeight: 9, itemGap: 10,
                formatter: (name: string) => name === name1 ? `${name1}  ${pct1}%` : `${name2}  ${pct2}%`,
            },
            series: [{
                type: 'pie', radius: ['34%', '60%'], center: ['50%', '42%'],
                data: [
                    { name: name1, value: val1, itemStyle: { color: color1 } },
                    { name: name2, value: val2, itemStyle: { color: color2 } },
                ],
                label: {
                    show: true, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                    formatter: (p: any) => `${(p.percent as number).toFixed(1).replace('.', ',')}%`,
                },
                labelLine: { show: true, length: 5, length2: 8 },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    private buildPetBinaryHBarOpt(val1: number, val2: number, name1: string, name2: string, color1: string, color2: string): EChartsOption {
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            legend: {
                orient: 'horizontal' as const, bottom: 2, left: 'center' as const,
                textStyle: { fontSize: 9, color: '#424242', fontWeight: 700 as const },
                itemWidth: 10, itemHeight: 10, itemGap: 12,
            },
            grid: { top: 8, right: 56, bottom: 34, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: [name1, name2],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [{
                type: 'bar' as const, colorBy: 'data' as const, barMaxWidth: 22,
                data: [
                    { name: name1, value: val1, itemStyle: { color: color1, borderRadius: [0, 4, 4, 0] as [number, number, number, number] } },
                    { name: name2, value: val2, itemStyle: { color: color2, borderRadius: [0, 4, 4, 0] as [number, number, number, number] } },
                ],
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    // ── Vivienda builders ─────────────────────────────────────────────────

    private buildVivHogaresBarOpt(): EChartsOption {
        const barData = [...VIV_HOGARES_DATA].map(v => ({
            value: v,
            itemStyle: {
                color: '#caeae4',
                borderRadius: [4, 4, 0, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#caeae4">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...VIV_HOGARES_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 8, color: '#424242', interval: 0, overflow: 'break' as const, width: 80 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 52,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildVivHabitacionesHBarOpt(): EChartsOption {
        const cats = [...VIV_HABITAC_CATS].reverse();
        const habitacColors = ['#8383fd', '#caeae4', '#33b3a9', '#4c8c80', '#038dd3', '#0056a1'];
        const data = [...VIV_HABITAC_DATA].reverse().map((v, i) => ({
            value: v,
            itemStyle: {
                color: habitacColors[i],
                borderRadius: [0, 4, 4, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 56, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242' },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 20,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildVivCalidadPieOpt(): EChartsOption {
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const, bottom: 2, left: 'center' as const,
                textStyle: { fontSize: 8, color: '#424242', fontWeight: 700 as const },
                itemWidth: 9, itemHeight: 9, itemGap: 8,
            },
            series: [{
                type: 'pie', radius: ['36%', '62%'], center: ['50%', '44%'],
                data: VIV_CALIDAD_CATS.map((name, i) => ({
                    name,
                    value: VIV_CALIDAD_DATA[i],
                    itemStyle: { color: ([CLR.teal, CLR.sky, '#8383fd'] as string[])[i] },
                })),
                label: {
                    show: true, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                    formatter: (p: any) => `${(p.percent as number).toFixed(1).replace('.', ',')}%`,
                },
                labelLine: { show: true, length: 6, length2: 10 },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    private buildVivParedesHBarOpt(): EChartsOption {
        const cats = [...VIV_PAREDES_CATS].reverse();
        const data = [...VIV_PAREDES_DATA].reverse().map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [0, 4, 4, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 56, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', width: 130, overflow: 'break' as const },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 20,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildVivTechosBarOpt(): EChartsOption {
        const barData = [...VIV_TECHOS_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#038dd3', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...VIV_TECHOS_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 36,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildVivPisosHBarOpt(): EChartsOption {
        const cats = [...VIV_PISOS_CATS].reverse();
        const data = [...VIV_PISOS_DATA].reverse().map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [0, 4, 4, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 56, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', width: 130, overflow: 'break' as const },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 18,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildVivAguaBarOpt(): EChartsOption {
        const barData = [...VIV_AGUA_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#8383fd', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...VIV_AGUA_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 88 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 44,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildVivExcretasBarOpt(): EChartsOption {
        const barData = [...VIV_EXCRET_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#8383fd', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...VIV_EXCRET_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 6, color: '#424242', interval: 0, overflow: 'break' as const, width: 68 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 36,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildVivEnergiaBarOpt(): EChartsOption {
        const barData = [...VIV_ENERGIA_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#8383fd', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 8, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...VIV_ENERGIA_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 84 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 44,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    // ── Hogar: builders ──────────────────────────────────────────────────────

    private buildHogSexoPieOpt(): EChartsOption {
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${(p.percent as number).toFixed(1).replace('.', ',')}%)</span>`,
            },
            legend: {
                orient: 'horizontal' as const, bottom: 2, left: 'center' as const,
                textStyle: { fontSize: 8, color: '#424242', fontWeight: 700 as const },
                itemWidth: 9, itemHeight: 9, itemGap: 12,
            },
            series: [{
                type: 'pie', radius: ['36%', '62%'], center: ['50%', '44%'],
                data: HOG_SEXO_CATS.map((name, i) => ({
                    name,
                    value: HOG_SEXO_DATA[i],
                    itemStyle: { color: (['#0056a1', CLR.teal] as string[])[i] },
                })),
                label: {
                    show: true, fontSize: 8, fontWeight: 700 as const, color: '#424242',
                    formatter: (p: any) => `${(p.percent as number).toFixed(1).replace('.', ',')}%`,
                },
                labelLine: { show: true, length: 6, length2: 10 },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    private buildHogTenenciaHBarOpt(): EChartsOption {
        const cats = [...HOG_TENENCIA_CATS].reverse();
        const data = [...HOG_TENENCIA_DATA].reverse().map(v => ({
            value: v,
            itemStyle: {
                color: '#caeae4',
                borderRadius: [0, 4, 4, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#caeae4">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 60, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', width: 140, overflow: 'break' as const },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 20,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildHogEnergiaHBarOpt(): EChartsOption {
        const cats = [...HOG_ENERGIA_CATS].reverse();
        const data = [...HOG_ENERGIA_DATA].reverse().map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [0, 4, 4, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 60, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', width: 150, overflow: 'break' as const },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 22,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildHogResiduosHBarOpt(): EChartsOption {
        const cats = [...HOG_RESIDUOS_CATS].reverse();
        const data = [...HOG_RESIDUOS_DATA].reverse().map(v => ({
            value: v,
            itemStyle: {
                color: '#038dd3',
                borderRadius: [0, 4, 4, 0] as [number, number, number, number],
            },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:#038dd3">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 60, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value' as const, min: 0,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            yAxis: {
                type: 'category' as const, data: cats,
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', width: 130, overflow: 'break' as const },
            },
            series: [{
                type: 'bar' as const, data, barMaxWidth: 22,
                label: { show: true, position: 'right' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    private buildHogEmigrColOpt(): EChartsOption {
        const palette = [CLR.sky, CLR.teal, '#8383fd'];
        const barData = [...HOG_EMIGR_DATA].map((v, i) => ({
            value: v,
            itemStyle: { color: palette[i % palette.length], borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 6, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...HOG_EMIGR_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 44,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildHogArtefactosColOpt(): EChartsOption {
        const barData = [...HOG_ARTEFACTOS_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#8383fd', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 6, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...HOG_ARTEFACTOS_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 62 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 32,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    private buildHogTransporteColOpt(): EChartsOption {
        const barData = [...HOG_TRANSPORTE_DATA].map(v => ({
            value: v,
            itemStyle: { color: '#8383fd', borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
        }));
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' as const },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
                padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${p.color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 24, right: 6, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'category' as const, data: [...HOG_TRANSPORTE_CATS],
                axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, overflow: 'break' as const, width: 72 },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' as const } },
            },
            series: [{ type: 'bar' as const, data: barData, barMaxWidth: 44,
                label: { show: true, position: 'top' as const, fontSize: 7, fontWeight: 700 as const, color: '#424242',
                         formatter: (p: any) => this.fmtAxis(p.value as number) },
                emphasis: { itemStyle: { opacity: 0.85 } } }],
        };
    }

    // ── Helpers: Características Económicas (4-color palette) ────────────
    private readonly ECON_COLORS = ['#0056a1', '#038dd3', '#33b3a9', '#8282fb'] as const;
    getEconColor(i: number): string { return this.ECON_COLORS[i % this.ECON_COLORS.length]; }

    // ── Helpers: Educación (4-color palette) ─────────────────────────────
    private readonly EDU_COLORS = ['#0056a1', '#038dd3', '#33b3a9', '#8282fb'] as const;
    getEduColor(i: number): string     { return this.EDU_COLORS[i % this.EDU_COLORS.length]; }
    getEduColorNext(i: number): string { return this.EDU_COLORS[(i + 1) % this.EDU_COLORS.length]; }

    // ── Helper: Color secundario para bandas de cards genéricas ──────────
    getSecondaryColor(): string {
        const c = this.activeGroup()?.color ?? CLR.blue;
        if (c === CLR.blue)  return CLR.sky;
        if (c === CLR.teal)  return CLR.blue;
        if (c === CLR.sky)   return CLR.teal;
        return CLR.teal;
    }

    // ── Helper: Filtrar indicadores por IDs de grupo ──────────────────────
    getIndicatorsForGroup(
        section: ThematicSectionDef,
        indicatorIds: readonly string[],
    ): ThematicIndicatorDef[] {
        return indicatorIds
            .map(id => section.indicators.find(i => i.id === id))
            .filter((i): i is ThematicIndicatorDef => !!i);
    }

    // ── Helper: Col-span classes por indicador en Discapacidad ───────────
    getDiscColClass(id: string): string {
        const map: Record<string, string> = {
            'disc_sexo':          'col-span-1 sm:col-span-2 lg:col-span-2',
            'edad_prom_disc':     'col-span-1',
            'edad_mediana_disc':  'col-span-1',
            'disc_nivel_edu':     'col-span-1 sm:col-span-2 lg:col-span-3',
            'hogares_disc':       'col-span-1',
            'disc_edad':          'col-span-1 sm:col-span-2 lg:col-span-4',
        };
        return map[id] ?? 'col-span-1';
    }

    // ── Helper: Col-span classes por indicador en Características Técnicas Viviendas
    getViviendaColClass(id: string): string {
        const map: Record<string, string> = {
            'material_pisos':    'col-span-1 sm:col-span-2 lg:col-span-2',
            'calidad_vivienda':  'col-span-1',
            'num_habitaciones':  'col-span-1',
        };
        return map[id] ?? 'col-span-1';
    }
    getEtnicaColClass(id: string): string {
        const map: Record<string, string> = {
            'id_etnica':              'col-span-1',
            'indigena_sexo':          'col-span-1 lg:col-span-3',
            'indigena_edu':           'col-span-1 sm:col-span-2',
            'indigena_tics':          'col-span-1',
            'indigena_estado_civil':  'col-span-1',
            'afro_sexo':              'col-span-1',
            'afro_edad':              'col-span-1',
            'afro_edu':               'col-span-1 sm:col-span-2',
            'afro_tics':              'col-span-1',
            'afro_estado_civil':      'col-span-1',
            'idioma_ninez':           'col-span-1 sm:col-span-2',
        };
        return map[id] ?? 'col-span-1';
    }

    // ── Geo state ─────────────────────────────────────────────────────────
    readonly NIVELES_GEO: NivelGeoType[] = ['Departamental', 'Provincial', 'Distrital'];
    nivelGeo        = signal<NivelGeoType>('Departamental');
    openGeoDropdown = signal<'dep' | 'prov' | 'dist' | null>(null);
    selectedCCDD    = signal<string>('');
    selectedProv    = signal<string>('');
    selectedDist    = signal<string>('');

    // ── Filtro de ámbito (División Territorial / Región Natural) ──────────
    readonly NIVELES_FILTRO: { key: NivelFiltroType; label: string; icon: string; color: string }[] = [
        { key: 'politico_administrativo', label: 'División territorial', icon: 'map',            color: '#0056a1' },
        { key: 'region_natural',          label: 'Región Natural',          icon: '', color: '#33b3a9' },
    ];
    readonly REGIONES_NATURALES = REGIONES_NATURALES;

    nivelFiltro           = signal<NivelFiltroType>('politico_administrativo');
    selectedRegionNatural = signal<string>('');
    openRegionDropdown    = signal<boolean>(false);
    openNivelDropdown     = signal<boolean>(false);

    activeNivelDef = computed(() =>
        this.NIVELES_FILTRO.find(n => n.key === this.nivelFiltro()) ?? this.NIVELES_FILTRO[0]
    );
    regionNaturalLabel = computed(() => {
        const key = this.selectedRegionNatural();
        return REGIONES_NATURALES.find(r => r.key === key)?.label ?? 'Todos';
    });

    // ── Filtro de área ────────────────────────────────────────────────────
    readonly AREAS_FILTRO: { key: AreaFiltroType; label: string }[] = [
        { key: 'total',  label: 'Todas'  },
        { key: 'urbano', label: 'Urbano' },
        { key: 'rural',  label: 'Rural'  },
    ];
    areaFiltro       = signal<AreaFiltroType>('total');
    openAreaDropdown = signal<boolean>(false);
    areaLabel        = computed(() => this.AREAS_FILTRO.find(a => a.key === this.areaFiltro())?.label ?? 'Total');

    isGeoProvActive = computed(() =>
        this.nivelFiltro() === 'politico_administrativo' && this.nivelGeo() !== 'Departamental'
    );
    isGeoDistActive = computed(() =>
        this.nivelFiltro() === 'politico_administrativo' && this.nivelGeo() === 'Distrital'
    );

    private rawGeoJson     = signal<any>(null);
    private rawGeoJsonProv = signal<any>(null);
    private rawGeoJsonDist = signal<any>(null);

    // ── Listas para dropdowns geo ─────────────────────────────────────────
    departments = computed<{ ccdd: string; name: string }[]>(() => {
        const geo = this.rawGeoJson(); if (!geo?.features) return [];
        const raw     = (geo.features as any[]).map((f: any) => ({ ccdd: String(f.properties.CCDD), name: String(f.properties.NOMBDEP) }));
        const isLimaMet = (d: { name: string }) => d.name.toLowerCase().includes('lima') && !d.name.toLowerCase().includes('región') && !d.name.toLowerCase().includes('region');
        const isRegLima = (d: { name: string }) => d.name.toLowerCase().includes('región lima') || d.name.toLowerCase().includes('region lima');
        const limaMet   = raw.find(isLimaMet);
        const regLima   = raw.find(isRegLima);
        const resto     = raw.filter(d => !isLimaMet(d) && !isRegLima(d));
        const sorted    = [...resto].sort((a, b) => parseInt(a.ccdd, 10) - parseInt(b.ccdd, 10));
        const lambIdx   = sorted.findIndex(d => d.ccdd === '14');
        const insertAt  = lambIdx >= 0 ? lambIdx + 1 : sorted.length;
        const extras: typeof sorted = [];
        if (limaMet) extras.push(limaMet);
        if (regLima) extras.push(regLima);
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

    displayedTitle = computed<string>(() => {
        const dist = this.selectedDist(); if (dist) return this.districts().find(d => d.code === dist)?.name ?? dist;
        const prov = this.selectedProv(); if (prov) return this.provinces().find(p => p.code === prov)?.name ?? prov;
        const ccdd = this.selectedCCDD(); if (ccdd) return this.departments().find(d => d.ccdd === ccdd)?.name ?? 'Perú';
        return 'Perú';
    });

    setNivelFiltro(nivel: NivelFiltroType): void {
        this.nivelFiltro.set(nivel);
        this.openGeoDropdown.set(null);
        this.openRegionDropdown.set(false);
        this.openNivelDropdown.set(false);
        this.selectedRegionNatural.set('');
        if (nivel === 'region_natural') {
            this.selectedCCDD.set(''); this.selectedProv.set(''); this.selectedDist.set('');
            this.nivelGeo.set('Departamental');
        }
    }

    selectRegionNatural(key: string): void {
        this.selectedRegionNatural.set(key);
        this.openRegionDropdown.set(false);
    }

    toggleGeoDropdown(key: 'dep' | 'prov' | 'dist'): void { this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key); }
    closeGeoDropdowns(): void {
        this.openGeoDropdown.set(null);
        this.openRegionDropdown.set(false);
        this.openNivelDropdown.set(false);
        this.openAreaDropdown.set(false);
    }

    selectDep(dept: { ccdd: string; name: string } | null): void {
        this.selectedCCDD.set(dept?.ccdd ?? '');
        this.selectedProv.set(''); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (dept) { this.nivelGeo.set('Provincial'); this.loadGeoJsonProv(); }
        else       { this.nivelGeo.set('Departamental'); }
    }

    selectProv(code: string): void {
        this.selectedProv.set(code); this.selectedDist.set(''); this.openGeoDropdown.set(null);
        if (code) { this.nivelGeo.set('Distrital'); this.loadGeoJsonDist(); }
        else if (this.selectedCCDD()) { this.nivelGeo.set('Provincial'); }
    }

    selectDist(code: string): void { this.selectedDist.set(code); this.openGeoDropdown.set(null); }

    resetFilters(): void {
        this.selectedCCDD.set(''); this.selectedProv.set(''); this.selectedDist.set('');
        this.selectedRegionNatural.set('');
        this.nivelGeo.set('Departamental');
        this.nivelFiltro.set('politico_administrativo');
        this.openGeoDropdown.set(null);
        this.openRegionDropdown.set(false);
        this.openNivelDropdown.set(false);
        this.openAreaDropdown.set(false);
        this.areaFiltro.set('total');
    }

    // ── Platform e inyecciones ────────────────────────────────────────────
    isBrowser       = false;
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);
    private router     = inject(Router);

    // ── Fecundidad: opciones de gráficos pre-computadas ──────────────────
    readonly fecuHijosEdadOpt!: EChartsOption;
    readonly fecuPromEdadOpt!:  EChartsOption;
    readonly fecuEstCivilOpt!:  EChartsOption;

    // ── Migración: opciones de gráficos pre-computadas ────────────────────
    readonly migrSexoPieOpt!:    EChartsOption;
    readonly migrGruposEdadOpt!: EChartsOption;
    readonly migrPiramideOpt!:   EChartsOption;
    readonly migrSeguroOpt!:     EChartsOption;
    readonly migrNivelEduOpt!:   EChartsOption;
    readonly migrPaisesOpt!:     EChartsOption;

    // ── Identidad y Protección Social ─────────────────────────────────
    readonly identEstCivColOpt!:  EChartsOption;
    readonly identEstCivPirOpt!:  EChartsOption;
    readonly identEstCivEdadOpt!: EChartsOption;
    readonly identDniMascPieOpt!: EChartsOption;
    readonly identDniFemPieOpt!:  EChartsOption;
    readonly identDniEdadOpt!:    EChartsOption;
    readonly identDocInmigrOpt!:  EChartsOption;
    readonly identSegMascPieOpt!: EChartsOption;
    readonly identSegFemPieOpt!:  EChartsOption;
    readonly identSegEdadOpt!:    EChartsOption;
    readonly identSegTipoOpt!:    EChartsOption;

    // ── Educación ─────────────────────────────────────────────────────
    readonly eduNivelHbarOpt!:     EChartsOption;
    readonly eduNivelSexColOpt!:   EChartsOption;
    readonly eduAsist3a24ColOpt!:  EChartsOption;
    readonly eduAsist3a5ColOpt!:   EChartsOption;
    readonly eduAsist6a11ColOpt!:  EChartsOption;
    readonly eduAsist12a16ColOpt!: EChartsOption;
    readonly eduAsist17a24ColOpt!: EChartsOption;
    readonly eduAlfaSexColOpt!:    EChartsOption;
    readonly eduAlfaEdadHbarOpt!:  EChartsOption;
    readonly eduTicSexColOpt!:     EChartsOption;
    readonly eduTicEdadHbarOpt!:   EChartsOption;

    // ── Discapacidad ──────────────────────────────────────────────────
    readonly discPiramideOpt!:    EChartsOption;
    readonly discSeguroColOpt!:   EChartsOption;
    readonly discEduColOpt!:      EChartsOption;
    readonly discAsistPieOpt!:    EChartsOption;
    readonly discEsferasHbarOpt!:  EChartsOption;
    readonly discEsferasEdadOpt!:  EChartsOption;

    // ── Etnicidad ──────────────────────────────────────────────────────────
    readonly etnicAutoBarOpt!:      EChartsOption;
    readonly etnicIdiomaBarOpt!:    EChartsOption;
    readonly etnicIndSexoPieOpt!:   EChartsOption;
    readonly etnicIndEdadColOpt!:   EChartsOption;
    readonly etnicIndEduColOpt!:    EChartsOption;
    readonly etnicIndSeguroSemiPieOpt!: EChartsOption;
    readonly etnicIndEstcivColOpt!: EChartsOption;
    readonly etnicAfrSexoPieOpt!:   EChartsOption;
    readonly etnicAfrEdadColOpt!:   EChartsOption;
    readonly etnicAfrEduColOpt!:    EChartsOption;
    readonly etnicAfrSeguroSemiPieOpt!: EChartsOption;
    readonly etnicAfrEstcivColOpt!: EChartsOption;

    // ── PET (Población en Edad de Trabajar) ────────────────────────────────
    readonly petSexoPieOpt!:        EChartsOption;
    readonly petEdadHBarOpt!:       EChartsOption;
    readonly petSeguroSemiPieOpt!:  EChartsOption;
    readonly petDiscSemiPieOpt!:    EChartsOption;
    readonly petEstcivColOpt!:      EChartsOption;
    readonly petEduColOpt!:         EChartsOption;
    readonly petAsistPieOpt!:       EChartsOption;
    readonly petAlfaPieOpt!:        EChartsOption;
    readonly petTicHBarOpt!:        EChartsOption;
    readonly petInternetHBarOpt!:   EChartsOption;

    // ── Vivienda ───────────────────────────────────────────────────────────
    readonly vivHogaresBarOpt!:     EChartsOption;
    readonly vivHabitacionesHBarOpt!: EChartsOption;
    readonly vivCalidadPieOpt!:     EChartsOption;
    readonly vivParedesHBarOpt!:    EChartsOption;
    readonly vivTechosBarOpt!:      EChartsOption;
    readonly vivPisosHBarOpt!:      EChartsOption;
    readonly vivAguaBarOpt!:        EChartsOption;
    readonly vivExcretasBarOpt!:    EChartsOption;
    readonly vivEnergiaBarOpt!:     EChartsOption;

    // ── Hogar ─────────────────────────────────────────────────────────────────
    readonly hogSexoPieOpt!:       EChartsOption;
    readonly hogTenenciaHBarOpt!:  EChartsOption;
    readonly hogEnergiaHBarOpt!:   EChartsOption;
    readonly hogResiduosHBarOpt!:  EChartsOption;
    readonly hogEmigrColOpt!:      EChartsOption;
    readonly hogArtefactosColOpt!: EChartsOption;
    readonly hogTransporteColOpt!: EChartsOption;


    constructor() {
        this.isBrowser        = isPlatformBrowser(this.platformId);
        this.fecuHijosEdadOpt = this.buildFecuHijosEdadOpt();
        this.fecuPromEdadOpt  = this.buildFecuPromEdadOpt();
        this.fecuEstCivilOpt  = this.buildFecuEstCivilOpt();
        this.migrSexoPieOpt    = this.buildMigrSexoPieOpt();
        this.migrGruposEdadOpt = this.buildMigrGruposEdadOpt();
        this.migrPiramideOpt   = this.buildMigrPiramideOpt();
        this.migrSeguroOpt     = this.buildMigrSeguroOpt();
        this.migrNivelEduOpt   = this.buildMigrNivelEduOpt();
        this.migrPaisesOpt     = this.buildMigrPaisesOpt();
        this.identEstCivColOpt  = this.buildIdentEstCivColOpt();
        this.identEstCivPirOpt  = this.buildIdentEstCivPirOpt();
        this.identEstCivEdadOpt = this.buildIdentEstCivEdadOpt();
        this.identDniMascPieOpt = this.buildIdentDniPieOpt(16_500_000, 1_000_000, CLR.blue);
        this.identDniFemPieOpt  = this.buildIdentDniPieOpt(17_500_000, 1_000_000, CLR.teal);
        this.identSegMascPieOpt = this.buildIdentDniPieOpt(14_200_000, 3_300_000, CLR.blue);
        this.identSegFemPieOpt  = this.buildIdentDniPieOpt(15_080_892, 3_419_108, CLR.teal);
        this.identDniEdadOpt    = this.buildIdentDniEdadOpt();
        this.identDocInmigrOpt  = this.buildIdentDocInmigrOpt();
        this.identSegEdadOpt    = this.buildIdentSegEdadOpt();
        this.identSegTipoOpt    = this.buildIdentSegTipoOpt();
        this.eduNivelHbarOpt     = this.buildEduNivelHbarOpt();
        this.eduNivelSexColOpt   = this.buildEduNivelSexColOpt();
        this.eduAsist3a24ColOpt  = this.buildEduAsist2BarColOpt(77.2, 79.6);
        this.eduAsist3a5ColOpt   = this.buildEduAsist2BarColOpt(63.2, 64.8);
        this.eduAsist6a11ColOpt  = this.buildEduAsist2BarColOpt(96.4, 96.8);
        this.eduAsist12a16ColOpt = this.buildEduAsist2BarColOpt(94.1, 95.3);
        this.eduAsist17a24ColOpt = this.buildEduAsist2BarColOpt(52.3, 57.8);
        this.eduAlfaSexColOpt    = this.buildEduAsist2BarColOpt(97.2, 92.6);
        this.eduAlfaEdadHbarOpt  = this.buildEduPctHbarOpt(EDU_ALFA_EDAD_CATS, EDU_ALFA_EDAD_DATA, '#caeae4');
        this.eduTicSexColOpt     = this.buildEduAsist2BarColOpt(71.2, 65.8);
        this.eduTicEdadHbarOpt   = this.buildEduPctHbarOpt(EDU_TIC_EDAD_CATS, EDU_TIC_EDAD_DATA, '#8383fd');
        this.discPiramideOpt    = this.buildDiscPiramideOpt();
        this.discSeguroColOpt   = this.buildDiscSeguroColOpt();
        this.discEduColOpt      = this.buildDiscEduColOpt();
        this.discAsistPieOpt    = this.buildDiscAsistPieOpt();
        this.discEsferasHbarOpt  = this.buildDiscEsferasHbarOpt();
        this.discEsferasEdadOpt  = this.buildDiscEsferasEdadOpt();
        this.etnicAutoBarOpt      = this.buildEtnicHBarOpt([...ETNIC_AUTO_CATS],   [...ETNIC_AUTO_DATA]);
        this.etnicIdiomaBarOpt    = this.buildEtnicHBarOpt([...ETNIC_IDIOMA_CATS], [...ETNIC_IDIOMA_DATA]);
        this.etnicIndSexoPieOpt   = this.buildEtnicSexoPieOpt(4_344_891, 4_000_000, '#0056a1', '#33b3a9');
        this.etnicIndEdadColOpt   = this.buildEtnicEdadColOpt([...ETNIC_IND_EDAD_DATA], CLR.blue);
        this.etnicIndEduColOpt    = this.buildEtnicEduColOpt([...ETNIC_IND_EDU_DATA],   CLR.blue);
        this.etnicIndSeguroSemiPieOpt = this.buildEtnicSeguroSemiPieOpt(6_234_892, 2_109_999, CLR.blue);
        this.etnicIndEstcivColOpt = this.buildEtnicEstcivColOpt([...ETNIC_IND_ESTCIV_DATA], CLR.blue);
        this.etnicAfrSexoPieOpt   = this.buildEtnicSexoPieOpt(127_293, 147_892, '#0056a1', '#33b3a9');
        this.etnicAfrEdadColOpt   = this.buildEtnicEdadColOpt([...ETNIC_AFR_EDAD_DATA], CLR.teal);
        this.etnicAfrEduColOpt    = this.buildEtnicEduColOpt([...ETNIC_AFR_EDU_DATA],   CLR.teal);
        this.etnicAfrSeguroSemiPieOpt = this.buildEtnicSeguroSemiPieOpt(175_293, 99_892, CLR.teal);
        this.etnicAfrEstcivColOpt = this.buildEtnicEstcivColOpt([...ETNIC_AFR_ESTCIV_DATA], CLR.teal);
        this.petSexoPieOpt        = this.buildPetSexoPieOpt(13_847_293, 13_000_000);
        this.petEdadHBarOpt       = this.buildPetEdadHBarOpt();
        this.petSeguroSemiPieOpt  = this.buildPetSemiPieOpt(17_234_892,  9_612_401, 'Sí tiene seguro',   'No tiene seguro',           '#8383fd', '#c9c9ff');
        this.petDiscSemiPieOpt    = this.buildPetSemiPieOpt(23_638_036,  3_209_257, 'Sin discapacidad',  'Con discapacidad',           '#038dd3', '#b9e3f4');
        this.petEstcivColOpt      = this.buildPetEstcivColOpt();
        this.petEduColOpt         = this.buildPetEduColOpt();
        this.petAsistPieOpt       = this.buildPetSimplePieOpt(3_234_892, 23_612_401, 'Sí asiste',              'No asiste',                  '#8383fd',  '#c9c9ff');
        this.petAlfaPieOpt        = this.buildPetSimplePieOpt(24_638_036, 2_209_257, 'Sabe leer y escribir',   'No sabe leer ni escribir',   '#038dd3',  '#b9e3f4');
        this.petTicHBarOpt        = this.buildPetBinaryHBarOpt(8_234_892, 18_612_401, 'No utiliza', 'Sí utiliza', '#c9c9ff', '#8383fd');
        this.petInternetHBarOpt   = this.buildPetBinaryHBarOpt(9_847_293, 17_000_000, 'No utiliza', 'Sí utiliza', '#b9e3f4', '#038dd3');
        this.vivHogaresBarOpt       = this.buildVivHogaresBarOpt();
        this.vivHabitacionesHBarOpt = this.buildVivHabitacionesHBarOpt();
        this.vivCalidadPieOpt       = this.buildVivCalidadPieOpt();
        this.vivParedesHBarOpt      = this.buildVivParedesHBarOpt();
        this.vivTechosBarOpt        = this.buildVivTechosBarOpt();
        this.vivPisosHBarOpt        = this.buildVivPisosHBarOpt();
        this.vivAguaBarOpt          = this.buildVivAguaBarOpt();
        this.vivExcretasBarOpt      = this.buildVivExcretasBarOpt();
        this.vivEnergiaBarOpt       = this.buildVivEnergiaBarOpt();
        this.hogSexoPieOpt        = this.buildHogSexoPieOpt();
        this.hogTenenciaHBarOpt   = this.buildHogTenenciaHBarOpt();
        this.hogEnergiaHBarOpt    = this.buildHogEnergiaHBarOpt();
        this.hogResiduosHBarOpt   = this.buildHogResiduosHBarOpt();
        this.hogEmigrColOpt       = this.buildHogEmigrColOpt();
        this.hogArtefactosColOpt  = this.buildHogArtefactosColOpt();
        this.hogTransporteColOpt  = this.buildHogTransporteColOpt();
    }

    ngOnInit(): void { this.loadGeoJson(); }

    private loadGeoJson(): void {
        if (this.rawGeoJson()) return;
        this.http.get<any>('/departamento_geometria.json').subscribe({ next: d => this.rawGeoJson.set(d), error: () => {} });
    }
    private loadGeoJsonProv(): void {
        if (this.rawGeoJsonProv()) return;
        this.http.get<any>('/provincia_geometria.json').subscribe({ next: d => this.rawGeoJsonProv.set(d), error: () => {} });
    }
    private loadGeoJsonDist(): void {
        if (this.rawGeoJsonDist()) return;
        this.http.get<any>('/distrito_geometria.json').subscribe({ next: d => this.rawGeoJsonDist.set(d), error: () => {} });
    }

    // ══════════════════════════════════════════════════════════════════════
    // FÁBRICA DE OPCIONES DE GRÁFICOS
    // ══════════════════════════════════════════════════════════════════════

    /** Punto de entrada unificado. Acepta color opcional para override. */
    getChartOpt(indicator: ThematicIndicatorDef, colorOverride?: string): EChartsOption {
        const color = colorOverride ?? this.activeGroup()?.color ?? CLR.blue;
        const cats  = indicator.categories ?? [];
        const data  = indicator.data ?? new Array(cats.length).fill(0);
        switch (indicator.type) {
            case 'column':         return this.buildColumnOpt(cats, data, color);
            case 'bar':            return this.buildBarOpt(cats, data, color);
            case 'pie':            return this.buildPieOpt(cats, data, indicator.showValues !== false);
            case 'stacked':        return this.buildStackedBarOpt(cats, data, color, indicator.id);
            case 'grouped_bar':    return this.buildGroupedBarOpt(cats, indicator.series ?? []);
            case 'grouped_column': return this.buildGroupedColumnOpt(cats, indicator.series ?? []);
            default:               return {};
        }
    }

    // ── Gráfico de columnas verticales ────────────────────────────────────
    private buildColumnOpt(categories: readonly string[], data: readonly number[], color: string): EChartsOption {
        const rotate    = categories.length > 5 ? 28 : 0;
        const showLabel = categories.length <= 6;
        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: [6, 10],
                textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: showLabel ? 22 : 8, right: 6, bottom: rotate > 0 ? 48 : 28, left: 4, containLabel: true },
            xAxis: {
                type: 'category',
                data: [...categories],
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate, overflow: 'break', width: 60 },
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
                axisLabel: { fontSize: 7, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
            },
            series: [{
                type: 'bar',
                data: [...data],
                label: {
                    show: showLabel,
                    position: 'top' as const,
                    fontSize: 7,
                    fontWeight: 700 as const,
                    color: '#424242',
                    formatter: (p: any) => this.fmtAxis(p.value as number),
                },
                itemStyle: {
                    color: {
                        type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color },
                            { offset: 1, color: this.hexToRgba(color, 0.45) },
                        ],
                    },
                    borderRadius: [4, 4, 0, 0],
                },
                barMaxWidth: 32,
                emphasis: { itemStyle: { opacity: 0.85 } },
            }],
        };
    }

    // ── Gráfico de barras horizontales con track de fondo ─────────────────
    private buildBarOpt(categories: readonly string[], data: readonly number[], color: string): EChartsOption {
        const maxVal  = Math.max(...(data as number[]));
        const revCats = [...categories].reverse();
        const revData = [...data].reverse();
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'none' },
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: [6, 10],
                textStyle: { color: '#424242', fontSize: 10 },
                formatter: (params: any) => {
                    const p = Array.isArray(params)
                        ? (params as any[]).find((x: any) => x.seriesName !== '_bg') ?? params[0]
                        : params;
                    return `<span style="font-size:9px;font-weight:900;color:#424242">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: 6, right: 48, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value',
                max: maxVal * 1.1,
                axisLabel: { show: false },
                splitLine: { show: false },
                axisLine:  { show: false },
            },
            yAxis: {
                type: 'category',
                data: revCats,
                axisTick: { show: false },
                axisLine: { show: false },
                axisLabel: { fontSize: 8, color: '#424242', width: 110, overflow: 'break' },
            },
            series: [
                {
                    type: 'bar',
                    name: '_bg',
                    data: revCats.map(() => maxVal * 1.1),
                    itemStyle: { color: '#f1f5f9', borderRadius: [0, 4, 4, 0] },
                    silent: true,
                    animation: false,
                    barMaxWidth: 22,
                    z: 0,
                } as any,
                {
                    type: 'bar',
                    name: 'valor',
                    data: revData,
                    barGap: '-100%',
                    barMaxWidth: 22,
                    z: 1,
                    itemStyle: {
                        color: {
                            type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: [
                                { offset: 0, color },
                                { offset: 1, color: this.hexToRgba(color, 0.48) },
                            ],
                        },
                        borderRadius: [0, 4, 4, 0],
                    },
                    label: {
                        show: true,
                        position: 'right' as const,
                        distance: 5,
                        fontSize: 9,
                        fontWeight: 700 as const,
                        color: '#424242',
                        formatter: (p: any) => this.fmtAxis(p.value as number),
                    },
                    emphasis: { itemStyle: { opacity: 0.85 } },
                },
            ],
        };
    }

    // ── Gráfico de torta/donut con leyenda + valores absolutos ────────────
    private buildPieOpt(categories: readonly string[], data: readonly number[], showValues = true): EChartsOption {
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: [6, 10],
                textStyle: { color: '#424242', fontSize: 10 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#424242">${p.name}</span><br>`
                  + `<span style="font-size:11px;font-weight:900;color:${PIE_COLORS[p.dataIndex % PIE_COLORS.length]}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#424242"> (${p.percent?.toFixed(1)}%)</span>`,
            },
            legend: {
                type: 'scroll',
                orient: 'horizontal',
                bottom: 0,
                left: 'center',
                textStyle: { fontSize: 7, color: '#424242', overflow: 'break', width: 85 } as any,
                itemWidth: 8,
                itemHeight: 8,
                pageIconSize: 8,
                formatter: showValues
                    ? (name: string) => { const idx = categories.indexOf(name); return idx >= 0 ? `${name}: ${this.fmt(data[idx])}` : name; }
                    : (name: string) => name,
            },
            series: [{
                type: 'pie',
                radius: ['30%', '62%'],
                center: ['50%', '44%'],
                avoidLabelOverlap: true,
                data: categories.map((name, i) => ({
                    name,
                    value: data[i] ?? 0,
                    itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
                })),
                label:     { show: false },
                labelLine: { show: false },
                emphasis: { scale: true, scaleSize: 4 },
            }],
        };
    }

    // ── Gráfico de barras apiladas horizontales ────────────────────────────
    private buildStackedBarOpt(
        categories: readonly string[],
        data: readonly number[],
        color: string,
        indicatorId = '',
    ): EChartsOption {
        const [label1, label2] = this.getStackedLabels(indicatorId);
        const s1 = data.map(v => Math.round(v * 0.65));
        const s2 = data.map((v, i) => v - s1[i]);
        const color2 = color === CLR.blue ? CLR.teal : (color === CLR.teal ? CLR.sky : CLR.blue);
        const revCats = [...categories].reverse();
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: [6, 10],
                textStyle: { color: '#424242', fontSize: 9 },
            },
            legend: {
                data: [label1, label2],
                top: 2,
                left: 'center',
                textStyle: { fontSize: 7, color: '#424242' },
                itemWidth: 8,
                itemHeight: 8,
            },
            grid: { top: 22, right: 16, bottom: 6, left: 4, containLabel: true },
            xAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
            },
            yAxis: {
                type: 'category',
                data: revCats,
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', width: 100, overflow: 'break' },
            },
            series: [
                {
                    name: label1, type: 'bar', stack: 'total',
                    data: [...s1].reverse(),
                    itemStyle: { color, borderRadius: [0, 0, 0, 0] },
                    barMaxWidth: 18,
                    emphasis: { focus: 'series' as const },
                },
                {
                    name: label2, type: 'bar', stack: 'total',
                    data: [...s2].reverse(),
                    itemStyle: { color: color2, borderRadius: [0, 3, 3, 0] },
                    barMaxWidth: 18,
                    emphasis: { focus: 'series' as const },
                },
            ],
        };
    }

    /** Etiquetas de series para gráficos apilados según el indicador */
    private getStackedLabels(id: string): [string, string] {
        if (id === 'tenencia_vivienda') return ['Hombre jefe de hogar', 'Mujer jefe de hogar'];
        return ['Área urbana', 'Área rural'];
    }

    // ── Gráfico de barras agrupadas ECharts ───────────────────────────────
    private buildGroupedBarOpt(categories: readonly string[], series: readonly ThematicSeriesDef[]): EChartsOption {
        const revCats = [...categories].reverse();
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1, padding: [6,10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let html = `<div style="font-size:9px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((item: any) => { html += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:1px"><span style="width:8px;height:8px;border-radius:2px;background:${item.color};display:inline-block;flex-shrink:0"></span><span style="color:#424242;flex:1">${item.seriesName}</span><span style="font-weight:900;color:#111">${this.fmt(item.value)}</span></div>`; });
                    return html;
                },
            },
            legend: { data: series.map(s => s.name), type: 'scroll', top: 2, left: 'center', textStyle: { fontSize: 7, color: '#424242' }, itemWidth: 8, itemHeight: 8, pageIconSize: 8 },
            grid: { top: 28, right: 44, bottom: 6, left: 4, containLabel: true },
            xAxis: { type: 'value', axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) }, splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } } },
            yAxis: { type: 'category', data: revCats, axisTick: { show: false }, axisLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { fontSize: 7, color: '#424242', width: 80, overflow: 'truncate' } },
            series: series.map(s => ({
                name: s.name, type: 'bar' as const,
                data: [...s.data].reverse(),
                itemStyle: { color: s.color, borderRadius: [0, 3, 3, 0] as [number,number,number,number] },
                barMaxWidth: 10, emphasis: { focus: 'series' as const },
            })),
        };
    }

    // ── Gráfico de columnas agrupadas verticales (categorías en eje X) ──────
    private buildGroupedColumnOpt(categories: readonly string[], series: readonly ThematicSeriesDef[]): EChartsOption {
        const rotate = categories.length > 5 ? 28 : 0;
        return {
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1, padding: [6, 10], textStyle: { color: '#424242', fontSize: 9 },
                formatter: (params: any) => {
                    const items = params as any[];
                    let html = `<div style="font-size:9px;font-weight:900;color:#424242;margin-bottom:3px">${items[0]?.name ?? ''}</div>`;
                    items.forEach((item: any) => {
                        html += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:1px"><span style="width:8px;height:8px;border-radius:2px;background:${item.color};display:inline-block;flex-shrink:0"></span><span style="color:#424242;flex:1">${item.seriesName}</span><span style="font-weight:900;color:#111">${this.fmt(item.value)}</span></div>`;
                    });
                    return html;
                },
            },
            legend: { data: series.map(s => s.name), type: 'scroll', top: 2, left: 'center', textStyle: { fontSize: 7, color: '#424242' }, itemWidth: 8, itemHeight: 8, pageIconSize: 8 },
            grid: { top: 30, right: 8, bottom: rotate > 0 ? 52 : 28, left: 4, containLabel: true },
            xAxis: {
                type: 'category',
                data: [...categories],
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#424242', interval: 0, rotate, overflow: 'break', width: 60 },
            },
            yAxis: {
                type: 'value',
                axisLabel: { fontSize: 6, color: '#d1d5db', formatter: (v: number) => this.fmtAxis(v) },
                splitLine: { lineStyle: { color: '#f9fafb', type: 'dashed' } },
            },
            series: series.map(s => ({
                name: s.name, type: 'bar' as const,
                data: [...s.data],
                itemStyle: { color: s.color, borderRadius: [3, 3, 0, 0] as [number, number, number, number] },
                barMaxWidth: 14, emphasis: { focus: 'series' as const },
            })),
        };
    }

    // ── Helpers para HTML bars ────────────────────────────────────────────
    getHBarPct(data: readonly number[], idx: number): number {
        const max = Math.max(...(data as number[]), 1);
        return +((( (data[idx] ?? 0)) / max) * 100).toFixed(1);
    }

    getGroupedPct(ind: ThematicIndicatorDef, catIdx: number, serieIdx: number): number {
        const allVals = (ind.series ?? []).flatMap(s => s.data as number[]);
        const max = Math.max(...allVals, 1);
        const val = (ind.series ?? [])[serieIdx]?.data[catIdx] ?? 0;
        return +((val / max) * 100).toFixed(1);
    }

    getColSpanClass(span?: number): string {
        if (span === 4) return 'col-span-1 sm:col-span-2 lg:col-span-4';
        if (span === 3) return 'col-span-1 sm:col-span-2 lg:col-span-3';
        if (span === 2) return 'col-span-1 sm:col-span-2';
        return 'col-span-1';
    }

    lightenColor(hex: string): string {
        const map: Record<string,string> = { '#0056a1':'#038dd3', '#038dd3':'#33b3a9', '#33b3a9':'#8282fb', '#8282fb':'#33b3a9' };
        return map[hex] ?? '#33b3a9';
    }

    getPieColor(i: number): string { return PIE_COLORS[i % PIE_COLORS.length]; }

    getIdentidadWideInds(section: ThematicSectionDef): ThematicIndicatorDef[] {
        return (IDENTIDAD_WIDE_IDS as readonly string[])
            .map(id => section.indicators.find(i => i.id === id))
            .filter((i): i is ThematicIndicatorDef => !!i);
    }

    // ── Utilidades de formato ─────────────────────────────────────────────
    fmt(n: number): string {
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    }
    fmtD(n: number, dec = 1): string {
        return n.toFixed(dec).replace('.', ',');
    }
    private fmtAxis(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
        if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
        return n.toString();
    }
    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}