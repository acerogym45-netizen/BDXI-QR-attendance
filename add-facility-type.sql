-- ========================================
-- 시설 타입 추가 마이그레이션
-- Add Facility Type Migration
-- ========================================
--
-- 용도: 아파트 테이블에 facility_type 컬럼 추가
-- Purpose: Add facility_type column to apartments table
--
-- ========================================

-- 1단계: facility_type 컬럼 추가
ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS facility_type VARCHAR(50) DEFAULT 'apartment';

-- 2단계: facility_type에 체크 제약조건 추가
ALTER TABLE apartments
ADD CONSTRAINT facility_type_check 
CHECK (facility_type IN ('gym', 'ac_cleaning', 'apartment'));

-- 3단계: 기존 데이터를 'apartment'로 설정
UPDATE apartments 
SET facility_type = 'apartment' 
WHERE facility_type IS NULL;

-- 4단계: 컬럼 설명 추가
COMMENT ON COLUMN apartments.facility_type IS '시설 타입: gym(헬스장), ac_cleaning(에어컨 청소업체), apartment(아파트)';

-- 완료 메시지
SELECT '✅ facility_type 컬럼이 성공적으로 추가되었습니다.' AS result;
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'apartments' 
  AND column_name = 'facility_type';
