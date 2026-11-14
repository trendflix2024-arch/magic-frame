-- magic_frame_users.submitted_at 추가 — 고객의 실제 사진 제출 시각 추적
-- 기존 export 의 "등록일" 이 created_at(=CSV bulk import 시각)이라 모든 고객이 동일하게 표시되던 문제 해결.
-- 안전성: 새 컬럼은 nullable, 기존 데이터 변경 없음. 백필도 NULL 인 row 만 갱신.

-- 1) 컬럼 추가 (이미 있으면 스킵)
ALTER TABLE magic_frame_users
    ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- 2) 백필 — 이미 submitted=true 인 고객은 updated_at 을 근사치로 사용
--    (대부분의 현 고객은 admin 이 상태 변경하기 전이라 updated_at = 실제 제출 시각)
UPDATE magic_frame_users
SET submitted_at = updated_at
WHERE submitted = true
  AND submitted_at IS NULL
  AND updated_at IS NOT NULL;

-- 3) 검증
SELECT
    count(*) FILTER (WHERE submitted_at IS NOT NULL) AS backfilled,
    count(*) FILTER (WHERE submitted = true AND submitted_at IS NULL) AS submitted_but_no_time,
    count(*) FILTER (WHERE submitted = false) AS not_submitted_yet
FROM magic_frame_users;
