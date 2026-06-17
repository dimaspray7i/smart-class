# PRIORITY 4: Error Handling Implementation Guide

## Completed ✅

1. **Error Boundary Component** (`ErrorBoundary.jsx`)
   - Catches React component errors
   - Shows user-friendly error UI
   - Dev mode shows detailed error info
   - Auto-recovery button

2. **Error Handler Utilities** (`errorHandler.js`)
   - `AppError` class for consistent errors
   - `ErrorCodes` enum for error classification
   - `handleApiError()` - distinguishes error types (401, 403, 404, 409, 500, network)
   - `createErrorToast()` - converts errors to toast notifications
   - Contextual error messages in Indonesian

## Integration Pattern (Apply to all mutations)

```javascript
// In mutations callbacks:
onError: (err) => {
  const errorToast = createErrorToast(err, 'ScheduleManagement');
  ui.showToast(errorToast.message, errorToast.type);
  form.setErrors(err.response?.data?.errors || {});
}
```

## Error Handling Best Practices

### 1. API Call Errors
```javascript
try {
  const res = await adminAPI.getSchedules(...);
  setSchedules(res.data);
} catch (err) {
  const errorToast = createErrorToast(err, 'loadSchedules');
  ui.showToast(errorToast.message, 'error');
}
```

### 2. Form Validation Errors
- Server returns `errors` object in response
- Display field-specific errors via `form.setErrors()`
- Show general message via toast

### 3. Network Errors
- `isNetworkError()` detects connection issues
- Show user-friendly message: "Koneksi internet terputus"
- Provide retry button

### 4. Authorization Errors (401/403)
- 401: Session expired → suggest re-login
- 403: No permission → show forbidden message

## Component Integration Checklist

✅ ErrorBoundary wrapper (in App.jsx)
⚠️ Mutation error callbacks (8 mutation hooks)
⚠️ Async data loading try/catch (dependency loaders)
⚠️ Form submission error handling (4 components)
⚠️ API error differentiation (all hooks)

## Next: Apply to mutations hooks

- useScheduleMutations
- useUserAPI
- useClassMutations
- useDashboardData (query error handling)

Pattern: Import `createErrorToast`, use in all `onError` callbacks
