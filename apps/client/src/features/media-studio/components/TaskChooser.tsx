/**
 * TaskChooser — selectable cards for each mock media task (improve/repair/background/
 * lifestyle/hero/ad/video/storyboard/resize/alt-text). Selection drives mock generation.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { MediaStudioTaskType } from '@/domain/types';

import { MEDIA_TASKS, taskDescriptionKey, taskLabelKey } from '../mediaStudioHelpers';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TASK_ICON: Record<MediaStudioTaskType, IoniconName> = {
  improve_low_quality_photo: 'sparkles-outline',
  repair_damaged_photo: 'bandage-outline',
  remove_background: 'cut-outline',
  replace_background: 'color-wand-outline',
  create_white_background: 'square-outline',
  create_lifestyle_image: 'sunny-outline',
  create_hero_banner: 'image-outline',
  create_social_ad_creative: 'megaphone-outline',
  resize_for_marketplace: 'resize-outline',
  generate_alt_text: 'text-outline',
  create_promo_video_concept: 'videocam-outline',
  create_product_storyboard: 'film-outline',
};

export interface TaskChooserProps {
  selected: MediaStudioTaskType | null;
  onSelect: (task: MediaStudioTaskType) => void;
}

export function TaskChooser({ selected, onSelect }: TaskChooserProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();

  return (
    <View
      testID="media-task-chooser"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}
    >
      {MEDIA_TASKS.map((task) => {
        const isSelected = task === selected;
        return (
          <Pressable
            key={task}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(task)}
            style={({ pressed }) => [
              {
                flexGrow: 1,
                flexBasis: 220,
                minWidth: 200,
                flexDirection: rowDirection,
                alignItems: 'center',
                gap: tokens.spacing.sm,
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.md,
                borderWidth: isSelected ? tokens.borderWidth.thick : tokens.borderWidth.hairline,
                borderColor: isSelected ? tokens.color.primary : tokens.color.border,
                backgroundColor: isSelected ? tokens.color.primarySoft : tokens.color.surface,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name={TASK_ICON[task]} size={20} color={tokens.color.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="label">{t(taskLabelKey(task))}</Text>
              <Text variant="caption" tone="muted">
                {t(taskDescriptionKey(task))}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
