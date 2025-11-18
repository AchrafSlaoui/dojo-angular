import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Client } from '@app/models/client';
import { Movement } from '@app/models/movement';

let DB: Client[] | null = null;
const STORAGE_KEY = 'dojo-angular-test-mock';
const STORAGE_VERSION_KEY = 'dojo-angular-test-mock-version';
const DATA_VERSION = 2; // bump to force reseed with 10 weekly clients

// French pools for names and cities
const FIRST_NAMES = ['Jean','Marie','Pierre','Sophie','Antoine','Louis','Emma','Lucas','Camille','Julien','Thomas','Nicolas','Claire','Pauline','Hugo','Arthur','Lea','Chloe','Manon','Sarah','Victor','Mathis','Baptiste','Gabriel','Jules','Martin','Elodie','Celine','Marine','Adrien','Romain','Maxime','Quentin','Theo','Noemie','Charlotte','Elise','Anais','Florian','Valentin','Guillaume','Alexis','Margaux','Lucie','Eva','Nathan','Leo','Paul','Jeanne','Agathe'];
const LAST_NAMES = ['Dupont','Martin','Bernard','Petit','Robert','Richard','Durand','Dubois','Moreau','Laurent','Simon','Michel','Lefebvre','Leroy','Roux','David','Bertrand','Morel','Fournier','Girard','Bonnet','Dupuis','Lambert','Fontaine','Chevalier','Robin','Gauthier','Poirier','Lemoine','Renaud','Renard','Marchand','Morin','Noel','Dumont','Blanc','Guerin','Muller','Henry','Roussel','Nicolas','Perrin','Mathieu','Clement','Garcia','Faure','Olivier','Carpentier','Gonzalez','Barbier'];
const CITY_POOL = ['Paris','Lyon','Marseille','Toulouse','Bordeaux','Lille','Nantes','Strasbourg','Montpellier','Nice','Rennes','Grenoble','Dijon','Angers','Reims','Le Havre','Saint-Etienne','Toulon','Clermont-Ferrand','Aix-en-Provence','Nancy','Tours','Avignon','Amiens','Metz','Besancon','Orleans','Brest','Caen','Limoges'];


function slugName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function pickName(i: number): { first: string; last: string } {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
  return { first, last };
}

export function mockApiInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const path = toPath(req.url);
  if (!path.startsWith('/api/')) {
    return next(req);
  }

  // Lazy init DB
  if (!DB) {
    const version = Number(localStorage.getItem(STORAGE_VERSION_KEY) ?? '0');
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && version === DATA_VERSION) {
      try {
        DB = JSON.parse(cached) as Client[];
      } catch {
        DB = seedData();
      }
    } else {
      DB = seedData();
    }
    // Normalize any legacy numeric names from previous seeds
    if (DB) {
      ensureHumanNames(DB);
      // If cache is empty or invalid, re-seed
      if (!Array.isArray(DB) || DB.length === 0) {
        DB = seedData();
      }
      persist();
    }
  }

  const method = req.method.toUpperCase();

// Routes
// GET /api/clients
  if (method === 'GET' && /^\/api\/clients\/?$/.test(path)) {
    if (!DB || DB.length === 0) {
      DB = seedData();
    }
    return ok(DB);
  }

  // POST /api/clients
  if (method === 'POST' && /^\/api\/clients\/?$/.test(path)) {
    const body = (req.body as Partial<Client>) || {};
    const client: Client = {
      id: uuid(),
      firstName: String(body.firstName ?? 'Nouveau'),
      lastName: String(body.lastName ?? 'Client'),
      email: String(body.email ?? `${slugName(String(body.firstName ?? 'nouveau'))}.${slugName(String(body.lastName ?? 'client'))}@example.com`),
      phone: String(body.phone ?? ''),
      address: String(body.address ?? ''),
      movements: []
    };
    DB = DB ?? [];
    DB.unshift(client);
    persist();
    return created(client);
  }

  // PUT /api/clients/:id
  const mUpdateClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'PUT' && mUpdateClient) {
    const id = decodeURIComponent(mUpdateClient[1]);
    const idx = DB!.findIndex((c) => c.id === id);
    if (idx < 0) return notFound();
    const original = DB![idx];
    const patch = (req.body as Partial<Client>) || {};
    const updated: Client = {
      ...original,
      firstName: patch.firstName ?? original.firstName,
      lastName: patch.lastName ?? original.lastName,
      email: patch.email ?? original.email,
      phone: patch.phone ?? original.phone,
      address: patch.address ?? original.address
    };
    DB![idx] = updated;
    persist();
    return ok(updated);
  }

  // DELETE /api/clients/:id
  const mDeleteClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'DELETE' && mDeleteClient) {
    const id = decodeURIComponent(mDeleteClient[1]);
    const before = DB!.length;
    DB = DB!.filter((c) => c.id !== id);
    if (DB!.length === before) return notFound();
    persist();
    return noContent();
  }

  // GET /api/clients/:id
  const mClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'GET' && mClient) {
    const id = decodeURIComponent(mClient[1]);
    const client = DB!.find((c) => c.id === id);
    return client ? ok(client) : notFound();
  }

  // POST /api/clients/:id/movements
  const mAdd = path.match(/^\/api\/clients\/([^\/]+)\/movements$/);
  if (method === 'POST' && mAdd) {
    const id = decodeURIComponent(mAdd[1]);
    const body = req.body as Omit<Movement, 'id'>;
    const client = DB!.find((c) => c.id === id);
    if (!client) return notFound();
    const movement: Movement = { id: uuid(), ...body };
    client.movements = [movement, ...client.movements];
    persist();
    return created(movement);
  }

  // PUT /api/clients/:id/movements/:mid
  const mUpdate = path.match(/^\/api\/clients\/([^\/]+)\/movements\/([^\/]+)$/);
  if (method === 'PUT' && mUpdate) {
    const id = decodeURIComponent(mUpdate[1]);
    const mid = decodeURIComponent(mUpdate[2]);
    const body = req.body as Movement;
    const client = DB!.find((c) => c.id === id);
    if (!client) return notFound();
    client.movements = client.movements.map((m) => (m.id === mid ? body : m));
    persist();
    return ok(body);
  }

  // DELETE /api/clients/:id/movements/:mid
  if (method === 'DELETE' && mUpdate) {
    const id = decodeURIComponent(mUpdate[1]);
    const mid = decodeURIComponent(mUpdate[2]);
    const client = DB!.find((c) => c.id === id);
    if (!client) return notFound();
    client.movements = client.movements.filter((m) => m.id !== mid);
    persist();
    return noContent();
  }

  // Fallback
  return next(req);
}

function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body }));
}
function created<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 201, body }));
}
function notFound(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 404 }));
}
function noContent(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 204 }));
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    localStorage.setItem(STORAGE_VERSION_KEY, String(DATA_VERSION));
  } catch {}
}

function seedData(): Client[] {
  const clients: Client[] = [];

  // Some named examples
  clients.push(
    {
      id: 'c1',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+331700000001',
      address: 'Paris, France',
      movements: [
        { id: uuid(), date: formatDate(new Date()), type: 'credit', amount: 1200, description: 'Salaire' },
        { id: uuid(), date: formatDate(daysAgo(3)), type: 'debit', amount: 200, description: 'Courses' }
      ]
    },
    {
      id: 'c2',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '+331700000002',
      address: 'Lyon, France',
      movements: [
        { id: uuid(), date: formatDate(daysAgo(2)), type: 'debit', amount: 150, description: 'Restaurant' },
        { id: uuid(), date: formatDate(daysAgo(20)), type: 'credit', amount: 500, description: 'Vente' }
      ]
    }
  );

  // Generate up to 50 total
  while (clients.length < 50) {
    const idx = clients.length + 1;
    const { first, last } = pickName(clients.length);
    const city = CITY_POOL[clients.length % CITY_POOL.length];
    clients.push({
      id: `c-${idx}`,
      firstName: first,
      lastName: last,
      email: `${slugName(first)}.${slugName(last)}@example.com`,
      phone: `+3301${String(100000 + idx).slice(-6)}`,
      address: city,
      movements: randomMovements()
    });
  }

  // Replace generic numeric names with fictitious names and cities (no numeric suffixes)
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    if (/^Client\d+$/i.test(c.firstName)) {
      const { first, last } = pickName(i);
      c.firstName = first;
      c.lastName = last;
      c.email = `${slugName(first)}.${slugName(last)}@example.com`;
      c.address = CITY_POOL[i % CITY_POOL.length];
    }
  }

  // Ensure 10 with movement this week
  const { monday, sunday } = weekRange(new Date());
  for (let i = 0; i < Math.min(10, clients.length); i++) {
    const c = clients[i];
    const hasThisWeek = c.movements.some((m) => {
      const d = new Date(m.date);
      return d >= monday && d <= sunday;
    });
    if (!hasThisWeek) {
      c.movements.unshift({
        id: uuid(),
        date: formatDate(new Date()),
        type: Math.random() > 0.5 ? 'credit' : 'debit',
        amount: Math.round((50 + Math.random() * 950) * 100) / 100,
        description: 'Operation demo'
      });
    }
  }

  persist();
  return clients;
}

function randomMovements(): Movement[] {
  const count = 1 + Math.floor(Math.random() * 3);
  const arr: Movement[] = [];
  for (let i = 0; i < count; i++) {
    const d = daysAgo(7 + Math.floor(Math.random() * 60));
    arr.push({
      id: uuid(),
      date: formatDate(d),
      type: Math.random() > 0.5 ? 'credit' : 'debit',
      amount: Math.round((10 + Math.random() * 990) * 100) / 100,
      description: 'Ancienne operation'
    });
  }
  return arr;
}

function weekRange(ref: Date): { monday: Date; sunday: Date } {
  const now = new Date(ref);
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toPath(url: string): string {
  try {
    // handles absolute and relative URLs
    const u = new URL(url, (globalThis as any)?.location?.origin ?? 'http://local');
    return u.pathname;
  } catch {
    return url.replace(/^[a-zA-Z]+:\/\/[^/]+/, '');
  }
}

function ensureHumanNames(db: Client[]): void {
  for (let i = 0; i < db.length; i++) {
    const c = db[i];
    if (/^Client\d+$/i.test(c.firstName)) {
      const { first, last } = pickName(i);
      c.firstName = first;
      c.lastName = last;
      c.email = `${slugName(first)}.${slugName(last)}@example.com`;
      c.address = CITY_POOL[i % CITY_POOL.length];
    }
  }
}
