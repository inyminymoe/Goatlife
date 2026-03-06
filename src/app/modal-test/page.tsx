'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function ModalTestPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg'>('md');

  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px] space-y-6 p-8">
        <section className="bg-grey-100 rounded-[5px] px-[25px] py-8">
          <h1 className="brand-h2 text-grey-900 mb-6">
            Modal / BottomSheet 테스트
          </h1>

          <div className="space-y-4">
            {/* Modal 테스트 */}
            <div className="bg-white p-6 rounded-lg">
              <h2 className="brand-h3 text-grey-900 mb-4">Modal 테스트</h2>
              <p className="body-sm text-grey-500 mb-4">
                데스크탑에서 중앙 정렬 dialog로 표시됩니다.
              </p>

              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={() => {
                    setModalSize('sm');
                    setModalOpen(true);
                  }}
                >
                  Modal 열기 (Small)
                </Button>
                <Button
                  onClick={() => {
                    setModalSize('md');
                    setModalOpen(true);
                  }}
                >
                  Modal 열기 (Medium)
                </Button>
                <Button
                  onClick={() => {
                    setModalSize('lg');
                    setModalOpen(true);
                  }}
                >
                  Modal 열기 (Large)
                </Button>
              </div>
            </div>

            {/* BottomSheet 테스트 */}
            <div className="bg-white p-6 rounded-lg">
              <h2 className="brand-h3 text-grey-900 mb-4">
                BottomSheet 테스트
              </h2>
              <p className="body-sm text-grey-500 mb-4">
                하단에서 슬라이드 업 되며, backdrop 클릭이나 ESC 키로 닫을 수
                있습니다.
              </p>

              <Button onClick={() => setBottomSheetOpen(true)}>
                BottomSheet 열기
              </Button>
            </div>

            {/* 기능 설명 */}
            <div className="bg-white p-6 rounded-lg">
              <h2 className="brand-h3 text-grey-900 mb-4">구현된 기능</h2>
              <ul className="space-y-2 body-sm text-grey-700">
                <li>✅ ESC 키로 닫기</li>
                <li>✅ Backdrop 클릭으로 닫기</li>
                <li>✅ Focus Trap (Tab 키 순환)</li>
                <li>✅ Scroll Lock (body 스크롤 잠금)</li>
                <li>✅ 접근성 (role, aria 속성)</li>
                <li>✅ 애니메이션 (fade, scale, slide)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Modal 예시 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="업무 추가"
        description="새로운 업무를 추가합니다."
        size={modalSize}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setModalOpen(false)}>저장</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="업무명"
            placeholder="업무명을 입력하세요"
            value=""
            onChange={() => {}}
          />

          <Input
            label="설명"
            placeholder="설명을 입력하세요"
            value=""
            onChange={() => {}}
          />

          <Select
            label="우선순위"
            value="medium"
            onChange={() => {}}
            options={[
              { value: 'high', label: '높음' },
              { value: 'medium', label: '보통' },
              { value: 'low', label: '낮음' },
            ]}
          />

          <div className="pt-4">
            <p className="body-sm text-grey-500">
              이 폼은 예시입니다. Modal은 children으로 어떤 컴포넌트든 받을 수
              있습니다.
            </p>
          </div>
        </div>
      </Modal>

      {/* BottomSheet 예시 */}
      <BottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="포모도로 설정"
      >
        <div className="space-y-4">
          <Select
            label="집중 시간"
            value="25"
            onChange={() => {}}
            options={[
              { value: '15', label: '15분' },
              { value: '25', label: '25분' },
              { value: '45', label: '45분' },
              { value: '60', label: '60분' },
            ]}
          />

          <Select
            label="휴식 시간"
            value="5"
            onChange={() => {}}
            options={[
              { value: '5', label: '5분' },
              { value: '10', label: '10분' },
              { value: '15', label: '15분' },
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setBottomSheetOpen(false)}
            >
              취소
            </Button>
            <Button fullWidth onClick={() => setBottomSheetOpen(false)}>
              저장
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
