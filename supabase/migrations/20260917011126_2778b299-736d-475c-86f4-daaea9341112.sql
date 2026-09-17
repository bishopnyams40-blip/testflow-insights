
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('CLIENT','TESTER','ADMIN');
CREATE TYPE public.user_status AS ENUM ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED');
CREATE TYPE public.org_status AS ENUM ('PENDING','ACTIVE','SUSPENDED','CLOSED');
CREATE TYPE public.org_member_role AS ENUM ('OWNER','ADMIN','MEMBER','BILLING');
CREATE TYPE public.org_member_status AS ENUM ('INVITED','ACTIVE','SUSPENDED','REMOVED');
CREATE TYPE public.service_type AS ENUM ('USER_FEEDBACK','BUG_TESTING','USABILITY_TESTING','BETA_TESTING','TARGETED_RESEARCH');
CREATE TYPE public.campaign_status AS ENUM ('DRAFT','QUOTED','PAYMENT_PENDING','PAID','RECRUITING','MATCHING','ASSIGNING','TESTING','QUALITY_REVIEW','REPLACEMENTS','COMPLETED','ANALYZING','REPORT_READY','CLOSED','PAUSED','CANCELLED');
CREATE TYPE public.experience_level AS ENUM ('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT');
CREATE TYPE public.verification_type AS ENUM ('EMAIL','PHONE','IDENTITY','COUNTRY','DEVICE','SKILL');
CREATE TYPE public.verification_status AS ENUM ('PENDING','VERIFIED','FAILED','EXPIRED');
CREATE TYPE public.availability_status AS ENUM ('AVAILABLE','BUSY','UNAVAILABLE');
CREATE TYPE public.device_type AS ENUM ('PHONE','TABLET','LAPTOP','DESKTOP','WEARABLE','TV','OTHER');
CREATE TYPE public.requirement_operator AS ENUM ('EQUALS','NOT_EQUALS','IN','NOT_IN','GREATER_THAN','GREATER_THAN_OR_EQUAL','LESS_THAN','LESS_THAN_OR_EQUAL','CONTAINS','BOOLEAN_IS');
CREATE TYPE public.conversation_type AS ENUM ('CAMPAIGN','GENERAL_SUPPORT','PAYMENT','TECHNICAL_SUPPORT');
CREATE TYPE public.conversation_status AS ENUM ('OPEN','PENDING','RESOLVED','CLOSED');
CREATE TYPE public.participant_role AS ENUM ('CLIENT','ADMIN');
CREATE TYPE public.message_type AS ENUM ('TEXT','SYSTEM');
CREATE TYPE public.payment_method_type AS ENUM ('CARD','CRYPTO','BANK_TRANSFER','MOBILE_MONEY','OTHER');
CREATE TYPE public.payment_status AS ENUM ('PENDING','PROCESSING','SUCCEEDED','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED');
CREATE TYPE public.transaction_type AS ENUM ('CHARGE','REFUND','CHARGEBACK','ADJUSTMENT','FEE');
CREATE TYPE public.ledger_entry_type AS ENUM ('CLIENT_PAYMENT','TESTER_REWARD','PLATFORM_REVENUE','PROCESSING_FEE','OPERATIONAL_COST','REFUND','ADJUSTMENT');
CREATE TYPE public.notification_channel AS ENUM ('IN_APP','EMAIL','PUSH');
CREATE TYPE public.notification_status AS ENUM ('PENDING','SENT','READ','FAILED');
CREATE TYPE public.file_asset_kind AS ENUM ('SCREENSHOT','BUG_EVIDENCE','SCREEN_RECORDING','VIDEO','AUDIO','DOCUMENT','REPORT','OTHER');

-- ============ SHARED TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status public.user_status NOT NULL DEFAULT 'PENDING',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles (lower(email));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROLES (separate table, never on profiles) ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX user_roles_user_id_idx ON public.user_roles (user_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'ADMIN');
$$;

CREATE POLICY user_roles_select_self ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());

-- ============ ORGANIZATIONS ============
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  country TEXT,
  timezone TEXT,
  status public.org_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_member_role NOT NULL DEFAULT 'MEMBER',
  status public.org_member_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX organization_members_user_id_idx ON public.organization_members (user_id);
CREATE INDEX organization_members_organization_id_idx ON public.organization_members (organization_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER organization_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tenant helpers (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = auth.uid() AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_manager(_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = auth.uid()
      AND status = 'ACTIVE' AND role IN ('OWNER','ADMIN')
  );
$$;

CREATE POLICY organizations_select ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id) OR public.is_admin());
CREATE POLICY organizations_insert ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'CLIENT') OR public.is_admin());
CREATE POLICY organizations_update ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_org_manager(id) OR public.is_admin())
  WITH CHECK (public.is_org_manager(id) OR public.is_admin());

CREATE POLICY org_members_select ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_member(organization_id) OR public.is_admin());
CREATE POLICY org_members_insert ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (public.is_org_manager(organization_id) OR public.is_admin());
CREATE POLICY org_members_update ON public.organization_members FOR UPDATE TO authenticated
  USING (public.is_org_manager(organization_id) OR public.is_admin())
  WITH CHECK (public.is_org_manager(organization_id) OR public.is_admin());
CREATE POLICY org_members_delete ON public.organization_members FOR DELETE TO authenticated
  USING (public.is_org_manager(organization_id) OR public.is_admin());

-- ============ TESTER FOUNDATION ============
CREATE TABLE public.tester_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  country TEXT,
  timezone TEXT,
  age_range TEXT,
  occupation TEXT,
  bio TEXT,
  experience_level public.experience_level NOT NULL DEFAULT 'BEGINNER',
  quality_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  reliability_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  fraud_risk_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  verification_status public.verification_status NOT NULL DEFAULT 'PENDING',
  availability_status public.availability_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tester_profiles_country_idx ON public.tester_profiles (country);
CREATE INDEX tester_profiles_verification_status_idx ON public.tester_profiles (verification_status);
GRANT SELECT, INSERT, UPDATE ON public.tester_profiles TO authenticated;
GRANT ALL ON public.tester_profiles TO service_role;
ALTER TABLE public.tester_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tester_profiles_updated_at BEFORE UPDATE ON public.tester_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY tester_profiles_select ON public.tester_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY tester_profiles_insert ON public.tester_profiles FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() AND public.has_role(auth.uid(),'TESTER')) OR public.is_admin());
CREATE POLICY tester_profiles_update ON public.tester_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.owns_tester_profile(_tester_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tester_profiles WHERE id = _tester_id AND user_id = auth.uid());
$$;

CREATE TABLE public.tester_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_id UUID NOT NULL REFERENCES public.tester_profiles(id) ON DELETE CASCADE,
  device_type public.device_type NOT NULL,
  manufacturer TEXT,
  model TEXT,
  operating_system TEXT,
  os_version TEXT,
  browser TEXT,
  browser_version TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tester_devices_tester_id_idx ON public.tester_devices (tester_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tester_devices TO authenticated;
GRANT ALL ON public.tester_devices TO service_role;
ALTER TABLE public.tester_devices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tester_devices_updated_at BEFORE UPDATE ON public.tester_devices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY tester_devices_all ON public.tester_devices FOR ALL TO authenticated
  USING (public.owns_tester_profile(tester_id) OR public.is_admin())
  WITH CHECK (public.owns_tester_profile(tester_id) OR public.is_admin());

CREATE TABLE public.tester_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_id UUID NOT NULL REFERENCES public.tester_profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  experience_level public.experience_level NOT NULL DEFAULT 'BEGINNER',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tester_id, skill)
);
CREATE INDEX tester_skills_tester_id_idx ON public.tester_skills (tester_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tester_skills TO authenticated;
GRANT ALL ON public.tester_skills TO service_role;
ALTER TABLE public.tester_skills ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tester_skills_updated_at BEFORE UPDATE ON public.tester_skills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY tester_skills_all ON public.tester_skills FOR ALL TO authenticated
  USING (public.owns_tester_profile(tester_id) OR public.is_admin())
  WITH CHECK (public.owns_tester_profile(tester_id) OR public.is_admin());

CREATE TABLE public.tester_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_id UUID NOT NULL REFERENCES public.tester_profiles(id) ON DELETE CASCADE,
  verification_type public.verification_type NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'PENDING',
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tester_id, verification_type)
);
CREATE INDEX tester_verifications_tester_id_idx ON public.tester_verifications (tester_id);
GRANT SELECT, INSERT ON public.tester_verifications TO authenticated;
GRANT ALL ON public.tester_verifications TO service_role;
ALTER TABLE public.tester_verifications ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tester_verifications_updated_at BEFORE UPDATE ON public.tester_verifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY tester_verifications_select ON public.tester_verifications FOR SELECT TO authenticated
  USING (public.owns_tester_profile(tester_id) OR public.is_admin());
CREATE POLICY tester_verifications_insert ON public.tester_verifications FOR INSERT TO authenticated
  WITH CHECK (public.owns_tester_profile(tester_id) OR public.is_admin());
CREATE POLICY tester_verifications_update_admin ON public.tester_verifications FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ CAMPAIGNS ============
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  service_type public.service_type NOT NULL,
  name TEXT NOT NULL,
  objective TEXT,
  description TEXT,
  product_url TEXT,
  status public.campaign_status NOT NULL DEFAULT 'DRAFT',
  participant_target INTEGER NOT NULL DEFAULT 1 CHECK (participant_target > 0),
  deadline TIMESTAMPTZ,
  pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX campaigns_organization_id_idx ON public.campaigns (organization_id);
CREATE INDEX campaigns_status_idx ON public.campaigns (status);
GRANT SELECT, INSERT, UPDATE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY campaigns_select ON public.campaigns FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin());
CREATE POLICY campaigns_insert ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK ((public.is_org_member(organization_id) AND created_by = auth.uid()) OR public.is_admin());
CREATE POLICY campaigns_update ON public.campaigns FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin())
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin());

CREATE OR REPLACE FUNCTION public.can_access_campaign(_campaign_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = _campaign_id AND (public.is_org_member(c.organization_id) OR public.is_admin())
  );
$$;

CREATE TABLE public.campaign_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,
  operator public.requirement_operator NOT NULL DEFAULT 'EQUALS',
  value JSONB NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX campaign_requirements_campaign_id_idx ON public.campaign_requirements (campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_requirements TO authenticated;
GRANT ALL ON public.campaign_requirements TO service_role;
ALTER TABLE public.campaign_requirements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER campaign_requirements_updated_at BEFORE UPDATE ON public.campaign_requirements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY campaign_requirements_all ON public.campaign_requirements FOR ALL TO authenticated
  USING (public.can_access_campaign(campaign_id)) WITH CHECK (public.can_access_campaign(campaign_id));

CREATE TABLE public.campaign_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  success_criteria TEXT,
  max_duration INTEGER,
  sequence INTEGER NOT NULL DEFAULT 1,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX campaign_tasks_campaign_id_idx ON public.campaign_tasks (campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_tasks TO authenticated;
GRANT ALL ON public.campaign_tasks TO service_role;
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER campaign_tasks_updated_at BEFORE UPDATE ON public.campaign_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY campaign_tasks_all ON public.campaign_tasks FOR ALL TO authenticated
  USING (public.can_access_campaign(campaign_id)) WITH CHECK (public.can_access_campaign(campaign_id));

-- ============ PAYMENTS (provider agnostic, no processing yet) ============
CREATE TABLE public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  method_type public.payment_method_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_providers TO authenticated;
GRANT ALL ON public.payment_providers TO service_role;
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER payment_providers_updated_at BEFORE UPDATE ON public.payment_providers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY payment_providers_select ON public.payment_providers FOR SELECT TO authenticated USING (enabled OR public.is_admin());

CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.payment_providers(id) ON DELETE SET NULL,
  method_type public.payment_method_type NOT NULL,
  label TEXT,
  external_reference TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payment_methods_organization_id_idx ON public.payment_methods (organization_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY payment_methods_select ON public.payment_methods FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin());
CREATE POLICY payment_methods_write ON public.payment_methods FOR ALL TO authenticated
  USING (public.is_org_manager(organization_id) OR public.is_admin())
  WITH CHECK (public.is_org_manager(organization_id) OR public.is_admin());

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.payment_providers(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_organization_id_idx ON public.payments (organization_id);
CREATE INDEX payments_campaign_id_idx ON public.payments (campaign_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY payments_select ON public.payments FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin());

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  transaction_type public.transaction_type NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  provider_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payment_transactions_payment_id_idx ON public.payment_transactions (payment_id);
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY payment_transactions_select ON public.payment_transactions FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.payments p WHERE p.id = payment_id AND public.is_org_member(p.organization_id)
  ));

-- Append-only financial ledger (admin visibility only)
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type public.ledger_entry_type NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  tester_id UUID REFERENCES public.tester_profiles(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ledger_entries_organization_id_idx ON public.ledger_entries (organization_id);
CREATE INDEX ledger_entries_campaign_id_idx ON public.ledger_entries (campaign_id);
GRANT SELECT ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_entries_select_admin ON public.ledger_entries FOR SELECT TO authenticated USING (public.is_admin());

-- ============ COMMUNICATION ============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type public.conversation_type NOT NULL DEFAULT 'GENERAL_SUPPORT',
  subject TEXT NOT NULL,
  status public.conversation_status NOT NULL DEFAULT 'OPEN',
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX conversations_organization_id_idx ON public.conversations (organization_id);
CREATE INDEX conversations_status_idx ON public.conversations (status);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY conversations_select ON public.conversations FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin());
CREATE POLICY conversations_insert ON public.conversations FOR INSERT TO authenticated
  WITH CHECK ((public.is_org_member(organization_id) AND created_by = auth.uid()
               AND NOT public.has_role(auth.uid(),'TESTER')) OR public.is_admin());
CREATE POLICY conversations_update ON public.conversations FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin())
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin());

CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_role public.participant_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
CREATE INDEX conversation_participants_conversation_id_idx ON public.conversation_participants (conversation_id);
CREATE INDEX conversation_participants_user_id_idx ON public.conversation_participants (user_id);
GRANT SELECT, INSERT, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- HARD BOUNDARY: a tester can never be a conversation participant.
CREATE OR REPLACE FUNCTION public.enforce_participant_boundary()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(NEW.user_id, 'TESTER') THEN
    RAISE EXCEPTION 'Testers cannot participate in client conversations';
  END IF;
  IF NEW.participant_role = 'ADMIN' AND NOT public.has_role(NEW.user_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Participant role ADMIN requires the ADMIN role';
  END IF;
  IF NEW.participant_role = 'CLIENT' AND NOT public.has_role(NEW.user_id, 'CLIENT') THEN
    RAISE EXCEPTION 'Participant role CLIENT requires the CLIENT role';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER conversation_participants_boundary
  BEFORE INSERT OR UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_participant_boundary();

CREATE OR REPLACE FUNCTION public.can_access_conversation(_conversation_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (public.is_admin() OR (public.is_org_member(c.organization_id) AND NOT public.has_role(auth.uid(),'TESTER')))
  );
$$;

CREATE POLICY conversation_participants_select ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.can_access_conversation(conversation_id));
CREATE POLICY conversation_participants_insert ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (public.can_access_conversation(conversation_id));
CREATE POLICY conversation_participants_delete ON public.conversation_participants FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  message_type public.message_type NOT NULL DEFAULT 'TEXT',
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_id_idx ON public.messages (conversation_id);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated
  USING (public.can_access_conversation(conversation_id));
CREATE POLICY messages_insert ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()
    AND NOT public.has_role(auth.uid(),'TESTER')
    AND public.can_access_conversation(conversation_id)
    AND EXISTS (SELECT 1 FROM public.conversation_participants p
                WHERE p.conversation_id = messages.conversation_id AND p.user_id = auth.uid()));

-- ============ STORAGE ABSTRACTION ============
CREATE TABLE public.file_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind public.file_asset_kind NOT NULL DEFAULT 'OTHER',
  bucket TEXT NOT NULL DEFAULT 'testflow-evidence',
  storage_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket, storage_path)
);
CREATE INDEX file_assets_campaign_id_idx ON public.file_assets (campaign_id);
GRANT SELECT, INSERT ON public.file_assets TO authenticated;
GRANT ALL ON public.file_assets TO service_role;
ALTER TABLE public.file_assets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER file_assets_updated_at BEFORE UPDATE ON public.file_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY file_assets_select ON public.file_assets FOR SELECT TO authenticated
  USING (public.is_admin() OR uploaded_by = auth.uid()
         OR (organization_id IS NOT NULL AND public.is_org_member(organization_id)));
CREATE POLICY file_assets_insert ON public.file_assets FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL DEFAULT 'IN_APP',
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status public.notification_status NOT NULL DEFAULT 'PENDING',
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  previous_value JSONB,
  new_value JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs (actor_id);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_select_admin ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ============ SIGNUP HANDLER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _org_name TEXT;
  _org_id UUID;
BEGIN
  _role := COALESCE(NULLIF(upper(NEW.raw_user_meta_data ->> 'role'), ''), 'CLIENT')::public.app_role;
  IF _role = 'ADMIN' THEN _role := 'CLIENT'; END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, status, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'ACTIVE',
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'CLIENT' THEN
    _org_name := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'organization_name', ''), split_part(NEW.email, '@', 1) || '''s organization');
    INSERT INTO public.organizations (name, country, timezone)
    VALUES (_org_name, NEW.raw_user_meta_data ->> 'country', NEW.raw_user_meta_data ->> 'timezone')
    RETURNING id INTO _org_id;
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (_org_id, NEW.id, 'OWNER', 'ACTIVE');
  ELSIF _role = 'TESTER' THEN
    INSERT INTO public.tester_profiles (user_id, country, timezone)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'country', NEW.raw_user_meta_data ->> 'timezone')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed provider-agnostic payment methods (disabled until Admin enables them)
INSERT INTO public.payment_providers (code, name, method_type, enabled) VALUES
  ('manual_bank','Manual Bank Transfer','BANK_TRANSFER', false),
  ('manual_mobile_money','Manual Mobile Money','MOBILE_MONEY', false),
  ('card_provider','Card Provider (unconfigured)','CARD', false),
  ('crypto_provider','Crypto Provider (unconfigured)','CRYPTO', false);
