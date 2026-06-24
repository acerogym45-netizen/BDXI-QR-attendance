-- ========================================
-- 에어컨 청소업체 작업 관리 테이블
-- ========================================

-- 1. 작업 세션 테이블
CREATE TABLE IF NOT EXISTS work_sessions (
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
CREATE TABLE IF NOT EXISTS work_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_session_id UUID REFERENCES work_sessions(id) ON DELETE CASCADE,
  
  -- 구역 정보
  location_name VARCHAR(255) NOT NULL,
  location_group VARCHAR(100), -- 층, 동 등
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
CREATE TABLE IF NOT EXISTS work_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_location_id UUID REFERENCES work_locations(id) ON DELETE CASCADE,
  
  -- 사진 정보
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(10) CHECK (photo_type IN ('before', 'after')) NOT NULL,
  
  -- 메타데이터
  taken_at TIMESTAMP NOT NULL,
  file_size INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 구역 템플릿 테이블 (재사용)
CREATE TABLE IF NOT EXISTS location_templates (
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

-- 5. 작업 통계 테이블 (집계용)
CREATE TABLE IF NOT EXISTS work_statistics (
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
  avg_time_per_location INTEGER, -- 분
  
  -- 고객 만족도
  avg_rating DECIMAL(3,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(apartment_id, employee_id, work_date)
);

-- 인덱스 생성
CREATE INDEX idx_work_sessions_apartment ON work_sessions(apartment_id);
CREATE INDEX idx_work_sessions_employee ON work_sessions(employee_id);
CREATE INDEX idx_work_sessions_date ON work_sessions(work_date);
CREATE INDEX idx_work_sessions_status ON work_sessions(status);

CREATE INDEX idx_work_locations_session ON work_locations(work_session_id);
CREATE INDEX idx_work_locations_status ON work_locations(status);

CREATE INDEX idx_work_photos_location ON work_photos(work_location_id);
CREATE INDEX idx_work_photos_type ON work_photos(photo_type);

CREATE INDEX idx_location_templates_apartment ON location_templates(apartment_id);

CREATE INDEX idx_work_statistics_apartment ON work_statistics(apartment_id);
CREATE INDEX idx_work_statistics_date ON work_statistics(work_date);

-- 코멘트
COMMENT ON TABLE work_sessions IS '에어컨 청소 작업 세션';
COMMENT ON TABLE work_locations IS '작업 구역 상세';
COMMENT ON TABLE work_photos IS '구역별 비포/애프터 사진';
COMMENT ON TABLE location_templates IS '자주 사용하는 구역 템플릿';
COMMENT ON TABLE work_statistics IS '작업 효율 통계';

-- 완료 메시지
SELECT '✅ 에어컨 청소업체 테이블이 생성되었습니다.' AS result;
