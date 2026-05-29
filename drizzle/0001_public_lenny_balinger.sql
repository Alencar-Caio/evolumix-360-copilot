CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queryId` int NOT NULL,
	`submittedBy` int NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnostics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`area` decimal(10,2),
	`footTraffic` varchar(100),
	`currentProducts` json,
	`currentConsumption` decimal(10,2),
	`currentCost` decimal(12,2),
	`analysisChemical` text,
	`analysisHygiene` text,
	`analysisROI` text,
	`recommendations` json,
	`closingScript` text,
	`status` enum('draft','completed','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnostics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`metadata` json,
	`approvedBy` int,
	`approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	CONSTRAINT `documentVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`documentType` enum('FISPQ','technical_sheet','catalog','other') NOT NULL,
	`supplierId` varchar(255),
	`currentVersionId` int,
	`status` enum('draft','approved','archived') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`queryText` text NOT NULL,
	`responseText` text,
	`usedDocumentIds` json,
	`citations` json,
	`faithfulnessScore` decimal(3,2),
	`citationCoverageScore` decimal(3,2),
	`riskClassification` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`requiresApproval` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roiCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticId` int NOT NULL,
	`costPerLiterDiluted` decimal(10,2),
	`yield` decimal(10,2),
	`monthlyConsumption` decimal(10,2),
	`monthlySavings` decimal(12,2),
	`paybackMonths` decimal(5,1),
	`beforeCost` decimal(12,2),
	`afterCost` decimal(12,2),
	`savingsPercentage` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roiCalculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `queryId_idx` ON `approvals` (`queryId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `approvals` (`status`);--> statement-breakpoint
CREATE INDEX `reviewedBy_idx` ON `approvals` (`reviewedBy`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `diagnostics` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `diagnostics` (`status`);--> statement-breakpoint
CREATE INDEX `documentId_idx` ON `documentVersions` (`documentId`);--> statement-breakpoint
CREATE INDEX `approvalStatus_idx` ON `documentVersions` (`approvalStatus`);--> statement-breakpoint
CREATE INDEX `createdBy_idx` ON `documents` (`createdBy`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `documents` (`status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `queries` (`userId`);--> statement-breakpoint
CREATE INDEX `riskClassification_idx` ON `queries` (`riskClassification`);--> statement-breakpoint
CREATE INDEX `requiresApproval_idx` ON `queries` (`requiresApproval`);--> statement-breakpoint
CREATE INDEX `diagnosticId_idx` ON `roiCalculations` (`diagnosticId`);