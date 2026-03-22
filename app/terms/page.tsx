export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관</h1>
      <p className="text-sm text-gray-500 mb-8">최종 수정일: 2026년 3월 22일</p>

      <section className="space-y-8 text-gray-700 text-sm leading-relaxed">

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제1조 (목적)</h2>
          <p>이 약관은 탈래말래(이하 "서비스")가 제공하는 택시 합승 중개 서비스의 이용에 관한 조건 및 절차, 이용자와 운영자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제2조 (서비스의 성격)</h2>
          <p>탈래말래는 이용자 간의 택시 합승 정보를 교환할 수 있는 중개 플랫폼입니다. 서비스는 택시 운송사업을 직접 영위하지 않으며, 이용자 간의 합승 계약의 당사자가 아닙니다. 실제 택시 이용은 이용자가 직접 택시 사업자와 계약하여 이루어지며, 서비스는 합승 파트너를 연결하는 역할만을 합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제3조 (이용자의 의무)</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>이용자는 약속된 시간과 장소에 성실히 나타나야 합니다.</li>
            <li>이용자는 다른 이용자에게 불쾌감을 주거나 위법한 행위를 해서는 안 됩니다.</li>
            <li>이용자는 허위 정보를 입력하거나 타인을 기망해서는 안 됩니다.</li>
            <li>예약금이 있는 팟에서 송금 확인 전 임의로 합승을 강행해서는 안 됩니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제4조 (책임의 한계)</h2>
          <p>서비스는 이용자 간의 금전 분쟁, 약속 불이행, 택시 이용 중 사고에 대하여 직접적인 법적 책임을 지지 않습니다. 예약금 환불, 정산 등은 이용자 간에 직접 해결해야 합니다. 다만, 서비스는 분쟁 해결을 위한 신고 접수 및 중재 지원을 제공합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제5조 (팟 취소 및 예약금)</h2>
          <p>방장이 팟을 취소할 경우, 예약금을 수령한 방장은 신청자에게 예약금을 즉시 반환할 의무가 있습니다. 방장이 이를 이행하지 않을 경우, 해당 방장은 서비스 이용이 제한될 수 있습니다. 예약금은 서비스가 보관하거나 에스크로하지 않습니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제6조 (서비스 이용 제한)</h2>
          <p>다음 각 호에 해당하는 경우 서비스 이용이 제한될 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>타인에게 성희롱, 폭언 등 불쾌한 행위를 한 경우</li>
            <li>노쇼(무단 불참)를 반복하는 경우</li>
            <li>사기 행위가 확인된 경우</li>
            <li>허위 신고를 반복하는 경우</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제7조 (면책 조항)</h2>
          <p>서비스는 천재지변, 불가항력, 이용자의 귀책사유로 인한 손해에 대해 책임을 지지 않습니다. 이용자 간 택시 이용 중 발생하는 사고에 대해서는 택시 사업자 및 해당 이용자가 책임을 부담합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제8조 (약관의 변경)</h2>
          <p>서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 고지합니다.</p>
        </div>

      </section>
    </div>
  );
}
