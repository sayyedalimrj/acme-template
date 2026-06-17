/**
 * Support service — in-memory, mock-only support inbox + customer-context composition.
 *
 * Builds the Customer Context Panel by projecting existing platform/workflow mock data into a
 * safe, read-only summary (no raw PII, no secrets, no customer DB access). All "actions" are
 * no-op acknowledgements — no persistence, no provider calls, no message sending, no network.
 * A future `apps/api` owns conversation state + RBAC + audit.
 */
import {
  platformSecuritySignals,
  platformSites,
  platformTenants,
  platformUsageSummaries,
} from '@/mock/platformAdmin';
import {
  supportAssignees,
  supportCannedReplies,
  supportConversationSeeds,
} from '@/mock/support';
import { workflowItems } from '@/mock/workflows';
import type {
  SupportAssignee,
  SupportCannedReply,
  SupportChannel,
  SupportConversation,
  SupportConversationContext,
  SupportConversationPriority,
  SupportConversationSeed,
  SupportConversationStatus,
  SupportDataAccessPolicy,
  SupportLinkedWorkflowItem,
  SupportMockActionResult,
  SupportOverviewKpis,
  SupportRelatedSignal,
} from '@/domain/types';

const delay = (ms = 140) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const OPEN_STATUSES: SupportConversationStatus[] = [
  'open',
  'pending',
  'waiting_customer',
  'waiting_internal',
];

const isOpen = (s: SupportConversationStatus): boolean => OPEN_STATUSES.includes(s);

/** Count of open support conversations for a tenant (used in the context panel). */
function openSupportCountFor(tenantId: string): number {
  return supportConversationSeeds.filter((c) => c.tenantId === tenantId && isOpen(c.status)).length;
}

/** Count of open workflow tasks for a tenant. */
function openWorkflowCountFor(tenantId: string): number {
  return workflowItems.filter(
    (w) => w.tenantId === tenantId && w.status !== 'done' && w.status !== 'canceled',
  ).length;
}

function buildContext(seed: SupportConversationSeed): SupportConversationContext {
  const tenant = platformTenants.find((t) => t.id === seed.tenantId);
  const site = seed.siteId ? platformSites.find((s) => s.id === seed.siteId) : undefined;
  const usage = platformUsageSummaries.find((u) => u.tenantId === seed.tenantId);
  const recentSecuritySignalIds = platformSecuritySignals
    .filter((s) => s.tenantId === seed.tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((s) => s.id);

  return {
    tenantId: seed.tenantId,
    tenantName: tenant?.name ?? seed.tenantName,
    tenantStatus: tenant?.status ?? 'active',
    plan: tenant?.subscription.tier ?? 'starter',
    subscriptionState: tenant?.subscription.state ?? 'active',
    mrr: tenant?.subscription.mrr ?? '0.00',
    currency: tenant?.subscription.currency ?? 'USD',
    renewsAt: tenant?.subscription.renewsAt,
    trialEndsAt: tenant?.subscription.trialEndsAt,
    supportOwner: tenant?.support.owner,
    sitesCount: tenant?.sitesCount ?? 0,
    tenantHealthScore: tenant?.healthScore ?? 0,
    onboardingComplete: tenant?.onboardingComplete ?? false,
    openWorkflowTasks: openWorkflowCountFor(seed.tenantId),
    openSupportCount: openSupportCountFor(seed.tenantId),
    siteId: site?.id,
    siteName: site?.name,
    siteHealthScore: site?.healthScore,
    connection: site?.connection,
    pluginVersion: site?.plugin.pluginVersion,
    latestPluginVersion: site?.plugin.latestVersion,
    wooCommerceActive: site?.plugin.wooCommerceActive,
    syncState: site?.sync.state,
    signedSync: site?.sync.signed,
    lastSyncAt: site?.sync.lastSyncAt,
    queuedEvents: site?.sync.queuedEvents,
    apiCalls: usage?.apiCalls,
    apiLimit: usage?.apiLimit,
    ordersSynced: usage?.ordersSynced,
    usageNearLimit: usage?.nearLimit,
    recentSecuritySignalIds,
  };
}

function resolveLinkedWorkflows(ids: string[]): SupportLinkedWorkflowItem[] {
  return ids
    .map((id) => workflowItems.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w))
    .map((w) => ({ id: w.id, title: w.title, status: w.status }));
}

function resolveRelatedSignals(ids: string[]): SupportRelatedSignal[] {
  return ids
    .map((id) => platformSecuritySignals.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ id: s.id, type: s.type, severity: s.severity, message: s.message }));
}

function withContext(seed: SupportConversationSeed): SupportConversation {
  return {
    ...seed,
    context: buildContext(seed),
    linkedWorkflows: resolveLinkedWorkflows(seed.relatedWorkflowIds),
    relatedSignals: resolveRelatedSignals(seed.relatedSecuritySignalIds),
  };
}

function buildOverview(): SupportOverviewKpis {
  const seeds = supportConversationSeeds;
  return {
    open: seeds.filter((c) => isOpen(c.status)).length,
    urgent: seeds.filter((c) => c.priority === 'urgent' && isOpen(c.status)).length,
    overdueSla: seeds.filter((c) => c.sla === 'overdue').length,
    waitingCustomer: seeds.filter((c) => c.status === 'waiting_customer').length,
    unassigned: seeds.filter((c) => c.assignee === null && isOpen(c.status)).length,
    // "Resolved this week" is a mock count of resolved items in the current fixture window.
    resolvedThisWeek: seeds.filter((c) => c.status === 'resolved').length,
  };
}

/** Default data-access policy (future RBAC): safe by default; billing/security gated; never secrets. */
export const SUPPORT_DATA_ACCESS_POLICY: SupportDataAccessPolicy[] = [
  { level: 'safe_summary', allowedByDefault: true },
  { level: 'support_context', allowedByDefault: true },
  { level: 'restricted_billing', allowedByDefault: false },
  { level: 'restricted_security', allowedByDefault: false },
  { level: 'never_expose_secret', allowedByDefault: false },
];

export interface SupportFilters {
  statuses: SupportConversationStatus[];
  priorities: SupportConversationPriority[];
  channels: SupportChannel[];
  assignees: SupportAssignee[];
}

export const supportService = {
  async getSupportOverview(): Promise<SupportOverviewKpis> {
    await delay();
    return buildOverview();
  },
  async listSupportConversations(): Promise<SupportConversation[]> {
    await delay();
    return clone(
      [...supportConversationSeeds]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(withContext),
    );
  },
  async getSupportConversation(id: string): Promise<SupportConversation> {
    await delay();
    const seed = supportConversationSeeds.find((c) => c.id === id);
    if (!seed) throw new Error(`Support conversation not found: ${id}`);
    return clone(withContext(seed));
  },
  async listSupportCannedReplies(): Promise<SupportCannedReply[]> {
    await delay();
    return clone(supportCannedReplies);
  },
  async listSupportAssignees(): Promise<SupportAssignee[]> {
    await delay();
    return clone(supportAssignees);
  },
  async listSupportFilters(): Promise<SupportFilters> {
    await delay();
    return {
      statuses: ['open', 'pending', 'waiting_customer', 'waiting_internal', 'resolved', 'closed'],
      priorities: ['low', 'normal', 'high', 'urgent'],
      channels: ['chat', 'email', 'phone_note', 'whatsapp_later', 'system_note'],
      assignees: clone(supportAssignees),
    };
  },
  // --- Mock actions: safe no-op acknowledgements (no persistence/provider/network) ---
  async addInternalNoteMock(conversationId: string, _note: string): Promise<SupportMockActionResult> {
    await delay(80);
    return { ok: true, conversationId, message: 'Internal note not saved (mock).' };
  },
  async markConversationResolvedMock(conversationId: string): Promise<SupportMockActionResult> {
    await delay(80);
    return { ok: true, conversationId, message: 'Resolve is a mock action (no persistence).' };
  },
  async assignConversationMock(
    conversationId: string,
    _assigneeId: string,
  ): Promise<SupportMockActionResult> {
    await delay(80);
    return { ok: true, conversationId, message: 'Assignment is a mock action (no persistence).' };
  },
  async applyCannedReplyMock(
    conversationId: string,
    _replyId: string,
  ): Promise<SupportMockActionResult> {
    await delay(80);
    return { ok: true, conversationId, message: 'Reply not sent (mock — no provider).' };
  },
};
