// RUTA: src/app/components/comparativa-territorial.component.ts

import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';

// ── Tipos ───────────────────────────────────────────────────────────────────
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

// ── DATA MOCK — Departamental (25 depts) ─────────────────────────────────
const MOCK_DEP: FilaDep[] = [
  { departamento:'AMAZONAS',        superficie:  39_249, poblacion:  426_806, hombres:  218_643, mujeres:  208_163, razon:105.0, densidad:   10.9, pctUrbano: 41.2, edadMediana:25.1, p65:  28_882, pct65: 6.8 },
  { departamento:'ÁNCASH',          superficie:  35_915, poblacion:1_180_638, hombres:  582_219, mujeres:  598_419, razon: 97.3, densidad:   32.9, pctUrbano: 69.8, edadMediana:27.8, p65:  99_174, pct65: 8.4 },
  { departamento:'APURÍMAC',        superficie:  20_896, poblacion:  476_936, hombres:  237_044, mujeres:  239_892, razon: 98.8, densidad:   22.8, pctUrbano: 55.3, edadMediana:26.4, p65:  42_447, pct65: 8.9 },
  { departamento:'AREQUIPA',        superficie:  63_345, poblacion:1_497_438, hombres:  738_094, mujeres:  759_344, razon: 97.2, densidad:   23.6, pctUrbano: 91.8, edadMediana:30.1, p65: 130_277, pct65: 8.7 },
  { departamento:'AYACUCHO',        superficie:  43_815, poblacion:  668_213, hombres:  328_956, mujeres:  339_257, razon: 97.0, densidad:   15.3, pctUrbano: 59.4, edadMediana:26.8, p65:  56_798, pct65: 8.5 },
  { departamento:'CAJAMARCA',       superficie:  33_318, poblacion:1_453_671, hombres:  725_908, mujeres:  727_763, razon: 99.7, densidad:   43.6, pctUrbano: 34.8, edadMediana:25.2, p65: 107_572, pct65: 7.4 },
  { departamento:'CALLAO',          superficie:     147, poblacion:1_129_854, hombres:  556_220, mujeres:  573_634, razon: 97.0, densidad:7_685.4, pctUrbano:100.0, edadMediana:30.4, p65:  84_739, pct65: 7.5 },
  { departamento:'CUSCO',           superficie:  71_987, poblacion:1_357_075, hombres:  671_504, mujeres:  685_571, razon: 98.0, densidad:   18.8, pctUrbano: 62.8, edadMediana:27.2, p65: 105_851, pct65: 7.8 },
  { departamento:'HUANCAVELICA',    superficie:  22_131, poblacion:  374_062, hombres:  184_793, mujeres:  189_269, razon: 97.6, densidad:   16.9, pctUrbano: 37.5, edadMediana:24.8, p65:  30_299, pct65: 8.1 },
  { departamento:'HUÁNUCO',         superficie:  36_849, poblacion:  762_223, hombres:  381_285, mujeres:  380_938, razon:100.1, densidad:   20.7, pctUrbano: 51.4, edadMediana:25.6, p65:  53_356, pct65: 7.0 },
  { departamento:'ICA',             superficie:  21_328, poblacion:  975_182, hombres:  487_042, mujeres:  488_140, razon: 99.8, densidad:   45.7, pctUrbano: 91.9, edadMediana:30.2, p65:  78_015, pct65: 8.0 },
  { departamento:'JUNÍN',           superficie:  44_197, poblacion:1_370_274, hombres:  683_244, mujeres:  687_030, razon: 99.4, densidad:   31.0, pctUrbano: 72.2, edadMediana:28.0, p65: 104_141, pct65: 7.6 },
  { departamento:'LA LIBERTAD',     superficie:  25_500, poblacion:2_016_771, hombres:  990_040, mujeres:1_026_731, razon: 96.4, densidad:   79.1, pctUrbano: 78.4, edadMediana:27.8, p65: 151_258, pct65: 7.5 },
  { departamento:'LAMBAYEQUE',      superficie:  14_231, poblacion:1_362_689, hombres:  655_024, mujeres:  707_665, razon: 92.6, densidad:   95.8, pctUrbano: 81.7, edadMediana:29.1, p65: 113_103, pct65: 8.3 },
  { departamento:'LIMA',            superficie:  34_802, poblacion:10_126_052, hombres:4_929_843, mujeres:5_196_209, razon: 94.9, densidad:  291.0, pctUrbano: 98.1, edadMediana:31.6, p65: 931_597, pct65: 9.2 },
  { departamento:'LORETO',          superficie: 368_852, poblacion:1_027_559, hombres:  527_346, mujeres:  500_213, razon:105.4, densidad:    2.8, pctUrbano: 65.2, edadMediana:22.9, p65:  49_323, pct65: 4.8 },
  { departamento:'MADRE DE DIOS',   superficie:  85_183, poblacion:  173_811, hombres:   95_596, mujeres:   78_215, razon:122.2, densidad:    2.0, pctUrbano: 71.4, edadMediana:24.5, p65:   6_782, pct65: 3.9 },
  { departamento:'MOQUEGUA',        superficie:  15_734, poblacion:  192_740, hombres:   98_455, mujeres:   94_285, razon:104.4, densidad:   12.2, pctUrbano: 86.0, edadMediana:32.1, p65:  18_310, pct65: 9.5 },
  { departamento:'PASCO',           superficie:  25_320, poblacion:  271_904, hombres:  139_388, mujeres:  132_516, razon:105.2, densidad:   10.7, pctUrbano: 66.5, edadMediana:25.5, p65:  15_227, pct65: 5.6 },
  { departamento:'PIURA',           superficie:  35_892, poblacion:2_047_954, hombres:1_011_232, mujeres:1_036_722, razon: 97.5, densidad:   57.1, pctUrbano: 74.5, edadMediana:27.4, p65: 155_644, pct65: 7.6 },
  { departamento:'PUNO',            superficie:  71_999, poblacion:1_268_441, hombres:  630_014, mujeres:  638_427, razon: 98.7, densidad:   17.6, pctUrbano: 53.6, edadMediana:26.9, p65: 101_475, pct65: 8.0 },
  { departamento:'SAN MARTÍN',      superficie:  51_253, poblacion:  974_160, hombres:  512_133, mujeres:  462_027, razon:110.8, densidad:   19.0, pctUrbano: 69.3, edadMediana:25.8, p65:  46_760, pct65: 4.8 },
  { departamento:'TACNA',           superficie:  16_076, poblacion:  395_533, hombres:  199_748, mujeres:  195_785, razon:102.0, densidad:   24.6, pctUrbano: 88.7, edadMediana:31.5, p65:  34_016, pct65: 8.6 },
  { departamento:'TUMBES',          superficie:   4_669, poblacion:  252_261, hombres:  130_892, mujeres:  121_369, razon:107.8, densidad:   54.0, pctUrbano: 84.5, edadMediana:27.1, p65:  13_874, pct65: 5.5 },
  { departamento:'UCAYALI',         superficie: 102_411, poblacion:  609_794, hombres:  316_521, mujeres:  293_273, razon:107.9, densidad:    6.0, pctUrbano: 74.2, edadMediana:23.7, p65:  25_611, pct65: 4.2 },
];

// ── DATA MOCK — Provincial (Ayacucho) ─────────────────────────────────────
const MOCK_PROV: FilaProv[] = [
  { departamento:'AYACUCHO', provincia:'HUAMANGA',             superficie:  2_981, poblacion: 302_206, hombres: 144_872, mujeres: 157_334, razon: 92.1, densidad: 101.4, pctUrbano: 83.1, edadMediana:27.2, p65:  23_572, pct65: 7.8 },
  { departamento:'AYACUCHO', provincia:'CANGALLO',             superficie:  1_916, poblacion:  33_598, hombres:  16_231, mujeres:  17_367, razon: 93.5, densidad:  17.5, pctUrbano: 26.4, edadMediana:22.8, p65:   3_427, pct65:10.2 },
  { departamento:'AYACUCHO', provincia:'HUANCA SANCOS',        superficie:  2_862, poblacion:  11_580, hombres:   5_640, mujeres:   5_940, razon: 94.9, densidad:   4.0, pctUrbano: 41.3, edadMediana:24.1, p65:   1_321, pct65:11.4 },
  { departamento:'AYACUCHO', provincia:'HUANTA',               superficie:  3_878, poblacion:  98_341, hombres:  48_562, mujeres:  49_779, razon: 97.6, densidad:  25.4, pctUrbano: 53.2, edadMediana:25.6, p65:   7_966, pct65: 8.1 },
  { departamento:'AYACUCHO', provincia:'LA MAR',               superficie:  4_394, poblacion:  74_426, hombres:  37_219, mujeres:  37_207, razon:100.0, densidad:  16.9, pctUrbano: 32.1, edadMediana:23.4, p65:   5_656, pct65: 7.6 },
  { departamento:'AYACUCHO', provincia:'LUCANAS',              superficie: 14_494, poblacion:  63_458, hombres:  31_546, mujeres:  31_912, razon: 98.9, densidad:   4.4, pctUrbano: 52.7, edadMediana:28.5, p65:   6_853, pct65:10.8 },
  { departamento:'AYACUCHO', provincia:'PARINACOCHAS',         superficie:  5_968, poblacion:  23_215, hombres:  11_589, mujeres:  11_626, razon: 99.7, densidad:   3.9, pctUrbano: 49.8, edadMediana:27.9, p65:   2_577, pct65:11.1 },
  { departamento:'AYACUCHO', provincia:'PÁUCAR DEL SARA SARA', superficie:  2_069, poblacion:  11_427, hombres:   5_657, mujeres:   5_770, razon: 98.0, densidad:   5.5, pctUrbano: 43.1, edadMediana:30.2, p65:   1_371, pct65:12.0 },
  { departamento:'AYACUCHO', provincia:'SUCRE',                superficie:  1_785, poblacion:  14_289, hombres:   7_003, mujeres:   7_286, razon: 96.1, densidad:   8.0, pctUrbano: 28.9, edadMediana:28.8, p65:   1_672, pct65:11.7 },
  { departamento:'AYACUCHO', provincia:'VÍCTOR FAJARDO',       superficie:  2_161, poblacion:  19_987, hombres:   9_778, mujeres:  10_209, razon: 95.8, densidad:   9.2, pctUrbano: 35.4, edadMediana:27.1, p65:   2_059, pct65:10.3 },
  { departamento:'AYACUCHO', provincia:'VILCAS HUAMÁN',        superficie:  1_307, poblacion:  20_686, hombres:  10_859, mujeres:   9_827, razon:110.5, densidad:  15.8, pctUrbano: 30.2, edadMediana:24.7, p65:   1_882, pct65: 9.1 },
];

// ── DATA MOCK — Distrital (Huamanga) ──────────────────────────────────────
const MOCK_DIST: FilaDist[] = [
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'AYACUCHO',                          superficie:   18.9, poblacion:105_418, hombres: 49_312, mujeres: 56_106, razon: 87.9, densidad:5_579.8, pctUrbano:100.0, edadMediana:29.8, p65:  7_485, pct65: 7.1 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ACOCRO',                            superficie:  469.5, poblacion:  9_842, hombres:  4_843, mujeres:  4_999, razon: 96.9, densidad:   21.0, pctUrbano: 20.3, edadMediana:23.5, p65:    925, pct65: 9.4 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ACOS VINCHOS',                      superficie:  298.6, poblacion:  4_211, hombres:  2_050, mujeres:  2_161, razon: 94.9, densidad:   14.1, pctUrbano: 15.8, edadMediana:22.1, p65:    455, pct65:10.8 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'CARMEN ALTO',                       superficie:   22.5, poblacion: 38_621, hombres: 18_844, mujeres: 19_777, razon: 95.3, densidad:1_716.5, pctUrbano: 98.4, edadMediana:28.4, p65:  2_279, pct65: 5.9 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'CHIARA',                            superficie:  316.4, poblacion:  5_803, hombres:  2_834, mujeres:  2_969, razon: 95.5, densidad:   18.3, pctUrbano: 22.6, edadMediana:24.2, p65:    563, pct65: 9.7 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'OCROS',                             superficie:  414.1, poblacion:  4_982, hombres:  2_412, mujeres:  2_570, razon: 93.8, densidad:   12.0, pctUrbano: 19.4, edadMediana:23.8, p65:    558, pct65:11.2 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'PACAYCASA',                         superficie:   86.2, poblacion:  3_891, hombres:  1_897, mujeres:  1_994, razon: 95.1, densidad:   45.1, pctUrbano: 30.2, edadMediana:24.0, p65:    393, pct65:10.1 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'QUINUA',                            superficie:  211.5, poblacion:  5_647, hombres:  2_741, mujeres:  2_906, razon: 94.3, densidad:   26.7, pctUrbano: 25.8, edadMediana:23.9, p65:    593, pct65:10.5 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SAN JOSÉ DE TICLLAS',               superficie:  138.7, poblacion:  2_318, hombres:  1_120, mujeres:  1_198, razon: 93.5, densidad:   16.7, pctUrbano: 14.9, edadMediana:22.6, p65:    276, pct65:11.9 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SAN JUAN BAUTISTA',                 superficie:   31.6, poblacion: 68_344, hombres: 33_192, mujeres: 35_152, razon: 94.4, densidad:2_162.8, pctUrbano: 99.1, edadMediana:29.2, p65:  4_306, pct65: 6.3 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SANTIAGO DE PISCHA',                superficie:  198.3, poblacion:  1_492, hombres:    730, mujeres:    762, razon: 95.8, densidad:    7.5, pctUrbano: 12.4, edadMediana:22.0, p65:    181, pct65:12.1 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'SOCOS',                             superficie:  276.5, poblacion:  4_920, hombres:  2_393, mujeres:  2_527, razon: 94.7, densidad:   17.8, pctUrbano: 18.2, edadMediana:23.2, p65:    512, pct65:10.4 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'TAMBILLO',                          superficie:  196.8, poblacion:  4_371, hombres:  2_120, mujeres:  2_251, razon: 94.2, densidad:   22.2, pctUrbano: 24.1, edadMediana:23.6, p65:    428, pct65: 9.8 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'VINCHOS',                           superficie:  500.2, poblacion: 11_206, hombres:  5_478, mujeres:  5_728, razon: 95.6, densidad:   22.4, pctUrbano: 17.5, edadMediana:22.9, p65:  1_154, pct65:10.3 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'JESÚS NAZARENO',                    superficie:    9.8, poblacion: 25_087, hombres: 12_150, mujeres: 12_937, razon: 93.9, densidad:2_560.9, pctUrbano:100.0, edadMediana:28.9, p65:  1_806, pct65: 7.2 },
  { departamento:'AYACUCHO', provincia:'HUAMANGA', distrito:'ANDRÉS AVELINO CÁCERES DORREGARAY', superficie:   11.2, poblacion:  6_050, hombres:  3_011, mujeres:  3_039, razon: 99.1, densidad:  540.2, pctUrbano: 95.6, edadMediana:27.5, p65:    520, pct65: 8.6 },
];

const DEPS_LIST  = MOCK_DEP.map(r => r.departamento);
const PROVS_LIST = MOCK_PROV.map(r => r.provincia);
const DISTS_LIST = MOCK_DIST.map(r => r.distrito);

function allChecked(labels: string[]): DropdownItem[] {
  return labels.map(label => ({ label, checked: true }));
}

// ═══════════════════════════════════════════════════════════════════════════
@Component({
  selector: 'app-comparativa-territorial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparativa-territorial.component.html',
})
export class ComparativaTerritorialComponent {

  // ── Outputs de navegación ─────────────────────────────────────────────
  goToLanding   = output<void>();
  goToDashboard = output<void>();   // Vuelve al dashboard (vista Población)

  // ── Nivel ─────────────────────────────────────────────────────────────
  readonly NIVELES: NivelType[] = ['Departamental', 'Provincial', 'Distrital'];
  nivelActivo = signal<NivelType>('Departamental');

  setNivel(n: NivelType): void {
    this.nivelActivo.set(n);
    this.depsItems.set(allChecked(DEPS_LIST));
    this.provsItems.set(allChecked(PROVS_LIST));
    this.distItems.set(allChecked(DISTS_LIST));
    this.openDropdown.set(null);
  }

  // ── Dropdowns ─────────────────────────────────────────────────────────
  openDropdown = signal<'nivel' | 'dep' | 'prov' | 'dist' | null>(null);
  toggleDropdown(key: 'nivel' | 'dep' | 'prov' | 'dist'): void {
    this.openDropdown.set(this.openDropdown() === key ? null : key);
  }
  closeAll(): void { this.openDropdown.set(null); }

  // ── Items con check ───────────────────────────────────────────────────
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

  // ── Computed helpers ──────────────────────────────────────────────────
  allDepsOn  = computed(() => this.depsItems().every(x => x.checked));
  allProvsOn = computed(() => this.provsItems().every(x => x.checked));
  allDistsOn = computed(() => this.distItems().every(x => x.checked));

  cntDeps  = computed(() => this.depsItems().filter(x => x.checked).length);
  cntProvs = computed(() => this.provsItems().filter(x => x.checked).length);
  cntDists = computed(() => this.distItems().filter(x => x.checked).length);

  isProvActive = computed(() => this.nivelActivo() !== 'Departamental');
  isDistActive = computed(() => this.nivelActivo() === 'Distrital');

  depLabel  = computed(() => this.cntDeps()  === DEPS_LIST.length  ? 'Todos los dep.'  : `${this.cntDeps()} dep.`);
  provLabel = computed(() => this.cntProvs() === PROVS_LIST.length ? 'Todas las prov.' : `${this.cntProvs()} prov.`);
  distLabel = computed(() => this.cntDists() === DISTS_LIST.length ? 'Todos los dist.' : `${this.cntDists()} dist.`);

  // ── Datos filtrados ───────────────────────────────────────────────────
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

  // ── Totales ───────────────────────────────────────────────────────────
  totales = computed(() => {
    const rows = this.filasTabla();
    const pob  = rows.reduce((a, r) => a + r.poblacion, 0);
    const hom  = rows.reduce((a, r) => a + r.hombres, 0);
    const muj  = rows.reduce((a, r) => a + r.mujeres, 0);
    const sup  = rows.reduce((a, r) => a + r.superficie, 0);
    const p65  = rows.reduce((a, r) => a + r.p65, 0);
    const razon = muj ? +(hom / muj * 100).toFixed(1) : 0;
    const dens  = sup ? +(pob / sup).toFixed(1) : 0;
    const pct65 = pob ? +(p65 / pob * 100).toFixed(1) : 0;
    return { pob, hom, muj, sup, p65, razon, dens, pct65 };
  });

  // ── Helpers cast y formato ────────────────────────────────────────────
  asProv(f: FilaTabla): FilaProv { return f as FilaProv; }
  asDist(f: FilaTabla): FilaDist { return f as FilaDist; }

  fmtN(n: number): string   { return n.toLocaleString('es-PE'); }
  fmtD(n: number): string   { return n.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  fmtPct(n: number): string { return n.toFixed(1) + '%'; }
  fmtR(n: number): string   { return n.toFixed(1); }

  Math = Math;
}