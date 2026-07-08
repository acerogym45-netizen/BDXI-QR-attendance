/*
 * ESP32-CAM 웨어러블 카메라 펌웨어 v3.0
 * Before/After 자동 인식 및 쌍 업로드 버전
 * 
 * 새로운 기능:
 * - 버튼 1회: Before 사진 촬영 및 저장
 * - 버튼 2회: After 사진 촬영 및 Before/After 쌍으로 업로드
 * - 자동으로 같은 위치의 Before/After 매칭
 * - 진동/LED로 상태 피드백
 * 
 * 작성: 2026-07-08
 * 버전: 3.0
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
#include "esp_timer.h"
#include "time.h"

// ==================== 설정 구역 ====================

// WiFi 설정
const char* WIFI_SSID = "작업장_WiFi_이름";
const char* WIFI_PASSWORD = "WiFi_비밀번호";

// Supabase 설정
const char* SUPABASE_URL = "https://qgpqhtuynxhmgawakjxe.supabase.co";
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncHFodHV5bnhobWdhd2FranhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTQyNTEsImV4cCI6MjA4Mjg3MDI1MX0.WNljQIKDbeZCDlXe8fpBdZs58XRFfujGt7lBGfq_pVg";

// 작업자 정보
const char* EMPLOYEE_NAME = "홍길동";
const int APARTMENT_ID = 1;
const char* DEFAULT_LOCATION = "에어컨 청소";

// 하드웨어 핀
#define BUTTON_PIN 13
#define LED_PIN 33
#define VIBRATION_PIN -1

// ==================== 카메라 핀 정의 ====================

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

// ==================== 전역 변수 ====================

bool wifiConnected = false;
bool cameraReady = false;
int photoCount = 0;
unsigned long lastButtonPress = 0;
const unsigned long DEBOUNCE_DELAY = 1000;

// Before/After 상태 관리
enum PhotoState {
  STATE_READY,        // 대기 상태
  STATE_BEFORE_TAKEN, // Before 촬영 완료, After 대기 중
  STATE_PAIR_COMPLETE // Before/After 쌍 완료
};

PhotoState currentState = STATE_READY;
String beforePhotoUrl = "";
String beforePhotoFilename = "";
unsigned long beforePhotoTime = 0;

// NTP 설정
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 9 * 3600;
const int daylightOffset_sec = 0;

// ==================== Setup ====================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n" + String("=").repeat(50));
  Serial.println("ESP32-CAM Before/After 자동 인식 v3.0");
  Serial.println(String("=").repeat(50) + "\n");

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  if (VIBRATION_PIN > 0) pinMode(VIBRATION_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // 카메라 초기화
  Serial.println("[1/4] 카메라 초기화...");
  if (initCamera()) {
    Serial.println("✅ 카메라 OK");
    cameraReady = true;
    blinkLED(2, 200);
  } else {
    Serial.println("❌ 카메라 실패!");
    errorHalt();
  }

  // WiFi 연결
  Serial.println("\n[2/4] WiFi 연결...");
  connectWiFi();

  // 시간 동기화
  Serial.println("\n[3/4] 시간 동기화...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("✅ 시간 동기화 완료");

  // 시스템 정보
  Serial.println("\n[4/4] 시스템 준비 완료!");
  Serial.println(String("=").repeat(50));
  Serial.printf("작업자: %s\n", EMPLOYEE_NAME);
  Serial.printf("시설 ID: %d\n", APARTMENT_ID);
  Serial.printf("IP 주소: %s\n", WiFi.localIP().toString().c_str());
  Serial.println(String("=").repeat(50));
  Serial.println("\n📸 버튼 1회: Before 촬영");
  Serial.println("📸 버튼 2회: After 촬영 + 자동 업로드\n");

  // 준비 완료
  digitalWrite(LED_PIN, HIGH);
  vibrate(200);
  delay(500);
  digitalWrite(LED_PIN, LOW);
}

// ==================== Loop ====================

void loop() {
  // WiFi 재연결
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi 재연결...");
    connectWiFi();
  }

  // 버튼 체크
  if (digitalRead(BUTTON_PIN) == LOW) {
    unsigned long now = millis();
    if (now - lastButtonPress > DEBOUNCE_DELAY) {
      lastButtonPress = now;
      handleButtonPress();
    }
  }

  // Before 타임아웃 체크 (5분)
  if (currentState == STATE_BEFORE_TAKEN) {
    if (millis() - beforePhotoTime > 300000) { // 5분
      Serial.println("⚠️ Before 사진 타임아웃 (5분 경과)");
      Serial.println("   상태 초기화. 다시 시작하세요.");
      resetState();
      blinkLED(3, 300);
    }
  }

  delay(50);
}

// ==================== 버튼 처리 ====================

void handleButtonPress() {
  Serial.println("\n🔘 버튼 눌림!");

  switch (currentState) {
    case STATE_READY:
      // Before 사진 촬영
      captureBefore();
      break;

    case STATE_BEFORE_TAKEN:
      // After 사진 촬영 및 쌍 업로드
      captureAfterAndUploadPair();
      break;

    case STATE_PAIR_COMPLETE:
      // 새로운 쌍 시작
      Serial.println("✅ 이전 쌍 완료. 새로운 Before 촬영 시작");
      resetState();
      captureBefore();
      break;
  }
}

// ==================== Before 촬영 ====================

void captureBefore() {
  Serial.println("\n📸 [BEFORE] 사진 촬영 중...");
  digitalWrite(LED_PIN, HIGH);

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ 촬영 실패!");
    digitalWrite(LED_PIN, LOW);
    blinkLED(3, 100);
    return;
  }

  Serial.printf("✅ 촬영 완료 (%d bytes)\n", fb->len);

  // 파일명 생성
  time_t now;
  time(&now);
  char filename[100];
  snprintf(filename, sizeof(filename), "before_%s_%ld.jpg", 
           EMPLOYEE_NAME, now);

  // Supabase Storage 업로드
  Serial.println("📤 Before 사진 업로드 중...");
  String publicUrl;
  bool uploadSuccess = uploadToSupabase(fb->buf, fb->len, filename, publicUrl);

  esp_camera_fb_return(fb);

  if (uploadSuccess) {
    // Before 정보 저장
    beforePhotoUrl = publicUrl;
    beforePhotoFilename = String(filename);
    beforePhotoTime = millis();
    currentState = STATE_BEFORE_TAKEN;

    Serial.println("✅ Before 사진 저장 완료!");
    Serial.println("   URL: " + beforePhotoUrl);
    Serial.println("\n⏳ After 사진을 촬영하세요 (버튼 한번 더)");

    // 피드백: 1회 깜빡임 + 짧은 진동
    blinkLED(1, 500);
    vibrate(100);

  } else {
    Serial.println("❌ Before 업로드 실패!");
    blinkLED(5, 100);
  }

  digitalWrite(LED_PIN, LOW);
}

// ==================== After 촬영 및 쌍 업로드 ====================

void captureAfterAndUploadPair() {
  Serial.println("\n📸 [AFTER] 사진 촬영 중...");
  digitalWrite(LED_PIN, HIGH);

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ 촬영 실패!");
    digitalWrite(LED_PIN, LOW);
    blinkLED(3, 100);
    return;
  }

  Serial.printf("✅ 촬영 완료 (%d bytes)\n", fb->len);

  // 파일명 생성 (Before와 같은 타임스탬프 사용)
  time_t now;
  time(&now);
  char filename[100];
  snprintf(filename, sizeof(filename), "after_%s_%ld.jpg", 
           EMPLOYEE_NAME, now);

  // Supabase Storage 업로드
  Serial.println("📤 After 사진 업로드 중...");
  String afterPhotoUrl;
  bool uploadSuccess = uploadToSupabase(fb->buf, fb->len, filename, afterPhotoUrl);

  esp_camera_fb_return(fb);

  if (uploadSuccess) {
    Serial.println("✅ After 사진 저장 완료!");
    Serial.println("   URL: " + afterPhotoUrl);

    // Before/After 쌍으로 메타데이터 저장
    Serial.println("\n💾 Before/After 쌍 메타데이터 저장 중...");
    bool metaSaved = saveBeforeAfterPair(beforePhotoUrl, afterPhotoUrl);

    if (metaSaved) {
      photoCount++;
      currentState = STATE_PAIR_COMPLETE;

      Serial.println("\n✅✅ Before/After 쌍 완료! ✅✅");
      Serial.printf("   총 %d쌍 완료\n", photoCount);
      Serial.println("\n📱 관리자 페이지에서 확인하세요!");

      // 피드백: 5회 빠른 깜빡임 + 긴 진동
      blinkLED(5, 100);
      vibrate(500);

      // 자동으로 다음 쌍 준비
      delay(2000);
      resetState();
      Serial.println("\n✨ 다음 작업을 시작하세요 (버튼 누르기)");

    } else {
      Serial.println("⚠️ 메타데이터 저장 실패");
      blinkLED(3, 200);
    }

  } else {
    Serial.println("❌ After 업로드 실패!");
    blinkLED(5, 100);
  }

  digitalWrite(LED_PIN, LOW);
}

// ==================== Before/After 쌍 메타데이터 저장 ====================

bool saveBeforeAfterPair(String beforeUrl, String afterUrl) {
  char url[200];
  snprintf(url, sizeof(url), "%s/rest/v1/cleaning_tasks", SUPABASE_URL);

  // JSON 생성 - Before/After 쌍으로 저장
  StaticJsonDocument<768> doc;
  doc["apartment_id"] = APARTMENT_ID;
  doc["employee_name"] = EMPLOYEE_NAME;
  doc["location"] = DEFAULT_LOCATION;
  
  // photo_urls 배열로 Before/After 쌍 저장
  JsonArray photoUrls = doc.createNestedArray("photo_urls");
  photoUrls.add(beforeUrl);
  photoUrls.add(afterUrl);
  
  doc["before_after"] = "both"; // Before/After 쌍임을 표시
  doc["photo_count"] = 2;
  doc["upload_type"] = "wearable_cam_pair";
  doc["status"] = "completed";
  
  // 작업 시간 계산
  unsigned long workDuration = (millis() - beforePhotoTime) / 1000; // 초 단위
  doc["notes"] = String("웨어러블 카메라 Before/After (작업시간: ") + 
                 String(workDuration) + "초)";

  String jsonBody;
  serializeJson(doc, jsonBody);

  // HTTP POST
  HTTPClient http;
  http.begin(url);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Prefer", "return=minimal");

  int code = http.POST(jsonBody);

  bool success = false;
  if (code == 201 || code == 200) {
    success = true;
    Serial.println("✅ Before/After 쌍 메타데이터 저장 완료!");
  } else {
    Serial.printf("❌ 메타데이터 실패 HTTP %d: %s\n", code, http.getString().c_str());
  }

  http.end();
  return success;
}

// ==================== 상태 초기화 ====================

void resetState() {
  currentState = STATE_READY;
  beforePhotoUrl = "";
  beforePhotoFilename = "";
  beforePhotoTime = 0;
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

  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("카메라 에러: 0x%x\n", err);
    return false;
  }

  sensor_t * s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 0);
    s->set_contrast(s, 0);
    s->set_saturation(s, 0);
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
    s->set_exposure_ctrl(s, 1);
    s->set_aec2(s, 1);
    s->set_gain_ctrl(s, 1);
    s->set_bpc(s, 1);
    s->set_wpc(s, 1);
    s->set_lenc(s, 1);
    s->set_dcw(s, 1);
  }

  return true;
}

// ==================== WiFi ====================

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("연결 중: %s ", WIFI_SSID);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("✅ WiFi 연결!");
    Serial.printf("IP: %s, RSSI: %d dBm\n", 
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    digitalWrite(LED_PIN, HIGH);
    delay(1000);
    digitalWrite(LED_PIN, LOW);
  } else {
    wifiConnected = false;
    Serial.println("❌ WiFi 실패!");
    blinkLED(5, 500);
  }
}

// ==================== Supabase Storage 업로드 ====================

bool uploadToSupabase(const uint8_t* data, size_t size, const char* filename, String &outUrl) {
  char url[300];
  snprintf(url, sizeof(url), "%s/storage/v1/object/cleaning-photos/%s", 
           SUPABASE_URL, filename);

  HTTPClient http;
  http.begin(url);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("x-upsert", "true");

  int code = http.POST((uint8_t*)data, size);

  bool success = false;
  if (code == 200 || code == 201) {
    success = true;
    outUrl = String(SUPABASE_URL) + "/storage/v1/object/public/cleaning-photos/" + filename;
  } else {
    Serial.printf("❌ HTTP %d: %s\n", code, http.getString().c_str());
  }

  http.end();
  return success;
}

// ==================== 유틸리티 ====================

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

void vibrate(int ms) {
  if (VIBRATION_PIN > 0) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(ms);
    digitalWrite(VIBRATION_PIN, LOW);
  }
}

void errorHalt() {
  while(1) {
    blinkLED(5, 200);
    delay(2000);
  }
}
