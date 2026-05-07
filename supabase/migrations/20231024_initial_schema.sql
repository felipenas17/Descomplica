-- Migration: Initial Schema for Gestão de Escolas
-- Target: Supabase (PostgreSQL)

-- 1. Create Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  availability TEXT[], -- Array of days like ['SEG', 'TER']
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  class TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Classes/Events Table
CREATE TABLE IF NOT EXISTS class_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  type TEXT CHECK (type IN ('Presencial', 'Remoto')),
  category TEXT CHECK (category IN ('Teórica', 'Prática')),
  day TEXT NOT NULL, -- 'SEG', 'TER', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Transactions Table (Finance)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  category TEXT,
  value DECIMAL(10, 2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  status TEXT CHECK (status IN ('Pago', 'Pendente', 'Atrasado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
