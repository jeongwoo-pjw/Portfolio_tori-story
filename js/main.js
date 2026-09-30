(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');

  // 하단 로고 + 페이지 번호 (표지 · 엔딩 제외)
  slides.forEach((slide, i) => {
    if (slide.matches('.slide--hero, .slide--end')) return;
    const foot = document.createElement('footer');
    foot.className = 'slide__foot';
    foot.innerHTML =
      '<span class="brand"><span class="logo logo--sm"><svg viewBox="0 0 24 24"><use href="#i-book"/></svg></span>토리동화</span>' +
      `<span class="page">${pad(i + 1)} / ${pad(total)}</span>`;
    slide.appendChild(foot);
  });

  // 우측 도트 내비게이션
  const dots = document.querySelector('.dots');
  slides.forEach((slide, i) => {
    const a = document.createElement('a');
    a.href = `#${slide.id}`;
    a.title = `${pad(i + 1)} ${slide.dataset.title || ''}`;
    a.setAttribute('aria-label', a.title);
    dots.appendChild(a);
  });
  const dotLinks = [...dots.children];

  // 현재 슬라이드 추적
  let current = 0;
  const bar = document.querySelector('.progress__bar');
  const setActive = (i) => {
    current = i;
    dotLinks.forEach((d, j) => d.classList.toggle('is-active', j === i));
    bar.style.width = `${((i + 1) / total) * 100}%`;
  };
  const activeIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(slides.indexOf(e.target))),
    { threshold: 0.55 }
  );
  slides.forEach((s) => activeIO.observe(s));
  setActive(0);

  // 키보드로 슬라이드 넘기기
  const go = (i) => slides[Math.max(0, Math.min(total - 1, i))].scrollIntoView({ behavior: 'smooth' });
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(current + 1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
  });

  // 등장 효과
  const targets = document.querySelectorAll('.slide__head, .slide__body, .hero__content, .end');
  targets.forEach((el) => el.classList.add('reveal'));
  const revealIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    }),
    { threshold: 0.15 }
  );
  targets.forEach((el) => revealIO.observe(el));
})();
