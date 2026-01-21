// components/work-log/TimeTableEditor.jsx
'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function TimeTableEditor({ tasks, onTasksChange }) {
  const addTask = () => {
    const newTask = {
      id: Date.now(),
      time_slot: '',
      task_description: '',
      is_completed: false
    }
    onTasksChange([...tasks, newTask])
  }

  const removeTask = (id) => {
    onTasksChange(tasks.filter(task => task.id !== id))
  }

  const updateTask = (id, field, value) => {
    onTasksChange(
      tasks.map(task => 
        task.id === id ? { ...task, [field]: value } : task
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">타임테이블 업무 목록</h3>
        <button
          type="button"
          onClick={addTask}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          업무 추가
        </button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            업무를 추가해주세요
          </div>
        ) : (
          tasks.map((task, index) => (
            <div key={task.id} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시간대
                  </label>
                  <input
                    type="text"
                    placeholder="09:00-10:00"
                    value={task.time_slot}
                    onChange={(e) => updateTask(task.id, 'time_slot', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 내용
                  </label>
                  <input
                    type="text"
                    placeholder="수영장 청소 및 소독"
                    value={task.task_description}
                    onChange={(e) => updateTask(task.id, 'task_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={(e) => updateTask(task.id, 'is_completed', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">완료</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
