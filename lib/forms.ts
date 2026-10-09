// Online questionnaires: the shape of a form, and checking what someone sends back.

export type FormItem =
  | { type: "section"; title: string; text?: string }
  // A question with a fixed set of answers and an optional comment box under it.
  | { type: "choice"; id: string; text: string; options: string[]; comment?: string }
  // A question answered in the person's own words.
  | { type: "text"; id: string; text: string; hint?: string; long?: boolean };

export type FormDef = {
  title: string;
  intro: string;
  thanks: string;
  items: FormItem[];
  logoPath?: string; // the home's logo (a file under /public), shown on the PDFs
  brandLines?: string; // address and contact details printed at the foot of the PDFs
};

const MAX_ANSWER = 3000;
const MAX_TOTAL = 60_000;

// Reads the stored JSON back as a clean list of items.
export function cleanItems(value: unknown): FormItem[] {
  if (!Array.isArray(value)) return [];
  const out: FormItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (r.type === "section" && typeof r.title === "string") {
      out.push({ type: "section", title: r.title, text: typeof r.text === "string" ? r.text : undefined });
    } else if (r.type === "choice" && typeof r.id === "string" && typeof r.text === "string" && Array.isArray(r.options)) {
      out.push({
        type: "choice",
        id: r.id,
        text: r.text,
        options: r.options.filter((o): o is string => typeof o === "string"),
        comment: typeof r.comment === "string" ? r.comment : undefined,
      });
    } else if (r.type === "text" && typeof r.id === "string" && typeof r.text === "string") {
      out.push({ type: "text", id: r.id, text: r.text, hint: typeof r.hint === "string" ? r.hint : undefined, long: r.long === true });
    }
  }
  return out;
}

export type Answers = Record<string, string>; // question id -> answer; "<id>:comment" -> comment

// Keeps only answers to real questions, and only allowed choices.
export function cleanAnswers(items: FormItem[], raw: unknown): { answers: Answers } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Nothing was sent." };
  const input = raw as Record<string, unknown>;
  const answers: Answers = {};
  let total = 0;
  const take = (key: string, max: number) => {
    const v = input[key];
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  };
  for (const item of items) {
    if (item.type === "choice") {
      const choice = take(item.id, 200);
      if (choice && item.options.includes(choice)) answers[item.id] = choice;
      const comment = item.comment ? take(`${item.id}:comment`, MAX_ANSWER) : "";
      if (comment) answers[`${item.id}:comment`] = comment;
    } else if (item.type === "text") {
      const text = take(item.id, MAX_ANSWER);
      if (text) answers[item.id] = text;
    }
  }
  for (const v of Object.values(answers)) total += v.length;
  if (total === 0) return { error: "Please answer at least one question before sending." };
  if (total > MAX_TOTAL) return { error: "That's too long to send. Please shorten some answers." };
  return { answers };
}
