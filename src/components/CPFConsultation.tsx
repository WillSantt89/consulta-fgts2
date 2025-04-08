import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import CSVImport from './CSVImport';
import ResultsDisplay from './ResultsDisplay';
import { Client } from '../types';

interface CPFConsultationProps {
  clients: Client[];
  updateClients: (clients: Client[]) => void;
  showBatchImport: boolean;
  consultationType: 'individual' | 'batch';
}

const CPFConsultation = ({ clients, updateClients, showBatchImport, consultationType }: CPFConsultationProps) => {
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.length === 11;
  };

  const handleConsultation = () => {
    setError('');
    setLoading(true);

    if (!validateCPF(cpf)) {
      setError('CPF inválido. O CPF deve conter 11 dígitos.');
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      const cleanCPF = cpf.replace(/[^\d]/g, '');
      
      // Check if client already exists
      const existingClient = clients.find(client => client.cpf === cleanCPF);
      
      if (existingClient) {
        setResults([existingClient]);
      } else {
        // Create new client with random balance
        const newClient: Client = {
          id: Date.now().toString(),
          cpf: cleanCPF,
          name: name || `Cliente ${cleanCPF.substring(0, 3)}`,
          balance: Math.floor(Math.random() * 10000) / 100,
          status: Math.random() > 0.3 ? 'regular' : 'irregular',
          lastConsultation: new Date().toISOString(),
          consultationType
        };
        
        updateClients([...clients, newClient]);
        setResults([newClient]);
      }
      
      setLoading(false);
    }, 1000);
  };

  const handleBatchResults = (batchResults: Client[]) => {
    setResults(batchResults);
    updateClients([...clients, ...batchResults.filter(newClient => 
      !clients.some(existingClient => existingClient.cpf === newClient.cpf)
    )]);
  };

  return (
    <div className="space-y-6">
      {showBatchImport ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Consulta em Lote</h2>
          <CSVImport onResults={handleBatchResults} consultationType={consultationType} />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Consulta Individual</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="Digite o CPF (apenas números)"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                placeholder="Digite o nome do cliente"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={handleConsultation} disabled={loading}>
              {loading ? 'Consultando...' : 'Consultar'}
            </Button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <ResultsDisplay results={results} />
      )}
    </div>
  );
};

export default CPFConsultation;
