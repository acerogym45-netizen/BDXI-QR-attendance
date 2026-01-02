// Supabase 연결 정보
const SUPABASE_URL = 'https://qgpqhtuynxhmgawakjxe.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_API_KEY_HERE'; // sb_publishable_ujXj0mLf1casiQdVkc0fCA_G6exymqG

// Supabase 클라이언트 초기화
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 변수
let employees = [];
let selectedEmployee = null;
let html5QrCode = null;
let recentScans = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page loaded');
    if (SUPABASE_ANON_KEY === 'YOUR_API_KEY_HERE') {
        showSetupWarning();
        return;
    }
    await loadEmployees();
    setupEmployeeSearch();
    loadRecentScans();
});

function showSetupWarning() {
    const grid = document.getElementById('employees-grid');
    grid.innerHTML = `
        <div class="col-span-full text-center py-8">
            <div class="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6">
                <i class="fas fa-exclamation-triangle text-yellow-600 text-4xl mb-3"></i>
                <h3 class="text-xl font-bold text-yellow-800 mb-2">설정 필요</h3>
                <p class="text-gray-700">Supabase 데이터베이스를 설정해야 시스템이 작동합니다.</p>
                <p class="text-sm text-gray-600 mt-2">관리자에게 문의하세요.</p>
            </div>
        </div>
    `;
}

async function loadEmployees() {
    try {
        console.log('Loading employees...');
        const { data, error } = await supabaseClient
            .from('employees')
            .select('*')
            .eq('is_active', true)
            .order('name');
        if (error) throw error;
        employees = data || [];
        console.log('Loaded employees:', employees.length);
        displayEmployees(employees);
    } catch (error) {
        console.error('Error loading employees:', error);
        document.getElementById('employees-grid').innerHTML = 
            '<div class="col-span-full text-center text-red-500 py-4">직원 목록을 불러오는데 실패했습니다.</div>';
    }
}

function displayEmployees(employeeList) {
    const grid = document.getElementById('employees-grid');
    if (employeeList.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">등록된 직원이 없습니다.</div>';
        return;
    }
    grid.innerHTML = employeeList.map(emp => {
        const initial = emp.name.charAt(0);
        return `
            <button onclick="selectEmployee('${emp.id}')" 
                class="p-3 md:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center">
                <div class="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                    ${initial}
                </div>
                <div class="font-semibold text-sm md:text-base">${emp.name}</div>
                <div class="text-xs text-gray-500">${emp.employee_number}</div>
                ${emp.department ? `<div class="text-xs text-gray-400">${emp.department}</div>` : ''}
            </button>
        `;
    }).join('');
}

function setupEmployeeSearch() {
    const searchInput = document.getElementById('employee-search');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm === '') {
            displayEmployees(employees);
            return;
        }
        const filtered = employees.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm) ||
            emp.employee_number.toLowerCase().includes(searchTerm) ||
            (emp.department && emp.department.toLowerCase().includes(searchTerm))
        );
        displayEmployees(filtered);
    });
}

function selectEmployee(employeeId) {
    console.log('Selecting employee:', employeeId);
    selectedEmployee = employees.find(emp => emp.id === employeeId);
    if (!selectedEmployee) {
        alert('직원 정보를 찾을 수 없습니다.');
        return;
    }
    document.getElementById('employee-initial').textContent = selectedEmployee.name.charAt(0);
    document.getElementById('employee-name-display').textContent = selectedEmployee.name;
    let infoText = selectedEmployee.employee_number;
    if (selectedEmployee.department) infoText += ` | ${selectedEmployee.department}`;
    if (selectedEmployee.position) infoText += ` | ${selectedEmployee.position}`;
    document.getElementById('employee-info-display').textContent = infoText;
    document.getElementById('employee-selection').classList.add('hidden');
    document.getElementById('selected-employee-info').classList.remove('hidden');
    document.getElementById('scanner-section').classList.remove('hidden');
    setTimeout(() => {
        startScanner();
    }, 500);
}

function clearEmployeeSelection() {
    selectedEmployee = null;
    document.getElementById('employee-selection').classList.remove('hidden');
    document.getElementById('selected-employee-info').classList.add('hidden');
    document.getElementById('scanner-section').classList.add('hidden');
    stopScanner();
    document.getElementById('employee-search').value = '';
    displayEmployees(employees);
}

async function startScanner() {
    console.log('Starting scanner...');
    const resultDiv = document.getElementById('scan-result');
    try {
        html5QrCode = new Html5Qrcode("reader");
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        };
        console.log('Requesting camera...');
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        );
        console.log('✅ Camera started successfully');
        resultDiv.innerHTML = `
            <div class="text-center py-4 text-gray-600">
                <i class="fas fa-camera text-3xl mb-2"></i>
                <p>QR 코드를 카메라에 비추세요</p>
            </div>
        `;
    } catch (err) {
        console.error('Camera error:', err);
        resultDiv.innerHTML = `
            <div class="border-2 border-red-500 bg-red-50 rounded-lg p-4 text-center">
                <i class="fas fa-exclamation-triangle text-red-600 text-3xl mb-2"></i>
                <h3 class="font-bold text-red-600 mb-2">카메라 접근 실패</h3>
                <p class="text-sm text-gray-700 mb-3">${err.message}</p>
                <p class="text-xs text-gray-600 mb-3">브라우저에서 카메라 권한을 허용해주세요.</p>
                <button onclick="startScanner()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                    <i class="fas fa-redo mr-2"></i>다시 시도
                </button>
            </div>
        `;
    }
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().catch(err => {
            console.error('Scanner stop error:', err);
        }).finally(() => {
            html5QrCode = null;
        });
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    console.log('QR code scanned:', decodedText);
    try {
        const qrData = JSON.parse(decodedText);
        if (qrData.type !== 'location') {
            showScanResult(false, '올바른 구역 QR 코드가 아닙니다.');
            return;
        }
        if (html5QrCode) {
            html5QrCode.pause(true);
        }
        await saveAttendanceRecord(qrData);
    } catch (error) {
        console.error('Scan processing error:', error);
        showScanResult(false, 'QR 코드 처리 중 오류가 발생했습니다.');
        setTimeout(() => {
            if (html5QrCode) {
                html5QrCode.resume();
            }
        }, 3000);
    }
}

function onScanError(errorMessage) {
    // 스캔 에러는 정상적인 동작이므로 무시
}

async function saveAttendanceRecord(qrData) {
    const attendanceData = {
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.name,
        location_id: qrData.locationId,
        location_name: qrData.locationName,
        location_code: qrData.locationCode,
        scan_time: new Date().toISOString(),
        device_info: navigator.userAgent
    };
    try {
        const { data, error } = await supabaseClient
            .from('attendance_records')
            .insert([attendanceData])
            .select()
            .single();
        if (error) throw error;
        showScanResult(true, `${qrData.locationName}에 출석 체크되었습니다.`, data);
        addToRecentScans(data);
    } catch (error) {
        console.error('Error saving attendance:', error);
        showScanResult(false, '출석 기록 저장 중 오류가 발생했습니다.');
    }
}

function showScanResult(success, message, record = null) {
    const resultDiv = document.getElementById('scan-result');
    const icon = success ? 'fa-check-circle text-green-600' : 'fa-exclamation-circle text-red-600';
    const bgColor = success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
    let html = `
        <div class="border-2 ${bgColor} rounded-lg p-4 md:p-6 text-center">
            <i class="fas ${icon} text-4xl md:text-5xl mb-3"></i>
            <h3 class="text-lg md:text-xl font-bold mb-2">${success ? '출석 완료!' : '스캔 실패'}</h3>
            <p class="text-sm md:text-base text-gray-700 mb-4">${message}</p>
    `;
    if (success && record) {
        const scanTime = new Date(record.scan_time);
        html += `
            <div class="bg-white rounded-lg p-3 md:p-4 mb-4 text-left">
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="text-gray-600">직원:</div>
                    <div class="font-semibold">${record.employee_name}</div>
                    <div class="text-gray-600">구역:</div>
                    <div class="font-semibold">${record.location_name}</div>
                    <div class="text-gray-600">시간:</div>
                    <div class="font-semibold">${formatDateTime(scanTime)}</div>
                </div>
            </div>
        `;
    }
    html += `
            <button onclick="continueScanning()" class="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-md hover:bg-blue-700 transition w-full mb-2">
                <i class="fas fa-qrcode mr-2"></i>계속 스캔하기
            </button>
            <button onclick="clearEmployeeSelection()" class="bg-gray-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-md hover:bg-gray-700 transition w-full">
                <i class="fas fa-user-times mr-2"></i>직원 변경
            </button>
        </div>
    `;
    resultDiv.innerHTML = html;
}

function continueScanning() {
    const resultDiv = document.getElementById('scan-result');
    resultDiv.innerHTML = `
        <div class="text-center py-4 text-gray-600">
            <i class="fas fa-camera text-3xl mb-2"></i>
            <p>QR 코드를 카메라에 비추세요</p>
        </div>
    `;
    if (html5QrCode) {
        html5QrCode.resume();
    }
}

function loadRecentScans() {
    const stored = localStorage.getItem('recentScans');
    if (stored) {
        recentScans = JSON.parse(stored);
        displayRecentScans();
    }
}

function addToRecentScans(record) {
    recentScans.unshift(record);
    if (recentScans.length > 10) {
        recentScans = recentScans.slice(0, 10);
    }
    localStorage.setItem('recentScans', JSON.stringify(recentScans));
    displayRecentScans();
}

function displayRecentScans() {
    if (recentScans.length === 0) return;
    document.getElementById('recent-scans').classList.remove('hidden');
    const listDiv = document.getElementById('recent-scans-list');
    listDiv.innerHTML = recentScans.map(record => {
        const scanTime = new Date(record.scan_time);
        return `
            <div class="border-l-4 border-blue-600 bg-gray-50 p-3 md:p-4 mb-3 rounded">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-semibold text-base md:text-lg">${record.employee_name}</div>
                        <div class="text-sm md:text-base text-gray-600">${record.location_name}</div>
                        <div class="text-xs md:text-sm text-gray-500">${formatDateTime(scanTime)}</div>
                    </div>
                    <div class="text-green-600">
                        <i class="fas fa-check-circle text-xl md:text-2xl"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
