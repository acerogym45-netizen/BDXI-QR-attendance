-- ========================================
-- 에어컨 청소업체 작업 관리 테이블
-- 완전히 새로 생성 (기존 테이블 삭제 후 재생성)
-- ========================================

-- 🔴 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS work_photos CASCADE;
DROP TABLE IF EXISTS work_locations CASCADE;
DROP TABLE IF EXISTS work_sessions CASCADE;
DROP TABLE IF EXISTS location_templates CASCADE;
DROP TABLE IF EXISTS work_statistics CASCADE;

-- ========================================
-- 테이블 생성
-- ========================================

-- 1. 작업 세션 테이블
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  -- 고객 정보
  customer_name VARCHAR(255),
  customer_address TEXT,
  customer_phone VARCHAR(50),
  
  -- 작업 정보
  work_date DATE NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  
  -- 진행 상태
  status VARCHAR(20) CHECK (status IN ('in_progress', 'completed', 'pending_review')) DEFAULT 'in_progress',
  total_locations INTEGER DEFAULT 0,
  completed_locations INTEGER DEFAULT 0,
  
  -- 고객 피드백
  customer_signature TEXT,
  customer_feedback TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 작업 구역 테이블
CREATE TABLE work_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_session_id UUID REFERENCES work_sessions(id) ON DELETE CASCADE,
  
  -- 구역 정보
  location_name VARCHAR(255) NOT NULL,
  location_group VARCHAR(100),
  display_order INTEGER,
  
  -- 작업 상태
  status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  
  -- 작업 시간
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- 메모
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 작업 사진 테이블
CREATE TABLE work_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_location_id UUID REFERENCES work_locations(id) ON DELETE CASCADE,
  
  -- 사진 정보
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(10) CHECK (photo_type IN ('before', 'after')) NOT NULL,
  
  -- 메타데이터
  file_size INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 구역 템플릿 테이블
CREATE TABLE location_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  
  -- 템플릿 정보
  template_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  
  -- 구역 목록 (JSON)
  locations JSONB NOT NULL,
  
  -- 사용 통계
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 작업 통계 테이블
CREATE TABLE work_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  work_date DATE NOT NULL,
  
  -- 작업 통계
  total_sessions INTEGER DEFAULT 0,
  total_locations INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  
  -- 시간 통계
  total_work_minutes INTEGER DEFAULT 0,
  avg_time_per_location INTEGER,
  
  -- 고객 만족도
  avg_rating DECIMAL(3,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(apartment_id, employee_id, work_date)
);

-- ========================================
-- 인덱스 생성
-- ========================================

-- work_sessions 인덱스
CREATE INDEX idx_work_sessions_apartment ON work_sessions(apartment_id);
CREATE INDEX idx_work_sessions_employee ON work_sessions(employee_id);
CREATE INDEX idx_work_sessions_date ON work_sessions(work_date);
CREATE INDEX idx_work_sessions_status ON work_sessions(status);

-- work_locations 인덱스
CREATE INDEX idx_work_locations_session ON work_locations(work_session_id);
CREATE INDEX idx_work_locations_status ON work_locations(status);

-- work_photos 인덱스
CREATE INDEX idx_work_photos_location ON work_photos(work_location_id);
CREATE INDEX idx_work_photos_type ON work_photos(photo_type);

-- location_templates 인덱스
CREATE INDEX idx_location_templates_apartment ON location_templates(apartment_id);

-- work_statistics 인덱스
CREATE INDEX idx_work_statistics_apartment ON work_statistics(apartment_id);
CREATE INDEX idx_work_statistics_date ON work_statistics(work_date);

-- ========================================
-- 테이블 설명
-- ========================================

COMMENT ON TABLE work_sessions IS '에어컨 청소 작업 세션';
COMMENT ON TABLE work_locations IS '작업 구역 상세';
COMMENT ON TABLE work_photos IS '구역별 비포/애프터 사진';
COMMENT ON TABLE location_templates IS '자주 사용하는 구역 템플릿';
COMMENT ON TABLE work_statistics IS '작업 효율 통계';

-- ========================================
-- 컬럼 설명
-- ========================================

COMMENT ON COLUMN work_sessions.status IS 'in_progress: 진행중, completed: 완료, pending_review: 검토대기';
COMMENT ON COLUMN work_locations.status IS 'pending: 대기, in_progress: 진행중, completed: 완료';
COMMENT ON COLUMN work_photos.photo_type IS 'before: 작업 전, after: 작업 후';

-- ========================================
-- 완료 메시지
-- ========================================

SELECT '✅ 에어컨 청소업체 테이블 생성 완료!' AS "상태",
       '5개 테이블, 11개 인덱스' AS "생성된 객체",
       'work_sessions, work_locations, work_photos, location_templates, work_statistics' AS "테이블 목록";
