export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-500 mb-8">최종 수정일: 2026년 3월 29일</p>

      <section className="space-y-8 text-gray-700 text-sm leading-relaxed">

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. 개인정보처리방침의 목적</h2>
          <p>탈래말래(이하 &quot;서비스&quot;)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. 수집하는 개인정보 항목 및 수집 방법</h2>
          <p className="mb-2">서비스는 회원가입 및 서비스 이용을 위해 아래의 개인정보를 수집합니다.</p>
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold border-b">구분</th>
                <th className="px-3 py-2 text-left font-bold border-b">수집 항목</th>
                <th className="px-3 py-2 text-left font-bold border-b">수집 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b font-medium">필수</td>
                <td className="px-3 py-2 border-b">카카오 계정 식별자(ID), 닉네임, 프로필 사진 URL</td>
                <td className="px-3 py-2 border-b">카카오 OAuth 로그인 시 자동 수집</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b font-medium">필수</td>
                <td className="px-3 py-2 border-b">성별</td>
                <td className="px-3 py-2 border-b">최초 로그인 시 이용자 직접 선택</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b font-medium">선택</td>
                <td className="px-3 py-2 border-b">계좌번호 (은행명 포함)</td>
                <td className="px-3 py-2 border-b">이용자가 마이페이지에서 직접 입력</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b font-medium">자동</td>
                <td className="px-3 py-2 border-b">IP 주소, 기기 정보, 서비스 이용 기록</td>
                <td className="px-3 py-2 border-b">서비스 이용 중 자동 수집</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">위치정보</td>
                <td className="px-3 py-2">출발지·도착지 좌표 (위도, 경도)</td>
                <td className="px-3 py-2">팟 생성 시 이용자가 직접 입력/검색</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. 개인정보의 처리 목적</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>회원 관리:</strong> 카카오 소셜 로그인을 통한 본인 확인, 회원 식별, 서비스 이용 자격 관리</li>
            <li><strong>서비스 제공:</strong> 택시 합승 팟 생성·참여·매칭, 이동 경로 안내</li>
            <li><strong>안전 기능:</strong> 성별 필터링, 매너온도 산정, 신고·제재 시스템 운영</li>
            <li><strong>알림 발송:</strong> 팟 참여 요청, 승인/거절, 댓글, 출발 알림 등 서비스 관련 푸시 알림</li>
            <li><strong>비용 정산 안내:</strong> 이용자가 자발적으로 입력한 계좌번호를 팟 멤버 간 표시 (직접 송금 안내 목적)</li>
            <li><strong>부정 이용 방지:</strong> 악성 이용자 차단, 스팸 방지, 분쟁 조정</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. 개인정보의 보유 및 이용 기간</h2>
          <p className="mb-2">원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>회원 탈퇴 시:</strong> 개인정보 즉시 삭제 (카카오 계정 연동 해제 포함)</li>
            <li><strong>관련 법령에 따른 보관:</strong></li>
          </ul>
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold border-b">보존 항목</th>
                <th className="px-3 py-2 text-left font-bold border-b">근거 법령</th>
                <th className="px-3 py-2 text-left font-bold border-b">보존 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b">서비스 이용 기록, 접속 로그</td>
                <td className="px-3 py-2 border-b">통신비밀보호법</td>
                <td className="px-3 py-2 border-b">3개월</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b">표시·광고에 관한 기록</td>
                <td className="px-3 py-2 border-b">전자상거래법</td>
                <td className="px-3 py-2 border-b">6개월</td>
              </tr>
              <tr>
                <td className="px-3 py-2">계약 또는 청약철회 등에 관한 기록</td>
                <td className="px-3 py-2">전자상거래법</td>
                <td className="px-3 py-2">5년</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. 개인정보의 제3자 제공</h2>
          <p className="mb-2">서비스는 이용자의 개인정보를 「3. 개인정보의 처리 목적」에서 명시한 범위 내에서만 처리하며, 원칙적으로 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. 개인정보 처리 위탁</h2>
          <p className="mb-2">서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold border-b">수탁 업체</th>
                <th className="px-3 py-2 text-left font-bold border-b">위탁 업무</th>
                <th className="px-3 py-2 text-left font-bold border-b">서버 위치</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b">Supabase Inc.</td>
                <td className="px-3 py-2 border-b">데이터베이스 저장 및 인증 서비스</td>
                <td className="px-3 py-2 border-b">해외 (AWS)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b">카카오(Kakao Corp.)</td>
                <td className="px-3 py-2 border-b">소셜 로그인 인증</td>
                <td className="px-3 py-2 border-b">국내</td>
              </tr>
              <tr>
                <td className="px-3 py-2">네이버(NAVER Corp.)</td>
                <td className="px-3 py-2">지도 검색 및 경로 탐색 API</td>
                <td className="px-3 py-2">국내</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">※ Supabase Inc.의 서버가 해외에 위치하여, 개인정보가 국외로 이전됩니다. 이용자의 회원가입 시 이에 대한 동의를 받고 있습니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. 위치정보의 수집·이용</h2>
          <p className="mb-2">서비스는 팟 생성 시 이용자가 입력한 출발지·도착지의 좌표(위도, 경도)를 수집합니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>수집 목적:</strong> 이동 경로 표시, 택시 요금 추정, 유사 경로 매칭</li>
            <li><strong>보유 기간:</strong> 팟 완료 후 3개월 보관 후 파기</li>
            <li><strong>동의 철회:</strong> 위치정보 수집에 동의하지 않을 경우 팟 생성 기능이 제한됩니다. 동의 철회는 회원 탈퇴를 통해 가능합니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. 정보주체의 권리·의무 및 행사 방법</h2>
          <p className="mb-2">이용자(정보주체)는 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>열람 요구:</strong> 수집된 개인정보의 열람 (마이페이지에서 확인 가능)</li>
            <li><strong>정정·삭제 요구:</strong> 잘못된 정보의 정정 또는 삭제 (계좌번호 등 마이페이지에서 직접 수정)</li>
            <li><strong>처리정지 요구:</strong> 개인정보 처리 중지 요청</li>
            <li><strong>동의 철회:</strong> 회원 탈퇴를 통한 전체 동의 철회 (마이페이지 → 회원탈퇴)</li>
          </ul>
          <p className="mt-2">위 권리 행사는 서비스 내 마이페이지 또는 아래 연락처를 통해 가능하며, 서비스는 지체 없이 조치하겠습니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">9. 만 14세 미만 아동의 개인정보</h2>
          <p>서비스는 만 14세 미만 아동의 회원가입을 제한하고 있습니다. 만 14세 미만의 아동이 서비스를 이용하려는 경우 법정대리인의 동의가 필요하며, 법정대리인 동의 없이 수집된 아동의 개인정보는 확인 즉시 삭제합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">10. 개인정보의 안전성 확보 조치</h2>
          <p className="mb-2">서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>데이터 전송 시 SSL/TLS 암호화 적용</li>
            <li>비밀번호 등 인증 정보의 단방향 암호화 저장 (Supabase Auth)</li>
            <li>API 요청 속도 제한(Rate Limiting)을 통한 비정상 접근 차단</li>
            <li>Row Level Security(RLS) 정책을 통한 데이터 접근 통제</li>
            <li>관리자 권한 분리 및 접근 로그 기록</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">11. 개인정보 보호책임자</h2>
          <p className="mb-2">서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p><strong>서비스명:</strong> 탈래말래</p>
            <p><strong>개인정보 보호책임자:</strong> 서비스 운영자</p>
            <p><strong>문의 이메일:</strong> gocks77777@naver.com</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">12. 권익침해 구제 방법</h2>
          <p className="mb-2">개인정보 침해에 대한 피해구제, 상담 등이 필요하신 경우 아래 기관에 문의하실 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>개인정보침해 신고센터: (국번없이) 118 / privacy.kisa.or.kr</li>
            <li>개인정보 분쟁조정위원회: 1833-6972 / kopico.go.kr</li>
            <li>대검찰청 사이버수사과: (국번없이) 1301 / spo.go.kr</li>
            <li>경찰청 사이버안전국: (국번없이) 182 / cyberbureau.police.go.kr</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">13. 개인정보처리방침의 변경</h2>
          <p>이 개인정보처리방침은 2026년 3월 29일부터 적용됩니다. 변경 사항이 있을 경우 시행일 최소 7일 전에 서비스 내 공지를 통해 알려드리겠습니다.</p>
        </div>

      </section>
    </div>
  );
}
