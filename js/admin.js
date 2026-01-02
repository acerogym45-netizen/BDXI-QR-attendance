// Supabase 연결 정보
const SUPABASE_URL = 'https://qgpqhtuynxhmgawakjxe.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_API_KEY_HERE'; // sb_publishable_ujXj0mLf1casiQdVkc0fCA_G6exymqG

// Supabase 클라이언트 초기화
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 변수
let currentTab = 'employees';
let employees = [];
let locations = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (SUPABASE_ANON_KEY === 'YOUR_API_KEY_HERE') {
        showSetupWarning();
        return;
    }
    initializeTabs();
    loadEmployees();
    loadLocations();
    setupForms();
    initializeScanPageAccess();
});

function showSetupWarning() {
    const warning = `
        <div class="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6 mb-6">
            <h3 class="text-xl font-bold text-yellow-800 mb-2">
                <i class="fas fa-exclamation-triangle mr-2"></i>설정 필요
            </h3>
            <p class="text-gray-700 mb-4">Supabase 데이터베이스를 설정해야 시스템이 작동합니다.</p>
        </div>
    `;
    const container = document.querySelector('.container');
    container.insertAdjacentHTML('afterbegin', warning);
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        btn.classList.add('text-gray-600');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        activeBtn.classList.remove('text-gray-600');
    }
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    if (tabName === 'qr-codes') {
        generateQRCodes();
    }
    if (tabName === 'scan-access') {
        generateScanPageQR();
    }
}

function setupForms() {
    document.getElementById('employee-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await createEmployee(new FormData(this));
        this.reset();
    });
    document.getElementById('location-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await createLocation(new FormData(this));
        this.reset();
    });
}

async function loadEmployees() {
    try {
        const { data, error } = await supabaseClient
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        employees = data || [];
        displayEmployees();
    } catch (error) {
        console.error('Error loading employees:', error);
        alert('직원 목록을 불러오는데 실패했습니다.');
    }
}

function displayEmployees() {
    const tbody = document.getElementById('employees-list');
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">등록된 직원이 없습니다.</td></tr>';
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
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="toggleEmployeeStatus('${emp.id}', ${!emp.is_active})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-${emp.is_active ? 'ban' : 'check'}"></i>
                </button>
                <button onclick="deleteEmployee('${emp.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function createEmployee(formData) {
    const employeeData = {
        name: formData.get('name'),
        employee_number: formData.get('employee_number'),
        department: formData.get('department') || null,
        position: formData.get('position') || null,
        phone: formData.get('phone') || null,
        is_active: true
    };
    try {
        const { error } = await supabaseClient.from('employees').insert([employeeData]);
        if (error) throw error;
        alert('직원이 등록되었습니다.');
        await loadEmployees();
    } catch (error) {
        console.error('Error creating employee:', error);
        alert('직원 등록에 실패했습니다: ' + error.message);
    }
}

async function toggleEmployeeStatus(id, newStatus) {
    try {
        const { error } = await supabaseClient.from('employees').update({ is_active: newStatus }).eq('id', id);
        if (error) throw error;
        await loadEmployees();
    } catch (error) {
        console.error('Error toggling employee status:', error);
        alert('상태 변경에 실패했습니다.');
    }
}

async function deleteEmployee(id) {
    if (!confirm('이 직원을 삭제하시겠습니까?')) return;
    try {
        const { error } = await supabaseClient.from('employees').delete().eq('id', id);
        if (error) throw error;
        await loadEmployees();
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('직원 삭제에 실패했습니다.');
    }
}

async function loadLocations() {
    try {
        const { data, error } = await supabaseClient.from('locations').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        locations = data || [];
        displayLocations();
    } catch (error) {
        console.error('Error loading locations:', error);
        alert('구역 목록을 불러오는데 실패했습니다.');
    }
}

function displayLocations() {
    const tbody = document.getElementById('locations-list');
    if (locations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">등록된 구역이 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = locations.map(loc => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap font-semibold">${loc.name}</td>
            <td class="px-6 py-4 whitespace-nowrap"><code class="bg-gray-100 px-2 py-1 rounded">${loc.code}</code></td>
            <td class="px-6 py-4 whitespace-nowrap">${loc.building || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${loc.floor || '-'}</td>
            <td class="px-6 py-4">${loc.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${loc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${loc.is_active ? '활성' : '비활성'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="toggleLocationStatus('${loc.id}', ${!loc.is_active})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-${loc.is_active ? 'ban' : 'check'}"></i>
                </button>
                <button onclick="deleteLocation('${loc.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function createLocation(formData) {
    const locationData = {
        name: formData.get('name'),
        code: formData.get('code').toUpperCase(),
        building: formData.get('building') || null,
        floor: formData.get('floor') || null,
        description: formData.get('description') || null,
        is_active: true
    };
    try {
        const { error } = await supabaseClient.from('locations').insert([locationData]);
        if (error) throw error;
        alert('구역이 등록되었습니다.');
        await loadLocations();
    } catch (error) {
        console.error('Error creating location:', error);
        alert('구역 등록에 실패했습니다: ' + error.message);
    }
}

async function toggleLocationStatus(id, newStatus) {
    try {
        const { error } = await supabaseClient.from('locations').update({ is_active: newStatus }).eq('id', id);
        if (error) throw error;
        await loadLocations();
    } catch (error) {
        console.error('Error toggling location status:', error);
        alert('상태 변경에 실패했습니다.');
    }
}

async function deleteLocation(id) {
    if (!confirm('이 구역을 삭제하시겠습니까?')) return;
    try {
        const { error } = await supabaseClient.from('locations').delete().eq('id', id);
        if (error) throw error;
        await loadLocations();
    } catch (error) {
        console.error('Error deleting location:', error);
        alert('구역 삭제에 실패했습니다.');
    }
}

async function generateQRCodes() {
    const grid = document.getElementById('qr-codes-grid');
    const activeLocations = locations.filter(loc => loc.is_active);
    if (activeLocations.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">
            <i class="fas fa-info-circle text-4xl mb-3"></i>
            <p>활성화된 구역이 없습니다.</p>
            <p class="text-sm mt-2">먼저 구역을 등록해주세요.</p>
        </div>`;
        return;
    }
    grid.innerHTML = activeLocations.map(loc => {
        const qrData = JSON.stringify({
            type: 'location',
            locationId: loc.id,
            locationCode: loc.code,
            locationName: loc.name
        });
        const qrId = `qr-${loc.id}`;
        setTimeout(() => {
            new QRCode(document.getElementById(qrId), {
                text: qrData,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }, 100);
        return `
            <div class="border-2 border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition">
                <h3 class="font-bold text-lg mb-2">${loc.name}</h3>
                <p class="text-sm text-gray-600 mb-4">
                    <code class="bg-gray-100 px-2 py-1 rounded">${loc.code}</code>
                </p>
                ${loc.building || loc.floor ? `<p class="text-xs text-gray-500 mb-3">${loc.building || ''} ${loc.floor || ''}</p>` : ''}
                <div id="${qrId}" class="flex justify-center mb-4"></div>
                <button onclick="printQRCode('${loc.id}')" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm w-full">
                    <i class="fas fa-print mr-2"></i>인쇄하기
                </button>
            </div>
        `;
    }).join('');
}

function printQRCode(locationId) {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;
    const qrElement = document.getElementById(`qr-${locationId}`);
    if (!qrElement) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${location.name} - QR 코드</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
                .container { padding: 40px; }
                h1 { margin-bottom: 20px; font-size: 32px; }
                .code { background: #f3f4f6; padding: 10px 20px; border-radius: 8px; display: inline-block; margin: 20px 0; font-family: monospace; font-size: 20px; }
                .qr { margin: 30px 0; }
                .footer { margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${location.name}</h1>
                <div class="code">${location.code}</div>
                ${location.building || location.floor ? `<div style="color: #666; margin: 10px 0;">${location.building || ''} ${location.floor || ''}</div>` : ''}
                <div class="qr">${qrElement.innerHTML}</div>
                <div class="footer">
                    <strong>봉담자이프라이드시티 출석 시스템</strong><br>
                    스마트폰으로 QR 코드를 스캔하여 출석 체크하세요
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
}

function initializeScanPageAccess() {
    const currentURL = window.location.origin + window.location.pathname;
    const scanPageURL = currentURL.replace('index.html', 'scan.html');
    document.getElementById('scan-page-url').textContent = scanPageURL;
}

function generateScanPageQR() {
    const qrContainer = document.getElementById('scan-page-qr');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    const currentURL = window.location.origin + window.location.pathname;
    const scanPageURL = currentURL.replace('index.html', 'scan.html');
    new QRCode(qrContainer, {
        text: scanPageURL,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function copyScanPageURL() {
    const urlElement = document.getElementById('scan-page-url');
    const url = urlElement.textContent;
    navigator.clipboard.writeText(url).then(() => {
        alert('URL이 복사되었습니다!\n\n' + url);
    }).catch(err => {
        console.error('복사 실패:', err);
        prompt('아래 URL을 복사하세요:', url);
    });
}

function printScanPageQR() {
    const qrElement = document.getElementById('scan-page-qr');
    if (!qrElement) return;
    const currentURL = window.location.origin + window.location.pathname;
    const scanPageURL = currentURL.replace('index.html', 'scan.html');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>출석 스캔 페이지 접속 QR 코드</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
                .container { padding: 40px; }
                h1 { margin-bottom: 20px; font-size: 36px; color: #2563eb; }
                .subtitle { font-size: 20px; color: #666; margin-bottom: 30px; }
                .qr { margin: 30px 0; }
                .instructions { margin-top: 30px; font-size: 18px; line-height: 1.6; }
                .url { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; word-break: break-all; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📱 출석 체크 스캔 페이지</h1>
                <div class="subtitle">스마트폰으로 QR 코드를 스캔하세요</div>
                <div class="qr">${qrElement.innerHTML}</div>
                <div class="instructions">
                    <strong>사용 방법:</strong><br>
                    1. 스마트폰 카메라로 QR 코드 스캔<br>
                    2. 또는 아래 URL을 브라우저에 입력
                </div>
                <div class="url">${scanPageURL}</div>
                <div style="margin-top: 40px; color: #888; font-size: 16px;">
                    봉담자이프라이드시티 출석 관리 시스템
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
}
