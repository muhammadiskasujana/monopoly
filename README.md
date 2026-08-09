# Monopoly Digital — Self-hosted

Aplikasi pendamping papan Monopoly fisik. Saldo, bank, transaksi, properti, rumah, hotel, sewa, kartu, dan panel admin berjalan dari web dan tersinkron antarpemain.

Fitur tambahan:

- Layout papan 16 petak mengikuti konfigurasi admin dan dapat diunduh sebagai PNG resolusi tinggi.
- QR pembayaran internal sungguhan dengan nominal permintaan opsional.
- Scan QR memakai kamera HP; penerima dan nominal terisi otomatis lalu dikonfirmasi sebelum saldo berpindah.

## Menjalankan dengan Docker (disarankan)

Persyaratan: Docker Engine dan Docker Compose.

```bash
cp .env.example .env
```

Ubah `POSTGRES_PASSWORD` di `.env`, lalu jalankan:

```bash
docker compose up -d --build
docker compose logs -f app
```

Aplikasi tersedia di `http://IP-SERVER:3000`. Tabel database dibuat otomatis saat request pertama.

Contoh `.env` untuk Docker Compose:

```env
POSTGRES_PASSWORD=password-kuat-dan-unik
APP_PORT=3000
```

## Deployment di Coolify

1. Push folder ini ke GitHub/GitLab.
2. Di Coolify pilih **New Resource → Docker Compose** dan hubungkan repo.
3. Tambahkan environment `POSTGRES_PASSWORD` dengan nilai yang kuat.
4. Arahkan domain ke service `app` port `3000`.
5. Deploy. Jangan expose service PostgreSQL ke internet.

Pemindaian kamera membutuhkan HTTPS (atau `localhost` saat pengembangan). Pastikan domain Coolify sudah memiliki SSL aktif; browser biasanya menolak akses kamera melalui alamat HTTP biasa.

## Menjalankan tanpa Docker

Gunakan Node.js 22+ dan PostgreSQL 15+.

```bash
npm ci
cp .env.example .env
npm run build
npm start
```

Pastikan `DATABASE_URL` mengarah ke database PostgreSQL yang dapat diakses aplikasi.

## Backup dan restore

```bash
docker compose exec -T postgres pg_dump -U monopoly monopoly > monopoly-backup.sql
docker compose exec -T postgres psql -U monopoly monopoly < monopoly-backup.sql
```

## Catatan produksi

- Gunakan HTTPS melalui reverse proxy/Coolify.
- Ganti password bawaan sebelum deploy.
- Backup volume `monopoly_postgres` secara berkala.
- QR pada aplikasi adalah identitas pembayaran internal permainan, bukan QRIS dan bukan uang asli.
