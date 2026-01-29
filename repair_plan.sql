-- Generated at 2026-01-29T02-10-28-730Z
UPDATE sys_api_registry SET default_body = '{"json":{"email":"example@email.com"}}'::jsonb WHERE path = '/api/auth/recover' AND method = 'POST';

-- Generated at 2026-01-29T02-10-49-779Z
UPDATE sys_api_registry SET default_body = '{"json":{"email":"example@example.com","password":"weak_password","full_name":"John Doe"}}'::jsonb WHERE path = '/api/auth/register' AND method = 'POST';

-- Generated at 2026-01-29T02-10-57-421Z
UPDATE sys_api_registry SET default_body = '{}'::jsonb WHERE path = '/api/auth/reset-password' AND method = 'POST';

-- Generated at 2026-01-29T02-11-32-909Z
UPDATE sys_api_registry SET default_body = '{"json":"{\"name\":\"\",\"type\":\"\"}"}'::jsonb WHERE path = '/api/orgs' AND method = 'POST';

-- Generated at 2026-01-29T02-11-42-797Z
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/profiles/me/avatar' AND method = 'POST';

UPDATE sys_api_registry SET default_body = '{"json":{"email":"your_email","password":"your_password"}}'::jsonb WHERE path = '/api/auth/login' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/auth/login' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/auth/login' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/auth/logout' AND method = 'POST';
UPDATE sys_api_registry SET default_body = '{"json":{"email":"<EMAIL_ADDRESS>","password":"<PASSWORD>"}}'::jsonb WHERE path = '/api/auth/login' AND method = 'POST';
UPDATE sys_api_registry SET default_body = '{}'::jsonb WHERE path = '/api/auth/logout' AND method = 'POST';
UPDATE sys_api_registry SET default_body = '{"json":{"success":false,"error":"Email is required"}}'::jsonb WHERE path = '/api/auth/recover' AND method = 'POST';
UPDATE sys_api_registry SET default_body = '{"json":{"refresh_token":"your_refresh_token_here"}}'::jsonb WHERE path = '/api/auth/refresh' AND method = 'POST';
UPDATE sys_api_registry SET default_body = '{"email":null,"password":null,"full_name":null}'::jsonb WHERE path = '/api/auth/register' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/auth/reset-password' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/auth/session' AND method = 'GET';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/jobs' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/auth/login' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/auth/logout' AND method = 'POST';
UPDATE sys_api_registry SET default_body = 'undefined'::jsonb WHERE path = '/api/v1/roles/{roleId}/verify' AND method = 'POST';
