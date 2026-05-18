export type Teacher = {
  id: string;
  name: string;
  subject: string;
  email: string;
  avatar: string;
  availability: string[];
  role: string;
};

export type ClassEvent = {
  id: string;
  title: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  room: string;
  type: 'Presencial' | 'Remoto';
  category: 'Teórica' | 'Prática';
  day: string; // ISO date or day name
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  value: number;
  type: 'income' | 'expense';
  status: 'Pago' | 'Pendente' | 'Atrasado';
};

export type Student = {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  class: string;
  avatar: string;
  status: 'Ativo' | 'Inativo';
};

export const MOCK_STUDENTS: Student[] = [
  {
    id: 's1',
    name: 'Ana Alice Silva',
    email: 'ana.alice@escola.com',
    registrationNumber: '#4502',
    class: '3º Ano B',
    avatar: 'https://picsum.photos/seed/ana_s/200',
    status: 'Ativo'
  },
  {
    id: 's2',
    name: 'Bruno Oliveira',
    email: 'bruno.o@escola.com',
    registrationNumber: '#4515',
    class: '3º Ano B',
    avatar: 'https://picsum.photos/seed/bruno/200',
    status: 'Inativo'
  }
];

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'Ricardo Santos',
    subject: 'Matemática Avançada',
    email: 'ricardo.santos@escola.com',
    avatar: 'https://picsum.photos/seed/ricardo/200',
    availability: ['SEG', 'TER', 'QUA'],
    role: 'Coordenador de Exatas'
  },
  {
    id: 't2',
    name: 'Elena Costa',
    subject: 'Física Geral',
    email: 'elena.costa@escola.com',
    avatar: 'https://picsum.photos/seed/elena/200',
    availability: ['TER', 'QUI', 'SEX'],
    role: 'Professora Sênior'
  },
  {
    id: 't3',
    name: 'Marco Aurélio',
    subject: 'Filosofia',
    email: 'marco.aurelio@escola.com',
    avatar: 'https://picsum.photos/seed/marco/200',
    availability: ['QUA', 'SEX'],
    role: 'Professor'
  },
  {
    id: 't4',
    name: 'Ana Clara',
    subject: 'Química Geral',
    email: 'ana.clara@escola.com',
    avatar: 'https://picsum.photos/seed/ana/200',
    availability: ['SEG', 'QUI'],
    role: 'Professora'
  }
];

export const MOCK_EVENTS: ClassEvent[] = [
  {
    id: 'e1',
    title: 'Cálculo I',
    teacherId: 't1',
    teacherName: 'Ricardo Santos',
    startTime: '08:00',
    endTime: '09:30',
    room: 'Sala 204',
    type: 'Presencial',
    category: 'Teórica',
    day: 'SEG'
  },
  {
    id: 'e2',
    title: 'Física Geral',
    teacherId: 't2',
    teacherName: 'Elena Costa',
    startTime: '10:00',
    endTime: '11:30',
    room: 'Lab 02',
    type: 'Presencial',
    category: 'Prática',
    day: 'SEG'
  },
  {
    id: 'e3',
    title: 'Filosofia',
    teacherId: 't3',
    teacherName: 'Marco Aurélio',
    startTime: '09:00',
    endTime: '10:30',
    room: 'Auditório',
    type: 'Presencial',
    category: 'Teórica',
    day: 'TER'
  },
  {
    id: 'e4',
    title: 'Química Orgânica',
    teacherId: 't4',
    teacherName: 'Ana Clara',
    startTime: '14:00',
    endTime: '15:30',
    room: 'Sala 101',
    type: 'Presencial',
    category: 'Prática',
    day: 'TER'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tr1', date: '2023-10-24', description: 'Matrícula - João Silva', category: 'Mensalidades', value: 1200.00, type: 'income', status: 'Pago' },
  { id: 'tr2', date: '2023-10-23', description: 'Enel Distribuição', category: 'Infraestrutura', value: 450.20, type: 'expense', status: 'Pendente' },
  { id: 'tr3', date: '2023-10-20', description: 'Mensalidade - Ana Costa', category: 'Mensalidades', value: 1200.00, type: 'income', status: 'Atrasado' },
  { id: 'tr4', date: '2023-10-18', description: 'Sintegra Cloud SaaS', category: 'Software', value: 890.00, type: 'expense', status: 'Pago' }
];

export const MOCK_FINANCIAL_SUMMARY = {
  totalRevenue: 145280.00,
  totalExpenses: 82450.00,
  netProfit: 62830.00,
  defaultRate: 4.8
};

export type NotificationType = 
  | 'new_class' 
  | 'payment_due' 
  | 'substitution_request'
  | 'new_enrollment' 
  | 'overdue_payment' 
  | 'teacher_idle' 
  | 'feedback_pending' 
  | 'class_limit'
  | 'class_cancelled' 
  | 'schedule_change' 
  | 'class_upcoming' 
  | 'class_scheduled' 
  | 'feedback_required' 
  | 'student_added' 
  | 'reminder_grades';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'admin' | 'teacher';
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  // Admin Notifications
  {
    id: 'n1',
    type: 'new_enrollment',
    title: 'Nova Matrícula',
    message: 'O aluno Carlos Eduardo acaba de ser matriculado no 3º Ano A.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15m ago
    read: false,
    priority: 'medium',
    category: 'admin'
  },
  {
    id: 'n2',
    type: 'overdue_payment',
    title: 'Inadimplência Detectada',
    message: 'A fatura de Mariana Luz (Ref: Maio/2026) está em atraso há 2 dias.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    read: false,
    priority: 'high',
    category: 'admin'
  },
  {
    id: 'n3',
    type: 'teacher_idle',
    title: 'Alerta de Escala',
    message: 'O Professor Miguel Arraes ainda não possui aulas atribuídas para a próxima quarta-feira.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    read: false,
    priority: 'medium',
    category: 'admin'
  },
  {
    id: 'n4',
    type: 'class_limit',
    title: 'Limite de Turma Próximo',
    message: 'A Turma de Robótica Avançada atingiu 90% da capacidade (18/20 alunos).',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
    read: true,
    priority: 'medium',
    category: 'admin'
  },
  // Teacher Notifications
  {
    id: 'n5',
    type: 'class_cancelled',
    title: 'Aula Cancelada',
    message: 'Sua aula de Física das 14:00 foi cancelada devido a manutenção na sala Lab 02.',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10m ago
    read: false,
    priority: 'high',
    category: 'teacher'
  },
  {
    id: 'n6',
    type: 'class_upcoming',
    title: 'Aula Iniciando',
    message: 'Sua aula de Matemática inicia em 15 minutos na Sala 204.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5m ago
    read: false,
    priority: 'high',
    category: 'teacher'
  },
  {
    id: 'n7',
    type: 'feedback_required',
    title: 'Feedback Pendente',
    message: 'Você ainda não preencheu o relatório de desempenho da Turma B - Inglês.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
    read: false,
    priority: 'medium',
    category: 'teacher'
  },
  {
    id: 'n8',
    type: 'student_added',
    title: 'Novo Aluno na Turma',
    message: 'O aluno Roberto Carlos foi adicionado à sua turma de Cálculo I.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
    read: true,
    priority: 'low',
    category: 'teacher'
  }
];
