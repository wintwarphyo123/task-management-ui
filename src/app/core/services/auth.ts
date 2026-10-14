import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthResponse, ChangePasswordModel, LoginModel, RegisterModel } from '../models/auth.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
 constructor (private http:HttpClient){}

 register(data:RegisterModel):Observable<any>{
   return this.http.post<AuthResponse>(`${environment.apiUrl}/api/Auth/register`,data).pipe(tap((res)=>this.handleAuthSuccess(res)));
 }
 login(loginModel:LoginModel):Observable<any>{
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/Auth/login`,loginModel).pipe(tap((res)=>this.handleAuthSuccess(res)));
 }
private handleAuthSuccess(res: AuthResponse): void {
    if (res.success && res.token && res.refreshToken) {
      localStorage.setItem('accessToken', res.token);
      localStorage.setItem('refreshToken', res.refreshToken);
    }
  }
  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/Auth/logout`, {}).pipe(tap(() => this.clearTokens()));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  saveTokens(token: string, refreshToken: string): void {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
  }
  refreshToken(): Observable<AuthResponse> {
    const payload = {
      token: this.getAccessToken() || '',
      refreshToken: this.getRefreshToken() || ''
    };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/Auth/refresh-token`, payload).pipe(
      tap(res => {
        if (res.success) this.saveTokens(res.token, res.refreshToken);
      })
    );
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  ChangePassword(model: ChangePasswordModel): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/Auth/ChangePassword`, model);
  }
 
}
