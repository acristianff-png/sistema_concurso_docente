// Lê o CSV exportado do edital (colunas: Nº, Quesito, Nome do Item,
// Descrição, Pontuação Unitária, Pontuação Máxima) e monta a estrutura de
// quesitos + itens pronta para a função importar_edital_csv.

export interface ItemCsv {
  nome: string
  criterio_edital: string | null
  unidade: number
  pontuacao_maxima: number
}

export interface QuesitoCsv {
  nome: string
  teto: number
  itens: ItemCsv[]
}

export interface ParseBaremaCsvResult {
  quesitos: QuesitoCsv[]
  avisos: string[]
}

/** Parser de CSV genérico (RFC4180): aspas, vírgulas dentro de campo, "" escapado. */
export function parseCsv(texto: string): string[][] {
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let dentroDeAspas = false
  let i = 0
  const len = texto.length

  while (i < len) {
    const char = texto[i]

    if (dentroDeAspas) {
      if (char === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i += 2
          continue
        }
        dentroDeAspas = false
        i++
        continue
      }
      campo += char
      i++
      continue
    }

    if (char === '"') {
      dentroDeAspas = true
      i++
      continue
    }
    if (char === ',') {
      linha.push(campo)
      campo = ''
      i++
      continue
    }
    if (char === '\r') {
      i++
      continue
    }
    if (char === '\n') {
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
      i++
      continue
    }
    campo += char
    i++
  }

  if (campo.length > 0 || linha.length > 0) {
    linha.push(campo)
    linhas.push(linha)
  }

  return linhas.filter((l) => l.some((c) => c.trim() !== ''))
}

function normalizarCabecalho(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function acharColuna(cabecalho: string[], ...alvos: string[]): number {
  return cabecalho.findIndex((c) => {
    const normalizado = normalizarCabecalho(c)
    return alvos.some((alvo) => normalizado.includes(alvo))
  })
}

function paraNumero(valor: string | undefined): number | null {
  if (!valor) return null
  const limpo = valor.trim().replace(',', '.')
  if (!limpo) return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

export function parseBaremaCsv(texto: string): ParseBaremaCsvResult {
  const linhas = parseCsv(texto)
  if (linhas.length < 2) {
    throw new Error('O arquivo está vazio ou não tem linhas de dados além do cabeçalho.')
  }

  const [cabecalho, ...dados] = linhas
  const idxQuesito = acharColuna(cabecalho, 'quesito')
  const idxNome = acharColuna(cabecalho, 'nome do item', 'item')
  const idxDescricao = acharColuna(cabecalho, 'descri')
  const idxUnitaria = acharColuna(cabecalho, 'unitaria')
  const idxMaxima = acharColuna(cabecalho, 'maxima')

  if (idxQuesito === -1 || idxNome === -1 || idxUnitaria === -1 || idxMaxima === -1) {
    throw new Error(
      'Não encontrei as colunas esperadas no cabeçalho (Quesito, Nome do Item, Pontuação Unitária, Pontuação Máxima). Confira se o CSV tem essas colunas.',
    )
  }

  const avisos: string[] = []
  const quesitosPorNome = new Map<string, QuesitoCsv>()
  const ordemQuesitos: string[] = []

  dados.forEach((linha, idx) => {
    const numeroLinha = idx + 2 // +1 pelo cabeçalho, +1 por contar da linha 1
    const nomeQuesito = linha[idxQuesito]?.trim()
    const nomeItem = linha[idxNome]?.trim()

    if (!nomeQuesito || !nomeItem) {
      avisos.push(`Linha ${numeroLinha}: sem quesito ou nome do item — ignorada.`)
      return
    }

    const unidade = paraNumero(linha[idxUnitaria])
    const pontuacaoMaxima = paraNumero(linha[idxMaxima])

    if (unidade === null || pontuacaoMaxima === null) {
      avisos.push(`Linha ${numeroLinha} ("${nomeItem}"): pontuação unitária ou máxima inválida — ignorada.`)
      return
    }

    if (!quesitosPorNome.has(nomeQuesito)) {
      quesitosPorNome.set(nomeQuesito, { nome: nomeQuesito, teto: 0, itens: [] })
      ordemQuesitos.push(nomeQuesito)
    }

    quesitosPorNome.get(nomeQuesito)!.itens.push({
      nome: nomeItem,
      criterio_edital: idxDescricao >= 0 ? linha[idxDescricao]?.trim() || null : null,
      unidade,
      pontuacao_maxima: pontuacaoMaxima,
    })
  })

  const quesitos = ordemQuesitos.map((nome) => {
    const quesito = quesitosPorNome.get(nome)!
    const somaItens = quesito.itens.reduce((soma, item) => soma + item.pontuacao_maxima, 0)
    return { ...quesito, teto: Math.round(somaItens * 100) / 100 }
  })

  if (quesitos.length === 0) {
    throw new Error('Nenhum item válido encontrado no CSV.')
  }

  return { quesitos, avisos }
}
