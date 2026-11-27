# Architecture Review + Technical Design Addendum

Dokumen ini mereview `plan.md` secara kritis lalu menggantikan bagian-bagian yang kurang presisi dengan spesifikasi teknis yang bisa langsung diimplementasikan.

Catatan untuk pembaca: beberapa temuan di bawah adalah koreksi atas kesalahan di `plan.md` itu sendiri. Bagian yang terkoreksi ditandai `SUPERSEDES plan.md §x`.

---

## A. Ringkasan Temuan

Severity: **S1** = cacat desain, harus diperbaiki sebelum coding. **S2** = akan menimbulkan bug atau rework. **S3** = perbaikan kualitas.

| # | Sev | Area | Temuan |
|---|---|---|---|
| 1 | S1 | QR | Token = `HMAC(secret, window)` saja. Token identik untuk semua orang, tidak terikat kiosk, tidak bisa dicabut, dan bisa di-broadcast ke grup WhatsApp. 30 detik cukup untuk 15 orang. |
| 2 | S1 | QR | Token diverifikasi di **action**, penulisan absensi di **mutation**. Action tidak transaksional, jadi ada celah TOCTOU dan tidak ada atomicity antara validasi dan tulis. |
| 3 | S1 | Absensi | Model `checkInAt`/`checkOutAt` satu pasang per hari tidak bisa merepresentasikan punch ganda, koreksi admin yang auditable, dan sulit di-reconcile. |
| 4 | S1 | Jadwal | Algoritma `resolveShift` di §6.1 salah: step 2 sudah `return` sebelum step 3 (holiday) dievaluasi, jadi precedence yang ditulis tidak pernah terjadi. |
| 5 | S1 | Auth | Sesi tunggal diterapkan ke semua role. Admin akan menendang dirinya sendiri saat buka HP, dan kiosk bisa tertendang. Harus dibatasi ke role `user`. |
| 6 | S1 | Auth | better-auth `session.cookieCache` membuat sesi yang sudah dicabut tetap dianggap valid sampai TTL cache habis. Tanpa dimatikan, "tendang perangkat lama" tidak langsung berlaku. |
| 7 | S2 | Convex | Rencana memakai cron polling tiap 15 menit. Convex punya `ctx.scheduler.runAt` yang durable; finalisasi per-record jauh lebih presisi dan tanpa scan tabel. |
| 8 | S2 | Convex | `Date.now()` di dalam **query** merusak caching/reaktivitas. Status "sedang bekerja" tidak boleh dihitung di query. |
| 9 | S2 | Convex | Convex tidak punya unique constraint. "Unik secara logika" perlu dijelaskan mengapa aman (OCC) dan bagaimana caranya. |
| 10 | S2 | Data | Tidak ada inventaris index. Ini penyebab nomor satu masalah performa dan `TOO_MANY_READS` di Convex. |
| 11 | S2 | Data | Materialisasi tidak didefinisikan: siapa yang membuat row untuk hari `absent`? Laporan jadi ambigu antara "tidak ada data" dan "tidak hadir". |
| 12 | S2 | Permit | `workDays` dihitung saat submit, padahal jadwal bisa berubah sebelum approval. Harus dihitung ulang saat approve. |
| 13 | S2 | Permit | Approve permit untuk tanggal lampau yang sudah difinalisasi `absent` tidak punya jalur re-finalisasi. |
| 14 | S2 | Waktu | Konversi `startMin` (waktu sipil) ke instant UTC tidak dispesifikasi. Cron Convex berjalan dalam UTC, mudah salah 7 jam. |
| 15 | S2 | Jadwal | `weeklySchedules` dengan `effectiveFrom/To` tidak punya aturan anti-overlap. Dua row aktif untuk `(user, dow)` yang sama menghasilkan hasil nondeterministik. |
| 16 | S2 | Produk | Tidak ada `workedMinutes`, `lateMinutes`, `breakMinutes`. Rekap klinik 15 jam/hari hampir pasti butuh jam kerja, bukan hanya hadir/tidak. |
| 17 | S2 | Produk | Tidak ada izin setengah hari atau per jam. Di klinik ini kasus yang sangat umum. |
| 18 | S2 | Ops | Tidak ada bootstrap admin pertama, backup, strategi migrasi schema, period locking. |
| 19 | S3 | Error | Tidak ada kontrak error. UI akan string-matching pesan error. |
| 20 | S3 | Security | Token di query string `?t=` masuk ke history browser dan header Referer. |

---

## B. Keputusan Arsitektur (ADR singkat)

### ADR-1: Token QR berbasis nonce tersimpan, bukan HMAC waktu murni
`SUPERSEDES plan.md §4`

**Tolak** HMAC stateless. Alasannya bukan kriptografi, tapi operasional: tidak bisa dicabut, tidak terikat kiosk, tidak bisa dideteksi penyalahgunaannya, dan tidak bisa dibatasi jumlah pemakaian.

**Terima** desain berikut:

```
kioskSessions:  { kioskId, label, isActive, lastSeenAt }
kioskTokens:    { kioskId, nonce (32 byte base64url), issuedAt, expiresAt, useCount, revokedAt? }
```

- Mutation `kiosk.rotateToken` dipanggil kiosk setiap 30 detik. Menulis `kioskTokens` baru, menandai yang lama `revokedAt`, dan menghapus token > 5 menit.
- Kiosk **tidak polling**. Kiosk `useQuery(kiosk.currentToken)` dan Convex mem-push token baru secara reaktif. Ini menghapus seluruh kelas bug polling.
- Validasi check-in adalah `db.query("kioskTokens").withIndex("by_nonce")` di dalam **mutation yang sama** dengan penulisan absensi. Atomic, tanpa action, tanpa TOCTOU. Menyelesaikan temuan #2.
- `useCount` di-increment setiap pemakaian. Ini sinyal anti-fraud gratis (lihat §H).

Biaya: ~2.880 mutation/hari untuk rotasi. Tidak signifikan.

Jika tetap ingin stateless, minimum yang harus ditambahkan: `kioskId` dan `jti` acak di dalam payload, plus tabel pemakaian nonce. Pada titik itu desainnya sudah tidak stateless lagi, jadi lebih baik langsung pakai ADR-1.

**Konsekuensi penting:** karena tidak lagi butuh HMAC di jalur kritis, tidak ada dependensi `crypto.subtle` (async, dan ketersediaannya di runtime Convex perlu diverifikasi) maupun library hash tambahan. Nonce dibuat dengan `crypto.getRandomValues` di dalam mutation.

### ADR-2: Append-only event log + projection harian
`SUPERSEDES plan.md §2 (attendances), §6.3`

Tabel harian yang di-update in-place kehilangan jejak dan tidak bisa menampung punch ganda. Gunakan dua tabel:

```
attendanceEvents  (append-only, immutable)
  userId, kind: 'in' | 'out', at (ms UTC), dayKey,
  source: 'qr' | 'manual' | 'system',
  geo?: { lat, lng, accuracy }, tokenNonce?, deviceHash?,
  createdBy, note?, voidedBy?, voidedAt?, voidReason?

attendanceDays    (projection, boleh di-recompute kapan saja)
  userId, dayKey, scheduled: boolean,
  shiftSnapshot?: { shiftId, name, startMin, endMin, breakMinutes },
  firstInAt?, lastOutAt?, pairs: number,
  workedMinutes, lateMinutes, earlyLeaveMinutes, overtimeMinutes,
  status, flags[], permitId?,
  state: 'open' | 'finalized' | 'locked',
  finalizedAt?, recomputedAt?
```

Aturan: event **tidak pernah di-update atau dihapus**. Koreksi admin = menulis event baru `source:'manual'`, atau mem-void event lama dengan `voidedBy` (void adalah satu-satunya pengecualian mutasi, dan itu sendiri tercatat). `attendanceDays` adalah fungsi murni dari `(events, schedule, permits, settings)` sehingga selalu bisa dibangun ulang — properti ini sangat berharga saat ada bug logika di produksi.

Keuntungan lain: `no_access_in` / `no_access_out` jadi hasil alami dari pairing event, bukan status yang ditulis ad-hoc dari dua tempat berbeda.

### ADR-3: Finalisasi dengan scheduler per-record, cron hanya jaring pengaman
`SUPERSEDES plan.md §6.3 (cron 15 menit)`

- Saat event `in` pertama di suatu `dayKey` ditulis, mutation memanggil `ctx.scheduler.runAt(shiftEndInstant + graceMs, internal.attendance.finalizeDay, { userId, dayKey })`. Simpan `scheduledFinalizeId` agar bisa di-cancel/re-schedule bila jadwal diubah.
- `finalizeDay` **idempoten** dan selalu menghitung dari nol.
- Cron harian `01:00` waktu klinik: finalisasi semua `(user, dayKey)` terjadwal yang masih `open` untuk 3 hari terakhir. Ini menangkap hari tanpa event sama sekali (`absent`), job yang hilang saat deployment, dan backfill.
- Tersedia mutation admin `refinalize(range)` untuk recompute manual.

**Gotcha:** cron Convex dijadwalkan dalam **UTC**. "01:00 Asia/Jakarta" = `18:00` UTC hari sebelumnya. Tulis ini sebagai komentar di `crons.ts`, karena ini kesalahan yang akan terjadi.

### ADR-4: Role sebagai sumber kebenaran di Convex
better-auth hanya untuk identitas (kredensial, sesi). Otorisasi memakai `profiles.role` di Convex. Alasan: setiap fungsi Convex butuh role; menariknya dari tabel komponen better-auth setiap pemanggilan menambah coupling ke API komponen yang masih berubah-ubah. `profiles.authUserId` adalah satu-satunya titik sambung.

### ADR-5: Fail-closed saat offline
Tidak ada antrean absensi offline. Token terikat waktu, jadi mengantre justru merusak jaminan keamanannya. UI harus eksplisit: "Tidak ada koneksi, absen tidak tercatat. Hubungi admin." Lebih baik satu koreksi manual daripada mekanisme antrean yang bisa disalahgunakan.

---

## C. Skema Lengkap + Inventaris Index

Semua enum memakai `v.union(v.literal(...))`, bukan `v.string()`. Semua fungsi memakai `args` **dan** `returns` validator.

```ts
// convex/schema.ts (ringkas, tipe konseptual)

profiles: {
  authUserId: string,          // dari better-auth
  name: string,
  employeeCode: string,
  position: string,
  role: 'admin' | 'user' | 'kiosk',
  isActive: boolean,
  joinedAt: number,
  deactivatedAt?: number,
}
  .index('by_auth', ['authUserId'])
  .index('by_active_role', ['isActive', 'role'])
  .index('by_code', ['employeeCode'])

settings: {                    // dokumen tunggal, key: 'global'
  key: 'global',
  lat: number, lng: number,
  radiusMeters: number,        // default 75
  maxAccuracyMeters: number,   // default 50
  timezone: string,            // 'Asia/Jakarta'
  tzOffsetMinutes: number,     // 420 — lihat §F
  checkInEarlyMin: number,     // 60
  lateToleranceMin: number,    // 10
  checkOutGraceMin: number,    // 120
  qrIntervalSec: number,       // 30
  qrSkewSec: number,           // 10
  minShiftMinutes: number,     // anti double-tap, mis. 5
}
  .index('by_key', ['key'])

shifts: {
  name: string,
  startMin: number,            // 0..1439
  endMin: number,
  breakMinutes: number,        // dikurangkan dari workedMinutes
  crossesMidnight: boolean,
  isActive: boolean,
}
  .index('by_active', ['isActive'])

weeklySchedules: {
  userId: Id<'profiles'>,
  dayOfWeek: number,           // 0=Minggu
  shiftId: Id<'shifts'> | null,// null = libur eksplisit
  effectiveFrom: string,       // 'YYYY-MM-DD'
  effectiveTo: string | null,
}
  .index('by_user_dow_from', ['userId', 'dayOfWeek', 'effectiveFrom'])
  .index('by_user', ['userId'])

scheduleOverrides: {
  userId: Id<'profiles'>,
  dayKey: string,
  shiftId: Id<'shifts'> | null,
  reason?: string,
  createdBy: Id<'profiles'>,
}
  .index('by_user_day', ['userId', 'dayKey'])
  .index('by_day', ['dayKey'])

holidays: { dayKey: string, name: string }
  .index('by_day', ['dayKey'])

attendanceEvents: { /* lihat ADR-2 */ }
  .index('by_user_day', ['userId', 'dayKey'])
  .index('by_day', ['dayKey'])
  .index('by_nonce', ['tokenNonce'])
  .index('by_user_at', ['userId', 'at'])

attendanceDays: { /* lihat ADR-2 */ }
  .index('by_user_day', ['userId', 'dayKey'])
  .index('by_day_status', ['dayKey', 'status'])
  .index('by_state_day', ['state', 'dayKey'])   // dipakai jaring pengaman cron

kioskSessions: { kioskId: string, label: string, isActive: boolean, lastSeenAt: number }
  .index('by_kiosk', ['kioskId'])

kioskTokens: { kioskId, nonce, issuedAt, expiresAt, useCount, revokedAt? }
  .index('by_nonce', ['nonce'])
  .index('by_kiosk_issued', ['kioskId', 'issuedAt'])
  .index('by_expires', ['expiresAt'])          // untuk cleanup

permits: {
  userId, type: 'sakit' | 'izin' | 'cuti',
  startDay: string, endDay: string,
  portion: 'full' | 'half',                    // lihat §I-17
  workDays: number,                            // boleh 0.5
  reason: string,
  attachmentId?: Id<'_storage'>,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  submittedAt, reviewedBy?, reviewedAt?, reviewNote?,
  balanceApplied: Array<{ year: number, days: number }>,  // untuk reversal akurat
}
  .index('by_user_status', ['userId', 'status'])
  .index('by_status_submitted', ['status', 'submittedAt'])
  .index('by_user_start', ['userId', 'startDay'])

leaveBalances: { userId, year, totalDays, usedDays }
  .index('by_user_year', ['userId', 'year'])

auditLogs: { actorId, action, targetTable, targetId, before?, after?, at, ip?, userAgent? }
  .index('by_at', ['at'])
  .index('by_target', ['targetTable', 'targetId'])
  .index('by_actor_at', ['actorId', 'at'])

scanRejections: { userId?, kioskId?, reasonCode, at, geo?, tokenNonce?, userAgent? }
  .index('by_at', ['at'])
  .index('by_user_at', ['userId', 'at'])

periodLocks: { year, month, lockedBy, lockedAt }   // lihat §I-18
  .index('by_period', ['year', 'month'])
```

**Aturan index:** setiap `db.query` wajib `withIndex`. Larang `.filter()` pada tabel yang tumbuh (`attendanceEvents`, `auditLogs`, `scanRejections`). Jadikan ini item checklist code review.

**Kapasitas:** 15 karyawan × ~4 event/hari × 365 = ~22k event/tahun. Batas baca per transaksi Convex ada di orde 16k dokumen / 8 MiB (verifikasi angka pastinya di dokumen limits saat implementasi). Artinya laporan tahunan **sudah mendekati batas pada tahun kedua**. Karena itu laporan wajib memakai `paginate()` atau dibatasi per bulan sejak awal, bukan "nanti kalau perlu".

---

## D. Kontrak Fungsi Convex

Konvensi: `query` tidak boleh punya efek samping dan tidak boleh bergantung pada waktu sekarang. `mutation` adalah satu-satunya tempat keputusan berbasis waktu. `action` hanya untuk I/O eksternal (ekspor file, email).

```
// publik — user
q  attendance.myToday()                      -> { day, events, schedule }   // tanpa Date.now()
q  attendance.myHistory({ month, cursor })    -> paginated<AttendanceDay>
q  schedule.mySchedule({ month })             -> ResolvedDay[]
m  attendance.punch({ nonce, kind, geo })     -> PunchResult               // satu pintu untuk in & out
q  permits.mine({ status?, cursor })          -> paginated<Permit>
m  permits.submit({...})                      -> Id<'permits'>
m  permits.cancel({ permitId })               -> void
a  files.uploadUrl()                          -> string

// publik — kiosk
q  kiosk.currentToken()                       -> { nonce, expiresAt, serverNow }
m  kiosk.rotateToken()                        -> { nonce, expiresAt, serverNow }
m  kiosk.heartbeat()                          -> void

// publik — admin
q  admin.dashboardToday()                     -> ringkasan + daftar per karyawan
m  admin.employees.upsert / deactivate
m  admin.shifts.upsert
m  admin.schedule.setWeekly / setOverride / bulkSetMonth
m  admin.attendance.addManualEvent / voidEvent / refinalize
m  admin.permits.review({ permitId, decision, note })
m  admin.leave.setBalance
m  admin.settings.update
m  admin.period.lock / unlock
q  admin.reports.monthly({ year, month, cursor })
q  admin.fraud.signals({ dayKey })
a  admin.reports.exportCsv({ year, month })   -> storageId

// internal
im attendance.finalizeDay({ userId, dayKey })
im attendance.safetyNetFinalize({ fromDay, toDay })
im kiosk.cleanupTokens()
im retention.pruneScanRejections()
```

Satu mutation `punch` dengan parameter `kind` lebih baik daripada `checkIn`/`checkOut` terpisah: validasi token, geofence, jendela waktu, dan rate limit identik; hanya aturan pairing yang berbeda. Mengurangi duplikasi aturan keamanan, yang merupakan tempat paling berbahaya untuk duplikasi.

---

## E. Algoritma Inti

### E.1 `resolveDay(userId, dayKey)` — precedence yang benar
`SUPERSEDES plan.md §6.1`

Evaluasi berurutan, berhenti pada kecocokan pertama:

| Prioritas | Sumber | Hasil |
|---|---|---|
| 1 | `scheduleOverrides` ada untuk `(userId, dayKey)` | `shiftId` atau libur bila `null` |
| 2 | `holidays` ada untuk `dayKey` | libur |
| 3 | `weeklySchedules` aktif untuk `(userId, dow)` | `shiftId` atau libur bila `null` |
| 4 | tidak ada | tidak terjadwal |

Override **mengalahkan** hari libur — itulah gunanya, misalnya klinik buka saat libur nasional. Pada plan versi awal urutan ini tidak mungkin tercapai karena step weekly sudah mengembalikan nilai lebih dulu.

Pemilihan baris weekly aktif: `effectiveFrom <= dayKey AND (effectiveTo IS NULL OR dayKey <= effectiveTo)`. Jika lebih dari satu baris cocok, **menangkan `effectiveFrom` terbesar** dan tulis `scanRejections`-style warning ke log. Selain itu, `setWeekly` harus menutup baris sebelumnya (`effectiveTo = hari sebelum`) daripada membiarkan dua baris terbuka. Ini mengubah anti-overlap dari masalah query menjadi invariant penulisan. Menyelesaikan temuan #15.

### E.2 `punch` — urutan validasi

Urutan ini disengaja: yang murah dan tidak membocorkan informasi lebih dulu.

```
1. identitas    -> requireUser(); profile.isActive
2. rate limit   -> @convex-dev/rate-limiter, key=userId, mis. 10/menit
3. token        -> by_nonce; ada? belum revoked? now <= expiresAt + qrSkewSec?
                   kiosk aktif?
4. geofence     -> accuracy <= maxAccuracy; haversine <= radius
5. dayKey       -> dari waktu server + tzOffset (§F), BUKAN dari client
6. jadwal       -> resolveDay(); kalau tidak terjadwal -> butuh flag khusus
7. jendela      -> in : [start-60m, end]      out: [start, end+grace]
8. pairing      -> kind='in'  : tidak boleh ada 'in' yang belum ada 'out'
                   kind='out' : boleh tanpa 'in' -> hasilkan flag NO_ACCESS_IN
                   jarak dari event terakhir >= minShiftMinutes
9. permit       -> ada permit approved di hari ini? tulis flag PERMIT_CONFLICT
10. tulis       -> insert attendanceEvents
                   upsert attendanceDays (state 'open')
                   kioskTokens.useCount++
                   scheduler.runAt(finalizeDay) bila belum dijadwalkan
11. tolak       -> setiap kegagalan di 3..9 menulis scanRejections + ConvexError
```

Langkah 10 seluruhnya dalam satu mutation, jadi atomik. Jika `attendanceDays` ditolak, event juga tidak tertulis — tidak ada state setengah jalan.

**Kenapa duplikat aman tanpa unique index:** mutation Convex berjalan dengan serializable isolation dan OCC. Dua `punch` bersamaan sama-sama membaca `attendanceDays by_user_day`; read set keduanya beririsan dengan write set, sehingga satu transaksi di-retry dan pada percobaan kedua ia melihat hasil yang pertama. Syaratnya: pembacaan **harus** lewat `withIndex` yang sama dengan yang ditulis. Menyelesaikan temuan #9.

### E.3 `finalizeDay(userId, dayKey)` — murni dan idempoten

```
events  = by_user_day, buang yang voided, urut by at
sched   = resolveDay()
permit  = permit approved yang mencakup dayKey
pairs   = pairUp(events)      // greedy in->out
worked  = sum(out-in) - breakMinutes (hanya bila ada >=1 pasangan lengkap)
late    = max(0, firstIn - (start + tolerance))
early   = max(0, end - lastOut)
ot      = max(0, lastOut - end)   // informatif, bukan payroll

status:
  !sched.scheduled && events.length==0  -> hapus/skip row
  !sched.scheduled && events.length>0   -> 'unscheduled_work'  (perlu review admin)
  sched.isHoliday && events.length>0    -> 'holiday_work'
  permit && events.length==0            -> 'sick' | 'excused' | 'leave'
  pairs.complete >= 1                   -> 'present'
  ada 'in', tidak ada 'out'             -> 'no_access_out'
  ada 'out', tidak ada 'in'             -> 'no_access_in'
  tidak ada event                       -> 'absent'

flags: LATE, EARLY_LEAVE, MULTI_PAIR, MANUAL_EDIT, GEO_ANOMALY,
       PERMIT_CONFLICT, SHORT_SHIFT, UNSCHEDULED

guard: jika state=='locked' -> jangan tulis, catat ke auditLogs sebagai attempt
```

Dua status baru (`unscheduled_work`, `holiday_work`) adalah kasus yang pasti terjadi di klinik dan tidak ada di plan awal: orang masuk di hari liburnya. Membuangnya ke `absent` akan salah; menolak punch-nya akan membuat admin dimarahi.

---

## F. Model Waktu — Spesifikasi Eksplisit

Ini sumber bug paling mahal di sistem absensi. Aturannya:

1. **Instant** selalu `number` (ms epoch UTC). Nama field berakhiran `At`.
2. **Waktu sipil** selalu menit-dari-tengah-malam (`startMin`). Tidak pernah `Date`.
3. **Hari kerja** selalu `dayKey: 'YYYY-MM-DD'` dalam zona klinik. Tidak pernah `Date`, tidak pernah ISO string penuh.
4. `dayKey` **hanya** boleh diturunkan dari waktu server. Client tidak pernah mengirim tanggal untuk keputusan — hanya untuk filter tampilan.
5. Konversi: `instantOf(dayKey, min) = Date.parse(dayKey + 'T00:00:00Z') + (min - tzOffsetMinutes) * 60000`.

Mengapa `tzOffsetMinutes` disimpan sebagai angka dan bukan hanya nama IANA: Indonesia tidak punya DST, sehingga offset tetap dan aritmetika di atas benar serta murah. `timezone` tetap disimpan untuk format tampilan. **Jika suatu saat ada cabang di WITA/WIT, offset per-lokasi sudah tersedia** — tetapi jangan pernah menambahkan lokasi dengan DST tanpa mengganti seluruh lapisan ini ke konversi IANA sungguhan. Tulis peringatan ini di kode.

Shift lintas tengah malam: `endMin < startMin` berarti `crossesMidnight`. `dayKey` mengikuti tanggal **mulai** shift. Jendela check-out otomatis melewati tengah malam karena semua perbandingan dilakukan pada instant, bukan pada menit sipil. Karena klinik 07:00–22:00, ini jalur yang tidak dipakai, jadi **cukup tulis test-nya dan jangan bangun UI untuknya**.

---

## G. Protokol QR (revisi final)

- Isi QR: `https://<host>/scan#n=<nonce>&k=<kioskId>`.
  Pakai **fragment** (`#`), bukan query string. Fragment tidak dikirim ke server dalam header permintaan dan tidak muncul di log akses. Tambahkan `Referrer-Policy: no-referrer` dan `history.replaceState` untuk membersihkan URL setelah dibaca. Menyelesaikan temuan #20.
- Kiosk menampilkan countdown ring yang digerakkan `expiresAt - serverNow` dengan koreksi offset jam client, sehingga tablet dengan jam salah tetap benar.
- Kiosk butuh: Screen Wake Lock, fullscreen, deteksi `WebSocket` Convex terputus dengan banner merah besar, dan auto-reload jika token tidak berganti > 90 detik.
- Mode fallback: tombol admin untuk membuat `manualPunchCode` berumur 5 menit saat kamera atau kiosk bermasalah. Tanpa ini, satu tablet mati berarti 15 orang tidak bisa absen — risiko operasional yang nyata dan tidak dibahas di plan awal.

---

## H. Deteksi Anomali (query konkret, bukan niat)

Karena `tokenNonce` tercatat di setiap event, sinyal berikut bisa dihitung langsung:

| Sinyal | Definisi | Aksi |
|---|---|---|
| Nonce sharing | `count(distinct userId) by tokenNonce > 2` dalam satu window | Flag semua event terkait, tampilkan di dashboard |
| Burst | > 3 punch dalam 10 detik dari akun berbeda dengan `accuracy` identik | Flag |
| Akurasi tidak wajar | `accuracy < 3` berulang kali (emulator sering melapor nilai sempurna) | Flag |
| Teleport | jarak antar dua event user > 2 km dengan selisih < 10 menit | Flag |
| Device churn | `deviceHash` berubah > 2 kali per bulan | Laporan ke admin |

`deviceHash` = hash dari `(userAgent, platform, screen)` yang disimpan di localStorage dan dikirim saat punch. **Ini bukan kontrol keamanan** — mudah dipalsukan dan bisa berubah saat update browser. Nilainya murni sebagai sinyal investigasi. Jangan pernah menolak punch berdasarkan ini.

Pernyataan jujur yang harus disampaikan ke klien: kombinasi QR 30 detik di kiosk fisik + geofence server-side + sesi tunggal + deteksi nonce sharing membuat kecurangan **terdeteksi**, bukan **tidak mungkin**. Satu-satunya cara membuatnya tidak mungkin adalah biometrik di perangkat terkontrol.

---

## I. Perbaikan Terhadap Area Lain

### I-5 & I-6 Sesi tunggal (revisi)
`SUPERSEDES plan.md §3`

- Terapkan revoke-others **hanya jika `profile.role === 'user'`**. Admin dan kiosk dikecualikan.
- **Matikan `session.cookieCache`** (atau set TTL beberapa detik). Dengan cookie cache aktif, sesi yang sudah dihapus masih lolos validasi sampai cache kedaluwarsa, sehingga "satu akun satu device" bocor tepat di saat yang kritis.
- Deaktivasi karyawan harus **mencabut semua sesinya** dalam transaksi yang sama, bukan hanya menyetel `isActive=false`.
- Catat setiap pencabutan ke `auditLogs` dengan `userAgent` dan IP agar admin bisa melihat pola "akun dipakai bergantian".
- API persisnya (`databaseHooks` vs middleware komponen) harus diverifikasi terhadap versi `@convex-dev/better-auth` yang dipasang; permukaan API komponen ini masih berubah. Jadikan ini spike eksplisit di Fase 1, bukan asumsi.

### I-12 & I-13 Permit (revisi)
- `workDays` **dihitung ulang saat approve**, bukan dipakai dari nilai saat submit. Nilai submit hanya untuk pratinjau.
- Simpan `balanceApplied: [{year, days}]` saat approve. Reversal memakai array ini, bukan menghitung ulang — menghitung ulang setelah jadwal berubah akan mengembalikan jumlah yang salah.
- Setelah approve/reject/cancel, **jadwalkan `finalizeDay` untuk setiap hari dalam rentang** (termasuk tanggal lampau). Ini jalur re-finalisasi yang hilang di plan awal.
- Validasi overlap memakai index `by_user_start` dengan rentang, bukan scan.

### I-17 Izin setengah hari
Tambahkan `portion: 'full' | 'half'` pada permit, dan `workDays` boleh `0.5`. Untuk klinik, izin 2–4 jam adalah kasus umum; tanpa ini admin akan memakai `izin` penuh dan data jam kerja jadi tidak akurat. Implementasi minimal: `half` hanya memengaruhi pengurangan saldo dan rekap, tidak memengaruhi jendela punch.

### I-16 Jam kerja dan rekap
`workedMinutes`, `lateMinutes`, `earlyLeaveMinutes`, `overtimeMinutes`, `breakMinutes` dihitung sekali saat finalisasi dan **disimpan**. Jangan dihitung di query laporan: laporan harus menjadi pembacaan baris datar agar tetap dalam batas transaksi Convex dan agar nilai historis tidak berubah ketika `settings` diubah.

### I-18 Period locking
Setelah rekap bulanan disetujui/diekspor, admin me-lock bulan tersebut. `attendanceDays.state = 'locked'`, dan finalizer serta semua mutation koreksi menolaknya. Tanpa ini, angka rekap yang sudah dipakai untuk penggajian bisa berubah diam-diam di belakang — temuan audit yang serius pada sistem HR.

### I-19 Kontrak error
`ConvexError` dengan payload `{ code, message, meta }`. `code` adalah enum stabil; UI memetakannya ke teks Indonesia. Jangan pernah string-matching pesan.

```
AUTH_REQUIRED, FORBIDDEN, ACCOUNT_INACTIVE,
QR_INVALID, QR_EXPIRED, QR_REVOKED, KIOSK_INACTIVE,
GEO_PERMISSION_DENIED, GEO_INACCURATE, GEO_OUT_OF_RANGE,
NOT_SCHEDULED, TOO_EARLY, TOO_LATE_WINDOW,
ALREADY_CHECKED_IN, NO_OPEN_SESSION, SHIFT_TOO_SHORT,
PERIOD_LOCKED, RATE_LIMITED,
PERMIT_OVERLAP, LEAVE_INSUFFICIENT, PERMIT_ALREADY_REVIEWED
```

Setiap `code` wajib punya satu test dan satu teks UI. Ini juga menjadi checklist kelengkapan UX.

---

## J. Pitfall Spesifik Convex (checklist code review)

1. **Jangan `Date.now()` di query.** Query di-cache dan reaktif; nilai waktu akan beku atau memicu invalidasi tak perlu. Pola yang benar: query mengembalikan data mentah + `serverNow` dari mutation terakhir, dan UI menghitung "sudah berapa lama" di client. Keputusan berbasis waktu hanya di mutation dan scheduled function.
2. **Action tidak transaksional** dan tidak bisa `ctx.db`. Jangan taruh validasi apa pun yang menentukan di action. Action hanya untuk ekspor dan notifikasi.
3. **Cron memakai UTC.** Tulis offset secara eksplisit.
4. **Scheduled function bisa gagal/hilang** saat perubahan deployment. Selalu sediakan jaring pengaman idempoten.
5. **Tidak ada unique constraint.** Andalkan OCC + pembacaan lewat index yang sama (§E.2).
6. **`.filter()` bukan pengganti index.** `.filter()` tetap membaca semua dokumen yang di-scan dan ikut dihitung ke batas baca.
7. **Batas baca per transaksi.** Semua laporan wajib `paginate()` atau berbasis bulan sejak hari pertama.
8. **Perubahan schema pada data hidup:** tambahkan field sebagai `v.optional(...)`, backfill lewat `@convex-dev/migrations`, baru jadikan wajib. Tiga deploy, bukan satu.
9. **Validator `returns`** di semua fungsi publik. Ini menangkap regresi bentuk data yang tidak tertangkap TypeScript di batas client-server.
10. **File storage:** jangan pernah ekspos `storageId` mentah ke client lain; selalu lewat fungsi yang memeriksa `ownerId === me || isAdmin` lalu mengembalikan URL berumur pendek.

---

## K. Matriks Pengujian

Fokus pada logika murni; itu yang memberi nilai terbesar per usaha.

**Fungsi murni (tanpa Convex, test paling cepat dan paling banyak):** ekstrak `resolveDay`, `pairUp`, `computeStatus`, `haversine`, `instantOf`, `workDaysOf` ke `convex/lib/` sebagai fungsi murni yang menerima data sebagai argumen, termasuk `now`. Jangan ada `Date.now()` di dalamnya. Ini membuat semua skenario waktu bisa diuji tanpa fake timer.

| Kelompok | Kasus wajib |
|---|---|
| Jendela waktu | punch 05:59:59 vs 06:00:00 untuk shift 07:00; punch tepat di `end + grace`; punch 1 ms setelahnya |
| Token | valid; kedaluwarsa 1 ms; dalam `qrSkewSec`; sudah `revokedAt`; nonce tidak ada; kiosk nonaktif |
| Pairing | in-out; in-in; out tanpa in; in-out-in-out; in-out-in (tidak lengkap); dua punch dalam `minShiftMinutes` |
| Precedence jadwal | override mengalahkan holiday; override `null` = libur; dua baris weekly overlap; `effectiveTo` tepat hari ini |
| Status | seluruh 9 cabang di §E.3, masing-masing satu test |
| Idempotensi | `finalizeDay` dijalankan 3× menghasilkan dokumen identik |
| Permit | lintas akhir pekan; lintas tahun (pecah saldo); overlap; saldo kurang; approve tanggal lampau memicu re-finalisasi; reversal memakai `balanceApplied` |
| Lock | koreksi pada bulan terkunci ditolak; finalizer melewati baris terkunci |
| Konkurensi (`convex-test`) | dua `punch` paralel menghasilkan satu event; dua approve paralel tidak mengurangi saldo dua kali |
| Snapshot | ubah jam shift setelah finalisasi, lalu pastikan `shiftSnapshot` dan `workedMinutes` lama tidak berubah |

E2E (Playwright) dibatasi pada tiga alur: login → punch (geolocation dioverride via CDP), ajukan permit → approve → cek rekap, dan guard role. Lebih dari itu, biaya pemeliharaannya tidak sebanding.

Uji lapangan yang tidak bisa digantikan otomasi: sebar akurasi GPS di dalam gedung klinik pada beberapa titik sebelum menetapkan `radiusMeters`. Jangan tebak radiusnya. Kumpulkan dulu, lalu set.

---

## L. Operasional

- **Env Convex:** `BETTER_AUTH_SECRET`, `SITE_URL`. Catat bahwa setelah ADR-1 tidak ada lagi `QR_SECRET` — ini pengurangan permukaan rahasia yang nyata.
- **Deployment:** Vercel + Convex, dengan deployment dev dan prod terpisah. Geolocation butuh HTTPS, jadi uji lapangan harus memakai URL preview HTTPS, bukan `localhost` di jaringan lokal.
- **Bootstrap:** `internalMutation seedFirstAdmin` yang hanya jalan bila belum ada profil role `admin`. Dipanggil sekali lewat dashboard Convex, tidak pernah diekspos sebagai fungsi publik.
- **Backup:** snapshot export Convex terjadwal + simpan di luar Convex. Ini data kehadiran yang dipakai untuk penggajian; kehilangan satu bulan adalah masalah serius.
- **Retensi:** `scanRejections` 90 hari, `kioskTokens` 5 menit, `auditLogs` disimpan selamanya.
- **Observability:** setiap penolakan punch tercatat dengan `reasonCode`. Dashboard admin menampilkan distribusi `reasonCode` 7 hari terakhir — ini yang akan memberi tahu Anda bahwa radius terlalu kecil atau kiosk sering mati, jauh sebelum ada yang melapor.
- **Seed data dev:** 15 profil, 3 shift, pola mingguan campuran, dan satu bulan data acak. Tanpa ini, UI rekap tidak bisa dikembangkan dengan benar.

---

## M. Revisi Tahapan + Definition of Done

| Fase | Isi | DoD |
|---|---|---|
| 0 | **Spike:** verifikasi `@convex-dev/better-auth` (hook sesi, cookie cache, role), `scheduler.runAt`, rate limiter | Prototipe login + revoke-others berjalan, atau rencana B tertulis |
| 1 | Schema + semua index + `convex/lib` fungsi murni + unit test | Test §K kelompok jadwal/status/jendela hijau tanpa UI apa pun |
| 2 | Auth, role, guard, bootstrap admin, CRUD karyawan | Admin bisa membuat 15 karyawan; guard terbukti via test |
| 3 | Shift, weekly, override, grid bulanan, settings | Jadwal 15 karyawan bisa diisi; `resolveDay` cocok dengan UI |
| 4 | Kiosk token reaktif + `punch` + geofence + scanRejections | Dua HP bisa absen; penolakan punya `reasonCode` yang benar |
| 5 | `finalizeDay`, scheduler, jaring pengaman cron, dashboard hari ini | `no_access_in/out` dan `absent` muncul otomatis tanpa intervensi |
| 6 | Permit, lampiran, saldo, approve, re-finalisasi | Approve tanggal lampau mengubah `absent` menjadi `leave` |
| 7 | Rekap, ekspor, period lock, audit viewer, sinyal anomali | Satu bulan bisa dilock dan diekspor; koreksi setelahnya ditolak |
| 8 | Hardening: rate limit, headers/CSP, PWA, retensi, backup, uji lapangan GPS | Radius ditetapkan dari data lapangan, bukan tebakan |

Perubahan penting dari plan awal: **Fase 1 tidak punya UI sama sekali.** Mesin aturan diselesaikan dan diuji sebagai fungsi murni lebih dulu. Pada sistem absensi, hampir semua biaya rework berasal dari aturan waktu yang salah dan baru ketahuan setelah UI jadi.

---

## N. Rekomendasi Scope: Tunda

Agar tidak membengkak, saya sarankan **tidak** mengerjakan ini sekarang dan mencatatnya sebagai backlog:

- Multi-lokasi dan multi-kiosk (schema sudah mengakomodasi `kioskId`, jadi murah ditambahkan nanti)
- Device binding dengan persetujuan admin (mulai dengan `deviceHash` sebagai sinyal saja)
- Push notification / reminder
- Akrual saldo cuti otomatis dan carry-over
- Shift lintas tengah malam di UI (logika dan test tetap dibuat)
- Payroll, lembur berbayar, integrasi akuntansi
- `@convex-dev/aggregate` untuk laporan (belum perlu di skala 15 karyawan)

---

## O. Tiga Hal yang Paling Saya Khawatirkan

1. **Radius geofence.** Jika akurasi GPS di dalam gedung klinik buruk (sering 30–100 m di ruangan bersekat), radius 50 m akan menolak karyawan yang benar-benar hadir. Ini akan menjadi keluhan nomor satu di minggu pertama. Mitigasi: ukur dulu di lapangan, mulai dengan radius longgar (misal 150 m) plus `maxAccuracyMeters` longgar, lalu kencangkan berdasarkan data `scanRejections` nyata. Longgar-lalu-dikencangkan jauh lebih baik daripada sebaliknya.
2. **Kiosk sebagai single point of failure.** Tablet mati, WiFi putus, atau browser ter-reload berarti 15 orang tidak bisa absen. Fallback kode manual di §G bukan fitur opsional, itu kebutuhan.
3. **Permukaan API `@convex-dev/better-auth`.** Ini bagian paling tidak stabil dari seluruh stack, dan justru di situ letak persyaratan "satu akun satu device". Karena itu ia jadi Fase 0, bukan bagian dari Fase 1.
