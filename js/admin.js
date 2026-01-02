// Supabase 설정
const SUPABASE_URL = 'https://qgpqhtuynxhmgawakjxe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ujXj0mLf1casiQdVkc0fCA_G6exymqG';

// 전역 변수
let employees = [];
let locations = [];
let currentTab = 'employees';

// 탭 전환 함수 (전역으로 선언)
window.switchTab = function(tabName) {
    currentTab = tabName;
    
    // 모든 탭 버튼과 컨텐츠 초기화
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-blue-600');
        btn.classList.add('text-gray-500', 'border-transparent');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // 선택된 탭 활성화
    const selectedTab = document.getElementById(`tab-${tabName}`);
    const selectedContent = document.getElementById(`content-${tabName}`);
    
    if (selectedTab) {
        selectedTab.classList.remove('text-gray-500', 'border-transparent');
        selectedTab.classList.add('text-blue-600', 'border-blue-600');
    }
    
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    // QR 코드 탭이면 QR 코드 생성
    if (tabName === 'qr-codes') {
        generateQRCodes();
    }
    
    // 스캔 페이지 접속 탭이면 QR 코드 생성
    if (tabName === 'scan-access') {
        generateScanPageQR();
    }
}

// URL 복사 함수 (전역으로 선언)
window.copyScanPageUrl = function() {
    const url = document.getElementById('scan-page-url').textContent;
    navigator.clipboard.writeText(url).then(() => {
        alert('URL이 복사되었습니다!');
    });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 인증된 경우에만 초기화
    const authData = localStorage.getItem('bdxi_admin_auth');
    if (authData) {
        const { timestamp, authenticated } = JSON.parse(authData);
        const now = Date.now();
        const AUTH_EXPIRY = 24 * 60 * 60 * 1000;
        
        if (authenticated && (now - timestamp) < AUTH_EXPIRY) {
            initializeAdmin();
        }
    }
});

// 관리자 기능 초기화
function initializeAdmin() {
    loadEmployees();
    loadLocations();
    setupForms();
}

// 폼 설정
function setupForms() {
    // 직원 등록 폼
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addEmployee();
        });
    }
    
    // 구역 등록 폼
    const locationForm = document.getElementById('location-form');
    if (locationForm) {
        locationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addLocation();
        });
    }
}

// 직원 추가
async function addEmployee() {
    const data = {
        name: document.getElementById('employee-name').value,
        employee_number: document.getElementById('employee-number').value,
        department: document.getElementById('employee-department').value,
        position: document.getElementById('employee-position').value,
        phone: document.getElementById('employee-phone').value,
        is_active: true
    };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('직원이 등록되었습니다.');
            document.getElementById('employee-form').reset();
            loadEmployees();
        } else {
            alert('직원 등록에 실패했습니다.');
        }
    } catch (error) {
        console.error('직원 등록 오류:', error);
        alert('직원 등록 중 오류가 발생했습니다.');
    }
}

// 직원 목록 로드
async function loadEmployees() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&limit=100`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            employees = await response.json();
            displayEmployees();
        }
    } catch (error) {
        console.error('직원 목록 로드 실패:', error);
    }
}

// 직원 목록 표시
function displayEmployees() {
    const tbody = document.getElementById('employees-list');
    if (!tbody) return;
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">등록된 직원이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${emp.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${emp.employee_number}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${emp.department || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${emp.position || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${emp.phone || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${emp.is_active ? '활성' : '비활성'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="toggleEmployeeStatus('${emp.id}', ${!emp.is_active})" class="text-indigo-600 hover:text-indigo-900 mr-2">
                    ${emp.is_active ? '비활성화' : '활성화'}
                </button>
                <button onclick="deleteEmployee('${emp.id}')" class="text-red-600 hover:text-red-900">
                    삭제
                </button>
            </td>
        </tr>
    `).join('');
}

// 직원 상태 토글
window.toggleEmployeeStatus = async function(id, newStatus) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ is_active: newStatus })
        });
        
        if (response.ok) {
            loadEmployees();
        } else {
            alert('상태 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('상태 변경 오류:', error);
    }
}

// 직원 삭제
window.deleteEmployee = async function(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            alert('삭제되었습니다.');
            loadEmployees();
        } else {
            alert('삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('삭제 오류:', error);
    }
}

// 구역 추가
async function addLocation() {
    const data = {
        name: document.getElementById('location-name').value,
        code: document.getElementById('location-code').value.toUpperCase(),
        building: document.getElementById('location-building').value,
        floor: document.getElementById('location-floor').value,
        description: document.getElementById('location-description').value,
        is_active: true
    };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('구역이 등록되었습니다.');
            document.getElementById('location-form').reset();
            loadLocations();
        } else {
            alert('구역 등록에 실패했습니다.');
        }
    } catch (error) {
        console.error('구역 등록 오류:', error);
        alert('구역 등록 중 오류가 발생했습니다.');
    }
}

// 구역 목록 로드
async function loadLocations() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=*&limit=100`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            locations = await response.json();
            displayLocations();
        }
    } catch (error) {
        console.error('구역 목록 로드 실패:', error);
    }
}

// 구역 목록 표시
function displayLocations() {
    const tbody = document.getElementById('locations-list');
    if (!tbody) return;
    
    if (locations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">등록된 구역이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = locations.map(loc => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${loc.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${loc.code}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${loc.building || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${loc.floor || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${loc.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${loc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${loc.is_active ? '활성' : '비활성'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="toggleLocationStatus('${loc.id}', ${!loc.is_active})" class="text-indigo-600 hover:text-indigo-900 mr-2">
                    ${loc.is_active ? '비활성화' : '활성화'}
                </button>
                <button onclick="deleteLocation('${loc.id}')" class="text-red-600 hover:text-red-900">
                    삭제
                </button>
            </td>
        </tr>
    `).join('');
}

// 구역 상태 토글
window.toggleLocationStatus = async function(id, newStatus) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ is_active: newStatus })
        });
        
        if (response.ok) {
            loadLocations();
        } else {
            alert('상태 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('상태 변경 오류:', error);
    }
}

// 구역 삭제
window.deleteLocation = async function(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            alert('삭제되었습니다.');
            loadLocations();
        } else {
            alert('삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('삭제 오류:', error);
    }
}

// QR 코드 생성
async function generateQRCodes() {
    const activeLocations = locations.filter(loc => loc.is_active);
    const grid = document.getElementById('qr-codes-grid');
    
    if (!grid) return;
    
    if (activeLocations.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 text-center col-span-full">활성화된 구역이 없습니다.</p>';
        return;
    }
    
    // QRCode 라이브러리 동적 로드
    if (typeof QRCode === 'undefined') {
        await loadQRCodeLibrary();
    }
    
    grid.innerHTML = '';
    
    activeLocations.forEach(loc => {
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const qrData = `${baseUrl}scan.html?location=${loc.code}&name=${encodeURIComponent(loc.name)}&id=${loc.id}`;
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg p-6';
        card.innerHTML = `
            <h3 class="text-lg font-bold mb-2">${loc.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${loc.building || ''} ${loc.floor || ''}</p>
            <p class="text-xs text-gray-500 mb-4">코드: ${loc.code}</p>
            <div id="qr-${loc.id}" class="flex justify-center mb-4"></div>
            <button onclick="printQRCode('qr-${loc.id}', '${loc.name}')" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                <i class="fas fa-print mr-2"></i>인쇄
            </button>
        `;
        
        grid.appendChild(card);
        
        // QR 코드 생성
        new QRCode(document.getElementById(`qr-${loc.id}`), {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    });
}

// QR 코드 라이브러리 로드
function loadQRCodeLibrary() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// QR 코드 인쇄
window.printQRCode = function(qrId, locationName) {
    const qrElement = document.getElementById(qrId);
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>QR 코드 인쇄</title>');
    printWindow.document.write('<style>body{text-align:center;padding:20px;}h1{margin-bottom:20px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h1>${locationName}</h1>`);
    printWindow.document.write(qrElement.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// 스캔 페이지 QR 생성
async function generateScanPageQR() {
    const qrContainer = document.getElementById('scan-page-qr');
    const urlElement = document.getElementById('scan-page-url');
    
    if (!qrContainer || !urlElement) return;
    
    const scanPageUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'scan.html';
    urlElement.textContent = scanPageUrl;
    
    // QRCode 라이브러리 동적 로드
    if (typeof QRCode === 'undefined') {
        await loadQRCodeLibrary();
    }
    
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, {
        text: scanPageUrl,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}
