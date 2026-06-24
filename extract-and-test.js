#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 스크립트 추출 방식 개선...\n');

const html = fs.readFileSync('index.html', 'utf8');

// <script> 태그를 정확히 추출
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');

if (scriptStart === -1 || scriptEnd === -1) {
  console.log('❌ <script> 태그를 찾을 수 없습니다');
  process.exit(1);
}

const scriptContent = html.substring(scriptStart + 8, scriptEnd);
console.log(`📦 Script 크기: ${scriptContent.length} 문자`);

// 첫 50줄 확인
const lines = scriptContent.split('\n');
console.log(`📄 총 ${lines.length} 줄\n`);
console.log('🔎 처음 20줄:');
console.log('━'.repeat(100));

for (let i = 0; i < Math.min(20, lines.length); i++) {
  console.log(`${(i+1).toString().padStart(5, ' ')} | ${lines[i].substring(0, 100)}`);
}

console.log('━'.repeat(100));

// 실제 구문 검증
try {
  new Function(scriptContent);
  console.log('\n✅ 브라우저 Function() 생성자로 파싱 성공!');
  console.log('   실제 브라우저에서는 정상 작동할 것입니다.');
} catch (err) {
  console.log(`\n❌ 에러 발견: ${err.message}`);
  console.log(`   Line: ${err.lineNumber || '?'}`);
  console.log(`   Column: ${err.columnNumber || '?'}`);
  
  if (err.lineNumber) {
    const start = Math.max(0, err.lineNumber - 5);
    const end = Math.min(lines.length, err.lineNumber + 5);
    
    console.log('\n📄 에러 주변 코드:');
    console.log('━'.repeat(100));
    for (let i = start; i < end; i++) {
      const marker = (i === err.lineNumber - 1) ? '>>> ' : '    ';
      console.log(`${marker}${(i+1).toString().padStart(5, ' ')} | ${lines[i].substring(0, 100)}`);
    }
    console.log('━'.repeat(100));
  }
}

console.log('\n✅ 분석 완료');
