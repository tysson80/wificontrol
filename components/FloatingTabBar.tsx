
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 24,
  bottomMargin = 16,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const handleTabPress = (route: string) => {
    console.log('Tab pressed:', route);
    router.push(route as any);
  };

  const isActive = (tabRoute: string) => {
    if (tabRoute === '/(tabs)/(home)/') {
      return pathname === '/(tabs)/(home)/' || pathname.startsWith('/(tabs)/(home)/');
    }
    return pathname === tabRoute;
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.container,
        {
          width: containerWidth,
          borderRadius: borderRadius,
          marginBottom: bottomMargin,
        },
      ]}
    >
      <BlurView intensity={80} tint="light" style={styles.blurView}>
        <View style={styles.tabBar}>
          {tabs.map((tab, index) => {
            const active = isActive(tab.route);
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    active && { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <IconSymbol
                    name={tab.icon as any}
                    size={24}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    { color: active ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  blurView: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
