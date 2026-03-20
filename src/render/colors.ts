// ANSI color helpers

const ESC = '\x1b[';

export const colors = {
  reset: `${ESC}0m`,

  // Foreground
  gray: `${ESC}90m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  brightWhite: `${ESC}97m`,
  brightCyan: `${ESC}96m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightRed: `${ESC}91m`,

  // Bold
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
};

export function c(color: string, text: string): string {
  return `${color}${text}${colors.reset}`;
}

/** Separator character */
export const SEP = c(colors.gray, ' │ ');

/**
 * Render a progress bar.
 * @param pct  Percentage 0-100
 * @param len  Total bar length in characters
 */
export function progressBar(pct: number, len: number): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * len);
  const empty = len - filled;

  let fill_color = colors.green;
  if (clamped > 80) fill_color = colors.red;
  else if (clamped > 60) fill_color = colors.yellow;

  const bar = `${fill_color}${'█'.repeat(filled)}${colors.gray}${'░'.repeat(empty)}${colors.reset}`;
  return bar;
}
