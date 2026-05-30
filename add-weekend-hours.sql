-- 주말 근무시간 컬럼 추가 마이그레이션
-- 작성일: 2026-05-30
-- 목적: 직원별 주말(토·일) 근무시간 설정 기능 추가
-- 시스템: BDXI QR Attendance

-- employees 테이블에 주말 근무시간 컬럼 추가
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS weekend_start_time TIME,
ADD COLUMN IF NOT EXISTS weekend_end_time TIME;

-- 컬럼 설명 추가
COMMENT ON COLUMN employees.weekend_start_time IS '주말(토·일) 근무 시작 시간 (선택사항, NULL이면 평일 근무시간 사용)';
COMMENT ON COLUMN employees.weekend_end_time IS '주말(토·일) 근무 종료 시간 (선택사항, NULL이면 평일 근무시간 사용)';

-- 완료 메시지
DO $$ 
BEGIN 
    RAISE NOTICE '✅ 주말 근무시간 컬럼이 성공적으로 추가되었습니다!';
    RAISE NOTICE '📝 employees 테이블에 weekend_start_time, weekend_end_time 컬럼 추가됨';
    RAISE NOTICE '💡 기존 직원 데이터는 영향받지 않습니다 (NULL 허용)';
END $$;
