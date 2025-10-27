
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
  RefreshControl,
  Alert
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import { 
  timeLimitsStorage, 
  usageLogsStorage, 
  devicesStorage, 
  contentFiltersStorage,
  TimeLimit,
  UsageLog,
  Device,
  ContentFilter
} from "@/app/services/localStorage";

const { width } = Dimensions.get('window');

interface WeeklyDataPoint {
  day: string;
  hours: number;
  date: string;
}

interface TopUser {
  name: string;
  hours: number;
  percentage: number;
}

export default function ReportsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [totalHoursThisWeek, setTotalHoursThisWeek] = useState(0);
  const [totalHoursLastWeek, setTotalHoursLastWeek] = useState(0);
  const [allowedRequests, setAllowedRequests] = useState(0);
  const [blockedRequests, setBlockedRequests] = useState(0);
  const [warnings, setWarnings] = useState(0);

  const loadReportData = async () => {
    try {
      console.log('Loading report data from local storage...');
      
      // Load all data
      const timeLimits = await timeLimitsStorage.getAll();
      const allUsageLogs = await usageLogsStorage.getAll();
      const devices = await devicesStorage.getAll();
      const filters = await contentFiltersStorage.getAll();

      // Calculate weekly data (last 7 days)
      const today = new Date();
      const weekData: WeeklyDataPoint[] = [];
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      
      let thisWeekTotal = 0;
      let lastWeekTotal = 0;

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];
        
        const dayLogs = allUsageLogs.filter(log => log.date === dateString);
        const dayHours = dayLogs.reduce((sum, log) => sum + log.hoursUsed, 0);
        
        thisWeekTotal += dayHours;
        
        weekData.push({
          day: dayName,
          hours: dayHours,
          date: dateString,
        });
      }

      // Calculate last week total
      for (let i = 13; i >= 7; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayLogs = allUsageLogs.filter(log => log.date === dateString);
        const dayHours = dayLogs.reduce((sum, log) => sum + log.hoursUsed, 0);
        
        lastWeekTotal += dayHours;
      }

      setWeeklyData(weekData);
      setTotalHoursThisWeek(thisWeekTotal);
      setTotalHoursLastWeek(lastWeekTotal);

      // Calculate top users from time limits
      const userStats: { [key: string]: number } = {};
      
      timeLimits.forEach(limit => {
        const userLogs = allUsageLogs.filter(log => log.timeLimitId === limit.id);
        const totalHours = userLogs.reduce((sum, log) => sum + log.hoursUsed, 0);
        userStats[limit.profileName] = totalHours;
      });

      const totalAllHours = Object.values(userStats).reduce((sum, hours) => sum + hours, 0);
      
      const topUsersData: TopUser[] = Object.entries(userStats)
        .map(([name, hours]) => ({
          name,
          hours,
          percentage: totalAllHours > 0 ? Math.round((hours / totalAllHours) * 100) : 0,
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 4);

      setTopUsers(topUsersData);

      // Calculate activity statistics
      const onlineDevices = devices.filter(d => d.isOnline).length;
      const blockedDevices = devices.filter(d => d.isBlocked).length;
      const activeFilters = filters.filter(f => f.enabled).length;
      
      // Simulate requests based on usage
      const estimatedAllowed = Math.floor(thisWeekTotal * 150);
      const estimatedBlocked = Math.floor(activeFilters * 25 + blockedDevices * 15);
      const estimatedWarnings = timeLimits.filter(limit => {
        const todayString = today.toISOString().split('T')[0];
        const todayLog = allUsageLogs.find(log => 
          log.timeLimitId === limit.id && log.date === todayString
        );
        return todayLog && todayLog.hoursUsed >= limit.dailyLimit * 0.8;
      }).length;

      setAllowedRequests(estimatedAllowed);
      setBlockedRequests(estimatedBlocked);
      setWarnings(estimatedWarnings);

      console.log('Report data loaded successfully');
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات التقرير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  const calculatePercentageChange = () => {
    if (totalHoursLastWeek === 0) return totalHoursThisWeek > 0 ? '+100%' : '0%';
    const change = ((totalHoursThisWeek - totalHoursLastWeek) / totalHoursLastWeek) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
  };

  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);

  const handleExportReport = () => {
    Alert.alert(
      'تصدير التقرير',
      `إجمالي الاستخدام هذا الأسبوع: ${totalHoursThisWeek.toFixed(1)} ساعة\n\nأكثر المستخدمين نشاطاً:\n${topUsers.map((u, i) => `${i + 1}. ${u.name}: ${u.hours.toFixed(1)} ساعة`).join('\n')}\n\nالطلبات المسموحة: ${allowedRequests}\nالطلبات المحظورة: ${blockedRequests}\nالتحذيرات: ${warnings}\n\nملاحظة: في التطبيق الحقيقي، سيتم تصدير التقرير كملف PDF أو CSV.`,
      [{ text: 'حسناً' }]
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

  if (loading) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: "التقارير",
              headerLeft: renderHeaderLeft,
            }}
          />
        )}
        <View style={[commonStyles.container, styles.loadingContainer]}>
          <IconSymbol name="arrow.clockwise" color={colors.primary} size={48} />
          <Text style={styles.loadingText}>جاري تحميل التقارير...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "التقارير",
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
          <View style={[commonStyles.card, styles.statusCard]}>
            <IconSymbol name="checkmark.circle.fill" color={colors.success} size={20} />
            <Text style={styles.statusText}>
              البيانات الحقيقية من AsyncStorage - اسحب للتحديث
            </Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[commonStyles.card, styles.summaryCard]}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol name="clock" color={colors.primary} size={24} />
              </View>
              <Text style={styles.summaryValue}>
                {totalHoursThisWeek.toFixed(1)} ساعة
              </Text>
              <Text style={styles.summaryLabel}>هذا الأسبوع</Text>
            </View>

            <View style={[commonStyles.card, styles.summaryCard]}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.accent + '20' }]}>
                <IconSymbol 
                  name={totalHoursThisWeek >= totalHoursLastWeek ? "arrow.up.right" : "arrow.down.right"} 
                  color={colors.accent} 
                  size={24} 
                />
              </View>
              <Text style={styles.summaryValue}>{calculatePercentageChange()}</Text>
              <Text style={styles.summaryLabel}>مقارنة بالأسبوع الماضي</Text>
            </View>
          </View>

          {/* Weekly Chart */}
          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>الاستخدام الأسبوعي</Text>
            <View style={commonStyles.card}>
              {weeklyData.length === 0 ? (
                <View style={styles.emptyChart}>
                  <IconSymbol name="chart.bar" color={colors.textSecondary} size={48} />
                  <Text style={styles.emptyChartText}>لا توجد بيانات استخدام</Text>
                  <Text style={styles.emptyChartSubtext}>
                    ابدأ بإضافة حدود زمنية لتتبع الاستخدام
                  </Text>
                </View>
              ) : (
                <View style={styles.chart}>
                  {weeklyData.map((data, index) => (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { 
                              height: `${(data.hours / maxHours) * 100}%`,
                              backgroundColor: colors.primary
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.barValue}>{data.hours.toFixed(1)}س</Text>
                      <Text style={styles.barLabel}>{data.day}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Top Users */}
          {topUsers.length > 0 && (
            <View style={styles.section}>
              <Text style={commonStyles.sectionTitle}>أكثر المستخدمين نشاطاً</Text>
              <View style={commonStyles.card}>
                {topUsers.map((user, index) => (
                  <View key={index}>
                    {index > 0 && <View style={commonStyles.divider} />}
                    <View style={styles.userRow}>
                      <View style={styles.userRank}>
                        <Text style={styles.rankNumber}>{index + 1}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill,
                              { 
                                width: `${user.percentage}%`,
                                backgroundColor: colors.primary
                              }
                            ]} 
                          />
                        </View>
                      </View>
                      <Text style={styles.userHours}>{user.hours.toFixed(1)} ساعة</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Activity Summary */}
          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>ملخص النشاط</Text>
            <View style={commonStyles.card}>
              <View style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: colors.success + '20' }]}>
                  <IconSymbol name="checkmark.circle" color={colors.success} size={20} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityLabel}>الطلبات المسموحة (تقديري)</Text>
                  <Text style={styles.activityValue}>{allowedRequests.toLocaleString()}</Text>
                </View>
              </View>

              <View style={commonStyles.divider} />

              <View style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: colors.danger + '20' }]}>
                  <IconSymbol name="xmark.circle" color={colors.danger} size={20} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityLabel}>الطلبات المحظورة (تقديري)</Text>
                  <Text style={styles.activityValue}>{blockedRequests.toLocaleString()}</Text>
                </View>
              </View>

              <View style={commonStyles.divider} />

              <View style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: colors.warning + '20' }]}>
                  <IconSymbol name="exclamationmark.triangle" color={colors.warning} size={20} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityLabel}>التحذيرات النشطة</Text>
                  <Text style={styles.activityValue}>{warnings}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Export Button */}
          <Pressable
            style={({ pressed }) => [
              commonStyles.card,
              styles.exportButton,
              pressed && styles.exportButtonPressed,
            ]}
            onPress={handleExportReport}
          >
            <IconSymbol name="square.and.arrow.up" color={colors.primary} size={24} />
            <Text style={styles.exportButtonText}>تصدير التقرير</Text>
          </Pressable>

          <View style={[commonStyles.card, styles.infoBanner]}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <Text style={styles.infoBannerText}>
              التقارير تعتمد على البيانات المحفوظة محلياً في التطبيق. لإضافة بيانات استخدام، قم بإنشاء حدود زمنية في قسم "حدود الوقت".
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  emptyChart: {
    alignItems: 'center',
    padding: 40,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '80%',
    height: 140,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  userHours: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  activityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  exportButtonPressed: {
    opacity: 0.7,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
