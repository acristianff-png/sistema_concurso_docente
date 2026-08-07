-- ============================================================================
-- Cálculo automático de pontuação por item, conforme o modo definido no
-- edital: alguns itens são por carga horária ("X pontos a cada N horas"),
-- outros por período ("X pontos por semestre/ano"), e a maioria é manual
-- (um valor fixo por ocorrência, ex.: 1 artigo = unidade do item).
--
-- itens_barema ganha o "modo de cálculo" e os fatores de conversão;
-- fontes_pontuacao ganha os campos que cada modo precisa (horas ou
-- intervalo de datas). O campo `valor` continua existindo e sendo a
-- fonte de verdade somada pelo resto do sistema — só que agora, para
-- itens não-manuais, ele é calculado automaticamente por trigger em vez
-- de digitado pelo usuário.
-- ============================================================================

alter table public.itens_barema
  add column modo_calculo text not null default 'manual'
    check (modo_calculo in ('manual', 'carga_horaria', 'periodo')),
  add column horas_por_unidade numeric(10, 2),
  add column pontos_por_unidade numeric(10, 4),
  add column unidade_periodo text
    check (unidade_periodo in ('semestre', 'ano'));

alter table public.fontes_pontuacao
  add column carga_horaria_horas numeric(10, 2),
  add column data_inicio date,
  add column data_fim date;

comment on column public.itens_barema.modo_calculo is
  'manual: valor digitado livremente. carga_horaria: valor = horas / horas_por_unidade * pontos_por_unidade. periodo: valor = nº de semestres/anos civis tocados pelo intervalo * pontos_por_unidade.';
comment on column public.fontes_pontuacao.data_fim is
  'NULL = vínculo em andamento (calcula até a data atual). Usado apenas em fontes de itens com modo_calculo = periodo.';

-- ----------------------------------------------------------------------------
-- Conta quantos blocos de semestre/ano civil um intervalo [início, fim] toca.
-- Semestre 1 = jan-jun, semestre 2 = jul-dez. Blocos parciais contam inteiros
-- (não há proporcionalização) — é a leitura mais simples de "por semestre"
-- quando o edital não detalha fração, e é ajustável aqui se necessário.
-- ----------------------------------------------------------------------------
create or replace function public.contar_periodos(p_data_inicio date, p_data_fim date, p_unidade text)
returns int
language sql
immutable
as $$
  select case p_unidade
    when 'semestre' then
      (extract(year from p_data_fim)::int * 2 + case when extract(month from p_data_fim) <= 6 then 0 else 1 end)
      - (extract(year from p_data_inicio)::int * 2 + case when extract(month from p_data_inicio) <= 6 then 0 else 1 end)
      + 1
    when 'ano' then
      extract(year from p_data_fim)::int - extract(year from p_data_inicio)::int + 1
    else null
  end
$$;

-- ----------------------------------------------------------------------------
-- Trigger: calcula fontes_pontuacao.valor a partir do modo do item, antes de
-- gravar. Em itens manuais, não mexe no valor informado pelo usuário.
-- ----------------------------------------------------------------------------
create or replace function public.calcular_valor_fonte()
returns trigger
language plpgsql
as $$
declare
  v_modo text;
  v_horas_por_unidade numeric;
  v_pontos_por_unidade numeric;
  v_unidade_periodo text;
begin
  select modo_calculo, horas_por_unidade, pontos_por_unidade, unidade_periodo
    into v_modo, v_horas_por_unidade, v_pontos_por_unidade, v_unidade_periodo
    from public.itens_barema
    where id = new.item_id;

  if v_modo = 'carga_horaria' then
    if new.carga_horaria_horas is null or v_horas_por_unidade is null or v_pontos_por_unidade is null then
      raise exception 'Item por carga horária: informe carga_horaria_horas na fonte (e configure horas_por_unidade/pontos_por_unidade no item)';
    end if;
    new.valor := round(new.carga_horaria_horas / v_horas_por_unidade * v_pontos_por_unidade, 4);

  elsif v_modo = 'periodo' then
    if new.data_inicio is null or v_pontos_por_unidade is null or v_unidade_periodo is null then
      raise exception 'Item por período: informe data_inicio na fonte (e configure pontos_por_unidade/unidade_periodo no item)';
    end if;
    new.valor := public.contar_periodos(new.data_inicio, coalesce(new.data_fim, current_date), v_unidade_periodo)
      * v_pontos_por_unidade;
  end if;
  -- modo_calculo = 'manual': new.valor permanece o que o usuário digitou.

  return new;
end;
$$;

create trigger fontes_pontuacao_calcular_valor
  before insert or update on public.fontes_pontuacao
  for each row execute function public.calcular_valor_fonte();
