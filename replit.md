# Media Gallery Application

## Overview

A modern, interactive media gallery application for organizing and viewing photos and videos. The application features a unique 3D cube gallery viewer, drag-and-drop upload functionality, advanced filtering and search capabilities, and a responsive masonry-style grid layout. Built with React on the frontend and Express on the backend, using PostgreSQL for data persistence.

## Current Status (Nov 29, 2025)

**Fully Functional Features:**
- Gallery grid with drag-to-reorder functionality
- 3D cube viewer showing random images
- Modal image/video viewer with Close and Edit buttons
- Image editor page with canvas editing tools
- Masonry-style responsive grid layout
- Search and filter capabilities (media type, liked status)
- PWA support (installable on Android, offline caching)
- Upload functionality (authenticated users only)
- Like/unlike toggle for media items
- Pagination with 25 images per page
- Homepage link to return to first page
- Scroll to top on page navigation
- **Spotify Integration:**
  - Now Playing widget showing current track with album art and progress
  - Playlist browser with track listing
  - Recent albums grid from listening history
  - Auto-refresh every 5 seconds for now playing

**Known Issues:**
- Share button rendering issue (invisible despite multiple z-index/positioning attempts) - temporarily removed from modal UI
- Share functionality backend code remains in handleShare() for future implementation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **UI Library:** Shadcn/ui components built on Radix UI primitives
- **Styling:** Tailwind CSS with custom design system
- **State Management:** TanStack Query (React Query) for server state
- **Routing:** Wouter for lightweight client-side routing
- **Drag & Drop:** @hello-pangea/dnd for reorderable media grid

**Design System:**
- Hybrid approach inspired by Google Photos (clean utility), Pinterest (visual focus), and Dropbox (file management clarity)
- Typography: Inter for UI elements, DM Sans for headings
- Color scheme: Neutral-based with customizable HSL variables supporting light/dark modes
- Spacing: Tailwind's standard spacing units (2, 4, 6, 8, 12, 16, 24)
- Component variants: Extensive use of class-variance-authority for consistent component APIs

**Key Components:**
- **CubeGallery:** 3D rotating cube displaying 6 random images with drag interaction and physics-based rotation
- **MediaGrid:** Masonry-style responsive grid with drag-to-reorder functionality and deterministic span assignments
- **UploadDropzone:** Drag-and-drop file upload with progress indication and file type validation
- **ImageEditor:** Canvas-based image editor for text overlays and resizing
- **SearchFilterBar:** Combined search and filter controls for media type and liked status
- **PWAComponents:** Install prompt, offline notice, and online indicator for Progressive Web App functionality

### Progressive Web App (PWA) Features

**Installation:**
- App can be installed on Android devices directly from the browser
- Web app manifest with proper icons (72x72 to 512x512 PNG)
- Maskable icons for adaptive icon support on Android
- Install prompt appears when criteria are met

**Offline Support:**
- Service worker caches static assets, API data, and media files
- Stale-while-revalidate strategy for API calls
- Cache-first strategy for media files
- Offline notice banner when connectivity is lost

**Mobile Responsiveness:**
- Responsive header with hamburger menu on mobile
- Collapsible navigation for smaller screens
- Touch-friendly UI with proper touch targets
- Adaptive layouts for various screen sizes

### Backend Architecture

**Technology Stack:**
- **Framework:** Express.js with TypeScript
- **Database ORM:** Drizzle ORM for type-safe database operations
- **File Upload:** Multer for handling multipart/form-data
- **Development Mode:** Vite middleware integration for hot module replacement
- **Production Mode:** Static file serving of pre-built React application

**API Design:**
- RESTful API pattern with `/api` prefix
- Endpoints:
  - `GET /api/media` - Retrieve all media items (public)
  - `GET /api/media/:id` - Retrieve single media item with full data (public)
  - `POST /api/media/upload` - Upload new media files (requires authentication)
  - `POST /api/media/:id/like` - Toggle like status
  - `DELETE /api/media/:id` - Delete media item
  - `POST /api/media/reorder` - Reorder media items
  - `GET /api/auth/user` - Get current authenticated user
  - `GET /api/login` - Initiate OAuth login flow
  - `GET /api/logout` - Log out current user
  - `GET /api/callback` - OAuth callback handler

**Authentication:**
- Replit Auth integration using OpenID Connect
- Session-based authentication with PostgreSQL session store
- Protected routes: Upload, delete, reorder (requires login)
- Public routes: View media, search, filter

**File Upload Strategy:**
- Current: In-memory storage with data URL encoding (temporary solution)
- Designed for: Future integration with object storage (S3, Cloudflare R2, etc.)
- Validation: Images (jpeg, jpg, png, gif, webp) and videos (mp4, mov, avi, mkv)

**Data Layer (Storage):**
- Interface-based design (`IStorage`) for swappable implementations
- Current implementation: `DbStorage` using Drizzle ORM
- Supports: CRUD operations, custom ordering via `displayOrder` field, batch reordering

### Database Architecture

**Database:** PostgreSQL (via Neon serverless)

**Schema Design:**
```typescript
sessions table (for Replit Auth):
- sid: VARCHAR primary key
- sess: JSONB, session data
- expire: Timestamp, session expiration

users table (for Replit Auth):
- id: VARCHAR primary key (Replit user ID)
- email: VARCHAR unique
- firstName: VARCHAR
- lastName: VARCHAR
- profileImageUrl: VARCHAR
- createdAt: Timestamp
- updatedAt: Timestamp

media table:
- id: Auto-incrementing primary key
- filename: Text, stores original filename
- url: Text, stores media URL or data URL
- mediaType: Text, distinguishes "image" vs "video"
- liked: Boolean, for favorite/like functionality
- displayOrder: Integer, for custom user-defined ordering
- createdAt: Timestamp, automatically set on creation
```

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Configuration: `drizzle.config.ts` specifies PostgreSQL dialect and migration directory

**Data Access Patterns:**
- Default ordering: Primary by `displayOrder`, secondary by `createdAt` (descending)
- Auto-increment display order on new media creation
- Supports batch reordering operations for drag-and-drop functionality

### External Dependencies

**Database:**
- **Neon Serverless PostgreSQL:** Cloud-hosted PostgreSQL with WebSocket support
- Connection via `@neondatabase/serverless` with connection pooling
- WebSocket constructor override using `ws` package for Node.js compatibility

**UI Component Library:**
- **Radix UI:** Comprehensive set of accessible, unstyled React components
- Components used: Dialog, Dropdown, Select, Toast, Progress, Checkbox, and 20+ others
- **Shadcn/ui:** Pre-configured Radix UI components with Tailwind styling

**Third-Party Services:**
- **Image Sources:** Currently using Unsplash for sample/demo images
- **Future Object Storage:** Architecture designed for S3-compatible storage integration

**Development Tools:**
- **Replit Plugins:** Vite plugins for runtime error overlay, cartographer (code navigation), and dev banner
- **TSX:** TypeScript execution for development server
- **ESBuild:** Bundling for production builds

**Validation & Type Safety:**
- **Zod:** Runtime validation for API inputs via `drizzle-zod` integration
- Full TypeScript coverage across frontend, backend, and shared schema

## Next Steps & Future Enhancements

1. **Fix Share Button:** Investigate persistent rendering issue with share button in modal (z-index stacking context problem)
2. **Object Storage:** Migrate from data URLs to proper cloud storage (S3/R2)
3. **Advanced Filters:** Add date range filtering and tag-based organization
4. **Video Playback:** Enhance TikTok-style shorts player with playback controls
5. **Social Features:** Implement working share functionality once rendering issue is resolved
6. **Performance:** Add image lazy loading and progressive image loading
7. **Branding:** Update app name from default to "MediaGallery" (blocked by package.json restrictions)
