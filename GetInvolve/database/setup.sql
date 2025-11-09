-- ===== YUVA DELHI UNIT REGISTRATION DATABASE SETUP =====
-- This file contains all the necessary tables for the YUVA Delhi Unit Registration system

-- ===== 1. ZONES TABLE =====
-- Create zones table for 8 Delhi zones
CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    zone_code VARCHAR(20) UNIQUE NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    description TEXT,
    zone_convener_id INTEGER,
    zone_co_convener_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert 8 Delhi zones
INSERT INTO zones (zone_code, zone_name, description) VALUES
('east', 'East Delhi', 'Eastern zone of Delhi'),
('west', 'West Delhi', 'Western zone of Delhi'),
('north', 'North Delhi', 'Northern zone of Delhi'),
('south', 'South Delhi', 'Southern zone of Delhi'),
('jhandewalan', 'Jhandewalan', 'Jhandewalan zone'),
('keshav', 'Keshav Puram', 'Keshav Puram zone'),
('ramkrishna', 'Ramkrishna Puram', 'Ramkrishna Puram zone'),
('yamuna', 'Yamuna Vihar', 'Yamuna Vihar zone')
ON CONFLICT (zone_code) DO NOTHING;

-- ===== 2. COLLEGES TABLE =====
-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    college_name VARCHAR(200) NOT NULL,
    college_code VARCHAR(50) UNIQUE NOT NULL,
    zone_id INTEGER REFERENCES zones(id),
    address TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(15),
    total_members INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ===== 3. ADMIN USERS TABLE =====
-- Create admin_users table for authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    zone VARCHAR(50),
    college_id INTEGER REFERENCES colleges(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enforce case-insensitive uniqueness for email and normalize input
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_key
ON admin_users ((lower(email)));

CREATE OR REPLACE FUNCTION normalize_admin_users_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email := lower(trim(NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_admin_users_email_ins ON admin_users;
DROP TRIGGER IF EXISTS trg_normalize_admin_users_email_upd ON admin_users;
CREATE TRIGGER trg_normalize_admin_users_email_ins
BEFORE INSERT ON admin_users
FOR EACH ROW EXECUTE FUNCTION normalize_admin_users_email();

CREATE TRIGGER trg_normalize_admin_users_email_upd
BEFORE UPDATE OF email ON admin_users
FOR EACH ROW EXECUTE FUNCTION normalize_admin_users_email();

-- Insert sample admin user
INSERT INTO admin_users (email, password, full_name, role, zone) VALUES
('admin@yuva.com', 'admin123', 'YUVA Admin', 'super_admin', 'east')
ON CONFLICT (email) DO NOTHING;

-- ===== 4. REGISTRATIONS TABLE =====
-- Create registrations table for unit applications
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    applicant_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    college_id INTEGER REFERENCES colleges(id),
    zone_id INTEGER REFERENCES zones(id),
    applying_for VARCHAR(30) NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    unit_description TEXT,
    documents JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 5. SESSIONS TABLE =====
-- Create sessions table for user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 6. NOTIFICATIONS TABLE =====
-- Create notifications table for system notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 7. ROW LEVEL SECURITY (RLS) SETUP =====
-- Enable RLS on all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ===== 8. RLS POLICIES =====
-- Zones: Allow all authenticated users to read
CREATE POLICY "Allow read access to zones" ON zones
    FOR SELECT USING (true);

-- Colleges: Allow all authenticated users to read
CREATE POLICY "Allow read access to colleges" ON colleges
    FOR SELECT USING (true);

-- Admin Users: Allow users to read their own data
CREATE POLICY "Allow users to read own data" ON admin_users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Registrations: Allow all authenticated users to read
CREATE POLICY "Allow read access to registrations" ON registrations
    FOR SELECT USING (true);

-- Sessions: Allow users to manage their own sessions
CREATE POLICY "Allow users to manage own sessions" ON sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Notifications: Allow users to read their own notifications
CREATE POLICY "Allow users to read own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- ===== 9. INDEXES FOR PERFORMANCE =====
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_colleges_zone_id ON colleges(zone_id);
CREATE INDEX IF NOT EXISTS idx_registrations_college_id ON registrations(college_id);
CREATE INDEX IF NOT EXISTS idx_registrations_zone_id ON registrations(zone_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ===== 6b. EVENTS TABLES =====
-- College Events (dynamic upcoming/past)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE,
    location VARCHAR(200),
    banner_url TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled|completed|cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to events" ON events
    FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_events_college_id ON events(college_id);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Safe write RPC for events to allow inserts via anon key without exposing service secret
CREATE OR REPLACE FUNCTION create_event(
  p_college_id int,
  p_title text,
  p_description text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_location text,
  p_banner_url text,
  p_status text
)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  INSERT INTO events (college_id, title, description, start_at, end_at, location, banner_url, status)
  VALUES (p_college_id, p_title, p_description, p_start_at, p_end_at, p_location, p_banner_url, COALESCE(NULLIF(TRIM(p_status), ''), 'scheduled'))
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION create_event(int, text, text, timestamptz, timestamptz, text, text, text) TO anon, authenticated;

-- Delete event safely via RPC (avoids RLS issues for anon)
CREATE OR REPLACE FUNCTION delete_event(p_id int)
RETURNS void AS $$
BEGIN
  DELETE FROM events WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION delete_event(int) TO anon, authenticated;

-- ===== 6c. UNITS TABLE (optional - used for dashboard count) =====
-- Basic table to track units inside a college so frontend unit count works
-- (Removed) Units table is not needed; dashboard will no longer query it.

-- ===== 10. TRIGGERS FOR UPDATED_AT =====
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 10b. Keep colleges.total_members in sync with registrations =====
CREATE OR REPLACE FUNCTION refresh_college_member_count(p_college_id INT)
RETURNS VOID AS $$
BEGIN
  UPDATE colleges c
  SET total_members = (
    SELECT COUNT(*) FROM registrations r WHERE r.college_id = p_college_id
  ), updated_at = NOW()
  WHERE c.id = p_college_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_sync_member_count_ins()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_college_member_count(NEW.college_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_sync_member_count_del()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_college_member_count(OLD.college_id);
  RETURN OLD;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_sync_member_count_upd()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    PERFORM refresh_college_member_count(OLD.college_id);
    PERFORM refresh_college_member_count(NEW.college_id);
  ELSE
    PERFORM refresh_college_member_count(NEW.college_id);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS registrations_sync_count_ins ON registrations;
DROP TRIGGER IF EXISTS registrations_sync_count_del ON registrations;
DROP TRIGGER IF EXISTS registrations_sync_count_upd ON registrations;
CREATE TRIGGER registrations_sync_count_ins AFTER INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION trg_sync_member_count_ins();
CREATE TRIGGER registrations_sync_count_del AFTER DELETE ON registrations
  FOR EACH ROW EXECUTE FUNCTION trg_sync_member_count_del();
CREATE TRIGGER registrations_sync_count_upd AFTER UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION trg_sync_member_count_upd();

-- ===== 11. SAMPLE DATA FOR TESTING =====
-- Insert sample registrations
INSERT INTO registrations (applicant_name, email, phone, college_id, zone_id, applying_for, unit_name, unit_description) VALUES
('John Doe', 'john@example.com', '9876543210', 1, 1, 'mentor', 'Delhi University Unit', 'Leading the Delhi University YUVA unit'),
('Jane Smith', 'jane@example.com', '9876543211', 2, 1, 'convener', 'Jamia Unit', 'Cultural convener for Jamia unit'),
('Mike Johnson', 'mike@example.com', '9876543212', 3, 2, 'member', 'IIT Unit', 'General member of IIT unit')
ON CONFLICT DO NOTHING;

-- ===== 12. VIEWS FOR COMMON QUERIES =====
-- Helper RPCs for serverless safe writes using anon key
CREATE OR REPLACE FUNCTION create_college(p_name text, p_code text, p_zone_id int)
RETURNS TABLE (id int) AS $$
DECLARE new_id int;
BEGIN
  INSERT INTO colleges(college_name, college_code, zone_id, total_members, is_active)
  VALUES (p_name, p_code, p_zone_id, 0, true)
  RETURNING colleges.id INTO new_id;
  RETURN QUERY SELECT new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

-- Approve/Reject via RPC with definer privileges (safe for anon key)
CREATE OR REPLACE FUNCTION set_registration_status(p_id int, p_status text)
RETURNS void AS $$
BEGIN
  UPDATE registrations SET status = COALESCE(NULLIF(TRIM(p_status), ''), 'pending'), updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

CREATE OR REPLACE FUNCTION delete_registration(p_id int)
RETURNS void AS $$
BEGIN
  DELETE FROM registrations WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION set_registration_status(int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_registration(int) TO anon, authenticated;

-- Update registration fields via RPC (security definer)
CREATE OR REPLACE FUNCTION update_registration_fields(
  p_id int,
  p_applicant_name text,
  p_email text,
  p_phone text,
  p_college_id int,
  p_zone_id int,
  p_applying_for text,
  p_unit_name text,
  p_status text
)
RETURNS void AS $$
BEGIN
  UPDATE registrations SET
    applicant_name = COALESCE(NULLIF(TRIM(p_applicant_name), ''), applicant_name),
    email = COALESCE(NULLIF(TRIM(p_email), ''), email),
    phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
    college_id = COALESCE(p_college_id, college_id),
    zone_id = COALESCE(p_zone_id, zone_id),
    applying_for = COALESCE(NULLIF(TRIM(p_applying_for), ''), applying_for),
    unit_name = COALESCE(NULLIF(TRIM(p_unit_name), ''), unit_name),
    status = COALESCE(NULLIF(TRIM(p_status), ''), status),
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION update_registration_fields(int, text, text, text, int, int, text, text, text) TO anon, authenticated;

-- Safely delete a college (blocked if any registrations exist)
CREATE OR REPLACE FUNCTION delete_college(p_id int)
RETURNS void AS $$
DECLARE cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt FROM registrations WHERE college_id = p_id;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'college_has_members';
  END IF;
  DELETE FROM colleges WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION delete_college(int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION create_registration(
  p_applicant_name text,
  p_email text,
  p_phone text,
  p_college_id int,
  p_zone_id int,
  p_applying_for text,
  p_unit_name text,
  p_status text DEFAULT 'pending'
)
RETURNS TABLE (id int) AS $$
DECLARE new_id int;
BEGIN
  INSERT INTO registrations(applicant_name,email,phone,college_id,zone_id,applying_for,unit_name,status)
  VALUES (p_applicant_name,p_email,p_phone,p_college_id,p_zone_id,p_applying_for,p_unit_name,COALESCE(p_status,'pending'))
  RETURNING registrations.id INTO new_id;
  RETURN QUERY SELECT new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

-- Create view for college details with zone information
CREATE OR REPLACE VIEW college_details AS
SELECT 
    c.id,
    c.college_name,
    c.college_code,
    c.total_members,
    z.zone_name,
    z.zone_code,
    c.contact_email,
    c.contact_phone,
    c.is_active,
    c.created_at
FROM colleges c
JOIN zones z ON c.zone_id = z.id;

-- Create view for registration details with college and zone info
CREATE OR REPLACE VIEW registration_details AS
SELECT 
    r.id,
    r.applicant_name,
    r.email,
    r.phone,
    r.applying_for,
    r.unit_name,
    r.status,
    c.college_name,
    z.zone_name,
    r.created_at
FROM registrations r
JOIN colleges c ON r.college_id = c.id
JOIN zones z ON r.zone_id = z.id;



-- for rpc login
create or replace function admin_users_login(p_email text, p_password text)
returns table (
  id int,
  email text,
  full_name text,
  role text,
  zone text,
  college_id int
)
language sql
security definer
set search_path = public
as $$
  select id, email, full_name, role, zone, college_id
  from public.admin_users
  where lower(email) = lower(p_email) and password = p_password
  limit 1;
$$;

grant execute on function admin_users_login(text, text) to anon, authenticated;

for rpc register
create or replace function admin_users_register(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_zone text,
  p_college_id int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id int;
begin
  insert into public.admin_users(email, password, full_name, role, zone, college_id, is_active, created_at)
  values (lower(p_email), p_password, p_full_name, p_role, nullif(p_zone,''), p_college_id, true, now())
  returning id into new_id;
  return new_id;
exception
  when unique_violation then
    raise exception 'duplicate_email';
end;
$$;

grant execute on function admin_users_register(text, text, text, text, text, int) to anon, authenticated;


-- ===== SETUP COMPLETE =====
-- Your YUVA Delhi Unit Registration database is now ready!
-- Tables created: zones, colleges, admin_users, registrations, sessions, notifications
-- Security: RLS enabled with appropriate policies
-- Performance: Indexes created for optimal query performance
-- Data: Sample data inserted for testing=



-- extras 
create or replace view admin_users_public as
select
  id,
  email,
  full_name,
  role,
  zone,
  college_id,
  is_active,
  created_at,
  updated_at
from public.admin_users;


create or replace view admin_users_public as
select id, email, full_name, role, zone, college_id, is_active, created_at, updated_at
from public.admin_users;


create or replace function admin_users_login(p_email text, p_password text)
returns table (
  id int,
  email text,
  full_name text,
  role text,
  zone text,
  college_id int
)
language sql
security definer
set search_path = public
as $$
  select id, email, full_name, role, zone, college_id
  from public.admin_users
  where lower(email) = lower(p_email) and password = p_password
  limit 1;
$$;

grant execute on function admin_users_login(text, text) to anon, authenticated;


create or replace function admin_users_register(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_zone text,
  p_college_id int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id int;
begin
  insert into public.admin_users(email, password, full_name, role, zone, college_id, is_active, created_at)
  values (lower(p_email), p_password, p_full_name, p_role, nullif(p_zone,''), p_college_id, true, now())
  returning id into new_id;
  return new_id;
exception
  when unique_violation then
    raise exception 'duplicate_email';
end;
$$;

grant execute on function admin_users_register(text, text, text, text, text, int) to anon, authenticated;


create or replace function admin_users_login(p_email text, p_password text)
returns table (
  id int,
  email text,
  full_name text,
  role text,
  zone text,
  college_id int
)
language sql
security definer
set search_path = public
as $$
  select id, email, full_name, role, zone, college_id
  from public.admin_users
  where lower(email) = lower(p_email) and password = p_password
  limit 1;
$$;

grant execute on function admin_users_login(text, text) to anon, authenticated;


create or replace function admin_users_register(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_zone text,
  p_college_id int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id int;
begin
  insert into public.admin_users(email, password, full_name, role, zone, college_id, is_active, created_at)
  values (lower(p_email), p_password, p_full_name, p_role, nullif(p_zone,''), p_college_id, true, now())
  returning id into new_id;
  return new_id;
exception
  when unique_violation then
    raise exception 'duplicate_email';
end;
$$;

grant execute on function admin_users_register(text, text, text, text, text, int) to anon, authenticated;


CREATE OR REPLACE FUNCTION create_college(p_name text, p_code text, p_zone_id int)
RETURNS TABLE (id int) AS $$
DECLARE new_id int;
BEGIN
  INSERT INTO colleges(college_name, college_code, zone_id, total_members, is_active)
  VALUES (p_name, p_code, p_zone_id, 0, true)
  RETURNING colleges.id INTO new_id;
  RETURN QUERY SELECT new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;


CREATE OR REPLACE FUNCTION create_registration(
  p_applicant_name text,
  p_email text,
  p_phone text,
  p_college_id int,
  p_zone_id int,
  p_applying_for text,
  p_unit_name text,
  p_status text DEFAULT 'pending'
)
RETURNS TABLE (id int) AS $$
DECLARE new_id int;
BEGIN
  INSERT INTO registrations(applicant_name,email,phone,college_id,zone_id,applying_for,unit_name,status)
  VALUES (p_applicant_name,p_email,p_phone,p_college_id,p_zone_id,p_applying_for,p_unit_name,COALESCE(p_status,'pending'))
  RETURNING registrations.id INTO new_id;
  RETURN QUERY SELECT new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;


CREATE OR REPLACE FUNCTION refresh_college_member_count(p_college_id INT)
RETURNS VOID AS $$
BEGIN
  UPDATE colleges c
  SET total_members = (
    SELECT COUNT(*) FROM registrations r WHERE r.college_id = p_college_id
  ), updated_at = NOW()
  WHERE c.id = p_college_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_sync_member_count_ins()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_college_member_count(NEW.college_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_sync_member_count_del()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_college_member_count(OLD.college_id);
  RETURN OLD;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_sync_member_count_upd()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    PERFORM refresh_college_member_count(OLD.college_id);
    PERFORM refresh_college_member_count(NEW.college_id);
  ELSE
    PERFORM refresh_college_member_count(NEW.college_id);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS registrations_sync_count_ins ON registrations;
DROP TRIGGER IF EXISTS registrations_sync_count_del ON registrations;
DROP TRIGGER IF EXISTS registrations_sync_count_upd ON registrations;
CREATE TRIGGER registrations_sync_count_ins AFTER INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION trg_sync_member_count_ins();
CREATE TRIGGER registrations_sync_count_del AFTER DELETE ON registrations
  FOR EACH ROW EXECUTE FUNCTION trg_sync_member_count_del();
CREATE TRIGGER registrations_sync_count_upd AFTER UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION trg_sync_member_count_upd();



  CREATE OR REPLACE FUNCTION set_registration_status(p_id int, p_status text)
RETURNS void AS $$
BEGIN
  UPDATE registrations SET status = COALESCE(NULLIF(TRIM(p_status), ''), 'pending'), updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

CREATE OR REPLACE FUNCTION delete_registration(p_id int)
RETURNS void AS $$
BEGIN
  DELETE FROM registrations WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION set_registration_status(int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_registration(int) TO anon, authenticated;



CREATE OR REPLACE FUNCTION update_registration_fields(
  p_id int,
  p_applicant_name text,
  p_email text,
  p_phone text,
  p_college_id int,
  p_zone_id int,
  p_applying_for text,
  p_unit_name text,
  p_status text
)
RETURNS void AS $$
BEGIN
  UPDATE registrations SET
    applicant_name = COALESCE(NULLIF(TRIM(p_applicant_name), ''), applicant_name),
    email = COALESCE(NULLIF(TRIM(p_email), ''), email),
    phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
    college_id = COALESCE(p_college_id, college_id),
    zone_id = COALESCE(p_zone_id, zone_id),
    applying_for = COALESCE(NULLIF(TRIM(p_applying_for), ''), applying_for),
    unit_name = COALESCE(NULLIF(TRIM(p_unit_name), ''), unit_name),
    status = COALESCE(NULLIF(TRIM(p_status), ''), status),
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION update_registration_fields(int, text, text, text, int, int, text, text, text) TO anon, authenticated;



CREATE OR REPLACE FUNCTION delete_college(p_id int)
RETURNS void AS $$
DECLARE cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt FROM registrations WHERE college_id = p_id;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'college_has_members';
  END IF;
  DELETE FROM colleges WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION delete_college(int) TO anon, authenticated;



CREATE OR REPLACE FUNCTION create_event(
  p_college_id int,
  p_title text,
  p_description text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_location text,
  p_banner_url text,
  p_status text
)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  INSERT INTO events (college_id, title, description, start_at, end_at, location, banner_url, status)
  VALUES (p_college_id, p_title, p_description, p_start_at, p_end_at, p_location, p_banner_url, COALESCE(NULLIF(TRIM(p_status), ''), 'scheduled'))
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

GRANT EXECUTE ON FUNCTION create_event(int, text, text, timestamptz, timestamptz, text, text, text) TO anon, authenticated;



create or replace function public.check_admin_user_email(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.admin_users
    where lower(email) = lower(p_email)
  );
$$;

revoke all on function public.check_admin_user_email(text) from public;
grant execute on function public.check_admin_user_email(text) to anon, authenticated;


CREATE TABLE public.sessions (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- THIS IS THE CORRECTED LINE --
  user_id bigint NOT NULL,
  -- -------------------------- --
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_token_key UNIQUE (token),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES admin_users (id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Allow service_role key to do everything (needed by Apps Script)
CREATE POLICY "Allow full access to service_role"
ON public.sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow public read-only access for anon key
CREATE POLICY "Allow public read-only access"
ON public.sessions
FOR SELECT
USING (true);


create or replace function public.admin_users_register(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_zone text,
  p_college_id int
) returns table(id int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists(select 1 from public.admin_users where lower(email)=lower(p_email)) then
    raise exception 'duplicate_email' using errcode = '23505';
  end if;

  insert into public.admin_users(email, password, full_name, role, zone, college_id)
  values (p_email, p_password, p_full_name, p_role, p_zone, p_college_id)
  returning admin_users.id into id;

  return next;
end;
$$;

revoke all on function public.admin_users_register(text,text,text,text,text,int) from public;
grant execute on function public.admin_users_register(text,text,text,text,text,int) to anon, authenticated;


-- 1) Inspect existing signature (optional)
select oid::regprocedure, prosrc
from pg_proc
where proname = 'admin_users_register';

-- 2) Drop the existing function with its exact signature
drop function if exists public.admin_users_register(text, text, text, text, text, integer);

-- 3) Recreate as SECURITY DEFINER and with the desired return type
create or replace function public.admin_users_register(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_zone text,
  p_college_id integer
) returns table(id integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists(select 1 from public.admin_users where lower(email)=lower(p_email)) then
    raise exception 'duplicate_email' using errcode = '23505';
  end if;

  insert into public.admin_users(email, password, full_name, role, zone, college_id)
  values (p_email, p_password, p_full_name, p_role, p_zone, p_college_id)
  returning admin_users.id into id;

  return next;
end;
$$;

revoke all on function public.admin_users_register(text,text,text,text,text,integer) from public;
grant execute on function public.admin_users_register(text,text,text,text,text,integer) to anon, authenticated;


-- Activity sections 
CREATE TABLE public.activity_log (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    details JSONB
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Allow Super Admins to read all logs
CREATE POLICY "Super Admins can read all activity logs"
ON public.activity_log FOR SELECT
TO authenticated
USING (
  (get_my_claim('role'::text)) = '"super_admin"'::jsonb
);


-- 1. Create the new table for executive members
CREATE TABLE IF NOT EXISTS public.executive_members (
    id SERIAL PRIMARY KEY,
    member_name TEXT NOT NULL,
    designation TEXT NOT NULL, -- e.g., President, Vice President, General Secretary
    role TEXT DEFAULT 'Executive Member', -- A general role category
    photo_url TEXT, -- URL to the member's photo
    contact_email TEXT UNIQUE, -- Optional email, ensure uniqueness if provided
    description TEXT, -- Short description or message
    display_order SMALLINT DEFAULT 0, -- Optional: To control the order they appear
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) - Important for security
ALTER TABLE public.executive_members ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public read access (for the website)
--    DROP POLICY first in case it already exists from testing
DROP POLICY IF EXISTS "Allow public read access" ON public.executive_members;

CREATE POLICY "Allow public read access"
ON public.executive_members
FOR SELECT
USING (true); -- Allows anyone to SELECT (read) data

-- 4. (Optional) Add some sample data - Replace with your actual members
INSERT INTO public.executive_members (member_name, designation, photo_url, description, display_order) VALUES
('Amit Sharma', 'President', '/Images/Executives/amit.jpg', 'Leading YUVA Delhi towards a brighter future.', 1),
('Priya Singh', 'Vice President', '/Images/Executives/priya.jpg', 'Supporting the vision and driving initiatives.', 2),
('Rahul Verma', 'General Secretary', '/Images/Executives/rahul.jpg', 'Managing organizational operations.', 3)
ON CONFLICT DO NOTHING; -- Avoid inserting duplicates if run multiple times

-- 5. Grant usage on the sequence for the primary key (needed for RLS + Inserts if using Supabase client)
--    May not be strictly necessary for read-only 'anon' key but good practice.
GRANT USAGE, SELECT ON SEQUENCE executive_members_id_seq TO anon, authenticated;