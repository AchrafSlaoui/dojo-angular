import { Client } from '@clients/models/client';

export type ClientUpdate = Partial<Client> & { id: string };
