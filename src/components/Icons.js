import React from 'react';
import { View } from 'react-native';

export function MailIcon({ color = '#94a3b8', size = 18 }) {
  return (
    <View style={{ width: size, height: size * 0.75, borderWidth: 1.6, borderColor: color, borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.55,
        height: size * 0.45,
        borderBottomWidth: 1.6,
        borderRightWidth: 1.6,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        marginTop: -size * 0.25
      }} />
    </View>
  );
}

export function LockIcon({ color = '#94a3b8', size = 18 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Shackle */}
      <View style={{
        width: size * 0.5,
        height: size * 0.45,
        borderTopLeftRadius: size * 0.25,
        borderTopRightRadius: size * 0.25,
        borderWidth: 1.6,
        borderBottomWidth: 0,
        borderColor: color,
        marginBottom: -1
      }} />
      {/* Body */}
      <View style={{
        width: size * 0.72,
        height: size * 0.52,
        borderRadius: 3,
        borderWidth: 1.6,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <View style={{ width: 2, height: 3, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

export function EyeOffIcon({ color = '#94a3b8', size = 18 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.85,
        height: size * 0.5,
        borderWidth: 1.6,
        borderColor: color,
        borderRadius: size * 0.25,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
      </View>
      <View style={{
        position: 'absolute',
        width: size * 0.95,
        height: 1.6,
        backgroundColor: color,
        transform: [{ rotate: '-45deg' }]
      }} />
    </View>
  );
}

export function ShieldIcon({ color = '#0d9488', size = 18 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.75,
        height: size * 0.85,
        borderWidth: 1.6,
        borderColor: color,
        borderTopLeftRadius: size * 0.15,
        borderTopRightRadius: size * 0.15,
        borderBottomLeftRadius: size * 0.45,
        borderBottomRightRadius: size * 0.45
      }} />
    </View>
  );
}

export function MenuIcon({ color = '#0f172a', size = 20 }) {
  return (
    <View style={{ width: size, height: size * 0.75, justifyContent: 'space-between' }}>
      <View style={{ width: '100%', height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: '100%', height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: '100%', height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

export function CalendarIcon({ color = '#2563eb', size = 20 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.88, height: size * 0.82, borderWidth: 1.8, borderColor: color, borderRadius: 4, padding: 2 }}>
        <View style={{ width: '100%', height: 2, backgroundColor: color, marginBottom: 2 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 1 }}>
          <View style={{ width: 2.5, height: 2.5, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2.5, height: 2.5, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2.5, height: 2.5, backgroundColor: color, borderRadius: 1 }} />
        </View>
      </View>
    </View>
  );
}

export function PillIcon({ color = '#8b5cf6', size = 20 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.46, height: size * 0.88, borderWidth: 1.8, borderColor: color, borderRadius: size * 0.23, overflow: 'hidden' }}>
        <View style={{ width: '100%', height: '50%', backgroundColor: color }} />
      </View>
    </View>
  );
}

export function RecordsIcon({ color = '#059669', size = 20 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.75, height: size * 0.9, borderWidth: 1.8, borderColor: color, borderRadius: 3, padding: 3, justifyContent: 'space-around' }}>
        <View style={{ width: '60%', height: 1.8, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: '80%', height: 1.8, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: '50%', height: 1.8, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

export function BellIcon({ color = '#ea580c', size = 20 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.7, height: size * 0.75, borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, borderWidth: 1.8, borderColor: color, borderBottomWidth: 2.5, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ width: 3, height: 2, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

export function ChevronRightIcon({ color = '#94a3b8', size = 16 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.45,
        height: size * 0.45,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }]
      }} />
    </View>
  );
}
