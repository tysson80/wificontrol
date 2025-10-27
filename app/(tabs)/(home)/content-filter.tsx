
import { useTheme } from "@react-navigation/native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles } from "@/styles/commonStyles";
import React, { useState, useEffect } from "react";
import { 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  View, 
  Text, 
  Platform,
  Switch,
  Alert
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { contentFiltersStorage, ContentFilter } from "@/app/services/localStorage";

export default function ContentFilterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState<ContentFilter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      console.log('Loading content filters from local storage...');
      const filters = await contentFiltersStorage.getAll();
      console.log('Loaded filters:', filters.length);
      setCategories(filters);
    } catch (error) {
      console.error('Error loading filters:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل فلاتر المحتوى');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    try {
      await contentFiltersStorage.update(id, { enabled: !category.enabled });
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
        )
      );
    } catch (error) {
      console.error('Error toggling filter:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الفلتر');
    }
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
            title: "فلترة المحتوى",
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
        >
          <View style={[commonStyles.card, styles.infoCard]}>
            <View style={styles.infoIcon}>
              <IconSymbol name="shield.checkered" color={colors.accent} size={24} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>فلترة المحتوى</Text>
              <Text style={styles.infoText}>
                قم بتفعيل الفئات التي تريد حظرها لحماية أطفالك من المحتوى غير المناسب
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
            <Text style={commonStyles.sectionTitle}>الفئات</Text>
            {loading ? (
              <View style={[commonStyles.card, styles.emptyState]}>
                <IconSymbol name="arrow.clockwise" color={colors.primary} size={48} />
                <Text style={styles.emptyStateText}>جاري التحميل...</Text>
              </View>
            ) : (
              categories.map((category) => (
                <View
                  key={category.id}
                  style={[
                    commonStyles.card,
                    styles.categoryCard,
                    category.enabled && styles.categoryCardActive,
                  ]}
                >
                  <View style={styles.categoryHeader}>
                    <View style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color + '20' }
                    ]}>
                      <IconSymbol 
                        name={category.icon as any} 
                        color={category.color} 
                        size={28} 
                      />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryDescription}>
                        {category.description}
                      </Text>
                    </View>
                    <Switch
                      value={category.enabled}
                      onValueChange={() => toggleCategory(category.id)}
                      trackColor={{ false: colors.disabled, true: category.color }}
                      thumbColor={colors.card}
                    />
                  </View>
                  
                  {category.enabled && (
                    <View style={[
                      styles.activeIndicator,
                      { backgroundColor: category.color + '15' }
                    ]}>
                      <IconSymbol 
                        name="checkmark.circle.fill" 
                        color={category.color} 
                        size={16} 
                      />
                      <Text style={[styles.activeText, { color: category.color }]}>
                        نشط - يتم حظر هذه الفئة
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>إحصائيات</Text>
            <View style={commonStyles.card}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {categories.filter(c => c.enabled).length}
                  </Text>
                  <Text style={styles.statLabel}>فئات نشطة</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {categories.filter(c => !c.enabled).length}
                  </Text>
                  <Text style={styles.statLabel}>فئات معطلة</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[commonStyles.card, styles.infoBanner]}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <Text style={styles.infoBannerText}>
              في التطبيق الحقيقي، سيتم تطبيق هذه الفلاتر على مستوى الراوتر أو DNS لحظر المحتوى غير المناسب. جميع البيانات محفوظة محلياً.
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  categoryCard: {
    marginBottom: 12,
    padding: 16,
  },
  categoryCardActive: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
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
