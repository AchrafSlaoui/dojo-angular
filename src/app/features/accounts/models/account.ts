import { Movement, MovementCreate } from './movement';

export type AccountType = 'checking' | 'saving' | 'joint';
export type AccountStatus = 'active' | 'blocked' | 'closed';

export interface Account {
  id: string;
  clientId: string;
  label: string;
  type: AccountType;
  status: AccountStatus;
  balance: number;
  currency: 'EUR';
  movements: Movement[];
}

export type AccountCreate = Pick<Account, 'label' | 'type' | 'status'>;
export type AccountUpdate = Partial<AccountCreate> & { id: string };
export type { Movement, MovementCreate };
