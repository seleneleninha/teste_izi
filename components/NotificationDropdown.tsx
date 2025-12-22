import React, { useState } from 'react';
import { Bell, Check, Info, MessageSquare, AlertTriangle, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface NotificationDropdownProps {
  notifications: any[];
  onClose: () => void;
  onMarkAsRead: () => void;
  onDeleteRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onMarkAsRead, onDeleteRead }) => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleDeleteRead = async () => {
    setIsBulkDeleting(true);
    await onDeleteRead();
    setIsBulkDeleting(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="p-2 bg-green-100 bg-green-900/30 rounded-full"><Check size={16} className="text-green-600 text-green-400" /></div>;
      case 'alert': return <div className="p-2 bg-red-100 bg-red-900/30 rounded-full"><AlertTriangle size={16} className="text-red-600 text-red-400" /></div>;
      case 'message': return <div className="p-2 bg-blue-100 bg-blue-900/30 rounded-full"><MessageSquare size={16} className="text-blue-600 text-blue-400" /></div>;
      case 'alerta_imovel': return <div className="p-2 bg-purple-100 bg-purple-900/30 rounded-full"><SparkleIcon size={16} className="text-purple-600 text-purple-400" /></div>;
      default: return <div className="p-2 bg-gray-100 bg-gray-800 rounded-full"><Info size={16} className="text-gray-400" /></div>;
    }
  };

  const SparkleIcon = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );

  const handleNotificationClick = async (notif: any) => {
    if (!notif.lida) {
      try {
        await supabase
          .from('notificacoes')
          .update({ lida: true })
          .eq('id', notif.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    setDeletingId(notifId);

    try {
      await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notifId);

      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setDeletingId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <div className="fixed inset-0 md:absolute md:inset-auto md:right-0 md:top-12 w-full md:w-96 bg-slate-800 md:rounded-3xl shadow-2xl border-0 md:border border-slate-700 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden flex flex-col h-full md:h-auto">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-white">Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex flex-col md:flex-row items-end md:items-center space-y-1 md:space-y-0 md:space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAsRead}
                className="text-xs text-primary-500 font-medium hover:text-primary-400 transition-colors whitespace-nowrap"
              >
                Lidas
              </button>
            )}
            {notifications.some(n => n.lida) && (
              <button
                onClick={handleDeleteRead}
                disabled={isBulkDeleting}
                className="text-xs text-red-500 font-medium hover:text-red-400 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {isBulkDeleting ? 'Excluindo...' : 'Limpar Lidas'}
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-200 transition-colors bg-slate-800 rounded-lg md:bg-transparent">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 md:max-h-[450px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-700">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`group relative p-4 hover:bg-slate-750 transition-colors ${!notif.lida ? 'bg-blue-900/10' : ''} ${deletingId === notif.id ? 'opacity-50' : ''}`}
              >
                <div
                  onClick={() => handleNotificationClick(notif)}
                  className="flex space-x-3 cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notif.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium pr-2 ${!notif.lida ? 'text-white' : 'text-gray-300'}`}>
                        {notif.titulo}
                      </p>
                      {!notif.lida && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{notif.mensagem}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all"
                  title="Excluir notificação"
                  disabled={deletingId === notif.id}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
              <Bell size={28} className="opacity-50" />
            </div>
            <p className="text-sm font-medium mb-1">Nenhuma notificação</p>
            <p className="text-xs text-gray-400">Você está em dia! 🎉</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-700 text-center bg-slate-900/50 flex-shrink-0">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="text-xs font-medium text-gray-300 hover:text-primary-400 transition-colors"
          >
            Ver histórico completo
          </button>
        </div>
      )}
    </div>
  );
};