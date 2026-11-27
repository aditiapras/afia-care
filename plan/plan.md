# Rencana Teknis: Aplikasi Absensi Klinik

Status: DRAFT untuk review. Belum ada kode yang ditulis.

> **Baca bersama `architecture-review.md`.** Dokumen itu adalah review arsitektur atas plan ini dan **menggantikan** beberapa bagian di sini:
> - §2 dan §6.3 (model `attendances`) diganti oleh ADR-2: append-only event log + projection harian.
> - §4 (QR HMAC stateless) diganti oleh ADR-1: token berbasis nonce tersimpan + query reaktif.
> - §6.1 (resolusi jadwal) **mengandung bug precedence**, lihat koreksi di §E.1.
> - §6.3 (cron 15 menit) diganti oleh ADR-3: `scheduler.runAt` per-record + cron jaring pengaman.
> - §3 (sesi tunggal) perlu dibatasi ke role `user` dan mematikan cookie cache, lihat §I-5.
> - §13 (tahapan) diganti oleh §M yang menambahkan Fase 0 (spike) dan Fase 1 tanpa UI.

## 0. Ringkasan Keputusan

| Aspek | Keputusan |
|---|---|
| Stack | Next.js (App Router) + Convex + better-auth (`@convex-dev/better-auth`) |
| Operasional | Jam klinik 07:00-22:00. Check-in paling awal 60 menit sebelum shift |
| QR | HMAC, window 30 detik, tampil di kiosk. Satu lokasi |
| Status khusus | `no_access_out` (tidak check-out), `no_access_in` (hanya check-out) |
| Sesi | Satu sesi aktif per akun, revoke sesi lama saat login baru |
| Zona waktu | Disimpan sebagai UTC, dihitung dalam `Asia/Jakarta` |
| Karyawan | 15 orang, jam dan hari kerja berbeda-beda, bisa di-assign per user |
| Role | `admin`, `user`, `kiosk` |

## 1. Arsitektur

```
[Kiosk /kiosk] --polling--> Convex (action generateQr)
[HP karyawan /scan] --token+GPS--> Convex mutation checkIn/checkOut
[Admin /admin] <--realtime query-- Convex
Convex cron: finalizeAttendance (status akhir)
```

- Semua aturan bisnis ada di Convex (validasi token, geofence, jendela waktu, otorisasi). Next.js hanya UI dan route guard.
- Rahasia (`QR_SECRET`) hanya ada di env Convex.

## 2. Skema Data Convex

- **`profiles`**: `authUserId, name, role ('admin'|'user'|'kiosk'), position, isActive`
- **`settings`** (satu dokumen): `lat, lng, radiusMeters, maxAccuracyMeters, timezone, checkInEarlyMin=60, lateToleranceMin, checkOutGraceMin, qrIntervalSec=30`
- **`shifts`**: `name, startMin, endMin, crossesMidnight, isActive`
  - Jam disimpan sebagai menit dari 00:00 (integer).
  - Contoh: Pagi 07:00-14:00, Siang 14:00-22:00, Full 07:00-22:00.
- **`weeklySchedules`**: `userId, dayOfWeek(0-6), shiftId, effectiveFrom, effectiveTo?` (pola tetap)
- **`scheduleOverrides`**: `userId, date('YYYY-MM-DD'), shiftId | null` (shift bergilir, tukar shift, libur khusus; `null` = libur)
- **`holidays`**: `date, name`
- **`attendances`**: `userId, date, shiftSnapshot{name,startMin,endMin}, checkInAt?, checkOutAt?, checkInGeo?, checkOutGeo?, status, flags[], source('qr'|'manual'), adjustedBy?`
  - Index `by_user_date` (unik secara logika) dan `by_date`.
- **`permits`**: `userId, type('sakit'|'izin'|'cuti'), startDate, endDate, workDays, reason, attachmentId?, status('pending'|'approved'|'rejected'|'cancelled'), reviewedBy, reviewedAt, reviewNote`
- **`leaveBalances`**: `userId, year, total, used`
- **`auditLogs`**: `actorId, action, targetType, targetId, before, after, at`
- **`scanEvents`** (retensi singkat): log percobaan ditolak (token kedaluwarsa, di luar radius) untuk deteksi anomali.

## 3. Autentikasi dan Sesi Tunggal

- Integrasi `@convex-dev/better-auth`. Role disimpan di satu sumber kebenaran saja (plugin `admin` better-auth atau tabel `profiles`).
- **Sesi tunggal:** better-auth tidak punya opsi bawaan. Implementasi lewat `databaseHooks.session.create.after` yang menghapus semua sesi lain milik user (setara `revokeOtherSessions`). Login di HP baru menendang HP lama.
- **Batasan:** ini bukan device binding. Password yang dibagikan tetap bisa dipakai untuk login dan menendang pemilik asli. Mitigasi:
  - Simpan `userAgent` dan IP sesi, tampilkan di admin.
  - Catat pergantian sesi di `auditLogs`.
  - Notifikasi "akun Anda login di perangkat lain" ke sesi lama.
  - Opsional lanjutan: device ID (localStorage/cookie) dengan persetujuan admin saat ganti perangkat.
- **Kiosk:** akun role `kiosk` dengan hak hanya untuk meminta QR. Karena sesi tunggal, hanya satu perangkat kiosk per akun.
- **Otorisasi:** helper `requireUser`, `requireAdmin`, `requireKiosk` di setiap fungsi Convex. Tidak ada query yang menerima `userId` dari client; selalu ambil dari identitas sesi.

## 4. QR Dinamis (30 detik)

- `window = floor(nowMs / 30000)`, `token = base64url(HMAC_SHA256(QR_SECRET, "qr:" + window))`.
- Convex **action** `kiosk.getQr` mengembalikan `{token, expiresAt}`. Kiosk refresh tepat di batas window (berdasarkan `expiresAt`).
- Validasi di mutation: terima window saat ini dan sebelumnya (toleransi jaringan). Pakai perbandingan constant-time.
- Tanpa penyimpanan token. Anti-replay lewat idempotensi `(userId, tanggal, tipe)`.
- QR berisi URL `https://<domain>/scan?t=<token>` agar kamera bawaan HP bisa dipakai, dengan alternatif scanner di dalam aplikasi.
- Kiosk: Wake Lock API, layar penuh, indikator "terputus" bila polling gagal. Window dihitung dari jam server.

## 5. Geofence

- Client: `navigator.geolocation.getCurrentPosition` dengan `enableHighAccuracy: true`, mengirim `{lat, lng, accuracy}` bersama token.
- Server: Haversine ke titik klinik; tolak jika `distance > radius` atau `accuracy > maxAccuracyMeters` (default 50 m).
- UI: tangani izin ditolak, HTTPS wajib, timeout GPS, indikator "mencari lokasi".
- Flag anomali (tidak menolak): akurasi tidak wajar, lompatan lokasi antar-scan. Ditinjau admin.
- Catatan: spoofing GPS di web tidak bisa dicegah 100%. QR di kiosk fisik + geofence + sesi tunggal menyulitkan penyalahgunaan.

## 6. Mesin Aturan Absensi

### 6.1 Resolusi jadwal `resolveShift(userId, date)`
1. Cek `scheduleOverrides` untuk tanggal itu (`null` = libur).
2. Jika tidak ada, cek `weeklySchedules` aktif untuk `dayOfWeek`.
3. Cek `holidays`; jika libur dan tidak ada override eksplisit, anggap libur.
4. Jika tidak ada jadwal, "tidak terjadwal".

### 6.2 Jendela waktu
- **Check-in:** `shiftStart - 60 menit` sampai `shiftEnd`. Di luar itu ditolak dengan pesan jelas.
- **Check-out:** `shiftStart` sampai `shiftEnd + checkOutGraceMin`. Check-out sebelum shift selesai diterima dengan flag `early_leave`.
- **Telat:** `checkInAt > shiftStart + lateToleranceMin` menjadi flag `late`.
- Tanggal absensi mengikuti tanggal mulai shift. Karena klinik 07:00-22:00, shift lintas tengah malam tidak diprioritaskan (kolom disiapkan saja).

### 6.3 Status akhir

| Kondisi | Status |
|---|---|
| Ada check-in dan check-out | `present` (flag `late` bila telat) |
| Check-in, tanpa check-out setelah batas akhir | `no_access_out` |
| Check-out, tanpa check-in | `no_access_in` |
| Tidak ada keduanya, tanpa permit disetujui | `absent` |
| Permit disetujui | `sick` / `excused` / `leave` |
| Tidak terjadwal | tidak ada record |

- `checkOut` harus boleh dilakukan tanpa check-in: membuat record dengan `checkInAt = null` dan status `no_access_in`.
- `status` utama dipisah dari `flags[]` (`late`, `early_leave`, anomali) agar kombinasi tidak kehilangan informasi.
- **Finalisasi:** Convex cron tiap 15 menit menetapkan status akhir untuk shift yang sudah melewati `shiftEnd + grace`. Harus idempoten. Sebelumnya status bersifat sementara.
- Koreksi manual admin selalu mengisi `adjustedBy` dan menulis `auditLogs`.

## 7. Work Permit

- Pengajuan: tipe, rentang tanggal, alasan, lampiran (Convex File Storage, validasi tipe dan ukuran).
- `workDays` dihitung hanya dari hari terjadwal (resolusi jadwal + libur).
- Validasi: tidak tumpang tindih dengan permit `pending`/`approved` lain; cuti butuh `saldo >= workDays`.
- Saat disetujui: untuk cuti, `leaveBalances.used += workDays` dalam transaksi yang sama.
- Pembatalan atau penolakan setelah disetujui mengembalikan saldo.
- Jika ada absensi di hari yang sudah punya permit disetujui, tampilkan sebagai konflik untuk admin, jangan menimpa diam-diam.
- Permit lintas tahun memecah pengurangan saldo per tahun.

## 8. Fitur Admin

- CRUD karyawan, role, aktif/nonaktif, reset sesi.
- CRUD shift dan penugasan pola mingguan. Grid kalender bulanan (karyawan x tanggal) untuk shift bergilir, dengan salin dari bulan lalu.
- Pengaturan klinik: koordinat, radius, toleransi, grace.
- Antrean persetujuan permit dan pengelolaan saldo cuti.
- Dashboard hari ini real-time (hadir, belum hadir, telat, `no_access_*`); koreksi absensi manual dengan audit.
- Rekap bulanan per karyawan dan ekspor CSV/XLSX.

## 9. Struktur Frontend (Next.js)

```
/login
/(user)/scan  /history  /permits  /permits/new  /profile
/(admin)/admin/dashboard  /employees  /shifts  /schedules  /permits  /attendance  /reports  /settings
/kiosk
```

- Route guard via middleware (hanya untuk UX). Keamanan tetap di Convex.
- Library: `convex`, `@convex-dev/better-auth`, `better-auth`, `date-fns` + `date-fns-tz`, `zod`, shadcn/ui + Tailwind, `@yudiel/react-qr-scanner` (opsional), `qrcode.react`.
- Mobile-first untuk sisi user; pertimbangkan PWA.

## 10. Keamanan dan Ketahanan

- Rate limit pada `checkIn`/`checkOut` dan login (`@convex-dev/rate-limiter`).
- Validator Convex untuk semua argumen; waktu selalu dari server.
- Rotasi `QR_SECRET` dengan dukungan dua secret sementara.
- Lampiran permit hanya dapat diakses pemilik dan admin.
- Retensi `scanEvents` 30-90 hari.
- Data lokasi dan kesehatan: akses minimum dan kebijakan privasi.

## 11. Pengujian

- **Unit (vitest + `convex-test`):** HMAC window dan toleransi, Haversine, resolusi jadwal, jendela check-in/out, status akhir, `workDays`, saldo cuti.
- **Kasus tepi:** check-in pukul 06:00 vs 05:59, token di batas window, dua scan bersamaan, permit lintas akhir pekan dan tahun, jadwal diedit setelah absensi (snapshot harus tetap).
- **E2E (Playwright):** login, scan (geolocation dipalsukan), pengajuan dan persetujuan permit.
- **Manual lapangan:** akurasi GPS di dalam gedung, ketahanan kiosk sehari penuh.

## 12. Asumsi (mohon dikoreksi saat review)

1. `lateToleranceMin` default 10 menit (dapat diubah).
2. `checkOutGraceMin` default 120 menit setelah shift berakhir; setelah itu tanpa check-out menjadi `no_access_out`.
3. Check-out tanpa check-in diizinkan (untuk `no_access_in`).
4. Saldo cuti diisi admin per karyawan per tahun, tanpa akrual otomatis.
5. Zona waktu `Asia/Jakarta`.
6. Sakit dan izin tidak memotong saldo cuti.
7. "Satu akun satu device" diwujudkan lewat sesi tunggal saja, tanpa device binding.

## 13. Tahapan Implementasi

| Fase | Isi | Hasil |
|---|---|---|
| 1 | Setup Next.js, Convex, better-auth, role, sesi tunggal, helper otorisasi | Login berfungsi, role terjaga |
| 2 | Skema, `settings`, shift, jadwal mingguan dan override, UI admin | Jadwal dapat diatur |
| 3 | Kiosk QR, `checkIn`/`checkOut`, geofence, jendela waktu | Absensi inti berjalan |
| 4 | Cron finalisasi, status `no_access_*`, dashboard hari ini, koreksi manual + audit | Siklus absensi lengkap |
| 5 | Permit, lampiran, saldo cuti, persetujuan | Fitur izin lengkap |
| 6 | Rekap, ekspor, rate limit, PWA, hardening, pengujian | Siap produksi |

## 14. Pertanyaan Terbuka

- Apakah sesi tunggal saja cukup, atau perlu device binding dengan persetujuan admin?
- Apakah asumsi di bagian 12 sudah sesuai kebijakan klinik?
- Apakah ada aturan lembur atau hitungan jam kerja (bukan hanya hadir/tidak) untuk rekap?
