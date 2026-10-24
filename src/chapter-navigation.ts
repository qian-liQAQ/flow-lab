const chapters = [
  { id: 1, title: '容量与流量', group: '基础概念' },
  { id: 2, title: '流量守恒', group: '基础概念' },
  { id: 3, title: '合法流判断', group: '基础概念' },
  { id: 4, title: '贪心的陷阱', group: '增广与残量' },
  { id: 5, title: '反向残量边', group: '增广与残量' },
  { id: 6, title: '单边残量实验', group: '增广与残量' },
  { id: 7, title: '完整残量网络', group: '增广与残量' },
  { id: 8, title: 'Ford–Fulkerson', group: '最大流算法' },
  { id: 9, title: 'Edmonds–Karp', group: '最大流算法' },
  { id: 10, title: '理解分层图', group: 'Dinic' },
  { id: 11, title: '阻塞流实验', group: 'Dinic' },
  { id: 12, title: '自己实现 Dinic', group: 'Dinic' },
];

export function initChapterNavigation(app: HTMLDivElement, navigate: (chapter: number) => void) {
  const nav = document.createElement('aside');
  nav.className = 'chapter-sidebar';
  nav.id = 'chapter-sidebar';
  nav.setAttribute('aria-label', '课程章节目录');
  const toggle = document.createElement('button');
  toggle.className = 'chapter-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', 'chapter-sidebar');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = '☰ 章节目录';
  const backdrop = document.createElement('button');
  backdrop.className = 'chapter-backdrop';
  backdrop.type = 'button';
  backdrop.setAttribute('aria-label', '关闭章节目录');

  const logo = document.createElement('button');
  logo.type = 'button';
  logo.className = 'chapter-logo';
  logo.textContent = 'Flow Lab';
  logo.addEventListener('click', () => { close(); navigate(0); });
  nav.append(logo);
  const description = document.createElement('p');
  description.className = 'chapter-caption';
  description.textContent = '交互式网络流课程 · 12 节';
  nav.append(description);

  let group = '';
  const buttons = new Map<number, HTMLButtonElement>();
  for (const chapter of chapters) {
    if (group !== chapter.group) {
      group = chapter.group;
      const heading = document.createElement('h2');
      heading.className = 'chapter-group';
      heading.textContent = group;
      nav.append(heading);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chapter-link';
    button.textContent = String(chapter.id).padStart(2, '0') + '  ' + chapter.title;
    button.addEventListener('click', () => {
      close();
      navigate(chapter.id);
    });
    nav.append(button);
    buttons.set(chapter.id, button);
  }
  const tip = document.createElement('p');
  tip.className = 'chapter-tip';
  tip.textContent = '可直接前往任意章节；切换章节会重新开始该节实验。';
  nav.append(tip);
  document.body.append(nav, backdrop, toggle);

  function close() {
    document.body.classList.remove('chapters-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('chapters-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  backdrop.addEventListener('click', close);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  function syncActive() {
    const match = app.querySelector('.lesson-meta')?.textContent?.match(/\/\s*(\d{1,2})\s*$/);
    const current = match ? Number(match[1]) : 0;
    buttons.forEach((button, id) => {
      const active = id === current;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }
  new MutationObserver(syncActive).observe(app, { childList: true });
  syncActive();
}
