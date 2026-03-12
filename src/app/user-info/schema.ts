import { z } from 'zod';

export const profileEditSchema = z.object({
  lastName: z
    .string()
    .min(1, '성을 입력하세요')
    .max(5, '성은 5자 이하여야 합니다'),
  firstName: z.string().max(5, '이름은 5자 이하여야 합니다').optional(),
  avatarUrl: z
    .union([
      z.literal(''),
      z
        .string()
        .url('올바른 이미지 URL을 입력하세요')
        .refine(v => /^https?:\/\//.test(v), 'http(s) URL만 허용합니다'),
    ])
    .optional(),
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
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
