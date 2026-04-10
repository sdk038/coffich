import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type Props = React.PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  centered?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
}>;

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  style,
  centered = false,
  scrollProps,
}: Props) {
  const insets = useSafeAreaInsets();
  const mergedContentStyle = [
    styles.content,
    centered && styles.contentCentered,
    { paddingBottom: Math.max(insets.bottom, 12) + 24 },
    contentContainerStyle,
  ];

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={mergedContentStyle}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={mergedContentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentCentered: {
    justifyContent: 'center',
  },
});
