import React from 'react';
import { Bell, Check, Info, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../constants';
import { Notification } from '../types';

interface NotificationDropdownProps {
  notifications: any[];
  onClose: () => void;
  onMarkAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onMarkAsRead }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full"><Check size={16} className="text-green-600 dark:text-green-400" /></div>;
      case 'alert': return <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle size={16} className="text-red-600 dark:text-red-400" /></div>;
      case 'message': return <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full"><MessageSquare size={16} className="text-blue-600 dark:text-blue-400" /></div>;
      default: return <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><Info size={16} className="text-gray-600 dark:text-gray-400" /></div>;
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
        <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
        <div className="flex items-center space-x-2">
          <span onClick={onMarkAsRead} className="text-xs text-primary-500 font-medium cursor-pointer hover:underline">Marcar todas como lidas</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors cursor-pointer ${!notif.lida ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                <div className="flex space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notif.tipo)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium ${!notif.lida ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {notif.titulo}
                      </p>
                      {!notif.lida && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{notif.descricao}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <Bell size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação nova</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-slate-700 text-center bg-gray-50 dark:bg-slate-900/50">
        <button className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400">
          Ver histórico completo
        </button>
      </div>
    </div>
  );
};