# 📦 User Management - Monorepo

Monorepo berbasis NestJS yang mengikuti arsitektur layanan mikro, menampilkan RBAC (Kontrol Akses Berbasis Peran) bawaan dan dukungan Jejak Audit, yang terdiri dari:

- **`gateway`**: API Gateway dan aggregator Swagger.
- **`auth-svc`**: Layanan untuk autentikasi dan otorisasi.
- **`backoffice`**: Manajemen pengguna dan data internal.

**Teknologi yang Digunakan**:

- **pnpm** workspace  
- **Prisma** (ORM, di `libs/schema`)  
- **Winston** (+ Elasticsearch integration di gateway)  
- **PM2** / **Docker** (deployment)

---

## 📑 Daftar Isi

- [📦 User Management - Monorepo](#-user-management---monorepo)
  - [📑 Daftar Isi](#-daftar-isi)
  - [📁 Struktur Proyek](#-struktur-proyek)
  - [🔧 Prasyarat](#-prasyarat)
  - [🛠️ Setup](#️-setup)
  - [🚀 Menjalankan Aplikasi](#-menjalankan-aplikasi)
    - [Manual (Tanpa PM2/Docker)](#manual-tanpa-pm2docker)
    - [Dengan PM2 (Dev Environment)](#dengan-pm2-dev-environment)
    - [Dengan Docker Compose (Deploy)](#dengan-docker-compose-deploy)
    - [1. 🧱 Jalankan Database Saja](#1--jalankan-database-saja)
    - [2. 📦 Jalankan Seeder (Sekali Saja)](#2--jalankan-seeder-sekali-saja)
    - [3. 🚀 Jalankan Semua Service (Tanpa Seeder)](#3--jalankan-semua-service-tanpa-seeder)
    - [4. 🛑 Hentikan Semua Service](#4--hentikan-semua-service)
  - [📚 Dokumentasi API](#-dokumentasi-api)
  - [📜 Logging](#-logging)
  - [🧪 Testing](#-testing)
    - [Unit Test per Service](#unit-test-per-service)
  - [📦 Build](#-build)
  - [Build Semua Sekaligus](#build-semua-sekaligus)
  - [🗂️ Konfigurasi Environment](#️-konfigurasi-environment)
  - [🌟 Tips Pengembangan](#-tips-pengembangan)
    - [Prisma](#prisma)
    - [Code Sharing](#code-sharing)
    - [Dokumentasi API](#dokumentasi-api)
    - [Permission Management](#permission-management)
    - [Audit Trail](#audit-trail)
  - [1. Import Module](#1-import-module)
  - [2. Apply Middleware (for UPDATE / DELETE routes) pada module](#2-apply-middleware-for-update--delete-routes-pada-module)
  - [3. Apply Interceptor \& Decorator in Controllers](#3-apply-interceptor--decorator-in-controllers)
    - [Tips Tambahan](#tips-tambahan)
  - [🛠️ Troubleshooting](#️-troubleshooting)

---

## 📁 Struktur Proyek

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

## 🔧 Prasyarat

Pastikan Anda telah menginstal:

- Node.js (v18 atau lebih baru)
- pnpm (v10.12.4)
- Docker dan Docker Compose (untuk deployment lokal)
- Elasticsearch (untuk logging di `gateway`, sesuaikan dengan `ELASTICSEARCH_URL` di `.env`)
- Database (sesuai dengan `DATABASE_URL` di `.env`)
- Elasticsearch (untuk logging di `api-gateway`, sesuaikan dengan `ELASTICSEARCH_URL` di `.env`)

---

## 🛠️ Setup

1. **Install Dependensi**

   ```bash
   pnpm install
   ```

2. **Register existing apps**

   ```bash
   npx nx generate @nx/workspace:convert-to-nx-project --project=api-gateway --project-dir=apps/api-gateway
   npx nx generate @nx/workspace:convert-to-nx-project --project=auth-svc --project-dir=apps/auth-svc
   npx nx generate @nx/workspace:convert-to-nx-project --project=backoffice-svc --project-dir=apps/backoffice-svc
   ```

3. **Generate Prisma Client**
   Jalankan perintah ini setiap kali `schema.prisma` diubah:

   ```bash
   pnpm prisma generate
   pnpm db:migrate
   ```

4. **Generate Permissions**
   Untuk menghasilkan permission baru berdasarkan dekorator:

   ```bash
   pnpm gen:permissions
   ```

5. **Generate User**
   Untuk seed user baru dengan role superadmin yang memiliki semua permission acces:

   ```bash
   pnpm db:user-seed
   
   # username : superadmin
   # password : password123
   ```

---

## 🚀 Menjalankan Aplikasi

### Manual (Tanpa PM2/Docker)

1. **Build semua service**

   ```bash
   pnpm build:all
   ```

2. **Jalankan service terpisah**

   ```bash
   pnpm start:gateway
   pnpm start:auth
   pnpm start:backoffice
   ```

### Dengan PM2 (Dev Environment)

1. **Start PM2**

   ```bash
   pnpm pm2:run
   ```

   Konfigurasi tersimpan di `ecosystem.config.js`.

2. **Lihat Logs**

   ```bash
   pm2 logs
   ```

### Dengan Docker Compose (Deploy)

### 1. 🧱 Jalankan Database Saja

```bash
docker-compose up -d db
```

Ini akan menjalankan service `db` (PostgreSQL) di background.

### 2. 📦 Jalankan Seeder (Sekali Saja)

```bash
docker-compose --profile seeder run --rm seeder
```

Seeder akan:

- Generate Prisma Client
- Deploy migration database
- Menjalankan seed data awal :
  - username: superadmin
  - password: password123

### 3. 🚀 Jalankan Semua Service (Tanpa Seeder)

```bash
docker-compose up -d
```

Ini akan menjalankan semua service kecuali `seeder`.

### 4. 🛑 Hentikan Semua Service

```bash
docker-compose down
```

> 📝 **Catatan:**
> Jangan lupa untuk menyalin `.env-example` menjadi `.env` di root dan setiap service sebelum menjalankan langkah-langkah di atas.

---

## 📚 Dokumentasi API

Akses Swagger di Gateway setelah aplikasi berjalan:

```bash
http://localhost:3000/docs
```

Swagger menggabungkan dokumentasi dari:

- `/docs-json/auth` (Auth Service)
- `/docs-json/backoffice` (Backoffice Service)

Contoh endpoint:

```bash
GET /auth/login
GET /backoffice/users
```

---

## 📜 Logging

Logging diimplementasikan menggunakan **Winston** pada service `gateway` dengan integrasi ke **Elasticsearch** untuk analisis log di lingkungan produksi. Fitur utama:

- Log disimpan dalam format JSON untuk memudahkan parsing dan pencarian di Elasticsearch.
- Output log tersedia di console (untuk dev) dan dikirim ke Elasticsearch saat deploy.
- Konfigurasi logger dapat disesuaikan di `libs/logger/src/winston.config.ts`.

**Variabel Environment untuk Logging** (tambahkan di `.env` pada `gateway`):

| Variabel | Deskripsi |
|-----------------------|--------------------------------------------------------|
| `ELASTICSEARCH_URL` | URL untuk koneksi ke Elasticsearch (contoh: `http://localhost:9200`) |
| `ES_USERNAME` | Untuk username ECS |
| `ES_PASSWORD` | Untuk password ECS |

**Contoh Konfigurasi**:

```plaintext
ELASTICSEARCH_URL=http://localhost:9200
ES_USERNAME=elastic
ES_PASSWORD=changeme
```

> 📌 Pastikan Elasticsearch berjalan dan dapat diakses melalui `ELASTICSEARCH_URL` sebelum menjalankan `gateway`.

---

## 🧪 Testing

### Unit Test per Service

```bash
pnpm test:auth
pnpm test:backoffice
pnpm test:gateway
```

---

## 📦 Build

Build setiap service untuk produksi:

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

Setiap service wajib memiliki file environment di direktori masing-masing:

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

**File `.env-example`** di root dan tiap service berisi daftar variabel yang perlu diisi, contoh:

```env
# .env-example
PORT=3000
DATABASE_URL=
JWT_SECRET=
SERVICE_INTERNAL_KEY=
ELASTICSEARCH_URL=
```

**Jangan lupa** load environment variables pada setiap service sebelum menjalankan aplikasi:

```bash
# di tiap service
cp .env-example .env
# kemudian edit .env sesuai kebutuhan
```

---

## 🌟 Tips Pengembangan

### Prisma

- **Generate Schema**: Selalu jalankan perintah berikut setelah mengubah `schema.prisma`:
  
  ```bash
  pnpm prisma generate
  ```

### Code Sharing

- **Manfaatkan `libs`**: Simpan kode yang dapat digunakan ulang di `libs`, seperti:
  - DTO (Data Transfer Objects)
  - Guards
  - Middleware
    Ini menjaga kode tetap modular dan mencegah duplikasi.

### Dokumentasi API

- **Swagger**: Akses dokumentasi API hanya melalui Gateway (`/docs`). Pastikan Gateway berjalan terlebih dahulu.

### Permission Management

- **Membuat Permission Baru**: Tambahkan permission di controller dengan dekorator `@Permission`:

  ```typescript
  import { Permission } from '@libs/common/src';

  @Permission('CREATE_DATA', 'Roles', 'Create Role')
  async createData() {}
  ```

  **Penjelasan Parameter**:
  1. **Nama Permission**: Nama unik untuk permission (contoh: `CREATE_DATA`).
  2. **Nama Modul**: Nama modul terkait (contoh: `Roles`).
  3. **Deskripsi Permission**: Deskripsi singkat untuk permission (contoh: `Create Role`).
  4. **Sinkronisasi ke Database**: Jalankan perintah berikut untuk memindai dekorator `@Permission` dan menyimpan permission ke database agar dapat diassign ke role:

     ```bash
     pnpm gen:permissions
     ```

     > ℹ️ Perintah `pnpm gen:permissions` hanya memindai dekorator `@Permission` di service `backoffice`. Untuk service lain, tambahkan perintah khusus di `package.json`.

### Audit Trail

## 1. Import Module

```ts
// In AppModule or feature module
import { AuditTrailModule } from "@libs/audit-trail";

@Module({
  imports: [AuditTrailModule],
})
export class AppModule {}
```

## 2. Apply Middleware (for UPDATE / DELETE routes) pada module

Supaya dapet `oldData` sebelum update/delete, apply middleware ini di Module:

```ts
import { 
  MiddlewareConsumer, 
  Module, 
  NestModule, 
  RequestMethod 
} from '@nestjs/common';
import {
  AuditTrailService,
  createFetchOldEntityMiddleware,
} from '@libs/audit-trail';

@Module({
  providers: [AuditTrailService],
})
export class ProductModule {
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

## 3. Apply Interceptor & Decorator in Controllers

Import interceptor & decorator di atas file controller:

```ts
import {
  AuditTrailInterceptor,
  Audit,
  AuditAction,
} from '@libs/audit-trail';
```

Lalu pake di controller dan method-method:

```ts
@UseInterceptors(AuditTrailInterceptor)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // GET all items
  @Get()
  @Audit({ entity: 'Product', action: AuditAction.GET })
  async findAll() {
    return this.productService.findAll();
  }

  // GET detail
  @Get(':id')
  @Audit({
    entity: 'Product',
    action: AuditAction.SHOW,
    getEntityId: (args) => args[0]?.id,

  })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // POST create
  @Post()
  @Audit({
    entity: 'Product',
    action: AuditAction.CREATE,
    getChanges: (_, res) => ({ before: null, after: res }),
  })
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  // PATCH update
  @Patch(':id')
  @Audit({
    entity: 'Product',
    action: AuditAction.UPDATE,
    getEntityId: (args) => args[0]?.id,
    getChanges: (args, result) => ({
      before: args[1]?.oldData,
      after: result,
    }),
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  // DELETE item
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

- **Konsistensi Penamaan**: Gunakan penamaan yang konsisten untuk permission dan modul agar mudah dipahami tim.
- **Dokumentasi Kode**: Tambahkan komentar pada kode yang kompleks untuk mempermudah pemeliharaan.
- **Testing**: Tulis unit test untuk kode di setiap `module` untuk memastikan fungsionalitas terjaga.
- **Environment Variables**: Simpan konfigurasi sensitif di `.env` dan hindari hardcoding.

---

## 🛠️ Troubleshooting

- **Prisma Gagal Generate**: Periksa koneksi database di `DATABASE_URL` dan pastikan schema valid.
- **Port Conflict**: Pastikan port di `.env` tidak bentrok antar-service.
- **Swagger Tidak Muncul**: Pastikan Gateway berjalan dan endpoint `/docs-json` dari setiap service dapat diakses.
- **Permission Error**: Verifikasi bahwa dekorator `@Permission` menggunakan import dari `@libs/common/src`.
- **Logging Tidak Muncul di Elasticsearch**: Periksa variabel `ELASTICSEARCH_URL`, serta pastikan Elasticsearch berjalan dan dapat diakses.

---
