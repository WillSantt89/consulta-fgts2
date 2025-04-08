export interface Client {
  id: string;
  cpf: string;
  status: 'success' | 'error' | 'pending';
  consultationDate: string;
  consultationType: 'individual' | 'batch';
  name?: string;
  birthDate?: string;
  situation?: string;
  approvedValue?: string;
  bank?: string;
  error?: string;
}
