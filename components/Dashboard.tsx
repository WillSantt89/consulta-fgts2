import React, { useState, useEffect } from 'react';
import { Client } from '../types';

interface DashboardProps {
  clients: Client[];
}

const Dashboard = ({ clients }: DashboardProps) => {
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  
  // Get unique banks from clients
  const banks = Array.from(new Set(
    clients
      .filter(client => client.status === 'success' && client.bank)
      .map(client => client.bank)
  ));
  
  // Apply filters when dependencies change
  useEffect(() => {
    let filtered = [...clients];
    
    // Filter by bank
    if (selectedBank !== 'all') {
      filtered = filtered.filter(client => client.bank === selectedBank);
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(client => new Date(client.consultationDate) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(client => new Date(client.consultationDate) <= end);
    }
    
    setFilteredClients(filtered);
  }, [clients, selectedBank, startDate, endDate]);
  
  // Calculate statistics
  const totalImportedClients = filteredClients.length;
  const totalConsultations = filteredClients.length;
  const clientsWithValue = filteredClients.filter(c => c.status === 'success' && c.approvedValue).length;
  
  // Calculate average ticket
  const totalApprovedValue = filteredClients
    .filter(c => c.status === 'success' && c.approvedValue)
    .reduce((acc, curr) => {
      const value = parseFloat(curr.approvedValue!.replace(/[^\d,]/g, '').replace(',', '.'));
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
    
  const averageTicket = clientsWithValue > 0 
    ? totalApprovedValue / clientsWithValue 
    : 0;
  
  // Handle filter reset
  const handleReset = () => {
    setSelectedBank('all');
    setStartDate('');
    setEndDate('');
  };
  
  // Handle quick date filters
  const handleQuickDateFilter = (filter: 'today' | 'yesterday' | 'lastWeek' | 'lastMonth') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start = new Date(today);
    let end = new Date(today);
    end.setHours(23, 59, 59, 999);
    
    switch (filter) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'lastWeek':
        start.setDate(today.getDate() - 7);
        break;
      case 'lastMonth':
        start.setMonth(today.getMonth() - 1);
        break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  return (
    <div>
      <div className="bg-blue-600 text-white p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Bank Filter */}
        <div>
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <label htmlFor="bank-filter" className="text-gray-600 font-medium">Filtrar por Banco</label>
          </div>
          <select
            id="bank-filter"
            className="form-input"
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
          >
            <option value="all">Todos os Bancos</option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>
        
        {/* Date Filter */}
        <div>
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <label className="text-gray-600 font-medium">Filtrar por Período</label>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              onClick={() => handleQuickDateFilter('today')}
            >
              Hoje
            </button>
            <button 
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              onClick={() => handleQuickDateFilter('yesterday')}
            >
              Ontem
            </button>
            <button 
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              onClick={() => handleQuickDateFilter('lastWeek')}
            >
              Última Semana
            </button>
            <button 
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              onClick={() => handleQuickDateFilter('lastMonth')}
            >
              Último Mês
            </button>
            <button 
              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
              onClick={handleReset}
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Imported Clients Card */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-blue-600 text-lg font-medium mb-2">Clientes Importados</h3>
              <p className="text-3xl font-bold text-blue-800">{totalImportedClients}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Total Consultations Card */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-purple-600 text-lg font-medium mb-2">Total de Consultas</h3>
              <p className="text-3xl font-bold text-purple-800">{totalConsultations}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full text-purple-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Clients with Value Card */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-green-600 text-lg font-medium mb-2">Clientes com Valor</h3>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-green-800">{clientsWithValue}</p>
                <p className="ml-2 text-sm text-green-600">
                  (R$ {totalApprovedValue.toFixed(2).replace('.', ',')})
                </p>
              </div>
            </div>
            <div className="bg-green-100 p-2 rounded-full text-green-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Average Ticket Card */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-yellow-600 text-lg font-medium mb-2">Ticket Médio</h3>
              <p className="text-3xl font-bold text-yellow-800">
                R$ {averageTicket.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full text-yellow-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Consultations Table */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Consultas Recentes</h2>
        </div>
        
        {filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients
                  .sort((a, b) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime())
                  .slice(0, 10)
                  .map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {client.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(client.consultationDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`status-badge ${
                            client.status === 'success'
                              ? 'status-success'
                              : client.status === 'error'
                              ? 'status-error'
                              : 'status-pending'
                          }`}
                        >
                          {client.status === 'success'
                            ? 'Sucesso'
                            : client.status === 'error'
                            ? 'Erro'
                            : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                        {client.status === 'success' ? client.name : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                        {client.status === 'success' ? client.approvedValue : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                        {client.status === 'success' ? client.bank : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">Nenhuma consulta encontrada com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
