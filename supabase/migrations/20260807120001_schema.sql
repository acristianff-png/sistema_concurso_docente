-- ============================================================================
-- Barema Tracker (AM Mentoria) — schema inicial
-- Uso pessoal / single-user: toda tabela é protegida por RLS restringindo
-- as linhas ao dono autenticado (auth.uid()), seja diretamente (user_id)
-- ou por herança através da cadeia de FKs até editais/acoes.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Função utilitária: mantém updated_at em dia em qualquer UPDATE
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- editais — snapshot versionado do barema de um edital do concurso
-- ============================================================================
create table public.editais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  ativo boolean not null default true,
  data_publicacao date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index editais_user_id_idx on public.editais(user_id);

alter table public.editais enable row level security;

create policy "editais: dono gerencia tudo"
  on public.editais for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger set_updated_at
  before update on public.editais
  for each row execute function public.set_updated_at();

-- ============================================================================
-- quesitos — os 5 quesitos do barema (ordem real, definida no edital)
-- ============================================================================
create table public.quesitos (
  id uuid primary key default gen_random_uuid(),
  edital_id uuid not null references public.editais(id) on delete cascade,
  ordem int not null,
  nome text not null,
  teto numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edital_id, ordem)
);

create index quesitos_edital_id_idx on public.quesitos(edital_id);

alter table public.quesitos enable row level security;

create policy "quesitos: dono gerencia tudo"
  on public.quesitos for all
  using (exists (
    select 1 from public.editais e
    where e.id = quesitos.edital_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.editais e
    where e.id = quesitos.edital_id and e.user_id = auth.uid()
  ));

create trigger set_updated_at
  before update on public.quesitos
  for each row execute function public.set_updated_at();

-- ============================================================================
-- itens_barema — itens dentro de cada quesito, com valor unitário e máximo
-- ============================================================================
create table public.itens_barema (
  id uuid primary key default gen_random_uuid(),
  quesito_id uuid not null references public.quesitos(id) on delete cascade,
  nome text not null,
  unidade numeric(10, 4) not null default 0,
  pontuacao_maxima numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index itens_barema_quesito_id_idx on public.itens_barema(quesito_id);

alter table public.itens_barema enable row level security;

create policy "itens_barema: dono gerencia tudo"
  on public.itens_barema for all
  using (exists (
    select 1 from public.quesitos q
    join public.editais e on e.id = q.edital_id
    where q.id = itens_barema.quesito_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.quesitos q
    join public.editais e on e.id = q.edital_id
    where q.id = itens_barema.quesito_id and e.user_id = auth.uid()
  ));

create trigger set_updated_at
  before update on public.itens_barema
  for each row execute function public.set_updated_at();

-- ============================================================================
-- fontes_pontuacao — evidências que compõem o valor de um item (1-N)
-- ============================================================================
create table public.fontes_pontuacao (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens_barema(id) on delete cascade,
  descricao text not null,
  valor numeric(10, 4) not null default 0,
  link text,
  data_referencia date,
  confirmado boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fontes_pontuacao_item_id_idx on public.fontes_pontuacao(item_id);

alter table public.fontes_pontuacao enable row level security;

create policy "fontes_pontuacao: dono gerencia tudo"
  on public.fontes_pontuacao for all
  using (exists (
    select 1 from public.itens_barema i
    join public.quesitos q on q.id = i.quesito_id
    join public.editais e on e.id = q.edital_id
    where i.id = fontes_pontuacao.item_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.itens_barema i
    join public.quesitos q on q.id = i.quesito_id
    join public.editais e on e.id = q.edital_id
    where i.id = fontes_pontuacao.item_id and e.user_id = auth.uid()
  ));

create trigger set_updated_at
  before update on public.fontes_pontuacao
  for each row execute function public.set_updated_at();

-- ============================================================================
-- areas_tematicas — as 3 áreas temáticas prioritárias do edital
-- ============================================================================
create table public.areas_tematicas (
  id uuid primary key default gen_random_uuid(),
  edital_id uuid not null references public.editais(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index areas_tematicas_edital_id_idx on public.areas_tematicas(edital_id);

alter table public.areas_tematicas enable row level security;

create policy "areas_tematicas: dono gerencia tudo"
  on public.areas_tematicas for all
  using (exists (
    select 1 from public.editais e
    where e.id = areas_tematicas.edital_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.editais e
    where e.id = areas_tematicas.edital_id and e.user_id = auth.uid()
  ));

create trigger set_updated_at
  before update on public.areas_tematicas
  for each row execute function public.set_updated_at();

-- ============================================================================
-- area_elementos — elementos existentes que já fortalecem uma área
-- ============================================================================
create table public.area_elementos (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas_tematicas(id) on delete cascade,
  descricao text not null,
  peso numeric(3, 1) not null check (peso >= 1 and peso <= 5),
  link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index area_elementos_area_id_idx on public.area_elementos(area_id);

alter table public.area_elementos enable row level security;

create policy "area_elementos: dono gerencia tudo"
  on public.area_elementos for all
  using (exists (
    select 1 from public.areas_tematicas a
    join public.editais e on e.id = a.edital_id
    where a.id = area_elementos.area_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.areas_tematicas a
    join public.editais e on e.id = a.edital_id
    where a.id = area_elementos.area_id and e.user_id = auth.uid()
  ));

create trigger set_updated_at
  before update on public.area_elementos
  for each row execute function public.set_updated_at();

-- ============================================================================
-- area_sugestoes — sugestões de melhoria por área (geradas por IA, editáveis)
-- ============================================================================
create table public.area_sugestoes (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas_tematicas(id) on delete cascade,
  descricao text not null,
  status text not null default 'sugerida' check (status in ('sugerida', 'aceita', 'descartada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index area_sugestoes_area_id_idx on public.area_sugestoes(area_id);

alter table public.area_sugestoes enable row level security;

create policy "area_sugestoes: dono gerencia tudo"
  on public.area_sugestoes for all
  using (exists (
    select 1 from public.areas_tematicas a
    join public.editais e on e.id = a.edital_id
    where a.id = area_sugestoes.area_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.areas_tematicas a
    join public.editais e on e.id = a.edital_id
    where a.id = area_sugestoes.area_id and e.user_id = auth.uid()
  ));

create trigger set_updated_at
  before update on public.area_sugestoes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- acoes — kanban do plano de ação
-- ============================================================================
create table public.acoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  titulo text not null,
  descricao text,
  quesito_id uuid references public.quesitos(id) on delete set null,
  area_id uuid references public.areas_tematicas(id) on delete set null,
  afeta_pontuacao boolean not null default true,
  impacto_pontos numeric(10, 2),
  status text not null default 'nao_iniciado' check (status in ('nao_iniciado', 'em_andamento', 'concluido')),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  prazo date,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index acoes_user_id_idx on public.acoes(user_id);
create index acoes_quesito_id_idx on public.acoes(quesito_id);
create index acoes_area_id_idx on public.acoes(area_id);
create index acoes_status_idx on public.acoes(status);

alter table public.acoes enable row level security;

create policy "acoes: dono gerencia tudo"
  on public.acoes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger set_updated_at
  before update on public.acoes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- acao_comentarios — observações datadas por card do kanban
-- ============================================================================
create table public.acao_comentarios (
  id uuid primary key default gen_random_uuid(),
  acao_id uuid not null references public.acoes(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create index acao_comentarios_acao_id_idx on public.acao_comentarios(acao_id);

alter table public.acao_comentarios enable row level security;

create policy "acao_comentarios: dono gerencia tudo"
  on public.acao_comentarios for all
  using (exists (
    select 1 from public.acoes a
    where a.id = acao_comentarios.acao_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.acoes a
    where a.id = acao_comentarios.acao_id and a.user_id = auth.uid()
  ));

-- ============================================================================
-- historico_pontuacao — snapshot de pontuação por quesito, para gráfico
-- de evolução. Populado automaticamente por trigger (ver 00000000000002).
-- ============================================================================
create table public.historico_pontuacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  edital_id uuid not null references public.editais(id) on delete cascade,
  quesito_id uuid not null references public.quesitos(id) on delete cascade,
  pontuacao numeric(10, 2) not null,
  registrado_em timestamptz not null default now()
);

create index historico_pontuacao_user_id_idx on public.historico_pontuacao(user_id);
create index historico_pontuacao_quesito_id_idx on public.historico_pontuacao(quesito_id);
create index historico_pontuacao_registrado_em_idx on public.historico_pontuacao(registrado_em);

alter table public.historico_pontuacao enable row level security;

-- Somente leitura pelo dono: as linhas são criadas exclusivamente pelo
-- trigger (security definer), nunca por escrita direta do client.
create policy "historico_pontuacao: dono lê"
  on public.historico_pontuacao for select
  using (user_id = auth.uid());
