import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function SearchFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
  placeholder = 'Search by name, role, mobile...',
}) {
  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={searchTerm}
          onChangeText={onSearchChange}
          autoCapitalize="none"
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearBtn}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {statusOptions && statusOptions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {statusOptions.map((st) => {
            const isActive = (statusFilter || 'All').toLowerCase() === st.toLowerCase();
            return (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => onStatusFilterChange(st)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
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
  clearIcon: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 2,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#ffffff',
  },
});
