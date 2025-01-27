import { useEffect, useState } from 'react';
import { useDevicesStore } from '../store/devices';
import { Activity, Power} from 'lucide-react';
import type { Device } from '../types';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth';
const socket = io('http://10.0.11.150:3000');

export default function Devices() {
  const { user } = useAuthStore(); // Get user from auth store
  const { devices, setDevices, updateDeviceStatus } = useDevicesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Ensure token is available
        if (!user || !user.token) {
          throw new Error('Authentication token is missing');
        }

        const response = await fetch('http://10.0.11.150:3000/api/devices', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch devices');
        }

        const data: Device[] = await response.json();
        // Ensure data is an array
        setDevices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Fetch devices error:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();

    // Socket.io event listeners
    socket.on('deviceStatusUpdate', ({ id, status }) => {
      updateDeviceStatus(id, status);
    });

    return () => {
      socket.off('deviceStatusUpdate');
    };
  }, [setDevices, updateDeviceStatus, user]);

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  // Desktop view
  const DesktopView = () => (
    <div className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Setor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {(devices || []).map((device) => (
              <tr key={device.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {device.ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {device.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {device.user}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {device.sector}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    device.status === 1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {device.status === 1 ? (
                    <Activity className="w-3 h-3" />
                  ) : (
                    <Power className="w-3 h-3" />
                  )}
                </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

// Mobile view
const MobileView = () => {
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null); // Estado para controlar o dispositivo expandido

  const toggleDeviceDetails = (deviceId: number) => { // Defina o tipo de deviceId como number
    if (expandedDeviceId === deviceId) {
      setExpandedDeviceId(null); // Fecha se já estiver expandido
    } else {
      setExpandedDeviceId(deviceId); // Expande o dispositivo clicado
    }
  };

  return (
    <div className="md:hidden space-y-4">
      {(devices || []).map((device) => (
        <div
          key={device.id}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
          <div
            className="p-4 cursor-pointer" // Adiciona cursor pointer para indicar que é clicável
            onClick={() => toggleDeviceDetails(device.id)} // Expande/recolhe ao clicar
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{device.name}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  device.status === 1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {device.status === 1 ? (
                  <Activity className="w-3 h-3 mr-1" />
                ) : (
                  <Power className="w-3 h-3 mr-1" />
                )}
                {device.status}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p>IP: {device.ip}</p>
            </div>
          </div>

          {/* Detalhes expandidos */}
          {expandedDeviceId === device.id && (
            <div className="p-4 border-t border-gray-200">
              <p className="capitalize text-sm text-gray-500">Type: {device.type}</p>
              <p className="text-sm text-gray-500">Usuário: {device.user}</p>
              <p className="text-sm text-gray-500">Setor: {device.sector}</p>
              {/* Adicione mais informações aqui, se necessário */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dispositivos</h1>
      </div>
      <DesktopView />
      <MobileView />
    </div>
  );
}