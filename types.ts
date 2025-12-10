
export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  beds: number;
  baths: number;
  area: number;
  type: 'Apartamento' | 'Casa' | 'Comercial' | 'Terreno';
  description: string;
  features: string[];
  agent: User;
  isFeatured?: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface User {
  id: string;
  name: string;
  role: 'Agent' | 'Client' | 'Admin';
  avatar: string;
  email: string;
  phone?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  contact: User;
  lastMessage: Message;
  unreadCount: number;
}

export type LeadStatus = 'New' | 'Contacted' | 'Scheduled' | 'Negotiation' | 'Closed';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  interest: string; // Nome do imóvel ou ID
  budget: number;
  date: Date;
  avatar: string;
}



export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'message' | 'alert' | 'success' | 'info';
}





export enum NavItem {
  Dashboard = 'Dashboard',
  Properties = 'Properties',
  Leads = 'Leads',
  Settings = 'Settings',
  Logout = 'Logout'
}
