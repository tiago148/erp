import { round2 } from './money';

export interface ClosureNumbersInput {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  informedBalance?: number | null;
}

export interface ClosureNumbers {
  expectedBalance: number;
  difference: number | null;
}

export function computeClosureNumbers(
  input: ClosureNumbersInput,
): ClosureNumbers {
  const expectedBalance = round2(
    input.initialBalance + input.totalIncome - input.totalExpense,
  );
  const difference =
    input.informedBalance === undefined || input.informedBalance === null
      ? null
      : round2(input.informedBalance - expectedBalance);

  return { expectedBalance, difference };
}
