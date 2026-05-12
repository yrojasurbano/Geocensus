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
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES Y TIPOS
// ══════════════════════════════════════════════════════════════════════════════

interface GeoOption { code: string; name: string; sortKey?: string; }
export type NivelGeoType = 'Departamental' | 'Provincial' | 'Distrital';

interface ThematicIndicatorDef {
    readonly id:          string;
    readonly title:       string;
    readonly icon:        string;
    readonly type:        'kpi' | 'bar' | 'column' | 'pie' | 'stacked';
    readonly categories?: readonly string[];
    readonly data?:       readonly number[];
    readonly note?:       string;
    readonly kpiValue?:   string;
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
    purple: '#8383fd',
    sky:    '#038dd3',
    amber:  '#f59e0b',
    rose:   '#ef4444',
    green:  '#22c55e',
    indigo: '#6366f1',
} as const;

// Rampa cromática institucional restringida al eje blue-sky-teal
const PIE_COLORS = [
    '#0056a1', '#33b3a9', '#038dd3',
    '#004a8a', '#27a09c', '#0275af',
    '#005fa8', '#3bc4ba', '#006bbf',
    '#1d9bb8',
] as const;

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE GRUPOS TEMÁTICOS
// ══════════════════════════════════════════════════════════════════════════════

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
                id: 'migracion', label: 'Migración', icon: 'arrow-right-circle',
                gridClass: 'grid grid-cols-1 sm:grid-cols-2',
                indicators: [
                    {
                        id: 'migracion_vida', icon: 'map-pin', type: 'bar',
                        title: 'Población censada según lugar de nacimiento (Migración de toda la vida)',
                        categories: ['En el mismo distrito', 'En otro distrito', 'En otro país'],
                        data: [18_234_892, 14_847_293, 2_847_293],
                    },
                    {
                        id: 'migracion_reciente', icon: 'clock', type: 'bar',
                        title: 'Población censada según lugar de residencia cinco años antes del censo (Migración reciente)',
                        categories: ['En el mismo distrito', 'En otro distrito', 'En otro país'],
                        data: [19_847_293, 13_234_892, 1_932_847],
                    },
                    {
                        id: 'inmigrante_intl', icon: 'globe-alt', type: 'kpi', kpiValue: '2 847 293',
                        title: 'Población censada inmigrante internacional',
                    },
                    {
                        id: 'emigracion_intl', icon: 'arrow-up-right', type: 'kpi', kpiValue: '1 234 892',
                        title: 'Emigración internacional (con nota metodológica)',
                        note: 'Nota metodológica: Esta variable fue recogida a nivel de hogar, por lo que refleja la declaración del jefe/a de hogar respecto a los miembros que emigraron al exterior en los últimos 5 años.',
                    },
                ],
            },
            // ── IDENTIDAD Y PROTECCIÓN SOCIAL ─────────────────────────────
            {
                id: 'identidad_proteccion', label: 'Identidad y protección social', icon: 'shield-check',
                gridClass: 'grid grid-cols-1 lg:grid-cols-3',
                indicators: [
                    { id: 'estado_civil',       title: 'Población censada de 12 y más años según estado civil o conyugal',                     icon: 'user-group',         type: 'column', categories: ['Conviviente','Separado/a','Casado/a','Viudo/a','Divorciado/a','Soltero/a'],  data: [4_234_892,892_293,8_234_847,1_847_293,234_892,12_847_293] },
                    { id: 'estado_civil_sexo',  title: 'Población censada de 12 y más años según estado civil o conyugal por sexo',             icon: 'users',              type: 'column', categories: ['Conviviente','Separado/a','Casado/a','Viudo/a','Divorciado/a','Soltero/a'],  data: [4_089_234,734_892,7_982_347,1_293_847,189_293,11_293_847] },
                    { id: 'estado_civil_edad',  title: 'Población censada de 12 y más años según estado civil por grandes grupos de edad',       icon: 'chart-bar-square',   type: 'bar',    categories: ['12-17 años','18-29 años','30-59 años','60 a más años'],                      data: [8_234_892,12_847_293,18_293_847,7_834_293] },
                    { id: 'tenencia_dni',        title: 'Población censada según tenencia de documento de identidad por sexo',                   icon: 'identification',     type: 'pie',    categories: ['Hombre con DNI','Mujer con DNI','Hombre sin DNI','Mujer sin DNI'],            data: [16_800_000,17_400_000,1_250_000,1_584_293] },
                    { id: 'dni_sexo',            title: 'Población con DNI por sexo',                                                           icon: 'users',              type: 'column', categories: ['Hombre','Mujer'],                                                            data: [16_847_293,17_387_599] },
                    { id: 'dni_edad',            title: 'Población con DNI por grandes grupos de edad',                                         icon: 'chart-bar',          type: 'column', categories: ['0-17 años','18-29 años','30-59 años','60 a más años'],                      data: [8_234_892,9_847_293,12_293_847,6_834_293] },
                    { id: 'cobertura_seguro',    title: 'Población censada con cobertura de seguro de salud',                                   icon: 'shield-check',       type: 'kpi',    kpiValue: '81.5%' },
                    { id: 'tipo_seguro',         title: 'Distribución por tipo de seguro de salud',                                             icon: 'chart-bar',          type: 'column', categories: ['SIS','EsSalud','FF.AA./PNP','Privado','Otro seguro','Sin seguro'],         data: [18_234_892,7_847_293,1_234_892,2_847_293,892_293,5_834_293] },
                    { id: 'seguro_sexo',         title: 'Población con seguro de salud por sexo',                                               icon: 'users',              type: 'column', categories: ['Hombre','Mujer'],                                                            data: [14_234_892,15_657_293] },
                    { id: 'seguro_edad',         title: 'Población con seguro de salud por grandes grupos de edad',                             icon: 'chart-bar',          type: 'column', categories: ['0-17 años','18-29 años','30-59 años','60 a más años'],                      data: [7_234_892,8_847_293,10_293_847,4_834_293] },
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
                        categories: ['Sin nivel','Ed. inicial','Primaria','Secundaria','Básica especial','Sup. no univ. incompleta','Sup. no univ. completa','Sup. univ. incompleta','Sup. univ. completa','Maestría incompleta','Maestría completa','Doctorado incompleto','Doctorado completo'],
                        data: [892_293,347_892,6_234_892,8_847_293,234_892,1_234_892,2_847_293,1_892_293,3_234_892,347_892,892_293,127_892,234_892],
                    },
                    { id: 'tasa_alfabetismo', title: 'Tasa de alfabetismo de la población de 15 y más años de edad', icon: 'book-open', type: 'kpi', kpiValue: '94.2%' },
                    {
                        id: 'uso_tics', title: "Población censada de 3 y más años según uso de TIC's",
                        icon: 'device-phone-mobile', type: 'column',
                        categories: ['Computadora','Tableta','Internet','Celular con aplicaciones'],
                        data: [12_234_892,3_847_293,18_293_847,28_834_293],
                    },
                ],
            },
            // ── DISCAPACIDAD ───────────────────────────────────────────────
            {
                id: 'discapacidad', label: 'Discapacidad', icon: 'hand-raised',
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                indicators: [
                    { id: 'disc_sexo',         title: 'Población con discapacidad según sexo',                    icon: 'users',        type: 'pie',    categories: ['Hombre','Mujer'],                                                                                                                     data: [980_293,1_120_892] },
                    { id: 'disc_edad',         title: 'Población con discapacidad según grandes grupos de edad',   icon: 'chart-bar',    type: 'column', categories: ['3 a 10 años','11 a 17 años','18 a 34 años','35 a más años'],                                                                          data: [187_293,234_892,547_293,1_130_892] },
                    { id: 'sin_disc_edad',     title: 'Población sin discapacidad según grandes grupos de edad',   icon: 'chart-bar',    type: 'column', categories: ['3 a 10 años','11 a 17 años','18 a 34 años','35 a más años'],                                                                          data: [6_234_892,9_847_293,15_293_847,4_834_293] },
                    { id: 'edad_prom_disc',    title: 'Edad promedio de la población con discapacidad',            icon: 'calculator',   type: 'kpi',    kpiValue: '42.7' },
                    { id: 'edad_mediana_disc', title: 'Edad mediana de la población con discapacidad',             icon: 'calculator',   type: 'kpi',    kpiValue: '38.0' },
                    {
                        id: 'disc_nivel_edu', title: 'Población con discapacidad según nivel educativo alcanzado',
                        icon: 'academic-cap', type: 'bar',
                        categories: ['Doctorado','Postgrado/Maestría','Primaria completa','Primaria incompleta','Secundaria completa','Secundaria incompleta','Sin instrucción','Sup. univ. completa','Sup. univ. incompleta','Técnico completo','Técnico incompleto'],
                        data: [47_892,127_293,234_892,347_293,547_892,392_293,192_892,127_293,187_892,234_293,192_892],
                    },
                    {
                        id: 'disc_esfera', title: 'Población con discapacidad según esfera de funcionamiento',
                        icon: 'chart-bar', type: 'bar',
                        categories: ['Limitaciones para concentrarse','Limitaciones para comunicarse','Limitaciones para ver','Limitaciones para caminar','Limitaciones para oír','Limitaciones para cuidado personal'],
                        data: [547_293,392_892,834_293,697_892,492_293,234_892],
                    },
                    { id: 'hogares_disc', title: 'Hogares con al menos una persona con discapacidad', icon: 'home', type: 'kpi', kpiValue: '1 847 293' },
                ],
            },
            // ── IDENTIFICACIÓN ÉTNICA ──────────────────────────────────────
            {
                id: 'identidad_etnica', label: 'Identificación étnica', icon: 'globe-americas',
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                indicators: [
                    {
                        id: 'id_etnica', title: 'Población censada según identificación étnica',
                        icon: 'globe-americas', type: 'pie',
                        categories: ['Quechua','Aimara','Indígena Amazonía','Otro indígena','Afroperuano/afrodesc.','Nikkei','Tusan','Blanco','Mestizo','Otro'],
                        data: [5_234_892,892_293,347_892,234_892,1_847_293,127_892,234_892,4_234_892,18_847_293,2_834_293],
                    },
                    { id: 'indigena_sexo',        title: 'Población que se identifica como pueblo indígena por sexo',                       icon: 'users',               type: 'column', categories: ['Hombre','Mujer'],                                                                    data: [3_234_892,3_134_293] },
                    { id: 'indigena_edad',         title: 'Población que se identifica como pueblo indígena por grandes grupos de edad',     icon: 'chart-bar',           type: 'column', categories: ['0-17 años','18-29 años','30-59 años','60 a más años'],                              data: [1_234_892,1_847_293,2_293_847,1_034_293] },
                    { id: 'indigena_edu',          title: 'Población que se identifica como pueblo indígena por nivel educativo',            icon: 'academic-cap',        type: 'column', categories: ['Sin nivel','Primaria','Secundaria','Superior'],                                      data: [1_234_892,2_847_293,2_293_847,992_293] },
                    { id: 'indigena_tics',         title: "Población que se identifica como pueblo indígena por uso de TIC's",               icon: 'device-phone-mobile', type: 'pie',    categories: ['Computadora','Tableta','Internet','Celular con aplicaciones'],                    data: [1_234_892,347_293,3_293_847,5_834_293] },
                    { id: 'indigena_estado_civil', title: 'Población que se identifica como pueblo indígena por estado civil',               icon: 'user-group',          type: 'column', categories: ['Conviviente','Separado/a','Casado/a','Viudo/a','Divorciado/a','Soltero/a'],        data: [1_234_892,347_293,2_293_847,847_293,127_892,2_518_847] },
                    { id: 'afro_sexo',             title: 'Población que se identifica como afroperuano o afrodescendiente por sexo',        icon: 'users',               type: 'bar',    categories: ['Hombre','Mujer'],                                                                    data: [127_293,147_892] },
                    { id: 'afro_edad',             title: 'Población afroperuana o afrodescendiente por grandes grupos de edad',             icon: 'chart-bar',           type: 'bar',    categories: ['0-17 años','18-29 años','30-59 años','60 a más años'],                              data: [87_293,134_892,127_293,27_892] },
                    { id: 'afro_edu',              title: 'Población afroperuana o afrodescendiente por nivel educativo',                    icon: 'academic-cap',        type: 'column', categories: ['Sin nivel','Primaria','Secundaria','Superior'],                                      data: [47_293,87_892,127_293,12_892] },
                    { id: 'afro_tics',             title: "Población afroperuana o afrodescendiente por uso de TIC's",                       icon: 'device-phone-mobile', type: 'pie',    categories: ['Computadora','Tableta','Internet','Celular con aplicaciones'],                    data: [47_293,12_892,127_293,187_892] },
                    { id: 'afro_estado_civil',     title: 'Población afroperuana o afrodescendiente por estado civil o conyugal',            icon: 'user-group',          type: 'column', categories: ['Conviviente','Separado/a','Casado/a','Viudo/a','Divorciado/a','Soltero/a'],        data: [87_293,12_892,47_293,27_892,3_892,95_293] },
                    { id: 'idioma_ninez',           title: 'Población censada según idioma con el que aprendió a hablar en su niñez',        icon: 'chat-bubble-left',    type: 'bar',    categories: ['Castellano','Quechua','Aimara','Lengua nativa Amazonía','Lengua extranjera','Señas','Otro idioma'], data: [26_234_892,5_847_293,892_293,347_892,127_892,47_892,127_892] },
                ],
            },
            // ── CARACTERÍSTICAS ECONÓMICAS ─────────────────────────────────
            {
                id: 'caracteristicas_economicas', label: 'Características económicas', icon: 'briefcase',
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3',
                indicators: [
                    { id: 'pet',               title: 'Población censada en edad de trabajar',                                      icon: 'briefcase',       type: 'kpi',    kpiValue: '26 847 293' },
                    { id: 'pet_condicion',      title: 'Población en edad de trabajar según condición de actividad',                  icon: 'chart-bar',       type: 'bar',    categories: ['Ocupado','Desocupado','Inactiva'],                                                         data: [17_234_892,1_847_293,7_765_108] },
                    { id: 'ocup_principal',     title: 'Población ocupada según ocupación principal',                                 icon: 'chart-bar',       type: 'bar',    categories: ['Directivos','Profesionales','Técnicos','Apoyo administrativo','Servicios','Agricultores','Artesanos','Operadores','Elementales'], data: [892_293,2_847_293,1_234_892,1_847_293,3_234_892,1_192_293,2_847_892,1_234_293,2_847_892] },
                    { id: 'rama_actividad',     title: 'Población ocupada según rama de actividad',                                   icon: 'chart-bar',       type: 'bar',    categories: ['Agricultura','Pesca/minería','Manufactura','Construcción','Comercio','Transporte','Servicios'], data: [3_234_892,892_293,2_847_293,1_192_293,3_847_892,1_234_293,3_597_892] },
                    { id: 'categ_ocupacion',    title: 'Población ocupada según categoría de ocupación',                              icon: 'chart-bar',       type: 'bar',    categories: ['Empleador','Independiente','Empleado','Obrero','Trab. del hogar','Trab. familiar no rem.'], data: [892_293,4_234_892,6_847_293,3_192_293,892_892,1_034_293] },
                    { id: 'tamano_empresa',     title: 'Población ocupada según tamaño de empresa',                                   icon: 'building-office', type: 'column', categories: ['1 a 10 personas','11 a 50 personas','51 a más personas'],                                  data: [9_234_892,4_847_293,2_192_293] },
                    { id: 'trabajo_mismo_dist', title: 'Población ocupada con centro de trabajo en su mismo distrito',                icon: 'map-pin',         type: 'kpi',    kpiValue: '9 234 847' },
                    { id: 'trabajo_otro_dist',  title: 'Población ocupada con centro de trabajo en otro distrito',                    icon: 'arrow-right',     type: 'kpi',    kpiValue: '3 847 293' },
                    { id: 'trabajo_otro_pais',  title: 'Población ocupada con centro de trabajo en otro país',                        icon: 'globe-alt',       type: 'kpi',    kpiValue: '284 729' },
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
                gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                indicators: [
                    { id: 'tipo_vivienda',        title: 'Tipo de vivienda particular',                                                                                    icon: 'home',      type: 'column',
                        categories: ['Casa independiente','Dep. en edificio','Viv. en quinta','Viv. casa vecindad','Choza/Cabaña','Viv. improvisada','Local no dest. hab.','Otro'],
                        data: [22_234_892,5_847_293,1_192_293,892_293,347_892,234_892,127_892,47_892] },
                    { id: 'condicion_ocupacion',  title: 'Condición de ocupación de la vivienda',                                                                           icon: 'chart-bar', type: 'column',
                        categories: ['Ocupada c/pres.','Ocupada c/aus.','De uso ocasional','Desocupada alq./vta.','Abandonada'],
                        data: [18_234_892,1_847_293,847_293,2_192_293,492_293] },
                    { id: 'material_paredes',     title: 'Material de construcción predominante en las paredes exteriores',                                                 icon: 'home',      type: 'column',
                        categories: ['Ladrillo/cemento','Adobe','Madera','Quincha','Estera','Otro'],
                        data: [16_234_892,5_847_293,1_192_293,892_293,347_892,234_892] },
                    { id: 'material_techos',      title: 'Material de construcción predominante en los techos',                                                             icon: 'home',      type: 'column',
                        categories: ['Concreto armado','Madera','Tejas','Calamina/fibra cem.','Caña/estera','Paja','Otro'],
                        data: [12_234_892,3_847_293,1_192_293,4_847_293,892_293,347_892,192_293] },
                    { id: 'material_pisos',       title: 'Material de construcción predominante en los pisos',                                                              icon: 'home',      type: 'column',
                        categories: ['Parquet/madera pulida','Láminas asfálticas','Losetas/terrazos','Madera entablada','Cemento','Tierra','Otro'],
                        data: [892_293,347_892,5_234_892,1_192_293,14_847_293,4_234_892,192_293] },
                    { id: 'calidad_vivienda',     title: 'Viviendas particulares según calidad de la vivienda',                                                             icon: 'star',      type: 'pie',
                        categories: ['Adecuada','Inadecuada en paredes','Inadecuada en techos','Inadecuada en pisos','Inadecuada en varios materiales'],
                        data: [18_234_892,2_847_293,1_192_293,1_347_892,892_293] },
                    { id: 'num_habitaciones',     title: 'Número de habitaciones de la vivienda',                                                                           icon: 'chart-bar', type: 'pie',
                        categories: ['1 habitación','2 habitaciones','3 habitaciones','4 habitaciones','5 o más habitaciones'],
                        data: [5_234_892,8_847_293,7_192_293,4_234_892,2_847_293] },
                    { id: 'abastecimiento_agua',  title: 'Viviendas particulares con ocupantes presentes según tipo de abastecimiento de agua',                              icon: 'beaker',    type: 'stacked',
                        categories: ['Red pública dentro viv.','Red pública fuera viv.','Pilón de uso público','Camión/cilindro','Pozo','Río/acequia','Lluvia','Otro'],
                        data: [17_234_892,2_847_293,892_293,347_892,1_192_293,234_892,127_892,47_892] },
                    { id: 'eliminacion_excretas', title: 'Viviendas particulares con ocupantes presentes según formas de eliminación de excretas',                          icon: 'beaker',    type: 'stacked',
                        categories: ['Red pública alc. dentro','Red pública fuera','Pozo séptico','Pozo ciego/letrina','Río/acequia/canal','Campo abierto','Otro'],
                        data: [14_234_892,1_847_293,2_192_293,892_293,347_892,1_234_892,127_892] },
                    { id: 'energia_electrica',    title: 'Viviendas particulares con ocupantes presentes según procedencia del suministro de energía eléctrica',            icon: 'bolt',      type: 'stacked',
                        categories: ['Red pública','Generador','Panel solar','Otro'],
                        data: [22_234_892,892_293,347_892,127_892] },
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
                    { id: 'tenencia_vivienda',    title: 'Tenencia de la vivienda que ocupa el hogar',                                     icon: 'home',                type: 'stacked',
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

// ── Definición de grupos de columnas para "Identidad y protección social" ────
const IDENTIDAD_COLUMN_GROUPS: readonly IdentidadColumnGroup[] = [
    {
        label:        'Indicadores de estado civil',
        color:        CLR.blue,
        indicatorIds: ['estado_civil', 'estado_civil_sexo', 'estado_civil_edad'],
    },
    {
        label:        'Indicadores de tenencia de documento de identidad',
        color:        CLR.teal,
        indicatorIds: ['tenencia_dni', 'dni_sexo', 'dni_edad'],
    },
    {
        label:        'Indicadores de cobertura de seguro de salud',
        color:        CLR.sky,
        indicatorIds: ['cobertura_seguro', 'tipo_seguro', 'seguro_sexo', 'seguro_edad'],
    },
];

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

      <!-- ══ BOTONERA DE SECCIONES + FILTROS GEO ══════════════════════════ -->
      <div class="w-full shrink-0" style="background:#ffffff; box-shadow: 0 2px 8px rgba(0,86,161,0.15);">
        <div class="flex items-center px-3 sm:px-5 py-1.5 gap-2" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            @for (btn of navSections; track btn.id) {
              <button [routerLink]="btn.route"
                class="flex flex-row items-center justify-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full
                       text-[11px] sm:text-[12px] font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none shrink-0"
                [style]="isBtnActive(btn)
                  ? 'background:#003d7a;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);'
                  : 'background:#0056a1;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.15);'">
                <app-hero-icon [name]="btn.icon" class="w-3.5 h-3.5 shrink-0 text-white"></app-hero-icon>
                <span class="text-white">{{ btn.label }}</span>
              </button>
            }
          </div>

          <!-- Filtros Geo (right) -->
          <div class="ml-auto flex items-center gap-2 overflow-x-auto">
            <button (click)="resetFilters()" class="flex items-center gap-1 text-gray-400 hover:text-[#0056a1] transition-colors text-[10px] font-black tracking-wide shrink-0 group whitespace-nowrap">
              <app-hero-icon [name]="'arrow-path'" class="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-300"></app-hero-icon>
              <span>Restablecer</span>
            </button>
            <div class="h-6 w-px bg-gray-200 shrink-0"></div>

            <!-- Departamento -->
            <div class="relative shrink-0">
              <button (click)="toggleGeoDropdown('dep'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-all whitespace-nowrap justify-between" style="min-width:120px">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0"></span>
                  <span class="text-gray-400">Dep.:</span>
                  <span class="truncate max-w-[70px]">{{ geoDepLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 text-gray-400 transition-transform" [class.rotate-180]="openGeoDropdown() === 'dep'"></app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'dep') {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-56 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar departamento</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <button (click)="selectDep(null)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedCCDD() === ''" [class.from-\[\#0056a1\]]="selectedCCDD() === ''" [class.to-\[\#1a75aa\]]="selectedCCDD() === ''"
                      [class.text-white]="selectedCCDD() === ''" [class.text-gray-700]="selectedCCDD() !== ''" [class.hover\:bg-blue-50]="selectedCCDD() !== ''">
                      <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedCCDD() === ''" [class.border-gray-300]="selectedCCDD() !== ''">
                        @if (selectedCCDD() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic text-[11px]">Todos los departamentos</span>
                    </button>
                    @for (dept of departments(); track dept.ccdd) {
                      <button (click)="selectDep(dept)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedCCDD() === dept.ccdd" [class.from-\[\#0056a1\]]="selectedCCDD() === dept.ccdd" [class.to-\[\#1a75aa\]]="selectedCCDD() === dept.ccdd"
                        [class.text-white]="selectedCCDD() === dept.ccdd" [class.text-gray-700]="selectedCCDD() !== dept.ccdd" [class.hover\:bg-blue-50]="selectedCCDD() !== dept.ccdd">
                        <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedCCDD() === dept.ccdd" [class.border-gray-300]="selectedCCDD() !== dept.ccdd">
                          @if (selectedCCDD() === dept.ccdd) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold">{{ dept.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Provincia -->
            <div class="relative shrink-0">
              <button (click)="isGeoProvActive() && toggleGeoDropdown('prov'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-bold transition-all whitespace-nowrap justify-between" style="min-width:110px"
                [class.bg-gray-50]="isGeoProvActive()" [class.border-gray-200]="isGeoProvActive()" [class.text-gray-700]="isGeoProvActive()" [class.hover\:bg-gray-100]="isGeoProvActive()"
                [class.bg-gray-50\/50]="!isGeoProvActive()" [class.border-gray-100]="!isGeoProvActive()" [class.text-gray-300]="!isGeoProvActive()" [class.cursor-not-allowed]="!isGeoProvActive()">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" [class.bg-\[\#0056a1\]]="isGeoProvActive()" [class.bg-gray-200]="!isGeoProvActive()"></span>
                  <span [class.text-gray-400]="isGeoProvActive()" [class.text-gray-300]="!isGeoProvActive()">Prov.:</span>
                  <span class="truncate max-w-[60px]">{{ geoProvLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 transition-transform"
                  [class.text-gray-400]="isGeoProvActive()" [class.text-gray-200]="!isGeoProvActive()" [class.rotate-180]="openGeoDropdown() === 'prov'"></app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'prov' && isGeoProvActive()) {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-56 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar provincia</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <button (click)="selectProv('')" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedProv() === ''" [class.from-\[\#0056a1\]]="selectedProv() === ''" [class.to-\[\#1a75aa\]]="selectedProv() === ''"
                      [class.text-white]="selectedProv() === ''" [class.text-gray-700]="selectedProv() !== ''" [class.hover\:bg-blue-50]="selectedProv() !== ''">
                      <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedProv() === ''" [class.border-gray-300]="selectedProv() !== ''">
                        @if (selectedProv() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic">Todas las provincias</span>
                    </button>
                    @for (p of provinces(); track p.code) {
                      <button (click)="selectProv(p.code)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedProv() === p.code" [class.from-\[\#0056a1\]]="selectedProv() === p.code" [class.to-\[\#1a75aa\]]="selectedProv() === p.code"
                        [class.text-white]="selectedProv() === p.code" [class.text-gray-700]="selectedProv() !== p.code" [class.hover\:bg-blue-50]="selectedProv() !== p.code">
                        <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedProv() === p.code" [class.border-gray-300]="selectedProv() !== p.code">
                          @if (selectedProv() === p.code) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold">{{ p.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Distrito -->
            <div class="relative shrink-0">
              <button (click)="isGeoDistActive() && toggleGeoDropdown('dist'); $event.stopPropagation()"
                class="flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-bold transition-all whitespace-nowrap justify-between" style="min-width:110px"
                [class.bg-gray-50]="isGeoDistActive()" [class.border-gray-200]="isGeoDistActive()" [class.text-gray-700]="isGeoDistActive()" [class.hover\:bg-gray-100]="isGeoDistActive()"
                [class.bg-gray-50\/50]="!isGeoDistActive()" [class.border-gray-100]="!isGeoDistActive()" [class.text-gray-300]="!isGeoDistActive()" [class.cursor-not-allowed]="!isGeoDistActive()">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" [class.bg-\[\#33b3a9\]]="isGeoDistActive()" [class.bg-gray-200]="!isGeoDistActive()"></span>
                  <span [class.text-gray-400]="isGeoDistActive()" [class.text-gray-300]="!isGeoDistActive()">Dist.:</span>
                  <span class="truncate max-w-[60px]">{{ geoDistLabel() }}</span>
                </span>
                <app-hero-icon [name]="'chevron-down'" class="w-3 h-3 transition-transform"
                  [class.text-gray-400]="isGeoDistActive()" [class.text-gray-200]="!isGeoDistActive()" [class.rotate-180]="openGeoDropdown() === 'dist'"></app-hero-icon>
              </button>
              @if (openGeoDropdown() === 'dist' && isGeoDistActive()) {
                <div class="absolute left-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-64 overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar distrito</span>
                  </div>
                  <div class="max-h-52 overflow-y-auto">
                    <button (click)="selectDist('')" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                      [class.bg-gradient-to-r]="selectedDist() === ''" [class.from-\[\#0056a1\]]="selectedDist() === ''" [class.to-\[\#1a75aa\]]="selectedDist() === ''"
                      [class.text-white]="selectedDist() === ''" [class.text-gray-700]="selectedDist() !== ''" [class.hover\:bg-blue-50]="selectedDist() !== ''">
                      <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedDist() === ''" [class.border-gray-300]="selectedDist() !== ''">
                        @if (selectedDist() === '') { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                      </span>
                      <span class="font-bold italic">Todos los distritos</span>
                    </button>
                    @for (d of districts(); track d.code) {
                      <button (click)="selectDist(d.code)" class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
                        [class.bg-gradient-to-r]="selectedDist() === d.code" [class.from-\[\#0056a1\]]="selectedDist() === d.code" [class.to-\[\#1a75aa\]]="selectedDist() === d.code"
                        [class.text-white]="selectedDist() === d.code" [class.text-gray-700]="selectedDist() !== d.code" [class.hover\:bg-blue-50]="selectedDist() !== d.code">
                        <span class="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center" [class.border-white]="selectedDist() === d.code" [class.border-gray-300]="selectedDist() !== d.code">
                          @if (selectedDist() === d.code) { <span class="w-1.5 h-1.5 bg-white rounded-full block"></span> }
                        </span>
                        <span class="font-semibold">{{ d.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div><!-- /filtros geo -->
        </div>
      </div><!-- /botonera -->

      <!-- ══ BARRA DE FILTROS ══════════════════════════════════════════════ -->
      <div class="bg-white border-b border-gray-100 shadow-sm sticky z-40
                  top-[38px] sm:top-[43px] md:top-[47px] lg:top-[50px]
                  px-2 py-1.5 md:px-4 shrink-0
                  flex flex-nowrap items-center gap-2 overflow-x-auto"
           (click)="$event.stopPropagation()">
        <div class="flex items-center gap-1 shrink-0">

          <!-- Botón padre: Ind. Principales -->
          <button (click)="$event.stopPropagation()"
            routerLink="/dashboard-censada"
            class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-200 shrink-0"
            [style]="expandedSection() === 'principales'
              ? 'background:linear-gradient(to right,#0056a1,#33b3a9);color:#fff;box-shadow:0 1px 6px rgba(0,86,161,0.30);'
              : 'background:#f3f4f6;color:#6b7280;'">
            <app-hero-icon [name]="'chart-bar'" class="w-3 h-3 shrink-0"></app-hero-icon>
            <span>Ind. Principales</span>
            <app-hero-icon [name]="'chevron-right'" class="w-3 h-3 shrink-0 transition-transform duration-200"
              [class.rotate-90]="expandedSection() === 'principales'"></app-hero-icon>
          </button>

          <!-- Sub-botones de Ind. Principales -->
          @if (expandedSection() === 'principales') {
            <div class="flex bg-gradient-to-r from-[#0056a1]/10 to-[#33b3a9]/10 border border-[#0056a1]/20 p-0.5 rounded-xl gap-0.5 shrink-0"
                 style="animation:fadeIn 0.15s ease-out forwards">
              @for (tab of viewTabs; track tab.route) {
                <button [routerLink]="tab.route"
                  class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all whitespace-nowrap"
                  [style]="isViewTabActive(tab.route) ? 'background:#fff;color:#0056a1;box-shadow:0 1px 4px rgba(0,0,0,0.10);' : 'color:#9ca3af;'">
                  <app-hero-icon [name]="tab.icon" class="w-3 h-3 shrink-0"></app-hero-icon>
                  <span>{{ tab.label }}</span>
                </button>
              }
            </div>
          }

          <!-- Botón padre: Ind. Temáticos — activo por defecto en esta vista -->
          <button (click)="toggleNavSection('tematicos'); $event.stopPropagation()"
            class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-200 shrink-0"
            [style]="expandedSection() === 'tematicos'
              ? 'background:linear-gradient(to right,#0056a1,#33b3a9);color:#fff;box-shadow:0 1px 6px rgba(0,86,161,0.30);'
              : 'background:#f3f4f6;color:#6b7280;'">
            <app-hero-icon [name]="'squares-2x2'" class="w-3 h-3 shrink-0"></app-hero-icon>
            <span>Ind. Temáticos</span>
            <app-hero-icon [name]="'chevron-right'" class="w-3 h-3 shrink-0 transition-transform duration-200"
              [class.rotate-90]="expandedSection() === 'tematicos'"></app-hero-icon>
          </button>

        </div>

        <!-- Ámbito geográfico actual -->
        <div class="ml-auto shrink-0 flex items-center gap-1.5 bg-[#0056a1]/5 border border-[#0056a1]/20 rounded-lg px-2 py-1">
          <app-hero-icon [name]="'map-pin'" class="w-3 h-3 text-[#0056a1] shrink-0"></app-hero-icon>
          <span class="text-[10px] font-black text-[#0056a1] whitespace-nowrap">{{ displayedTitle() }}</span>
        </div>
      </div><!-- /barra filtros -->

      <!-- ══ NAVEGACIÓN TEMÁTICA: GRUPOS + SECCIONES ════════════════════════ -->
      <div class="bg-white border-b border-gray-100 shrink-0" (click)="$event.stopPropagation()">

        <!-- Fila 1: Tabs de grupos -->
        <div class="flex items-center gap-0 border-b border-gray-100 px-2 overflow-x-auto">
          @for (group of thematicGroups; track group.id) {
            <button (click)="setActiveGroup(group.id)"
              class="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all duration-200 shrink-0"
              [style]="activeGroupId() === group.id
                ? 'border-color:' + group.color + ';color:' + group.color + ';'
                : 'border-color:transparent;color:#9ca3af;'">
              <app-hero-icon [name]="group.icon" class="w-3.5 h-3.5 shrink-0"></app-hero-icon>
              <span>{{ group.label }}</span>
            </button>
          }
        </div>

        <!-- Fila 2: Iconos de secciones — solo si el grupo tiene más de una sección -->
        @if (activeGroup(); as grp) {
          @if (grp.sections.length > 1) {
            <div class="flex items-stretch gap-1.5 px-2 py-1.5 overflow-x-auto"
                 style="animation: fadeIn 0.18s ease-out forwards">
              @for (sec of grp.sections; track sec.id) {
                <button (click)="setActiveSection(sec.id)"
                  class="relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl min-w-[80px] max-w-[100px] border transition-all duration-200 shrink-0"
                  [style]="activeSectionId() === sec.id
                    ? 'background:' + grp.color + ';border-color:' + grp.color + ';color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);'
                    : 'background:#f9fafb;border-color:#e5e7eb;color:#6b7280;'">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                       [style]="activeSectionId() === sec.id ? 'background:rgba(255,255,255,0.25);' : 'background:rgba(0,86,161,0.08);'">
                    <app-hero-icon [name]="sec.icon" class="w-4 h-4 shrink-0"></app-hero-icon>
                  </div>
                  <span class="text-[8.5px] font-bold text-center leading-tight line-clamp-2">{{ sec.label }}</span>
                </button>
              }
            </div>
          }
        }
      </div><!-- /navegación temática -->

      <!-- ══ MAIN ══════════════════════════════════════════════════════════════ -->
      <main class="flex-1 min-h-0 overflow-y-auto">

        @if (activeSection(); as sec) {

          <!-- ── FECUNDIDAD: KPIs premium, ocupa todo el main ──────────────── -->
          @if (sec.id === 'fecundidad') {
            <div class="h-full flex flex-col p-3 sm:p-4 lg:p-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 flex-1 min-h-0"
                   style="grid-auto-rows: minmax(190px, 1fr)">
                @for (ind of sec.indicators; track ind.id; let i = $index) {
                  <div class="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                       [class]="i === 4 ? 'lg:row-span-2 lg:col-start-3 lg:row-start-1' : ''"
                       [style]="'border-color:' + getFecundidadColor(i)">
                    <!-- Banda superior degradada -->
                    <div class="h-1.5 w-full shrink-0"
                         [style]="'background:linear-gradient(to right,' + getFecundidadGradient(i) + ')'"></div>
                    <!-- Cuerpo -->
                    <div class="relative flex-1 flex flex-col px-5 py-4 gap-3 min-h-0">
                      <!-- Icono info: esquina superior derecha -->
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all z-10"
                              [style]="'color:' + getFecundidadColor(i) + '80'">
                        <app-hero-icon [name]="'information-circle'" class="w-5 h-5"></app-hero-icon>
                      </button>
                      <!-- Icono + Título -->
                      <div class="flex items-start gap-3 pr-8">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                             [style]="'background:' + getFecundidadColor(i) + '18'">
                          <app-hero-icon [name]="getFecundidadIcon(i)" class="w-7 h-7"
                                         [style]="'color:' + getFecundidadColor(i)"></app-hero-icon>
                        </div>
                        <p class="text-[11px] sm:text-[12px] font-bold leading-snug pt-0.5"
                           [style]="'color:' + getFecundidadColor(i)">{{ ind.title }}</p>
                      </div>
                      <!-- Separador -->
                      <div class="h-px w-full shrink-0" [style]="'background:' + getFecundidadColor(i) + '22'"></div>
                      <!-- Valor KPI: aumentado 30% -->
                      <div class="flex-1 flex flex-col justify-center gap-1.5" [class.items-center]="i === 4">
                        <span class="font-black text-gray-800 tabular-nums tracking-tight leading-none"
                              [class.text-5xl]="i !== 4"
                              [class.sm:text-6xl]="i !== 4"
                              [class.text-6xl]="i === 4"
                              [class.sm:text-7xl]="i === 4">
                          {{ ind.kpiValue ?? '—' }}
                        </span>
                        <span class="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Censo 2025</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── MIGRACIÓN: Layout premium analítico, ocupa todo el main ──── -->
          @if (sec.id === 'migracion') {
            <div class="h-full flex flex-col p-3 sm:p-4 gap-4">
              <!-- Fila superior: gráficos de barras (60% del alto) -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4"
                   style="flex: 3 1 0%; min-height: 200px; grid-auto-rows: 1fr">
                @for (ind of getMigracionCharts(sec); track ind.id; let ci = $index) {
                  <div class="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border-l-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                       [style]="'border-left-color:' + getMigracionChartColor(ci)">
                    <div class="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-gray-50 shrink-0">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                           [style]="'background:' + getMigracionChartColor(ci) + '18'">
                        <app-hero-icon [name]="ind.icon" class="w-5 h-5"
                                       [style]="'color:' + getMigracionChartColor(ci)"></app-hero-icon>
                      </div>
                      <p class="flex-1 text-[11px] sm:text-[12px] font-black leading-snug text-gray-800 pt-0.5 min-w-0">{{ ind.title }}</p>
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-50 transition-all"
                              [style]="'color:' + getMigracionChartColor(ci) + '80'">
                        <app-hero-icon [name]="'information-circle'" class="w-5 h-5"></app-hero-icon>
                      </button>
                    </div>
                    @if (isBrowser) {
                      <div class="flex-1 min-h-0 px-2 pb-3 pt-2" style="min-height:160px">
                        <div echarts [options]="getChartOpt(ind, getMigracionChartColor(ci))" class="w-full h-full"></div>
                      </div>
                    }
                  </div>
                }
              </div>
              <!-- Fila inferior: KPI cards (40% del alto) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"
                   style="flex: 2 1 0%; min-height: 160px; grid-auto-rows: 1fr">
                @for (ind of getMigracionKpis(sec); track ind.id; let ki = $index) {
                  <div class="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                       [style]="'border-color:' + getMigracionKpiColor(ki)">
                    <div class="h-1.5 w-full shrink-0"
                         [style]="'background:linear-gradient(to right,' + getMigracionKpiGradient(ki) + ')'"></div>
                    <div class="relative flex-1 flex flex-col px-5 py-4 gap-3 min-h-0">
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all z-10"
                              [style]="'color:' + getMigracionKpiColor(ki) + '80'">
                        <app-hero-icon [name]="'information-circle'" class="w-5 h-5"></app-hero-icon>
                      </button>
                      <div class="flex items-start gap-3 pr-8">
                        <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                             [style]="'background:' + getMigracionKpiColor(ki) + '18'">
                          <app-hero-icon [name]="ind.icon" class="w-6 h-6"
                                         [style]="'color:' + getMigracionKpiColor(ki)"></app-hero-icon>
                        </div>
                        <p class="text-[11px] sm:text-[12px] font-bold leading-snug pt-0.5"
                           [style]="'color:' + getMigracionKpiColor(ki)">{{ ind.title }}</p>
                      </div>
                      <div class="h-px w-full shrink-0" [style]="'background:' + getMigracionKpiColor(ki) + '22'"></div>
                      <div class="flex-1 flex flex-col justify-center gap-1.5">
                        <span class="text-5xl sm:text-6xl font-black text-gray-800 tabular-nums tracking-tight leading-none">
                          {{ ind.kpiValue ?? '—' }}
                        </span>
                        <span class="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Censo 2025</span>
                        @if (ind.note) {
                          <div class="mt-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                            <p class="text-[7.5px] text-amber-700 font-semibold leading-tight">{{ ind.note }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── IDENTIDAD Y PROTECCIÓN SOCIAL: 3 columnas con height filling ── -->
          @if (sec.id === 'identidad_proteccion') {
            <div class="h-full flex flex-col p-2 sm:p-3 md:p-4">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
                @for (colGroup of identidadColumnGroups; track colGroup.label) {
                  <div class="flex flex-col gap-3 min-h-0 overflow-y-auto">
                    <!-- Cabecera del grupo de columna -->
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                         [style]="'background:' + colGroup.color + '12;border-left:3px solid ' + colGroup.color">
                      <span class="text-[9px] font-black uppercase tracking-widest" [style]="'color:' + colGroup.color">{{ colGroup.label }}</span>
                    </div>
                    <!-- Tarjetas: flex-1 para distribuir el alto disponible -->
                    @for (ind of getIndicatorsForGroup(sec, colGroup.indicatorIds); track ind.id) {
                      <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all duration-200 flex-1"
                           style="min-height:175px">
                        <!-- Header con icono inline -->
                        <div class="flex items-start gap-2 px-3 pt-3 pb-2 shrink-0 border-b"
                             [style]="'border-color:' + colGroup.color + '22'">
                          <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                               [style]="'background:' + colGroup.color + '15'">
                            <app-hero-icon [name]="ind.icon" class="w-4 h-4" [style]="'color:' + colGroup.color"></app-hero-icon>
                          </div>
                          <span class="flex-1 text-[9px] font-black text-gray-600 leading-tight pt-0.5 min-w-0">{{ ind.title }}</span>
                          <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                                  class="w-5 h-5 flex items-center justify-center shrink-0 rounded-full hover:bg-gray-50 transition-all">
                            <app-hero-icon [name]="'information-circle'" class="w-3.5 h-3.5"
                                           [style]="'color:' + colGroup.color + '70'"></app-hero-icon>
                          </button>
                        </div>
                        <!-- KPI body -->
                        @if (ind.type === 'kpi') {
                          <div class="flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3">
                            <span class="text-4xl sm:text-5xl font-black tabular-nums tracking-tight"
                                  [style]="'color:' + colGroup.color">{{ ind.kpiValue ?? '—' }}</span>
                            <span class="text-[8px] font-semibold uppercase tracking-widest text-gray-400">Censo 2025</span>
                          </div>
                        }
                        <!-- Chart body -->
                        @if (ind.type !== 'kpi' && isBrowser) {
                          <div class="flex-1 min-h-0 px-0.5 pt-0.5 pb-1" style="min-height:130px">
                            <div echarts [options]="getChartOpt(ind, colGroup.color)" class="w-full h-full"></div>
                          </div>
                          @if (ind.note) {
                            <div class="px-2 pb-1.5 shrink-0">
                              <div class="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                                <p class="text-[7.5px] text-amber-700 font-semibold leading-tight">{{ ind.note }}</p>
                              </div>
                            </div>
                          }
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── SECCIONES GENÉRICAS: grids que ocupan todo el main ──────────── -->
          @if (sec.id !== 'fecundidad' && sec.id !== 'migracion' && sec.id !== 'identidad_proteccion') {
            <div class="h-full flex flex-col p-2 sm:p-3 md:p-4">
              <div [class]="sec.gridClass + ' gap-3 flex-1 min-h-0'"
                   style="grid-auto-rows: minmax(200px, 1fr)">
                @for (ind of sec.indicators; track ind.id) {
                  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    <!-- Banda de color superior -->
                    <div class="h-1 w-full shrink-0"
                         [style]="'background:linear-gradient(to right,' + (activeGroup()?.color ?? '#0056a1') + ',' + getSecondaryColor() + ')'"></div>
                    <!-- Header: icono + título + info -->
                    <div class="flex items-start gap-2.5 px-3 pt-3 pb-2.5 shrink-0 border-b border-gray-50">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                           [style]="'background:' + (activeGroup()?.color ?? '#0056a1') + '15'">
                        <app-hero-icon [name]="ind.icon" class="w-4 h-4"
                                       [style]="'color:' + (activeGroup()?.color ?? '#0056a1')"></app-hero-icon>
                      </div>
                      <p class="flex-1 text-[10px] sm:text-[11px] font-black leading-snug text-gray-700 pt-0.5 min-w-0">{{ ind.title }}</p>
                      <button matTooltip="Ver información metodológica" matTooltipClass="custom-tooltip"
                              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-50 transition-all">
                        <app-hero-icon [name]="'information-circle'" class="w-4 h-4"
                                       [style]="'color:' + (activeGroup()?.color ?? '#0056a1') + '60'"></app-hero-icon>
                      </button>
                    </div>
                    <!-- KPI body -->
                    @if (ind.type === 'kpi') {
                      <div class="flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3">
                        <span class="text-4xl sm:text-5xl font-black tabular-nums tracking-tight leading-none"
                              [style]="'color:' + (activeGroup()?.color ?? '#0056a1')">
                          {{ ind.kpiValue ?? '—' }}
                        </span>
                        <span class="text-[8px] font-semibold uppercase tracking-widest text-gray-400">Censo 2025</span>
                        @if (ind.note) {
                          <div class="mt-2 w-full bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                            <p class="text-[7.5px] text-amber-700 font-semibold leading-tight">{{ ind.note }}</p>
                          </div>
                        }
                      </div>
                    }
                    <!-- Chart body: flex-1 para ocupar todo el espacio disponible -->
                    @if (ind.type !== 'kpi' && isBrowser) {
                      <div class="flex-1 min-h-0 px-1 pt-1 pb-2" style="min-height:145px">
                        <div echarts [options]="getChartOpt(ind)" class="w-full h-full"></div>
                      </div>
                      @if (ind.note) {
                        <div class="px-3 pb-2 shrink-0">
                          <div class="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                            <p class="text-[7.5px] text-amber-700 font-semibold leading-tight">{{ ind.note }}</p>
                          </div>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          }

        }
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

    // ── Header ───────────────────────────────────────────────────────────
    censosOpen     = signal(false);
    mobileMenuOpen = signal(false);

    readonly censosMenu = [
        { label: 'Censo de Derecho',          route: '/censo-derecho' },
        { label: 'Características técnicas',  route: '/aspectos-generales' },
        { label: 'Innovaciones tecnológicas', route: '/innovaciones' },
        { label: 'Normatividad censal',        route: '/normativa' },
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
        { id: 'poblacion_total',     label: 'Indicadores de Población total',                icon: 'chart-bar',      route: '/dashboard' },
        { id: 'poblacion_viviendas', label: 'Indicadores de población y viviendas censadas', icon: 'home',           route: '/dashboard-censada' },
        { id: 'comunidades',         label: 'Indicadores de comunidades indígenas',          icon: 'globe-americas', route: '/dashboard-ccomunidades' },
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

    // ── Geo state ─────────────────────────────────────────────────────────
    readonly NIVELES_GEO: NivelGeoType[] = ['Departamental', 'Provincial', 'Distrital'];
    nivelGeo        = signal<NivelGeoType>('Departamental');
    openGeoDropdown = signal<'dep' | 'prov' | 'dist' | null>(null);
    selectedCCDD    = signal<string>('');
    selectedProv    = signal<string>('');
    selectedDist    = signal<string>('');

    isGeoProvActive = computed(() => this.nivelGeo() !== 'Departamental');
    isGeoDistActive = computed(() => this.nivelGeo() === 'Distrital');

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

    geoDepLabel  = computed(() => { const c = this.selectedCCDD(); return c ? (this.departments().find(d => d.ccdd === c)?.name ?? c) : 'Todas'; });
    geoProvLabel = computed(() => { const c = this.selectedProv();  return c ? (this.provinces().find(p => p.code === c)?.name ?? c) : 'Todas'; });
    geoDistLabel = computed(() => { const c = this.selectedDist();  return c ? (this.districts().find(d => d.code === c)?.name ?? c) : 'Todos'; });

    displayedTitle = computed<string>(() => {
        const dist = this.selectedDist(); if (dist) return this.districts().find(d => d.code === dist)?.name ?? dist;
        const prov = this.selectedProv(); if (prov) return this.provinces().find(p => p.code === prov)?.name ?? prov;
        const ccdd = this.selectedCCDD(); if (ccdd) return this.departments().find(d => d.ccdd === ccdd)?.name ?? 'Perú (Nacional)';
        return 'Perú (Nacional)';
    });

    toggleGeoDropdown(key: 'dep' | 'prov' | 'dist'): void { this.openGeoDropdown.set(this.openGeoDropdown() === key ? null : key); }
    closeGeoDropdowns(): void { this.openGeoDropdown.set(null); }

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
        this.nivelGeo.set('Departamental'); this.openGeoDropdown.set(null);
    }

    // ── Platform e inyecciones ────────────────────────────────────────────
    isBrowser       = false;
    private platformId = inject(PLATFORM_ID);
    private http       = inject(HttpClient);
    private router     = inject(Router);

    constructor() { this.isBrowser = isPlatformBrowser(this.platformId); }

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
            case 'column':  return this.buildColumnOpt(cats, data, color);
            case 'bar':     return this.buildBarOpt(cats, data, color);
            case 'pie':     return this.buildPieOpt(cats, data);
            case 'stacked': return this.buildStackedBarOpt(cats, data, color, indicator.id);
            default:        return {};
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
                textStyle: { color: '#374151', fontSize: 10 },
                formatter: (params: any) => {
                    const p = params[0];
                    return `<span style="font-size:9px;font-weight:900;color:#9ca3af">${p.name}</span><br>`
                         + `<span style="font-size:12px;font-weight:900;color:${color}">${this.fmt(p.value as number)}</span>`;
                },
            },
            grid: { top: showLabel ? 22 : 8, right: 6, bottom: rotate > 0 ? 48 : 28, left: 4, containLabel: true },
            xAxis: {
                type: 'category',
                data: [...categories],
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { fontSize: 7, color: '#9ca3af', interval: 0, rotate, overflow: 'break', width: 60 },
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
                    color: '#374151',
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
                textStyle: { color: '#374151', fontSize: 10 },
                formatter: (params: any) => {
                    const p = Array.isArray(params)
                        ? (params as any[]).find((x: any) => x.seriesName !== '_bg') ?? params[0]
                        : params;
                    return `<span style="font-size:9px;font-weight:900;color:#9ca3af">${p.name}</span><br>`
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
                axisLabel: { fontSize: 8, color: '#6b7280', width: 110, overflow: 'break' },
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
                        color: '#374151',
                        formatter: (p: any) => this.fmtAxis(p.value as number),
                    },
                    emphasis: { itemStyle: { opacity: 0.85 } },
                },
            ],
        };
    }

    // ── Gráfico de torta/donut con leyenda + valores absolutos ────────────
    private buildPieOpt(categories: readonly string[], data: readonly number[]): EChartsOption {
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: [6, 10],
                textStyle: { color: '#374151', fontSize: 10 },
                formatter: (p: any) =>
                    `<span style="font-size:9px;font-weight:700;color:#9ca3af">${p.name}</span><br>`
                  + `<span style="font-size:11px;font-weight:900;color:${PIE_COLORS[p.dataIndex % PIE_COLORS.length]}">${this.fmt(p.value as number)}</span>`
                  + `<span style="font-size:9px;color:#9ca3af"> (${p.percent?.toFixed(1)}%)</span>`,
            },
            legend: {
                type: 'scroll',
                orient: 'horizontal',
                bottom: 0,
                left: 'center',
                textStyle: { fontSize: 8, color: '#6b7280' },
                itemWidth: 8,
                itemHeight: 8,
                pageIconSize: 8,
                formatter: (name: string) => {
                    const idx = categories.indexOf(name);
                    return idx >= 0 ? `${name}: ${this.fmt(data[idx])}` : name;
                },
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
                textStyle: { color: '#374151', fontSize: 9 },
            },
            legend: {
                data: [label1, label2],
                top: 2,
                left: 'center',
                textStyle: { fontSize: 7, color: '#9ca3af' },
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
                axisLabel: { fontSize: 7, color: '#9ca3af', width: 100, overflow: 'break' },
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