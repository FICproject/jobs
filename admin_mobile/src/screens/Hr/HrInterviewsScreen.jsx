import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { theme } from '../../styles/theme';
import interviewService from '../../services/interviewService';
import hrService from '../../services/hrService';

export default function HrInterviewsScreen({ currentUser }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInterviews = useCallback(async () => {
    try {
      const [allInterviews, hrDash] = await Promise.all([
        interviewService.getInterviews().catch(() => []),
        currentUser?.referralCode
          ? hrService.getHrDashboard(currentUser.referralCode).catch(() => null)
          : null,
      ]);

      const hrCandidateIds = (hrDash?.applications || []).map((a) => a.candidateId);
      const matched = allInterviews.filter((i) =>
        hrCandidateIds.includes(i.candidateId)
      );

      // If no specific matched or candidateIds not set, show matching candidate names or all for HR
      setInterviews(matched.length > 0 ? matched : allInterviews);
    } catch (err) {
      console.error('Error loading HR interviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInterviews();
  };

  const renderItem = ({ item: inv }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.roundPill}>
              <Text style={styles.roundText}>{inv.round || 'Evaluation Round'}</Text>
            </View>
            <Text style={styles.candidateName}>{inv.candidateName || 'Candidate'}</Text>
            <Text style={styles.jobTitle}>{inv.jobTitle || 'Role'}</Text>
          </View>
          <View style={styles.modeBadge}>
            <Text style={styles.modeText}>
              {inv.mode === 'Online' ? '🌐 Online' : '🏢 Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>Date:</Text>
            <Text style={styles.timeVal}>{inv.date || 'TBD'}</Text>
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>Time:</Text>
            <Text style={styles.timeVal}>{inv.time || 'TBD'}</Text>
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>Panel:</Text>
            <Text style={styles.timeVal}>{inv.interviewer || 'HR Panel'}</Text>
          </View>
        </View>

        {inv.meetingLink ? (
          <TouchableOpacity
            style={styles.meetBtn}
            onPress={() => Linking.openURL(inv.meetingLink)}
          >
            <Text style={styles.meetBtnText}>🔗 Open Meeting ({inv.meetingLink})</Text>
          </TouchableOpacity>
        ) : null}

        {inv.location ? (
          <View style={styles.locBox}>
            <Text style={styles.locLabel}>Location:</Text>
            <Text style={styles.locText}>{inv.location}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenHeading}>Candidate Interviews</Text>
        <Text style={styles.screenSub}>Interviews scheduled for your referred candidates</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading scheduled interviews...</Text>
        </View>
      ) : (
        <FlatList
          data={interviews}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No scheduled interviews yet</Text>
              <Text style={styles.emptySub}>
                When candidates are scheduled for rounds, they will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    padding: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  screenSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roundPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  roundText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7c3aed',
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  jobTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 2,
  },
  modeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  timeRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 10,
  },
  timeCol: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  timeVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  meetBtn: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  meetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  locBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  locLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  locText: {
    fontSize: 11,
    color: '#334155',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
});
