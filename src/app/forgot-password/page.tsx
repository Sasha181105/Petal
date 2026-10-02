import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { ForgotForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 md:px-10">
      <header className="border-b border-hairline py-5">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
        <h1 className="font-serif text-5xl leading-none md:text-6xl">
          Forgot your <em className="text-rose-deep">password?</em>
        </h1>
        <p className="mt-4 text-soil-soft">
          Enter the email you sign in with. We&apos;ll send a link to choose a new password.
        </p>
        <ForgotForm />
        <Link
          href="/login"
          className="mt-8 self-start text-sm underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-moss"
        >
          ← Back to sign in
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
