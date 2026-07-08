# ✅ ESP32-CAM 준비 체크리스트

간단 버전 - 프린트해서 체크하세요!

---

## 📅 배송 전 (지금 할 일)

### 소프트웨어 설치

```
□ Arduino IDE 설치
  → https://www.arduino.cc/en/software
  → 또는 Microsoft Store에서 검색

□ ESP32 보드 추가
  → Arduino IDE → 파일 → 환경설정
  → URL 추가: 
    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
  → 도구 → 보드 매니저 → "esp32" 검색 → 설치

□ USB 드라이버 설치 (필요시)
  → CH340 드라이버 검색 후 설치
```

### 정보 준비

```
WiFi 정보:
  이름(SSID): ________________________
  비밀번호:    ________________________
  주파수:      □ 2.4GHz (필수) / □ 5GHz (안됨)

작업자 정보:
  이름: ________________________
  시설 ID: ______ (Supabase apartments 테이블)
```

### 하드웨어 준비

```
□ USB 케이블 확인 (마이크로 USB)
  → 데이터 전송 가능한 케이블
  → 충전 전용 케이블은 안됨!
  → 없으면 다이소 3,000원

□ 작업 공간 준비
  → 책상 정리
  → 조명 확인
  → 컴퓨터 전원 연결
```

---

## 📦 배송 도착 후 (30분 작업)

### 1단계: 하드웨어 조립 (5분)

```
□ 택배 개봉
□ 구성품 확인:
  □ ESP32-CAM 보드
  □ 연결 보드 (MB)
  □ 카메라 모듈
  □ WiFi 안테나

□ ESP32-CAM을 연결 보드에 끼우기
  → 핀이 맞게 삽입
  → 딸깍 소리 날 때까지

□ 안테나 연결 (선택)

□ USB 케이블로 컴퓨터 연결
```

### 2단계: 펌웨어 수정 (10분)

```
□ Arduino IDE 실행

□ 펌웨어 파일 열기:
  esp32_camera_firmware_v2/esp32_camera_firmware_v2.ino

□ 코드 수정 (15~30번 줄):
  const char* WIFI_SSID = "작업장_WiFi_이름";     ✏️
  const char* WIFI_PASSWORD = "WiFi_비밀번호";   ✏️
  const char* EMPLOYEE_NAME = "홍길동";          ✏️
  const int APARTMENT_ID = 1;                    ✏️

□ 저장 (Ctrl+S)
```

### 3단계: 보드 설정 (3분)

```
□ 도구 → 보드 → esp32 → AI Thinker ESP32-CAM

□ 도구 → Upload Speed → 115200

□ 도구 → Flash Frequency → 80MHz

□ 도구 → Partition Scheme → Huge APP (3MB No OTA)

□ 도구 → 포트 → COM3 (또는 다른 번호)
  ⚠️ 포트가 안보이면:
    - USB 케이블 재연결
    - 드라이버 재설치
```

### 4단계: 업로드 (5분)

```
□ "업로드" 버튼 클릭 (→ 아이콘) 또는 Ctrl+U

□ "Connecting..." 메시지 나오면
  → ESP32-CAM의 작은 리셋 버튼 누르기

□ "Writing at 0x00001000..." 나오면
  → 업로드 진행 중 (기다리기)

□ "Hard resetting via RTS pin..." 나오면
  → ✅ 업로드 성공!
```

### 5단계: 테스트 (10분)

```
□ 시리얼 모니터 열기 (Ctrl+Shift+M)

□ 보드레이트 115200 선택 (우측 하단)

□ ESP32-CAM 리셋 버튼 누르기

□ 로그 확인:
  ✅ "Camera init: OK"
  ✅ "WiFi connected"
  ✅ "IP: 192.168.x.x"
  ✅ "시스템 준비 완료"

□ 테스트 촬영:
  → GPIO 13에 버튼 연결 (또는 핀을 GND에 잠깐 터치)
  → 시리얼 모니터에서 업로드 로그 확인

□ Supabase 확인:
  → https://erpcrm-ljh.vercel.app/index.html
  → 로그인 → "업무 사진" 탭
  → 방금 촬영한 사진 확인

□ ✅ 성공!
```

---

## 🔥 문제 해결 빠른 가이드

### "COM 포트가 안보여요"

```
→ USB 케이블 재연결
→ 다른 USB 포트 시도
→ CH340 드라이버 재설치
→ 컴퓨터 재부팅
```

### "업로드 실패 (Connecting...)"

```
→ 리셋 버튼 누르기
→ 케이블 재연결 후 재시도
→ Upload Speed를 115200으로 변경
```

### "WiFi 연결 안됨"

```
→ SSID/비밀번호 재확인 (대소문자 정확히)
→ 2.4GHz WiFi인지 확인
→ 공유기와 거리 확인 (3m 이내)
→ 공유기 재부팅
```

### "카메라 초기화 실패"

```
→ ESP32-CAM 리셋
→ 카메라 플랫 케이블 재장착
→ 5V 전원 확인
→ 다른 USB 포트 시도
```

### "업로드 성공했지만 사진이 안보여요"

```
→ Supabase Storage 'cleaning-photos' 버킷 확인
→ Public 업로드 권한 확인
→ API 키 확인
→ 시리얼 모니터에서 에러 로그 확인
```

---

## 🎯 성공 후 다음 단계

### 배터리 & 버튼 추가 (선택)

```
□ 18650 배터리 + 홀더 구매 (7,000원)
□ 푸시 버튼 구매 (1,000원)
□ 손목 밴드 구매 (2,000원)
□ 점퍼 와이어 구매 (3,000원)

→ CIRCUIT_DIAGRAM.md 참고
```

### 실전 배포

```
□ 지인 작업자에게 전달
□ 현장 WiFi 설정
□ 사용법 교육 (버튼 사용법)
□ 1일 테스트 진행
□ 피드백 수집
□ 개선 및 양산
```

---

## 📞 도움말

```
자세한 가이드:
- QUICK_START.md (빠른 시작)
- README.md (전체 개요)
- CIRCUIT_DIAGRAM.md (회로도)
- SHOPPING_LIST.md (부품 구매)

문제 발생 시:
1. 시리얼 모니터 로그 확인
2. LED 깜빡임 패턴 확인
3. QUICK_START.md의 "문제 해결" 섹션 참고
```

---

**배송 추적하고, 도착하면 이 체크리스트 따라하세요!** 📦✅

**예상 소요 시간: 30분**  
**성공률: 99% (가이드 따라하면)**
