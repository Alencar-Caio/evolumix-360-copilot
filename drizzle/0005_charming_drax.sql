CREATE TABLE `cost_metrics` (
	`id` varchar(255) NOT NULL,
	`service` varchar(255) NOT NULL,
	`cost` decimal(12,2) NOT NULL,
	`unit` varchar(100) NOT NULL,
	`quantity` int NOT NULL,
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_recommendations` (
	`id` varchar(255) NOT NULL,
	`service` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext NOT NULL,
	`estimated_savings` decimal(12,2) NOT NULL,
	`priority` enum('high','medium','low') NOT NULL,
	`implementation_difficulty` enum('easy','medium','hard') NOT NULL,
	`action_items` json NOT NULL,
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cost_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incident_actions` (
	`id` varchar(255) NOT NULL,
	`incident_id` varchar(255) NOT NULL,
	`action` varchar(255) NOT NULL,
	`performer` varchar(255) NOT NULL,
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'completed',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_incidents` (
	`id` varchar(255) NOT NULL,
	`type` enum('security_breach','data_loss','unauthorized_access','malware_detected','ddos_attack','service_degradation','configuration_error') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`status` enum('open','investigating','contained','resolved','closed') NOT NULL DEFAULT 'open',
	`title` varchar(255) NOT NULL,
	`description` longtext NOT NULL,
	`affected_systems` json NOT NULL,
	`affected_users` int DEFAULT 0,
	`root_cause` text,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	`reported_at` timestamp,
	`contained_at` timestamp,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `security_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_cost_service` ON `cost_metrics` (`service`);--> statement-breakpoint
CREATE INDEX `idx_cost_recorded_at` ON `cost_metrics` (`recorded_at`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_service` ON `cost_recommendations` (`service`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_priority` ON `cost_recommendations` (`priority`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_status` ON `cost_recommendations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_actions_incident_id` ON `incident_actions` (`incident_id`);--> statement-breakpoint
CREATE INDEX `idx_actions_performer` ON `incident_actions` (`performer`);--> statement-breakpoint
CREATE INDEX `idx_actions_created_at` ON `incident_actions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_incidents_type` ON `security_incidents` (`type`);--> statement-breakpoint
CREATE INDEX `idx_incidents_severity` ON `security_incidents` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_incidents_status` ON `security_incidents` (`status`);--> statement-breakpoint
CREATE INDEX `idx_incidents_detected_at` ON `security_incidents` (`detected_at`);