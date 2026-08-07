import type { ItemBarema, UnidadePeriodo } from '@/types/database'

/**
 * Réplica em TypeScript das mesmas contas feitas no Postgres (trigger
 * `calcular_valor_fonte`, migration 20260807130001) — usada só para
 * mostrar um preview instantâneo no formulário antes de salvar. O valor
 * que efetivamente conta é sempre o calculado pelo banco.
 */

export function calcularPontosCargaHoraria(
  horas: number,
  horasPorUnidade: number,
  pontosPorUnidade: number,
): number {
  if (!horas || !horasPorUnidade || !pontosPorUnidade) return 0
  return Math.round((horas / horasPorUnidade) * pontosPorUnidade * 10000) / 10000
}

/** Semestre 1 = jan-jun, semestre 2 = jul-dez. Blocos parciais contam inteiros. */
function indiceSemestre(data: Date): number {
  return data.getFullYear() * 2 + (data.getMonth() < 6 ? 0 : 1)
}

export function contarPeriodos(dataInicio: string, dataFim: string | null, unidade: UnidadePeriodo): number {
  const inicio = new Date(`${dataInicio}T00:00:00`)
  const fim = dataFim ? new Date(`${dataFim}T00:00:00`) : new Date()

  if (unidade === 'semestre') {
    return indiceSemestre(fim) - indiceSemestre(inicio) + 1
  }
  return fim.getFullYear() - inicio.getFullYear() + 1
}

export function calcularPontosPeriodo(
  dataInicio: string,
  dataFim: string | null,
  unidade: UnidadePeriodo,
  pontosPorUnidade: number,
): number {
  if (!dataInicio || !pontosPorUnidade) return 0
  return contarPeriodos(dataInicio, dataFim, unidade) * pontosPorUnidade
}

export function calcularValorPreview(
  item: Pick<ItemBarema, 'modo_calculo' | 'horas_por_unidade' | 'pontos_por_unidade' | 'unidade_periodo'>,
  input: { horas?: number; dataInicio?: string; dataFim?: string | null },
): number | null {
  if (item.modo_calculo === 'carga_horaria') {
    if (!input.horas || !item.horas_por_unidade || !item.pontos_por_unidade) return null
    return calcularPontosCargaHoraria(input.horas, item.horas_por_unidade, item.pontos_por_unidade)
  }
  if (item.modo_calculo === 'periodo') {
    if (!input.dataInicio || !item.unidade_periodo || !item.pontos_por_unidade) return null
    return calcularPontosPeriodo(input.dataInicio, input.dataFim ?? null, item.unidade_periodo, item.pontos_por_unidade)
  }
  return null
}
