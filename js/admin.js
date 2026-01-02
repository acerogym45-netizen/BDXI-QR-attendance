// 전역 변수
let currentTab = 'employees';
let employees = [];
let locations = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    loadEmployees();
    loadLocations();
    setupForms();
});

// 탭 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

// 탭 전환
function switchTab(tabName) {
    // 모든 탭 버튼 스타일 초기화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        btn.classList.add('text-gray-600');
    });
    
    // 선택된 탭 버튼 스타일 적용
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    activeBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    activeBtn.classList.remove('text-gray-600');
    
    // 모든 탭 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // 선택된 탭 컨텐츠 표시
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    currentTab = tabName;
    
    // QR 코드 탭이면 QR 코드 생성
    if (tabName === 'qr-codes') {
        generateQRCodes();
    }
    
    // 스캔 페이지 접속 탭이면 QR 코드 생성
    if (tabName === 'scan-access') {
        generateScanPageQR();
    }
}

// 폼 설정
function setupForms() {
    // 직원 등록 폼
    document.getElementById('employee-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const employeeData = {
            name: formData.get('name'),
            employee_number: formData.get('employee_number'),
            department: formData.get('department') || '',
            position: formData.get('position') || '',
            phone: formData.get('phone') || '',
            is_active: true
        };
        
        try {
            const response = await fetch('tables/employees', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(employeeData)
            });
            
            if (response.ok) {
                alert('직원이 성공적으로 등록되었습니다.');
                e.target.reset();
                loadEmployees();
            } else {
                alert('직원 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했습니다.');
        }
    });
    
    // 구역 등록 폼
    document.getElementById('location-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const locationData = {
            name: formData.get('name'),
            code: formData.get('code').toUpperCase(),
            building: formData.get('building') || '',
            floor: formData.get('floor') || '',
            description: formData.get('description') || '',
            is_active: true
        };
        
        try {
            const response = await fetch('tables/locations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(locationData)
            });
            
            if (response.ok) {
                alert('구역이 성공적으로 등록되었습니다.');
                e.target.reset();
                loadLocations();
            } else {
                alert('구역 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했습니다.');
        }
    });
}

// 직원 목록 로드
async function loadEmployees() {
    try {
        const response = await fetch('tables/employees?limit=100');
        const data = await response.json();
        employees = data.data || [];
        displayEmployees();
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// 직원 목록 표시
function displayEmployees() {
    const tbody = document.getElementById('employees-list');
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">등록된 직원이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${emp.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${emp.employee_number}</td>
            <td class="px-6 py-4 whitespace-nowrap">${emp.department || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${emp.position || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${emp.phone || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${emp.is_active ? '활성' : '비활성'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="toggleEmployeeStatus('${emp.id}', ${!emp.is_active})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-${emp.is_active ? 'ban' : 'check'}"></i>
                </button>
                <button onclick="deleteEmployee('${emp.id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 직원 상태 토글
async function toggleEmployeeStatus(id, newStatus) {
    try {
        const response = await fetch(`tables/employees/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ is_active: newStatus })
        });
        
        if (response.ok) {
            loadEmployees();
        } else {
            alert('상태 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('오류가 발생했습니다.');
    }
}

// 직원 삭제
async function deleteEmployee(id) {
    if (!confirm('정말 이 직원을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch(`tables/employees/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok || response.status === 204) {
            alert('직원이 삭제되었습니다.');
            loadEmployees();
        } else {
            alert('삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('오류가 발생했습니다.');
    }
}

// 구역 목록 로드
async function loadLocations() {
    try {
        const response = await fetch('tables/locations?limit=100');
        const data = await response.json();
        locations = data.data || [];
        displayLocations();
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

// 구역 목록 표시
function displayLocations() {
    const tbody = document.getElementById('locations-list');
    
    if (locations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">등록된 구역이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = locations.map(loc => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap font-medium">${loc.name}</td>
            <td class="px-6 py-4 whitespace-nowrap"><code class="bg-gray-100 px-2 py-1 rounded">${loc.code}</code></td>
            <td class="px-6 py-4 whitespace-nowrap">${loc.building || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${loc.floor || '-'}</td>
            <td class="px-6 py-4">${loc.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${loc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${loc.is_active ? '활성' : '비활성'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="toggleLocationStatus('${loc.id}', ${!loc.is_active})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-${loc.is_active ? 'ban' : 'check'}"></i>
                </button>
                <button onclick="deleteLocation('${loc.id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 구역 상태 토글
async function toggleLocationStatus(id, newStatus) {
    try {
        const response = await fetch(`tables/locations/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ is_active: newStatus })
        });
        
        if (response.ok) {
            loadLocations();
        } else {
            alert('상태 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('오류가 발생했습니다.');
    }
}

// 구역 삭제
async function deleteLocation(id) {
    if (!confirm('정말 이 구역을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch(`tables/locations/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok || response.status === 204) {
            alert('구역이 삭제되었습니다.');
            loadLocations();
        } else {
            alert('삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('오류가 발생했습니다.');
    }
}

// QR 코드 생성
async function generateQRCodes() {
    const container = document.getElementById('qr-codes-grid');
    
    if (locations.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">등록된 구역이 없습니다. 먼저 구역을 등록해주세요.</div>';
        return;
    }
    
    // QRCode.js 라이브러리 동적 로드
    if (typeof QRCode === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
        script.onload = function() {
            renderQRCodes(container);
        };
        document.head.appendChild(script);
    } else {
        renderQRCodes(container);
    }
}

// QR 코드 렌더링
function renderQRCodes(container) {
    container.innerHTML = locations
        .filter(loc => loc.is_active)
        .map(loc => {
            const qrId = `qr-${loc.id}`;
            return `
                <div class="border rounded-lg p-4 text-center bg-white">
                    <div class="mb-3">
                        <h3 class="font-bold text-lg">${loc.name}</h3>
                        <p class="text-sm text-gray-600">${loc.building} ${loc.floor}</p>
                        <code class="text-xs bg-gray-100 px-2 py-1 rounded">${loc.code}</code>
                    </div>
                    <div id="${qrId}" class="flex justify-center mb-3"></div>
                    <button onclick="printQRCode('${qrId}', '${loc.name}')" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full">
                        <i class="fas fa-print mr-2"></i>인쇄하기
                    </button>
                </div>
            `;
        }).join('');
    
    // 각 구역에 대한 QR 코드 생성
    locations.filter(loc => loc.is_active).forEach(loc => {
        const qrContainer = document.getElementById(`qr-${loc.id}`);
        // 컨테이너 비우기
        qrContainer.innerHTML = '';
        
        // QR 코드 데이터 - URL 형식으로 변경 (QR 1번만 스캔하면 됨!)
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const qrData = `${baseUrl}scan.html?location=${loc.code}&name=${encodeURIComponent(loc.name)}&id=${loc.id}`;
        
        new QRCode(qrContainer, {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    });
}

// QR 코드 인쇄
function printQRCode(qrId, locationName) {
    const qrElement = document.getElementById(qrId);
    const printWindow = window.open('', '', 'width=800,height=600');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${locationName} - QR 코드</title>
            <style>
                body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                }
                .print-container {
                    text-align: center;
                    padding: 40px;
                }
                h1 {
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                .subtitle {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 30px;
                }
                .qr-container {
                    margin: 30px 0;
                }
                .instructions {
                    font-size: 16px;
                    color: #333;
                    margin-top: 30px;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <h1>봉담자이프라이드시티</h1>
                <div class="subtitle">${locationName}</div>
                <div class="qr-container">
                    ${qrElement.innerHTML}
                </div>
                <div class="instructions">
                    QR 코드를 스캔하여 출석 체크
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// 스캔 페이지 QR 코드 생성
function generateScanPageQR() {
    const qrContainer = document.getElementById('scan-page-qr');
    const urlElement = document.getElementById('scan-page-url');
    
    // 현재 페이지 URL에서 scan.html URL 생성
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
    const scanPageUrl = baseUrl + 'scan.html';
    
    // URL 표시
    urlElement.textContent = scanPageUrl;
    
    // QR 코드 라이브러리 로드 확인
    if (typeof QRCode === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
        script.onload = function() {
            createScanPageQR(qrContainer, scanPageUrl);
        };
        document.head.appendChild(script);
    } else {
        createScanPageQR(qrContainer, scanPageUrl);
    }
}

// 스캔 페이지 QR 코드 생성 실행
function createScanPageQR(container, url) {
    container.innerHTML = '';
    
    new QRCode(container, {
        text: url,
        width: 250,
        height: 250,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// 스캔 페이지 URL 복사
function copyScanPageURL() {
    const urlElement = document.getElementById('scan-page-url');
    const url = urlElement.textContent;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(url).then(function() {
        // 성공 메시지
        const button = event.target.closest('button');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-2"></i>복사 완료!';
        button.classList.remove('bg-green-600', 'hover:bg-green-700');
        button.classList.add('bg-green-700');
        
        setTimeout(function() {
            button.innerHTML = originalHTML;
            button.classList.remove('bg-green-700');
            button.classList.add('bg-green-600', 'hover:bg-green-700');
        }, 2000);
    }).catch(function(err) {
        alert('URL 복사에 실패했습니다: ' + err);
    });
}

// 스캔 페이지 QR 코드 인쇄
function printScanPageQR() {
    const qrElement = document.getElementById('scan-page-qr');
    const urlElement = document.getElementById('scan-page-url');
    const scanPageUrl = urlElement.textContent;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>스캔 페이지 접속 QR 코드</title>
            <style>
                body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                }
                .print-container {
                    text-align: center;
                    padding: 40px;
                    max-width: 600px;
                }
                h1 {
                    font-size: 32px;
                    margin-bottom: 10px;
                    color: #1e40af;
                }
                .subtitle {
                    font-size: 20px;
                    color: #333;
                    margin-bottom: 30px;
                    font-weight: bold;
                }
                .qr-container {
                    margin: 30px 0;
                    display: flex;
                    justify-content: center;
                }
                .instructions {
                    font-size: 18px;
                    color: #333;
                    margin-top: 30px;
                    line-height: 1.6;
                }
                .url-box {
                    background: #f3f4f6;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    word-break: break-all;
                    font-size: 14px;
                    color: #2563eb;
                }
                .step {
                    text-align: left;
                    margin: 15px 0;
                }
                .step-number {
                    display: inline-block;
                    background: #2563eb;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 30px;
                    margin-right: 10px;
                    font-weight: bold;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <h1>📱 봉담자이프라이드시티</h1>
                <div class="subtitle">직원 출석 체크 시스템</div>
                
                <div class="qr-container">
                    ${qrElement.innerHTML}
                </div>
                
                <div class="instructions">
                    <strong>스마트폰으로 QR 코드를 스캔하여 출석 체크 페이지로 이동하세요</strong>
                </div>
                
                <div class="url-box">
                    ${scanPageUrl}
                </div>
                
                <div class="instructions">
                    <div class="step">
                        <span class="step-number">1</span>
                        <span>구역 QR 코드 스캔</span>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <span>직원 목록에서 본인 이름 선택</span>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <span>출석 체크 완료! 🎉</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}
