-- Copie e cole este código no SQL Editor do seu projeto Supabase

-- Tabela de Alunos
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  status text default 'ativo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Professores
create table if not exists teachers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text,
  email text,
  status text default 'ativo',
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
  role text check (role in ('admin', 'professor')),
  needs_password_change boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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

-- Habilitar RLS em todas as tabelas
alter table students enable row level security;
alter table teachers enable row level security;
alter table schedules enable row level security;
alter table feedbacks enable row level security;
alter table profiles enable row level security;
alter table materials enable row level security;

-- POLÍTICAS PERMISSIVAS PARA PROTÓTIPO (Permitem anon e authenticated)
-- Students
create policy "Allow all students" on students for all using (true) with check (true);

-- Teachers
create policy "Allow all teachers" on teachers for all using (true) with check (true);

-- Schedules
create policy "Allow all schedules" on schedules for all using (true) with check (true);

-- Feedbacks
create policy "Allow all feedbacks" on feedbacks for all using (true) with check (true);

-- Profiles
create policy "Allow all profiles" on profiles for all using (true) with check (true);

-- Materials
create policy "Allow all materials" on materials for all using (true) with check (true);

-- STORAGE (BUCKET: materials_bucket)
/* 
  As políticas de Storage devem ser aplicadas na tabela storage.objects.
  Substitua 'materials_bucket' pelo nome do seu bucket.
*/
-- create policy "Public Access" on storage.objects for select using (bucket_id = 'materials_bucket');
-- create policy "Public Upload" on storage.objects for insert with check (bucket_id = 'materials_bucket');

