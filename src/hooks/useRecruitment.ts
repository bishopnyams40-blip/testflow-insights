import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OpportunityStatus = Database["public"]["Enums"]["opportunity_status"];
export type JobRequestStatus = Database["public"]["Enums"]["job_request_status"];

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    for (const k of [
      "tester-opps",
      "tester-requests",
      "admin-opps",
      "admin-requests",
      "admin-recruit-stats",
      "campaign-recruit",
    ])
      void qc.invalidateQueries({ queryKey: [k] });
  };
}

export function useTesterOpportunities() {
  return useQuery({
    queryKey: ["tester-opps"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tester_list_opportunities", { _limit: 50 });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTesterRequests() {
  return useQuery({
    queryKey: ["tester-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tester_list_requests", { _limit: 50 });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRequestJob() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (opportunityId: string) => {
      const { error } = await supabase.rpc("job_request_create", {
        _opportunity_id: opportunityId,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
}

export function useWithdrawRequest() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("job_request_withdraw", { _request_id: requestId });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
}

export function useAdminRecruitment(enabled: boolean) {
  const stats = useQuery({
    queryKey: ["admin-recruit-stats"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recruitment_stats");
      if (error) throw error;
      return (data ?? {}) as Record<string, number>;
    },
  });
  const opps = useQuery({
    queryKey: ["admin-opps"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_opportunities", { _limit: 50 });
      if (error) throw error;
      return data ?? [];
    },
  });
  const requests = useQuery({
    queryKey: ["admin-requests"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_job_requests", { _limit: 50 });
      if (error) throw error;
      return data ?? [];
    },
  });
  return { stats, opps, requests };
}

export function useAdminRecruitmentActions() {
  const refresh = useRefresh();
  const create = useMutation({
    mutationFn: async (v: {
      campaignId: string;
      title: string;
      slots: number;
      closesAt: string;
    }) => {
      const { error } = await supabase.rpc("opportunity_create", {
        _campaign_id: v.campaignId,
        _title: v.title,
        _description: "",
        _slots_total: v.slots,
        _opens_at: new Date().toISOString(),
        _closes_at: (v.closesAt ? new Date(v.closesAt).toISOString() : null) as string,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const setStatus = useMutation({
    mutationFn: async (v: { id: string; status: OpportunityStatus }) => {
      const { error } = await supabase.rpc("opportunity_set_status", {
        _opportunity_id: v.id,
        _status: v.status,
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const review = useMutation({
    mutationFn: async (v: { id: string; status: JobRequestStatus; reason?: string }) => {
      const { error } = await supabase.rpc("admin_review_job_request", {
        _request_id: v.id,
        _status: v.status,
        ...(v.reason ? { _reason: v.reason } : {}),
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  return { create, setStatus, review };
}

/** Campaigns an admin may open recruitment for. The server re-validates on creation. */
export const RECRUITABLE_STATUSES = new Set([
  "QUOTED",
  "PAYMENT_PENDING",
  "PAID",
  "RECRUITING",
  "MATCHING",
  "ASSIGNING",
  "TESTING",
  "PAUSED",
]);

export function useRecruitableCampaigns(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-recruitable-campaigns"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_campaigns", { _limit: 200, _offset: 0 });
      if (error) throw error;
      return (data ?? []).filter((c) => RECRUITABLE_STATUSES.has(c.status));
    },
  });
}

export function useCampaignRecruitment(campaignId: string) {
  return useQuery({
    queryKey: ["campaign-recruit", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("campaign_recruitment_summary", {
        _campaign_id: campaignId,
      });
      if (error) throw error;
      return data as {
        status: string;
        required: number;
        slotsTotal: number;
        requests: number;
        filled: number;
      } | null;
    },
  });
}
