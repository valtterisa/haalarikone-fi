import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const searchQueries = sqliteTable('search_queries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  query: text('query').notNull(),
  locale: text('locale').notNull(),
  resultCount: integer('result_count').notNull(),
  source: text('source').notNull(),
  color: text('color'),
  area: text('area'),
  field: text('field'),
  school: text('school'),
  createdAt: integer('created_at').notNull(),
});
