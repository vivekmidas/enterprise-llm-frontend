# Quick Reference Card

## Key Routes

```
PARA-LEGAL:
/dashboard/search        → Main case search (3-pane layout)
/dashboard/audit-logs    → Personal audit trail

ADMIN:
/admin/cases-db         → Case management hub
  - Cases tab: View/edit cases
  - Import tab: Bulk case upload
  - Audit tab: Full system audit logs
```

---

## Core Components to Understand

```
SearchInterface.tsx      ← Start here! Main layout coordinator
├── FilterPanel.tsx      ← Left: Filters + saved queries
├── SearchBar.tsx        ← Top: Search input + mode toggle
├── CaseList.tsx         ← Middle: Results with pagination
└── CaseDetails.tsx      ← Right: Full case display
    ├── SaveQueryModal.tsx   ← Save search dialog
    ├── ExportModal.tsx      ← Export format picker
    └── SavedQueriesPanel.tsx ← Quick access panel
```

---

## State Management

```typescript
import { useSearchStore } from '@/lib/stores/searchStore';

// Use anywhere in component:
const { 
  searchText,           // Current search
  filters,              // Active filters
  selectedCase,         // Currently viewed case
  setSearchText,        // Update search
  setFilters,           // Update filters
  setSelectedCase,      // Select case
} = useSearchStore();
```

---

## API Functions Quick Start

```typescript
import { 
  searchCases,          // Search with filters
  getSavedQueries,      // Get user's saved queries
  saveQuery,            // Save a new query
  exportCases,          // Export to PDF/CSV/JSON
  getAuditLogs,         // Get audit logs
  updateCase,           // Update case (admin)
} from '@/lib/api/cases';

// Example: Search
const results = await searchCases({
  text: 'contract dispute',
  mode: 'semantic',  // 'traditional' | 'semantic' | 'both'
  filters: { judges: ['Smith'] }
}, page=1, limit=10);
```

---

## Common Code Patterns

### Make API Call with Error Handling
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchCases({...});
      // use data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, [dependencies]);
```

### Collapsible Section
```typescript
const [isExpanded, setIsExpanded] = useState(false);

<button onClick={() => setIsExpanded(!isExpanded)}>
  <ChevronDown className={isExpanded ? '' : '-rotate-90'} />
  {title}
</button>

{isExpanded && (
  <div className="px-4 py-2 bg-gray-50">
    {/* content */}
  </div>
)}
```

### Modal Pattern
```typescript
const [isOpen, setIsOpen] = useState(false);

{isOpen && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div className="bg-white rounded-lg shadow-xl max-w-md">
      {/* modal content */}
    </div>
  </div>
)}
```

---

## Backend API Endpoints

```
SEARCH
POST /api/cases/search
Body: { query, mode, filters, pagination }

CASES
GET  /api/cases                    ← List all
GET  /api/cases/:id                ← Get one
PUT  /api/cases/:id                ← Update
GET  /api/cases/filters/options    ← Filter values

QUERIES
GET    /api/queries                ← Get saved
POST   /api/queries                ← Save new
DELETE /api/queries/:id            ← Delete

AUDIT
GET  /api/audit/logs               ← Get logs
POST /api/audit/logs               ← Create log

EXPORT
POST /api/cases/export             ← Download file
```

---

## Tailwind Patterns Used

```
LAYOUT:
flex, items-center, justify-between, gap-4
grid grid-cols-3, gap-4

SPACING:
p-4, px-3, py-2, mt-2, mb-4, gap-2

COLORS:
bg-blue-600, text-blue-700, border-blue-200
bg-red-50, text-red-700
bg-gray-100, text-gray-900

TEXT:
text-sm, font-medium, text-center, truncate
line-clamp-2, leading-relaxed

STATES:
hover:bg-gray-50, disabled:opacity-50
focus:outline-none, focus:ring-2
transition, duration-300
```

---

## Type Imports

```typescript
import type { 
  Case,           // Single case
  SearchQuery,    // Search params
  SearchResult,   // Search response
  SavedQuery,     // Saved search
  AuditLog,       // Audit entry
  CaseFilter,     // Filter options
} from '@/lib/types/case';
```

---

## Debug Tips

```typescript
// Log to console (look for [v0] prefix)
console.log('[v0] Current state:', useSearchStore.getState());

// Check API calls
// DevTools → Network tab → filter "api"

// Check store
// Browser console: useSearchStore.getState()

// Profile component renders
import { Profiler } from 'react';
<Profiler id="ComponentName" onRender={console.log}>
  <YourComponent />
</Profiler>
```

---

## File Location Guide

```
app/
  dashboard/
    search/
      page.tsx              ← Route: /dashboard/search
      components/           ← Search UI components
    audit-logs/
      page.tsx              ← Route: /dashboard/audit-logs
      components/           ← Audit UI components
  
  admin/
    cases-db/
      page.tsx              ← Route: /admin/cases-db
      components/           ← Admin UI components
  
  api/
    cases/
      search/route.ts       ← POST /api/cases/search
      export/route.ts       ← POST /api/cases/export
      filters/options/route.ts ← GET filters
    queries/
      route.ts              ← GET/POST /api/queries
    audit/
      logs/route.ts         ← GET/POST /api/audit/logs

lib/
  api/
    client.ts               ← Axios setup
    cases.ts                ← API functions
  types/
    case.ts                 ← TypeScript types
  stores/
    searchStore.ts          ← Zustand store

components/
  Badge.tsx                 ← Reusable badge
```

---

## Useful Libraries

```
react: UI framework
next: Framework
zustand: State management (lib/stores/searchStore.ts)
axios: HTTP client (lib/api/client.ts)
date-fns: Date formatting
lucide-react: Icons
tailwind: Styling
typescript: Type safety
```

---

## Testing Workflow

```
1. Start dev server:    npm run dev
2. Open browser:        http://localhost:3000
3. Navigate to:         /dashboard/search (para-legal)
                        or /admin/cases-db (admin)
4. Open DevTools:       F12
5. Check Console:       [v0] logs
6. Check Network:       API calls in /api/*
7. Test features:       Use testing checklist
```

---

## Deployment Checklist

```
- [ ] Backend API endpoints implemented
- [ ] Environment variables set (BACKEND_URL)
- [ ] Database migrations run
- [ ] Authentication configured
- [ ] Audit logging enabled
- [ ] Error tracking setup (optional)
- [ ] npm run build succeeds
- [ ] Test all routes work
- [ ] Verify API proxy routes work
- [ ] Test all 3 user flows:
        1. Para-legal search
        2. Para-legal audit
        3. Admin management
```

---

## Common Fixes

**Search not working?**
→ Check BACKEND_URL env var
→ Check backend /api/cases/search endpoint

**Filters not loading?**
→ Verify /api/cases/filters/options endpoint
→ Check browser console for errors

**Export button broken?**
→ Verify /api/cases/export endpoint
→ Check CORS headers

**Audit logs empty?**
→ Verify /api/audit/logs endpoint
→ Check backend is logging actions

**TypeScript errors?**
→ Check lib/types/case.ts exports
→ Verify import paths use @/

---

## Architecture at a Glance

```
USER
  ↓
COMPONENT (React)
  ↓
ZUSTAND STORE (state)
  ↓
API CLIENT (lib/api/cases.ts)
  ↓
API ROUTE (app/api/*/route.ts)
  ↓
BACKEND API
  ↓
DATABASE
```

---

## Key Design Decisions

1. **3-Pane Layout**: Familiar from legal databases
2. **Zustand**: Lightweight state management
3. **Proxy Routes**: Centralize auth & logging
4. **TypeScript**: Full type safety
5. **Tailwind**: Consistent styling
6. **Role-Based Routes**: Para-legal vs Admin UI

---

## Performance Tips

- Use React Query caching (already configured)
- Pagination for large lists
- Debounce search input (in SearchBar)
- Lazy load modals (only render when open)
- Avoid unnecessary re-renders with useCallback

---

## Next Steps

1. **Implement Backend**: Follow API spec
2. **Test Integration**: Verify all endpoints
3. **Deploy**: Follow deployment checklist
4. **Gather Feedback**: From para-legal team
5. **Enhance**: Add features from PARALEGAL_UX_ENHANCEMENTS.md

---

## Help & Documentation

- `GETTING_STARTED.md` - Full setup guide
- `CASE_MANAGEMENT_IMPLEMENTATION.md` - Technical spec
- `PARALEGAL_UX_ENHANCEMENTS.md` - Feature roadmap
- `BUILD_SUMMARY.md` - What was built
- Component files have inline comments
- Type definitions in lib/types/case.ts

---

**Good luck! 🚀**

