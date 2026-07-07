# Phase 5c：生成课程游戏

**输入**：`outline.yaml`（含 `game.levels`）+ `assets.yaml`  
**参考**：仓库 `teaching-game-design/v1/SKILL.md`（状态机、关卡、反馈）

## 产物形态

- **单页完整 HTML**（960×540），**不用** `courseware-starter` 多页 Host
- 目录：`pages/<slug>/index.html` + `scorm-api.js` + `imsmanifest.xml`
- ZIP：`bash ../../teaching-page-v2/assets/package-scorm-game.sh pages/<slug>`

## 步骤

1. `Read` `teaching-game-design/v1/SKILL.md` — 状态机、关卡、即时反馈
2. 骨架：[../../teaching-page-v2/templates/game-starter.html](../../teaching-page-v2/templates/game-starter.html)
3. 实现 `outline.game`：
   - 引导 → 游戏主体 → 结算
   - 每关 3–5 题；难度递进
   - 触控目标 ≥ 44px
4. `<script src="./scorm-api.js">` 置于 `</body>` 前
5. 结算页调用 `__cwScormReport`（score、complete、interactions 可选）
6. spec：`product=game; core-loop=...; scorm=2004`
7. 复制 `../../teaching-page-v2/assets/scorm-api.js`；从 [imsmanifest-game.template.xml](../../teaching-page-v2/templates/imsmanifest-game.template.xml) 生成 manifest
8. 打包游戏 ZIP

## 游戏铁律

- 集中状态机（`state` + `phase` 守卫），禁止散落全局布尔
- 每次操作有即时反馈（对/错 + 分数）
- 禁止 emoji；飞象配色见 `feixiang-style.md`

## 下一步

→ [06-deliver.md](06-deliver.md)
