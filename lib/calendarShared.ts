// Small calendar helpers shared by the public "shared calendar" page and the
// share dialog (the main calendar keeps its own copies inside its client file).

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// One colour pair per weekday (0 = Monday), same palette as the calendar.
export const TAB_COLORS = [
  { bg: "#F1D2BE", text: "#6B3F24" },
  { bg: "#DFD5EC", text: "#4A3B63" },
  { bg: "#CFE3F2", text: "#1F4E66" },
  { bg: "#F2E2B8", text: "#6B5723" },
  { bg: "#C9E6DD", text: "#295044" },
  { bg: "#D8E7CB", text: "#3B5A2A" },
  { bg: "#F2D6DA", text: "#7A3A44" },
];

export function getMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// "October to December", "October, December" or "March".
export function monthsLabel(months: number[]) {
  const m = [...months].sort((a, b) => a - b);
  if (m.length === 0) return "";
  if (m.length === 1) return MONTH_NAMES[m[0]];
  const consecutive = m.every((v, i) => i === 0 || v === m[i - 1] + 1);
  if (consecutive) return `${MONTH_NAMES[m[0]]} to ${MONTH_NAMES[m[m.length - 1]]}`;
  return m.map((v) => MONTH_NAMES[v]).join(", ");
}
