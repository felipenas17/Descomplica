-- SQL PARA AMPLIAR O SUPORTE OPERACIONAL NA TABELA DE AULAS
-- Adiciona suporte para salas e categorias de aula

ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS room text,
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('individual', 'grupo', 'reforco', 'preparatorio', 'outro')) DEFAULT 'individual';

-- Índices para facilitar buscas operacionais
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_room ON schedules(room);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
