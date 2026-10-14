import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink,Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
//import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputPasswordModule } from 'primeng/inputpassword';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth';
import { LoginModel } from '../../../core/models/auth.model';


@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    InputPasswordModule,
    IconFieldModule,
    InputIconModule,
    ButtonDirective,
    //ButtonModule,
    MessageModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  
  isloading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private formBuilder = inject(FormBuilder);

  public loginForm = this.formBuilder.group({
    email: ['', [Validators.required,Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(
  private messageService: MessageService,
  private authService: AuthService,
  private router: Router,
  private cdr: ChangeDetectorRef,
  ) { }
onlogin() {
    if (this.loginForm.valid) {
      this.isloading = true;
      const loginModel:LoginModel =this.loginForm.value as LoginModel;
      this.authService.login(loginModel).subscribe(
        {
          next: (response) => {
          this.isloading = false;
          if (response.success) {
            // localStorage.setItem('token', response.token);
            // //this.router.navigate(['/dashboard']);
            // this.ngZone.run(() => {
            //   this.router.navigate(['/dashboard']);
            // });
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = response.errors?.join(', ') || 'Login failed';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isloading = false;
          this.errorMessage = error.message || 'An error occurred during login';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
          this.cdr.detectChanges();
        }
        }
      );
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields correctly.' });
    }
  }

}
