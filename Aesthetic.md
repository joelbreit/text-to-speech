# Warm & Personal Aesthetic Guide

A friendly, approachable design system for text-to-speech applications that maintains warmth and personality in both light and dark modes.

## Core Philosophy

This aesthetic prioritizes **emotional comfort** and **ease of use** over technical precision. It should feel like a helpful friend rather than a cold tool. Every interaction should feel smooth, gentle, and encouraging.

## Color Palettes

### Light Mode
- **Primary Gradient**: Orange 400 → Pink 400 (`from-orange-400 to-pink-400`)
- **Background**: Soft gradient from Orange 50 → Pink 50 (`from-orange-50 to-pink-50`)
- **Card Background**: White with 80% opacity, backdrop blur
- **Text**: Gray 800 for body, Orange 700 for labels
- **Borders**: Orange 200 (soft, not harsh)
- **Accents**: Orange 300-600, Pink 400-600

### Dark Mode
- **Primary Gradient**: Purple 500 → Pink 500 (`from-purple-500 to-pink-500`)
- **Background**: Deep gradient from Slate 900 → Purple 900 → Slate 900
- **Card Background**: Slate 800 with 80% opacity, backdrop blur
- **Text**: Purple 100 for body, Purple 300 for labels
- **Borders**: Purple 500 with 30% opacity (subtle glow)
- **Accents**: Purple 300-600, Pink 400-600

## Typography

- **Headings**: 3xl (1.875rem), semibold weight, gradient text
- **Subheadings**: Small text with 70% opacity for softness
- **Labels**: Small (0.875rem), medium weight, theme-colored
- **Body**: Large (1.125rem) for comfortable reading
- **Font Family**: System default (inherits warmth from rounded letterforms)

## Border Radius

Use generous rounding to create friendly, approachable shapes:
- **Cards**: 1.5rem (rounded-3xl)
- **Inputs/Textareas**: 1rem (rounded-2xl)
- **Buttons**: Full rounded (rounded-full)
- **Controls/Selects**: Full rounded (rounded-full)
- **Containers**: 1rem (rounded-2xl)

Sharp corners = cold and technical. Round corners = warm and friendly.

## Shadows

Shadows should be **soft and subtle**, never harsh:
- **Cards**: xl shadow (large but gentle)
- **Buttons**: md shadow, increase to lg on hover
- **Dark mode buttons**: Add colored shadow (purple-500/30) for glow effect
- **Inputs**: Minimal or no shadow, rely on borders instead

## Interactive Elements

### Buttons
- **Primary**: Gradient background, white text, full rounded, shadow on hover
- **Secondary**: Transparent/light background, colored text, bordered, full rounded
- **Icon buttons**: Include SVG icons with 5x5 sizing, 2px gap from text
- **States**: Smooth transitions (300ms), slightly darker/lighter on hover

### Form Controls
- **Inputs/Textareas**: Translucent background, soft borders, ring on focus (not hard outline)
- **Select dropdowns**: Match input styling, full rounded
- **Sliders**: Gradient fill, full rounded, 8px height
- **Focus states**: 2px colored ring, no harsh outlines

### Transitions
All color and transform changes should use `transition-all duration-300` or `duration-500` for smoothness.

## Spacing

Use generous spacing to avoid cramped feelings:
- **Card padding**: 2rem (p-8)
- **Section gaps**: 1.5rem (space-y-6)
- **Button gaps**: 0.75rem (gap-3)
- **Label-to-input**: 0.5rem (mb-2)

## Special Elements

### Icons
- Use outline-style icons (stroke, not fill) for friendliness
- Size: 5x5 (1.25rem) for inline, 12x12 (3rem) for hero
- Color: Match theme accent colors
- Include meaningful icons: microphone, download, share, play/pause

### Tips/Info Boxes
- Soft background (colored with low opacity)
- Rounded corners (rounded-2xl)
- Include icon on left side
- Border matching theme with low opacity

### Progress Indicators
- 2px height, full rounded
- Gradient fill matching primary colors
- Container background: light theme color
- Animate with pulse when active

### Backdrop Effects
- Use `backdrop-blur` on semi-transparent cards
- Creates depth and modern feel
- Works in both light and dark modes

## Do's and Don'ts

### ✅ Do
- Use gradients for visual interest
- Round corners generously
- Provide smooth transitions
- Include friendly micro-interactions
- Use warm colors (orange, pink, purple)
- Add breathing room with generous spacing

### ❌ Don't
- Use harsh black borders
- Create sharp corners or hard edges
- Use cold colors like pure blue or gray
- Over-animate or distract with motion
- Clutter the interface
- Use jarring transitions or no transitions

## Implementation Notes

- All transitions should be `duration-300` or `duration-500`
- Use Tailwind's gradient utilities for consistency
- Maintain the same border radius values across components
- Keep the opacity values consistent (80% for cards, 70% for backgrounds, 30% for borders)
- Test both light and dark modes together to ensure they feel cohesive

---

**Goal**: When users interact with this interface, they should feel welcomed, comfortable, and encouraged—like they're working with a patient, friendly assistant rather than a cold machine.
