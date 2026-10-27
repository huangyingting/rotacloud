# Invite-Only Registration, RBAC & Audit Logging Specification

## 1. Security Architecture Overview

Following the `../Arcade` reference implementation and production hardening requirements:
1. **No Public Self-Signup Without an Invitation Code**: Self-registration at `/register` and `POST /api/auth/register` is strictly gated by a single-use, cryptographically generated invitation code (`AccountInvitation`).
2. **Zero Dummy Data / Zero Demo Accounts**: Neither migrations nor application startup create demo accounts or sample shifts. Initial administrator access is provisioned via the CLI bootstrap utility (`npm run auth:bootstrap-admin`).
3. **Cryptographic Token Storage**:
   - Plaintext invitation codes follow the format `RC-XXXX-XXXX-XXXX` (high-entropy alphanumeric).
   - Only `codePrefix` (first 7 chars for UI identification) and `tokenHash` (`SHA-256` hex digest of the normalized code) are stored in the database.
   - Plaintext codes are returned only once at creation time.

---

## 2. Invitation Lifecycle State Machine

```
                  +-------------------+
                  |      CREATED      |
                  |  status: PENDING  |
                  +---------+---------+
                            |
         +------------------+------------------+
         |                  |                  |
         v (User redeems)   v (Admin revokes)  v (now > expiresAt)
+--------+--------+ +-------+--------+ +-------+--------+
|    CONSUMED     | |    REVOKED     | |    EXPIRED     |
| consumedAt set  | | revokedAt set  | | Rejected on    |
| Single-use lock | | Immediate lock | | validation/use |
+-----------------+ +----------------+ +----------------+
```

### Invariants
- **Single-Use Enforcement**: Redeeming an invitation executes inside an atomic database transaction that verifies `status === 'PENDING'`, `revokedAt === null`, `consumedAt === null`, and `expiresAt > now`.
- **Email Binding**: If `invitation.email` is specified when the invite is issued, registration is restricted to that exact case-insensitive email address.
- **Role Assignment**: The registered user inherits `invitation.role` (`ADMIN`, `MANAGER`, or `EMPLOYEE`), `invitation.defaultRoleId` (job role), and `invitation.locationIdsJson` (assigned locations).

---

## 3. Role-Based Access Control (RBAC) Matrix

| Capability | `ADMIN` | `MANAGER` | `EMPLOYEE` |
|---|---|---|---|
| View Dashboard & Coverage Calendar | All Locations | Managed Locations | Assigned Locations |
| Build, Edit, Copy & Publish Rotas | Yes | Managed Locations | View Only |
| Claim Open Shifts / Request Swap or Drop | Yes | Yes | Yes |
| Approve Shift Swaps, Drops & Open Claims | Yes | Managed Locations | No |
| View & Restore Deleted Shifts | Yes | Managed Locations | No |
| Add/Edit Employees & Work Schedules | Yes | Managed Locations | Own Profile Contact Info |
| View/Edit Employee Wages, Salaries & NI | Yes | Read Cost Summary | Own Rate Only |
| Issue Invitations | `ADMIN`, `MANAGER`, `EMPLOYEE` | `EMPLOYEE` Only | No |
| Revoke Invitations | Yes | Own Employee Invites | No |
| Approve/Decline Leave & Manage Embargoes/TOIL | Yes | Managed Locations | Submit Requests Only |
| Clock In/Out & Submit Availability | Yes | Yes | Yes |
| Approve Timesheets & Export Payroll CSV | Yes | Managed Locations | View Own Only |
| Manage Budgets, Forecasting & Reports | Yes | Managed Locations | No |
| Manage Company Settings, Billing, API Keys & Webhooks | Yes | No | No |
| View Immutable Security & Activity Audit Log | Yes | No | No |

---

## 4. Audit Logging Events (`AuditLog`)

Every security-critical and operational action writes an immutable record to `AuditLog`:
- `ADMIN_BOOTSTRAPPED` — Operator provisioned initial administrator via CLI
- `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILED` — User authentication attempts
- `INVITATION_CREATED` — Single-use invitation issued (`codePrefix`, `role`, `expiresAt`)
- `INVITATION_VALIDATED` / `INVITATION_REJECTED` — Validation checks during registration
- `INVITATION_CONSUMED` — Single-use invitation redeemed to create user account
- `INVITATION_REVOKED` — Administrator revoked pending invitation (`revokeReason`)
- `USER_ROLE_UPDATED` / `USER_DEACTIVATED` — RBAC role or active status change
- `LOCATION_CREATED` / `LOCATION_UPDATED` / `ROLE_CREATED` / `ROLE_DELETED`
- `SHIFT_CREATED` / `SHIFT_UPDATED` / `SHIFT_PUBLISHED` / `SHIFT_DELETED` / `SHIFT_RESTORED`
- `LEAVE_REQUESTED` / `LEAVE_APPROVED` / `LEAVE_DECLINED` / `EMBARGO_CREATED`
- `TIMESHEET_CLOCK_IN` / `TIMESHEET_CLOCK_OUT` / `TIMESHEET_APPROVED`
- `API_KEY_CREATED` / `API_KEY_REVOKED` / `WEBHOOK_CREATED` / `SETTINGS_UPDATED`
