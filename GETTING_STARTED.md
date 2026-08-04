# Case Management System - Getting Started

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
# .env.local
BACKEND_URL=http://localhost:3001  # Your backend API URL
```

### 3. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app running.

---

## Key Routes

### Para-Legal User
- **`/dashboard/search`** - Main case search interface with 3-pane layout
  - Search, filter, and manage cases
  - Save and reuse searches
  - Export and print cases
  
- **`/dashboard/audit-logs`** - Personal audit trail
  - View all your searches, exports, and actions
  - Filter by action type and date range

### Admin User
- **`/admin/cases-db`** - Case database management
  - **Cases Tab**: Edit case details, view/correct extracted fields
  - **Import Tab**: Upload and process bulk case files
  - **Audit & Activity Tab**: Full system audit logs with statistics

---

## Architecture Overview

```
Frontend (Next.js)
    ↓
API Routes (/app/api) [Proxy to Backend]
    ↓
Backend REST API (/api/cases, /api/queries, /api/audit/logs)
    ↓
Database (cases, queries, audit_logs tables)
```

---

## State Management with Zustand

The search interface uses Zustand for client-side state:

```typescript
import { useSearchStore } from '@/lib/stores/searchStore';

// In component:
const { 
  searchText,      // Current search input
  filters,         // Active filters (judges, courts, etc.)
  selectedCase,    // Currently selected case
  savedQueries,    // User's saved queries
  setSearchText,   // Update search
  setFilters,      // Update filters
  setSelectedCase, // Select a case
} = useSearchStore();
```

---

## API Client Usage

```typescript
import { searchCases, getSavedQueries, exportCases } from '@/lib/api/cases';

// Search cases
const result = await searchCases(
  { text: 'contract dispute', mode: 'semantic', filters: {} },
  page = 1,
  limit = 10
);

// Get saved queries
const queries = await getSavedQueries(isPublic = false);

// Export cases
const blob = await exportCases(
  ['case_id_1', 'case_id_2'],
  'pdf',
  queryContext
);
```

---

## Components Overview

### SearchInterface.tsx
Main layout component that orchestrates the 3-pane interface.

### FilterPanel.tsx
Left panel with collapsible filter sections and saved queries access.

### SearchBar.tsx
Top search bar with mode toggle (Traditional/Semantic/Both).

### CaseList.tsx
Middle panel showing paginated case results.

### CaseDetails.tsx
Right panel showing full case information, export, and audit options.

### SaveQueryModal.tsx
Modal for naming and saving current search.

### ExportModal.tsx
Modal for selecting export format (PDF/CSV/JSON).

---

## Adding New Filter Types

1. Add to backend `/api/cases/filters/options` response
2. Update `CaseFilter` interface in `/lib/types/case.ts`
3. Add new `FilterSection` in `FilterPanel.tsx`:

```typescript
<FilterSection title="New Filter" section="newFilterKey" />
```

---

## Handling Search Actions

Search results trigger automatic audit logging through the backend:

```typescript
// When user searches:
1. Frontend calls POST /api/cases/search
2. Backend processes search and returns results
3. Backend automatically logs to audit table
4. Frontend displays results
```

---

## Export Workflow

```typescript
// User clicks Export → ExportModal opens → Select format
1. User selects PDF/CSV/JSON
2. Frontend calls POST /api/cases/export
3. Backend generates file
4. File downloads automatically
5. Audit log created (via backend)
```

---

## Adding Print Support

Print is handled by browser's native print dialog:

```typescript
// In CaseDetails.tsx:
const handlePrint = () => {
  window.print();
};
```

Browser automatically:
- Shows print preview
- Allows PDF saving
- Triggers audit log (via backend tracking beforeprint event)

---

## Admin Dashboard Features

### Viewing Cases
```typescript
const result = await getAllCases(page = 1, limit = 50);
```

### Editing a Case
```typescript
const updated = await updateCase(caseId, {
  judge: 'New Judge',
  status: 'closed',
  // ... other fields
});
```

### Bulk Import
- Upload PDF/TXT/JSON files
- Backend extracts case data using LLM
- Admin reviews and corrects extraction
- Publishes to searchable database

---

## Common Tasks

### Create a New Saved Query
```typescript
const saved = await saveQuery({
  name: 'My Search',
  description: 'Cases about contracts',
  query_text: 'contract disputes',
  filters: { judges: ['Judge Smith'] },
  search_mode: 'semantic',
  is_public: false,
  tags: ['contracts', 'disputes']
});
```

### Get User's Audit Trail
```typescript
const logs = await getAuditLogs({
  // Optional filters
  action: 'SEARCH',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31'
});
```

### Export Audit Report
Visit `/admin/cases-db` → Audit & Activity tab → Export Report

---

## Styling & Design System

- **Colors**: Blue (#0066FF) for primary, Gray for neutral
- **Spacing**: Tailwind spacing scale (px-4, py-2, gap-4, etc.)
- **Components**: Reusable Badge, custom modal components
- **Icons**: Lucide React for consistent iconography
- **Responsive**: Mobile-first, optimized for desktop legal workflows

---

## Debugging

### Enable Debug Logs
Check browser console for `[v0]` prefixed messages:
```typescript
console.log('[v0] Search results:', results);
console.log('[v0] Filter state:', filterState);
```

### Check API Calls
1. Open DevTools Network tab
2. Look for calls to `/api/*` endpoints
3. Verify response status and data

### Zustand DevTools
Zustand store can be inspected in browser console:
```javascript
// Get current state
console.log(useSearchStore.getState());
```

---

## Backend API Requirements

Ensure backend provides these endpoints:

```
POST   /api/cases/search
GET    /api/cases
GET    /api/cases/:id
PUT    /api/cases/:id
GET    /api/cases/filters/options
POST   /api/cases/export
POST   /api/cases/import
GET    /api/cases/import/:jobId

GET    /api/queries
POST   /api/queries
DELETE /api/queries/:id

GET    /api/audit/logs
POST   /api/audit/logs
```

---

## Performance Tips

1. **Search Debouncing**: Frontend debounces search input (consider adding)
2. **Pagination**: Use `limit` and `page` parameters
3. **Caching**: React Query can cache search results (enabled in Providers)
4. **Virtual Scrolling**: For large case lists (future enhancement)

---

## Security Notes

- All API calls include user context via headers
- Backend validates user role before returning data
- Export includes query context for audit trail
- Sensitive data (full text) streamed directly from backend

---

## Next Steps

1. **Implement Backend**: Create REST API endpoints matching spec above
2. **Database Schema**: Create `cases`, `queries`, `audit_logs` tables
3. **Authentication**: Add session/JWT validation
4. **Testing**: Add unit and integration tests
5. **Deployment**: Deploy to Vercel or your infrastructure

---

## Support

For issues or questions, check:
- `CASE_MANAGEMENT_IMPLEMENTATION.md` - Full technical documentation
- Console logs with `[v0]` prefix - Debug information
- Backend API logs - Server-side errors

