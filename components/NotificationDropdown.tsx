import React, { useState } from 'react';
import { Bell, Check, Info, MessageSquare, AlertTriangle, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface NotificationDropdownProps {
  notifications: any[];
  onClose: () => void;
  onMarkAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onMarkAsRead }) => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full"><Check size={16} className="text-green-600 dark:text-green-400" /></div>;
      case 'alert': return <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle size={16} className="text-red-600 dark:text-red-400" /></div>;
      case 'message': return <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full"><MessageSquare size={16} className="text-blue-600 dark:text-blue-400" /></div>;
      default: return <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><Info size={16} className="text-gray-600 dark:text-gray-400" /></div>;
    }
  };

  const handleNotificationClick = async (notif: any) => {
    // Mark as read if not already
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

    // Navigate to link if exists
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation(); // Prevent triggering the click handler
    setDeletingId(notifId);

    try {
      await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notifId);

      // Trigger a refresh by closing and reopening (or use a callback)
      setTimeout(() => {
        window.location.reload(); // Simple refresh for now
      }, 300);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setDeletingId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <div className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden z-index-999">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 z-index-999">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAsRead}
              className="text-xs text-primary-500 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`group relative p-4 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors ${!notif.lida ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${deletingId === notif.id ? 'opacity-50' : ''}`}
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
                      <p className={`text-sm font-medium pr-2 ${!notif.lida ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {notif.titulo}
                      </p>
                      {!notif.lida && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{notif.mensagem}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {/* Delete button - shows on hover */}
                <button
                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                  title="Excluir notificação"
                  disabled={deletingId === notif.id}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Bell size={28} className="opacity-50" />
            </div>
            <p className="text-sm font-medium mb-1">Nenhuma notificação</p>
            <p className="text-xs text-gray-400">Você está em dia! 🎉</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 dark:border-slate-700 text-center bg-gray-50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
          >
            Ver histórico completo
          </button>
        </div>
      )}
    </div>
  );
};