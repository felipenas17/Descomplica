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

export type NotificationType = 'new_class' | 'payment_due' | 'substitution_request';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'new_class',
    title: 'Nova aula agendada',
    message: 'Nova aula de Matemática agendada para Professor Ricardo Santos em 12/05 às 08:00.',
    timestamp: '2026-05-07T10:00:00Z',
    read: false,
    priority: 'medium'
  },
  {
    id: 'n2',
    type: 'payment_due',
    title: 'Vencimento de Mensalidade',
    message: 'A mensalidade de Ana Alice Silva vence em breve (10/05).',
    timestamp: '2026-05-07T09:15:00Z',
    read: false,
    priority: 'high'
  },
  {
    id: 'n3',
    type: 'substitution_request',
    title: 'Solicitação de Substituição',
    message: 'Professor Marco Aurélio solicitou substituição para a aula de 15/05 às 14:00.',
    timestamp: '2026-05-06T16:45:00Z',
    read: true,
    priority: 'high'
  },
  {
    id: 'n4',
    type: 'new_class',
    title: 'Nova aula agendada',
    message: 'Nova aula de Física agendada para Professora Elena Costa em 13/05 às 10:00.',
    timestamp: '2026-05-06T11:00:00Z',
    read: true,
    priority: 'low'
  }
];
