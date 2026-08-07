import type { AreaComDetalhes } from '@/types/domain'
import type { Acao, Edital } from '@/types/database'

export function gerarMemorialMarkdown(edital: Edital, areas: AreaComDetalhes[], acoes: Acao[]): string {
  const linhas: string[] = []

  linhas.push(`# Memorial — Aderência às áreas temáticas`)
  linhas.push('')
  linhas.push(`_${edital.nome} — gerado em ${new Date().toLocaleDateString('pt-BR')}_`)
  linhas.push('')

  for (const area of areas) {
    linhas.push(`## ${area.nome}`)
    linhas.push('')

    linhas.push('### Elementos existentes')
    if (area.area_elementos.length === 0) {
      linhas.push('_Nenhum elemento registrado._')
    } else {
      for (const el of area.area_elementos) {
        linhas.push(`- ${el.descricao}${el.link ? ` ([link](${el.link}))` : ''}`)
      }
    }
    linhas.push('')

    const concluidas = acoes.filter((a) => a.area_id === area.id && a.status === 'concluido')
    linhas.push('### Ações concluídas')
    if (concluidas.length === 0) {
      linhas.push('_Nenhuma ação concluída ainda._')
    } else {
      for (const a of concluidas) {
        linhas.push(`- ${a.titulo}`)
      }
    }
    linhas.push('')
  }

  return linhas.join('\n')
}

export function baixarArquivoMarkdown(filename: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
