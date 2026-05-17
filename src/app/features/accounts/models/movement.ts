export interface Movement {
  id: string;
  date: string;
  type: 'debit' | 'credit';
  amount: number;
  description?: string;
}

export type MovementCreate = Omit<Movement, 'id'>;
