/**
 * Workflow service — in-memory, mock-only access to the Workflow Operations board.
 *
 * No persistence, no assignment permissions, no notifications, no automation execution. A
 * future `apps/api` owns workflow state + RBAC + audit.
 */
import type { WorkflowBoardKpis, WorkflowItem } from '@/domain/types';
import { workflowItems } from '@/mock/workflows';

const delay = (ms = 140) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const OPEN_STATUSES: WorkflowItem['status'][] = [
  'backlog',
  'todo',
  'in_progress',
  'waiting_customer',
  'waiting_internal',
  'blocked',
  'review',
];

function buildKpis(): WorkflowBoardKpis {
  return {
    open: workflowItems.filter((w) => OPEN_STATUSES.includes(w.status)).length,
    urgent: workflowItems.filter((w) => w.priority === 'urgent' && w.status !== 'done' && w.status !== 'canceled').length,
    overdue: workflowItems.filter((w) => w.sla === 'overdue').length,
    blocked: workflowItems.filter((w) => w.status === 'blocked').length,
    waitingCustomer: workflowItems.filter((w) => w.status === 'waiting_customer').length,
    // "Done this week" is a mock count of completed items in the current fixture window.
    doneThisWeek: workflowItems.filter((w) => w.status === 'done').length,
  };
}

export const workflowService = {
  async listWorkflows(): Promise<WorkflowItem[]> {
    await delay();
    return clone(workflowItems);
  },
  async getWorkflow(id: string): Promise<WorkflowItem> {
    await delay();
    const item = workflowItems.find((w) => w.id === id);
    if (!item) throw new Error(`Workflow not found: ${id}`);
    return clone(item);
  },
  async getBoardKpis(): Promise<WorkflowBoardKpis> {
    await delay();
    return buildKpis();
  },
};
