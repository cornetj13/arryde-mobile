import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const TRACK_HEIGHT = 60;
const PADDING = 5;
const KNOB = TRACK_HEIGHT - PADDING * 2;

/**
 * The on/off duty control, sized to be read from across the car: a full-width
 * track that is red and says OFF DUTY, or green and says ON DUTY, with a knob
 * that slides between the two. Tapping anywhere on it flips the state; the
 * knob shows a spinner while the server call is in flight.
 *
 * The parent owns the state (isOnDuty from the driver store) — this only
 * animates toward whatever it is told, so a duty change that arrives over a
 * subscription slides the knob too.
 */
const DutyToggle = ({ isOnDuty, onToggle, loading = false }) => {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const anim = useRef(new Animated.Value(isOnDuty ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOnDuty ? 1 : 0,
      duration: 220,
      useNativeDriver: false, // color interpolation needs the JS driver
    }).start();
  }, [isOnDuty, anim]);

  const travel = Math.max(0, trackWidth - KNOB - PADDING * 2);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, travel] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.error.light, colors.rider.light],
  });
  // Each label lives on the side the knob is NOT covering.
  const onLabelOpacity = anim;
  const offLabelOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={isOnDuty ? 'On duty. Tap to go off duty.' : 'Off duty. Tap to go on duty.'}
      accessibilityState={{ checked: isOnDuty, busy: loading, disabled: loading }}
      onPress={onToggle}
      disabled={loading}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={({ pressed }) => [pressed && !loading && styles.pressed]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.Text style={[styles.label, styles.labelLeft, { opacity: onLabelOpacity }]}>
          ON DUTY
        </Animated.Text>
        <Animated.Text style={[styles.label, styles.labelRight, { opacity: offLabelOpacity }]}>
          OFF DUTY
        </Animated.Text>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.gray[600]} />
          ) : (
            <View
              style={[
                styles.knobDot,
                { backgroundColor: isOnDuty ? colors.rider.light : colors.error.light },
              ]}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    lineHeight: TRACK_HEIGHT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  labelLeft: {
    left: 24,
  },
  labelRight: {
    right: 24,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    // Always white: it has to pop against a saturated red or green track in
    // both light and dark mode, so it deliberately ignores the theme.
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  knobDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});

export default DutyToggle;
