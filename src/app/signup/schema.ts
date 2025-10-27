// src/app/signup/schema.ts
import { z } from 'zod';

export const signupSchema = z.object({
  lastName: z
    .string()
    .min(1, '성을 입력하세요')
    .max(5, '성은 5자 이하여야 합니다'),
  firstName: z.string().max(5, '이름은 5자 이하여야 합니다').optional(),
  userId: z
    .string()
    .min(4, '아이디는 4자 이상이어야 합니다')
    .max(20, '아이디는 20자 이하여야 합니다')
    .regex(
      /^[a-z0-9_-]+$/,
      '영문 소문자, 숫자, 언더스코어(_), 하이픈(-)만 가능'
    ),
  email: z
    .string()
    .min(1, '이메일을 입력하세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  department: z.enum([
    'IT부',
    '공시부',
    '취업부',
    '자격부',
    '창작부',
    '글로벌부',
  ]),
  workHours: z.enum([
    '주간(09:00-18:00)',
    '오후(17:00-01:00)',
    '야간(22:00-06:00)',
  ]),
  workType: z.enum(['풀타임', '파트타임']),
  workStyle: z.string().optional(),
  workEthic: z.string().max(100, '100자 이내로 입력하세요').optional(),
  avatarUrl: z.string().optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;
