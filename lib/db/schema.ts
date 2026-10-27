import { integer, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

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

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const organizationClaims = sqliteTable(
  'organization_claims',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    orgSlug: text('org_slug').notNull(),
    overallId: integer('overall_id').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .notNull()
      .default('pending'),
    proofMessage: text('proof_message'),
    claimEmail: text('claim_email').notNull(),
    verifyMethod: text('verify_method', { enum: ['domain', 'manual'] }).notNull(),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
    reviewedBy: text('reviewed_by'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('organization_claims_orgSlug_idx').on(table.orgSlug),
    index('organization_claims_userId_idx').on(table.userId),
    index('organization_claims_status_idx').on(table.status),
  ],
);

export const organizationProfiles = sqliteTable('organization_profiles', {
  orgSlug: text('org_slug').primaryKey(),
  overallId: integer('overall_id').notNull(),
  displayName: text('display_name'),
  website: text('website'),
  descriptionFi: text('description_fi'),
  descriptionEn: text('description_en'),
  descriptionSv: text('description_sv'),
  instagramUrl: text('instagram_url'),
  discordUrl: text('discord_url'),
  variLabel: text('vari_label'),
  variBaseJson: text('vari_base_json'),
  hex: text('hex'),
  textColor: text('text_color'),
  claimedByUserId: text('claimed_by_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  updatedByUserId: text('updated_by_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const organizationInvites = sqliteTable(
  'organization_invites',
  {
    id: text('id').primaryKey(),
    orgSlug: text('org_slug').notNull(),
    email: text('email').notNull(),
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }).notNull(),
    sentBy: text('sent_by').notNull(),
  },
  (table) => [
    index('organization_invites_orgSlug_idx').on(table.orgSlug),
    uniqueIndex('organization_invites_slug_email_idx').on(table.orgSlug, table.email),
  ],
);
