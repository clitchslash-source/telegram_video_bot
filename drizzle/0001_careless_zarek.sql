CREATE TABLE `notion_sync_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('user','transaction','generation','payment') NOT NULL,
	`entityId` varchar(255) NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`notionPageId` varchar(255),
	`synced` boolean NOT NULL DEFAULT false,
	`syncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notion_sync_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`paymentId` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`tokens` int NOT NULL,
	`status` enum('pending','succeeded','failed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`description` text,
	`notionSynced` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_transactions_paymentId_unique` UNIQUE(`paymentId`)
);
--> statement-breakpoint
CREATE TABLE `telegram_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`username` varchar(255),
	`firstName` varchar(255),
	`lastName` varchar(255),
	`tokenBalance` int NOT NULL DEFAULT 0,
	`totalTokensPurchased` int NOT NULL DEFAULT 0,
	`totalTokensSpent` int NOT NULL DEFAULT 0,
	`totalGenerations` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastInteractionAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegram_users_telegramId_unique` UNIQUE(`telegramId`)
);
--> statement-breakpoint
CREATE TABLE `token_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`type` enum('purchase','generation','removal','refund','bonus') NOT NULL,
	`amount` int NOT NULL,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` text,
	`relatedTransactionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `token_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`inputType` enum('text','image','voice') NOT NULL,
	`duration` enum('10','15') NOT NULL,
	`quality` varchar(50) NOT NULL DEFAULT 'standard',
	`prompt` text,
	`inputFileUrl` text,
	`outputVideoUrl` text,
	`tokensCost` int NOT NULL,
	`hasWatermark` boolean NOT NULL DEFAULT true,
	`watermarkRemovalApplied` boolean NOT NULL DEFAULT false,
	`watermarkRemovalCost` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`kieAiJobId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_generations_id` PRIMARY KEY(`id`)
);
