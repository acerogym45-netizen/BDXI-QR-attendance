// components/work-log/CleaningAreaCard.jsx
'use client'
import { Trash2 } from 'lucide-react'
import PhotoUploader from './PhotoUploader'

export default function CleaningAreaCard({ 
  cleaning, 
  workLogId,
  onUpdate, 
  onRemove 
}) {
  const handlePhotoUploaded = (type, url) => {
    onUpdate({
      ...cleaning,
      [type === 'before' ? 'before_photo_url' : 'after_photo_url']: url
    })
  }

  const handleNotesChange = (notes) => {
    onUpdate({ ...cleaning, notes })
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          {cleaning.area_name}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 사진 업로드 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <PhotoUploader
          workLogId={workLogId}
          areaName={cleaning.area_name}
          type="before"
          currentPhotoUrl={cleaning.before_photo_url}
          onPhotoUploaded={(url) => handlePhotoUploaded('before', url)}
        />
        <PhotoUploader
          workLogId={workLogId}
          areaName={cleaning.area_name}
          type="after"
          currentPhotoUrl={cleaning.after_photo_url}
          onPhotoUploaded={(url) => handlePhotoUploaded('after', url)}
        />
      </div>

      {/* 비고 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          비고 (선택사항)
        </label>
        <textarea
          value={cleaning.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="특이사항이나 추가 정보를 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  )
}
