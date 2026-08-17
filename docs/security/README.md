# Security & Privacy Documentation

## Security & PDPA Principles

- **Authentication**: Server-side HttpOnly, Secure, SameSite=Lax Session Cookies.
- **RBAC**: Centralized authorization matrix (`SYSTEM_ADMIN`, `COMPANY_ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`).
- **Data Isolation**: Strict server-side `companyId` validation on every transaction.
- **PDPA Compliance**: Minimal data collection, privacy consent, right to be forgotten (anonymization).
- **Storage Security**: Private S3 buckets accessed only via temporary pre-signed URLs.
