import "server-only";
import { Resend } from "resend";
import type { Email } from "./templates";

const DEFAULT_FROM = "Petal <noreply@petalanalytics.com>";

/** Sends one email through Resend. Throws with a readable message on failure. */
export async function sendEmail(to: string, email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email isn't set up yet (RESEND_API_KEY is missing).");

  const { error } = await new Resend(key).emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) throw new Error(`Couldn't send the email: ${error.message}`);
}
