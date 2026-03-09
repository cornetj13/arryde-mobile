import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const BidBadge = ({ amount }) => {
  if (!amount || amount <= 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>$$ ${amount} Bid $$</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.gold.light,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  text: {
    color: colors.gray[900],
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BidBadge;
