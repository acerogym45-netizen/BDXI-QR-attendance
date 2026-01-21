// lib/api/workLog.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * 새 업무 일지 생성 (draft 상태)
 */
export async function createWorkLog(data) {
  const { data: workLog, error } = await supabase
    .from('work_logs')
    .insert({
      date: data.date,
      author_id: data.author_id,
      weather: data.weather,
      temperature: data.temperature,
      special_notes: data.special_notes,
      status: 'draft'
    })
    .select()
    .single()

  if (error) throw error
  return workLog
}

/**
 * 업무 일지 목록 조회
 */
export async function getWorkLogs(filters = {}) {
  let query = supabase
    .from('work_logs')
    .select('*, author:auth.users(email)')
    .order('date', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.startDate) {
    query = query.gte('date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('date', filters.endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * 업무 일지 상세 조회 (tasks, cleanings 포함)
 */
export async function getWorkLogById(id) {
  const { data, error } = await supabase
    .from('work_logs')
    .select(`
      *,
      author:auth.users(email),
      tasks:work_log_tasks(*),
      cleanings:work_log_cleanings(*),
      approvals:work_log_approvals(*, approver:auth.users(email))
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * 타임테이블 업무 추가
 */
export async function addWorkLogTasks(workLogId, tasks) {
  const tasksWithLogId = tasks.map((task, index) => ({
    work_log_id: workLogId,
    time_slot: task.time_slot,
    task_description: task.task_description,
    is_completed: task.is_completed || false,
    order_index: index
  }))

  const { data, error } = await supabase
    .from('work_log_tasks')
    .insert(tasksWithLogId)
    .select()

  if (error) throw error
  return data
}

/**
 * 청소 구역 데이터 추가
 */
export async function addWorkLogCleanings(workLogId, cleanings) {
  const cleaningsWithLogId = cleanings.map(cleaning => ({
    work_log_id: workLogId,
    area_name: cleaning.area_name,
    before_photo_url: cleaning.before_photo_url,
    after_photo_url: cleaning.after_photo_url,
    notes: cleaning.notes
  }))

  const { data, error } = await supabase
    .from('work_log_cleanings')
    .insert(cleaningsWithLogId)
    .select()

  if (error) throw error
  return data
}

/**
 * 사진 업로드 (Supabase Storage)
 */
export async function uploadPhoto(file, workLogId, areaName, type) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${workLogId}/${areaName}_${type}_${Date.now()}.${fileExt}`
  const filePath = `work-log-photos/${fileName}`

  const { data, error } = await supabase.storage
    .from('work-log-photos')
    .upload(filePath, file)

  if (error) throw error

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from('work-log-photos')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

/**
 * 업무 일지 상태 변경 (검수 프로세스)
 */
export async function updateWorkLogStatus(workLogId, newStatus, approverId, approverRole, comments = '') {
  // 1. work_logs 상태 업데이트
  const { error: updateError } = await supabase
    .from('work_logs')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', workLogId)

  if (updateError) throw updateError

  // 2. 승인 이력 추가
  const { data, error } = await supabase
    .from('work_log_approvals')
    .insert({
      work_log_id: workLogId,
      approver_role: approverRole,
      approver_id: approverId,
      status: newStatus === 'rejected' ? 'rejected' : 'approved',
      comments: comments
    })
    .select()

  if (error) throw error
  return data
}

/**
 * 업무 일지 업데이트
 */
export async function updateWorkLog(id, data) {
  const { data: updated, error } = await supabase
    .from('work_logs')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated
}
