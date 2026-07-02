## 五、 色彩方案配置 (Color Palettes)

> 本文件为 html-authoring 数学子链路专用。按 workflow.md Phase 3 选定的 **1 个编号** 读取对应段落，禁止遍历全部 31 套。
> 各色板中的“背景网格”CSS 只表示装饰性视觉语言和颜色/间距参数。若网格/点阵用于读点、坐标、方格纸、几何画布、拖拽吸附或 3D 地面，必须按 `grid-templates.md` 转为 SVG/Canvas/Three.js 图层，禁止直接使用 CSS `linear-gradient` 背景承担读数或对齐。

**抽选规则（强约束）：**
- 11 套**全部参与抽选**：`A-01, A-02, A-03, A-04, A-05, A-06, A-07, A-08, A-09, A-10, A-11`
- 排序无关：A-01 在第一位**仅是索引**，与命中概率无关；不得因"靠前/熟悉"而偏向；也不得因"被偏向/视觉等价"而避选
- 必须按 workflow.md Phase 3 **优先查表，未命中走 codepoint hash**；推理中显式输出 `keyword / pool / source / palette_id`

### A【活力高饱和】色彩体系，共11种适配于小学阶段知识点（1-6年级），按 Phase 3 机械抽选，禁止主观挑色或固定偏好。
#### A-色彩01- 背景色 (Background): #F3F3F3
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

#### 色彩A-02- 背景色 (Background): #E3E3E3
- 所有字体颜色 (Text): #2F0400
- 主色调 (Primary): #2F0400

- 卡片色彩/样式：
background: #EEEEEE;
border: 1px solid rgba(20, 20, 20, 0.30);
border-radius: 20px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #FF7B50;
border: 3px solid #E13120;
border-radius: 20px;color: #2F0400（按钮上的文字）
02:次要按钮/未选中按钮
background: #EEEEEE;
border: 3px solid #989898;
border-radius: 20px;color: #2F0400（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：background: #EEEEEE;
border: 1px solid #A2A2A2;
border-radius: 20px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#E3E3E3 1px, transparent 1px),
linear-gradient(90deg, #E3E3E3 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #FEFA4C;
border: 5px solid #CD8702;
  02background: rgba(250, 155, 249, 0.90);
border: 5px solid #E93D7E;
  03
background: #FF7B50;
border: 5px solid #C20D0D;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩A-03- 背景色 (Background): #F0F0E2
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

#### 色彩A-04- 背景色 (Background): #F4F4F4
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

#### 色彩A-05- 背景色 (Background): #F4F4F4
- 所有字体颜色 (Text): #000000
- 主色调 (Primary): #05C3FB

- 卡片色彩/样式：
background: #F4F4F4;
border: 1px dashed #000000;
border-radius: 26px;
stroke-dasharray: 12 6;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #05C3FB;
border: 1px dashed #000000;
stroke-dasharray: 12 6;
border-radius: 26px;color: #012103（按钮上的文字）
02:次要按钮/未选中按钮
background: #E4E4E4;
border: 1px dashed #000000;
stroke-dasharray: 12 6;
border-radius: 26px;color: #000000（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：background: #F0E477;
border: 1px dashed #929292;
border-radius: 26px;
stroke-dasharray: 12 6;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#F7D61A 1px, transparent 1px),
linear-gradient(90deg, #F7D61A9 1px, transparent 1px);
background-size: 30px 30px;
stroke-dasharray: 2 2;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #97FA3B;
border: 8px dashed #000000;
border-radius: 4px;
stroke-dasharray: 30 8;
  02
background: #EC4713;
border: 8px dashed #000000;
border-radius: 4px;
stroke-dasharray: 30 8;
  03background: #000000;
border: 8px dashed #000000;
border-radius: 4px;
stroke-dasharray: 30 8;
  04background: #05C3FB;
border: 8px dashed #000000;
border-radius: 4px;
stroke-dasharray: 30 8;
  05background: #F794FF;
border: 8px dashed #000000;
border-radius: 4px;
stroke-dasharray: 30 8;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩A-06- 背景色 (Background): #FDE9E5
- 所有字体颜色 (Text): #3B0303
- 主色调 (Primary): #3B0303
- 高亮强调色（Highlight / Accent）：#FB6D92

- 卡片色彩/样式：
background: #FDE9E5;
border: 1px solid rgba(59, 3, 3, 0.30);
border-radius: 20px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #3B0303;
border: 1px solid rgba(59, 3, 3, 0.30);
border-radius: 20px;color: #FFFFFF（按钮上的文字）
02:次要按钮/未选中按钮
background: #FEEDEA;
border: 2px solid rgba(0, 0, 0, 0.30);
border-radius: 20px;color: #3B0303（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #FFF9F9;
border: 1px solid rgba(59, 3, 3, 0.30);
border-radius: 20px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#F1E7E7 1px, transparent 1px),
linear-gradient(90deg, #F1E7E7 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: rgba(251, 102, 140, 0.95);
border: 4px solid #FF466C;
  02background: rgba(9, 122, 53, 0.95);
border: 4px solid #054A20;
  03
background: rgba(229, 82, 39, 0.95);
border: 4px solid #761F05;
  04
background: rgba(249, 179, 22, 0.95);
border: 4px solid #B78106;
  05
background: rgba(13, 129, 185, 0.95);
border: 4px solid #0B4A69;
  06
background: rgba(251, 251, 254, 0.90);
border: 4px solid #02543B;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩A-07- 背景色 (Background): #AFE680
- 所有字体颜色 (Text): #000000
- 主色调 (Primary): #AFE680

- 卡片色彩/样式：
background: #AFE680;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 26px;

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #1D3209;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 26px;color: #FFFFFF（按钮上的文字）
02:次要按钮/未选中按钮
background: #FFFEF8;
border: 1px solid rgba(0, 0, 0, 0.30);
border-radius: 26px;color: #000000（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #FFFFFF;
border: 1px solid #CBFC83;
border-radius: 26px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#EDEDED 1px, transparent 1px),
linear-gradient(90deg, #EDEDED 1px, transparent 1px);
background-size: 20px 20px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #8FE93B;
border: 2px solid #000000;
  02background: #AFE680;
border: 2px solid #000000;
  03
background: #FF69CF;
border: 2px solid #000000;
  04
background: #53FFF4;
border: 2px solid #000000;
  05
background: #FFF059;
border: 2px solid #000000;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比配色 极简教育可视化 无阴影平涂 结构拆解教学

#### 色彩A-08- 背景色 (Background): #27644D
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

#### 色彩A-09- 背景色 (Background): #E0E0E0
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


#### 色彩A-10- 背景色 (Background): #FFF3D9
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
B-
#### 色彩A-11- 背景色 (Background): #E9D9BD
- 所有字体颜色 (Text): #251310
- 主色调 (Primary): #ED7D4B

- 卡片色彩/样式：除了图示区域外。尽量减少在卡片里展示内容，直接在背景上进行排版展示。

- 按钮色彩/样式：（严格按照要求）
01:核心按钮
background: #ED7D4B;
border: 1px solid #251310;
border-radius: 20px;color: #251310（按钮上的文字）
02:次要按钮/未选中按钮
background: #F8F3EA;
border: 1px solid #251310;
border-radius: 20px;color: #251310（按钮上的文字）
- 知识点演示区色彩/样式：01:演示区域背景：背景色 (Background): background: #F8F3EA;
border: 1px solid rgba(37, 19, 16, 0.30);
border-radius: 26px;
背景网格：（注意是作为图形/公式/模型等所有主要信息的背景）
linear-gradient(#EEE2DC 1px, transparent 1px),
linear-gradient(90deg, #EEE2DC 1px, transparent 1px);
background-size: 30px 30px;02:知识演示区域色彩（3d/图形/图表/几何等演示必须要用到以下100%的颜色，重要：避免因光照不足而显得过暗或不清晰的问题。确保色彩还原更加鲜艳、真实。）
  01background: #ED7D4B;
border: 2px solid #B73E09;
  02background: #4189CC;
border: 2px solid #153B5F;
  03
background: #386250;
border: 2px solid #22372E;
  04
background: #251310;
border: 1px solid #0E0605;
- 设计关键词 / 标签：如果用户有建模需求，使用【极简、几何风格、干净、块面感、低细节】处理，如果没有则忽略。
标签：高对比低饱和配色 极简教育可视化 无阴影平涂 结构拆解教学

-
