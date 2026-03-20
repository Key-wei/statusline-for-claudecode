import { StdinData, DashboardConfig } from '../types';
import { c, colors, SEP, progressBar } from './colors';

/**
 * Render the context line: [Model + Context%]
 * Example: 🤖 Opus [████░░░░░░ 35%]
 */
export function renderContextLine(data: StdinData, config: DashboardConfig): string | null {
  if (!config.modules.context) return null;

  const parts: string[] = [];

  // Model name
  const model_name = data.model?.display_name || data.model?.api_name || 'Unknown';
  parts.push(c(colors.brightCyan, model_name));

  // Context window progress bar
  const pct = data.context_window?.used_percentage ?? 0;
  const bar = progressBar(pct, config.contextBar.length);
  const pct_str = `${Math.round(pct)}%`;
  parts.push(`${bar} ${c(colors.white, pct_str)}`);

  return parts.join(SEP);
}
