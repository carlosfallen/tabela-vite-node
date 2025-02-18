import { useEffect, useState } from 'react';
import { Monitor, CheckCircle2, Clock } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import type { Box } from '../types';
import { useAuthStore } from '../store/auth';

export default function Boxes() {
  const { user } = useAuthStore();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        if (!user || !user.token) {
          throw new Error('Authentication token is missing');
        }

        const response = await fetch('http://10.0.11.150:3000/api/boxes', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch boxes');
        }

        const data: Box[] = await response.json();
        setBoxes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch boxes:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoxes();
  }, [user]);

  const togglePowerStatus = async (device_id: number, newPowerStatus: 0 | 1) => {
    try {
      if (!user || !user.token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetch(`http://10.0.11.150:3000/api/boxes/${device_id}/power-status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ power_status: newPowerStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update box power status');
      }

      setBoxes((prev) =>
        prev.map((box) =>
          box.device_id === device_id
            ? { ...box, power_status: newPowerStatus }
            : box
        )
      );
    } catch (error) {
      console.error('Failed to update box power status:', error);
    }
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Caixas</h1>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 dark:bg-green-800 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Concluídas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Pendentes</span>
          </div>
        </div>
      </div>

      <ul className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {boxes.map((box) => (
          <li
            key={box.device_id}
            className={`
              relative overflow-hidden rounded-2xl shadow-sm transition-all duration-200
              ${box.power_status === 1 
                ? 'bg-green-50 dark:bg-green-800/20 border-2 border-green-200 dark:border-green-800' 
                : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'}
            `}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Monitor className={`w-6 h-6 ${box.power_status === 1 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  <div>
                    <h3 className="text-lg font-medium">{box.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{box.ip}</p>
                  </div>
                </div>
                <Switch
                  checked={box.power_status === 1}
                  onCheckedChange={(checked) => togglePowerStatus(box.device_id, checked ? 1 : 0)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    box.status === 1
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {box.status === 1 ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex items-center gap-2">
                  {box.power_status === 1 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Concluído</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendente</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}