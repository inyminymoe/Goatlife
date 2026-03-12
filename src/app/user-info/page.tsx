import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileEditForm from '@/components/features/auth/ProfileEditForm';
import type { ProfileEditFormValues } from './schema';

export default async function UserInfoPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'last_name, first_name, avatar_url, department, rank, user_id, work_hours, work_type, work_style, work_ethic, email'
    )
    .eq('id', user.id)
    .maybeSingle();

  const defaultValues: ProfileEditFormValues = {
    lastName: profile?.last_name ?? '',
    firstName: profile?.first_name ?? '',
    avatarUrl: profile?.avatar_url ?? '',
    department:
      (profile?.department as ProfileEditFormValues['department']) ?? 'IT부',
    workHours:
      (profile?.work_hours as ProfileEditFormValues['workHours']) ??
      '주간(09:00-18:00)',
    workType:
      (profile?.work_type as ProfileEditFormValues['workType']) ?? '풀타임',
    workStyle: profile?.work_style ?? '',
    workEthic: profile?.work_ethic ?? '',
  };

  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px]">
        <ProfileEditForm
          defaultValues={defaultValues}
          userId={profile?.user_id ?? user.email?.split('@')[0] ?? ''}
          email={profile?.email ?? user.email ?? ''}
          rank={profile?.rank ?? '인턴'}
        />
      </div>
    </div>
  );
}
