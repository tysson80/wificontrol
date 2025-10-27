
import React from 'react';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'التحكم الأبوي',
        }}
      />
      <Stack.Screen 
        name="devices" 
        options={{
          title: 'إدارة الأجهزة',
        }}
      />
      <Stack.Screen 
        name="time-limits" 
        options={{
          title: 'حدود الوقت',
        }}
      />
      <Stack.Screen 
        name="content-filter" 
        options={{
          title: 'تصفية المحتوى',
        }}
      />
      <Stack.Screen 
        name="reports" 
        options={{
          title: 'التقارير',
        }}
      />
    </Stack>
  );
}
