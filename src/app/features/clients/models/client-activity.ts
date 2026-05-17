import { Movement } from '@accounts/models/movement';
import { Client } from './client';

export interface ClientActivity extends Client {
  recentMovements: Movement[];
}
