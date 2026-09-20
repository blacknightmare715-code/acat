-- =========================================================================
-- ACAT CyberGuard — seed data
-- Run this AFTER supabase_schema.sql. Reproduces the sample alerts/guides
-- the prototype shipped with, so the app isn't empty on first real launch.
-- Replace/extend these with real ACAT-verified alerts before going live.
-- =========================================================================

insert into alerts (severity, category, title, summary, what, who, do_now, avoid, source, published_at, updated_at) values
(
  'critical', 'Phishing',
  'Fake KYC-update SMS impersonating banks in Assam',
  'Messages claiming your bank account/KYC will be blocked unless you click a link and enter details.',
  'A wave of SMS messages impersonating major banks is circulating, warning of account suspension and linking to look-alike login pages.',
  'Anyone with a bank account who receives SMS from unknown short codes claiming to be from their bank.',
  'Do not click the link. Visit your bank''s app or official website directly, or call the number printed on your card.',
  'Don''t enter your card number, CVV, OTP, or net-banking password on any page reached via an SMS link.',
  'ACAT volunteer monitoring, cross-checked with bank fraud advisories',
  now() - interval '2 days', now() - interval '1 day'
),
(
  'high', 'Loan app fraud',
  'Predatory instant-loan apps harvesting contacts',
  'Unregulated loan apps are requesting full contact and photo access, then using them for harassment on late payment.',
  'Several loan apps outside the RBI-regulated list are appearing in ads, asking for excessive permissions during signup.',
  'People searching for instant/emergency loans, especially students and gig workers.',
  'Check RBI''s list of registered NBFCs before installing any loan app. Revoke contacts/photos permission if already installed.',
  'Don''t grant contacts, gallery, or SMS permissions to any lending app.',
  'ACAT community reports, verified against RBI advisory',
  now() - interval '4 days', now() - interval '4 days'
),
(
  'warning', 'Job scam',
  '"Part-time task job" scam asking for upfront payment',
  'Telegram/WhatsApp groups offering paid ''like and subscribe'' tasks, later demanding deposits to ''unlock'' earnings.',
  'Recruiters message with easy daily-earning tasks, build small trust with tiny payouts, then ask for a deposit to access larger tasks — and disappear.',
  'Job seekers contacted via WhatsApp/Telegram by unknown recruiters.',
  'Treat any request to pay money to receive a job or ''unlock earnings'' as a scam. Stop responding and block the contact.',
  'Never pay a deposit, ''registration fee'', or ''tax'' to a recruiter to receive money you supposedly already earned.',
  'ACAT community reports',
  now() - interval '7 days', now() - interval '7 days'
);

insert into guides (title, body) values
('How to spot a phishing SMS or email', 'Look for urgency, unfamiliar sender numbers, mismatched links (hover or long-press to preview the real URL before tapping), and requests for OTP/PIN/CVV — a legitimate bank will never ask for these. When in doubt, open your bank''s app directly instead of tapping a link.'),
('If you already sent money to a scammer', 'Don''t waste time confronting them. Call the national cyber crime helpline 1930 immediately — banks can sometimes freeze funds within a short window. File a complaint at cybercrime.gov.in and keep your transaction reference ready.'),
('Securing your WhatsApp account', 'Enable two-step verification in WhatsApp settings. Never share the 6-digit SMS verification code with anyone, even someone claiming to be WhatsApp support or a friend in trouble.'),
('Recognising fake loan apps', 'Check the lender against the RBI''s public list of registered NBFCs before installing anything. Be wary of apps that ask for full contact list or gallery access — that access is often used later for harassment.'),
('Job offer red flags', 'Genuine employers don''t ask candidates to pay registration fees, security deposits, or ''unlock'' their own salary. Verify the company independently before sharing ID documents.');
