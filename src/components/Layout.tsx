import { useState } from 'react';
import { Menu, X, LayoutGrid, Router, Printer, Box, LogOut } from 'lucide-react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const navigation = [
    { name: 'Dispositivos', href: '/', icon: LayoutGrid },
    { name: 'Roteadores', href: '/routers', icon: Router },
    { name: 'Impressoras', href: '/printers', icon: Printer },
    { name: 'Caixas', href: '/boxes', icon: Box },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile header */}
      <div className="md:hidden bg-white w-full fixed top-0 z-50">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Device Manager</h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="bg-white shadow-lg">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon
                      className={`${
                        location.pathname === item.href
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center text-gray-600 hover:text-gray-900 w-full px-2 py-2 text-sm font-medium rounded-md"
              >
                <LogOut className="mr-3 h-6 w-6" />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed h-screen bg-white border-r border-gray-200">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-semibold">Gerenciador</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon
                      className={`${
                        location.pathname === item.href
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={() => logout()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-6 w-6" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Layout;