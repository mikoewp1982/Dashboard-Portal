# Panduan Migrasi: Firebase → Supabase + Vercel Backend

Dokumen ini menjelaskan langkah-langkah migrasi backend dan database aplikasi Satu Pintu dari Firebase ke Supabase, dengan tetap menggunakan Vercel sebagai hosting frontend.

---

## **Ringkasan Stack Sebelum & Sesudah Migrasi**

| Lapisan | Stack Sebelum | Stack Sesudah |
|---------|---------------|---------------|
| Frontend Hosting | (Rencana) Firebase Hosting / Vercel | **Vercel** |
| Backend Logic | Firebase Cloud Functions | **Vercel Functions (Next.js API Routes)** |
| Auth | Firebase Auth | **Supabase Auth** |
| Database Terstruktur | Cloud Firestore | **Supabase PostgreSQL** |
| Database Realtime | Firebase Realtime Database (RTDB) | **Supabase Realtime** |
| Storage | Firebase Cloud Storage | **Supabase Storage** |
| Observability | Cloud Logging | **Vercel Logs + Supabase Logs** |

---

## **Langkah 1: Setup Project Supabase**

1.  Buat akun Supabase: https://supabase.com
2.  Buat project baru (nama: `satu-pintu-migration`)
3.  Catat **Project URL** dan **`anon` / `service_role` Key** dari menu `Settings` → `API`

---

## **Langkah 2: Migrasi Skema Database (Firestore/RTDB → PostgreSQL)**

### **2.1 Skema Multi-Tenant (Schools)**
Firestore: `/schools/{schoolId}`
Supabase PostgreSQL (SQL):
```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npsn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2.2 Skema Users (Auth + Custom Claims)**
Firebase Auth: Custom Claims (`role`, `schoolId`, `classId`)
Supabase:
1.  Aktifkan **Supabase Auth**
2.  Buat tabel `user_profiles` (untuk menyimpan data tambahan seperti `schoolId`, `classId`):
    ```sql
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'guru', 'siswa')),
      school_id UUID REFERENCES schools(id),
      class_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
3.  Buat **Row Level Security (RLS)** untuk `user_profiles`:
    ```sql
    -- Admin bisa lihat profil sekolahnya sendiri, super_admin bisa lihat semua
    CREATE POLICY "User can view their own profile"
      ON user_profiles
      FOR SELECT
      USING (
        auth.uid() = id
        OR (auth.jwt() ->> 'role' = 'super_admin')
        OR (
          (auth.jwt() ->> 'school_id')::UUID = school_id
          AND auth.jwt() ->> 'role' IN ('admin', 'guru')
        )
      );

    -- Hanya service_role yang bisa edit
    CREATE POLICY "Only service_role can modify profiles"
      ON user_profiles
      FOR ALL
      USING (auth.role() = 'service_role');
    ```

### **2.3 Skema Attendance, Pet, Discipline, dll**
Salin pola dari `02_ARSITEKTUR_LENGKAP_FIREBASE.md`, konversi setiap subcollection Firestore menjadi tabel PostgreSQL dengan foreign key ke `schools` dan `students`.

---

## **Langkah 3: Migrasi Auth (Firebase Auth → Supabase Auth)**

1.  **Export User Firebase**:
    - Firebase Console → Authentication → Export users (JSON)
2.  **Import ke Supabase**:
    - Gunakan `supabase import users` atau API `auth.admin.createUser` via script Node.js
3.  **Set Custom Claims Supabase**:
    - Di Supabase, custom claims disimpan di `auth.users.raw_user_meta_data` atau menggunakan PostgreSQL function untuk menambahkan ke JWT:
    ```sql
    CREATE FUNCTION public.set_claim(uid UUID, claim_key TEXT, claim_value JSONB)
    RETURNS VOID AS $$
    BEGIN
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        ARRAY[claim_key],
        claim_value
      )
      WHERE id = uid;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

---

## **Langkah 4: Migrasi Backend Logic (Cloud Functions → Next.js API Routes di Vercel)**

Ubah setiap Cloud Function menjadi **Next.js Route Handler** di `web/src/app/api/`.

Contoh migrasi `submitAttendance`:

**Sebelum (Firebase Cloud Function):**
```typescript
export const submitAttendance = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Login required');
  // ... logic ...
  await admin.firestore().doc(`schools/${schoolId}/...`).set(...);
});
```

**Sesudah (Supabase + Next.js API Route):**
```typescript
// web/src/app/api/attendance/submit/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Gunakan service_role key untuk operasi server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Dapatkan user dari token Supabase
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Dapatkan role/school_id dari JWT atau user_profiles
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) return NextResponse.json({ error: 'Invalid school' }, { status: 400 });

    const body = await req.json();

    // ... Logic bisnis sama seperti Cloud Function ...

    // Simpan ke PostgreSQL
    const { error } = await supabaseAdmin
      .from('attendance')
      .insert({
        school_id: profile.school_id,
        student_id: user.id,
        ...body
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

## **Langkah 5: Migrasi Frontend (Firebase SDK → Supabase SDK)**

### **5.1 Install Supabase Client**
```bash
cd web
npm install @supabase/supabase-js
```

### **5.2 Ubah Inisialisasi Client**
`web/src/lib/firebase/client.ts` → ganti dengan `web/src/lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### **5.3 Ganti Pemanggilan SDK di Seluruh Frontend**
- **Auth**: `signInWithEmailAndPassword` → `supabase.auth.signInWithPassword`
- **Firestore**: `db.collection().get()` → `supabase.from().select()`
- **RTDB Listeners**: `onValue()` → `supabase.channel().on('postgres_changes')`

---

## **Langkah 6: Migrasi Realtime Feature (RTDB → Supabase Realtime)**

Contoh listener EduLock status:
**Sebelum (Firebase RTDB):**
```typescript
import { rtdb } from '@/lib/firebase/client';
import { ref, onValue } from 'firebase/database';

onValue(ref(rtdb, `edulock_status/${schoolId}/${deviceId}`), (snap) => {
  console.log('Status lock:', snap.val());
});
```

**Sesudah (Supabase Realtime):**
```typescript
import { supabase } from '@/lib/supabase/client';

const channel = supabase
  .channel(`edulock_status_${schoolId}`)
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'edulock_status', filter: `school_id=eq.${schoolId}` },
    (payload) => {
      console.log('Status lock:', payload.new);
    }
  )
  .subscribe();
```

---

## **Langkah 7: Migrasi Storage (Firebase Storage → Supabase Storage)**

1.  Buat bucket `schools` di Supabase Storage
2.  Copy file dari Firebase Storage ke Supabase Storage
3.  Ubah kode upload/download:
    ```typescript
    // Sebelum (Firebase)
    import { storage } from '@/lib/firebase/client';
    import { ref, uploadBytes } from 'firebase/storage';
    await uploadBytes(ref(storage, `schools/${schoolId}/...`), file);

    // Sesudah (Supabase)
    import { supabase } from '@/lib/supabase/client';
    await supabase.storage.from('schools').upload(`${schoolId}/...`, file);
    ```

---

## **Langkah 8: Deploy ke Vercel**

1.  Tambahkan **Environment Variables** di Vercel Project Settings:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY` (secret, hanya untuk server-side)
2.  Push kode ke GitHub → Vercel auto-deploy!

---

## **Langkah 9: Observability & Rollback Plan**

- **Logging**: Gunakan `console.log` di API Routes → terlihat di Vercel Logs
- **Rollback**: Jika terjadi masalah, cepat switch DNS/konfigurasi kembali ke Firebase
- **Dual Write**: Sebelum full cutover, tulis data ke Firebase *dan* Supabase untuk beberapa hari

---

## **Ringkasan Perubahan File Utama**

| File Lama | File Baru |
|-----------|-----------|
| `web/src/lib/firebase/client.ts` | `web/src/lib/supabase/client.ts` |
| `web/src/lib/firebase-admin.ts` | (Opsional, ganti dengan `supabaseAdmin` client) |
| `web/functions/` | (Dihapus, pindah ke `web/src/app/api/`) |
| `web/firebase.json` | (Dihapus) |
| (Baru) | `web/.env.local` (untuk keys Supabase lokal) |

---
