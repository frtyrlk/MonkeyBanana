# Supabase veri modeli — `database_readme.md`

Bu belge, bağlı Supabase Postgres projesindeki **`public`** şemasındaki tabloları, kolonları, mantıksal ilişkileri, indeksleri, RLS politikalarını ve verinin nasıl dolduğunu özetler. Bilgiler Supabase üzerinden okunan güncel şema ile üretilmiştir.

> **Not:** Bu depo (`MonkeyBanana`) bir React oyunudur; oyun verisi `localStorage` kullanır. Supabase şeması ayrı bir üretim / planlama uygulamasına aittir (master mamül, çalıştırma geçmişi).

---

## Özet

| Tablo | Amaç | Satır (yaklaşık) | RLS |
|--------|------|------------------|-----|
| `master_mamul` | PLANLAMA.xlsm Sheet1 ile uyumlu mamül → hamur ve ağırlık master verisi | ~1689 | Açık |
| `master_mamul_audit` | `master_mamul` üzerindeki INSERT/UPDATE/DELETE için denetim kaydı | ~1689 | Açık |
| `run_history` | Planlama / imalat çalıştırma özeti ve isteğe bağlı JSON payload | ~1 | Açık |

Veritabanında **`public` şemasında tanımlı FOREIGN KEY yoktur**; `master_mamul_audit.mamul_no` ile `master_mamul.mamul_no` arasında **mantıksal** ilişki vardır.

---

## Şema: `public`

### 1. `master_mamul`

**Açıklama (DB comment):** PLANLAMA.xlsm Sheet1 master verisi (parça → hamur + ağırlıklar). Anahtar VBA ile uyumlu: `UCase(Trim(A))`.

| Kolon | Tip | Nullable / varsayılan | Açıklama |
|--------|-----|------------------------|----------|
| `mamul_no` | `text` | PK, güncellenebilir | Normalize mamül numarası (birincil anahtar). |
| `mamul_no_raw` | `text` | zorunlu | Ham / kaynak mamül no metni. |
| `hamur_no` | `text` | varsayılan `''` | İlişkili hamur kodu. |
| `birim_agirlik` | `numeric` | varsayılan `0` | Birim ağırlık. |
| `batch_agirlik` | `numeric` | varsayılan `0` | Batch ağırlığı. |
| `vardiya_uretim_adeti` | `numeric` | nullable | Vardiya üretim adedi. |
| `updated_at` | `timestamptz` | varsayılan `now()` | Son güncelleme zamanı (trigger ile de güncellenir). |
| `updated_by` | `text` | nullable | Son güncelleyen (uygulama tarafından set edilebilir). |

**Birincil anahtar:** `mamul_no`

**İndeksler**

- `master_mamul_pkey` — UNIQUE (`mamul_no`)
- `master_mamul_hamur_idx` — BTREE (`hamur_no`)

---

### 2. `master_mamul_audit`

Mamül master satırlarındaki değişikliklerin **append-only** denetim izi.

| Kolon | Tip | Nullable / varsayılan | Açıklama |
|--------|-----|------------------------|----------|
| `id` | `bigint` | PK, `nextval(...)` | Satır kimliği. |
| `mamul_no` | `text` | zorunlu | İlgili mamül; `master_mamul.mamul_no` ile mantıksal bağ. |
| `op` | `text` | zorunlu, CHECK | `'insert' \| 'update' \| 'delete'` |
| `eski` | `jsonb` | nullable | Önceki satırın JSON snapshot’ı (insert’te `null`). |
| `yeni` | `jsonb` | nullable | Yeni satırın JSON snapshot’ı (delete’te `null`). |
| `kim` | `text` | nullable | `coalesce(auth.jwt()->>'email', current_user)` ile trigger’dan. |
| `ne_zaman` | `timestamptz` | varsayılan `now()` | Olay zamanı. |

**Birincil anahtar:** `id`

**İndeksler**

- `master_mamul_audit_pkey` — UNIQUE (`id`)
- `master_mamul_audit_mamul_idx` — BTREE (`mamul_no`, `ne_zaman DESC`) — mamül bazlı son kayıtlar için.

---

### 3. `run_history`

Çalıştırma / rapor özeti; istemci veya edge iş akışının tek seferlik kaydı.

| Kolon | Tip | Nullable / varsayılan | Açıklama |
|--------|-----|------------------------|----------|
| `id` | `uuid` | PK, `gen_random_uuid()` | Kayıt kimliği. |
| `created_at` | `timestamptz` | varsayılan `now()` | Oluşturulma zamanı. |
| `week_label` | `text` | nullable | Hafta etiketi. |
| `imalat_filename` | `text` | nullable | İmalat dosya adı. |
| `master_source` | `text` | nullable | Master kaynağı (dosya / yol bilgisi vb.). |
| `master_rows` | `int` | nullable | Master satır sayısı. |
| `hamur_cesit` | `int` | nullable | Hamur çeşit sayısı. |
| `toplam_adet` | `numeric` | nullable | Toplam adet. |
| `toplam_kg` | `numeric` | nullable | Toplam kg. |
| `toplam_batch` | `numeric` | nullable | Toplam batch. |
| `aktif_pres` | `int` | nullable | Aktif pres sayısı. |
| `atil_vardiya` | `int` | nullable | Atıl vardiya. |
| `eslesmeyen_parca` | `int` | nullable | Eşleşmeyen parça sayısı. |
| `tasma_var` | `boolean` | nullable | Taşma var mı. |
| `uyari_hata` | `int` | nullable | Hata seviyesi uyarı sayısı. |
| `uyari_uyari` | `int` | nullable | Uyarı seviyesi. |
| `uyari_bilgi` | `int` | nullable | Bilgi seviyesi. |
| `payload` | `jsonb` | nullable | Ham sonuç / ek alanlar. |

**Birincil anahtar:** `id`

**İndeksler**

- `run_history_pkey` — UNIQUE (`id`)
- `run_history_created_at_idx` — BTREE (`created_at DESC`)

---

## Tablolar arası ilişkiler

```
master_mamul (mamul_no PK)
       │
       │  mantıksal: mamul_no
       ▼
master_mamul_audit (mamul_no, op, eski, yeni, …)

run_history  ── bağımsız (master_mamul ile FK yok)
```

- **`master_mamul` ↔ `master_mamul_audit`:** FK tanımı yok; tüm audit satırları `mamul_no` üzerinden mamül ile ilişkilendirilir. Uygulama sorgularında `JOIN master_mamul m ON m.mamul_no = a.mamul_no` kullanılabilir.

---

## Verinin dolma yöntemleri

### `master_mamul`

1. **Toplu yükleme / senkron:** Excel (`PLANLAMA.xlsm`) veya ETL ile `UPSERT` / `INSERT … ON CONFLICT` ile doldurulması beklenir; VBA tarafındaki `UCase(Trim(...))` ile `mamul_no` uyumu hedeflenir.
2. **Authenticated yazım:** RLS, `authenticated` rolüne `ALL` izni verir (`with_check: true`); anonim okuyucular için ayrıca genel `SELECT` politikası vardır (aşağıda).

### `master_mamul_audit`

**Tamamen veritabanı trigger’ları ile doldurulur** (uygulama doğrudan INSERT zorunlu değildir; RLS’de sadece `authenticated` için `SELECT` görünüyor, yazım trigger sahibi bağlamında yapılır).

| Trigger | Olay | Fonksiyon |
|---------|------|-----------|
| `master_mamul_touch_trg` | `INSERT`, `UPDATE` | `master_mamul_touch()` |
| `master_mamul_delete_trg` | `DELETE` | `master_mamul_log_delete()` |

- **`master_mamul_touch()`:** `NEW.updated_at := now()`. `UPDATE` için audit’e `op='update'`, `eski=to_jsonb(old)`, `yeni=to_jsonb(new)`; `INSERT` için `op='insert'`, `eski=null`, `yeni=to_jsonb(new)`. `kim`: `coalesce(auth.jwt()->>'email', current_user)`.
- **`master_mamul_log_delete()`:** `op='delete'`, `eski=to_jsonb(old)`, `yeni=null`.

### `run_history`

- **İstemci veya backend:** `anon` ve `authenticated` için `INSERT` ve `SELECT` açık; planlama çalıştırması sonunda özet satırı ve isteğe bağlı `payload` buraya yazılır.
- **`DELETE`:** `run_history_anon_delete` politikası ile `anon` ve `authenticated` için silmeye izin verilir (ör. temizlik / yeniden çalıştırma senaryosu).

---

## Row Level Security (RLS)

Tüm üç tabloda **RLS etkin**.

| Tablo | Politika | Rol | Komut | Özet |
|--------|-----------|-----|--------|------|
| `master_mamul` | `master_mamul_read_all` | `public` | SELECT | Herkes okuyabilir (`qual: true`). |
| `master_mamul` | `master_mamul_write_authenticated` | `authenticated` | ALL | Giriş yapmış kullanıcı tam CRUD (`qual` / `with_check: true`). |
| `master_mamul_audit` | `master_mamul_audit_read_authenticated` | `authenticated` | SELECT | Sadece okuma. |
| `run_history` | `run_history_anon_select` | `anon`, `authenticated` | SELECT | Herkes okuyabilir. |
| `run_history` | `run_history_anon_insert` | `anon`, `authenticated` | INSERT | `with_check: true`. |
| `run_history` | `run_history_anon_delete` | `anon`, `authenticated` | DELETE | Tam silme izni (`qual: true`). |

> `master_mamul_audit` için uygulama tarafından doğrudan INSERT politikası listelenmemiştir; satırlar trigger ile eklenir.

---

## Uygulanan migrasyonlar (Supabase)

Sırayla kayıtlı migration sürümleri:

| Sürüm | İsim |
|--------|------|
| `20260416214205` | `create_master_mamul` |
| `20260416214347` | `harden_master_mamul_trigger_functions` |
| `20260418145457` | `create_run_history` |
| `20260418185219` | `run_history_anon_delete_policy` |

---

## Bakım ve sorgu örnekleri

**Son audit kayıtları (mamül bazlı):**

```sql
SELECT *
FROM public.master_mamul_audit
WHERE mamul_no = $1
ORDER BY ne_zaman DESC
LIMIT 50;
```

**Son çalıştırmalar:**

```sql
SELECT id, created_at, week_label, toplam_kg, uyari_hata
FROM public.run_history
ORDER BY created_at DESC
LIMIT 20;
```

---

## Belge güncelliği

- Şema özeti: Supabase `list_tables` (verbose) + ek SQL (`information_schema`, `pg_policies`, `pg_proc`, `pg_index`) ile doğrulanmıştır.
- Migration listesi: Supabase `list_migrations` çıktısıdır.

Yerel depoda `supabase/migrations` klasörü yoksa, DDL kaynağı doğrudan Supabase Dashboard → SQL / Migrations üzerinden yönetiliyor demektir.
