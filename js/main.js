document.addEventListener('DOMContentLoaded', function () {
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

    var openModal = function(card) {
      var name  = card.getAttribute('data-name') || '';
      var role  = card.getAttribute('data-role') || '';
      var badge = card.getAttribute('data-badge') || '';
      var image = card.getAttribute('data-image') || '';
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
});
