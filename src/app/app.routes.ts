import { Routes } from '@angular/router';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard/dashboard';

export const routes: Routes = [
    { 
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }, // Redirect default route to login
    { 
    path: 'login', 
    component: Login 
    },
    { 
        path: 'register',
        component: Register 
    },
    {
        path: 'dashboard',
        component:Dashboard
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
