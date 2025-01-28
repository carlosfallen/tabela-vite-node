import { useEffect, useState } from 'react';
import { useDevicesStore } from '../store/devices';
import { Activity, Power, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { Device } from '../types';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

const socket = io('http://10.0.11.150:3000');

export default function Devices() {
  const { user } = useAuthStore();
  const { devices, setDevices, updateDeviceStatus } = useDevicesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Device; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (!user?.token) {
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
        setDevices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Fetch devices error:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();

    socket.on('deviceStatusUpdate', ({ id, status }) => {
      updateDeviceStatus(id, status);
    });

    return () => {
      socket.off('deviceStatusUpdate');
    };
  }, [setDevices, updateDeviceStatus, user]);

  useEffect(() => {
    const filtered = devices.filter(device => 
      Object.values(device).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredDevices(filtered);
  }, [devices, searchTerm]);

  const handleSort = (key: keyof Device) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    const sorted = [...filteredDevices].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredDevices(sorted);
  };

  const StatusIndicator = ({ status }: { status: number }) => (
    <span className={`
      inline-flex items-center justify-center w-6 h-6 rounded-full
      ${status === 1 
        ? 'bg-emerald-100 text-emerald-600' 
        : 'bg-red-100 text-red-600'}
    `}>
      {status === 1 ? <Activity className="w-3 h-3" /> : <Power className="w-3 h-3" />}
    </span>
  );

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const DesktopView = () => (
    <div className="hidden md:block">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['IP', 'Nome', 'Tipo', 'Usuário', 'Setor', 'Status'].map((header, index) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header.toLowerCase() as keyof Device)}
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{header}</span>
                      {sortConfig?.key === header.toLowerCase() && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {device.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {device.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {device.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {device.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {device.sector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusIndicator status={device.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const MobileView = () => {
    const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);

    return (
      <div className="md:hidden space-y-4">
        {filteredDevices.map((device) => (
          <div
            key={device.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200"
          >
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setExpandedDeviceId(expandedDeviceId === device.id ? null : device.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusIndicator status={device.status} />
                  <h3 className="text-lg font-medium text-gray-900">{device.name}</h3>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 
                    ${expandedDeviceId === device.id ? 'rotate-180' : ''}`}
                />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>IP: {device.ip}</p>
              </div>
            </div>

            {expandedDeviceId === device.id && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="capitalize">{device.type}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Usuário:</span>
                    <span>{device.user}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Setor:</span>
                    <span>{device.sector}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Dispositivos</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Buscar dispositivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      <DesktopView />
      <MobileView />
    </div>
  );
}