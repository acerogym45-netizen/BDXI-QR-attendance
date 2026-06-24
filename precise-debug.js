#!/usr/bin/env node

/**
 * 🔍 메인 스크립트 블록만 집중 분석
 */

const fs = require('fs');
const vm = require('vm');

console.log('🔍 메인 스크립트 블록 분석 시작...\n');

const html = fs.readFileSync('index.html', 'utf8');

// 메인 스크립트 블록 추출 (가장 큰 스크립트)
const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches.reduce((largest, current) => {
  return (current[1].length > largest[1].length) ? current : largest;
}, scriptMatches[0]);

const scriptContent = mainScript[1];
const scriptStart = mainScript.index + mainScript[0].indexOf('>') + 1;
const linesBeforeScript = html.substring(0, scriptStart).split('\n').length;

console.log(`📦 메인 스크립트 크기: ${scriptContent.length} 문자`);
console.log(`📍 HTML 시작 라인: ${linesBeforeScript}\n`);

// 이진 탐색으로 에러 위치 좁히기
function findErrorLine(code) {
  const lines = code.split('\n');
  
  // 전체 코드 검증
  try {
    new vm.Script(code);
    console.log('✅ 코드 전체 문법 정상');
    return -1;
  } catch (err) {
    console.log(`🔴 전체 코드에서 에러 발견: Line ${err.lineNumber || '?'}`);
    console.log(`   메시지: ${err.message}\n`);
    
    if (err.lineNumber) {
      return err.lineNumber - 1; // 0-based index
    }
  }
  
  // 이진 탐색
  let low = 0;
  let high = lines.length;
  let errorLine = -1;
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const testCode = lines.slice(0, mid).join('\n');
    
    try {
      new vm.Script(testCode);
      low = mid + 1; // 에러 없음, 더 앞으로
    } catch (err) {
      errorLine = mid;
      high = mid; // 에러 있음, 뒤로
    }
  }
  
  return errorLine;
}

const errorLine = findErrorLine(scriptContent);

if (errorLine >= 0) {
  const lines = scriptContent.split('\n');
  const start = Math.max(0, errorLine - 10);
  const end = Math.min(lines.length, errorLine + 10);
  
  const htmlLineNum = linesBeforeScript + errorLine;
  
  console.log(`\n📍 에러 위치: Script Line ${errorLine + 1} (HTML Line ~${htmlLineNum})\n`);
  console.log('━'.repeat(100));
  
  for (let i = start; i < end; i++) {
    const marker = (i === errorLine) ? '>>> ' : '    ';
    const lineNum = linesBeforeScript + i;
    console.log(`${marker}${lineNum.toString().padStart(5, ' ')} | ${lines[i].substring(0, 120)}`);
  }
  console.log('━'.repeat(100));
}

console.log('\n✅ 분석 완료');
