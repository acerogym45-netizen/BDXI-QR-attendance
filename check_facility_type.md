# Facility Type 확인 및 수정 방법

## 방법 1: Supabase Dashboard에서 직접 수정

1. Supabase Dashboard 접속
2. Table Editor → `apartments` 테이블 선택
3. 사용 중인 시설 찾기
4. `facility_type` 컬럼 확인
5. 값이 `ac_cleaning`이 아니면 → 클릭해서 `ac_cleaning`으로 수정
6. Save

## 방법 2: SQL Query로 수정

```sql
-- 모든 시설을 ac_cleaning으로 설정 (테스트용)
UPDATE apartments 
SET facility_type = 'ac_cleaning';

-- 또는 특정 시설만
UPDATE apartments 
SET facility_type = 'ac_cleaning'
WHERE code = 'APT001';  -- 또는 해당 시설 코드
```

## 방법 3: index.html에서 임시로 버튼 항상 표시

scan.html에서 아래 코드를 찾아서:
```javascript
showACPhotoBtnIfNeeded: function() {
  if (this.state.facilityType === 'ac_cleaning') {
```

이렇게 수정 (임시):
```javascript
showACPhotoBtnIfNeeded: function() {
  if (true) {  // 임시로 항상 표시
```

또는:
```javascript
showACPhotoBtnIfNeeded: function() {
  const btn = document.getElementById('ac-work-photo-btn');
  if (btn) btn.classList.remove('hidden');  // 조건 없이 항상 표시
},
```
