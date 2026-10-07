// Emails the site sends: welcome, plan confirmation, password reset.
//
// Sent through Resend (https://resend.com) over plain HTTPS, so there's no
// extra library. If RESEND_API_KEY isn't set, or Resend is down, sending just
// logs and carries on: an email problem must never stop someone signing up,
// paying, or resetting a password in the browser.

const FROM = process.env.EMAIL_FROM ?? "Activity Central <support@activitycentral.co.uk>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "support@activitycentral.co.uk";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://activitycentral.co.uk").replace(/\/$/, "");
}

// Names are typed by customers (e.g. a care home's name), so anything put into
// an email's HTML goes through this first.
function esc(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export async function sendEmail(message: Message): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`Email not sent (RESEND_API_KEY isn't set): "${message.subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        reply_to: message.replyTo ?? REPLY_TO,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.headers ? { headers: message.headers } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Email send failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// The shared look: cream background, the site's green, plain words.
function layout(title: string, bodyHtml: string, footerExtraHtml = "") {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F5F0E4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;border:1px solid #E6DDC8;">
<tr><td style="padding:28px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#657A68;">Activity Central</td></tr>
<tr><td style="padding:8px 32px 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E2B24;">
<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:#2E2B24;">${title}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #E6DDC8;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#8A8371;">
Questions? Just reply to this email or write to <a href="mailto:support@activitycentral.co.uk" style="color:#6D8C6A;">support@activitycentral.co.uk</a>.${footerExtraHtml}
</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:22px 0;"><a href="${href}" style="display:inline-block;background:#8BA888;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;">${label}</a></p>`;
}

export function welcomeEmail(to: string, name: string | null): Message {
  const hello = name ? `Hello ${esc(name)},` : "Hello,";
  const pricing = `${siteUrl()}/pricing`;
  const samples = `${siteUrl()}/#samples`;
  return {
    to,
    subject: "Welcome to Activity Central",
    html: layout(
      "Welcome to Activity Central",
      `<p>${hello}</p>
<p>Thanks for creating your account. There's one step left to unlock the activities: choose a plan.</p>
${button(pricing, "Choose your plan")}
<p>If you'd like another look first, you can <a href="${samples}" style="color:#6D8C6A;">try the free samples</a> on our website any time, no payment needed.</p>`
    ),
    text: `${name ? `Hello ${name},` : "Hello,"}

Thanks for creating your Activity Central account. There's one step left to unlock the activities: choose a plan.

Choose your plan: ${pricing}

If you'd like another look first, try the free samples any time: ${samples}

Questions? Reply to this email or write to support@activitycentral.co.uk.`,
  };
}

export function planConfirmationEmail(to: string, name: string | null, plan: "standard" | "premium" | null): Message {
  const label = plan === "premium" ? "Premium" : plan === "standard" ? "Standard" : null;
  const dashboard = `${siteUrl()}/dashboard`;
  const hello = name ? `Hello ${esc(name)},` : "Hello,";
  const planLine = label ? `You're now on the <b>${label}</b> plan.` : "Your subscription is now active.";
  const detail =
    plan === "premium"
      ? "That includes all 16 categories, large print sheets, the Holidays &amp; Celebrations calendar and playing puzzles and games on screen."
      : plan === "standard"
      ? "That includes 13 of the 16 categories, with every sheet ready to download and print."
      : "";
  return {
    to,
    subject: label ? `You're on the ${label} plan` : "Your Activity Central subscription is active",
    html: layout(
      "Thank you, you're all set",
      `<p>${hello}</p>
<p>${planLine} ${detail}</p>
${button(dashboard, "Go to your activities")}
<p>Stripe, our payment provider, sends your receipt separately. You can change your plan, update your card or cancel any time from the <b>Manage subscription</b> button on your dashboard.</p>`
    ),
    text: `${name ? `Hello ${name},` : "Hello,"}

${label ? `You're now on the ${label} plan.` : "Your subscription is now active."} ${detail.replace(/&amp;/g, "&")}

Go to your activities: ${dashboard}

Stripe, our payment provider, sends your receipt separately. You can change your plan, update your card or cancel any time from the "Manage subscription" button on your dashboard.

Questions? Reply to this email or write to support@activitycentral.co.uk.`,
  };
}

export function passwordResetEmail(to: string, name: string | null, link: string): Message {
  const hello = name ? `Hello ${esc(name)},` : "Hello,";
  return {
    to,
    subject: "Reset your Activity Central password",
    html: layout(
      "Reset your password",
      `<p>${hello}</p>
<p>We got a request to reset the password on this account. Use the button below to choose a new one. The link works once and expires in 1 hour.</p>
${button(link, "Choose a new password")}
<p>If you didn't ask for this, you can ignore this email: your password stays as it is.</p>`
    ),
    text: `${name ? `Hello ${name},` : "Hello,"}

We got a request to reset the password on this account. Use this link to choose a new one. It works once and expires in 1 hour:

${link}

If you didn't ask for this, you can ignore this email: your password stays as it is.

Questions? Reply to this email or write to support@activitycentral.co.uk.`,
  };
}

// Goes to the support inbox, with Reply set to the customer so answering it in
// Gmail goes straight back to them.
export function supportMessageEmail(input: {
  name: string;
  email: string;
  message: string;
  account: string | null;
  kind?: "support" | "suggestion";
}): Message {
  const { name, email, message, account } = input;
  const label = input.kind === "suggestion" ? "Suggestion" : "Support message";
  const accountLine = account ? `Logged-in account: ${account}` : "Not logged in";
  return {
    to: "support@activitycentral.co.uk",
    replyTo: email,
    subject: `${label} from ${name.replace(/[\r\n]+/g, " ")}`,
    html: layout(
      `New ${label.toLowerCase()}`,
      `<p><b>From:</b> ${esc(name)} &lt;${esc(email)}&gt;<br><b>${esc(accountLine)}</b></p>
<p style="white-space:pre-wrap;background:#F5F0E4;border-radius:10px;padding:14px;">${esc(message)}</p>
<p style="font-size:13px;color:#8A8371;">Press Reply to answer ${esc(name)} directly.</p>`
    ),
    text: `From: ${name} <${email}>
${accountLine}

${message}

Press Reply to answer ${name} directly.`,
  };
}

export function unsubscribeUrl(token: string) {
  return `${siteUrl()}/unsubscribe?t=${token}`;
}

// A promotional email (news, new activities, offers) to someone on the mailing
// list. Always carries an unsubscribe link in the footer and the one-click
// unsubscribe headers Gmail and Outlook look for. `bodyHtml` is trusted HTML
// that we write ourselves, never customer-typed text.
export function promotionalEmail(
  contact: { email: string; name: string | null; unsubscribeToken: string },
  subject: string,
  bodyHtml: string,
  bodyText: string
): Message {
  const link = unsubscribeUrl(contact.unsubscribeToken);
  return {
    to: contact.email,
    subject,
    html: layout(
      esc(subject),
      bodyHtml,
      `<br><br>You're getting this because you asked for updates from Activity Central. <a href="${link}" style="color:#6D8C6A;">Unsubscribe</a> any time.`
    ),
    text: `${bodyText}

You're getting this because you asked for updates from Activity Central. Unsubscribe any time: ${link}`,
    headers: {
      "List-Unsubscribe": `<${link}>, <mailto:support@activitycentral.co.uk?subject=Unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

// A completed questionnaire, sent to the home's own address. Every question is
// listed with its answer (or "No answer"), grouped by section.
export function formSubmissionEmail(input: {
  to: string;
  formTitle: string;
  homeName: string | null;
  items: import("@/lib/forms").FormItem[];
  answers: Record<string, string>;
}): Message {
  const { to, formTitle, homeName, items, answers } = input;
  const none = `<span style="color:#8A8371;">No answer</span>`;
  let html = "";
  let text = `${formTitle}${homeName ? ` (${homeName})` : ""}\n`;
  for (const item of items) {
    if (item.type === "section") {
      html += `<h2 style="margin:22px 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:normal;color:#657A68;border-bottom:1px solid #E6DDC8;padding-bottom:4px;">${esc(item.title)}</h2>`;
      text += `\n== ${item.title} ==\n`;
    } else if (item.type === "choice") {
      const answer = answers[item.id];
      const comment = answers[`${item.id}:comment`];
      html += `<p style="margin:10px 0 2px;">${esc(item.text)}</p><p style="margin:0 0 4px;font-weight:bold;">${answer ? esc(answer) : none}</p>`;
      if (comment) html += `<p style="margin:0 0 6px;padding:8px 10px;background:#F5F0E4;border-radius:8px;white-space:pre-wrap;">${esc(comment)}</p>`;
      text += `\n${item.text}\n  ${answer ?? "No answer"}\n`;
      if (comment) text += `  Comment: ${comment}\n`;
    } else {
      const answer = answers[item.id];
      html += `<p style="margin:10px 0 2px;">${esc(item.text)}</p><p style="margin:0 0 6px;${answer ? "padding:8px 10px;background:#F5F0E4;border-radius:8px;white-space:pre-wrap;" : ""}">${answer ? esc(answer) : none}</p>`;
      text += `\n${item.text}\n  ${answer ?? "No answer"}\n`;
    }
  }
  return {
    to,
    subject: `New response: ${formTitle}`,
    html: layout(esc(formTitle), `<p style="margin:0 0 6px;color:#8A8371;">${homeName ? esc(homeName) + " · " : ""}A new response was submitted online.</p>${html}`),
    text,
  };
}
