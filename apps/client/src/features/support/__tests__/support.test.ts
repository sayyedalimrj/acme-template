import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { supportService } from '@/services';

const FORBIDDEN_CREDENTIAL_KEYS = [
  'consumerKey',
  'consumerSecret',
  'applicationPassword',
  'password',
  'apiKey',
  'adminPassword',
  'token',
];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('support service (mock)', () => {
  it('returns queue items with frontend-safe fields only', async () => {
    const items = await supportService.listSupportQueue();
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      const keys = Object.keys(item);
      FORBIDDEN_CREDENTIAL_KEYS.forEach((k) => expect(keys).not.toContain(k));
    });
  });

  it('returns a request with its checklist and timeline', async () => {
    const item = await supportService.getSupportRequest('onb_new_2002');
    expect(item.checklist.length).toBeGreaterThan(0);
    expect(item.timeline.length).toBeGreaterThan(0);
  });

  it('updates status as a mock-only change and appends a timeline event', async () => {
    const before = await supportService.getSupportRequest('onb_exist_1001');
    const updated = await supportService.updateSupportStatus(
      'onb_exist_1001',
      'connection_scheduled',
    );
    expect(updated.status).toBe('connection_scheduled');
    expect(updated.timeline.length).toBe(before.timeline.length + 1);
    // Persisted in-memory for subsequent reads.
    const reread = await supportService.getSupportRequest('onb_exist_1001');
    expect(reread.status).toBe('connection_scheduled');
  });

  it('toggles a checklist item', async () => {
    const item = await supportService.getSupportRequest('onb_new_2001');
    const target = item.checklist[item.checklist.length - 1];
    const updated = await supportService.toggleChecklistItem('onb_new_2001', target.id);
    const toggled = updated.checklist.find((c) => c.id === target.id)!;
    expect(toggled.done).toBe(!target.done);
  });

  it('assigns and unassigns a teammate', async () => {
    const assigned = await supportService.assignSupportRequest('onb_new_2003', 'tm_reza');
    expect(assigned.assignee?.id).toBe('tm_reza');
    const unassigned = await supportService.assignSupportRequest('onb_new_2003', null);
    expect(unassigned.assignee).toBeNull();
  });

  it('adds a frontend-safe internal note', async () => {
    const before = await supportService.getSupportRequest('onb_exist_1001');
    const updated = await supportService.addInternalNote('onb_exist_1001', {
      body: 'تماس با مشتری برقرار شد.',
    });
    expect(updated.notes.length).toBe(before.notes.length + 1);
    const added = updated.notes[updated.notes.length - 1];
    expect(added.body).toBe('تماس با مشتری برقرار شد.');
    expect(JSON.stringify(updated)).not.toContain('consumerSecret');
  });
});
