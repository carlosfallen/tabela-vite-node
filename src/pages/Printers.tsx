import { useEffect, useState } from 'react';
import type { Printer } from '../types';
import { Activity, Power, Printer as PrinterIcon } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { Switch } from '../components/ui/switch';

export default function Printers() {
  const { user } = useAuthStore();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPrinters, setUpdatingPrinters] = useState<Set<number>>(new Set());

  const fetchPrinters = async () => {
    try {
      if (!user?.token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetch('http://10.0.11.150:3000/api/printers', {
        headers: {
          Authorization: `Bearer ${user.token}`,
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

  useEffect(() => {
    fetchPrinters();
  }, [user]);

  const handlePrinterOnlineChange = async (printerId: number, currentOnline: number) => {
    if (updatingPrinters.has(printerId)) return;
  
    setUpdatingPrinters(prev => new Set(prev).add(printerId));
  
    try {
      if (!user?.token) {
        throw new Error('Authentication token is missing');
      }
  
      const response = await fetch(`http://10.0.11.150:3000/api/printers/${printerId}/online`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ online: currentOnline }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update printer status');
      }
  
      // Atualiza o estado local diretamente após a confirmação da atualização
      setPrinters(prevPrinters =>
        prevPrinters.map(printer =>
          printer.id === printerId ? { ...printer, online: currentOnline } : printer
        )
      );
  
    } catch (error) {
      console.error('Error updating printer online status:', error);
    } finally {
      setUpdatingPrinters(prev => {
        const next = new Set(prev);
        next.delete(printerId);
        return next;
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        Error: {error}
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
                  {printer.status === 1 ? 'Online' : 'Offline'}
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

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {printer.online === 1 ? 'Conluido' : 'Pendente'}
                </span>
                <Switch
                  checked={printer.online === 1}
                  onCheckedChange={(checked) => handlePrinterOnlineChange(printer.id, checked ? 1 : 0)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}