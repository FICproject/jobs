import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { theme } from '../../styles/theme';
import interviewService from '../../services/interviewService';
import applicationService from '../../services/applicationService';
import hrService from '../../services/hrService';

export default function AdminInterviewsScreen() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [selectedInterview, setSelectedInterview] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [invData, appData, hrData] = await Promise.all([
        interviewService.getInterviews().catch(() => []),
        applicationService.getApplications().catch(() => []),
        hrService.getHrs().catch(() => []),
      ]);

      const applications = Array.isArray(appData) ? appData : [];
      const hrs = Array.isArray(hrData) ? hrData : [];
      const rawInterviews = Array.isArray(invData) ? invData : [];

      // Enrich interviews with HR & Application information to match Admin Website exactly
      const enriched = rawInterviews.map((inv) => {
        const app = applications.find(
          (a) =>
            (inv.applicationId && a.id === inv.applicationId) ||
            (inv.candidateId && a.candidateId === inv.candidateId)
        );

        const refCode = app?.referredBy || inv.referredBy || inv.hrReferralCode || '';
        const hr = hrs.find((h) => h.referralCode === refCode);

        const hrName = hr?.name || inv.hrName || (refCode ? 'HR Partner' : null);
        const hrReferralCode = refCode || (hr ? hr.referralCode : '');

        return {
          ...inv,
          candidateName: inv.candidateName || app?.candidateName || 'Candidate',
          candidateMobile: inv.candidateMobile || app?.candidateMobile || '',
          candidateEmail: inv.candidateEmail || app?.candidateEmail || '',
          jobTitle: inv.jobTitle || app?.jobTitle || 'Role',
          companyName: inv.companyName || app?.companyName || 'Company',
          hrName,
          hrReferralCode,
          round: inv.round || 'HR Screening',
          date: inv.date || '',
          time: inv.time || '',
          mode: inv.mode || 'Offline',
          location: inv.location || '',
          meetingLink: inv.meetingLink || '',
          interviewer: inv.interviewer || 'HR Panel',
        };
      });

      setInterviews(enriched);
    } catch (err) {
      console.error('Error loading interviews data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenLink = (url) => {
    if (!url) return;
    const cleanUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    Linking.openURL(cleanUrl).catch(() => {});
  };

  // Filter interviews based on search query
  const filteredInterviews = useMemo(() => {
    if (!searchQuery.trim()) return interviews;
    const q = searchQuery.toLowerCase();
    return interviews.filter((inv) => {
      return (
        (inv.candidateName && inv.candidateName.toLowerCase().includes(q)) ||
        (inv.jobTitle && inv.jobTitle.toLowerCase().includes(q)) ||
        (inv.companyName && inv.companyName.toLowerCase().includes(q)) ||
        (inv.hrName && inv.hrName.toLowerCase().includes(q)) ||
        (inv.hrReferralCode && inv.hrReferralCode.toLowerCase().includes(q)) ||
        (inv.round && inv.round.toLowerCase().includes(q)) ||
        (inv.interviewer && inv.interviewer.toLowerCase().includes(q))
      );
    });
  }, [interviews, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header matching Admin Website */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Scheduled Interviews</Text>
        <Text style={styles.headerSubtitle}>
          Upcoming HR, Technical, and Branch interviews.
        </Text>
      </View>

      {/* Search and View Controls */}
      <View style={styles.controlsBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidate, HR, job, company..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.switchRow}>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {filteredInterviews.length} {filteredInterviews.length === 1 ? 'Interview' : 'Interviews'}
            </Text>
          </View>

          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
              onPress={() => setViewMode('table')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.toggleBtnText, viewMode === 'table' && styles.toggleBtnTextActive]}
              >
                📋 Table
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'card' && styles.toggleBtnActive]}
              onPress={() => setViewMode('card')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.toggleBtnText, viewMode === 'card' && styles.toggleBtnTextActive]}
              >
                🗂️ Cards
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading scheduled interviews...</Text>
        </View>
      ) : filteredInterviews.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No interviews found</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Schedule interviews from the candidate applications screen.'}
          </Text>
        </ScrollView>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW MATCHING ADMIN WEBSITE */
        <ScrollView
          style={styles.tableScrollVertical}
          contentContainerStyle={styles.tableScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.tableCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.cell, styles.colCandidate]}>
                    <Text style={styles.headerColText}>Candidate</Text>
                  </View>
                  <View style={[styles.cell, styles.colHr]}>
                    <Text style={styles.headerColText}>HR / Partner</Text>
                  </View>
                  <View style={[styles.cell, styles.colJob]}>
                    <Text style={styles.headerColText}>Job Title</Text>
                  </View>
                  <View style={[styles.cell, styles.colCompany]}>
                    <Text style={styles.headerColText}>Company</Text>
                  </View>
                  <View style={[styles.cell, styles.colRound]}>
                    <Text style={styles.headerColText}>Round</Text>
                  </View>
                  <View style={[styles.cell, styles.colDateTime]}>
                    <Text style={styles.headerColText}>Date & Time</Text>
                  </View>
                  <View style={[styles.cell, styles.colMode]}>
                    <Text style={styles.headerColText}>Mode & Link / Address</Text>
                  </View>
                  <View style={[styles.cell, styles.colInterviewer]}>
                    <Text style={styles.headerColText}>Interviewer</Text>
                  </View>
                </View>

                {/* Table Body */}
                {filteredInterviews.map((inv, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <TouchableOpacity
                      key={String(inv.id || inv._id || idx)}
                      style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedInterview(inv)}
                    >
                      {/* Candidate */}
                      <View style={[styles.cell, styles.colCandidate]}>
                        <Text style={styles.candidateNameText} numberOfLines={2}>
                          {inv.candidateName}
                        </Text>
                        {inv.candidateMobile ? (
                          <Text style={styles.subDetailText}>{inv.candidateMobile}</Text>
                        ) : null}
                      </View>

                      {/* HR / Partner */}
                      <View style={[styles.cell, styles.colHr]}>
                        {inv.hrName ? (
                          <View>
                            <Text style={styles.hrNameText} numberOfLines={1}>
                              {inv.hrName}
                            </Text>
                            {inv.hrReferralCode ? (
                              <Text style={styles.hrCodeText}>{inv.hrReferralCode}</Text>
                            ) : null}
                          </View>
                        ) : (
                          <Text style={styles.directText}>Direct</Text>
                        )}
                      </View>

                      {/* Job Title */}
                      <View style={[styles.cell, styles.colJob]}>
                        <Text style={styles.jobTitleText} numberOfLines={2}>
                          {inv.jobTitle}
                        </Text>
                      </View>

                      {/* Company */}
                      <View style={[styles.cell, styles.colCompany]}>
                        <Text style={styles.companyText} numberOfLines={2}>
                          {inv.companyName}
                        </Text>
                      </View>

                      {/* Round */}
                      <View style={[styles.cell, styles.colRound]}>
                        <View style={styles.roundBadge}>
                          <Text style={styles.roundBadgeText}>{inv.round}</Text>
                        </View>
                      </View>

                      {/* Date & Time */}
                      <View style={[styles.cell, styles.colDateTime]}>
                        <Text style={styles.dateText}>{inv.date || 'TBD'}</Text>
                        <Text style={styles.timeText}>
                          {inv.time ? `at ${inv.time}` : ''}
                        </Text>
                      </View>

                      {/* Mode & Details */}
                      <View style={[styles.cell, styles.colMode]}>
                        {inv.mode === 'Online' ? (
                          <View>
                            <Text style={styles.onlineBadgeText}>🌐 Online</Text>
                            {inv.meetingLink ? (
                              <TouchableOpacity
                                onPress={() => handleOpenLink(inv.meetingLink)}
                                style={styles.linkTouch}
                              >
                                <Text style={styles.linkText} numberOfLines={1}>
                                  🔗 Join Link
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ) : (
                          <View>
                            <Text style={styles.offlineBadgeText}>🏢 Offline</Text>
                            {inv.location ? (
                              <Text style={styles.locationText} numberOfLines={2}>
                                📍 {inv.location}
                              </Text>
                            ) : null}
                          </View>
                        )}
                      </View>

                      {/* Interviewer */}
                      <View style={[styles.cell, styles.colInterviewer]}>
                        <Text style={styles.interviewerText} numberOfLines={2}>
                          {inv.interviewer || 'HR Panel'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* CARD VIEW */
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredInterviews.map((inv, idx) => (
            <TouchableOpacity
              key={String(inv.id || inv._id || idx)}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => setSelectedInterview(inv)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardBadgeRow}>
                    <View style={styles.roundBadge}>
                      <Text style={styles.roundBadgeText}>{inv.round}</Text>
                    </View>
                    {inv.mode === 'Online' ? (
                      <View style={[styles.modePill, styles.modeOnlinePill]}>
                        <Text style={styles.modeOnlineText}>🌐 Online</Text>
                      </View>
                    ) : (
                      <View style={[styles.modePill, styles.modeOfflinePill]}>
                        <Text style={styles.modeOfflineText}>🏢 Offline</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.candidateNameTextLarge}>{inv.candidateName}</Text>
                  <Text style={styles.cardJobTitle}>{inv.jobTitle}</Text>
                  <Text style={styles.cardCompany}>{inv.companyName}</Text>
                </View>
              </View>

              {/* HR / Partner Row */}
              <View style={styles.cardHrBox}>
                <Text style={styles.cardHrLabel}>HR / Partner:</Text>
                {inv.hrName ? (
                  <View style={styles.cardHrContent}>
                    <Text style={styles.cardHrName}>{inv.hrName}</Text>
                    {inv.hrReferralCode ? (
                      <Text style={styles.cardHrCode}>({inv.hrReferralCode})</Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.cardDirect}>Direct Application</Text>
                )}
              </View>

              {/* Schedule Info */}
              <View style={styles.cardDetailsGrid}>
                <View style={styles.cardDetailCol}>
                  <Text style={styles.gridLabel}>Date</Text>
                  <Text style={styles.gridVal}>{inv.date || 'TBD'}</Text>
                </View>
                <View style={styles.cardDetailCol}>
                  <Text style={styles.gridLabel}>Time</Text>
                  <Text style={styles.gridVal}>{inv.time || 'TBD'}</Text>
                </View>
                <View style={styles.cardDetailCol}>
                  <Text style={styles.gridLabel}>Interviewer</Text>
                  <Text style={styles.gridVal}>{inv.interviewer || 'HR Panel'}</Text>
                </View>
              </View>

              {inv.mode === 'Online' && inv.meetingLink ? (
                <TouchableOpacity
                  style={styles.meetBtn}
                  onPress={() => handleOpenLink(inv.meetingLink)}
                >
                  <Text style={styles.meetBtnText}>🔗 Open Meeting Link</Text>
                </TouchableOpacity>
              ) : null}

              {inv.mode === 'Offline' && inv.location ? (
                <View style={styles.locBox}>
                  <Text style={styles.locLabel}>Location:</Text>
                  <Text style={styles.locText}>{inv.location}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Detail Modal */}
      {selectedInterview && (
        <Modal
          visible={!!selectedInterview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedInterview(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Interview Details</Text>
                <TouchableOpacity
                  onPress={() => setSelectedInterview(null)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Candidate:</Text>
                  <Text style={styles.detailValueBold}>{selectedInterview.candidateName}</Text>
                </View>
                {selectedInterview.candidateMobile ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mobile:</Text>
                    <Text style={styles.detailValue}>{selectedInterview.candidateMobile}</Text>
                  </View>
                ) : null}
                {selectedInterview.candidateEmail ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedInterview.candidateEmail}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>HR / Partner:</Text>
                  <Text style={styles.detailValue}>
                    {selectedInterview.hrName
                      ? `${selectedInterview.hrName} (${selectedInterview.hrReferralCode || 'N/A'})`
                      : 'Direct Application'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Job Title:</Text>
                  <Text style={styles.detailValueBold}>{selectedInterview.jobTitle}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Company:</Text>
                  <Text style={styles.detailValue}>{selectedInterview.companyName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Round:</Text>
                  <Text style={styles.detailValueBold}>{selectedInterview.round}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Text style={styles.detailValueBold}>
                    {selectedInterview.date} {selectedInterview.time ? `at ${selectedInterview.time}` : ''}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mode:</Text>
                  <Text
                    style={[
                      styles.detailValueBold,
                      { color: selectedInterview.mode === 'Online' ? '#059669' : '#d97706' },
                    ]}
                  >
                    {selectedInterview.mode}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Interviewer:</Text>
                  <Text style={styles.detailValue}>
                    {selectedInterview.interviewer || 'HR Panel'}
                  </Text>
                </View>

                {selectedInterview.location ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedInterview.location}</Text>
                  </View>
                ) : null}

                {selectedInterview.meetingLink ? (
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      style={styles.modalMeetBtn}
                      onPress={() => handleOpenLink(selectedInterview.meetingLink)}
                    >
                      <Text style={styles.modalMeetBtnText}>🔗 Join Meeting Link</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {selectedInterview.notes ? (
                  <View style={styles.modalNotesBox}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{selectedInterview.notes}</Text>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  controlsBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#64748b',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    ...theme.shadows.sm,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#0f172a',
    fontWeight: '700',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },

  /* TABLE VIEW STYLES - Matches Admin Web Exactly */
  tableScrollVertical: {
    flex: 1,
  },
  tableScrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  headerColText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 14,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: '#ffffff',
  },
  rowOdd: {
    backgroundColor: '#fafcff',
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  colCandidate: {
    width: 170,
  },
  colHr: {
    width: 150,
  },
  colJob: {
    width: 180,
  },
  colCompany: {
    width: 150,
  },
  colRound: {
    width: 130,
  },
  colDateTime: {
    width: 150,
  },
  colMode: {
    width: 170,
  },
  colInterviewer: {
    width: 130,
  },
  candidateNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  subDetailText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  hrNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  hrCodeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  directText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  jobTitleText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  companyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  roundBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roundBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  onlineBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  offlineBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  linkTouch: {
    marginTop: 2,
  },
  linkText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  interviewerText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },

  /* CARD VIEW STYLES */
  cardScroll: {
    flex: 1,
  },
  cardListContent: {
    padding: 14,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  candidateNameTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardJobTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 2,
  },
  cardCompany: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modeOnlinePill: {
    backgroundColor: '#ecfdf5',
  },
  modeOnlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  modeOfflinePill: {
    backgroundColor: '#fffbeb',
  },
  modeOfflineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  cardHrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHrLabel: {
    fontSize: 11,
    color: '#64748b',
    marginRight: 6,
    fontWeight: '600',
  },
  cardHrContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHrName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 4,
  },
  cardHrCode: {
    fontSize: 11,
    color: '#64748b',
  },
  cardDirect: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  cardDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  cardDetailCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  gridVal: {
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
    alignItems: 'center',
  },
  meetBtnText: {
    fontSize: 12,
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

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: {
    width: 110,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
  },
  detailValueBold: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalMeetBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalMeetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalNotesBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
});
