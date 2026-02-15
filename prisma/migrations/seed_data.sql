USE `swell`;

-- 테스트용 사용자 추가 (현재 백엔드에서 기본값으로 사용 중인 ID)
INSERT INTO `User` (`id`, `nickname`, `bio`, `createdAt`)
VALUES ('00000000-0000-0000-0000-000000000000', '너울테스터', 'Swell 서비스를 테스트하기 위한 계정입니다.', CURRENT_TIMESTAMP(3));

-- 테스트용 게시글 추가
INSERT INTO `Post` (`userId`, `content`, `hasVote`, `createdAt`)
VALUES ('00000000-0000-0000-0000-000000000000', '너울(Swell) 백엔드 서버가 성공적으로 세팅되었습니다! 🎉', false, CURRENT_TIMESTAMP(3));

-- 테스트용 알림 추가
INSERT INTO `Notification` (`userId`, `type`, `message`, `isRead`, `createdAt`)
VALUES ('00000000-0000-0000-0000-000000000000', 'system', '환영합니다! 이제 모든 기능을 사용하실 수 있습니다.', false, CURRENT_TIMESTAMP(3));
