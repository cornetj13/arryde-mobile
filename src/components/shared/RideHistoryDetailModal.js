import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

/**
 * Format a value that might arrive from GraphQL as:
 *  - a string of digits (e.g. "1716422400000") — common when scalar serializes Date as ms
 *  - a raw number
 *  - an ISO date string
 * Returns a locale-formatted string, or null when we can't parse it.
 */
const formatTimestamp = (raw, mode = 'datetime') => {
  if (raw === null || raw === undefined || raw === '') return null;
  let d;
  const asNumber = typeof raw === 'string' ? Number(raw) : raw;
  if (typeof asNumber === 'number' && !Number.isNaN(asNumber)) {
    d = new Date(asNumber);
  } else {
    d = new Date(raw);
  }
  if (Number.isNaN(d.getTime())) return null;
  return mode === 'date' ? d.toLocaleDateString() : d.toLocaleString();
};

const getStatusInfo = (ride) => {
  if (ride.isCompleted)
    return { label: 'Completed', color: colors.rider.dark, icon: 'checkmark-circle' };
  if (ride.isCanceled)
    return { label: 'Canceled', color: colors.error.light, icon: 'close-circle' };
  if (ride.isExpired)
    return { label: 'Expired', color: colors.gold.dark, icon: 'time' };
  if (ride.isAccepted)
    return { label: 'Accepted', color: colors.teal.dark, icon: 'car' };
  if (ride.isRequested)
    return { label: 'Requested', color: colors.driver.light, icon: 'hourglass' };
  return { label: 'Unknown', color: colors.gray[400], icon: 'help-circle' };
};

/**
 * Outcome line for the bottom card: "Completed at ...", "Canceled by rider at ...", etc.
 */
const getOutcomeText = (ride) => {
  if (ride.isCompleted) {
    const when = formatTimestamp(ride.completedAt);
    return when ? `Completed on ${when}` : 'Ride completed';
  }
  if (ride.isCanceled) {
    const who =
      ride.canceledBy === 'RIDER'
        ? 'the rider'
        : ride.canceledBy === 'DRIVER'
          ? 'the driver'
          : null;
    const when = formatTimestamp(ride.canceledAt);
    if (who && when) return `Canceled by ${who} on ${when}`;
    if (who) return `Canceled by ${who}`;
    if (when) return `Canceled on ${when}`;
    return 'Ride canceled';
  }
  if (ride.isExpired) {
    const when = formatTimestamp(ride.expiredAt);
    return when ? `Expired on ${when}` : 'Ride expired — never accepted';
  }
  return null;
};

/**
 * Detail modal for a ride history row.
 *
 * Props:
 *  - visible:    boolean
 *  - ride:       ride object (from getRiderRideHistory / getDriverRideHistory)
 *  - viewerRole: 'rider' | 'driver' — controls whether we show driver-side or rider-side info
 *  - onClose:    () => void
 */
const RideHistoryDetailModal = ({ visible, ride, viewerRole, onClose }) => {
  if (!ride) return null;

  const status = getStatusInfo(ride);
  const requestedDate = formatTimestamp(ride.createdAt, 'date');
  const outcomeText = getOutcomeText(ride);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Drag handle (visual only) + X */}
              <View style={styles.sheetHeader}>
                <View style={styles.dragHandle} />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.gray[500]} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Date + status badge */}
                <View style={styles.summaryRow}>
                  <Text style={styles.dateText}>{requestedDate || 'Ride'}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: status.color + '15' },
                    ]}
                  >
                    <Ionicons name={status.icon} size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                {/* Map placeholder — reserved real estate for the real map later */}
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={36} color={colors.gold.dark} />
                  <Text style={styles.mapPlaceholderTitle}>Map View Coming Soon</Text>
                  <Text style={styles.mapPlaceholderText}>
                    See the full route on a map when this ride is replayed.
                  </Text>
                </View>

                {/* Counterpart */}
                {viewerRole === 'rider' && ride.driverName ? (
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Your Driver</Text>
                    <Text style={styles.cardValue}>{ride.driverName}</Text>
                  </View>
                ) : null}
                {viewerRole === 'driver' && ride.riderName ? (
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Your Rider</Text>
                    <Text style={styles.cardValue}>{ride.riderName}</Text>
                    {ride.phoneNumber ? (
                      <Text style={styles.cardSubValue}>{ride.phoneNumber}</Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Route */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Route</Text>
                  <View style={styles.locationItem}>
                    <View style={styles.locationTimeline}>
                      <View
                        style={[
                          styles.locationDot,
                          { backgroundColor: colors.rider.light },
                        ]}
                      />
                      <View style={styles.locationLine} />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>Pickup</Text>
                      <Text style={styles.locationAddress}>{ride.pickUp}</Text>
                    </View>
                  </View>
                  <View style={styles.locationItem}>
                    <View style={styles.locationTimeline}>
                      <View
                        style={[
                          styles.locationDot,
                          { backgroundColor: colors.error.light },
                        ]}
                      />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>Dropoff</Text>
                      <Text style={styles.locationAddress}>{ride.dropOff}</Text>
                    </View>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Passengers</Text>
                    <Text style={styles.detailVal}>
                      {ride.passengers}{' '}
                      {ride.passengers === 1 ? 'passenger' : 'passengers'}
                    </Text>
                  </View>
                  {ride.pickUpTime ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Requested for</Text>
                      <Text style={styles.detailVal}>{ride.pickUpTime}</Text>
                    </View>
                  ) : null}
                  {ride.bidAmount > 0 ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Bid</Text>
                      <Text style={[styles.detailVal, styles.bidValue]}>
                        ${ride.bidAmount}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Outcome */}
                {outcomeText ? (
                  <View
                    style={[
                      styles.card,
                      { borderLeftWidth: 3, borderLeftColor: status.color },
                    ]}
                  >
                    <Text style={styles.cardLabel}>Outcome</Text>
                    <Text style={styles.cardValue}>{outcomeText}</Text>
                  </View>
                ) : null}

                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    minHeight: '60%',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sheetHeader: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
    marginTop: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 0,
    padding: 6,
  },
  scrollContent: {
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mapPlaceholder: {
    backgroundColor: colors.gold.light + '20',
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gold.dark + '30',
    borderStyle: 'dashed',
  },
  mapPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold.dark,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  cardSubValue: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  locationItem: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  locationTimeline: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  locationLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[300],
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
    paddingBottom: 8,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 15,
    color: colors.gray[900],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailKey: {
    fontSize: 14,
    color: colors.gray[600],
  },
  detailVal: {
    fontSize: 14,
    color: colors.gray[900],
    fontWeight: '600',
  },
  bidValue: {
    color: colors.gold.dark,
    fontWeight: '700',
  },
});

export default RideHistoryDetailModal;
