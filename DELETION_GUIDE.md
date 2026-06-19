# 아파트 데이터 삭제 가이드
# Guide to Delete Apartment Data

## ⚠️ 중요: 데이터 삭제 전 확인사항

이 작업은 **되돌릴 수 없습니다**. 모든 데이터(직원, 출퇴근 기록, 매출 등)가 영구적으로 삭제됩니다.

---

## 방법 1: SQL 스크립트 사용 (권장)

### 단계:
1. Supabase Dashboard 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. `delete-all-apartment-data.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. **RUN** 버튼 클릭

### 실행 순서:
```
attendance_records → vacations → sales → holidays → locations → employees → apartments
```

---

## 방법 2: Supabase UI에서 수동 삭제

Foreign Key 제약 때문에 **반드시 이 순서대로** 삭제해야 합니다:

### 1단계: attendance_records 테이블
- Table Editor → `attendance_records` 테이블 선택
- 모든 행 선택 (왼쪽 상단 체크박스)
- Delete rows 클릭

### 2단계: vacations 테이블
- `vacations` 테이블로 이동
- 모든 행 선택 및 삭제

### 3단계: sales 테이블
- `sales` 테이블로 이동
- 모든 행 선택 및 삭제

### 4단계: holidays 테이블
- `holidays` 테이블로 이동
- 모든 행 선택 및 삭제

### 5단계: locations 테이블
- `locations` 테이블로 이동
- 모든 행 선택 및 삭제

### 6단계: employees 테이블 ⚠️
- `employees` 테이블로 이동
- 모든 행 선택 및 삭제
- **이 테이블이 apartments를 참조하고 있어서 먼저 삭제해야 합니다**

### 7단계: apartments 테이블 (마지막)
- `apartments` 테이블로 이동
- 이제 모든 행 선택 및 삭제 가능

---

## 방법 3: CASCADE 옵션 설정 (고급)

Foreign Key에 CASCADE 옵션을 추가하면 apartments 삭제 시 자동으로 관련 데이터가 삭제됩니다.

**⚠️ 주의: 이 방법은 데이터베이스 스키마를 변경하므로 신중하게 사용하세요.**

```sql
-- 기존 외래 키 제거
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_apartment_id_fkey;

-- CASCADE 옵션과 함께 외래 키 재생성
ALTER TABLE employees 
ADD CONSTRAINT employees_apartment_id_fkey 
FOREIGN KEY (apartment_id) 
REFERENCES apartments(id) 
ON DELETE CASCADE;

-- 이제 apartments 삭제 시 employees도 자동 삭제됨
DELETE FROM apartments;
```

---

## 삭제 후 확인

모든 데이터가 삭제되었는지 확인:

```sql
SELECT 
  (SELECT COUNT(*) FROM apartments) as apartments_count,
  (SELECT COUNT(*) FROM employees) as employees_count,
  (SELECT COUNT(*) FROM attendance_records) as attendance_count,
  (SELECT COUNT(*) FROM holidays) as holidays_count,
  (SELECT COUNT(*) FROM locations) as locations_count,
  (SELECT COUNT(*) FROM vacations) as vacations_count,
  (SELECT COUNT(*) FROM sales) as sales_count;
```

모든 카운트가 0이면 성공입니다.

---

## 문제 해결

### "still referenced from table" 에러가 계속 나는 경우:
- 삭제 순서를 다시 확인하세요
- employees 테이블을 apartments 보다 **먼저** 삭제해야 합니다

### RLS (Row Level Security) 정책 에러가 나는 경우:
```sql
-- RLS 임시 비활성화 (마스터 관리자만 가능)
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE apartments DISABLE ROW LEVEL SECURITY;

-- 데이터 삭제 후 다시 활성화
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
```

---

## 권장 방법

**→ 방법 1 (SQL 스크립트)**을 사용하는 것이 가장 안전하고 빠릅니다.
