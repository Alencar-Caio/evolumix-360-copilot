CREATE TABLE `conversation_messages` (
	`id` varchar(255) NOT NULL,
	`conversation_id` varchar(255) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` longtext NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`organization_id` varchar(255) NOT NULL,
	`title` varchar(255),
	`status` enum('active','archived','deleted') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_messages_conversation_id` ON `conversation_messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_role` ON `conversation_messages` (`role`);--> statement-breakpoint
CREATE INDEX `idx_messages_created_at` ON `conversation_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_conversations_user_id` ON `conversations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_conversations_organization_id` ON `conversations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_conversations_status` ON `conversations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_conversations_created_at` ON `conversations` (`created_at`);