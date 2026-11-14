-- magic_frame_users.source 추가 — 고객의 구매처(naver, coupang, lotteon, ...)
-- 예전에는 Storage 의 user-sources.json 한 파일에 {userId: source} 로 저장했다 (공개 버킷이라 ID 목록이 노출됐고 동시 쓰기에 취약).
-- 안전성: nullable 새 컬럼만 추가한다. 기존 데이터는 바뀌지 않는다.
-- 되돌리기: ALTER TABLE magic_frame_users DROP COLUMN source;

ALTER TABLE magic_frame_users
    ADD COLUMN IF NOT EXISTS source text;

-- 검증: source 컬럼이 1행 나오면 성공
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'magic_frame_users'
  AND column_name = 'source';
