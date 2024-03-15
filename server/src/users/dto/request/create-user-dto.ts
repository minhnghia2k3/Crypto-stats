import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateUserRequest {
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsStrongPassword(
    { minLength: 8, minUppercase: 1, minSymbols: 1 },
    { message: 'Password must at least 8 chars, 1 Uppercase, 1 Symbol. ' },
  )
  password: string;
}
