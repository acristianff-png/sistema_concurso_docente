import { useState } from 'react'
import { Badge } from '@/components/brand'
import { FonteForm } from './FonteForm'
import type { FontePontuacao } from '@/types/database'
import type { NovaFonte } from '@/hooks/useBarema'

interface FonteListProps {
  fontes: FontePontuacao[]
  onUpdate: (fonteId: string, fonte: NovaFonte) => Promise<void>
  onToggleConfirmado: (fonteId: string, confirmado: boolean) => void
  onDelete: (fonteId: string) => void
}

export function FonteList({ fontes, onUpdate, onToggleConfirmado, onDelete }: FonteListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (fontes.length === 0) {
    return <p className="py-2 text-sm text-ink/50">Nenhuma fonte registrada ainda.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-ink/10">
      {fontes.map((f) =>
        editingId === f.id ? (
          <li key={f.id} className="py-2">
            <FonteForm
              initial={{
                descricao: f.descricao,
                valor: f.valor,
                link: f.link,
                data_referencia: f.data_referencia,
                confirmado: f.confirmado,
              }}
              submitLabel="Salvar"
              onSubmit={async (fonte) => {
                await onUpdate(f.id, fonte)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          </li>
        ) : (
          <li key={f.id} className={f.confirmado ? 'py-2' : 'py-2 opacity-70'}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  {f.descricao}
                  {f.link ? (
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-xs text-coral underline"
                    >
                      link
                    </a>
                  ) : null}
                </p>
                {f.data_referencia ? (
                  <p className="font-mono text-xs text-ink/50">{f.data_referencia}</p>
                ) : null}
                {f.carga_horaria_horas != null ? (
                  <p className="font-mono text-xs text-ink/50">{f.carga_horaria_horas}h</p>
                ) : null}
                {f.data_inicio ? (
                  <p className="font-mono text-xs text-ink/50">
                    {f.data_inicio} — {f.data_fim ?? 'em andamento'}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-ink">{f.valor}</span>
                <button
                  type="button"
                  onClick={() => onToggleConfirmado(f.id, !f.confirmado)}
                  title="Clique para alternar"
                >
                  <Badge tone={f.confirmado ? 'teal' : 'mustard'}>
                    {f.confirmado ? 'Confirmado' : 'Projetado'}
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(f.id)}
                  className="text-xs text-ink/60 hover:underline"
                >
                  editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(f.id)}
                  className="text-xs text-coral-dark hover:underline"
                >
                  remover
                </button>
              </div>
            </div>
          </li>
        ),
      )}
    </ul>
  )
}
