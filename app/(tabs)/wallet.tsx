import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Plus, 
  Phone, 
  User, 
  Wallet, 
  Camera,
  MapPin,
  CreditCard,
  FileText,
  MessageCircle,
  IndianRupee,
  Home,
  Navigation,
  Mail
} from 'lucide-react-native';
import { apiService } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VehicleOwner {
  vehicle_owner_id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  wallet_balance: number;
  aadhar_number: string;
  address: string;
  city: string;
  pincode: string;
  account_status: string;
}

export default function WalletScreen() {
  const [searchNumber, setSearchNumber] = useState('');
  const [foundOwner, setFoundOwner] = useState<VehicleOwner | null>(null);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    if (!searchNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setSearching(true);
    try {
      const owner = await apiService.searchVehicleOwner(searchNumber.trim());
      setFoundOwner(owner);
    } catch (error) {
      Alert.alert('Not Found', 'Vehicle owner not found with this number');
      setFoundOwner(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMoney = async () => {
    if (!foundOwner) {
      Alert.alert('Error', 'No vehicle owner selected');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amountInPaise = Math.round(parseFloat(amount));
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setAdding(true);
    try {
      const formData = new FormData();
      formData.append('vehicle_owner_id', foundOwner.vehicle_owner_id);
      formData.append('transaction_value', amountInPaise.toString());
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }
      if (reference.trim()) {
        formData.append('reference_value', reference.trim());
      }

      const result = await apiService.addMoneyToVehicleOwner(formData);
      
      Alert.alert(
        'Success',
        `₹${amount} added successfully to ${foundOwner.full_name}'s wallet`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setAmount('');
              setNotes('');
              setReference('');
              setFoundOwner(null);
              setSearchNumber('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add money. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount).toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Wallet size={32} color="#3B82F6" />
              <View style={styles.headerText}>
                <Text style={styles.title}>Wallet Management</Text>
                <Text style={styles.subtitle}>Add money to vehicle owner wallets</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Search Vehicle Owner</Text>
            
            <View style={styles.searchContainer}>
              <Phone size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter phone number"
                value={searchNumber}
                onChangeText={setSearchNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <Search size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>

            {foundOwner && (
              <View style={styles.ownerCard}>
                {/* Owner Header */}
                <View style={styles.ownerHeader}>
                  <View style={styles.ownerAvatar}>
                    <User size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.ownerInfo}>
                    <Text style={styles.ownerName}>{foundOwner.full_name}</Text>
                    <StatusBadge status={foundOwner.account_status} />
                  </View>
                  <View style={styles.walletInfo}>
                    <View style={styles.walletIcon}>
                      <IndianRupee size={16} color="#10B981" />
                    </View>
                    <Text style={styles.walletBalance}>
                      {formatCurrency(foundOwner.wallet_balance)}
                    </Text>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Contact Information</Text>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <Phone size={16} color="#3B82F6" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Primary Number</Text>
                        <Text style={styles.detailValue}>{foundOwner.primary_number}</Text>
                      </View>
                    </View>
                    
                    {foundOwner.secondary_number && (
                      <View style={styles.detailItem}>
                        <View style={styles.detailIcon}>
                          <Phone size={16} color="#6B7280" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Secondary Number</Text>
                          <Text style={styles.detailValue}>{foundOwner.secondary_number}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* Identity Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Identity Information</Text>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <CreditCard size={16} color="#8B5CF6" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Aadhar Number</Text>
                      <Text style={styles.detailValue}>{foundOwner.aadhar_number}</Text>
                    </View>
                  </View>
                </View>

                {/* Address Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Address Information</Text>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <Home size={16} color="#F59E0B" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Address</Text>
                        <Text style={styles.detailValue} numberOfLines={2}>
                          {foundOwner.address}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <Navigation size={16} color="#EF4444" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>City</Text>
                        <Text style={styles.detailValue}>{foundOwner.city}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <MapPin size={16} color="#10B981" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Pincode</Text>
                        <Text style={styles.detailValue}>{foundOwner.pincode}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {foundOwner && (
            <View style={styles.addMoneySection}>
              {/* <View style={styles.sectionHeader}>
                <Plus size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Add Money</Text>
              </View> */}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <View style={styles.amountInputContainer}>
                  <IndianRupee size={20} color="#6B7280" />
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <FileText size={16} color="#6B7280" />
                  <Text style={styles.inputLabel}>Reference (Optional)</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Payment reference or transaction ID"
                  value={reference}
                  onChangeText={setReference}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <MessageCircle size={16} color="#6B7280" />
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  placeholder="Add transaction notes or description"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity 
                style={[styles.addButton, adding && styles.addButtonDisabled]}
                onPress={handleAddMoney}
                disabled={adding}
              >
                {adding ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <>
                    <Plus size={20} color="white" />
                    <Text style={styles.addButtonText}>Add Money to Wallet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: {
    flex: 1,
    gap: 4,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  walletIcon: {
    backgroundColor: '#DCFCE7',
    padding: 4,
    borderRadius: 4,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  addMoneySection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 16,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});