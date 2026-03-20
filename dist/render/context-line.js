"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContextLine = renderContextLine;
const colors_1 = require("./colors");
/**
 * Render the context line: [Model + Context%]
 * Example: 🤖 Opus [████░░░░░░ 35%]
 */
function renderContextLine(data, config) {
    if (!config.modules.context)
        return null;
    const parts = [];
    // Model name
    const model_name = data.model?.display_name || data.model?.api_name || 'Unknown';
    parts.push((0, colors_1.c)(colors_1.colors.brightCyan, model_name));
    // Context window progress bar
    const pct = data.context_window?.used_percentage ?? 0;
    const bar = (0, colors_1.progressBar)(pct, config.contextBar.length);
    const pct_str = `${Math.round(pct)}%`;
    parts.push(`${bar} ${(0, colors_1.c)(colors_1.colors.white, pct_str)}`);
    return parts.join(colors_1.SEP);
}
