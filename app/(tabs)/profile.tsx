
import React from "react";
import { Stack } from "expo-router";
import { 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  View, 
  Text, 
  Platform,
  Alert,
  Linking
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import { usageLogsStorage, clearAllData } from "@/app/services/localStorage";

export default function ProfileScreen() {
  const theme = useTheme();

  const handleOptionPress = (optionId: string) => {
    switch (optionId) {
      case 'generate-data':
        Alert.alert(
          'توليد بيانات تجريبية',
          'هل تريد توليد بيانات استخدام تجريبية للأسبوعين الماضيين؟ سيساعدك هذا على رؤية التقارير بشكل كامل.',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'توليد',
              onPress: async () => {
                try {
                  await usageLogsStorage.generateSampleData();
                  Alert.alert(
                    'تم بنجاح',
                    'تم توليد بيانات الاستخدام التجريبية. يمكنك الآن الذهاب إلى قسم التقارير لرؤية البيانات.',
                    [{ text: 'حسناً' }]
                  );
                } catch (error) {
                  Alert.alert('خطأ', 'حدث خطأ أثناء توليد البيانات');
                }
              },
            },
          ]
        );
        break;
      case 'notifications':
        Alert.alert('الإشعارات', 'إعدادات الإشعارات قيد التطوير');
        break;
      case 'security':
        Alert.alert('الأمان', 'إعدادات الأمان قيد التطوير');
        break;
      case 'backup':
        Alert.alert('النسخ الاحتياطي', 'ميزة النسخ الاحتياطي قيد التطوير');
        break;
      case 'help':
        Alert.alert('المساعدة', 'مركز المساعدة قيد التطوير');
        break;
      case 'github':
        const githubUrl = 'https://github.com/tysson80/wificontrol';
        Alert.alert(
          'مستودع GitHub',
          `هل تريد فتح مستودع المشروع على GitHub؟\n\n${githubUrl}`,
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'فتح',
              onPress: async () => {
                try {
                  const supported = await Linking.canOpenURL(githubUrl);
                  if (supported) {
                    await Linking.openURL(githubUrl);
                  } else {
                    Alert.alert('خطأ', 'لا يمكن فتح الرابط');
                  }
                } catch (error) {
                  console.error('Error opening GitHub URL:', error);
                  Alert.alert('خطأ', 'حدث خطأ أثناء فتح الرابط');
                }
              },
            },
          ]
        );
        break;
      case 'about':
        Alert.alert(
          'حول التطبيق',
          'تطبيق التحكم الأبوي\nالإصدار 1.0.0\n\nتطبيق لإدارة الشبكة المنزلية والتحكم في استخدام الإنترنت للأطفال.\n\nجميع البيانات محفوظة محلياً في التطبيق باستخدام AsyncStorage.\n\nالمستودع: https://github.com/tysson80/wificontrol',
          [{ text: 'حسناً' }]
        );
        break;
      case 'reset':
        Alert.alert(
          'إعادة تعيين البيانات',
          'هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'حذف',
              style: 'destructive',
              onPress: async () => {
                try {
                  await clearAllData();
                  Alert.alert(
                    'تم الحذف',
                    'تم حذف جميع البيانات بنجاح. سيتم إعادة تحميل التطبيق.',
                    [{ text: 'حسناً' }]
                  );
                } catch (error) {
                  Alert.alert('خطأ', 'حدث خطأ أثناء حذف البيانات');
                }
              },
            },
          ]
        );
        break;
      default:
        console.log('Option pressed:', optionId);
    }
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => Alert.alert('تعديل الملف الشخصي', 'ميزة التعديل قيد التطوير')}
      style={styles.headerButton}
    >
      <Text style={styles.editButton}>تعديل</Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "الملف الشخصي",
          headerRight: renderHeaderRight,
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={[commonStyles.card, styles.profileCard]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <IconSymbol name="person.circle.fill" color={colors.primary} size={80} />
              </View>
            </View>
            <Text style={styles.profileName}>ولي الأمر</Text>
            <Text style={styles.profileEmail}>parent@example.com</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={[commonStyles.card, styles.statCard]}>
              <IconSymbol name="wifi" color={colors.primary} size={24} />
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>شبكة نشطة</Text>
            </View>
            <View style={[commonStyles.card, styles.statCard]}>
              <IconSymbol name="person.2" color={colors.accent} size={24} />
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>أجهزة</Text>
            </View>
            <View style={[commonStyles.card, styles.statCard]}>
              <IconSymbol name="shield.checkered" color={colors.success} size={24} />
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>فلاتر نشطة</Text>
            </View>
          </View>

          {/* Settings Sections */}
          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>البيانات والتقارير</Text>
            <View style={commonStyles.card}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => handleOptionPress('generate-data')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.accent + '20' }]}>
                  <IconSymbol name="chart.bar" color={colors.accent} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>توليد بيانات تجريبية</Text>
                  <Text style={styles.optionSubtitle}>
                    إنشاء بيانات استخدام للتقارير
                  </Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>الإعدادات</Text>
            <View style={commonStyles.card}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => handleOptionPress('notifications')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol name="bell" color={colors.primary} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>الإشعارات</Text>
                  <Text style={styles.optionSubtitle}>إدارة التنبيهات والإشعارات</Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>

              <View style={commonStyles.divider} />

              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => handleOptionPress('security')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.success + '20' }]}>
                  <IconSymbol name="lock.shield" color={colors.success} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>الأمان والخصوصية</Text>
                  <Text style={styles.optionSubtitle}>حماية حسابك وبياناتك</Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>

              <View style={commonStyles.divider} />

              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => handleOptionPress('backup')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.secondary + '20' }]}>
                  <IconSymbol name="arrow.clockwise.icloud" color={colors.secondary} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>النسخ الاحتياطي</Text>
                  <Text style={styles.optionSubtitle}>حفظ واستعادة البيانات</Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>الدعم</Text>
            <View style={commonStyles.card}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => handleOptionPress('help')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.highlight + '20' }]}>
                  <IconSymbol name="questionmark.circle" color={colors.highlight} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>المساعدة والدعم</Text>
                  <Text style={styles.optionSubtitle}>الأسئلة الشائعة والتواصل</Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>

              <View style={commonStyles.divider} />

              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => handleOptionPress('github')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol name="link" color={colors.primary} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>مستودع GitHub</Text>
                  <Text style={styles.optionSubtitle}>عرض الكود المصدري للمشروع</Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>

              <View style={commonStyles.divider} />

              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => handleOptionPress('about')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.accent + '20' }]}>
                  <IconSymbol name="info.circle" color={colors.accent} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>حول التطبيق</Text>
                  <Text style={styles.optionSubtitle}>الإصدار والمعلومات</Text>
                </View>
                <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>خطير</Text>
            <Pressable
              style={({ pressed }) => [
                commonStyles.card,
                styles.dangerButton,
                pressed && styles.dangerButtonPressed,
              ]}
              onPress={() => handleOptionPress('reset')}
            >
              <IconSymbol name="trash" color={colors.danger} size={20} />
              <Text style={styles.dangerButtonText}>إعادة تعيين جميع البيانات</Text>
            </Pressable>
          </View>

          <View style={[commonStyles.card, styles.infoBanner]}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <Text style={styles.infoBannerText}>
              جميع البيانات محفوظة محلياً في التطبيق باستخدام AsyncStorage. لا يتم إرسال أي بيانات إلى خوادم خارجية.
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
  editButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionRowPressed: {
    opacity: 0.7,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: colors.danger + '10',
  },
  dangerButtonPressed: {
    opacity: 0.7,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
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
