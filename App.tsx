import React, { useState } from 'react';
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Consulta de CPF</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <nav className="flex border-b">
            <button
              className={`py-3 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                activeTab === 'dashboard' ? 'tab-active' : 'tab-inactive'
              }`}
              onClick={() => setActiveTab('dashboard')}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Dashboard
              </span>
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                activeTab === 'consultation' ? 'tab-active' : 'tab-inactive'
              }`}
              onClick={() => setActiveTab('consultation')}
              aria-current={activeTab === 'consultation' ? 'page' : undefined}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Consulta Individual
              </span>
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                activeTab === 'campaign' ? 'tab-active' : 'tab-inactive'
              }`}
              onClick={() => setActiveTab('campaign')}
              aria-current={activeTab === 'campaign' ? 'page' : undefined}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Campanha em Lote
              </span>
            </button>
          </nav>
          
          <div className="p-6 fade-in">
            {activeTab === 'dashboard' && <Dashboard clients={clients} />}
            {activeTab === 'consultation' && <CPFConsultation clients={clients} updateClients={updateClients} showBatchImport={false} consultationType="individual" />}
            {activeTab === 'campaign' && <CPFConsultation clients={clients} updateClients={updateClients} showBatchImport={true} consultationType="batch" />}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Sistema de Consulta de CPF. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;
