import { useState } from 'react';
import { Client } from '../types';

interface CSVImportProps {
  onImport: (clients: Client[]) => void;
}

const CSVImport = ({ onImport }: CSVImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const processCSV = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo CSV');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      
      // Handle different line break formats (CRLF, LF)
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        throw new Error('O arquivo CSV está vazio');
      }
      
      // Check if the first line is a header
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('cpf') ? 1 : 0;
      
      const clients: Client[] = [];
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          // Split by comma or semicolon
          const parts = line.includes(';') ? line.split(';') : line.split(',');
          
          // Get the CPF from the first column
          let cpf = parts[0].trim().replace(/\D/g, '');
          
          // Ensure CPF has 11 digits with leading zeros
          cpf = cpf.padStart(11, '0');
          
          if (cpf.length !== 11) {
            console.warn(`CPF inválido na linha ${i + 1}: ${cpf}`);
            continue;
          }
          
          // Create a client object with a unique ID
          const client: Client = {
            id: `import-${Date.now()}-${i}`,
            cpf,
            status: 'pending',
            consultationDate: new Date().toISOString(),
            retryCount: 0,
            consultationType: 'batch'
          };
          
          clients.push(client);
        }
      }
      
      if (clients.length === 0) {
        throw new Error('Nenhum CPF válido encontrado no arquivo');
      }
      
      onImport(clients);
      setSuccess(`${clients.length} CPFs importados com sucesso`);
      setFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      console.error('Error processing CSV:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar o arquivo CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Importar CPFs em Lote</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Faça upload de um arquivo CSV contendo uma lista de CPFs (um por linha).
        </p>
        <input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        onClick={processCSV}
        disabled={loading || !file}
      >
        {loading ? 'Processando...' : 'Importar e Consultar'}
      </button>
      
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </div>
  );
};

export default CSVImport;
