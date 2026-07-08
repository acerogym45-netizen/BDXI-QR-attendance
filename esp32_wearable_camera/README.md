# 🎥 ESP32-CAM 웨어러블 카메라 시스템

에어컨 청소 작업자를 위한 손목 착용형 자동 촬영 시스템

## 📋 목차
1. [하드웨어 준비](#하드웨어-준비)
2. [개발 환경 설정](#개발-환경-설정)
3. [펌웨어 업로드](#펌웨어-업로드)
4. [조립 가이드](#조립-가이드)
5. [사용 방법](#사용-방법)
6. [문제 해결](#문제-해결)

---

## 🛒 하드웨어 준비

### 필수 구성품 (총 28,000원)

| 품목 | 수량 | 가격 | 구매 링크 |
|------|------|------|----------|
| ESP32-CAM (AI-Thinker) | 1개 | 12,000원 | [쿠팡](https://www.coupang.com) / [디바이스마트](https://www.devicemart.co.kr) |
| FTDI FT232RL USB-TTL | 1개 | 5,000원 | [쿠팡](https://www.coupang.com) |
| 푸시 버튼 스위치 | 1개 | 1,000원 | 다이소 / 디바이스마트 |
| 18650 리튬 배터리 | 1개 | 5,000원 | [쿠팡](https://www.coupang.com) |
| 18650 배터리 홀더 | 1개 | 2,000원 | [쿠팡](https://www.coupang.com) |
| 벨크로 손목 밴드 | 1개 | 3,000원 | 다이소 |

### 선택 구성품 (업그레이드)

| 품목 | 수량 | 가격 | 용도 |
|------|------|------|------|
| 방수 케이스 (85x85x35mm) | 1개 | 5,000원 | 물기/먼지 보호 |
| LED (5mm 초록색) | 1개 | 500원 | 촬영 완료 표시 |
| 진동 모터 | 1개 | 2,000원 | 햅틱 피드백 |
| 점퍼 와이어 세트 | 1세트 | 3,000원 | 배선 |

---

## 💻 개발 환경 설정

### 1. Arduino IDE 설치

**Windows:**
```powershell
# Chocolatey 사용 (권장)
choco install arduino

# 또는 수동 다운로드
https://www.arduino.cc/en/software
```

**macOS:**
```bash
# Homebrew 사용
brew install --cask arduino
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install arduino

# 또는 Snap
sudo snap install arduino
```

### 2. ESP32 보드 매니저 추가

1. Arduino IDE 실행
2. **파일 → 환경설정** (또는 `Ctrl+,`)
3. **추가적인 보드 매니저 URLs**에 추가:
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```
4. **도구 → 보드 → 보드 매니저**
5. "esp32" 검색 → **ESP32 by Espressif Systems** 설치

### 3. 필수 라이브러리 설치

**스케치 → 라이브러리 포함하기 → 라이브러리 관리**에서 다음 설치:

- ✅ **ESP32** (보드 매니저에서 설치됨)
- ✅ **ArduinoJson** (by Benoit Blanchon) - Supabase API용

---

## 🔌 하드웨어 연결

### ESP32-CAM ↔ FTDI 연결 (프로그래밍)

| ESP32-CAM | FTDI |
|-----------|------|
| 5V | VCC (5V) |
| GND | GND |
| U0R (RX) | TX |
| U0T (TX) | RX |
| IO0 | GND (업로드 시만) |

⚠️ **주의:** 
- 업로드 시 IO0을 GND에 연결
- 업로드 완료 후 IO0 연결 해제 후 리셋

### ESP32-CAM 핀 배치 (실제 사용)

```
               [안테나]
        ┌─────────────────┐
  GND ──┤1              5V├── 5V (배터리 +)
  IO12 ┤2               3V3├── 3.3V
  IO13 ┤3              IO16├── 
   IO15┤4              IO14├── 
   IO14┤5               IO2├── 버튼 (풀업)
   IO2 ┤6               IO4├── LED (내장)
   IO4 ┤7              IO12├──
  GND ──┤8               GND├── GND (배터리 -)
        └─────────────────┘
           [카메라 렌즈]
```

### 버튼 연결
```
GPIO 13 ──┬── 버튼 ── GND
          │
       10kΩ 풀업 저항
          │
         3.3V
```

### LED 연결 (선택)
```
GPIO 33 ── 330Ω 저항 ── LED (+) ── GND
```

---

## 📱 Supabase 설정

### 1. Storage Bucket 확인

Supabase 대시보드에서:
1. **Storage** → `cleaning-photos` 버킷 확인
2. **Settings** → **Public** 체크 (공개 업로드)

### 2. API 키 확인

```javascript
SUPABASE_URL: https://qgpqhtuynxhmgawakjxe.supabase.co
SUPABASE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

펌웨어 코드에 이 값들을 입력합니다.

---

## 🚀 펌웨어 업로드

### 1. 코드 열기
- `esp32_camera_firmware/esp32_camera_firmware.ino` 파일 열기

### 2. WiFi 설정
```cpp
// WiFi 설정 (작업 현장의 WiFi)
const char* ssid = "작업장_WiFi_이름";
const char* password = "WiFi_비밀번호";
```

### 3. 작업자 정보 설정
```cpp
// 작업자 정보 (각 장치마다 다르게 설정)
const char* EMPLOYEE_NAME = "홍길동";
const int APARTMENT_ID = 1; // Supabase apartments 테이블의 ID
```

### 4. 보드 설정
- **도구 → 보드:** "AI Thinker ESP32-CAM"
- **도구 → Upload Speed:** "115200"
- **도구 → Flash Frequency:** "80MHz"
- **도구 → Partition Scheme:** "Huge APP (3MB No OTA)"

### 5. 업로드
1. IO0을 GND에 연결
2. **업로드** 버튼 클릭
3. "Connecting..." 나오면 ESP32-CAM 리셋 버튼 누름
4. 업로드 완료 후 IO0 연결 해제
5. 리셋 버튼 다시 누름

---

## 🔨 조립 가이드

### 1. 기본 조립 (프로토타입)

```
[배터리 홀더]
      │
      ├── (+) ──→ ESP32-CAM 5V
      └── (-) ──→ ESP32-CAM GND
      
[버튼]
      │
      ├── 한쪽 ──→ GPIO 13
      └── 다른쪽 ──→ GND
```

### 2. 손목 밴드 장착

```
┌──────────────────────────┐
│   [ESP32-CAM 모듈]       │
│   [배터리 (뒷면)]         │
│                          │
│     [버튼] ← 엄지 위치   │
└──────────────────────────┘
         ↓
    벨크로 밴드로 고정
         ↓
      손목에 착용
```

### 3. 케이블 정리
- 점퍼 와이어를 최대한 짧게 자름
- 열수축 튜브로 연결부 보호
- 글루건으로 고정

---

## 🎮 사용 방법

### 초기 설정

1. **전원 켜기**
   - 배터리를 ESP32-CAM에 연결
   - 내장 LED가 깜빡이면 부팅 중

2. **WiFi 연결 확인**
   - 3초 후 LED가 계속 켜지면 WiFi 연결 성공
   - LED가 깜빡이면 WiFi 연결 실패 (설정 확인)

### 촬영 워크플로우

```
1️⃣ 작업 시작
   ↓
2️⃣ 촬영 위치 이동
   ↓
3️⃣ 버튼 1회 누름 → 📸 사진 촬영
   ↓
4️⃣ 업로드 중 (LED 깜빡임)
   ↓
5️⃣ 업로드 완료 (진동 피드백)
   ↓
6️⃣ 다음 위치로 이동
```

### 촬영 결과 확인

- 관리자 페이지: https://erpcrm-ljh.vercel.app/index.html
- **업무 사진** 탭에서 실시간 확인

---

## 🔍 문제 해결

### LED 상태 표시

| LED 상태 | 의미 | 조치 |
|----------|------|------|
| 빠르게 깜빡임 (0.5초) | WiFi 연결 시도 중 | 대기 (최대 10초) |
| 계속 켜짐 | WiFi 연결 완료 | 정상 |
| 느리게 깜빡임 (2초) | WiFi 연결 실패 | WiFi 설정 확인 |
| 3회 빠른 깜빡임 | 촬영 중 | 정상 |
| 5회 빠른 깜빡임 | 업로드 성공 | 정상 |
| 계속 깜빡임 | 업로드 실패 | WiFi 재연결 |

### 일반적인 문제

#### 1. "카메라 초기화 실패"
```cpp
해결책:
- ESP32-CAM 리셋 버튼 누르기
- 5V 전원 확인 (배터리 전압 4.2V 이상)
- 카메라 모듈 재장착
```

#### 2. "WiFi 연결 안됨"
```cpp
해결책:
- SSID/비밀번호 다시 확인
- 2.4GHz WiFi인지 확인 (5GHz 미지원)
- 공유기와 거리 확인
```

#### 3. "업로드 실패 (HTTP 401/403)"
```cpp
해결책:
- Supabase API 키 확인
- Storage bucket 'cleaning-photos' 존재 확인
- Public 업로드 권한 확인
```

#### 4. "버튼 눌러도 반응 없음"
```cpp
해결책:
- 버튼 연결 확인 (GPIO 13 ↔ GND)
- 풀업 저항 확인
- Serial Monitor로 디버그 로그 확인
```

### 디버그 모드

시리얼 모니터 사용:
```cpp
1. 도구 → 시리얼 모니터
2. 보드레이트: 115200
3. ESP32-CAM 리셋
4. 로그 확인:
   - "Camera init: OK" → 카메라 정상
   - "WiFi connected" → 네트워크 정상
   - "Upload success" → 업로드 성공
```

---

## 📊 성능 최적화

### 배터리 수명

| 촬영 빈도 | 예상 사용 시간 |
|----------|---------------|
| 10분당 1장 | 약 12시간 |
| 5분당 1장 | 약 8시간 |
| 1분당 1장 | 약 4시간 |

### 전력 절약 팁

```cpp
// 펌웨어에 추가
#include "esp_pm.h"

// 촬영 사이 대기 시 절전 모드
void enterLightSleep() {
  esp_sleep_enable_gpio_wakeup();
  gpio_wakeup_enable(GPIO_NUM_13, GPIO_INTR_LOW_LEVEL);
  esp_light_sleep_start();
}
```

---

## 🆙 업그레이드 아이디어

### 1. GPS 추가 (위치 자동 인식)
```cpp
// GPS 모듈 추가
#include <TinyGPS++.h>
// 촬영 시 GPS 좌표도 Supabase에 저장
```

### 2. OLED 화면 추가
```cpp
// 128x64 OLED로 상태 표시
// - WiFi 상태
// - 배터리 잔량
// - 촬영 매수
```

### 3. 음성 인식
```cpp
// I2S 마이크 추가
// "촬영" 음성 명령으로 자동 촬영
```

### 4. 멀티 카메라
```cpp
// 2개의 카메라로 Before/After 동시 촬영
// GPIO 핀으로 카메라 전환
```

---

## 📞 지원

### 문의
- GitHub Issues: [프로젝트 저장소]
- 이메일: support@example.com

### 참고 자료
- [ESP32-CAM 공식 문서](https://github.com/espressif/esp32-camera)
- [Supabase Storage API](https://supabase.com/docs/guides/storage)
- [Arduino ESP32 가이드](https://docs.espressif.com/projects/arduino-esp32)

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

**제작:** 카인드원 관리시스템 개발팀  
**버전:** 1.0.0  
**최종 수정:** 2026-07-08
