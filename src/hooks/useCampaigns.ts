import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  campaignDraftSchema,
  campaignRequirementSchema,
  campaignTaskSchema,
  requirementValueToJson,
  type CampaignFormValues,
  type CampaignRequirementInput,
  type CampaignRequirementRow,
  type CampaignRow,
  type CampaignStatus,
  type CampaignTaskInput,
  type CampaignTaskRow,
  type ServiceType,
} from "@/lib/campaign";
import {
  pruneServiceConfig,
  toServiceConfig,
  validateServiceConfiguration,
  type ServiceConfig,
  type ServiceCompleteness,
} from "@/lib/service-engine";

/* ------------------------------ client list ------------------------------ */

export interface CampaignListFilters {
  search: string;
  status: CampaignStatus | null;
  service: ServiceType | null;
  page: number;
  pageSize: number;
}

export const DEFAULT_CAMPAIGN_FILTERS: CampaignListFilters = {
  search: "",
  status: null,
  service: null,
  page: 1,
  pageSize: 10,
};

export function useCampaigns(
  organizationId: string | null | undefined,
  filters: CampaignListFilters,
) {
  return useQuery({
    queryKey: ["campaigns", organizationId, filters],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select("*", { count: "exact" })
        .eq("organization_id", organizationId!)
        .order("updated_at", { ascending: false })
        .range((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize - 1);

      if (filters.search) query = query.ilike("name", `%${filters.search}%`);
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.service) query = query.eq("service_type", filters.service);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as CampaignRow[], total: count ?? 0 };
    },
  });
}

export interface CampaignDetail {
  campaign: CampaignRow;
  tasks: CampaignTaskRow[];
  requirements: CampaignRequirementRow[];
  completeness: { complete: boolean; missing: string[] };
  serviceConfig: ServiceConfig;
  serviceCompleteness: ServiceCompleteness;
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async (): Promise<CampaignDetail | null> => {
      const { data: campaign, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .maybeSingle();
      if (error) throw error;
      if (!campaign) return null;

      const [tasks, requirements, completeness] = await Promise.all([
        supabase
          .from("campaign_tasks")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("sequence", { ascending: true }),
        supabase
          .from("campaign_requirements")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: true }),
        supabase.rpc("campaign_core_completeness", { _campaign_id: campaignId }),
      ]);
      if (tasks.error) throw tasks.error;
      if (requirements.error) throw requirements.error;
      if (completeness.error) throw completeness.error;

      const raw = (completeness.data ?? {}) as { complete?: boolean; missing?: string[] };
      const campaignRow = campaign as unknown as CampaignRow;
      const taskRows = (tasks.data ?? []) as CampaignTaskRow[];
      const serviceConfig = toServiceConfig(
        (campaign as unknown as { service_config?: unknown }).service_config,
      );
      return {
        campaign: campaignRow,
        tasks: taskRows,
        requirements: (requirements.data ?? []) as CampaignRequirementRow[],
        completeness: { complete: Boolean(raw.complete), missing: raw.missing ?? [] },
        serviceConfig,
        serviceCompleteness: validateServiceConfiguration(
          campaignRow.service_type,
          serviceConfig,
          {
            taskCount: taskRows.length,
            tasksMissingSuccessCriteria: taskRows.filter(
              (t) => !t.success_criteria || t.success_criteria.trim() === "",
            ).length,
          },
        ),
      };
    },
  });
}

function useRefreshCampaign(campaignId?: string) {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ["campaigns"] });
    void client.invalidateQueries({ queryKey: ["admin-campaigns"] });
    void client.invalidateQueries({ queryKey: ["admin-campaign-stats"] });
    if (campaignId) void client.invalidateQueries({ queryKey: ["campaign", campaignId] });
  };
}

function toCampaignColumns(values: CampaignFormValues, config: ServiceConfig) {
  return {
    service_config: pruneServiceConfig(values.serviceType, config),
    name: values.name,
    service_type: values.serviceType,
    product_type: values.productType,
    product_name: values.productName,
    product_url: values.productUrl || null,
    objective: values.objective,
    description: values.description ?? null,
    participant_target: values.participantTarget,
    deadline: new Date(values.deadline).toISOString(),
    login_required: values.loginRequired,
    test_account_instructions: values.testAccountInstructions ?? null,
    client_notes: values.clientNotes ?? null,
  };
}

export function useCreateCampaign(
  organizationId: string | null | undefined,
  userId: string | undefined,
) {
  const refresh = useRefreshCampaign();
  return useMutation({
    mutationFn: async (input: { values: CampaignFormValues; config: ServiceConfig }) => {
      if (!organizationId) throw new Error("Select an organisation first");
      if (!userId) throw new Error("You must be signed in");
      const values = campaignDraftSchema.parse(input.values);
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          organization_id: organizationId,
          created_by: userId,
          ...toCampaignColumns(values, input.config),
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: refresh,
  });
}

export function useUpdateCampaign(campaignId: string) {
  const refresh = useRefreshCampaign(campaignId);
  return useMutation({
    mutationFn: async (input: { values: CampaignFormValues; config: ServiceConfig }) => {
      const values = campaignDraftSchema.parse(input.values);
      const { error } = await supabase
        .from("campaigns")
        .update(toCampaignColumns(values, input.config) as never)
        .eq("id", campaignId);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
}

/* ------------------------------ tasks ------------------------------ */

export function useCampaignTaskActions(campaignId: string) {
  const refresh = useRefreshCampaign(campaignId);

  const addTask = useMutation({
    mutationFn: async ({ input, sequence }: { input: CampaignTaskInput; sequence: number }) => {
      const values = campaignTaskSchema.parse(input);
      const { error } = await supabase.from("campaign_tasks").insert({
        campaign_id: campaignId,
        title: values.title,
        description: values.description ?? null,
        instructions: values.instructions ?? null,
        success_criteria: values.successCriteria ?? null,
        max_duration: values.maxDuration,
        required: values.required,
        sequence,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("campaign_tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const moveTask = useMutation({
    mutationFn: async ({
      tasks,
      from,
      to,
    }: {
      tasks: CampaignTaskRow[];
      from: number;
      to: number;
    }) => {
      if (to < 0 || to >= tasks.length) return;
      const reordered = [...tasks];
      const moved = reordered.splice(from, 1)[0];
      if (!moved) return;
      reordered.splice(to, 0, moved);
      // Two-phase to respect the (campaign_id, sequence) uniqueness constraint.
      for (let i = 0; i < reordered.length; i += 1) {
        const row = reordered[i]!;
        const { error } = await supabase
          .from("campaign_tasks")
          .update({ sequence: 1000 + i })
          .eq("id", row.id);
        if (error) throw error;
      }
      for (let i = 0; i < reordered.length; i += 1) {
        const row = reordered[i]!;
        const { error } = await supabase
          .from("campaign_tasks")
          .update({ sequence: i + 1 })
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: refresh,
  });

  return { addTask, deleteTask, moveTask };
}

/* ------------------------------ requirements ------------------------------ */

export function useCampaignRequirementActions(campaignId: string) {
  const refresh = useRefreshCampaign(campaignId);

  const addRequirement = useMutation({
    mutationFn: async (input: CampaignRequirementInput) => {
      const values = campaignRequirementSchema.parse(input);
      const { error } = await supabase.from("campaign_requirements").insert({
        campaign_id: campaignId,
        requirement_type: values.requirementType,
        operator: values.operator,
        value: requirementValueToJson(values.operator, values.value) as never,
        required: values.required,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const deleteRequirement = useMutation({
    mutationFn: async (requirementId: string) => {
      const { error } = await supabase
        .from("campaign_requirements")
        .delete()
        .eq("id", requirementId);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { addRequirement, deleteRequirement };
}

/* ------------------------------ lifecycle ------------------------------ */

export function useCampaignLifecycle(campaignId: string) {
  const refresh = useRefreshCampaign(campaignId);

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("campaign_submit", { _campaign_id: campaignId });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("campaign_withdraw_to_draft", {
        _campaign_id: campaignId,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const cancel = useMutation({
    mutationFn: async (reason: string) => {
      const { error } = await supabase.rpc("campaign_cancel", {
        _campaign_id: campaignId,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("campaign_delete_draft", { _campaign_id: campaignId });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { submit, withdraw, cancel, remove };
}

/* ------------------------------ admin ------------------------------ */

export interface AdminCampaignFilters {
  search: string;
  status: CampaignStatus | null;
  service: ServiceType | null;
  page: number;
  pageSize: number;
}

export const DEFAULT_ADMIN_CAMPAIGN_FILTERS: AdminCampaignFilters = {
  search: "",
  status: null,
  service: null,
  page: 1,
  pageSize: 20,
};

export function useAdminCampaigns(filters: AdminCampaignFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-campaigns", filters],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_campaigns", {
        ...(filters.search ? { _search: filters.search } : {}),
        ...(filters.status ? { _status: filters.status } : {}),
        ...(filters.service ? { _service: filters.service } : {}),
        _limit: filters.pageSize,
        _offset: (filters.page - 1) * filters.pageSize,
      });
      if (error) throw error;
      const rows = data ?? [];
      return { rows, total: Number(rows[0]?.total_count ?? 0) };
    },
  });
}

export function useAdminCampaignStats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-campaign-stats"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_campaign_stats");
      if (error) throw error;
      return data?.[0] ?? { total: 0, drafts: 0, submitted: 0, cancelled: 0 };
    },
  });
}

export function useAdminSetCampaignStatus(campaignId: string) {
  const refresh = useRefreshCampaign(campaignId);
  return useMutation({
    mutationFn: async ({ status, reason }: { status: CampaignStatus; reason?: string }) => {
      const { error } = await supabase.rpc("admin_set_campaign_status", {
        _campaign_id: campaignId,
        _status: status,
        ...(reason ? { _reason: reason } : {}),
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
}
