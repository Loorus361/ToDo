// Konfiguration zur Erzeugung der D1-SQL-Migrationen aus dem Drizzle-Schema
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'sqlite',
});
