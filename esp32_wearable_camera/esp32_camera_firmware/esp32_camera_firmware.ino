/*
 * ESP32-CAM 웨어러블 카메라 펌웨어
 * 에어컨 청소 작업자용 자동 촬영 시스템
 * 
 * 기능:
 * - 버튼 한 번 누르면 사진 촬영
 * - WiFi로 Supabase Storage에 자동 업로드
 * - LED로 상태 표시
 * - 진동으로 피드백 (선택)
 * 
 * 작성: 2026-07-08
 * 버전: 1.0.0
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"
#include "esp_timer.h"
#include "esp_http_client.h"
#include "Arduino.h"

// ==================== 설정 구역 (여기만 수정하세요) ====================

// WiFi 설정 (작업 현장의 WiFi)
const char* WIFI_SSID = "작업장_WiFi_이름";        // ⚠️ 수정 필요
const char* WIFI_PASSWORD = "WiFi_비밀번호";       // ⚠️ 수정 필요

// Supabase 설정
const char* SUPABASE_URL = "https://qgpqhtuynxhmgawakjxe.supabase.co";
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncHFodHV5bnhobWdhd2FranhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTQyNTEsImV4cCI6MjA4Mjg3MDI1MX0.WNljQIKDbeZCDlXe8fpBdZs58XRFfujGt7lBGfq_pVg";

// 작업자 정보 (각 장치마다 다르게 설정)
const char* EMPLOYEE_NAME = "홍길동";              // ⚠️ 작업자 이름
const int APARTMENT_ID = 1;                        // ⚠️ 시설 ID (Supabase apartments 테이블)
const char* LOCATION_NAME = "에어컨 청소";         // 기본 위치명

// 하드웨어 핀 설정
#define BUTTON_PIN 13        // 촬영 버튼
#define LED_PIN 33           // 상태 LED (GPIO 33 또는 내장 LED)
#define VIBRATION_PIN 12     // 진동 모터 (선택 사항, 사용 안하면 -1)

// ==================== 여기까지만 수정하세요 ====================

// 카메라 핀 정의 (AI-Thinker ESP32-CAM)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// 전역 변수
bool wifiConnected = false;
bool cameraReady = false;
int photoCount = 0;
unsigned long lastButtonPress = 0;
const unsigned long DEBOUNCE_DELAY = 1000; // 1초 디바운스

// ==================== 초기화 함수 ====================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=================================");
  Serial.println("ESP32-CAM 웨어러블 카메라 시작");
  Serial.println("=================================\n");

  // LED 핀 초기화
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // 버튼 핀 초기화 (풀업)
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // 진동 모터 초기화 (선택)
  if (VIBRATION_PIN > 0) {
    pinMode(VIBRATION_PIN, OUTPUT);
    digitalWrite(VIBRATION_PIN, LOW);
  }

  // 카메라 초기화
  Serial.println("[1/3] 카메라 초기화 중...");
  if (initCamera()) {
    Serial.println("✅ 카메라 초기화 성공");
    cameraReady = true;
    blinkLED(2, 200); // 2회 깜빡임
  } else {
    Serial.println("❌ 카메라 초기화 실패!");
    blinkLED(10, 100); // 빠르게 10회 깜빡임 (에러)
    while(1) { delay(1000); } // 멈춤
  }

  // WiFi 연결
  Serial.println("\n[2/3] WiFi 연결 중...");
  connectWiFi();

  // 시작 준비 완료
  Serial.println("\n[3/3] 시스템 준비 완료!");
  Serial.println("============================");
  Serial.printf("작업자: %s\n", EMPLOYEE_NAME);
  Serial.printf("시설 ID: %d\n", APARTMENT_ID);
  Serial.printf("IP 주소: %s\n", WiFi.localIP().toString().c_str());
  Serial.println("============================");
  Serial.println("📸 버튼을 눌러 촬영하세요!\n");

  // 준비 완료 신호
  digitalWrite(LED_PIN, HIGH);
  vibrate(200);
  delay(500);
  digitalWrite(LED_PIN, LOW);
}

// ==================== 메인 루프 ====================

void loop() {
  // WiFi 재연결 체크
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi 연결 끊김, 재연결 시도...");
    wifiConnected = false;
    connectWiFi();
  }

  // 버튼 입력 체크 (디바운스 적용)
  if (digitalRead(BUTTON_PIN) == LOW) {
    unsigned long currentTime = millis();
    
    if (currentTime - lastButtonPress > DEBOUNCE_DELAY) {
      lastButtonPress = currentTime;
      
      Serial.println("\n🔘 버튼 눌림 감지!");
      captureAndUpload();
    }
  }

  delay(50); // CPU 부하 감소
}

// ==================== 카메라 초기화 ====================

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // 메모리에 따른 해상도 설정
  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA; // 1600x1200
    config.jpeg_quality = 10; // 0-63, 낮을수록 고품질
    config.fb_count = 2;
    Serial.println("PSRAM 발견: 고해상도 모드");
  } else {
    config.frame_size = FRAMESIZE_SVGA; // 800x600
    config.jpeg_quality = 12;
    config.fb_count = 1;
    Serial.println("PSRAM 없음: 표준 모드");
  }

  // 카메라 초기화
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("카메라 초기화 실패: 0x%x\n", err);
    return false;
  }

  // 센서 설정
  sensor_t * s = esp_camera_sensor_get();
  if (s != NULL) {
    s->set_brightness(s, 0);     // -2 ~ 2
    s->set_contrast(s, 0);       // -2 ~ 2
    s->set_saturation(s, 0);     // -2 ~ 2
    s->set_special_effect(s, 0); // 0: 없음, 1: 흑백, 2: 세피아
    s->set_whitebal(s, 1);       // 화이트밸런스 자동
    s->set_awb_gain(s, 1);       // AWB 게인
    s->set_wb_mode(s, 0);        // 0: 자동
    s->set_exposure_ctrl(s, 1);  // 노출 자동
    s->set_aec2(s, 0);           // AEC 센서
    s->set_ae_level(s, 0);       // -2 ~ 2
    s->set_aec_value(s, 300);    // 0 ~ 1200
    s->set_gain_ctrl(s, 1);      // 게인 자동
    s->set_agc_gain(s, 0);       // 0 ~ 30
    s->set_gainceiling(s, (gainceiling_t)0); // 0 ~ 6
    s->set_bpc(s, 0);            // 흑점 보정
    s->set_wpc(s, 1);            // 백점 보정
    s->set_raw_gma(s, 1);        // 감마
    s->set_lenc(s, 1);           // 렌즈 보정
    s->set_hmirror(s, 0);        // 수평 반전
    s->set_vflip(s, 0);          // 수직 반전
    s->set_dcw(s, 1);            // DCW
    s->set_colorbar(s, 0);       // 컬러바 off
  }

  return true;
}

// ==================== WiFi 연결 ====================

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("WiFi 연결 중: %s ", WIFI_SSID);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // 깜빡임
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("✅ WiFi 연결 성공!");
    Serial.printf("IP 주소: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("신호 강도: %d dBm\n", WiFi.RSSI());
    digitalWrite(LED_PIN, HIGH);
    delay(1000);
    digitalWrite(LED_PIN, LOW);
  } else {
    wifiConnected = false;
    Serial.println("❌ WiFi 연결 실패!");
    blinkLED(5, 500); // 느리게 5회 깜빡임
  }
}

// ==================== 촬영 및 업로드 ====================

void captureAndUpload() {
  if (!cameraReady) {
    Serial.println("❌ 카메라가 준비되지 않았습니다!");
    blinkLED(3, 100);
    return;
  }

  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi가 연결되지 않았습니다!");
    blinkLED(3, 100);
    return;
  }

  // 1. 사진 촬영
  Serial.println("\n📸 사진 촬영 중...");
  digitalWrite(LED_PIN, HIGH);
  
  camera_fb_t * fb = esp_camera_fb_get();
  
  if (!fb) {
    Serial.println("❌ 사진 촬영 실패!");
    digitalWrite(LED_PIN, LOW);
    blinkLED(3, 100);
    return;
  }

  Serial.printf("✅ 촬영 완료! (크기: %d bytes)\n", fb->len);
  blinkLED(2, 100);

  // 2. 파일명 생성 (타임스탬프 기반)
  char filename[100];
  unsigned long timestamp = millis();
  snprintf(filename, sizeof(filename), "%s_%lu_%d.jpg", 
           EMPLOYEE_NAME, timestamp, photoCount);

  // 3. Supabase Storage 업로드
  Serial.println("📤 업로드 중...");
  bool uploadSuccess = uploadToSupabase(fb->buf, fb->len, filename);

  // 4. 카메라 버퍼 해제
  esp_camera_fb_return(fb);

  // 5. 결과 처리
  if (uploadSuccess) {
    photoCount++;
    Serial.printf("✅ 업로드 성공! (총 %d장)\n", photoCount);
    
    // 성공 피드백
    blinkLED(5, 100); // 빠르게 5회 깜빡임
    vibrate(300);     // 진동
    
  } else {
    Serial.println("❌ 업로드 실패!");
    blinkLED(10, 100); // 빠르게 10회 깜빡임 (에러)
  }

  digitalWrite(LED_PIN, LOW);
  Serial.println("대기 중...\n");
}

// ==================== Supabase 업로드 ====================

bool uploadToSupabase(const uint8_t* imageData, size_t imageSize, const char* filename) {
  // Supabase Storage API URL 구성
  // POST /storage/v1/object/cleaning-photos/{filename}
  char url[300];
  snprintf(url, sizeof(url), "%s/storage/v1/object/cleaning-photos/%s", 
           SUPABASE_URL, filename);

  HTTPClient http;
  http.begin(url);
  
  // 헤더 설정
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("x-upsert", "true"); // 덮어쓰기 허용

  // POST 요청
  Serial.printf("URL: %s\n", url);
  int httpResponseCode = http.POST((uint8_t*)imageData, imageSize);

  // 응답 처리
  bool success = false;
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("HTTP 응답 코드: %d\n", httpResponseCode);
    
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      success = true;
      Serial.println("응답: " + response);
      
      // Supabase cleaning_tasks 테이블에 메타데이터 저장 (선택 사항)
      // 나중에 구현 가능
      
    } else {
      Serial.println("에러 응답: " + response);
    }
  } else {
    Serial.printf("HTTP 에러: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  return success;
}

// ==================== 유틸리티 함수 ====================

// LED 깜빡임
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

// 진동 모터 제어
void vibrate(int durationMs) {
  if (VIBRATION_PIN > 0) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(durationMs);
    digitalWrite(VIBRATION_PIN, LOW);
  }
}

// ==================== 디버그 정보 출력 ====================

void printSystemInfo() {
  Serial.println("\n========== 시스템 정보 ==========");
  Serial.printf("ESP32 SDK 버전: %s\n", ESP.getSdkVersion());
  Serial.printf("CPU 주파수: %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("Flash 크기: %d bytes\n", ESP.getFlashChipSize());
  Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("PSRAM: %s\n", psramFound() ? "있음" : "없음");
  if (psramFound()) {
    Serial.printf("Free PSRAM: %d bytes\n", ESP.getFreePsram());
  }
  Serial.println("================================\n");
}
