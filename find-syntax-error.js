#!/usr/bin/env node

/**
 * 🔍 app.uploadPayrollStatements 함수의 구문 검증
 * - 함수 시작부터 끝까지 추출
 * - 중괄호 { } 매칭 검사
 */

const fs = require('fs');

const lines = fs.readFileSync('index.html', 'utf8').split('\n');

// app.uploadPayrollStatements 찾기
let functionStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('app.uploadPayrollStatements')) {
    functionStart = i;
    console.log(`✅ 함수 시작: Line ${i + 1}`);
    break;
  }
}

if (functionStart === -1) {
  console.log('❌ 함수를 찾을 수 없습니다');
  process.exit(1);
}

// 중괄호 매칭으로 함수 끝 찾기
let braceCount = 0;
let functionEnd = -1;
let inFunction = false;

for (let i = functionStart; i < lines.length; i++) {
  const line = lines[i];
  
  // 함수 시작 {
  if (!inFunction && line.includes('function')) {
    // 다음 줄에서 { 찾기
    for (let j = i; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].includes('{')) {
        inFunction = true;
        braceCount = 1;
        console.log(`✅ 함수 본문 시작: Line ${j + 1}`);
        i = j; // 스킵
        break;
      }
    }
    continue;
  }
  
  if (!inFunction) continue;
  
  // 중괄호 카운팅
  for (const char of line) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
  
  // 함수 종료
  if (braceCount === 0) {
    functionEnd = i;
    console.log(`✅ 함수 끝: Line ${i + 1}`);
    break;
  }
}

if (functionEnd === -1) {
  console.log('❌ 함수 끝을 찾을 수 없습니다 (중괄호가 닫히지 않음)');
  console.log(`\n🔍 마지막 확인 위치: Line ${lines.length}`);
  console.log(`🔍 중괄호 불일치 개수: ${braceCount} (양수 = 닫는 괄호 부족)`);
  process.exit(1);
}

console.log(`\n📊 함수 범위: Line ${functionStart + 1} ~ ${functionEnd + 1}`);
console.log(`📏 함수 길이: ${functionEnd - functionStart + 1} 줄`);

// 함수 끝 다음 줄 확인
console.log(`\n🔎 함수 끝 다음 줄 (Line ${functionEnd + 2}):`);
console.log(`   ${lines[functionEnd + 1]}`);

// 다음 함수/속성이 제대로 시작하는지 확인
const nextLine = lines[functionEnd + 1].trim();
if (nextLine === '' || nextLine.startsWith('//')) {
  console.log(`\n🔎 그 다음 줄 (Line ${functionEnd + 3}):`);
  console.log(`   ${lines[functionEnd + 2]}`);
}

console.log(`\n✅ 검사 완료`);
