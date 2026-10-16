import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'
import type { Edital } from '@/types/database'

interface NovoEditalFormProps {
  editaisExistentes: Edital[]
  onCriarEmBranco: (nome: string, dataPublicacao: string | null, observacoes: string | null) => Promise<void>
  onDuplicar: (origemId: string, nome: string, dataPublicacao: string | null) => Promise<void>
  onClose: () => void
}

export function NovoEditalForm({ editaisExistentes, onCriarEmBranco, onDuplicar, onClose }: NovoEditalFormProps) {
  const [modo, setModo] = useState<'em_branco' | 'duplicar'>(
    editaisExistentes.length > 0 ? 'duplicar' : 'em_branco',
  )
  const [nome, setNome] = useState('')
  const [dataPublicacao, setDataPublicacao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [origemId, setOrigemId] = useState(editaisExistentes[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSubmitting(true)

    if (modo === 'duplicar' && origemId) {
      await onDuplicar(origemId, nome.trim(), dataPublicacao || null)
    } else {
      await onCriarEmBranco(nome.trim(), dataPublicacao || null, observacoes.trim() || null)
    }

    setSubmitting(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-dashed border-ink/30 bg-white p-4">
      <h2 className="font-display text-lg font-medium text-ink">Novo edital</h2>

      {editaisExistentes.length > 0 ? (
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={modo === 'duplicar'}
              onChange={() => setModo('duplicar')}
              className="accent-coral"
            />
            Duplicar estrutura de um edital existente
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={modo === 'em_branco'}
              onChange={() => setModo('em_branco')}
              className="accent-coral"
            />
            Começar em branco
          </label>
        </div>
      ) : null}

      {modo === 'duplicar' && editaisExistentes.length > 0 ? (
        <label className="flex flex-col gap-1 text-sm">
          Copiar quesitos e itens de
          <select
            value={origemId}
            onChange={(e) => setOrigemId(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5"
          >
            {editaisExistentes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Nome do edital
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
      </div>

      {modo === 'em_branco' ? (
        <label className="flex flex-col gap-1 text-sm">
          Observações
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className="rounded border border-ink/20 px-2 py-1.5"
          />
        </label>
      ) : null}

      {modo === 'em_branco' ? (
        <p className="text-xs text-ink/50">
          Edital em branco não tem quesitos — adicione-os na tela de estrutura depois de criar.
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Criando…' : 'Criar edital'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
