-- SQL PARA CRIAÇÃO DA TABELA DE AGENDA ADMINISTRATIVA
-- Cole este código no SQL Editor do seu projeto Supabase

CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text CHECK (type IN ('reuniao', 'pagamento', 'tarefa', 'urgente', 'outro')) NOT NULL,
  date date NOT NULL,
  time_start time,
  time_end time,
  amount numeric(10,2),
  responsible text,
  description text,
  reminder text DEFAULT 'none' CHECK (reminder IN ('none', '1h', '1d', '1w')),
  status text DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'concluido', 'cancelado')),
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Política de Segurança: Admin acessa tudo
CREATE POLICY "Admin acessa tudo em appointments"
ON appointments FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
