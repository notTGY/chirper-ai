CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag` text NOT NULL,
	`name` text,
	`bio` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_tag_unique` ON `users` (`tag`);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL,
	`date` text DEFAULT (current_timestamp),
	`lang` text,
	`text` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
