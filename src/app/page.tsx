'use client';
import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { userAtom } from '@/store/atoms';
import UserInfoCard from '@/components/home/UserInfoCard';
import ExecMessageCard from '@/components/home/ExecMessageCard';
import PerformanceWidget from '@/components/home/PerformanceWidget';
import { TodayRankWidget } from '@/components/home/TodayRankWidget';
import { useTodayRanks } from '@/hooks/useTodayRanks';

const AttendanceCard = dynamic(
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

export default function Home() {
  const user = useAtomValue(userAtom);
  const isMember = Boolean(user);
  const {
    ranks: todayRanks,
    isLoading: isTodayRanksLoading,
    isError: isTodayRanksError,
  } = useTodayRanks();

  return (
    <>
      {isMember ? (
        <>
          <AttendanceCard />
          <UserInfoCard />

          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:message-emoji"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">게시판</h2>
            </div>
            <p className="body-base text-grey-700">최신 글</p>
          </section>

          <PerformanceWidget mode="card" />
        </>
      ) : (
        <>
          <section className="md:col-span-2 gl-bg-banner rounded-[5px] p-8 md:p-12 md:min-h-[176px] relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="brand-h2 text-grey-900 mb-4 leading-loose">
                나의 업무 유형 테스트하고
                <br />
                갓생상사 입사지원 하러가기
              </h2>
              <Button
                variant="primary"
                onClick={() =>
                  alert('심리테스트 페이지 준비 중! 아이 이거 언제하냐..')
                }
                size="md"
              >
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

          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:message-emoji"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">공지사항</h2>
            </div>
            <p className="body-base text-grey-700">최신 공지사항 불러오기...</p>
          </section>

          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:message-emoji"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">커뮤니티</h2>
            </div>
            <p className="body-base text-grey-700">
              전사게시판 최신글 불러오기...
            </p>
          </section>
        </>
      )}

      <ExecMessageCard />

      <TodayRankWidget
        ranks={todayRanks}
        isLoading={isTodayRanksLoading}
        isError={isTodayRanksError}
      />
    </>
  );
}
