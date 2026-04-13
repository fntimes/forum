/**
 * 2026 한국금융미래포럼 — 사전등록 수집 Apps Script
 *
 * [배포 절차]
 *   1. 구글 시트 새로 생성 (이름: "2026 한국금융미래포럼 사전등록" 권장)
 *   2. 시트 상단 메뉴 → 확장 프로그램 → Apps Script
 *   3. 기본 Code.gs 내용을 지우고 이 파일 내용 전체를 붙여넣기
 *   4. 디스크 아이콘(저장) 클릭
 *   5. 상단 "배포" → "새 배포"
 *        - 유형: 웹 앱
 *        - 설명: v1 (원하는 버전명)
 *        - 다음 사용자 인증 정보로 실행: "나"
 *        - 액세스 권한이 있는 사용자: "모든 사용자"
 *   6. "배포" 클릭 → 최초 1회 Google 계정 권한 승인
 *   7. 발급되는 "웹 앱 URL" (끝이 /exec) 을 복사해 forum 프로젝트의
 *      js/main.js 상단 GAS_URL 변수에 붙여넣기
 *
 *   ※ 이후 코드 수정 시, "배포 관리" → 연필(편집) → 버전 "새 버전" → 배포
 *     반드시 재배포해야 변경 사항이 /exec 엔드포인트에 반영됨.
 *     기존 /exec URL 은 그대로 유지되므로 프론트엔드 수정 불필요.
 *
 * [알림 이메일(선택)]
 *   NOTIFY_EMAILS 에 담당자 이메일을 넣으면 등록 건마다 메일이 발송됨.
 *   빈 배열이면 메일 미발송.
 */

/* ========== 설정 ========== */
var SHEET_NAME    = '사전등록';
var NOTIFY_EMAILS = [];  // 예: ['forum@fntimes.com']
var NOTIFY_SUBJECT_PREFIX = '[2026 한국금융미래포럼] 사전등록';

var HEADERS = [
  '제출일시', '성명', '소속', '직급', '전화번호', '이메일', '사전질문'
];

/* ========== 엔드포인트 ========== */

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    if (p.formType !== '포럼사전등록') {
      return _json({ ok: false, error: 'invalid formType' });
    }

    // 최소 필수값 검증 (클라이언트 검증을 통과하지 못한 요청 차단)
    var required = ['name', 'org', 'rank', 'tel', 'email'];
    for (var i = 0; i < required.length; i++) {
      if (!p[required[i]] || String(p[required[i]]).trim() === '') {
        return _json({ ok: false, error: 'missing: ' + required[i] });
      }
    }

    var sheet = _getSheet();
    sheet.appendRow([
      new Date(),
      p.name     || '',
      p.org      || '',
      p.rank     || '',
      p.tel      || '',
      p.email    || '',
      p.question || ''
    ]);

    _sendNotification(p);

    return _json({ ok: true });
  } catch (err) {
    console.error(err);
    return _json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return _json({
    ok: true,
    service: '2026 한국금융미래포럼 사전등록',
    method: 'POST'
  });
}

/* ========== 내부 함수 ========== */

function _getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  // 헤더 없으면 삽입
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#00357a')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160); // 제출일시
    sh.setColumnWidth(7, 320); // 사전질문
  }
  return sh;
}

function _sendNotification(p) {
  if (!NOTIFY_EMAILS || NOTIFY_EMAILS.length === 0) return;
  try {
    var body = [
      '새 사전등록이 접수되었습니다.',
      '',
      '성명: ' + (p.name || ''),
      '소속: ' + (p.org || ''),
      '직급: ' + (p.rank || ''),
      '전화번호: ' + (p.tel || ''),
      '이메일: ' + (p.email || ''),
      '',
      '사전질문:',
      (p.question || '(없음)'),
      '',
      '— 2026 한국금융미래포럼 자동 알림'
    ].join('\n');

    MailApp.sendEmail({
      to: NOTIFY_EMAILS.join(','),
      subject: NOTIFY_SUBJECT_PREFIX + ' — ' + (p.name || '이름미상') + '/' + (p.org || ''),
      body: body
    });
  } catch (err) {
    console.error('notify failed:', err);
  }
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========== 테스트 유틸 ==========
 * Apps Script 에디터에서 _test 함수를 선택하고 실행하면
 * 샘플 데이터가 시트에 기록되고 알림 메일이 발송되는지 확인 가능.
 */
function _test() {
  var fakeEvent = {
    parameter: {
      formType: '포럼사전등록',
      name: '홍길동',
      org: '한국금융신문',
      rank: '기자',
      tel: '010-0000-0000',
      email: 'test@example.com',
      question: '[김병환] AI 금융 정책 방향은?',
      userAgent: 'test-runner'
    }
  };
  var res = doPost(fakeEvent);
  console.log(res.getContent());
}
