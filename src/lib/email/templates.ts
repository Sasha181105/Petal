// Petal's emails: one layout, three messages. Email-safe HTML (tables, inline
// styles, system fonts) so they look the same in Gmail, Outlook and on phones.

export type Email = { subject: string; html: string; text: string };

/** Anything user-typed (shop names, emails) is escaped before going into HTML. */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Helvetica,Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";

function layout(o: {
  eyebrow: string;
  heading: string; // already-safe HTML
  body: string; // already-safe HTML
  button: string;
  link: string;
  expiry: string;
  footer: string;
}): string {
  const link = esc(o.link);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f4efe6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4efe6;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
  <tr><td style="padding:0 4px 20px;font-family:${SERIF};font-style:italic;font-size:28px;line-height:1;color:#2f2a24;">Petal <span style="font-family:${MONO};font-style:normal;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6f6558;">&nbsp; waste ledger</span></td></tr>
  <tr><td style="background:#ffffff;border-top:2px solid #2f2a24;padding:36px 32px 32px;">
    <p style="margin:0 0 12px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6f6558;">${o.eyebrow}</p>
    <h1 style="margin:0;font-family:${SERIF};font-weight:normal;font-size:34px;line-height:1.15;color:#2f2a24;">${o.heading}</h1>
    ${o.body}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>
      <td align="center" bgcolor="#3f5a3c" style="border-radius:999px;">
        <a href="${link}" target="_blank" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:16px;font-weight:bold;color:#f4efe6;text-decoration:none;border-radius:999px;">${o.button} &rarr;</a>
      </td></tr></table>
    <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e6dccb;font-family:${SANS};font-size:13px;line-height:1.6;color:#6f6558;">
      ${o.expiry} If the button doesn't open, copy this address into your browser:<br>
      <a href="${link}" style="color:#3f5a3c;word-break:break-all;">${link}</a>
    </p>
  </td></tr>
  <tr><td style="padding:20px 4px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#6f6558;">${o.footer}</td></tr>
  <tr><td style="padding:12px 4px 0;font-family:${MONO};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a8f7f;">Petal &middot; a waste ledger for florists</td></tr>
</table></td></tr></table>
</body></html>`;
}

const p = (html: string, small = false) =>
  `<p style="margin:${small ? "12px" : "20px"} 0 0;font-family:${SANS};font-size:${small ? 14 : 16}px;line-height:1.6;color:${small ? "#6f6558" : "#4a443b"};">${html}</p>`;
const strong = (s: string) => `<strong style="color:#2f2a24;">${esc(s)}</strong>`;
const rose = (s: string) => `<em style="color:#9a5b58;">${s}</em>`;

/** Manager sign-up: confirm the address, then the shop opens. */
export function confirmSignupEmail(o: { link: string; email: string; shopName: string }): Email {
  return {
    subject: `Confirm your email to open ${o.shopName} on Petal`,
    html: layout({
      eyebrow: "One last step",
      heading: `Your shop is ${rose("almost ready.")}`,
      body: p(`Confirm that ${strong(o.email)} is yours and we'll open ${strong(o.shopName)} on Petal, with you as its manager.`),
      button: "Confirm and open my shop",
      link: o.link,
      expiry: "The link works once and expires in 24 hours.",
      footer: "Didn't sign up? Ignore this email and no account will be opened.",
    }),
    text: `Confirm your email to open ${o.shopName} on Petal:\n${o.link}\n\nThe link works once and expires in 24 hours. Didn't sign up? Ignore this email.`,
  };
}

/** A manager added someone to their shop. */
export function inviteEmail(o: { link: string; email: string; shopName: string }): Email {
  return {
    subject: `Join ${o.shopName} on Petal`,
    html: layout({
      eyebrow: "An invitation",
      heading: `You're invited to ${rose(`${esc(o.shopName)}.`)}`,
      body:
        p("The shop uses Petal to note the flowers that end up in the bin, so at the end of the week everyone knows what waste really cost. Choose a password and you're in.") +
        p(`You'll sign in as ${strong(o.email)}.`, true),
      button: "Choose my password",
      link: o.link,
      expiry: "The link works once and expires in 24 hours.",
      footer: "Not expecting this? You can ignore this email; nothing happens unless you choose a password.",
    }),
    text: `You're invited to ${o.shopName} on Petal. Choose a password here:\n${o.link}\n\nYou'll sign in as ${o.email}. The link works once and expires in 24 hours.`,
  };
}

/** "Forgot password". */
export function resetPasswordEmail(o: { link: string; email: string }): Email {
  return {
    subject: "Your link to a new Petal password",
    html: layout({
      eyebrow: "Password reset",
      heading: `A new ${rose("password.")}`,
      body: p(`Someone asked to reset the Petal password for ${strong(o.email)}. If that was you, choose a new one below.`),
      button: "Choose a new password",
      link: o.link,
      expiry: "The link works once and expires in an hour.",
      footer: "Didn't ask for this? Ignore this email. Your password stays the same.",
    }),
    text: `Choose a new Petal password for ${o.email}:\n${o.link}\n\nThe link works once and expires in an hour. Didn't ask for this? Ignore this email.`,
  };
}
