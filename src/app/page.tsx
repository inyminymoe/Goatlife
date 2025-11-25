export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import UserInfoCard from '@/components/home/UserInfoCard';
import ExecMessageCard from '@/components/home/ExecMessageCard';
import PerformanceWidget from '@/components/home/PerformanceWidget';
import { BoardWidget } from '@/components/features/home/BoardWidget';
import { AnnouncementsWidget } from '@/components/features/home/AnnouncementsWidget';
import { CommunityWidget } from '@/components/features/home/CommunityWidget';
import { TodayRankSection } from '@/components/features/home/TodayRankSection';
import {
  getMemberAllBoards,
  getGuestAnnouncements,
  getGuestCommunity,
} from './_actions/homeBoard';
import { createServerSupabase } from '@/lib/supabase/server';

const AttendanceCard = dynamicImport(
  () => import('@/components/home/AttendanceCard'),
  {
    loading: () => (
      <section className="bg-grey-100 rounded-[5px] p-6 animate-pulse">
        <div className="flex items-end gap-1 mb-4">
          <div className="w-6 h-6 bg-grey-300 rounded"></div>
          <div className="h-6 w-24 bg-grey-300 rounded"></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="h-20 bg-grey-200 rounded"></div>
          <div className="h-20 bg-grey-200 rounded"></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="h-10 bg-grey-300 rounded"></div>
          <div className="h-10 bg-grey-300 rounded"></div>
        </div>
      </section>
    ),
  }
);

export default async function Home() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMember = Boolean(user);

  const [memberPosts, guestAnnouncements, guestCommunity] = await Promise.all([
    isMember ? getMemberAllBoards(6) : Promise.resolve([]),
    !isMember ? getGuestAnnouncements(6) : Promise.resolve([]),
    !isMember ? getGuestCommunity(6) : Promise.resolve([]),
  ]);

  return (
    <>
      {isMember ? (
        <>
          {/* 1row: 근태관리 + 사원정보 */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <AttendanceCard />
            <UserInfoCard />
          </div>

          {/* 2row: 게시판 + 성과현황 */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <BoardWidget posts={memberPosts} />
            <PerformanceWidget mode="card" />
          </div>

          {/* 3row: 임원진 한마디 + Today 갓생이 */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ExecMessageCard />
            <TodayRankSection />
          </div>
        </>
      ) : (
        <>
          {/* 1. 배너: 전체 폭 */}
          <section className="md:col-span-3 gl-bg-banner rounded-[5px] p-8 md:p-12 md:min-h-[176px] relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="brand-h2 text-grey-900 mb-4 leading-loose">
                나의 업무 유형 테스트하고
                <br />
                갓생상사 입사지원 하러가기
              </h2>
              <Button variant="primary" size="md">
                지금.당장.롸잇나우.검사GO🍀
              </Button>
            </div>

            <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2">
              <Image
                src="/images/speechBubble.svg"
                alt="말풍선"
                width={263}
                height={137}
                className="w-64 h-auto"
              />
            </div>
          </section>

          {/* 2. 공지사항 + 커뮤니티: 2열 */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnnouncementsWidget posts={guestAnnouncements} />
            <CommunityWidget posts={guestCommunity} />
          </div>

          {/* 3. 임원진 한마디 + Today 갓생이: 2열 */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ExecMessageCard />
            <TodayRankSection />
          </div>
        </>
      )}
    </>
  );
}
