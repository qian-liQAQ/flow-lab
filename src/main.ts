import './style.css';
import { FlowGraph } from './flow-graph';

const app = document.querySelector<HTMLDivElement>('#app')!;

function showWelcome() {
  app.innerHTML = `
    <main class="screen welcome">
      <span class="eyebrow">INTERACTIVE ALGORITHM LAB</span>
      <h1>Flow Lab</h1>
      <p>从零推导网络流算法</p>
      <button id="start-button" class="primary-button">开始探索 →</button>
    </main>
  `;

  document.querySelector<HTMLButtonElement>('#start-button')!
    .addEventListener('click', showCapacityLesson);
}

function showCapacityLesson() {
  const capacity = 5;
  let flow = 0;

  app.innerHTML = `
    <main class="screen lesson">
      <div class="lesson-content">
        <button id="back-button" class="text-button">← 返回首页</button>
        <div class="lesson-meta">第一章 · 什么是最大流？ / 01</div>
        <h1>一条边，能承载多少流量？</h1>
        <p class="question">假设 S 是起点，T 是终点。连接它们的管道容量为 5。试着向 T 发送流量。</p>

        <div class="graph-panel">
          <svg class="flow-graph" viewBox="0 0 600 230" role="img" aria-label="从 S 到 T 的有向边，容量为 5">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#64748b"></path>
              </marker>
            </defs>
            <line x1="145" y1="115" x2="455" y2="115" stroke="#334155" stroke-width="16" stroke-linecap="round"></line>
            <line id="flow-line" x1="145" y1="115" x2="145" y2="115" stroke="#38bdf8" stroke-width="12" stroke-linecap="round"></line>
            <line x1="145" y1="115" x2="455" y2="115" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"></line>
            <circle cx="120" cy="115" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="2"></circle>
            <circle cx="480" cy="115" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="2"></circle>
            <text x="120" y="122" text-anchor="middle" class="node-label">S</text>
            <text x="480" y="122" text-anchor="middle" class="node-label">T</text>
            <text id="flow-label" x="300" y="80" text-anchor="middle" class="edge-label">流量 0 / 容量 5</text>
          </svg>
        </div>

        <div class="lesson-actions">
          <button id="send-button" class="primary-button">发送 1 单位流量 →</button>
          <button id="reset-button" class="secondary-button">重置</button>
          <button id="next-button" class="secondary-button">下一节：流量守恒 →</button>
        </div>
        <p id="feedback" class="feedback" aria-live="polite">当前流量为 0。你觉得最多可以发送多少？</p>
      </div>
    </main>
  `;

  const sendButton = document.querySelector<HTMLButtonElement>('#send-button')!;
  const label = document.querySelector<SVGTextElement>('#flow-label')!;
  const line = document.querySelector<SVGLineElement>('#flow-line')!;
  const feedback = document.querySelector<HTMLParagraphElement>('#feedback')!;

  function render() {
    label.textContent = `流量 ${flow} / 容量 ${capacity}`;
    line.setAttribute('x2', String(145 + 310 * flow / capacity));
    sendButton.disabled = flow >= capacity;
    feedback.textContent = flow === capacity
      ? '已经达到容量上限！容量是允许通过的最大流量，流量不能超过容量。'
      : `已发送 ${flow} 单位流量，还可以再发送 ${capacity - flow} 单位。`;
  }

  sendButton.addEventListener('click', () => {
    if (flow < capacity) flow++;
    render();
  });
  document.querySelector<HTMLButtonElement>('#reset-button')!
    .addEventListener('click', () => {
      flow = 0;
      render();
    });
  document.querySelector<HTMLButtonElement>('#back-button')!
    .addEventListener('click', showWelcome);
  document.querySelector<HTMLButtonElement>('#next-button')!
    .addEventListener('click', showConservationIntro);
}

function showConservationIntro() {
  let attempts = 0;
  let succeeded = false;

  app.innerHTML = `
    <main class="screen lesson">
      <div class="lesson-content">
        <button id="back-button" class="text-button">← 返回上一节</button>
        <div class="lesson-meta">第一章 · 什么是最大流？ / 02</div>
        <h1>进入节点的流量，去了哪里？</h1>
        <p class="question">S 向 A 输送了 5 单位流量。A 不会制造或储存流量。请尝试将流量分配到 B 和 C。</p>
        <div class="graph-workspace conservation-workspace">
          <div class="graph-panel">
          <svg class="flow-graph" viewBox="0 0 600 300" role="img" aria-label="S 向 A 发送 5 单位流量，A 分别连接 B 和 C">
            <line x1="120" y1="150" x2="280" y2="150" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" />
            <line x1="320" y1="135" x2="470" y2="75" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
            <line x1="320" y1="165" x2="470" y2="225" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
            <circle cx="100" cy="150" r="32" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
            <circle cx="300" cy="150" r="32" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
            <circle cx="490" cy="65" r="32" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
            <circle cx="490" cy="235" r="32" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
            <text x="100" y="158" text-anchor="middle" class="node-label">S</text>
            <text x="300" y="158" text-anchor="middle" class="node-label">A</text>
            <text x="490" y="73" text-anchor="middle" class="node-label">B</text>
            <text x="490" y="243" text-anchor="middle" class="node-label">C</text>
            <text x="200" y="128" text-anchor="middle" class="edge-label">5</text>
            <text id="ab-label" x="397" y="85" text-anchor="middle" class="edge-label">0</text>
            <text id="ac-label" x="397" y="224" text-anchor="middle" class="edge-label">0</text>
          </svg>
          </div>
          <aside class="graph-info conservation-controls" aria-label="流量分配控制台">
            <h2>流量控制台</h2>
            <p class="control-description">拖动滑块，观察 A 向两个方向发送的流量。</p>
            <div class="flow-controls">
          <label for="ab-flow">A → B：<output id="ab-value">0</output>
            <input id="ab-flow" type="range" min="0" max="7" value="0" />
          </label>
          <label for="ac-flow">A → C：<output id="ac-value">0</output>
            <input id="ac-flow" type="range" min="0" max="7" value="0" />
          </label>
            </div>
          </aside>
        </div>
        <div class="lesson-actions">
          <button id="check-button" class="primary-button">验证分配</button>
          <button id="hint-button" class="secondary-button">给我一点提示</button>
          <button id="explain-button" class="secondary-button">查看详细解释</button>
          <button id="next-button" class="secondary-button">下一节：判断合法流 →</button>
        </div>
        <section class="history-panel" aria-label="探索记录"><h2>探索记录</h2><ol id="history" aria-live="polite"><li>尝试不同的分配，再判断是否合理。</li></ol></section>
        <div id="discovery" class="discovery" hidden>
          <p>你找到了一个可行分配！试着想想：换成另一组数字，什么条件仍然必须成立？</p>
          <button id="reveal-button" class="secondary-button">我发现规律了，查看总结</button>
        </div>
        <div id="summary" class="discovery" hidden>
          <strong>流量守恒</strong>
          <p>对于既不是源点也不是汇点的节点，流入量之和必须等于流出量之和。</p>
        </div>
      </div>
    </main>
  `;

  const ab = document.querySelector<HTMLInputElement>('#ab-flow')!;
  const ac = document.querySelector<HTMLInputElement>('#ac-flow')!;
  const history = document.querySelector<HTMLOListElement>('#history')!;
  function addFeedback(message: string) {
    const item = document.createElement('li');
    item.textContent = message;
    history.appendChild(item);
  }
  const discovery = document.querySelector<HTMLDivElement>('#discovery')!;
  const summary = document.querySelector<HTMLDivElement>('#summary')!;

  function updateValues() {
    for (const [id, value] of [
      ['ab-value', ab.value], ['ac-value', ac.value],
      ['ab-label', ab.value], ['ac-label', ac.value],
    ]) {
      document.getElementById(id)!.textContent = value;
    }
  }

  ab.addEventListener('input', updateValues);
  ac.addEventListener('input', updateValues);

  document.querySelector<HTMLButtonElement>('#check-button')!
    .addEventListener('click', () => {
      const outgoing = Number(ab.value) + Number(ac.value);
      if (outgoing === 5) {
        succeeded = true;
        addFeedback(`A → B = ${ab.value}，A → C = ${ac.value}：这组分配可以成立。你能找到另一组不同的分配吗？`);
        discovery.hidden = false;
        return;
      }
      attempts++;
      const hints = outgoing > 5
        ? [
          'A 收到的流量是有限的。它能凭空产生更多流量吗？',
          '试着比较 A 收到的总量和向 B、C 发送的总量。',
          'A 既不会产生流量，也不会储存流量。每一单位流量都应该有去处。',
        ]
        : [
          '有些流量进入 A 后似乎不见了。它们去了哪里？',
          '试着比较 A 收到的总量和向 B、C 发送的总量。',
          'A 既不会产生流量，也不会储存流量。每一单位流量都应该有去处。',
        ];
      addFeedback(`A → B = ${ab.value}，A → C = ${ac.value}：${hints[Math.min(attempts - 1, hints.length - 1)]}`);
    });

  document.querySelector<HTMLButtonElement>('#hint-button')!
    .addEventListener('click', () => {
      addFeedback('提示：分别计算进入 A 的流量与离开 A 的流量。A 能产生或储存流量吗？');
    });
  document.querySelector<HTMLButtonElement>('#explain-button')!
    .addEventListener('click', () => {
      summary.hidden = false;
      addFeedback('已展开详细解释。');
    });
  document.querySelector<HTMLButtonElement>('#reveal-button')!
    .addEventListener('click', () => {
      if (succeeded) summary.hidden = false;
    });
  document.querySelector<HTMLButtonElement>('#back-button')!
    .addEventListener('click', showCapacityLesson);
  document.querySelector<HTMLButtonElement>('#next-button')!
    .addEventListener('click', showValidityPreview);
}

function showValidityPreview() {
  type Edge = { from: string; to: string; cap: number; flow: number };
  const base = [
    { from: 'S', to: 'A', cap: 5 }, { from: 'S', to: 'B', cap: 4 },
    { from: 'A', to: 'C', cap: 3 }, { from: 'B', to: 'D', cap: 4 },
    { from: 'A', to: 'D', cap: 3 }, { from: 'C', to: 'T', cap: 3 },
    { from: 'D', to: 'T', cap: 5 },
  ];
  const positions: Record<string, [number, number]> = {
    S: [70, 180], A: [230, 80], B: [230, 280],
    C: [420, 80], D: [420, 280], T: [575, 180],
  };
  let edges: Edge[] = [];
  let category = '';
  let attempts = 0;
  let round = 0;
  let answered = false;

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content">
      <button id="back-button" class="text-button">← 返回上一节</button>
      <div class="lesson-meta">第一章 · 什么是最大流？ / 03</div>
      <h1>这是一组合法的流量吗？</h1>
      <p class="question">每条边标注「流量 / 容量」。判断整张网络是否同时满足容量限制和中间节点的流量守恒。</p>
      <div class="graph-workspace"><div class="graph-panel"><svg id="validity-graph" class="flow-graph" viewBox="0 0 650 360" role="img" aria-label="六节点七条边的流量网络"></svg></div><aside class="graph-info"><h2>元素信息</h2><p id="graph-preview">将鼠标悬停在节点或边上查看信息。</p><h3>已选中</h3><p id="graph-selected">尚未选中元素。</p><p class="graph-keyboard-tip">键盘操作：Tab 切换元素，Enter 或空格选中。</p></aside></div>
      <div class="lesson-actions">
        <button id="valid-button" class="primary-button">合法</button>
        <button id="invalid-button" class="secondary-button">不合法</button>
        <button id="new-case" class="secondary-button">生成新方案 ↻</button>
        <button id="next-button" class="secondary-button">下一章：贪心的陷阱 →</button>
      </div>
      <section class="history-panel"><h2>探索记录</h2><ol id="validity-history" aria-live="polite"></ol></section>
    </div></main>
  `;
  const svg = document.querySelector<SVGSVGElement>('#validity-graph')!;
  const history = document.querySelector<HTMLOListElement>('#validity-history')!;
  const preview = document.querySelector<HTMLParagraphElement>('#graph-preview')!;
  const selected = document.querySelector<HTMLParagraphElement>('#graph-selected')!;
  function describe(selection: { type: 'node'; id: string } | { type: 'edge'; index: number }) {
    if (selection.type === 'edge') {
      const e = edges[selection.index];
      return e.from + ' → ' + e.to + '：流量 ' + e.flow + ' / 容量 ' + e.cap;
    }
    const incoming = edges.filter(e => e.to === selection.id).reduce((s, e) => s + e.flow, 0);
    const outgoing = edges.filter(e => e.from === selection.id).reduce((s, e) => s + e.flow, 0);
    return selection.id + '：流入 ' + incoming + '，流出 ' + outgoing;
  }
  const graph = new FlowGraph(svg,
    selection => { if (selection) selected.textContent = describe(selection); },
    selection => { preview.textContent = selection ? describe(selection) : '将鼠标悬停在节点或边上查看信息。'; },
  );

  function note(message: string) {
    const li = document.createElement('li');
    li.textContent = message;
    history.appendChild(li);
  }
  function generate() {
    round++;
    attempts = 0;
    answered = false;
    // Generate a feasible flow by sending along complete S-T paths.
    const paths = [[0, 2, 5], [0, 4, 6], [1, 3, 6]];
    const f = Array(7).fill(0) as number[];
    for (const path of paths.sort(() => Math.random() - 0.5)) {
      const amount = Math.floor(Math.random() * 3);
      if (path.every(i => f[i] + amount <= base[i].cap)) {
        for (const i of path) f[i] += amount;
      }
    }
    const kind = (round - 1) % 3;
    category = ['valid', 'capacity', 'conservation'][kind];
    if (kind === 1) {
      const i = Math.floor(Math.random() * 7);
      f[i] = base[i].cap + 1;
    }
    if (kind === 2) {
      // Increase one outgoing edge of an intermediate node, within capacity.
      const choices = [2, 3, 4, 5, 6].filter(i => f[i] < base[i].cap);
      const i = choices[Math.floor(Math.random() * choices.length)];
      f[i]++;
    }
    edges = base.map((e, i) => ({ ...e, flow: f[i] }));
    graph.setEdges(edges);
    selected.textContent = '尚未选中元素。';
    preview.textContent = '将鼠标悬停在节点或边上查看信息。';
    note(`第 ${round} 组方案已生成。你认为它是否合法？`);
  }
  function check(guessValid: boolean) {
    const isValid = category === 'valid';
    if (guessValid === isValid) {
      answered = true;
      note(isValid
        ? '判断正确。这个流满足两项约束。但它是否已经达到最大流量？'
        : '判断正确。你能指出是哪一项约束出了问题吗？');
    } else {
      attempts++;
      const hints = [
        '先回忆第一节：每条边都满足容量限制吗？',
        '再回忆第二节：A、B、C、D 各自的流入量和流出量相等吗？',
        '尝试逐条列出边的流量，再分别计算中间节点的流入和流出。',
      ];
      note(`第 ${round} 组，第 ${attempts} 次判断：${hints[Math.min(attempts - 1, 2)]}`);
    }
    if (answered) note('可以继续生成新方案，或者直接进入下一章。');
  }
  document.querySelector<HTMLButtonElement>('#valid-button')!.addEventListener('click', () => check(true));
  document.querySelector<HTMLButtonElement>('#invalid-button')!.addEventListener('click', () => check(false));
  document.querySelector<HTMLButtonElement>('#new-case')!.addEventListener('click', generate);
  document.querySelector<HTMLButtonElement>('#back-button')!.addEventListener('click', showConservationIntro);
  document.querySelector<HTMLButtonElement>('#next-button')!.addEventListener('click', showGreedyPreview);
  generate();
}

function showGreedyPreview() {
  // 第四节先只允许沿正向边增广；反向边留给下一节发现。
  const base = [
    { from: 'S', to: 'A', cap: 5 }, { from: 'S', to: 'B', cap: 4 },
    { from: 'A', to: 'C', cap: 3 }, { from: 'B', to: 'D', cap: 4 },
    { from: 'A', to: 'D', cap: 3 }, { from: 'C', to: 'T', cap: 3 },
    { from: 'D', to: 'T', cap: 5 },
  ];
  type Stage = 'explore' | 'challenge' | 'reflection';
  let stage: Stage = 'explore';
  let flows = base.map(() => 0);
  let path: number[] = [];
  let history: number[][] = [];
  let attempts = 0;
  let hasCompared = false;

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content">
      <button id="back-button" class="text-button">← 返回上一节</button>
      <div class="lesson-meta">第二章 · 贪心的陷阱 / 04</div>
      <h1>每次沿一条路径尽可能多地发送流量，就一定能得到最大流吗？</h1>
      <p class="question">依次点击从 S 出发的有向边，组成一条到 T 的路径。试着选择不同的路径顺序。</p>
      <div class="graph-workspace">
        <div class="graph-panel"><svg id="greedy-graph" class="flow-graph" viewBox="0 0 650 360" aria-label="可选择边的网络流实验图"></svg></div>
        <aside class="graph-info">
          <h2>路径实验台</h2>
          <p id="greedy-mode">自由探索：你会先选择哪条路径？</p>
          <h3>当前总流量</h3><p id="greedy-total" class="greedy-total">0 / 8</p>
          <h3>正在选择的路径</h3><p id="greedy-path">从 S 开始，点击一条边。</p>
          <p id="greedy-bottleneck">瓶颈容量：—</p>
          <p id="greedy-preview" class="graph-keyboard-tip">鼠标悬停查看边；Tab、Enter 或空格也可选择。</p>
        </aside>
      </div>
      <div class="lesson-actions">
        <button id="greedy-augment" class="primary-button" disabled>沿路径增广</button>
        <button id="greedy-undo-path" class="secondary-button">撤销选边</button>
        <button id="greedy-clear-path" class="secondary-button">清空路径</button>
        <button id="greedy-undo-flow" class="secondary-button">撤销上次增广</button>
        <button id="greedy-reset" class="secondary-button">重置网络</button>
      </div>
      <section id="greedy-prompt" class="discovery greedy-prompt" aria-live="polite">
        <strong>实验提示</strong><p id="greedy-message">先试着找一条 S 到 T 的路径。每条边显示「当前流量 / 容量」。</p>
        <button id="greedy-challenge" class="primary-button" hidden>挑战另一种路径顺序 →</button>
        <button id="greedy-reflect" class="primary-button" hidden>分析这次阻塞 →</button>
      </section>
      <section class="history-panel"><h2>探索记录</h2><ol id="greedy-history" aria-live="polite"></ol></section>
      <div id="greedy-summary" class="discovery" hidden>
        <strong>发现：路径顺序会影响正向贪心的结果</strong>
        <p>先走 S → A → D → T 并发送 3，再沿剩余正向路径发送，最终只能得到 7；但其他顺序可以达到 8。</p>
        <p>如果不把流量全部清零，能不能只调整 A → D 上原先发送的流量？下一节将探索这个问题。</p>
        <button id="greedy-retry" class="secondary-button">再自由尝试一次</button>
      </div>
    </div></main>
  `;

  const byId = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
  const svg = byId<SVGSVGElement>('greedy-graph');
  const mode = byId<HTMLElement>('greedy-mode');
  const total = byId<HTMLElement>('greedy-total');
  const pathText = byId<HTMLElement>('greedy-path');
  const bottleneckText = byId<HTMLElement>('greedy-bottleneck');
  const preview = byId<HTMLElement>('greedy-preview');
  const message = byId<HTMLElement>('greedy-message');
  const augment = byId<HTMLButtonElement>('greedy-augment');
  const challenge = byId<HTMLButtonElement>('greedy-challenge');
  const reflect = byId<HTMLButtonElement>('greedy-reflect');
  const summary = byId<HTMLElement>('greedy-summary');
  const log = byId<HTMLOListElement>('greedy-history');

  function note(value: string) {
    const li = document.createElement('li');
    li.textContent = value;
    log.append(li);
  }
  function currentNode() {
    return path.length ? base[path[path.length - 1]].to : 'S';
  }
  function remaining(i: number) {
    return base[i].cap - flows[i];
  }
  function maxAdd() {
    return path.length ? Math.min(...path.map(remaining)) : 0;
  }
  function flowValue() {
    return flows[0] + flows[1];
  }
  function canExtend() {
    const visited = new Set(['S', ...path.map(i => base[i].to)]);
    return base.some((e, i) => e.from === currentNode() && remaining(i) > 0 && !visited.has(e.to));
  }
  function hasForwardPath() {
    function dfs(node: string, seen: Set<string>): boolean {
      if (node === 'T') return true;
      return base.some((e, i) => e.from === node && remaining(i) > 0 &&
        !seen.has(e.to) && dfs(e.to, new Set([...seen, e.to])));
    }
    return dfs('S', new Set(['S']));
  }
  const graph = new FlowGraph(svg, selection => {
    if (selection?.type !== 'edge') return;
    const i = selection.index;
    const edge = base[i];
    if (currentNode() === 'T') {
      message.textContent = '路径已经到达 T，请先增广或撤销选边。';
    } else if (edge.from !== currentNode()) {
      message.textContent = `路径必须从 ${currentNode()} 接着走。请选择从该节点出发的边。`;
    } else if (remaining(i) <= 0) {
      message.textContent = '这条边已经满载，无法继续沿正向增广。';
    } else if (path.some(j => base[j].from === edge.to) || edge.to === 'S') {
      message.textContent = '这次实验只选择不重复节点的简单路径。';
    } else if (stage === 'challenge' && history.length === 0 && path.length === 0 && i !== 0) {
      message.textContent = '本轮先尝试 S → A → D → T。请从 S → A 开始。';
    } else if (stage === 'challenge' && history.length === 0 && path.length === 1 && i !== 4) {
      message.textContent = '试着先选择斜向的 A → D。';
    } else if (stage === 'challenge' && history.length === 0 && path.length === 2 && i !== 6) {
      message.textContent = '现在从 D 走向 T。';
    } else {
      path.push(i);
      message.textContent = '路径已更新。观察右侧的瓶颈容量。';
    }
    render();
  }, selection => {
    if (selection?.type === 'edge') {
      const e = base[selection.index];
      preview.textContent = `${e.from} → ${e.to}：${flows[selection.index]} / ${e.cap}，剩余 ${remaining(selection.index)}`;
    } else {
      preview.textContent = '鼠标悬停查看边；Tab、Enter 或空格也可选择。';
    }
  });

  function render() {
    graph.setEdges(base.map((e, i) => ({ ...e, flow: flows[i] })));
    // FlowGraph 的边元素按 base 的顺序绘制。
    svg.querySelectorAll<SVGGElement>('g.flowgraph-interactive').forEach((el, i) => {
      if (path.includes(i)) el.classList.add('greedy-path-edge');
    });
    const nodes = ['S', ...path.map(i => base[i].to)];
    pathText.textContent = nodes.join(' → ');
    bottleneckText.textContent = path.length ? `瓶颈容量：${maxAdd()}` : '瓶颈容量：—';
    total.textContent = `${flowValue()} / 8`;
    augment.disabled = currentNode() !== 'T' || maxAdd() <= 0;
    mode.textContent = stage === 'challenge'
      ? '反例挑战：先选择 S → A → D → T。'
      : stage === 'reflection' ? '比较两种路径顺序。' : '自由探索：你会先选择哪条路径？';
    challenge.hidden = stage !== 'explore' || !hasCompared;
    reflect.hidden = stage !== 'challenge' || hasForwardPath() || flowValue() === 0;
    summary.hidden = stage !== 'reflection';
  }
  function reset(nextStage: Stage) {
    stage = nextStage;
    flows = base.map(() => 0);
    path = [];
    history = [];
    attempts = 0;
    hasCompared = false;
    message.textContent = nextStage === 'challenge'
      ? '假设遍历顺序恰好先找到了 S → A → D → T。请按顺序选择这三条边并增广。'
      : '从 S 出发，点击边构造一条路径。';
    render();
  }
  augment.addEventListener('click', () => {
    if (currentNode() !== 'T' || maxAdd() <= 0) return;
    const amount = maxAdd();
    const label = ['S', ...path.map(i => base[i].to)].join(' → ');
    history.push([...flows]);
    path.forEach(i => { flows[i] += amount; });
    path = [];
    attempts++;
    note(`第 ${attempts} 次：${label}，发送 ${amount}，总流量 ${flowValue()}。`);
    if (flowValue() === 8 && stage === 'explore') {
      hasCompared = true;
      message.textContent = '你达到了流量 8！如果算法先选择斜向边 A → D，还能得到相同结果吗？点击下面的挑战按钮试试。';
    } else if (!hasForwardPath() && stage === 'explore') {
      hasCompared = true;
      message.textContent = `目前总流量为 ${flowValue()}，已找不到正向增广路径。换一种路径顺序会怎样？`;
    } else if (!hasForwardPath() && stage === 'challenge') {
      message.textContent = `正向路径已全部阻塞，总流量为 ${flowValue()}。但你刚才可能已经得到过 8。为什么会这样？`;
    } else {
      message.textContent = '增广完成。继续寻找下一条可用路径。';
    }
    render();
  });
  byId<HTMLButtonElement>('greedy-undo-path').addEventListener('click', () => {
    path.pop();
    message.textContent = '已撤销最后选择的一条边。';
    render();
  });
  byId<HTMLButtonElement>('greedy-clear-path').addEventListener('click', () => {
    path = [];
    render();
  });
  byId<HTMLButtonElement>('greedy-undo-flow').addEventListener('click', () => {
    const previous = history.pop();
    if (!previous) return;
    flows = previous;
    path = [];
    hasCompared = false;
    message.textContent = '已撤销上一次增广。';
    note('撤销了一次增广。');
    render();
  });
  byId<HTMLButtonElement>('greedy-reset').addEventListener('click', () => reset(stage));
  challenge.addEventListener('click', () => {
    reset('challenge');
    note('开始反例实验：先选择 S → A → D → T。');
  });
  reflect.addEventListener('click', () => {
    stage = 'reflection';
    message.textContent = '两次实验使用同一张网络，却因为路径顺序不同得到不同结果。';
    render();
  });
  byId<HTMLButtonElement>('greedy-retry').addEventListener('click', () => reset('explore'));
  byId<HTMLButtonElement>('back-button').addEventListener('click', showValidityPreview);
  render();
}

showWelcome();
