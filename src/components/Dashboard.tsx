import { useState, useEffect } from 'react';
import { Client, DashboardMetrics } from '../types';

interface DashboardProps {
  clients: Client[];
}

const Dashboard = ({ clients }: DashboardProps) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    pendingConsultations: 0,
    successfulConsultations: 0,
    failedConsultations: 0
  });
  
  const [filter, setFilter] = useState<'all' | 'individual' | 'batch'>('all');

  useEffect(() => {
    // Filter clients based on the selected filter
    const filteredClients = filter === 'all' 
      ? clients 
      : clients.filter(client => 
          client.consultationType === filter || 
          // For backward compatibility with existing data
          (filter === 'individual' && !client.consultationType && !client.id.startsWith('import-')) ||
          (filter === 'batch' && !client.consultationType && client.id.startsWith('import-'))
        );
    
    // Calculate metrics
    const newMetrics: DashboardMetrics = {
      totalClients: filteredClients.length,
      pendingConsultations: filteredClients.filter(client => client.status === 'pending').length,
      successfulConsultations: filteredClients.filter(client => client.status === 'success').length,
      failedConsultations: filteredClients.filter(client => client.status === 'error').length
    };
    
    setMetrics(newMetrics);
  }, [clients, filter]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por tipo de consulta:</label>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button
            className={`px-4 py-2 rounded ${filter === 'individual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('individual')}
          >
            Individuais
          </button>
          <button
            className={`px-4 py-2 rounded ${filter === 'batch' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('batch')}
          >
            Em Lote
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total de CPFs</h3>
          <p className="text-3xl font-bold mt-2">{metrics.totalClients}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Consultas Pendentes</h3>
          <p className="text-3xl font-bold mt-2 text-yellow-500">{metrics.pendingConsultations}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Consultas com Sucesso</h3>
          <p className="text-3xl font-bold mt-2 text-green-500">{metrics.successfulConsultations}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Consultas com Erro</h3>
          <p className="text-3xl font-bold mt-2 text-red-500">{metrics.failedConsultations}</p>
        </div>
      </div>
      
      {/* Additional charts or detailed statistics could be added here */}
    </div>
  );
};

export default Dashboard;
