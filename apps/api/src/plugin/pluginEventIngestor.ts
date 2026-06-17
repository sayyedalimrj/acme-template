/**
 * Plugin event-batch ingestor (backend skeleton).
 *
 * Pure helper that validates + caps an inbound batch of summary-only event envelopes. Rejects
 * batches containing raw secrets or PII. Returns an in-memory result; NO database writes, no
 * network. See `security-model.md`.
 */
import {
  MAX_SYNC_EVENT_RECORDS,
  type PluginEventIngestResult,
  type PluginSyncIssue,
} from './pluginSyncEnvelope';
import { validateNoRawPII, validateNoRawSecrets } from './pluginSyncValidator';

/**
 * Validate + cap an event batch. The batch is rejected if it is not an array or if any event
 * carries a raw secret or PII. Accepted batches are trimmed to the event cap.
 *
 * @param events Inbound event envelopes (summary-only).
 */
export function ingestPluginEventBatch(events: unknown): PluginEventIngestResult {
  const errors: PluginSyncIssue[] = [];
  const warnings: PluginSyncIssue[] = [];

  if (!Array.isArray(events)) {
    errors.push({ code: 'invalid_event_batch', message: 'Event batch must be an array.' });
    return {
      accepted: false,
      validation: { valid: false, errors, warnings },
      count: 0,
      events: [],
    };
  }

  if (events.length > MAX_SYNC_EVENT_RECORDS) {
    warnings.push({
      code: 'event_batch_truncated',
      message: `Event batch exceeds ${MAX_SYNC_EVENT_RECORDS}; extra events were dropped.`,
    });
  }

  const capped = events.slice(0, MAX_SYNC_EVENT_RECORDS) as Array<Record<string, unknown>>;
  errors.push(...validateNoRawSecrets(capped));
  errors.push(...validateNoRawPII(capped));

  const valid = errors.length === 0;
  return {
    accepted: valid,
    validation: { valid, errors, warnings },
    count: valid ? capped.length : 0,
    events: valid ? capped : [],
  };
}
