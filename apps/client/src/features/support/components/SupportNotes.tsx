/**
 * SupportNotes — internal notes list plus a frontend-safe "add note" composer (mock-only).
 * Notes never contain secrets; the placeholder explicitly reminds staff not to paste keys.
 */
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button, Divider, Input, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { SupportInternalNote } from '@/domain/types';

export interface SupportNotesProps {
  notes: SupportInternalNote[];
  saving?: boolean;
  onAdd: (body: string) => void;
}

export function SupportNotes({
  notes,
  saving = false,
  onAdd,
}: SupportNotesProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const [draft, setDraft] = useState('');

  const submit = () => {
    const body = draft.trim();
    if (body.length === 0) return;
    onAdd(body);
    setDraft('');
  };

  return (
    <View style={{ gap: tokens.spacing.md }}>
      {notes.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t('support.notes.empty')}
        </Text>
      ) : (
        <View style={{ gap: tokens.spacing.sm }}>
          {notes.map((note, index) => (
            <View key={note.id} style={{ gap: 4 }}>
              {index > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: rowDirection,
                  justifyContent: 'space-between',
                  gap: tokens.spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                <Text variant="label">{note.author}</Text>
                <Text variant="caption" tone="muted">
                  {formatDateTime(note.createdAt)}
                </Text>
              </View>
              <Text variant="body">{note.body}</Text>
            </View>
          ))}
        </View>
      )}

      <Input
        value={draft}
        onChangeText={setDraft}
        placeholder={t('support.action.notePlaceholder')}
        editable={!saving}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />
      <Button
        label={saving ? t('support.action.saving') : t('support.action.noteSubmit')}
        variant="secondary"
        size="sm"
        loading={saving}
        onPress={submit}
      />
    </View>
  );
}
