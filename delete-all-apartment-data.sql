-- ========================================
-- 전체 아파트 데이터 삭제 스크립트
-- Delete All Apartment Data Script
-- ========================================
-- 
-- 사용 방법 (How to use):
-- 1. Supabase Dashboard → SQL Editor로 이동
-- 2. 아래 SQL을 복사하여 붙여넣기
-- 3. "RUN" 버튼 클릭
-- 4. 모든 데이터가 삭제됩니다 (되돌릴 수 없음!)
--
-- ⚠️ 경고: 이 작업은 되돌릴 수 없습니다!
-- ⚠️ WARNING: This operation cannot be undone!
-- ========================================

-- 1단계: 출퇴근 기록 삭제 (Delete attendance records)
DELETE FROM attendance_records;

-- 2단계: 휴가 기록 삭제 (Delete vacation records)
DELETE FROM vacations;

-- 3단계: 매출 기록 삭제 (Delete sales records)
DELETE FROM sales;

-- 4단계: 공휴일 기록 삭제 (Delete holidays)
DELETE FROM holidays;

-- 5단계: 근무지 기록 삭제 (Delete locations)
DELETE FROM locations;

-- 6단계: 직원 삭제 (Delete employees - this has FK to apartments)
DELETE FROM employees;

-- 7단계: 마지막으로 아파트 삭제 (Finally delete apartments)
DELETE FROM apartments;

-- 완료 메시지 (Completion message)
SELECT '✅ 모든 아파트 관련 데이터가 삭제되었습니다.' AS result;
