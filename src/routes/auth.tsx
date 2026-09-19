import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { signInSchema, signUpSchema } from "@/lib/validation";
import { toSafeError } from "@/lib/errors";
import { homeForRole } from "@/lib/navigation";
import { fetchSession } from "@/hooks/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to TestFlow | Managed Testing Platform" },
      {
        name: "description",
        content:
          "Sign in or create a TestFlow account to order managed software testing and user research, or to join as a tester.",
      },
      { property: "og:title", content: "Sign in to TestFlow" },
      {
        property: "og:description",
        content: "Access your TestFlow workspace for managed testing and user research.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type FieldErrors = Record<string, string>;

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [role, setRole] = useState<"CLIENT" | "TESTER">("CLIENT");

  function collect(form: HTMLFormElement) {
    const data = new FormData(form);
    return Object.fromEntries(data.entries()) as Record<string, string>;
  }

  async function onSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setNotice(null);
    const parsed = signInSchema.safeParse(collect(event.currentTarget));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setBusy(false);
      toast.error(toSafeError(error).message);
      return;
    }
    const session = await fetchSession();
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    setBusy(false);
    navigate({ to: homeForRole(session?.primaryRole ?? "CLIENT") });
  }

  async function onSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setNotice(null);
    const raw = collect(event.currentTarget);
    const parsed = signUpSchema.safeParse({ ...raw, role });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          role: parsed.data.role,
          organization_name: parsed.data.organizationName ?? "",
          country: parsed.data.country ?? "",
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(toSafeError(error).message);
      return;
    }
    if (data.session) {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate({ to: homeForRole(parsed.data.role) });
      return;
    }
    setNotice("Account created. Check your email and confirm the address to sign in.");
    setTab("signin");
  }

  async function onResetPassword(email: string) {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(toSafeError(error).message);
    else toast.success("If that address has an account, a reset link is on its way.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="font-display text-2xl font-semibold">
            TestFlow
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Managed software testing and user research
          </p>
        </div>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in, or create an account to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            {notice ? (
              <p className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm">
                {notice}
              </p>
            ) : null}

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form className="space-y-4" onSubmit={onSignIn} noValidate>
                  <Field id="email" label="Email" error={errors["email"]}>
                    <Input id="email" name="email" type="email" autoComplete="email" required />
                  </Field>
                  <Field id="password" label="Password" error={errors["password"]}>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </Field>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={(event) => {
                      const form = event.currentTarget.closest("form");
                      const input = form?.querySelector<HTMLInputElement>("#email");
                      void onResetPassword(input?.value.trim() ?? "");
                    }}
                  >
                    Forgot your password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form className="space-y-4" onSubmit={onSignUp} noValidate>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={role === "CLIENT" ? "default" : "outline"}
                      onClick={() => setRole("CLIENT")}
                    >
                      I need testing
                    </Button>
                    <Button
                      type="button"
                      variant={role === "TESTER" ? "default" : "outline"}
                      onClick={() => setRole("TESTER")}
                    >
                      I am a tester
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field id="firstName" label="First name" error={errors["firstName"]}>
                      <Input id="firstName" name="firstName" required />
                    </Field>
                    <Field id="lastName" label="Last name" error={errors["lastName"]}>
                      <Input id="lastName" name="lastName" required />
                    </Field>
                  </div>

                  {role === "CLIENT" ? (
                    <Field
                      id="organizationName"
                      label="Company / organisation"
                      error={errors["organizationName"]}
                    >
                      <Input id="organizationName" name="organizationName" required />
                    </Field>
                  ) : (
                    <Field id="country" label="Country" error={errors["country"]}>
                      <Input id="country" name="country" placeholder="e.g. Kenya" />
                    </Field>
                  )}

                  <Field id="signupEmail" label="Email" error={errors["email"]}>
                    <Input
                      id="signupEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </Field>
                  <Field
                    id="signupPassword"
                    label="Password"
                    error={errors["password"]}
                    hint="At least 10 characters, with upper and lower case letters and a number."
                  >
                    <Input
                      id="signupPassword"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                  </Field>

                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function fieldErrors(issues: { path: (string | number)[]; message: string }[]): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
