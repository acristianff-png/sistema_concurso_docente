import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { QuesitoComItens } from '@/types/domain'
import type { FontePontuacao } from '@/types/database'

export interface NovaFonte {
  descricao: string
  /** Sempre digitado manualmente pelo usuário — nada é calculado pelo banco. */
  valor: number
  link?: string | null
  data_referencia?: string | null
  confirmado: boolean
}

interface UseBaremaResult {
  quesitos: QuesitoComItens[]
  loading: boolean
  refetch: () => Promise<void>
  addFonte: (itemId: string, fonte: NovaFonte) => Promise<void>
  updateFonte: (fonteId: string, patch: Partial<NovaFonte>) => Promise<void>
  deleteFonte: (fonteId: string) => Promise<void>
}

export function useBarema(editalId: string | null): UseBaremaResult {
  const [quesitos, setQuesitos] = useState<QuesitoComItens[]>([])
  const [loading, setLoading] = useState(true)
  const { showError } = useToast()

  const refetch = useCallback(async () => {
    if (!editalId) {
      setQuesitos([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('quesitos')
      .select('*, itens_barema(*, fontes_pontuacao(*))')
      .eq('edital_id', editalId)
      .order('ordem', { ascending: true })

    if (error) {
      showError(`Erro ao carregar o barema: ${error.message}`)
    } else {
      const ordenado = (data as unknown as QuesitoComItens[]).map((q) => ({
        ...q,
        itens_barema: q.itens_barema.map((item) => ({
          ...item,
          fontes_pontuacao: [...item.fontes_pontuacao].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),
        })),
      }))
      setQuesitos(ordenado)
    }
    setLoading(false)
  }, [editalId, showError])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addFonte = useCallback(
    async (itemId: string, fonte: NovaFonte) => {
      const tempId = `temp-${Date.now()}`
      const optimistic: FontePontuacao = {
        id: tempId,
        item_id: itemId,
        descricao: fonte.descricao,
        valor: fonte.valor,
        link: fonte.link ?? null,
        data_referencia: fonte.data_referencia ?? null,
        confirmado: fonte.confirmado,
        carga_horaria_horas: null,
        data_inicio: null,
        data_fim: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const snapshot = quesitos
      setQuesitos((prev) =>
        prev.map((q) => ({
          ...q,
          itens_barema: q.itens_barema.map((item) =>
            item.id === itemId
              ? { ...item, fontes_pontuacao: [optimistic, ...item.fontes_pontuacao] }
              : item,
          ),
        })),
      )

      const { error } = await supabase.from('fontes_pontuacao').insert({
        item_id: itemId,
        descricao: fonte.descricao,
        valor: fonte.valor,
        link: fonte.link ?? null,
        data_referencia: fonte.data_referencia ?? null,
        confirmado: fonte.confirmado,
      })

      if (error) {
        setQuesitos(snapshot)
        showError(`Erro ao adicionar fonte: ${error.message}`)
        return
      }

      await refetch()
    },
    [quesitos, refetch, showError],
  )

  const updateFonte = useCallback(
    async (fonteId: string, patch: Partial<NovaFonte>) => {
      const snapshot = quesitos
      setQuesitos((prev) =>
        prev.map((q) => ({
          ...q,
          itens_barema: q.itens_barema.map((item) => ({
            ...item,
            fontes_pontuacao: item.fontes_pontuacao.map((f) =>
              f.id === fonteId ? { ...f, ...patch } : f,
            ),
          })),
        })),
      )

      const { error } = await supabase.from('fontes_pontuacao').update(patch).eq('id', fonteId)

      if (error) {
        setQuesitos(snapshot)
        showError(`Erro ao atualizar fonte: ${error.message}`)
        return
      }

      await refetch()
    },
    [quesitos, refetch, showError],
  )

  const deleteFonte = useCallback(
    async (fonteId: string) => {
      const snapshot = quesitos
      setQuesitos((prev) =>
        prev.map((q) => ({
          ...q,
          itens_barema: q.itens_barema.map((item) => ({
            ...item,
            fontes_pontuacao: item.fontes_pontuacao.filter((f) => f.id !== fonteId),
          })),
        })),
      )

      const { error } = await supabase.from('fontes_pontuacao').delete().eq('id', fonteId)

      if (error) {
        setQuesitos(snapshot)
        showError(`Erro ao remover fonte: ${error.message}`)
        return
      }

      await refetch()
    },
    [quesitos, refetch, showError],
  )

  return { quesitos, loading, refetch, addFonte, updateFonte, deleteFonte }
}
