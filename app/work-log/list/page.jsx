// app/work-log/list/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Filter, Eye, Calendar } from 'lucide-react'
import { getWorkLogs } from '@/lib/api/workLog'

// 상태별 뱃지 스타일
const STATUS_CONFIG = {
  draft: { label: '작성중', color: 'bg-gray-100 text-gray-700' },
  pending_team_leader: { label: '팀장 검수 대기', color: 'bg-yellow-100 text-yellow-700' },
  pending_manager: { label: '소장 검수 대기', color: 'bg-blue-100 text-blue-700' },
  approved: { label: '승인 완료', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700' }
}

export default function WorkLogListPage() {
  const router = useRouter()
  const [workLogs, setWorkLogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 필터
  const [filterStatus, setFilterStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 데이터 로드
  useEffect(() => {
    loadWorkLogs()
  }, [filterStatus, startDate, endDate])

  const loadWorkLogs = async () => {
    try {
      setLoading(true)
      const filters = {
        status: filterStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }
      const data = await getWorkLogs(filters)
      setWorkLogs(data)
    } catch (error) {
      console.error('Failed to load work logs:', error)
      alert('업무 일지 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (id) => {
    router.push(`/work-log/view/${id}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              업무 일지 목록
            </h1>
            <p className="text-gray-600">
              작성된 업무 일지를 조회하고 관리합니다.
            </p>
          </div>
          
          <button
            onClick={() => router.push('/work-log/create')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <Plus size={20} />
            새 일지 작성
          </button>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold">필터</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="draft">작성중</option>
                <option value="pending_team_leader">팀장 검수 대기</option>
                <option value="pending_manager">소장 검수 대기</option>
                <option value="approved">승인 완료</option>
                <option value="rejected">반려</option>
              </select>
            </div>

            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 날짜
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 날짜
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 초기화 버튼 */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('')
                  setStartDate('')
                  setEndDate('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : workLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">작성된 업무 일지가 없습니다.</p>
              <button
                onClick={() => router.push('/work-log/create')}
                className="text-blue-600 hover:underline"
              >
                첫 번째 일지 작성하기 →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날씨
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleView(log.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatDate(log.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{log.weather || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{log.author?.email || '알 수 없음'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[log.status]?.color}`}>
                        {STATUS_CONFIG[log.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleView(log.id)
                        }}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye size={16} />
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 통계 정보 */}
        {workLogs.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = workLogs.filter(log => log.status === status).length
              return (
                <div key={status} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="text-sm text-gray-600 mb-1">{config.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
