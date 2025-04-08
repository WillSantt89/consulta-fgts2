import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Client } from '../types';

interface CSVImportProps {
  onResults: (results: Client[]) => void;
  consultationType: 'individual' | 'batch';
}

const CSVImport = ({ onResults, consultationType }: CSVImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.length === 11;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const processCSV = (text: string) => {
    const lines = text.split('\n');
    const results: Client[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const [cpf, name] = line.split(',').map(item => item.trim());
      
      if (!validateCPF(cpf)) {
        errors.push(`Linha ${index + 1}: CPF inválido (${cpf})`);
        return;
      }

      const cleanCPF = cpf.replace(/[^\d]/g, '');
      
      results.push({
        id: `${Date.now()}-${index}`,
        cpf: cleanCPF,
        name: name || `Cliente ${cleanCPF.substring(0, 3)}`,
        balance: Math.floor(Math.random() * 10000) / 100,
        status: Math.random() > 0.3 ? 'regular' : 'irregular',
        lastConsultation: new Date().toISOString(),
        consultationType
      });
    });

    if (errors.length > 0) {
      setError(`Erros encontrados:\n${errors.join('\n')}`);
    }

    return results;
  };

  const handleImport = () => {
    if (!file) {
      setError('Por favor, selecione um arquivo CSV');
      return;
    }

    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const results = processCSV(text);
        
        if (results.length > 0) {
          onResults(results);
        }
      } catch (err) {
        setError('Erro ao processar o arquivo CSV');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Erro ao ler o arquivo');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-gray-600">
          Faça upload de um arquivo CSV com CPFs e nomes (opcional) no formato:
          <br />
          <code className="bg-gray-100 px-1">CPF,Nome</code>
        </p>
        <Input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
        />
      </div>
      
      {error && (
        <div className="bg-red-50 p-3 rounded text-red-600 text-sm whitespace-pre-line">
          {error}
        </div>
      )}
      
      <Button onClick={handleImport} disabled={!file || loading}>
        {loading ? 'Processando...' : 'Importar e Consultar'}
      </Button>
    </div>
  );
};

export default CSVImport;
