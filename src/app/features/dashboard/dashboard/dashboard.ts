import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective, ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { CategoryRequest, CategoryUI, DailyTimeSlot, TaskItem, TaskRequest, TaskUpdateRequest } from '../../../core/models/dashboard.model';
import { DashboardService } from '../../../core/services/dashboard';
import { InputTextModule } from 'primeng/inputtext';
import { LabelModule } from 'primeng/label';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/services/auth';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

interface TimeSlot {
  time: string;
  events: { [key: number]: { title: string; range: string; color: 'lime' | 'purple' } };
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // FIXED: Added ReactiveFormsModule
    ButtonDirective,
    DatePickerModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    AvatarModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    LabelModule,
    ContextMenuModule,
    SelectModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  cm = viewChild<ContextMenu>('cm');

  isloading: boolean = false;
  errorMessage: string = '';
  categoryModel: CategoryUI[] = [];
  categoryDialogVisible: boolean = false;
  categoryName: string = '';
  taskTitle: string = '';
  taskModel: TaskItem[] = [];
  taskList: TaskItem[] = [];
  taskDialogVisible: boolean = false;
  selectedCategoryId: number | null = null;
  selectedCategoryForContext!: CategoryUI;
  isEditMode: boolean = false;
  selectedTaskForEdit: TaskItem | null = null;
  selectedTaskForContent!: TaskItem;

  selectedDate: Date = new Date();
  hourlyTimeSlots: DailyTimeSlot[] = [];

  private formBuilder = inject(FormBuilder);

  public taskForm = this.formBuilder.group({
    title: ['', Validators.required],
    description: [''],
    status: ['Todo'],
    dueDate: [null as Date | string | null],
    startTime: [null as Date | string | null],
    endTime: [null as Date | string | null],
    categoryId: [null as number | null, Validators.required],
  });

  contextMenuItems: MenuItem[] = [];

  constructor(
    private messageService: MessageService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authservice: AuthService,
    private confirmationService: ConfirmationService
  ) { }

  // Getter for Category Filter Dropdown
  get categoryOptions(): CategoryUI[] {
    return [
      { id: 0, name: 'All Categories' },
      ...this.categoryModel
    ];
  }

  ngOnInit() {
    this.fetchCategories();
    this.fetchTasks();
    this.loadDailyTasks();

    this.contextMenuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEditCategoryDialog(this.selectedCategoryForContext)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteTask(this.selectedTaskForContent)
      }
    ];
    this.contextMenuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEditTaskDialog(this.selectedTaskForContent)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteTask(this.selectedTaskForContent)
      }
    ];
  }

  fetchCategories() {
    this.isloading = true;
    this.errorMessage = '';
    this.dashboardService.getCategories().subscribe({
      next: (data) => {
        this.categoryModel = data.map((cat: any) => ({
          ...cat,
          completed: false
        }));
        this.isloading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isloading = false;
        this.errorMessage = 'Failed to fetch categories. Please try again later.';
        console.error('Error fetching categories:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
        this.cdr.detectChanges();
      }
    });
  }

  openEditCategoryDialog(category: CategoryUI) {
    this.selectedCategoryForContext = category;
    this.categoryName = category.name;
    this.categoryDialogVisible = true;
  }

  openCategoryDialog() {
    this.categoryName = '';
    this.selectedCategoryForContext = null as any;
    this.categoryDialogVisible = true;
  }

  closeCategoryDialog() {
    this.categoryDialogVisible = false;
    this.categoryName = '';
  }

  saveCategory() {
    if (!this.categoryName.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Category name cannot be empty.' });
      return;
    }
    this.isloading = true;
    if (this.selectedCategoryForContext?.id) {
      const updatePayload: CategoryUI = {
        ...this.selectedCategoryForContext,
        name: this.categoryName.trim()
      };
      this.dashboardService.updateCategory(this.selectedCategoryForContext.id, updatePayload).subscribe({
        next: (updatedCategory) => {
          const index = this.categoryModel.findIndex(cat => cat.id === this.selectedCategoryForContext.id);
          if (index !== -1) {
            this.categoryModel[index] = updatedCategory;
          }
          this.isloading = false;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category updated successfully!' });
          this.closeCategoryDialog();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isloading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update category.' });
          console.error('Error updating category:', error);
          this.cdr.detectChanges();
        }
      });
    } else {
      const newCategory: CategoryRequest = { name: this.categoryName.trim() };
      this.dashboardService.createCategory(newCategory).subscribe({
        next: (createdCategory) => {
          this.categoryModel.push(createdCategory);
          this.isloading = false;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category created successfully!' });
          this.closeCategoryDialog();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isloading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create category.' });
          console.error('Error creating category:', error);
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCategoryContextMenu(event: MouseEvent, category: CategoryUI, cm: any) {
    event.preventDefault();
    this.selectedCategoryForContext = category;
    cm.show(event);
  }

  deleteCategory(category: CategoryUI) {
    if (!category?.id) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Category ID is missing.' });
      return;
    }
    this.isloading = true;
    this.dashboardService.deleteCategory(category.id).subscribe({
      next: () => {
        this.categoryModel = this.categoryModel.filter(cat => cat.id !== category.id);
        if (this.selectedCategoryId === category.id) {
          this.fetchTasks();
        }
        this.isloading = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category deleted successfully!' });
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isloading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete category.' });
        console.error('Error deleting category:', error);
        this.cdr.detectChanges();
      }
    });
  }

  onCategorySelect(categoryId: number) {
    if (!categoryId || categoryId === 0) {
      this.fetchTasks();
      return;
    }
    this.selectedCategoryId = categoryId;
    this.isloading = true;
    this.errorMessage = '';
    this.dashboardService.getTaskByCategory(categoryId).subscribe({
      next: (data) => {
        this.taskList = data;
        this.isloading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Failed to fetch tasks for selected category.';
        console.error('Error fetching tasks for category:', error);
        this.cdr.detectChanges();
      }
    });
  }

  onCategoryFilterChange(event: any) {
    const selectedId = event.value;
    this.onCategorySelect(selectedId);
  }

  //selectedDate: Date = new Date();
  onDateChange(event: any) {
    this.selectedDate = event.value;
  }

  fetchTasks() {
    this.isloading = true;
    this.errorMessage = '';
    this.selectedCategoryId = null;
    this.dashboardService.getTasks().subscribe({
      next: (data) => {
        this.taskList = data.map(task => ({
          ...task,
          completed: task.status === 'Done'
        }));
        this.isloading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Failed to fetch tasks. Please try again later.';
        console.error('Error fetching tasks:', error);
        this.cdr.detectChanges();
      }
    });
  }
  openEditTaskDialog(task: TaskItem) {
    this.selectedTaskForContent = task;
    this.taskTitle = task.title;
    this.taskDialogVisible = true;
  }

  editTask(task: TaskItem) {
    this.isEditMode = true;
    this.selectedTaskForEdit = task;

    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      categoryId: task.categoryId,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      startTime: task.startTime ? new Date(task.startTime) : null,
      endTime: task.endTime ? new Date(task.endTime) : null
    });
    this.taskDialogVisible = true;
    this.cdr.detectChanges;
  }

  onTaskContextMenu(event: MouseEvent, task: TaskItem, cm: any) {
    event.preventDefault();
    this.selectedTaskForContent = task;
    cm.show(event);
  }

  deleteTask(task: TaskItem) {
    if (!task.id) return;

    this.isloading = true;
    this.dashboardService.deleteTask(task.id).subscribe({
      next: () => {
        this.taskModel = this.taskModel.filter(t => t.id !== task.id);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Task deleted successfully!' });
        this.isloading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete task.' });
        this.isloading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeTaskDialog() {
    this.taskDialogVisible = false;
    this.isEditMode = false;
    this.selectedTaskForEdit = null;
    this.taskForm.reset();
  }

  openTaskDialog() {
    this.taskDialogVisible = true;
    this.isEditMode = false;
    this.selectedTaskForEdit = null;
    this.taskForm.reset({
      title: '',
      description: '',
      categoryId: (this.selectedCategoryId && this.selectedCategoryId !== 0) ? this.selectedCategoryId : null,
      dueDate: null,
      startTime: null,
      endTime: null
    });
  }

  saveTask() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill in required fields.' });
      return;
    }

    this.isloading = true;
    const formValues = this.taskForm.value;

    const dueDateObj = formValues.dueDate ? new Date(formValues.dueDate) : null;
    let formattedDueDate = null;
    if (dueDateObj) {
      const y = dueDateObj.getFullYear();
      const m = String(dueDateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dueDateObj.getDate()).padStart(2, '0');
      formattedDueDate = `${y}-${m}-${d}T00:00:00`;
    }
    let formattedStartTime = null;
    if (formValues.startTime && dueDateObj) {
      const startTimeObj = new Date(formValues.startTime);
      startTimeObj.setFullYear(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
      formattedStartTime = startTimeObj.toISOString();
    } else if (formValues.startTime) {
      formattedStartTime = new Date(formValues.startTime).toISOString();
    }

    // 3. EndTime တွင် DueDate ရဲ့ ရက်စွဲနှင့် EndTime ရဲ့ အချိန်ကို ပေါင်းစပ်ခြင်း
    let formattedEndTime = null;
    if (formValues.endTime && dueDateObj) {
      const endTimeObj = new Date(formValues.endTime);
      endTimeObj.setFullYear(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
      formattedEndTime = endTimeObj.toISOString();
    } else if (formValues.endTime) {
      formattedEndTime = new Date(formValues.endTime).toISOString();
    }

    if (this.isEditMode && this.selectedTaskForEdit?.id) {
      const updatePayload: TaskUpdateRequest = {
        title: formValues.title?.trim() || '',
        description: formValues.description?.trim() || '',
        status: this.selectedTaskForEdit.status || 'Todo',
        dueDate: formattedDueDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        categoryId: formValues.categoryId ? Number(formValues.categoryId) : (this.selectedCategoryId || 0)
      };
      this.dashboardService.updateTask(this.selectedTaskForEdit.id, updatePayload).subscribe({
        next: () => {
          const index = this.taskModel.findIndex(t => t.id === this.selectedTaskForEdit?.id);
          if (index !== -1) {
            this.taskModel[index] = {
              ...this.taskModel[index],
              ...updatePayload,
              completed: updatePayload.status === 'Done'
            };
          }
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Task updated successfully' });
          this.closeTaskDialog();
          this.isloading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update task.' });
          this.isloading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const createPayload: TaskRequest = {
        title: formValues.title?.trim() || '',
        description: formValues.description?.trim() || '',
        categoryId: formValues.categoryId ? Number(formValues.categoryId) : (this.selectedCategoryId || 0),
        dueDate: formattedDueDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };
      this.dashboardService.createTask(createPayload).subscribe({
        next: (createdTask) => {
          this.taskModel.push({ ...createdTask, completed: createdTask.status === 'Done' });

          this.fetchTasks();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Task created successfully' });
          this.closeTaskDialog();
          this.isloading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create task.' });
          this.isloading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- Visual Calendar Properties ---

  // Calendar ရဲ့ (onSelect) မှ ခေါ်ပေးရန် Method
  onCalendarDateSelect(date: Date) {
    this.selectedDate = new Date(date);
    this.loadDailyTasks();
  }

  changeDay(offset: number) {
    const updatedDate = new Date(this.selectedDate);
    updatedDate.setDate(updatedDate.getDate() + offset);
    this.selectedDate = updatedDate;
    this.loadDailyTasks();
  }

  goToToday() {
    this.selectedDate = new Date();
    this.loadDailyTasks();
  }

  loadDailyTasks() {
    this.isloading = true;
    // Local Timezone Offset ကြောင့် ရက်စွဲလွဲခြင်း မဖြစ်စေရန် 'YYYY-MM-DD' Format ဖွဲ့ခြင်း
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    this.dashboardService.getTaskByDate(formattedDate).subscribe({
      next: (tasks) => {
        this.generateDailySlots(tasks);
        this.taskModel = tasks;

        this.isloading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching daily tasks:', err);
        this.isloading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateDailySlots(tasks: TaskItem[]) {
    // const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 8 AM to 6 PM
    const hours = Array.from({ length: 24 }, (_, i) => i);
    this.hourlyTimeSlots = hours.map(h => {
      //const timeLabel = h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
      const timeLabel = h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;

      const matchedTask = tasks.find(t => {
        if (!t.startTime) return false;
        return new Date(t.startTime).getHours() === h;
      });

      let mappedTask = null;
      if (matchedTask) {
        const start = matchedTask.startTime ? new Date(matchedTask.startTime) : null;
        const end = matchedTask.endTime ? new Date(matchedTask.endTime) : null;

        const timeRange = start && end
          ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'All Day';

        mappedTask = { ...matchedTask, timeRange };
      }

      return {
        hour: h,
        timeLabel,
        task: mappedTask
      };
    });
  }

  markTaskAsCompleted(task: TaskItem) {
    if (!task.id) return;

    const previousState = !task.completed;
    const newStatus = task.completed ? 'Done' : 'Todo';
    task.status = newStatus;

    this.syncTaskStatusAcrossList(task.id, task.completed ?? false, newStatus);
    const updatePayload: TaskUpdateRequest = {
      title: task.title,
      description: task.description || '',
      status: newStatus,
      categoryId: task.categoryId,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      startTime: task.startTime ? new Date(task.startTime).toISOString() : null,
      endTime: task.endTime ? new Date(task.endTime).toISOString() : null
    };

    this.dashboardService.updateTask(task.id, updatePayload).subscribe({
      error: (err) => {
        const revertedStatus = previousState ? 'Done' : 'Todo';
        this.syncTaskStatusAcrossList(task.id, previousState, revertedStatus);
        console.error('Error updating task status:', err);
        this.cdr.detectChanges();
      }
    });
  }

  private syncTaskStatusAcrossList(taskId: number | string, completed: boolean, status: 'Todo' | 'InProgress' | 'Done') {
    const foundList = this.taskList?.find(t => t.id == taskId);
    if (foundList) {
      foundList.completed = completed;
      foundList.status = status
    }
    const slotWithTask = this.hourlyTimeSlots?.find(s => s.task && s.task.id == taskId);
    if (slotWithTask && slotWithTask.task) {
      slotWithTask.task.completed = completed;
      slotWithTask.task.status = status;
    }
    this.cdr.markForCheck();
  }

  // activeTab: 'Daily' | 'Weekly' | 'Monthly' = 'Daily';

  // setTab(tab: string) {
  //   this.activeTab = tab as 'Daily' | 'Weekly' | 'Monthly';
  // }

  logout() {
    this.confirmationService.confirm({
      message: 'Are you sure want to log out?',
      header: 'Confirm logout!',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.authservice.logout();
        this.router.navigate(['/login']);
      },
      reject: () => {

      }
    });
  }

}