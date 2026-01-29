# RLS Policy Library AND Templates

Use these templates to enforce consistent security across all tables.

## 0. Prerequisite

Always enable RLS on the table:

```sql
ALTER TABLE "public"."{table_name}" ENABLE ROW LEVEL SECURITY;
```

---

## 1. Owner Only (Private Data)

**Use Case**: User profiles, Personal Vehicles, Wallet Documents, Private Notes.

### SELECT (Read)
```sql
CREATE POLICY "{table_name}_select_own" ON "public"."{table_name}"
FOR SELECT TO authenticated
USING ( auth.uid() = {user_id_column} );
```

### INSERT (Create)
```sql
CREATE POLICY "{table_name}_insert_own" ON "public"."{table_name}"
FOR INSERT TO authenticated
WITH CHECK ( auth.uid() = {user_id_column} );
```

### UPDATE (Edit)
```sql
CREATE POLICY "{table_name}_update_own" ON "public"."{table_name}"
FOR UPDATE TO authenticated
USING ( auth.uid() = {user_id_column} );
```

### DELETE (Remove)
```sql
CREATE POLICY "{table_name}_delete_own" ON "public"."{table_name}"
FOR DELETE TO authenticated
USING ( auth.uid() = {user_id_column} );
```

---

## 2. Public Read / Admin Write

**Use Case**: Tracks, Reference Data, Public Listings, Event Information.

### SELECT (Read - Public)
```sql
CREATE POLICY "{table_name}_select_public" ON "public"."{table_name}"
FOR SELECT TO anon, authenticated
USING ( true );
```

### ALL (Admin Only)
*Assumes a `user_roles` or `admins` table exists, or a specific metadata claim.*

```sql
CREATE POLICY "{table_name}_all_admin" ON "public"."{table_name}"
FOR ALL TO authenticated
USING ( 
  EXISTS (
    SELECT 1 FROM public.gp_user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) 
);
```

---

## 3. Organization Member Access

**Use Case**: Shop Inventory, Team Tasks, Shared Docs.
*Assumes table has an `org_id` column.*

### SELECT (Member Read)
```sql
CREATE POLICY "{table_name}_select_org_member" ON "public"."{table_name}"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gp_org_members
    WHERE org_id = {table_name}.org_id
    AND user_id = auth.uid()
  )
);
```

### INSERT/UPDATE (Member Write)
*Often restricted to specific roles within the org (e.g., 'owner', 'manager').*

```sql
CREATE POLICY "{table_name}_write_org_manager" ON "public"."{table_name}"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gp_org_members
    WHERE org_id = {table_name}.org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);
```

---

## 4. Event Staff Access (Scoped)

**Use Case**: Scanning tickets, Verifying credentials at gate.
*Assumes table has `event_id`.*

### SELECT/UPDATE (Staff Verified)
```sql
CREATE POLICY "{table_name}_staff_access" ON "public"."{table_name}"
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gp_event_staff
    WHERE event_id = {table_name}.event_id
    AND user_id = auth.uid()
  )
);
```

---

## 5. Immutable Records (Create Once, Never Edit)

**Use Case**: Audit Logs, Chat Messages, Verified Check-ins.

*   Allow `INSERT`.
*   Deny `UPDATE` (Or create a policy that checks `1=0` or simply don't create an UPDATE policy).

```sql
-- No UPDATE policy created = deny by default.
```

---

## 6. Soft Delete (Archived)

**Use Case**: Most business objects.
*Add to SELECT policies.*

```sql
USING ( 
  auth.uid() = user_id 
  AND archived_at IS NULL 
);
```
