import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CategoryRequest, TaskItem, TaskRequest, TaskUpdateRequest } from '../models/dashboard.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  updateTaskStatus(id: number, completed: boolean) {
    throw new Error('Method not implemented.');
  }
  constructor (private http:HttpClient){}

  getCategories(){
    return this.http.get<any>(`${environment.apiUrl}/api/Categories`);
  }

  createCategory(data:CategoryRequest){
    return this.http.post<any>(`${environment.apiUrl}/api/Categories`,data);
  }

  updateCategory(id:number,data:CategoryRequest){
    return this.http.put<any>(`${environment.apiUrl}/api/Categories/${id}`,data);
  }

  deleteCategory(id:number){
    return this.http.delete<any>(`${environment.apiUrl}/api/Categories/${id}`);
  }

  getTasks():Observable<TaskItem[]>{
    return this.http.get<TaskItem[]>(`${environment.apiUrl}/api/Task`);
  }

  getTaskByCategory(categoryId:number){
    return this.http.get<any>(`${environment.apiUrl}/api/Task/category/${categoryId}`);
  }

  getTaskByDate(Duedate:string):Observable<TaskItem[]>{
    return this.http.get<TaskItem[]>(`${environment.apiUrl}/api/Task/date?date=${Duedate}`);
  }

  createTask(data:TaskRequest):Observable<TaskItem>{
    return this.http.post<TaskItem>(`${environment.apiUrl}/api/Task`,data);
  }

  updateTask(id:number,data:TaskUpdateRequest):Observable<void>{
    return this.http.put<void>(`${environment.apiUrl}/api/Task/${id}`,data);
  }

  deleteTask(id:number){
    return this.http.delete<any>(`${environment.apiUrl}/api/Task/${id}`);
  }

  toggleTaskComplete(task:TaskItem){
    const newStatus=task.status==='Done'? 'Todo':'Done';
    const UpdateDto:TaskUpdateRequest={
      title:task.title,
      description:task.description,
      status:task.status,
      dueDate:task.dueDate,
      startTime:task.startTime,
      endTime:task.endTime,
      categoryId:task.categoryId,
    };
    return this.updateTask(task.id,UpdateDto);
  }

}
