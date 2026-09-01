-- ============================================================================
-- Descrição do critério de pontuação de cada item, copiada do texto oficial
-- do edital — para o usuário não precisar abrir o PDF toda vez que for
-- lançar uma fonte de pontuação. Puramente informativo (não entra em
-- nenhum cálculo).
--
-- Em vez de reescrever a função de seed inteira (arriscado, ela é grande),
-- o preenchimento é feito por um trigger BEFORE INSERT que reconhece os
-- nomes canônicos dos itens do Edital 3.244/2025. Isso cobre o seed atual,
-- seeds futuros e duplicação de edital automaticamente, sem precisar tocar
-- em nenhuma dessas funções. Um item com nome fora da lista (ex.: item
-- criado manualmente) simplesmente fica sem criterio_edital, sem erro.
-- ============================================================================
alter table public.itens_barema add column criterio_edital text;

create or replace function public.criterio_edital_por_nome(p_nome text)
returns text
language sql
immutable
as $$
  select criterio from (values
    ('Doutorado em Saúde Coletiva concluído',
      'Doutorado concluído na área de Saúde Coletiva. Pontuação única de 8 pontos — não é cumulativo.'),
    ('Mestrado em Saúde Coletiva concluído',
      'Mestrado concluído na área de Saúde Coletiva. Pontuação única de 3 pontos.'),
    ('Mestrado em outra área concluído',
      'Mestrado concluído em área diferente de Saúde Coletiva. Pontuação única de 1,5 ponto.'),
    ('Especialização lato sensu em Saúde Coletiva concluída',
      'Especialização lato sensu concluída na área de Saúde Coletiva. Pontuação única de 1 ponto — mais de uma especialização não soma além do teto do item.'),

    ('Docência graduação — disciplinas da área Saúde Coletiva',
      'Docência em cursos de graduação, disciplinas da área de Saúde Coletiva: 0,5 ponto a cada 15 horas-aula, nos últimos 10 anos.'),
    ('Docência graduação — outras disciplinas',
      'Docência em cursos de graduação, outras disciplinas: 0,25 ponto a cada 15 horas-aula, nos últimos 10 anos.'),
    ('Docência pós-graduação stricto sensu — Saúde Coletiva',
      'Docência em cursos de pós-graduação stricto sensu, disciplinas da área de Saúde Coletiva: 0,5 ponto a cada 15 horas-aula, nos últimos 10 anos.'),
    ('Docência pós-graduação stricto sensu — outras',
      'Docência em cursos de pós-graduação stricto sensu, outras disciplinas: 0,25 ponto a cada 15 horas-aula, nos últimos 10 anos.'),
    ('Outras experiências docentes (tutorias e docência em pós-graduação lato sensu)',
      'Tutorias e docência em pós-graduação lato sensu: 0,10 ponto a cada 15 horas-aula, nos últimos 5 anos.'),
    ('Orientação de doutorado concluído', 'Orientação de doutorado concluído: 3 pontos por orientação.'),
    ('Orientação de doutorado em andamento', 'Orientação de doutorado em andamento: 1,5 ponto por orientação.'),
    ('Coorientação de doutorado concluído', 'Coorientação de doutorado concluído: 1,5 ponto por coorientação.'),
    ('Coorientação de doutorado em andamento', 'Coorientação de doutorado em andamento: 1 ponto por coorientação.'),
    ('Orientação de mestrado concluído', 'Orientação de mestrado concluído: 1,5 ponto por orientação.'),
    ('Orientação de mestrado em andamento', 'Orientação de mestrado em andamento: 0,75 ponto por orientação.'),
    ('Coorientação de mestrado concluído', 'Coorientação de mestrado concluído: 0,75 ponto por coorientação.'),
    ('Coorientação de mestrado em andamento', 'Coorientação de mestrado em andamento: 0,5 ponto por coorientação.'),
    ('Orientação de graduação concluído (IC, monitoria, extensão, TCC)',
      'Orientação de graduação concluída (iniciação científica, monitoria, extensão, TCC): 0,25 ponto por aluno orientado.'),

    ('Artigo completo Qualis A1/A2 (2017-2020) — autoria qualificada',
      'Artigo completo publicado ou aceito (comprovado por Carta de Aceite), Qualis A1 ou A2 (2017-2020), com autoria qualificada (primeiro, segundo ou último autor): 4 pontos por artigo.'),
    ('Artigo completo Qualis A3/A4 (2017-2020) — autoria qualificada',
      'Artigo completo publicado ou aceito (Carta de Aceite), Qualis A3 ou A4 (2017-2020), com autoria qualificada: 3 pontos por artigo.'),
    ('Artigo completo Qualis B1/B2 (2017-2020) — autoria qualificada',
      'Artigo completo publicado ou aceito (Carta de Aceite), Qualis B1 ou B2 (2017-2020), com autoria qualificada: 2,5 pontos por artigo.'),
    ('Artigo completo Qualis A1/A2 (2017-2020) — sem autoria qualificada',
      'Artigo completo publicado ou aceito (Carta de Aceite), Qualis A1 ou A2 (2017-2020), sem autoria qualificada: 2 pontos por artigo.'),
    ('Artigo completo Qualis A3/A4 (2017-2020) — sem autoria qualificada',
      'Artigo completo publicado ou aceito (Carta de Aceite), Qualis A3 ou A4 (2017-2020), sem autoria qualificada: 1,5 ponto por artigo.'),
    ('Artigo completo Qualis B1/B2 (2017-2020) — sem autoria qualificada',
      'Artigo completo publicado ou aceito (Carta de Aceite), Qualis B1 ou B2 (2017-2020), sem autoria qualificada: 1,25 ponto por artigo.'),
    ('Cartas para editor, resenhas e editorial — Qualis A (2017-2020)',
      'Cartas para editor, resenhas e editorial em periódico Qualis A (2017-2020): 0,5 ponto por publicação.'),
    ('Autor de livro completo na área de Saúde Coletiva (conselho editorial e ISBN)',
      'Autoria de livro completo na área de Saúde Coletiva, com conselho editorial e ISBN: 4 pontos por livro.'),
    ('Organização ou Editoria de livro (conselho editorial e ISBN)',
      'Organização ou editoria de livro, com conselho editorial e ISBN: 2 pontos por livro.'),
    ('Capítulo de livro (conselho editorial e ISBN)',
      'Autoria de capítulo de livro, com conselho editorial e ISBN: 1,5 ponto por capítulo.'),
    ('Conferencista, palestrante ou debatedor em evento científico internacional',
      'Conferencista, palestrante ou debatedor em evento científico internacional: 2 pontos por participação.'),
    ('Conferencista, palestrante ou debatedor em evento científico nacional',
      'Conferencista, palestrante ou debatedor em evento científico nacional: 1,5 ponto por participação.'),
    ('Apresentação oral em evento científico internacional',
      'Apresentação oral em evento científico internacional: 1 ponto por apresentação.'),
    ('Apresentação oral em evento científico nacional',
      'Apresentação oral em evento científico nacional: 0,75 ponto por apresentação.'),
    ('Apresentação de pôster e/ou resumo — evento científico internacional',
      'Apresentação de pôster e/ou resumo de trabalho publicado em evento científico internacional: 0,5 ponto por apresentação.'),
    ('Apresentação de pôster e/ou resumo — evento científico nacional',
      'Apresentação de pôster e/ou resumo de trabalho publicado em evento científico nacional: 0,3 ponto por apresentação.'),
    ('Resumo expandido publicado em anais de eventos científicos',
      'Resumo expandido publicado em anais de eventos científicos nacionais ou internacionais: 0,5 ponto por resumo.'),
    ('Organização de evento acadêmico na área de saúde coletiva',
      'Organização de evento acadêmico na área de Saúde Coletiva (congresso, conferência, simpósio, workshop): 1 ponto por evento.'),

    ('Coordenador de curso de graduação/pós-graduação ou chefia de departamento',
      'Coordenador de curso de graduação ou pós-graduação, ou chefia de departamento, em instituições de ensino superior ou pesquisa: 8 pontos.'),
    ('Participação em órgãos colegiados em instituições de ensino superior ou pesquisa',
      'Participação em órgãos colegiados em instituições de ensino superior ou pesquisa: 2 pontos por órgão/mandato.'),
    ('Pós-doutorado concluído (por ano)', 'Pós-doutorado concluído: 3 pontos por ano.'),
    ('Atividade profissional em saúde (por semestre, carga horária mínima de 10h semanais — um vínculo por semestre)',
      'Atividade profissional em saúde comprovada por contrato, carteira de trabalho ou contracheque, nos últimos 10 anos: 1,5 ponto por semestre (carga horária mínima de 10h semanais) — pontua apenas um vínculo por semestre.'),
    ('Atividade remunerada de pesquisa científica (por semestre, carga horária mínima de 10h semanais — um vínculo por semestre)',
      'Atividade remunerada de pesquisa científica comprovada por contrato, carteira de trabalho, prestação de serviço ou declaração do coordenador, nos últimos 10 anos: 0,5 ponto por semestre (carga horária mínima de 10h semanais) — pontua apenas um vínculo por semestre.'),
    ('Coordenador/supervisor de campo de pesquisa científica',
      'Coordenador/supervisor de campo de pesquisa científica, comprovado por declaração do coordenador com identificação da agência de fomento, nos últimos 10 anos: 1 ponto por ocorrência.'),
    ('Outras formas de participação em projetos de pesquisa com financiamento',
      'Outras formas de participação em projeto de pesquisa com financiamento, comprovada por declaração do coordenador com identificação da agência de fomento, nos últimos 10 anos: 0,5 ponto por projeto.'),
    ('Coordenação de projeto de pesquisa com financiamento de agências de fomento',
      'Coordenação de projeto de pesquisa com financiamento de agências de fomento: 2,5 pontos por projeto.'),
    ('Coordenação de projeto de pesquisa sem financiamento de agências de fomento',
      'Coordenação de projeto de pesquisa sem financiamento de agências de fomento: 1,5 ponto por projeto.'),
    ('Estágio de pesquisa em saúde coletiva no exterior (mínimo 4 meses)',
      'Estágio de pesquisa em Saúde Coletiva no exterior (mestrado/doutorado sanduíche, pesquisador visitante, pós-doutorado), com duração mínima de 4 meses: 2 pontos por estágio.'),
    ('Membro titular de banca de doutorado (qualificação ou defesa)',
      'Membro titular de banca de doutorado (qualificação ou defesa): 2 pontos por banca.'),
    ('Membro titular de banca de mestrado (qualificação ou defesa)',
      'Membro titular de banca de mestrado (qualificação ou defesa): 1 ponto por banca.'),
    ('Membro titular de banca de concurso público docente ou pesquisador',
      'Membro titular de banca de concurso público docente ou pesquisador: 2 pontos por banca.'),
    ('Membro titular de banca de processos seletivos docentes ou de alunos de pós-graduação stricto sensu',
      'Membro titular de banca de processo seletivo docente ou de alunos de pós-graduação stricto sensu: 1 ponto por banca.'),
    ('Coordenação de projeto de extensão ou ensino', 'Coordenação de projeto de extensão ou ensino: 2 pontos por projeto.'),
    ('Participação em projetos de extensão ou ensino',
      'Participação em projeto de extensão ou ensino, comprovada por declaração do coordenador do projeto ou da instituição, nos últimos 10 anos: 0,5 ponto por projeto.'),
    ('Membro de corpo editorial de periódico com classificação Qualis Capes (2017-2020) A1-B2',
      'Membro de corpo editorial de periódico Qualis Capes (2017-2020) A1, A2, A3, A4, B1 ou B2: 1,5 ponto por periódico.'),
    ('Revisão de manuscrito para periódico classificado como Qualis A (2017-2020) A1-A4',
      'Revisão de manuscrito para periódico Qualis A1, A2, A3 ou A4 (2017-2020): 0,25 ponto por revisão.'),
    ('Revisor adhoc de agências de fomento', 'Revisor ad hoc de agências de fomento: 0,5 ponto por ocorrência.'),

    ('Trabalho premiado em congresso nacional/internacional',
      'Trabalho premiado em congresso nacional ou internacional: 0,25 ponto por prêmio.'),
    ('Distinções (professor homenageado, tese premiada, destaque por indicação dos Programas de Pós-Graduação ou da IES)',
      'Distinções: professor homenageado, tese premiada, ou destaque por indicação dos Programas de Pós-Graduação ou da Instituição de Ensino Superior e Pesquisa: 0,75 ponto por distinção.'),
    ('Tese ou dissertação premiada em concurso nacional ou internacional',
      'Tese ou dissertação premiada em concurso nacional ou internacional: 1 ponto.')
  ) as t(nome, criterio)
  where t.nome = p_nome
$$;

create or replace function public.trg_definir_criterio_edital()
returns trigger
language plpgsql
as $$
begin
  if new.criterio_edital is null then
    new.criterio_edital := public.criterio_edital_por_nome(new.nome);
  end if;
  return new;
end;
$$;

create trigger itens_barema_criterio_edital
  before insert on public.itens_barema
  for each row execute function public.trg_definir_criterio_edital();

-- Backfill: preenche os itens que já existem (seed rodado antes desta migration).
update public.itens_barema
set criterio_edital = public.criterio_edital_por_nome(nome)
where criterio_edital is null;
