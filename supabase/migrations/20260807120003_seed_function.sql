-- ============================================================================
-- Seed dos dados iniciais (Edital 3.244/2025 — DMPS/UFMG).
--
-- Não é rodado automaticamente pela migration: define uma função RPC,
-- `seed_dados_iniciais()`, chamada UMA VEZ pelo próprio app (tela de
-- primeiro acesso, quando o usuário ainda não tem nenhum edital) via
-- `supabase.rpc('seed_dados_iniciais')`. Isso evita hardcodar um user_id
-- na migration — a função usa auth.uid() da sessão autenticada que a
-- chama, respeitando o mesmo RLS de todo o resto do sistema.
--
-- Idempotente: não faz nada se o usuário já tiver um edital com esse nome.
--
-- Os valores máximos dos itens do Quesito 3 (Produção científica) e do
-- Quesito 4 (Administração acadêmica) são estimativas de trabalho —
-- ajustar depois conforme o texto oficial do edital. O item "agregado
-- (pré-sistema)" de cada um desses quesitos concentra o valor já
-- levantado manualmente pelo usuário antes deste sistema existir; a ideia
-- é quebrá-lo depois em fontes por categoria.
-- ============================================================================
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
  v_item_mestrado_outra uuid;
  v_item_especializacao uuid;
  v_item_docencia_grad_sc uuid;
  v_item_docencia_grad_outras uuid;
  v_item_orientacao_grad uuid;
  v_item_producao_agregada uuid;
  v_item_admin_agregada uuid;
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
  insert into public.editais (user_id, nome, ativo, observacoes)
  values (
    v_user_id,
    'Edital 3.244/2025',
    true,
    'Dados iniciais migrados de levantamento manual. Os máximos dos itens ' ||
    'de Produção científica e Administração acadêmica são estimativas — ' ||
    'conferir e ajustar contra o texto oficial do edital.'
  )
  returning id into v_edital_id;

  -- ---------------------------------------------------------------------
  -- Quesito 1 — Títulos acadêmicos (teto 10)
  -- ---------------------------------------------------------------------
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 1, 'Títulos acadêmicos', 10)
  returning id into v_q1;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Doutorado em Saúde Coletiva concluído', 8, 8);

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Mestrado em Saúde Coletiva concluído', 3, 3);

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Mestrado em outra área concluído', 1.5, 1.5)
  returning id into v_item_mestrado_outra;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado)
  values (
    v_item_mestrado_outra,
    'Mestrado em Enfermagem com ênfase em Saúde Coletiva/Epidemiologia',
    1.5,
    true
  );

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q1, 'Especialização lato sensu em Saúde Coletiva concluída', 1, 1)
  returning id into v_item_especializacao;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado)
  values (
    v_item_especializacao,
    'Especialização em Saúde do Trabalhador (2021)',
    1,
    true
  );

  -- ---------------------------------------------------------------------
  -- Quesito 2 — Experiência docente (teto 30)
  -- ---------------------------------------------------------------------
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 2, 'Experiência docente', 30)
  returning id into v_q2;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q2, 'Docência graduação — Saúde Coletiva', 1, 18)
  returning id into v_item_docencia_grad_sc;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado)
  values (v_item_docencia_grad_sc, 'IAPS, PSP, CSAS (DMPS/UFMG)', 13.5, true);

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q2, 'Docência graduação — outras disciplinas', 1, 5)
  returning id into v_item_docencia_grad_outras;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado)
  values (v_item_docencia_grad_outras, 'IESC (Afya)', 2.5, true);

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima) values
    (v_q2, 'Docência pós-graduação stricto sensu — Saúde Coletiva', 1, 18),
    (v_q2, 'Docência pós-graduação stricto sensu — outras', 1, 5),
    (v_q2, 'Outras experiências docentes', 1, 3),
    (v_q2, 'Orientação de doutorado concluído', 1, 12),
    (v_q2, 'Coorientação de doutorado concluído', 1, 6),
    (v_q2, 'Orientação de doutorado em andamento', 1, 6),
    (v_q2, 'Coorientação de doutorado em andamento', 1, 4),
    (v_q2, 'Orientação de mestrado concluído', 1, 6),
    (v_q2, 'Coorientação de mestrado concluído', 1, 3),
    (v_q2, 'Orientação de mestrado em andamento', 1, 3),
    (v_q2, 'Coorientação de mestrado em andamento', 1, 2);

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q2, 'Orientação de graduação concluído (IC/TCC)', 1, 1.5)
  returning id into v_item_orientacao_grad;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado)
  values (v_item_orientacao_grad, 'Orientação de IC/TCC', 1.5, true);

  -- ---------------------------------------------------------------------
  -- Quesito 3 — Produção científica, técnica, artística e cultural (teto 38)
  -- ---------------------------------------------------------------------
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 3, 'Produção científica, técnica, artística e cultural', 38)
  returning id into v_q3;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima) values
    (v_q3, 'Artigo Qualis A1 (autoria qualificada)', 1, 10),
    (v_q3, 'Artigo Qualis A1 (sem autoria qualificada)', 1, 6),
    (v_q3, 'Artigo Qualis A2 (autoria qualificada)', 1, 8),
    (v_q3, 'Artigo Qualis A2 (sem autoria qualificada)', 1, 5),
    (v_q3, 'Artigo Qualis A3 (autoria qualificada)', 1, 6),
    (v_q3, 'Artigo Qualis A3 (sem autoria qualificada)', 1, 4),
    (v_q3, 'Artigo Qualis A4 (autoria qualificada)', 1, 5),
    (v_q3, 'Artigo Qualis A4 (sem autoria qualificada)', 1, 3),
    (v_q3, 'Artigo Qualis B1 (autoria qualificada)', 1, 4),
    (v_q3, 'Artigo Qualis B1 (sem autoria qualificada)', 1, 2),
    (v_q3, 'Artigo Qualis B2 (autoria qualificada)', 1, 3),
    (v_q3, 'Artigo Qualis B2 (sem autoria qualificada)', 1, 1.5),
    (v_q3, 'Livro publicado', 1, 6),
    (v_q3, 'Capítulo de livro', 1, 4),
    (v_q3, 'Apresentação de trabalho em evento', 1, 3),
    (v_q3, 'Resumo publicado em anais', 1, 1.5),
    (v_q3, 'Organização de evento científico', 1, 2);

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q3, 'Produção agregada (pré-sistema — a detalhar por categoria)', 1, 38)
  returning id into v_item_producao_agregada;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado)
  values (
    v_item_producao_agregada,
    'Produção científica levantada manualmente antes deste sistema — detalhar por item/Qualis',
    38,
    true
  );

  -- ---------------------------------------------------------------------
  -- Quesito 4 — Administração acadêmica / experiência profissional (teto 20)
  -- ---------------------------------------------------------------------
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 4, 'Administração acadêmica / experiência profissional não docente', 20)
  returning id into v_q4;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima) values
    (v_q4, 'Participação em órgãos colegiados', 1, 4),
    (v_q4, 'Atividade profissional em saúde (não docente)', 1, 6),
    (v_q4, 'Atividade remunerada de pesquisa', 1, 4),
    (v_q4, 'Coordenação de projeto com financiamento', 1, 4),
    (v_q4, 'Coordenação de projeto sem financiamento', 1, 2),
    (v_q4, 'Participação em bancas examinadoras', 1, 3),
    (v_q4, 'Atividade de extensão', 1, 3),
    (v_q4, 'Participação em corpo editorial de periódico', 1, 2),
    (v_q4, 'Atividade de revisor ad hoc', 1, 1.5);

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
  values (v_q4, 'Administração agregada (pré-sistema — a detalhar por categoria)', 1, 20)
  returning id into v_item_admin_agregada;

  insert into public.fontes_pontuacao (item_id, descricao, valor, confirmado)
  values (
    v_item_admin_agregada,
    'Administração acadêmica / experiência profissional levantada manualmente antes deste sistema — detalhar por categoria',
    20,
    true
  );

  -- ---------------------------------------------------------------------
  -- Quesito 5 — Distinções (teto 2)
  -- ---------------------------------------------------------------------
  insert into public.quesitos (edital_id, ordem, nome, teto)
  values (v_edital_id, 5, 'Distinções', 2)
  returning id into v_q5;

  insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima) values
    (v_q5, 'Prêmio acadêmico ou científico', 1, 1),
    (v_q5, 'Menção honrosa / distinção de mérito', 1, 1);

  -- ---------------------------------------------------------------------
  -- Áreas temáticas
  -- ---------------------------------------------------------------------
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
    (v_area1, 'Especialização em Gestão em Saúde', 3),
    (v_area1, 'Docência em Gestão do Sistema de Saúde', 4),
    (v_area1, 'Experiência como Referência Técnica na SMSA-BH', 5);

  insert into public.area_elementos (area_id, descricao, peso) values
    (v_area2, 'Especialização em Saúde do Trabalhador', 4);

  -- v_area3 (Ciências Sociais e Humanas em Saúde): nenhum elemento forte
  -- ainda — fica como está, para ser preenchida pela UI.

  -- ---------------------------------------------------------------------
  -- Ações iniciais do plano de ação (kanban)
  -- ---------------------------------------------------------------------
  insert into public.acoes (
    user_id, titulo, quesito_id, area_id, afeta_pontuacao, impacto_pontos,
    status, prioridade, prazo, ordem
  ) values
    (v_user_id, 'Registrar diploma de doutorado', v_q1, null, true, 8,
      'em_andamento', 'alta', current_date + interval '10 days', 0),
    (v_user_id, 'Solicitar declaração da PPGENF reconhecendo o mestrado como Saúde Coletiva',
      v_q1, null, true, 1.5, 'nao_iniciado', 'alta', null, 1),
    (v_user_id, 'Garantir registro de carga horária de IAPS/PSP/CSAS/IESC',
      v_q2, null, true, 4.5, 'em_andamento', 'media', null, 0),
    (v_user_id, 'Captar doutorando para coorientação',
      v_q2, v_area1, true, 1, 'nao_iniciado', 'alta', null, 1),
    (v_user_id, 'Captar mestrando para coorientação',
      v_q2, null, true, 0.5, 'nao_iniciado', 'media', null, 2),
    (v_user_id, 'Negociar módulo/aula em disciplina stricto sensu do PPGSP',
      v_q2, null, true, 4, 'nao_iniciado', 'alta', null, 3),
    (v_user_id, 'Assumir disciplina eletiva fora do núcleo de Saúde Coletiva',
      v_q2, null, true, 2, 'nao_iniciado', 'baixa', null, 4),
    (v_user_id, 'Projeto SAD-BH: SMSA → Câmara Departamental → CEP',
      null, null, false, null, 'em_andamento', 'alta', null, 1),
    (v_user_id, 'Submeter Artigo 2 da tese à Ciência & Saúde Coletiva',
      v_q3, null, false, null, 'em_andamento', 'media', null, 2);
end;
$$;

grant execute on function public.seed_dados_iniciais() to authenticated;
