document.addEventListener('DOMContentLoaded', function () {
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

      var data = {
        formType: '포럼사전등록',
        name:     document.getElementById('f-name').value,
        org:      document.getElementById('f-org').value,
        rank:     document.getElementById('f-rank').value,
        tel:      document.getElementById('f-tel').value,
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
