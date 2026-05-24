# RPL-SMART: API Endpoints & Query Patterns Guide

## 📡 Complete API Endpoints Reference

### Global Routes
```
GET    /health                    HTTP 200  System health check
GET    /status                    HTTP 200  Component status (DB, Cache, Queue)
```

---

## 🔐 Authentication Routes (`/v1/auth/`)

### Login & Profile
```
POST   /login                     HTTP 200  Login with email/password
       Request: { email, password }
       Response: { token, user }

POST   /login/retro               HTTP 200  Login with retro theme
       Request: { email, password }
       Response: { token, user, retro_mode }

POST   /logout                    HTTP 200  Logout (destroy session)
       Auth: Required

GET    /me                        HTTP 200  Get current authenticated user
       Auth: Required
       Response: User object with profile

GET    /me/retro-profile          HTTP 200  Get retro-styled profile
       Auth: Required

PUT    /profile                   HTTP 200  Update user profile
       Auth: Required
       Request: { name, bio, github_url, linkedin_url }

PUT    /profile/retro             HTTP 200  Update retro preferences
       Auth: Required
       Request: { theme_preferences, notification_preferences }

POST   /profile/avatar            HTTP 200  Upload profile avatar
       Auth: Required
       Request: FormData { avatar: file }

POST   /profile/avatar/remove     HTTP 200  Delete profile avatar
       Auth: Required

POST   /token/refresh             HTTP 200  Refresh API token
       Auth: Required

POST   /2fa/enable                HTTP 200  Enable two-factor auth
       Auth: Required

POST   /2fa/verify                HTTP 200  Verify 2FA code
       Auth: Required
       Request: { code }

GET    /devices                   HTTP 200  List trusted devices
       Auth: Required

DELETE /devices/{id}              HTTP 200  Revoke device access
       Auth: Required

POST   /forgot-password           HTTP 200  Send password reset email
       Request: { email }

POST   /reset-password            HTTP 200  Reset password via token
       Request: { token, email, password }
```

---

## 🌐 Public Routes (`/v1/public/`)

### Landing & Information
```
GET    /landing                   HTTP 200  Landing page data
GET    /landing/retro-assets      HTTP 200  Retro-styled assets
GET    /stats                     HTTP 200  System statistics
GET    /stats/animated            HTTP 200  Animated statistics
GET    /info                      HTTP 200  API information

GET    /gallery                   HTTP 200  All public student projects
       Query: page, per_page, search
       Response: Projects collection

GET    /gallery/grid              HTTP 200  Gallery in grid view
       Query: page, per_page

GET    /gallery/{slug}            HTTP 200  Project detail
       Response: Project with owner info

GET    /gallery/{slug}/retro-preview HTTP 200 Retro-styled preview
```

### Career Path Simulator
```
GET    /simulator/paths           HTTP 200  List all career paths
       Query: page, per_page, category
       Response: CareerPath collection

GET    /simulator/paths/categories HTTP 200 Career categories
       Response: Array of categories

GET    /simulator/paths/{slug}    HTTP 200  Career path detail
       Response: CareerPath with steps

GET    /simulator/paths/{slug}/retro-flow HTTP 200 Retro flow view

POST   /simulator/sessions        HTTP 201  Start simulator session
       Request: { career_path_id }
       Response: { session_id, current_step }

POST   /simulator/sessions/{id}/choice HTTP 200 Submit step choice
       Request: { choice_id }
       Response: { next_step or result }

GET    /simulator/sessions/{id}/result HTTP 200 Get session result
       Response: { result, career_path, time_completed }

GET    /simulator/sessions/{id}/retro-result HTTP 200 Retro result view

POST   /simulator/sessions/{id}/export HTTP 200 Export result as PDF
       Response: PDF file download
```

---

## 🎓 Student Routes (`/v1/student/` - Requires: `auth:sanctum`, `role:siswa`)

### Dashboard
```
GET    /dashboard                 HTTP 200  Student dashboard data
       Response: { stats, skills, projects, schedule }

GET    /dashboard/retro           HTTP 200  Retro dashboard
GET    /dashboard/widgets         HTTP 200  Dashboard widgets only
```

### Attendance
```
POST   /attendance                HTTP 201  Mark attendance
       Request: { code, lat, lng, photo_url? }
       Response: { status: 'Hadir'|'Terlambat'|... }

POST   /attendance/retro          HTTP 201  Mark with retro UI
       Request: (same)

GET    /attendance/history        HTTP 200  Attendance history
       Query: from_date, to_date, page, per_page
       Response: Attendance[] with user, pklLocation

GET    /attendance/history/export HTTP 200  Export as CSV/PDF
       Query: format (csv|pdf)

GET    /attendance/stats          HTTP 200  Attendance statistics
       Response: { present, late, absent, permit, sick }

GET    /attendance/stats/retro    HTTP 200  Retro-styled stats

GET    /attendance/today          HTTP 200  Today's attendance status
       Response: { status, time, location }

GET    /attendance/today/retro    HTTP 200  Retro today status

GET    /attendance/pkl-locations  HTTP 200  Approved PKL locations for class
       Response: PklLocation[]

GET    /attendance/pkl-locations/retro HTTP 200 Retro PKL locations
GET    /attendance/pkl-locations/map-preview HTTP 200 Map preview

GET    /attendance/qr/generate    HTTP 200  Generate attendance QR code
       Response: { qr_code, valid_until }

POST   /attendance/qr/verify      HTTP 200  Verify QR code
       Request: { code, lat, lng }

POST   /attendance/selfie/verify  HTTP 201  Verify with selfie
       Request: FormData { photo, lat, lng }

GET    /attendance/selfie/history HTTP 200  Selfie verification history
```

### Projects
```
GET    /projects                  HTTP 200  User's projects (paginated)
       Query: status, page, per_page
       Response: Project[]

GET    /projects/grid             HTTP 200  Grid view
GET    /projects/list             HTTP 200  List view

POST   /projects                  HTTP 201  Create new project
       Request: { title, description, repository_url, demo_url, start_date }
       Response: Project object

GET    /projects/{id}             HTTP 200  Project detail
       Response: Project with owner

GET    /projects/{id}/logs        HTTP 200  Project coding logs
       Response: CodingLog[]

POST   /projects/{id}/logs        HTTP 201  Add coding log
       Request: { commit_hash, description, lines_added, lines_deleted }

GET    /projects/{id}/retro-preview HTTP 200 Retro preview

POST   /projects/{id}/export      HTTP 200  Export project as PDF
       Response: PDF file

PUT    /projects/{id}             HTTP 200  Update project
       Request: (same as create)

DELETE /projects/{id}             HTTP 204  Delete project
```

### Skills
```
GET    /skills                    HTTP 200  User's skills
       Response: Skill[] with pivot data (level, hours_practiced)

GET    /skills/retro              HTTP 200  Retro-styled skills

GET    /skills/progress           HTTP 200  Skill progress data
       Response: { mastered, advanced, learning, total }

GET    /skills/progress/animated  HTTP 200  Animated progress

POST   /skills/{id}/activity      HTTP 201  Log skill activity
       Request: { hours: int, evidence?: [] }

GET    /skills/{id}/retro-activity HTTP 200 Retro activity log

GET    /skills/recommendations    HTTP 200  Skill recommendations
       Response: Skill[] (based on career path)
```

### Profile
```
GET    /profile/retro             HTTP 200  Retro-styled profile with badges
       Response: { profile, badges: [] }
```

---

## 👨‍🏫 Teacher Routes (`/v1/teacher/` - Requires: `auth:sanctum`, `role:guru`)

### Dashboard
```
GET    /dashboard                 HTTP 200  Teacher dashboard
       Response: { classes, subjects, today_schedule, stats }

GET    /dashboard/retro           HTTP 200  Retro dashboard

GET    /classes                   HTTP 200  My classes (pagination)
GET    /subjects                  HTTP 200  My subjects
GET    /schedule/today            HTTP 200  Today's schedule
```

### Attendance Sessions (Core Feature)
```
GET    /attendance/sessions       HTTP 200  Active sessions
       Query: class_id, status

POST   /attendance/session/create HTTP 201  Create attendance session
       Request: { class_id, subject_id, valid_until }
       Response: { code, qr_code, valid_from, valid_until }

POST   /attendance/session/retro-create HTTP 201 Retro-styled creation

POST   /attendance/session/{id}/generate-code HTTP 200 Generate new code
       Response: { code, valid_until }

POST   /attendance/session/{id}/generate-retro-qr HTTP 200 Retro QR

POST   /attendance/session/{id}/close HTTP 200 Close attendance session
       Response: { status: 'closed', attendances_count }

POST   /attendance/session/{id}/reopen HTTP 200 Reopen session

GET    /attendance/session/{id}/monitor HTTP 200 Monitor real-time attendance
       Response: { session, attendances: [] }

GET    /attendance/session/{id}/monitor/retro HTTP 200 Retro monitor

GET    /attendance/session/{id}/live-stats HTTP 200 Live statistics
       Response: { present, late, absent, pending }

GET    /attendance/history        HTTP 200  Attendance history
       Query: from_date, to_date, page

GET    /attendance/history/export HTTP 200  Export history

PATCH  /attendance/{id}/verify    HTTP 200  Manually verify attendance
       Request: { status, note }

PATCH  /attendance/{id}/retro-verify HTTP 200 Retro manual verify

POST   /attendance/bulk/verify    HTTP 200  Bulk verify attendances
       Request: { attendance_ids: [], status }

POST   /attendance/bulk/export    HTTP 200  Bulk export
```

### Student Management
```
GET    /students                  HTTP 200  Class students
       Query: class_id, page
       Response: User[] with profiles

GET    /students/grid             HTTP 200  Grid view
GET    /students/{id}/attendance  HTTP 200  Student's attendance
       Query: from_date, to_date
       Response: Attendance[]

GET    /students/{id}/retro-profile HTTP 200 Retro student profile
GET    /students/{id}/attendance/export HTTP 200 Export student attendance
```

### Permissions (Approve student leave requests)
```
GET    /permissions               HTTP 200  Pending permissions
       Query: status (pending|approved|rejected), page
       Response: Permission[]

GET    /permissions/retro         HTTP 200  Retro view

POST   /permissions               HTTP 201  Create permission request
       Request: { date_from, date_to, type, reason, attachment? }

PATCH  /permissions/{id}/approve  HTTP 200  Approve permission
       Request: { note? }

PATCH  /permissions/{id}/reject   HTTP 200  Reject permission
       Request: { note? }

PATCH  /permissions/{id}/retro-approve HTTP 200 Retro approval

GET    /permissions/history       HTTP 200  Permission history
GET    /permissions/history/export HTTP 200 Export history

POST   /permissions/bulk/approve  HTTP 200  Bulk approve
POST   /permissions/bulk/reject   HTTP 200  Bulk reject
```

### Analytics
```
GET    /analytics/attendance      HTTP 200  Attendance analytics
       Response: { by_student, by_class, by_status }

GET    /analytics/attendance/retro HTTP 200 Retro analytics

GET    /analytics/students/progress HTTP 200 Student progress tracking

GET    /analytics/export/summary  HTTP 200  Export analytics summary
```

---

## 🛡️ Admin Routes (`/v1/admin/` - Requires: `auth:sanctum`, `role:admin`)

### Dashboard
```
GET    /dashboard                 HTTP 200  Admin dashboard
       Response: { overview, health, activity }

GET    /dashboard/retro           HTTP 200  Retro dashboard

GET    /analytics/attendance      HTTP 200  System attendance stats
GET    /analytics/attendance/retro HTTP 200

GET    /analytics/students        HTTP 200  Student analytics
GET    /analytics/students/retro  HTTP 200

GET    /analytics/export          HTTP 200  Export all analytics
```

### User Management (Full CRUD)
```
GET    /users                     HTTP 200  List users (paginated)
       Query: role (admin|guru|siswa), is_active, search, page
       Response: User[]

GET    /users/export              HTTP 200  Export users
GET    /users/export/csv          HTTP 200
GET    /users/export/json         HTTP 200

POST   /users                     HTTP 201  Create user
       Request: {
         name, email, password, role,
         phone?, avatar?,
         nis? (for siswa), nip? (for guru),
         class_level?, class_id?,
         subjects? (array for guru),
         bio?, github_url?, linkedin_url?
       }

GET    /users/{id}               HTTP 200  User detail with relationships
       Response: User { profile, classes, skills }

PUT    /users/{id}               HTTP 200  Full update
PATCH  /users/{id}               HTTP 200  Partial update

DELETE /users/{id}               HTTP 204  Delete user

POST   /users/{id}/reset-password HTTP 200  Reset user password
       Request: { new_password }

PATCH  /users/{id}/role          HTTP 200  Change user role
       Request: { role }

PATCH  /users/{id}/retro-profile HTTP 200  Update retro settings

GET    /users/analytics          HTTP 200  User analytics
GET    /users/analytics/retro    HTTP 200

POST   /users/bulk/update        HTTP 200  Bulk update users
       Request: { user_ids, updates }

POST   /users/bulk/delete        HTTP 200  Bulk delete
POST   /users/bulk/export        HTTP 200  Bulk export
```

### Class Management
```
GET    /classes                  HTTP 200  List classes (paginated)
       Query: level, is_active, search
       Response: Class[] with relationships

GET    /classes/export           HTTP 200
GET    /classes/export/csv       HTTP 200
GET    /classes/export/json      HTTP 200

GET    /classes/grid             HTTP 200  Grid view
GET    /classes/list             HTTP 200  List view

POST   /classes                  HTTP 201  Create class
       Request: { name, level, description, capacity }

GET    /classes/{id}             HTTP 200  Class detail
       Response: Class { users, subjects, schedules }

GET    /classes/{id}/retro-preview HTTP 200

PUT    /classes/{id}             HTTP 200  Update class
DELETE /classes/{id}             HTTP 204  Delete class

GET    /classes/analytics        HTTP 200  Class analytics
GET    /classes/analytics/retro  HTTP 200

POST   /classes/bulk/delete      HTTP 200  Bulk delete
POST   /classes/bulk/export      HTTP 200  Bulk export
```

### Subject Management
```
GET    /subjects                 HTTP 200  List subjects
       Query: category, is_active, search
       Response: Subject[]

POST   /subjects                 HTTP 201  Create subject
       Request: { code, name, category, credits, description }

GET    /subjects/{id}            HTTP 200  Subject detail

PUT    /subjects/{id}            HTTP 200  Update subject
PATCH  /subjects/{id}            HTTP 200  Partial update
DELETE /subjects/{id}            HTTP 204  Delete subject

GET    /subjects/categories      HTTP 200  Subject categories (productive|normative|adaptive)
GET    /subjects/{id}/retro-preview HTTP 200

GET    /subjects/export          HTTP 200
GET    /subjects/export/csv      HTTP 200
GET    /subjects/export/json     HTTP 200

GET    /subjects/analytics       HTTP 200  Subject analytics

POST   /subjects/bulk/delete     HTTP 200  Bulk delete
POST   /subjects/bulk/export     HTTP 200  Bulk export
```

### Schedule Management
```
GET    /schedules                HTTP 200  List schedules
       Query: class_id, teacher_id, day, is_active, search
       Response: Schedule[]

POST   /schedules                HTTP 201  Create schedule
       Request: {
         class_id, subject_id, teacher_id,
         day (senin|selasa|rabu|kamis|jumat|sabtu),
         start_time, end_time, room?
       }

GET    /schedules/{id}           HTTP 200  Schedule detail
PUT    /schedules/{id}           HTTP 200  Update schedule
PATCH  /schedules/{id}           HTTP 200  Partial update
DELETE /schedules/{id}           HTTP 204  Delete schedule

POST   /schedules/check-conflict HTTP 200  Check for conflicts
       Request: { class_id, teacher_id, day, start_time, end_time }

GET    /schedules/check-conflict/retro HTTP 200

GET    /schedules/by-teacher/{id} HTTP 200 Teacher's schedules
GET    /schedules/by-class/{id}  HTTP 200  Class schedules

GET    /schedules/weekly-view    HTTP 200  Week view
GET    /schedules/retro-weekly   HTTP 200

GET    /schedules/templates      HTTP 200  Schedule templates

GET    /schedules/export         HTTP 200
GET    /schedules/export/csv     HTTP 200
GET    /schedules/export/json    HTTP 200

POST   /schedules/bulk/delete    HTTP 200  Bulk delete
POST   /schedules/bulk/export    HTTP 200  Bulk export
```

### PKL Location Management
```
GET    /pkl                      HTTP 200  List PKL locations (paginated)
       Query: search, is_approved, is_active, city, latitude, longitude, radius_km

POST   /pkl                      HTTP 201  Create PKL location
       Request: {
         company_name, address, city?, province?,
         latitude, longitude, radius_meters,
         supervisor_name?, supervisor_phone?, supervisor_email?,
         notes?
       }

GET    /pkl/{id}                 HTTP 200  PKL location detail
GET    /pkl/approved             HTTP 200  Approved locations only (cached)

PUT    /pkl/{id}                 HTTP 200  Update PKL location
DELETE /pkl/{id}                 HTTP 204  Delete PKL location

PATCH  /pkl/{id}/approve        HTTP 200  Approve location
       Request: { is_approved: true }

GET    /pkl/geo-filter           HTTP 200  Filter by distance from school
       Query: latitude, longitude, radius_km

GET    /pkl/export               HTTP 200
GET    /pkl/export/csv           HTTP 200

POST   /pkl/{id}/assign-students HTTP 200  Bulk assign students
       Request: { student_ids: [] }
```

### Settings Management
```
GET    /settings                 HTTP 200  System settings
POST   /settings                 HTTP 201  Create/update setting
       Request: { key, value (JSON) }

GET    /settings/{key}           HTTP 200  Specific setting
DELETE /settings/{key}           HTTP 204  Delete setting
```

---

## 📊 Common Query Patterns

### Pagination
```
Standard:
  GET /endpoint?page=1&per_page=15

All records (no pagination):
  GET /endpoint?all=true

With filters:
  GET /endpoint?page=1&per_page=15&role=guru&status=active&search=john
```

### Filtering
```
By single field:
  ?role=siswa
  ?is_active=true
  ?status=pending

By range:
  ?from_date=2024-01-01&to_date=2024-12-31

By search term (searches multiple fields):
  ?search=john

By multiple statuses:
  Include in query param as comma-separated or array notation
```

### Response Format
All responses follow this structure:
```json
{
  "status": "success|error",
  "message": "Human-readable message",
  "code": "ENDPOINT_SPECIFIC_CODE",
  "data": { /* response data */ },
  "meta": { /* pagination/filter metadata */ },
  "errors": { /* validation errors if any */ }
}
```

### Error Codes
```
200 OK              Successful GET/PUT/PATCH
201 Created         Successful POST
204 No Content      Successful DELETE
400 Bad Request     Validation error, malformed request
401 Unauthorized    Missing/invalid authentication
403 Forbidden       Authenticated but lacks permission
404 Not Found       Resource doesn't exist
409 Conflict        Schedule conflict, duplicate entry
422 Unprocessable   Semantic error (validation passed but logic failed)
500 Server Error    Unexpected server error
```

---

## 🔍 Example API Calls

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Attendance History
```bash
curl -X GET http://localhost:8000/api/v1/student/attendance/history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Create Attendance Session
```bash
curl -X POST http://localhost:8000/api/v1/teacher/attendance/session/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 1,
    "subject_id": 5,
    "valid_until": "2024-12-15T14:30:00"
  }'
```

### Create User (Admin)
```bash
curl -X POST http://localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "SecurePass123",
    "role": "guru",
    "nip": "19850315200501001",
    "subjects": [1, 2, 3]
  }'
```

### Get PKL Locations
```bash
curl -X GET 'http://localhost:8000/api/v1/admin/pkl?is_approved=true&page=1&per_page=10' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Rate Limiting & Best Practices

### API Rate Limits (Per User)
- Public endpoints: 60 requests/minute
- Authenticated endpoints: 300 requests/minute
- Admin endpoints: 600 requests/minute

### Best Practices
1. Always include `per_page` parameter for pagination (default: 15)
2. Use `with` parameter for relationships when available (reduces queries)
3. Cache responses client-side when appropriate
4. Use batch endpoints for bulk operations instead of individual requests
5. Export data in CSV for large datasets instead of pagination
6. Monitor response headers for rate limit status

