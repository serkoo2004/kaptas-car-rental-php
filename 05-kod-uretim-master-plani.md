# Kod Uretim Master Plani

Bu dokuman implementasyon fazinin sprint bazli uretim planidir. Analiz fazi tamamlanmistir; bundan sonra kod moduler olarak ilerler.

## Sprint 1: Foundation

Durum: Baslandi.

Kapsam:

- Next.js proje kurulumu
- Klasor yapisi
- Prisma schema
- Auth sistemi omurgasi
- Design token sistemi
- Admin shell
- Public layout

Teslim formatlari:

- Dosya agaci
- Kod
- Aciklama
- Kurulum talimati

## Sprint 2: Public Web

Kapsam:

- Ana sayfa final bolumleri
- Arac listeleme
- Arac detay
- Teklif alma formu
- Maliyet hesaplayici temel ekran
- Hizmet ve blog listeleme temel yapisi

## Sprint 3: Auth + Dashboard

Kapsam:

- Login/register formlari
- Email/sifre auth akisi
- Kullanici paneli shell
- Basvurularim
- Tekliflerim
- Belgelerim
- Profil

## Sprint 4: Admin Lead Management

Kapsam:

- Lead listesi
- Lead detay
- Durum degistirme
- Temsilci atama
- Admin notlari
- Customer Activity timeline

## Sprint 5: Offer Engine

Kapsam:

- Pricing Engine servisleri
- Teklif olusturma ekrani
- Teklif kalemleri
- Admin manuel revizyon
- Kullanici panelinde teklif goruntuleme

## Sprint 6: Document Management

Kapsam:

- Belge yukleme
- Belge onay/red akisi
- Red nedeni
- Belge durumlari
- Audit log baglantisi

## Sprint 7: SEO + Production

Kapsam:

- Metadata
- Sitemap
- robots.txt
- OpenGraph
- Lighthouse iyilestirmeleri
- Production checklist
- Build ve smoke test

## Sprint 1 Dosya Agaci

```text
.
|-- app
|   |-- (public)
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- admin
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- api
|   |   `-- auth
|   |       `-- [...nextauth]
|   |           `-- route.ts
|   |-- globals.css
|   `-- layout.tsx
|-- components
|   |-- admin
|   |-- layout
|   `-- ui
|-- lib
|   |-- auth
|   |-- db
|   |-- permissions
|   |-- validations
|   `-- utils.ts
|-- prisma
|   `-- schema.prisma
|-- types
|   `-- next-auth.d.ts
|-- .env.example
|-- package.json
|-- tailwind.config.ts
|-- tsconfig.json
`-- next.config.ts
```

## Sprint 1 Kurulum Talimati

1. Bagimlilikleri kur:

```bash
npm install
```

2. Ortam degiskenlerini hazirla:

```bash
cp .env.example .env
```

3. PostgreSQL `DATABASE_URL` degerini `.env` icinde guncelle.

4. Prisma client uret:

```bash
npm run prisma:generate
```

5. Schema dogrula:

```bash
npm run prisma:validate
```

6. Gelistirme sunucusunu baslat:

```bash
npm run dev
```
