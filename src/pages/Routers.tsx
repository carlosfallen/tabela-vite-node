import { useEffect, useState } from 'react';
import type { Router } from '../types';
import { Activity, Power, Eye, EyeOff, Wifi } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import QRCode from 'react-qr-code';

export default function Routers() {
  const { user } = useAuthStore();
  const [routers, setRouters] = useState<Router[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});
  const [qrCodeData, setQrCodeData] = useState<{ ssid: string; password: string; hidden: boolean } | null>(null);

  useEffect(() => {
    const fetchRouters = async () => {
      try {
        if (!user || !user.token) {
          throw new Error('Authentication token is missing');
        }

        const response = await fetch('http://10.0.11.150:3000/api/routers', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch routers');
        }

        const data: Router[] = await response.json();
        setRouters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Fetch routers error:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRouters();
  }, [user]);

  const togglePasswordVisibility = (routerId: number) => {
    setShowPassword((prev) => ({
      ...prev,
      [routerId]: !prev[routerId],
    }));
  };

  const generateQrCode = (router: Router) => {
    const { wifi_ssid: ssid, wifi_password: password, hidden } = router;
    setQrCodeData({ ssid: ssid || '', password: password || '', hidden: hidden === 1 });
  };

  const closeQrCodeModal = () => {
    setQrCodeData(null);
  };

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const safeRouters = Array.isArray(routers) ? routers : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Roteadores</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {safeRouters.map((router) => (
          <div key={router.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {router.name || 'Nome não disponível'}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    router.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {router.status === 1 ? (
                    <Activity className="w-3 h-3 mr-1" />
                  ) : (
                    <Power className="w-3 h-3 mr-1" />
                  )}
                  {router.status === 1 ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="mt-1 text-sm font-medium">{router.ip || 'IP não disponível'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Login Credentials</p>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">
                        {router.login_username || 'Usuário não disponível'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">
                        {showPassword[router.id]
                          ? router.login_password || ''
                          : (router.login_password || '').replace(/./g, '•')}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(router.id)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword[router.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Wi-Fi Settings</p>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <Wifi className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm font-medium">
                        {router.wifi_ssid || 'SSID não disponível'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">
                        {showPassword[router.id]
                          ? router.wifi_password || ''
                          : (router.wifi_password || '').replace(/./g, '•')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => generateQrCode(router)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Gerar QR Code do Wi-Fi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para exibir o QR Code */}
      {qrCodeData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">QR Code do Wi-Fi</h2>
            <QRCode
              value={`WIFI:S:${qrCodeData.ssid};T:WPA;P:${qrCodeData.password};H:${qrCodeData.hidden};;`}
              size={256}
            />
            <button
              onClick={closeQrCodeModal}
              className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}