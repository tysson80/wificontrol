
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  View, 
  Text, 
  Platform,
  Switch,
  Alert,
  RefreshControl
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as Network from 'expo-network';
import { devicesStorage, Device } from "@/app/services/localStorage";

export default function DevicesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({
    ipAddress: 'جاري التحميل...',
    isConnected: false,
  });
  
  const [devices, setDevices] = useState<Device[]>([]);

  const loadNetworkData = async () => {
    try {
      console.log('Loading network data for devices...');
      
      const netState = await Network.getNetworkStateAsync();
      const ipAddress = await Network.getIpAddressAsync();
      
      console.log('Network state:', netState);
      console.log('IP Address:', ipAddress);

      setNetworkInfo({
        ipAddress: ipAddress,
        isConnected: netState.isConnected || false,
      });

      const savedDevices = await devicesStorage.getAll();
      
      if (!netState.isConnected) {
        const updatedDevices = savedDevices.map(device => ({
          ...device,
          isOnline: false,
        }));
        setDevices(updatedDevices);
      } else {
        const updatedDevices = savedDevices.map(device => ({
          ...device,
          isOnline: !device.isBlocked && Math.random() > 0.3,
          lastSeen: device.isOnline ? new Date().toISOString() : device.lastSeen,
        }));
        setDevices(updatedDevices);
      }
    } catch (error) {
      console.error('Error loading network data:', error);
    }
  };

  useEffect(() => {
    loadNetworkData();

    const subscription = Network.addNetworkStateListener((state) => {
      console.log('Network state changed in devices:', state);
      loadNetworkData();
    });

    const interval = setInterval(() => {
      console.log('Auto-refreshing device data...');
      loadNetworkData();
    }, 15000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNetworkData();
    setRefreshing(false);
  };

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'phone':
        return 'iphone';
      case 'laptop':
        return 'laptopcomputer';
      case 'tablet':
        return 'ipad';
      case 'gaming':
        return 'gamecontroller';
      case 'tv':
        return 'tv';
      default:
        return 'desktopcomputer';
    }
  };

  const toggleDeviceBlock = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    const newBlockedState = !device.isBlocked;
    
    try {
      await devicesStorage.update(deviceId, {
        isBlocked: newBlockedState,
        isOnline: newBlockedState ? false : device.isOnline,
      });

      setDevices(prevDevices =>
        prevDevices.map(d =>
          d.id === deviceId
            ? { ...d, isBlocked: newBlockedState, isOnline: newBlockedState ? false : d.isOnline }
            : d
        )
      );

      Alert.alert(
        newBlockedState ? 'تم حظر الجهاز' : 'تم إلغاء حظر الجهاز',
        `${device.name} ${newBlockedState ? 'محظور الآن' : 'يمكنه الاتصال الآن'}`,
        [{ text: 'حسناً' }]
      );

      console.log(`Device ${device.name} is now ${newBlockedState ? 'blocked' : 'unblocked'}`);
    } catch (error) {
      console.error('Error toggling device block:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الجهاز');
    }
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    return `منذ ${Math.floor(seconds / 86400)} يوم`;
  };

  const handleDevicePress = (device: Device) => {
    Alert.alert(
      device.name,
      `المالك: ${device.owner}\nعنوان IP: ${device.ipAddress}\nعنوان MAC: ${device.macAddress}\nاستهلاك البيانات: ${device.dataUsage}\nآخر ظهور: ${getTimeSince(device.lastSeen)}\nالحالة: ${device.isOnline ? 'متصل' : 'غير متصل'}`,
      [
        { text: 'إغلاق', style: 'cancel' },
        { 
          text: device.isBlocked ? 'إلغاء الحظر' : 'حظر الجهاز',
          style: device.isBlocked ? 'default' : 'destructive',
          onPress: () => toggleDeviceBlock(device.id)
        },
      ]
    );
  };

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerButton}
    >
      <IconSymbol name="chevron.left" color={colors.primary} size={24} />
    </Pressable>
  );

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const blockedDevices = devices.filter(d => d.isBlocked).length;

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "إدارة الأجهزة",
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
          <View style={[commonStyles.card, styles.networkCard]}>
            <View style={styles.networkInfo}>
              <IconSymbol 
                name={networkInfo.isConnected ? "wifi" : "wifi.slash"} 
                color={networkInfo.isConnected ? colors.success : colors.danger} 
                size={24} 
              />
              <View style={styles.networkTextContainer}>
                <Text style={styles.networkTitle}>
                  {networkInfo.isConnected ? 'متصل بالشبكة' : 'غير متصل'}
                </Text>
                <Text style={styles.networkSubtitle}>IP: {networkInfo.ipAddress}</Text>
              </View>
            </View>
          </View>

          <View style={[commonStyles.card, styles.statusCard]}>
            <IconSymbol name="checkmark.circle.fill" color={colors.success} size={20} />
            <Text style={styles.statusText}>
              البيانات يتم حفظها محلياً في التطبيق - AsyncStorage
            </Text>
          </View>

          <View style={[commonStyles.card, styles.summaryCard]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{devices.length}</Text>
                <Text style={styles.summaryLabel}>إجمالي الأجهزة</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {onlineDevices}
                </Text>
                <Text style={styles.summaryLabel}>متصل الآن</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  {blockedDevices}
                </Text>
                <Text style={styles.summaryLabel}>محظور</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>الأجهزة المتصلة</Text>
            {devices.map((device) => (
              <Pressable
                key={device.id}
                style={({ pressed }) => [
                  commonStyles.card,
                  styles.deviceCard,
                  pressed && styles.deviceCardPressed,
                ]}
                onPress={() => handleDevicePress(device)}
              >
                <View style={styles.deviceHeader}>
                  <View style={[
                    styles.deviceIcon,
                    { backgroundColor: device.isBlocked ? colors.danger + '20' : colors.primary + '20' }
                  ]}>
                    <IconSymbol 
                      name={getDeviceIcon(device.type) as any} 
                      color={device.isBlocked ? colors.danger : colors.primary} 
                      size={24} 
                    />
                  </View>
                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceNameRow}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      {device.isOnline && (
                        <View style={[styles.onlineBadge, { backgroundColor: colors.success }]} />
                      )}
                    </View>
                    <Text style={styles.deviceOwner}>{device.owner}</Text>
                    <Text style={styles.deviceLastSeen}>
                      {device.isOnline ? 'متصل الآن' : `آخر ظهور: ${getTimeSince(device.lastSeen)}`}
                    </Text>
                  </View>
                  <Switch
                    value={!device.isBlocked}
                    onValueChange={() => toggleDeviceBlock(device.id)}
                    trackColor={{ false: colors.danger, true: colors.success }}
                    thumbColor={colors.card}
                  />
                </View>
                
                <View style={styles.deviceDetails}>
                  <View style={styles.deviceDetailItem}>
                    <IconSymbol name="network" color={colors.textSecondary} size={16} />
                    <Text style={styles.deviceDetailText}>{device.ipAddress}</Text>
                  </View>
                  <View style={styles.deviceDetailItem}>
                    <IconSymbol name="arrow.down.circle" color={colors.textSecondary} size={16} />
                    <Text style={styles.deviceDetailText}>{device.dataUsage}</Text>
                  </View>
                </View>

                {device.isBlocked && (
                  <View style={styles.blockedBanner}>
                    <IconSymbol name="exclamationmark.triangle" color={colors.danger} size={16} />
                    <Text style={styles.blockedText}>هذا الجهاز محظور حالياً</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              commonStyles.card,
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => Alert.alert(
              'إضافة جهاز', 
              'لإضافة جهاز جديد، قم بتوصيله بالشبكة وسيظهر تلقائياً في القائمة.\n\nملاحظة: في التطبيق الحقيقي، سيتم اكتشاف الأجهزة تلقائياً من خلال الراوتر.',
              [{ text: 'حسناً' }]
            )}
          >
            <IconSymbol name="plus.circle" color={colors.primary} size={24} />
            <Text style={styles.addButtonText}>إضافة جهاز جديد</Text>
          </Pressable>

          <View style={[commonStyles.card, styles.infoBanner]}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <Text style={styles.infoBannerText}>
              يتم تحديث حالة الأجهزة تلقائياً كل 15 ثانية. اسحب للأسفل للتحديث اليدوي. جميع البيانات محفوظة محلياً.
            </Text>
          </View>
        </ScrollView>
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
  networkCard: {
    marginBottom: 16,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkTextContainer: {
    flex: 1,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  networkSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'SpaceMono',
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
  summaryCard: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 24,
  },
  deviceCard: {
    marginBottom: 12,
    padding: 16,
  },
  deviceCardPressed: {
    opacity: 0.7,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  onlineBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceOwner: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  deviceLastSeen: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  blockedText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
});
