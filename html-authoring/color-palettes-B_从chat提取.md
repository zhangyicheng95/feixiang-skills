### B【智性低饱和】色彩体系，适配于初中及高中阶段知识点（7-12年级）

> 各色板中的“背景网格/演示区背景网格/卡片网格”CSS 只表示装饰性视觉语言和颜色/间距参数。若网格/点阵用于读点、坐标、方格纸、几何画布、拖拽吸附或 3D 地面，必须按 `grid-templates.md` 转为 SVG/Canvas/Three.js 图层，禁止直接使用 CSS `linear-gradient` 背景承担读数或对齐。

**抽选规则（强约束）：**
- 20 套**全部参与抽选**：`B-01 ~ B-20`
- 排序无关：B-12 出现在中段**仅是索引**，与命中概率无关；不得因"灰底黄按钮稳妥/常见"而偏向，也不得为"求变"而强行避选
- 必须按 workflow.md Phase 3 **优先查表，未命中走 codepoint hash**；禁止"分析知识点适合哪个颜色"式的主观选色

#### 色彩B-01（低饱和 单色）- 背景色 (Background): #DCDCDC
- 背景网格 (Background): 
linear-gradient(#C1C1C1 1px, transparent 1px),
linear-gradient(90deg, #C1C1C1 1px, transparent 1px);
background-size: 30px 30px;
- 所有字体颜色 (Text): #000000
- 主色调 (Primary): #E81C2B #E81C2B
- 高亮强调色（Highlight / Accent）：#E81C2B
- 卡片色彩/样式：background: #F1F1F1;
border: 1px solid rgba(0, 0, 0, 0.40);border-radius: 0;

- 按钮色彩/样式：
01:核心按钮
background: #000000;
border: 1px solid rgba(0, 0, 0, 0.40);color: #FFFFFF（按钮上白色文字）
02:次要按钮/未选中按钮
background: #F1F1F1;
border: 1px solid rgba(0, 0, 0, 0.40);color: #000000（按钮上黑色文字）
- 知识点演示色彩/样式：（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）主模型（几何体）
background: rgba(249, 250, 252, 0.95);
border: 2px solid #8B9094;- 设计关键词 / 标签：Low-Poly Wireframe Triangulated Mesh 线框拓扑 几何骨架 低多边形建模 科技感几何表现

#### 色彩B-02- 背景色 (Background): #E2ECD3
- 所有字体颜色 (Text): #012B1F
- 主色调 (Primary): #405E28
- 高亮强调色（Highlight / Accent）：#B5FF8B
- 卡片色彩/样式：background: #E2ECD3;
border: 1px solid rgba(1, 43, 31, 0.30);border-radius: 8px;

- 按钮色彩/样式：
01:核心按钮
background: #405E28;
border: 1px solid rgba(1, 43, 31, 0.30);border-radius: 8px;color: #E2ECD3（按钮上的文字）
02:次要按钮/未选中按钮
background: #F7FDF6;
border: 1px solid rgba(1, 43, 31, 0.30);border-radius: 8px;color: #012B1F（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): #F7FDF6，border: 1px solid rgba(0, 0, 0, 0.30)
border-radius: 8px;
背景网格：
linear-gradient(#ECF1E6 1px, transparent 1px),
linear-gradient(90deg, #ECF1E6 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #B5FF8B;
border: 2px solid #168D76;
  02background: #549B22;
border: 2px solid #1C402A;  03background: #405E28;
border: 2px solid #001912;- 设计关键词 / 标签：如果需要建模，使用【极简、几何风格、干净、块面感、低细节】处理，暖米教育风 扁平伪3D几何体 结构拆解交互课件 数学可视化UI 低干扰教学界面 过程化交互演示

#### 色彩B-03- 背景色 (Background): #E4DEBD
- 所有字体颜色 (Text): #3A1D09
- 主色调 (Primary): #3A1D09

- 卡片色彩/样式：除了图示区域外。尽量减少在卡片里展示内容，直接在背景上进行排版展示。

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #3A1D09;
border: 1px solid #3A1D09;
border-radius: 20px;color: #E4DEBD（按钮上的文字）
02:次要按钮/未选中按钮
background: #E4DEBD;
border: 1px solid #3A1D09;
border-radius: 20px;color: #3A1D09（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #E4DEBD;
border: 2px solid rgba(58, 29, 9, 0.30);
border-radius: 26px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#DDCDAA 1px, transparent 1px),
linear-gradient(90deg, #DDCDAA 1px, transparent 1px);
background-size: 20px 20px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #E3B66F;
border: 2px solid #B47E2B;
  02background: #724919;
border: 2px solid #493317;
  03
background: #B38248;
border: 2px solid #7B572E;
  04
background: #3A1D09;
border: 1px solid #291512;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩04- 背景色 (Background): #F4F0E9
- 所有字体颜色 (Text): #53241E
- 主色调 (Primary): #E3B15D
- 高亮强调色（Highlight / Accent）：#FE721E
- 卡片色彩/样式：background: #F4EDDD;
border: 1px solid #966716;
border-radius: 8px;
- 卡片网格 (Background): 
linear-gradient(#ECDFC2 1px, transparent 1px),
linear-gradient(90deg, #ECDFC2 1px, transparent 1px);

- 按钮色彩/样式：
01:核心按钮
background: #E3B15D;
border: 1px solid #966716;
border-radius: 8px;color: #53241E（按钮上的文字）
02:次要按钮/未选中按钮
background: #F4EDDD;
border: 1px solid #966716;
border-radius: 8px;color: #53241E（按钮上的文字）
02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）色彩1#FE721E色彩2#E3B15D色彩353241E- 设计关键词 / 标签：暖棕米色调 低饱和度配色 极简几何 复古数学风 学术风 柔和无阴影 单色描边 高对比度文字

#### 色彩B-05- 背景色 (Background): #FFF3D9
- 所有字体颜色 (Text): #000000
- 主色调 (Primary): #F8981F
- 卡片色彩/样式：background: #FFFFFF;
border: 1px solid rgba(0, 0, 0, 0.30);border-radius: 0;

- 按钮色彩/样式：
01:核心按钮
background: #F8981F;
border: 1px solid rgba(0, 0, 0, 0.30);color: #000000（按钮上的文字）
02:次要按钮/未选中按钮
background: #FFF6E3;
border: 1px solid rgba(0, 0, 0, 0.30);color: #000000（按钮上的文字）
- 知识点演示区色彩/样式：
01:演示区域背景：背景色 (Background): #FFFFFF，border: 1px solid rgba(0, 0, 0, 0.30);
背景网格：
linear-gradient(#ECECEC 1px, transparent 1px),
linear-gradient(90deg, #ECECEC 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: rgba(255, 232, 181, 0.95);
border: 2px solid #9D1700;
  02background: rgba(94, 126, 180, 0.95);
border: 2px solid #31415C;  03background: rgba(248, 152, 31, 0.95);
border: 2px solid #9D3E00;
  04
background: rgba(61, 51, 52, 0.95);
border: 1px solid #0D0705;  05
background: rgba(166, 207, 239, 0.95);
border: 2px solid #2782C9;- 设计关键词 / 标签：如果需要建模，使用【极简、几何风格、干净、块面感、低细节】处理，暖米教育风 扁平伪3D几何体 结构拆解交互课件 数学可视化UI 低干扰教学界面 过程化交互演示

#### 色彩B-06- 背景色 (Background): #02211C
- 所有字体颜色 (Text): #A4D7C4
- 主色调 (Primary): #A4D7C4
- 高亮强调色（Highlight / Accent）：#B694F8
- 卡片色彩/样式：background: #02211C;
border: 1px solid rgba(44, 103, 81, 0.50);
border-radius: 0px;

- 按钮色彩/样式：
01:核心按钮
background: #A4D7C4;
border: 1px solid rgba(44, 103, 81, 0.50);
border-radius: 0px;color: #02211C（按钮上的文字）
02:次要按钮/未选中按钮
background: #0D2E25;
border: 1px solid rgba(44, 103, 81, 0.50);
border-radius: 0px;color: #A4D7C4（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #16493A;
border: 1px solid rgba(15, 35, 54, 0.30);
border-radius: 0x;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#2C6751 1px, transparent 1px),
linear-gradient(90deg, #2C6751 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01（如果是用于建模，作为定面色彩，如果不是建模就忽略）background: rgba(36, 164, 116, 0.90);
border: 1px solid #B1EFC7;
  02background: #B694F8;
border: 1px solid #8A55F2;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-07- 背景色 (Background): #0F302F
- 所有字体颜色 (Text): #EEFFEB
- 主色调 (Primary): #06B17A
- 高亮强调色（Highlight / Accent）：#B6FCE5
- 信息强调色：#E44B40（用于文字内容/高亮线，不要大面积使用）
- 卡片色彩/样式：background: #0F302F;
border: 1px solid rgba(238, 255, 235, 0.30);
border-radius: 0px;

- 按钮色彩/样式：
01:核心按钮
background: #06B17A;
border: 1px solid rgba(238, 255, 235, 0.30);
border-radius: 0px;color: #FFFFFF（按钮上的文字）
02:次要按钮/未选中按钮
background: #184C49;
border: 1px solid rgba(238, 255, 235, 0.30);
border-radius: 0px;color: #EEFFEB（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #123A37;
border: 1px solid #526F68;
border-radius: 0x;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#164441 1px, transparent 1px),
linear-gradient(90deg, #164441 1px, transparent 1px);
background-size: 15px 15px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01（如果是用于建模，作为定面色彩，如果不是建模就忽略）background: #06B17A;
border: 2px solid #06B17A;
  02background: #B6FCE5;
border: 2px solid #06B17A;
  03
background: #EEFFEB;
border: 2px solid #06B17A;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有建模需求则忽略。
标签：高对比低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-08- 背景色 (Background): #FFFFFF
- 所有字体颜色 (Text): #00404D
- 主色调 (Primary): #00404D
- 卡片色彩/样式：background: #D3F6F4;
border: 1px solid rgba(0, 64, 77, 0.30);
border-radius: 0px;

- 按钮色彩/样式：
01:核心按钮
background: #00404D;
border: 1px solid rgba(0, 64, 77, 0.30);
border-radius: 0px;color: #FFFFFF（按钮上的文字）
02:次要按钮/未选中按钮
background: #ECFCFB;
border: 1px solid rgba(0, 64, 77, 0.30);
border-radius: 0px;color: #00404D（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #D3F6F4;
border: 1px solid #93BFC2;
border-radius: 0x;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#DBF1F0 1px, transparent 1px),
linear-gradient(90deg, #DBF1F0 1px, transparent 1px);
background-size: 15px 15px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: rgba(53, 233, 254, 0.95);
border: 2px solid #137F8B;
  02background: rgba(223, 144, 18, 0.95);
border: 2px solid #513810;
  03（如果是用于建模，作为暗面色彩，如果不是建模就忽略）
background: #00404D;
border: 2px solid #00191E;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有建模需求则忽略。
标签：高对比低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-09- 背景色 (Background): #E8E8E8
- 所有字体颜色 (Text): #431504
- 主色调 (Primary): #F55A42

- 卡片色彩/样式：
background: #E8E8E8;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 10px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #F55A42;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 10px;color: #431504（按钮上的文字）
02:次要按钮/未选中按钮
background: #DBDBDB;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 10px;color: #00344C（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #CBCBCB;
border: 1px solid #A2A2A2;
border-radius: 10px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#C5BFBF 1px, transparent 1px),
linear-gradient(90deg, #C5BFBF 1px, transparent 1px);
background-size: 20px 20px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #F55A42;
border: 2px solid #AC3914;
  02background: #FCD465;
border: 2px solid #9D3E00;
  03
background: #431504;
border: 1px solid #26140D;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-10- 背景色 (Background): #EBEAE5
- 所有字体颜色 (Text): #213B2A
- 主色调 (Primary): #388E56
- 高亮强调色（Highlight / Accent）：#EC725C
- 卡片色彩/样式：background: #EBEAE5;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;

- 按钮色彩/样式：
01:核心按钮
background: #265737;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;color: #FBFBFA（按钮上的文字）
02:次要按钮/未选中按钮
background: #FBFBFA;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;color: #213B2A（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #F5F5F2;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#E9EAE6 1px, transparent 1px),
linear-gradient(90deg, #E9EAE6 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #388E56;
border: 2px solid #19201B;
  02background: #EC725C;
border: 2px solid #54241B;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学


#### 色彩B-11- 背景色 (Background): #EBEAE5
- 所有字体颜色 (Text): #213B2A
- 主色调 (Primary): #388E56
- 高亮强调色（Highlight / Accent）：#EC725C
- 卡片色彩/样式：background: #EBEAE5;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;

- 按钮色彩/样式：
01:核心按钮
background: #265737;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;color: #FBFBFA（按钮上的文字）
02:次要按钮/未选中按钮
background: #FBFBFA;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;color: #213B2A（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #F5F5F2;
border: 1px solid rgba(1, 43, 31, 0.30);
border-radius: 10px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#E9EAE6 1px, transparent 1px),
linear-gradient(90deg, #E9EAE6 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #388E56;
border: 2px solid #19201B;
  02background: #EC725C;
border: 2px solid #54241B;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-12- 背景色 (Background): #F3F3F3
- 所有字体颜色 (Text): #000000
- 主色调 (Primary): #FFDF5E

- 卡片色彩/样式：
background: #F3F3F3;
border: 4px solid rgba(0, 0, 0, 0.30);
border-radius: 20px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #FFDF5E;
border: 4px solid #DDB103;
border-radius: 20px;color: #000000（按钮上的文字）
02:次要按钮/未选中按钮
background: #FFFFFF;
border: 4px solid #E2E2E2;
border-radius: 20px;color: #000000（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #EBEBEB;
border: 4px solid #E3E3E3;
border-radius: 20px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#E0E0E0 1px, transparent 1px),
linear-gradient(90deg, #DADADA 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #FFDF5E;
border: 6px solid #DDB103;
  02background: #FD6638;
border: 6px solid #DE3602;
  03
background: #FF9999;
border: 6px solid #FF7B7B;
  04
background: #9A5000;
border: 6px solid #6F3A00;
  05
background: #81E569;
border: 6px solid #43C419;
  06
background: #198AEC;
border: 6px solid #066DC7;
  07
background: #02543B;
border: 6px solid #023223;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-13- 背景色 (Background): #F0F0E2
- 所有字体颜色 (Text): #012419
- 主色调 (Primary): #D7F324

- 卡片色彩/样式：
background: #F0F0E2;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 20px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #012419
border: 1px solid #012419;
border-radius: 20px;color: #D7F324（按钮上的文字）
02:次要按钮/未选中按钮
background: #FFFFFF;
border: 1px solid #012419;
border-radius: 20px;color: #012419（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #E6E9D5;
border: 1px solid rgba(1, 36, 25, 0.30);
border-radius: 20px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#CBD0C8 1px, transparent 1px),
linear-gradient(90deg, #CBD0C8 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #D7F324;
border: 2px solid #759119;
border-radius: 2px;
  02background: #33FCB4;
border: 2px solid #118D7E;
border-radius: 2px;
  03
background: #4C28B1;
border: 2px solid #2D1066;
border-radius: 2px;
  04
background: #3F4E15;
border: 2px solid #203202;
border-radius: 2px;
  05
background: #D947F2;
border: 2px solid #7A1957;
border-radius: 2px;
  06
background: #012419;
border: 2px solid #3F2C02;
border-radius: 2px;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-14- 背景色 (Background): #27644D
- 所有字体颜色 (Text): #F
- 主色调 (Primary): #6AFA77

- 卡片色彩/样式：
background: #27644D;
border: 1px solid rgba(255, 255, 255, 0.30);
border-radius: 26px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #6AFA77;
border: 1px solid rgba(255, 255, 255, 0.30);
border-radius: 26px;color: #1B4535（按钮上的文字）
02:次要按钮/未选中按钮
background: #1B4535;
border: 1px solid rgba(255, 255, 255, 0.30);
border-radius: 26px;color: #FFFFFF（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #EBEDD4;
border: 1px solid #689383;
border-radius: 26px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#DDE3CA 1px, transparent 1px),
linear-gradient(90deg, #DDE3CA 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: rgba(106, 250, 119, 0.95);
border: 3px solid #438B66;
border-radius: 2px;
  02background: #B292FA;
border: 3px solid #5925CF;
border-radius: 2px;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩色彩B-15- 背景色 (Background): #000000
- 所有字体颜色 (Text): #FFFFFF
- 主色调 (Primary): #F8EF50

- 卡片色彩/样式：
background: #232323;
border: 1px solid rgba(188, 227, 223, 0.30);
border-radius: 26px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #F8EF50;
border: 1px solid #414141;
border-radius: 20px;color: #000000（按钮上的文字）
02:次要按钮/未选中按钮
background: #414141;
border: 1px solid #B7B7B7;
border-radius: 20px;color: #FFFFFF（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #232323;
border: 1px solid rgba(188, 227, 223, 0.30);
border-radius: 26px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#393939 1px, transparent 1px),
linear-gradient(90deg, #393939 1px, transparent 1px);
background-size: 20px 20px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #F672AD;
border: 3px solid #000000;
  02background: #F8EF50;
border: 3px solid #000000;
  03
background: #03DEDE;
border: 3px solid #000000;
  04
background: #0C773B;
border: 3px solid #000000;
  05
background: #F05C35;
border: 3px solid #000000;
  06
background: #6AFA77;
border: 3px solid #000000;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-16- 背景色 (Background): #003830
- 所有字体颜色 (Text): #DDF1EF
- 主色调 (Primary): #89E593

- 卡片色彩/样式：
background: #003830;
border: 1px solid rgba(188, 227, 223, 0.30);
border-radius: 26px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #89E593;
border: 4px solid #39B446;
border-radius: 26px;color: #003830（按钮上的文字）
02:次要按钮/未选中按钮
background: #006F48;
border: 4px solid #003830;
border-radius: 26px;color: #DDF1EF（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #00241C;
border: 1px solid rgba(188, 227, 223, 0.30);
border-radius: 26px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#163831 1px, transparent 1px),
linear-gradient(90deg, #163831 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #89E593;
border: 4px solid #39B446;
border-radius: 2px;
  02background: #FFD1DB;
border: 2px solid #FB8BA3;
border-radius: 2px;
  03
background: #5CB5F5;
border: 4px solid #1A618B;
border-radius: 2px;
  04
background: #CE8927;
border: 4px solid #855614;
border-radius: 2px;
  05
background: #FFDF5E;
border: 4px solid #EEB40E;
border-radius: 2px;
  06
background: #005034;
border: 4px solid #004037;
border-radius: 2px;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-17- 背景色 (Background): #F4F4F4
- 所有字体颜色 (Text): #012103
- 主色调 (Primary): #FF6A18

- 卡片色彩/样式：
background: #F4F4F4;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 26px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #FF6A18;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 26px;color: #012103（按钮上的文字）
02:次要按钮/未选中按钮
background: #DADADA;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 26px;color: #012103（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：background: #158A60;
border: 1px solid #789079;
border-radius: 26px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#148259 1px, transparent 1px),
linear-gradient(90deg, #148259 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #FFEF5A;
border: 3px solid #9A6E02;
  02background: #FF6A18;
border: 3px solid #7A2B00;
  03
background: #95A6FE;
border: 3px solid #4D4CD4;
  04
background: #FFC4CB;
border: 3px solid #DA606F;
  05
background: #00D588;
border: 3px solid #026044;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-18- 背景色 (Background): #201515
- 所有字体颜色 (Text): #FFFBED
- 主色调 (Primary): #F96524
- 卡片色彩/样式：background: #201515;
border: 1px solid rgba(255, 251, 237, 0.30);
border-radius: 10px;

- 按钮色彩/样式：
01:核心按钮
background: #F96524;
border: 1px solid rgba(255, 251, 237, 0.30);
border-radius: 10px;color: #1C252E（按钮上的文字）
02:次要按钮/未选中按钮
background: #422D2D;
border: 1px solid rgba(255, 251, 237, 0.30);
border-radius: 10px;color: #FFFBED（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #2A1C1C;
border: 1px solid #635A56;
border-radius: 10px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#392C2B 1px, transparent 1px),
linear-gradient(90deg, #392C2B 1px, transparent 1px);
background-size: 15px 15px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: rgba(53, 233, 254, 0.95);
border: 2px solid #137F8B;
  02background: rgba(223, 144, 18, 0.95);
border: 2px solid #513810;
  03（如果是用于建模，作为暗面色彩，如果不是建模就忽略）
background: #00404D;
border: 2px solid #00191E;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有建模需求则忽略。
标签：高对比低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-19- 背景色 (Background): #E0E0E0
- 所有字体颜色 (Text): #000000
- 主色调 (Primary): #B997F8

- 卡片色彩/样式：
background: #E0E0E0;
border: 1px solid rgba(20, 20, 20, 0.30);

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #B997F8;
border: 1px solid rgba(20, 20, 20, 0.30);
border-radius: 0px;color: #000000（按钮上的文字）
02:次要按钮/未选中按钮
background: #FBFBFA;
border: 1px solid rgba(20, 20, 20, 0.30);
border-radius: 0px;color: #000000（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #FCFCFC;
border: 1px solid #A2A2A2;
border-radius: 0px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#EAEAEA 1px, transparent 1px),
linear-gradient(90deg, #EAEAEA 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #FFE36C;
border: 1px solid #26140D;
  02background: #B997F8;
border: 2px solid #5F37A8;
  03
background: #5C2B1A;
border: 1px solid #26140D;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩B-20- 背景色 (Background): #DFEDFF
- 所有字体颜色 (Text): #000000
- 主色调 (Primary): #278DEA
- 高亮强调色（Highlight / Accent）：#83FE91
- 卡片色彩/样式：除了图示区域外。尽量减少在卡片里展示内容，直接在背景上进行排版展示。

- 按钮色彩/样式：
01:核心按钮
background: #83FE91;
border: 1px solid #000000;
border-radius: 20px;color: #232323（按钮上的文字）
02:次要按钮/未选中按钮
background: #DFEDFF;
border: 1px solid #000000;
border-radius: 20px;color: #000000（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：演示区背景色 (Background): background: #FFFFFF;
border: 1px solid rgba(15, 35, 54, 0.30);
border-radius: 20px;
演示区背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#F1F5FB 1px, transparent 1px),
linear-gradient(90deg, #F1F5FB 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #83FE91;
border: 2px solid #40A10B;
  02background: #278DEA;
border: 2px solid #27609F;  03background: #DFEDFF;
border: 2px solid #84B8FB;
  04（如果是用于建模，作为底面色彩）background: #232323;
border: 1px solid #9FA3B2;
- 设计关键词 / 标签：如果需要建模，使用【极简、几何风格、干净、块面感、低细节】处理，莫兰迪绿调教育风 扁平伪3D几何体 低干扰数学可视化 结构拆解交互课件 同色系极简UI 学术感矢量几何表现

---


(End of file - total 707 lines)