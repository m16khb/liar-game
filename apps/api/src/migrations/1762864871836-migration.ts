import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1762864871836 implements MigrationInterface {
    name = 'Migration1762864871836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`tier\` enum ('guest', 'member', 'premium') NOT NULL DEFAULT 'guest', \`role\` enum ('user', 'admin') NOT NULL DEFAULT 'user', \`oauthProvider\` varchar(50) NULL, \`oauthId\` varchar(255) NULL, \`lastLoginAt\` timestamp NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, INDEX \`idx_users_tier\` (\`tier\`), INDEX \`idx_users_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rooms\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`code\` varchar(32) NOT NULL, \`title\` varchar(100) NOT NULL, \`status\` enum ('waiting', 'playing', 'finished') NOT NULL DEFAULT 'waiting', \`difficulty\` enum ('easy', 'normal', 'hard') NOT NULL DEFAULT 'normal', \`maxPlayers\` int NOT NULL COMMENT '최대 인원 수' DEFAULT '8', \`minPlayers\` int NOT NULL COMMENT '최소 인원 수' DEFAULT '4', \`currentPlayers\` int NOT NULL COMMENT '현재 인원 수' DEFAULT '0', \`isPrivate\` tinyint NOT NULL COMMENT '비공개 방 여부' DEFAULT 0, \`password\` varchar(255) NULL COMMENT '비밀번호', \`timeLimit\` int NULL COMMENT '게임 시간 제한 (초)', \`gameSettings\` json NULL COMMENT '추가 게임 설정', \`description\` varchar(255) NULL COMMENT '방 설명', \`hostId\` int UNSIGNED NULL COMMENT '방장 ID', \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, INDEX \`IDX_ec907f831502e7edd16782046d\` (\`status\`, \`createdAt\`), UNIQUE INDEX \`IDX_368d83b661b9670e7be1bbb9cd\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`players\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`roomId\` int UNSIGNED NOT NULL COMMENT '방 ID', \`userId\` int UNSIGNED NOT NULL COMMENT '사용자 ID', \`status\` enum ('ready', 'not_ready', 'playing', 'eliminated') NOT NULL COMMENT '플레이어 상태' DEFAULT 'not_ready', \`joinOrder\` int NOT NULL COMMENT '참가 순서' DEFAULT '0', \`isHost\` tinyint NOT NULL COMMENT '방장 여부' DEFAULT 0, \`gameData\` json NULL COMMENT '게임별 추가 데이터', \`lastActiveAt\` timestamp NULL COMMENT '마지막 활동 시간', \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_2f5963d4b91ea850ee8c0a2d46\` (\`roomId\`, \`status\`), UNIQUE INDEX \`IDX_065ceb3441a3852418e7f9172f\` (\`roomId\`, \`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`rooms\` ADD CONSTRAINT \`FK_6c939085068c5539bad393be6b9\` FOREIGN KEY (\`hostId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`players\` ADD CONSTRAINT \`FK_280e4c471900ea22801fb3ce58c\` FOREIGN KEY (\`roomId\`) REFERENCES \`rooms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`players\` ADD CONSTRAINT \`FK_7c11c744c0601ab432cfa6ff7ad\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`players\` DROP FOREIGN KEY \`FK_7c11c744c0601ab432cfa6ff7ad\``);
        await queryRunner.query(`ALTER TABLE \`players\` DROP FOREIGN KEY \`FK_280e4c471900ea22801fb3ce58c\``);
        await queryRunner.query(`ALTER TABLE \`rooms\` DROP FOREIGN KEY \`FK_6c939085068c5539bad393be6b9\``);
        await queryRunner.query(`DROP INDEX \`IDX_065ceb3441a3852418e7f9172f\` ON \`players\``);
        await queryRunner.query(`DROP INDEX \`IDX_2f5963d4b91ea850ee8c0a2d46\` ON \`players\``);
        await queryRunner.query(`DROP TABLE \`players\``);
        await queryRunner.query(`DROP INDEX \`IDX_368d83b661b9670e7be1bbb9cd\` ON \`rooms\``);
        await queryRunner.query(`DROP INDEX \`IDX_ec907f831502e7edd16782046d\` ON \`rooms\``);
        await queryRunner.query(`DROP TABLE \`rooms\``);
        await queryRunner.query(`DROP INDEX \`idx_users_email\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`idx_users_tier\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
