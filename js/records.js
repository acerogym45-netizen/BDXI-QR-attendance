// Supabase 설정
const SUPABASE_URL = 'https://qgpqhtuynxhmgawakjxe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ujXj0mLf1casiQdVkc0fCA_G6exymqG';

// 전역 변수
let allRecords = [];
let filteredRecords = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜를 기본값으로 설정
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
    document.getElementById('end-date').value = today;
    
    // 데이터 로드
    loadEmployeesForFilter();
    loadLocationsForFilter();
    loadRecords();
});

// 직원 목록 로드 (필터용)
async function loadEmployeesForFilter() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&is_active=eq.true`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            const employees = await response.json();
            const select = document.getElementById('employee-filter');
            
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.name} (${emp.employee_number})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('직원 목록 로드 실패:', error);
    }
}

// 구역 목록 로드 (필터용)
async function loadLocationsForFilter() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=*&is_active=eq.true`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            const locations = await response.json();
            const select = document.getElementById('location-filter');
            
            locations.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc.id;
                option.textContent = `${loc.name} (${loc.code})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('구역 목록 로드 실패:', error);
    }
}

// 출석 기록 로드
async function loadRecords() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('no-records').classList.add('hidden');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/attendance_records?select=*&order=scan_time.desc&limit=1000`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            allRecords = await response.json();
            filteredRecords = [...allRecords];
            
            // 통계 업데이트
            updateStatistics();
            
            // 테이블 렌더링
            renderRecords(filteredRecords);
        } else {
            console.error('출석 기록 로드 실패');
            showNoRecords();
        }
    } catch (error) {
        console.error('출석 기록 로드 중 오류:', error);
        showNoRecords();
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

// 통계 업데이트
function updateStatistics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // 오늘 출석
    const todayCount = allRecords.filter(r => {
        const recordDate = new Date(r.scan_time);
        return recordDate >= today;
    }).length;
    
    // 이번 주 출석
    const weekCount = allRecords.filter(r => {
        const recordDate = new Date(r.scan_time);
        return recordDate >= weekAgo;
    }).length;
    
    // 이번 달 출석
    const monthCount = allRecords.filter(r => {
        const recordDate = new Date(r.scan_time);
        return recordDate >= monthAgo;
    }).length;
    
    // 전체 출석
    const totalCount = allRecords.length;
    
    document.getElementById('today-count').textContent = todayCount;
    document.getElementById('week-count').textContent = weekCount;
    document.getElementById('month-count').textContent = monthCount;
    document.getElementById('total-count').textContent = totalCount;
}

// 출석 기록 렌더링
function renderRecords(records) {
    const tbody = document.getElementById('records-list');
    
    if (records.length === 0) {
        showNoRecords();
        return;
    }
    
    // 출석 유형에 따른 이모지 및 색상
    const typeStyles = {
        '출근': { emoji: '🟢', bg: 'bg-green-100', text: 'text-green-800' },
        '퇴근': { emoji: '🔴', bg: 'bg-red-100', text: 'text-red-800' },
        '휴게시작': { emoji: '🟡', bg: 'bg-yellow-100', text: 'text-yellow-800' },
        '휴게종료': { emoji: '🟣', bg: 'bg-purple-100', text: 'text-purple-800' }
    };
    
    tbody.innerHTML = records.map(record => {
        const scanTime = new Date(record.scan_time);
        const formattedDate = scanTime.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const formattedTime = scanTime.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const attendanceType = record.attendance_type || '출근';
        const style = typeStyles[attendanceType] || typeStyles['출근'];
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${formattedDate}</div>
                    <div class="text-sm text-gray-500">${formattedTime}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${record.employee_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${record.employee_number || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-sm font-semibold rounded-full ${style.bg} ${style.text}">
                        ${style.emoji} ${attendanceType}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${record.location_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${record.location_code}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${record.device_info || '-'}
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('no-records').classList.add('hidden');
}

// 기록 없음 표시
function showNoRecords() {
    document.getElementById('records-list').innerHTML = '';
    document.getElementById('no-records').classList.remove('hidden');
}

// 필터 적용
function applyFilters() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const employeeId = document.getElementById('employee-filter').value;
    const locationId = document.getElementById('location-filter').value;
    const attendanceType = document.getElementById('type-filter').value; // 새로 추가!
    
    filteredRecords = allRecords.filter(record => {
        const recordDate = new Date(record.scan_time).toISOString().split('T')[0];
        
        // 날짜 필터
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        
        // 직원 필터
        if (employeeId && record.employee_id !== employeeId) return false;
        
        // 구역 필터
        if (locationId && record.location_id !== locationId) return false;
        
        // 출석 유형 필터 (새로 추가!)
        if (attendanceType && record.attendance_type !== attendanceType) return false;
        
        return true;
    });
    
    renderRecords(filteredRecords);
}

// 필터 초기화
function resetFilters() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
    document.getElementById('end-date').value = today;
    document.getElementById('employee-filter').value = '';
    document.getElementById('location-filter').value = '';
    document.getElementById('type-filter').value = ''; // 새로 추가!
    
    filteredRecords = [...allRecords];
    renderRecords(filteredRecords);
}

// CSV 다운로드
function exportToCSV() {
    if (filteredRecords.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }
    
    // CSV 헤더 (출석 유형 추가!)
    const headers = ['날짜', '시간', '직원', '직원번호', '출석유형', '구역', '구역코드', '기기정보'];
    
    // CSV 데이터
    const rows = filteredRecords.map(record => {
        const scanTime = new Date(record.scan_time);
        const date = scanTime.toLocaleDateString('ko-KR');
        const time = scanTime.toLocaleTimeString('ko-KR');
        
        return [
            date,
            time,
            record.employee_name,
            record.employee_number || '',
            record.attendance_type || '출근', // 새로 추가!
            record.location_name,
            record.location_code,
            record.device_info || ''
        ];
    });
    
    // CSV 생성
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += headers.join(',') + '\n';
    csvContent += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const filename = `출석기록_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
