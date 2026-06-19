/**
 * useAdvisorChat — a self-contained, in-memory chat store for the AI advisor with chat history.
 *
 * The active conversation plus a list of saved past sessions live in a module-level singleton
 * (shared across mounts via `useSyncExternalStore`), so navigating away and back keeps the
 * thread, and "new chat" archives the current one into history. Replies are produced locally by
 * the deterministic `advisorReply` helper — there is NO AI provider, NO network, NO secrets.
 */
import { useSyncExternalStore } from 'react';

import { advisorInitialConversation } from '@/mock/data/aiAdvisor';
import type { AIAdvisorConversationMessage } from '@/domain/types';

import { advisorReply } from './advisorHelpers';

/** A saved past conversation. */
export interface AdvisorChatSession {
  id: string;
  /** Short title derived from the first user message. */
  title: string;
  messages: AIAdvisorConversationMessage[];
  updatedAt: string;
}

interface AdvisorChatState {
  active: AIAdvisorConversationMessage[];
  sending: boolean;
  history: AdvisorChatSession[];
}

function seedConversation(): AIAdvisorConversationMessage[] {
  return advisorInitialConversation.map((m) => ({ ...m }));
}

let state: AdvisorChatState = {
  active: seedConversation(),
  sending: false,
  history: [],
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function setState(next: Partial<AdvisorChatState>): void {
  state = { ...state, ...next };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function hasUserMessage(messages: AIAdvisorConversationMessage[]): boolean {
  return messages.some((m) => m.role === 'user');
}

function deriveTitle(messages: AIAdvisorConversationMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  const text = (firstUser?.text ?? '').trim();
  if (text.length === 0) return '—';
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

let seq = 1;

/** Append the user's message and a deterministic local reply (with a short "sending" state). */
function send(text: string): void {
  const trimmed = text.trim();
  if (trimmed.length === 0 || state.sending) return;

  const now = new Date().toISOString();
  const userMessage: AIAdvisorConversationMessage = {
    id: `chat_user_${seq++}`,
    role: 'user',
    text: trimmed,
    createdAt: now,
  };
  setState({ active: [...state.active, userMessage], sending: true });

  // Simulate provider latency without any real network call.
  setTimeout(() => {
    const assistantMessage: AIAdvisorConversationMessage = {
      id: `chat_assistant_${seq++}`,
      role: 'assistant',
      text: advisorReply(trimmed),
      createdAt: new Date().toISOString(),
    };
    setState({ active: [...state.active, assistantMessage], sending: false });
  }, 320);
}

/** Archive the current conversation (if it has user messages) and start a fresh one. */
function newChat(): void {
  if (hasUserMessage(state.active)) {
    const session: AdvisorChatSession = {
      id: `chat_session_${seq++}`,
      title: deriveTitle(state.active),
      messages: state.active.map((m) => ({ ...m })),
      updatedAt: new Date().toISOString(),
    };
    setState({ history: [session, ...state.history], active: seedConversation(), sending: false });
  } else {
    setState({ active: seedConversation(), sending: false });
  }
}

/** Reopen a saved session as the active conversation (archiving the current one first). */
function openSession(id: string): void {
  const target = state.history.find((s) => s.id === id);
  if (!target) return;

  const remaining = state.history.filter((s) => s.id !== id);
  // Preserve the current thread in history if it has content and isn't the one being reopened.
  const nextHistory = hasUserMessage(state.active)
    ? [
        {
          id: `chat_session_${seq++}`,
          title: deriveTitle(state.active),
          messages: state.active.map((m) => ({ ...m })),
          updatedAt: new Date().toISOString(),
        },
        ...remaining,
      ]
    : remaining;

  setState({ active: target.messages.map((m) => ({ ...m })), history: nextHistory, sending: false });
}

export interface UseAdvisorChat {
  messages: AIAdvisorConversationMessage[];
  sending: boolean;
  history: AdvisorChatSession[];
  send: (text: string) => void;
  newChat: () => void;
  openSession: (id: string) => void;
}

function getSnapshot(): AdvisorChatState {
  return state;
}

export function useAdvisorChat(): UseAdvisorChat {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    messages: snapshot.active,
    sending: snapshot.sending,
    history: snapshot.history,
    send,
    newChat,
    openSession,
  };
}
