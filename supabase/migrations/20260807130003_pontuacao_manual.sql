-- ============================================================================
-- Pontuação passa a ser 100% manual: o usuário digita os pontos de cada
-- fonte, o sistema não calcula mais nada automaticamente. Motivos:
--
-- 1. O cálculo por carga horária (`horas / horas_por_unidade *
--    pontos_por_unidade`) fracionava pontos para blocos incompletos (ex.:
--    3h de um item "0.5 pt a cada 15h" gerava 0.1 pt). O edital não
--    especifica proporcionalização — só a leitura mais simples "atende ou
--    não atende o bloco" é segura.
-- 2. Ainda que o cálculo por período (`contar_periodos`) já contasse
--    blocos inteiros de semestre/ano, o usuário pediu para deixar de ter
--    QUALQUER cálculo automático: ele mesmo decide quantos pontos cada
--    fonte vale.
--
-- As colunas `modo_calculo` / `horas_por_unidade` / `pontos_por_unidade` /
-- `unidade_periodo` (item) e `carga_horaria_horas` / `data_inicio` /
-- `data_fim` (fonte) continuam existindo — viram só referência exibida na
-- tela (ex.: "0.5 pt a cada 15h") para lembrar o usuário da regra do
-- edital enquanto ele digita o valor manualmente. Nada mais escreve em
-- `fontes_pontuacao.valor` além do próprio usuário.
-- ============================================================================

drop trigger if exists fontes_pontuacao_calcular_valor on public.fontes_pontuacao;
drop function if exists public.calcular_valor_fonte();
drop function if exists public.contar_periodos(date, date, text);

comment on column public.itens_barema.modo_calculo is
  'Apenas referência exibida na tela (ex.: badge "carga horária"/"período"). Não calcula mais nada — valor é sempre digitado manualmente em fontes_pontuacao.valor.';
comment on column public.fontes_pontuacao.data_fim is
  'Histórico/referência apenas (NULL = vínculo em andamento). Não é mais usado para calcular valor.';

-- ----------------------------------------------------------------------------
-- Re-seed com os mesmos dados reais, mas agora com `valor` digitado
-- explicitamente nas fontes que antes dependiam do trigger (docência por
-- carga horária e vínculos por período). Os números abaixo são os que o
-- trigger já havia calculado antes de ser removido — preservados como
-- ponto de partida manual; o usuário pode ajustá-los livremente dali em
-- diante (ex.: os vínculos "em andamento" vão ficar defasados com o tempo
-- e precisam ser atualizados manualmente a cada semestre).
-- ----------------------------------------------------------------------------
create or replace function public.seed_dados_iniciais()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_edital_id uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid; v_q4 uuid; v_q5 uuid;

  -- Quesito 1
  v_item_doutorado uuid; v_item_mestrado_sc uuid; v_item_mestrado_outra uuid;
  v_item_especializacao_sc uuid;

  -- Quesito 2
  v_item_docencia_grad_sc uuid; v_item_docencia_grad_outras uuid;
  v_item_docencia_pos_sc uuid; v_item_docencia_pos_outras uuid;
  v_item_outras_docentes uuid;
  v_item_orient_dout_concl uuid; v_item_orient_dout_and uuid;
  v_item_coorient_dout_concl uuid; v_item_coorient_dout_and uuid;
  v_item_orient_mest_concl uuid; v_item_orient_mest_and uuid;
  v_item_coorient_mest_concl uuid; v_item_coorient_mest_and uuid;
  v_item_orient_grad uuid;

  -- Quesito 3
  v_item_a1a2_qualif uuid; v_item_a3a4_qualif uuid; v_item_b1b2_qualif uuid;
  v_item_a1a2_naoqualif uuid; v_item_a3a4_naoqualif uuid; v_item_b1b2_naoqualif uuid;
  v_item_cartas_editor uuid; v_item_livro_completo uuid;
  v_item_organizacao_livro uuid; v_item_capitulo_livro uuid;
  v_item_conf_internacional uuid; v_item_conf_nacional uuid;
  v_item_apres_oral_internacional uuid; v_item_apres_oral_nacional uuid;
  v_item_poster_internacional uuid; v_item_poster_nacional uuid;
  v_item_resumo_expandido uuid; v_item_organizacao_evento uuid;

  -- Quesito 4
  v_item_coordenador_curso uuid; v_item_orgaos_colegiados uuid;
  v_item_posdoc uuid; v_item_ativ_prof_saude uuid; v_item_ativ_remunerada_pesquisa uuid;
  v_item_coord_campo_pesquisa uuid; v_item_outras_part_c_financiamento uuid;
  v_item_coord_projeto_c_financiamento uuid; v_item_coord_projeto_s_financiamento uuid;
  v_item_estagio_exterior uuid;
  v_item_banca_doutorado uuid; v_item_banca_mestrado uuid;
  v_item_banca_concurso_docente uuid; v_item_banca_selecao_docente uuid;
  v_item_coord_extensao uuid; v_item_part_extensao uuid;
  v_item_corpo_editorial uuid; v_item_revisao_manuscrito uuid; v_item_revisor_adhoc uuid;

  -- Quesito 5
  v_item_trabalho_premiado uuid; v_item_distincoes uuid; v_item_tese_premiada uuid;

  v_area1 uuid; v_area2 uuid; v_area3 uuid;
begin
  if v_user_id is null then
    raise exception 'seed_dados_iniciais: usuário não autenticado';
  end if;

  if exists (
    select 1 from public.editais where user_id = v_user_id and nome = 'Edital 3.244/2025'
  ) then
    return;
  end if;

  -- ---------------------------------------------------------------------
  -- Edital
  -- ---------------------------------------------------------------------
  insert into public.editais (user_id, nome, ativo, data_publicacao, observacoes)
  values (
    v_user_id,
    'Edital 3.244/2025',
    true,
    '2025-11-27',
    'Tabela de Pontuação da Prova de Títulos — Diário Oficial da União, ' ||
    'Seção 3, nº 226, 27/11/2025, págs. 64-65. Concurso DMPS/UFMG.'
  )
  returning id into v_edital_id;

  -- =======================================================================
  -- QUESITO 1 — Títulos acadêmicos (teto 10)
  -- =======================================================================
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 1, 'Títulos acadêmicos', 10)
  returning id into v_q1;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Doutorado em Saúde Coletiva concluído', 8, 8)
  returning id into v_item_doutorado;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia)
  values (
    v_item_doutorado,
    'Doutorado em Saúde Pública — Programa de Pós-Graduação em Saúde Pública, Faculdade de Medicina/UFMG (concluído)',
    8, true, '2026-03-01'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Mestrado em Saúde Coletiva concluído', 3, 3)
  returning id into v_item_mestrado_sc;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Mestrado em outra área concluído', 1.5, 1.5)
  returning id into v_item_mestrado_outra;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia)
  values (
    v_item_mestrado_outra,
    'Mestrado em Enfermagem com ênfase em Saúde Coletiva e Epidemiologia — Escola de Enfermagem/UFMG (2022)',
    1.5, true, '2022-01-01'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Especialização lato sensu em Saúde Coletiva concluída', 1, 1)
  returning id into v_item_especializacao_sc;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_especializacao_sc, 'Especialização em Saúde Coletiva, ênfase Gestão em Saúde — UniAmérica (2021)', 1, true, '2021-01-01'),
    (v_item_especializacao_sc, 'Especialização em Saúde Coletiva, ênfase Saúde do Trabalhador — UniAmérica (2021)', 1, true, '2021-01-01');

  -- =======================================================================
  -- QUESITO 2 — Experiência docente (teto 30)
  -- =======================================================================
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 2, 'Experiência docente', 30)
  returning id into v_q2;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, horas_por_unidade, pontos_por_unidade)
  values (v_q2, 'Docência graduação — disciplinas da área Saúde Coletiva', 0.5, 18, 'carga_horaria', 15, 0.5)
  returning id into v_item_docencia_grad_sc;

  -- valores abaixo = horas / 15 * 0.5, como o trigger removido calculava
  insert into public.fontes_pontuacao (item_id, descricao, valor, carga_horaria_horas, confirmado, data_inicio, data_fim) values
    (v_item_docencia_grad_sc, 'Professor voluntário — EMI025 Saúde Coletiva — Escola de Enfermagem/UFMG (2021/02 e 2022/01)', 4, 120, true, '2021-08-01', '2022-06-30'),
    (v_item_docencia_grad_sc, 'Professor voluntário — EMI041 Epidemiologia — Escola de Enfermagem/UFMG (2022/02)', 2, 60, true, '2022-08-01', '2022-12-20'),
    (v_item_docencia_grad_sc, 'Professor convidado — MED065 Iniciação à Atenção Primária à Saúde I — Faculdade de Medicina/UFMG (2024/01)', 2.5, 75, true, '2024-02-01', '2024-06-30'),
    (v_item_docencia_grad_sc, 'Professor assistente substituto — ENA019 TA Gestão do Sistema de Saúde — Escola de Enfermagem/UFMG (2023/02)', 2.5, 75, true, '2023-08-01', '2023-12-20'),
    (v_item_docencia_grad_sc, 'Estágio docente — MED065 Iniciação à Atenção Primária à Saúde I — Faculdade de Medicina/UFMG (2023/02)', 2.5, 75, true, '2023-08-01', '2023-12-20');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, horas_por_unidade, pontos_por_unidade)
  values (v_q2, 'Docência graduação — outras disciplinas', 0.25, 5, 'carga_horaria', 15, 0.25)
  returning id into v_item_docencia_grad_outras;

  -- valores abaixo = horas / 15 * 0.25
  insert into public.fontes_pontuacao (item_id, descricao, valor, carga_horaria_horas, confirmado, data_inicio, data_fim) values
    (v_item_docencia_grad_outras, 'Professor titular — ENF20252N Primeiros Socorros — Faculdade CTA (2025/02)', 1.3333, 80, true, '2025-08-01', '2025-12-20'),
    (v_item_docencia_grad_outras, 'Professor assistente substituto — ENA035 Capacitação Pedagógica Aplicada à Enfermagem — Escola de Enfermagem/UFMG (2023/02)', 1, 60, true, '2023-08-01', '2023-12-20'),
    (v_item_docencia_grad_outras, 'Professor assistente substituto — ENA035 Seminário de Integração — Escola de Enfermagem/UFMG (2023/02)', 0.25, 15, true, '2023-08-01', '2023-12-20');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, horas_por_unidade, pontos_por_unidade)
  values (v_q2, 'Docência pós-graduação stricto sensu — Saúde Coletiva', 0.5, 18, 'carga_horaria', 15, 0.5)
  returning id into v_item_docencia_pos_sc;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, horas_por_unidade, pontos_por_unidade)
  values (v_q2, 'Docência pós-graduação stricto sensu — outras', 0.25, 5, 'carga_horaria', 15, 0.25)
  returning id into v_item_docencia_pos_outras;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, horas_por_unidade, pontos_por_unidade)
  values (v_q2, 'Outras experiências docentes (tutorias e docência em pós-graduação lato sensu)', 0.1, 3, 'carga_horaria', 15, 0.1)
  returning id into v_item_outras_docentes;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima) values
    (v_q2, 'Orientação de doutorado concluído', 3, 12)
    returning id into v_item_orient_dout_concl;
  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
    values (v_q2, 'Orientação de doutorado em andamento', 1.5, 6) returning id into v_item_orient_dout_and;
  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
    values (v_q2, 'Coorientação de doutorado concluído', 1.5, 6) returning id into v_item_coorient_dout_concl;
  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
    values (v_q2, 'Coorientação de doutorado em andamento', 1, 4) returning id into v_item_coorient_dout_and;
  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
    values (v_q2, 'Orientação de mestrado concluído', 1.5, 6) returning id into v_item_orient_mest_concl;
  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
    values (v_q2, 'Orientação de mestrado em andamento', 0.75, 3) returning id into v_item_orient_mest_and;
  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
    values (v_q2, 'Coorientação de mestrado concluído', 0.75, 3) returning id into v_item_coorient_mest_concl;
  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
    values (v_q2, 'Coorientação de mestrado em andamento', 0.5, 2) returning id into v_item_coorient_mest_and;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q2, 'Orientação de graduação concluído (IC, monitoria, extensão, TCC)', 0.25, 1.5)
  returning id into v_item_orient_grad;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_orient_grad, 'Orientação de IC — aluno de Enfermagem/UFMG — revisão sistemática PLLA/CaHA (concluída, 1 aluno)', 0.25, true, '2025-01-01'),
    (v_item_orient_grad, 'Orientação de alunos de Farmácia/PUC Minas — projeto de pesquisa institucional Instituto Antony Barbosa (concluída, 5 alunos)', 1.25, true, '2025-01-01');

  -- =======================================================================
  -- QUESITO 3 — Produção científica, técnica, artística e cultural (teto 38)
  -- =======================================================================
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 3, 'Produção científica, técnica, artística e cultural na área', 38)
  returning id into v_q3;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Artigo completo Qualis A1/A2 (2017-2020) — autoria qualificada', 4, 24)
  returning id into v_item_a1a2_qualif;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia)
  values (
    v_item_a1a2_qualif,
    'Ferreira ACM et al. Diagnostic performance of an artificial intelligence model for retinal abnormalities in primary health care. Telemedicine Journal and e-Health — submetido, aguardando decisão',
    4, false, null, '2026-01-01'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Artigo completo Qualis A3/A4 (2017-2020) — autoria qualificada', 3, 18)
  returning id into v_item_a3a4_qualif;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia) values
    (v_item_a3a4_qualif, 'Ferreira ACM et al. Efficacy, Durability, and Safety of Collagen Biostimulators Based on PLLA and CaHA in the Face: A Systematic Review. Aesthetic Plastic Surgery. 2025.', 3, true, 'https://pubmed.ncbi.nlm.nih.gov/41184662/', '2025-03-01'),
    (v_item_a3a4_qualif, 'Ferreira ACM et al. Pesquisa Nacional de Saúde do Escolar: mudanças metodológicas e comparabilidade com o Global School-based Student Health Survey. Rev Bras Epidemiologia. 2024;27.', 3, true, 'https://www.scielo.br/j/rbepid/a/6wcKB7KVKLq9xfXfDJnMnmK/?lang=pt', '2024-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Artigo completo Qualis B1/B2 (2017-2020) — autoria qualificada', 2.5, 15)
  returning id into v_item_b1b2_qualif;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia) values
    (v_item_b1b2_qualif, 'Ferreira ACM, Espasandin I, Barbosa AP. An innovative technique for reducing abdominal fat using Mesolipo technique. Plastic and Reconstructive Surgery Global Open. 2025 — aceito, aguardando publicação', 2.5, true, null, '2025-01-01'),
    (v_item_b1b2_qualif, 'Malta DC, Ferreira ACM et al. Fatores de Risco e proteção para Acidentes de Transporte Terrestre nos Adolescentes Brasileiros, PeNSE 2015/2019. REME. 2022.', 2.5, true, 'https://periodicos.ufmg.br/index.php/reme/article/view/38675', '2022-12-02'),
    (v_item_b1b2_qualif, 'Ferreira ACM et al. A produção científica baseada na Pesquisa Nacional de Saúde do Escolar (PeNSE). REME. 2022.', 2.5, true, 'https://periodicos.ufmg.br/index.php/reme/article/view/38671', '2022-12-28'),
    (v_item_b1b2_qualif, 'Ferreira ACM et al. Fatores de risco e proteção para as doenças crônicas não transmissíveis entre escolares brasileiros: PeNSE 2015 e 2019. REME. 2022.', 2.5, true, 'https://periodicos.ufmg.br/index.php/reme/article/view/38620', '2022-07-07');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Artigo completo Qualis A1/A2 (2017-2020) — sem autoria qualificada', 2, 12)
  returning id into v_item_a1a2_naoqualif;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Artigo completo Qualis A3/A4 (2017-2020) — sem autoria qualificada', 1.5, 9)
  returning id into v_item_a3a4_naoqualif;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia)
  values (
    v_item_a3a4_naoqualif,
    'Silva AG, Gomes CS, Ferreira ACM, Malta DC. Procura e utilização dos serviços de saúde por adolescentes brasileiros, PeNSE 2019. Rev Bras Epidemiologia. 2023.',
    1.5, true, 'https://www.scielo.br/j/rbepid/a/k9cYvLSkSVvrmMFBT5pD7pH/abstract/?lang=pt', '2023-04-21'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Artigo completo Qualis B1/B2 (2017-2020) — sem autoria qualificada', 1.25, 7.5)
  returning id into v_item_b1b2_naoqualif;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia) values
    (v_item_b1b2_naoqualif, 'Malta DC, Andrade FMD, Ferreira ACM et al. Prevalência de exposição às situações de violência em estudantes adolescentes brasileiros. REME. 2022.', 1.25, true, 'https://periodicos.ufmg.br/index.php/reme/article/view/38624', '2022-12-02'),
    (v_item_b1b2_naoqualif, 'Malta DC, Junio E, Ferreira ACM et al. Consumo e exposição a bebidas alcoólicas entre adolescentes brasileiros. REME. 2022.', 1.25, true, 'https://periodicos.ufmg.br/index.php/reme/article/view/38495', '2022-12-21');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Cartas para editor, resenhas e editorial — Qualis A (2017-2020)', 0.5, 3)
  returning id into v_item_cartas_editor;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Autor de livro completo na área de Saúde Coletiva (conselho editorial e ISBN)', 4, 8)
  returning id into v_item_livro_completo;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Organização ou Editoria de livro (conselho editorial e ISBN)', 2, 4)
  returning id into v_item_organizacao_livro;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia)
  values (
    v_item_organizacao_livro,
    'Organizador do livro "Promoção da Saúde e Vigilância de Doenças e Agravos Não Transmissíveis Integradas". OPAS. 2024.',
    2, true, 'https://iris.paho.org/handle/10665.2/61495', '2024-01-01'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Capítulo de livro (conselho editorial e ISBN)', 1.5, 4.5)
  returning id into v_item_capitulo_livro;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia) values
    (v_item_capitulo_livro, 'Capítulo 2: Vigilância das doenças e agravos não transmissíveis integrada no Brasil. Livro OPAS — Promoção da Saúde e Vigilância de DANT Integradas. 2024.', 1.5, true, 'https://iris.paho.org/handle/10665.2/61495', '2024-01-01'),
    (v_item_capitulo_livro, 'Capítulo 6: Distribuição das doenças e agravos não transmissíveis em adolescentes brasileiros. Livro OPAS — Promoção da Saúde e Vigilância de DANT Integradas. 2024.', 1.5, true, 'https://iris.paho.org/handle/10665.2/61495', '2024-01-01'),
    (v_item_capitulo_livro, 'Capítulo 8: Mudanças no estilo de vida e estado de ânimo de adultos e adolescentes brasileiros durante a pandemia de COVID-19. Livro OPAS — Promoção da Saúde e Vigilância de DANT Integradas. 2024.', 1.5, true, 'https://iris.paho.org/handle/10665.2/61495', '2024-01-01'),
    (v_item_capitulo_livro, 'Capítulo 7: Mesolipo® — a evolução da mesoterapia tradicional no tratamento da gordura localizada. Livro MM Eventos | Full Body Vol. 2. ISBN 978-85-480-0494-0. 2025.', 1.5, true, null, '2025-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Conferencista, palestrante ou debatedor em evento científico internacional', 2, 6)
  returning id into v_item_conf_internacional;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Conferencista, palestrante ou debatedor em evento científico nacional', 1.5, 4.5)
  returning id into v_item_conf_nacional;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_conf_nacional, 'Palestrante convidado — VII edição da Expo-Hospital Brasil. Belo Horizonte. 2025.', 1.5, true, '2025-01-01'),
    (v_item_conf_nacional, 'Palestrante convidado — Feira de Empreendedorismo em Enfermagem "InovaEnf". Escola de Enfermagem/UFMG. 2024.', 1.5, true, '2024-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Apresentação oral em evento científico internacional', 1, 5)
  returning id into v_item_apres_oral_internacional;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Apresentação oral em evento científico nacional', 0.75, 3.75)
  returning id into v_item_apres_oral_nacional;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_apres_oral_nacional, 'Análise da concordância entre modelo de IA e especialista na detecção de alterações retinianas. 43º Congresso do Hospital São Geraldo. Belo Horizonte. 2024.', 0.75, true, '2024-01-01'),
    (v_item_apres_oral_nacional, 'Teleconsultorias na Atenção Primária a Saúde (APS): uma abordagem para minimizar encaminhamentos. 5º Congresso Brasileiro de Política, Planejamento e Gestão em Saúde. Fortaleza. 2024.', 0.75, true, '2024-01-01'),
    (v_item_apres_oral_nacional, 'O uso de inteligência artificial na vigilância em saúde no Brasil: uma revisão sistemática. V Seminário da Pós-Graduação em Gestão de Serviços de Saúde/UFMG. 2024.', 0.75, true, '2024-01-01'),
    (v_item_apres_oral_nacional, 'Associação do trabalho infantil e comportamentos relacionados às doenças crônicas não transmissíveis. 13º Congresso Brasileiro de Saúde Coletiva. 2022.', 0.75, true, '2022-01-01'),
    (v_item_apres_oral_nacional, 'Mudanças nos comportamentos de risco e proteção à saúde dos adolescentes brasileiros. 13º Congresso Brasileiro de Saúde Coletiva. 2022.', 0.75, true, '2022-01-01'),
    (v_item_apres_oral_nacional, 'Desigualdades na procura e utilização dos serviços de saúde por adolescentes brasileiros. 13º Congresso Brasileiro de Saúde Coletiva. 2022.', 0.75, true, '2022-01-01'),
    (v_item_apres_oral_nacional, 'Mortalidade por doenças crônicas não transmissíveis nos países do Mercosul: desafios no cumprimento das metas da agenda 2030. 13º Congresso Brasileiro de Saúde Coletiva. 2022.', 0.75, true, '2022-01-01'),
    (v_item_apres_oral_nacional, 'Prevalência de autorrelato de agressão física em estudantes adolescentes: resultados da PeNSE 2019. 13º Congresso Brasileiro de Saúde Coletiva. 2022.', 0.75, true, '2022-01-01'),
    (v_item_apres_oral_nacional, 'Associação entre a discriminação percebida em serviços de saúde e doenças crônicas não-transmissíveis autorreferidas em adultos brasileiros. XXIX Semana de Iniciação Científica da PRPq/UFMG. 2020.', 0.75, true, '2020-01-01'),
    (v_item_apres_oral_nacional, '1ª gincanagem: uma mobilização inédita na Escola de Enfermagem da UFMG. XV Congresso Brasileiro dos Estudantes de Enfermagem. Feira de Santana. 2019.', 0.75, true, '2019-01-01'),
    (v_item_apres_oral_nacional, 'Análise sócio-demográfica e do relato de dor, ansiedade e depressão em pacientes em tratamento de acupuntura acompanhados pelo programa de práticas integrativas e complementares da Escola de Enfermagem da UFMG. XXVIII Semana de IC/UFMG. 2019.', 0.75, true, '2019-01-01'),
    (v_item_apres_oral_nacional, 'Fragilidade no idoso: comparação de dois instrumentos de rastreio. XXVII Semana de IC/UFMG. 2018.', 0.75, true, '2018-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Apresentação de pôster e/ou resumo — evento científico internacional', 0.5, 3)
  returning id into v_item_poster_internacional;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Apresentação de pôster e/ou resumo — evento científico nacional', 0.3, 3)
  returning id into v_item_poster_nacional;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_poster_nacional, 'Análise de cluster de usuários da atenção primária com DCNT submetidos à retinografia no contexto da saúde digital. 14º Congresso Brasileiro de Saúde Coletiva. Brasília. 2025.', 0.3, true, '2025-01-01'),
    (v_item_poster_nacional, 'IA nas retinografias: análise da concordância com a avaliação realizada por oftalmologista. 12º Congresso Brasileiro de Epidemiologia. Rio de Janeiro. 2024.', 0.3, true, '2024-01-01'),
    (v_item_poster_nacional, 'Implantação do projeto de Teleoftalmologia em Minas Gerais: resultados preliminares. XI Congresso Brasileiro de Telemedicina e Telessaúde. Goiânia. 2024.', 0.3, true, '2024-01-01'),
    (v_item_poster_nacional, 'Análise da validade da classificação de exames de retinografia por um modelo de IA na Atenção Primária à Saúde. CI-IA Saúde. Belo Horizonte. 2024.', 0.3, true, '2024-01-01'),
    (v_item_poster_nacional, 'Convolutional Neural Networks in the Diagnosis of ADHD in Children Using EEG Signals: A Systematic Review. CI-IA Saúde. Belo Horizonte. 2024.', 0.3, true, '2024-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Resumo expandido publicado em anais de eventos científicos', 0.5, 3)
  returning id into v_item_resumo_expandido;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, link, data_referencia) values
    (v_item_resumo_expandido, 'Acesso aos exames de retinografia no SUS em municípios de Minas Gerais. Congresso Brasileiro de Política, Planejamento e Gestão em Saúde. Fortaleza. 2024.', 0.5, true, 'https://proceedings.science/ppgs-2024', '2024-01-01'),
    (v_item_resumo_expandido, 'Teleconsultorias na Atenção Primária à Saúde (APS): uma abordagem para minimizar encaminhamentos. Congresso Brasileiro de Política, Planejamento e Gestão em Saúde. Fortaleza. 2024.', 0.5, true, 'https://proceedings.science/ppgs-2024', '2024-01-01'),
    (v_item_resumo_expandido, 'Uso de retinógrafos portáteis em municípios de Minas Gerais: a inteligência artificial auxiliando na otimização da rede oftalmológica. XX Congresso Brasileiro de Informática em Saúde. Belo Horizonte. 2024.', 0.5, true, null, '2024-01-01'),
    (v_item_resumo_expandido, 'O uso das teleconsultorias na APS: uma estratégia para evitação de encaminhamentos. XX Congresso Brasileiro de Informática em Saúde. Belo Horizonte. 2024.', 0.5, true, null, '2024-01-01'),
    (v_item_resumo_expandido, 'O uso de inteligência artificial na vigilância em saúde no Brasil: uma revisão sistemática. V Seminário da Pós-Graduação em Gestão de Serviços de Saúde/UFMG. Belo Horizonte. 2024.', 0.5, true, null, '2024-01-01'),
    (v_item_resumo_expandido, '1ª Gincanagem: uma mobilização inédita na Escola de Enfermagem da UFMG. XV Congresso Brasileiro dos Estudantes de Enfermagem. Feira de Santana. 2019.', 0.5, true, null, '2019-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Organização de evento acadêmico na área de saúde coletiva', 1, 5)
  returning id into v_item_organizacao_evento;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_organizacao_evento, 'Oficina "Propostas Metodológicas de Redistribuição de Óbitos por Causas Garbage". Escola de Enfermagem/UFMG. 2022.', 1, true, '2022-01-01'),
    (v_item_organizacao_evento, 'Webnário "Populações Vulnerabilizadas e Covid-19 no Brasil: impactos e respostas à pandemia". 2022.', 1, true, '2022-01-01'),
    (v_item_organizacao_evento, 'Webnário "Fake News e Vacinas contra Covid-19: desafios na comunicação com a sociedade". 2022.', 1, true, '2022-01-01'),
    (v_item_organizacao_evento, 'Palestra "Importância das Organizações Civis da Enfermagem". LISAE/UFMG, Escola de Enfermagem. 2019.', 1, true, '2019-01-01'),
    (v_item_organizacao_evento, 'Seminário de integração do ambulatório Bias Fortes: qualidade e segurança do paciente. 2017.', 1, true, '2017-01-01');

  -- =======================================================================
  -- QUESITO 4 — Administração acadêmica / experiência profissional não docente (teto 20)
  -- =======================================================================
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 4, 'Administração acadêmica / experiência profissional não docente', 20)
  returning id into v_q4;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Coordenador de curso de graduação/pós-graduação ou chefia de departamento', 8, 8)
  returning id into v_item_coordenador_curso;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Participação em órgãos colegiados em instituições de ensino superior ou pesquisa', 2, 6)
  returning id into v_item_orgaos_colegiados;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_orgaos_colegiados, 'Membro do Núcleo Docente Estruturante (NDE) do Curso de Enfermagem — Centro de Treinamento Avançado (CTA). 2025/02–atual.', 2, true, '2025-01-01'),
    (v_item_orgaos_colegiados, 'Membro do Colegiado do Curso de Enfermagem — CTA. 2025/02–atual.', 2, true, '2025-01-01'),
    (v_item_orgaos_colegiados, 'Membro titular do Comitê Local para medidas relacionadas ao Covid-19 — Escola de Enfermagem/UFMG. Mar-out/2020.', 2, true, '2020-01-01'),
    (v_item_orgaos_colegiados, 'Membro titular da Comissão de Apoio Estudantil do Curso de Graduação em Enfermagem/UFMG. Jul/2018–dez/2019.', 2, true, '2018-01-01'),
    (v_item_orgaos_colegiados, 'Representante Discente na Congregação dos cursos da Escola de Enfermagem/UFMG. 2019.', 2, true, '2019-01-01'),
    (v_item_orgaos_colegiados, 'Representante Discente no Departamento de Enfermagem Materno-Infantil — Escola de Enfermagem/UFMG. 2019.', 2, true, '2019-01-01'),
    (v_item_orgaos_colegiados, 'Representante Discente no Departamento de Enfermagem Básica — Escola de Enfermagem/UFMG. 2019.', 2, true, '2019-01-01'),
    (v_item_orgaos_colegiados, 'Presidente do Diretório Acadêmico Marina de Andrade Resende — Escola de Enfermagem/UFMG (gestão Sim Podemos). 2019–2021.', 2, true, '2019-01-01'),
    (v_item_orgaos_colegiados, 'Vice-Presidente do Diretório Acadêmico Marina de Andrade Resende — Escola de Enfermagem/UFMG (gestão Voz Ativa). 2018–2019.', 2, true, '2018-01-01'),
    (v_item_orgaos_colegiados, 'Membro Fundador da Liga de Sistematização da Assistência de Enfermagem — Escola de Enfermagem/UFMG. 2018.', 2, true, '2018-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, unidade_periodo, pontos_por_unidade)
  values (v_q4, 'Pós-doutorado concluído (por ano)', 3, 6, 'periodo', 'ano', 3)
  returning id into v_item_posdoc;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, unidade_periodo, pontos_por_unidade)
  values (
    v_q4,
    'Atividade profissional em saúde (por semestre, carga horária mínima de 10h semanais — um vínculo por semestre)',
    1.5, 6, 'periodo', 'semestre', 1.5
  )
  returning id into v_item_ativ_prof_saude;

  -- Nota: o edital limita a "um vínculo por semestre" quando há sobreposição
  -- entre vínculos — aqui cada vínculo é lançado como fonte separada sem
  -- deduplicar semestres sobrepostos entre si; como a soma bruta já
  -- ultrapassa o teto do item (6 pts) de qualquer forma, o resultado final
  -- é o mesmo. Valores abaixo = nº de semestres tocados * 1.5, como o
  -- trigger removido calculava (vínculo em andamento calculado até hoje,
  -- 2026-08-23 — ajustar manualmente conforme o tempo passa).
  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_inicio, data_fim) values
    (v_item_ativ_prof_saude, 'Referência Técnica — Coordenação do Serviço de Atenção Domiciliar, Gerência de Urgência e Emergência — Prefeitura de Belo Horizonte. 18/08/2025–atual.', 4.5, true, '2025-08-18', null),
    (v_item_ativ_prof_saude, 'Enfermeiro Especialista em Estética Avançada — Instituto Antony Barbosa. 20h/semana. 01/01/2024–15/08/2025.', 6, true, '2024-01-01', '2025-08-15'),
    (v_item_ativ_prof_saude, 'Enfermeiro Especialista em Políticas e Gestão em Saúde — Secretaria Estadual de Saúde de Minas Gerais. 40h/semana. 20/06/2022–23/03/2023.', 4.5, true, '2022-06-20', '2023-03-23'),
    (v_item_ativ_prof_saude, 'Enfermeiro CTI Covid — Fundação Hospitalar São Francisco de Assis. 06/04/2021–17/05/2021.', 1.5, true, '2021-04-06', '2021-05-17'),
    (v_item_ativ_prof_saude, 'Enfermeiro — EPC Comunicação e Educação em Saúde S/A. 15/03/2021–14/05/2021.', 1.5, true, '2021-03-15', '2021-05-14');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, modo_calculo, unidade_periodo, pontos_por_unidade)
  values (
    v_q4,
    'Atividade remunerada de pesquisa científica (por semestre, carga horária mínima de 10h semanais — um vínculo por semestre)',
    0.5, 3, 'periodo', 'semestre', 0.5
  )
  returning id into v_item_ativ_remunerada_pesquisa;

  -- valor = nº de semestres tocados * 0.5 (vínculo em andamento até 2026-08-23)
  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_inicio, data_fim)
  values (
    v_item_ativ_remunerada_pesquisa,
    'Coordenador do Grupo de Pesquisa Instituto Antony Barbosa (GPIAB). 01/01/2024–atual.',
    3, true, '2024-01-01', null
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Coordenador/supervisor de campo de pesquisa científica', 1, 4)
  returning id into v_item_coord_campo_pesquisa;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Outras formas de participação em projetos de pesquisa com financiamento', 0.5, 3)
  returning id into v_item_outras_part_c_financiamento;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia)
  values (
    v_item_outras_part_c_financiamento,
    'Participante do projeto "Utilização de Modelos de Aprendizado de Máquina para a Identificação de Pacientes de Alto Risco na APS" — coord. Alaneir de Fátima Santos. 2025–atual.',
    0.5, true, '2025-01-01'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Coordenação de projeto de pesquisa com financiamento de agências de fomento', 2.5, 7.5)
  returning id into v_item_coord_projeto_c_financiamento;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Coordenação de projeto de pesquisa sem financiamento de agências de fomento', 1.5, 4.5)
  returning id into v_item_coord_projeto_s_financiamento;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_coord_projeto_s_financiamento, 'Coordenador do projeto "Eficácia, Satisfação e Segurança do Protocolo Alta Performance Abdominal" — Instituto Antony Barbosa. CAAE 82947324.1.0000.5134.', 1.5, true, '2024-01-01'),
    (v_item_coord_projeto_s_financiamento, 'Coordenador do projeto "Eficácia, Segurança e Satisfação no uso de CaHA para tratamento de flacidez abdominal" — ensaio clínico randomizado duplo-cego. CAAE 83690524.1.0000.5097.', 1.5, true, '2024-01-01'),
    (v_item_coord_projeto_s_financiamento, 'Coordenador do projeto "Eficácia, Satisfação e Segurança do Protocolo Mesolipo® no Tratamento da Gordura Localizada" — estudo randomizado. CAAE 83014024.2.1001.5128.', 1.5, true, '2024-01-01'),
    (v_item_coord_projeto_s_financiamento, 'Coordenador do projeto "Eficácia, satisfação e segurança do tratamento de celulite utilizando bioestimuladores de colágeno" — estudo randomizado duplo-cego. CAAE 87271425.9.0000.5097.', 1.5, true, '2024-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Estágio de pesquisa em saúde coletiva no exterior (mínimo 4 meses)', 2, 4)
  returning id into v_item_estagio_exterior;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Membro titular de banca de doutorado (qualificação ou defesa)', 2, 6)
  returning id into v_item_banca_doutorado;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Membro titular de banca de mestrado (qualificação ou defesa)', 1, 3)
  returning id into v_item_banca_mestrado;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Membro titular de banca de concurso público docente ou pesquisador', 2, 6)
  returning id into v_item_banca_concurso_docente;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Membro titular de banca de processos seletivos docentes ou de alunos de pós-graduação stricto sensu', 1, 3)
  returning id into v_item_banca_selecao_docente;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Coordenação de projeto de extensão ou ensino', 2, 6)
  returning id into v_item_coord_extensao;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia)
  values (
    v_item_coord_extensao,
    'Co-coordenador do projeto de extensão "Liga Acadêmica de Sistematização da Assistência de Enfermagem/UFMG". 22/04/2018–06/10/2019, 12h/semana.',
    2, true, '2018-04-22'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Participação em projetos de extensão ou ensino', 0.5, 3)
  returning id into v_item_part_extensao;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_part_extensao, 'Voluntário do projeto "Ações Integradoras no Âmbito da Atenção Primária à Saúde" — Escola de Enfermagem/UFMG. 06/02/2020–10/07/2020.', 0.5, true, '2020-02-06'),
    (v_item_part_extensao, 'Voluntário do projeto "Entendendo o Câncer" — Escola de Enfermagem/UFMG. 30/05/2019–30/08/2019.', 0.5, true, '2019-05-30'),
    (v_item_part_extensao, 'Bolsista do projeto "Formação Complementar em Enfermagem" — Div. de Enfermagem, Hospital das Clínicas/UFMG. 07/03/2018–03/06/2019.', 0.5, true, '2018-03-07'),
    (v_item_part_extensao, 'Voluntário do projeto "Elaboração coletiva do planejamento estratégico das atividades de enfermagem — Ambulatório Bias Fortes". 22/05/2017–31/07/2018.', 0.5, true, '2017-05-22');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Membro de corpo editorial de periódico com classificação Qualis Capes (2017-2020) A1-B2', 1.5, 4.5)
  returning id into v_item_corpo_editorial;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Revisão de manuscrito para periódico classificado como Qualis A (2017-2020) A1-A4', 0.25, 1.5)
  returning id into v_item_revisao_manuscrito;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia)
  values (
    v_item_revisao_manuscrito,
    'Revisão de manuscrito — ID CSC-2025-1796. Ciência & Saúde Coletiva. 2025.',
    0.25, true, '2025-01-01'
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Revisor adhoc de agências de fomento', 0.5, 2)
  returning id into v_item_revisor_adhoc;

  -- =======================================================================
  -- QUESITO 5 — Distinções (teto 2)
  -- =======================================================================
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 5, 'Distinções', 2)
  returning id into v_q5;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q5, 'Trabalho premiado em congresso nacional/internacional', 0.25, 0.5)
  returning id into v_item_trabalho_premiado;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q5, 'Distinções (professor homenageado, tese premiada, destaque por indicação dos Programas de Pós-Graduação ou da IES)', 0.75, 0.75)
  returning id into v_item_distincoes;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado, data_referencia) values
    (v_item_distincoes, 'Paraninfo — Turma 103N, Curso Técnico de Enfermagem, Proz Educação. 2023.', 0.75, true, '2023-01-01'),
    (v_item_distincoes, 'Professor homenageado — Turma 99N, Curso Técnico de Enfermagem, Proz Educação. 2022.', 0.75, true, '2022-01-01');

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q5, 'Tese ou dissertação premiada em concurso nacional ou internacional', 1, 1)
  returning id into v_item_tese_premiada;

  -- =======================================================================
  -- Áreas temáticas
  -- =======================================================================
  insert into public.areas_tematicas (edital_id, nome)
  values (v_edital_id, 'Política, Planejamento e Gestão em Saúde')
  returning id into v_area1;

  insert into public.areas_tematicas (edital_id, nome)
  values (v_edital_id, 'Saúde e Trabalho')
  returning id into v_area2;

  insert into public.areas_tematicas (edital_id, nome)
  values (v_edital_id, 'Ciências Sociais e Humanas em Saúde')
  returning id into v_area3;

  insert into public.area_elementos (area_id, descricao, peso) values
    (v_area1, 'Especialização em Saúde Coletiva, ênfase Gestão em Saúde — UniAmérica (2021)', 3),
    (v_area1, 'Docência em ENA019 TA — Gestão do Sistema de Saúde (Escola de Enfermagem/UFMG)', 4),
    (v_area1, 'Enfermeiro Especialista em Políticas e Gestão em Saúde — SES-MG (2022-2023)', 4),
    (v_area1, 'Referência Técnica — Coordenação do Serviço de Atenção Domiciliar, SMSA-BH (2025-atual)', 5);

  insert into public.area_elementos (area_id, descricao, peso) values
    (v_area2, 'Especialização em Saúde Coletiva, ênfase Saúde do Trabalhador — UniAmérica (2021)', 4);

  -- v_area3 (Ciências Sociais e Humanas em Saúde): nenhum elemento forte
  -- ainda — fica como está, para ser preenchida pela UI.

  -- ---------------------------------------------------------------------
  -- Ações iniciais do plano de ação (kanban)
  -- ---------------------------------------------------------------------
  insert into public.acoes (
    user_id, titulo, quesito_id, area_id, afeta_pontuacao, impacto_pontos,
    status, prioridade, prazo, ordem
  ) values
    (v_user_id, 'Reunir documentação comprobatória dos 100 anexos do currículo (cartas de aceite, contratos, declarações)',
      null, null, false, null, 'em_andamento', 'alta', current_date + interval '15 days', 0),
    (v_user_id, 'Confirmar situação de aceite do artigo B1/B2 "Mesolipo" (Plastic and Reconstructive Surgery Global Open)',
      v_q3, null, true, 2.5, 'em_andamento', 'media', null, 1),
    (v_user_id, 'Acompanhar decisão do artigo A1/A2 submetido (Telemedicine Journal and e-Health) — pode valer até 4 pts se aceito',
      v_q3, null, true, 4, 'em_andamento', 'alta', null, 2),
    (v_user_id, 'Buscar oportunidade de docência em disciplina de pós-graduação stricto sensu (item ainda zerado, até 18 pts)',
      v_q2, null, true, 18, 'nao_iniciado', 'alta', null, 3),
    (v_user_id, 'Avaliar classificação Qualis dos 2 artigos ainda não classificados (Obesities/MDPI e Chinese J. Plastic Surgery)',
      v_q3, null, true, null, 'nao_iniciado', 'media', null, 4),
    (v_user_id, 'Buscar orientação de mestrado/doutorado (itens zerados, até 18 pts somados) — só possível após titulação de doutor',
      v_q2, null, true, 18, 'nao_iniciado', 'baixa', null, 5),
    (v_user_id, 'Registrar carta de aceite e comprovantes do doutorado concluído para o quesito Títulos',
      v_q1, null, true, null, 'em_andamento', 'alta', current_date + interval '10 days', 0);
end;
$$;
