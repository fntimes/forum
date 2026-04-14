document.addEventListener('DOMContentLoaded', function () {
  // Hero background video — pick mobile or desktop source based on viewport
  document.querySelectorAll('.forum-hero-bg video[data-src-desktop]').forEach(function(v) {
    var mobile  = v.getAttribute('data-src-mobile');
    var desktop = v.getAttribute('data-src-desktop');
    var src = (window.matchMedia('(max-width: 720px)').matches && mobile) ? mobile : desktop;
    v.src = src;
    v.load();
    var playPromise = v.play();
    if (playPromise && playPromise.catch) playPromise.catch(function() { /* autoplay blocked — ignore */ });
  });

  // Sponsor list — insert middle dots between items on the same line
  var sponsorList = document.querySelector('.forum-hero-orgs .sponsor-list');
  if (sponsorList) {
    var updateDots = function() {
      var items = sponsorList.querySelectorAll(':scope > span');
      for (var i = 0; i < items.length; i++) {
        var curr = items[i];
        var next = items[i + 1];
        if (next && curr.offsetTop === next.offsetTop) {
          curr.classList.add('has-dot');
        } else {
          curr.classList.remove('has-dot');
        }
      }
    };
    updateDots();
    window.addEventListener('resize', updateDots);
    // Re-run after fonts load to catch width shifts
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateDots);
    }
  }

  // Sticky header — collapse to single row on scroll
  var header = document.querySelector('.forum-header');
  var onScroll = function() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Speaker profile modal
  var modal = document.getElementById('speaker-modal');
  if (modal) {
    var modalImg    = document.getElementById('speaker-modal-img');
    var modalBadge  = document.getElementById('speaker-modal-badge');
    var modalName   = document.getElementById('speaker-modal-title');
    var modalRole   = document.getElementById('speaker-modal-role');
    var modalBio    = document.getElementById('speaker-modal-bio');
    var modalIntro  = document.getElementById('speaker-modal-intro');

    var openModal = function(card) {
      var name  = card.getAttribute('data-name') || '';
      var role  = card.getAttribute('data-role') || '';
      var badge = card.getAttribute('data-badge') || '';
      var image = card.getAttribute('data-image') || '';
      var intro = card.getAttribute('data-intro') || '';
      var bio;
      try { bio = JSON.parse(card.getAttribute('data-bio') || '[]'); }
      catch (e) { bio = []; }

      modalImg.src = image;
      modalImg.alt = name;
      modalBadge.textContent = badge;
      modalName.textContent = name;
      modalRole.innerHTML = role;
      modalBio.innerHTML = bio.map(function(item) {
        var li = document.createElement('li');
        li.innerHTML = item;
        return li.outerHTML;
      }).join('');
      modalIntro.innerHTML = intro;
      modalIntro.style.display = intro ? '' : 'none';

      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('forum-modal-open');
    };

    var closeModal = function() {
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('forum-modal-open');
    };

    document.querySelectorAll('.forum-speaker-card').forEach(function(card) {
      card.addEventListener('click', function() { openModal(card); });
    });

    modal.querySelectorAll('[data-close]').forEach(function(el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
        closeModal();
      }
    });
  }

  // Registration form — Google Apps Script 연동 (iframe POST 방식)
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbzMEwBFLbDtrgdgx0CtyYqOiMrcxnmqhukYIS2Iaazr3Fy7Eo3KSjarmZ_jpWjsI6XP/exec';

  // 전화번호 자동 포매팅 — 휴대폰·서울(02)·타 지역·대표번호(15XX) 지원
  function formatPhone(raw) {
    var trailingHyphen = /-$/.test(raw || '');
    var d = (raw || '').replace(/\D/g, '');
    var out;
    // 대표번호 15XX/16XX/18XX/19XX (총 8자리)
    if (d.length >= 1 && d[0] === '1' && d[1] !== '0') {
      d = d.slice(0, 8);
      out = d.length <= 4 ? d : d.slice(0, 4) + '-' + d.slice(4);
    }
    // 서울(02): 최대 10자리
    else if (d.indexOf('02') === 0) {
      d = d.slice(0, 10);
      if (d.length <= 2) out = d;
      else if (d.length <= 5) out = d.slice(0, 2) + '-' + d.slice(2);
      else if (d.length <= 9) out = d.slice(0, 2) + '-' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
      else out = d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6);
    }
    // 기타(010, 031, 070 등): 최대 11자리
    else {
      d = d.slice(0, 11);
      if (d.length < 4) out = d;
      else if (d.length < 8) out = d.slice(0, 3) + '-' + d.slice(3);
      else if (d.length <= 10) out = d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
      else out = d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    }
    // 사용자가 방금 '-'를 입력한 경우 뒤에 유지 (다음 자릿수 입력을 위한 힌트)
    if (trailingHyphen && out && !/-$/.test(out)) out += '-';
    return out;
  }
  var telInput = document.getElementById('f-tel');
  if (telInput) {
    telInput.setAttribute('inputmode', 'tel');
    telInput.addEventListener('input', function() {
      var selBefore = this.selectionStart;
      var prev = this.value;
      var prevBefore = prev.slice(0, selBefore);
      var digitsBefore = prevBefore.replace(/\D/g, '').length;
      // 사용자가 방금 '-'를 입력했다면 커서를 하이픈 뒤로 보내야 함
      var justTypedHyphen = selBefore > 0 && prev[selBefore - 1] === '-';

      var formatted = formatPhone(prev);
      this.value = formatted;

      var totalDigits = formatted.replace(/\D/g, '').length;
      var newPos;
      if (justTypedHyphen && digitsBefore === totalDigits && /-$/.test(formatted)) {
        // 끝에 '-'가 유지된 경우 커서를 맨 뒤로
        newPos = formatted.length;
      } else {
        var count = 0;
        newPos = formatted.length;
        for (var i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) count++;
          if (count === digitsBefore) { newPos = i + 1; break; }
        }
        // 커서가 하이픈 바로 앞인데 사용자가 방금 하이픈을 쳤다면 하이픈 뒤로 건너뛰기
        if (justTypedHyphen && formatted[newPos] === '-') newPos++;
      }
      this.selectionStart = this.selectionEnd = newPos;
    });
    telInput.addEventListener('blur', function() {
      this.value = this.value.replace(/-+$/, '');
    });
  }

  var regForm = document.getElementById('registrationForm');
  if (regForm) {
    regForm.addEventListener('reset', function() {
      // reset 이벤트는 기본 reset 이후 폼 초기화가 끝난 다음 프레임에 스크롤
      requestAnimationFrame(function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    regForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var agree = document.getElementById('f-agree');
      if (!agree.checked) {
        alert('개인정보보호를 위한 이용자 동의사항에 동의해주세요.');
        agree.focus();
        return;
      }

      var checks = [
        { id: 'f-name',  msg: '성명을 입력해주세요.' },
        { id: 'f-org',   msg: '소속을 입력해주세요.' },
        { id: 'f-rank',  msg: '직급을 입력해주세요.' },
        { id: 'f-tel',   msg: '전화번호를 올바르게 입력해주세요.' },
        { id: 'f-email', msg: '이메일을 올바르게 입력해주세요.' }
      ];
      for (var i = 0; i < checks.length; i++) {
        var el = document.getElementById(checks[i].id);
        if (!el.value || !el.validity.valid) {
          alert(checks[i].msg);
          el.focus();
          return;
        }
      }

      var submitBtn = regForm.querySelector('.btn-submit');
      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span>제출 중...';

      var telRaw = document.getElementById('f-tel').value;
      var telDigits = telRaw.replace(/\D/g, '');
      if (telDigits.length < 8 || telDigits.length > 11) {
        alert('전화번호를 올바르게 입력해주세요.');
        document.getElementById('f-tel').focus();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
      }

      var data = {
        formType: '포럼사전등록',
        name:     document.getElementById('f-name').value,
        org:      document.getElementById('f-org').value,
        rank:     document.getElementById('f-rank').value,
        tel:      telDigits,
        email:    document.getElementById('f-email').value,
        question: document.getElementById('f-question').value,
        device:   /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ? '모바일' : 'PC'
      };

      var iframe = document.createElement('iframe');
      iframe.name = 'gas-iframe-registration';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      var hiddenForm = document.createElement('form');
      hiddenForm.method = 'POST';
      hiddenForm.action = GAS_URL;
      hiddenForm.target = iframe.name;

      Object.keys(data).forEach(function(key) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        hiddenForm.appendChild(input);
      });

      document.body.appendChild(hiddenForm);
      hiddenForm.submit();

      iframe.addEventListener('load', function() {
        alert('사전등록이 완료되었습니다.');
        regForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        document.body.removeChild(iframe);
        document.body.removeChild(hiddenForm);
      });
    });
  }
});
