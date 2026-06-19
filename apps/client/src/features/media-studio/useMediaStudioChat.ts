/**
 * useMediaStudioChat — a tiny, self-contained chat store for the simplified Media Studio.
 *
 * The merchant sends a prompt and/or attaches a sample image; the studio replies with a mock
 * "generated image" (a tinted placeholder) and a short note. State lives in a module-level
 * singleton shared via `useSyncExternalStore`. There is NO real AI/media provider, NO upload,
 * NO network, and NO secrets — outputs are placeholders only (see security-model.md).
 */
import { useSyncExternalStore } from 'react';

import type { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface StudioImage {
  color: string;
  icon: IoniconName;
}

export interface StudioMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Optional text (prompt for the user, note for the studio). */
  text?: string;
  /** Optional attached (user) or generated (assistant) placeholder image. */
  image?: StudioImage;
  /** i18n key for an assistant caption under a generated image. */
  captionKey?: 'mediaStudio.chat.generated';
}

interface StudioChatState {
  messages: StudioMessage[];
  sending: boolean;
}

const GENERATED_PALETTE: StudioImage[] = [
  { color: '#456EFE', icon: 'image' },
  { color: '#2BA770', icon: 'sparkles' },
  { color: '#7C5CFC', icon: 'color-wand' },
  { color: '#D9971B', icon: 'camera' },
];

let state: StudioChatState = { messages: [], sending: false };
const listeners = new Set<() => void>();
let seq = 1;
let paletteIndex = 0;

function emit(): void {
  for (const l of listeners) l();
}
function setState(next: Partial<StudioChatState>): void {
  state = { ...state, ...next };
  emit();
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function getSnapshot(): StudioChatState {
  return state;
}

/** i18n key for the assistant's reply text (image-aware). */
export type StudioReplyKey = 'mediaStudio.chat.reply' | 'mediaStudio.chat.replyImage';

/**
 * Send a prompt and/or an attached image. Returns nothing; the assistant reply is appended
 * after a short simulated delay. `replyText` is supplied by the screen (already localized).
 */
function send(input: { text?: string; image?: StudioImage }, replyFor: (hadImage: boolean) => string): void {
  const text = input.text?.trim();
  const hasContent = (text && text.length > 0) || Boolean(input.image);
  if (!hasContent || state.sending) return;

  const userMessage: StudioMessage = {
    id: `studio_user_${seq++}`,
    role: 'user',
    text: text && text.length > 0 ? text : undefined,
    image: input.image,
  };
  setState({ messages: [...state.messages, userMessage], sending: true });

  const generated = GENERATED_PALETTE[paletteIndex % GENERATED_PALETTE.length];
  paletteIndex += 1;

  setTimeout(() => {
    const assistantMessage: StudioMessage = {
      id: `studio_assistant_${seq++}`,
      role: 'assistant',
      text: replyFor(Boolean(input.image)),
      image: generated,
      captionKey: 'mediaStudio.chat.generated',
    };
    setState({ messages: [...state.messages, assistantMessage], sending: false });
  }, 420);
}

function reset(): void {
  setState({ messages: [], sending: false });
}

export interface UseMediaStudioChat {
  messages: StudioMessage[];
  sending: boolean;
  send: (input: { text?: string; image?: StudioImage }, replyFor: (hadImage: boolean) => string) => void;
  reset: () => void;
}

export function useMediaStudioChat(): UseMediaStudioChat {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { messages: snapshot.messages, sending: snapshot.sending, send, reset };
}
