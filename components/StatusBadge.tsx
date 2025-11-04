import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  type?: 'account' | 'document' | 'car' | 'driver' | 'transfer';
}

export default function StatusBadge({ status, type = 'account' }: StatusBadgeProps) {
  const getStatusColor = (status: string, type: string) => {
    const normalizedStatus = status?.toLowerCase();
    
    if (type === 'document') {
      switch (normalizedStatus) {
        case 'verified':
          return '#10B981';
        case 'pending':
          return '#F59E0B';
        case 'invalid':
          return '#EF4444';
        default:
          return '#6B7280';
      }
    }
    
    if (type === 'transfer') {
      switch (normalizedStatus) {
        case 'approved':
          return '#10B981';
        case 'pending':
          return '#F59E0B';
        case 'rejected':
          return '#EF4444';
        default:
          return '#6B7280';
      }
    }
    
    switch (normalizedStatus) {
      case 'active':
      case 'online':
        return '#10B981';
      case 'inactive':
      case 'offline':
      case 'blocked':
        return '#EF4444';
      case 'pending':
      case 'processing':
        return '#F59E0B';
      case 'driving':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const statusColor = getStatusColor(status, type);

  return (
    <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
      <Text style={[styles.text, { color: statusColor }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});