// 전역 변수
let employees = [];
let selectedEmployee = null;
let html5QrCode = null;
let recentScans = [];
let preloadedLocation = null; // QR 코드로 전달된 구역 정보

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // URL 파라미터에서 구역 정보 읽기
    checkLocationFromURL();
    loadEmployees();
    setupEmployeeSearch();
    loadRecentScans();
});

// URL 파라미터에서 구역 정보 확인
function checkLocationFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const locationCode = urlParams.get('location');
    const locationName = urlParams.get('name');
    const locationId = urlParams.get('id');
    
    if (locationCode && locationName && locationId) {
        preloadedLocation = {
            id: locationId,
            code: locationCode,
            name: decodeURIComponent(locationName)
        };
        
        // 구역 정보 표시
        showLocationInfo();
    }
}

// 구역 정보 표시
function showLocationInfo() {
    if (!preloadedLocation) return;
    
    const locationBanner = document.createElement('div');
    locationBanner.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded';
    locationBanner.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-map-marker-alt text-2xl mr-3"></i>
            <div>
                <p class="font-bold">📍 스캔할 구역</p>
                <p class="text-lg">${preloadedLocation.name} <code class="bg-green-200 px-2 py-1 rounded text-sm">${preloadedLocation.code}</code></p>
            </div>
        </div>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(locationBanner, container.firstChild);
}

// 직원 목록 로드
async function loadEmployees() {
    try {
        const response = await fetch('tables/employees?limit=100');
        const data = await response.json();
        employees = (data.data || []).filter(emp => emp.is_active);
        displayEmployees(employees);
    } catch (error) {
        console.error('Error loading employees:', error);
        alert('직원 목록을 불러오는데 실패했습니다.');
    }
}

// 직원 목록 표시
function displayEmployees(employeeList) {
    const grid = document.getElementById('employees-grid');
    
    if (employeeList.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">검색 결과가 없습니다.</div>';
        return;
    }
    
    grid.innerHTML = employeeList.map(emp => {
        const initial = emp.name.charAt(0);
        return `
            <button onclick="selectEmployee('${emp.id}')" 
                class="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center">
                <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                    ${initial}
                </div>
                <div class="font-semibold">${emp.name}</div>
                <div class="text-xs text-gray-500">${emp.employee_number}</div>
                ${emp.department ? `<div class="text-xs text-gray-400">${emp.department}</div>` : ''}
            </button>
        `;
    }).join('');
}

// 직원 검색 설정
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

// 직원 선택
async function selectEmployee(employeeId) {
    selectedEmployee = employees.find(emp => emp.id === employeeId);
    
    if (!selectedEmployee) {
        alert('직원 정보를 찾을 수 없습니다.');
        return;
    }
    
    // URL에서 전달된 구역 정보가 있으면 바로 출석 처리!
    if (preloadedLocation) {
        await saveAttendanceFromURL();
        return;
    }
    
    // 구역 정보가 없으면 기존대로 QR 스캐너 시작
    // 선택된 직원 정보 표시
    document.getElementById('employee-initial').textContent = selectedEmployee.name.charAt(0);
    document.getElementById('employee-name-display').textContent = selectedEmployee.name;
    
    let infoText = selectedEmployee.employee_number;
    if (selectedEmployee.department) infoText += ` | ${selectedEmployee.department}`;
    if (selectedEmployee.position) infoText += ` | ${selectedEmployee.position}`;
    document.getElementById('employee-info-display').textContent = infoText;
    
    // UI 전환
    document.getElementById('employee-selection').classList.add('hidden');
    document.getElementById('selected-employee-info').classList.remove('hidden');
    document.getElementById('scanner-section').classList.remove('hidden');
    
    // QR 스캐너 시작 (비동기 처리)
    setTimeout(() => {
        startScanner();
    }, 300);
}

// URL로 전달된 구역 정보로 출석 저장
async function saveAttendanceFromURL() {
    try {
        // 출석 데이터 준비
        const attendanceData = {
            employee_id: selectedEmployee.id,
            employee_name: selectedEmployee.name,
            employee_number: selectedEmployee.employee_number,
            location_id: preloadedLocation.id,
            location_name: preloadedLocation.name,
            location_code: preloadedLocation.code,
            scan_time: new Date().toISOString(),
            device_info: navigator.userAgent
        };
        
        // 출석 기록 저장
        const response = await fetch('tables/attendance_records', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(attendanceData)
        });
        
        if (!response.ok) {
            throw new Error('출석 저장 실패');
        }
        
        const savedRecord = await response.json();
        
        // 성공 메시지 표시
        showSuccessMessage(savedRecord);
        
        // 최근 스캔 기록에 추가
        addToRecentScans(savedRecord);
        
    } catch (error) {
        console.error('Error saving attendance:', error);
        alert('출석 저장에 실패했습니다. 다시 시도해주세요.');
    }
}

// 성공 메시지 표시
function showSuccessMessage(record) {
    const container = document.querySelector('.container');
    
    // 기존 직원 선택 영역 숨기기
    document.getElementById('employee-selection').classList.add('hidden');
    
    // 성공 메시지 생성
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-white rounded-lg shadow-md p-8 text-center mb-6 animate-fade-in';
    successDiv.innerHTML = `
        <div class="text-green-600 mb-4">
            <i class="fas fa-check-circle text-6xl"></i>
        </div>
        <h2 class="text-2xl font-bold text-green-600 mb-4">✅ 출석 완료!</h2>
        <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div class="grid grid-cols-1 gap-3 text-left">
                <div class="flex justify-between">
                    <span class="text-gray-600">👤 직원:</span>
                    <span class="font-bold">${record.employee_name} (${record.employee_number})</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">📍 구역:</span>
                    <span class="font-bold">${record.location_name} (${record.location_code})</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">🕐 시간:</span>
                    <span class="font-bold">${formatDateTime(record.scan_time)}</span>
                </div>
            </div>
        </div>
        <button onclick="resetForNewScan()" class="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition text-lg">
            <i class="fas fa-redo mr-2"></i>다른 직원 출석 체크
        </button>
    `;
    
    container.insertBefore(successDiv, container.firstChild);
    
    // 스크롤 최상단으로
    window.scrollTo(0, 0);
}

// 새로운 스캔을 위한 리셋
function resetForNewScan() {
    location.reload();
}

// 날짜/시간 포맷팅
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 최근 스캔 기록에 추가
function addToRecentScans(record) {
    recentScans.unshift(record);
    
    // 최대 10개까지만 저장
    if (recentScans.length > 10) {
        recentScans = recentScans.slice(0, 10);
    }
    
    localStorage.setItem('recentScans', JSON.stringify(recentScans));
    displayRecentScans();
}

// 최근 스캔 기록 로드
function loadRecentScans() {
    const stored = localStorage.getItem('recentScans');
    if (stored) {
        recentScans = JSON.parse(stored);
        displayRecentScans();
    }
}

// 최근 스캔 기록 표시
function displayRecentScans() {
    if (recentScans.length === 0) return;
    
    document.getElementById('recent-scans').classList.remove('hidden');
    
    const listDiv = document.getElementById('recent-scans-list');
    listDiv.innerHTML = recentScans.map(record => {
        return `
            <div class="border-l-4 border-blue-600 bg-gray-50 p-4 mb-3 rounded">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-semibold text-lg">${record.employee_name}</div>
                        <div class="text-gray-600">${record.location_name}</div>
                        <div class="text-sm text-gray-500">${formatDateTime(record.scan_time)}</div>
                    </div>
                    <div class="text-green-600">
                        <i class="fas fa-check-circle text-2xl"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 직원 선택 해제
function clearEmployeeSelection() {
    selectedEmployee = null;
    document.getElementById('employee-selection').classList.remove('hidden');
    document.getElementById('selected-employee-info').classList.add('hidden');
    document.getElementById('scanner-section').classList.add('hidden');
    document.getElementById('employee-search').value = '';
    displayEmployees(employees);
}

// QR 스캐너 시작
async function startScanner() {
    // 기존 QR 스캐너 코드는 URL에서 구역 정보가 있으면 사용되지 않으므로 간소화
    alert('구역 정보가 URL에 포함되어 있지 않습니다. 관리자에게 문의하세요.');
}
