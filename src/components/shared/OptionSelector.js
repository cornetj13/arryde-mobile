import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';

const OptionSelector = ({ options, selected, onSelect, accentColor = colors.rider.dark }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.container}
  >
    {options.map((opt) => {
      const isSelected = selected === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.option,
            isSelected && { backgroundColor: accentColor, borderColor: accentColor },
          ]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  optionTextSelected: {
    color: colors.white,
  },
});

export default OptionSelector;
