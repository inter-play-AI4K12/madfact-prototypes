// Math and examples ported from the published /balance activity (15 October 2026).
export type Pair = number[]
export type Example = "mixed" | "small" | "maximum" | "balanced"
export const clamp = (v: number, a = 0, b = 1): number => Math.max(a, Math.min(b, v))
export const predict = (row: Pair, col: Pair): number => 1 + 2 * (row[0] * col[0] + row[1] * col[1])
export class BalanceModel {
  rows: Pair[] = []
  cols: Pair[] = []
  truths: number[] = []
  example: Example = "mixed"
  stepIndex = 0
  constructor(example: Example = "mixed") { this.reset(example) }
  reset(example: Example = "mixed"): void {
    this.example = example
    this.stepIndex = 0
    this.rows = [[1,.95],[.96,1],[.04,.08],[1,1],[.08,.04]]
    this.cols = [[1,.96],[.95,1],[1,.98],[.03,.06],[1,1]]
    if (example === "maximum") {
      this.rows = this.rows.map(() => [.05,.05])
      this.cols = this.cols.map(() => [.05,.05])
    }
    const targetRows = [[.85,.15],[.15,.85],[.75,.65],[.35,.25],[.9,.8]]
    const targetCols = [[.2,.9],[.85,.15],[.6,.7],[.9,.8],[.25,.3]]
    this.truths = Array.from({length:25}, (_, i) => {
      const p = this.prediction(i)
      return example === "balanced" ? p : example === "small" ? clamp(p + (i % 3 - 1) * .3, 1, 5)
        : example === "maximum" ? 5 : predict(targetRows[Math.floor(i/5)], targetCols[i%5])
    })
  }
  prediction(i: number): number { return predict(this.rows[Math.floor(i/5)], this.cols[i%5]) }
  error(i: number): number { return this.prediction(i) - this.truths[i] }
  rmse(): number { return Math.sqrt(this.truths.reduce((sum, _, i) => sum + this.error(i) ** 2, 0) / 25) }
  tileDegrees(i: number): number { return this.error(i) / 4 * 35 }
  frameDegrees(): number { return this.rmse() / 4 * 85 }
  setFactor(kind: "rows" | "cols", index: number, factor: number, value: number): void {
    this[kind][index][factor] = clamp(value)
  }
  // Exact coordinate least-squares update; each step can only reduce squared error.
  optimizeStep(): {kind: "rows" | "cols"; index: number; factor: number} {
    const step = this.stepIndex++ % 20
    const kind = step < 10 ? "rows" : "cols"
    const index = Math.floor(step % 10 / 2), factor = step % 2
    const own = this[kind], other = this[kind === "rows" ? "cols" : "rows"]
    let numerator = 0, denominator = 0
    other.forEach((pair, j) => {
      const truth = this.truths[kind === "rows" ? index * 5 + j : j * 5 + index]
      numerator += pair[factor] * ((truth - 1) / 2 - own[index][1-factor] * pair[1-factor])
      denominator += pair[factor] ** 2
    })
    if (denominator > 1e-12) own[index][factor] = clamp(numerator / denominator)
    return {kind, index, factor}
  }
}
