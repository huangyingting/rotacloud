# RotaCloud Documentation Index

This directory contains the engineering, product, architecture, and security documentation produced from the systematic Playwright exploration of `https://rotacloud.com/` and `https://app.rotacloud.com/`.

| Document | Description |
|---|---|
| [`../ROTACLOUD_EXPLORATION_AND_PARITY_REPORT.md`](../ROTACLOUD_EXPLORATION_AND_PARITY_REPORT.md) | Master Playwright exploration report, 70-screenshot visual catalog, reverse-engineered REST API schemas, and feature parity matrix |
| [`01_ADR_ARCHITECTURE_DECISION_RECORDS.md`](./01_ADR_ARCHITECTURE_DECISION_RECORDS.md) | 8 Architecture Decision Records (Next.js 16, Dual-Provider Prisma 7, Invite-Only Single-Use Admission, RBAC, Audit Logging, Zero-Dummy-Data Policy) |
| [`02_PRD_PRODUCT_REQUIREMENTS_DOCUMENT.md`](./02_PRD_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Product Requirements Document, user personas, functional modules, and non-functional targets |
| [`03_TECHNICAL_SPECIFICATION.md`](./03_TECHNICAL_SPECIFICATION.md) | Complete REST API contract, route map, calculation formulas (`12.07%` UK holiday accrual, Bradford Factor `S² × D`, WTD 48h compliance, stairstep pricing), and error handling |
| [`04_ARCHITECTURE_AND_DATA_MODEL.md`](./04_ARCHITECTURE_AND_DATA_MODEL.md) | System architecture and 21-model relational database schema for SQLite & PostgreSQL |
| [`05_IMPLEMENTATION_PLAN_AND_BACKLOG.md`](./05_IMPLEMENTATION_PLAN_AND_BACKLOG.md) | Epics, dependency order, and task backlog |
| [`06_ACCEPTANCE_CRITERIA_AND_PARITY_MATRIX.md`](./06_ACCEPTANCE_CRITERIA_AND_PARITY_MATRIX.md) | Testable Given/When/Then acceptance criteria and side-by-side parity matrix |
| [`07_INVITE_ONLY_AUTH_AND_AUDIT_SPEC.md`](./07_INVITE_ONLY_AUTH_AND_AUDIT_SPEC.md) | Security specification for single-use invitation codes (`RC-XXXX-XXXX-XXXX`), `SHA-256` token hashing, revocation, rotation, CLI bootstrap, and immutable `AuditLog` |
