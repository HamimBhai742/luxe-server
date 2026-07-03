export interface TSignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface TVerifyAccountInput {
  email: string;
  otp: string;
}

export interface TLoginInput {
  email: string;
  password: string;
}

export interface TForgotPasswordInput {
  email: string;
}

export interface TVerifyOtpInput {
  email: string;
  otp: string;
}

export interface TResetPasswordInput {
  email: string;
  otp?: string;
  token?: string;
  password: string;
}

