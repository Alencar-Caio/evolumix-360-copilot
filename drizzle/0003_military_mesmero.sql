CREATE TABLE `immutable_audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`action` varchar(100) NOT NULL,
	`details` json NOT NULL,
	`ip_address` varchar(45) NOT NULL,
	`user_agent` text,
	`hash` varchar(64) NOT NULL,
	`previous_hash` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `immutable_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_immutable_event_type` ON `immutable_audit_logs` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_immutable_user_id` ON `immutable_audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_immutable_entity_id` ON `immutable_audit_logs` (`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_immutable_created_at` ON `immutable_audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_immutable_hash` ON `immutable_audit_logs` (`hash`);