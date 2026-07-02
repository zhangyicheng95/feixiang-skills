<skill-content>
---
name: teaching-game-design
description: 当用户要求生成"教学游戏 / 互动练习游戏 / 闯关答题 / 拖拽连线 / 记忆翻牌"等**有可玩性和激励机制**的教学 HTML 时使用；覆盖游戏状态机架构、题库组织、反馈系统与难度曲线。
---

# teaching-game-design

## 适用场景

- 用户说 "做一个 XX 游戏"、"闯关答题"、"翻牌配对"、"拖拽分类"、"限时挑战"、"教学小游戏"、"边玩边学"、"趣味练习"
- 目标是**让学生主动玩**而非被动看，需要得分 / 关卡 / 激励机制

**不适用于：**

- 静态知识讲解 / 只看不玩的动画（用 `html-authoring`）
- 多页 PPT 课件（用 `courseware-*`）
- 试题输出 / 题单（用 `paper-generation`）

## 前置条件

- **媒体**：`generate_image`（图片必须拿 URL，禁止 base64）、`generate_voice`（音频同上；也可用 Web Audio API 代码生成音效）
- **检索**：`search_knowledge` / `search_web`
- **文件**：`create_file`、`read_file`、`edit_file`
- **结束**：`terminate`

## 教学游戏本质特征（缺一不可）

- **可玩性**：有明确机制（得分 / 关卡 / 挑战），学生主动参与而非被动观看
- **即时反馈**：每次操作给出对/错 + 鼓励 + 分数变化
- **难度递进**：多关卡，难度逐步提升，保持心流
- **激励机制**：积分 / 星级 / 连击 / 通关特效

## 工作流程

1. **明确教学目标** → 选游戏类型（见下表）
2. **设计题库** → 每关 3-5 道题，关卡间难度递增
3. **并行准备素材**：`generate_image`（场景图 / 道具）、（如需背景音）`generate_voice`
4. **生成 HTML** → `create_file`，必须包含：引导说明页 / 游戏主体 / 反馈系统 / 结算页
5. 向用户输出玩法说明（不要技术细节）→ `terminate`

### 游戏类型选择指南

| 教学目标 | 推荐游戏类型 | 示例 |
|---|---|---|
| 记忆 / 识别 | 翻牌配对、选择题闯关 | 英语单词配对、元素符号记忆 |
| 理解概念 | 分类游戏、排序游戏 | 物质分类、历史事件排序 |
| 练习计算 | 限时挑战、答题竞速 | 口算大挑战、方程求解 |
| 应用知识 | 模拟操作、拖拽组装 | 电路连接、化学实验 |
| 分析综合 | 探索发现、策略游戏 | 函数图像探索、生态模拟 |

### 难度曲线（心流原则）

- **第 1 关**：入门级，几乎所有学生都能答对，建立信心
- **第 2-3 关**：逐步引入干扰项或增加复杂度
- **第 4-5 关**：接近目标难度，需运用所学知识
- **加分关（可选）**：挑战级别，给优秀学生额外成就感

## 架构铁律

### 1. 生命周期状态机（集中状态 + 阶段守卫）

```javascript
const GamePhase = {
  INTRO: 'intro', PLAYING: 'playing', PAUSED: 'paused',
  LEVEL_COMPLETE: 'level_complete', GAME_OVER: 'game_over', COMPLETED: 'completed'
};

const gameState = {
  phase: GamePhase.INTRO,
  currentLevel: 1, totalLevels: 5, questionIndex: 0, questionsInLevel: 5,
  score: 0, combo: 0, maxCombo: 0,
  correctCount: 0, wrongCount: 0,
  lives: 3, timeLeft: 60, hintsRemaining: 2,
  currentQuestion: null, answers: []
};
```

**根据游戏类型裁剪字段** — 简单选择题不需要 `lives` / `combo`；限时挑战才需要 `timeLeft`。

**阶段守卫（所有事件 handler 第一行）：**

```javascript
function onOptionClick() {
  if (gameState.phase !== GamePhase.PLAYING) return;
  if (gameState.answered) return;
  gameState.answered = true;
  // ...
}
```

**禁止**散落全局变量、禁止跳过守卫。

### 2. 单向数据流（状态变更 → 触发渲染）

所有状态变更走集中的 `updateState(action, payload)`，action 枚举：`ANSWER_CORRECT` / `ANSWER_WRONG` / `NEXT_QUESTION` / `NEXT_LEVEL` / `RESTART` / `TIME_UP`。每次变更后调一次 `renderUI()`。

**禁止**在事件回调里直接操作 DOM 更新游戏状态显示。

### 3. 题库结构

```javascript
const questionBank = {
  level1: [
    { type: 'choice', question: '...', options: [...], answer: 0 },
    { type: 'drag', items: [...], targets: [...] },
    { type: 'fill', answer: '42' }
  ],
  level2: [/* 难度递增 */]
};
```

- 每关至少 3-5 道题
- 关卡间难度递增（题目复杂度 / 干扰项相似度 / 时间限制）
- 同关题目可随机打乱
- 题型可混合

## 反馈系统（每次作答后 200ms 内必触发）

### 视觉反馈（必做）

| 结果 | 视觉 | 动画 | 音效 | 文字 |
|---|---|---|---|---|
| 正确 | 绿色高亮 + `✓` | 缩放弹跳 / 分数跳动 | 高频 sine `880Hz` | 随机鼓励语 + 分数 `+10` |
| 错误 | 红色高亮 + `✗` | 摇晃 `translateX` | 低频 square `220Hz` | 再想想 + 显示正确答案 + 简短解析 |
| 操作 | 拖拽吸附 / 按钮缩放 / 悬停提示 | — | — | — |

**必须定义的 CSS（名称固定，其他代码靠它定位）：**

```css
.correct-answer { border-color: #22c55e !important; background-color: rgba(34,197,94,.1) !important; }
.wrong-answer   { border-color: #ef4444 !important; background-color: rgba(239,68,68,.1) !important; }
```

### 音效（Web Audio API — 不需要外部资源）

- 答对：sine 880Hz 持续 0.3s
- 答错：square 220Hz 持续 0.4s
- 升级：sine 523 → 659 → 784Hz 阶梯，持续 0.5s

```javascript
function playSound(type) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  // 按 type 设 frequency / waveform / envelope 后 osc.start()/stop()
}
```

### 鼓励语池（避免重复）

- 答对："太棒了！"、"完全正确！"、"真厉害！"、"继续保持！"、"非常好！"
- 答错："再想想哦～"、"差一点点！"、"不要灰心！"、"换个思路试试～"
- 连击："连续答对 ${n} 题！"、"势不可挡！"

## 交互实现要点（项目踩坑）

### 拖拽必须兼容鼠标 + 触摸

同时监听 `mousedown`/`mousemove`/`mouseup` 与 `touchstart`/`touchmove`/`touchend`，后两者要 `{ passive: false }` 才能 `preventDefault`。读取坐标用 `e.touches ? e.touches[0] : e`。

### 计时器

单例 `timerInterval`，集中 `start / pause / resume`。`timeLeft <= 10` 时加 `.warning` 样式。`timeLeft <= 0` 清 interval 后 `updateState('TIME_UP', {})`。

### 移动端点击区

按钮最小 **44×44px**；动画时长 0.2-0.6s；答题后延迟 0.8-1.2s 再进下一题（给学生消化时间）。

### 素材

- 图片 / 音频**必须拿 URL**，严禁 base64（会让 HTML 文件爆体积）
- 简单音效用 Web Audio API 代码生成，不去 `generate_voice`

## 必备 UI 组件

1. **顶部状态栏**：关卡 / 得分 / 进度 `1/5`
2. **游戏主区域**：占据页面主要空间
3. **反馈区**：对/错即时反馈 + 鼓励 + 正确答案解析
4. **结算页**：每关 + 最终通关，展示正确率 / 得分 / 用时 / 星级
5. **规则说明**：开始前必有，1-3 句话 + 图示；**禁止自动开始**，必须有「开始游戏」按钮

### 星级算法

```javascript
function getStars(accuracy) {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}
```

### Tailwind 补充色（游戏专属）

```js
tailwind.config = { theme: { extend: { colors: { success: '#22c55e', danger: '#ef4444' } } } }
```

## 激励机制（按需选用，不必全上）

- **积分**：答对得分，连击加成（3 连击 × 1.2，5 连击 × 1.5）
- **星级**：1-3 星
- **进度可视化**：清晰显示当前在第几关第几题
- **成就**：全对给特别表扬动画
- **重玩**：允许重刷更高分

## 质量标准

- 状态集中管理，所有事件有阶段守卫
- 答对 / 答错都有视觉 + 动画反馈，音效可选
- 每关 3-5 题，关卡间难度递增
- 必有引导页 / 主体 / 反馈 / 结算四区
- 移动端触摸可用，按钮 ≥ 44px
- 图片 / 音频走 URL，不嵌 base64
- 交付 HTML 时向用户给玩法说明，而非技术解释

## 完整示例

**用户：** "做一个小学二年级的 20 以内加减法限时闯关游戏"

**决策：**
- 类型：限时答题竞速
- 关卡：5 关，每关 5 道题；第 1 关只加法，第 3 关引入减法 + 退位，第 5 关混合 + 30 秒倒计时
- 状态字段：`phase / currentLevel / score / combo / timeLeft / correctCount / wrongCount`
- 激励：积分 + 连击加成（3 连 × 1.2）+ 星级 + 通关特效
- 反馈：Web Audio 音效；绿/红高亮；鼓励语池

**执行：**
1. `search_knowledge` 确认二年级加减法范围（不出 20 以上 / 不出乘除）
2. 生成题库（level1-5，共 25 题）
3. `generate_image` 生成卡通图标 URL（奖杯 / 星星 / 角色）
4. `create_file` 输出单文件 HTML：引导页 + 状态机 + 题库 + 阶段守卫 + 反馈系统 + 音效 + 结算页 + Tailwind 扩展色
5. 向用户写玩法说明 → `terminate`

</skill-content>

