import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Phone, MapPin, Wallet } from 'lucide-react-native';
import { apiService } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ActionSheet from '@/components/ActionSheet';

interface Vendor {
  id: string;
  vendor_id: string;
  full_name: string;
  primary_number: string;
  wallet_balance: number;
  bank_balance: number;
  address: string;
  city: string;
  account_status: string;
  created_at: string;
}

export default function VendorsScreen() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);

  const fetchVendors = async () => {
    try {
      setError(null);
      const data = await apiService.getVendors(0, 100);
      setVendors(data.vendors);
    } catch (error) {
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedVendor) return;
    
    try {
      await apiService.updateVendorAccountStatus(selectedVendor.vendor_id, status);
      setVendors(vendors.map(vendor => 
        vendor.vendor_id === selectedVendor.vendor_id 
          ? { ...vendor, account_status: status }
          : vendor
      ));
    } catch (error) {
      console.error('Failed to update vendor status:', error);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.primary_number.includes(searchQuery) ||
    vendor.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE', color: '#10B981' },
    { label: 'Inactive', value: 'INACTIVE', color: '#EF4444' },
    { label: 'Pending', value: 'PENDING', color: '#F59E0B' },
  ];

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN')}`;
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity 
      style={styles.vendorCard}
      onLongPress={() => {
        setSelectedVendor(item);
        setShowStatusSheet(true);
      }}
    >
      <View style={styles.vendorHeader}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.full_name}</Text>
          <StatusBadge status={item.account_status} />
        </View>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Wallet</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(item.wallet_balance)}</Text>
        </View>
      </View>
      
      <View style={styles.vendorDetails}>
        <View style={styles.detailItem}>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.primary_number}</Text>
        </View>
        <View style={styles.detailItem}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.city}</Text>
        </View>
        <View style={styles.detailItem}>
          <Wallet size={16} color="#6B7280" />
          <Text style={styles.detailText}>Bank: {formatCurrency(item.bank_balance)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchVendors} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendors</Text>
        <Text style={styles.subtitle}>{vendors.length} total vendors</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredVendors}
        renderItem={renderVendorItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      <ActionSheet
        visible={showStatusSheet}
        onClose={() => setShowStatusSheet(false)}
        title="Update Vendor Status"
        options={statusOptions}
        onSelect={handleStatusUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  vendorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vendorInfo: {
    flex: 1,
    gap: 8,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  vendorDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
});