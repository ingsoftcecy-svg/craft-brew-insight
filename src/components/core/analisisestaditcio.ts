import { StatisticalAnalyzer } from "./formsestadistica";

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  label: string;
  count: number;
  midPoint: number;
  normalDist: number;
}

export interface CapabilityStats {
  mean: number;
  stdDev: number;
  median: number;
  mode: number;
  cp: number;
  cpk: number;
  minVal: number;
  maxVal: number;
  numClasses: number;
  range: number;
  classWidth: number;
  histogramData: HistogramBin[];
}

export class ProcessCapabilityAnalyzer extends StatisticalAnalyzer {
  private lsl: number;
  private usl: number;

  constructor(values: number[], lsl: number, usl: number) {
    super(values);
    this.lsl = lsl;
    this.usl = usl;
  }

  public getCp(): number {
    if (this.values.length === 0) return 0;
    const stdDev = this.getStandardDeviation();
    const cpCalc = (this.usl - this.lsl) / (6 * stdDev);
    // User requested max value of 1.33 for Cp
    return Math.min(1.33, cpCalc);
  }

  public getCpk(): number {
    if (this.values.length === 0) return 0;
    const mean = this.getMean();
    const stdDev = this.getStandardDeviation();
    const cpkUpper = (this.usl - mean) / (3 * stdDev);
    const cpkLower = (mean - this.lsl) / (3 * stdDev);
    const cpkCalc = Math.min(cpkUpper, cpkLower);
    // User requested max value of 1.33 for Cpk
    return Math.min(1.33, cpkCalc);
  }

  private generateHistogramAndNormalDist(
    mean: number,
    stdDev: number,
  ): {
    histogramData: HistogramBin[];
    numClasses: number;
    range: number;
    classWidth: number;
  } {
    const totalDatos = this.getCount();
    if (totalDatos === 0) {
      return { histogramData: [], numClasses: 0, range: 0, classWidth: 0 };
    }

    const minVal = this.getMin();
    const maxVal = this.getMax();

    // Sturges' Rule
    const numClasesCrudo = 1 + Math.log2(totalDatos);
    const range = maxVal - minVal;
    let classWidth = range / (numClasesCrudo > 0 ? numClasesCrudo : 1);

    if (classWidth === 0) classWidth = 1;

    const numClasses = numClasesCrudo;
    const numClasesEntero = Math.ceil(numClasesCrudo);

    const bins = Array.from({ length: numClasesEntero }, (_, i) => {
      const binStart = minVal + i * classWidth;
      const binEnd = minVal + (i + 1) * classWidth;
      return {
        binStart,
        binEnd,
        label: `[${binStart.toFixed(1)}, ${binEnd.toFixed(1)}]`,
        count: 0,
        midPoint: binStart + classWidth / 2,
        normalDist: 0,
      };
    });

    this.values.forEach((valorActual) => {
      // For exactly maxVal, put it in the last bin
      if (valorActual === maxVal && bins.length > 0) {
        bins[bins.length - 1].count++;
        return;
      }
      for (const clase of bins) {
        if (valorActual >= clase.binStart && valorActual < clase.binEnd) {
          clase.count++;
          break;
        }
      }
    });

    // Normal distribution calculation
    const areaClases = classWidth * totalDatos;
    bins.forEach((clase) => {
      const valorMedio = clase.midPoint;
      const exponente = -Math.pow(valorMedio - mean, 2) / (2 * Math.pow(stdDev, 2));
      const funcionDensidadProbabilidad =
        (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
      clase.normalDist = Number((funcionDensidadProbabilidad * areaClases).toFixed(2));
    });

    return { histogramData: bins, numClasses, range, classWidth };
  }

  public getSummaryStats(): CapabilityStats {
    const mean = this.getMean();
    const stdDev = this.getStandardDeviation();
    const { histogramData, numClasses, range, classWidth } = this.generateHistogramAndNormalDist(
      mean,
      stdDev,
    );

    return {
      mean,
      stdDev,
      median: this.getMedian(),
      mode: this.getMode(),
      cp: this.getCp(),
      cpk: this.getCpk(),
      minVal: this.getMin(),
      maxVal: this.getMax(),
      numClasses,
      range,
      classWidth,
      histogramData,
    };
  }
}
