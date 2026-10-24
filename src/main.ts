import './style.css';

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
        </div>
        <p id="feedback" class="feedback" aria-live="polite">尝试不同的分配，再判断是否合理。</p>
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
  const feedback = document.querySelector<HTMLParagraphElement>('#feedback')!;
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
        feedback.textContent = '这组分配可以成立。你能找到另一组不同的分配吗？';
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
      feedback.textContent = hints[Math.min(attempts - 1, hints.length - 1)];
    });

  document.querySelector<HTMLButtonElement>('#hint-button')!
    .addEventListener('click', () => {
      feedback.textContent = '分别计算进入 A 的流量与离开 A 的流量。A 能产生或储存流量吗？';
    });
  document.querySelector<HTMLButtonElement>('#explain-button')!
    .addEventListener('click', () => {
      summary.hidden = false;
    });
  document.querySelector<HTMLButtonElement>('#reveal-button')!
    .addEventListener('click', () => {
      if (succeeded) summary.hidden = false;
    });
  document.querySelector<HTMLButtonElement>('#back-button')!
    .addEventListener('click', showCapacityLesson);
}

showWelcome();
