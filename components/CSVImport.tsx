import React, { useState, useRef } from 'react';
import { Client } from '../types';

interface CSVImportProps {
  onImport: (clients: Client[]) => void;
}

const CSVImport = ({ onImport }: CSVImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCSV = async (text: string) => {
    const lines = text.split('\n');
    const clients: Client[] = [];
    const apiEndpoint = 'https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta';
    
    // Skip header row if present
    const startIndex = lines[0].toLowerCase().includes('cpf') ? 1 : 0;
    const validLines = lines.slice(startIndex).filter(line => line.trim());
    
    for (let i = 0; i < validLines.length; i++) {
      const line = validLines[i].trim();
      
      // Extract CPF from CSV line
      const cpf = line.split(',')[0].replace(/[^\d]/g, '');
      
      if (cpf.length !== 11) {
        console.warn(`CPF inválido ignorado: ${cpf}`);
        continue;
      }
      
      try {
        // Update progress
        setProgress(Math.round(((i + 1) / validLines.length) * 100));
        
        // Make API call for each CPF
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpf })
        });
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        
        const client: Client = {
          id: crypto.randomUUID(),
          cpf,
          status: data.success ? 'success' : 'error',
          consultationDate: new Date().toISOString(),
          consultationType: 'batch'
        };
        
        if (data.success) {
          client.name = data.name;
          client.birthDate = data.birthDate;
          client.situation = data.situation;
          client.approvedValue = data.approvedValue;
          client.bank = data.bank;
        } else {
          client.error = data.message || 'CPF não encontrado na base de dados.';
        }
        
        clients.push(client);
      } catch (err) {
        console.error(`Erro ao processar CPF ${cpf}:`, err);
        clients.push({
          id: crypto.randomUUID(),
          cpf,
          status: 'error',
          consultationDate: new Date().toISOString(),
          consultationType: 'batch',
          error: 'Erro ao consultar API'
        });
      }
    }
    
    return clients;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor, selecione um arquivo CSV válido.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Selecione um arquivo CSV para importar.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const text = await file.text();
      const clients = await processCSV(text);
      
      if (clients.length === 0) {
        setError('Nenhum CPF válido encontrado no arquivo.');
        return;
      }
      
      onImport(clients);
      setFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      setError('Erro ao processar o arquivo. Verifique o formato.');
      console.error(err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (!droppedFile.name.endsWith('.csv')) {
        setError('Por favor, selecione um arquivo CSV válido.');
        return;
      }
      
      setFile(droppedFile);
      setError(null);
      
      // Update file input
      if (fileInputRef.current) {
        // Create a DataTransfer object and add the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Importação em Lote (CSV)</h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />
        
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            {file ? file.name : 'Arraste e solte seu arquivo CSV aqui ou clique para selecionar'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            O arquivo deve conter uma coluna com CPFs (um por linha)
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary"
          disabled={loading}
        >
          Selecionar Arquivo
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      {loading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Processando...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {file && !loading ? `Arquivo selecionado: ${file.name}` : ''}
        </p>
        
        <button
          onClick={handleImport}
          disabled={loading || !file}
          className="btn btn-primary"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="loading-spinner mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CSVImport;
