# Local Image Management App - Implementation Plan

## Core Requirements

- **Technology Stack**: Next.js 15 (App Router), React, TypeScript, shadcn/ui, Server Actions
- **Functionality**: Browse directories, view images, upload images (including drag & drop), create folders, rename items, delete items
- **Environment**: Runs on localhost (port 3000), accessible by multiple users on the same local network
- **Configuration**: Global config file for data path and other settings, no hardcoded values
- **Design**: Apple-like minimalist design with clean typography, ample whitespace, and subtle shadows. Light mode only.
- **Architecture**: Modular, maintainable code with clear separation of concerns
- **Code Quality**: Well-commented code, consistent naming conventions, and TypeScript types

## Implementation Steps

### 1. Project Setup

- Initialize Next.js 15 project with TypeScript
  ```bash
  npx create-next-app@latest --typescript
  ```
- Set up shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- Install necessary shadcn components (button, card, dialog, table, toast, breadcrumb, etc.)
- Configure theme to use Apple-inspired light mode only (neutral colors, subtle blues for accents)
- Set up project directory structure for modularity:
  - `src/app`: Next.js routing and pages
  - `src/components`: Reusable UI components (subdivided into `ui/`, `features/`, `layout/`)
  - `src/lib`: Shared utility functions and helpers
  - `src/server`: Server-side logic (actions, services)
  - `src/hooks`: Custom React hooks for reusable logic
  - `src/types`: TypeScript type definitions
  - `src/config`: Application configuration

### 2. Configuration Management

- Create `src/config/index.ts` with:
  - `DATA_PATH`: Base directory for storing images and folders
  - `ALLOWED_FILE_TYPES`: Array of permitted file extensions/MIME types
  - `MAX_FILE_SIZE`: Maximum upload file size
  - `THUMBNAIL_DIMENSIONS`: Sizes for image previews
- Create `src/lib/constants.ts` for any magic strings or values
- Set up `.env.local` for environment-specific settings with clear defaults

### 3. Core UI Layout

- Create responsive app layout using shadcn components with Apple-like aesthetics:
  - Clean, sans-serif typography
  - Subtle rounded corners
  - Minimal, purposeful animations
  - Generous padding and whitespace
- Design simple header with navigation and action buttons inspired by macOS/iOS apps
- Set up toast notifications for operation feedback with Apple-style design
- Implement light color scheme only with soft neutrals and subtle shadows
- Build UI components with clear interfaces and proper TypeScript typing

### 4. Directory Navigation

- Create dynamic route `[...path]` to handle folder navigation
- Implement breadcrumb component for path visualization
- Create server action to fetch directory contents
- Display folders and images in grid/list view (toggleable) with Apple-like design:
  - Grid view similar to macOS Finder
  - List view with clean, minimal rows
- Add sorting/filtering options (by name, date, type)
- Implement as separate, single-responsibility components

### 5. Filesystem Service Layer

- Create abstraction for filesystem operations in `src/server/services/filesystem.ts`:
  - Directory listing functions
  - File creation/deletion/modification functions
  - Error handling and proper typing
- Implement service that can be used by server actions, providing a single point for filesystem interactions
- Add thorough comments explaining complex operations

### 6. File Operations

- Implement server actions in `src/server/actions/`:
  - Creating folders
  - Renaming files/folders
  - Deleting files/folders
  - Moving files/folders
- Create UI components for each operation with proper validation
- Add confirmation dialogs for destructive actions
- Implement optimistic updates with fallback error handling
- Use `revalidatePath` after operations to refresh data
- Separate UI components from logic with custom hooks

### 7. Image Handling

- Create image preview component with Next.js Image optimization
- Implement lightbox modal for full-size viewing with Apple-inspired controls
- Add image metadata display (dimensions, size, type)
- Support basic image operations (rotate, download)
- Use smaller, focused components composed together for flexibility

### 8. Upload Functionality

- Create dropzone component for drag & drop uploads with visual feedback similar to macOS/iOS
- Implement progress indicators for file uploads using Apple-like progress bars
- Add validation for file types and sizes based on config
- Support batch uploads with aggregate progress
- Handle duplicate file names gracefully
- Implement server action for receiving and saving files
- Extract reusable logic into custom hooks

### 9. Concurrent Access Handling

- Implement basic file locking or checking for operations
- Add optimistic UI with proper error handling for conflicts
- Consider simple refresh mechanism for directory contents
- Provide clear feedback when conflicts occur
- Create utility functions for handling common conflict scenarios

## Technical Considerations

- Use Node.js `fs` module via abstracted service layer for file operations
- Leverage Next.js Image component for optimized image delivery
- Utilize shadcn/ui for consistent, accessible UI components
- Consider file operation atomicity to prevent partial updates
- Implement reasonable limits on operations to prevent abuse
- Ensure UI components follow Apple's design principles of clarity, deference, and depth
- Follow consistent naming conventions across the codebase
- Add meaningful comments for complex logic while keeping simple code self-explanatory
- Use TypeScript properly with interfaces for all data structures
- Avoid any hardcoded values; use configuration or constants

This implementation plan focuses on creating a modular, maintainable application with clear separation of concerns. The code will be well-structured, properly typed, and commented, making it easy to extend and maintain. The application will feature an Apple-inspired minimalist design in light mode only, be modern, user-friendly, and capable of handling multiple concurrent users on a local network without authentication requirements. 