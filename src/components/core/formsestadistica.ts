/**
 * Base class for analyzing arrays of numerical data.
 * Provides basic descriptive statistics methods.
 */
export class StatisticalAnalyzer {
  protected values: number[];
  protected sortedValues: number[];

  constructor(values: number[]) {
    this.values = values;
    this.sortedValues = [...values].sort((a, b) => a - b);
  }

  public getCount(): number {
    return this.values.length;
  }

  public getMin(): number {
    if (this.values.length === 0) return 0;
    return this.sortedValues[0];
  }

  public getMax(): number {
    if (this.values.length === 0) return 0;
    return this.sortedValues[this.values.length - 1];
  }

  public getMean(): number {
    if (this.values.length === 0) return 0;
    const sum = this.values.reduce((a, b) => a + b, 0);
    return sum / this.values.length;
  }

  public getMedian(): number {
    if (this.sortedValues.length === 0) return 0;
    const mid = Math.floor(this.sortedValues.length / 2);
    if (this.sortedValues.length % 2 !== 0) {
      return this.sortedValues[mid];
    }
    return (this.sortedValues[mid - 1] + this.sortedValues[mid]) / 2;
  }

  public getMode(): number {
    if (this.sortedValues.length === 0) return 0;
    const frecuencias: Record<number, number> = {};
    let frecuenciaMaxima = 0;
    let valorModa = this.sortedValues[0];

    for (const valorActual of this.sortedValues) {
      frecuencias[valorActual] = (frecuencias[valorActual] || 0) + 1;
      if (frecuencias[valorActual] > frecuenciaMaxima) {
        frecuenciaMaxima = frecuencias[valorActual];
        valorModa = valorActual;
      }
    }
    return valorModa;
  }

  public getVariance(): number {
    if (this.values.length <= 1) return 0;
    const promedio = this.getMean();
    const sumaDiferenciasCuadradas = this.values.reduce(
      (acumulador, valorActual) => acumulador + Math.pow(valorActual - promedio, 2),
      0,
    );
    return sumaDiferenciasCuadradas / (this.values.length - 1); // Sample variance
  }

  public getStandardDeviation(): number {
    const variance = this.getVariance();
    // Avoid exact 0 to prevent division by zero in Cp/Cpk calculations
    return Math.sqrt(variance) || 0.001;
  }
}
