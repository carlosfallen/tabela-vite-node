import { useEffect, useState } from 'react';
import type { Box } from '../types';
import { Activity, Power, RefreshCw } from 'lucide-react';
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
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
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

  const togglePower = async (id: number, currentStatus: 'on' | 'off') => {
    
    try {
      if (!user || !user.token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetch(`http://10.0.11.150:3000/api/boxes/${id}/power`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: currentStatus === 'on' ? 'off' : 'on' }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle box power');
      }

      const updatedBox = await response.json();
      setBoxes((prev) =>
        prev.map((box) => (box.id === id ? updatedBox : box))
      );
    } catch (error) {
      console.error('Failed to toggle box power:', error);
    }
  };

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Caixas</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {boxes.map((box) => (
          <div
            key={box.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{box.name}</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    box.status === 1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {box.status === 1 ? (
                    <Activity className="w-3 h-3 mr-1" />
                  ) : (
                    <Power className="w-3 h-3 mr-1" />
                  )}
                  {box.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="mt-1 text-sm font-medium">{box.ip}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Power Status</p>
                  <div className="mt-1 flex items-center">
                    <Power
                      className={`w-4 h-4 mr-2 ${
                        box.powerStatus === 'on'
                          ? 'text-green-500'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className="text-sm font-medium capitalize">
                      {box.powerStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => togglePower(box.id, box.powerStatus)}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                    box.powerStatus === 'on'
                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {box.powerStatus === 'on' ? 'Turn Off' : 'Turn On'}
                </button>

                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus -200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Ping Box
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}