import { Injectable, signal, computed } from '@angular/core';

// --- Domain Entities (Hexagonal: Core) ---

export interface LocationOption {
  id: string;
  name: string;
}

export interface Demographics {
  totalPopulation: number;
  womenPercentage: number;
  menPercentage: number;
  limaPopulation: number;
  pyramidData: AgeGroup[];
  departmentStats: DepartmentStat[];
}

export interface AgeGroup {
  ageRange: string;
  male: number;
  female: number;
}

export interface DepartmentStat {
  id: string;
  name: string;
  maleCount: number;
  femaleCount: number;
  malePerc: number;
  femalePerc: number;
  densityIndex: number; // For map coloring 0-1 scale
}

// --- Infrastructure (Hexagonal: Adapter) ---

@Injectable({
  providedIn: 'root'
})
export class CensusService {
  // Mock Data mimicking the Peru structure
  private readonly _departments = signal<LocationOption[]>([
    { id: '00', name: 'Todos' },
    { id: '01', name: 'Amazonas' },
    { id: '02', name: 'Áncash' },
    { id: '03', name: 'Apurímac' },
    { id: '04', name: 'Arequipa' },
    { id: '05', name: 'Ayacucho' },
    { id: '06', name: 'Cajamarca' },
    { id: '07', name: 'Callao' },
    { id: '08', name: 'Cusco' },
    { id: '09', name: 'Huancavelica' },
    { id: '10', name: 'Huánuco' },
    { id: '11', name: 'Ica' },
    { id: '12', name: 'Junín' },
    { id: '13', name: 'La Libertad' },
    { id: '14', name: 'Lambayeque' },
    { id: '15', name: 'Lima' },
    { id: '16', name: 'Loreto' },
    { id: '17', name: 'Madre de Dios' },
    { id: '18', name: 'Moquegua' },
    { id: '19', name: 'Pasco' },
    { id: '20', name: 'Piura' },
    { id: '21', name: 'Puno' },
    { id: '22', name: 'San Martín' },
    { id: '23', name: 'Tacna' },
    { id: '24', name: 'Tumbes' },
    { id: '25', name: 'Ucayali' }
  ]);

  private readonly _provinces = signal<Record<string, LocationOption[]>>({
    '04': [ // Arequipa
      { id: '0401', name: 'Arequipa' }, { id: '0402', name: 'Camaná' }, { id: '0403', name: 'Caravelí' }, 
      { id: '0404', name: 'Castilla' }, { id: '0405', name: 'Caylloma' }
    ],
    '08': [ // Cusco
      { id: '0801', name: 'Cusco' }, { id: '0802', name: 'Acomayo' }, { id: '0803', name: 'Anta' },
      { id: '0804', name: 'Calca' }, { id: '0809', name: 'La Convención' }
    ],
    '15': [ // Lima
      { id: '1501', name: 'Lima' },
      { id: '1502', name: 'Barranca' },
      { id: '1503', name: 'Cajatambo' },
      { id: '1504', name: 'Canta' },
      { id: '1505', name: 'Cañete' },
      { id: '1506', name: 'Huaral' },
      { id: '1507', name: 'Huarochirí' },
      { id: '1508', name: 'Huaura' },
      { id: '1509', name: 'Oyón' },
      { id: '1510', name: 'Yauyos' }
    ]
  });

  private readonly _districts = signal<Record<string, LocationOption[]>>({
    '1501': [ // Lima districts
      { id: '150101', name: 'Lima' },
      { id: '150102', name: 'Ancón' },
      { id: '150103', name: 'Ate' },
      { id: '150104', name: 'Barranco' },
      { id: '150105', name: 'Breña' },
      { id: '150106', name: 'Carabayllo' },
      { id: '150107', name: 'Chaclacayo' },
      { id: '150108', name: 'Chorrillos' },
      { id: '150132', name: 'San Juan de Lurigancho' },
      { id: '150142', name: 'Villa El Salvador' }
    ],
    '0401': [ // Arequipa districts
      { id: '040101', name: 'Arequipa' }, { id: '040102', name: 'Alto Selva Alegre' }, { id: '040103', name: 'Cayma' },
      { id: '040129', name: 'Yanahuara' }
    ]
  });

  // State
  readonly selectedDepartment = signal<string>('00');
  readonly selectedProvince = signal<string>('00');
  readonly selectedDistrict = signal<string>('00');

  // Computed Select Options
  readonly departmentOptions = computed(() => this._departments());
  
  readonly provinceOptions = computed(() => {
    const deptId = this.selectedDepartment();
    if (deptId === '00') return [{ id: '00', name: 'Seleccione Departamento' }];
    const provs = this._provinces()[deptId];
    return provs ? [{ id: '00', name: 'Todas las provincias' }, ...provs] : [{ id: '00', name: 'Sin registros' }];
  });

  readonly districtOptions = computed(() => {
    const provId = this.selectedProvince();
    if (provId === '00') return [{ id: '00', name: 'Seleccione Provincia' }];
    const dists = this._districts()[provId];
    return dists ? [{ id: '00', name: 'Todos los distritos' }, ...dists] : [{ id: '00', name: 'Sin registros' }];
  });

  // Mock Data Provider
  readonly globalStats = computed<Demographics>(() => {
    // In a real hexagonal app, this would call an API via a Port
    return {
      totalPopulation: 35356367,
      womenPercentage: 51.2,
      menPercentage: 48.8,
      limaPopulation: 10126052,
      pyramidData: [
        { ageRange: '95+', male: 0.1, female: 0.2 },
        { ageRange: '90-94', male: 0.2, female: 0.3 },
        { ageRange: '85-89', male: 0.5, female: 0.7 },
        { ageRange: '80-84', male: 0.9, female: 1.1 },
        { ageRange: '75-79', male: 1.4, female: 1.6 },
        { ageRange: '70-74', male: 1.9, female: 2.1 },
        { ageRange: '65-69', male: 2.4, female: 2.6 },
        { ageRange: '60-64', male: 3.0, female: 3.2 },
        { ageRange: '55-59', male: 3.5, female: 3.7 },
        { ageRange: '50-54', male: 3.9, female: 4.1 },
        { ageRange: '45-49', male: 4.2, female: 4.3 },
        { ageRange: '40-44', male: 4.5, female: 4.6 },
        { ageRange: '35-39', male: 4.8, female: 4.9 },
        { ageRange: '30-34', male: 4.9, female: 5.0 },
        { ageRange: '25-29', male: 4.8, female: 4.8 },
        { ageRange: '20-24', male: 4.5, female: 4.5 },
        { ageRange: '15-19', male: 4.2, female: 4.1 },
        { ageRange: '10-14', male: 4.0, female: 3.9 },
        { ageRange: '05-09', male: 3.8, female: 3.7 },
        { ageRange: '00-04', male: 3.5, female: 3.4 }
      ],
      departmentStats: [
        { id: '01', name: 'Amazonas', maleCount: 17198, femaleCount: 13337, malePerc: 0.41, femalePerc: 0.33, densityIndex: 0.2 },
        { id: '02', name: 'Áncash', maleCount: 11887, femaleCount: 14988, malePerc: 0.28, femalePerc: 0.37, densityIndex: 0.5 },
        { id: '03', name: 'Apurímac', maleCount: 15788, femaleCount: 13533, malePerc: 0.38, femalePerc: 0.33, densityIndex: 0.3 },
        { id: '04', name: 'Arequipa', maleCount: 16806, femaleCount: 17876, malePerc: 0.39, femalePerc: 0.44, densityIndex: 0.6 },
        { id: '05', name: 'Ayacucho', maleCount: 17868, femaleCount: 16335, malePerc: 0.43, femalePerc: 0.40, densityIndex: 0.4 },
        { id: '06', name: 'Cajamarca', maleCount: 16444, femaleCount: 14543, malePerc: 0.39, femalePerc: 0.36, densityIndex: 0.5 },
        { id: '07', name: 'Callao', maleCount: 17315, femaleCount: 17238, malePerc: 0.42, femalePerc: 0.43, densityIndex: 1.0 },
        { id: '08', name: 'Cusco', maleCount: 13688, femaleCount: 16366, malePerc: 0.33, femalePerc: 0.40, densityIndex: 0.5 },
        { id: '09', name: 'Huancavelica', maleCount: 16278, femaleCount: 14696, malePerc: 0.39, femalePerc: 0.36, densityIndex: 0.2 },
        { id: '10', name: 'Huánuco', maleCount: 15504, femaleCount: 15511, malePerc: 0.37, femalePerc: 0.38, densityIndex: 0.3 },
        { id: '11', name: 'Ica', maleCount: 14901, femaleCount: 14478, malePerc: 0.36, femalePerc: 0.36, densityIndex: 0.6 },
        { id: '12', name: 'Junín', maleCount: 10828, femaleCount: 10294, malePerc: 0.26, femalePerc: 0.25, densityIndex: 0.5 },
        { id: '13', name: 'La Libertad', maleCount: 13651, femaleCount: 17163, malePerc: 0.33, femalePerc: 0.42, densityIndex: 0.7 },
        { id: '14', name: 'Lambayeque', maleCount: 12000, femaleCount: 12500, malePerc: 0.30, femalePerc: 0.31, densityIndex: 0.7 },
        { id: '15', name: 'Lima', maleCount: 3752520, femaleCount: 3586452, malePerc: 10.41, femalePerc: 10.31, densityIndex: 1.0 },
        { id: '16', name: 'Loreto', maleCount: 18000, femaleCount: 17500, malePerc: 0.45, femalePerc: 0.44, densityIndex: 0.1 },
        { id: '17', name: 'Madre de Dios', maleCount: 5000, femaleCount: 4500, malePerc: 0.12, femalePerc: 0.11, densityIndex: 0.05 },
        { id: '18', name: 'Moquegua', maleCount: 8000, femaleCount: 8200, malePerc: 0.20, femalePerc: 0.21, densityIndex: 0.3 },
        { id: '19', name: 'Pasco', maleCount: 7000, femaleCount: 6800, malePerc: 0.18, femalePerc: 0.17, densityIndex: 0.2 },
        { id: '20', name: 'Piura', maleCount: 22000, femaleCount: 22500, malePerc: 0.55, femalePerc: 0.56, densityIndex: 0.6 },
        { id: '21', name: 'Puno', maleCount: 19000, femaleCount: 19500, malePerc: 0.48, femalePerc: 0.49, densityIndex: 0.4 },
        { id: '22', name: 'San Martín', maleCount: 11000, femaleCount: 10500, malePerc: 0.27, femalePerc: 0.26, densityIndex: 0.3 },
        { id: '23', name: 'Tacna', maleCount: 9000, femaleCount: 9200, malePerc: 0.22, femalePerc: 0.23, densityIndex: 0.4 },
        { id: '24', name: 'Tumbes', maleCount: 6000, femaleCount: 6100, malePerc: 0.15, femalePerc: 0.15, densityIndex: 0.5 },
        { id: '25', name: 'Ucayali', maleCount: 10000, femaleCount: 9800, malePerc: 0.25, femalePerc: 0.24, densityIndex: 0.15 }
      ]
    };
  });

  updateDepartment(id: string) {
    this.selectedDepartment.set(id);
    this.selectedProvince.set('00');
    this.selectedDistrict.set('00');
  }

  updateProvince(id: string) {
    this.selectedProvince.set(id);
    this.selectedDistrict.set('00');
  }

  updateDistrict(id: string) {
    this.selectedDistrict.set(id);
  }
}