import { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

/*
  Collapsible list section for the driver dashboard.

  When `hasUpdate` is true AND the section is collapsed, the header pulses
  green so the driver notices new activity without having to expand it. The
  pulse stops as soon as the section is opened (the driver has now seen it).
*/
const CollapsibleSection = ({
  title,
  count = 0,
  expanded,
  onToggle,
  hasUpdate = false,
  children,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only pulse while collapsed — an open section needs no attention grab.
    if (!hasUpdate || expanded) {
      pulse.stopAnimation(() => pulse.setValue(0));
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          // Color interpolation isn't supported by the native driver.
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [hasUpdate, expanded, pulse]);

  // Resting colors come from the theme so the header doesn't flash white in
  // dark mode; the pulse target stays brand green in both modes.
  const backgroundColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, 'rgba(78,167,1,0.30)'],
  });

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, 'rgba(78,167,1,0.85)'],
  });

  const showDot = hasUpdate && !expanded;

  return (
    <View style={styles.section}>
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
        <Animated.View style={[styles.header, { backgroundColor, borderColor }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{count}</Text>
            </View>
            {showDot && <View style={styles.updateDot} />}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.gray[500]}
          />
        </Animated.View>
      </TouchableOpacity>

      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
  },
  countPill: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.rider.light,
  },
  body: {
    marginTop: 10,
  },
});

export default CollapsibleSection;
