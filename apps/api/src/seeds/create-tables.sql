-- 게임 관련 테이블 생성

-- keyword 테이블
CREATE TABLE IF NOT EXISTS `keyword` (
  `id` int NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `difficulty` enum('EASY','NORMAL','HARD') NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- speech 테이블 (발언 기록)
CREATE TABLE IF NOT EXISTS `speech` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `userId` int NOT NULL,
  `content` text NOT NULL,
  `turnNumber` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_room` (`roomId`),
  KEY `idx_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vote 테이블 (투표 기록)
CREATE TABLE IF NOT EXISTS `vote` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `voterId` int NOT NULL COMMENT '투표한 사람',
  `targetId` int NOT NULL COMMENT '투표 대상',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_room` (`roomId`),
  KEY `idx_voter` (`voterId`),
  UNIQUE KEY `unique_vote` (`roomId`, `voterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
