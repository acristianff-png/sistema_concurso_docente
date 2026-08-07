import { createContext, useContext, useState, type ReactNode } from 'react'

interface SimulacaoContextValue {
  mostrarProjecao: boolean
  toggle: () => void
}

const SimulacaoContext = createContext<SimulacaoContextValue | null>(null)

/**
 * Modo simulação: quando ligado, os totais somam também as fontes de
 * pontuação não confirmadas (confirmado = false). Fica global na sessão
 * do app para o dashboard e a página do barema ficarem sempre coerentes
 * entre si.
 */
export function SimulacaoProvider({ children }: { children: ReactNode }) {
  const [mostrarProjecao, setMostrarProjecao] = useState(false)

  return (
    <SimulacaoContext.Provider value={{ mostrarProjecao, toggle: () => setMostrarProjecao((v) => !v) }}>
      {children}
    </SimulacaoContext.Provider>
  )
}

export function useSimulacao(): SimulacaoContextValue {
  const ctx = useContext(SimulacaoContext)
  if (!ctx) {
    throw new Error('useSimulacao deve ser usado dentro de <SimulacaoProvider>')
  }
  return ctx
}
