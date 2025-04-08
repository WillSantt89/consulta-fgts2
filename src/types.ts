export interface Client {
  id: string;
  cpf: string;
  name: string;
  balance: number;
  status: 'regular' | 'irregular' | 'pending';
  lastConsultation: string;
  consultationType: 'individual' | 'batch';
}
