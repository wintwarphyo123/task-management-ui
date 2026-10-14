import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let authReq = req;
  const token = authService.getAccessToken();

  // ၁။ ထွက်သမျှ Request တိုင်း၏ Header ထဲသို့ Access Token ထည့်ပေးခြင်း
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // ၂။ 401 Unauthorized ဖြစ်ပါက Refresh Token အသုံးပြု၍ Token အသစ်လဲခြင်း
      if (error instanceof HttpErrorResponse && error.status === 401) {
        
        // Login သို့မဟုတ် Refresh-Token endpoint များဖြစ်ပါက လောပတ်မပတ်စေရန် တိုက်ရိုက် Login သို့ ပို့မည်
        if (req.url.includes('/refresh-token') || req.url.includes('/login')) {
          authService.clearTokens();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((res) => {
              isRefreshing = false;

              if (res.success && res.token) {
                refreshTokenSubject.next(res.token);

                // Token အသစ်ရလျှင် ယခင် ရပ်တန့်သွားသော Request ကို ပြန်လည် ပို့ပေးခြင်း
                return next(
                  req.clone({
                    setHeaders: { Authorization: `Bearer ${res.token}` }
                  })
                );
              }

              // Refresh ပါ မရတော့လျှင် Login မျက်နှာပြင်သို့ ပြန်ပို့မည်
              authService.clearTokens();
              router.navigate(['/login']);
              return throwError(() => new Error('Session Expired'));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.clearTokens();
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          // တပြိုင်နက်တည်း API ခေါ်ယူမှုများစွာ 401 ဖြစ်ပါက Token အသစ်ရသည်အထိ စောင့်ဆိုင်းစေခြင်း
          return refreshTokenSubject.pipe(
            filter((t) => t !== null),
            take(1),
            switchMap((jwtToken) =>
              next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${jwtToken}` }
                })
              )
            )
          );
        }
      }

      return throwError(() => error);
    })
  );
};