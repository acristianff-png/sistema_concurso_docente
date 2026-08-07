import { useState, type FormEvent } from 'react'
import { Button, Badge } from '@/components/brand'
import type { PrioridadeAcao } from '@/types/database'
import type { AcaoComComentarios } from '@/types/domain'

interface AcaoModalProps {
  acao: AcaoComComentarios
  quesitoNome?: string
  areaNome?: string
  onClose: () => void
  onUpdate: (patch: Partial<AcaoComComentarios>) => Promise<void>
  onDelete: () => Promise<void>
  onAddComentario: (texto: string) => Promise<void>
}

export function AcaoModal({ acao, quesitoNome, areaNome, onClose, onUpdate, onDelete, onAddComentario }: AcaoModalProps) {
  const [novoComentario, setNovoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleAddComentario(e: FormEvent) {
    e.preventDefault()
    if (!novoComentario.trim()) return
    setEnviando(true)
    await onAddComentario(novoComentario.trim())
    setNovoComentario('')
    setEnviando(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-paper p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-medium text-ink">{acao.titulo}</h2>
          <button type="button" onClick={onClose} className="text-ink/50 hover:text-ink">
            ✕
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {quesitoNome ? <Badge tone="teal">{quesitoNome}</Badge> : null}
          {areaNome ? <Badge tone="neutral">{areaNome}</Badge> : null}
        </div>

        {acao.descricao ? <p className="mb-4 whitespace-pre-wrap text-sm text-ink/80">{acao.descricao}</p> : null}

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            Status
            <select
              value={acao.status}
              onChange={(e) => onUpdate({ status: e.target.value as AcaoComComentarios['status'] })}
              className="rounded border border-ink/20 px-2 py-1.5"
            >
              <option value="nao_iniciado">Não iniciado</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Prioridade
            <select
              value={acao.prioridade}
              onChange={(e) => onUpdate({ prioridade: e.target.value as PrioridadeAcao })}
              className="rounded border border-ink/20 px-2 py-1.5"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            Prazo
            <input
              type="date"
              value={acao.prazo ?? ''}
              onChange={(e) => onUpdate({ prazo: e.target.value || null })}
              className="rounded border border-ink/20 px-2 py-1.5"
            />
          </label>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-ink/60">Comentários</h3>
          <ul className="flex flex-col gap-2">
            {acao.acao_comentarios.map((c) => (
              <li key={c.id} className="rounded-md bg-white px-3 py-2 text-sm">
                <p className="text-ink">{c.texto}</p>
                <p className="mt-1 font-mono text-[10px] text-ink/40">
                  {new Date(c.created_at).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
            {acao.acao_comentarios.length === 0 ? (
              <li className="text-sm text-ink/50">Nenhum comentário ainda.</li>
            ) : null}
          </ul>

          <form onSubmit={handleAddComentario} className="mt-2 flex gap-2">
            <input
              type="text"
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Adicionar observação…"
              className="flex-1 rounded border border-ink/20 px-2 py-1.5 text-sm"
            />
            <Button type="submit" size="sm" disabled={enviando}>
              Enviar
            </Button>
          </form>
        </div>

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={async () => {
            await onDelete()
            onClose()
          }}
        >
          Remover ação
        </Button>
      </div>
    </div>
  )
}
