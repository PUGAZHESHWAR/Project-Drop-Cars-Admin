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
import { Search, Phone, MapPin, Wallet, Car, User } from 'lucide-react-native';
import { apiService } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ActionSheet from '@/components/ActionSheet';

interface VehicleOwner {
  id: string;
  vehicle_owner_id: string;
  full_name: string;
  primary_number: string;
  wallet_balance: number;
  address: string;
  city: string;
  account_status: string;
  created_at: string;
}

export default function VehicleOwnersScreen() {
  const [vehicleOwners, setVehicleOwners] = useState<VehicleOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<VehicleOwner | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [ownerDetails, setOwnerDetails] = useState<any>({});

  const fetchVehicleOwners = async () => {
    try {
      setError(null);
      const data = await apiService.getVehicleOwners(0, 100);
      setVehicleOwners(data.vehicle_owners);
      
      // Fetch details for each owner to get car and driver counts
      const detailsPromises = data.vehicle_owners.map(async (owner: VehicleOwner) => {
        try {
          const details = await apiService.getVehicleOwnerDetails(owner.vehicle_owner_id);
          return {
            id: owner.vehicle_owner_id,
            carCount: details.cars?.length || 0,
            driverCount: details.drivers?.length || 0,
          };
        } catch (error) {
          return {
            id: owner.vehicle_owner_id,
            carCount: 0,
            driverCount: 0,
          };
        }
      });
      
      const details = await Promise.all(detailsPromises);
      const detailsMap = details.reduce((acc, detail) => {
        acc[detail.id] = detail;
        return acc;
      }, {} as any);
      
      setOwnerDetails(detailsMap);
    } catch (error) {
      setError('Failed to load vehicle owners. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicleOwners();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicleOwners();
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedOwner) return;
    
    try {
      await apiService.updateVehicleOwnerAccountStatus(selectedOwner.vehicle_owner_id, status);
      setVehicleOwners(vehicleOwners.map(owner => 
        owner.vehicle_owner_id === selectedOwner.vehicle_owner_id 
          ? { ...owner, account_status: status }
          : owner
      ));
    } catch (error) {
      console.error('Failed to update vehicle owner status:', error);
    }
  };

  const filteredVehicleOwners = vehicleOwners.filter(owner =>
    owner.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.primary_number.includes(searchQuery) ||
    owner.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE', color: '#10B981' },
    { label: 'Inactive', value: 'INACTIVE', color: '#EF4444' },
    { label: 'Pending', value: 'PENDING', color: '#F59E0B' },
  ];

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN')}`;
  };

  const renderOwnerItem = ({ item }: { item: VehicleOwner }) => {
    const details = ownerDetails[item.vehicle_owner_id] || { carCount: 0, driverCount: 0 };
    
    return (
      <TouchableOpacity 
        style={styles.ownerCard}
        onLongPress={() => {
          setSelectedOwner(item);
          setShowStatusSheet(true);
        }}
      >
        <View style={styles.ownerHeader}>
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>{item.full_name}</Text>
            <StatusBadge status={item.account_status} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Wallet</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(item.wallet_balance)}</Text>
          </View>
        </View>
        
        <View style={styles.ownerDetails}>
          <View style={styles.detailItem}>
            <Phone size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.primary_number}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.city}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Car size={16} color="#3B82F6" />
            <Text style={styles.statText}>{details.carCount} Cars</Text>
          </View>
          <View style={styles.statItem}>
            <User size={16} color="#8B5CF6" />
            <Text style={styles.statText}>{details.driverCount} Drivers</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchVehicleOwners} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Owners</Text>
        <Text style={styles.subtitle}>{vehicleOwners.length} total owners</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicle owners..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredVehicleOwners}
        renderItem={renderOwnerItem}
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
        title="Update Vehicle Owner Status"
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
  ownerCard: {
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
  ownerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ownerInfo: {
    flex: 1,
    gap: 8,
  },
  ownerName: {
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
  ownerDetails: {
    gap: 8,
    marginBottom: 16,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});