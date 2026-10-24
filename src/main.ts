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
        <div class="flow-controls">
          <label for="ab-flow">A → B：<output id="ab-value">0</output>
            <input id="ab-flow" type="range" min="0" max="7" value="0" />
          </label>
          <label for="ac-flow">A → C：<output id="ac-value">0</output>
            <input id="ac-flow" type="range" min="0" max="7" value="0" />
          </label>
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
      <div class="graph-panel"><svg id="validity-graph" class="flow-graph" viewBox="0 0 650 360" role="img" aria-label="六节点七条边的流量网络"></svg></div>
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
    const parts = edges.map(e => {
      const [x1, y1] = positions[e.from], [x2, y2] = positions[e.to];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * 29, sy = y1 + uy * 29;
      const ex = x2 - ux * 34, ey = y2 - uy * 34;
      const offset = e.from === 'A' && e.to === 'D' ? -17 : -14;
      const mx = (sx + ex) / 2 - uy * offset;
      const my = (sy + ey) / 2 + ux * offset;
      return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#64748b" stroke-width="3" marker-end="url(#valid-arrow)"/>
        <text x="${mx}" y="${my}" text-anchor="middle" class="edge-label">${e.flow} / ${e.cap}</text>`;
    });
    const nodes = Object.entries(positions).map(([name, [x, y]]) =>
      `<circle cx="${x}" cy="${y}" r="27" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="${x}" y="${y + 8}" text-anchor="middle" class="node-label">${name}</text>`
    );
    svg.innerHTML = `<defs><marker id="valid-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8"/></marker></defs>${parts.join('')}${nodes.join('')}`;
    const graph = new FlowGraph(svg, selection => {
      if (!selection) return;
      if (selection.type === 'edge') {
        const edge = edges[selection.index];
        note(edge.from + ' → ' + edge.to + '：流量 ' + edge.flow + ' / 容量 ' + edge.cap);
      } else {
        const incoming = edges.filter(e => e.to === selection.id).reduce((s, e) => s + e.flow, 0);
        const outgoing = edges.filter(e => e.from === selection.id).reduce((s, e) => s + e.flow, 0);
        note(selection.id + '：流入 ' + incoming + '，流出 ' + outgoing);
      }
    });
    graph.setEdges(edges);
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
  app.innerHTML = `<main class="screen lesson"><div class="lesson-content">
    <button id="back-button" class="text-button">← 返回上一节</button>
    <div class="lesson-meta">第二章 · 为什么不能直接贪心？ · 预览</div>
    <h1>每次尽可能多地发送流量，一定正确吗？</h1>
    <p class="question">下一章，我们将继续使用刚才的网络，尝试自己选择路径。</p>
  </div></main>`;
  document.querySelector<HTMLButtonElement>('#back-button')!.addEventListener('click', showValidityPreview);
}

showWelcome();
