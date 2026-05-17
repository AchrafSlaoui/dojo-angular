import { Account } from '@accounts/models/account';
import { Client } from '@clients/models/client';
import { Movement } from '@accounts/models/movement';

export type ClientRecord = Client & { accounts?: Account[]; movements?: Movement[] };
