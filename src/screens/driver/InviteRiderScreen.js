import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../stores';
import { GET_DRIVER_INVITE_CODE } from '../../graphql/queries';
import { GENERATE_INVITE_CODE } from '../../graphql/mutations';

const InviteRiderScreen = () => {
  const userId = useUserStore((state) => state.userId);
  const userName = useUserStore((state) => state.userName);

  const { data, loading, refetch } = useQuery(GET_DRIVER_INVITE_CODE, {
    variables: { driverId: userId },
    skip: !userId,
  });

  const [generateCode, { loading: generating }] = useMutation(GENERATE_INVITE_CODE);

  const inviteCode = data?.getDriverInviteCode;

  const handleGenerateCode = async () => {
    try {
      await generateCode({ variables: { driverId: userId } });
      refetch();
      Toast.show({ type: 'success', text1: 'Invite code generated!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to generate code' });
    }
  };

  const handleShare = async () => {
    if (!inviteCode?.code) return;

    try {
      await Share.share({
        message: `Join me on Arryde! Use my invite code: ${inviteCode.code}\n\nSign up and use this code to add me as your favorite driver.`,
        title: 'Arryde Invite',
      });
    } catch (err) {
      // User canceled share
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-add" size={40} color={colors.driver.dark} />
          </View>
          <Text style={styles.title}>Invite Riders</Text>
          <Text style={styles.subtitle}>
            Share your invite code to grow your rider base
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.driver.dark} />
        ) : inviteCode ? (
          <View style={styles.codeSection}>
            {/* Code Display */}
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your Invite Code</Text>
              <Text style={styles.codeText}>{inviteCode.code}</Text>
              <Text style={styles.usageText}>
                Used {inviteCode.usageCount} time{inviteCode.usageCount !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Share Button */}
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color={colors.white} />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>

            {/* Regenerate */}
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={handleGenerateCode}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.driver.dark} />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color={colors.driver.dark} />
                  <Text style={styles.regenerateText}>Generate New Code</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noCodeSection}>
            <Text style={styles.noCodeText}>
              You don't have an invite code yet.
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateCode}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color={colors.white} />
                  <Text style={styles.generateButtonText}>Generate Invite Code</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.gray[500]} />
          <Text style={styles.infoText}>
            When a rider signs up with your code, you'll automatically be added to their favorite drivers list.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    flex: 1,
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.driver.light + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
  },
  codeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  codeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.driver.light + '30',
  },
  codeLabel: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.driver.dark,
    letterSpacing: 4,
    marginBottom: 8,
  },
  usageText: {
    fontSize: 13,
    color: colors.gray[400],
  },
  shareButton: {
    backgroundColor: colors.driver.dark,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  regenerateText: {
    fontSize: 14,
    color: colors.driver.dark,
    fontWeight: '600',
  },
  noCodeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  noCodeText: {
    fontSize: 15,
    color: colors.gray[500],
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: colors.driver.dark,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
  },
  infoText: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
    flex: 1,
  },
});

export default InviteRiderScreen;
