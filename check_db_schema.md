# cleaning_tasks 테이블 스키마 확인 필요

## 예상 문제:
1. photo_urls 컬럼이 JSON/JSONB 타입인데 문자열을 넣고 있음
2. notes 컬럼이 JSON 타입인데 일반 문자열을 넣고 있음
3. 다른 JSON 타입 컬럼에 잘못된 데이터 타입

## 해결 방법:
- 모든 JSON 컬럼 제거하고 필수 필드만 사용
- 또는 JSON 컬럼에 올바른 형식으로 데이터 전달
