import React, { useState } from 'react';
import { Client } from '../types';

interface ResultsDisplayProps {
  clients: Client[];
}

const ResultsDisplay = ({ clients }: ResultsDisplayProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cpf' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get only the most recent consultation for each CPF
  const uniqueClients = clients.reduce((acc: Client[], client) => {
    const existingIndex = acc.findIndex(c => c.cpf === client.cpf);
    
    if (existingIndex === -1) {
      acc.push(client);
    } else {
      const existingDate = new Date(acc[existingIndex].consultationDate).getTime();
      const currentDate = new Date(client.consultationDate).getTime();
      
      if (currentDate > existingDate) {
        acc[existingIndex] = client;
      }
    }
    
    return acc;
  }, []);
  
  // Filter clients
  const filteredClients = uniqueClients.filter(client => {
    const matchesSearch = 
      client.cpf.includes(searchTerm) || 
      (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      comparison = new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime();
    } else if (sortBy === 'cpf') {
      comparison = a.cpf.localeCompare(b.cpf);
    } else if (sortBy === 'name') {
      const nameA = a.name || '';
      const nameB = b.name || '';
      comparison = nameA.localeCompare(nameB);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Paginate clients
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleSort = (column: 'date' | 'cpf' | 'name') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="card" id="results-top">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold mb-4">Resultados da Consulta</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <label htmlFor="search" className="form-label">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                className="form-input pl-10"
                placeholder="Buscar por CPF ou nome..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="status-filter" className="form-label">Status</label>
            <select
              id="status-filter"
              className="form-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          {filteredClients.length} resultado(s) encontrado(s)
        </div>
      </div>
      
      {paginatedClients.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full responsive-table">
              <thead>
                <tr className="bg-gray-50">
                  <th 
                    className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('cpf')}
                  >
                    <div className="flex items-center">
                      CPF
                      {sortBy === 'cpf' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            sortOrder === 'asc' 
                              ? "M5 15l7-7 7 7" 
                              : "M19 9l-7 7-7-7"
                          } />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Data
                      {sortBy === 'date' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            sortOrder === 'asc' 
                              ? "M5 15l7-7 7 7" 
                              : "M19 9l-7 7-7-7"
                          } />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Nome
                      {sortBy === 'name' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            sortOrder === 'asc' 
                              ? "M5 15l7-7 7 7" 
                              : "M19 9l-7 7-7-7"
                          } />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 px-4" data-label="CPF">
                      {formatCPF(client.cpf)}
                    </td>
                    <td className="py-4 px-4" data-label="Data">
                      {new Date(client.consultationDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-4" data-label="Status">
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
                    <td className="py-4 px-4" data-label="Nome">
                      {client.status === 'success' ? client.name : '-'}
                    </td>
                    <td className="py-4 px-4" data-label="Valor">
                      {client.status === 'success' ? client.approvedValue : '-'}
                    </td>
                    <td className="py-4 px-4" data-label="Banco">
                      {client.status === 'success' ? client.bank : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredClients.length)}
                    </span> de <span className="font-medium">{filteredClients.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNumber = index + 1;
                      const isCurrentPage = pageNumber === currentPage;
                      
                      // Show only a window of pages around the current page
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              isCurrentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                      
                      // Add ellipsis
                      if (
                        (pageNumber === currentPage - 2 && pageNumber > 1) ||
                        (pageNumber === currentPage + 2 && pageNumber < totalPages)
                      ) {
                        return (
                          <span
                            key={pageNumber}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Próximo</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
              
              {/* Mobile pagination */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 
                      ? 'text-gray-300 bg-gray-50 cursor-not-allowed' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages 
                      ? 'text-gray-300 bg-gray-50 cursor-not-allowed' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum resultado encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros de busca.' 
              : 'Realize uma consulta para ver os resultados aqui.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
