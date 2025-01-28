import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import { Switch } from '../components/ui/switch'; // Certifique-se de usar o Switch correto
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
            ? { ...box, power_status: newPowerStatus } // Atualiza apenas o power_status
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
        <h1 className="text-2xl font-semibold text-gray-900">Caixas</h1>
      </div>

      <ul className="divide-y divide-gray-200">
        {boxes.map((box) => (
          <li
            key={box.device_id}
            className="flex items-center justify-between py-4 px-6 bg-white rounded-lg shadow mb-4"
          >
            <div className="flex items-center">
              <Monitor className="w-6 h-6 text-gray-500 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{box.name}</h3>
                <p className="text-sm text-gray-500">{box.ip}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  box.status === 1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {box.status === 1 ? 'Ativo' : 'Inativo'}
              </span>
              <span className="text-sm text-gray-500">
                  {box.power_status === 1 ? 'Conluido' : 'Pendente'}
                </span>
              <Switch
                checked={box.power_status === 1}
                onCheckedChange={(checked) => togglePowerStatus(box.device_id, checked ? 1 : 0)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
