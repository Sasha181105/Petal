import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "./new-password-form";

/** Reached from an email link (/auth/confirm signs you in first). */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");
  const welcome = (await searchParams).welcome === "1";

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 md:px-10">
      <header className="border-b border-hairline py-5">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
        <h1 className="font-serif text-5xl leading-none md:text-6xl">
          {welcome ? (
            <>
              Welcome to <em className="text-rose-deep">Petal.</em>
            </>
          ) : (
            <>
              A new <em className="text-rose-deep">password.</em>
            </>
          )}
        </h1>
        <p className="mt-4 text-soil-soft">
          {welcome
            ? `You've been added to the shop. Choose a password for ${user.email}, and you're in.`
            : `Choose a new password for ${user.email}.`}
        </p>
        <NewPasswordForm cta={welcome ? "Set password and start" : "Save new password"} />
      </main>
      <SiteFooter />
    </div>
  );
}
