import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { Edital } from '@/types/database'

interface NovoEdital {
  nome: string
  data_publicacao?: string | null
  observacoes?: string | null
}

interface UseEditaisResult {
  editais: Edital[]
  loading: boolean
  refetch: () => Promise<void>
  criarEdital: (edital: NovoEdital) => Promise<void>
  atualizarEdital: (id: string, patch: Partial<NovoEdital>) => Promise<void>
  ativarEdital: (id: string) => Promise<void>
  excluirEdital: (id: string) => Promise<void>
  duplicarEdital: (origemId: string, novoNome: string, dataPublicacao?: string | null) => Promise<void>
}

/**
 * Todos os editais do usuário (não só o ativo) — para a página de gestão de
 * editais, onde dá pra criar, ativar, editar e excluir qualquer um deles.
 */
export function useEditais(): UseEditaisResult {
  const [editais, setEditais] = useState<Edital[]>([])
  const [loading, setLoading] = useState(true)
  // Só mostra o estado "carregando" na primeira carga (ou ao trocar de edital);
  // refetches após salvar atualizam os dados em segundo plano, sem desmontar a tela.
  const carregadoPara = useRef<string | null>(null)
  const { showError, showSuccess } = useToast()

  const refetch = useCallback(async () => {
    if (carregadoPara.current !== 'all') setLoading(true)
    carregadoPara.current = 'all'
    const { data, error } = await supabase
      .from('editais')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      showError(`Erro ao carregar editais: ${error.message}`)
    } else {
      setEditais(data as Edital[])
    }
    setLoading(false)
  }, [showError])

  useEffect(() => {
    refetch()
  }, [refetch])

  const criarEdital = useCallback(
    async (edital: NovoEdital) => {
      const { error } = await supabase.from('editais').insert({
        nome: edital.nome,
        ativo: false,
        data_publicacao: edital.data_publicacao ?? null,
        observacoes: edital.observacoes ?? null,
      })
      if (error) {
        showError(`Erro ao criar edital: ${error.message}`)
        return
      }
      showSuccess(`Edital "${edital.nome}" criado — defina os quesitos e ative quando estiver pronto.`)
      await refetch()
    },
    [refetch, showError, showSuccess],
  )

  const atualizarEdital = useCallback(
    async (id: string, patch: Partial<NovoEdital>) => {
      const snapshot = editais
      setEditais((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))

      const { error } = await supabase.from('editais').update(patch).eq('id', id)

      if (error) {
        setEditais(snapshot)
        showError(`Erro ao atualizar edital: ${error.message}`)
        return
      }
      await refetch()
    },
    [editais, refetch, showError],
  )

  const ativarEdital = useCallback(
    async (id: string) => {
      const snapshot = editais
      setEditais((prev) => prev.map((e) => ({ ...e, ativo: e.id === id })))

      // Duas escritas sequenciais (desativar todos, depois ativar o escolhido)
      // — simples e suficiente para uso pessoal single-user; não há risco
      // real de corrida já que só uma pessoa usa o app.
      const { error: errorDesativar } = await supabase
        .from('editais')
        .update({ ativo: false })
        .neq('id', id)

      const { error: errorAtivar } = errorDesativar
        ? { error: errorDesativar }
        : await supabase.from('editais').update({ ativo: true }).eq('id', id)

      if (errorAtivar) {
        setEditais(snapshot)
        showError(`Erro ao ativar edital: ${errorAtivar.message}`)
        return
      }
      showSuccess('Edital ativado.')
      await refetch()
    },
    [editais, refetch, showError, showSuccess],
  )

  const excluirEdital = useCallback(
    async (id: string) => {
      const snapshot = editais
      setEditais((prev) => prev.filter((e) => e.id !== id))

      const { error } = await supabase.from('editais').delete().eq('id', id)

      if (error) {
        setEditais(snapshot)
        showError(`Erro ao excluir edital: ${error.message}`)
        return
      }
      showSuccess('Edital excluído.')
      await refetch()
    },
    [editais, refetch, showError, showSuccess],
  )

  const duplicarEdital = useCallback(
    async (origemId: string, novoNome: string, dataPublicacao?: string | null) => {
      const { error } = await supabase.rpc('duplicar_edital_para_novo', {
        p_edital_origem_id: origemId,
        p_novo_nome: novoNome,
        p_data_publicacao: dataPublicacao ?? null,
      })
      if (error) {
        showError(`Erro ao duplicar edital: ${error.message}`)
        return
      }
      showSuccess(`Novo edital "${novoNome}" criado a partir da estrutura selecionada.`)
      await refetch()
    },
    [refetch, showError, showSuccess],
  )

  return { editais, loading, refetch, criarEdital, atualizarEdital, ativarEdital, excluirEdital, duplicarEdital }
}
