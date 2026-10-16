import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'
import type { Edital } from '@/types/database'

interface EditarEditalFormProps {
  edital: Edital
  onSubmit: (patch: { nome: string; data_publicacao: string | null; observacoes: string | null }) => Promise<void>
  onCancel: () => void
}

export function EditarEditalForm({ edital, onSubmit, onCancel }: EditarEditalFormProps) {
  const [nome, setNome] = useState(edital.nome)
  const [dataPublicacao, setDataPublicacao] = useState(edital.data_publicacao ?? '')
  const [observacoes, setObservacoes] = useState(edital.observacoes ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSubmitting(true)
    await onSubmit({
      nome: nome.trim(),
      data_publicacao: dataPublicacao || null,
      observacoes: observacoes.trim() || null,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Nome
          <input
            type="text"
            required
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
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Observações
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          className="rounded border border-ink/20 px-2 py-1.5"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
