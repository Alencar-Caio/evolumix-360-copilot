ALTER TABLE `users` ADD `isAuthorized` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `authorizationReason` text;