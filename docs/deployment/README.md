# Deployment Guide

## Deployment with Docker & Coolify

- **Container Strategy**: Multi-stage Docker build producing Next.js standalone server.
- **Coolify Integration**: Git webhook automatic builds, environment variables injection, reverse proxy configuration.
- **Database Migrations**: Automated execution of `prisma migrate deploy` before application startup.
