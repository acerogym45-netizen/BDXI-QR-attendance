# 📦 ESP32-CAM 도착 전 준비 가이드

배송 대기 중 미리 준비하세요! 부품 도착 후 30분 만에 테스트할 수 있습니다.

---

## 💻 1단계: Arduino IDE 설치

### Windows 설치

#### 방법 1: 공식 다운로드 (권장)
```
1. 브라우저에서 접속:
   https://www.arduino.cc/en/software

2. "Windows Win 10 and newer, 64 bits" 다운로드

3. 설치 파일 실행 (arduino-ide_2.x.x_Windows_64bit.exe)

4. "Install" 클릭 → 기본 설정으로 진행

5. 설치 완료! (약 3분 소요)
```

#### 방법 2: Microsoft Store (더 쉬움)
```
1. Windows 검색창에서 "Microsoft Store" 실행

2. 검색: "Arduino IDE"

3. "가져오기" 또는 "설치" 클릭

4. 자동 설치 완료!
```

### macOS 설치
```
1. https://www.arduino.cc/en/software 접속

2. "macOS 11: "Big Sur" or newer, 64 bits" 다운로드

3. .dmg 파일 열기

4. Arduino IDE를 Applications 폴더로 드래그

5. 완료!
```

### Linux (Ubuntu/Debian)
```bash
# AppImage 방식 (권장)
cd ~/Downloads
wget https://downloads.arduino.cc/arduino-ide/arduino-ide_2.3.2_Linux_64bit.AppImage
chmod +x arduino-ide_2.3.2_Linux_64bit.AppImage
./arduino-ide_2.3.2_Linux_64bit.AppImage

# 또는 Snap 설치
sudo snap install arduino-ide
```

---

## 🔧 2단계: ESP32 보드 매니저 추가

### Arduino IDE 설정

```
1. Arduino IDE 실행

2. 상단 메뉴: 파일 → 환경설정
   (File → Preferences)
   또는 단축키: Ctrl+, (Windows/Linux) / Cmd+, (macOS)

3. "추가적인 보드 매니저 URLs" 입력란 찾기
   (Additional Boards Manager URLs)

4. 다음 URL 복사해서 붙여넣기:
```
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```
```

5. "확인" (OK) 클릭

6. 상단 메뉴: 도구 → 보드 → 보드 매니저
   (Tools → Board → Boards Manager)
   또는 단축키: Ctrl+Shift+B

7. 검색창에 "esp32" 입력

8. "esp32 by Espressif Systems" 찾기

9. "설치" (Install) 클릭
   ⚠️ 용량이 크므로 5~10분 소요될 수 있음

10. 설치 완료 후 "닫기" (Close)
```

**✅ 설치 완료 확인:**
```
도구 → 보드 → esp32 → AI Thinker ESP32-CAM
메뉴에 나타나면 성공!
```

---

## 🔌 3단계: USB 드라이버 확인

### Windows 사용자

대부분 Windows 10/11은 자동으로 드라이버를 설치하지만, 안될 경우:

```
1. CH340 드라이버 다운로드:
   https://sparks.gogo.co.nz/ch340.html
   
   또는 검색: "CH340 driver download"

2. 다운로드 후 설치 파일 실행

3. "INSTALL" 클릭

4. 컴퓨터 재부팅
```

### macOS 사용자

```
1. CH340 드라이버 다운로드:
   https://github.com/WCHSoftGroup/ch34xser_macos

2. .pkg 파일 설치

3. 시스템 환경설정 → 보안 및 개인 정보 보호
   → "확인" 클릭하여 드라이버 허용

4. 컴퓨터 재부팅
```

### Linux 사용자

대부분 자동으로 인식됩니다. 안될 경우:

```bash
# 사용자를 dialout 그룹에 추가
sudo usermod -a -G dialout $USER

# 로그아웃 후 다시 로그인
```

---

## 📁 4단계: 펌웨어 코드 다운로드

### GitHub에서 다운로드

```
1. 브라우저에서 접속:
   https://github.com/acerogym45-netizen/BDXI-QR-attendance

2. 초록색 "Code" 버튼 클릭

3. "Download ZIP" 선택

4. 다운로드한 ZIP 파일 압축 해제

5. 폴더 경로:
   BDXI-QR-attendance-main/esp32_wearable_camera/
```

### 또는 직접 다운로드 (더 쉬움)

이 가이드와 함께 제공된 파일:
```
esp32_wearable_camera/
├── esp32_camera_firmware_v2/
│   └── esp32_camera_firmware_v2.ino  ← 이 파일 사용!
├── README.md
├── QUICK_START.md
└── CIRCUIT_DIAGRAM.md
```

**📌 중요:** `.ino` 파일은 반드시 같은 이름의 폴더 안에 있어야 합니다!

```
올바른 구조:
esp32_camera_firmware_v2/
└── esp32_camera_firmware_v2.ino  ✅

잘못된 구조:
Downloads/
└── esp32_camera_firmware_v2.ino  ❌
```

---

## 🏠 5단계: WiFi 정보 준비

### 작업 현장의 WiFi 확인

ESP32-CAM에 입력할 정보를 미리 메모하세요:

```
WiFi 이름 (SSID): _____________________
WiFi 비밀번호:    _____________________

⚠️ 주의사항:
- 2.4GHz WiFi만 지원 (5GHz 안됨)
- 대소문자 정확히 입력
- 특수문자 포함 시 정확히 복사
```

### WiFi 확인 방법 (Windows)

```
1. WiFi 아이콘 클릭
2. "속성" 클릭
3. "네트워크 대역" 확인
   → 2.4GHz인지 확인
```

### WiFi 확인 방법 (스마트폰)

```
1. 설정 → WiFi
2. 연결된 네트워크 이름 확인
3. 비밀번호는 공유기에서 확인
   (보통 공유기 뒷면 스티커에 적혀있음)
```

---

## 📋 6단계: 체크리스트

배송 도착 전 완료해야 할 것들:

```
소프트웨어:
□ Arduino IDE 설치 완료
□ ESP32 보드 매니저 설치 완료
□ USB 드라이버 설치 완료 (Windows/macOS)
□ 펌웨어 코드 다운로드 완료

정보 준비:
□ WiFi 이름 확인
□ WiFi 비밀번호 확인
□ 2.4GHz WiFi인지 확인
□ Supabase 정보 확인:
  - URL: https://qgpqhtuynxhmgawakjxe.supabase.co
  - API Key: (이미 코드에 포함됨)

하드웨어:
□ USB 케이블 준비 (마이크로 USB)
  - 데이터 전송 가능한 케이블 확인
  - 충전 전용 케이블은 안됨!
□ 작업할 책상 정리
```

---

## 🎮 7단계: USB 케이블 확인

### 데이터 전송 가능 케이블 vs 충전 전용 케이블

```
❌ 충전 전용 케이블:
   - 2개 선만 연결 (전원 +, -)
   - 컴퓨터가 ESP32-CAM을 인식 못함
   - 저렴한 케이블에 많음

✅ 데이터 전송 케이블:
   - 4개 선 모두 연결 (전원 + 데이터)
   - 컴퓨터가 ESP32-CAM 인식 가능
   - "Data Cable" 또는 "Sync Cable" 표시
```

### 확인 방법

```
1. 케이블로 스마트폰을 컴퓨터에 연결

2. 컴퓨터에서 폰 내부 저장소가 보이면
   → ✅ 데이터 전송 가능 케이블

3. 충전만 되고 저장소가 안보이면
   → ❌ 충전 전용 케이블 (다른 케이블 찾기)
```

집에 없으면 다이소에서 3,000원에 구매 가능합니다.

---

## 🎯 8단계: 배송 도착 후 할 일 (미리보기)

### 30분 완성 로드맵

```
1. 하드웨어 조립 (5분)
   - ESP32-CAM을 연결 보드에 끼우기
   - USB 케이블로 컴퓨터 연결

2. 펌웨어 수정 (10분)
   - Arduino IDE에서 .ino 파일 열기
   - WiFi 정보 입력
   - 작업자 이름 입력

3. 업로드 (5분)
   - 보드 설정
   - 업로드 버튼 클릭
   - 대기...

4. 테스트 (10분)
   - 시리얼 모니터 확인
   - WiFi 연결 확인
   - 촬영 테스트
   - Supabase 업로드 확인

✅ 완료!
```

---

## 🆘 미리 알아두면 좋은 팁

### Arduino IDE 팁

```
단축키:
- 업로드: Ctrl+U (Cmd+U on macOS)
- 검증: Ctrl+R
- 시리얼 모니터: Ctrl+Shift+M
- 새 탭: Ctrl+Shift+N
```

### 일반적인 실수 방지

```
❌ 보드 설정 안함
   → 도구 → 보드에서 "AI Thinker ESP32-CAM" 선택 필수

❌ 포트 선택 안함
   → 도구 → 포트에서 COM 포트 선택 필수

❌ .ino 파일이 잘못된 폴더에 있음
   → 파일명과 폴더명이 같아야 함

❌ WiFi 비밀번호 오타
   → 대소문자, 특수문자 정확히 입력
```

---

## 📞 도움이 필요하면?

### 참고 문서

```
1. QUICK_START.md - 빠른 시작 가이드
2. README.md - 전체 개요
3. CIRCUIT_DIAGRAM.md - 회로도
4. SHOPPING_LIST.md - 추가 부품 구매
```

### 온라인 자료

```
Arduino 공식 튜토리얼:
https://www.arduino.cc/en/Tutorial/HomePage

ESP32-CAM 예제:
https://randomnerdtutorials.com/esp32-cam-projects-ebook/

문제 해결:
https://github.com/espressif/arduino-esp32/issues
```

---

## 🎉 준비 완료!

위 단계를 모두 완료하면, ESP32-CAM 도착 후 30분 만에 작동하는 웨어러블 카메라를 만들 수 있습니다!

**배송 추적 번호를 확인하고, 도착하면 바로 연락주세요!** 📦

---

**작성일:** 2026-07-08  
**다음 단계:** 배송 도착 → [QUICK_START.md](QUICK_START.md) 참고
