-- submitted_at 재백필 — image_url ?v= 의 timestamp(ms) 사용
-- 이유: 1차 백필(submitted_at = updated_at) 이 admin 의 상태 변경(대기→제작중→준비중) 후의
--       updated_at 이라 부정확. image_url 의 ?v= 는 실제 업로드 순간 Date.now() 이므로 정확.
-- 안전성: WHERE submitted_at = updated_at 조건 → 1차 백필값만 교체. 새 코드가 이미 정확하게 set 한 row 는 안 건드림.

-- 1) 백필 (정규식으로 v= 뒤 숫자 추출 → epoch ms → timestamptz)
UPDATE magic_frame_users
SET submitted_at = to_timestamp(
    SUBSTRING(image_url FROM '\?v=(\d+)')::bigint / 1000.0
)
WHERE submitted = true
  AND image_url IS NOT NULL
  AND image_url ~ '\?v=\d+'
  AND submitted_at = updated_at;

-- 2) 검증 — 같은 시간대 group by 로 분포 확인
SELECT
    count(*) AS total_submitted,
    count(*) FILTER (WHERE submitted_at = updated_at) AS still_matches_updated_at,
    count(*) FILTER (WHERE submitted_at != updated_at) AS now_different
FROM magic_frame_users
WHERE submitted = true;

-- 3) 발송준비 단계 샘플 5건 확인
SELECT name, shipping_status, submitted_at, updated_at, image_url
FROM magic_frame_users
WHERE submitted = true
  AND shipping_status = 'preparing'
ORDER BY submitted_at ASC
LIMIT 5;
