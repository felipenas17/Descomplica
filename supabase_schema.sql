-- Copie e cole este código no SQL Editor do seu projeto Supabase

-- Tabela de Alunos
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  registration_number text,
  class_name text,
  status text default 'Ativo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Professores
create table if not exists teachers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text,
  email text,
  avatar text,
  role text default 'Professor',
  availability text[], -- Array de strings para dias/horários
  status text default 'Ativo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Aulas (Schedule)
create table if not exists schedules (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  student_name text not null,
  teacher_name text not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  duration integer,
  class_type text,
  status text,
  notes text,
  is_test_week boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Feedbacks
create table if not exists feedbacks (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references schedules(id) on delete cascade,
  student_name text not null,
  teacher_name text not null,
  subject text not null,
  class_date date not null,
  performance text,
  participation text,
  content text,
  difficulties text,
  observations text,
  rating integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Perfis de Usuários
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  role text check (role in ('admin', 'professor')) default 'professor',
  needs_password_change boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Função para criar perfil automaticamente ao cadastrar no Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, coalesce(new.raw_user_meta_data->>'role', 'professor'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para chamar a função acima
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabela de Materiais de Apoio
create table if not exists materials (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subject text not null,
  description text,
  file_url text not null,
  uploaded_by uuid references auth.users on delete set null,
  uploader_name text not null,
  type text check (type in ('Revisão', 'Exercícios', 'Teoria')),
  level text,
  file_size bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Financeiro
create table if not exists finances (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  type text check (type in ('revenue', 'expense')),
  value decimal(12,2) not null,
  category text,
  payment_method text,
  due_date date not null,
  status text default 'Pendente',
  cost_type text check (cost_type in ('Fixo', 'Variável')),
  is_recurring boolean default false,
  recurrence_period text,
  start_date date,
  end_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Transações (Financeiro Real)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  type text check (type in ('receita', 'despesa')) not null,
  category text not null,
  description text,
  amount numeric(10,2) not null,
  date date not null,
  student_id uuid references students(id) on delete set null,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Habilitar RLS em todas as tabelas
alter table students enable row level security;
alter table teachers enable row level security;
alter table schedules enable row level security;
alter table feedbacks enable row level security;
alter table profiles enable row level security;
alter table materials enable row level security;
alter table finances enable row level security;
alter table transactions enable row level security;

-- LIMPEZA TOTAL DE POLÍTICAS PARA EVITAR RECURSIVIDADE
do $$
declare
    r record;
begin
    for r in (select policyname, tablename from pg_policies where schemaname = 'public') loop
        execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on ' || quote_ident(r.tablename);
    end loop;
end $$;

-- FUNÇÕES DE AUXÍLIO PARA RLS
-- Checar se é admin
create or replace function public.check_is_admin()
returns boolean 
language plpgsql
security definer 
set search_path = public
as $$
begin
  return exists (
    select 1 
    from public.profiles 
    where id = auth.uid() 
    and role = 'admin'
  );
end;
$$;

-- Checar se é professor e obter o nome completo
create or replace function public.get_auth_user_full_name()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return (select full_name from public.profiles where id = auth.uid());
end;
$$;

-- POLÍTICAS: PROFILES
create policy "profiles_select_own_or_admin" on profiles for select using (auth.uid() = id or check_is_admin());
create policy "profiles_update_own_or_admin" on profiles for update using (auth.uid() = id or check_is_admin());
create policy "profiles_insert_service" on profiles for insert with check (true); -- Permitir o trigger handle_new_user

-- POLÍTICAS: STUDENTS (Admin total, Professor vê todos mas não edita)
create policy "students_admin_all" on students for all using (check_is_admin());
create policy "students_professor_select" on students for select using (not check_is_admin());

-- POLÍTICAS: TEACHERS (Admin total, Professor vê todos)
create policy "teachers_admin_all" on teachers for all using (check_is_admin());
create policy "teachers_professor_select" on teachers for select using (not check_is_admin());

-- POLÍTICAS: SCHEDULES (Admin total, Professor vê e edita os seus)
create policy "schedules_admin_all" on schedules for all using (check_is_admin());
create policy "schedules_professor_access" on schedules for all using (
  teacher_name = get_auth_user_full_name()
) with check (
  teacher_name = get_auth_user_full_name()
);

-- POLÍTICAS: FEEDBACKS (Admin total, Professor vê e edita os seus)
create policy "feedbacks_admin_all" on feedbacks for all using (check_is_admin());
create policy "feedbacks_professor_access" on feedbacks for all using (
  teacher_name = get_auth_user_full_name()
) with check (
  teacher_name = get_auth_user_full_name()
);

-- POLÍTICAS: MATERIALS (Admin total, Professor vê todos e edita os seus)
create policy "materials_admin_all" on materials for all using (check_is_admin());
create policy "materials_professor_select" on materials for select using (not check_is_admin());
create policy "materials_professor_insert" on materials for insert with check (uploaded_by = auth.uid());
create policy "materials_professor_update_delete" on materials for all using (uploaded_by = auth.uid());

-- POLÍTICAS: TRANSACTIONS / FINANCES (Admin total apenas)
create policy "finances_admin_only" on finances for all using (check_is_admin());
create policy "transactions_admin_only" on transactions for all using (check_is_admin());

-- STORAGE (BUCKET: materials_bucket)
/* 
  As políticas de Storage devem ser aplicadas na tabela storage.objects via dashboard do Supabase.
*/

