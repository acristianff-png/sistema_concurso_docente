import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'

interface DuplicarEditalFormProps {
  onDuplicar: (novoNome: string, dataPublicacao: string | null) => Promise<void>
}

export function DuplicarEditalForm({ onDuplicar }: DuplicarEditalFormProps) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [dataPublicacao, setDataPublicacao] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSubmitting(true)
    await onDuplicar(nome.trim(), dataPublicacao || null)
    setSubmitting(false)
    setAberto(false)
    setNome('')
    setDataPublicacao('')
  }

  if (!aberto) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setAberto(true)}>
        Duplicar estrutura para novo edital
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-ink/30 p-3">
      <label className="flex flex-col gap-1 text-sm">
        Nome do novo edital
        <input
          type="text"
          required
          placeholder="ex.: Edital 3.500/2026"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="rounded border border-ink/20 px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Data de publicação
        <input
          type="date"
          value={dataPublicacao}
          onChange={(e) => setDataPublicacao(e.target.value)}
          className="rounded border border-ink/20 px-2 py-1.5"
        />
      </label>
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? 'Duplicando…' : 'Confirmar'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
        Cancelar
      </Button>
    </form>
  )
}
