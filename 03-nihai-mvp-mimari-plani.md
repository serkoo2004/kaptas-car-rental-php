# Nihai MVP Mimari Plani

Bu dokuman, ilk faz icin kesinlestirilecek Web + Admin Panel MVP kapsamini tarif eder. Mobil uygulama ilk surumde gelistirilmeyecek; ancak API, veritabani, rol/yetki sistemi, bildirim, cihaz ve aktivite mimarisi ileride Flutter mobil uygulamasini destekleyecek sekilde tasarlanacaktir.

Marka adi ve logo kesinlesmedigi icin tasarim sistemi marka bagimsiz kurulacaktir. Gecici marka adi olarak `FleetCore` kullanilir. Logo placeholder olacaktir. Renk, typography ve component token yapisi ileride marka degisiminden minimum etkilenmelidir.

## 1. Nihai MVP Kapsami

MVP'nin amaci calisan bir urun cikarmak, satis/teklif/operasyon sureclerini dogrulamak ve daha sonra ayni API altyapisini mobil uygulamaya acmaktir.

### 1.1 Public Web

MVP'de olacak sayfalar:

- Ana sayfa
- Araclar listeleme sayfasi
- Arac detay sayfasi
- Teklif alma akisi
- Maliyet hesaplayici
- Hizmet sayfalari
- Blog listeleme
- Blog detay
- SSS
- Login
- Register
- Sifre sifirlama
- Email dogrulama altyapisi

MVP'de olacak web ozellikleri:

- Arac arama ve filtreleme
- Arac favorileme
- Arac karsilastirma
- Cok adimli teklif formu
- KVKK ve ticari ileti onay kaydi
- Kullanici kaydi ve girisi
- Google ve Apple OAuth icin hazir auth mimarisi
- SEO metadata
- Sitemap ve robots altyapisi
- OpenGraph altyapisi
- Responsive tasarim hedefi

### 1.2 Kullanici Paneli

MVP'de olacak ekranlar:

- Dashboard
- Basvurularim
- Tekliflerim
- Favori araclar
- Karsilastirmalar
- Belgelerim
- Profil
- Firma bilgileri
- Bildirimler

MVP'de olacak islevler:

- Basvuru durum takibi
- Teklif durum takibi
- Belge yukleme
- Eksik belge uyarisi
- Profil ve firma bilgisi guncelleme
- Bildirim listesi

### 1.3 Admin Panel

MVP'de olacak moduller:

- Admin dashboard
- Basvuru / lead yonetimi
- Teklif yonetimi
- Arac yonetimi
- Marka ve model yonetimi
- Paket ve fiyat yonetimi
- Kullanici yonetimi
- Firma yonetimi
- Belge onay sistemi
- Customer Activity sistemi
- Blog ve hizmet sayfasi yonetimi
- SSS yonetimi
- Notification kayitlari
- Rol ve yetki yonetimi
- Sistem ayarlari
- Audit log

### 1.4 Operasyonel MVP

MVP'de operasyon sadece admin panel ve kullanici paneli seviyesinde tutulur.

Olacaklar:

- Basvuru durumlari
- Teklif hazirlama
- Belge talebi ve belge onayi
- Musteri aktivite takibi
- Satis temsilcisi atama
- Admin notlari
- Durum gecmisi

## 2. MVP Disi Ozellikler

Bu ozellikler mimaride hazir tutulur ancak ilk fazda gelistirilmez:

- Flutter mobil uygulama
- Mobil uygulama ekranlari
- Push notification gonderimi
- Firebase entegrasyonu
- Teslim ve iade saha operasyonu
- Imza alma
- GPS konumu zorunlulugu
- Mobil fotograf cekimi
- PDF teslim tutanagi
- Gercek odeme entegrasyonu
- iyzico / PayTR canli odeme
- Kapora tahsilati
- Gelismis analitik paneli
- Telematik entegrasyon
- HGS/OGS entegrasyonu
- SMS entegrasyonu
- E-fatura entegrasyonu
- CRM dis sistem entegrasyonu
- Coklu sube/tenant mimarisi
- Cok dilli public web

## 3. Tam Prisma Schema Taslagi

Bu schema taslagi kod uretimi veya migration degildir. Veritabani modelini kesinlestirmek icin referans olarak kullanilir.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  CORPORATE_USER
  DRIVER
  SALES_REP
  OPERATIONS_STAFF
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  PASSIVE
  SUSPENDED
  PENDING_VERIFICATION
}

enum CompanyType {
  INDIVIDUAL
  SOLE_PROPRIETORSHIP
  SME
  CORPORATE
}

enum FuelType {
  GASOLINE
  DIESEL
  HYBRID
  ELECTRIC
}

enum TransmissionType {
  MANUAL
  AUTOMATIC
}

enum VehicleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum DeliveryStatus {
  IN_STOCK
  LIMITED_STOCK
  ORDER_ONLY
  SOON
}

enum QuoteStatus {
  RECEIVED
  REVIEWING
  WAITING_DOCUMENTS
  PREPARING_OFFER
  OFFER_SENT
  REVISION_REQUESTED
  APPROVED
  REJECTED
  CONTRACT_STAGE
  DELIVERY_PLANNED
  COMPLETED
  CANCELLED
}

enum DocumentStatus {
  REQUESTED
  UPLOADED
  APPROVED
  REJECTED
  EXPIRED
}

enum NotificationStatus {
  DRAFT
  SCHEDULED
  SENT
  FAILED
}

enum ActivityType {
  PAGE_VIEW
  VEHICLE_VIEW
  VEHICLE_FAVORITE
  VEHICLE_COMPARE
  QUOTE_STARTED
  QUOTE_SUBMITTED
  QUOTE_ABANDONED
  OFFER_VIEWED
  DOCUMENT_UPLOADED
  LOGIN
  LOGOUT
  ADMIN_NOTE_ADDED
  STATUS_CHANGED
}

enum PaymentStatus {
  PENDING
  AUTHORIZED
  PAID
  FAILED
  CANCELLED
  REFUNDED
}

model User {
  id                 String              @id @default(cuid())
  name               String?
  email              String              @unique
  emailVerified      DateTime?
  passwordHash       String?
  phone              String?
  role               UserRole            @default(USER)
  status             UserStatus          @default(PENDING_VERIFICATION)
  companyId          String?
  avatarUrl          String?
  lastLoginAt        DateTime?
  failedLoginCount   Int                 @default(0)
  lockedUntil        DateTime?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  company            Company?            @relation(fields: [companyId], references: [id])
  accounts           Account[]
  sessions           Session[]
  deviceSessions     DeviceSession[]
  consentRecords     ConsentRecord[]
  quoteRequests      QuoteRequest[]      @relation("QuoteRequester")
  assignedLeads      QuoteRequest[]      @relation("AssignedSalesRep")
  favoriteVehicles   FavoriteVehicle[]
  compareLists       CompareList[]
  documents          Document[]
  notifications      Notification[]      @relation("NotificationCreator")
  activities         CustomerActivity[]
  adminNotes         AdminNote[]
  auditLogs          AuditLog[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Company {
  id             String        @id @default(cuid())
  name           String
  taxNumber      String?
  taxOffice      String?
  companyType    CompanyType   @default(SME)
  sector         String?
  employeeCount  Int?
  fleetSize      Int?
  address        String?
  city           String?
  district       String?
  phone          String?
  email          String?
  status         UserStatus    @default(ACTIVE)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  users          User[]
  drivers        Driver[]
  quoteRequests  QuoteRequest[]
  documents      Document[]
}

model Driver {
  id          String    @id @default(cuid())
  companyId   String
  userId      String?
  name        String
  phone       String?
  email       String?
  licenseNo   String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  company     Company   @relation(fields: [companyId], references: [id])
}

model DeviceSession {
  id          String   @id @default(cuid())
  userId      String
  platform    String
  deviceName  String?
  deviceId    String?
  ipAddress   String?
  userAgent   String?
  lastSeenAt  DateTime @default(now())
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ConsentRecord {
  id          String   @id @default(cuid())
  userId      String?
  email       String?
  type        String
  version     String
  acceptedAt  DateTime @default(now())
  ipAddress   String?
  userAgent   String?

  user        User?    @relation(fields: [userId], references: [id])
}

model Permission {
  id          String   @id @default(cuid())
  key         String   @unique
  label       String
  group       String
  createdAt   DateTime @default(now())

  roleLinks   RolePermission[]
}

model RolePermission {
  id            String     @id @default(cuid())
  role          UserRole
  permissionId  String
  allowed       Boolean    @default(true)

  permission    Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([role, permissionId])
}

model VehicleBrand {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  logoUrl     String?
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  models      VehicleModel[]
  vehicles    Vehicle[]
}

model VehicleModel {
  id          String       @id @default(cuid())
  brandId     String
  name        String
  slug        String
  segment     String?
  bodyType    String?
  isActive    Boolean      @default(true)

  brand       VehicleBrand @relation(fields: [brandId], references: [id])
  vehicles    Vehicle[]

  @@unique([brandId, slug])
}

model Vehicle {
  id                 String             @id @default(cuid())
  brandId            String
  modelId            String
  title              String
  slug               String             @unique
  year               Int?
  fuelType           FuelType
  transmission       TransmissionType
  bodyType           String?
  segment            String?
  enginePower        String?
  batteryRange       String?
  consumption        String?
  monthlyPriceFrom   Decimal?           @db.Decimal(12, 2)
  deliveryStatus     DeliveryStatus     @default(ORDER_ONLY)
  stockCount         Int                @default(0)
  status             VehicleStatus      @default(DRAFT)
  isFeatured         Boolean            @default(false)
  isPublishedWeb     Boolean            @default(false)
  isPublishedMobile  Boolean            @default(false)
  seoTitle           String?
  seoDescription     String?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  brand              VehicleBrand       @relation(fields: [brandId], references: [id])
  model              VehicleModel       @relation(fields: [modelId], references: [id])
  images             VehicleImage[]
  packages           VehiclePackage[]
  features           VehicleFeature[]
  quoteItems         QuoteRequestItem[]
  favorites          FavoriteVehicle[]
  activities         CustomerActivity[]
}

model VehicleImage {
  id          String   @id @default(cuid())
  vehicleId   String
  url         String
  alt         String?
  sortOrder   Int      @default(0)
  isCover     Boolean  @default(false)
  createdAt   DateTime @default(now())

  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
}

model VehicleFeature {
  id          String   @id @default(cuid())
  vehicleId   String
  label       String
  value       String
  group       String?
  sortOrder   Int      @default(0)

  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
}

model VehiclePackage {
  id                String   @id @default(cuid())
  vehicleId          String
  name              String?
  durationMonths    Int
  annualKm          Int
  monthlyPrice      Decimal  @db.Decimal(12, 2)
  depositAmount     Decimal? @db.Decimal(12, 2)
  includedServices  Json
  optionalServices  Json?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  vehicle           Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
}

model FavoriteVehicle {
  id          String   @id @default(cuid())
  userId      String
  vehicleId   String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@unique([userId, vehicleId])
}

model CompareList {
  id          String            @id @default(cuid())
  userId      String?
  sessionId   String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User?             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       CompareListItem[]
}

model CompareListItem {
  id            String      @id @default(cuid())
  compareListId  String
  vehicleId      String
  createdAt      DateTime    @default(now())

  compareList    CompareList @relation(fields: [compareListId], references: [id], onDelete: Cascade)
}

model QuoteRequest {
  id                   String               @id @default(cuid())
  userId               String?
  companyId            String?
  userType             CompanyType
  status               QuoteStatus          @default(RECEIVED)
  source               String               @default("web")
  contactName          String
  contactEmail         String
  contactPhone         String?
  companyName          String?
  note                 String?              @db.Text
  kvkkAcceptedAt       DateTime?
  commercialConsentAt  DateTime?
  assignedSalesRepId   String?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt

  requester            User?                @relation("QuoteRequester", fields: [userId], references: [id])
  company              Company?             @relation(fields: [companyId], references: [id])
  assignedSalesRep     User?                @relation("AssignedSalesRep", fields: [assignedSalesRepId], references: [id])
  items                QuoteRequestItem[]
  offers               QuoteOffer[]
  statusHistory        QuoteStatusHistory[]
  notes                AdminNote[]
  documents            Document[]
}

model QuoteRequestItem {
  id                 String        @id @default(cuid())
  quoteRequestId      String
  vehicleId           String?
  brandText           String?
  modelText           String?
  quantity            Int           @default(1)
  durationMonths      Int?
  annualKm            Int?
  requestedServices   Json?

  quoteRequest        QuoteRequest  @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)
  vehicle             Vehicle?      @relation(fields: [vehicleId], references: [id])
}

model QuoteOffer {
  id             String       @id @default(cuid())
  quoteRequestId  String
  title          String
  totalMonthly   Decimal?     @db.Decimal(12, 2)
  currency       String       @default("TRY")
  pdfUrl         String?
  validUntil     DateTime?
  status         String       @default("DRAFT")
  createdById    String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  quoteRequest   QuoteRequest @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)
  items          QuoteOfferItem[]
}

model QuoteOfferItem {
  id             String      @id @default(cuid())
  quoteOfferId    String
  vehicleTitle    String
  quantity        Int         @default(1)
  durationMonths  Int
  annualKm        Int
  monthlyPrice    Decimal     @db.Decimal(12, 2)
  services        Json?

  quoteOffer      QuoteOffer  @relation(fields: [quoteOfferId], references: [id], onDelete: Cascade)
}

model QuoteStatusHistory {
  id              String       @id @default(cuid())
  quoteRequestId   String
  fromStatus       QuoteStatus?
  toStatus         QuoteStatus
  changedById      String?
  note             String?
  createdAt        DateTime     @default(now())

  quoteRequest     QuoteRequest @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)
}

model LeadAssignment {
  id              String   @id @default(cuid())
  quoteRequestId   String
  salesRepId       String
  assignedById     String?
  note             String?
  createdAt        DateTime @default(now())
}

model AdminNote {
  id              String        @id @default(cuid())
  quoteRequestId   String?
  userId           String?
  authorId         String
  body             String        @db.Text
  isInternal       Boolean       @default(true)
  createdAt        DateTime      @default(now())

  quoteRequest     QuoteRequest? @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)
  author           User          @relation(fields: [authorId], references: [id])
}

model Document {
  id              String          @id @default(cuid())
  userId          String?
  companyId       String?
  quoteRequestId  String?
  type            String
  title           String
  fileUrl         String
  fileName        String?
  mimeType        String?
  size            Int?
  status          DocumentStatus  @default(UPLOADED)
  rejectionReason String?
  reviewedById    String?
  reviewedAt      DateTime?
  expiresAt       DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user            User?           @relation(fields: [userId], references: [id])
  company         Company?        @relation(fields: [companyId], references: [id])
  quoteRequest    QuoteRequest?   @relation(fields: [quoteRequestId], references: [id])
}

model CustomerActivity {
  id              String        @id @default(cuid())
  userId          String?
  anonymousId     String?
  vehicleId       String?
  quoteRequestId  String?
  type            ActivityType
  path            String?
  referrer        String?
  metadata        Json?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime      @default(now())

  user            User?         @relation(fields: [userId], references: [id])
  vehicle         Vehicle?      @relation(fields: [vehicleId], references: [id])
}

model Notification {
  id              String             @id @default(cuid())
  title           String
  message         String             @db.Text
  imageUrl        String?
  type            String
  targetType      String
  targetRole      UserRole?
  targetCompanyId String?
  targetUserId    String?
  platform        String             @default("web")
  deepLink        String?
  scheduledAt     DateTime?
  sentAt          DateTime?
  status          NotificationStatus @default(DRAFT)
  createdById     String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  createdBy       User?              @relation("NotificationCreator", fields: [createdById], references: [id])
  deliveries      NotificationDelivery[]
}

model NotificationDelivery {
  id              String       @id @default(cuid())
  notificationId  String
  userId          String?
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  status          String       @default("PENDING")

  notification    Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
}

model PushToken {
  id          String   @id @default(cuid())
  userId      String?
  token       String   @unique
  platform    String
  deviceId    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BlogCategory {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  posts       BlogPost[]
}

model BlogPost {
  id              String        @id @default(cuid())
  categoryId      String?
  title           String
  slug            String        @unique
  excerpt         String?
  content         String        @db.Text
  coverImageUrl   String?
  readingMinutes  Int?
  isPublished     Boolean       @default(false)
  publishedAt     DateTime?
  seoTitle        String?
  seoDescription  String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  category        BlogCategory? @relation(fields: [categoryId], references: [id])
}

model FAQ {
  id          String   @id @default(cuid())
  question    String
  answer      String   @db.Text
  group       String?
  sortOrder   Int      @default(0)
  isPublished Boolean  @default(true)
}

model ServicePage {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  excerpt         String?
  content         String   @db.Text
  heroImageUrl    String?
  isPublished     Boolean  @default(false)
  seoTitle        String?
  seoDescription  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PaymentIntent {
  id             String        @id @default(cuid())
  userId         String?
  quoteRequestId String?
  provider       String?
  amount         Decimal       @db.Decimal(12, 2)
  currency       String        @default("TRY")
  status         PaymentStatus @default(PENDING)
  providerRef    String?
  metadata       Json?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model PricingRule {
  id               String   @id @default(cuid())
  name             String
  vehicleId         String?
  brandId           String?
  segment           String?
  durationMonths    Int?
  annualKm          Int?
  multiplier        Decimal? @db.Decimal(8, 4)
  fixedAmount       Decimal? @db.Decimal(12, 2)
  isActive          Boolean  @default(true)
  startsAt          DateTime?
  endsAt            DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       Json
  group       String?
  updatedById String?
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(cuid())
  actorId     String?
  action      String
  entityType  String
  entityId    String?
  before      Json?
  after       Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  actor       User?    @relation(fields: [actorId], references: [id])
}
```

## 4. API Endpoint Mimarisi

API mimarisi mobil uygulama tarafindan da kullanilabilecek sekilde kaynak odakli ve versiyonlanabilir tasarlanir. Public web icin server actions kullanilsa bile kritik veri akislari API servis katmanina baglanmalidir.

Onerilen prefix:

- Web/Admin: `/api`
- Mobil uyumlu versiyonlu API: `/api/v1`

### 4.1 Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `GET /api/auth/me`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:id`

### 4.2 Vehicles

- `GET /api/v1/vehicles`
- `GET /api/v1/vehicles/:slug`
- `GET /api/v1/vehicle-brands`
- `GET /api/v1/vehicle-models`
- `POST /api/v1/vehicles/:id/favorite`
- `DELETE /api/v1/vehicles/:id/favorite`
- `POST /api/v1/compare/items`
- `DELETE /api/v1/compare/items/:id`
- `GET /api/v1/compare`

### 4.3 Quotes

- `POST /api/v1/quotes`
- `GET /api/v1/quotes`
- `GET /api/v1/quotes/:id`
- `POST /api/v1/quotes/:id/documents`
- `POST /api/v1/quotes/:id/revision-request`
- `POST /api/v1/quotes/:id/approve`

### 4.4 User Dashboard

- `GET /api/v1/dashboard`
- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `GET /api/v1/company`
- `PATCH /api/v1/company`
- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

### 4.5 Pricing

- `POST /api/v1/pricing/calculate`
- `POST /api/v1/pricing/compare-buy-vs-lease`

### 4.6 Customer Activity

- `POST /api/v1/activity`
- `POST /api/v1/activity/batch`

### 4.7 Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/leads`
- `GET /api/admin/leads/:id`
- `PATCH /api/admin/leads/:id/status`
- `PATCH /api/admin/leads/:id/assign`
- `POST /api/admin/leads/:id/notes`
- `GET /api/admin/offers`
- `POST /api/admin/offers`
- `PATCH /api/admin/offers/:id`
- `POST /api/admin/offers/:id/send`
- `GET /api/admin/vehicles`
- `POST /api/admin/vehicles`
- `PATCH /api/admin/vehicles/:id`
- `DELETE /api/admin/vehicles/:id`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/companies`
- `PATCH /api/admin/companies/:id`
- `GET /api/admin/documents`
- `PATCH /api/admin/documents/:id/approve`
- `PATCH /api/admin/documents/:id/reject`
- `GET /api/admin/activity`
- `GET /api/admin/blog-posts`
- `POST /api/admin/blog-posts`
- `PATCH /api/admin/blog-posts/:id`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings/:key`
- `GET /api/admin/audit-logs`

## 5. Admin Panel Ekran Detaylari

### 5.1 Dashboard

Amac: adminin gunluk isi tek ekranda gormesi.

Bloklar:

- Yeni basvurular
- Bekleyen teklifler
- Evrak bekleyen basvurular
- Bugun takip edilecek leadler
- Son musteri aktiviteleri
- Kritik sistem uyarilari

### 5.2 Lead Listesi

Kolonlar:

- Basvuru no
- Musteri / firma
- Kullanici tipi
- Talep edilen arac/adet
- Durum
- Atanan satis temsilcisi
- Kaynak
- Son aktivite
- Olusturma tarihi

Filtreler:

- Durum
- Kullanici tipi
- Satis temsilcisi
- Tarih araligi
- Kaynak
- Eksik evrak var/yok

### 5.3 Lead Detay

Sekmeler:

- Ozet
- Arac ihtiyaci
- Teklifler
- Belgeler
- Aktivite
- Notlar
- Durum gecmisi

Hizli aksiyonlar:

- Temsilci ata
- Durum degistir
- Teklif olustur
- Evrak iste
- Not ekle
- Kullanici paneline bildirim gonder

### 5.4 Teklif Yonetimi

Ekranlar:

- Teklif listesi
- Teklif olusturma
- Teklif detay
- Teklif revizyonu

Teklif olusturma alanlari:

- Basvuru secimi
- Arac secimi
- Paket secimi
- Sure
- Km
- Dahil hizmetler
- Ek hizmetler
- Aylik fiyat
- Gecerlilik tarihi
- Admin notu
- Kullaniciya acik not

### 5.5 Arac Yonetimi

Ekranlar:

- Arac listesi
- Arac olusturma
- Arac duzenleme
- Marka/model yonetimi
- Paket yonetimi

Arac formu:

- Temel bilgiler
- Teknik ozellikler
- Fiyat baslangici
- Paketler
- Gorseller
- SEO
- Yayin ayarlari

### 5.6 Belge Onay Ekrani

Kolonlar:

- Belge adi
- Belge tipi
- Kullanici
- Firma
- Ilgili basvuru
- Durum
- Yukleme tarihi
- Son islem yapan admin

Aksiyonlar:

- Goruntule
- Onayla
- Reddet
- Red nedeni yaz
- Yeni belge iste

### 5.7 Customer Activity Ekrani

Gorulecekler:

- Kullanici timeline
- Inceledigi araclar
- Favoriye aldigi araclar
- Karsilastirdigi araclar
- Basladigi ama tamamlamadigi teklifler
- Actigi teklifler
- Yukledigi belgeler
- Son giris bilgileri

Admin faydasi:

- Satis temsilcisi musteri niyetini gorur.
- Terk edilen teklif formlari takip edilir.
- En cok ilgi goren araclar raporlanir.

## 6. Pricing Engine

Pricing Engine ilk fazda teklif ve hesaplayici icin basit ama genisletilebilir olmalidir.

### 6.1 Amac

- Arac paket fiyatlarini standart hesaplamak
- Sure ve km secimine gore fiyat uretmek
- Ek hizmetlerin etkisini hesaplamak
- Maliyet hesaplayici sonucunu uretmek
- Adminin fiyatlari manuel revize edebilmesine izin vermek

### 6.2 Girdiler

- vehicleId
- durationMonths
- annualKm
- quantity
- baseMonthlyPrice
- selectedServices
- companyType
- riskSegment
- campaignCode
- depositRequested

### 6.3 Ciktilar

- monthlyPrice
- totalContractValue
- depositAmount
- includedServices
- optionalServiceBreakdown
- discountAmount
- taxEstimate
- finalMonthlyEstimate
- calculationNotes

### 6.4 Kural Sirasi

1. Arac baz fiyatini bul.
2. Sure katsayisini uygula.
3. Km katsayisini uygula.
4. Adet indirimi varsa uygula.
5. Ek hizmetleri ekle.
6. Kampanya veya manuel indirim uygula.
7. Risk veya onay notlarini ekle.
8. Admin revizyonuna izin ver.

### 6.5 MVP Siniri

MVP'de fiyat motoru kesin muhasebe sistemi degil, teklif tahmini ve satis operasyonu destek aracidir. Nihai teklif admin tarafindan onaylanir.

## 7. Belge Onay Sistemi

### 7.1 Belge Tipleri

- Vergi levhasi
- Imza sirkuleri
- Ticaret sicil gazetesi
- Faaliyet belgesi
- Kimlik
- Ehliyet
- Finansal belge
- Sozlesme
- Teklif PDF

### 7.2 Durumlar

- Requested
- Uploaded
- Approved
- Rejected
- Expired

### 7.3 Akis

1. Admin veya sistem belge talep eder.
2. Kullanici panelde eksik belgeyi gorur.
3. Kullanici belge yukler.
4. Admin belgeyi inceler.
5. Admin onaylar veya red nedeni yazar.
6. Kullaniciya bildirim olusur.
7. Audit log kaydi tutulur.

### 7.4 Guvenlik

- Dosya tipi kontrolu
- Dosya boyutu limiti
- Private storage
- Signed URL ile goruntuleme
- Admin yetki kontrolu
- Belge erisim logu

## 8. Customer Activity Sistemi

### 8.1 Amac

Customer Activity sistemi, satis ekibinin musteri niyetini anlamasini ve terk edilen akislarin takip edilmesini saglar.

### 8.2 Izlenecek Olaylar

- Sayfa goruntuleme
- Arac goruntuleme
- Favoriye ekleme
- Karsilastirmaya ekleme
- Teklif formuna baslama
- Teklif formunu terk etme
- Teklif gonderme
- Teklifi goruntuleme
- Belge yukleme
- Login
- Profil guncelleme

### 8.3 Veri Prensibi

- KVKK uyumlu tutulur.
- Gereksiz kisisel veri toplanmaz.
- AnonymousId ile girissiz aktivite takip edilir.
- Login sonrasi anonymous aktivite kullaniciya baglanabilir.
- Admin panelde sadece operasyonel faydasi olan bilgiler gosterilir.

## 9. Rol ve Yetki Matrisi

| Modul / Islem | USER | CORPORATE_USER | DRIVER | SALES_REP | OPERATIONS_STAFF | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public araclari goruntule | Evet | Evet | Evet | Evet | Evet | Evet | Evet |
| Teklif talebi olustur | Evet | Evet | Hayir | Evet | Hayir | Evet | Evet |
| Kendi basvurularini gor | Evet | Evet | Hayir | Hayir | Hayir | Evet | Evet |
| Firma basvurularini gor | Hayir | Evet | Hayir | Hayir | Hayir | Evet | Evet |
| Belge yukle | Evet | Evet | Evet | Hayir | Hayir | Evet | Evet |
| Admin panele gir | Hayir | Hayir | Hayir | Evet | Evet | Evet | Evet |
| Lead gor | Hayir | Hayir | Hayir | Atanan | Operasyonel | Evet | Evet |
| Lead atama | Hayir | Hayir | Hayir | Hayir | Hayir | Evet | Evet |
| Teklif olustur | Hayir | Hayir | Hayir | Evet | Hayir | Evet | Evet |
| Arac yonet | Hayir | Hayir | Hayir | Hayir | Hayir | Evet | Evet |
| Belge onayla | Hayir | Hayir | Hayir | Evet | Evet | Evet | Evet |
| Blog/hizmet yonet | Hayir | Hayir | Hayir | Hayir | Hayir | Evet | Evet |
| Sistem ayarlari | Hayir | Hayir | Hayir | Hayir | Hayir | Kisitli | Evet |
| Rol/yetki yonet | Hayir | Hayir | Hayir | Hayir | Hayir | Hayir | Evet |
| Audit log gor | Hayir | Hayir | Hayir | Hayir | Hayir | Evet | Evet |

## 10. Dosya Klasor Yapisi

Bu yapi kod yazimina gecildiginde referans alinacaktir.

```text
.
|-- app
|   |-- (public)
|   |   |-- page.tsx
|   |   |-- araclar
|   |   |-- hizmetler
|   |   |-- blog
|   |   `-- maliyet-hesaplayici
|   |-- (auth)
|   |   |-- login
|   |   |-- register
|   |   |-- forgot-password
|   |   `-- verify-email
|   |-- (dashboard)
|   |   |-- panel
|   |   |-- basvurularim
|   |   |-- tekliflerim
|   |   |-- belgelerim
|   |   `-- profil
|   |-- admin
|   |   |-- page.tsx
|   |   |-- basvurular
|   |   |-- teklifler
|   |   |-- araclar
|   |   |-- kullanicilar
|   |   |-- firmalar
|   |   |-- belgeler
|   |   |-- aktiviteler
|   |   |-- icerik
|   |   |-- ayarlar
|   |   `-- audit-log
|   `-- api
|       |-- auth
|       |-- v1
|       `-- admin
|-- components
|   |-- ui
|   |-- layout
|   |-- marketing
|   |-- vehicles
|   |-- quote
|   |-- dashboard
|   `-- admin
|-- lib
|   |-- auth
|   |-- db
|   |-- permissions
|   |-- services
|   |-- pricing
|   |-- activity
|   |-- documents
|   |-- validations
|   `-- utils
|-- prisma
|   |-- schema.prisma
|   `-- seed.ts
|-- public
|   |-- images
|   `-- placeholder-logo.svg
`-- docs
```

## 11. Seed Data

Seed verisi gercekci ama temsili olmalidir.

### 11.1 Kullanicilar

- superadmin@fleetcore.test / Super Admin
- admin@fleetcore.test / Admin
- satis@fleetcore.test / Sales Rep
- operasyon@fleetcore.test / Operations Staff
- musteri@fleetcore.test / Corporate User
- user@fleetcore.test / User

### 11.2 Firmalar

- Atlas Lojistik A.S.
- Nova Teknoloji Ltd.
- Marmara Gida Dagitim
- Eksen Muhendislik

### 11.3 Arac Markalari

- Toyota
- Renault
- Ford
- Volkswagen
- Peugeot
- Mercedes-Benz
- BMW
- Tesla

### 11.4 Araclar

- Toyota Corolla Hybrid
- Renault Megane Sedan
- Ford Focus
- Volkswagen Passat
- Peugeot 3008
- Mercedes-Benz Vito
- Ford Transit Custom
- Tesla Model Y

### 11.5 Paketler

- 24 ay / 20.000 km
- 36 ay / 20.000 km
- 36 ay / 30.000 km
- 48 ay / 30.000 km

### 11.6 Basvuru Ornekleri

- KOBI icin 3 adet sedan talebi
- Kurumsal firma icin 12 adet karma filo talebi
- Sahis sirketi icin 1 adet SUV talebi
- Elektrikli arac donusumu icin 5 adet EV talebi

### 11.7 Blog Kategorileri

- Filo kiralama rehberi
- Operasyonel kiralama
- Elektrikli araclar
- Vergi ve muhasebe
- Bakim, hasar ve lastik
- Sirket araclari

## 12. .env.example

Bu bolum dosya olarak uretilmeyecek; kod fazinda `.env.example` icin referans alinacaktir.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleetcore"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me"

AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_APPLE_ID=""
AUTH_APPLE_SECRET=""

APP_URL="http://localhost:3000"
APP_ENV="development"
APP_BRAND_NAME="FleetCore"

UPLOAD_PROVIDER="local"
UPLOAD_MAX_SIZE_MB="10"
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""

RATE_LIMIT_ENABLED="true"
RATE_LIMIT_REQUESTS="100"
RATE_LIMIT_WINDOW_SECONDS="60"

MAIL_PROVIDER="smtp"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="no-reply@fleetcore.test"

IYZICO_API_KEY=""
IYZICO_SECRET_KEY=""
IYZICO_BASE_URL=""
PAYTR_MERCHANT_ID=""
PAYTR_MERCHANT_KEY=""
PAYTR_MERCHANT_SALT=""
```

## 13. Gelistirme Sirasi

Kod fazinda onerilen sira:

1. Proje kurulumu ve tasarim tokenlari
2. Prisma schema ve seed
3. Auth ve rol altyapisi
4. Public layout, ana sayfa ve arac listeleme
5. Arac detay ve teklif formu
6. Kullanici paneli
7. Admin shell ve dashboard
8. Admin arac/marka/model/paket yonetimi
9. Admin lead ve teklif yonetimi
10. Belge onay sistemi
11. Customer Activity sistemi
12. Blog, hizmet ve SSS yonetimi
13. Pricing Engine
14. SEO, sitemap, robots, OpenGraph
15. Test, performans ve production hazirlik

## 14. Test Senaryolari

### 14.1 Auth

- Kullanici email ile kayit olur.
- KVKK onayi olmadan kayit engellenir.
- Yanlis sifre denemeleri limitlenir.
- Admin olmayan kullanici admin panele giremez.
- Rol degisimi sonrasi yetkiler dogru uygulanir.

### 14.2 Arac Listeleme

- Filtreler dogru sonuc dondurur.
- Bos sonuc ekrani calisir.
- Siralama dogru calisir.
- Favoriye ekleme login gerektirir.
- Karsilastirma limiti uygulanir.

### 14.3 Teklif Akisi

- Cok adimli form tamamlanir.
- Eksik zorunlu alanlar engellenir.
- KVKK onayi kaydedilir.
- Basvuru admin panelde gorunur.
- Kullanici panelinde basvuru durumu gorunur.

### 14.4 Admin

- Admin lead durumunu degistirir.
- Satis temsilcisi atanir.
- Admin notu eklenir.
- Teklif olusturulur.
- Teklif kullanici panelinde gorunur.

### 14.5 Belge Onayi

- Kullanici belge yukler.
- Admin belgeyi onaylar.
- Admin belgeyi red nedeniyle reddeder.
- Belge durumu kullanici panelinde guncellenir.
- Audit log kaydi olusur.

### 14.6 Pricing Engine

- Sure ve km secimine gore fiyat degisir.
- Ek hizmetler fiyata yansir.
- Admin manuel revizyon yapabilir.
- Hesaplayici sonucunda toplam maliyet dogru gosterilir.

### 14.7 Customer Activity

- Arac goruntuleme aktivitesi kaydolur.
- Teklif formu baslama ve tamamlama olaylari kaydolur.
- Anonymous aktivite login sonrasi kullaniciya baglanir.
- Admin panelde aktivite timeline gorunur.

## 15. Production Checklist

### 15.1 Guvenlik

- Production env degerleri girildi.
- NEXTAUTH_SECRET guclu ve benzersiz.
- Admin route protection aktif.
- RBAC test edildi.
- Rate limiting aktif.
- CSRF korumasi aktif.
- Dosya yukleme limitleri aktif.
- Private document erisimi test edildi.
- Audit log kritik islemleri kaydediyor.

### 15.2 Veri

- Prisma migration production icin gozden gecirildi.
- Seed verisi production'a uygun hale getirildi.
- Admin kullanicilari guvenli sifrelerle olusturuldu.
- Yedekleme stratejisi belirlendi.

### 15.3 SEO ve Performans

- Metadata tamamlandi.
- Sitemap calisiyor.
- robots.txt calisiyor.
- OpenGraph gorselleri hazir.
- Image optimization aktif.
- Lighthouse hedefi 90+.
- Mobil responsive kontrol edildi.

### 15.4 Operasyon

- Mail gonderimi test edildi.
- Sifre sifirlama test edildi.
- Belge yukleme test edildi.
- Admin lead akisi test edildi.
- Teklif akisi test edildi.
- Hata loglama aktif.

### 15.5 Deploy

- Vercel environment variables girildi.
- PostgreSQL baglantisi test edildi.
- Build basarili.
- Smoke test tamamlandi.
- Admin ve kullanici test hesaplari kontrol edildi.
- Rollback plani hazir.

## 16. Son Karar

MVP ilk fazda Web + Admin Panel olarak gelistirilecektir. Mobil uygulama kodlanmayacak; ancak veritabani, API, rol sistemi, bildirim kayitlari, cihaz oturumu ve aktivite mimarisi mobil uygulamanin ikinci fazda ayni altyapiyi kullanmasina hazir olacaktir.

Bu dokuman onaylandiktan sonra kod uretimine gecilebilir.
