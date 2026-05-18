-- SQL PARA CORRIGIR RELACIONAMENTO ENTRE TRANSAÇÕES E ALUNOS
-- Execute este código no SQL Editor do seu projeto Supabase

-- 1. Garante que a coluna student_id existe na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS student_id uuid;

-- 2. Garante que a chave estrangeira existe (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'transactions_student_id_fkey'
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_student_id_fkey 
        FOREIGN KEY (student_id) 
        REFERENCES public.students(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Notifica o PostgREST para recarregar o cache de schema (isso acontece automaticamente, mas forçar ajuda)
NOTIFY pgrst, 'reload schema';

-- 4. Garante permissões (caso o erro persista como 403)
GRANT ALL ON TABLE public.transactions TO anon, authenticated;
GRANT ALL ON TABLE public.students TO anon, authenticated;
