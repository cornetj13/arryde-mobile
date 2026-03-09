import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const InfoRow = ({ label, value, icon }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[900],
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
});

export default InfoRow;
