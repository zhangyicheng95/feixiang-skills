# physics-formula-typography Changelog

## 1.4.0 - 2026-06-09

- Added a narrow density legend/range-endpoint rule so static labels such as `1.2 g/cm³` and `8.0 g/cm³` are also MathJax-rendered.

## 1.3.0 - 2026-06-09

- Added a narrow density-readout rule for `g/cm^3` and `kg/m^3` values in sliders, labels, and result badges.
- Added `setDensityValue()` guidance to avoid plain text such as `1.50 g/cm³`.

## 1.2.0 - 2026-06-09

- Added a narrow rule for dynamic measurement labels such as `V1/V2/V3` and `读取 V₁`.
- Clarified that step letters `A/B/C/D` remain normal UI text while adjacent measurement variables must use MathJax.
- Added `setMixedMathText()` guidance for mixed Chinese text plus MathJax variables in dynamic tips.

## 1.1.0 - 2026-06-09

- Clarified the scope boundary: only visible content with physics/math semantics must enter MathJax.
- Added a non-overconstraint rule so ordinary UI labels, answer-option letters, English abbreviations, and CSS/JS identifiers stay as normal text.
- Added `non_overconstraint` to the structured self-check and a source-scan helper for this boundary.

## 1.0.0 - 2026-06-09

- Initial version distilled from the physics formula/font card point in the Feixiang weekly product document.
- Upgraded the teaching-research prompt into an executable Feixiang skill workflow.
- Added hard requirements for the specified MathJax3 CDN, semantic subscript normalization, dynamic MathJax re-typesetting, Canvas/SVG formula handling, and structured self-check output.
