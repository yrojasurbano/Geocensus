import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  computed,
  signal
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

// ─── Domain Types ──────────────────────────────────────────────────────────────

type IconoTema =
  | 'demografico'      | 'fecundidad'       | 'migracion'        | 'identidad'
  | 'educacion'        | 'discapacidad'      | 'etnicidad'        | 'economico'
  | 'vivienda_caract'  | 'servicios_basicos' | 'hogar_caract'     | 'equipamiento';

interface ArchivoDescarga { readonly descripcion: string; readonly tamano: number; }
interface TemaDescarga {
  readonly id: string; readonly nombre: string;
  readonly icono: IconoTema; readonly archivos: readonly ArchivoDescarga[];
}
interface Pestana { readonly id: PestanaContenido; readonly label: string; }

type NavPrincipal     = 'predefinidos' | 'interactivos';
type NavTopBar        = 'cuadros'      | 'microdatos' | 'redatam';
type PestanaContenido = 'poblacion'    | 'vivienda'   | 'hogar';

// ─── Interactivos Types ────────────────────────────────────────────────────────

type NivelVisualizacion  = 'nacional' | 'departamental' | 'provincial' | 'distrital';
type VariableInteractiva = 'poblacion' | 'vivienda' | 'hogar';

interface Indicador {
  readonly id: string; readonly nombre: string; readonly categorias: readonly string[];
}
interface TematicoInt {
  readonly id: string; readonly nombre: string; readonly indicadores: readonly Indicador[];
}
interface UbigeoItem    { readonly codigo: string; readonly nombre: string; }
interface DeptoPoblacion { readonly codigo: string; readonly nombre: string; readonly total: number; }
interface FilaTabla {
  readonly nro: number; readonly geo: readonly string[];
  readonly total: number; readonly valores: readonly number[];
}
interface ConsultaActiva {
  readonly indicadorId: string; readonly nivel: NivelVisualizacion;
  readonly variable: VariableInteractiva;
  readonly deptoCodigo: string; readonly deptoNombre: string;
  readonly provCodigo:  string; readonly provNombre:  string;
  readonly distCodigo:  string; readonly distNombre:  string;
}

// ─── Static Data — Predefinidos ────────────────────────────────────────────────

const TEMAS_POBLACION: readonly TemaDescarga[] = [
  { id:'demografico',  nombre:'Indicadores demográficos',               icono:'demografico',
    archivos:[{ descripcion:'Población censada y principales indicadores demográficos', tamano:2.4}] },
  { id:'fecundidad',   nombre:'Fecundidad',                              icono:'fecundidad',
    archivos:[
      { descripcion:'Características de la fecundidad de la población femenina', tamano:1.8},
      { descripcion:'Sobrevivencia de hijas e hijos nacidos vivos',               tamano:1.2}] },
  { id:'migracion',    nombre:'Migración',                               icono:'migracion',
    archivos:[
      { descripcion:'Migración reciente',        tamano:1.6},
      { descripcion:'Migración de toda la vida', tamano:1.9}] },
  { id:'identidad',    nombre:'Estado civil, identidad y seguro de salud', icono:'identidad',
    archivos:[
      { descripcion:'Características de la población por estado civil', tamano:2.1},
      { descripcion:'Tenencia de documento de identidad',               tamano:1.4},
      { descripcion:'Cobertura de seguro de salud',                     tamano:1.7}] },
  { id:'educacion',    nombre:'Educación',                               icono:'educacion',
    archivos:[
      { descripcion:'Características de la población por asistencia escolar', tamano:2.3},
      { descripcion:'Nivel educativo alcanzado',                              tamano:2.8},
      { descripcion:'Condición de alfabetismo',                               tamano:1.5},
      { descripcion:'Uso de las tecnologías de la información',               tamano:1.9}] },
  { id:'discapacidad', nombre:'Discapacidad',                            icono:'discapacidad',
    archivos:[{ descripcion:'Características de la población por condición de discapacidad', tamano:2.2}] },
  { id:'etnicidad',    nombre:'Etnicidad',                               icono:'etnicidad',
    archivos:[
      { descripcion:'Autoidentificación étnica',                              tamano:1.6},
      { descripcion:'Idiomas o lenguas que aprendieron a hablar en su niñez', tamano:1.8}] },
  { id:'economico',    nombre:'Características económicas',              icono:'economico',
    archivos:[
      { descripcion:'Características de la Población en Edad de Trabajar', tamano:3.1},
      { descripcion:'Condición de actividad',                               tamano:2.7},
      { descripcion:'Ocupación principal',                                  tamano:2.4},
      { descripcion:'Rama de actividad económica',                          tamano:2.9}] }
];

const TEMAS_VIVIENDA: readonly TemaDescarga[] = [
  { id:'vivienda_caract',   nombre:'Características de la vivienda',          icono:'vivienda_caract',
    archivos:[
      { descripcion:'Tipo de vivienda particular',                            tamano:1.8},
      { descripcion:'Materiales de construcción de paredes, techos y pisos', tamano:2.6},
      { descripcion:'Número de habitaciones',                                 tamano:1.4}] },
  { id:'servicios_basicos', nombre:'Servicios básicos de la vivienda',        icono:'servicios_basicos',
    archivos:[
      { descripcion:'Procedencia del agua',                 tamano:1.9},
      { descripcion:'Conexión del servicio higiénico',      tamano:1.7},
      { descripcion:'Procedencia de la energía eléctrica',  tamano:1.5}] }
];

const TEMAS_HOGAR: readonly TemaDescarga[] = [
  { id:'hogar_caract', nombre:'Características del hogar', icono:'hogar_caract',
    archivos:[
      { descripcion:'Condición de tenencia de la vivienda que ocupan los hogares',        tamano:2.1},
      { descripcion:'Uso exclusivo del servicio higiénico',                               tamano:1.6},
      { descripcion:'Energía o combustible que usan para cocinar',                        tamano:1.8},
      { descripcion:'Formas de eliminación de residuos',                                  tamano:1.7},
      { descripcion:'Emigración internacional de personas que fueron miembros del hogar', tamano:2.3}] },
  { id:'equipamiento', nombre:'Equipamiento del hogar', icono:'equipamiento',
    archivos:[
      { descripcion:'Tenencia de medios de transporte, electrodomésticos y artefactos', tamano:2.8},
      { descripcion:'Tenencia de dispositivos TICs',                                    tamano:2.4}] }
];

const ICON_PATHS: Record<IconoTema, string> = {
  demografico:     'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  fecundidad:      'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  migracion:       'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  identidad:       'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  educacion:       'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
  discapacidad:    'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
  etnicidad:       'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 01.284-2.253',
  economico:       'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z',
  vivienda_caract: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  servicios_basicos:'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  hogar_caract:    'M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819',
  equipamiento:    'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0h.008v.008H21V5.25z'
};


// ─── Static Data — Interactivos ────────────────────────────────────────────────

const TEMATICOS_POBLACION: readonly TematicoInt[] = [
  { id:'demograficos', nombre:'Demográficos', indicadores:[
    { id:'sexo',               nombre:'Sexo',                categorias:['HOMBRE','MUJER'] },
    { id:'grandes_grupos_edad',nombre:'Grandes grupos de edad',categorias:['0 – 14 años','15 a 59 años','60 y más años'] }
  ]},
  { id:'fecundidad_int', nombre:'Fecundidad', indicadores:[
    { id:'hijos_nacidos_vivos',nombre:'Mujeres según número de hijas e hijos nacidos vivos',
      categorias:['Ninguno','1 hijo(a)','2 hijos(as)','3 a más hijos(as)'] }
  ]},
  { id:'migracion_int', nombre:'Migración', indicadores:[
    { id:'residencia_5_anos',nombre:'Lugar de residencia 5 años antes del censo',
      categorias:['Mismo distrito','Otro distrito','Otro país','No aplicable'] },
    { id:'residencia_madre', nombre:'Lugar de residencia de la madre al momento de nacer',
      categorias:['Mismo distrito','Otro distrito','Otro país'] }
  ]},
  { id:'identidad_int', nombre:'Identidad y Protección Social', indicadores:[
    { id:'tipo_dni',    nombre:'Tipo de documento nacional de identidad',
      categorias:['DNI','Partida de nacimiento','Sin documento'] },
    { id:'estado_civil',nombre:'Estado civil',
      categorias:['Soltero(a)','Casado(a)','Conviviente','Separado(a)','Divorciado(a)','Viudo(a)'] },
    { id:'seguro_salud',nombre:'Tenencia de seguro de salud',categorias:['Con seguro','Sin seguro'] }
  ]},
  { id:'educacion_int', nombre:'Educación', indicadores:[
    { id:'asistencia_escolar',nombre:'Asistencia escolar',categorias:['Asiste','No asiste','No aplicable'] },
    { id:'nivel_educativo',   nombre:'Nivel educativo alcanzado',
      categorias:['Sin nivel','Inicial','Primaria','Secundaria','Superior no universitaria','Superior universitaria'] },
    { id:'alfabetismo',       nombre:'Condición de alfabetismo',categorias:['Alfabeto','Analfabeto'] },
    { id:'dispositivos_tics', nombre:'Uso de dispositivos TICs',categorias:['Usa','No usa'] },
    { id:'uso_internet',      nombre:'Uso de internet',categorias:['Usa','No usa'] }
  ]},
  { id:'discapacidad_int', nombre:'Discapacidad', indicadores:[
    { id:'disc_ver',         nombre:'Discapacidad para ver',                        categorias:['Sí tiene','No tiene'] },
    { id:'disc_oir',         nombre:'Discapacidad para oir',                        categorias:['Sí tiene','No tiene'] },
    { id:'disc_comunicarse', nombre:'Discapacidad para comunicarse',                categorias:['Sí tiene','No tiene'] },
    { id:'disc_caminar',     nombre:'Discapacidad para caminar',                    categorias:['Sí tiene','No tiene'] },
    { id:'disc_cuidado',     nombre:'Discapacidad para el cuidado personal',        categorias:['Sí tiene','No tiene'] },
    { id:'disc_concentrar',  nombre:'Discapacidad para concentrarse',               categorias:['Sí tiene','No tiene'] },
    { id:'disc_relacionarse',nombre:'Discapacidad para relacionarse con los demás', categorias:['Sí tiene','No tiene'] }
  ]},
  { id:'etnicidad_int', nombre:'Etnicidad', indicadores:[
    { id:'identificacion_etnica',nombre:'Identificación étnica',
      categorias:['Quechua','Aymara','Amazónica','Nativa o Indígena','Afroperuano','Blanco','Mestizo','Otro'] },
    { id:'lengua_ninez',nombre:'Idiomas o lenguas con las que aprendió a hablar en la niñez',
      categorias:['Castellano','Quechua','Aymara','Otra lengua nativa','Lengua extranjera'] }
  ]},
  { id:'economico_int', nombre:'Características Económicas', indicadores:[
    { id:'pet',                nombre:'Población en edad de trabajar',
      categorias:['En edad de trabajar','Sin edad de trabajar'] },
    { id:'condicion_ocupacion',nombre:'Condición de ocupación',
      categorias:['Ocupado','Desocupado','Inactivo'] }
  ]}
];

const TEMATICOS_VIVIENDA: readonly TematicoInt[] = [
  { id:'caract_viv', nombre:'Características de la Vivienda', indicadores:[
    { id:'tipo_vivienda',   nombre:'Tipo de vivienda particular',
      categorias:['Casa independiente','Departamento en edificio','Vivienda en quinta','Choza o cabaña','Otro tipo'] },
    { id:'material_paredes',nombre:'Material predominante en las paredes',
      categorias:['Ladrillo o bloque de cemento','Piedra o sillar','Adobe','Madera','Estera','Otro material'] },
    { id:'material_techos', nombre:'Material predominante en los techos',
      categorias:['Concreto armado','Madera','Tejas','Plancha de calamina','Caña o estera','Otro material'] },
    { id:'material_pisos',  nombre:'Material predominante en los pisos',
      categorias:['Parquet o madera pulida','Láminas asfálticas','Losetas o terrazos','Madera','Cemento','Tierra','Otro'] },
    { id:'num_habitaciones',nombre:'Número de habitaciones',
      categorias:['1 habitación','2 habitaciones','3 habitaciones','4 habitaciones','5 y más habitaciones'] }
  ]},
  { id:'servicios_viv', nombre:'Servicios Básicos de la Vivienda', indicadores:[
    { id:'proc_agua',         nombre:'Procedencia del agua',
      categorias:['Red pública dentro de la vivienda','Red pública fuera de la vivienda','Pilón de uso público','Camión cisterna','Río, acequia, manantial','Otro'] },
    { id:'servicio_higienico',nombre:'Conexión del servicio higiénico',
      categorias:['Red pública de desagüe dentro de la vivienda','Red pública fuera de la vivienda','Pozo séptico','Pozo ciego','Río, acequia, canal','Otro'] },
    { id:'energia_electrica', nombre:'Procedencia de la energía eléctrica',
      categorias:['Red pública','Generador eléctrico','Energía solar','No tiene'] }
  ]}
];

const TEMATICOS_HOGAR: readonly TematicoInt[] = [
  { id:'caract_hogar', nombre:'Características del Hogar', indicadores:[
    { id:'tenencia_vivienda',       nombre:'Condición de tenencia de la vivienda que ocupan los hogares',
      categorias:['Alquilada','Propia totalmente pagada','Propia pagando a plazos','Cedida por empleador','Cedida por otra razón','Otra forma'] },
    { id:'uso_sshh',                nombre:'Uso exclusivo del servicio higiénico',
      categorias:['Uso exclusivo del hogar','Compartido con otros hogares'] },
    { id:'energia_cocinar',         nombre:'Energía o combustible que usan para cocinar',
      categorias:['Gas licuado','Gas natural','Electricidad','Kerosene','Carbón','Leña','Otro'] },
    { id:'eliminacion_residuos',    nombre:'Formas de eliminación de residuos',
      categorias:['Servicio municipal de limpieza','Botadero','Quema','Entierra','Río o acequia','Otro'] },
    { id:'emigracion_internacional',nombre:'Emigración internacional de personas que fueron miembros del hogar',
      categorias:['Hogares con emigrante','Hogares sin emigrante'] }
  ]},
  { id:'equipamiento_hogar', nombre:'Equipamiento del Hogar', indicadores:[
    { id:'medios_transporte',    nombre:'Tenencia de medios de transporte, electrodomésticos y artefactos',
      categorias:['Tiene auto o camioneta','Tiene motocicleta','Tiene bicicleta','No tiene ninguno'] },
    { id:'dispositivos_tics_hog',nombre:'Tenencia de dispositivos TICs',
      categorias:['Tiene computadora','Tiene laptop','Tiene tablet','Tiene teléfono celular','No tiene ninguno'] }
  ]}
];

// ─── Ubigeo ────────────────────────────────────────────────────────────────────

const DEPARTAMENTOS: readonly UbigeoItem[] = [
  {codigo:'01',nombre:'AMAZONAS'},{codigo:'02',nombre:'ÁNCASH'},{codigo:'03',nombre:'APURÍMAC'},
  {codigo:'04',nombre:'AREQUIPA'},{codigo:'05',nombre:'AYACUCHO'},{codigo:'06',nombre:'CAJAMARCA'},
  {codigo:'07',nombre:'CALLAO'},{codigo:'08',nombre:'CUSCO'},{codigo:'09',nombre:'HUANCAVELICA'},
  {codigo:'10',nombre:'HUÁNUCO'},{codigo:'11',nombre:'ICA'},{codigo:'12',nombre:'JUNÍN'},
  {codigo:'13',nombre:'LA LIBERTAD'},{codigo:'14',nombre:'LAMBAYEQUE'},{codigo:'15',nombre:'LIMA'},
  {codigo:'16',nombre:'LORETO'},{codigo:'17',nombre:'MADRE DE DIOS'},{codigo:'18',nombre:'MOQUEGUA'},
  {codigo:'19',nombre:'PASCO'},{codigo:'20',nombre:'PIURA'},{codigo:'21',nombre:'PUNO'},
  {codigo:'22',nombre:'SAN MARTÍN'},{codigo:'23',nombre:'TACNA'},{codigo:'24',nombre:'TUMBES'},
  {codigo:'25',nombre:'UCAYALI'}
];

const PROVINCIAS_POR_DEPTO: Record<string, readonly UbigeoItem[]> = {
  '01':[{codigo:'0101',nombre:'CHACHAPOYAS'},{codigo:'0102',nombre:'BAGUA'},{codigo:'0103',nombre:'BONGARÁ'},{codigo:'0104',nombre:'CONDORCANQUI'},{codigo:'0105',nombre:'LUYA'},{codigo:'0106',nombre:'RODRÍGUEZ DE MENDOZA'},{codigo:'0107',nombre:'UTCUBAMBA'}],
  '02':[{codigo:'0201',nombre:'HUARAZ'},{codigo:'0202',nombre:'AIJA'},{codigo:'0203',nombre:'ASUNCIÓN'},{codigo:'0204',nombre:'BOLOGNESI'},{codigo:'0205',nombre:'CARHUAZ'},{codigo:'0206',nombre:'CASMA'},{codigo:'0207',nombre:'CORONGO'},{codigo:'0208',nombre:'HUARI'},{codigo:'0209',nombre:'HUARMEY'},{codigo:'0210',nombre:'HUAYLAS'},{codigo:'0211',nombre:'OCROS'},{codigo:'0212',nombre:'PALLASCA'},{codigo:'0213',nombre:'POMABAMBA'},{codigo:'0214',nombre:'RECUAY'},{codigo:'0215',nombre:'SANTA'},{codigo:'0216',nombre:'SIHUAS'},{codigo:'0217',nombre:'YUNGAY'}],
  '03':[{codigo:'0301',nombre:'ABANCAY'},{codigo:'0302',nombre:'ANDAHUAYLAS'},{codigo:'0303',nombre:'ANTABAMBA'},{codigo:'0304',nombre:'AYMARAES'},{codigo:'0305',nombre:'COTABAMBAS'},{codigo:'0306',nombre:'CHINCHEROS'},{codigo:'0307',nombre:'GRAU'}],
  '04':[{codigo:'0401',nombre:'AREQUIPA'},{codigo:'0402',nombre:'CAMANÁ'},{codigo:'0403',nombre:'CARAVELÍ'},{codigo:'0404',nombre:'CASTILLA'},{codigo:'0405',nombre:'CAYLLOMA'},{codigo:'0406',nombre:'CONDESUYOS'},{codigo:'0407',nombre:'ISLAY'},{codigo:'0408',nombre:'LA UNIÓN'}],
  '05':[{codigo:'0501',nombre:'HUAMANGA'},{codigo:'0502',nombre:'CANGALLO'},{codigo:'0503',nombre:'HUANCA SANCOS'},{codigo:'0504',nombre:'HUANTA'},{codigo:'0505',nombre:'LA MAR'},{codigo:'0506',nombre:'LUCANAS'},{codigo:'0507',nombre:'PARINACOCHAS'},{codigo:'0508',nombre:'SUCRE'},{codigo:'0509',nombre:'VÍCTOR FAJARDO'},{codigo:'0510',nombre:'VILCAS HUAMÁN'}],
  '06':[{codigo:'0601',nombre:'CAJAMARCA'},{codigo:'0602',nombre:'CAJABAMBA'},{codigo:'0603',nombre:'CELENDÍN'},{codigo:'0604',nombre:'CHOTA'},{codigo:'0605',nombre:'CONTUMAZÁ'},{codigo:'0606',nombre:'CUTERVO'},{codigo:'0607',nombre:'HUALGAYOC'},{codigo:'0608',nombre:'JAÉN'},{codigo:'0609',nombre:'SAN IGNACIO'},{codigo:'0610',nombre:'SAN MARCOS'},{codigo:'0611',nombre:'SAN MIGUEL'},{codigo:'0612',nombre:'SANTA CRUZ'}],
  '07':[{codigo:'0701',nombre:'CALLAO'}],
  '08':[{codigo:'0801',nombre:'CUSCO'},{codigo:'0802',nombre:'ACOMAYO'},{codigo:'0803',nombre:'ANTA'},{codigo:'0804',nombre:'CALCA'},{codigo:'0805',nombre:'CANAS'},{codigo:'0806',nombre:'CANCHIS'},{codigo:'0807',nombre:'CHUMBIVILCAS'},{codigo:'0808',nombre:'ESPINAR'},{codigo:'0809',nombre:'LA CONVENCIÓN'},{codigo:'0810',nombre:'PARURO'},{codigo:'0811',nombre:'PAUCARTAMBO'},{codigo:'0812',nombre:'QUISPICANCHI'},{codigo:'0813',nombre:'URUBAMBA'}],
  '09':[{codigo:'0901',nombre:'HUANCAVELICA'},{codigo:'0902',nombre:'ACOBAMBA'},{codigo:'0903',nombre:'ANGARAES'},{codigo:'0904',nombre:'CASTROVIRREYNA'},{codigo:'0905',nombre:'CHURCAMPA'},{codigo:'0906',nombre:'HUAYTARÁ'},{codigo:'0907',nombre:'TAYACAJA'}],
  '10':[{codigo:'1001',nombre:'HUÁNUCO'},{codigo:'1002',nombre:'AMBO'},{codigo:'1003',nombre:'DOS DE MAYO'},{codigo:'1004',nombre:'HUACAYBAMBA'},{codigo:'1005',nombre:'HUAMALÍES'},{codigo:'1006',nombre:'LEONCIO PRADO'},{codigo:'1007',nombre:'MARAÑÓN'},{codigo:'1008',nombre:'PACHITEA'},{codigo:'1009',nombre:'PUERTO INCA'},{codigo:'1010',nombre:'LAURICOCHA'},{codigo:'1011',nombre:'YAROWILCA'}],
  '11':[{codigo:'1101',nombre:'ICA'},{codigo:'1102',nombre:'CHINCHA'},{codigo:'1103',nombre:'NASCA'},{codigo:'1104',nombre:'PALPA'},{codigo:'1105',nombre:'PISCO'}],
  '12':[{codigo:'1201',nombre:'HUANCAYO'},{codigo:'1202',nombre:'CONCEPCIÓN'},{codigo:'1203',nombre:'CHANCHAMAYO'},{codigo:'1204',nombre:'JUNÍN'},{codigo:'1205',nombre:'SATIPO'},{codigo:'1206',nombre:'TARMA'},{codigo:'1207',nombre:'YAULI'},{codigo:'1208',nombre:'CHUPACA'}],
  '13':[{codigo:'1301',nombre:'TRUJILLO'},{codigo:'1302',nombre:'ASCOPE'},{codigo:'1303',nombre:'BOLÍVAR'},{codigo:'1304',nombre:'CHEPÉN'},{codigo:'1305',nombre:'JULCÁN'},{codigo:'1306',nombre:'OTUZCO'},{codigo:'1307',nombre:'PACASMAYO'},{codigo:'1308',nombre:'PATAZ'},{codigo:'1309',nombre:'SÁNCHEZ CARRIÓN'},{codigo:'1310',nombre:'SANTIAGO DE CHUCO'},{codigo:'1311',nombre:'GRAN CHIMÚ'},{codigo:'1312',nombre:'VIRÚ'}],
  '14':[{codigo:'1401',nombre:'CHICLAYO'},{codigo:'1402',nombre:'FERREÑAFE'},{codigo:'1403',nombre:'LAMBAYEQUE'}],
  '15':[{codigo:'1501',nombre:'LIMA'},{codigo:'1502',nombre:'BARRANCA'},{codigo:'1503',nombre:'CAJATAMBO'},{codigo:'1504',nombre:'CANTA'},{codigo:'1505',nombre:'CAÑETE'},{codigo:'1506',nombre:'HUARAL'},{codigo:'1507',nombre:'HUAROCHIRÍ'},{codigo:'1508',nombre:'HUAURA'},{codigo:'1509',nombre:'OYÓN'},{codigo:'1510',nombre:'YAUYOS'}],
  '16':[{codigo:'1601',nombre:'MAYNAS'},{codigo:'1602',nombre:'ALTO AMAZONAS'},{codigo:'1603',nombre:'LORETO'},{codigo:'1604',nombre:'MARISCAL RAMÓN CASTILLA'},{codigo:'1605',nombre:'REQUENA'},{codigo:'1606',nombre:'UCAYALI'},{codigo:'1607',nombre:'DATEM DEL MARAÑÓN'},{codigo:'1608',nombre:'PUTUMAYO'}],
  '17':[{codigo:'1701',nombre:'TAMBOPATA'},{codigo:'1702',nombre:'MANU'},{codigo:'1703',nombre:'TAHUAMANU'}],
  '18':[{codigo:'1801',nombre:'MARISCAL NIETO'},{codigo:'1802',nombre:'GENERAL SÁNCHEZ CERRO'},{codigo:'1803',nombre:'ILO'}],
  '19':[{codigo:'1901',nombre:'PASCO'},{codigo:'1902',nombre:'DANIEL ALCIDES CARRIÓN'},{codigo:'1903',nombre:'OXAPAMPA'}],
  '20':[{codigo:'2001',nombre:'PIURA'},{codigo:'2002',nombre:'AYABACA'},{codigo:'2003',nombre:'HUANCABAMBA'},{codigo:'2004',nombre:'MORROPÓN'},{codigo:'2005',nombre:'PAITA'},{codigo:'2006',nombre:'SULLANA'},{codigo:'2007',nombre:'TALARA'},{codigo:'2008',nombre:'SECHURA'}],
  '21':[{codigo:'2101',nombre:'PUNO'},{codigo:'2102',nombre:'AZÁNGARO'},{codigo:'2103',nombre:'CARABAYA'},{codigo:'2104',nombre:'CHUCUITO'},{codigo:'2105',nombre:'EL COLLAO'},{codigo:'2106',nombre:'HUANCANÉ'},{codigo:'2107',nombre:'LAMPA'},{codigo:'2108',nombre:'MELGAR'},{codigo:'2109',nombre:'MOHO'},{codigo:'2110',nombre:'SAN ANTONIO DE PUTINA'},{codigo:'2111',nombre:'SAN ROMÁN'},{codigo:'2112',nombre:'SANDIA'},{codigo:'2113',nombre:'YUNGUYO'}],
  '22':[{codigo:'2201',nombre:'MOYOBAMBA'},{codigo:'2202',nombre:'BELLAVISTA'},{codigo:'2203',nombre:'EL DORADO'},{codigo:'2204',nombre:'HUALLAGA'},{codigo:'2205',nombre:'LAMAS'},{codigo:'2206',nombre:'MARISCAL CÁCERES'},{codigo:'2207',nombre:'PICOTA'},{codigo:'2208',nombre:'RIOJA'},{codigo:'2209',nombre:'SAN MARTÍN'},{codigo:'2210',nombre:'TOCACHE'}],
  '23':[{codigo:'2301',nombre:'TACNA'},{codigo:'2302',nombre:'CANDARAVE'},{codigo:'2303',nombre:'JORGE BASADRE'},{codigo:'2304',nombre:'TARATA'}],
  '24':[{codigo:'2401',nombre:'TUMBES'},{codigo:'2402',nombre:'CONTRALMIRANTE VILLAR'},{codigo:'2403',nombre:'ZARUMILLA'}],
  '25':[{codigo:'2501',nombre:'CORONEL PORTILLO'},{codigo:'2502',nombre:'ATALAYA'},{codigo:'2503',nombre:'PADRE ABAD'},{codigo:'2504',nombre:'PURÚS'}]
};

const DEFAULT_PROVINCIAS: readonly UbigeoItem[] = [
  {codigo:'XX01',nombre:'PROVINCIA CAPITAL'},{codigo:'XX02',nombre:'SEGUNDA PROVINCIA'},{codigo:'XX03',nombre:'TERCERA PROVINCIA'}
];

const DISTRITOS_POR_PROV: Record<string, readonly UbigeoItem[]> = {
  '1501':[
    {codigo:'150101',nombre:'LIMA'},{codigo:'150102',nombre:'ANCÓN'},{codigo:'150103',nombre:'ATE'},
    {codigo:'150104',nombre:'BARRANCO'},{codigo:'150105',nombre:'BREÑA'},{codigo:'150106',nombre:'CARABAYLLO'},
    {codigo:'150107',nombre:'CHACLACAYO'},{codigo:'150108',nombre:'CHORRILLOS'},{codigo:'150109',nombre:'CIENEGUILLA'},
    {codigo:'150110',nombre:'COMAS'},{codigo:'150111',nombre:'EL AGUSTINO'},{codigo:'150112',nombre:'INDEPENDENCIA'},
    {codigo:'150113',nombre:'JESÚS MARÍA'},{codigo:'150114',nombre:'LA MOLINA'},{codigo:'150115',nombre:'LA VICTORIA'},
    {codigo:'150116',nombre:'LINCE'},{codigo:'150117',nombre:'LOS OLIVOS'},{codigo:'150118',nombre:'LURIGANCHO'},
    {codigo:'150119',nombre:'LURÍN'},{codigo:'150120',nombre:'MAGDALENA DEL MAR'},{codigo:'150121',nombre:'MIRAFLORES'},
    {codigo:'150122',nombre:'PACHACÁMAC'},{codigo:'150123',nombre:'PUEBLO LIBRE'},{codigo:'150124',nombre:'PUENTE PIEDRA'},
    {codigo:'150125',nombre:'RÍMAC'},{codigo:'150126',nombre:'SAN BORJA'},{codigo:'150127',nombre:'SAN ISIDRO'},
    {codigo:'150128',nombre:'SAN JUAN DE LURIGANCHO'},{codigo:'150129',nombre:'SAN JUAN DE MIRAFLORES'},
    {codigo:'150130',nombre:'SAN LUIS'},{codigo:'150131',nombre:'SAN MARTÍN DE PORRES'},{codigo:'150132',nombre:'SAN MIGUEL'},
    {codigo:'150133',nombre:'SANTA ANITA'},{codigo:'150134',nombre:'SANTA ROSA'},{codigo:'150135',nombre:'SANTIAGO DE SURCO'},
    {codigo:'150136',nombre:'SURQUILLO'},{codigo:'150137',nombre:'VILLA EL SALVADOR'},{codigo:'150138',nombre:'VILLA MARÍA DEL TRIUNFO'}
  ],
  '0401':[
    {codigo:'040101',nombre:'AREQUIPA'},{codigo:'040102',nombre:'ALTO SELVA ALEGRE'},{codigo:'040103',nombre:'CAYMA'},
    {codigo:'040104',nombre:'CERRO COLORADO'},{codigo:'040105',nombre:'CHARACATO'},{codigo:'040106',nombre:'JACOBO HUNTER'},
    {codigo:'040107',nombre:'LA JOYA'},{codigo:'040108',nombre:'MARIANO MELGAR'},{codigo:'040109',nombre:'MIRAFLORES'},
    {codigo:'040110',nombre:'MOLLEBAYA'},{codigo:'040111',nombre:'PAUCARPATA'},{codigo:'040112',nombre:'POCSI'},
    {codigo:'040113',nombre:'SABANDÍA'},{codigo:'040114',nombre:'SACHACA'},{codigo:'040115',nombre:'SOCABAYA'},
    {codigo:'040116',nombre:'TIABAYA'},{codigo:'040117',nombre:'UCHUMAYO'},{codigo:'040118',nombre:'YANAHUARA'},
    {codigo:'040119',nombre:'YARABAMBA'},{codigo:'040120',nombre:'YURA'},{codigo:'040121',nombre:'JOSE L. BUSTAMANTE Y RIVERO'}
  ],
  '2001':[
    {codigo:'200101',nombre:'PIURA'},{codigo:'200102',nombre:'CASTILLA'},{codigo:'200103',nombre:'CATACAOS'},
    {codigo:'200104',nombre:'CURA MORI'},{codigo:'200105',nombre:'EL TALLÁN'},{codigo:'200106',nombre:'LA ARENA'},
    {codigo:'200107',nombre:'LA UNIÓN'},{codigo:'200108',nombre:'LAS LOMAS'},{codigo:'200109',nombre:'TAMBOGRANDE'},
    {codigo:'200110',nombre:'VEINTISÉIS DE OCTUBRE'}
  ],
  '1301':[
    {codigo:'130101',nombre:'TRUJILLO'},{codigo:'130102',nombre:'EL PORVENIR'},{codigo:'130103',nombre:'FLORENCIA DE MORA'},
    {codigo:'130104',nombre:'HUANCHACO'},{codigo:'130105',nombre:'LA ESPERANZA'},{codigo:'130106',nombre:'LAREDO'},
    {codigo:'130107',nombre:'MOCHE'},{codigo:'130108',nombre:'POROTO'},{codigo:'130109',nombre:'SALAVERRY'},
    {codigo:'130110',nombre:'SIMBAL'},{codigo:'130111',nombre:'VÍCTOR LARCO HERRERA'}
  ],
  '0801':[
    {codigo:'080101',nombre:'CUSCO'},{codigo:'080102',nombre:'CCORCA'},{codigo:'080103',nombre:'POROY'},
    {codigo:'080104',nombre:'SAN JERÓNIMO'},{codigo:'080105',nombre:'SAN SEBASTIÁN'},
    {codigo:'080106',nombre:'SANTIAGO'},{codigo:'080107',nombre:'SAYLLA'},{codigo:'080108',nombre:'WANCHAQ'}
  ],
  '1401':[
    {codigo:'140101',nombre:'CHICLAYO'},{codigo:'140102',nombre:'CHONGOYAPE'},{codigo:'140103',nombre:'ETEN'},
    {codigo:'140104',nombre:'ETEN PUERTO'},{codigo:'140105',nombre:'JOSÉ LEONARDO ORTIZ'},{codigo:'140106',nombre:'LA VICTORIA'},
    {codigo:'140107',nombre:'LAGUNAS'},{codigo:'140108',nombre:'MONSEFÚ'},{codigo:'140109',nombre:'NUEVA ARICA'},
    {codigo:'140110',nombre:'OYOTÚN'},{codigo:'140111',nombre:'PÁTAPO'},{codigo:'140112',nombre:'PICSI'},
    {codigo:'140113',nombre:'PIMENTEL'},{codigo:'140114',nombre:'REQUE'},{codigo:'140115',nombre:'SANTA ROSA'},
    {codigo:'140116',nombre:'TUMÁN'}
  ]
};

const DEFAULT_DISTRITOS: readonly UbigeoItem[] = [
  {codigo:'YY01',nombre:'DISTRITO CAPITAL'},{codigo:'YY02',nombre:'SEGUNDO DISTRITO'},
  {codigo:'YY03',nombre:'TERCER DISTRITO'},{codigo:'YY04',nombre:'CUARTO DISTRITO'},
  {codigo:'YY05',nombre:'QUINTO DISTRITO'}
];

// ─── Mock Population Data ─────────────────────────────────────────────────────

const POBS_DEPTO: readonly DeptoPoblacion[] = [
  {codigo:'01',nombre:'AMAZONAS',       total:   421_846},
  {codigo:'02',nombre:'ÁNCASH',         total: 1_180_638},
  {codigo:'03',nombre:'APURÍMAC',       total:   438_572},
  {codigo:'04',nombre:'AREQUIPA',       total: 1_431_098},
  {codigo:'05',nombre:'AYACUCHO',       total:   700_940},
  {codigo:'06',nombre:'CAJAMARCA',      total: 1_537_172},
  {codigo:'07',nombre:'CALLAO',         total: 1_112_567},
  {codigo:'08',nombre:'CUSCO',          total: 1_357_075},
  {codigo:'09',nombre:'HUANCAVELICA',   total:   384_920},
  {codigo:'10',nombre:'HUÁNUCO',        total:   902_497},
  {codigo:'11',nombre:'ICA',            total:   861_742},
  {codigo:'12',nombre:'JUNÍN',          total: 1_370_274},
  {codigo:'13',nombre:'LA LIBERTAD',    total: 2_060_018},
  {codigo:'14',nombre:'LAMBAYEQUE',     total: 1_318_060},
  {codigo:'15',nombre:'LIMA',           total:11_281_927},
  {codigo:'16',nombre:'LORETO',         total: 1_118_563},
  {codigo:'17',nombre:'MADRE DE DIOS',  total:   187_234},
  {codigo:'18',nombre:'MOQUEGUA',       total:   203_548},
  {codigo:'19',nombre:'PASCO',          total:   315_407},
  {codigo:'20',nombre:'PIURA',          total: 2_072_532},
  {codigo:'21',nombre:'PUNO',           total: 1_292_783},
  {codigo:'22',nombre:'SAN MARTÍN',     total:   952_188},
  {codigo:'23',nombre:'TACNA',          total:   395_812},
  {codigo:'24',nombre:'TUMBES',         total:   264_378},
  {codigo:'25',nombre:'UCAYALI',        total:   631_172}
];

const PROPORCIONES: Record<string, readonly number[]> = {
  sexo:                    [0.4952, 0.5048],
  grandes_grupos_edad:     [0.2620, 0.6095, 0.1285],
  hijos_nacidos_vivos:     [0.3480, 0.2510, 0.2190, 0.1820],
  residencia_5_anos:       [0.6180, 0.2820, 0.0440, 0.0560],
  residencia_madre:        [0.6480, 0.3130, 0.0390],
  tipo_dni:                [0.8420, 0.1310, 0.0270],
  estado_civil:            [0.3820, 0.2780, 0.2210, 0.0520, 0.0180, 0.0490],
  seguro_salud:            [0.7240, 0.2760],
  asistencia_escolar:      [0.3140, 0.3360, 0.3500],
  nivel_educativo:         [0.0560, 0.0390, 0.2840, 0.3290, 0.1480, 0.1440],
  alfabetismo:             [0.9210, 0.0790],
  dispositivos_tics:       [0.6840, 0.3160],
  uso_internet:            [0.6280, 0.3720],
  disc_ver:                [0.0490, 0.9510],
  disc_oir:                [0.0330, 0.9670],
  disc_comunicarse:        [0.0180, 0.9820],
  disc_caminar:            [0.0390, 0.9610],
  disc_cuidado:            [0.0220, 0.9780],
  disc_concentrar:         [0.0250, 0.9750],
  disc_relacionarse:       [0.0150, 0.9850],
  identificacion_etnica:   [0.2470, 0.0285, 0.0450, 0.0280, 0.0120, 0.0520, 0.5695, 0.0180],
  lengua_ninez:            [0.8190, 0.1310, 0.0250, 0.0185, 0.0065],
  pet:                     [0.7420, 0.2580],
  condicion_ocupacion:     [0.6790, 0.0510, 0.2700],
  tipo_vivienda:           [0.6810, 0.1390, 0.0410, 0.0550, 0.0840],
  material_paredes:        [0.6430, 0.0250, 0.2270, 0.0620, 0.0140, 0.0290],
  material_techos:         [0.4620, 0.0480, 0.0490, 0.3210, 0.0650, 0.0550],
  material_pisos:          [0.0280, 0.0100, 0.1790, 0.0490, 0.4240, 0.2890, 0.0210],
  num_habitaciones:        [0.1380, 0.2490, 0.2760, 0.1830, 0.1540],
  proc_agua:               [0.7130, 0.1010, 0.0310, 0.0380, 0.0910, 0.0260],
  servicio_higienico:      [0.6440, 0.0490, 0.1240, 0.1280, 0.0410, 0.0140],
  energia_electrica:       [0.9230, 0.0190, 0.0240, 0.0340],
  tenencia_vivienda:       [0.2240, 0.4410, 0.0620, 0.0190, 0.1850, 0.0690],
  uso_sshh:                [0.7810, 0.2190],
  energia_cocinar:         [0.6510, 0.0410, 0.0290, 0.0110, 0.0140, 0.2240, 0.0300],
  eliminacion_residuos:    [0.7480, 0.0920, 0.0810, 0.0290, 0.0250, 0.0250],
  emigracion_internacional:[0.1820, 0.8180],
  medios_transporte:       [0.2560, 0.1830, 0.1180, 0.4430],
  dispositivos_tics_hog:   [0.4820, 0.4210, 0.1760, 0.8530, 0.0760]
};

// ─── Mock Data Generator ─────────────────────────────────────────────────────

function deterministicFactor(seed: number): number {
  const x = Math.sin(seed * 9_301 + 49_297) * 233_280;
  return 0.55 + ((x - Math.floor(x)) * 0.90);
}

function generarFilas(
  indicadorId: string, nivel: NivelVisualizacion,
  deptoCod: string, provCod: string, _distCod: string
): readonly FilaTabla[] {
  const props = PROPORCIONES[indicadorId] ?? [1];

  if (nivel === 'nacional') {
    const total = POBS_DEPTO.reduce((s, d) => s + d.total, 0);
    return [{ nro:1, geo:['PERÚ'], total, valores: props.map(p => Math.round(total * p)) }];
  }
  if (nivel === 'departamental') {
    const deptos = deptoCod ? POBS_DEPTO.filter(d => d.codigo === deptoCod) : POBS_DEPTO;
    return deptos.map((d, i) => ({
      nro: i + 1, geo: [d.nombre], total: d.total,
      valores: props.map(p => Math.round(d.total * p))
    }));
  }
  if (nivel === 'provincial') {
    if (!deptoCod) return [];
    const depto = POBS_DEPTO.find(d => d.codigo === deptoCod);
    if (!depto) return [];
    const provs     = PROVINCIAS_POR_DEPTO[deptoCod] ?? DEFAULT_PROVINCIAS;
    const baseTotal = depto.total / provs.length;
    return provs.map((p, i) => {
      const total = Math.round(baseTotal * deterministicFactor(i + 1));
      return { nro: i + 1, geo: [depto.nombre, p.nombre], total, valores: props.map(pr => Math.round(total * pr)) };
    });
  }
  if (nivel === 'distrital') {
    if (!deptoCod || !provCod) return [];
    const depto = POBS_DEPTO.find(d => d.codigo === deptoCod);
    if (!depto) return [];
    const provs = PROVINCIAS_POR_DEPTO[deptoCod] ?? DEFAULT_PROVINCIAS;
    const prov  = provs.find(p => p.codigo === provCod);
    if (!prov) return [];
    const dists     = DISTRITOS_POR_PROV[provCod] ?? DEFAULT_DISTRITOS;
    const baseDistr = (depto.total / provs.length) / dists.length;
    return dists.map((d, i) => {
      const total = Math.round(baseDistr * deterministicFactor(i + 50));
      return { nro: i + 1, geo: [depto.nombre, prov.nombre, d.nombre], total, valores: props.map(pr => Math.round(total * pr)) };
    });
  }
  return [];
}


// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-descarga-datos',
  standalone: true,
  imports: [RouterLink, CommonModule, MatIconModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrap">

      <!-- ════ HEADER ════ -->
      <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50
                     flex justify-between items-center
                     px-4 py-2 sm:px-6 sm:py-3 md:px-10 md:py-3 lg:px-14 xl:px-16 w-full">
        <div class="flex items-center gap-3 md:gap-4">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="180" height="50" priority
               class="h-9 sm:h-10 md:h-11 lg:h-12 w-auto object-contain">
          <div class="w-px h-7 md:h-9 bg-gray-200 hidden sm:block"></div>
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="140" height="45"
               class="h-7 md:h-9 lg:h-10 w-auto object-contain hidden sm:block">
        </div>
        <nav class="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium tracking-wide text-[#343b9f]">
          <button routerLink="/" class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Inicio<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <button routerLink="/pagina-intermedia" class="text-[#0056a1] font-bold uppercase relative text-xs lg:text-sm">
            Resultados<span class="absolute -bottom-1 left-0 w-full h-0.5 bg-[#038dd3]"></span>
          </button>
          <button routerLink="/publicaciones" class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Publicaciones<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
          <div class="relative">
            <button (click)="toggleCensos($event)"
              class="hover:text-[#038dd3] transition-colors uppercase relative group flex items-center gap-1 text-xs lg:text-sm">
              Censos 2025
              <mat-icon class="!text-base !w-4 !h-4 transition-transform duration-200" [class.rotate-180]="censosOpen()">expand_more</mat-icon>
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
            </button>
            @if (censosOpen()) {
              <div class="absolute top-full right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                   style="animation: dropdownIn 0.18s ease-out forwards">
                <div class="h-1 w-full" style="background: linear-gradient(to right, #0056a1, #33b3a9)"></div>
                <ul class="py-1">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)"
                        class="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700
                               hover:bg-blue-50 hover:text-[#0056a1] transition-all flex items-center gap-2 group/item">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#038dd3] opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"></span>
                        {{ item.label }}
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
          <button routerLink="/noticias" class="hover:text-[#038dd3] transition-colors uppercase relative group text-xs lg:text-sm">
            Noticias<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#33b3a9] transition-all group-hover:w-full"></span>
          </button>
        </nav>
      </header>

      <!-- ════ BARRA NAV PRINCIPAL ════ -->
      <div class="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-0.5 md:gap-1 flex-wrap">
          <button (click)="setNavTop('cuadros')" [class]="navTopActiva() === 'cuadros' ? 'nav-primary-btn nav-primary-btn--active group' : 'nav-primary-btn group'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125M21.75 8.25v1.5c0 .621-.504 1.125-1.125 1.125m0 0h-17.25" />
            </svg>
            CUADROS
          </button>
          <span class="text-gray-200 select-none px-1 hidden sm:block text-lg font-thin">|</span>
          <button (click)="setNavTop('microdatos')" [class]="navTopActiva() === 'microdatos' ? 'nav-primary-btn nav-primary-btn--active group' : 'nav-primary-btn group'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            MICRODATOS
          </button>
          <span class="text-gray-200 select-none px-1 hidden sm:block text-lg font-thin">|</span>
          <a href="https://censos2017.inei.gob.pe/redatam/" target="_blank" rel="noopener noreferrer"
            (click)="setNavTop('redatam')"
            [class]="navTopActiva() === 'redatam' ? 'nav-primary-btn nav-primary-btn--accent nav-primary-btn--accent--active group' : 'nav-primary-btn nav-primary-btn--accent group'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            IR A REDATAM
          </a>
        </div>
        <button routerLink="/intermedia"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-[#0056a1] text-[#0056a1] font-semibold text-xs tracking-wide hover:bg-[#0056a1] hover:text-white transition-all duration-200 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </button>
      </div>

      <!-- ════ SEGUNDA BARRA ════ -->
      <div class="bg-[#f0f2f7] border-b border-gray-200 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-2 flex items-center justify-start gap-2">
        <button (click)="setNav('predefinidos')" [class]="navActiva() === 'predefinidos' ? 'nav-sec-btn nav-sec-btn--active' : 'nav-sec-btn'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125M21.75 8.25v1.5c0 .621-.504 1.125-1.125 1.125m0 0h-17.25" />
          </svg>
          CUADROS PREDEFINIDOS
        </button>
        <button (click)="setNav('interactivos')" [class]="navActiva() === 'interactivos' ? 'nav-sec-btn nav-sec-btn--active' : 'nav-sec-btn'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          CUADROS INTERACTIVOS
        </button>
      </div>

      <!-- ════ MAIN ════ -->
      <main class="flex-1 bg-[#f4f6f9] py-6 px-4 sm:px-6 md:px-8 lg:px-12">
        <div [class]="navActiva() === 'interactivos' ? 'max-w-7xl mx-auto' : 'max-w-5xl mx-auto'">

          <!-- ─── CUADROS PREDEFINIDOS ─── -->
          @if (navActiva() === 'predefinidos') {
            <div class="flex items-center gap-2 mb-5 flex-wrap">
              @for (tab of pestanas; track tab.id) {
                <button (click)="setPestana(tab.id)" [class]="pestanaActiva() === tab.id ? 'tab-pill tab-pill--active' : 'tab-pill'">
                  {{ tab.label }}
                </button>
              }
            </div>
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm border-collapse" style="min-width:520px">
                  <thead>
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-white border border-[#2b3192] w-[22%]" style="background-color:#343b9f">TEMA</th>
                      <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-white border border-[#004488]" style="background-color:#0056a1">DESCRIPCIÓN</th>
                      <th class="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-white border border-[#0277b6] w-[10%]" style="background-color:#038dd3">TAMAÑO</th>
                      <th class="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-white border border-[#2a9990] w-[10%]" style="background-color:#33b3a9">DESCARGAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (tema of temasActivos(); track tema.id; let even = $even) {
                      <tr class="transition-colors hover:bg-[#0056a1]/4" [class.bg-white]="!even" [class.bg-gray-50]="even">
                        <td class="px-4 py-3 border border-gray-200 align-top">
                          <div class="flex items-start gap-2">
                            <div class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style="background-color:rgba(52,59,159,0.09)">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#343b9f" class="w-3.5 h-3.5">
                                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="iconPaths[tema.icono]"/>
                              </svg>
                            </div>
                            <span class="font-bold text-[#343b9f] text-xs leading-snug">{{ tema.nombre }}</span>
                          </div>
                        </td>
                        <td class="px-4 py-3 border border-gray-200 align-top">
                          @if (tema.archivos.length === 1) {
                            <span class="text-xs text-gray-600 leading-relaxed">{{ tema.archivos[0].descripcion }}</span>
                          } @else {
                            <ul class="space-y-1.5">
                              @for (archivo of tema.archivos; track archivo.descripcion) {
                                <li class="flex items-start gap-1.5 text-xs text-gray-600 leading-relaxed">
                                  <span class="mt-1.5 w-1 h-1 rounded-full bg-[#038dd3] shrink-0 block"></span>
                                  {{ archivo.descripcion }}
                                </li>
                              }
                            </ul>
                          }
                        </td>
                        <td class="px-4 py-3 border border-gray-200 text-center align-middle">
                          <span class="text-xs font-black text-[#0056a1] whitespace-nowrap">{{ getTamanoTema(tema) | number:'1.1-1' }}&nbsp;MB</span>
                        </td>
                        <td class="px-4 py-3 border border-gray-200 text-center align-middle">
                          <button (click)="descargarTema(tema)" [title]="'Descargar: ' + tema.nombre"
                            class="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:scale-110 active:scale-95 transition-transform duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#107C41]/40">
                            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7">
                              <rect width="28" height="28" rx="4" fill="#107C41"/>
                              <path d="M7 9l3.5 5L7 19h2.3l2.7-3.9L14.7 19H17l-3.5-5 3.4-5h-2.2l-2.6 3.8L9.3 9z" fill="white"/>
                              <rect x="17.5" y="9"    width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.88"/>
                              <rect x="17.5" y="12.8" width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.88"/>
                              <rect x="17.5" y="16.5" width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.72"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <span class="text-xs text-gray-400">{{ temasActivos().length }} temas encontrados</span>
                <span class="text-xs text-gray-400">Tamaño total: <strong class="text-gray-600">{{ totalTamano() | number:'1.1-1' }} MB</strong></span>
              </div>
            </div>
            <div class="mt-5 flex justify-end">
              <button (click)="descargarTodos()"
                class="flex items-center gap-3 px-7 py-3 rounded-xl text-white font-bold text-sm bg-[#0056a1] hover:bg-[#004d94] shadow-md hover:shadow-lg active:scale-95 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar todos
                <span class="bg-white/20 rounded-lg px-2.5 py-0.5 text-xs font-bold">{{ totalTamano() | number:'1.1-1' }}&nbsp;MB</span>
              </button>
            </div>
          }
          <!-- /PREDEFINIDOS -->


          <!-- ─── CUADROS INTERACTIVOS ─── -->
          @if (navActiva() === 'interactivos') {
            <div class="flex flex-col lg:flex-row gap-5 items-start w-full">

              <!-- ══ PANEL IZQUIERDO (≈40%) ══ -->
              <div class="w-full lg:w-[38%] xl:w-[36%] flex flex-col gap-4 shrink-0 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto"
                   style="scrollbar-width:thin">

                <!-- NIVEL DE VISUALIZACIÓN -->
                <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2" style="background:linear-gradient(135deg,#f0f4fa 0%,#e8eef6 100%)">
                    <div class="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style="background:#0056a1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                      </svg>
                    </div>
                    <h3 class="text-[11px] font-black uppercase tracking-widest text-[#0056a1]">Nivel de Visualización</h3>
                  </div>
                  <div class="p-4">
                    <!-- Botones nivel -->
                    <div class="grid grid-cols-2 gap-1.5 mb-4">
                      @for (niv of niveles; track niv.id) {
                        <button (click)="setNivelViz(niv.id)"
                          [class]="nivelViz() === niv.id
                            ? 'int-nivel-btn int-nivel-btn--active'
                            : 'int-nivel-btn'">
                          {{ niv.label }}
                        </button>
                      }
                    </div>
                    <!-- Combos geográficos -->
                    <div class="flex flex-col gap-2.5">
                      <div class="flex items-center gap-2">
                        <label class="text-[10px] font-bold text-gray-400 w-20 shrink-0 text-right uppercase tracking-wide">Depto.</label>
                        <select [disabled]="nivelViz() === 'nacional'"
                          (change)="setDeptoSel($any($event.target).value)" class="int-select flex-1">
                          <option value="" [selected]="deptoSel() === ''">Todos / Seleccione...</option>
                          @for (d of departamentos; track d.codigo) {
                            <option [value]="d.codigo" [selected]="deptoSel() === d.codigo">{{ d.nombre }}</option>
                          }
                        </select>
                      </div>
                      <div class="flex items-center gap-2">
                        <label class="text-[10px] font-bold text-gray-400 w-20 shrink-0 text-right uppercase tracking-wide">Provincia</label>
                        <select [disabled]="nivelViz() === 'nacional' || nivelViz() === 'departamental' || !deptoSel()"
                          (change)="setProvSel($any($event.target).value)" class="int-select flex-1">
                          <option value="" [selected]="provSel() === ''">Seleccione...</option>
                          @for (p of provinciasDisp(); track p.codigo) {
                            <option [value]="p.codigo" [selected]="provSel() === p.codigo">{{ p.nombre }}</option>
                          }
                        </select>
                      </div>
                      <div class="flex items-center gap-2">
                        <label class="text-[10px] font-bold text-gray-400 w-20 shrink-0 text-right uppercase tracking-wide">Distrito</label>
                        <select [disabled]="nivelViz() !== 'distrital' || !provSel()"
                          (change)="distSel.set($any($event.target).value)" class="int-select flex-1">
                          <option value="" [selected]="distSel() === ''">Seleccione...</option>
                          @for (d of distritosDisp(); track d.codigo) {
                            <option [value]="d.codigo" [selected]="distSel() === d.codigo">{{ d.nombre }}</option>
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- VARIABLES + INDICADORES -->
                <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2" style="background:linear-gradient(135deg,#f0f4fa 0%,#e8eef6 100%)">
                    <div class="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style="background:#038dd3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                      </svg>
                    </div>
                    <h3 class="text-[11px] font-black uppercase tracking-widest text-[#038dd3]">Variables</h3>
                  </div>
                  <div class="p-4">
                    <!-- Variable tabs -->
                    <div class="flex gap-1.5 justify-center mb-4 flex-wrap">
                      @for (v of variables; track v.id) {
                        <button (click)="setVarInteractiva(v.id)"
                          [class]="varInteractiva() === v.id
                            ? 'int-var-btn int-var-btn--active'
                            : 'int-var-btn'">
                          {{ v.label }}
                        </button>
                      }
                    </div>

                    <!-- Temáticos e indicadores -->
                    <div class="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-0.5" style="scrollbar-width:thin">
                      @for (tematico of tematicosActivos(); track tematico.id) {
                        <div>
                          <!-- Cabecera temático -->
                          <div class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-1" style="background:rgba(3,141,211,0.08)">
                            <span class="w-1 h-3.5 rounded-full shrink-0" style="background:#038dd3"></span>
                            <span class="text-[10px] font-black uppercase tracking-widest text-[#038dd3]">{{ tematico.nombre }}</span>
                          </div>
                          <!-- Indicadores -->
                          <div class="flex flex-col gap-0.5 pl-2">
                            @for (ind of tematico.indicadores; track ind.id) {
                              <button (click)="indicadorPend.set(ind.id)"
                                [class]="indicadorPend() === ind.id
                                  ? 'w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg font-semibold text-[#0056a1] border transition-all leading-snug'
                                  : 'w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg font-medium text-gray-600 border border-transparent hover:bg-gray-50 hover:text-[#0056a1] transition-all leading-snug'"
                                [style]="indicadorPend() === ind.id ? 'background:rgba(0,86,161,0.07);border-color:rgba(0,86,161,0.25)' : ''">
                                <span class="flex items-start gap-1.5">
                                  <span [class]="indicadorPend() === ind.id
                                    ? 'mt-1 w-1.5 h-1.5 rounded-full bg-[#0056a1] shrink-0'
                                    : 'mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0'"></span>
                                  {{ ind.nombre }}
                                </span>
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- GENERAR CUADRO -->
                    <div class="mt-4 pt-4 border-t border-gray-100">
                      <button (click)="generarConsulta()"
                        [disabled]="!puedeGenerar()"
                        [class]="puedeGenerar()
                          ? 'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-xs tracking-widest uppercase bg-[#0056a1] hover:bg-[#004d94] shadow-md hover:shadow-lg active:scale-95 transition-all duration-200'
                          : 'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-400 font-bold text-xs tracking-widest uppercase bg-gray-100 border border-gray-200 cursor-not-allowed transition-all'">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125M21.75 8.25v1.5c0 .621-.504 1.125-1.125 1.125m0 0h-17.25" />
                        </svg>
                        Generar Cuadro
                      </button>
                      @if (!puedeGenerar()) {
                        <p class="text-[10px] text-amber-600 text-center mt-2 font-medium">
                          Seleccione los filtros geográficos requeridos
                        </p>
                      }
                    </div>
                  </div>
                </div>

              </div>
              <!-- /PANEL IZQUIERDO -->

              <!-- ══ PANEL DERECHO (≈60%) ══ -->
              <div class="flex-1 min-w-0">
                <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                  <!-- Header del panel derecho -->
                  <div class="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4"
                       style="background:linear-gradient(135deg,#f8faff 0%,#f0f4fa 100%)">
                    <div class="flex-1 min-w-0">
                      <h2 class="text-sm font-extrabold text-[#0056a1] leading-snug mb-1">
                        {{ tituloTabla() }}
                      </h2>
                      @if (subtituloGeo()) {
                        <div class="flex items-center gap-1.5 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#33b3a9" class="w-3 h-3 shrink-0">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                          </svg>
                          <p class="text-[11px] font-bold text-[#33b3a9] uppercase tracking-wide">{{ subtituloGeo() }}</p>
                        </div>
                      }
                    </div>
                    <!-- Botón Excel -->
                    <button (click)="descargarExcel()" title="Descargar Excel"
                      class="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#107C41] text-[#107C41] font-bold text-[11px] uppercase tracking-wide hover:bg-[#107C41] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md">
                      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0">
                        <rect width="28" height="28" rx="4" fill="#107C41"/>
                        <path d="M7 9l3.5 5L7 19h2.3l2.7-3.9L14.7 19H17l-3.5-5 3.4-5h-2.2l-2.6 3.8L9.3 9z" fill="white"/>
                        <rect x="17.5" y="9"    width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.88"/>
                        <rect x="17.5" y="12.8" width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.88"/>
                        <rect x="17.5" y="16.5" width="5.5" height="1.8" rx="0.4" fill="white" opacity="0.72"/>
                      </svg>
                      Descargar Excel
                    </button>
                  </div>

                  <!-- Tabla dinámica -->
                  <div class="overflow-x-auto">
                    <table class="w-full text-xs border-collapse" style="min-width:500px">
                      <thead>
                        <!-- Fila 1 -->
                        <tr>
                          <th rowspan="2" class="px-3 py-2.5 text-center font-black uppercase tracking-wide text-white border border-[#2b3192] w-10" style="background:#343b9f;min-width:2.5rem">NRO</th>
                          @for (col of colsGeo(); track col) {
                            <th rowspan="2" class="px-3 py-2.5 text-left font-black uppercase tracking-wide text-white border border-[#004488]" style="background:#0056a1;white-space:nowrap">{{ col }}</th>
                          }
                          <th rowspan="2" class="px-3 py-2.5 text-right font-black uppercase tracking-wide text-white border border-[#0277b6]" style="background:#038dd3;white-space:nowrap;min-width:6rem">TOTAL</th>
                          @if (indicadorObjActivo()) {
                            <th [attr.colspan]="indicadorObjActivo()!.categorias.length"
                                class="px-3 py-2 text-center font-black text-white border border-[#2a9990]"
                                style="background:#33b3a9;font-size:0.68rem;letter-spacing:0.06em;text-transform:uppercase">
                              {{ indicadorObjActivo()!.nombre }}
                            </th>
                          }
                        </tr>
                        <!-- Fila 2: categorías -->
                        <tr>
                          @if (indicadorObjActivo()) {
                            @for (cat of indicadorObjActivo()!.categorias; track cat) {
                              <th class="px-3 py-2 text-right font-bold text-white border border-[#2a9990]"
                                  style="background:rgba(51,179,169,0.85);font-size:0.65rem;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap">
                                {{ cat }}
                              </th>
                            }
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (fila of filasTabla(); track fila.nro; let even = $even) {
                          <tr class="transition-colors hover:bg-blue-50/50" [class.bg-white]="!even" [class.bg-gray-50]="even">
                            <td class="px-3 py-2.5 text-center font-bold text-gray-400 border border-gray-200 text-xs">{{ fila.nro }}</td>
                            @for (gv of fila.geo; track $index) {
                              <td class="px-3 py-2.5 font-semibold text-gray-700 border border-gray-200 text-xs" style="white-space:nowrap">{{ gv }}</td>
                            }
                            <td class="px-3 py-2.5 text-right font-black text-[#0056a1] border border-gray-200 text-xs" style="white-space:nowrap">{{ fila.total | number:'1.0-0' }}</td>
                            @for (val of fila.valores; track $index) {
                              <td class="px-3 py-2.5 text-right text-gray-600 border border-gray-200 text-xs" style="white-space:nowrap">{{ val | number:'1.0-0' }}</td>
                            }
                          </tr>
                        }
                        @if (filasTabla().length === 0) {
                          <tr>
                            <td [attr.colspan]="3 + colsGeo().length + (indicadorObjActivo()?.categorias?.length ?? 0)"
                                class="px-6 py-10 text-center text-sm text-gray-400 italic">
                              Seleccione los filtros y haga clic en <strong class="text-[#0056a1]">GENERAR CUADRO</strong>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <!-- Notas al pie -->
                  <div class="px-5 py-4 bg-gray-50 border-t border-gray-200">
                    <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nota:</p>
                    <p class="text-[10px] text-gray-500 leading-relaxed mb-1">
                      1/ Lima Metropolitana: Comprende los 43 distritos de la provincia de Lima.
                    </p>
                    <p class="text-[10px] text-gray-500 leading-relaxed mb-3">
                      2/ Región Lima: Comprende las provincias de Barranca, Cajatambo, Canta, Cañete, Huaral, Huarochirí, Huaura, Oyón y Yauyos.
                    </p>
                    <p class="text-[10px] text-gray-400 italic leading-relaxed">
                      Fuente: Instituto Nacional de Estadística e informática - Censos Nacionales 2025: XIII de Población, VIII de Vivienda y IV de Comunidades Indígenas
                    </p>
                  </div>

                </div>
              </div>
              <!-- /PANEL DERECHO -->

            </div>
          }
          <!-- /INTERACTIVOS -->

        </div>
      </main>
      <!-- /MAIN -->

      <!-- ════ FOOTER ════ -->
      <footer class="bg-[#484848] text-white py-6 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16">
        <div class="max-w-7xl mx-auto flex flex-col justify-center md:justify-end items-center md:items-end gap-4 w-full">
          <div class="flex flex-col items-center md:items-end text-center md:text-right w-full">
            <p class="font-bold text-sm md:text-base">Instituto Nacional de Estadística e Informática – INEI</p>
            <p class="text-xs md:text-sm mt-1 text-gray-300">Av. General Garzón 658. Jesús María. Lima - Perú</p>
            <div class="flex items-center justify-center md:justify-end gap-4 mt-2 flex-wrap">
              <span class="text-xs md:text-sm text-gray-300">Síguenos:</span>
              <div class="flex gap-3">
                <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="hover:text-[#33b3a9] transition-colors" aria-label="Facebook INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://x.com/INEI_oficial?lang=es" class="hover:text-[#33b3a9] transition-colors" aria-label="X INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.instagram.com/inei_peru/?hl=es" class="hover:text-[#33b3a9] transition-colors" aria-label="Instagram INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" class="hover:text-[#33b3a9] transition-colors" aria-label="WhatsApp INEI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-wrap {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: #f4f6f9;
      overflow-x: hidden;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Nav principal ── */
    .nav-primary-btn {
      position: relative;
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.375rem 0.75rem; border-radius: 0.5rem;
      color: #343b9f; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.04em; transition: background-color 0.18s; white-space: nowrap;
    }
    .nav-primary-btn:hover { background-color: rgba(52,59,159,0.07); }
    .nav-primary-btn--active { background-color: #343b9f; color: #ffffff; box-shadow: 0 2px 6px rgba(52,59,159,0.28); }
    .nav-primary-btn--active:hover { background-color: #2b3192; }
    .nav-primary-btn--accent { color: #038dd3; }
    .nav-primary-btn--accent:hover { background-color: rgba(3,141,211,0.07); }
    .nav-primary-btn--accent--active { background-color: #038dd3; color: #ffffff; box-shadow: 0 2px 6px rgba(3,141,211,0.28); }
    .nav-primary-btn--accent--active:hover { background-color: #0277b6; }

    /* ── Segunda barra ── */
    .nav-sec-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 1rem; border-radius: 0.5rem;
      border: 1px solid #d1d5db; background-color: #ffffff; color: #343b9f;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; white-space: nowrap;
      transition: border-color 0.18s, color 0.18s, background-color 0.18s, box-shadow 0.18s;
    }
    .nav-sec-btn:hover { border-color: #0056a1; color: #0056a1; }
    .nav-sec-btn--active { background-color: #0056a1; border-color: #0056a1; color: #ffffff; box-shadow: 0 2px 6px rgba(0,86,161,0.28); }
    .nav-sec-btn--active:hover { background-color: #004d94; border-color: #004d94; }

    /* ── Tabs predefinidos ── */
    .tab-pill {
      display: inline-flex; align-items: center;
      padding: 0.45rem 1.25rem; border-radius: 0.5rem;
      font-size: 0.82rem; font-weight: 600;
      border: 1px solid #d1d5db; background-color: #ffffff; color: #6b7280;
      cursor: pointer; white-space: nowrap;
      transition: background-color 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s;
    }
    .tab-pill:hover { background-color: #f0f4fa; border-color: #0056a1; color: #0056a1; }
    .tab-pill--active { background-color: #0056a1; border-color: #0056a1; color: #ffffff; font-weight: 700; box-shadow: 0 2px 6px rgba(0,86,161,0.25); }
    .tab-pill--active:hover { background-color: #004d94; border-color: #004d94; }

    /* ── Interactivos: botones nivel ── */
    .int-nivel-btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.375rem 0.5rem; border-radius: 0.5rem;
      border: 1px solid #d1d5db; background-color: #ffffff;
      color: #6b7280; font-size: 0.7rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; text-align: center;
      transition: border-color 0.18s, color 0.18s, background-color 0.18s, box-shadow 0.18s;
    }
    .int-nivel-btn:hover { border-color: #0056a1; color: #0056a1; background-color: #f0f4fa; }
    .int-nivel-btn--active {
      background-color: #0056a1; border-color: #0056a1; color: #ffffff;
      font-weight: 700; box-shadow: 0 2px 6px rgba(0,86,161,0.28);
    }
    .int-nivel-btn--active:hover { background-color: #004d94; }

    /* ── Interactivos: botones variable ── */
    .int-var-btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.35rem 1rem; border-radius: 0.5rem;
      border: 1px solid #d1d5db; background-color: #ffffff;
      color: #6b7280; font-size: 0.7rem; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      transition: border-color 0.18s, color 0.18s, background-color 0.18s, box-shadow 0.18s;
    }
    .int-var-btn:hover { border-color: #038dd3; color: #038dd3; background-color: rgba(3,141,211,0.05); }
    .int-var-btn--active {
      background-color: #038dd3; border-color: #038dd3; color: #ffffff;
      font-weight: 700; box-shadow: 0 2px 6px rgba(3,141,211,0.28);
    }
    .int-var-btn--active:hover { background-color: #0277b6; }

    /* ── Interactivos: selects ── */
    .int-select {
      font-size: 0.72rem; border-radius: 0.5rem;
      border: 1px solid #d1d5db; background-color: #ffffff;
      color: #374151; padding: 0.35rem 0.625rem;
      transition: border-color 0.18s, box-shadow 0.18s;
      outline: none; appearance: auto;
    }
    .int-select:focus { border-color: #038dd3; box-shadow: 0 0 0 3px rgba(3,141,211,0.15); }
    .int-select:disabled { background-color: #f9fafb; color: #9ca3af; cursor: not-allowed; border-color: #e5e7eb; }

    table { border-spacing: 0; }
  `]
})
export class DescargaDatosComponent {

  // ── State — Predefinidos ─────────────────────────────────────────────────────
  readonly censosOpen    = signal<boolean>(false);
  readonly navTopActiva  = signal<NavTopBar>('cuadros');
  readonly navActiva     = signal<NavPrincipal>('predefinidos');
  readonly pestanaActiva = signal<PestanaContenido>('poblacion');

  // ── State — Interactivos ─────────────────────────────────────────────────────
  readonly nivelViz       = signal<NivelVisualizacion>('nacional');
  readonly varInteractiva = signal<VariableInteractiva>('poblacion');
  readonly indicadorPend  = signal<string>('sexo');
  readonly deptoSel       = signal<string>('');
  readonly provSel        = signal<string>('');
  readonly distSel        = signal<string>('');

  readonly consultaActiva = signal<ConsultaActiva>({
    indicadorId: 'sexo', nivel: 'nacional', variable: 'poblacion',
    deptoCodigo: '', deptoNombre: '', provCodigo: '', provNombre: '', distCodigo: '', distNombre: ''
  });

  // ── Constantes expuestas al template ─────────────────────────────────────────
  readonly iconPaths = ICON_PATHS;

  readonly censosMenu = [
    { label: 'Censo de Derecho',          route: '/censo-derecho'        },
    { label: 'Características técnicas',  route: '/aspectos-generales'   },
    { label: 'Innovaciones Tecnológicas', route: '/innovaciones'          },
    { label: 'Normatividad censal',       route: '/normativa'             },
    { label: 'Documentación Técnica',     route: '/documentacion-tecnica' },
  ] as const;

  readonly pestanas: readonly Pestana[] = [
    { id: 'poblacion', label: 'Población' },
    { id: 'vivienda',  label: 'Vivienda'  },
    { id: 'hogar',     label: 'Hogar'     },
  ] as const;

  readonly niveles = [
    { id: 'nacional'      as const, label: 'Nacional'      },
    { id: 'departamental' as const, label: 'Departamental' },
    { id: 'provincial'    as const, label: 'Provincial'    },
    { id: 'distrital'     as const, label: 'Distrital'     },
  ];

  readonly variables = [
    { id: 'poblacion' as const, label: 'Población' },
    { id: 'vivienda'  as const, label: 'Vivienda'  },
    { id: 'hogar'     as const, label: 'Hogar'     },
  ];

  readonly departamentos = DEPARTAMENTOS;

  // ── Índice plano de todos los indicadores (lookup) ────────────────────────────
  private readonly allIndicadores: readonly Indicador[] = [
    ...TEMATICOS_POBLACION,
    ...TEMATICOS_VIVIENDA,
    ...TEMATICOS_HOGAR
  ].flatMap(t => t.indicadores);

  // ── Computed — Predefinidos ──────────────────────────────────────────────────
  readonly temasActivos = computed((): readonly TemaDescarga[] => {
    switch (this.pestanaActiva()) {
      case 'poblacion': return TEMAS_POBLACION;
      case 'vivienda':  return TEMAS_VIVIENDA;
      case 'hogar':     return TEMAS_HOGAR;
    }
  });

  readonly totalTamano = computed((): number => {
    const raw = this.temasActivos().reduce((s, t) => s + this.getTamanoTema(t), 0);
    return Math.round(raw * 10) / 10;
  });

  // ── Computed — Interactivos ──────────────────────────────────────────────────
  readonly provinciasDisp = computed((): readonly UbigeoItem[] =>
    this.deptoSel() ? (PROVINCIAS_POR_DEPTO[this.deptoSel()] ?? DEFAULT_PROVINCIAS) : []
  );

  readonly distritosDisp = computed((): readonly UbigeoItem[] =>
    this.provSel() ? (DISTRITOS_POR_PROV[this.provSel()] ?? DEFAULT_DISTRITOS) : []
  );

  readonly tematicosActivos = computed((): readonly TematicoInt[] => {
    switch (this.varInteractiva()) {
      case 'poblacion': return TEMATICOS_POBLACION;
      case 'vivienda':  return TEMATICOS_VIVIENDA;
      case 'hogar':     return TEMATICOS_HOGAR;
    }
  });

  readonly puedeGenerar = computed((): boolean => {
    switch (this.nivelViz()) {
      case 'nacional':
      case 'departamental': return true;
      case 'provincial':    return !!this.deptoSel();
      case 'distrital':     return !!this.deptoSel() && !!this.provSel();
    }
  });

  readonly indicadorObjActivo = computed((): Indicador | undefined =>
    this.allIndicadores.find(i => i.id === this.consultaActiva().indicadorId)
  );

  readonly tituloTabla = computed((): string => {
    const q   = this.consultaActiva();
    const ind = this.indicadorObjActivo();
    const nivelLabel: Record<NivelVisualizacion, string> = {
      nacional: 'Nacional', departamental: 'Departamental',
      provincial: 'Provincial', distrital: 'Distrital'
    };
    const varLabel: Record<VariableInteractiva, string> = {
      poblacion: 'población', vivienda: 'vivienda', hogar: 'hogar'
    };
    return `Consulta de ${varLabel[q.variable]} por ${ind?.nombre ?? q.indicadorId}, según el nivel ${nivelLabel[q.nivel]}`;
  });

  readonly subtituloGeo = computed((): string =>
    [this.consultaActiva().deptoNombre, this.consultaActiva().provNombre, this.consultaActiva().distNombre]
      .filter(Boolean).join(' – ')
  );

  readonly colsGeo = computed((): readonly string[] => {
    switch (this.consultaActiva().nivel) {
      case 'nacional':      return ['ÁMBITO'];
      case 'departamental': return ['DEPARTAMENTO'];
      case 'provincial':    return ['DEPARTAMENTO', 'PROVINCIA'];
      case 'distrital':     return ['DEPARTAMENTO', 'PROVINCIA', 'DISTRITO'];
    }
  });

  readonly filasTabla = computed((): readonly FilaTabla[] => {
    const q = this.consultaActiva();
    return generarFilas(q.indicadorId, q.nivel, q.deptoCodigo, q.provCodigo, q.distCodigo);
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getTamanoTema(tema: TemaDescarga): number {
    const raw = tema.archivos.reduce((s, a) => s + a.tamano, 0);
    return Math.round(raw * 10) / 10;
  }

  // ── Actions — Predefinidos ────────────────────────────────────────────────────
  setNavTop(nav: NavTopBar): void { this.navTopActiva.set(nav); }

  setNav(nav: NavPrincipal): void {
    this.navActiva.set(nav);
    if (nav === 'predefinidos') { this.pestanaActiva.set('poblacion'); }
  }

  setPestana(pestana: PestanaContenido): void { this.pestanaActiva.set(pestana); }

  descargarTema(tema: TemaDescarga): void {
    console.info('[DescargaDatos] Descargando tema:', tema.nombre);
  }

  descargarTodos(): void { this.temasActivos().forEach(t => this.descargarTema(t)); }

  // ── Actions — Interactivos ────────────────────────────────────────────────────
  setNivelViz(nivel: NivelVisualizacion): void {
    this.nivelViz.set(nivel);
    if (nivel === 'nacional')                              { this.deptoSel.set(''); this.provSel.set(''); this.distSel.set(''); }
    if (nivel === 'departamental' || nivel === 'nacional') { this.provSel.set('');  this.distSel.set(''); }
  }

  setDeptoSel(codigo: string): void {
    this.deptoSel.set(codigo);
    this.provSel.set('');
    this.distSel.set('');
  }

  setProvSel(codigo: string): void {
    this.provSel.set(codigo);
    this.distSel.set('');
  }

  setVarInteractiva(v: VariableInteractiva): void {
    this.varInteractiva.set(v);
    const tematicos = v === 'poblacion' ? TEMATICOS_POBLACION : v === 'vivienda' ? TEMATICOS_VIVIENDA : TEMATICOS_HOGAR;
    const firstInd  = tematicos[0]?.indicadores[0];
    if (firstInd) { this.indicadorPend.set(firstInd.id); }
  }

  generarConsulta(): void {
    if (!this.puedeGenerar()) { return; }
    const deptoCod  = this.deptoSel();
    const provCod   = this.provSel();
    const distCod   = this.distSel();
    const deptoItem = DEPARTAMENTOS.find(d => d.codigo === deptoCod);
    const provs     = PROVINCIAS_POR_DEPTO[deptoCod] ?? DEFAULT_PROVINCIAS;
    const provItem  = provs.find(p => p.codigo === provCod);
    const dists     = DISTRITOS_POR_PROV[provCod] ?? DEFAULT_DISTRITOS;
    const distItem  = dists.find(d => d.codigo === distCod);

    this.consultaActiva.set({
      indicadorId:  this.indicadorPend(),
      nivel:        this.nivelViz(),
      variable:     this.varInteractiva(),
      deptoCodigo:  deptoCod,
      deptoNombre:  deptoItem?.nombre ?? '',
      provCodigo:   provCod,
      provNombre:   provItem?.nombre  ?? '',
      distCodigo:   distCod,
      distNombre:   distItem?.nombre  ?? '',
    });
  }

  descargarExcel(): void {
    const q = this.consultaActiva();
    console.info('[DescargaDatos] Descargando Excel:', q.indicadorId, q.nivel);
  }

  // ── Host listeners ────────────────────────────────────────────────────────────
  @HostListener('document:click')
  onDocumentClick(): void { this.censosOpen.set(false); }

  toggleCensos(event: Event): void {
    event.stopPropagation();
    this.censosOpen.update(v => !v);
  }
}