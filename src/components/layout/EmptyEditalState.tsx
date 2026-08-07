import { useState } from 'react'
import { Button } from '@/components/brand'

export function EmptyEditalState({ onSeed }: { onSeed: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    await onSeed()
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-teal-dark/30 bg-white/40 px-6 py-16 text-center">
      <h2 className="font-display text-xl font-medium text-ink">Nenhum edital ativo ainda</h2>
      <p className="max-w-md text-sm text-ink/70">
        Carregue os dados iniciais do Edital 3.244/2025 (quesitos, itens e ações de partida) para
        começar a acompanhar o barema.
      </p>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Carregando…' : 'Carregar dados iniciais'}
      </Button>
    </div>
  )
}
