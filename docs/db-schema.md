# Campus Connect — Database Schema Reference

> **Owner:** Admin Team (maintains this document as they run migrations)
> **Purpose:** Central reference for all database tables, fields, and relationships.
> **Rule:** When you add a new model, add it here. Keep this in sync with actual migrations.

---

## Schema Conventions

- All tables use `snake_case`
- All tables are prefixed with their module name (e.g., `lms_materials`, `course_enrollments`)
- Every table has: `id`, `created_at`, `updated_at`, `is_deleted`
- Soft delete only — never hard delete production data
- Foreign keys reference the `id` of the parent table

---

## Tables

> Schema will be populated by Admin Team during Sprint 0 and Sprint 1.

### users
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| email | String | Unique, indexed |
| password_hash | String | Bcrypt hashed |
| full_name | String | |
| role | Enum | STUDENT, FACULTY, HOD, DEAN, PRINCIPAL, VICE_PRINCIPAL, ADMIN |
| department_id | Integer | FK → departments.id (nullable for Admin) |
| is_active | Boolean | Default: true |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |
| is_deleted | Boolean | Soft delete |

### user_profiles
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| user_id | Integer | FK → users.id |
| avatar_url | String | Nullable |
| phone | String | Nullable |
| employee_id / roll_no | String | Nullable |
| bio | Text | Nullable |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

---

> Additional tables will be added here as each team defines their models.

---

*Keep this document updated with every migration. The source of truth is the actual migration files in `backend/migrations/versions/`.*
