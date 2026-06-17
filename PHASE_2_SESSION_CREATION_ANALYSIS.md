# PHASE 2: CREATE SESSION FIX - ANALYSIS

Date: 2026-06-17 | Status: IN PROGRESS

---

## 📡 REQUEST/RESPONSE TRACING

### What Frontend Sends
**Endpoint**: `POST /teacher/attendance/sessions`  
**Source**: TeacherAttendance.jsx Line 683

```javascript
const form = {
  class_id: 1,           // Selected class ID
  subject_id: 5,         // Selected subject ID
  date: "2026-06-17",    // Date string (YYYY-MM-DD)
  start_time: "07:00",   // Time string (HH:ii)
  end_time: "08:30",     // Time string (HH:ii)
  location: ""           // Optional room/location
};

createSession.mutate(form);  // Sends as JSON POST body
```

---

### What Controller Expects
**Method**: `AttendanceController::createSession()` (Line 84-152)

**Validation Rules** (Line 89-107):
```php
'class_id' => 'required|exists:classes,id',
'subject_id' => 'required|exists:subjects,id',
'date' => 'required|date|after_or_equal:today',
'start_time' => 'required|date_format:H:i',      // ← HH:i format
'end_time' => 'required|date_format:H:i|after:start_time',
'duration_minutes' => 'sometimes|integer|min:1|max:240',  // ← Optional
'location' => 'nullable|string|max:255',
// ... other optional fields
```

**Critical Observation**:
- Frontend sends `date`, `start_time`, `end_time` ✓
- Controller validates them ✓
- BUT service might not use them correctly

---

### What Service Does
**Method**: `AttendanceService::createSession()` (Line 792-841 in audit report)

**Current Logic** (from audit):
```php
$duration = $data['duration_minutes'] ?? config('app.attendance_code_duration_minutes', 10);
```

**Problem**: Service uses `duration_minutes` from config, NOT calculated from start_time/end_time!

**Service receives**:
```php
$data = [
    'class_id' => 1,
    'subject_id' => 5,
    'date' => '2026-06-17',      // ← Not used by service
    'start_time' => '07:00',      // ← Not used by service
    'end_time' => '08:30',        // ← Not used by service
    'duration_minutes' => null,   // ← Uses config default (10 min) instead!
    'location' => '',
    // ... other fields
];
```

**Creates session with**:
```php
'code' => $code,
'valid_from' => now(),
'valid_until' => now()->addMinutes(10),  // ← DEFAULT 10 MINUTES!
// NOT the time between start_time and end_time
```

---

## 🚨 IDENTIFIED BUGS IN PHASE 2

### Bug #1: Duration Not Calculated from Time Window
**Severity**: 🔴 CRITICAL  
**Location**: `AttendanceService::createSession()` line 796

**Current Code**:
```php
$duration = $data['duration_minutes'] ?? config('app.attendance_code_duration_minutes', 10);
```

**Problem**: Ignores `start_time` and `end_time`, uses hardcoded 10 minutes  

**Expected**: Calculate minutes between start_time and end_time

**Impact**: 
- Teacher creates session for 07:00-08:30 (90 minutes)
- Session actually only valid for 10 minutes
- Students get kicked out when trying to submit attendance after 10 minutes

**Fix**: See Patch below

---

### Bug #2: Date Field Not Used
**Severity**: 🟠 HIGH  
**Location**: `AttendanceService::createSession()`

**Current Code**:
```php
'valid_from' => now(),
'valid_until' => now()->addMinutes($duration),
```

**Problem**: Uses current time, ignores the `date` field

**Expected**: Should create session for the specified date

**Impact**: Teacher can't create session for future date; session always starts immediately

**Fix**: See Patch below

---

### Bug #3: No Teacher/Class Access Validation
**Severity**: 🔴 CRITICAL  
**Location**: `AttendanceService::createSession()`

**Current Code**: No validation that teacher teaches this class

**Problem**: Teacher can create attendance session for classes they don't teach

**Expected**: Verify teacher has access via Schedule or ClassUser

**Impact**: Security issue - any teacher can create sessions for any class

**Fix**: See Patch below

---

### Bug #4: No Subject-Class Validation
**Severity**: 🟠 HIGH  
**Location**: `AttendanceService::createSession()`

**Current Code**: Doesn't verify subject is taught in class

**Problem**: Teacher can mix subjects with classes arbitrarily

**Expected**: Subject must be in class schedule

**Impact**: Wrong subject recorded for attendance

**Fix**: See Patch below

---

## 📊 VALIDATION FLOW ANALYSIS

```
Frontend Form
    ↓
    class_id=1, subject_id=5, date='2026-06-17', start_time='07:00', end_time='08:30'
    ↓
Controller Validation (Line 89-107)
    ├─ class_id: required|exists:classes,id  ✓ CHECK passes if class exists
    ├─ subject_id: required|exists:subjects,id  ✓ CHECK passes if subject exists
    ├─ date: required|date|after_or_equal:today  ✓ CHECK passes if valid date
    ├─ start_time: required|date_format:H:i  ✓ CHECK passes if valid time
    └─ end_time: required|date_format:H:i|after:start_time  ✓ CHECK passes if valid
    ↓
Controller passes $validated to Service (Line 109)
    ↓
Service::createSession()
    ├─ ❌ NO teacher/class access verification
    ├─ ❌ NO subject-class relationship check
    ├─ ❌ NO calculation of duration from start_time/end_time
    ├─ ❌ NO use of date field
    ├─ ❌ Uses hardcoded duration from config (10 minutes)
    ├─ ❌ Uses now() for valid_from (not the provided date/time)
    └─ ✓ Creates session with wrong time window
    ↓
Returns to Controller
    ├─ success: true
    └─ data: { code, valid_until: 10 minutes from NOW }
    ↓
Frontend receives 201
    └─ ✅ Shows QR code, but...
    └─ ⏰ Session expires in 10 minutes instead of 90!
```

---

## 🔍 POTENTIAL ERROR SCENARIOS

### Scenario 1: Missing Required Field
**Request**:
```json
{
  "class_id": 1,
  "subject_id": 5,
  "date": "2026-06-17"
  // Missing start_time and end_time
}
```

**Response**: 422 Unprocessable Entity
```json
{
  "status": "error",
  "message": "Validasi gagal.",
  "code": "VALIDATION_ERROR",
  "errors": {
    "start_time": ["The start_time field is required."],
    "end_time": ["The end_time field is required."]
  }
}
```

---

### Scenario 2: Invalid Date Format
**Request**:
```json
{
  "class_id": 1,
  "subject_id": 5,
  "date": "17-06-2026",  // ← Wrong format (should be YYYY-MM-DD)
  "start_time": "07:00",
  "end_time": "08:30"
}
```

**Response**: 422 Unprocessable Entity
```json
{
  "errors": {
    "date": ["The date field must be a valid date."]
  }
}
```

---

### Scenario 3: End Time Not After Start Time
**Request**:
```json
{
  "class_id": 1,
  "subject_id": 5,
  "date": "2026-06-17",
  "start_time": "08:30",
  "end_time": "07:00"  // ← Before start time!
}
```

**Response**: 422 Unprocessable Entity
```json
{
  "errors": {
    "end_time": ["The end_time field must be after start_time."]
  }
}
```

---

### Scenario 4: Class Doesn't Exist
**Request**:
```json
{
  "class_id": 9999,  // ← Non-existent class
  "subject_id": 5,
  "date": "2026-06-17",
  "start_time": "07:00",
  "end_time": "08:30"
}
```

**Response**: 422 Unprocessable Entity
```json
{
  "errors": {
    "class_id": ["The selected class_id is invalid."]
  }
}
```

---

### Scenario 5: Teacher Has No Access to Class
**Request**: (Valid data, but teacher doesn't teach this class)

**Current Response**: ✅ 201 Created (BUG - should be 403!)

**Should Return**: 403 Forbidden
```json
{
  "status": "error",
  "message": "Anda tidak memiliki akses ke kelas ini.",
  "code": "FORBIDDEN"
}
```

---

## ✅ WHAT CURRENTLY WORKS

1. ✓ Validation of required fields
2. ✓ Format checking (date, time)
3. ✓ Database existence checks (class, subject)
4. ✓ Time logic (end > start)
5. ✓ Session creation in database
6. ✓ Code generation

---

## ❌ WHAT DOESN'T WORK

1. ❌ Duration calculation from time window
2. ❌ Using provided date instead of now()
3. ❌ Teacher access verification
4. ❌ Subject-class relationship validation
5. ❌ Manual session support (no is_manual field)
6. ❌ QR code generation
7. ❌ Proper error handling for edge cases

---

## 📋 ISSUES FOUND IN PHASE 2

| Issue | Severity | File | Line | Fix |
|-------|----------|------|------|-----|
| Duration not calculated | 🔴 CRITICAL | AttendanceService.php | 796 | Calculate from start_time/end_time |
| Date field ignored | 🟠 HIGH | AttendanceService.php | 801-803 | Use provided date |
| No teacher access check | 🔴 CRITICAL | AttendanceService.php | 792+ | Add verification |
| No subject-class validation | 🟠 HIGH | AttendanceService.php | 792+ | Add relationship check |
| No manual session support | 🔴 CRITICAL | AttendanceSession model | N/A | Add is_manual field |

---

## 🔧 REQUIRED FIXES

Will be provided in patches:
1. **Service Fix**: Calculate duration properly
2. **Service Fix**: Use provided date/time
3. **Service Fix**: Add security checks
4. **Migration**: Add is_manual field
5. **Model**: Update fillable array
6. **Service**: Add manual session logic

---

## 📊 PHASE 2 STATUS: IN PROGRESS

Next: Create detailed patches for all identified issues.
