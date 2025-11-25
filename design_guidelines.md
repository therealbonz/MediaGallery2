# Media Gallery Design Guidelines

## Design Approach
**Hybrid Reference-Based Approach**: Drawing inspiration from Google Photos' clean utility and Pinterest's visual focus, with touches of Dropbox's file management clarity. This balances the app's dual nature as both a creative showcase (3D cube) and practical media manager (grid, reordering, uploads).

## Typography
- **Font Family**: Inter for UI elements, DM Sans for headings
- **Scale**: 
  - Headers: text-2xl to text-3xl (24-30px), font-bold
  - Section titles: text-xl (20px), font-semibold
  - Body/UI: text-sm to text-base (14-16px), font-medium
  - Captions: text-xs (12px), font-normal
- **Hierarchy**: Bold headers, medium weight for interactive elements, normal for secondary text

## Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Container padding: p-6 to p-8
- Section gaps: gap-12 to gap-16
- Component spacing: gap-4 to gap-6
- Card padding: p-4
- Button padding: px-6 py-3

**Grid System**:
- Max-width container: max-w-7xl mx-auto
- Gallery grid: Responsive columns (3/4/5/6/8 based on viewport)
- Auto-rows: 120px base with span-1 and span-2 variants

## Core Components

### Navigation Header
- Full-width with border-b border-gray-800/50
- Centered title with subtle icon
- Sticky positioning (sticky top-0 z-40)
- Backdrop blur effect (backdrop-blur-md bg-gray-950/90)
- Height: h-16
- Add upload button and view toggle (grid/list) in header right

### 3D Cube Gallery
- Centered showcase section
- Add loading skeleton while images load
- Include caption overlay showing current face filename on hover
- Smooth shadow transitions (shadow-2xl when active)
- Background: subtle radial gradient from gray-900 to gray-950

### Upload Dropzone
- Dashed border (border-2 border-dashed border-gray-700)
- Hover state: border-blue-500 bg-gray-900/50
- Icon + text layout with file type indicators
- Progress bar component: h-2 rounded-full bg-gray-800 with blue-500 fill
- Error states: border-red-500 with red text

### Gallery Grid
- Masonry layout with gap-3
- Card design:
  - Rounded corners: rounded-xl
  - Hover lift: hover:scale-[1.02] transition-transform
  - Shadow: shadow-lg hover:shadow-2xl
  - Overlay gradient: from-transparent to-black/60
- Action buttons (top-right):
  - Like button: Heart icon, red-600 when active
  - Delete button: Trash icon, opacity-0 group-hover:opacity-100
  - Download button: Download icon
- Multi-select mode: Checkbox overlay (top-left) with blue-500 accent
- Drag handle indicator: Subtle grip icon, visible on hover

### Search & Filter Bar
- Positioned above gallery
- Flex layout: search input (flex-1) + filter dropdowns
- Search input: 
  - rounded-lg border border-gray-700 bg-gray-900
  - Focus: ring-2 ring-blue-500 border-blue-500
  - Icon prefix (search icon)
- Filter tags: Pill-shaped chips with x-close button
- Sort dropdown: Custom select with gray-800 background

### Modal Viewer
- Full-screen overlay: bg-black/90 backdrop-blur-lg
- Draggable card: rounded-2xl shadow-2xl bg-gray-900
- Controls:
  - Close button: top-right, rounded-full bg-gray-800 hover:bg-gray-700
  - Navigation arrows: Left/right edges, circular buttons
  - Zoom controls: Bottom-right corner stack
  - Info panel: Slide-out sidebar with filename, date, dimensions
- Zoom percentage badge: top-right corner, bg-black/60 px-3 py-1 rounded-full

### Action Toolbar (Bulk Operations)
- Slide-up from bottom when items selected
- Fixed positioning: fixed bottom-4 left-1/2 -translate-x-1/2
- Pill container: bg-gray-900 border border-gray-700 rounded-full px-6 py-3
- Buttons: icon + count, separated by vertical dividers
- Shadow: shadow-2xl

### Empty States
- Centered layout with icon (cloud upload)
- Gray-500 text with call-to-action button
- Illustration style: Line art icons, 48x48px

## Interactions & States

**Hover Effects**:
- Buttons: bg brightness increase, subtle scale-105
- Cards: lift with shadow enhancement
- Icons: scale-110 transition

**Active States**:
- Liked items: scale-110 with bounce animation
- Selected items: ring-2 ring-blue-500
- Dragging: scale-95 opacity-80 shadow-2xl

**Loading States**:
- Skeleton screens: bg-gray-800 animate-pulse rounded
- Spinner: border-2 border-gray-700 border-t-blue-500 animate-spin

**Transitions**:
- Standard: transition-all duration-200 ease-out
- Complex: transition-transform duration-300 ease-in-out

## Accessibility
- Focus rings: ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-950
- ARIA labels on all interactive elements
- Keyboard navigation for gallery (arrow keys)
- Screen reader announcements for drag-drop and uploads
- Minimum touch targets: 44x44px

## Visual Enhancements
- Glassmorphism on overlays: backdrop-blur-md bg-gray-900/80
- Gradient accents: from-blue-600 to-purple-600 for CTAs
- Subtle borders: border-gray-800/50
- Card reflections: Add subtle shine effect on media cards
- Micro-animations: Stagger gallery items on load (0.05s delay each)