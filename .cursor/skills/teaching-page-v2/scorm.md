# SCORM 2004 契约（Harness v2）

> 最终交付物是 **`.zip` 压缩包`**（SCORM 2004 4th Edition 单 SCO）。开发目录内保留源文件便于预览。

## 最终产物（上传 LMS）

```
pages/<slug>/<slug>.zip    ← 最终交付
```

ZIP 根目录必须直接包含（**无子文件夹**）：

```
imsmanifest.xml
index.html
scorm-api.js
courseware-shell.js
```

## 开发目录（本地预览 / 调试）

```
pages/<slug>/
├── index.html
├── imsmanifest.xml
├── scorm-api.js
├── courseware-shell.js
└── <slug>.zip              # 打包脚本生成
```

## 打包命令（交付前必跑）

```bash
bash .cursor/skills/teaching-page-v2/assets/package-scorm.sh pages/<slug>
```

或在产出目录内：

```bash
cd pages/<slug>
zip -j <slug>.zip index.html imsmanifest.xml scorm-api.js courseware-shell.js
```

`imsmanifest.xml` 必须在 ZIP **根目录**，LMS 才能识别。

## 课程游戏（单页 SCO）

ZIP 根目录三文件（**无** `courseware-shell.js`）：

```
imsmanifest.xml
index.html
scorm-api.js
```

打包：

```bash
bash .cursor/skills/teaching-page-v2/assets/package-scorm-game.sh pages/<slug>
```

模板：[templates/imsmanifest-game.template.xml](templates/imsmanifest-game.template.xml)

游戏页在结算时直接调用 `__cwScormReport`（`scorm-api.js` 在页面内加载，无 iframe 壳）。

## imsmanifest 占位符

| 占位符 | 说明 |
|--------|------|
| `{{MANIFEST_ID}}` | 唯一 ID，如 `com.example.acid-base` |
| `{{ORG_ID}}` | 组织 ID，如 `ORG_acid-base` |
| `{{ITEM_ID}}` | 条目 ID |
| `{{RES_ID}}` | 资源 ID |
| `{{TITLE}}` | 课件标题（XML 转义） |

模板：[templates/imsmanifest.template.xml](templates/imsmanifest.template.xml)

## Host 必写

```html
<meta name="cw-mastery-score" content="70">
<!-- spec: ...; scorm=2004 -->
<script src="./scorm-api.js"></script>
<script src="./courseware-shell.js"></script>
```

## 壳层 SCORM 行为（courseware-shell.js）

| CMI 元素 | 行为 |
|----------|------|
| `cmi.location` | 当前页 index（0-based） |
| `cmi.suspend_data` | JSON：`index` / `pageStates` / `interactions` / `completed` |
| `cmi.progress_measure` | `(index+1) / pageCount` |
| `cmi.completion_status` | 测验提交 `complete:true` 后为 `completed` |
| `cmi.success_status` | 按 score.raw 与 mastery 或子页 `success` |
| `cmi.score.*` | 子页上报时写入 |
| `cmi.interactions.n.*` | 子页 `scormReport.interactions[]` |

退出：`beforeunload` → `Commit` + `Terminate(suspend)`。

## 子页上报（测验 / 互动必接）

iframe 内已注入 `window.__cwScormReport(payload)`：

```javascript
window.__cwScormReport({
  score: { raw: 80, min: 0, max: 100 },
  complete: true,
  success: 'passed',  // passed | failed | unknown
  interactions: [{
    id: 'q1',
    type: 'choice',       // choice | fill-in | matching | ...
    description: '题干',
    student_response: 'B',
    result: 'correct'     // correct | incorrect | neutral
  }]
});
```

等价于 `postMessage({ type: 'scormReport', ... })`。

## 生成规则

1. **测验页**提交时必须调用 `__cwScormReport`（含 score + complete + interactions）
2. **互动页**至少 `saveState`；完成关键节点可附加 `scormReport`
3. `mastery-score` meta 与及格线一致（默认 70）
4. spec 注释写 `scorm=2004`

## 自检

```
□ <slug>.zip 已生成且根目录含 imsmanifest.xml + 四文件（无嵌套子目录）
□ imsmanifest.xml 四文件 href 与包内文件名一致
□ index.html 先 scorm-api.js 后 courseware-shell.js
□ 测验页有 __cwScormReport 调用
□ 无 LMS 时本地预览仍正常（standalone 降级）
```
