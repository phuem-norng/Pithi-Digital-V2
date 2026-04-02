# Hero Section Redesign - Sampeah & Lotus Theme

## Overview

The Hero section has been completely redesigned with a culturally authentic Khmer visual featuring:

- **Traditional Sampeah hands** (prayer greeting gesture) at the bottom right
- **Gold foil lotus flower** illustration at the center with glowing effect
- **Color scheme shift** from rose → gold/amber with white and minimal pink accents

## Visual Elements

### 1. **Lotus Flower Illustration**

- **Position**: Center of the visual area
- **Style**: Vector illustration with gold foil gradient
- **Features**:
  - Outer petals (8) with gradient gold coloring
  - Inner petals (8) with enhanced gold detail
  - Center stamen with luminous glow filter
  - Soft light source creating a glowing, pure effect
  - Drop shadow for depth

**Colors Used**:

- Lightest: `#FFF8DC` (cornsilk)
- Light gold: `#FFD700` (gold)
- Medium gold: `#DAA520` (goldenrod)
- Dark gold: `#B8860B` (dark goldenrod)
- Center highlight: `#FFFACD` (lemon chiffon)

### 2. **Hands - Sampeah Position**

- **Position**: Bottom right of the visual area
- **Frame**: White border container with rounded corners
- **Placeholder**: SVG illustration ready for high-quality photography replacement
- **Shadow**: Subtle drop shadow beneath for depth

**To Replace with Real Photography**:

```jsx
// In the image container, replace the SVG with:
<img
  src="/images/hands-sampeah.jpg"
  alt="Hands performing traditional Khmer Sampeah greeting"
  className="w-full h-full object-cover rounded-xl"
/>
```

### 3. **Warm Glow Background**

- **Radial gradient**: Amber → transparent
- **Blur effect**: Creates soft light source
- **Creates**: A warm, spiritual ambiance around the lotus

## Color Scheme Updates

### Before → After

- Primary accent: `rose-600` → `amber-600`
- Light accent: `rose-100` → `amber-100`
- Text accent: `rose-700` → `amber-700`
- Shadow: `rose-200` → `amber-200`

### Header Navigation

- Hover color changed from rose to amber for consistency

### CTA Buttons

- "ចាប់ផ្តើមឥឡូវនេះ" (Get Started) button now uses amber gradient
- Dashboard button updated to amber theme
- Sign In button uses amber border/text

## File Changes

- **Location**: `frontend/app/page.tsx` (main landing page)
- **Lines modified**: 119-250 (Hero section)
- **Removed**: Phone mockup (`/frame.png`) and pink circles
- **Added**: Lotus SVG + Hands container + Warm glow gradients

## Next Steps for Production

### 1. **Real Hands Photography**

- Shoot professional photo of two hands performing Sampeah
- Khmer cultural authenticity important
- Lighting: Soft, natural light recommended
- Aspect ratio: ~3:4 (portrait orientation)
- File size: Optimize for web
- Format: JPEG or WebP

**Installation**:

```jsx
<img
  src="/images/hands-sampeah.jpg"
  alt="Hands performing traditional Khmer Sampeah greeting"
  className="w-full h-full object-cover rounded-xl"
/>
```

### 2. **Optional: Custom Lotus SVG**

- Current lotus is procedural (adjustable via SVG parameters)
- Can be replaced with:
  - Hand-drawn illustration
  - Professional design asset
  - Photography of actual lotus

### 3. **Color Fine-tuning**

- Adjust gold gradient values if needed:
  - `#FFF8DC`, `#FFD700`, `#DAA520`, `#B8860B`
- Test across different lighting conditions

## Responsive Design

- Maintains full responsiveness across mobile and desktop
- Visual scales appropriately on smaller screens
- Hands photo maintains aspect ratio on all devices

## Accessibility

- All decorative elements marked with `aria-hidden="true"`
- SVG has descriptive `aria-label`
- Proper semantic HTML structure maintained

## Browser Compatibility

- SVG gradients and filters: All modern browsers
- CSS backdrop blur: Modern browsers (Chrome, Safari, Firefox, Edge)
- Fallback: Graceful degradation on older browsers with basic gold colors

---

**Design Philosophy**: Combines modern web design with authentic Khmer cultural elements (Sampeah greeting and lotus symbolism), creating a professional yet culturally relevant hero section.
