import React, { useState } from 'react';
import { Client } from '../types';
import CSVImport from './CSVImport';
import ResultsDisplay from './ResultsDisplay';

interface CPFConsultationProps {
  clients: Client[];
  updateClients: (clients: Client[]) => void;
  showBatchImport: boolean;
  consultationType: 'individual' | 'batch';
}

const CPFConsultation = ({ 
  clients, 
  updateClients, 
  showBatchImport,
  consultationType
}: CPFConsultationProps) => {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter clients based on consultation type
  const filteredClients = clients.filter(
    client => client.consultationType === consultationType
  );

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.length === 11;
  };

  const formatCPF = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setCpf(formattedCPF);
    if (error) setError(null);
  };

  const handleConsultation = async () => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    if (!validateCPF(cleanCPF)) {
      setError('CPF inválido. Deve conter 11 dígitos.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if CPF already exists
      const existingIndex = clients.findIndex(c => c.cpf === cleanCPF && c.consultationType === consultationType);
      
      // Create new client object
      const newClient: Client = {
        id: existingIndex >= 0 ? clients[existingIndex].id : crypto.randomUUID(),
        cpf: cleanCPF,
        status: 'pending',
        consultationDate: new Date().toISOString(),
        consultationType
      };
      
      // Make API call to the provided endpoint
      const response = await fetch('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cleanCPF })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process API response
      if (data && data.success) {
        newClient.status = 'success';
        newClient.name = data.name;
        newClient.birthDate = data.birthDate;
        newClient.situation = data.situation;
        newClient.approvedValue = data.approvedValue;
        newClient.bank = data.bank;
        setSuccess('Consulta realizada com sucesso!');
      } else {
        newClient.status = 'error';
        newClient.error = data.message || 'CPF não encontrado na base de dados.';
        setError(newClient.error);
      }
      
      // Update clients list
      let updatedClients;
      if (existingIndex >= 0) {
        updatedClients = [...clients];
        updatedClients[existingIndex] = newClient;
      } else {
        updatedClients = [...clients, newClient];
      }
      
      updateClients(updatedClients);
      setCpf('');
    } catch (err) {
      setError('Erro ao realizar consulta. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && cpf.replace(/[^\d]/g, '').length === 11) {
      handleConsultation();
    }
  };

  const handleImport = (importedClients: Client[]) => {
    const newClients = [...clients, ...importedClients];
    updateClients(newClients);
    setSuccess(`Importação concluída! ${importedClients.length} CPFs processados.`);
  };

  return (
    <div>
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {consultationType === 'individual' ? 'Consulta Individual de CPF' : 'Consulta de CPF para Campanha'}
        </h2>
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4 flex items-center fade-in">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
            <button 
              className="ml-auto text-green-600 hover:text-green-800"
              onClick={() => setSuccess(null)}
              aria-label="Fechar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="cpf-input" className="form-label">
            CPF do Cliente
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <input
                id="cpf-input"
                type="text"
                value={cpf}
                onChange={handleCPFChange}
                onKeyDown={handleKeyDown}
                placeholder="000.000.000-00"
                className="form-input"
                disabled={loading}
                maxLength={14}
                aria-describedby={error ? "cpf-error" : undefined}
              />
              {error && (
                <div id="cpf-error" className="form-error flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
            
            <div>
              <button
                onClick={handleConsultation}
                disabled={loading}
                className="btn btn-primary w-full md:w-auto"
                aria-label="Consultar CPF"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="loading-spinner mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Consultando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Consultar
                  </span>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Digite o CPF completo com 11 dígitos. A consulta verificará a situação do cliente.
          </p>
        </div>
      </div>

      {showBatchImport && <CSVImport onImport={handleImport} />}

      <ResultsDisplay clients={filteredClients} />
    </div>
  );
};

export default CPFConsultation;
