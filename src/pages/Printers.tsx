import { useEffect, useState } from 'react';
import type { Printer } from '../types';
import { Activity, Power, Printer as PrinterIcon } from 'lucide-react';
import { useAuthStore } from '../store/auth'; // Import auth store
import { Switch } from '../components/ui/switch'; // Supondo que você tenha um componente de switch

export default function Routers() {
  const { user } = useAuthStore(); // Get user from auth store
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        if (!user || !user.token) {
          throw new Error('Authentication token is missing');
        }

        const response = await fetch('http://10.0.11.150:3000/api/printers', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch printers');
        }

        const data: Printer[] = await response.json();
        setPrinters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Fetch printers error:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrinters();
  }, [user]);

  const handlePrinterOnlineChange = async (printerId: number, currentOnline: number) => {
    const newOnline = currentOnline === 1 ? 0 : 1; // Alterna entre 1 e 0
  
    try {
      // Envia a atualização para o servidor
      await fetch(`http://10.0.11.150:3000/api/printers/${printerId}/online`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ online: newOnline }),
      });
  
      // Atualiza o estado local após sucesso
      setPrinters((prevPrinters) =>
        prevPrinters.map((printer) =>
          printer.id === printerId ? { ...printer, online: newOnline } : printer
        )
      );
    } catch (error) {
      console.error('Error updating printer online status:', error);
    }
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
        <h1 className="text-2xl font-semibold text-gray-900">Impressoras</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {printers.map((printer) => (
          <div
            key={printer.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {printer.sector}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    printer.status === 1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {printer.status === 1 ? (
                    <Activity className="w-3 h-3 mr-1" />
                  ) : (
                    <Power className="w-3 h-3 mr-1" />
                  )}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="mt-1 text-sm font-medium">{printer.ip}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <div className="mt-1 flex items-center">
                    <PrinterIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm font-medium">{printer.model}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">N.PAT</p>
                  <p className="mt-1 text-sm font-medium">{printer.npat}</p>
                </div>
              </div>

              <div className="mt-6">
              <Switch
          checked={printer.online === 1} // Estado do switch baseado na variável online
          onCheckedChange={() => handlePrinterOnlineChange(printer.id, printer.online)}
        />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
