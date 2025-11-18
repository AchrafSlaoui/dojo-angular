import { Movement } from './movement';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  movements: Movement[];
}

