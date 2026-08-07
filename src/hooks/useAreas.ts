import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { AreaComDetalhes } from '@/types/domain'

interface UseAreasResult {
  areas: AreaComDetalhes[]
  loading: boolean
  refetch: () => Promise<void>
  addElemento: (areaId: string, descricao: string, peso: number, link?: string | null) => Promise<void>
  removeElemento: (elementoId: string) => Promise<void>
  addSugestao: (areaId: string, descricao: string) => Promise<void>
  aceitarSugestao: (sugestaoId: string, areaId: string, descricao: string) => Promise<void>
  descartarSugestao: (sugestaoId: string) => Promise<void>
}

export function useAreas(editalId: string | null): UseAreasResult {
  const [areas, setAreas] = useState<AreaComDetalhes[]>([])
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  const refetch = useCallback(async () => {
    if (!editalId) {
      setAreas([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('areas_tematicas')
      .select('*, area_elementos(*), area_sugestoes(*)')
      .eq('edital_id', editalId)
      .order('nome', { ascending: true })

    if (error) {
      showError(`Erro ao carregar áreas temáticas: ${error.message}`)
    } else {
      // Sem Relationships declaradas no tipo Database, o postgrest-js não
      // valida o embed em tempo de tipo — o shape real vem do RLS/schema.
      setAreas(data as unknown as AreaComDetalhes[])
    }
    setLoading(false)
  }, [editalId, showError])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addElemento = useCallback(
    async (areaId: string, descricao: string, peso: number, link?: string | null) => {
      const { error } = await supabase
        .from('area_elementos')
        .insert({ area_id: areaId, descricao, peso, link: link ?? null })
      if (error) {
        showError(`Erro ao adicionar elemento: ${error.message}`)
        return
      }
      await refetch()
    },
    [refetch, showError],
  )

  const removeElemento = useCallback(
    async (elementoId: string) => {
      const { error } = await supabase.from('area_elementos').delete().eq('id', elementoId)
      if (error) {
        showError(`Erro ao remover elemento: ${error.message}`)
        return
      }
      await refetch()
    },
    [refetch, showError],
  )

  const addSugestao = useCallback(
    async (areaId: string, descricao: string) => {
      const { error } = await supabase.from('area_sugestoes').insert({ area_id: areaId, descricao })
      if (error) {
        showError(`Erro ao adicionar sugestão: ${error.message}`)
        return
      }
      await refetch()
    },
    [refetch, showError],
  )

  const aceitarSugestao = useCallback(
    async (sugestaoId: string, areaId: string, descricao: string) => {
      const { error: updateError } = await supabase
        .from('area_sugestoes')
        .update({ status: 'aceita' })
        .eq('id', sugestaoId)

      if (updateError) {
        showError(`Erro ao aceitar sugestão: ${updateError.message}`)
        return
      }

      const { error: insertError } = await supabase.from('acoes').insert({
        titulo: descricao,
        area_id: areaId,
        afeta_pontuacao: false,
        status: 'nao_iniciado',
        prioridade: 'media',
        ordem: 0,
      })

      if (insertError) {
        showError(`Sugestão aceita, mas houve erro ao criar a ação vinculada: ${insertError.message}`)
      } else {
        showSuccess('Sugestão aceita e ação criada no plano de ação.')
      }

      await refetch()
    },
    [refetch, showError, showSuccess],
  )

  const descartarSugestao = useCallback(
    async (sugestaoId: string) => {
      const { error } = await supabase.from('area_sugestoes').update({ status: 'descartada' }).eq('id', sugestaoId)
      if (error) {
        showError(`Erro ao descartar sugestão: ${error.message}`)
        return
      }
      await refetch()
    },
    [refetch, showError],
  )

  return { areas, loading, refetch, addElemento, removeElemento, addSugestao, aceitarSugestao, descartarSugestao }
}
