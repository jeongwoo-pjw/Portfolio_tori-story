(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 고정 크롬: 현재 섹션 · 페이지 · 진행 바
  const $idx = document.querySelector('.chrome__idx');
  const $title = document.querySelector('.chrome__title');
  const $section = document.querySelector('.chrome__section');
  const $toTop = document.querySelector('.to-top');
  const $cur = document.querySelector('.chrome__cur');
  const $bar = document.querySelector('.chrome__bar');
  document.querySelector('.chrome__total').textContent = pad(total);

  // 하단 각주 메뉴: 번호 없이 주요 페이지만. 디자인1~4는 '디자인' 하나로 묶고, 마무리·끝은 제외
  const $menu = document.querySelector('.chrome__menu');
  const EXCLUDE = ['마무리', '끝'];
  const menuLinks = [];     // [a 요소]
  const menuOf = [];        // 슬라이드 index → 메뉴 a (현재 위치 표시용)
  let designLink = null;
  slides.forEach((slide, i) => {
    const title = slide.dataset.title;
    if (!title || EXCLUDE.includes(title)) return;
    if (/^디자인\s?[①-④\d]$/.test(title)) {
      if (designLink) { menuOf[i] = designLink; return; }
    }
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${slide.id}`;
    a.textContent = /^디자인\s?[①-④\d]$/.test(title) ? '디자인' : title;
    a.addEventListener('click', (e) => { e.preventDefault(); slide.scrollIntoView({ behavior: 'smooth' }); a.blur(); });
    li.appendChild(a);
    $menu.appendChild(li);
    menuLinks.push(a);
    menuOf[i] = a;
    if (a.textContent === '디자인') designLink = a;
  });

  let current = 0;
  const setActive = (i) => {
    current = i;
    const s = slides[i];
    $idx.textContent = s.dataset.idx || pad(i);
    $title.textContent = s.dataset.title || '';
    // 표지에서는 섹션 각주를 숨김
    $section.style.visibility = s.classList.contains('slide--hero') ? 'hidden' : '';
    $toTop.classList.toggle('is-visible', i > 0);
    menuLinks.forEach((a) => (a === menuOf[i] ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    $cur.textContent = pad(i + 1);
    $bar.style.width = `${((i + 1) / total) * 100}%`;
    document.body.classList.toggle('on-dark', s.classList.contains('is-dark'));
  };
  // 화면 중앙선에 걸친 섹션을 현재 섹션으로 (한 화면보다 긴 섹션 대응)
  const activeIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(slides.indexOf(e.target))),
    { rootMargin: '-50% 0px -50% 0px' }
  );
  slides.forEach((s) => activeIO.observe(s));
  setActive(0);

  // 키보드로 슬라이드 넘기기 — 긴 섹션은 끝까지 읽은 뒤 다음으로
  const go = (i) => slides[Math.max(0, Math.min(total - 1, i))].scrollIntoView({ behavior: 'smooth' });
  const step = (dir) => {
    const r = slides[current].getBoundingClientRect();
    const vh = window.innerHeight;
    if (dir > 0 && r.bottom > vh + 2) window.scrollBy({ top: Math.min(vh * 0.85, r.bottom - vh), behavior: 'smooth' });
    else if (dir < 0 && r.top < -2) window.scrollBy({ top: Math.max(-vh * 0.85, r.top), behavior: 'smooth' });
    else go(current + dir);
  };
  $toTop.addEventListener('click', () => go(0));
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
  });

  // 히어로: 최초 진입 시 텍스트가 순차적으로 약하게 등장
  const hero = document.querySelector('.slide--hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));

  // 히어로 아치: 세로는 아이브로우 상단 ~ 프로젝트 메타 하단과 동일,
  // 우측 여백은 텍스트 좌측 여백과 동일하게 맞춰 좌우 균형 유지
  const frame = hero.querySelector('.hero__frame');
  const heroText = hero.querySelector('.hero__text');
  const heroMeta = hero.querySelector('.hero__meta');
  const placeFrame = () => {
    if (getComputedStyle(frame).display === 'none') return;
    // 등장 애니메이션(transform) 영향을 받지 않도록 레이아웃 좌표(offsetTop)로 측정
    const wrap = heroText.offsetParent;
    const wrapTop = wrap.offsetTop;
    const H = hero.offsetHeight;
    const Hi = Math.max(H, hero.offsetWidth / 2);
    const top = wrapTop + heroText.offsetTop;
    const bottom = wrapTop + heroMeta.offsetTop + heroMeta.offsetHeight;
    const height = bottom - top;
    const width = Math.min(Hi * 0.62, height * 0.92);
    const right = wrap.offsetLeft;
    Object.assign(frame.style, {
      bottom: `${H - bottom}px`, height: `${height}px`, width: `${width}px`, right: `${right}px`,
    });
  };
  placeFrame();
  window.addEventListener('resize', placeFrame);
  if (document.fonts) document.fonts.ready.then(placeFrame);

  // 이미지 레이어: 섹션 위치에 따른 아주 미세한 parallax (transform과 분리된 translate 사용)
  const layers = [...document.querySelectorAll('[data-depth]')].map((el) => ({
    el, depth: parseFloat(el.dataset.depth), section: el.closest('.slide'),
  }));
  let ticking = false;
  const parallax = () => {
    ticking = false;
    const vh = window.innerHeight;
    layers.forEach(({ el, depth, section }) => {
      if (reduceMotion.matches) { el.style.translate = ''; return; }
      const top = section.getBoundingClientRect().top;
      if (top > vh || top < -section.offsetHeight) return;
      el.style.translate = `0 ${(-top * depth).toFixed(1)}px`;
    });
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });

  // 등장 효과: 슬라이드 제목 → 본문 / Overview는 요소별(.rv) 순차 등장
  const targets = [];
  document.querySelectorAll('.head, .end').forEach((el) => targets.push(el));
  document.querySelectorAll('.body').forEach((el) => { el.classList.add('d1'); targets.push(el); });
  targets.forEach((el) => el.classList.add('reveal'));
  document.querySelectorAll('.rv').forEach((el) => targets.push(el));
  const revealIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  targets.forEach((el) => revealIO.observe(el));
})();
