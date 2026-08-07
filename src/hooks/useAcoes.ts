import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { AcaoComComentarios } from '@/types/domain'
import type { PrioridadeAcao, StatusAcao } from '@/types/database'

export interface NovaAcao {
  titulo: string
  descricao?: string | null
  quesito_id?: string | null
  area_id?: string | null
  afeta_pontuacao: boolean
  impacto_pontos?: number | null
  prioridade: PrioridadeAcao
  prazo?: string | null
}

interface UseAcoesResult {
  acoes: AcaoComComentarios[]
  loading: boolean
  refetch: () => Promise<void>
  createAcao: (acao: NovaAcao) => Promise<void>
  updateAcao: (id: string, patch: Partial<AcaoComComentarios>) => Promise<void>
  deleteAcao: (id: string) => Promise<void>
  moverAcao: (id: string, novoStatus: StatusAcao, novaOrdem: number) => Promise<void>
  addComentario: (acaoId: string, texto: string) => Promise<void>
}

export function useAcoes(): UseAcoesResult {
  const [acoes, setAcoes] = useState<AcaoComComentarios[]>([])
  const [loading, setLoading] = useState(true)
  const { showError } = useToast()

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('acoes')
      .select('*, acao_comentarios(*)')
      .order('ordem', { ascending: true })

    if (error) {
      showError(`Erro ao carregar ações: ${error.message}`)
    } else {
      const comOrdenados = (data as unknown as AcaoComComentarios[]).map((a) => ({
        ...a,
        acao_comentarios: [...a.acao_comentarios].sort(
          (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
        ),
      }))
      setAcoes(comOrdenados)
    }
    setLoading(false)
  }, [showError])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createAcao = useCallback(
    async (acao: NovaAcao) => {
      const maxOrdem = Math.max(0, ...acoes.filter((a) => a.status === 'nao_iniciado').map((a) => a.ordem + 1))
      const { error } = await supabase.from('acoes').insert({
        ...acao,
        status: 'nao_iniciado',
        ordem: maxOrdem,
      })
      if (error) {
        showError(`Erro ao criar ação: ${error.message}`)
        return
      }
      await refetch()
    },
    [acoes, refetch, showError],
  )

  const updateAcao = useCallback(
    async (id: string, patch: Partial<AcaoComComentarios>) => {
      const snapshot = acoes
      setAcoes((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))

      const { acao_comentarios: _omit, ...rest } = patch
      const { error } = await supabase.from('acoes').update(rest).eq('id', id)

      if (error) {
        setAcoes(snapshot)
        showError(`Erro ao atualizar ação: ${error.message}`)
        return
      }
      await refetch()
    },
    [acoes, refetch, showError],
  )

  const deleteAcao = useCallback(
    async (id: string) => {
      const snapshot = acoes
      setAcoes((prev) => prev.filter((a) => a.id !== id))

      const { error } = await supabase.from('acoes').delete().eq('id', id)

      if (error) {
        setAcoes(snapshot)
        showError(`Erro ao remover ação: ${error.message}`)
        return
      }
    },
    [acoes, showError],
  )

  const moverAcao = useCallback(
    async (id: string, novoStatus: StatusAcao, novaOrdem: number) => {
      const snapshot = acoes
      const movida = acoes.find((a) => a.id === id)
      if (!movida) return

      const semMovida = acoes.filter((a) => a.id !== id)
      const destino = semMovida
        .filter((a) => a.status === novoStatus)
        .sort((a, b) => a.ordem - b.ordem)
      destino.splice(novaOrdem, 0, { ...movida, status: novoStatus })

      const reindexado = destino.map((a, idx) => ({ ...a, ordem: idx }))
      const outros = semMovida.filter((a) => a.status !== novoStatus)

      setAcoes([...outros, ...reindexado])

      const updates = reindexado.map((a) =>
        supabase.from('acoes').update({ status: a.status, ordem: a.ordem }).eq('id', a.id),
      )
      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)

      if (failed?.error) {
        setAcoes(snapshot)
        showError(`Erro ao mover ação: ${failed.error.message}`)
        return
      }
      await refetch()
    },
    [acoes, refetch, showError],
  )

  const addComentario = useCallback(
    async (acaoId: string, texto: string) => {
      const snapshot = acoes
      const tempComentario = {
        id: `temp-${Date.now()}`,
        acao_id: acaoId,
        texto,
        created_at: new Date().toISOString(),
      }
      setAcoes((prev) =>
        prev.map((a) =>
          a.id === acaoId ? { ...a, acao_comentarios: [...a.acao_comentarios, tempComentario] } : a,
        ),
      )

      const { error } = await supabase.from('acao_comentarios').insert({ acao_id: acaoId, texto })

      if (error) {
        setAcoes(snapshot)
        showError(`Erro ao adicionar comentário: ${error.message}`)
        return
      }
      await refetch()
    },
    [acoes, refetch, showError],
  )

  return { acoes, loading, refetch, createAcao, updateAcao, deleteAcao, moverAcao, addComentario }
}
