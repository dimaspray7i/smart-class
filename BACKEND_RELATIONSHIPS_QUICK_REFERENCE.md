# RPL-SMART: Model Relationships Quick Reference

## 🎯 Core Relationship Map

### Identity & Access Layer
```
USER (18 cols)
├─ 1:1 ─ PROFILE (13 cols)
│        └─ M:M ─ SUBJECT (via profile_subject)
├─ M:M ─ CLASS (via class_user)
│        ├─ M:M ─ SUBJECT (via class_subject)
│        └─ HasMany ─ SCHEDULE
├─ HasMany ─ ATTENDANCE (1 per day)
├─ HasMany ─ PERMISSION (as student)
├─ HasMany ─ PERMISSION (as teacher/approver)
├─ HasMany ─ SCHEDULE (as teacher)
├─ HasMany ─ DEVICE
└─ BelongsTo ─ PKL_LOCATION
```

### Academic Layer
```
CLASS (8 cols)
├─ HasMany ─ SCHEDULE
│           ├─ BelongsTo ─ SUBJECT
│           ├─ BelongsTo ─ USER (teacher)
│           └─ HasMany ─ ATTENDANCE_SESSION
├─ M:M ─ SUBJECT (via class_subject)
├─ M:M ─ USER (via class_user)
│        └─ HasMany ─ ATTENDANCE
└─ HasManyThrough ─ ATTENDANCE (indirect)

SUBJECT (9 cols)
├─ M:M ─ CLASS (via class_subject)
├─ M:M ─ PROFILE (via profile_subject)
├─ HasMany ─ SCHEDULE
├─ HasMany ─ ATTENDANCE_SESSION
└─ M:M ─ USER (via student_skills - Skill connection)
```

### Attendance Layer
```
ATTENDANCE (18 cols)
├─ BelongsTo ─ USER
├─ BelongsTo ─ PKL_LOCATION
└─ BelongsTo ─ ATTENDANCE_SESSION (via code_used field) ⚠️

ATTENDANCE_SESSION (17 cols)
├─ BelongsTo ─ CLASS
├─ BelongsTo ─ SCHEDULE
├─ BelongsTo ─ SUBJECT
├─ BelongsTo ─ USER (generated_by)
├─ BelongsTo ─ PKL_LOCATION (optional)
└─ HasMany ─ ATTENDANCE (implicit via code_used) ⚠️
```

### Skills & Competency Layer
```
SKILL (9 cols)
└─ M:M ─ USER (via student_skills)
           ├─ Level: 0-100
           ├─ hours_practiced
           ├─ evidence (JSON)
           └─ last_practiced_at

CAREER_PATH (8 cols)
├─ HasMany ─ SIMULATOR_STEP
└─ HasMany ─ SIMULATOR_SESSION
             └─ BelongsTo ─ USER
```

### Project Layer
```
PROJECT (12 cols)
├─ BelongsTo ─ USER
└─ HasMany ─ CODING_LOG
             └─ BelongsTo ─ USER
```

### Infrastructure Layer
```
PKL_LOCATION (16 cols) 🚨 INCOMPLETE RELATIONSHIP
├─ HasMany ─ ATTENDANCE
├─ HasMany ─ ATTENDANCE_SESSION
├─ HasMany ─ USER (missing relationship!) ⚠️
└─ BelongsTo ─ USER (approved_by)

DEVICE (8 cols)
└─ BelongsTo ─ USER

SETTINGS (4 cols)
└─ System-wide key-value store
```

---

## 📊 Relationship Summary by Type

### One-to-One (1:1) - 1 count
- USER ← → PROFILE

### One-to-Many (1:N) - 20+ count
- USER → ATTENDANCE (1 per day)
- USER → PERMISSION
- USER → SCHEDULE (teacher)
- USER → PROJECT
- USER → SIMULATOR_SESSION
- USER → DEVICE
- CLASS → SCHEDULE
- CLASS → ATTENDANCE (via HasManyThrough - indirect)
- SUBJECT → SCHEDULE
- SUBJECT → ATTENDANCE_SESSION
- PROJECT → CODING_LOG
- CAREER_PATH → SIMULATOR_STEP
- CAREER_PATH → SIMULATOR_SESSION
- SCHEDULE → ATTENDANCE_SESSION
- PKL_LOCATION → ATTENDANCE
- PKL_LOCATION → ATTENDANCE_SESSION
- PKL_LOCATION → USER (missing!)
- ATTENDANCE_SESSION → ATTENDANCE (implicit)

### Many-to-Many (M:M) - 5 count
- USER ← → CLASS (pivot: class_user)
- CLASS ← → SUBJECT (pivot: class_subject)
- PROFILE ← → SUBJECT (pivot: profile_subject - missing relationship!)
- USER ← → SKILL (pivot: student_skills)
- + Implicit: USER ← → SUBJECT (via Schedule)

### Many-to-Many Through (indirect)
- CLASS ← many ATTENDANCE through USER ← many ATTENDANCE

---

## 🔴 Critical Relationship Issues

### 1. INCOMPLETE: PKL_LOCATION → USER
**Current State:**
- ✅ User.pkl_location_id (FK to PklLocation)
- ✅ Attendance.pkl_location_id (FK to PklLocation)
- ❌ **MISSING:** PklLocation relationship to users

**Impact:**
- Cannot query: `$pklLocation->students()`
- Must use: `User::where('pkl_location_id', $id)->get()`
- Violates ORM conventions

**Fix:**
```php
// In PklLocation.php
public function students(): HasMany
{
    return $this->hasMany(User::class, 'pkl_location_id');
}
```

### 2. IMPLICIT: ATTENDANCE ← → ATTENDANCE_SESSION
**Current State:**
- `Attendance.code_used` (string) references `AttendanceSession.code`
- ❌ **No FK constraint**
- ❌ **No relationship method**

**Impact:**
- Cannot: `$attendance->session`
- Cannot: `$session->attendances()`
- High risk of data inconsistency
- N+1 queries when needed

**Fix:**
```php
// Attendance.php
public function session(): BelongsTo
{
    return $this->belongsTo(AttendanceSession::class, 'code_used', 'code');
}

// AttendanceSession.php
public function attendances(): HasMany
{
    return $this->hasMany(Attendance::class, 'code_used', 'code');
}
```

### 3. MISSING: PROFILE ← → SUBJECT Relationships
**Current State:**
- ✅ Pivot table `profile_subject` exists
- ❌ **No relationship methods in Profile**
- ❌ **No relationship methods in Subject**

**Impact:**
- Cannot: `$profile->subjects`
- Cannot: `$subject->profiles`
- Must use raw queries: `DB::table('profile_subject')`

**Fix:**
```php
// Profile.php
public function subjects(): BelongsToMany
{
    return $this->belongsToMany(Subject::class, 'profile_subject');
}

// Subject.php
public function profiles(): BelongsToMany
{
    return $this->belongsToMany(Profile::class, 'profile_subject');
}
```

### 4. INCOMPLETE: SUBJECT ← → ATTENDANCE_SESSION
**Current State:**
- `AttendanceSession.subject_id` (FK exists)
- `AttendanceSession.subject()` method exists ✅
- ❌ **Subject has no reverse relationship**

**Impact:**
- Cannot: `$subject->sessions()`
- Must query: `AttendanceSession::where('subject_id', $id)`

**Fix:**
```php
// Subject.php
public function sessions(): HasMany
{
    return $this->hasMany(AttendanceSession::class, 'subject_id');
}
```

### 5. INCOMPLETE: SCHEDULE ← → ATTENDANCE_SESSION
**Current State:**
- `AttendanceSession.schedule_id` (FK exists)
- `AttendanceSession.schedule()` method exists ✅
- ❌ **Schedule has no reverse relationship**

**Impact:**
- Cannot: `$schedule->sessions()`
- Must query: `AttendanceSession::where('schedule_id', $id)`

**Fix:**
```php
// Schedule.php
public function sessions(): HasMany
{
    return $this->hasMany(AttendanceSession::class, 'schedule_id');
}
```

---

## ⚡ Eager Loading Gaps

### Required for Performance

#### 1. Teacher Permission List
**Endpoint:** `GET /v1/teacher/permissions`
**Current Issue:** N+1 queries
```php
// ❌ CURRENT (causes 1 + 2N queries)
$permissions = Permission::paginate();

// ✅ FIXED
$permissions = Permission::with(['student:id,name', 'teacher:id,name'])
    ->paginate();
```

#### 2. Attendance History
**Endpoint:** `GET /v1/student/attendance/history`
**Current Issue:** Missing relationships
```php
// ❌ CURRENT (N+1 for user, N for pklLocation)
$attendances = Attendance::forUser($userId)->paginate();

// ✅ FIXED
$attendances = Attendance::with(['user', 'pklLocation'])
    ->forUser($userId)
    ->paginate();
```

#### 3. Class List (Admin)
**Endpoint:** `GET /v1/admin/classes`
**Current Issue:** Appended attributes cause N queries per class
```php
// ❌ CURRENT (each class: 3 extra queries for counts)
$classes = ClassModel::paginate(15);

// ✅ FIXED
$classes = ClassModel::with(['users', 'subjects'])
    ->withCount([
        'users as student_count' => fn($q) => 
            $q->where('role_in_class', 'siswa'),
        'subjects'
    ])
    ->paginate(15);
```

#### 4. Schedule Monitoring
**Endpoint:** `GET /v1/teacher/attendance/session/{id}/monitor`
**Current Issue:** Attendance without user data
```php
// ❌ CURRENT (N queries for user data)
$session = AttendanceSession::find($id);
// No attendances loaded

// ✅ FIXED
$session = AttendanceSession::with([
    'class',
    'subject',
    'teacher',
    'attendances.user',
    'attendances.pklLocation'
])->find($id);
```

#### 5. Project Gallery
**Endpoint:** `GET /v1/public/gallery`
**Current Issue:** Missing user and log data
```php
// ❌ CURRENT (N queries per project for logs)
$projects = Project::with('user:id,name')
    ->where('visibility', true)
    ->paginate();

// ✅ FIXED
$projects = Project::with([
    'user:id,name',
    'logs' => fn($q) => $q->limit(5)
])->where('visibility', true)
    ->paginate();
```

---

## 📈 Data Flow Examples

### Student Attendance Workflow
```
1. User logs in
   └─ Loads: User -> Profile -> Skills

2. Student marks attendance
   └─ Posts: Attendance record
      └─ References: User, PKL_LOCATION, ATTENDANCE_SESSION (via code)

3. Query for history:
   GET /attendance/history
   └─ Returns: Attendance WITH User, PKL_LOCATION
      └─ Related tables: 3 queries (good!)

4. Teacher monitors session:
   GET /attendance/session/123/monitor
   └─ Returns: AttendanceSession WITH:
      ├─ Class (1 query)
      ├─ Subject (1 query)
      ├─ Teacher (1 query)
      └─ Attendances WITH Users (N+1 problem!)
         ❌ Without eager load: 1 + N queries
         ✅ With eager load: 2 queries
```

### Class Schedule Workflow
```
1. Admin creates schedule:
   POST /schedules
   └─ Validates: Class, Subject, Teacher exist
      └─ Checks for conflicts (same teacher/class/day/time)

2. Query class schedule:
   GET /admin/schedules?class_id=5
   └─ Returns: Schedules WITH:
      ├─ Class (1 query)
      ├─ Subject (1 query)
      └─ Teacher (1 query)
      └─ Already loaded! (ScheduleService does this correctly)

3. Student views schedule:
   GET /v1/student/attendance/pkl-locations
   └─ Returns: PKL_LOCATION WITH:
      ├─ Approver (1 query)
      ├─ Students (N queries - MISSING!)
```

### Teacher Subject Assignment
```
1. Admin creates teacher:
   POST /users
   └─ Inputs: subjects array [1, 2, 3]
      └─ Creates Profile
      └─ Attaches subjects to Profile (profile_subject table)
         └─ ✅ But no relationship defined!

2. Query teacher subjects:
   GET /v1/teacher/subjects
   └─ Current: UserService loads User->Profile->???
      ❌ Cannot access via $user->profile->subjects
      ❌ Must use: Profile::find()->subjects() - but relationship missing!

3. Query subject teachers:
   GET /v1/admin/subjects/1
   └─ Need teachers teaching this subject
      ✅ Can use: Subject.profiles, then get users
      ❌ But no direct User relationship
```

### PKL Location Assignment & Attendance
```
1. Admin approves PKL location:
   PUT /admin/pkl/5
   └─ Sets: is_approved=true, approved_by=admin_id

2. Assign students to PKL:
   PUT /users/10
   └─ Sets: user.pkl_location_id = 5

3. Student marks PKL attendance:
   POST /student/attendance
   └─ Creates: Attendance record with pkl_location_id

4. Get students at location:
   GET /admin/pkl/5/students
   └─ Current: Must query User WHERE pkl_location_id = 5
      ❌ No relationship defined!
      ✅ Should use: $pklLocation->students()
```

---

## 🎯 Recommended Query Patterns

### Efficient Patterns ✅

```php
// Pattern 1: User with complete profile
User::with(['profile', 'profile.subjects', 'classes'])
    ->find($id);

// Pattern 2: Class with students and subjects
ClassModel::with([
    'users' => fn($q) => $q->wherePivot('role_in_class', 'siswa'),
    'subjects'
])->find($id);

// Pattern 3: Attendance with relationships
Attendance::with('user', 'pklLocation')
    ->whereBetween('date', [$from, $to])
    ->get();

// Pattern 4: Permission with approver
Permission::with(['student:id,name', 'teacher:id,name'])
    ->where('status', 'pending')
    ->paginate();

// Pattern 5: Schedule with all details
Schedule::with(['class', 'subject', 'teacher', 'sessions'])
    ->where('day', 'senin')
    ->get();

// Pattern 6: Project with recent logs
Project::with(['user', 'logs' => fn($q) => $q->latest()->limit(5)])
    ->where('visibility', true)
    ->paginate();
```

### Inefficient Patterns ❌

```php
// Pattern 1: Missing eager loading
User::paginate();  // Will N+1 when accessing relationships
// Then: $user->profile (query per user)

// Pattern 2: Appended attributes in paginated query
ClassModel::paginate();  // Each class calculates counts
// = pagination_size * 3 extra queries

// Pattern 3: Getting data without selection
User::with('profile')->paginate();  // Gets all columns
// Better: User::with('profile:id,user_id')->paginate();

// Pattern 4: Implicit relationships
Attendance::get();  // Can't access $attendance->session
// Must do: $session = AttendanceSession::where('code', $attendance->code_used)->first();

// Pattern 5: Unindexed lookups
Attendance::where('date', $date)
    ->where('status', 'Alpha')
    ->get();  // Slow without composite index [date, status]
```

---

## 📋 Implementation Checklist

### Phase 1: Relationship Definitions (Critical)
- [ ] Add `PklLocation.students()` relationship
- [ ] Add `Profile.subjects()` and `Subject.profiles()` relationships
- [ ] Add `Attendance.session()` relationship  
- [ ] Add `AttendanceSession.attendances()` relationship
- [ ] Add `Subject.sessions()` relationship
- [ ] Add `Schedule.sessions()` relationship
- [ ] Create `LoginHistory` model and `User.loginHistory()` relationship

### Phase 2: Eager Loading Optimization (Important)
- [ ] Update `PermissionService` to eager load student/teacher
- [ ] Update `AttendanceService` to eager load user/pklLocation
- [ ] Update `ProjectService` to eager load user/logs
- [ ] Update `ClassService` to use withCount instead of appended attributes
- [ ] Update `AttendanceSessionService` to eager load attendances

### Phase 3: Database Indexes (Performance)
- [ ] Add composite index: `attendances [user_id, date, status]`
- [ ] Add composite index: `projects [visibility, status, created_at]`
- [ ] Add composite index: `permissions [status, created_at]`
- [ ] Add index: `student_skills [level]`
- [ ] Add index: `profile_subject [profile_id, subject_id]`
- [ ] Add spatial index: `pkl_locations [latitude, longitude]`

### Phase 4: Query Refactoring (Enhancement)
- [ ] Refactor class statistics to use withCount/withSum
- [ ] Implement caching for PKL location queries
- [ ] Add query scopes for common filters
- [ ] Optimize admin dashboard queries
- [ ] Test all endpoints with Laravel Debugbar for N+1 issues

---

## 🔗 Related Files

**Models:**
- `backend/app/Models/User.php`
- `backend/app/Models/Profile.php`
- `backend/app/Models/ClassModel.php`
- `backend/app/Models/Subject.php`
- `backend/app/Models/Schedule.php`
- `backend/app/Models/Attendance.php`
- `backend/app/Models/AttendanceSession.php`
- `backend/app/Models/Permission.php`
- `backend/app/Models/PklLocation.php`
- `backend/app/Models/Skill.php`
- `backend/app/Models/StudentSkill.php`
- `backend/app/Models/Project.php`
- `backend/app/Models/CareerPath.php`
- `backend/app/Models/Device.php`

**Services:**
- `backend/app/Services/UserService.php`
- `backend/app/Services/ScheduleService.php`
- `backend/app/Services/AdminService.php`
- `backend/app/Services/PermissionService.php`
- `backend/app/Services/AttendanceService.php`

**Controllers:**
- `backend/app/Http/Controllers/Admin/*.php`
- `backend/app/Http/Controllers/Teacher/*.php`
- `backend/app/Http/Controllers/Student/*.php`

**Migrations:**
- `backend/database/migrations/2026_*_create_*_table.php`

