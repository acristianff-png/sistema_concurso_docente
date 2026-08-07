import type { AreaElemento, AreaSugestao } from '@/types/database'

export interface ForcaArea {
  score: number
  elementosScore: number
  sugestoesScore: number
}

/**
 * Pontuação de força (0-100) de uma área temática.
 *
 * Fórmula (simples e ajustável — não é caixa-preta):
 *   elementosScore = soma(peso dos elementos existentes) * 10, até 60 pontos
 *     (cada elemento pesa 1-5; dois elementos fortes já saturam essa parte,
 *     porque elementos existentes contam mas não devem sozinhos definir a
 *     força — o resto vem de progresso ativo)
 *   sugestoesScore = (nº de sugestões com status 'aceita') / (total de
 *     sugestões) * 40 pontos — mede quanto do plano de melhoria já foi
 *     assumido como ação
 *   score = min(100, elementosScore + sugestoesScore)
 *
 * Sem sugestões cadastradas, sugestoesScore = 0 (não infla a nota por
 * ausência de dado).
 */
export function calcularForcaArea(elementos: AreaElemento[], sugestoes: AreaSugestao[]): ForcaArea {
  const somaPesos = elementos.reduce((acc, e) => acc + e.peso, 0)
  const elementosScore = Math.min(60, somaPesos * 10)

  const totalSugestoes = sugestoes.length
  const aceitas = sugestoes.filter((s) => s.status === 'aceita').length
  const sugestoesScore = totalSugestoes > 0 ? (aceitas / totalSugestoes) * 40 : 0

  const score = Math.min(100, Math.round(elementosScore + sugestoesScore))

  return { score, elementosScore, sugestoesScore }
}

/** Cor migra de fraca (coral) para forte (teal) conforme o score. */
export function corForForca(score: number): 'coral' | 'mustard' | 'teal' {
  if (score >= 70) return 'teal'
  if (score >= 40) return 'mustard'
  return 'coral'
}
