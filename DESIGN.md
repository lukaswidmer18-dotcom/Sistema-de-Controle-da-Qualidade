# DESIGN.md — Mobile App (Bello Alimentos – Controle da Qualidade)

> Extracted from the desktop Next.js system. Apply consistently to all screens.

---

## Brand Colors

```ts
// lib/constants.ts — already defined, always import from here
BRAND_GREEN  = '#16413a'   // primary action, headers, focus rings
BRAND_GOLD   = '#bc933f'   // accent, gold text, dashed borders
BRAND_CREAM  = '#f8f5eb'   // warm page background (instead of cold #f9fafb)
BRAND_GREEN_SOFT = '#e8ecec' // subtle tinted surfaces

// Derived — use inline where needed
BRAND_GREEN_DEEP  = '#0d2b26'  // darker variant for headers
BRAND_GOLD_LIGHT  = '#d1b479'  // lighter gold for gradient ends
BRAND_GOLD_MUTED  = 'rgba(188,147,63,0.18)' // gold hairline borders
BRAND_GREEN_MUTED = 'rgba(22,65,58,0.10)'   // green hairline borders
```

---

## Background & Surface

| Token | Value | Use |
|-------|-------|-----|
| Page bg | `#f8f5eb` (cream) | `ScrollView` / screen background |
| Card bg | `#ffffff` | White card surfaces |
| Subtle bg | `rgba(248,245,235,0.76)` | Info boxes, section fills |
| Input bg focused | `#ffffff` | Input on focus |
| Input bg resting | `#fafafa` | Input at rest |
| Tab bar bg | `#ffffff` | Bottom tab bar |
| Header bg | `#16413a` (brand-green) | Screen headers / nav bars |

---

## Elevation (Shadow System)

Match the desktop "Superhuman elevation" system:

```ts
// Elevation 1 — card resting
shadow: {
  shadowColor: '#16413a',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.07,
  shadowRadius: 3,
  elevation: 2,
}

// Elevation 2 — card hover / focused card
shadow: {
  shadowColor: '#16413a',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.09,
  shadowRadius: 24,
  elevation: 6,
}

// Elevation 3 — modals / sheets
shadow: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.18,
  shadowRadius: 32,
  elevation: 12,
}

// Brand shadow (buttons, icons)
shadow: {
  shadowColor: '#16413a',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.30,
  shadowRadius: 8,
  elevation: 6,
}

// Gold shadow (gold icons, gold buttons)
shadow: {
  shadowColor: '#bc933f',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.40,
  shadowRadius: 12,
  elevation: 8,
}
```

---

## Typography Scale

No variable fonts in React Native — map `wght` axis to `fontWeight`:

| Role | fontSize | fontWeight | letterSpacing | color |
|------|----------|------------|---------------|-------|
| Display XL | 30 | `'800'` | -0.5 | white (on dark bg) |
| Display LG | 22 | `'800'` | -0.3 | `BRAND_GREEN` |
| Heading | 18 | `'800'` | 0.2 | `BRAND_GREEN` |
| Section title | 15 | `'800'` | 0.5 | `BRAND_GREEN` — `textTransform: 'uppercase'` |
| Body lead | 16 | `'600'` | 0.1 | `#111827` |
| Body | 14–15 | `'400'` | 0 | `#374151` |
| Label | 13 | `'600'` | 0 | `#374151` |
| Caption | 12 | `'600'` | 0 | `#6b7280` |
| Micro | 11 | `'600'` | 0 | `rgba(255,255,255,0.25)` (on dark) |
| Eyebrow | 10 | `'700'` | 3.5 | `rgba(188,147,63,0.60)` — `textTransform: 'uppercase'` |

---

## Border Radius

| Component | borderRadius |
|-----------|-------------|
| Screen cards | 24 |
| Inner cards / product cards | 16 |
| Inputs, selects | 12 |
| Buttons (primary) | 14 |
| Tab icons | 8 |
| Brand icon / logo box | 18 |
| Small badges / dots | 9999 (full pill) |
| Modal sheet (top corners only) | 24 |

---

## Borders

```ts
// Standard hairline
borderWidth: 1,
borderColor: 'rgba(22,65,58,0.10)',   // green hairline

// Gold hairline (accent cards, dashed add-buttons)
borderWidth: 1,
borderColor: 'rgba(188,147,63,0.18)',

// Input resting
borderWidth: 1.5,
borderColor: '#e5e7eb',

// Input focused
borderWidth: 1.5,
borderColor: '#16413a',
```

---

## Components

### Screen Header (inside `Stack.Screen options`)
```ts
headerStyle: { backgroundColor: '#16413a' },
headerTintColor: '#ffffff',
headerTitleStyle: { fontWeight: '800', fontSize: 17, letterSpacing: 0.2 },
```

Or full custom header:
```tsx
<View style={{
  backgroundColor: '#16413a',
  paddingHorizontal: 20,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(188,147,63,0.26)',
  // shadow
  shadowColor: '#16413a',
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.58,
  shadowRadius: 55,
  elevation: 12,
}}>
  {/* eyebrow label */}
  <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 3.5, color: 'rgba(188,147,63,0.60)', marginBottom: 2 }}>
    CONTROLE DA QUALIDADE
  </Text>
  <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>
    Page Title
  </Text>
</View>
```

### Card
```tsx
<View style={{
  backgroundColor: '#fff',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(22,65,58,0.10)',
  padding: 16,
  // elevation 1
  shadowColor: '#16413a',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.07,
  shadowRadius: 3,
  elevation: 2,
}}>
```

### Input (resting → focused)
```tsx
// resting
{ height: 46, borderWidth: 1.5, borderColor: '#e5e7eb',
  borderRadius: 12, paddingHorizontal: 12, fontSize: 14,
  color: '#111827', backgroundColor: '#fafafa' }

// focused (add)
{ borderColor: '#16413a', backgroundColor: '#fff',
  shadowColor: '#16413a', shadowOffset: {width:0,height:0},
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 }
```

### Primary Button
```tsx
{ height: 52, backgroundColor: '#16413a', borderRadius: 14,
  alignItems: 'center', justifyContent: 'center',
  shadowColor: '#16413a', shadowOffset: {width:0,height:4},
  shadowOpacity: 0.30, shadowRadius: 8, elevation: 6 }
// text: color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:0.3
```

### Brand Icon Box (logo/emblem)
```tsx
{ width: 64, height: 64, borderRadius: 18,
  backgroundColor: '#bc933f',   // gold fill
  // or gradient: '#d1a84f' → '#bc933f' → '#24584f'
  alignItems: 'center', justifyContent: 'center',
  shadowColor: '#bc933f', shadowOffset:{width:0,height:4},
  shadowOpacity: 0.40, shadowRadius: 12, elevation: 8 }
```

### Tab Bar
```ts
tabBarStyle: {
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: 'rgba(22,65,58,0.10)',   // green hairline (not grey)
  height: 64,
  paddingBottom: 8,
}
tabBarActiveTintColor: '#16413a',
tabBarInactiveTintColor: '#9ca3af',
tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
```

### Step Indicator (progress bar)
```tsx
// active step: BRAND_GREEN bg, white text
// inactive step: '#e5e7eb' bg, '#6b7280' text
// completed step: gold border 'rgba(188,147,63,0.52)', BRAND_GREEN text
stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb' }
stepDotActive: { backgroundColor: '#16413a' }
```

### Section Title
```tsx
{ fontSize: 15, fontWeight: '800', color: '#16413a',
  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }
```

### Dashed Add Button (e.g., "Adicionar produto")
```tsx
{ borderWidth: 1.5, borderColor: '#bc933f', borderStyle: 'dashed',
  borderRadius: 10, padding: 12, alignItems: 'center' }
// text: color:'#16413a', fontWeight:'700', fontSize:14
```

### Error Banner
```tsx
{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
  borderRadius: 10, padding: 12 }
// text: color:'#dc2626', fontSize:13, fontWeight:'600', textAlign:'center'
```

### Modal Bottom Sheet
```tsx
// overlay
{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }
// sheet
{ backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24,
  padding:20, maxHeight:'70%' }
// title: fontSize:17, fontWeight:'800', color:'#16413a'
// item row: paddingVertical:14, borderBottomWidth:1, borderBottomColor:'#f3f4f6'
// cancel: color:'#ef4444', fontWeight:'700'
```

---

## Spacing

| Token | Value |
|-------|-------|
| Screen padding H | 20 |
| Screen padding V | 24 |
| Card padding | 16–20 |
| Field gap | 14 |
| Section gap | 20 |
| Button margin top | 8 |

---

## Login Screen Pattern

```
Full screen: BRAND_GREEN background (#16413a)
↓
Center column (paddingH: 24, paddingV: 48)
  ↓
  Header block (alignItems: center, marginBottom: 36):
    - Brand icon box (gold, 68×68, borderRadius 18)
    - Title line 1: white, 30px, 800
    - Title line 2: BRAND_GOLD, 30px, 800
    - Subtitle: rgba(255,255,255,0.45), 13px
  ↓
  White card (borderRadius 24, padding 28, elevation 3)
    - Card title: BRAND_GREEN, 18px, 800
    - Error banner (if error)
    - Inputs with green focus ring
    - Primary button (BRAND_GREEN)
  ↓
  Version label: rgba(255,255,255,0.25), 11px, center
```

---

## Do / Don't

| Do | Don't |
|----|-------|
| Use `#f8f5eb` (cream) as page background | Use cold grey `#f9fafb` or `#f3f4f6` |
| Use green hairline borders | Use `#f0f0f0` or `#e5e7eb` as card borders |
| Apply green shadow to branded elements | Use generic `shadowColor: '#000'` on cards |
| Use `fontWeight: '800'` for headings | Use `'bold'` |
| Use BRAND_GOLD for accents and dashes | Use arbitrary orange/yellow |
| Use `borderRadius: 16` on inner cards | Use `borderRadius: 8` (too small) |
| Match tab bar height to 64 with proper padding | Use height 60 with default padding |
