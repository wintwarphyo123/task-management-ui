export interface RegisterModel{
    userName: string;
    email: string;
    password: string;
}

export interface LoginModel{
    email: string;
    password: string;
}
export interface ChangePasswordModel {
    oldPassword: string;
    newPassword: string;
}
export interface AuthResponseModel{
    token: string;
    expiration: Date;
}
export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  errors?: string[];
}