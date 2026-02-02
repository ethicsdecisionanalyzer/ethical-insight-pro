# Ethical Decision-Making Analyzer

## Overview

A professional web application for occupational health and safety professionals to submit ethics cases for AI-powered analysis. Users validate access codes from printed Wiley textbooks to gain access to the case submission system.

---

## Table of Contents

1. [Features](#features)
2. [Pages](#pages)
3. [User Flows](#user-flows)
4. [Technical Architecture](#technical-architecture)
5. [Design System](#design-system)
6. [Data Models](#data-models)
7. [Admin Guide](#admin-guide)

---

## Features

### Core Functionality
- **Access Code Validation**: Unique codes from printed books grant 5 case submissions each
- **Case Submission**: Detailed ethics case intake form with professional code selection
- **Admin Dashboard**: Manage access codes and view submissions

### Security & Privacy
- Session-based identification (no personal data required)
- Confidential case submissions
- Password-protected admin area

---

## Pages

### 1. Landing Page (`/`)

**Purpose**: Validate user access codes before allowing case submission.

**Components**:
- Header with Wiley branding
- Access code input field (auto-uppercase)
- Validation button with loading state
- Success/error feedback messages
- Footer with support contact

**Behavior**:
- Validates code format and availability
- Checks if code is active and has remaining uses
- On success: redirects to Case Intake with `code_id`, `session_id`, and `code` in URL params
- On failure: displays error message, allows retry

---

### 2. Case Intake (`/case-intake`)

**Purpose**: Collect detailed ethics case information for analysis.

**URL Parameters**:
- `code_id`: Validated access code ID
- `session_id`: Unique session identifier
- `code`: Display code for user reference

**Form Fields**:

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| Case Title | Text | Yes | 200 chars | Brief descriptive title |
| Case Description | Textarea | Yes | 5000 chars | Detailed narrative of the ethical dilemma |
| Key Stakeholders | Text | No | - | People/groups affected by the decision |
| Professional Codes | Multi-select | Yes (min 1) | - | Applicable professional ethics codes |

**Professional Code Options**:
- BCSP/ASSP - Safety Professionals
- AIHA/ABIH - Industrial Hygienists
- AAOHN - Occupational Health Nurses
- ACOEM - Occupational & Environmental Medicine Physicians

**Features**:
- Real-time character counter for narrative field
- Example case modal for guidance
- Cancel confirmation dialog
- Success banner on submission
- Help sidebar with writing tips

---

### 3. Admin Dashboard (`/admin`)

**Purpose**: Manage access codes and monitor system usage.

**Authentication**:
- Password: `admin123` (for development/demo)
- Session persists until logout

**Dashboard Sections**:

#### Statistics Cards
- Total Access Codes
- Active Codes (with remaining uses)
- Total Case Submissions
- Today's Redemptions

#### Access Code Management
- **Add New Code**: Generate codes with custom max uses (default: 5)
- **Search**: Filter codes by code string
- **Reset**: Restore code to 0 uses and reactivate
- **Deactivate**: Disable code permanently

#### Access Codes Table
| Column | Description |
|--------|-------------|
| Code | The access code string (monospace) |
| Uses | Progress bar showing used/max |
| Status | Active (green) or Inactive (gray) badge |
| Created | Creation date |
| Actions | Reset and Deactivate buttons |

#### Recent Submissions
- Last 10 case submissions
- Shows title, code used, timestamp, and status

---

## User Flows

### Standard User Flow

```
┌─────────────────┐
│  Landing Page   │
│   Enter Code    │
└────────┬────────┘
         │ Valid Code
         ▼
┌─────────────────┐
│  Case Intake    │
│   Fill Form     │
└────────┬────────┘
         │ Submit
         ▼
┌─────────────────┐
│ Success Message │
│  → Home Page    │
└─────────────────┘
```

### Admin Flow

```
┌─────────────────┐
│  /admin Login   │
│ Enter Password  │
└────────┬────────┘
         │ Authenticated
         ▼
┌─────────────────┐
│   Dashboard     │
│ ┌─────────────┐ │
│ │ Statistics  │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Add Code    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Codes Table │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Submissions │ │
│ └─────────────┘ │
└─────────────────┘
```

---

## Technical Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn/ui
- **Routing**: React Router DOM
- **State Management**: React Query + React hooks

### Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx      # Page headers (landing/page variants)
│   │   └── Footer.tsx      # Global footer
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── spinner.tsx
│       └── ...
├── lib/
│   ├── mockData.ts         # Mock data & helper functions
│   └── utils.ts            # Utility functions (cn helper)
├── pages/
│   ├── Index.tsx           # Landing page
│   ├── CaseIntake.tsx      # Case submission form
│   ├── Admin.tsx           # Admin dashboard
│   └── NotFound.tsx        # 404 page
├── App.tsx                 # Router configuration
├── index.css               # Design system & CSS variables
└── main.tsx                # App entry point
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/mockData.ts` | Data models, mock data, validation functions |
| `src/index.css` | CSS custom properties, design tokens, component classes |
| `tailwind.config.ts` | Tailwind theme configuration |

---

## Design System

### Color Palette

| Token | Light Mode | Usage |
|-------|------------|-------|
| `--primary` | Navy Blue (#1e3a8a) | Buttons, links, focus states |
| `--secondary` | Slate Gray (#64748b) | Secondary text, borders |
| `--success` | Green (#10b981) | Success states, active badges |
| `--destructive` | Red (#ef4444) | Errors, warnings |
| `--background` | White (#ffffff) | Page backgrounds |
| `--background-light` | Light Gray (#f8fafc) | Card backgrounds, sections |

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Semibold/Bold weights
- **Body**: Regular weight
- **Monospace**: Used for access codes

### Component Classes

```css
/* Cards */
.card-professional        /* Standard card with border */
.card-professional-elevated /* Card with shadow */

/* Inputs */
.input-professional       /* Styled input field */
.input-professional.error /* Error state */

/* Badges */
.badge-success           /* Green badge */
.badge-error             /* Red badge */
.badge-neutral           /* Gray badge */

/* Alerts */
.alert-success           /* Green alert box */
.alert-error             /* Red alert box */
```

---

## Data Models

### AccessCode

```typescript
interface AccessCode {
  id: string;
  code: string;        // Format: "BOOK-2026-XXXX"
  maxUses: number;     // Default: 5
  usesCount: number;   // Current usage count
  active: boolean;     // Can be used if true
  createdAt: string;   // ISO date string
}
```

### CaseSubmission

```typescript
interface CaseSubmission {
  id: string;
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];      // Professional codes array
  accessCodeUsed: string;       // Access code string
  sessionId: string;
  timestamp: string;            // ISO datetime
  status: "submitted" | "analyzed";
}
```

### CodeRedemption

```typescript
interface CodeRedemption {
  id: string;
  codeId: string;
  sessionId: string;
  timestamp: string;
}
```

---

## Admin Guide

### Default Credentials
- **Password**: `admin123`

### Managing Access Codes

#### Adding a New Code
1. Enter code in "BOOK-2026-XXXX" format
2. Set max uses (default: 5)
3. Click "Add Code"

#### Resetting a Code
1. Find code in table
2. Click "Reset" button
3. Confirm in dialog
4. Code returns to 0 uses and Active status

#### Deactivating a Code
1. Find code in table
2. Click "Deactivate" button
3. Confirm in dialog
4. Code becomes unusable

### Monitoring Usage
- View statistics cards for quick overview
- Check recent submissions for activity
- Search codes to find specific entries

---

## Future Enhancements (Milestone 2+)

- [ ] AI-powered ethics analysis
- [ ] Results page with detailed feedback
- [ ] Database integration (Supabase)
- [ ] User authentication
- [ ] Email notifications
- [ ] PDF export of analysis
- [ ] Historical case comparison

---

## Support

For technical support, contact: ethics-support@wiley.com

© 2026 Wiley Publishing
