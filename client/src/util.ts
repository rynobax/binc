const MAX_VALUE = 100;
const EXP = 4;

export function remapToLogScale(value: number): number {
  if (value < 1 || value > MAX_VALUE) {
    throw new Error("Value must be between 1 and 100");
  }

  const exp = value ** EXP;
  const maxValue = MAX_VALUE ** EXP;
  const result = (exp / maxValue) * MAX_VALUE;

  return result;
}
