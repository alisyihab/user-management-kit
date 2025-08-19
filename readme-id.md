# 📦 User Management - Monorepo

Monorepo berbasis NestJS yang mengikuti arsitektur mikroservis, dilengkapi dengan RBAC (Role-Based Access Control) dan dukungan Audit Trail, terdiri dari:

- **`gateway`**: API Gateway dan agregator Swagger.
- **`auth-svc`**: Layanan autentikasi dan otorisasi.
- **`backoffice`**: Manajemen pengguna dan layanan data internal.

**Teknologi yang Digunakan**:

- **pnpm** workspace  
- **Prisma** (ORM, terletak di `libs/schema`)  
- **Winston** (dengan integrasi Elasticsearch di gateway)  
- **PM2** / **Docker** (untuk deployment)

---

## 📑 Daftar Isi

- [📦 User Management - Monorepo](#-user-management---monorepo)
  - [📑 Daftar Isi](#-daftar-isi)
  - [📁 Struktur Project](#-struktur-project)
  - [🔧 Prerequisites](#-prerequisites)
  - [🛠️ Setup](#️-setup)
  - [🚀 Menjalankan Aplikasi](#-menjalankan-aplikasi)
    - [Manual (Tanpa PM2/Docker)](#manual-tanpa-pm2docker)
    - [Menggunakan PM2 (Dev Environment)](#menggunakan-pm2-dev-environment)
    - [Menggunakan Docker Compose (Deployment)](#menggunakan-docker-compose-deployment)
    - [1. 🧱 Jalankan Database Saja](#1--jalankan-database-saja)
    - [2. 📦 Jalankan Seeder (Sekali Saja)](#2--jalankan-seeder-sekali-saja)
    - [3. 🚀 Jalankan Semua Layanan (Tanpa Seeder)](#3--jalankan-semua-layanan-tanpa-seeder)
    - [4. 🛑 Hentikan Semua Layanan](#4--hentikan-semua-layanan)
  - [☁️ Cloud Upload (S3 / ImageKit / Cloudinary)](#️-cloud-upload-s3--imagekit--cloudinary)
    - [Konfigurasi .env](#konfigurasi-env)
    - [API Endpoints](#api-endpoints)
    - [Validasi File](#validasi-file)
  - [📚 Dokumentasi API](#-dokumentasi-api)
  - [📜 Logging](#-logging)
  - [🧪 Testing](#-testing)
    - [Unit Test per Layanan](#unit-test-per-layanan)
  - [📦 Build](#-build)
  - [Build Semua Sekaligus](#build-semua-sekaligus)
  - [🗂️ Konfigurasi Environment](#️-konfigurasi-environment)
  - [🌟 Tips Pengembangan](#-tips-pengembangan)
    - [Prisma](#prisma)
    - [Code Sharing](#code-sharing)
    - [Dokumentasi API](#dokumentasi-api)
    - [Manajemen Permission](#manajemen-permission)
    - [Audit Trail](#audit-trail)
    - [Tips Tambahan](#tips-tambahan)
  - [🛠️ Troubleshooting](#️-troubleshooting)

---

## 📁 Struktur Project

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

Pastikan Anda telah menginstall:

- Node.js (v18 atau lebih baru)
- pnpm (v10.12.4)
- Docker dan Docker Compose (untuk deployment lokal)
- Elasticsearch (untuk logging gateway, konfigurasi `ELASTICSEARCH_URL` di `.env`)
- Database (konfigurasi `DATABASE_URL` di `.env`)

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
   Jalankan setiap kali `schema.prisma` berubah:

   ```bash
   pnpm prisma generate
   pnpm db:migrate
   ```

4. **Generate Permissions**
   Untuk generate permission baru berdasarkan decorator:

   ```bash
   pnpm gen:permissions
   ```

5. **Generate User**
   Untuk seed user superadmin baru dengan semua permission:

   ```bash
   pnpm db:user-seed
   
   # username : superadmin
   # password : password123
   ```

---

## 🚀 Menjalankan Aplikasi

### Manual (Tanpa PM2/Docker)

1. **Build Semua Layanan**

   ```bash
   pnpm build:all
   ```

2. **Jalankan Layanan Satu per Satu**

   ```bash
   pnpm start:gateway
   pnpm start:auth
   pnpm start:backoffice
   ```

### Menggunakan PM2 (Dev Environment)

1. **Start PM2**

   ```bash
   pnpm pm2:run
   ```

   Konfigurasi tersimpan di `ecosystem.config.js`.

2. **Lihat Logs**

   ```bash
   pm2 logs
   ```

### Menggunakan Docker Compose (Deployment)

### 1. 🧱 Jalankan Database Saja

```bash
docker-compose up -d db
```

Ini akan menjalankan layanan `db` (PostgreSQL) di background.

### 2. 📦 Jalankan Seeder (Sekali Saja)

```bash
docker-compose --profile seeder run --rm seeder
```

Seeder akan:

- Generate Prisma Client
- Deploy database migration
- Menjalankan seed data awal:
  - username: superadmin
  - password: password123

### 3. 🚀 Jalankan Semua Layanan (Tanpa Seeder)

```bash
docker-compose up -d
```

Ini akan menjalankan semua layanan kecuali `seeder`.

### 4. 🛑 Hentikan Semua Layanan

```bash
docker-compose down
```

> 📝 **Catatan:**
> Jangan lupa copy `.env-example` ke `.env` di root dan setiap folder layanan sebelum menjalankan langkah di atas.

---

## ☁️ Cloud Upload (S3 / ImageKit / Cloudinary)

Project ini mendukung upload gambar ke cloud storage melalui `libs/upload`.

**Provider yang didukung**: `s3`, `imagekit`, `cloudinary`. Set provider di `.env` menggunakan `STORAGE_PROVIDER`.

Upload service mengembalikan:
```json
{
  "url": "...",
  "id": "..."
}
```

Dimana `id` disimpan sebagai `photoID` (DB) untuk mengelola operasi delete/replace.

### Konfigurasi .env

```bash
# Storage Provider (wajib)
STORAGE_PROVIDER=s3

# Konfigurasi AWS S3
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=your_bucket_name

# Konfigurasi ImageKit
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL=https://ik.imagekit.io/your_imagekit_id

# Konfigurasi Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Pengaturan Upload
UPLOAD_FOLDER=users
```

### API Endpoints

**Manajemen User dengan Upload File:**

- `POST /backoffice/users` (multipart/form-data) — Buat user dengan file `photo` opsional
- `PATCH /backoffice/users/:id` (multipart/form-data) — Update user dengan file `photo` opsional
- `POST /backoffice/users/:id/photo` — Ganti foto user saja
- `DELETE /backoffice/users/:id/photo` — Hapus foto user dan clear field DB

**Contoh Request (multipart/form-data):**
```bash
curl -X POST http://localhost:3000/backoffice/users \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "name=John Doe" \
  -F "password=password123" \
  -F "roleId=role-uuid-here" \
  -F "photo=@/path/to/image.jpg"
```

### Validasi File

- **Format yang diizinkan**: `jpeg`, `jpg`, `png`, `webp`, `gif`
- **Ukuran file maksimum**: `5MB` (dapat dikonfigurasi)
- **Metode penyimpanan**: File ditangani di memory menggunakan `multer.memoryStorage()`
- **Processing**: File dikonversi ke base64 untuk cloud upload

---

## 📚 Dokumentasi API

Akses Swagger UI di gateway setelah aplikasi berjalan:

```bash
http://localhost:3000/docs
```

Swagger mengagregasi docs dari:

- `/docs-json/auth` (Auth Service)
- `/docs-json/backoffice` (Backoffice Service)

Contoh endpoints:

```bash
GET /auth/login
GET /backoffice/users
```

---

## 📜 Logging

Logging diimplementasikan menggunakan **Winston** di layanan `gateway` dengan integrasi Elasticsearch untuk analisis log produksi. Fitur utama:

- Log disimpan dalam format JSON untuk kemudahan parsing dan pencarian di Elasticsearch.
- Log output ke console di development dan dikirim ke Elasticsearch di production.
- Konfigurasi logger dapat disesuaikan di `libs/logger/src/winston.config.ts`.

**Environment Variables untuk Logging**:

| Variable             | Deskripsi                                                      |
|----------------------|----------------------------------------------------------------|
| `ELASTICSEARCH_URL`  | URL koneksi Elasticsearch (contoh: `http://localhost:9200`)   |
| `ES_USERNAME`        | Username Elasticsearch                                         |
| `ES_PASSWORD`        | Password Elasticsearch                                         |

**Contoh Konfigurasi**:

```plaintext
ELASTICSEARCH_URL=http://localhost:9200
ES_USERNAME=elastic
ES_PASSWORD=changeme
```

> 📌 Pastikan Elasticsearch berjalan dan dapat diakses melalui `ELASTICSEARCH_URL` sebelum menjalankan gateway.

---

## 🧪 Testing

### Unit Test per Layanan

```bash
pnpm test:auth
pnpm test:backoffice
```

---

## 📦 Build

Build setiap layanan untuk production:

```bash
pnpm build --filter apps/auth-svc
pnpm build --filter apps/backoffice
pnpm build --filter apps/gateway
```

## Build Semua Sekaligus

```bash
pnpm build:all
```

---

## 🗂️ Konfigurasi Environment

Setiap layanan harus memiliki file environment sendiri di direktorinya:

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

Setiap `.env-example` di root dan folder layanan berisi daftar variabel yang harus diisi, contoh:

```env
# .env-example
PORT=3000
DATABASE_URL=
JWT_SECRET=
SERVICE_INTERNAL_KEY=
ELASTICSEARCH_URL=

# Konfigurasi Cloud Upload
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
UPLOAD_FOLDER=users
```

**Ingat** untuk load environment variables sebelum menjalankan setiap layanan:

```bash
# di setiap folder layanan
cp .env-example .env
# lalu edit .env sesuai kebutuhan
```

---

## 🌟 Tips Pengembangan

### Prisma

- **Generate Schema**: Selalu jalankan setelah mengubah `schema.prisma`:
  
  ```bash
  pnpm prisma generate
  ```

### Code Sharing

- **Manfaatkan `libs`**: Simpan kode yang dapat digunakan ulang seperti:
  - DTOs (Data Transfer Objects)
  - Guards
  - Middleware
  - Upload strategies
  Ini menjaga kode tetap modular dan menghindari duplikasi.

### Dokumentasi API

- **Swagger**: Hanya akses melalui Gateway (`/docs`). Pastikan gateway berjalan terlebih dahulu.

### Manajemen Permission

- **Membuat Permission Baru**: Tambahkan permission di controller menggunakan decorator `@Permission`:

  ```typescript
  import { Permission } from '@libs/common/src';

  @Permission('CREATE_DATA', 'Roles', 'Create Role')
  async createData() {}
  ```

  **Parameter Decorator**:
  1. **Nama Permission** (contoh: `CREATE_DATA`)
  2. **Nama Module** (contoh: `Roles`)
  3. **Deskripsi Permission** (contoh: `Create Role`)

  Untuk sync dengan database:

  ```bash
  pnpm gen:permissions
  ```

  > ℹ️ Ini hanya scan layanan `backoffice` secara default. Untuk layanan lain, tambahkan script custom di `package.json`.

### Audit Trail

1. **Import Module**

   ```ts
   import { AuditTrailModule } from '@libs/audit-trail';

   @Module({
     imports: [AuditTrailModule],
   })
   export class AppModule {}
   ```

2. **Apply Middleware** (untuk route UPDATE/DELETE)

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

3. **Apply Interceptor & Decorator di Controller**

   ```ts
   import {
     AuditTrailInterceptor,
     Audit,
     AuditAction,
   } from '@libs/audit-trail';
   ```

   Gunakan pada method controller:

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

### Tips Tambahan

- **Konsistensi Penamaan**: Jaga nama permission dan module tetap konsisten di seluruh codebase.
- **Komentar Kode**: Tambahkan komentar untuk logic yang kompleks guna memudahkan maintenance.
- **Testing**: Tulis unit test untuk setiap module untuk memastikan fungsionalitas.
- **Environment Variables**: Simpan config sensitif di `.env`; hindari hardcode.
- **File Upload**: Gunakan nama field yang sesuai dalam multipart form (contoh: `photo` untuk gambar user).

---

## 🛠️ Troubleshooting

- **Prisma Generate Gagal**: Periksa `DATABASE_URL` dan validitas schema Prisma.
- **Konflik Port**: Pastikan setiap layanan memiliki port unik di `.env`-nya.
- **Swagger Hilang**: Jalankan gateway dan verifikasi endpoint `/docs-json` untuk setiap layanan.
- **Error Permission**: Pastikan `@Permission` import dari `@libs/common/src`.
- **Masalah Elasticsearch Logging**: Verifikasi `ELASTICSEARCH_URL` dan pastikan Elasticsearch dapat dijangkau.
- **Masalah File Upload**: 
  - Periksa `STORAGE_PROVIDER` sudah diset dengan benar di `.env`
  - Verifikasi credential cloud provider valid
  - Pastikan format dan ukuran file memenuhi persyaratan validasi
  - Periksa konfigurasi multer dan nama field sesuai dengan frontend
