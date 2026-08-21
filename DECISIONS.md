# Architecture Decisions — Campus Academic Hub

## 1. Stack Selection
- **Frontend**: React 19 + TypeScript + Vite with Tailwind CSS v4, Motion for subtle transitions, and Lucide React icons.
- **Backend**: Node.js / Express TypeScript server (`server.ts`), integrated with Vite middleware for dev mode and bundled via `esbuild` for production.
- **Data Persistence**: In-memory relational schema engine with local snapshot persistence. Fully structured around the Section 3 entities, ensuring ACID-like invariants, uniqueness constraints (USN, Teacher Code), and foreign key relations.
- **Authentication & Authorization**: Server-enforced Bearer Token / Session authentication with strict Role-Based Access Control (Admin, Teacher, Student) and ownership validation on all mutations.
- **AI Timetable Extraction**: Hybrid extraction pipeline — utilizing Google Gemini API (`gemini-3.7-flash` via `@google/genai`) with fallback to robust regex/tabular parser, specifically restricted to extracting only `Semester`, `Subject`, `Subject Code`, and `Teacher`.
- **In-App Notifications**: Real-time event-driven notifications generated on attendance submission, assignment creation, test marks publication, and targeted notices.

## 2. Design System Alignment
- **Palette**:
  - Primary Navy: `#13284A`
  - Action Blue: `#2E6FB0`
  - Sky Accent: `#5B93D1`
  - Amber / AI Accent: `#E0982A`
  - Success Green: `#1E8E5A`
  - Danger Red: `#C0392B`
  - Canvas Background: `#F3F6FB`
  - Card Surface: `#FFFFFF`
  - Border: `#DCE3ED`
  - Muted Text: `#667085`
- **Typography**: Serif display headings paired with high-legibility sans-serif UI typography.
- **UI Architecture**: Standard SaaS navigation layout with top bar, role-based side navigation, status pill tags, metric cards, and responsive data tables.

## 3. Strict Boundary Enforcements
1. Students are strictly read-only: all mutating routes explicitly reject student tokens with 403 Forbidden.
2. Teachers can only manage subjects/semesters assigned to them by Admin.
3. Attendance is immutable once submitted: server prevents post-submission updates.
4. Assignments contain NO grade/marks field (strictly tracks `Submitted` / `Not Submitted`).
5. Test marks are visible to students only when explicitly marked as `published = true` by the teacher.
6. Admin has complete visibility and auditing over users, semesters, and reports.
