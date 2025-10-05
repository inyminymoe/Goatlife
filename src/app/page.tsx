import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import ExternalLinkButton from '@/components/ui/ExternalLinkButton';
import { useState } from 'react';

export default function Home() {
  return (
    <>
      {' '}
      {/* 추후 각 section 컴포넌트로 교체 */}
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">근태관리</h2>
        <p className="body-base text-grey-700">테스트 섹션 1</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="primary" fullWidth className="px-6 py-3">
            출근하기
          </Button>
          <Button variant="secondary" fullWidth className="px-6 py-3">
            퇴근하기
          </Button>
        </div>
        <Button variant="outline">북마크</Button>
        <ExternalLinkButton
          url="https://discord.gg/xyz123"
          platform="discord"
        />
      </section>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">사원정보</h2>
        <p className="body-base text-grey-700">테스트 섹션 2</p>
      </section>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">게시판</h2>
        <p className="body-base text-grey-700">테스트 섹션 3</p>
      </section>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">성과현황</h2>
        <p className="body-base text-grey-700">테스트 섹션 4</p>
      </section>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[202px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">임원진 한마디</h2>
        <p className="body-base text-grey-700">테스트 섹션 5</p>
      </section>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[202px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">Today 갓생이</h2>
        <p className="body-base text-grey-700">테스트 섹션 6</p>
      </section>
    </>
  );
}
