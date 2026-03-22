export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-500 mb-8">최종 수정일: 2026년 3월 22일</p>

      <section className="space-y-8 text-gray-700 text-sm leading-relaxed">

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. 수집하는 개인정보</h2>
          <p>탈래말래는 서비스 제공을 위해 다음 개인정보를 수집합니다.</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>필수 항목:</strong> 카카오 계정 닉네임, 프로필 사진, 이메일 주소</li>
            <li><strong>선택 항목:</strong> 성별, 계좌번호 (송금 안내 목적으로 사용자가 직접 입력)</li>
            <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 IP, 기기 정보</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. 개인정보의 이용 목적</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>택시 합승 팟 생성 및 참여 서비스 제공</li>
            <li>푸시 알림 발송 (팟 참여, 댓글, 승인/거절 알림)</li>
            <li>매너온도 산정 및 신뢰도 시스템 운영</li>
            <li>계좌번호: 팟 멤버 간 택시비 송금 안내 (이용자가 자발적으로 제공)</li>
            <li>부정 이용 방지 및 서비스 개선</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. 계좌번호 정보 처리</h2>
          <p>이용자가 입력한 계좌번호는 팟 멤버들이 택시비를 송금할 수 있도록 해당 팟 내에서만 공개됩니다. 계좌번호는 이용자가 자발적으로 제공하는 정보이며, 서비스는 이를 결제 처리에 사용하지 않습니다. 이용자는 마이페이지에서 언제든지 계좌번호를 수정하거나 삭제할 수 있습니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. 개인정보의 보유 및 이용 기간</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>회원 탈퇴 시 개인정보는 즉시 삭제됩니다.</li>
            <li>단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</li>
            <li>전자상거래 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. 개인정보의 제3자 제공</h2>
          <p>서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 다음의 경우 예외적으로 제공할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 따라 수사 목적으로 수사기관의 요구가 있는 경우</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. 수탁 업체</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Supabase Inc.</strong>: 데이터베이스 및 인증 서비스 운영</li>
            <li><strong>카카오(Kakao Corp.)</strong>: 소셜 로그인 인증</li>
            <li><strong>네이버(NAVER Corp.)</strong>: 지도 및 경로 탐색 API</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. 이용자의 권리</h2>
          <p>이용자는 언제든지 수집된 개인정보를 조회, 수정하거나 동의를 철회(탈퇴)할 수 있습니다. 마이페이지에서 계정 정보를 확인하거나, 아래 연락처로 요청하실 수 있습니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. 개인정보 보호책임자</h2>
          <p>개인정보 처리에 관한 문의사항은 아래로 연락해 주세요.</p>
          <p className="mt-2 bg-gray-50 rounded-xl p-4">
            서비스명: 탈래말래<br />
            문의: 앱 내 댓글 또는 GitHub Issues를 통해 제보 가능
          </p>
        </div>

      </section>
    </div>
  );
}
