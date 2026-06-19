# 🎯 다음 단계 안내
# Next Steps Guide

## ✅ 완료된 작업 (Completed Tasks)

### 1. 📚 가이드 문서 작성
- ✅ `DELETION_GUIDE.md` - 아파트 데이터 삭제 가이드
- ✅ `delete-all-apartment-data.sql` - 전체 데이터 삭제 SQL 스크립트
- ✅ `add-facility-type.sql` - 시설 타입 컬럼 추가 마이그레이션
- ✅ `REBRANDING_GUIDE.md` - 전체 리브랜딩 가이드 (상세 단계별 지침)

### 2. 🏢 마스터 관리자 대시보드 업데이트
- ✅ 페이지 제목 변경: "마스터플랜리소스" → "ERP CRM LJH"
- ✅ 용어 변경: "아파트" → "시설"
- ✅ "아파트 추가" 버튼 → "시설 추가"
- ✅ 시설 타입 선택 드롭다운 추가 (🏋️ 헬스장, ❄️ 에어컨 청소업체, 🏢 아파트)
- ✅ 시설 타입별 도움말 기능 추가
- ✅ facility_type 필드 저장 및 로드 로직 구현
- ✅ 시설 카드에 타입 배지 표시

---

## 📋 남은 작업 (Remaining Tasks)

### Phase 1: 데이터베이스 정리 (필수)

#### 1-1. Foreign Key 제약 문제 해결

**현재 상황:**
- Supabase에서 apartments 테이블 삭제 시 에러 발생
- 원인: employees 테이블이 apartments를 참조하는 외래키 제약

**해결 방법 (아래 중 하나 선택):**

**방법 A: SQL 스크립트 사용 (권장) ⭐**
```bash
1. Supabase Dashboard 접속
2. SQL Editor 메뉴 클릭
3. delete-all-apartment-data.sql 파일 내용 복사
4. SQL Editor에 붙여넣기
5. RUN 버튼 클릭
```

**방법 B: UI에서 수동 삭제**
- `DELETION_GUIDE.md` 파일 참조
- 순서: attendance_records → vacations → sales → holidays → locations → employees → apartments

#### 1-2. 시설 타입 컬럼 추가

```bash
1. Supabase Dashboard → SQL Editor
2. add-facility-type.sql 파일 내용 복사
3. 붙여넣기 후 RUN 실행
```

이 스크립트는:
- `apartments` 테이블에 `facility_type` 컬럼 추가
- 가능한 값: 'gym', 'ac_cleaning', 'apartment'
- 기본값: 'apartment'

---

### Phase 2: GitHub 저장소 이름 변경

#### 2-1. GitHub에서 저장소 이름 변경

```
1. GitHub 저장소 페이지 접속
   https://github.com/acerogym45-netizen/BDXI-QR-attendance

2. Settings 탭 클릭

3. "Repository name" 섹션 찾기
   현재: BDXI-QR-attendance
   변경: erpcrm-ljh

4. Rename 버튼 클릭
```

#### 2-2. 로컬 Git Remote 업데이트 (자동 처리됨)

변경 후 다음 push 시 자동으로 새 URL로 업데이트됩니다.

수동 업데이트 방법:
```bash
cd /home/user/webapp
git remote set-url origin https://github.com/acerogym45-netizen/erpcrm-ljh.git
git remote -v  # 확인
```

---

### Phase 3: Vercel 프로젝트 이름 변경

#### 3-1. Vercel에서 프로젝트 이름 변경

```
1. Vercel Dashboard 접속
   https://vercel.com/dashboard

2. bdxi-qr-attendance 프로젝트 선택

3. Settings → General 이동

4. "Project Name" 변경
   현재: bdxi-qr-attendance
   변경: erpcrm-ljh

5. Save 클릭
```

#### 3-2. 새 도메인 확인

변경 후 자동 할당되는 도메인:
- 기존: `bdxi-qr-attendance.vercel.app`
- 신규: `erpcrm-ljh.vercel.app`

---

### Phase 4: 코드 용어 리브랜딩 (대규모 작업)

#### 4-1. index.html 수정 필요 사항

**변경할 텍스트:**
- Title: "KINDWON Admin Dashboard" → "ERP CRM LJH"
- "아파트 선택" → "시설 선택"
- "아파트를 선택하세요" → "시설을 선택하세요"
- "전체 아파트" → "전체 시설"
- "현재 단지" → "현재 시설"
- "내 단지 민원" → "내 시설 민원"

**예상 변경 위치:**
- 로그인 페이지 (line ~321-330)
- 직원 등록 폼 (line ~1926-1936)
- 통계 필터 (line ~1979)
- 정보 수정 모달 (line ~2747-2799)

#### 4-2. employee-app.html 수정

**변경할 텍스트:**
- "아파트" → "시설"
- 로그인 화면의 모든 텍스트

#### 4-3. scan.html 수정

**변경할 텍스트:**
- QR 스캔 관련 모든 "아파트" → "시설"

---

## 🚀 배포 순서 (Deployment Sequence)

### Step 1: 데이터베이스 마이그레이션 ⚠️ 먼저 수행
```sql
-- Supabase SQL Editor에서 실행:
1. delete-all-apartment-data.sql (선택사항 - 기존 데이터 삭제)
2. add-facility-type.sql (필수 - 새 컬럼 추가)
```

### Step 2: GitHub & Vercel 설정 변경
```
1. GitHub 저장소 이름 변경
2. Vercel 프로젝트 이름 변경
3. Git remote URL 확인/업데이트
```

### Step 3: 남은 코드 수정 (차후 작업)
```
1. index.html 용어 변경
2. employee-app.html 용어 변경
3. scan.html 용어 변경
```

### Step 4: Git 커밋 및 배포
```bash
# 변경사항 커밋
git add .
git commit -m "feat: Complete rebranding to multi-facility ERP"

# 푸시 (자동 배포)
git push origin main
```

---

## 📊 현재 진행 상황

| 단계 | 작업 | 상태 | 파일 |
|------|------|------|------|
| 1 | 데이터 삭제 가이드 | ✅ 완료 | DELETION_GUIDE.md |
| 1 | 데이터 삭제 스크립트 | ✅ 완료 | delete-all-apartment-data.sql |
| 1 | 시설 타입 마이그레이션 | ✅ 완료 | add-facility-type.sql |
| 2 | 리브랜딩 가이드 | ✅ 완료 | REBRANDING_GUIDE.md |
| 3 | 마스터 대시보드 수정 | ✅ 완료 | master_dashboard.html |
| 4 | 메인 대시보드 수정 | ⏳ 대기 | index.html |
| 5 | 직원 앱 수정 | ⏳ 대기 | employee-app.html |
| 6 | QR 스캔 페이지 수정 | ⏳ 대기 | scan.html |
| 7 | GitHub 저장소 이름 변경 | ⏳ 대기 | - |
| 8 | Vercel 프로젝트 이름 변경 | ⏳ 대기 | - |

---

## ⚠️ 중요 체크리스트

### 배포 전 확인사항

- [ ] **데이터베이스 백업 완료** (선택사항이지만 권장)
- [ ] **add-facility-type.sql 실행 완료**
- [ ] GitHub 저장소 이름 변경 완료
- [ ] Vercel 프로젝트 이름 변경 완료
- [ ] Git remote URL 업데이트 확인

### 배포 후 테스트

- [ ] 마스터 관리자 로그인 성공
- [ ] "시설 추가" 버튼 클릭 가능
- [ ] 시설 타입 드롭다운 표시 확인
- [ ] 시설 저장 성공 (facility_type 포함)
- [ ] 시설 목록에서 타입 배지 표시 확인
- [ ] 새 도메인 접속 가능 (erpcrm-ljh.vercel.app)

---

## 🆘 문제 해결 (Troubleshooting)

### Q1: "Foreign key constraint" 에러가 계속 나요
→ `DELETION_GUIDE.md`의 "방법 1: SQL 스크립트 사용" 참조
→ 삭제 순서를 지켜야 합니다 (employees → apartments)

### Q2: Vercel 배포가 안 돼요
→ GitHub 저장소 연동 확인
→ Vercel Deployments 탭에서 에러 로그 확인
→ 필요시 수동 Redeploy 클릭

### Q3: Git push가 안 돼요
```bash
# Remote URL 확인
git remote -v

# URL 업데이트
git remote set-url origin https://github.com/acerogym45-netizen/erpcrm-ljh.git

# 다시 시도
git push origin main
```

### Q4: 시설 타입이 저장이 안 돼요
→ Supabase에서 `add-facility-type.sql` 실행 여부 확인
→ SQL Editor에서 다음 쿼리로 확인:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'apartments' AND column_name = 'facility_type';
```

---

## 📞 지원 및 문서

- **전체 가이드**: `REBRANDING_GUIDE.md`
- **데이터 삭제**: `DELETION_GUIDE.md`
- **SQL 스크립트**: `delete-all-apartment-data.sql`, `add-facility-type.sql`

---

## 🎯 즉시 수행 가능한 작업

**우선순위 1 (필수):**
1. Supabase에서 `add-facility-type.sql` 실행
2. (선택) 기존 데이터 삭제 필요시 `delete-all-apartment-data.sql` 실행

**우선순위 2 (권장):**
3. GitHub 저장소 이름 변경
4. Vercel 프로젝트 이름 변경

**우선순위 3 (나중에):**
5. index.html, employee-app.html, scan.html 용어 변경

---

**작성일**: 2026-06-19  
**버전**: 1.0  
**마지막 커밋**: `ae7cebf` - feat: Add facility type selection to master dashboard
