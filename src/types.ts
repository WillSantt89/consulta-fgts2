export interface Client {
  id: string;
  cpf: string;
  status: 'pending' | 'success' | 'error';
  consultationDate?: string;
  name?: string;
  birthDate?: string;
  situation?: string;
  log?: string;
  approvedValue?: string;
  bank?: string;
  error?: string;
  retryCount?: number;
  consultationType?: 'individual' | 'batch';
}

export interface DashboardMetrics {
  totalClients: number;
  pendingConsultations: number;
  successfulConsultations: number;
  failedConsultations: number;
}
