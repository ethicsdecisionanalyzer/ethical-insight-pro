<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-BaaS-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_2.0_Flash-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Deno-Edge_Functions-000000?style=for-the-badge&logo=deno&logoColor=white" alt="Deno" />
</p>

<h1 align="center">Ethical Insight Pro</h1>

<p align="center">
  <strong>AI-Powered Ethical Decision-Making Analyzer for Occupational Health &amp; Safety Professionals</strong>
</p>

<p align="center">
  A companion application for the Wiley textbook<br/>
  <em>"Ethical Decision-making in Occupational and Environmental Health and Safety:<br/>A Comparative Case Study Approach"</em> (© 2026, John Wiley &amp; Sons)
</p>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [User Journey](#user-journey)
- [AI Analysis Pipeline](#ai-analysis-pipeline)
- [Scoring Algorithm](#scoring-algorithm)
- [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Professional Codes of Conduct](#professional-codes-of-conduct)
- [Six Ethical Lenses](#six-ethical-lenses)
- [Security & Privacy](#security--privacy)
- [License](#license)

---

## Overview

**Ethical Insight Pro** provides OHS professionals -- safety engineers, industrial hygienists, occupational health nurses, and OHS physicians -- with a structured, AI-powered analytical framework for evaluating ethical dilemmas. The platform analyzes cases through **six ethical lenses**, cross-references **four professional codes of conduct**, and generates comprehensive, non-prescriptive analysis reports with composite scoring, conflict detection, and reflection prompts.

```mermaid
graph LR
    A["OHS Professional"] --> B["Case Intake Form"]
    B --> C["6 Ethical Lens Scoring"]
    B --> D["4 Professional Codes"]
    C --> E["AI Analysis Engine<br/>(Gemini 2.0 Flash)"]
    D --> E
    E --> F["Deterministic Guardrails<br/>(Algorithm v2.0)"]
    F --> G["Comprehensive<br/>Analysis Report"]
    G --> H["Composite Score"]
    G --> I["Radar Visualization"]
    G --> J["Conflict Detection"]
    G --> K["Reflection Prompts"]

    style A fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style B fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style C fill:#1e293b,stroke:#8b5cf6,color:#e2e8f0
    style D fill:#1e293b,stroke:#8b5cf6,color:#e2e8f0
    style E fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style F fill:#1e293b,stroke:#ef4444,color:#e2e8f0
    style G fill:#1e293b,stroke:#10b981,color:#e2e8f0
    style H fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style I fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style J fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style K fill:#0f172a,stroke:#10b981,color:#e2e8f0
```

---

## Problem Statement

OHS professionals regularly face complex ethical dilemmas where professional obligations, stakeholder interests, and theoretical ethical frameworks may conflict. Traditional approaches rely on subjective judgment without structured analytical support.

**Ethical Insight Pro bridges this gap by:**

| Challenge | Solution |
|:----------|:---------|
| Unstructured ethical reasoning | Guided analysis through 6 ethical lenses |
| Inconsistent code compliance checks | Automated cross-referencing of 4 professional codes |
| Subjective scoring | Deterministic 70/30 weighted algorithm with guardrails |
| AI hallucination risk | AI provides reasoning only; all scores are computed deterministically |
| Prescriptive bias | Non-advisory language enforced at the AI prompt level |

---

## Core Features

```mermaid
graph TB
    subgraph AUTH["Authentication & Access Control"]
        A1["Textbook Verification Gate"]
        A2["Email/Password Auth"]
        A3["Role-Based Access<br/>(Admin / User)"]
        A4["Password Recovery Flow"]
    end

    subgraph INTAKE["Ethics Case Intake"]
        B1["Case Narrative Entry<br/>(up to 5,000 chars)"]
        B2["Stakeholder Identification"]
        B3["Professional Code Selection"]
        B4["6-Lens Scoring<br/>(1-10 Sliders)"]
        B5["Consent Verification"]
    end

    subgraph ANALYSIS["AI Analysis Engine"]
        C1["Google Gemini 2.0 Flash<br/>Qualitative Reasoning"]
        C2["Deterministic Guardrails<br/>Algorithm v2.0"]
        C3["Violation Detection"]
        C4["Stability Classification"]
    end

    subgraph RESULTS["Results Dashboard"]
        D1["Composite Score<br/>(1-10, Color-Coded)"]
        D2["Radar Chart<br/>Visualization"]
        D3["Lens-by-Lens<br/>Reasoning Cards"]
        D4["Code Implications<br/>(Collapsible)"]
        D5["Warning Flags"]
        D6["Reflection Questions"]
        D7["Print / Export PDF"]
    end

    subgraph ADMIN["Admin Dashboard"]
        E1["Verification Question<br/>Management (CRUD)"]
        E2["User Management<br/>& Usage Resets"]
        E3["Submission Monitoring"]
    end

    AUTH --> INTAKE
    INTAKE --> ANALYSIS
    ANALYSIS --> RESULTS
    AUTH --> ADMIN

    style AUTH fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style INTAKE fill:#0f172a,stroke:#8b5cf6,color:#e2e8f0
    style ANALYSIS fill:#0f172a,stroke:#f59e0b,color:#e2e8f0
    style RESULTS fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style ADMIN fill:#0f172a,stroke:#ef4444,color:#e2e8f0
```

### Feature Highlights

- **Textbook Verification Gate** -- Users must answer an admin-configured knowledge question from the textbook before registration, ensuring access is limited to legitimate textbook owners.

- **Structured Case Intake** -- Guided form collecting case title, narrative (up to 5,000 characters), stakeholders, applicable professional codes, and user-rated ethical lens scores via intuitive sliders.

- **AI-Powered Qualitative Analysis** -- Google Gemini 2.0 Flash generates nuanced reasoning for each ethical lens and professional code, constrained to analytical (never prescriptive) language.

- **Deterministic Scoring with Guardrails** -- All numeric scores, stability classifications, and conflict levels are computed by Algorithm v2.0 -- the AI never generates scores, eliminating hallucination risk.

- **Comprehensive Results Dashboard** -- Composite score display, interactive radar chart, lens-by-lens reasoning cards, collapsible code implications, violation warnings, analytical observations, and reflection questions.

- **Usage Limits & Admin Controls** -- Configurable per-user analysis limits (default: 5), admin-managed verification questions, user management, and submission monitoring.

---

## System Architecture

```mermaid
graph TB
    subgraph CLIENT["Frontend (React SPA)"]
        UI["React 18 + TypeScript"]
        ROUTER["React Router v6"]
        STATE["TanStack React Query"]
        CTX["AuthContext"]
        SHAD["shadcn/ui + Tailwind CSS"]
        CHARTS["Recharts (Radar)"]
    end

    subgraph SUPABASE["Supabase (Backend-as-a-Service)"]
        AUTH_SVC["Supabase Auth"]
        DB["PostgreSQL Database"]
        RLS["Row Level Security"]
        EDGE["Edge Functions (Deno)"]
    end

    subgraph EXTERNAL["External Services"]
        GEMINI["Google Gemini 2.0 Flash API"]
    end

    UI --> ROUTER
    ROUTER --> STATE
    STATE --> CTX
    UI --> SHAD
    UI --> CHARTS

    CTX -->|"Auth API"| AUTH_SVC
    STATE -->|"PostgREST API"| DB
    DB --> RLS
    STATE -->|"Function Invoke"| EDGE
    EDGE -->|"HTTP Request"| GEMINI

    style CLIENT fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style SUPABASE fill:#0f172a,stroke:#3FCF8E,color:#e2e8f0
    style EXTERNAL fill:#0f172a,stroke:#f59e0b,color:#e2e8f0
    style UI fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style ROUTER fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style STATE fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style CTX fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style SHAD fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style CHARTS fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style AUTH_SVC fill:#1a2e1a,stroke:#3FCF8E,color:#e2e8f0
    style DB fill:#1a2e1a,stroke:#3FCF8E,color:#e2e8f0
    style RLS fill:#1a2e1a,stroke:#3FCF8E,color:#e2e8f0
    style EDGE fill:#1a2e1a,stroke:#3FCF8E,color:#e2e8f0
    style GEMINI fill:#2a1a0a,stroke:#f59e0b,color:#e2e8f0
```

---

## User Journey

### New User Registration

```mermaid
sequenceDiagram
    participant U as OHS Professional
    participant V as Verify Page
    participant R as Register Page
    participant S as Supabase Auth
    participant DB as PostgreSQL
    participant E as Email Service

    U->>V: Navigate to /verify
    V->>DB: Fetch active verification question
    DB-->>V: Return question
    U->>V: Submit answer
    V->>V: Validate against stored answer
    V-->>U: Verification passed
    U->>R: Redirect to /register
    R->>S: signUp(email, password, metadata)
    S->>E: Send confirmation email
    S->>DB: Trigger: handle_new_user()
    DB->>DB: Auto-create profile row
    E-->>U: Confirmation email
    U->>S: Confirm email
    U->>R: Redirect to /login
```

### Case Analysis Flow

```mermaid
sequenceDiagram
    participant U as User
    participant CI as Case Intake
    participant DB as PostgreSQL
    participant EF as Edge Function
    participant AI as Gemini 2.0 Flash
    participant R as Results Page

    U->>CI: Fill case form + lens scores
    CI->>DB: Insert case_submission (status: pending)
    CI->>DB: Increment usage_count
    CI->>EF: Invoke analyze-case
    EF->>EF: Validate input fields
    EF->>AI: Send structured prompt + case data
    AI-->>EF: Qualitative reasoning (JSON)
    EF->>EF: Apply Guardrails Algorithm v2.0
    Note over EF: 70% code compliance<br/>30% lens average<br/>Violation cap at 4.9
    EF->>EF: Compute composite score
    EF->>EF: Classify stability + conflict
    EF-->>CI: Full analysis result
    CI->>DB: Update case_submission with analysis
    CI->>R: Redirect to /results?case_id=...
    R->>DB: Fetch case + analysis
    R-->>U: Display comprehensive report
```

### Admin Workflow

```mermaid
sequenceDiagram
    participant A as Admin
    participant AD as Admin Dashboard
    participant DB as PostgreSQL

    A->>AD: Login with admin credentials
    AD->>DB: Verify admin role (has_role RPC)
    DB-->>AD: Confirmed admin

    rect rgb(15, 23, 42)
        Note over AD,DB: Verification Questions Management
        AD->>DB: CRUD verification questions
        AD->>DB: Toggle question active/inactive
    end

    rect rgb(15, 23, 42)
        Note over AD,DB: User Management
        AD->>DB: Fetch all profiles + usage stats
        AD->>DB: Reset user usage counts
    end

    rect rgb(15, 23, 42)
        Note over AD,DB: Submission Monitoring
        AD->>DB: Fetch recent case submissions
        AD-->>A: Display status + timestamps
    end
```

---

## AI Analysis Pipeline

```mermaid
graph TB
    INPUT["Case Data Input"] --> VALIDATE["Input Validation"]
    VALIDATE --> PROMPT["Construct AI Prompt"]

    subgraph PROMPT_CTX["Prompt Context"]
        L1["6 Ethical Lens Definitions"]
        L2["4 Professional Code Knowledge"]
        L3["Violation Detection Rules"]
        L4["Non-Advisory Language Constraints"]
    end

    PROMPT --> PROMPT_CTX
    PROMPT_CTX --> GEMINI["Gemini 2.0 Flash API Call"]
    GEMINI --> RAW["Raw AI Response<br/>(Qualitative Reasoning Only)"]
    RAW --> GUARD["Deterministic Guardrails"]

    subgraph GUARD_DETAIL["Algorithm v2.0 Guardrails"]
        G1["Use user-provided lens scores directly"]
        G2["Compute code compliance from violations:<br/>9 (none) / 6 (tension) / 3 (single) / 1 (multi)"]
        G3["Composite = 70% code + 30% lens avg"]
        G4["If violation detected: cap at 4.9"]
        G5["Stability = f(std deviation, violations)"]
        G6["Conflict level 1-3"]
    end

    GUARD --> GUARD_DETAIL
    GUARD_DETAIL --> OUTPUT["Structured Analysis JSON<br/>_guardrailsApplied: true<br/>_algorithmVersion: 2.0"]

    style INPUT fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style VALIDATE fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style PROMPT fill:#1e293b,stroke:#8b5cf6,color:#e2e8f0
    style PROMPT_CTX fill:#0f172a,stroke:#8b5cf6,color:#e2e8f0
    style GEMINI fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style RAW fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style GUARD fill:#1e293b,stroke:#ef4444,color:#e2e8f0
    style GUARD_DETAIL fill:#0f172a,stroke:#ef4444,color:#e2e8f0
    style OUTPUT fill:#1e293b,stroke:#10b981,color:#e2e8f0
```

---

## Scoring Algorithm

The **Algorithm v2.0** scoring system ensures deterministic, reproducible results:

```mermaid
graph LR
    subgraph INPUTS["Inputs"]
        LS["User Lens Scores<br/>(6 scores, 1-10 each)"]
        VD["Violation Detection<br/>(from AI reasoning)"]
    end

    subgraph COMPUTE["Computation"]
        AVG["Lens Average<br/>mean(6 scores)"]
        CC["Code Compliance Score<br/>9: No violations<br/>6: Tension only<br/>3: Single violation<br/>1: Multiple violations"]
        COMP["Composite Score<br/>= 0.70 x CC + 0.30 x AVG"]
    end

    subgraph CAP["Guardrail Cap"]
        CHECK{"Violation<br/>detected?"}
        PASS["Final Score"]
        CAPPED["Score capped<br/>at 4.9"]
    end

    subgraph CLASS["Classification"]
        STABLE["Stable<br/>SD < 2.0, no violations"]
        CONTESTED["Contested<br/>SD >= 2.0 or tension"]
        UNSTABLE["Ethically Unstable<br/>violations present"]
    end

    LS --> AVG
    VD --> CC
    AVG --> COMP
    CC --> COMP
    COMP --> CHECK
    CHECK -->|"No"| PASS
    CHECK -->|"Yes"| CAPPED
    PASS --> CLASS
    CAPPED --> CLASS

    style INPUTS fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style COMPUTE fill:#0f172a,stroke:#8b5cf6,color:#e2e8f0
    style CAP fill:#0f172a,stroke:#ef4444,color:#e2e8f0
    style CLASS fill:#0f172a,stroke:#10b981,color:#e2e8f0
```

| Weight | Component | Description |
|:------:|:----------|:------------|
| **70%** | Code Compliance | Weighted heavily -- professional obligations are paramount |
| **30%** | Lens Average | Ethical theory alignment provides supporting context |
| **Cap** | Violation Override | Any detected violation caps composite at **4.9/10** maximum |

---

## Database Schema

```mermaid
erDiagram
    AUTH_USERS ||--o| PROFILES : "trigger creates"
    AUTH_USERS ||--o{ USER_ROLES : "has roles"
    AUTH_USERS ||--o{ CASE_SUBMISSIONS : "submits"
    ACCESS_CODES ||--o{ CODE_REDEMPTIONS : "redeemed via"
    AUTH_USERS ||--o{ CODE_REDEMPTIONS : "redeems"

    PROFILES {
        uuid id PK
        uuid user_id FK
        text full_name
        text email
        text profession
        text tenure
        int usage_count
        int max_analyses
        bool book_verified
        timestamp created_at
        timestamp updated_at
    }

    USER_ROLES {
        uuid id PK
        uuid user_id FK
        app_role role
        timestamp created_at
    }

    CASE_SUBMISSIONS {
        uuid id PK
        text title
        text narrative
        text stakeholders
        text[] selected_codes
        uuid session_id
        uuid user_id FK
        jsonb analysis_result
        text status
        bool consent_no_confidential
        bool consent_aggregate_use
        timestamp created_at
    }

    VERIFICATION_QUESTIONS {
        uuid id PK
        text question
        text answer
        bool active
        timestamp created_at
        timestamp updated_at
    }

    ACCESS_CODES {
        uuid id PK
        text code
        int max_uses
        int uses_count
        bool active
        timestamp created_at
    }

    CODE_REDEMPTIONS {
        uuid id PK
        uuid code_id FK
        uuid session_id
        timestamp created_at
    }
```

**Row Level Security (RLS)** is enforced on all tables:
- Users can only read and update their own profile and submissions
- Admins have full access via the `has_role()` security-definer function
- Verification questions are publicly readable (active only); admin-managed
- All mutations require authentication

---

## Tech Stack

```mermaid
graph TB
    subgraph FRONTEND["Frontend"]
        REACT["React 18.3"]
        TS["TypeScript 5.8"]
        VITE["Vite 5.4"]
        TW["Tailwind CSS 3.4"]
        SHADCN["shadcn/ui (Radix)"]
        RR["React Router 6.30"]
        RQ["TanStack React Query 5.83"]
        RC["Recharts 2.15"]
        LU["Lucide Icons"]
        SONNER["Sonner (Toasts)"]
    end

    subgraph BACKEND["Backend (Supabase)"]
        PG["PostgreSQL"]
        AUTH["Supabase Auth"]
        EDGE_FN["Edge Functions (Deno)"]
        STORAGE["Row Level Security"]
    end

    subgraph AI_LAYER["AI Layer"]
        GEM["Google Gemini 2.0 Flash"]
    end

    subgraph TOOLING["Development Tooling"]
        ESLINT["ESLint 9.32"]
        VITEST["Vitest 3.2"]
        TL["Testing Library"]
        SWC["SWC (Compiler)"]
    end

    FRONTEND --> BACKEND
    BACKEND --> AI_LAYER

    style FRONTEND fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style BACKEND fill:#0f172a,stroke:#3FCF8E,color:#e2e8f0
    style AI_LAYER fill:#0f172a,stroke:#f59e0b,color:#e2e8f0
    style TOOLING fill:#0f172a,stroke:#a855f7,color:#e2e8f0
```

| Category | Technologies |
|:---------|:-------------|
| **Frontend** | React 18.3, TypeScript 5.8, Vite 5.4 (SWC), Tailwind CSS 3.4 |
| **UI Components** | shadcn/ui (Radix UI primitives), Lucide Icons, Sonner |
| **State & Routing** | React Router 6.30, TanStack React Query 5.83, React Context |
| **Visualization** | Recharts 2.15 (Radar Chart) |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions, RLS) |
| **AI Engine** | Google Gemini 2.0 Flash (via Deno Edge Function) |
| **Forms & Validation** | React Hook Form 7.61, Zod 3.25 |
| **Testing** | Vitest 3.2, Testing Library (React 16, jest-dom 6) |
| **Linting** | ESLint 9.32, TypeScript ESLint |

---

## Project Structure

```
ethical-insight-pro/
├── docs/                           # Extended documentation
│   └── README.md                   # Detailed project documentation
├── public/                         # Static assets
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Landing & page header variants
│   │   │   └── Footer.tsx          # Copyright & privacy footer
│   │   ├── results/
│   │   │   ├── ResultsHeader.tsx   # Composite score & case metadata
│   │   │   ├── ConflictAlert.tsx   # Conflict level warning banner
│   │   │   ├── LensCard.tsx        # Individual lens score + reasoning
│   │   │   ├── LensRadarChart.tsx  # 6-axis radar visualization
│   │   │   ├── CodeImplications.tsx# Professional code analysis
│   │   │   ├── RecommendationsSection.tsx # Observations & reflections
│   │   │   ├── WarningFlags.tsx    # Violation warning display
│   │   │   └── ResultsFooterActions.tsx  # Print/PDF & navigation
│   │   ├── ui/                     # shadcn/ui component library
│   │   └── NavLink.tsx             # Navigation link component
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication state management
│   ├── hooks/
│   │   ├── use-mobile.tsx          # Responsive breakpoint hook
│   │   └── use-toast.ts           # Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts           # Supabase client initialization
│   │       └── types.ts            # Generated database type definitions
│   ├── lib/
│   │   └── utils.ts                # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx               # Landing page
│   │   ├── Verify.tsx              # Textbook verification gate
│   │   ├── Register.tsx            # User registration
│   │   ├── Login.tsx               # User login
│   │   ├── ForgotPassword.tsx      # Password recovery request
│   │   ├── ResetPassword.tsx       # Password reset form
│   │   ├── CaseIntake.tsx          # Ethics case submission form
│   │   ├── Results.tsx             # Analysis results dashboard
│   │   ├── Admin.tsx               # Admin management dashboard
│   │   ├── About.tsx               # About & attribution page
│   │   └── NotFound.tsx            # 404 page
│   ├── services/
│   │   ├── aiAnalysis.ts           # AI analysis service & types
│   │   └── database.ts             # Database CRUD operations
│   ├── test/                       # Test utilities & setup
│   ├── App.tsx                     # Root component & routing
│   ├── App.css                     # Application styles
│   ├── index.css                   # Global styles & CSS variables
│   └── main.tsx                    # Application entry point
├── supabase/
│   ├── functions/
│   │   └── analyze-case/
│   │       └── index.ts            # Deno Edge Function (AI + Guardrails)
│   ├── migrations/                 # SQL migration files (6 migrations)
│   └── config.toml                 # Supabase project configuration
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- A **Supabase** project with Auth, Database, and Edge Functions enabled
- A **Google Gemini API key** (for the AI analysis edge function)

### Installation

```bash
# Clone the repository
git clone https://github.com/the-ai-entrepreneur-ai-hub/ethical-insight-pro.git

# Navigate to the project directory
cd ethical-insight-pro

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Available Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## Environment Variables

| Variable | Description |
|:---------|:------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `GEMINI_API_KEY` | Google Gemini API key (Edge Function secret) |

---

## Professional Codes of Conduct

The platform evaluates cases against four recognized OHS professional codes:

```mermaid
graph TB
    subgraph CODES["Professional Codes of Conduct"]
        BCSP["BCSP / ASSP<br/>Board of Certified Safety<br/>Professionals / American<br/>Society of Safety Professionals"]
        AIHA["AIHA / ABIH<br/>American Industrial Hygiene<br/>Association / American Board<br/>of Industrial Hygiene"]
        AAOHN["AAOHN<br/>American Association of<br/>Occupational Health Nurses"]
        ACOEM["ACOEM<br/>American College of<br/>Occupational and<br/>Environmental Medicine"]
    end

    BCSP --- CENTER["Ethics Case<br/>Analysis"]
    AIHA --- CENTER
    AAOHN --- CENTER
    ACOEM --- CENTER

    style CODES fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style BCSP fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style AIHA fill:#1e293b,stroke:#8b5cf6,color:#e2e8f0
    style AAOHN fill:#1e293b,stroke:#10b981,color:#e2e8f0
    style ACOEM fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style CENTER fill:#1e293b,stroke:#ef4444,color:#e2e8f0
```

---

## Six Ethical Lenses

Each case is evaluated through six distinct ethical frameworks:

```mermaid
graph TB
    subgraph LENSES["Six Ethical Lenses"]
        direction TB
        UT["Utilitarian<br/>Greatest good for the<br/>greatest number"]
        DE["Deontological<br/>Duty-based moral<br/>obligations"]
        JU["Justice<br/>Fair distribution of<br/>benefits and burdens"]
        VI["Virtue<br/>Character-based<br/>moral excellence"]
        CA["Care<br/>Relationship-centered<br/>ethical responsibility"]
        CG["Common Good<br/>Shared conditions<br/>benefiting all"]
    end

    UT --- SCORE["Composite<br/>Analysis<br/>Score"]
    DE --- SCORE
    JU --- SCORE
    VI --- SCORE
    CA --- SCORE
    CG --- SCORE

    style LENSES fill:#0f172a,stroke:#8b5cf6,color:#e2e8f0
    style UT fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style DE fill:#1e293b,stroke:#8b5cf6,color:#e2e8f0
    style JU fill:#1e293b,stroke:#10b981,color:#e2e8f0
    style VI fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style CA fill:#1e293b,stroke:#ef4444,color:#e2e8f0
    style CG fill:#1e293b,stroke:#06b6d4,color:#e2e8f0
    style SCORE fill:#1e293b,stroke:#a855f7,color:#e2e8f0
```

Users rate each lens (1-10) based on their professional assessment. These scores feed directly into the deterministic Algorithm v2.0 -- the AI never modifies or overrides user-provided lens scores.

---

## Security & Privacy

| Concern | Safeguard |
|:--------|:----------|
| **Data Access** | Row Level Security (RLS) on all database tables |
| **Authentication** | Supabase Auth with email confirmation and session management |
| **Admin Isolation** | `has_role()` SECURITY DEFINER function for admin-only operations |
| **AI Score Integrity** | Deterministic guardrails prevent AI from generating or altering numeric scores |
| **Textbook Access Gate** | Verification question must be answered before registration |
| **Consent** | Dual consent checkboxes required before case submission |
| **No Confidential Data** | Users explicitly confirm no confidential information is included |
| **Non-Prescriptive Output** | AI is constrained to analytical language -- never "should", "must", or "recommended" |
| **Usage Limits** | Configurable per-user analysis caps (default: 5) prevent abuse |

---

## License

This project is a companion application for *"Ethical Decision-making in Occupational and Environmental Health and Safety: A Comparative Case Study Approach"* (copyright 2026, John Wiley & Sons). All rights reserved.

---

<p align="center">
  <strong>Ethical Insight Pro</strong> -- Structured ethical analysis for OHS professionals
</p>
