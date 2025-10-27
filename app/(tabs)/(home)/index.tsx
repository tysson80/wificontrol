
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  View, 
  Text, 
  Platform,
  Dimensions,
  Alert,
  RefreshControl
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import { LinearGradient } from "expo-linear-gradient";
import * as Network from 'expo-network';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({
    isConnected: false,
    type: 'UNKNOWN',
    ipAddress: 'جاري التحميل...',
    connectedDevices: 0,
    activeDevices: 0,
  });

  // Load real network data
  const loadNetworkData = async () => {
    try {
      console.log('Loading network data...');
      
      // Get network state
      const netState = await Network.getNetworkStateAsync();
      console.log('Network state:', netState);
      
      // Get IP address
      let ipAddress = 'غير متاح';
      try {
        ipAddress = await Network.getIpAddressAsync();
        console.log('IP Address:', ipAddress);
      } catch (error) {
        console.log('Error getting IP address:', error);
      }

      // Simulate device count (in real app, this would come from router API)
      const deviceCount = Math.floor(Math.random() * 5) + 3;
      const activeCount = Math.floor(Math.random() * deviceCount) + 1;

      setNetworkStatus({
        isConnected: netState.isConnected || false,
        type: netState.type || 'UNKNOWN',
        ipAddress: ipAddress,
        connectedDevices: deviceCount,
        activeDevices: activeCount,
      });
    } catch (error) {
      console.error('Error loading network data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات الشبكة');
    }
  };

  // Initial load
  useEffect(() => {
    loadNetworkData();

    // Set up network state listener
    const subscription = Network.addNetworkStateListener((state) => {
      console.log('Network state changed:', state);
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: state.isConnected || false,
        type: state.type || 'UNKNOWN',
      }));

      // Alert user when network changes
      if (state.isConnected === false) {
        Alert.alert('تنبيه', 'تم قطع الاتصال بالشبكة');
      } else if (state.isConnected === true) {
        Alert.alert('تنبيه', 'تم الاتصال بالشبكة');
        loadNetworkData(); // Reload data when connected
      }
    });

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing network data...');
      loadNetworkData();
    }, 30000);

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

  const getNetworkTypeLabel = (type: string) => {
    switch (type) {
      case 'WIFI':
        return 'واي فاي';
      case 'CELLULAR':
        return 'بيانات الجوال';
      case 'ETHERNET':
        return 'إيثرنت';
      case 'BLUETOOTH':
        return 'بلوتوث';
      case 'VPN':
        return 'VPN';
      case 'NONE':
        return 'غير متصل';
      default:
        return 'غير معروف';
    }
  };

  const getNetworkSpeed = () => {
    // In real app, this would measure actual speed
    if (!networkStatus.isConnected) return 'غير متصل';
    if (networkStatus.type === 'WIFI') return `${Math.floor(Math.random() * 100) + 50} Mbps`;
    if (networkStatus.type === 'CELLULAR') return `${Math.floor(Math.random() * 50) + 10} Mbps`;
    return 'غير معروف';
  };

  const quickStats = [
    {
      icon: 'wifi',
      label: 'نوع الشبكة',
      value: getNetworkTypeLabel(networkStatus.type),
      color: colors.accent,
    },
    {
      icon: 'devices',
      label: 'الأجهزة المتصلة',
      value: `${networkStatus.activeDevices}/${networkStatus.connectedDevices}`,
      color: colors.primary,
    },
    {
      icon: 'shield.checkmark',
      label: 'الحماية',
      value: networkStatus.isConnected ? 'نشطة' : 'غير نشطة',
      color: networkStatus.isConnected ? colors.success : colors.danger,
    },
  ];

  const quickActions = [
    {
      id: 'network-settings',
      title: 'إعدادات الشبكة',
      description: 'إدارة الشبكات المحلية وإعدادات الاتصال',
      icon: 'wifi',
      color: colors.success,
      route: '/(tabs)/(home)/network-settings',
    },
    {
      id: 'devices',
      title: 'إدارة الأجهزة',
      description: 'عرض وإدارة جميع الأجهزة المتصلة',
      icon: 'laptopcomputer',
      color: colors.primary,
      route: '/(tabs)/(home)/devices',
    },
    {
      id: 'time-limits',
      title: 'حدود الوقت',
      description: 'تعيين أوقات استخدام الإنترنت',
      icon: 'clock',
      color: colors.secondary,
      route: '/(tabs)/(home)/time-limits',
    },
    {
      id: 'content-filter',
      title: 'تصفية المحتوى',
      description: 'حظر المحتوى غير المناسب',
      icon: 'shield.lefthalf.filled',
      color: colors.accent,
      route: '/(tabs)/(home)/content-filter',
    },
    {
      id: 'reports',
      title: 'التقارير',
      description: 'عرض تقارير الاستخدام والنشاط',
      icon: 'chart.bar',
      color: colors.highlight,
      route: '/(tabs)/(home)/reports',
    },
  ];

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => {
        Alert.alert(
          'معلومات الشبكة',
          `عنوان IP: ${networkStatus.ipAddress}\nنوع الاتصال: ${getNetworkTypeLabel(networkStatus.type)}\nالحالة: ${networkStatus.isConnected ? 'متصل' : 'غير متصل'}`,
          [{ text: 'حسناً' }]
        );
      }}
      style={styles.headerButton}
    >
      <IconSymbol name="gear" color={colors.primary} size={24} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "التحكم الأبوي",
            headerRight: renderHeaderRight,
            headerLargeTitle: true,
          }}
        />
      )}
      <View style={[commonStyles.container]}>
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
          {/* Network Status Card */}
          <Pressable 
            style={[commonStyles.card, styles.statusCard]}
            onPress={() => router.push('/(tabs)/(home)/network-settings')}
          >
            <View style={styles.statusHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>حالة الشبكة</Text>
                <Text style={styles.statusSubtitle}>
                  {networkStatus.isConnected ? `متصل - ${getNetworkTypeLabel(networkStatus.type)}` : 'غير متصل'}
                </Text>
                <Text style={styles.statusIp}>IP: {networkStatus.ipAddress}</Text>
              </View>
              <View style={styles.statusRight}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: networkStatus.isConnected ? colors.success : colors.danger }
                ]} />
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </View>
            </View>
          </Pressable>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {quickStats.map((stat, index) => (
              <View key={index} style={[commonStyles.card, styles.statCard]}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <IconSymbol name={stat.icon as any} color={stat.color} size={24} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>الإجراءات السريعة</Text>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  commonStyles.card,
                  styles.actionCard,
                  pressed && styles.actionCardPressed,
                ]}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <IconSymbol name={action.icon as any} color={action.color} size={28} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>النشاط الأخير</Text>
            <View style={commonStyles.card}>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: colors.accent + '20' }]}>
                  <IconSymbol name="iphone" color={colors.accent} size={20} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>جهاز أحمد - iPhone</Text>
                  <Text style={styles.activityTime}>متصل منذ 2 ساعة</Text>
                </View>
                <View style={[styles.activityBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.activityBadgeText, { color: colors.success }]}>نشط</Text>
                </View>
              </View>
              
              <View style={commonStyles.divider} />
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: colors.secondary + '20' }]}>
                  <IconSymbol name="laptopcomputer" color={colors.secondary} size={20} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>جهاز سارة - Laptop</Text>
                  <Text style={styles.activityTime}>انتهى وقت الاستخدام</Text>
                </View>
                <View style={[styles.activityBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Text style={[styles.activityBadgeText, { color: colors.warning }]}>محظور</Text>
                </View>
              </View>
              
              <View style={commonStyles.divider} />
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol name="gamecontroller" color={colors.primary} size={20} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>PlayStation 5</Text>
                  <Text style={styles.activityTime}>متصل منذ 30 دقيقة</Text>
                </View>
                <View style={[styles.activityBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.activityBadgeText, { color: colors.success }]}>نشط</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Info Banner */}
          <View style={[commonStyles.card, styles.infoBanner]}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <Text style={styles.infoBannerText}>
              اسحب للأسفل لتحديث البيانات. يتم التحديث التلقائي كل 30 ثانية.
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
    marginRight: 8,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statusIp: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'SpaceMono',
  },
  statusRight: {
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  actionCardPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
