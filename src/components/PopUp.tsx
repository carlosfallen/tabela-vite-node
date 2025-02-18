import React, { useState } from 'react';
import {
  Bell,
  User,
  Settings,
  LogOut,
  HelpCircle,
  UserCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
};

type ActiveDropdown = 'notifications' | 'profile' | null;

// Componente do Menu do Usuário
const UserProfileMenu = ({ 
  logout, 
  isOpen, 
  onToggle 
}: { 
  logout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const user = {
    name: 'João Silva',
    email: 'joao@exemplo.com',
    avatar: null
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="rounded-2xl absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg py-2 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <UserCircle className="h-10 w-10 text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
          
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => onToggle()}
          >
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-3" />
              Configurações
            </div>
          </Link>
          
          <Link
            to="/help"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => onToggle()}
          >
            <div className="flex items-center">
              <HelpCircle className="h-4 w-4 mr-3" />
              Ajuda
            </div>
          </Link>
          
          <button
            onClick={() => {
              logout();
              onToggle();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex items-center">
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// Componente de Notificações
const NotificationsPopover = ({ 
  isOpen, 
  onToggle 
}: { 
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Novo dispositivo conectado',
      message: 'Uma nova impressora foi adicionada à rede.',
      read: false,
      timestamp: '2 min atrás'
    },
    {
      id: '2',
      title: 'Atualização disponível',
      message: 'Há uma nova atualização de sistema disponível.',
      read: true,
      timestamp: '1 hora atrás'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="rounded-2xl absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notificações</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                    !notification.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {notification.timestamp}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Nenhuma notificação
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                Marcar todas como lidas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente contenedor que gerencia o estado
const HeaderDropdowns = ({ logout }: { logout: () => void }) => {
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);

  const handleToggle = (dropdown: ActiveDropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Opcional: fechar dropdowns quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
      <NotificationsPopover 
        isOpen={activeDropdown === 'notifications'}
        onToggle={() => handleToggle('notifications')}
      />
      <UserProfileMenu 
        logout={logout}
        isOpen={activeDropdown === 'profile'}
        onToggle={() => handleToggle('profile')}
      />
    </div>
  );
};

export { HeaderDropdowns };