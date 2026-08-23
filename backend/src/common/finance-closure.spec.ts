import { computeClosureNumbers } from './finance-closure';

describe('computeClosureNumbers', () => {
  it('calcula o saldo esperado a partir de inicial + entradas - saidas', () => {
    const { expectedBalance } = computeClosureNumbers({
      initialBalance: 10000,
      totalIncome: 5000,
      totalExpense: 2000,
    });
    expect(expectedBalance).toBe(13000);
  });

  it('retorna diferenca zero quando o saldo informado bate com o esperado', () => {
    const { expectedBalance, difference } = computeClosureNumbers({
      initialBalance: 10000,
      totalIncome: 5000,
      totalExpense: 2000,
      informedBalance: 13000,
    });
    expect(expectedBalance).toBe(13000);
    expect(difference).toBe(0);
  });

  it('retorna diferenca negativa quando o saldo informado e menor que o esperado', () => {
    const { difference } = computeClosureNumbers({
      initialBalance: 10000,
      totalIncome: 5000,
      totalExpense: 2000,
      informedBalance: 12700,
    });
    expect(difference).toBe(-300);
  });

  it('retorna diferenca positiva quando o saldo informado e maior que o esperado', () => {
    const { difference } = computeClosureNumbers({
      initialBalance: 10000,
      totalIncome: 5000,
      totalExpense: 2000,
      informedBalance: 13500,
    });
    expect(difference).toBe(500);
  });

  it('retorna diferenca null quando nenhum saldo foi informado ainda', () => {
    const { difference } = computeClosureNumbers({
      initialBalance: 10000,
      totalIncome: 5000,
      totalExpense: 2000,
    });
    expect(difference).toBeNull();
  });

  it('funciona com saldo inicial zero e sem movimentacao', () => {
    const { expectedBalance, difference } = computeClosureNumbers({
      initialBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      informedBalance: 0,
    });
    expect(expectedBalance).toBe(0);
    expect(difference).toBe(0);
  });
});
