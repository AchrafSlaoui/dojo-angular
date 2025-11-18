import { Client } from "@app/models/client";

export type ClientUpdate = Partial<Client> & { id: string };

