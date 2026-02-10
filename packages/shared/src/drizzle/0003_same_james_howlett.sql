CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryId` int NOT NULL,
	`masterName` varchar(100) NOT NULL,
	`masterComment` text NOT NULL,
	`entryTitle` varchar(500),
	`entryCreatedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
