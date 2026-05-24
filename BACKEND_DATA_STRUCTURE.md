# RPL-SMART Backend Data Structure & Relationships
**Dokumentasi Lengkap: Model, Database, API Endpoints & Eager Loading**

---

## 📋 DAFTAR ISI
1. [Model Relationships Diagram](#model-relationships-diagram)
2. [Database Table Structure](#database-table-structure)
3. [Detailed Relationships](#detailed-relationships)
4. [Current API Endpoints](#current-api-endpoints)
5. [Missing Relationships](#missing-relationships)
6. [Eager Loading Analysis](#eager-loading-analysis)
7. [Query Performance Issues](#query-performance-issues)

---

## 🔗 Model Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RPL-SMART DATA MODEL                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    USER      │ (Core user table - admin, guru, siswa)
├──────────────┤
│ id (PK)      │
│ name         │
│ email        │
│ role         │◄─────────────────┐
│ is_active    │                  │
│ pkl_location_id (FK)◄──────────┐│
└──────────────┘                 ││
       │                         ││
       ├─1:1──────────────────────┘
       │                          │
       │      ┌──────────────┐    │
       └─────►│   PROFILE    │    │
              ├──────────────┤    │
              │ id (PK)      │    │
              │ user_id (FK) │    │
              │ nis          │    │
              │ nip          │    │
              │ class_level  │    │
              └──────────────┘
                    │
                    ├─M:M─────┐
                    │          │
                    │  ┌──────────────┐
                    └─►│   SUBJECT    │
                       ├──────────────┤
                       │ id (PK)      │
                       │ name         │
                       │ category     │
                       │ credits      │
                       └──────────────┘
                            │
                            ├─M:M──┐
                            │      │
       ┌────────────────────┴──────┼──────┐
       │                           │      │
   ┌───────────┐  ┌──────────────┐ │   ┌──────────────┐
   │  CLASS    │  │  SCHEDULE    │ │   │CLASS_SUBJECT │
   ├───────────┤  ├──────────────┤ │   ├──────────────┤
   │ id (PK)   │  │ id (PK)      │ │   │ class_id (FK)│
   │ name      │  │ class_id (FK)├─┤   │ subject_id   │
   │ level     │  │ subject_id(FK)◄┤   │ (FK)         │
   │ capacity  │  │ teacher_id(FK)│ │   └──────────────┘
   └───────────┘  │ day          │ │
        │         │ start_time   │ │
        │         │ end_time     │ │
        │         │ room         │ │
        │         └──────────────┘ │
        │              │           │
        ├──M:M─────────┼──────────┤
        │              │          │
        ├─────USER─────┘          │
        │              ┌─────────►│
        │              │          │
   ┌────────────┐ ┌────────────┐ │
   │ CLASS_USER │ │ ATTENDANCE │ │
   ├────────────┤ ├────────────┤ │
   │ class_id   │ │ id (PK)    │ │
   │ user_id (FK)  │ user_id(FK)│ │
   │ role_in_class │ date       │ │
   └────────────┘ │ status     │ │
                  │ lat, lng   │ │
                  │ photo_url  │ │
                  │ code_used  │ │
                  │ pkl_loc_id │─┘
                  └────────────┘
                         │
                         ├─RELATES─TO
                         │
                  ┌──────────────────┐
                  │ATTENDANCE_SESSION│
                  ├──────────────────┤
                  │ id (PK)          │
                  │ code             │
                  │ class_id (FK)    │
                  │ schedule_id (FK) │
                  │ subject_id (FK)  │
                  │ generated_by(FK) │
                  │ valid_from       │
                  │ valid_until      │
                  │ pkl_location_id  │
                  └──────────────────┘

┌─────────────────────────────────────────┐
│         PERMISSION & SKILL MODELS       │
└─────────────────────────────────────────┘

┌──────────────┐
│ PERMISSION   │
├──────────────┤
│ id (PK)      │
│ user_id(FK)  │◄──SISWA
│ teacher_id   │
│ (FK)         │◄──GURU (approver)
│ date_from    │
│ date_to      │
│ type         │
│ status       │
│ attachment   │
└──────────────┘

┌──────────────┐     ┌─────────────────┐
│    SKILL     │     │ STUDENT_SKILL   │
├──────────────┤     ├─────────────────┤
│ id (PK)      │◄────│ skill_id (FK)   │
│ name         │     │ user_id (FK)    │
│ category     │     │ level (0-100)   │
│ description  │     │ hours_practiced │
│ icon         │     │ evidence (JSON) │
│ max_level    │     └─────────────────┘
└──────────────┘             │
                    ┌────────┘
                    │
                  USER

┌──────────────────────────────────────┐
│      PROJECT & SIMULATOR MODELS      │
└──────────────────────────────────────┘

┌──────────────┐
│   PROJECT    │
├──────────────┤
│ id (PK)      │
│ user_id(FK)  │──────┐
│ title        │      │
│ repository   │      │
│ status       │      │
│ start_date   │      │
│ end_date     │      │
└──────────────┘      │
       │              │
       ├─HasMany      │
       │              │
   ┌────────────┐     │
   │ CODING_LOG │     │
   ├────────────┤     │
   │ project_id │     │
   │ user_id(FK)├──────┘
   │ commit     │
   │ lines_*    │
   └────────────┘

┌──────────────┐
│CAREER_PATH   │
├──────────────┤
│ id (PK)      │
│ title        │
│ description  │
│ required_*   │
│ career_*     │
└──────────────┘
       │
       ├─HasMany
       │
   ┌────────────────┐
   │SIMULATOR_STEP  │
   ├────────────────┤
   │ path_id (FK)   │
   │ title          │
   │ content        │
   │ order          │
   │ is_final       │
   │ options (JSON) │
   └────────────────┘
       │
       │
   ┌─────────────────┐
   │SIMULATOR_SESSION│
   ├─────────────────┤
   │ user_id (FK)    │
   │ path_id (FK)    │
   │ current_step(FK)│
   │ choices (JSON)  │
   │ completed_at    │
   │ result (JSON)   │
   └─────────────────┘

┌──────────────────────────────────────┐
│      INFRASTRUCTURE MODELS           │
└──────────────────────────────────────┘

┌──────────────┐
│  PKL_LOCATION│ (Praktik Lapang)
├──────────────┤
│ id (PK)      │
│ company_name │
│ address      │
│ latitude     │
│ longitude    │
│ radius       │
│ supervisor_* │
│ approved_by  │
│ is_approved  │
│ is_active    │
└──────────────┘
       │
       └─Referenced by:
           - Attendance.pkl_location_id
           - AttendanceSession.pkl_location_id
           - User.pkl_location_id

┌──────────────┐
│    DEVICE    │
├──────────────┤
│ id (PK)      │
│ user_id(FK)  │
│ name         │
│ ip_address   │
│ user_agent   │
│ last_used    │
│ is_trusted   │
└──────────────┘

┌──────────────┐
│   SETTINGS   │
├──────────────┤
│ id (PK)      │
│ key          │
│ value (JSON) │
└──────────────┘

```

---

## 📊 Database Table Structure

### Core Tables

#### `users` (18 columns)
```sql
id, name, email, password, role, slug, phone, avatar_url, is_active
last_login_at, last_login_ip, pkl_location_id (FK)
two_factor_enabled, two_factor_method, two_factor_secret
theme_preferences (JSON), notification_preferences (JSON)
remember_token, timestamps
```

#### `profiles` (13 columns)
```sql
id, user_id (FK), nis, nip, class_level (enum), major
bio, github_url, linkedin_url, address, gender, date_of_birth
preferences (JSON), timestamps
```

#### `classes` (8 columns)
```sql
id, name, level (X/XI/XII), slug, description, capacity
is_active, timestamps
```

#### `subjects` (9 columns)
```sql
id, code, name, category (productive/normative/adaptive)
credits, description, is_active, timestamps
```

#### `schedules` (11 columns)
```sql
id, class_id (FK), subject_id (FK), teacher_id (FK)
day (enum), start_time, end_time, room, is_active, timestamps
UNIQUE: [class_id, teacher_id, day, start_time]
```

### Pivot Tables

#### `class_user` (8 columns)
```sql
id, class_id (FK), user_id (FK), role_in_class (enum)
academic_year, is_active, timestamps
UNIQUE: [class_id, user_id, academic_year]
```

#### `class_subject` (6 columns)
```sql
id, class_model_id (FK), subject_id (FK), academic_year
is_active, timestamps
UNIQUE: [class_model_id, subject_id]
```

#### `profile_subject` (3 columns)
```sql
profile_id (FK), subject_id (FK), timestamps
Purpose: Many-to-many relationship for teachers' subjects
```

### Attendance Tables

#### `attendances` (18 columns)
```sql
id, user_id (FK), date, lat, lng
status (enum), photo_url, code_used, device_info, verification_method
notes, pkl_location_id (FK), location_name
timestamps
UNIQUE: [user_id, date]
```

#### `attendance_sessions` (17 columns)
```sql
id, code, class_id (FK), schedule_id (FK), subject_id (FK)
generated_by (FK), valid_from, valid_until, is_active
max_uses, used_count, radius_meters, center_lat, center_lng
pkl_location_id (FK), timestamps
```

### Permission Tables

#### `permissions` (12 columns)
```sql
id, user_id (FK), teacher_id (FK), date_from, date_to
type (enum), reason, attachment_url, status (enum), note
approved_at, timestamps
```

### Skill Tables

#### `skills` (9 columns)
```sql
id, name, slug, category, description, icon
max_level, is_active, timestamps
```

#### `student_skills` (8 columns)
```sql
id, user_id (FK), skill_id (FK), level (0-100)
hours_practiced, last_practiced_at, evidence (JSON), timestamps
UNIQUE: [user_id, skill_id]
```

### Project Tables

#### `projects` (12 columns)
```sql
id, user_id (FK), title, slug, description
repository_url, demo_url, status (enum), start_date, end_date
tags (JSON), visibility (boolean), timestamps
```

#### `coding_logs` (10 columns)
```sql
id, project_id (FK), user_id (FK), commit_hash, branch_name
description, lines_added, lines_deleted, files_changed (JSON), timestamps
```

### Career Path Tables

#### `career_paths` (8 columns)
```sql
id, title, slug, description, icon, color
required_skills (JSON), career_outcomes (JSON), is_active, timestamps
```

#### `simulator_steps` (8 columns)
```sql
id, career_path_id (FK), title, content, order
is_final, options (JSON), metadata (JSON), timestamps
```

#### `simulator_sessions` (8 columns)
```sql
id, user_id (FK), career_path_id (FK), current_step_id (FK)
choices (JSON), completed_at, result (JSON), session_token
expires_at, timestamps
```

### Infrastructure Tables

#### `pkl_locations` (16 columns)
```sql
id, company_name, address, latitude, longitude
radius_meters, supervisor_name, supervisor_phone, supervisor_email
notes, is_approved, approved_by (FK), approved_at
is_active, timestamps
```

#### `devices` (8 columns)
```sql
id, user_id (FK), name, ip_address, user_agent
last_used_at, is_trusted, retro_theme_enabled, timestamps
```

#### `settings` (4 columns)
```sql
id, key, value (JSON), timestamps
```

---

## 🔄 Detailed Relationships

### 1. **USER ↔ PROFILE (One-to-One)**
```php
// User.php
public function profile(): HasOne
{
    return $this->hasOne(Profile::class);
}

// Profile.php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}
```
- Every user has exactly one profile
- Auto-generated NIS (siswa) or NIP (guru)

### 2. **USER ↔ CLASS (Many-to-Many via class_user)**
```php
// User.php
public function classes(): BelongsToMany
{
    return $this->belongsToMany(ClassModel::class, 'class_user')
        ->withPivot(['role_in_class', 'academic_year', 'is_active'])
        ->withTimestamps();
}

// ClassModel.php
public function users(): BelongsToMany
{
    return $this->belongsToMany(User::class, 'class_user')
        ->withPivot(['role_in_class', 'academic_year', 'is_active'])
        ->withTimestamps();
}
```
- Student can be in multiple classes (across years)
- Role per class: siswa, wali_kelas, guru_pengampu

### 3. **USER ↔ SCHEDULE (One-to-Many as Teacher)**
```php
// User.php (Teacher)
public function schedules(): HasMany
{
    return $this->hasMany(Schedule::class, 'teacher_id');
}

// Schedule.php
public function teacher(): BelongsTo
{
    return $this->belongsTo(User::class, 'teacher_id');
}
```
- Teacher can have many schedules
- Links teacher to class/subject combinations

### 4. **CLASS ↔ SCHEDULE (One-to-Many)**
```php
// ClassModel.php
public function schedules(): HasMany
{
    return $this->hasMany(Schedule::class, 'class_id');
}

// Schedule.php
public function class(): BelongsTo
{
    return $this->belongsTo(ClassModel::class, 'class_id');
}
```
- Class has many schedules (multiple subjects/teachers)

### 5. **CLASS ↔ SUBJECT (Many-to-Many via class_subject)**
```php
// ClassModel.php
public function subjects(): BelongsToMany
{
    return $this->belongsToMany(Subject::class, 'class_subject', 'class_model_id')
        ->withPivot(['academic_year', 'is_active'])
        ->withTimestamps();
}

// Subject.php
public function classes(): BelongsToMany
{
    return $this->belongsToMany(ClassModel::class, 'class_subject', 'subject_id', 'class_model_id')
        ->withPivot(['academic_year', 'is_active'])
        ->withTimestamps();
}
```
- Class can have many subjects
- Subject can be taught in many classes

### 6. **SUBJECT ↔ SCHEDULE (One-to-Many)**
```php
// Subject.php
public function schedules(): HasMany
{
    return $this->hasMany(Schedule::class);
}

// Schedule.php
public function subject(): BelongsTo
{
    return $this->belongsTo(Subject::class);
}
```
- Subject can have multiple schedules across classes/times

### 7. **USER ↔ ATTENDANCE (One-to-Many)**
```php
// User.php
public function attendances(): HasMany
{
    return $this->hasMany(Attendance::class);
}

// Attendance.php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}
```
- User has one attendance record per day
- CRITICAL: UNIQUE constraint [user_id, date]

### 8. **ATTENDANCE_SESSION ↔ ATTENDANCE (Implicit via code)**
- AttendanceSession generates attendance codes
- Students use code to create Attendance records
- No explicit FK (linked by `code_used` field)

### 9. **USER ↔ PERMISSION (One-to-Many - as Student)**
```php
// User.php (Student)
public function permissions(): HasMany
{
    return $this->hasMany(Permission::class, 'user_id');
}

// Permission.php
public function student(): BelongsTo
{
    return $this->belongsTo(User::class, 'user_id');
}
```

### 10. **USER ↔ PERMISSION (One-to-Many - as Teacher/Approver)**
```php
// User.php (Teacher)
public function permissionsApproved(): HasMany
{
    return $this->hasMany(Permission::class, 'teacher_id');
}

// Permission.php
public function teacher(): BelongsTo
{
    return $this->belongsTo(User::class, 'teacher_id');
}
```

### 11. **SKILL ↔ USER (Many-to-Many via student_skills)**
```php
// Skill.php
public function students(): BelongsToMany
{
    return $this->belongsToMany(User::class, 'student_skills')
        ->withPivot(['level', 'hours_practiced', 'last_practiced_at', 'evidence'])
        ->withTimestamps();
}

// StudentSkill.php (Pivot model)
public function user(): BelongsTo { return $this->belongsTo(User::class); }
public function skill(): BelongsTo { return $this->belongsTo(Skill::class); }
```

### 12. **PROJECT ↔ USER (One-to-Many)**
```php
// User.php
public function projects(): HasMany
{
    return $this->hasMany(Project::class);
}

// Project.php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}
```

### 13. **PROJECT ↔ CODING_LOG (One-to-Many)**
```php
// Project.php
public function logs(): HasMany
{
    return $this->hasMany(CodingLog::class, 'project_id');
}

// CodingLog.php
public function project(): BelongsTo
{
    return $this->belongsTo(Project::class);
}
```

### 14. **CAREER_PATH ↔ SIMULATOR_STEP (One-to-Many)**
```php
// CareerPath.php
public function steps(): HasMany
{
    return $this->hasMany(SimulatorStep::class)->orderBy('order');
}

// SimulatorStep.php
public function careerPath(): BelongsTo
{
    return $this->belongsTo(CareerPath::class);
}
```

### 15. **CAREER_PATH ↔ SIMULATOR_SESSION (One-to-Many)**
```php
// CareerPath.php
public function sessions(): HasMany
{
    return $this->hasMany(SimulatorSession::class);
}

// SimulatorSession.php
public function careerPath(): BelongsTo
{
    return $this->belongsTo(CareerPath::class);
}
```

### 16. **USER ↔ SIMULATOR_SESSION (One-to-Many)**
```php
// User.php
public function simulatorSessions(): HasMany
{
    return $this->hasMany(SimulatorSession::class);
}

// SimulatorSession.php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}
```

### 17. **PKL_LOCATION ↔ ATTENDANCE (One-to-Many)**
```php
// PklLocation.php
public function attendances(): HasMany
{
    return $this->hasMany(Attendance::class, 'pkl_location_id');
}

// Attendance.php
public function pklLocation(): BelongsTo
{
    return $this->belongsTo(PklLocation::class);
}
```

### 18. **PKL_LOCATION ↔ USER (One-to-Many - Assignment)**
```php
// PklLocation.php - Missing! Need to add:
public function students(): HasMany
{
    return $this->hasMany(User::class, 'pkl_location_id');
}

// User.php - Missing! Need to add:
public function pklLocation(): BelongsTo
{
    return $this->belongsTo(PklLocation::class, 'pkl_location_id');
}
```
⚠️ **INCOMPLETE RELATIONSHIP**

### 19. **USER ↔ DEVICE (One-to-Many)**
```php
// User.php
public function devices(): HasMany
{
    return $this->hasMany(Device::class);
}

// Device.php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}
```

### 20. **PROFILE ↔ SUBJECT (Many-to-Many via profile_subject)**
```php
// Profile.php
public function subjects(): BelongsToMany
{
    return $this->belongsToMany(Subject::class, 'profile_subject')
        ->withTimestamps();
}

// Subject.php
public function profiles(): BelongsToMany
{
    return $this->belongsToMany(Profile::class, 'profile_subject')
        ->withTimestamps();
}
```
- Teachers' subjects assignment

---

## 🌐 Current API Endpoints

### Public Routes (`/v1/public/`)
```
GET    /health                          - Health check
GET    /status                          - System status
GET    /landing                         - Landing page data
GET    /landing/retro-assets           - Retro assets
GET    /gallery                        - Student gallery
GET    /gallery/{slug}                 - Gallery detail
GET    /simulator/paths                - Career paths
POST   /simulator/sessions             - Start session
```

### Authentication Routes (`/v1/auth/`)
```
POST   /login                          - Login
GET    /me                             - Current user profile
PUT    /profile                        - Update profile
POST   /profile/avatar                 - Upload avatar
POST   /2fa/enable                     - Enable 2FA
GET    /devices                        - List devices
```

### Student Routes (`/v1/student/`)
```
GET    /dashboard                      - Dashboard
GET    /attendance/history             - Attendance history
POST   /attendance                     - Mark attendance
GET    /attendance/pkl-locations       - PKL locations
GET    /attendance/stats               - Attendance stats
GET    /skills                         - Skills list
POST   /skills/{skill}/activity        - Log skill activity
GET    /projects                       - User projects
POST   /projects                       - Create project
```

### Teacher Routes (`/v1/teacher/`)
```
GET    /dashboard                      - Teacher dashboard
GET    /classes                        - My classes
GET    /subjects                       - My subjects
POST   /attendance/session/create      - Create attendance session
POST   /attendance/sessions/{id}/generate-code - Generate code
GET    /attendance/sessions/{id}/monitor - Monitor attendance
GET    /students                       - Student list
GET    /students/{id}/attendance       - Student attendance
GET    /permissions                    - Pending permissions
PATCH  /permissions/{id}/approve       - Approve permission
```

### Admin Routes (`/v1/admin/`)
```
GET    /dashboard                      - Admin dashboard
GET    /analytics/attendance           - Attendance analytics

# Users Management
GET    /users                          - List users
POST   /users                          - Create user
GET    /users/{id}                     - Get user detail
PUT    /users/{id}                     - Update user
DELETE /users/{id}                     - Delete user
POST   /users/{user}/reset-password    - Reset password
PATCH  /users/{user}/role              - Change role

# Classes Management
GET    /classes                        - List classes
POST   /classes                        - Create class
GET    /classes/{id}                   - Get class detail
PUT    /classes/{id}                   - Update class
DELETE /classes/{id}                   - Delete class

# Subjects Management
GET    /subjects                       - List subjects
POST   /subjects                       - Create subject
GET    /subjects/{id}                  - Get subject detail
PUT    /subjects/{id}                  - Update subject
PATCH  /subjects/{id}                  - Partial update
DELETE /subjects/{id}                  - Delete subject
GET    /subjects/categories            - Subject categories
GET    /subjects/{id}/retro-preview    - Retro preview

# Schedules Management
GET    /schedules                      - List schedules
POST   /schedules                      - Create schedule
GET    /schedules/{id}                 - Get schedule detail
PUT    /schedules/{id}                 - Update schedule
DELETE /schedules/{id}                 - Delete schedule
POST   /schedules/check-conflict       - Check schedule conflict
GET    /schedules/by-teacher/{id}      - Schedules by teacher
GET    /schedules/by-class/{id}        - Schedules by class
GET    /schedules/weekly-view          - Weekly schedule view

# PKL Locations Management
GET    /pkl                            - List PKL locations
POST   /pkl                            - Create PKL location
GET    /pkl/{id}                       - Get PKL detail
PUT    /pkl/{id}                       - Update PKL
DELETE /pkl/{id}                       - Delete PKL
GET    /pkl/approved                   - Approved locations only
```

---

## ⚠️ Missing Relationships

### 1. **PklLocation ↔ User (One-to-Many) - MISSING**
```php
// In PklLocation.php - NOT DEFINED
public function students(): HasMany
{
    return $this->hasMany(User::class, 'pkl_location_id');
}

// In User.php - PARTIALLY DEFINED
public function pklLocation(): BelongsTo
{
    return $this->belongsTo(PklLocation::class, 'pkl_location_id');
}
```
**Status:** ⚠️ Half-implemented
**Issue:** PklLocation has no HasMany relationship to students
**Fix Location:** `backend/app/Models/PklLocation.php`

### 2. **Profile ↔ Subject (Many-to-Many) - MISSING RELATIONSHIP METHOD**
```php
// profile_subject table EXISTS but relationship not defined in models

// Should add to Profile.php:
public function subjects(): BelongsToMany
{
    return $this->belongsToMany(Subject::class, 'profile_subject');
}

// Should add to Subject.php:
public function profiles(): BelongsToMany
{
    return $this->belongsToMany(Profile::class, 'profile_subject');
}
```
**Status:** ⚠️ Table exists but no relationship methods
**Issue:** Can't access teacher subjects through Profile relationship
**Fix Location:** `backend/app/Models/Profile.php`, `backend/app/Models/Subject.php`

### 3. **Attendance ↔ AttendanceSession - NO FORMAL RELATIONSHIP**
```php
// Attendance.php - MISSING
public function session(): BelongsTo
{
    return $this->belongsTo(AttendanceSession::class, 'code_used', 'code');
}

// AttendanceSession.php - MISSING HasMany
public function attendances(): HasMany
{
    return $this->hasMany(Attendance::class, 'code_used', 'code');
}
```
**Status:** ⚠️ Linked via string field, not FK
**Issue:** Can't access session details from attendance record
**Issue:** Can't get attendances from session via relationship
**Fix Location:** Both models

### 4. **CLASS ↔ ATTENDANCE - NO DIRECT RELATIONSHIP**
```php
// Class has students (via class_user)
// Students have attendances (via user)
// But no direct Class->Attendance relationship

// Should add to ClassModel.php:
public function attendances(): HasManyThrough
{
    return $this->hasManyThrough(
        Attendance::class,
        User::class,
        'id', // class_user.user_id
        'user_id',
        'id',
        'id'
    ); // ❌ WRONG - needs class_user pivot
}

// Better approach - need custom scope
```
**Status:** ⚠️ Missing HasManyThrough
**Issue:** Can't get class attendance stats directly
**Fix:** Needs custom implementation

### 5. **SUBJECT ↔ ATTENDANCE_SESSION - IMPLIED RELATIONSHIP**
```php
// Subject.php - MISSING
public function sessions(): HasMany
{
    return $this->hasMany(AttendanceSession::class, 'subject_id');
}

// AttendanceSession.php - EXISTS but incomplete
public function subject(): BelongsTo
{
    return $this->belongsTo(Subject::class, 'subject_id');
}
```
**Status:** ⚠️ One direction exists
**Issue:** Subject can't get its attendance sessions
**Fix Location:** `backend/app/Models/Subject.php`

### 6. **SCHEDULE ↔ ATTENDANCE_SESSION - IMPLIED RELATIONSHIP**
```php
// Schedule.php - MISSING
public function sessions(): HasMany
{
    return $this->hasMany(AttendanceSession::class, 'schedule_id');
}

// AttendanceSession.php - EXISTS but incomplete
public function schedule(): BelongsTo
{
    return $this->belongsTo(Schedule::class, 'schedule_id');
}
```
**Status:** ⚠️ One direction exists
**Issue:** Schedule can't get its attendance sessions
**Fix Location:** `backend/app/Models/Schedule.php`

### 7. **DEVICE ↔ ATTENDANCE_SESSION - NO RELATIONSHIP**
- No relationship defined
- AttendanceSession doesn't track which device was used
- Potential improvement for security audit

### 8. **USER ↔ LOGIN_HISTORY (One-to-Many) - MISSING MODEL**
```sql
-- Table exists: login_histories
-- But NO Model relationship defined
CREATE TABLE login_histories (
    id, user_id, ip_address, device_info, user_agent
    login_at, logout_at, is_successful
);
```
**Status:** ⚠️ Table exists but model/relationship missing

---

## 🔍 Eager Loading Analysis

### Current Implementation (Good ✅)

#### UserService.paginate()
```php
return $query->with(['profile', 'profile.subjects', 'classes'])
    ->orderBy('created_at', 'desc')
    ->paginate(15);
```
✅ **Good:** Eager loads profile and relationships

#### UserService.find()
```php
return User::with(['profile', 'profile.subjects', 'classes', 'skills'])->find($id);
```
✅ **Good:** Loads complete user data with relationships

#### ScheduleService.all()
```php
$query->with(['class', 'subject', 'teacher'])
    ->orderBy('day')
    ->orderBy('start_time');
```
✅ **Good:** Loads all related data upfront

#### AdminService.getRecentActivity()
```php
Attendance::with('user:id,name')
    ->latest('created_at')
    ->limit(5)
    ->get()
```
✅ **Good:** Selective column loading

### Issues Found (❌ Need Fix)

#### 1. **Attendance Controller - Missing Eager Load**
```php
// student/attendance/history endpoint
// ISSUE: Loads attendances but NOT user details
// FIX NEEDED:
$attendances->load('user', 'pklLocation');
```

#### 2. **Permission Service - Incomplete Eager Loading**
```php
// Missing:
public function all(array $filters)
{
    $query = Permission::query();
    // ❌ MISSING: ->with(['student', 'teacher'])
    return $query->paginate(15);
}
```
**Impact:** Teacher approval page will cause N+1 query problem

#### 3. **ClassModel - Student Count via N+1**
```php
// ClassModel has appended attributes:
protected $appends = [
    'wali_kelas',
    'student_count', // ❌ Calculated per request
    'teacher_count',
];

// This causes queries for EACH class when listing
```
**Impact:** High query count on class list endpoint

#### 4. **AttendanceSession - No Eager Load of Attendances**
```php
// When getting session details
public function monitor(int $id)
{
    $session = AttendanceSession::find($id);
    // ❌ NOT loaded: relationships, attendances
    return $session; // Will cause N+1 for attendances
}
```

#### 5. **StudentSkill Pivot - Missing Relationship**
```php
// When loading user skills
public function skills(): BelongsToMany
{
    // ❌ MISSING: loading pivot model with relationships
    return $this->belongsToMany(Skill::class, 'student_skills')
        ->withPivot(['level', 'hours_practiced', ...])
        ->withTimestamps();
    // Pivot relationships to skill not auto-loaded
}
```

#### 6. **CareerPath Steps - Order Not Eager Loaded**
```php
// When getting paths with steps
public function getPaths()
{
    $paths = CareerPath::with('steps'); // ✅ Good
    // But steps need ordering in relationship:
    public function steps(): HasMany
    {
        return $this->hasMany(SimulatorStep::class)
            ->orderBy('order'); // ✅ Has ordering
    }
}
```

#### 7. **Project with CodingLogs - Missing User**
```php
// When listing projects with logs
Project::with('logs') // ❌ MISSING: ->with('logs.user')
// Each log will cause additional query for user
```

---

## 📈 Query Performance Issues

### 1. **N+1 Query Problem in Permission List**
**Endpoint:** `GET /v1/teacher/permissions`
**Issue:**
```php
$permissions = Permission::paginate(); // 1 query
// Then for each permission:
$permission->student->name;  // N queries (each permission)
$permission->teacher->name;  // N queries (each permission)
```
**Fix:**
```php
Permission::with(['student:id,name', 'teacher:id,name'])->paginate();
```

### 2. **Class Statistics Calculation**
**Model:** ClassModel
**Issue:**
```php
protected $appends = [
    'wali_kelas',        // ❌ Queries for each class
    'student_count',     // ❌ Queries for each class
    'subject_count',     // ❌ Queries for each class
    'available_capacity', // Calculation from above
];
```
**Problem:** When listing 30 classes = 30 + 30 + 30 = 90 extra queries
**Fix:** Use count() in controller instead:
```php
$classes = ClassModel::with('users', 'subjects')
    ->withCount(['users as student_count' => fn($q) => 
        $q->where('role_in_class', 'siswa')
    ])
    ->paginate();
```

### 3. **Attendance Statistics - Inefficient Query**
**Issue:** No aggregation in query
```php
// Current: Get all attendances then count in PHP
$attendance->status('Hadir')->get()->count();
```
**Better:**
```php
Attendance::forUser($userId)
    ->whereIn('status', ['Hadir', 'Terlambat'])
    ->count();
```

### 4. **PKL Location Distance Calculation**
**Controller:** PklLocationController.index()
**Issue:**
```php
if ($request->filled('latitude') && ...) {
    $query->selectRaw("..., (6371 * acos(...)) as distance")
        ->having('distance', '<=', ...);
    // ❌ HAVERSINE formula on each row (expensive)
    // ❌ No index on lat/lng
}
```
**Fix:**
- Add spatial index: `$table->spatialIndex(['latitude', 'longitude'])`
- Cache approved locations
- Consider Redis for geo-queries

### 5. **Subject Assignment to Students**
**Issue:** Profile->Subject relationship not indexed
```sql
-- profile_subject has no index
-- When getting teacher subjects:
SELECT * FROM profile_subject WHERE profile_id = ?
-- Slow on large datasets
```
**Fix:** Add composite index in migration

### 6. **Attendance by Date Range**
**Issue:** No composite index for common queries
```php
Attendance::whereBetween('date', [$from, $to])
    ->where('user_id', $userId)
    ->where('status', 'Alpha')
    ->get();
```
**Missing Index:** `['user_id', 'date', 'status']`

### 7. **Student Gallery - Filter Inefficiency**
**Query:** All projects with filters
```php
Project::with('user:id,name')
    ->where('visibility', true)
    ->where('status', 'completed')
    ->whereBetween('created_at', [$start, $end])
    ->paginate();
```
**Missing:** Composite index on `[visibility, status, created_at]`

### 8. **Skill Progress Calculation**
**Issue:** Level calculation across users
```php
// Each user's skill level stats
$masterSkills = StudentSkill::where('level', '>=', 80)->count();
// No index on student_skills.level
```

---

## 🛠️ Recommendations

### Immediate Fixes (Priority: HIGH)
1. ✅ Add missing relationship methods to PklLocation, Profile, Subject
2. ✅ Add eager loading to all paginated queries
3. ✅ Fix N+1 query in Permission list
4. ✅ Add composite indexes to migration

### Medium Priority
1. Implement proper HasManyThrough for Class->Attendance
2. Cache PKL location queries
3. Refactor class statistics calculation
4. Add LoginHistory model and relationship

### Low Priority (Performance Optimization)
1. Add spatial index for geo-queries
2. Implement Redis caching for approval workflows
3. Optimize simulator session queries
4. Add query analysis with Laravel Debugbar

### Database Indexes to Add
```sql
-- Performance critical
ALTER TABLE attendances ADD INDEX idx_user_date (user_id, date);
ALTER TABLE attendances ADD INDEX idx_user_date_status (user_id, date, status);
ALTER TABLE student_skills ADD INDEX idx_level (level);
ALTER TABLE projects ADD COMPOSITE INDEX idx_visibility_status_created (visibility, status, created_at);
ALTER TABLE profile_subject ADD INDEX idx_profile (profile_id);
ALTER TABLE permissions ADD INDEX idx_status (status);
```

---

## 📚 Summary Statistics

| Metric | Count |
|--------|-------|
| **Models** | 18 |
| **Tables** | 24+ |
| **Relationships Defined** | 30+ |
| **Missing Relationships** | 8 |
| **API Endpoints** | 100+ |
| **Indexes Present** | ~20 |
| **Indexes Missing** | ~8 |
| **N+1 Query Issues** | 5 |

---

## 🔗 File Locations for Fixes

**Models to Update:**
- `backend/app/Models/PklLocation.php` - Add students() relationship
- `backend/app/Models/Profile.php` - Add subjects() relationship
- `backend/app/Models/Subject.php` - Add profiles() relationship
- `backend/app/Models/Attendance.php` - Add session() relationship
- `backend/app/Models/AttendanceSession.php` - Add attendances() relationship
- `backend/app/Models/Schedule.php` - Add sessions() relationship
- `backend/app/Models/Subject.php` - Add sessions() relationship (from AttendanceSession)

**Services to Update:**
- `backend/app/Services/PermissionService.php` - Add eager loading
- `backend/app/Services/AttendanceService.php` - Add eager loading
- `backend/app/Services/ProjectService.php` - Add eager loading

**Controllers to Update:**
- `backend/app/Http/Controllers/Teacher/PermissionController.php` - Use eager loaded data
- `backend/app/Http/Controllers/Admin/AttendanceController.php` - Add relationships
- `backend/app/Http/Controllers/Public/StudentGalleryController.php` - Optimize queries

**Migrations to Check:**
- `backend/database/migrations/2026_05_06_065738_create_profile_subject_table.php` - Add indexes
- Create new migration for missing indexes

