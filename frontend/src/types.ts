export interface TaskStatus {
  task_id: string
  status: 'pending' | 'generating' | 'done' | 'error'
  current_step: number
  total_steps: number
  completed_videos: number
  has_merged: boolean
  error: string | null
  segment_titles?: string[]
  regenerating_segment?: number | null
}

export interface SegmentItem {
  title: string
  content: string
}
