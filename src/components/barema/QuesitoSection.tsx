import { StepNumber, DashedConnector, ProgressBar, NoticeBox } from '@/components/brand'
import { ItemRow } from './ItemRow'
import { totalQuesito, type QuesitoComItens } from '@/types/domain'
import type { NovaFonte } from '@/hooks/useBarema'

interface QuesitoSectionProps {
  quesito: QuesitoComItens
  ordem: number
  isLast: boolean
  mostrarProjecao: boolean
  onAddFonte: (itemId: string, fonte: NovaFonte) => Promise<void>
  onUpdateFonte: (fonteId: string, fonte: NovaFonte) => Promise<void>
  onToggleConfirmado: (fonteId: string, confirmado: boolean) => void
  onDeleteFonte: (fonteId: string) => void
}

export function QuesitoSection({
  quesito,
  ordem,
  isLast,
  mostrarProjecao,
  onAddFonte,
  onUpdateFonte,
  onToggleConfirmado,
  onDeleteFonte,
}: QuesitoSectionProps) {
  const confirmado = totalQuesito(quesito, false)
  const projetado = totalQuesito(quesito, true)
  const noTeto = confirmado >= quesito.teto

  return (
    <section className="flex gap-4">
      <div className="flex flex-col items-center">
        <StepNumber n={ordem} tone="teal" />
        {!isLast ? <DashedConnector className="mt-2" /> : null}
      </div>

      <div className="flex-1 pb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-medium text-ink">{quesito.nome}</h2>
          <span className="font-mono text-xs text-ink/50">teto {quesito.teto}</span>
        </div>

        <ProgressBar
          value={confirmado}
          max={quesito.teto}
          projetadoValue={mostrarProjecao ? projetado : undefined}
        />

        {noTeto ? (
          <NoticeBox label="No teto" className="mt-3">
            Este quesito já está no teto — mais produção aqui não aumenta a pontuação.
          </NoticeBox>
        ) : null}

        <div className="mt-2 rounded-lg border border-ink/10 bg-white px-4">
          {quesito.itens_barema.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              mostrarProjecao={mostrarProjecao}
              onAddFonte={onAddFonte}
              onUpdateFonte={onUpdateFonte}
              onToggleConfirmado={onToggleConfirmado}
              onDeleteFonte={onDeleteFonte}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
