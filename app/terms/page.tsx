export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관</h1>
      <p className="text-sm text-gray-500 mb-8">최종 수정일: 2026년 3월 23일</p>

      <section className="space-y-8 text-gray-700 text-sm leading-relaxed">

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제1조 (목적)</h2>
          <p>
            이 약관은 탈래말래(이하 "서비스")가 운영하는 이동 정보 공유 커뮤니티 서비스의 이용 조건 및 절차, 이용자와 운영자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제2조 (서비스의 성격 및 한계)</h2>
          <p className="mb-3">
            탈래말래는 <strong>이용자들이 자발적으로 이동 계획을 게시하고, 비슷한 방향으로 이동하려는 다른 이용자와 정보를 나누는 커뮤니티 플랫폼</strong>입니다. 다음 사항을 명확히 합니다.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>서비스는 <strong>운송 서비스를 제공하거나 중개하지 않습니다.</strong> 어떠한 택시·차량 운행에도 직접 관여하지 않습니다.</li>
            <li>서비스는 이용자 간 이동 정보(출발지, 도착지, 시간)를 공유할 수 있는 게시판 기능만을 제공합니다.</li>
            <li>이용자가 실제로 택시를 이용하는 행위는 이용자 본인이 직접 택시 사업자와 체결하는 별도의 계약이며, 서비스는 해당 계약의 당사자가 아닙니다.</li>
            <li>비용을 함께 부담하는 행위는 이용자 간의 자유로운 합의에 따른 것이며, 서비스는 이를 강제하거나 보증하지 않습니다.</li>
            <li>서비스는 이용자 간 금전 거래를 처리하거나 보관하지 않습니다. 계좌번호는 이용자가 자발적으로 등록하며, 송금은 이용자 간에 직접 이루어집니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제3조 (이용자의 의무)</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>이용자는 게시한 이동 계획에 대해 성실하게 이행하도록 노력해야 합니다.</li>
            <li>이용자는 다른 이용자에게 불쾌감을 주거나 위법한 행위를 해서는 안 됩니다.</li>
            <li>이용자는 허위 정보를 게시하거나 타인을 기망해서는 안 됩니다.</li>
            <li>이용자는 서비스를 상업적 목적으로 무단 이용해서는 안 됩니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제4조 (서비스의 면책)</h2>
          <p className="mb-3">서비스는 다음 각 호의 경우에 대하여 책임을 지지 않습니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>이용자 간 금전 분쟁, 약속 불이행, 노쇼 등 이용자 귀책사유로 인한 손해</li>
            <li>이용자가 탑승한 택시 이용 중 발생한 교통사고, 분실, 상해 등의 손해</li>
            <li>이용자 간 직접 이루어지는 계좌이체 관련 오류, 분쟁, 사기</li>
            <li>천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단</li>
            <li>이용자가 서비스에 게시한 정보의 정확성, 신뢰성에 관한 사항</li>
          </ul>
          <p className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
            ⚠️ 택시 이용 중 발생하는 사고에 대한 책임은 해당 택시 사업자 및 탑승 이용자에게 있습니다. 이용자는 택시 이용 전 택시 사업자의 보험 여부를 확인할 책임이 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제5조 (예약금 안내)</h2>
          <p>
            게시물 작성자(팟 방장)가 예약금을 설정한 경우, 이는 참여자 간 자율적 약속의 수단입니다. 서비스는 예약금을 보관하거나 보증하지 않습니다. 팟이 취소되는 경우 예약금 반환은 이용자 간에 직접 해결해야 하며, 방장이 이를 거부하는 경우 서비스 내 신고 기능을 통해 이용 제한 조치를 요청할 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제6조 (서비스 이용 제한)</h2>
          <p>다음 각 호에 해당하는 경우 서비스 이용이 제한될 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>타인에게 성희롱, 폭언 등 불쾌한 행위를 한 경우</li>
            <li>무단 불참(노쇼)을 반복하는 경우</li>
            <li>예약금 사기 등 금전적 기망 행위가 확인된 경우</li>
            <li>허위 신고를 반복하거나 서비스를 악의적으로 이용하는 경우</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제7조 (광고)</h2>
          <p>
            서비스는 운영 유지를 위해 제3자 광고(구글 애드센스, 카카오 애드핏 등)를 게재할 수 있습니다. 광고 내용은 서비스 운영자의 의견을 대표하지 않으며, 광고주와의 거래에서 발생하는 문제에 대해 서비스는 책임을 지지 않습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제8조 (약관의 변경)</h2>
          <p>
            서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 최소 7일 전에 고지합니다. 변경 후 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 봅니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">제9조 (준거법 및 관할)</h2>
          <p>
            이 약관의 해석 및 서비스와 관련한 분쟁은 대한민국 법률을 준거법으로 하며, 분쟁 발생 시 서울중앙지방법원을 제1심 관할 법원으로 합니다.
          </p>
        </div>

      </section>
    </div>
  );
}
