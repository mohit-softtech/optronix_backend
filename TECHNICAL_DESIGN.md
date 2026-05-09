# Technical Design Note — AttendX Attendance Management

## Architecture Overview

The system follows a **Layered Monolithic Architecture** with clear separation of concerns, designed for maintainability and future scalability.

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (Vite + React Router + Context API + Axios)         │
├─────────────────────────────────────────────────────┤
│                      REST API                        │
│              (JSON over HTTP + JWT)                   │
├─────────────────────────────────────────────────────┤
│  Routes → Middleware → Controllers → Services        │
│     (Express.js Application Layer)                    │
├─────────────────────────────────────────────────────┤
│              Sequelize ORM Models                     │
│          (Data Access Layer)                          │
├─────────────────────────────────────────────────────┤
│               MySQL 8.0 Database                      │
│              (Docker Container)                       │
└─────────────────────────────────────────────────────┘
```

## Design Decisions & Rationale

### 1. Layered Backend (Routes → Controllers → Services → Models)

**Why:** Each layer has a single responsibility:
- **Routes** define endpoints and attach middleware
- **Controllers** handle HTTP concerns (req/res)
- **Services** contain all business logic (testable, reusable)
- **Models** define data structure and relationships

**Benefit:** A new developer can find and modify business logic (e.g., "how does clock-in work?") by looking at exactly one file: `attendance.service.js`.

### 2. Sequelize ORM (not raw SQL)

**Why:** Sequelize provides:
- Type-safe model definitions with validations
- Automatic table creation and migration
- Association management (foreign keys, eager loading)
- Protection against SQL injection (parameterized queries)
- Database-agnostic code (easy to switch to PostgreSQL)

### 3. JWT for Authentication (not sessions)

**Why:** Stateless authentication that:
- Doesn't require server-side session storage
- Works seamlessly with SPAs (React)
- Scales horizontally (any server can verify the token)
- Carries role information in the payload for quick RBAC checks

### 4. Audit Logging as a Dedicated Model

**Why:** Every business action creates an immutable audit trail entry. This is critical for:
- Compliance requirements in HR software
- Debugging production issues
- Admin oversight of system usage
- Future reporting and analytics

### 5. Single-Row AttendanceRules Table

**Why:** Currently serves as a global config. Designed to easily extend to per-company rules by adding a `company_id` foreign key for multi-tenant support.

## Key Business Rules (Enforced Server-Side)

| Rule | Implementation |
|---|---|
| One clock-in per day | `UNIQUE(user_id, date)` DB constraint + service check |
| Clock-out requires clock-in | Service validates `clock_in` exists before allowing clock-out |
| No double clock-out | Service checks `clock_out` is null |
| No duplicate pending corrections | Service checks for existing `pending` request for same user + date |
| Role-based access | JWT middleware + RBAC middleware on every protected route |
| Soft delete (not hard delete) | `is_active` flag — deactivated users can't login but data preserved |
| Auto hour calculation | `total_hours = (clock_out - clock_in)` computed on clock-out |
| **Rules-driven status** | `status` determined by `AttendanceRules.min_hours_half_day` (not hard-coded) |
| **Punctuality tracking** | `is_late` computed at clock-in using `default_shift_start + grace_period_minutes` from rules |
| Correction approval updates attendance | Service auto-creates/updates attendance record on approval |

## Database Design Notes

### Normalization
- **3NF compliant**: No transitive dependencies, all data in its canonical location
- Roles are a separate table (not an ENUM on users) for future extensibility
- Correction requests reference both the user and the attendance record

### Indexes
- `UNIQUE(user_id, date)` on attendance_records — prevents duplicates and speeds date lookups
- Foreign key indexes auto-created by Sequelize
- Audit logs ordered by `created_at DESC` for efficient recent-first queries

### Data Integrity
- Foreign keys enforce referential integrity
- `NOT NULL` constraints on required fields
- ENUM types for status fields (prevents invalid values)
- JSON columns for audit log change snapshots (flexible schema)

## API Design Philosophy

- **RESTful conventions**: Resources as nouns, HTTP verbs for actions
- **Consistent response format**: `{ success, message, data }`
- **Appropriate HTTP status codes**: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal
- **Pagination**: `{ records, total, page, totalPages }` on all list endpoints
- **Input validation**: Joi schemas reject invalid data before reaching business logic
- **Error handling**: Centralized error middleware catches all errors, formats consistent responses

## Security Considerations

1. **Passwords**: bcrypt with 12 salt rounds (intentionally slow to resist brute-force)
2. **JWT Secret**: Stored in environment variables, never in code
3. **Helmet**: Sets security headers (CSP, X-Content-Type-Options, etc.)
4. **Rate Limiting**: 100 requests per 15-minute window per IP
5. **CORS**: Explicitly configured for frontend origin only
6. **SQL Injection**: Prevented by Sequelize's parameterized queries
7. **Stack Traces**: Hidden in production mode (only generic error messages)

## Future Extensibility

This architecture is designed to grow into a commercial multi-company HR product. The codebase contains explicit `MULTI_TENANT_HOOK` comments at every extension point:

| Extension | How to Implement | Hook Location |
|---|---|---|
| Multi-tenant | Add `company_id` FK to Users, Rules, Records | `User.js`, `AttendanceRule.js`, `AttendanceRecord.js` |
| Per-company rules | `company_id` already planned on `AttendanceRule` | `AttendanceRule.js` comment |
| Leave Management | New LeaveRequest model + service | New module |
| Shift Management | `shift_type` field already on `User` model | `User.js` — link to future `shifts` table |
| Geolocation Check | Add lat/lng to clock-in/out, validate against office location | `AttendanceRecord.js` |
| Biometric Integration | Clock-in via API from biometric device | `attendance.routes.js` |
| Reports & Analytics | Add reporting service, aggregate queries on attendance + `is_late` data | New service |
| Notifications | Add email/SMS service triggered by audit events | `audit.service.js` |
| Mobile App | Same REST API, new React Native frontend | No backend change |

## Assumptions

1. Single timezone operation (server timezone)
2. One company instance (single-tenant)
3. Manual clock-in/out (no biometric/geofencing for now)
4. Simple role hierarchy (no custom permission matrices)
5. Local development environment (Docker for MySQL)
