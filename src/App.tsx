import { useState } from 'react';
import Dashboard from './components/Dashboard';
import CPFConsultation from './components/CPFConsultation';
import { Client } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'consultation' | 'campaign'>('dashboard');
  const [clients, setClients] = useState<Client[]>(() => {
    const savedClients = localStorage.getItem('clients');
    return savedClients ? JSON.parse(savedClients) : [];
  });

  const updateClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('clients', JSON.stringify(newClients));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sistema de Consulta de CPF</h1>
      
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 ${activeTab === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'consultation' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('consultation')}
        >
          Consulta saldo
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'campaign' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('campaign')}
        >
          Campanha em Lote
        </button>
      </div>

      {activeTab === 'dashboard' && <Dashboard clients={clients} />}
      {activeTab === 'consultation' && <CPFConsultation clients={clients} updateClients={updateClients} showBatchImport={false} consultationType="individual" />}
      {activeTab === 'campaign' && <CPFConsultation clients={clients} updateClients={updateClients} showBatchImport={true} consultationType="batch" />}
    </div>
  );
}

export default App;
