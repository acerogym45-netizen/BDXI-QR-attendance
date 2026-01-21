// app/work-log/view/[id]/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  CloudSun, 
  CheckCircle, 
  XCircle, 
  Download,
  User,
  Clock
} from 'lucide-react'
import { 
  getWorkLogById, 
  updateWorkLogStatus 
} from '@/lib/api/workLog'

// 상태별 설정
const STATUS_CONFIG = {
  draft: { label: '작성중', color: 'bg-gray-100 text-gray-700', icon: Clock },
  pending_team_leader: { label: '팀장 검수 대기', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  pending_manager: { label: '소장 검수 대기', color: 'bg-blue-100 text-blue-700', icon: Clock },
  approved: { label: '승인 완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700', icon: XCircle }
}

export default function WorkLogViewPage() {
  const router = useRouter()
  const params = useParams()
  const workLogId = params.id

  const [workLog, setWorkLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalType, setApprovalType] = useState('') // 'approve' or 'reject'
  const [comments, setComments] = useState('')
  const [processing, setProcessing] = useState(false)

  // TODO: 실제 로그인한 사용자 정보로 교체
  const currentUser = {
    id: 'USER_ID_HERE',
    role: 'team_leader' // 'center_manager', 'team_leader', 'general_manager'
  }

  useEffect(() => {
    loadWorkLog()
  }, [workLogId])

  const loadWorkLog = async () => {
    try {
      setLoading(true)
      const data = await getWorkLogById(workLogId)
      setWorkLog(data)
    } catch (error) {
      console.error('Failed to load work log:', error)
      alert('업무 일지를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () => {
    setApprovalType('approve')
    setShowApprovalModal(true)
  }

  const handleReject = () => {
    setApprovalType('reject')
    setShowApprovalModal(true)
  }

  const submitApproval = async () => {
    if (approvalType === 'reject' && !comments.trim()) {
      alert('반려 사유를 입력해주세요.')
      return
    }

    try {
      setProcessing(true)

      // 다음 상태 결정
      let nextStatus = ''
      if (approvalType === 'approve') {
        if (workLog.status === 'pending_team_leader') {
          nextStatus = 'pending_manager'
        } else if (workLog.status === 'pending_manager') {
          nextStatus = 'approved'
        }
      } else {
        nextStatus = 'rejected'
      }

      await updateWorkLogStatus(
        workLogId,
        nextStatus,
        currentUser.id,
        currentUser.role,
        comments
      )

      alert(approvalType === 'approve' ? '승인되었습니다.' : '반려되었습니다.')
      setShowApprovalModal(false)
      loadWorkLog() // 새로고침
    } catch (error) {
      console.error('Approval failed:', error)
      alert('처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const canApprove = () => {
    if (!workLog) return false
    
    // 팀장: pending_team_leader 상태일 때 승인 가능
    if (currentUser.role === 'team_leader' && workLog.status === 'pending_team_leader') {
      return true
    }
    
    // 소장: pending_manager 상태일 때 승인 가능
    if (currentUser.role === 'general_manager' && workLog.status === 'pending_manager') {
      return true
    }
    
    return false
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!workLog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">업무 일지를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/work-log/list')}
            className="text-blue-600 hover:underline"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_CONFIG[workLog.status]?.icon || Clock

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            뒤로 가기
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                업무 일지 상세보기
              </h1>
              <div className="flex items-center gap-3 text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {formatDate(workLog.date)}
                </span>
                <span className="flex items-center gap-1">
                  <User size={16} />
                  {workLog.author?.email || '알 수 없음'}
                </span>
              </div>
            </div>

            {/* 상태 뱃지 */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${STATUS_CONFIG[workLog.status]?.color}`}>
              <StatusIcon size={18} />
              {STATUS_CONFIG[workLog.status]?.label}
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">날씨</div>
              <div className="flex items-center gap-2 font-medium">
                <CloudSun size={18} className="text-gray-600" />
                {workLog.weather || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">온도</div>
              <div className="font-medium">{workLog.temperature || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">작성일</div>
              <div className="font-medium">
                {new Date(workLog.created_at).toLocaleString('ko-KR')}
              </div>
            </div>
          </div>
        </div>

        {/* 타임테이블 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">타임테이블 업무 목록</h2>
          
          {workLog.tasks?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">등록된 업무가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {workLog.tasks?.sort((a, b) => a.order_index - b.order_index).map((task, index) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-sm text-gray-500">시간대</span>
                      <div className="font-medium">{task.time_slot}</div>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm text-gray-500">업무 내용</span>
                      <div className="font-medium">{task.task_description}</div>
                    </div>
                  </div>
                  <div>
                    {task.is_completed ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        완료
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                        미완료
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 청소 구역 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">청소 업무</h2>
          
          {workLog.cleanings?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">등록된 청소 구역이 없습니다.</p>
          ) : (
            <div className="space-y-6">
              {workLog.cleanings?.map((cleaning) => (
                <div key={cleaning.id} className="border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">{cleaning.area_name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* 작업 전 사진 */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">작업 전</div>
                      {cleaning.before_photo_url ? (
                        <img
                          src={cleaning.before_photo_url}
                          alt={`${cleaning.area_name} 작업 전`}
                          className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          사진 없음
                        </div>
                      )}
                    </div>
                    
                    {/* 작업 후 사진 */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">작업 후</div>
                      {cleaning.after_photo_url ? (
                        <img
                          src={cleaning.after_photo_url}
                          alt={`${cleaning.area_name} 작업 후`}
                          className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          사진 없음
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {cleaning.notes && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">비고</div>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{cleaning.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 특이사항 */}
        {workLog.special_notes && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">특이사항</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{workLog.special_notes}</p>
          </div>
        )}

        {/* 결재 이력 */}
        {workLog.approvals?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">결재 이력</h2>
            
            <div className="space-y-3">
              {workLog.approvals.map((approval) => (
                <div key={approval.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    approval.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {approval.status === 'approved' ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {approval.approver_role === 'center_manager' && '센터장'}
                        {approval.approver_role === 'team_leader' && '관리팀장'}
                        {approval.approver_role === 'general_manager' && '관리소장'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {approval.approver?.email}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(approval.approved_at).toLocaleString('ko-KR')}
                    </div>
                    {approval.comments && (
                      <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                        {approval.comments}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => alert('다운로드 기능은 추후 구현 예정입니다.')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            다운로드
          </button>

          {canApprove() && (
            <>
              <button
                onClick={handleReject}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircle size={18} />
                반려
              </button>
              
              <button
                onClick={handleApprove}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={18} />
                승인
              </button>
            </>
          )}
        </div>
      </div>

      {/* 승인/반려 모달 */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {approvalType === 'approve' ? '승인 확인' : '반려 확인'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {approvalType === 'approve' 
                ? '이 업무 일지를 승인하시겠습니까?' 
                : '이 업무 일지를 반려하시겠습니까?'}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {approvalType === 'approve' ? '코멘트 (선택)' : '반려 사유 (필수)'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={approvalType === 'approve' 
                  ? '코멘트를 입력하세요' 
                  : '반려 사유를 입력하세요'}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required={approvalType === 'reject'}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setComments('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                취소
              </button>
              <button
                onClick={submitApproval}
                className={`px-4 py-2 text-white rounded-lg ${
                  approvalType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={processing}
              >
                {processing ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
