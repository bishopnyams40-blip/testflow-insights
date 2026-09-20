import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import {
  calculateCompleteness,
  testerDeviceSchema,
  testerProfileSchema,
  testerSkillSchema,
  type AttributeVerificationStatus,
  type AvailabilityStatus,
  type AccountStatus,
  type DevicePlatform,
  type ExperienceLevel,
  type TesterDeviceInput,
  type TesterDeviceRow,
  type TesterProfileInput,
  type TesterProfileRow,
  type TesterSkillInput,
  type TesterSkillRow,
  type TesterVerificationRow,
  type VerificationStatus,
  type VerificationType,
} from "@/lib/tester";

export interface TesterWorkspace {
  profile: TesterProfileRow | null;
  devices: TesterDeviceRow[];
  skills: TesterSkillRow[];
  verifications: TesterVerificationRow[];
}

async function fetchTesterWorkspace(userId: string): Promise<TesterWorkspace> {
  const { data: profile, error } = await supabase
    .from("tester_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return { profile: null, devices: [], skills: [], verifications: [] };

  const [devices, skills, verifications] = await Promise.all([
    supabase
      .from("tester_devices")
      .select("*")
      .eq("tester_id", profile.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("tester_skills")
      .select("*")
      .eq("tester_id", profile.id)
      .order("skill", { ascending: true }),
    supabase.from("tester_verifications").select("*").eq("tester_id", profile.id),
  ]);
  if (devices.error) throw devices.error;
  if (skills.error) throw skills.error;
  if (verifications.error) throw verifications.error;

  return {
    profile,
    devices: devices.data ?? [],
    skills: skills.data ?? [],
    verifications: verifications.data ?? [],
  };
}

export function useTesterWorkspace() {
  const { data: session } = useSession();
  const userId = session?.userId;
  const query = useQuery({
    queryKey: ["tester-workspace", userId],
    queryFn: () => fetchTesterWorkspace(userId!),
    enabled: Boolean(userId),
  });
  const completeness = calculateCompleteness({
    profile: query.data?.profile ?? null,
    devices: query.data?.devices ?? [],
    skills: query.data?.skills ?? [],
    verifications: query.data?.verifications ?? [],
  });
  return { ...query, completeness };
}

function useInvalidateWorkspace() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["tester-workspace"] });
}

export function useSaveTesterProfile(testerId: string | undefined) {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: async (input: TesterProfileInput) => {
      const values = testerProfileSchema.parse(input);
      if (!testerId) throw new Error("Tester profile not found");
      const { error } = await supabase
        .from("tester_profiles")
        .update({
          country: values.country,
          city: values.city || null,
          timezone: values.timezone,
          age_range: values.ageRange,
          occupation: values.occupation || null,
          bio: values.bio || null,
          experience_level: values.experienceLevel,
          availability_status: values.availabilityStatus,
        })
        .eq("id", testerId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAddDevice(testerId: string | undefined) {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: async (input: TesterDeviceInput) => {
      const values = testerDeviceSchema.parse(input);
      if (!testerId) throw new Error("Tester profile not found");
      const { error } = await supabase.from("tester_devices").insert({
        tester_id: testerId,
        platform: values.platform,
        device_type: values.deviceType,
        manufacturer: values.manufacturer || null,
        model: values.model,
        operating_system: values.operatingSystem || null,
        os_version: values.osVersion || null,
        browser: values.browser || null,
        browser_version: values.browserVersion || null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDevice() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase.from("tester_devices").delete().eq("id", deviceId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAddSkill(testerId: string | undefined) {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: async (input: TesterSkillInput) => {
      const values = testerSkillSchema.parse(input);
      if (!testerId) throw new Error("Tester profile not found");
      const { error } = await supabase.from("tester_skills").insert({
        tester_id: testerId,
        skill: values.skill,
        experience_level: values.experienceLevel,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteSkill() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase.from("tester_skills").delete().eq("id", skillId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useRequestVerification(testerId: string | undefined) {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: async (type: VerificationType) => {
      if (!testerId) throw new Error("Tester profile not found");
      const { error } = await supabase
        .from("tester_verifications")
        .insert({ tester_id: testerId, verification_type: type, status: "PENDING" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ---------------------------- admin ---------------------------- */

export interface AdminTesterFilters {
  search: string;
  accountStatus: AccountStatus | null;
  availability: AvailabilityStatus | null;
  verification: VerificationStatus | null;
  experience: ExperienceLevel | null;
  country: string;
  platform: DevicePlatform | null;
  page: number;
  pageSize: number;
}

export const DEFAULT_ADMIN_FILTERS: AdminTesterFilters = {
  search: "",
  accountStatus: null,
  availability: null,
  verification: null,
  experience: null,
  country: "",
  platform: null,
  page: 1,
  pageSize: 20,
};

export function useAdminTesters(filters: AdminTesterFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-testers", filters],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_testers", {
        _search: filters.search || undefined,
        _account_status: filters.accountStatus ?? undefined,
        _availability: filters.availability ?? undefined,
        _verification: filters.verification ?? undefined,
        _experience: filters.experience ?? undefined,
        _country: filters.country || undefined,
        _platform: filters.platform ?? undefined,
        _limit: filters.pageSize,
        _offset: (filters.page - 1) * filters.pageSize,
      });
      if (error) throw error;
      const rows = data ?? [];
      return { rows, total: Number(rows[0]?.total_count ?? 0) };
    },
  });
}

export function useAdminTesterStats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-tester-stats"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_tester_network_stats");
      if (error) throw error;
      return data?.[0] ?? { total: 0, active: 0, pending_verification: 0, suspended: 0 };
    },
  });
}

export function useAdminTesterDetail(testerId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-tester", testerId],
    enabled,
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("tester_profiles")
        .select("*")
        .eq("id", testerId)
        .maybeSingle();
      if (error) throw error;
      if (!profile) return null;
      const [account, devices, skills, verifications] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", profile.user_id).maybeSingle(),
        supabase.from("tester_devices").select("*").eq("tester_id", testerId),
        supabase.from("tester_skills").select("*").eq("tester_id", testerId),
        supabase.from("tester_verifications").select("*").eq("tester_id", testerId),
      ]);
      return {
        profile,
        account: account.data ?? null,
        devices: devices.data ?? [],
        skills: skills.data ?? [],
        verifications: verifications.data ?? [],
      };
    },
  });
}

export function useAdminTesterActions(testerId: string) {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["admin-tester", testerId] });
    void client.invalidateQueries({ queryKey: ["admin-testers"] });
    void client.invalidateQueries({ queryKey: ["admin-tester-stats"] });
  };

  const setStatus = useMutation({
    mutationFn: async ({
      status,
      reason,
    }: {
      status: AccountStatus;
      reason?: string | undefined;
    }) => {
      const { error } = await supabase.rpc("admin_set_tester_status", {
        _tester_id: testerId,
        _status: status,
        _reason: reason ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const setAvailability = useMutation({
    mutationFn: async (availability: AvailabilityStatus) => {
      const { error } = await supabase.rpc("admin_set_tester_availability", {
        _tester_id: testerId,
        _availability: availability,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const reviewDevice = useMutation({
    mutationFn: async ({
      deviceId,
      status,
      reason,
    }: {
      deviceId: string;
      status: AttributeVerificationStatus;
      reason?: string | undefined;
    }) => {
      const { error } = await supabase.rpc("admin_review_device", {
        _device_id: deviceId,
        _status: status,
        _reason: reason ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const reviewSkill = useMutation({
    mutationFn: async ({
      skillId,
      status,
    }: {
      skillId: string;
      status: AttributeVerificationStatus;
    }) => {
      const { error } = await supabase.rpc("admin_review_skill", {
        _skill_id: skillId,
        _status: status,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const reviewVerification = useMutation({
    mutationFn: async ({
      type,
      status,
      reason,
    }: {
      type: VerificationType;
      status: VerificationStatus;
      reason?: string | undefined;
    }) => {
      const { error } = await supabase.rpc("admin_review_verification", {
        _tester_id: testerId,
        _type: type,
        _status: status,
        _reason: reason ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { setStatus, setAvailability, reviewDevice, reviewSkill, reviewVerification };
}
