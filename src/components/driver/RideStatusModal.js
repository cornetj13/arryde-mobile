import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Modal shown to the driver after a ride completes or gets canceled by the rider.
 * Lets them adjust their availability time before dismissing.
 *
 * Props:
 *  - visible: boolean
 *  - eventType: 'completed' | 'canceled'
 *  - riderName: string
 *  - onClose:      () => void                   (X, Done, and backdrop all call this)
 *  - onTimeChange: (minutes: number) => void    (-5, -1, 0=reset, +1, +5)
 */
const RideStatusModal = ({ visible, eventType, riderName, onClose, onTimeChange }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Never render anything for an unknown eventType, even when toggled visible.
  if (!eventType) return null;

  const isCompleted = eventType === 'completed';
  const accentColor = isCompleted ? colors.rider.dark : colors.error.light;
  const iconName = isCompleted ? 'checkmark-circle' : 'alert-circle';
  const title = isCompleted ? 'Ride Complete!' : 'Ride Canceled';
  const message = isCompleted
    ? `Your ride with ${riderName || 'the rider'} is complete.`
    : `${riderName || 'The rider'} canceled the ride.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Outer backdrop tap closes the modal. Inner card swallows the tap. */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* X close (top-right) */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.gray[500]} />
              </TouchableOpacity>

              {/* Event icon */}
              <View style={[styles.iconWrap, { backgroundColor: accentColor + '15' }]}>
                <Ionicons name={iconName} size={48} color={accentColor} />
              </View>

              {/* Title + message */}
              <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Availability adjust */}
              <Text style={styles.adjustLabel}>Adjust Your Availability</Text>
              <View style={styles.timeControlsRow}>
                <TouchableOpacity
                  style={[styles.timeButton, styles.timeNegative]}
                  onPress={() => onTimeChange(-5)}
                >
                  <Text style={styles.timeNegativeText}>-5m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeButton, styles.timeNegative]}
                  onPress={() => onTimeChange(-1)}
                >
                  <Text style={styles.timeNegativeText}>-1m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeButton, styles.timeReset]}
                  onPress={() => onTimeChange(0)}
                >
                  <Ionicons name="refresh" size={18} color={colors.gold.dark} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeButton, styles.timePositive]}
                  onPress={() => onTimeChange(1)}
                >
                  <Text style={styles.timePositiveText}>+1m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeButton, styles.timePositive]}
                  onPress={() => onTimeChange(5)}
                >
                  <Text style={styles.timePositiveText}>+5m</Text>
                </TouchableOpacity>
              </View>

              {/* Done */}
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: accentColor }]}
                onPress={onClose}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 22,
  },
  adjustLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  timeControlsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 64,
  },
  timeNegative: {
    backgroundColor: colors.error.light + '15',
    borderWidth: 1,
    borderColor: colors.error.light + '40',
  },
  timeNegativeText: {
    color: colors.error.light,
    fontSize: 14,
    fontWeight: '700',
  },
  timeReset: {
    backgroundColor: colors.gold.light + '25',
    borderWidth: 1,
    borderColor: colors.gold.dark + '40',
  },
  timePositive: {
    backgroundColor: colors.rider.light + '15',
    borderWidth: 1,
    borderColor: colors.rider.light + '40',
  },
  timePositiveText: {
    color: colors.rider.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  doneButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RideStatusModal;
