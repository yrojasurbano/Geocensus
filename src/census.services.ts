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
  
  // New Demographics Indicators
  medianAge: number;
  masculinityRatio: number;
  agingIndex: number;
  dependencyRatioTotal: number;
  dependencyRatioYouth: number;
  dependencyRatioOld: number;
  density: number; // Hab/Km2
  
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
    { id: '00', name: 'TODOS' },
    { id: '01', name: 'AMAZONAS' },
    { id: '02', name: 'ÁNCASH' },
    { id: '03', name: 'APURÍMAC' },
    { id: '04', name: 'AREQUIPA' },
    { id: '05', name: 'AYACUCHO' },
    { id: '06', name: 'CAJAMARCA' },
    { id: '07', name: 'CALLAO' },
    { id: '08', name: 'CUSCO' },
    { id: '09', name: 'HUANCAVELICA' },
    { id: '10', name: 'HUÁNUCO' },
    { id: '11', name: 'ICA' },
    { id: '12', name: 'JUNÍN' },
    { id: '13', name: 'LA LIBERTAD' },
    { id: '14', name: 'LAMBAYEQUE' },
    { id: '15', name: 'LIMA' },
    { id: '16', name: 'LORETO' },
    { id: '17', name: 'MADRE DE DIOS' },
    { id: '18', name: 'MOQUEGUA' },
    { id: '19', name: 'PASCO' },
    { id: '20', name: 'PIURA' },
    { id: '21', name: 'PUNO' },
    { id: '22', name: 'SAN MARTÍN' },
    { id: '23', name: 'TACNA' },
    { id: '24', name: 'TUMBES' },
    { id: '25', name: 'UCAYALI' }
  ]);

  // State
  readonly selectedDepartment = signal<string>('00');

  // Computed Select Options
  readonly departmentOptions = computed(() => this._departments());
  
  // Mock Data Provider
  readonly globalStats = computed<Demographics>(() => {
    // In a real hexagonal app, this would call an API via a Port
    // Returns data based on selection (Mock logic)
    const isNational = this.selectedDepartment() === '00';
    
    // Base stats
    let stats: Demographics = {
      totalPopulation: 35356367,
      womenPercentage: 51.2,
      menPercentage: 48.8,
      limaPopulation: 10126052,
      medianAge: 33.4,
      masculinityRatio: 95.3, // Men per 100 women
      agingIndex: 45.2, // Elders per 100 youths
      dependencyRatioTotal: 58.4,
      dependencyRatioYouth: 40.1,
      dependencyRatioOld: 18.3,
      density: 26.5,
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
        { id: '01', name: 'AMAZONAS', maleCount: 217198, femaleCount: 213337, malePerc: 50.4, femalePerc: 49.6, densityIndex: 0.2 },
        { id: '02', name: 'ÁNCASH', maleCount: 511887, femaleCount: 514988, malePerc: 49.8, femalePerc: 50.2, densityIndex: 0.5 },
        { id: '03', name: 'APURÍMAC', maleCount: 215788, femaleCount: 213533, malePerc: 50.2, femalePerc: 49.8, densityIndex: 0.3 },
        { id: '04', name: 'AREQUIPA', maleCount: 716806, femaleCount: 717876, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.6 },
        { id: '05', name: 'AYACUCHO', maleCount: 317868, femaleCount: 316335, malePerc: 50.1, femalePerc: 49.9, densityIndex: 0.4 },
        { id: '06', name: 'CAJAMARCA', maleCount: 716444, femaleCount: 714543, malePerc: 50.0, femalePerc: 50.0, densityIndex: 0.5 },
        { id: '07', name: 'CALLAO', maleCount: 517315, femaleCount: 517238, malePerc: 50.0, femalePerc: 50.0, densityIndex: 1.0 },
        { id: '08', name: 'CUSCO', maleCount: 613688, femaleCount: 616366, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.5 },
        { id: '09', name: 'HUANCAVELICA', maleCount: 162780, femaleCount: 166960, malePerc: 49.3, femalePerc: 50.7, densityIndex: 0.2 },
        { id: '10', name: 'HUÁNUCO', maleCount: 355040, femaleCount: 355110, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.3 },
        { id: '11', name: 'ICA', maleCount: 449010, femaleCount: 444780, malePerc: 50.2, femalePerc: 49.8, densityIndex: 0.6 },
        { id: '12', name: 'JUNÍN', maleCount: 608280, femaleCount: 602940, malePerc: 50.2, femalePerc: 49.8, densityIndex: 0.5 },
        { id: '13', name: 'LA LIBERTAD', maleCount: 936510, femaleCount: 971630, malePerc: 49.0, femalePerc: 51.0, densityIndex: 0.7 },
        { id: '14', name: 'LAMBAYEQUE', maleCount: 620000, femaleCount: 625000, malePerc: 49.8, femalePerc: 50.2, densityIndex: 0.7 },
        { id: '15', name: 'LIMA', maleCount: 5752520, femaleCount: 5866452, malePerc: 49.5, femalePerc: 50.5, densityIndex: 1.0 },
        { id: '16', name: 'LORETO', maleCount: 518000, femaleCount: 517500, malePerc: 50.0, femalePerc: 50.0, densityIndex: 0.1 },
        { id: '17', name: 'MADRE DE DIOS', maleCount: 85000, femaleCount: 84500, malePerc: 50.1, femalePerc: 49.9, densityIndex: 0.05 },
        { id: '18', name: 'MOQUEGUA', maleCount: 98000, femaleCount: 98200, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.3 },
        { id: '19', name: 'PASCO', maleCount: 127000, femaleCount: 126800, malePerc: 50.0, femalePerc: 50.0, densityIndex: 0.2 },
        { id: '20', name: 'PIURA', maleCount: 922000, femaleCount: 922500, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.6 },
        { id: '21', name: 'PUNO', maleCount: 619000, femaleCount: 619500, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.4 },
        { id: '22', name: 'SAN MARTÍN', maleCount: 411000, femaleCount: 410500, malePerc: 50.0, femalePerc: 50.0, densityIndex: 0.3 },
        { id: '23', name: 'TACNA', maleCount: 179000, femaleCount: 179200, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.4 },
        { id: '24', name: 'TUMBES', maleCount: 126000, femaleCount: 126100, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.5 },
        { id: '25', name: 'UCAYALI', maleCount: 250000, femaleCount: 249800, malePerc: 49.9, femalePerc: 50.1, densityIndex: 0.15 }
      ]
    };

    // If filtering by department, simulate changes in data
    if (!isNational) {
       const dept = stats.departmentStats.find(d => d.id === this.selectedDepartment());
       if (dept) {
         stats = {
           ...stats,
           totalPopulation: dept.maleCount + dept.femaleCount,
           menPercentage: parseFloat(((dept.maleCount / (dept.maleCount + dept.femaleCount)) * 100).toFixed(1)),
           womenPercentage: parseFloat(((dept.femaleCount / (dept.maleCount + dept.femaleCount)) * 100).toFixed(1)),
           density: parseFloat(((dept.densityIndex * 100) / 2).toFixed(1)), // Mock density calc
           // Random variations for other stats based on ID to simulate difference
           medianAge: 30 + (parseInt(dept.id) % 10),
           agingIndex: 35 + (parseInt(dept.id) % 20),
         }
       }
    }

    return stats;
  });

  updateDepartment(id: string) {
    this.selectedDepartment.set(id);
  }
}