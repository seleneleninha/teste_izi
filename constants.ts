
import { Property, User, ChatConversation, Lead, Notification } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Bruno Costa',
  email: 'bruno.costa@email.com',
  role: 'Agent',
  avatar: 'https://picsum.photos/seed/bruno/200/200'
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Villa',
    location: 'Lisbon, Portugal',
    price: 1200000,
    image: 'https://picsum.photos/seed/house1/800/600',
    beds: 4,
    baths: 3,
    area: 350,
    type: 'Casa',
    description: 'A stunning modern villa with pool and garden, located in a prime area.',
    features: ['Piscina', 'Jardim', 'Garagem', 'Ar Condicionado'],
    agent: CURRENT_USER,
    isFeatured: true
  },
  {
    id: '2',
    title: 'Apartamento Centro',
    location: 'São Paulo, SP',
    price: 850000,
    image: 'https://picsum.photos/seed/apt1/800/600',
    beds: 2,
    baths: 2,
    area: 98,
    type: 'Apartamento',
    description: 'Apartamento reformado no centro da cidade, próximo ao metrô.',
    features: ['Varanda', 'Portaria 24h', 'Academia'],
    agent: CURRENT_USER
  },
  {
    id: '3',
    title: 'Cobertura Duplex',
    location: 'Rio de Janeiro, RJ',
    price: 2500000,
    image: 'https://picsum.photos/seed/penthouse/800/600',
    beds: 3,
    baths: 4,
    area: 210,
    type: 'Apartamento',
    description: 'Vista mar incrível, acabamento de alto padrão.',
    features: ['Vista Mar', 'Jacuzzi', 'Churrasqueira', 'Elevador Privativo'],
    agent: CURRENT_USER,
    isFeatured: true
  },
  {
    id: '4',
    title: 'Casa de Campo',
    location: 'Campos do Jordão, SP',
    price: 1800000,
    image: 'https://picsum.photos/seed/country/800/600',
    beds: 5,
    baths: 4,
    area: 400,
    type: 'Casa',
    description: 'Refúgio perfeito na montanha com lareira e amplo terreno.',
    features: ['Lareira', 'Adega', 'Pomar', 'Aquecimento Solar'],
    agent: CURRENT_USER
  }
];

export const MOCK_CHATS: ChatConversation[] = [
  {
    id: 'c1',
    contact: { id: 'u2', name: 'Ana Silva', role: 'Client', email: 'ana@mail.com', avatar: 'https://picsum.photos/seed/ana/200/200' },
    lastMessage: { id: 'm1', senderId: 'u2', receiverId: 'u1', content: 'Gostaria de visitar o imóvel amanhã.', timestamp: new Date(), isRead: false },
    unreadCount: 2
  },
  {
    id: 'c2',
    contact: { id: 'u3', name: 'Carlos Souza', role: 'Client', email: 'carlos@mail.com', avatar: 'https://picsum.photos/seed/carlos/200/200' },
    lastMessage: { id: 'm2', senderId: 'u1', receiverId: 'u3', content: 'Enviei os documentos por email.', timestamp: new Date(Date.now() - 86400000), isRead: true },
    unreadCount: 0
  }
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Roberto Almeida',
    email: 'roberto.almeida@gmail.com',
    phone: '(11) 98888-7777',
    status: 'New',
    interest: 'Modern Villa',
    budget: 1250000,
    date: new Date(),
    avatar: 'https://picsum.photos/seed/roberto/150'
  },
  {
    id: 'l2',
    name: 'Fernanda Lima',
    email: 'fernanda.lima@tech.com',
    phone: '(11) 97777-6666',
    status: 'Contacted',
    interest: 'Apartamento Centro',
    budget: 900000,
    date: new Date(Date.now() - 86400000), // 1 day ago
    avatar: 'https://picsum.photos/seed/fernanda/150'
  },
  {
    id: 'l3',
    name: 'Marcos Oliveira',
    email: 'marcos.oli@uol.com.br',
    phone: '(21) 99999-5555',
    status: 'Negotiation',
    interest: 'Cobertura Duplex',
    budget: 2400000,
    date: new Date(Date.now() - 172800000), // 2 days ago
    avatar: 'https://picsum.photos/seed/marcos/150'
  },
  {
    id: 'l4',
    name: 'Juliana Paes',
    email: 'ju.paes@globo.com',
    phone: '(21) 98888-1111',
    status: 'New',
    interest: 'Casa de Campo',
    budget: 1800000,
    date: new Date(Date.now() - 3600000), // 1 hour ago
    avatar: 'https://picsum.photos/seed/juliana/150'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Novo Lead Recebido', description: 'Roberto Almeida demonstrou interesse na Modern Villa.', time: '5 min atrás', read: false, type: 'success' },
  { id: 'n2', title: 'Mensagem de Ana', description: 'Podemos reagendar a visita de amanhã?', time: '1 hora atrás', read: false, type: 'message' },
  { id: 'n3', title: 'Alerta de Preço', description: 'O valor do m² na região Sul subiu 2%.', time: '1 dia atrás', read: true, type: 'alert' },
  { id: 'n4', title: 'Lembrete de Agenda', description: 'Visita com Roberto em 2 horas.', time: '2 horas atrás', read: true, type: 'info' },
];

export const DASHBOARD_STATS = [
  { label: 'Property Views', value: '1,204', change: '+12.5%', isPositive: true },
  { label: 'Messages Received', value: '12', change: '+5.2%', isPositive: true },
  { label: 'New Leads', value: '5', change: '-3.1%', isPositive: false },
];

export const CHART_DATA = [
  { name: 'Mon', views: 400, leads: 24 },
  { name: 'Tue', views: 300, leads: 18 },
  { name: 'Wed', views: 200, leads: 30 },
  { name: 'Thu', views: 278, leads: 39 },
  { name: 'Fri', views: 189, leads: 48 },
  { name: 'Sat', views: 239, leads: 38 },
  { name: 'Sun', views: 349, leads: 43 },
];

export const REVENUE_DATA = [
  { name: 'Jan', revenue: 120000 },
  { name: 'Feb', revenue: 150000 },
  { name: 'Mar', revenue: 80000 },
  { name: 'Apr', revenue: 210000 },
  { name: 'May', revenue: 180000 },
  { name: 'Jun', revenue: 250000 },
  { name: 'Jul', revenue: 190000 },
  { name: 'Aug', revenue: 280000 },
  { name: 'Sep', revenue: 320000 },
  { name: 'Oct', revenue: 167500 },
];
