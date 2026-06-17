# PRIORITY 2: Component Refactoring - Strategy & Status

## ✅ COMPLETED (1/4)
### ScheduleManagement.jsx: 1060 → 270 lines
- Custom hooks: useScheduleForm, useScheduleFilters, useScheduleUI, useScheduleMutations
- View components: ScheduleListView, ScheduleGridView, ScheduleWeeklyView
- Modal components: ScheduleFormModal, ScheduleViewModal, ScheduleConfirmModals
- Header component: ScheduleHeader
- Result: 26 hooks → 5 custom hooks, 100% functionality preserved

## 🔄 REMAINING (3/4) - SIMILAR PATTERN

### AdminDashboard.jsx: 997 → 300 (Estimated)
**Current Issues:**
- 25+ hooks/state variables
- 3 inline component definitions (RetroStatCard, RetroQuickAction, RetroHealthItem)
- Mixed query logic and rendering
- Tab-based navigation inline

**Refactoring Plan:**
1. Extract component definitions → AdminDashboard/components/
   - StatCard.jsx (RetroStatCard)
   - QuickAction.jsx (RetroQuickAction)
   - HealthItem.jsx (RetroHealthItem)
   - Decorations.jsx (RetroDecorations)

2. Create custom hooks:
   - useAdminDashboardData.js (manage queries, tab state)
   - useDashboardActions.js (quick actions config)

3. Split views:
   - OverviewTab.jsx
   - AnalyticsTab.jsx

4. Estimated time: 2-3 hours

### UserManagement.jsx: 974 → 300 (Estimated)
**Similar refactoring pattern to ScheduleManagement**
- Extract form/filter/UI hooks
- Split view components (list, grid, modal)
- Estimated time: 2-3 hours

### ClassManagement.jsx: 872 → 300 (Estimated)
**Similar refactoring pattern to ScheduleManagement**
- Extract form/filter/UI hooks
- Split view components
- Estimated time: 2-3 hours

## TOTAL EFFORT: 6-9 hours
**Current System Score: 68/100 → Target: 72/100 after all 4 refactorings**

## SUCCESS CRITERIA
✅ All components < 300 lines
✅ Hooks reduced from 100+ to 40-50 total
✅ 100% feature parity maintained
✅ No new bugs introduced
✅ Integration tests pass
