import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'

interface NovoQuesitoFormProps {
  onSubmit: (nome: string, teto: number) => Promise<void>
}

export function NovoQuesitoForm({ onSubmit }: NovoQuesitoFormProps) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [teto, setTeto] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const tetoNum = Number(teto.replace(',', '.'))
    if (!nome.trim() || Number.isNaN(tetoNum)) return
    setSubmitting(true)
    await onSubmit(nome.trim(), tetoNum)
    setSubmitting(false)
    setAberto(false)
    setNome('')
    setTeto('')
  }

  if (!aberto) {
    return (
      <Button variant="secondary" onClick={() => setAberto(true)}>
        + Novo quesito
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-ink/30 bg-white p-4"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Nome do quesito
        <input
          type="text"
          required
          placeholder="ex.: Títulos acadêmicos"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="rounded border border-ink/20 px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Teto
        <input
          type="text"
          inputMode="decimal"
          required
          value={teto}
          onChange={(e) => setTeto(e.target.value)}
          className="w-24 rounded border border-ink/20 px-2 py-1.5"
        />
      </label>
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? 'Criando…' : 'Criar'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
        Cancelar
      </Button>
    </form>
  )
}
