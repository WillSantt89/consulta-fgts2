import { useMemo, useState } from 'react';
import { Client, DashboardMetrics } from '../types';
import ResultsDisplay from './ResultsDisplay';

interface DashboardProps {
  clients: Client[];
}

const Dashboard = ({ clients }: DashboardProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const metrics: DashboardMetrics = useMemo(() => {
    return {
      totalClients: clients.length,
      pendingConsultations: clients.filter(client => client.status === 'pending').length,
      successfulConsultations: clients.filter(client => client.status === 'success').length,
      failedConsultations: clients.filter(client => client.status === 'error').length
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Status filter
      if (statusFilter !== 'all' && client.status !== statusFilter) {
        return false;
      }
      
      // Date filter
      if (dateFilter && client.consultationDate) {
        const filterDate = new Date(dateFilter);
        const clientDate = new Date(client.consultationDate);
        
        if (filterDate.toDateString() !== clientDate.toDateString()) {
          return false;
        }
      }
      
      return true;
    });
  }, [clients, statusFilter, dateFilter]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Total de Clientes</h3>
          <p className="text-2xl">{metrics.totalClients}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Pendentes</h3>
          <p className="text-2xl text-yellow-500">{metrics.pendingConsultations}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Sucesso</h3>
          <p className="text-2xl text-green-500">{metrics.successfulConsultations}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Falhas</h3>
          <p className="text-2xl text-red-500">{metrics.failedConsultations}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Status</label>
          <select
            className="border rounded p-2 w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Data</label>
          <input
            type="date"
            className="border rounded p-2 w-full"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <ResultsDisplay clients={filteredClients} />
    </div>
  );
};

export default Dashboard;
