# 🎨 ERP 시스템 리브랜딩 가이드
# ERP System Rebranding Guide

## 📋 개요 (Overview)

KINDWON 아파트 관리 시스템을 다목적 시설 관리 ERP 시스템으로 전환합니다.

**변경 사항:**
- 프로젝트명: `bdxi-qr-attendance` → `erpcrm-ljh`
- 용어: "아파트/단지" → "시설" (facility)
- 기능: 시설 타입별 커스터마이징 (헬스장, 에어컨 청소업체, 아파트)

---

## 🔄 Step 1: 데이터베이스 정리

### 1-1. 기존 데이터 삭제 (선택사항)

⚠️ **주의**: 이 작업은 되돌릴 수 없습니다!

**방법 1: SQL 스크립트 사용 (권장)**
```bash
# Supabase SQL Editor에서 delete-all-apartment-data.sql 실행
```

**방법 2: 수동 삭제**
- `DELETION_GUIDE.md` 파일 참조

### 1-2. 시설 타입 컬럼 추가

```bash
# Supabase SQL Editor에서 실행:
# add-facility-type.sql
```

이 스크립트는 다음을 수행합니다:
- `apartments` 테이블에 `facility_type` 컬럼 추가
- 가능한 값: `gym`, `ac_cleaning`, `apartment`
- 기본값: `apartment`

---

## 🏷️ Step 2: GitHub 저장소 이름 변경

### 2-1. GitHub에서 저장소 이름 변경

1. GitHub 저장소 페이지로 이동
   - `https://github.com/acerogym45-netizen/BDXI-QR-attendance`

2. **Settings** 탭 클릭

3. **Repository name** 섹션에서:
   - 현재 이름: `BDXI-QR-attendance`
   - 새 이름: `erpcrm-ljh`

4. **Rename** 버튼 클릭

### 2-2. 로컬 Git Remote URL 업데이트

```bash
cd /home/user/webapp
git remote set-url origin https://github.com/acerogym45-netizen/erpcrm-ljh.git
git remote -v  # 확인
```

---

## 🌐 Step 3: Vercel 프로젝트 이름 변경

### 3-1. Vercel 대시보드에서 변경

1. Vercel 대시보드 접속
   - `https://vercel.com/dashboard`

2. `bdxi-qr-attendance` 프로젝트 선택

3. **Settings** → **General** 이동

4. **Project Name** 섹션에서:
   - 현재 이름: `bdxi-qr-attendance`
   - 새 이름: `erpcrm-ljh`

5. **Save** 클릭

### 3-2. 새 도메인 확인

변경 후 자동으로 할당되는 도메인:
- 기존: `bdxi-qr-attendance.vercel.app`
- 신규: `erpcrm-ljh.vercel.app`

---

## 💬 Step 4: 용어 리브랜딩 (Terminology Rebranding)

### 4-1. 변경할 용어 목록

| 기존 (Old) | 신규 (New) | 영문 |
|-----------|-----------|------|
| 아파트 | 시설 | facility |
| 단지 | 시설 | facility |
| 관리사무소 | 본사 / 관리 센터 | HQ / Management Center |
| 아파트 선택 | 시설 선택 | Select Facility |
| 아파트 추가 | 시설 추가 | Add Facility |
| 전체 아파트 | 전체 시설 | All Facilities |
| 주의 아파트 | 주의 현장 | Warning Sites |

### 4-2. 파일별 변경 사항

**주요 수정 파일:**
- `index.html` - 메인 관리자 대시보드
- `master_dashboard.html` - 마스터 관리자 대시보드
- `employee-app.html` - 직원 앱
- `scan.html` - QR 스캔 페이지

**변경 예시:**
```html
<!-- 기존 -->
<label>아파트 선택</label>
<option value="">아파트를 선택하세요</option>

<!-- 신규 -->
<label>시설 선택</label>
<option value="">시설을 선택하세요</option>
```

---

## 🏢 Step 5: 시설 타입 선택 기능 추가

### 5-1. master_dashboard.html 수정

**변경 위치 1: 퀵액션 버튼**
```html
<!-- 기존 (line ~267) -->
<button onclick="showAddApartmentModal()" class="...">
  <i class="fas fa-building"></i>
  아파트 추가
</button>

<!-- 신규 -->
<button onclick="showAddFacilityModal()" class="...">
  <i class="fas fa-building"></i>
  시설 추가
</button>
```

**변경 위치 2: 모달 타이틀**
```html
<!-- 기존 (line ~305) -->
<h3 class="..." id="modalTitle">
  <i class="fas fa-building mr-2"></i>아파트 추가
</h3>

<!-- 신규 -->
<h3 class="..." id="modalTitle">
  <i class="fas fa-building mr-2"></i>시설 추가
</h3>
```

**추가: 시설 타입 선택 드롭다운**
```html
<!-- 아파트명 입력란 아래에 추가 -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    <i class="fas fa-tags mr-1"></i>시설 타입
  </label>
  <select id="facility-type" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required>
    <option value="">시설 타입을 선택하세요</option>
    <option value="gym">🏋️ 헬스장</option>
    <option value="ac_cleaning">❄️ 에어컨 청소업체</option>
    <option value="apartment">🏢 아파트</option>
  </select>
  <p class="text-xs text-gray-500 mt-1">
    시설 타입에 따라 맞춤 기능이 제공됩니다
  </p>
</div>
```

### 5-2. JavaScript 함수 수정

**데이터 저장시 facility_type 포함:**
```javascript
async function saveApartment() {
  const facilityType = document.getElementById('facility-type').value;
  
  if (!facilityType) {
    alert('시설 타입을 선택해주세요.');
    return;
  }
  
  const apartmentData = {
    name: document.getElementById('apartment-name').value,
    facility_type: facilityType,  // 추가
    // ... 기타 필드
  };
  
  // Supabase insert/update
}
```

### 5-3. 시설 타입별 커스터마이징

**index.html에 시설 타입 감지 로직 추가:**
```javascript
// 현재 선택된 시설의 타입 확인
getCurrentFacilityType: function() {
  if (!this.currentApartment) return null;
  return this.currentApartment.facility_type || 'apartment';
},

// 시설 타입별 UI 조정
applyFacilityTypeCustomization: function() {
  const facilityType = this.getCurrentFacilityType();
  
  switch(facilityType) {
    case 'gym':
      // 헬스장 관련 기능 활성화
      document.querySelector('[data-tab="회원관리"]').style.display = 'block';
      document.querySelector('[data-tab="수업일정"]').style.display = 'block';
      break;
      
    case 'ac_cleaning':
      // 에어컨 청소 관련 기능 활성화
      document.querySelector('[data-tab="청소일정"]').style.display = 'block';
      document.querySelector('[data-tab="장비관리"]').style.display = 'block';
      break;
      
    case 'apartment':
      // 기존 아파트 관리 기능 (현재 상태 유지)
      break;
  }
}
```

---

## 📝 Step 6: 코드 변경 체크리스트

### 6-1. index.html

- [ ] Title 변경: `KINDWON Admin Dashboard` → `ERP CRM LJH`
- [ ] 로그인 페이지 문구: "아파트" → "시설"
- [ ] 아파트 선택 드롭다운 → 시설 선택
- [ ] 직원 등록 폼: "아파트" → "시설"
- [ ] 통계 레이블: "전체 아파트" → "전체 시설"
- [ ] 검색 placeholder: "아파트명" → "시설명"

### 6-2. master_dashboard.html

- [ ] Title: `마스터플랜리소스 총괄 관리자` → `ERP CRM LJH 총괄 관리자`
- [ ] "전체 아파트" → "전체 시설"
- [ ] "아파트 추가" 버튼 → "시설 추가"
- [ ] 시설 타입 드롭다운 추가
- [ ] saveApartment() 함수에 facility_type 필드 추가
- [ ] 시설 목록 카드에 타입 표시 추가

### 6-3. employee-app.html

- [ ] "아파트" → "시설" (직원이 보는 모든 텍스트)
- [ ] 로그인 화면: "아파트 선택" → "시설 선택"

### 6-4. scan.html

- [ ] QR 스캔 페이지 텍스트 변경

---

## 🎯 Step 7: 시설 타입별 기능 커스터마이징 계획

### 7-1. 헬스장 (gym)

**특화 기능:**
- 회원 관리 탭 추가
- 수업 일정 관리
- PT 예약 시스템
- 회원권 만료 알림
- 운동 기구 점검 일정

**UI 변경:**
- "직원" → "트레이너"
- "근무시간" → "운영시간"
- "출퇴근" → "체크인/체크아웃"

### 7-2. 에어컨 청소업체 (ac_cleaning)

**특화 기능:**
- 청소 일정 캘린더
- 고객 현장 관리
- 장비 재고 관리
- 청소 체크리스트
- 고객 피드백 수집

**UI 변경:**
- "직원" → "청소 기사"
- "근무지" → "청소 현장"
- "출퇴근" → "현장 도착/완료"

### 7-3. 아파트 (apartment)

**기존 기능 유지:**
- 현재 모든 기능 그대로 사용
- 관리사무소 → 관리 센터

---

## 🚀 Step 8: 배포 순서

### 8-1. 준비 단계
```bash
# 1. 현재 작업 확인
cd /home/user/webapp
git status

# 2. 최신 코드 백업
git add .
git commit -m "backup: Before rebranding"
git push origin main
```

### 8-2. 데이터베이스 마이그레이션
1. Supabase SQL Editor에서 `add-facility-type.sql` 실행
2. 컬럼 추가 확인

### 8-3. 코드 변경
1. `master_dashboard.html` 수정
2. `index.html` 수정
3. `employee-app.html` 수정
4. `scan.html` 수정

### 8-4. Git 커밋 및 배포
```bash
# 변경사항 커밋
git add .
git commit -m "feat: Rebrand to multi-facility ERP system (erpcrm-ljh)

- Add facility_type column (gym, ac_cleaning, apartment)
- Change terminology: 아파트 → 시설
- Add facility type selection in master admin
- Update all UI labels and messages"

# 메인 브랜치에 푸시
git push origin main
```

### 8-5. Vercel 자동 배포 확인
- Vercel 대시보드에서 배포 진행 상태 확인
- 배포 완료 후 새 도메인 접속 테스트

---

## ✅ 최종 확인 사항

### 테스트 체크리스트

- [ ] 마스터 관리자 로그인 성공
- [ ] "시설 추가" 버튼 클릭
- [ ] 시설 타입 선택 드롭다운 표시 확인
- [ ] 각 시설 타입 선택 가능 확인
- [ ] 시설 저장 성공 (facility_type 포함)
- [ ] 시설 목록에서 타입 표시 확인
- [ ] 관리자 대시보드 "시설" 용어 적용 확인
- [ ] 직원 앱 "시설" 용어 적용 확인
- [ ] QR 출퇴근 정상 작동

---

## 📚 참고 문서

- `DELETION_GUIDE.md` - 데이터 삭제 가이드
- `delete-all-apartment-data.sql` - 전체 데이터 삭제 스크립트
- `add-facility-type.sql` - 시설 타입 컬럼 추가 스크립트

---

## 🆘 문제 해결

### Foreign Key 제약 에러
→ `DELETION_GUIDE.md` 참조

### Git Remote URL 오류
```bash
git remote -v
git remote set-url origin https://github.com/acerogym45-netizen/erpcrm-ljh.git
```

### Vercel 배포 실패
1. GitHub 연동 확인
2. Vercel 로그 확인
3. 필요시 수동 재배포

---

**작성일**: 2026-06-19  
**버전**: 1.0  
**작성자**: AI Development Assistant
