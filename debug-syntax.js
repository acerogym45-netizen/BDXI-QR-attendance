#!/usr/bin/env node

/**
 * 🔍 JavaScript Syntax Error 전수조사 도구
 * - HTML에서 JavaScript 추출
 * - Node.js 파서로 정확한 에러 위치 찾기
 * - 에러 전후 10줄 컨텍스트 출력
 */

const fs = require('fs');
const vm = require('vm');

console.log('🔍 JavaScript Syntax 전수조사 시작...\n');

// 1. HTML 파일 읽기
const html = fs.readFileSync('index.html', 'utf8');

// 2. <script> 태그 추출
const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
let allScripts = [];
let scriptIndex = 0;

for (const match of scriptMatches) {
  const scriptContent = match[1];
  const scriptStart = match.index + match[0].indexOf('>') + 1;
  
  // HTML 내에서의 실제 줄 번호 계산
  const linesBeforeScript = html.substring(0, scriptStart).split('\n').length;
  
  allScripts.push({
    index: scriptIndex++,
    content: scriptContent,
    startLine: linesBeforeScript,
    originalPosition: scriptStart
  });
}

console.log(`📦 총 ${allScripts.length}개의 <script> 블록 발견\n`);

// 3. 각 스크립트 블록 검증
let foundError = false;

for (const script of allScripts) {
  console.log(`\n🔎 Script Block #${script.index} 검사 중 (HTML line ${script.startLine}~)...`);
  
  try {
    // vm.Script를 사용하여 구문 검증
    new vm.Script(script.content, {
      filename: `index.html:script-block-${script.index}`,
      lineOffset: script.startLine - 1
    });
    console.log(`   ✅ 정상`);
  } catch (err) {
    console.log(`\n❌ ========== SYNTAX ERROR 발견! ==========`);
    console.log(`📍 위치: Script Block #${script.index}`);
    console.log(`📍 HTML 파일 내 줄 번호: ~${script.startLine + (err.lineNumber || 0)}`);
    console.log(`\n🔴 에러 메시지:`);
    console.log(`   ${err.message}`);
    
    if (err.stack) {
      console.log(`\n📚 Stack trace:`);
      console.log(err.stack.split('\n').slice(0, 5).join('\n'));
    }
    
    // 에러 위치 전후 컨텍스트 출력
    const errorLine = err.lineNumber || 0;
    const lines = script.content.split('\n');
    const start = Math.max(0, errorLine - 10);
    const end = Math.min(lines.length, errorLine + 10);
    
    console.log(`\n📄 에러 전후 코드 (Line ${start + script.startLine} ~ ${end + script.startLine}):`);
    console.log('━'.repeat(80));
    
    for (let i = start; i < end; i++) {
      const lineNum = i + script.startLine;
      const marker = (i === errorLine - 1) ? '>>> ' : '    ';
      const line = lines[i] || '';
      console.log(`${marker}${lineNum.toString().padStart(5, ' ')} | ${line.substring(0, 100)}`);
    }
    console.log('━'.repeat(80));
    
    foundError = true;
    break; // 첫 번째 에러에서 중단
  }
}

if (!foundError) {
  console.log('\n\n✅ 모든 스크립트 블록이 문법적으로 정상입니다!');
  console.log('\n🤔 가능한 원인:');
  console.log('   1. 브라우저 캐시 문제 (Vercel 배포 지연)');
  console.log('   2. Vercel 빌드 과정에서 코드 변환 문제');
  console.log('   3. 외부 라이브러리 로딩 순서 문제');
} else {
  console.log('\n\n🎯 해결 방법:');
  console.log('   위에 표시된 라인의 구문을 수정하세요.');
}

console.log('\n✅ 전수조사 완료\n');
