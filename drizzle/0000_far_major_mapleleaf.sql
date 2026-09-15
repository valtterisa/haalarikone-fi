CREATE TABLE `search_queries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`query` text NOT NULL,
	`locale` text NOT NULL,
	`result_count` integer NOT NULL,
	`source` text NOT NULL,
	`color` text,
	`area` text,
	`field` text,
	`school` text,
	`created_at` integer NOT NULL
);
