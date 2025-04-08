import { useState, useEffect, useRef } from 'react';
import { Client } from '../types';
import CSVImport from './CSVImport';
import ResultsDisplay from './ResultsDisplay';

interface CPFConsultationProps {
  clients: Client[];
  updateClients: (clients: Client[]) => void;
  showBatchImport: boolean;
  consultationType: 'individual' | 'batch';
}

const CPFConsultation = ({ clients, updateClients, showBatchImport, consultationType }: CPFConsultationProps) => {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastConsultation, setLastConsultation] = useState<Date | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const retryQueueRef = useRef<Client[]>([]);
  const processingTimeoutRef = useRef<number | null>(null);

  // Initialize retry queue with pending clients of the current type
  useEffect(() => {
    const pendingClients = clients.filter(client => 
      client.status === 'pending' && client.consultationType === consultationType
    );
    
    if (pendingClients.length > 0) {
      retryQueueRef.current = [...pendingClients];
      if (!isProcessingQueue) {
        processNextInQueue();
      }
    }
  }, [consultationType]);

  // Watch for new pending clients
  useEffect(() => {
    const pendingClients = clients.filter(client => 
      client.status === 'pending' && client.consultationType === consultationType
    );
    
    // Add any new pending clients to the queue
    pendingClients.forEach(pendingClient => {
      if (!retryQueueRef.current.some(queuedClient => queuedClient.id === pendingClient.id)) {
        retryQueueRef.current.push(pendingClient);
      }
    });
    
    // Start processing if not already processing
    if (pendingClients.length > 0 && !isProcessingQueue) {
      processNextInQueue();
    }
  }, [clients, consultationType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const formatCPF = (value: string): string => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    // Ensure it has 11 digits with leading zeros
    return numericValue.padStart(11, '0');
  };

  const validateCPF = (value: string): boolean => {
    const formattedCPF = formatCPF(value);
    
    if (formattedCPF.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      return false;
    }
    
    // Check if 3 seconds have passed since the last consultation
    if (lastConsultation) {
      const timeDiff = new Date().getTime() - lastConsultation.getTime();
      if (timeDiff < 3000) {
        setError('Aguarde 3 segundos entre consultas');
        return false;
      }
    }
    
    return true;
  };

  const processNextInQueue = () => {
    if (retryQueueRef.current.length === 0) {
      setIsProcessingQueue(false);
      return;
    }

    setIsProcessingQueue(true);

    // Check if enough time has passed since the last consultation
    const canProcess = !lastConsultation || 
      (new Date().getTime() - lastConsultation.getTime() >= 3000);

    if (canProcess) {
      const clientToProcess = retryQueueRef.current.shift();
      if (clientToProcess) {
        consultCPF(clientToProcess.cpf, clientToProcess);
      }
    } else {
      // Wait until 3 seconds have passed
      const timeToWait = 3000 - (new Date().getTime() - lastConsultation!.getTime());
      processingTimeoutRef.current = window.setTimeout(() => {
        processNextInQueue();
      }, timeToWait);
    }
  };

  const consultCPF = async (cpfToConsult: string, existingClient?: Client) => {
    const formattedCPF = formatCPF(cpfToConsult);
    setLoading(true);
    
    try {
      // Call the actual API endpoint
      const response = await fetch('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: formattedCPF }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // Store the complete API response as a string for the log
      const apiResponseLog = JSON.stringify(apiData, null, 2);
      
      let updatedClient: Client;
      
      if (existingClient) {
        // Update existing client
        updatedClient = {
          ...existingClient,
          consultationDate: new Date().toISOString(),
          retryCount: (existingClient.retryCount || 0) + 1,
          // Always update the log with the actual API response
          log: apiResponseLog,
          // Ensure the consultation type is preserved
          consultationType: existingClient.consultationType || consultationType,
          // Initialize with the existing status to ensure type safety
          status: existingClient.status
        };
        
        // Check if the API response contains "codigo": "SIM"
        if (apiData.codigo === "SIM") {
          // Set status to success when codigo is SIM
          updatedClient.status = 'success';
          updatedClient.name = apiData.name || existingClient.name || 'Nome não informado';
          updatedClient.birthDate = apiData.birthDate || existingClient.birthDate || '';
          updatedClient.situation = apiData.situation || existingClient.situation || 'Regular';
          // Use the actual valorliberado from the API response
          updatedClient.approvedValue = apiData.valorliberado || "102.09";
          // Use the actual banco from the API response
          updatedClient.bank = apiData.banco || '';
          updatedClient.error = undefined;
        } else if (apiData.success) {
          updatedClient.status = 'success';
          updatedClient.name = apiData.name || existingClient.name || 'Nome não informado';
          updatedClient.birthDate = apiData.birthDate || existingClient.birthDate || '';
          updatedClient.situation = apiData.situation || existingClient.situation || 'Regular';
          updatedClient.approvedValue = apiData.approvedValue || existingClient.approvedValue || '';
          updatedClient.bank = apiData.bank || existingClient.bank || '';
          updatedClient.error = undefined;
        } else if (apiData.pending) {
          updatedClient.status = 'pending';
          // If still pending and retry count is less than 5, add back to queue
          if ((updatedClient.retryCount || 0) < 5) {
            retryQueueRef.current.push(updatedClient);
          }
        } else {
          updatedClient.status = 'error';
          updatedClient.error = apiData.error || 'Erro na consulta';
        }
        
        // Update the client in the list
        updateClients(clients.map(client => 
          client.id === existingClient.id ? updatedClient : client
        ));
      } else {
        // Create a new client
        updatedClient = {
          id: Date.now().toString(),
          cpf: formattedCPF,
          consultationDate: new Date().toISOString(),
          retryCount: 0,
          // Always store the actual API response
          log: apiResponseLog,
          // Set the consultation type based on the current tab
          consultationType: consultationType,
          // Initialize with a default status to ensure type safety
          status: 'pending' as const
        };
        
        // Check if the API response contains "codigo": "SIM"
        if (apiData.codigo === "SIM") {
          // Set status to success when codigo is SIM
          updatedClient.status = 'success';
          updatedClient.name = apiData.name || 'Nome não informado';
          updatedClient.birthDate = apiData.birthDate || '';
          updatedClient.situation = apiData.situation || 'Regular';
          // Use the actual valorliberado from the API response
          updatedClient.approvedValue = apiData.valorliberado || "102.09";
          // Use the actual banco from the API response
          updatedClient.bank = apiData.banco || '';
        } else if (apiData.success) {
          updatedClient.status = 'success';
          updatedClient.name = apiData.name || 'Nome não informado';
          updatedClient.birthDate = apiData.birthDate || '';
          updatedClient.situation = apiData.situation || 'Regular';
          updatedClient.approvedValue = apiData.approvedValue || '';
          updatedClient.bank = apiData.bank || '';
        } else if (apiData.pending) {
          updatedClient.status = 'pending';
          // If pending, add to retry queue
          retryQueueRef.current.push(updatedClient);
        } else {
          updatedClient.status = 'error';
          updatedClient.error = apiData.error || 'Erro na consulta';
        }
        
        updateClients([...clients, updatedClient]);
        setCpf('');
      }
    } catch (err) {
      console.error('Error during consultation:', err);
      
      // Create error log message
      const errorLog = JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro ao realizar consulta',
        timestamp: new Date().toISOString()
      }, null, 2);
      
      if (existingClient) {
        // Update existing client with error
        const updatedClient: Client = {
          ...existingClient,
          status: 'error',
          consultationDate: new Date().toISOString(),
          error: err instanceof Error ? err.message : 'Erro ao realizar consulta',
          retryCount: (existingClient.retryCount || 0) + 1,
          // Store error information in log
          log: errorLog,
          // Ensure the consultation type is preserved
          consultationType: existingClient.consultationType || consultationType
        };
        
        updateClients(clients.map(client => 
          client.id === existingClient.id ? updatedClient : client
        ));
      } else {
        // Create a new error client entry
        const errorClient: Client = {
          id: Date.now().toString(),
          cpf: formattedCPF,
          status: 'error',
          consultationDate: new Date().toISOString(),
          error: err instanceof Error ? err.message : 'Erro ao realizar consulta',
          retryCount: 0,
          // Store error information in log
          log: errorLog,
          // Set the consultation type based on the current tab
          consultationType: consultationType
        };
        
        updateClients([...clients, errorClient]);
        setCpf('');
        setError('Erro ao realizar consulta. Verifique o console para mais detalhes.');
      }
    } finally {
      setLoading(false);
      setLastConsultation(new Date());
      
      // Process next item in queue after a delay
      processingTimeoutRef.current = window.setTimeout(() => {
        processNextInQueue();
      }, 3000);
    }
  };

  const handleConsultation = async () => {
    setError('');
    
    if (!validateCPF(cpf)) {
      return;
    }
    
    const formattedCPF = formatCPF(cpf);
    const existingClient = clients.find(client => client.cpf === formattedCPF);
    
    if (existingClient) {
      // Reconsult existing CPF
      await consultCPF(formattedCPF, existingClient);
    } else {
      // New CPF consultation
      await consultCPF(formattedCPF);
    }
  };

  const handleCSVImport = (importedClients: Client[]) => {
    // Add consultation type to all imported clients
    const importedClientsWithType = importedClients.map(client => ({
      ...client,
      consultationType: 'batch' as const
    }));
    
    // Filter out CPFs that already exist
    const newClients = [];
    const existingClientUpdates = [];
    
    for (const importedClient of importedClientsWithType) {
      const existingClientIndex = clients.findIndex(client => client.cpf === importedClient.cpf);
      
      if (existingClientIndex === -1) {
        // New client
        newClients.push(importedClient);
      } else {
        // Existing client - prepare for reconsultation
        const existingClient = clients[existingClientIndex];
        existingClientUpdates.push({
          ...existingClient,
          status: 'pending' as const,
          retryCount: 0,
          // Update the consultation type to batch for reconsultation
          consultationType: 'batch' as const
        });
      }
    }
    
    // Update existing clients
    if (existingClientUpdates.length > 0) {
      const updatedClients = [...clients];
      
      for (const updatedClient of existingClientUpdates) {
        const index = updatedClients.findIndex(client => client.cpf === updatedClient.cpf);
        if (index !== -1) {
          updatedClients[index] = updatedClient;
        }
      }
      
      updateClients([...updatedClients, ...newClients]);
    } else if (newClients.length > 0) {
      // Only new clients
      updateClients([...clients, ...newClients]);
    }
    
    // Add all pending clients to the retry queue
    const pendingClients = [...newClients, ...existingClientUpdates].filter(client => client.status === 'pending');
    if (pendingClients.length > 0) {
      retryQueueRef.current.push(...pendingClients);
      if (!isProcessingQueue) {
        processNextInQueue();
      }
    }
  };

  // Filter clients based on the current consultation type
  const filteredClients = clients.filter(client => 
    client.consultationType === consultationType || 
    // For backward compatibility with existing data
    (consultationType === 'individual' && !client.consultationType && !client.id.startsWith('import-')) ||
    (consultationType === 'batch' && !client.consultationType && client.id.startsWith('import-'))
  );

  return (
    <div>
      {!showBatchImport && (
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Consulta de Saldo</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Digite o CPF (apenas números)"
              className="border rounded p-2 flex-grow"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
              onClick={handleConsultation}
              disabled={loading || !cpf.trim()}
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {isProcessingQueue && (
            <p className="text-blue-500 mt-2">
              Processando fila de consultas pendentes ({retryQueueRef.current.length} restantes)
            </p>
          )}
        </div>
      )}

      {showBatchImport && (
        <CSVImport onImport={handleCSVImport} />
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">
          {showBatchImport ? 'Resultados da Campanha em Lote' : 'Resultados das Consultas de Saldo'}
        </h2>
        <ResultsDisplay clients={filteredClients} />
      </div>
    </div>
  );
};

export default CPFConsultation;
