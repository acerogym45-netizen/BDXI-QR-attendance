// Supabase 설정
const SUPABASE_URL = 'https://qgpqhtuynxhmgawakjxe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ujXj0mLf1casiQdVkc0fCA_G6exymqG';

// 전역 변수
let employees = [];
let selectedEmployee = null;
let html5QrCode = null;
let recentScans = [];
let preloadedLocation = null; // URL 파라미터로 전달된 구역 정보

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadEmployees();
    setupEmployeeSearch();
    loadRecentScans();
    
    // URL 파라미터에서 구역 정보 확인
    const urlParams = new URLSearchParams(window.location.search);
    const locationCode = urlParams.get('location');
    const locationName = urlParams.get('name');
    const locationId = urlParams.get('id');
    
    if (locationCode && locationName && locationId) {
        preloadedLocation = {
            id: locationId,
            code: locationCode,
            name: locationName
        };
        
        // 구역 정보 표시
        document.getElementById('location-banner').classList.remove('hidden');
        document.getElementById('location-info').textContent = `${locationName} (${locationCode})`;
    }
});

// 직원 목록 로드
async function loadEmployees() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&is_active=eq.true&limit=100`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            employees = await response.json();
            displayEmployees(employees);
        } else {
            console.error('직원 목록 로드 실패');
            alert('직원 목록을 불러오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('직원 목록 로드 오류:', error);
        alert('직원 목록을 불러오는데 실패했습니다.');
    }
}

// 직원 목록 표시
function displayEmployees(empList) {
    const grid = document.getElementById('employees-grid');
    
    if (empList.length === 0) {
        grid.innerHTML = '<p class="col-span-2 text-center text-gray-500">검색 결과가 없습니다.</p>';
        return;
    }
    
    grid.innerHTML = empList.map(emp => `
        <button onclick="selectEmployee('${emp.id}')" 
                class="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left">
            <div class="flex items-center">
                <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    ${emp.name.charAt(0)}
                </div>
                <div>
                    <p class="font-bold">${emp.name}</p>
                    <p class="text-xs text-gray-500">${emp.employee_number}</p>
                    ${emp.department ? `<p class="text-xs text-gray-400">${emp.department}</p>` : ''}
                </div>
            </div>
        </button>
    `).join('');
}

// 직원 검색 설정
function setupEmployeeSearch() {
    const searchInput = document.getElementById('employee-search');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = employees.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm) ||
            emp.employee_number.toLowerCase().includes(searchTerm) ||
            (emp.department && emp.department.toLowerCase().includes(searchTerm))
        );
        displayEmployees(filtered);
    });
}

// 직원 선택
function selectEmployee(employeeId) {
    selectedEmployee = employees.find(emp => emp.id === employeeId);
    
    if (!selectedEmployee) {
        alert('직원 정보를 찾을 수 없습니다.');
        return;
    }
    
    // UI 업데이트
    document.getElementById('employee-avatar').textContent = selectedEmployee.name.charAt(0);
    document.getElementById('employee-name').textContent = selectedEmployee.name;
    
    let infoText = selectedEmployee.employee_number;
    if (selectedEmployee.department) infoText += ` · ${selectedEmployee.department}`;
    if (selectedEmployee.position) infoText += ` · ${selectedEmployee.position}`;
    document.getElementById('employee-info').textContent = infoText;
    
    // 화면 전환
    document.getElementById('employee-selection').classList.add('hidden');
    document.getElementById('selected-employee-info').classList.remove('hidden');
    
    // URL에서 구역 정보가 있으면 스캐너 시작하지 않음 (출석 체크 버튼으로 진행)
    if (!preloadedLocation) {
        // 구역 정보가 없으면 QR 스캐너 시작
        document.getElementById('scanner-section').classList.remove('hidden');
        setTimeout(() => startScanner(), 300);
    }
}

// 직원 선택 취소
function clearEmployeeSelection() {
    selectedEmployee = null;
    
    // 화면 전환
    document.getElementById('selected-employee-info').classList.add('hidden');
    document.getElementById('scanner-section').classList.add('hidden');
    document.getElementById('employee-selection').classList.remove('hidden');
    
    // 스캐너 중지
    if (html5QrCode) {
        html5QrCode.stop().catch(err => console.log(err));
    }
    
    // 검색 초기화
    document.getElementById('employee-search').value = '';
    displayEmployees(employees);
}

// 출석 체크 제출 (새로운 함수!)
async function submitAttendance() {
    if (!selectedEmployee) {
        alert('직원을 선택해주세요.');
        return;
    }
    
    if (!preloadedLocation) {
        alert('구역 정보가 없습니다. QR 코드를 다시 스캔해주세요.');
        return;
    }
    
    const attendanceType = document.getElementById('attendance-type').value;
    
    await saveAttendance(
        selectedEmployee,
        preloadedLocation.id,
        preloadedLocation.name,
        preloadedLocation.code,
        attendanceType
    );
}

// 출석 저장
async function saveAttendance(employee, locationId, locationName, locationCode, attendanceType) {
    const attendanceData = {
        employee_id: employee.id,
        employee_name: employee.name,
        employee_number: employee.employee_number,
        location_id: locationId,
        location_name: locationName,
        location_code: locationCode,
        attendance_type: attendanceType, // 새로 추가!
        scan_time: new Date().toISOString(),
        device_info: navigator.userAgent
    };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/attendance_records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(attendanceData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccessMessage(employee, locationName, locationCode, attendanceType);
            addRecentScan(employee.name, locationName, locationCode, attendanceType);
        } else {
            const errorText = await response.text();
            console.error('출석 저장 실패:', errorText);
            alert('출석 저장에 실패했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        console.error('출석 저장 오류:', error);
        alert('출석 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 성공 메시지 표시
function showSuccessMessage(employee, locationName, locationCode, attendanceType) {
    document.getElementById('selected-employee-info').classList.add('hidden');
    document.getElementById('scanner-section').classList.add('hidden');
    document.getElementById('success-message').classList.remove('hidden');
    
    // 출석 유형에 따른 이모지
    const typeEmoji = {
        '출근': '🟢',
        '퇴근': '🔴',
        '휴게시작': '🟡',
        '휴게종료': '🟣'
    };
    
    document.getElementById('success-employee').textContent = `${employee.name} (${employee.employee_number})`;
    document.getElementById('success-type').textContent = `${typeEmoji[attendanceType]} ${attendanceType}`;
    document.getElementById('success-location').textContent = `${locationName} (${locationCode})`;
    document.getElementById('success-time').textContent = new Date().toLocaleString('ko-KR');
}

// 폼 리셋
function resetForm() {
    selectedEmployee = null;
    
    document.getElementById('success-message').classList.add('hidden');
    document.getElementById('employee-selection').classList.remove('hidden');
    
    if (html5QrCode) {
        html5QrCode.stop().catch(err => console.log(err));
    }
    
    document.getElementById('employee-search').value = '';
    document.getElementById('attendance-type').value = '출근'; // 드롭다운 초기화
    displayEmployees(employees);
}

// 최근 스캔 추가
function addRecentScan(employeeName, locationName, locationCode, attendanceType) {
    const scan = {
        employee: employeeName,
        location: `${locationName} (${locationCode})`,
        type: attendanceType,
        time: new Date().toLocaleString('ko-KR')
    };
    
    recentScans.unshift(scan);
    if (recentScans.length > 10) recentScans.pop();
    
    localStorage.setItem('recentScans', JSON.stringify(recentScans));
    displayRecentScans();
}

// 최근 스캔 로드
function loadRecentScans() {
    const saved = localStorage.getItem('recentScans');
    if (saved) {
        recentScans = JSON.parse(saved);
        displayRecentScans();
    }
}

// 최근 스캔 표시
function displayRecentScans() {
    const list = document.getElementById('recent-scans-list');
    
    if (recentScans.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-sm">최근 출석 기록이 없습니다.</p>';
        return;
    }
    
    // 출석 유형에 따른 이모지
    const typeEmoji = {
        '출근': '🟢',
        '퇴근': '🔴',
        '휴게시작': '🟡',
        '휴게종료': '🟣'
    };
    
    list.innerHTML = recentScans.map(scan => `
        <div class="p-3 bg-gray-50 rounded-lg text-sm">
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-medium">${scan.employee} - ${scan.location}</p>
                    <p class="text-xs text-gray-600">
                        ${typeEmoji[scan.type] || '⚪'} ${scan.type} · ${scan.time}
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

// QR 스캐너 시작
async function startScanner() {
    // 카메라 권한 확인
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
    } catch (error) {
        showScannerError('카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        return;
    }
    
    html5QrCode = new Html5Qrcode("qr-reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).catch(err => {
        console.error('QR 스캐너 시작 실패:', err);
        showScannerError('QR 스캐너를 시작할 수 없습니다. 카메라를 확인해주세요.');
    });
}

// QR 스캔 성공
function onScanSuccess(decodedText) {
    console.log('QR 스캔 성공:', decodedText);
    
    try {
        // QR 코드가 URL인 경우
        if (decodedText.startsWith('http')) {
            const url = new URL(decodedText);
            const locationCode = url.searchParams.get('location');
            const locationName = url.searchParams.get('name');
            const locationId = url.searchParams.get('id');
            
            if (locationCode && locationName && locationId) {
                // 스캐너 중지
                html5QrCode.stop();
                
                // 출석 유형 선택 후 저장
                const attendanceType = document.getElementById('attendance-type').value;
                
                saveAttendance(
                    selectedEmployee,
                    locationId,
                    locationName,
                    locationCode,
                    attendanceType
                );
                return;
            }
        }
        
        alert('올바른 구역 QR 코드가 아닙니다.');
    } catch (error) {
        console.error('QR 코드 처리 오류:', error);
        alert('QR 코드 처리 중 오류가 발생했습니다.');
    }
}

// QR 스캔 오류
function onScanError(errorMessage) {
    // 스캔 중 발생하는 일반적인 오류는 무시 (스캔 대기 중)
}

// 스캐너 오류 표시
function showScannerError(message) {
    const errorDiv = document.getElementById('qr-reader-error');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
}
