type Step = {
  title: string;
  question: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
  snippet: string;
};

const steps: Step[] = [
  {
    title: '一、残量边为什么成对存储？',
    question: '增加一条容量为 c 的有向边 u → v 时，反向残量边 v → u 应该如何初始化？',
    options: ['反向容量同样为 c', '反向容量为 0，正反向边互相记录下标', '不需要反向边'],
    answer: 1,
    explanation: '还没有发送流量，所以一开始不能撤回。增广时必须同时减少正向容量、增加反向容量。',
    snippet: [
      'struct Edge {',
      '  int to, rev;',
      '  long long cap;',
      '};',
      '',
      'void add_edge(int u, int v, long long c) {',
      '  int a = (int)g[u].size();',
      '  int b = (int)g[v].size();',
      '  g[u].push_back({v, b + (u == v), c});',
      '  g[v].push_back({u, a, 0});',
      '}'
    ].join('\n')
  },
  {
    title: '二、BFS 为什么不是直接找一条路径？',
    question: '建好分层图后，什么条件允许 DFS 沿残量边 u → v 前进？',
    options: ['只要 cap > 0 就可以', 'cap > 0 且 level[v] = level[u] + 1', 'cap > 0 且 level[v] ≤ level[u]'],
    answer: 1,
    explanation: 'BFS 负责标记层数。DFS 只能走向下一层，才能在本次分层图中寻找增广路。',
    snippet: [
      'bool bfs(int s, int t) {',
      '  fill(level.begin(), level.end(), -1);',
      '  queue<int> q;',
      '  level[s] = 0;',
      '  q.push(s);',
      '  while (!q.empty()) {',
      '    int u = q.front(); q.pop();',
      '    for (const auto& e : g[u]) {',
      '      if (e.cap <= 0 || level[e.to] != -1) continue;',
      '      level[e.to] = level[u] + 1;',
      '      q.push(e.to);',
      '    }',
      '  }',
      '  return level[t] != -1;',
      '}'
    ].join('\n')
  },
  {
    title: '三、一次 DFS 怎样修改残量网络？',
    question: 'DFS 从 u 到 v 成功推送 d 单位流量后，哪一种更新是正确的？',
    options: ['只执行 e.cap -= d', 'e.cap -= d，同时反向边 cap += d', '只增加反向边容量'],
    answer: 1,
    explanation: '前进方向的可用容量减少 d，撤回方向的可用容量增加 d。DFS 失败时返回 0，继续尝试其他边。',
    snippet: [
      'long long dfs(int u, int t, long long f) {',
      '  if (u == t) return f;',
      '  for (auto& e : g[u]) {',
      '    if (e.cap <= 0 || level[e.to] != level[u] + 1) continue;',
      '    long long d = dfs(e.to, t, min(f, e.cap));',
      '    if (d == 0) continue;',
      '    e.cap -= d;',
      '    g[e.to][e.rev].cap += d;',
      '    return d;',
      '  }',
      '  return 0;',
      '}'
    ].join('\n')
  },
  {
    title: '四、什么时候才重新 BFS？',
    question: '在同一次 BFS 分层成功后，应该如何组织增广循环？',
    options: ['只 DFS 一次，然后立即重新 BFS', '反复 DFS 直到返回 0，再重新 BFS', '只执行 BFS，不需要 DFS'],
    answer: 1,
    explanation: '一次 BFS 对应一轮分层；连续 DFS，直到本轮无法再推流，才得到阻塞流。随后再重新 BFS。',
    snippet: [
      'long long max_flow(int s, int t) {',
      '  if (s == t) return 0;',
      '  long long ans = 0;',
      '  while (bfs(s, t)) {',
      '    while (true) {',
      '      long long d = dfs(s, t, LLONG_MAX);',
      '      if (d == 0) break;',
      '      ans += d;',
      '    }',
      '  }',
      '  return ans;',
      '}'
    ].join('\n')
  }
];

const fullCode = [
  '#include <bits/stdc++.h>',
  'using namespace std;',
  '',
  'class Dinic {',
  '  struct Edge {',
  '    int to, rev;',
  '    long long cap;',
  '  };',
  '  vector<vector<Edge>> g;',
  '  vector<int> level;',
  '',
  '  bool bfs(int s, int t) {',
  '    fill(level.begin(), level.end(), -1);',
  '    queue<int> q;',
  '    level[s] = 0;',
  '    q.push(s);',
  '    while (!q.empty()) {',
  '      int u = q.front(); q.pop();',
  '      for (const auto& e : g[u]) {',
  '        if (e.cap <= 0 || level[e.to] != -1) continue;',
  '        level[e.to] = level[u] + 1;',
  '        q.push(e.to);',
  '      }',
  '    }',
  '    return level[t] != -1;',
  '  }',
  '',
  '  long long dfs(int u, int t, long long f) {',
  '    if (u == t) return f;',
  '    for (auto& e : g[u]) {',
  '      if (e.cap <= 0 || level[e.to] != level[u] + 1) continue;',
  '      long long d = dfs(e.to, t, min(f, e.cap));',
  '      if (d == 0) continue;',
  '      e.cap -= d;',
  '      g[e.to][e.rev].cap += d;',
  '      return d;',
  '    }',
  '    return 0;',
  '  }',
  '',
  ' public:',
  '  explicit Dinic(int n) : g(n), level(n) {}',
  '',
  '  void add_edge(int u, int v, long long c) {',
  '    int a = (int)g[u].size();',
  '    int b = (int)g[v].size();',
  '    g[u].push_back({v, b + (u == v), c});',
  '    g[v].push_back({u, a, 0});',
  '  }',
  '',
  '  long long max_flow(int s, int t) {',
  '    if (s == t) return 0;',
  '    long long ans = 0;',
  '    while (bfs(s, t)) {',
  '      while (true) {',
  '        long long d = dfs(s, t, LLONG_MAX);',
  '        if (d == 0) break;',
  '        ans += d;',
  '      }',
  '    }',
  '    return ans;',
  '  }',
  '};',
  '',
  'int main() {',
  '  ios::sync_with_stdio(false);',
  '  cin.tie(nullptr);',
  '  int n, m, s, t;',
  '  cin >> n >> m >> s >> t;',
  '  Dinic dinic(n);',
  '  for (int i = 0; i < m; i++) {',
  '    int u, v;',
  '    long long c;',
  '    cin >> u >> v >> c;',
  '    dinic.add_edge(u, v, c);',
  '  }',
  '  cout << dinic.max_flow(s, t) << endl;',
  '}',
].join('\n');

export function showDinicCodeLesson(app: HTMLDivElement, back: () => void) {
  let index = 0;
  let solved = false;
  const learned: string[] = [];

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content dc-content">
      <button class="text-button" id="dc-back">← 返回第十一节</button>
      <div class="lesson-meta">第三章 · 最大流算法 / 12</div>
      <h1>你能自己写出 Dinic 吗？</h1>
      <p class="question">你已经亲自建立过分层图，也在同一次分层中寻找过阻塞流。现在把这些操作翻译成 C++。我们先只实现<strong>最基础、没有当前弧优化的 Dinic</strong>。</p>
      <div class="dc-layout">
        <section class="graph-panel dc-task">
          <div class="dc-head">
            <span id="dc-progress">第 1 / 4 步</span>
            <span id="dc-done-count">已完成 0 步</span>
          </div>
          <h2 id="dc-title"></h2>
          <p id="dc-question"></p>
          <div id="dc-options" class="dc-options" role="group" aria-label="选择正确实现"></div>
          <p id="dc-feedback" class="dc-feedback" aria-live="polite"></p>
          <button id="dc-next" class="primary-button" disabled>进入下一步 →</button>
        </section>
        <section class="history-panel dc-preview">
          <h2>逐步构建代码</h2>
          <p>回答正确后显示当前模块，逐渐拼出 Dinic 的结构。</p>
          <pre class="ff-code"><code id="dc-code-preview">先回答左侧问题。</code></pre>
        </section>
      </div>
      <section class="discovery dc-note">
        <strong>本节的实现范围</strong>
        <p>只保留必要的残量边、BFS、DFS 和双重循环。暂时不使用当前弧优化、容量缩放或其他技巧。DFS 会从头扫描出边：这更适合理解基本结构，但不是竞赛中最常用的优化版本。</p>
      </section>
      <section id="dc-complete" class="history-panel" hidden>
        <h2>基础 Dinic：完整 C++ 实现</h2>
        <p>已拼出四个模块。现在可以将它们放到同一个类中，得到一份可独立运行的程序（输入顶点采用 0-base）。</p>
        <div class="dc-test">
          <strong>验证样例</strong>
          <pre>6 7 0 5
0 1 5
0 2 4
1 3 3
2 4 4
1 4 3
3 5 3
4 5 5</pre>
          <span>期望输出：<strong>8</strong></span>
        </div>
        <button id="dc-copy" class="secondary-button">复制完整代码</button>
        <pre class="ff-code"><code id="dc-full-code"></code></pre>
        <div class="discovery dc-finish">
          <strong>Flow Lab · 第一阶段完成</strong>
          <p>你已经从容量与流量出发，学会了残量网络、增广路、Ford–Fulkerson、Edmonds–Karp 和基础 Dinic。下一阶段可以在这份代码上学习当前弧等优化；现在先确保能独立解释每一行代码。</p>
        </div>
      </section>
      <div class="lesson-actions"><button id="dc-restart" class="secondary-button">重新练习本节</button></div>
    </div></main>
  `;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const title = get<HTMLElement>('dc-title');
  const question = get<HTMLElement>('dc-question');
  const options = get<HTMLElement>('dc-options');
  const feedback = get<HTMLElement>('dc-feedback');
  const next = get<HTMLButtonElement>('dc-next');

  function render() {
    const step = steps[index];
    title.textContent = step.title;
    question.textContent = step.question;
    get<HTMLElement>('dc-progress').textContent = '第 ' + (index + 1) + ' / 4 步';
    get<HTMLElement>('dc-done-count').textContent = '已完成 ' + learned.length + ' 步';
    feedback.textContent = solved ? step.explanation : '先选择你认为正确的实现。';
    next.disabled = !solved;
    next.textContent = index === steps.length - 1 ? '完成并查看整份代码 →' : '进入下一步 →';
    get<HTMLElement>('dc-code-preview').textContent = learned.length
      ? learned.join('\n\n// ─── 下一模块 ───\n\n')
      : '// 等待你完成第一步…';
    options.replaceChildren();
    step.options.forEach((option, choice) => {
      const button = document.createElement('button');
      button.className = 'secondary-button';
      button.type = 'button';
      button.textContent = option;
      button.disabled = solved;
      if (solved && choice === step.answer) button.setAttribute('aria-pressed', 'true');
      button.addEventListener('click', () => {
        if (solved) return;
        if (choice !== step.answer) {
          feedback.textContent = '再想一想：结合前几节的残量网络与阻塞流实验判断。';
          return;
        }
        solved = true;
        learned.push(step.snippet);
        render();
      });
      options.append(button);
    });
  }

  next.addEventListener('click', () => {
    if (!solved) return;
    if (index < steps.length - 1) {
      index++;
      solved = false;
      render();
      return;
    }
    get<HTMLElement>('dc-complete').hidden = false;
    get<HTMLElement>('dc-full-code').textContent = fullCode;
    next.disabled = true;
    next.textContent = '已经完成全部模块';
    get<HTMLElement>('dc-complete').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  get<HTMLButtonElement>('dc-copy').addEventListener('click', async () => {
    const button = get<HTMLButtonElement>('dc-copy');
    try {
      await navigator.clipboard.writeText(fullCode);
      button.textContent = '已复制';
      window.setTimeout(() => { button.textContent = '复制完整代码'; }, 1500);
    } catch {
      button.textContent = '复制失败，请手动选择';
    }
  });
  get<HTMLButtonElement>('dc-restart').addEventListener('click', () => showDinicCodeLesson(app, back));
  get<HTMLButtonElement>('dc-back').addEventListener('click', back);
  render();
}
