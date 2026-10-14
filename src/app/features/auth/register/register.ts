import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component,inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
//import { PasswordModule } from 'primeng/password';
import { InputPasswordModule } from 'primeng/inputpassword';
//import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonDirective } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth';
import { RegisterModel } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    InputPasswordModule,
    //PasswordModule,
    ButtonDirective,
    MessageModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
 registerModel:RegisterModel = {
    userName: '',
    email: '',
    password: ''
 };
 isloading:boolean=false;
 errorMessage:string='';
 showPassword: boolean = false;
 togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

constructor(
  private messageService: MessageService,
  private authService: AuthService,
  private router: Router,
  private cdr: ChangeDetectorRef
  ) { }
  private formBuilder=inject(FormBuilder);
  public registerForm = this.formBuilder.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  onRegister() {
    if (this.registerForm.valid) {
      this.isloading=true;
      const registerModel: RegisterModel = this.registerForm.value as RegisterModel;
      this.authService.register(registerModel).subscribe({
        next: (response) => {
          this.isloading=false;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Registration successful!' });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isloading=false;
          this.errorMessage = error.error?.errors?.join(', ') || 'An error occurred during registration.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields correctly.' });
    }
  }
}
