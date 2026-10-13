import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { theme } from '../../styles/theme';
import payoutService from '../../services/payoutService';

export default function AdminIncentivesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Global Incentives State
  const [globalIncentives, setGlobalIncentives] = useState({});
  const [processNames, setProcessNames] = useState(['PROCESS 1', 'PROCESS 2', 'PROCESS 3']);
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Table Data State
  const [hrs, setHrs] = useState([]);
  const [partners, setPartners] = useState([]);
  const [applications, setApplications] = useState([]);

  // Modals
  const [bankModalUser, setBankModalUser] = useState(null);
  const [manageModalUser, setManageModalUser] = useState(null);
  const [candidateAmounts, setCandidateAmounts] = useState({});
  const [savingIncentives, setSavingIncentives] = useState(false);
  const [incentiveError, setIncentiveError] = useState('');

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      const [incentivesRes, processesRes, hrRes, partnerRes, appRes] = await Promise.all([
        payoutService.getGlobalIncentives().catch(() => ({})),
        payoutService.getPlacementProcesses().catch(() => []),
        payoutService.getHrs().catch(() => []),
        payoutService.getAllPartners().catch(() => []),
        payoutService.getApplications().catch(() => []),
      ]);

      // Set global incentives
      setGlobalIncentives(incentivesRes || {});

      // Derive unique Placement processes (sorted)
      const placementProcNames = Array.from(
        new Set(
          (Array.isArray(processesRes) ? processesRes : [])
            .filter((p) => p.itCategory === 'Placement')
            .map((p) => p.processName?.toUpperCase().trim())
        )
      )
        .filter(Boolean)
        .sort();

      if (placementProcNames.length > 0) {
        setProcessNames(placementProcNames);
      } else {
        const fallbackKeys = Object.keys(incentivesRes || {});
        if (fallbackKeys.length > 0) {
          setProcessNames(fallbackKeys.sort());
        } else {
          setProcessNames(['PROCESS 1', 'PROCESS 2', 'PROCESS 3']);
        }
      }

      setHrs(Array.isArray(hrRes) ? hrRes : []);
      setPartners(Array.isArray(partnerRes) ? partnerRes : []);
      setApplications(Array.isArray(appRes) ? appRes : []);
    } catch (err) {
      console.error('Error loading incentives data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Save Global IT Training Incentives
  const handleSaveGlobalIncentives = async () => {
    setSavingGlobal(true);
    try {
      await payoutService.saveGlobalIncentives(globalIncentives);
      Alert.alert('Success', 'IT Training Incentives saved successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save IT Training Incentives.');
    } finally {
      setSavingGlobal(false);
    }
  };

  // Calculate table records
  const allUsersData = useMemo(() => {
    const combined = [...hrs, ...partners];
    return combined.map((user) => {
      const userApps = applications.filter(
        (app) =>
          app.referredBy === user.referralCode &&
          (app.status === 'Selected' || app.status === 'Converted')
      );

      let totalEarned = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let totalRequested = 0;
      const payableAppIds = [];

      userApps.forEach((app) => {
        const amt = Number(app.incentiveAmount) || 0;
        totalEarned += amt;
        if (app.incentiveStatus === 'Paid') {
          totalPaid += amt;
        } else if (app.incentiveStatus === 'Withdraw Requested') {
          totalRequested += amt;
          if (amt > 0) payableAppIds.push(app.id || app._id);
        } else {
          totalPending += amt;
          if (amt > 0) payableAppIds.push(app.id || app._id);
        }
      });

      const payableTotal = totalPending + totalRequested;

      return {
        id: user.id || user._id,
        rawUser: user,
        referralCode: user.referralCode || 'N/A',
        name: user.name || 'Unnamed',
        email: user.email || '',
        role: user.role === 'agent' ? 'agent' : 'hr',
        closedCandidates: userApps.length,
        totalIncentiveEarned: totalEarned,
        totalPaid,
        totalPending,
        totalRequested,
        payableTotal,
        payableAppIds,
        userApps,
        bankAccountNumber: user.bankAccountNumber,
        bankIfscCode: user.bankIfscCode,
      };
    });
  }, [hrs, partners, applications]);

  // Filtered list by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return allUsersData;
    const q = searchQuery.toLowerCase().trim();
    return allUsersData.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.referralCode.toLowerCase().includes(q)
      );
    });
  }, [allUsersData, searchQuery]);

  // Batch Payout (Pay Button)
  const handleBatchPay = (item) => {
    if (item.payableTotal <= 0 || item.payableAppIds.length === 0) return;

    Alert.alert(
      'Confirm Payout',
      `Mark all pending/requested payouts (₹${item.payableTotal.toLocaleString()}) for ${item.name} as Paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          style: 'default',
          onPress: async () => {
            try {
              await Promise.all(
                item.payableAppIds.map((appId) =>
                  payoutService.updateApplicationIncentiveStatus(appId, 'Paid')
                )
              );
              Alert.alert('Success', `Payout of ₹${item.payableTotal.toLocaleString()} marked as Paid!`);
              loadAllData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Error updating payout status');
            }
          },
        },
      ]
    );
  };

  // Batch Cancel / Clear Payout
  const handleBatchCancel = (item) => {
    if (item.payableTotal <= 0 || item.payableAppIds.length === 0) return;

    Alert.alert(
      'Cancel Pending Incentives',
      `Cancel/Remove pending ₹${item.payableTotal.toLocaleString()} for ${item.name}? This resets their pending incentive amount to ₹0.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const resetItems = item.payableAppIds.map((appId) => ({
                applicationId: appId,
                amount: 0,
              }));
              await payoutService.updateCandidateIncentives(item.id, resetItems);
              Alert.alert('Success', `Pending incentives cleared for ${item.name}.`);
              loadAllData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Error cancelling payout');
            }
          },
        },
      ]
    );
  };

  // Open Manage Incentives Modal
  const handleOpenManageModal = (item) => {
    const initialAmounts = {};
    item.userApps.forEach((app) => {
      const appId = app.id || app._id;
      initialAmounts[appId] = String(Number(app.incentiveAmount) || 0);
    });
    setCandidateAmounts(initialAmounts);
    setIncentiveError('');
    setManageModalUser(item);
  };

  // Toggle single candidate payout status inside modal
  const handleToggleSingleCandidateStatus = async (app) => {
    const appId = app.id || app._id;
    const currentStatus = app.incentiveStatus || 'Pending';
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';

    Alert.alert(
      'Change Status',
      `Mark candidate incentive of ₹${app.incentiveAmount} as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Mark as ${newStatus}`,
          onPress: async () => {
            try {
              await payoutService.updateApplicationIncentiveStatus(appId, newStatus);
              // Refresh apps
              const refreshedApps = await payoutService.getApplications();
              setApplications(Array.isArray(refreshedApps) ? refreshedApps : []);
              // Update local item
              if (manageModalUser) {
                const updatedApps = manageModalUser.userApps.map((a) =>
                  (a.id || a._id) === appId ? { ...a, incentiveStatus: newStatus } : a
                );
                setManageModalUser({ ...manageModalUser, userApps: updatedApps });
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  // Save Candidate Incentives Modal
  const handleSaveCandidateIncentives = async () => {
    if (!manageModalUser) return;
    setSavingIncentives(true);
    setIncentiveError('');
    try {
      const items = Object.entries(candidateAmounts).map(([appId, amount]) => ({
        applicationId: appId,
        amount: Number(amount) || 0,
      }));
      await payoutService.updateCandidateIncentives(manageModalUser.id, items);
      Alert.alert('Success', 'Incentives updated successfully!');
      setManageModalUser(null);
      loadAllData();
    } catch (err) {
      setIncentiveError(err.message || 'Failed to update candidate incentives.');
    } finally {
      setSavingIncentives(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading incentives & payouts...</Text>
      </View>
    );
  }

  // Calculate sum in manage modal
  const manageModalTotalSum = Object.values(candidateAmounts).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ============================================================== */}
        {/* HEADER SECTION (Matches Web Page Title & Description)          */}
        {/* ============================================================== */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>HR Incentives & Payouts</Text>
          <Text style={styles.headerSubtitle}>
            Track and manage incentive payments for HR referrals across all applications.
          </Text>
        </View>

        {/* ============================================================== */}
        {/* SECTION 1: IT Training Process Incentives (Global)             */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Text style={styles.sectionIconText}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>IT Training Process Incentives (Global)</Text>
              <Text style={styles.sectionSubtitle}>
                Set the universal HR incentive payout for each IT Training process. This applies
                universally to all candidate selections.
              </Text>
            </View>
          </View>

          {/* Process Inputs Row */}
          <View style={styles.processInputsWrapper}>
            {processNames.map((procName) => {
              const currentVal =
                globalIncentives[procName] !== undefined
                  ? String(globalIncentives[procName])
                  : '';
              return (
                <View key={procName} style={styles.processInputItem}>
                  <Text style={styles.processInputLabel}>{procName} (₹)</Text>
                  <TextInput
                    style={styles.processTextInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    value={currentVal}
                    onChangeText={(val) => {
                      const num = Number(val);
                      setGlobalIncentives((prev) => ({
                        ...prev,
                        [procName]: isNaN(num) ? 0 : num,
                      }));
                    }}
                  />
                </View>
              );
            })}
          </View>

          {/* Save Global Button */}
          <TouchableOpacity
            style={[styles.saveGlobalBtn, savingGlobal && styles.btnDisabled]}
            disabled={savingGlobal}
            onPress={handleSaveGlobalIncentives}
            activeOpacity={0.8}
          >
            {savingGlobal ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveGlobalBtnText}>💾 Save Global Incentives</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* SEARCH & VIEW CONTROLS                                         */}
        {/* ============================================================== */}
        <View style={styles.controlsBar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by HR, partner, or code..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'table' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('table')}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === 'table' && styles.viewToggleTextActive,
                ]}
              >
                📊 Table
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'card' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('card')}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === 'card' && styles.viewToggleTextActive,
                ]}
              >
                📇 Cards
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Records Counter */}
        <View style={styles.recordsCounterRow}>
          <Text style={styles.recordsCounterText}>
            Showing <Text style={styles.recordsCounterBold}>{filteredData.length}</Text> team members
          </Text>
        </View>

        {/* ============================================================== */}
        {/* SECTION 2: TABLE VIEW (Matches Web Table)                      */}
        {/* ============================================================== */}
        {viewMode === 'table' ? (
          <View style={styles.tableCardContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header Row */}
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.cell, styles.colHrDetails]}>
                    <Text style={styles.headerColText}>HR Details</Text>
                  </View>
                  <View style={[styles.cell, styles.colReferralCode]}>
                    <Text style={styles.headerColText}>Referral Code</Text>
                  </View>
                  <View style={[styles.cell, styles.colClosedCandidates]}>
                    <Text style={styles.headerColText}>Closed Candidates</Text>
                  </View>
                  <View style={[styles.cell, styles.colTotalIncentive]}>
                    <Text style={styles.headerColText}>Total Incentive Earned</Text>
                  </View>
                  <View style={[styles.cell, styles.colPayoutStatus]}>
                    <Text style={styles.headerColText}>Payout Status</Text>
                  </View>
                  <View style={[styles.cell, styles.colActions]}>
                    <Text style={styles.headerColText}>Actions</Text>
                  </View>
                </View>

                {/* Table Body */}
                {filteredData.length === 0 ? (
                  <View style={styles.emptyTableBox}>
                    <Text style={styles.emptyTableText}>
                      No incentives assigned yet. Assign incentives to HRs when candidates are
                      Selected/Converted.
                    </Text>
                  </View>
                ) : (
                  filteredData.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const canPay = item.payableTotal > 0;

                    return (
                      <View
                        key={String(item.id || item.referralCode || idx)}
                        style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
                      >
                        {/* HR Details */}
                        <View style={[styles.cell, styles.colHrDetails]}>
                          <TouchableOpacity
                            onPress={() => setBankModalUser(item)}
                            activeOpacity={0.7}
                            style={styles.nameBadgeContainer}
                          >
                            <Text style={styles.hrNameLink} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <View
                              style={[
                                styles.rolePill,
                                item.role === 'agent'
                                  ? styles.rolePillAgent
                                  : styles.rolePillHr,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.rolePillText,
                                  item.role === 'agent'
                                    ? styles.rolePillTextAgent
                                    : styles.rolePillTextHr,
                                ]}
                              >
                                {item.role === 'agent' ? 'Partner' : 'HR'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          <Text style={styles.hrEmailText} numberOfLines={1}>
                            {item.email}
                          </Text>
                        </View>

                        {/* Referral Code */}
                        <View style={[styles.cell, styles.colReferralCode]}>
                          <Text style={styles.referralCodeText}>{item.referralCode}</Text>
                        </View>

                        {/* Closed Candidates */}
                        <View style={[styles.cell, styles.colClosedCandidates]}>
                          <View style={styles.closedPill}>
                            <Text style={styles.closedPillText}>{item.closedCandidates}</Text>
                          </View>
                        </View>

                        {/* Total Incentive Earned */}
                        <View style={[styles.cell, styles.colTotalIncentive]}>
                          <Text style={styles.totalIncentiveText}>
                            ₹{item.totalIncentiveEarned.toLocaleString()}
                          </Text>
                        </View>

                        {/* Payout Status */}
                        <View style={[styles.cell, styles.colPayoutStatus]}>
                          <View style={styles.payoutStatusStack}>
                            <Text style={styles.payoutStatusLine}>
                              Paid:{' '}
                              <Text style={styles.payoutPaidVal}>
                                ₹{item.totalPaid.toLocaleString()}
                              </Text>
                            </Text>
                            <Text style={styles.payoutStatusLine}>
                              Pending:{' '}
                              <Text style={styles.payoutPendingVal}>
                                ₹{item.totalPending.toLocaleString()}
                              </Text>
                            </Text>
                            <Text style={styles.payoutStatusLine}>
                              Requested:{' '}
                              <Text
                                style={
                                  item.totalRequested > 0
                                    ? styles.payoutRequestedActiveVal
                                    : styles.payoutRequestedVal
                                }
                              >
                                ₹{item.totalRequested.toLocaleString()}
                              </Text>
                            </Text>
                          </View>
                        </View>

                        {/* Actions */}
                        <View style={[styles.cell, styles.colActions]}>
                          <View style={styles.actionsCellWrapper}>
                            {/* Pay & Cancel Buttons */}
                            <View style={styles.actionButtonsRow}>
                              <TouchableOpacity
                                style={[
                                  styles.actionSquareBtn,
                                  canPay ? styles.payBtnActive : styles.btnDisabledSquare,
                                ]}
                                disabled={!canPay}
                                onPress={() => handleBatchPay(item)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.actionIconText,
                                    canPay ? styles.payIconActive : styles.iconDisabled,
                                  ]}
                                >
                                  ✓
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.actionSquareBtn,
                                  canPay ? styles.cancelBtnActive : styles.btnDisabledSquare,
                                ]}
                                disabled={!canPay}
                                onPress={() => handleBatchCancel(item)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.actionIconText,
                                    canPay ? styles.cancelIconActive : styles.iconDisabled,
                                  ]}
                                >
                                  ✕
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {/* Manage Incentives Button */}
                            <TouchableOpacity
                              style={styles.manageIncentivesBtn}
                              onPress={() => handleOpenManageModal(item)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.manageIncentivesBtnText}>
                                🎁 Manage Incentives
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </View>
        ) : (
          /* ============================================================== */
          /* CARD VIEW (Optimized for Mobile)                              */
          /* ============================================================== */
          <View style={styles.cardListContainer}>
            {filteredData.length === 0 ? (
              <View style={styles.emptyTableBox}>
                <Text style={styles.emptyTableText}>
                  No incentives assigned yet. Assign incentives to HRs when candidates are
                  Selected/Converted.
                </Text>
              </View>
            ) : (
              filteredData.map((item, idx) => {
                const canPay = item.payableTotal > 0;
                return (
                  <View key={String(item.id || item.referralCode || idx)} style={styles.userCard}>
                    {/* Card Header */}
                    <View style={styles.cardHeaderRow}>
                      <TouchableOpacity
                        style={styles.cardUserLeft}
                        onPress={() => setBankModalUser(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.cardUserAvatar}>
                          <Text style={styles.cardAvatarText}>
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.cardNameRow}>
                            <Text style={styles.cardUserName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <View
                              style={[
                                styles.rolePill,
                                item.role === 'agent'
                                  ? styles.rolePillAgent
                                  : styles.rolePillHr,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.rolePillText,
                                  item.role === 'agent'
                                    ? styles.rolePillTextAgent
                                    : styles.rolePillTextHr,
                                ]}
                              >
                                {item.role === 'agent' ? 'Partner' : 'HR'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.cardUserEmail} numberOfLines={1}>
                            {item.email}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.cardCodeBadge}>
                        <Text style={styles.cardCodeText}>{item.referralCode}</Text>
                      </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.cardStatsGrid}>
                      <View style={styles.cardStatBox}>
                        <Text style={styles.cardStatLabel}>CLOSED</Text>
                        <Text style={styles.cardStatValue}>{item.closedCandidates}</Text>
                      </View>

                      <View style={styles.cardStatBox}>
                        <Text style={styles.cardStatLabel}>EARNED</Text>
                        <Text style={styles.cardStatEarnedValue}>
                          ₹{item.totalIncentiveEarned.toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.cardStatBox}>
                        <Text style={styles.cardStatLabel}>PAID</Text>
                        <Text style={styles.cardStatPaidValue}>
                          ₹{item.totalPaid.toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.cardStatBox}>
                        <Text style={styles.cardStatLabel}>PENDING</Text>
                        <Text style={styles.cardStatPendingValue}>
                          ₹{item.payableTotal.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {/* Card Actions */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.cardQuickPayBtn,
                          !canPay && styles.cardQuickPayBtnDisabled,
                        ]}
                        disabled={!canPay}
                        onPress={() => handleBatchPay(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cardQuickPayText,
                            !canPay && styles.cardQuickPayTextDisabled,
                          ]}
                        >
                          ✓ Pay (₹{item.payableTotal.toLocaleString()})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.cardQuickCancelBtn,
                          !canPay && styles.cardQuickCancelBtnDisabled,
                        ]}
                        disabled={!canPay}
                        onPress={() => handleBatchCancel(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cardQuickCancelText,
                            !canPay && styles.cardQuickCancelTextDisabled,
                          ]}
                        >
                          ✕ Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cardManageBtn}
                        onPress={() => handleOpenManageModal(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cardManageBtnText}>🎁 Manage</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============================================================== */}
      {/* MODAL 1: BANK DETAILS MODAL                                    */}
      {/* ============================================================== */}
      <Modal
        visible={Boolean(bankModalUser)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBankModalUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bankModalContainer}>
            {/* Modal Header */}
            <View style={styles.bankModalHeader}>
              <View>
                <Text style={styles.bankModalTitle}>🏦 Bank Details</Text>
                {bankModalUser && (
                  <Text style={styles.bankModalSub}>
                    {bankModalUser.name} ({bankModalUser.referralCode})
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setBankModalUser(null)}
                style={styles.modalCloseCircle}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.bankModalBody}>
              {bankModalUser?.bankAccountNumber && bankModalUser?.bankIfscCode ? (
                <View style={styles.bankInfoStack}>
                  <View style={styles.bankFieldBox}>
                    <Text style={styles.bankFieldLabel}>ACCOUNT NUMBER</Text>
                    <Text style={styles.bankFieldValue} selectable={true}>
                      {bankModalUser.bankAccountNumber}
                    </Text>
                  </View>

                  <View style={styles.bankFieldBox}>
                    <Text style={styles.bankFieldLabel}>IFSC CODE</Text>
                    <Text style={styles.bankFieldValue} selectable={true}>
                      {bankModalUser.bankIfscCode}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bankCopyDoneBtn}
                    onPress={() => {
                      Alert.alert('Bank Details', `Account: ${bankModalUser.bankAccountNumber}\nIFSC: ${bankModalUser.bankIfscCode}`);
                    }}
                  >
                    <Text style={styles.bankCopyDoneBtnText}>📋 View / Copy Information</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noBankBox}>
                  <View style={styles.noBankIconCircle}>
                    <Text style={styles.noBankIcon}>⚠️</Text>
                  </View>
                  <Text style={styles.noBankTitle}>No Bank Details</Text>
                  <Text style={styles.noBankMessage}>
                    This user has not updated their bank details in their Profile Settings yet.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setBankModalUser(null)}
              >
                <Text style={styles.modalDismissBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: MANAGE HR INCENTIVES MODAL                            */}
      {/* ============================================================== */}
      <Modal
        visible={Boolean(manageModalUser)}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setManageModalUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.manageModalContainer}>
            {/* Header */}
            <View style={styles.manageModalHeader}>
              <View>
                <Text style={styles.manageModalTitle}>🎁 Update HR Incentives</Text>
                {manageModalUser && (
                  <Text style={styles.manageModalSub}>
                    {manageModalUser.name} ({manageModalUser.referralCode})
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setManageModalUser(null)}
                style={styles.modalCloseCircle}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView style={styles.manageModalScroll} contentContainerStyle={styles.manageModalBody}>
              {incentiveError.length > 0 && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {incentiveError}</Text>
                </View>
              )}

              <Text style={styles.manageCandidatesHeading}>
                Closed Candidates ({manageModalUser?.userApps?.length || 0})
              </Text>

              {(!manageModalUser?.userApps || manageModalUser.userApps.length === 0) ? (
                <View style={styles.noCandidatesBox}>
                  <Text style={styles.noCandidatesTitle}>
                    No closed candidates yet for {manageModalUser?.name}.
                  </Text>
                  <Text style={styles.noCandidatesSub}>
                    Mark an application as <Text style={{ fontWeight: '700' }}>Selected</Text> /{' '}
                    <Text style={{ fontWeight: '700' }}>Converted</Text> to add an incentive.
                  </Text>
                </View>
              ) : (
                <View style={styles.candidatesListWrapper}>
                  {manageModalUser.userApps.map((app, index) => {
                    const appId = app.id || app._id;
                    const val = candidateAmounts[appId] ?? '0';
                    const isPaid = app.incentiveStatus === 'Paid';
                    const hasSavedAmt = Number(app.incentiveAmount) > 0;
                    const isMatchedAmt = Number(val) === Number(app.incentiveAmount);

                    return (
                      <View
                        key={String(appId || index)}
                        style={[
                          styles.candidateItemCard,
                          index > 0 && styles.candidateItemBorderTop,
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.candItemName}>{app.candidateName || 'Candidate'}</Text>
                          <Text style={styles.candItemDetails} numberOfLines={1}>
                            {app.companyName || 'Company'} · {app.jobTitle || 'Role'}{' '}
                            {app.candidateMobile ? `· ${app.candidateMobile}` : ''}
                          </Text>
                          <View style={styles.candStatusBadge}>
                            <Text style={styles.candStatusText}>{app.status}</Text>
                          </View>
                        </View>

                        <View style={styles.candAmountRow}>
                          <View style={styles.candInputBox}>
                            <Text style={styles.candCurrency}>₹</Text>
                            <TextInput
                              style={styles.candInput}
                              keyboardType="numeric"
                              value={val}
                              placeholder="0"
                              placeholderTextColor="#94a3b8"
                              onChangeText={(t) =>
                                setCandidateAmounts((prev) => ({
                                  ...prev,
                                  [appId]: t,
                                }))
                              }
                            />
                          </View>

                          {hasSavedAmt && isMatchedAmt && (
                            <TouchableOpacity
                              style={[
                                styles.candPayStatusBtn,
                                isPaid ? styles.candPaidBadge : styles.candPayNowBtn,
                              ]}
                              onPress={() => handleToggleSingleCandidateStatus(app)}
                            >
                              <Text
                                style={[
                                  styles.candPayStatusText,
                                  isPaid ? styles.candPaidText : styles.candPayNowText,
                                ]}
                              >
                                {isPaid ? 'Paid ✓' : 'Pay Now'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Total Summary */}
              <View style={styles.manageTotalBox}>
                <Text style={styles.manageTotalLabel}>Total Incentives</Text>
                <Text style={styles.manageTotalValue}>
                  ₹{manageModalTotalSum.toLocaleString()}
                </Text>
              </View>

              <Text style={styles.manageWorkspaceTip}>
                Each candidate's incentive and the total will be shown in {manageModalUser?.name}'s
                HR Workspace.
              </Text>

              {/* Action Buttons */}
              <View style={styles.manageActionButtonsRow}>
                <TouchableOpacity
                  style={styles.manageCancelBtn}
                  onPress={() => setManageModalUser(null)}
                >
                  <Text style={styles.manageCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.manageSaveBtn,
                    savingIncentives && styles.btnDisabled,
                  ]}
                  disabled={savingIncentives}
                  onPress={handleSaveCandidateIncentives}
                >
                  {savingIncentives ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.manageSaveBtnText}>✅ Save Incentive</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* HEADER */
  headerCard: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },

  /* GLOBAL INCENTIVES CARD */
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sectionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  sectionIconText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  processInputsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  processInputItem: {
    flex: 1,
    minWidth: 100,
  },
  processInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  processTextInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  saveGlobalBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    ...theme.shadows.sm,
  },
  saveGlobalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  /* CONTROLS BAR */
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: '#ffffff',
    ...theme.shadows.sm,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  viewToggleTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },

  recordsCounterRow: {
    marginBottom: 12,
  },
  recordsCounterText: {
    fontSize: 12,
    color: '#64748b',
  },
  recordsCounterBold: {
    fontWeight: '700',
    color: '#0f172a',
  },

  /* TABLE VIEW STYLES */
  tableCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 12,
  },
  headerColText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowEven: {
    backgroundColor: '#ffffff',
  },
  rowOdd: {
    backgroundColor: '#f8fafc',
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  /* COLUMN WIDTHS */
  colHrDetails: {
    width: 220,
  },
  colReferralCode: {
    width: 140,
  },
  colClosedCandidates: {
    width: 130,
    alignItems: 'center',
  },
  colTotalIncentive: {
    width: 160,
  },
  colPayoutStatus: {
    width: 160,
  },
  colActions: {
    width: 190,
  },

  /* CELL CONTENTS */
  nameBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  hrNameLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rolePillHr: {
    backgroundColor: '#fef3c7',
  },
  rolePillAgent: {
    backgroundColor: '#f3e8ff',
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rolePillTextHr: {
    color: '#d97706',
  },
  rolePillTextAgent: {
    color: '#7c3aed',
  },
  hrEmailText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  referralCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },

  closedPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  closedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  totalIncentiveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },

  payoutStatusStack: {
    gap: 3,
  },
  payoutStatusLine: {
    fontSize: 11,
    color: '#64748b',
  },
  payoutPaidVal: {
    color: '#10b981',
    fontWeight: '700',
  },
  payoutPendingVal: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  payoutRequestedVal: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  payoutRequestedActiveVal: {
    color: '#f59e0b',
    fontWeight: '700',
  },

  actionsCellWrapper: {
    gap: 6,
    alignItems: 'flex-start',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionSquareBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnActive: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#34d399',
  },
  cancelBtnActive: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f87171',
  },
  btnDisabledSquare: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionIconText: {
    fontSize: 15,
    fontWeight: '800',
  },
  payIconActive: {
    color: '#059669',
  },
  cancelIconActive: {
    color: '#dc2626',
  },
  iconDisabled: {
    color: '#94a3b8',
  },

  manageIncentivesBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  manageIncentivesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },

  emptyTableBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },

  /* CARD VIEW STYLES */
  cardListContainer: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '800',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardUserEmail: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cardCodeBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  cardStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  cardStatBox: {
    alignItems: 'center',
  },
  cardStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  cardStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  cardStatEarnedValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  cardStatPaidValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  cardStatPendingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#eab308',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardQuickPayBtn: {
    flex: 1,
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#34d399',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardQuickPayBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  cardQuickPayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardQuickPayTextDisabled: {
    color: '#94a3b8',
  },
  cardQuickCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 6,
    alignItems: 'center',
  },
  cardQuickCancelBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  cardQuickCancelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  cardQuickCancelTextDisabled: {
    color: '#94a3b8',
  },
  cardManageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    alignItems: 'center',
  },
  cardManageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },

  /* MODAL BACKDROP */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  /* BANK MODAL */
  bankModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  bankModalHeader: {
    backgroundColor: '#059669',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  bankModalSub: {
    fontSize: 12,
    color: '#d1fae5',
    marginTop: 3,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  bankModalBody: {
    padding: 18,
  },
  bankInfoStack: {
    gap: 12,
    marginBottom: 16,
  },
  bankFieldBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  bankFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  bankFieldValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  bankCopyDoneBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bankCopyDoneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  noBankBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noBankIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noBankIcon: {
    fontSize: 22,
  },
  noBankTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  noBankMessage: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  modalDismissBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDismissBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* MANAGE INCENTIVES MODAL */
  manageModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  manageModalHeader: {
    backgroundColor: '#059669',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  manageModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  manageModalSub: {
    fontSize: 12,
    color: '#d1fae5',
    marginTop: 3,
  },
  manageModalScroll: {
    maxHeight: 520,
  },
  manageModalBody: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  manageCandidatesHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  noCandidatesBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  noCandidatesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  noCandidatesSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  candidatesListWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  candidateItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  candidateItemBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  candItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  candItemDetails: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  candStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  candStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  candAmountRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
  candInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    width: 86,
    height: 34,
  },
  candCurrency: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginRight: 4,
  },
  candInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
  candPayStatusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 64,
    alignItems: 'center',
  },
  candPaidBadge: {
    backgroundColor: '#10b981',
  },
  candPayNowBtn: {
    backgroundColor: '#fef08a',
  },
  candPayStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  candPaidText: {
    color: '#ffffff',
  },
  candPayNowText: {
    color: '#854d0e',
  },
  manageTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  manageTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  manageTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
  },
  manageWorkspaceTip: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 16,
  },
  manageActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manageCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
  },
  manageCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  manageSaveBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
  },
  manageSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
