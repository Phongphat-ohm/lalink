# Database Documentation

## Prisma ORM & PostgreSQL Schema

- Data models defined in `prisma/schema.prisma`
- Multi-Tenant models keyed with `companyId`
- Central ledger tracking for leave balances (`LeaveBalance` & `LeaveTransaction`)
- Foreign keys with appropriate Cascade/Restrict constraints
