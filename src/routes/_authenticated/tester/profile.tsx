import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/tester/status-badge";
import { useSession } from "@/hooks/useSession";
import {
  useAddSkill,
  useDeleteSkill,
  useSaveTesterProfile,
  useTesterWorkspace,
} from "@/hooks/useTesterNetwork";
import {
  AGE_RANGES,
  ALL_SKILLS,
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVELS,
  SKILL_CATALOG,
  testerProfileSchema,
  titleCase,
  type TesterProfileInput,
} from "@/lib/tester";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/tester/profile")({
  head: () => ({
    meta: [
      { title: "Tester profile — TestFlow" },
      {
        name: "description",
        content: "Keep your location, availability and skills up to date for TestFlow matching.",
      },
      { property: "og:title", content: "Tester profile — TestFlow" },
      {
        property: "og:description",
        content: "Keep your location, availability and skills up to date for TestFlow matching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterProfilePage,
});

const EMPTY_FORM: TesterProfileInput = {
  country: "",
  city: "",
  timezone: "",
  ageRange: "25-34",
  occupation: "",
  bio: "",
  experienceLevel: "BEGINNER",
  availabilityStatus: "AVAILABLE",
};

function TesterProfilePage() {
  const { data: session } = useSession();
  const { data, isPending, error, refetch, completeness } = useTesterWorkspace();
  const profile = data?.profile ?? null;
  const save = useSaveTesterProfile(profile?.id);
  const addSkill = useAddSkill(profile?.id);
  const deleteSkill = useDeleteSkill();

  const [form, setForm] = useState<TesterProfileInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState(ALL_SKILLS[0]!);
  const [newSkillLevel, setNewSkillLevel] = useState("INTERMEDIATE");

  useEffect(() => {
    if (!profile) return;
    setForm({
      country: profile.country ?? "",
      city: profile.city ?? "",
      timezone: profile.timezone ?? "",
      ageRange: (AGE_RANGES as readonly string[]).includes(profile.age_range ?? "")
        ? (profile.age_range as TesterProfileInput["ageRange"])
        : "25-34",
      occupation: profile.occupation ?? "",
      bio: profile.bio ?? "",
      experienceLevel: profile.experience_level,
      availabilityStatus: profile.availability_status,
    });
  }, [profile]);

  if (isPending) return <LoadingState label="Loading your profile" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (session && session.primaryRole !== "TESTER") return <Navigate to="/dashboard" />;
  if (!profile) return <ErrorState error={new Error("NOT_FOUND")} />;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = testerProfileSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    save.mutate(parsed.data, {
      onSuccess: () => toast.success("Profile updated"),
      onError: (err) => toast.error(toSafeError(err).message),
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tester profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            TestFlow uses this information to decide which work suits you. Scores and account
            status are set by TestFlow.
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge value={profile.account_status} />
          <StatusBadge value={profile.availability_status} />
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile completeness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={completeness.percent} className="h-2" />
            <span className="text-sm font-semibold">{completeness.percent}%</span>
          </div>
          {completeness.missing.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Still to add: {completeness.missing.join(", ")}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Everything we need is in place.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">About you</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <TextField
              id="country"
              label="Country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
              error={fieldErrors["country"]}
            />
            <TextField
              id="city"
              label="City (optional)"
              value={form.city ?? ""}
              onChange={(v) => setForm({ ...form, city: v })}
              error={fieldErrors["city"]}
            />
            <TextField
              id="timezone"
              label="Timezone"
              placeholder="Europe/London"
              value={form.timezone}
              onChange={(v) => setForm({ ...form, timezone: v })}
              error={fieldErrors["timezone"]}
            />
            <SelectField
              id="ageRange"
              label="Age range"
              value={form.ageRange}
              onChange={(v) => setForm({ ...form, ageRange: v as TesterProfileInput["ageRange"] })}
              options={AGE_RANGES.map((a) => ({ value: a, label: a }))}
            />
            <TextField
              id="occupation"
              label="Occupation (optional)"
              value={form.occupation ?? ""}
              onChange={(v) => setForm({ ...form, occupation: v })}
              error={fieldErrors["occupation"]}
            />
            <SelectField
              id="experienceLevel"
              label="Testing experience"
              value={form.experienceLevel}
              onChange={(v) =>
                setForm({ ...form, experienceLevel: v as TesterProfileInput["experienceLevel"] })
              }
              options={EXPERIENCE_LEVELS}
            />
            <SelectField
              id="availabilityStatus"
              label="Availability"
              value={form.availabilityStatus}
              onChange={(v) =>
                setForm({
                  ...form,
                  availabilityStatus: v as TesterProfileInput["availabilityStatus"],
                })
              }
              options={AVAILABILITY_OPTIONS}
            />
            <div className="sm:col-span-2">
              <Label htmlFor="bio">About you</Label>
              <Textarea
                id="bio"
                rows={4}
                value={form.bio ?? ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="A short summary of the kinds of products you test and the tools you know."
              />
              {fieldErrors["bio"] ? (
                <p className="mt-1 text-xs text-destructive">{fieldErrors["bio"]}</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data && data.skills.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {data.skills.map((skill) => (
                <li key={skill.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{skill.skill}</p>
                    <p className="text-xs text-muted-foreground">
                      {titleCase(skill.experience_level)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={skill.verification_status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deleteSkill.mutate(skill.id, {
                          onSuccess: () => toast.success("Skill removed"),
                          onError: (err) => toast.error(toSafeError(err).message),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="newSkill">Add a skill</Label>
              <select
                id="newSkill"
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              >
                {SKILL_CATALOG.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.skills.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="min-w-[160px]">
              <Label htmlFor="newSkillLevel">Level</Label>
              <select
                id="newSkillLevel"
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
              >
                {EXPERIENCE_LEVELS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              disabled={addSkill.isPending}
              onClick={() =>
                addSkill.mutate(
                  {
                    skill: newSkill,
                    experienceLevel: newSkillLevel as TesterProfileInput["experienceLevel"],
                  },
                  {
                    onSuccess: () => toast.success("Skill added"),
                    onError: (err) => toast.error(toSafeError(err).message),
                  },
                )
              }
            >
              Add skill
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  placeholder?: string | undefined;
}) {
  return (
    <div>
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        value={props.value}
        placeholder={props.placeholder ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.error ? <p className="mt-1 text-xs text-destructive">{props.error}</p> : null}
    </div>
  );
}

function SelectField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label htmlFor={props.id}>{props.label}</Label>
      <select
        id={props.id}
        className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
