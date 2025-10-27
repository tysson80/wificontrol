
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
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import { timeLimitsStorage, usageLogsStorage, TimeLimit } from "@/app/services/localStorage";

interface TimeLimitDisplay extends TimeLimit {
  usageToday: number;
}

export default function TimeLimitsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timeLimits, setTimeLimits] = useState<TimeLimitDisplay[]>([]);
  
  const [newLimit, setNewLimit] = useState({
    profileName: '',
    dailyLimit: 3,
    scheduleStart: '08:00',
    scheduleEnd: '21:00',
    days: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الأحد'],
  });

  const allDays = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

  const loadTimeLimits = async () => {
    try {
      console.log('Loading time limits from local storage...');
      
      const limits = await timeLimitsStorage.getAll();
      console.log('Loaded time limits from local storage:', limits.length);
      
      const today = new Date().toISOString().split('T')[0];
      const usageLogs = await usageLogsStorage.getByDate(today);

      const limitsWithUsage: TimeLimitDisplay[] = limits.map(limit => {
        const usage = usageLogs.find(u => u.timeLimitId === limit.id);
        return {
          ...limit,
          usageToday: usage?.hoursUsed || 0,
        };
      });
      
      setTimeLimits(limitsWithUsage);
    } catch (error) {
      console.error('Error in loadTimeLimits:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل حدود الوقت');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeLimits();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTimeLimits();
    setRefreshing(false);
  };

  const toggleTimeLimit = async (id: string) => {
    const limit = timeLimits.find(l => l.id === id);
    if (!limit) return;

    try {
      await timeLimitsStorage.update(id, { enabled: !limit.enabled });
      setTimeLimits(prevLimits =>
        prevLimits.map(l =>
          l.id === id ? { ...l, enabled: !l.enabled } : l
        )
      );
    } catch (error) {
      console.error('Error in toggleTimeLimit:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
  };

  const handleAddLimit = async () => {
    if (!newLimit.profileName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم الملف الشخصي');
      return;
    }

    if (newLimit.dailyLimit <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال حد يومي صحيح');
      return;
    }

    try {
      console.log('Saving time limit to local storage...');
      
      const limit = await timeLimitsStorage.add({
        profileName: newLimit.profileName,
        enabled: true,
        dailyLimit: newLimit.dailyLimit,
        scheduleStart: newLimit.scheduleStart,
        scheduleEnd: newLimit.scheduleEnd,
        days: newLimit.days,
      });

      console.log('Time limit saved successfully:', limit);
      const limitWithUsage: TimeLimitDisplay = {
        ...limit,
        usageToday: 0,
      };

      setTimeLimits(prev => [limitWithUsage, ...prev]);
      setShowAddModal(false);
      setNewLimit({
        profileName: '',
        dailyLimit: 3,
        scheduleStart: '08:00',
        scheduleEnd: '21:00',
        days: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الأحد'],
      });

      Alert.alert(
        'تم الحفظ',
        `تم حفظ حدود الوقت للملف الشخصي "${limit.profileName}" في التطبيق.`,
        [{ text: 'حسناً' }]
      );
    } catch (error) {
      console.error('Error in handleAddLimit:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
  };

  const handleDeleteLimit = (id: string) => {
    const limit = timeLimits.find(l => l.id === id);
    if (!limit) return;

    Alert.alert(
      'حذف الحد الزمني',
      `هل تريد حذف حدود الوقت للملف الشخصي "${limit.profileName}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await timeLimitsStorage.delete(id);
              setTimeLimits(prev => prev.filter(l => l.id !== id));
              Alert.alert('تم الحذف', `تم حذف حدود الوقت للملف الشخصي "${limit.profileName}"`);
            } catch (error) {
              console.error('Error in handleDeleteLimit:', error);
              Alert.alert('خطأ', 'حدث خطأ غير متوقع');
            }
          }
        },
      ]
    );
  };

  const handleEditLimit = (limit: TimeLimitDisplay) => {
    Alert.alert(
      `تعديل حدود ${limit.profileName}`,
      `الحد اليومي: ${limit.dailyLimit} ساعات\nالوقت المسموح: ${limit.scheduleStart} - ${limit.scheduleEnd}\n\nاضغط مطولاً لحذف الحد الزمني.`,
      [{ text: 'حسناً' }]
    );
  };

  const toggleDay = (day: string) => {
    setNewLimit(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
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
            title: "حدود الوقت",
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
          <View style={[commonStyles.card, styles.infoCard]}>
            <View style={styles.infoIcon}>
              <IconSymbol name="info.circle" color={colors.accent} size={24} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>حدود الوقت</Text>
              <Text style={styles.infoText}>
                قم بتعيين حدود زمنية يومية وجداول استخدام لكل ملف شخصي للتحكم في وقت استخدام الإنترنت
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
            <View style={styles.sectionHeader}>
              <Text style={commonStyles.sectionTitle}>الملفات الشخصية</Text>
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
            ) : timeLimits.length === 0 ? (
              <View style={[commonStyles.card, styles.emptyState]}>
                <IconSymbol name="clock" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyStateText}>لا توجد حدود زمنية</Text>
                <Text style={styles.emptyStateSubtext}>
                  اضغط على + لإضافة ملف شخصي جديد
                </Text>
              </View>
            ) : (
              timeLimits.map((limit) => (
                <Pressable
                  key={limit.id}
                  style={({ pressed }) => [
                    commonStyles.card,
                    styles.limitCard,
                    pressed && styles.limitCardPressed,
                  ]}
                  onPress={() => handleEditLimit(limit)}
                  onLongPress={() => handleDeleteLimit(limit.id)}
                >
                  <View style={styles.limitHeader}>
                    <View style={[
                      styles.profileIcon,
                      { backgroundColor: limit.enabled ? colors.primary + '20' : colors.disabled + '20' }
                    ]}>
                      <IconSymbol 
                        name="person.circle" 
                        color={limit.enabled ? colors.primary : colors.disabled} 
                        size={28} 
                      />
                    </View>
                    <View style={styles.limitInfo}>
                      <Text style={styles.limitName}>{limit.profileName}</Text>
                      <Text style={styles.limitStatus}>
                        {limit.enabled ? 'نشط' : 'معطل'}
                      </Text>
                    </View>
                    <Switch
                      value={limit.enabled}
                      onValueChange={() => toggleTimeLimit(limit.id)}
                      trackColor={{ false: colors.disabled, true: colors.success }}
                      thumbColor={colors.card}
                    />
                  </View>

                  {limit.enabled && (
                    <>
                      <View style={commonStyles.divider} />
                      
                      <View style={styles.limitDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailIcon}>
                            <IconSymbol name="clock" color={colors.accent} size={20} />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>الحد اليومي</Text>
                            <Text style={styles.detailValue}>{limit.dailyLimit} ساعات</Text>
                          </View>
                        </View>

                        <View style={styles.detailRow}>
                          <View style={styles.detailIcon}>
                            <IconSymbol name="calendar" color={colors.secondary} size={20} />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>الوقت المسموح</Text>
                            <Text style={styles.detailValue}>
                              {limit.scheduleStart} - {limit.scheduleEnd}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.detailRow}>
                          <View style={styles.detailIcon}>
                            <IconSymbol name="list.bullet" color={colors.highlight} size={20} />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>الأيام</Text>
                            <Text style={styles.detailValue}>
                              {limit.days.join('، ')}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>الاستخدام اليوم</Text>
                          <Text style={styles.progressValue}>
                            {limit.usageToday.toFixed(1)} / {limit.dailyLimit} ساعات
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill,
                              { 
                                width: `${Math.min((limit.usageToday / limit.dailyLimit) * 100, 100)}%`,
                                backgroundColor: (limit.usageToday / limit.dailyLimit) > 0.8 ? colors.danger : colors.success
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </>
                  )}
                </Pressable>
              ))
            )}
          </View>

          {timeLimits.length > 0 && (
            <View style={styles.section}>
              <Text style={commonStyles.sectionTitle}>إجراءات سريعة</Text>
              <Pressable
                style={({ pressed }) => [
                  commonStyles.card,
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={() => Alert.alert('إيقاف مؤقت', 'تم إيقاف جميع الحدود الزمنية مؤقتاً')}
              >
                <IconSymbol name="pause.circle" color={colors.warning} size={24} />
                <Text style={styles.actionButtonText}>إيقاف مؤقت لجميع الحدود</Text>
              </Pressable>
            </View>
          )}

          <View style={[commonStyles.card, styles.infoBanner]}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <Text style={styles.infoBannerText}>
              اضغط مطولاً على أي ملف شخصي لحذفه. جميع البيانات يتم حفظها محلياً في التطبيق.
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
              <Text style={styles.modalTitle}>إضافة ملف شخصي</Text>
              <Pressable onPress={handleAddLimit}>
                <Text style={styles.modalSaveButton}>حفظ</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>اسم الملف الشخصي</Text>
                <TextInput
                  style={styles.formInput}
                  value={newLimit.profileName}
                  onChangeText={(text) => setNewLimit(prev => ({ ...prev, profileName: text }))}
                  placeholder="مثال: أحمد، سارة، محمد"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>الحد اليومي (ساعات)</Text>
                <View style={styles.limitSelector}>
                  {[1, 2, 3, 4, 5, 6].map((hours) => (
                    <Pressable
                      key={hours}
                      style={[
                        styles.limitOption,
                        newLimit.dailyLimit === hours && styles.limitOptionActive,
                      ]}
                      onPress={() => setNewLimit(prev => ({ ...prev, dailyLimit: hours }))}
                    >
                      <Text style={[
                        styles.limitOptionText,
                        newLimit.dailyLimit === hours && styles.limitOptionTextActive,
                      ]}>
                        {hours}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>وقت البداية</Text>
                <TextInput
                  style={styles.formInput}
                  value={newLimit.scheduleStart}
                  onChangeText={(text) => setNewLimit(prev => ({ ...prev, scheduleStart: text }))}
                  placeholder="08:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>وقت النهاية</Text>
                <TextInput
                  style={styles.formInput}
                  value={newLimit.scheduleEnd}
                  onChangeText={(text) => setNewLimit(prev => ({ ...prev, scheduleEnd: text }))}
                  placeholder="21:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>الأيام</Text>
                <View style={styles.daysContainer}>
                  {allDays.map((day) => (
                    <Pressable
                      key={day}
                      style={[
                        styles.dayButton,
                        newLimit.days.includes(day) && styles.dayButtonActive,
                      ]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        newLimit.days.includes(day) && styles.dayButtonTextActive,
                      ]}>
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[commonStyles.card, styles.modalInfoCard]}>
                <IconSymbol name="info.circle" color={colors.primary} size={20} />
                <Text style={styles.modalInfoText}>
                  سيتم حفظ هذه الحدود محلياً في التطبيق وتطبيقها على الشبكة المنزلية.
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
  infoCard: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: colors.accent + '10',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  limitCard: {
    marginBottom: 12,
    padding: 16,
  },
  limitCardPressed: {
    opacity: 0.7,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  limitInfo: {
    flex: 1,
  },
  limitName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  limitStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  limitDetails: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  limitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  limitOption: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  limitOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  limitOptionTextActive: {
    color: colors.card,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayButtonTextActive: {
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
