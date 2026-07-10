-- Check Authority Titles in Database
-- Run this query to verify the exact title values

SELECT 
    a.id as authority_id,
    a.first_name,
    a.last_name,
    a.title,
    LENGTH(a.title) as title_length,  -- Check for extra spaces
    a.email,
    u.email as user_email,
    u.role as user_role
FROM authorities a
JOIN users u ON a.user_id = u.id
ORDER BY a.title;

-- If titles are wrong, update them with these commands:

-- Update Principal (if needed)
-- UPDATE authorities SET title = 'Principal' WHERE title LIKE '%principal%';

-- Update Office Manager (if needed)  
-- UPDATE authorities SET title = 'Office Manager' WHERE title LIKE '%office%manager%' OR title LIKE '%om%';

-- Update Dean (if needed)
-- UPDATE authorities SET title = 'Dean' WHERE title LIKE '%dean%';

-- Update Vice Principal (if needed)
-- UPDATE authorities SET title = 'Vice Principal' WHERE title LIKE '%vice%principal%';
