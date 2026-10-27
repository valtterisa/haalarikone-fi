CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `organization_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`org_slug` text NOT NULL,
	`overall_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`proof_message` text,
	`claim_email` text NOT NULL,
	`verify_method` text NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `organization_claims_orgSlug_idx` ON `organization_claims` (`org_slug`);--> statement-breakpoint
CREATE INDEX `organization_claims_userId_idx` ON `organization_claims` (`user_id`);--> statement-breakpoint
CREATE INDEX `organization_claims_status_idx` ON `organization_claims` (`status`);--> statement-breakpoint
CREATE TABLE `organization_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`org_slug` text NOT NULL,
	`email` text NOT NULL,
	`sent_at` integer NOT NULL,
	`sent_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `organization_invites_orgSlug_idx` ON `organization_invites` (`org_slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_invites_slug_email_idx` ON `organization_invites` (`org_slug`,`email`);--> statement-breakpoint
CREATE TABLE `organization_profiles` (
	`org_slug` text PRIMARY KEY NOT NULL,
	`overall_id` integer NOT NULL,
	`display_name` text,
	`website` text,
	`description_fi` text,
	`description_en` text,
	`description_sv` text,
	`instagram_url` text,
	`discord_url` text,
	`vari_label` text,
	`vari_base_json` text,
	`hex` text,
	`text_color` text,
	`claimed_by_user_id` text NOT NULL,
	`verified_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by_user_id` text NOT NULL,
	FOREIGN KEY (`claimed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);