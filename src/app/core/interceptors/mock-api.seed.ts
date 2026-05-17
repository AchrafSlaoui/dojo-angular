import { Movement } from '@accounts/models/movement';
import { ClientRecord } from './mock-api.types';
import { daysAgo, formatDate, slugName, uuid, weekRange } from './mock-api.utils';
import { ensureAccounts } from './mock-api.accounts';

const FIRST_NAMES = ['Jean','Marie','Pierre','Sophie','Antoine','Louis','Emma','Lucas','Camille','Julien','Thomas','Nicolas','Claire','Pauline','Hugo','Arthur','Lea','Chloe','Manon','Sarah','Victor','Mathis','Baptiste','Gabriel','Jules','Martin','Elodie','Celine','Marine','Adrien','Romain','Maxime','Quentin','Theo','Noemie','Charlotte','Elise','Anais','Florian','Valentin','Guillaume','Alexis','Margaux','Lucie','Eva','Nathan','Leo','Paul','Jeanne','Agathe'];
const LAST_NAMES = ['Dupont','Martin','Bernard','Petit','Robert','Richard','Durand','Dubois','Moreau','Laurent','Simon','Michel','Lefebvre','Leroy','Roux','David','Bertrand','Morel','Fournier','Girard','Bonnet','Dupuis','Lambert','Fontaine','Chevalier','Robin','Gauthier','Poirier','Lemoine','Renaud','Renard','Marchand','Morin','Noel','Dumont','Blanc','Guerin','Muller','Henry','Roussel','Nicolas','Perrin','Mathieu','Clement','Garcia','Faure','Olivier','Carpentier','Gonzalez','Barbier'];
export const CITY_POOL = ['Paris','Lyon','Marseille','Toulouse','Bordeaux','Lille','Nantes','Strasbourg','Montpellier','Nice','Rennes','Grenoble','Dijon','Angers','Reims','Le Havre','Saint-Etienne','Toulon','Clermont-Ferrand','Aix-en-Provence','Nancy','Tours','Avignon','Amiens','Metz','Besancon','Orleans','Brest','Caen','Limoges'];

function pickName(i: number): { first: string; last: string } {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
  return { first, last };
}

export function seedData(): ClientRecord[] {
  const clients: ClientRecord[] = [];

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
        { id: uuid(), date: formatDate(daysAgo(3)), type: 'debit', amount: 200, description: 'Courses' },
      ],
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
        { id: uuid(), date: formatDate(daysAgo(20)), type: 'credit', amount: 500, description: 'Vente' },
      ],
    }
  );

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
      movements: randomMovements(),
    });
  }

  ensureHumanNames(clients);
  ensureMovementsThisWeek(clients);
  ensureAccounts(clients);
  return clients;
}

export function ensureHumanNames(db: ClientRecord[]): void {
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

function ensureMovementsThisWeek(clients: ClientRecord[]): void {
  const { monday, sunday } = weekRange(new Date());
  for (let i = 0; i < Math.min(10, clients.length); i++) {
    const c = clients[i];
    const movements = c.movements ?? [];
    const hasThisWeek = movements.some((movement) => {
      const date = new Date(movement.date);
      return date >= monday && date <= sunday;
    });
    if (!hasThisWeek) {
      movements.unshift({
        id: uuid(),
        date: formatDate(new Date()),
        type: Math.random() > 0.5 ? 'credit' : 'debit',
        amount: Math.round((50 + Math.random() * 950) * 100) / 100,
        description: 'Mouvement demo',
      });
      c.movements = movements;
    }
  }
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
      description: 'Ancien mouvement',
    });
  }
  return arr;
}
