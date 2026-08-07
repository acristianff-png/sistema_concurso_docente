import { Badge } from '@/components/brand'
import type { FontePontuacao } from '@/types/database'

interface FonteListProps {
  fontes: FontePontuacao[]
  onToggleConfirmado: (fonteId: string, confirmado: boolean) => void
  onDelete: (fonteId: string) => void
}

export function FonteList({ fontes, onToggleConfirmado, onDelete }: FonteListProps) {
  if (fontes.length === 0) {
    return <p className="py-2 text-sm text-ink/50">Nenhuma fonte registrada ainda.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-ink/10">
      {fontes.map((f) => (
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
                onClick={() => onDelete(f.id)}
                className="text-xs text-coral-dark hover:underline"
              >
                remover
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
