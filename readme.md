# 📦 User Management - Monorepo

A NestJS-based monorepo following a microservices architecture, featuring built-in RBAC (Role-Based Access Control) and Audit Trail support, consisting of:

- **`gateway`**: API Gateway and Swagger aggregator.
- **`auth-svc`**: Authentication and authorization service.
- **`backoffice`**: User management and internal data service.

**Technologies Used**:

- **pnpm** workspace  
- **Prisma** (ORM, located in `libs/schema`)  
- **Winston** (with Elasticsearch integration in the gateway)  
- **PM2** / **Docker** (for deployment)

---

## 📑 Table of Contents

- [📦 User Management - Monorepo](#-user-management---monorepo)
  - [📑 Table of Contents](#-table-of-contents)
  - [📁 Project Structure](#-project-structure)
  - [🔧 Prerequisites](#-prerequisites)
  - [🛠️ Setup](#️-setup)
  - [🚀 Running the Application](#-running-the-application)
    - [Manual (Without PM2/Docker)](#manual-without-pm2docker)
    - [Using PM2 (Dev Environment)](#using-pm2-dev-environment)
    - [Using Docker Compose (Deployment)](#using-docker-compose-deployment)
    - [1. 🧱 Start Database Only](#1--start-database-only)
    - [2. 📦 Run Seeder (One-Time Only)](#2--run-seeder-one-time-only)
    - [3. 🚀 Start All Services (Without Seeder)](#3--start-all-services-without-seeder)
    - [4. 🛑 Stop All Services](#4--stop-all-services)
  - [☁️ Cloud Upload (S3 / ImageKit / Cloudinary)](#️-cloud-upload-s3--imagekit--cloudinary)
    - [.env Configuration](#env-configuration)
    - [API Endpoints](#api-endpoints)
    - [File Validation](#file-validation)
  - [📚 API Documentation](#-api-documentation)
  - [📜 Logging](#-logging)
  - [🧪 Testing](#-testing)
    - [Unit Tests per Service](#unit-tests-per-service)
  - [📦 Build](#-build)
  - [Build All at Once](#build-all-at-once)
  - [🗂️ Environment Configuration](#️-environment-configuration)
  - [🌟 Development Tips](#-development-tips)
    - [Prisma](#prisma)
    - [Code Sharing](#code-sharing)
    - [API Documentation](#api-documentation)
    - [Permission Management](#permission-management)
    - [Audit Trail](#audit-trail)
    - [Additional Tips](#additional-tips)
  - [🛠️ Troubleshooting](#️-troubleshooting)

---

## 📁 Project Structure

```plaintext

└── user-management-kit/
    ├── apps/
    │   ├── api-gateway/
    │   ├── auth-svc/
    │   └── backoffice-svc/
    ├── docker/
    │   ├── api-gateway/
    │   ├── auth-svc/
    │   ├── backoffice-svc/
    │   └── seed-runner.Dockerfile
    ├── libs/
    │   ├── common/
    │   ├── schema/
    │   │   └── schema.prisma
    │   ├── upload/
    │   └── ...
    ├── types/
    ├── scripts/
    ├── docker-compose.yml
    ├── ecosystem.config.js
    ├── tsconfg.base.json
    ├── tsconfg.build.json
    └── tsconfg.json
```

---

## 🔧 Prerequisites

Ensure you have installed:

- Node.js (v18 or later)
- pnpm (v10.12.4)
- Docker and Docker Compose (for local deployment)
- Elasticsearch (for gateway logging, configure `ELASTICSEARCH_URL` in `.env`)
- A Database (configure `DATABASE_URL` in `.env`)

---

## 🛠️ Setup

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Register Existing Apps**

   ```bash
   npx nx generate @nx/workspace:convert-to-nx-project --project=api-gateway --project-dir=apps/api-gateway
   npx nx generate @nx/workspace:convert-to-nx-project --project=auth-svc --project-dir=apps/auth-svc
   npx nx generate @nx/workspace:convert-to-nx-project --project=backoffice-svc --project-dir=apps/backoffice-svc
   ```

3. **Generate Prisma Client**
   Run this whenever `schema.prisma` changes:

   ```bash
   pnpm prisma generate
   pnpm db:migrate
   ```

4. **Generate Permissions**
   To generate new permissions based on decorators:

   ```bash
   pnpm gen:permissions
   ```

5. **Generate User**
   To seed a new superadmin user with all permissions:

   ```bash
   pnpm db:user-seed
   
   # username : superadmin
   # password : password123
   ```

---

## 🚀 Running the Application

### Manual (Without PM2/Docker)

1. **Build All Services**

   ```bash
   pnpm build:all
   ```

2. **Start Services Individually**

   ```bash
   pnpm start:gateway
   pnpm start:auth
   pnpm start:backoffice
   ```

### Using PM2 (Dev Environment)

1. **Start PM2**

   ```bash
   pnpm pm2:run
   ```

   Configuration is stored in `ecosystem.config.js`.

2. **View Logs**

   ```bash
   pm2 logs
   ```

### Using Docker Compose (Deployment)

### 1. 🧱 Start Database Only

```bash
docker-compose up -d db
```

This will start the `db` (PostgreSQL) service in the background.

### 2. 📦 Run Seeder (One-Time Only)

```bash
docker-compose --profile seeder run --rm seeder
```

The seeder will:

- Generate Prisma Client
- Deploy database migration
- Run initial seed data :
  - username: superadmin
  - password: password123

### 3. 🚀 Start All Services (Without Seeder)

```bash
docker-compose up -d
```

This will start all services except `seeder`.

### 4. 🛑 Stop All Services

```bash
docker-compose down
```

> 📝 **Note:**
> Don't forget to copy `.env-example` into `.env` in the root and each service folder before running the steps above.

---

## ☁️ Cloud Upload (S3 / ImageKit / Cloudinary)

This project supports image upload to cloud storage via `libs/upload`.

**Supported providers**: `s3`, `imagekit`, `cloudinary`. Set provider in `.env` using `STORAGE_PROVIDER`.

Upload service returns:
```json
{
  "url": "...",
  "id": "..."
}
```

Where `id` is stored as `photoID` (DB) to manage delete/replace operations.

### .env Configuration

```bash
# Storage Provider (required)
STORAGE_PROVIDER=s3

# AWS S3 Configuration
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=your_bucket_name

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Upload Settings
UPLOAD_FOLDER=users
```

### API Endpoints

**User Management with File Upload:**

- `POST /backoffice/users` (multipart/form-data) — Create user with optional `photo` file
- `PATCH /backoffice/users/:id` (multipart/form-data) — Update user with optional `photo` file
- `POST /backoffice/users/:id/photo` — Replace user photo only
- `DELETE /backoffice/users/:id/photo` — Delete user photo and clear DB fields

**Example Request (multipart/form-data):**
```bash
curl -X POST http://localhost:3000/backoffice/users \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "name=John Doe" \
  -F "password=password123" \
  -F "roleId=role-uuid-here" \
  -F "photo=@/path/to/image.jpg"
```

### File Validation

- **Allowed formats**: `jpeg`, `jpg`, `png`, `webp`, `gif`
- **Maximum file size**: `5MB` (configurable)
- **Storage method**: Files handled in memory using `multer.memoryStorage()`
- **Processing**: Files are converted to base64 for cloud upload

---

## 📚 API Documentation

Access Swagger UI in the gateway once the application is running:

```bash
http://localhost:3000/docs
```

Swagger aggregates docs from:

- `/docs-json/auth` (Auth Service)
- `/docs-json/backoffice` (Backoffice Service)

Example endpoints:

```bash
GET /auth/login
GET /backoffice/users
```

---

## 📜 Logging

Logging is implemented using **Winston** in the `gateway` service with Elasticsearch integration for production log analysis. Key features:

- Logs are stored in JSON format for easy parsing and searching in Elasticsearch.
- Logs output to console in development and sent to Elasticsearch in production.
- Logger configuration can be adjusted in `libs/logger/src/winston.config.ts`.

**Environment Variables for Logging**:

| Variable             | Description                                                    |
|----------------------|----------------------------------------------------------------|
| `ELASTICSEARCH_URL`  | Elasticsearch connection URL (e.g., `http://localhost:9200`)   |
| `ES_USERNAME`        | Elasticsearch username                                          |
| `ES_PASSWORD`        | Elasticsearch password                                          |

**Example Configuration**:

```plaintext
ELASTICSEARCH_URL=http://localhost:9200
ES_USERNAME=elastic
ES_PASSWORD=changeme
```

> 📌 Ensure Elasticsearch is running and accessible via `ELASTICSEARCH_URL` before starting the gateway.

---

## 🧪 Testing

### Unit Tests per Service

```bash
pnpm test:auth
pnpm test:backoffice
```

---

## 📦 Build

Build each service for production:

```bash
pnpm build --filter apps/auth-svc
pnpm build --filter apps/backoffice
pnpm build --filter apps/gateway
```

## Build All at Once

```bash
pnpm build:all
```

---

## 🗂️ Environment Configuration

Each service must have its own environment file in its directory:

```plaintext
.apps/
├── api-gateway/
│   ├── .env
│   └── .env-example
├── auth-svc/
│   ├── .env
│   └── .env-example
└── backoffice-svc/
    ├── .env
    └── .env-example
```

Each `.env-example` in the root and service folders lists the variables to fill in, for example:

```env
# .env-example
PORT=3000
DATABASE_URL=
JWT_SECRET=
SERVICE_INTERNAL_KEY=
ELASTICSEARCH_URL=

# Cloud Upload Configuration
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
UPLOAD_FOLDER=users
```

**Remember** to load environment variables before running each service:

```bash
# in each service folder\scp .env-example .env
# then edit .env as needed
```

---

## 🌟 Development Tips

### Prisma

- **Generate Schema**: Always run after changing `schema.prisma`:
  
  ```bash
  pnpm prisma generate
  ```

### Code Sharing

- **Leverage `libs`**: Store reusable code such as:
  - DTOs (Data Transfer Objects)
  - Guards
  - Middleware
  - Upload strategies
  This keeps code modular and avoids duplication.

### API Documentation

- **Swagger**: Only access via the Gateway (`/docs`). Ensure the gateway is running first.

### Permission Management

- **Creating New Permissions**: Add permissions in controllers using the `@Permission` decorator:

  ```typescript
  import { Permission } from '@libs/common/src';

  @Permission('CREATE_DATA', 'Roles', 'Create Role')
  async createData() {}
  ```

  **Decorator Parameters**:
  1. **Permission Name** (e.g., `CREATE_DATA`)
  2. **Module Name** (e.g., `Roles`)
  3. **Permission Description** (e.g., `Create Role`)

  To sync with the database:

  ```bash
  pnpm gen:permissions
  ```

  > ℹ️ This scans only the `backoffice` service by default. For other services, add custom scripts in `package.json`.

### Audit Trail

1. **Import Module**

   ```ts
   import { AuditTrailModule } from '@libs/audit-trail';

   @Module({
     imports: [AuditTrailModule],
   })
   export class AppModule {}
   ```

2. **Apply Middleware** (for UPDATE/DELETE routes)

   ```ts
   import {
     MiddlewareConsumer,
     Module,
     NestModule,
     RequestMethod,
   } from '@nestjs/common';
   import {
     AuditTrailService,
     createFetchOldEntityMiddleware,
   } from '@libs/audit-trail';

   @Module({
     providers: [AuditTrailService],
   })
   export class ProductModule implements NestModule {
     configure(consumer: MiddlewareConsumer) {
       consumer
         .apply(createFetchOldEntityMiddleware('product'))
         .forRoutes({ path: 'products/:id', method: RequestMethod.PATCH });

       consumer
         .apply(createFetchOldEntityMiddleware('product'))
         .forRoutes({ path: 'products/:id', method: RequestMethod.DELETE });
     }
   }
   ```

3. **Apply Interceptor & Decorator in Controllers**

   ```ts
   import {
     AuditTrailInterceptor,
     Audit,
     AuditAction,
   } from '@libs/audit-trail';
   ```

   Use on controller methods:

   ```ts
   @UseInterceptors(AuditTrailInterceptor)
   @Controller('products')
   export class ProductController {
     constructor(private readonly productService: ProductService) {}

     @Get()
     @Audit({ entity: 'Product', action: AuditAction.GET })
     async findAll() {
       return this.productService.findAll();
     }

     @Get(':id')
     @Audit({
       entity: 'Product',
       action: AuditAction.SHOW,
       getEntityId: (args) => args[0]?.id,
     })
     async findOne(@Param('id') id: string) {
       return this.productService.findOne(id);
     }

     @Post()
     @Audit({
       entity: 'Product',
       action: AuditAction.CREATE,
       getChanges: (_, res) => ({ before: null, after: res }),
     })
     async create(@Body() dto: CreateProductDto) {
       return this.productService.create(dto);
     }

     @Patch(':id')
     @Audit({
       entity: 'Product',
       action: AuditAction.UPDATE,
       getEntityId: (args) => args[0]?.id,
       getChanges: (args, result) => ({ before: args[1]?.oldData, after: result }),
     })
     async update(
       @Param('id') id: string,
       @Body() dto: UpdateProductDto,
     ) {
       return this.productService.update(id, dto);
     }

     @Delete(':id')
     @Audit({
       entity: 'Product',
       action: AuditAction.DELETE,
       getEntityId: ([req]) => req.params.id,
       getChanges: ([req]) => ({ before: req.oldData, after: null }),
     })
     async remove(@Param('id') id: string) {
       return this.productService.remove(id);
     }
   }
   ```

### Additional Tips

- **Naming Consistency**: Keep permission and module names uniform across the codebase.
- **Code Comments**: Add comments for complex logic to aid maintainability.
- **Testing**: Write unit tests for each module to ensure functionality.
- **Environment Variables**: Keep sensitive configs in `.env`; avoid hardcoding.
- **File Upload**: Use appropriate field names in multipart forms (e.g., `photo` for user images).

---

## 🛠️ Troubleshooting

- **Prisma Generate Fails**: Check your `DATABASE_URL` and Prisma schema validity.
- **Port Conflict**: Ensure each service has a unique port in its `.env`.
- **Swagger Missing**: Start the gateway and verify `/docs-json` endpoints for each service.
- **Permission Errors**: Confirm `@Permission` imports from `@libs/common/src`.
- **Elasticsearch Logging Issues**: Verify `ELASTICSEARCH_URL` and that Elasticsearch is reachable.
- **File Upload Issues**: 
  - Check `STORAGE_PROVIDER` is set correctly in `.env`
  - Verify cloud provider credentials are valid
  - Ensure file format and size meet validation requirements
  - Check multer configuration and field names match frontend
