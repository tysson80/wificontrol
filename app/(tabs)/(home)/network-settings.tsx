
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  View, 
  Text, 
  Platform,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as Network from 'expo-network';
import { networkSettingsStorage, NetworkSetting } from "@/app/services/localStorage";

export default function NetworkSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentNetwork, setCurrentNetwork] = useState({
    ssid: 'جاري التحميل...',
    ipAddress: 'جاري التحميل...',
    isConnected: false,
    type: 'UNKNOWN',
  });

  const [newNetwork, setNewNetwork] = useState({
    ssid: '',
    password: '',
    securityType: 'WPA2' as NetworkSetting['securityType'],
  });

  const [savedNetworks, setSavedNetworks] = useState<NetworkSetting[]>([]);

  const loadNetworkData = async () => {
    try {
      console.log('Loading current network data...');
      
      const netState = await Network.getNetworkStateAsync();
      const ipAddress = await Network.getIpAddressAsync();
      
      console.log('Network state:', netState);
      console.log('IP Address:', ipAddress);

      let ssid = 'غير متصل';
      if (netState.isConnected) {
        if (netState.type === 'WIFI') {
          ssid = 'Home WiFi';
        } else if (netState.type === 'CELLULAR') {
          ssid = 'بيانات الجوال';
        } else {
          ssid = 'شبكة غير معروفة';
        }
      }

      setCurrentNetwork({
        ssid: ssid,
        ipAddress: ipAddress,
        isConnected: netState.isConnected || false,
        type: netState.type || 'UNKNOWN',
      });

      await loadSavedNetworks(ssid, netState.isConnected);
    } catch (error) {
      console.error('Error loading network data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات الشبكة');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedNetworks = async (currentSsid: string, isConnected: boolean) => {
    try {
      console.log('Loading saved networks from local storage...');
      
      const networks = await networkSettingsStorage.getAll();
      console.log('Loaded networks from local storage:', networks.length);
      
      const networksWithStatus = networks.map(network => ({
        ...network,
        isConnected: network.ssid === currentSsid && isConnected,
      }));
      
      setSavedNetworks(networksWithStatus);
    } catch (error) {
      console.error('Error in loadSavedNetworks:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الشبكات المحفوظة');
    }
  };

  useEffect(() => {
    loadNetworkData();

    const subscription = Network.addNetworkStateListener((state) => {
      console.log('Network state changed:', state);
      loadNetworkData();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNetworkData();
    setRefreshing(false);
  };

  const handleAddNetwork = async () => {
    if (!newNetwork.ssid.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم الشبكة (SSID)');
      return;
    }

    if (!newNetwork.password.trim() && newNetwork.securityType !== 'Open') {
      Alert.alert('خطأ', 'الرجاء إدخال كلمة المرور');
      return;
    }

    try {
      console.log('Saving network to local storage...');
      
      const network = await networkSettingsStorage.add({
        ssid: newNetwork.ssid,
        password: newNetwork.password,
        securityType: newNetwork.securityType,
        isConnected: false,
        signalStrength: Math.floor(Math.random() * 40) + 60,
      });

      console.log('Network saved successfully:', network);
      setSavedNetworks(prev => [network, ...prev]);
      setShowAddModal(false);
      setNewNetwork({ ssid: '', password: '', securityType: 'WPA2' });

      Alert.alert(
        'تم الحفظ',
        `تم حفظ إعدادات الشبكة "${network.ssid}" في التطبيق.\n\nملاحظة: في التطبيق الحقيقي، سيتم استخدام هذه المعلومات للاتصال بالراوتر وإدارة الشبكة.`,
        [{ text: 'حسناً' }]
      );
    } catch (error) {
      console.error('Error in handleAddNetwork:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
  };

  const handleConnectNetwork = async (network: NetworkSetting) => {
    Alert.alert(
      'الاتصال بالشبكة',
      `هل تريد الاتصال بالشبكة "${network.ssid}"?\n\nملاحظة: React Native لا يدعم الاتصال البرمجي بشبكات WiFi لأسباب أمنية. في التطبيق الحقيقي، سيتم استخدام API الراوتر للإدارة.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'محاكاة الاتصال',
          onPress: async () => {
            try {
              await networkSettingsStorage.updateAllConnectedStatus(network.id);
              
              setSavedNetworks(prev => prev.map(n => ({
                ...n,
                isConnected: n.id === network.id,
                lastConnected: n.id === network.id ? new Date().toISOString() : n.lastConnected,
              })));
              
              setCurrentNetwork(prev => ({
                ...prev,
                ssid: network.ssid,
                isConnected: true,
              }));
              
              Alert.alert('نجح', `تم الاتصال بالشبكة "${network.ssid}" (محاكاة)`);
            } catch (error) {
              console.error('Error in handleConnectNetwork:', error);
              Alert.alert('خطأ', 'حدث خطأ غير متوقع');
            }
          }
        },
      ]
    );
  };

  const handleDeleteNetwork = (networkId: string) => {
    const network = savedNetworks.find(n => n.id === networkId);
    if (!network) return;

    Alert.alert(
      'حذف الشبكة',
      `هل تريد حذف الشبكة "${network.ssid}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await networkSettingsStorage.delete(networkId);
              setSavedNetworks(prev => prev.filter(n => n.id !== networkId));
              Alert.alert('تم الحذف', `تم حذف الشبكة "${network.ssid}" من التطبيق`);
            } catch (error) {
              console.error('Error in handleDeleteNetwork:', error);
              Alert.alert('خطأ', 'حدث خطأ غير متوقع');
            }
          }
        },
      ]
    );
  };

  const getSignalIcon = (strength?: number) => {
    if (!strength) return 'wifi.slash';
    if (strength >= 75) return 'wifi';
    if (strength >= 50) return 'wifi';
    if (strength >= 25) return 'wifi';
    return 'wifi';
  };

  const getSignalColor = (strength?: number) => {
    if (!strength) return colors.textSecondary;
    if (strength >= 75) return colors.success;
    if (strength >= 50) return colors.warning;
    return colors.danger;
  };

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerButton}
    >
      <IconSymbol name="chevron.left" color={colors.primary} size={24} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "إعدادات الشبكة",
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={commonStyles.container}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={[commonStyles.card, styles.noticeCard]}>
            <IconSymbol name="exclamationmark.triangle" color={colors.warning} size={24} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>ملاحظة هامة</Text>
              <Text style={styles.noticeText}>
                React Native لا يدعم مسح شبكات WiFi أو الاتصال بها برمجياً لأسباب أمنية. 
                هذه الشاشة توضح كيفية إدارة إعدادات الشبكة في تطبيق حقيقي يستخدم API الراوتر.
              </Text>
            </View>
          </View>

          <View style={[commonStyles.card, styles.statusCard]}>
            <IconSymbol name="checkmark.circle.fill" color={colors.success} size={20} />
            <Text style={styles.statusText}>
              البيانات يتم حفظها محلياً في التطبيق - AsyncStorage
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>الشبكة الحالية</Text>
            <View style={[commonStyles.card, styles.currentNetworkCard]}>
              <View style={styles.currentNetworkHeader}>
                <View style={[
                  styles.networkIconContainer,
                  { backgroundColor: currentNetwork.isConnected ? colors.success + '20' : colors.danger + '20' }
                ]}>
                  <IconSymbol 
                    name={currentNetwork.isConnected ? "wifi" : "wifi.slash"} 
                    color={currentNetwork.isConnected ? colors.success : colors.danger} 
                    size={32} 
                  />
                </View>
                <View style={styles.currentNetworkInfo}>
                  <Text style={styles.currentNetworkName}>{currentNetwork.ssid}</Text>
                  <Text style={styles.currentNetworkStatus}>
                    {currentNetwork.isConnected ? 'متصل' : 'غير متصل'}
                  </Text>
                  {currentNetwork.isConnected && (
                    <Text style={styles.currentNetworkIp}>IP: {currentNetwork.ipAddress}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={commonStyles.sectionTitle}>الشبكات المحفوظة</Text>
              <Pressable
                onPress={() => setShowAddModal(true)}
                style={styles.addButton}
              >
                <IconSymbol name="plus.circle.fill" color={colors.primary} size={24} />
              </Pressable>
            </View>

            {loading ? (
              <View style={[commonStyles.card, styles.emptyState]}>
                <IconSymbol name="arrow.clockwise" color={colors.primary} size={48} />
                <Text style={styles.emptyStateText}>جاري التحميل...</Text>
              </View>
            ) : savedNetworks.length === 0 ? (
              <View style={[commonStyles.card, styles.emptyState]}>
                <IconSymbol name="wifi.slash" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyStateText}>لا توجد شبكات محفوظة</Text>
                <Text style={styles.emptyStateSubtext}>
                  اضغط على + لإضافة شبكة جديدة
                </Text>
              </View>
            ) : (
              savedNetworks.map((network) => (
                <Pressable
                  key={network.id}
                  style={({ pressed }) => [
                    commonStyles.card,
                    styles.networkCard,
                    network.isConnected && styles.networkCardConnected,
                    pressed && styles.networkCardPressed,
                  ]}
                  onPress={() => !network.isConnected && handleConnectNetwork(network)}
                  onLongPress={() => handleDeleteNetwork(network.id)}
                >
                  <View style={styles.networkCardHeader}>
                    <View style={styles.networkCardLeft}>
                      <IconSymbol 
                        name={getSignalIcon(network.signalStrength)} 
                        color={getSignalColor(network.signalStrength)} 
                        size={24} 
                      />
                      <View style={styles.networkCardInfo}>
                        <View style={styles.networkNameRow}>
                          <Text style={styles.networkName}>{network.ssid}</Text>
                          {network.isConnected && (
                            <View style={styles.connectedBadge}>
                              <Text style={styles.connectedBadgeText}>متصل</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.networkSecurity}>{network.securityType}</Text>
                        {network.lastConnected && (
                          <Text style={styles.networkLastConnected}>
                            آخر اتصال: {new Date(network.lastConnected).toLocaleDateString('ar-SA')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.networkCardRight}>
                      {network.signalStrength && (
                        <Text style={[
                          styles.signalStrength,
                          { color: getSignalColor(network.signalStrength) }
                        ]}>
                          {network.signalStrength}%
                        </Text>
                      )}
                      <IconSymbol 
                        name="chevron.right" 
                        color={colors.textSecondary} 
                        size={20} 
                      />
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>كيف يعمل في التطبيق الحقيقي؟</Text>
            <View style={commonStyles.card}>
              <View style={styles.howItWorksItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.stepNumberText, { color: colors.primary }]}>1</Text>
                </View>
                <Text style={styles.howItWorksText}>
                  الاتصال بالراوتر عبر API الخاص به (مثل TP-Link، Netgear، إلخ)
                </Text>
              </View>
              
              <View style={commonStyles.divider} />
              
              <View style={styles.howItWorksItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.secondary + '20' }]}>
                  <Text style={[styles.stepNumberText, { color: colors.secondary }]}>2</Text>
                </View>
                <Text style={styles.howItWorksText}>
                  الحصول على قائمة الشبكات المتاحة من الراوتر
                </Text>
              </View>
              
              <View style={commonStyles.divider} />
              
              <View style={styles.howItWorksItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>3</Text>
                </View>
                <Text style={styles.howItWorksText}>
                  إدارة الاتصالات والأجهزة من خلال لوحة تحكم الراوتر
                </Text>
              </View>
              
              <View style={commonStyles.divider} />
              
              <View style={styles.howItWorksItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.stepNumberText, { color: colors.success }]}>4</Text>
                </View>
                <Text style={styles.howItWorksText}>
                  تطبيق قواعد التحكم الأبوي على مستوى الراوتر
                </Text>
              </View>
            </View>
          </View>

          <View style={[commonStyles.card, styles.infoBanner]}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <Text style={styles.infoBannerText}>
              اضغط مطولاً على أي شبكة محفوظة لحذفها. جميع البيانات يتم حفظها محلياً في التطبيق.
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelButton}>إلغاء</Text>
              </Pressable>
              <Text style={styles.modalTitle}>إضافة شبكة</Text>
              <Pressable onPress={handleAddNetwork}>
                <Text style={styles.modalSaveButton}>حفظ</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>اسم الشبكة (SSID)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newNetwork.ssid}
                  onChangeText={(text) => setNewNetwork(prev => ({ ...prev, ssid: text }))}
                  placeholder="أدخل اسم الشبكة"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>نوع الأمان</Text>
                <View style={styles.securityTypeContainer}>
                  {(['WPA2', 'WPA3', 'WEP', 'Open'] as const).map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.securityTypeButton,
                        newNetwork.securityType === type && styles.securityTypeButtonActive,
                      ]}
                      onPress={() => setNewNetwork(prev => ({ ...prev, securityType: type }))}
                    >
                      <Text style={[
                        styles.securityTypeText,
                        newNetwork.securityType === type && styles.securityTypeTextActive,
                      ]}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {newNetwork.securityType !== 'Open' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>كلمة المرور</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newNetwork.password}
                    onChangeText={(text) => setNewNetwork(prev => ({ ...prev, password: text }))}
                    placeholder="أدخل كلمة المرور"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View style={[commonStyles.card, styles.modalInfoCard]}>
                <IconSymbol name="info.circle" color={colors.primary} size={20} />
                <Text style={styles.modalInfoText}>
                  سيتم حفظ هذه المعلومات محلياً في التطبيق لاستخدامها في الاتصال بالراوتر وإدارة الشبكة.
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '10',
    marginBottom: 12,
    gap: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.success + '10',
    marginBottom: 16,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  currentNetworkCard: {
    padding: 20,
  },
  currentNetworkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  networkIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentNetworkInfo: {
    flex: 1,
  },
  currentNetworkName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  currentNetworkStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  currentNetworkIp: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'SpaceMono',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  networkCard: {
    marginBottom: 12,
    padding: 16,
  },
  networkCardConnected: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  networkCardPressed: {
    opacity: 0.7,
  },
  networkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  networkCardInfo: {
    flex: 1,
  },
  networkNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  connectedBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  connectedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  networkSecurity: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  networkLastConnected: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  networkCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  signalStrength: {
    fontSize: 14,
    fontWeight: '600',
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  howItWorksText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    paddingTop: 6,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: colors.primary + '10',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCancelButton: {
    fontSize: 16,
    color: colors.danger,
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  securityTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  securityTypeButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  securityTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  securityTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  securityTypeTextActive: {
    color: colors.card,
  },
  modalInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.primary + '10',
    marginTop: 8,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
