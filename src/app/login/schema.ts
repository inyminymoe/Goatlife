import { z } from 'zod';

export const loginSchema = z.object({
  userId: z
    .string()
    .min(3, '아이디는 3자 이상이어야 합니다')
    .max(20, '아이디는 20자 이하여야 합니다')
    .regex(
      /^[a-z0-9_-]+$/,
      '아이디는 영문 소문자, 숫자, 언더스코어(_), 하이픈(-)만 가능합니다'
    ),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});

export type LoginForm = z.infer<typeof loginSchema>;
