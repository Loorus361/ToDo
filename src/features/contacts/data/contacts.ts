import { db, type Person } from '../../../shared/db/db';

export type { Person } from '../../../shared/db/db';

export function getPerson(personId: number) {
  return db.persons.get(personId);
}

export function listPersons() {
  return db.persons.toArray();
}

export function listPersonsByName() {
  return db.persons.orderBy('name').toArray();
}

export function createPerson(name: string) {
  return db.persons.add({ name });
}

export function updatePerson(personId: number, field: Partial<Person>) {
  return db.persons.update(personId, field);
}

export function deletePerson(personId: number) {
  return db.persons.delete(personId);
}
