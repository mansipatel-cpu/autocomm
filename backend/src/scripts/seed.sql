-- =====================================================================
-- AutoComm PostgreSQL Initial Setup Script
-- Only provisions the essential Super Admin root operator
-- =====================================================================

-- 1. Super Admin User (Email: superadmin@autocomm.io / Password: SuperAdmin@2026)
INSERT INTO users (client_id, name, email, password_hash, role, status, must_change_password)
VALUES (
    NULL,
    'Root Operator',
    'superadmin@autocomm.io',
    '$2a$10$tJ9fFjT.s8yXbB4.c9P01uG5o4hL6E7l9m8k7j6h5g4f3e2d1c0ba',
    'Super Admin',
    'active',
    FALSE
) ON CONFLICT DO NOTHING;
