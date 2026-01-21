// app/work-log/create/page.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Send, Calendar, CloudSun } from 'lucide-react'
import TimeTableEditor from '@/components/work-log/TimeTableEditor'
import CleaningAreaCard from '@/components/work-log/CleaningAreaCard'
import { 
  createWorkLog, 
  addWorkLogTasks, 
  addWorkLogCleanings,
  updateWorkLogStatus 
} from '@/lib/api/workLog'

// 청소 구역 목록
const CLEANING_AREAS = [
  '골프장',
  '수영장', 
  '남자 사우나',
  '여자 사우나',
  '카페테리아',
  '헬스장',
  '다목적 체육관',
  '게스트하우스',
  '화장실',
  '기타 구역(로비,홀 등)'
]

export default function CreateWorkLogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // 기본 정보
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weather, setWeather] = useState('')
  const [temperature, setTemperature] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  
  // 타임테이블
  const [tasks, setTasks] = useState([])
  
  // 청소 구역 (선택된 구역만)
  const [selectedAreas, setSelectedAreas] = useState([])
  const [cleanings, setCleanings] = useState([])
  
  // 현재 작업 중인 workLog ID (사진 업로드용)
  const [workLogId, setWorkLogId] = useState(null)

  // 청소 구역 추가
  const handleAddCleaningArea = (areaName) => {
    if (cleanings.find(c => c.area_name === areaName)) {
      alert('이미 추가된 구역입니다.')
      return
    }
    
    const newCleaning = {
      id: Date.now(),
      area_name: areaName,
      before_photo_url: null,
      after_photo_url: null,
      notes: ''
    }
    
    setCleanings([...cleanings, newCleaning])
    setSelectedAreas([...selectedAreas, areaName])
  }

  // 청소 구역 삭제
  const handleRemoveCleaningArea = (id) => {
    const cleaning = cleanings.find(c => c.id === id)
    setCleanings(cleanings.filter(c => c.id !== id))
    setSelectedAreas(selectedAreas.filter(area => area !== cleaning.area_name))
  }

  // 청소 정보 업데이트
  const handleUpdateCleaning = (updatedCleaning) => {
    setCleanings(cleanings.map(c => 
      c.id === updatedCleaning.id ? updatedCleaning : c
    ))
  }

  // 임시저장 (draft)
  const handleSaveDraft = async () => {
    try {
      setLoading(true)
      
      // 1. 업무 일지 생성
      const workLog = await createWorkLog({
        date,
        author_id: 'USER_ID_HERE', // TODO: 실제 로그인 사용자 ID로 교체
        weather,
        temperature,
        special_notes: specialNotes
      })
      
      setWorkLogId(workLog.id)
      
      // 2. 타임테이블 저장
      if (tasks.length > 0) {
        await addWorkLogTasks(workLog.id, tasks)
      }
      
      // 3. 청소 구역 저장
      if (cleanings.length > 0) {
        await addWorkLogCleanings(workLog.id, cleanings)
      }
      
      alert('임시저장되었습니다.')
      router.push('/work-log/list')
    } catch (error) {
      console.error('Save failed:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 제출 (관리팀장에게 검수 요청)
  const handleSubmit = async () => {
    // 유효성 검사
    if (!date || !weather || tasks.length === 0) {
      alert('필수 항목을 입력해주세요.')
      return
    }
    
    try {
      setLoading(true)
      
      // 1. 업무 일지 생성
      const workLog = await createWorkLog({
        date,
        author_id: 'USER_ID_HERE', // TODO: 실제 로그인 사용자 ID로 교체
        weather,
        temperature,
        special_notes: specialNotes
      })
      
      // 2. 타임테이블 저장
      await addWorkLogTasks(workLog.id, tasks)
      
      // 3. 청소 구역 저장
      if (cleanings.length > 0) {
        await addWorkLogCleanings(workLog.id, cleanings)
      }
      
      // 4. 상태 변경: 관리팀장 검수 대기
      await updateWorkLogStatus(
        workLog.id, 
        'pending_team_leader',
        'USER_ID_HERE', // TODO: 실제 로그인 사용자 ID로 교체
        'center_manager',
        '업무 일지 제출'
      )
      
      alert('업무 일지가 제출되었습니다.')
      router.push('/work-log/list')
    } catch (error) {
      console.error('Submit failed:', error)
      alert('제출 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            업무 일지 작성
          </h1>
          <p className="text-gray-600">
            자이안센터 일일 업무 내용을 기록합니다.
          </p>
        </div>

        {/* 기본 정보 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline mr-2" size={16} />
                날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 날씨 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CloudSun className="inline mr-2" size={16} />
                날씨
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">선택하세요</option>
                <option value="맑음">☀️ 맑음</option>
                <option value="흐림">☁️ 흐림</option>
                <option value="비">🌧️ 비</option>
                <option value="눈">❄️ 눈</option>
              </select>
            </div>

            {/* 온도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                온도
              </label>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="예: 25°C"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 타임테이블 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <TimeTableEditor 
            tasks={tasks} 
            onTasksChange={setTasks} 
          />
        </div>

        {/* 청소 구역 선택 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">청소 구역 선택</h2>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {CLEANING_AREAS.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => handleAddCleaningArea(area)}
                disabled={selectedAreas.includes(area)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedAreas.includes(area)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>

          {/* 청소 구역 카드들 */}
          <div className="space-y-4">
            {cleanings.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                청소 구역을 선택해주세요
              </div>
            ) : (
              cleanings.map(cleaning => (
                <CleaningAreaCard
                  key={cleaning.id}
                  cleaning={cleaning}
                  workLogId={workLogId || 'temp'}
                  onUpdate={handleUpdateCleaning}
                  onRemove={() => handleRemoveCleaningArea(cleaning.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* 특이사항 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">특이사항</h2>
          <textarea
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="특이사항이나 추가 보고 내용을 입력하세요"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            취소
          </button>
          
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <Save size={18} />
            임시저장
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <Send size={18} />
            제출
          </button>
        </div>
      </div>
    </div>
  )
}
