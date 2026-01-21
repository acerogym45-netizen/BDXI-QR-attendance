// components/work-log/PhotoUploader.jsx
'use client'
import { useState, useRef } from 'react'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadPhoto } from '@/lib/api/workLog'

export default function PhotoUploader({ 
  workLogId, 
  areaName, 
  type, // 'before' or 'after'
  currentPhotoUrl,
  onPhotoUploaded 
}) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl || null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 미리보기 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)

    // 업로드
    try {
      setUploading(true)
      const photoUrl = await uploadPhoto(file, workLogId, areaName, type)
      onPhotoUploaded(photoUrl)
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onPhotoUploaded(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {previewUrl ? (
        // 사진 미리보기
        <div className="relative group">
          <img
            src={previewUrl}
            alt={`${areaName} ${type}`}
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
          />
          
          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={uploading}
          >
            <X size={16} />
          </button>

          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-sm">업로드 중...</div>
            </div>
          )}
        </div>
      ) : (
        // 업로드 버튼
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          disabled={uploading}
        >
          <Camera size={32} className="text-gray-400" />
          <div className="text-sm text-gray-600">
            {type === 'before' ? '작업 전 사진 촬영' : '작업 후 사진 촬영'}
          </div>
          <div className="text-xs text-gray-500">
            클릭하여 카메라 실행
          </div>
        </button>
      )}

      {/* 라벨 */}
      <div className="mt-2 text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          type === 'before' 
            ? 'bg-orange-100 text-orange-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {type === 'before' ? '작업 전' : '작업 후'}
        </span>
      </div>
    </div>
  )
}
