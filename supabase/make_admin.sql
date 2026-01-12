-- Replace 'YOUR_EMAIL_HERE' with your actual login email
UPDATE public.users 
SET 
    is_admin = TRUE,
    has_heritage_pack = TRUE,
    has_enforcer_pack = TRUE,
    has_nostalgia_pack = TRUE
WHERE email = 'YOUR_EMAIL_HERE';

-- Check if it worked
SELECT * FROM public.users WHERE email = 'YOUR_EMAIL_HERE';
