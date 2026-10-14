export interface CategoryRequest {
  name:string;
}
export interface CategoryUI extends CategoryRequest {
  id?: number;
  completed?: boolean; // Frontend-only UI state
}
export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: 'Todo' | 'InProgress' | 'Done'; // String Literal Types သုံးခြင်း
  dueDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  categoryId: number;
  categoryName?: string;
  // Frontend-only Computed/UI Property
  completed?: boolean; 
}
export interface TaskRequest {
  title: string;
  description: string;
  dueDate?: string|null;
  startTime?: string|null;
  endTime?: string|null;
  categoryId?: number;
}
export interface TaskUpdateRequest{
  title:string;
  description:string;
  status:'Todo'| 'InProgress'| 'Done';
  dueDate?:string|null;
  startTime?:string|null;
  endTime?:string|null;
  categoryId:number;
}

export interface DailyTimeSlot {
  hour: number;
  timeLabel: string;
  task: (TaskItem & { timeRange?: string }) | null;
}