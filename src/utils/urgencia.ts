export type Urgencia = 'vencida' | 'ate_7_dias' | 'ate_15_dias' | 'sem_urgencia'

/**
 * Urgência é sempre derivada do prazo no client, nunca persistida —
 * assim ela reflete a data atual em cada carregamento da página.
 */
export function calcularUrgencia(prazo: string | null, hoje: Date = new Date()): Urgencia {
  if (!prazo) return 'sem_urgencia'

  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const dataPrazo = new Date(`${prazo}T00:00:00`)
  const diffDias = Math.round((dataPrazo.getTime() - hojeSemHora.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias < 0) return 'vencida'
  if (diffDias <= 7) return 'ate_7_dias'
  if (diffDias <= 15) return 'ate_15_dias'
  return 'sem_urgencia'
}

export function isUrgente(prazo: string | null, hoje: Date = new Date()): boolean {
  const u = calcularUrgencia(prazo, hoje)
  return u === 'vencida' || u === 'ate_7_dias' || u === 'ate_15_dias'
}

export const URGENCIA_LABEL: Record<Urgencia, string> = {
  vencida: 'Vencida',
  ate_7_dias: '≤ 7 dias',
  ate_15_dias: '≤ 15 dias',
  sem_urgencia: 'Sem urgência',
}
