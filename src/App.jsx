import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  Shield, AlertTriangle, Bell, Globe, ChevronRight, ChevronLeft,
  Home, FileWarning, FolderLock, ClipboardList, BookOpen, Info, Lock,
  ExternalLink, Siren, X, Circle, Copy, Check, Send, FileCheck2,
  Clock, FilePlus2, Fingerprint, Image, FileText, Link2, ShieldCheck, Loader2,
  ArrowRightLeft, MessageCircle, MessageSquare, ThumbsUp,
} from "lucide-react";

/* =========================================================================
   ACAT CyberGuard — Phase 1: Mobile PWA Shell
   Dashboard · Alerts · Safety Guides · ACAT/About · Privacy Center · Settings
   Emergency Capture / Report / Evidence / My Reports are stubbed for later
   phases (2-4) and clearly marked "coming soon" so the shell is honest about
   what works today.
   ========================================================================= */

/* ---------- Design tokens (from design.md — do not invent new colors) --- */
const TOKENS = `
  :root{
    --acg-bg:#07110F; --acg-surface:#0D1B18; --acg-surface-2:#132521;
    --acg-primary:#2E8B57; --acg-primary-strong:#1F6B43; --acg-accent:#D9B44A;
    --acg-text:#F4F7F5; --acg-text-muted:#AAB9B3; --acg-danger:#D64545;
    --acg-warning:#D99A2B; --acg-success:#3FAE70; --acg-border:#244039;
  }
  .acg-root{ background:var(--acg-bg); color:var(--acg-text);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .acg-surface{ background:var(--acg-surface); border:1px solid var(--acg-border); }
  .acg-surface-2{ background:var(--acg-surface-2); border:1px solid var(--acg-border); }
  .acg-muted{ color:var(--acg-text-muted); }
  .acg-primary-btn{ background:var(--acg-primary); color:#F4F7F5; }
  .acg-primary-btn:active{ background:var(--acg-primary-strong); }
  .acg-accent-text{ color:var(--acg-accent); }
  .acg-danger-text{ color:var(--acg-danger); }
  .acg-warning-text{ color:var(--acg-warning); }
  .acg-success-text{ color:var(--acg-success); }
  .acg-border-t{ border-top:1px solid var(--acg-border); }
  .acg-border-b{ border-bottom:1px solid var(--acg-border); }
  .acg-focus:focus-visible{ outline:2px solid var(--acg-accent); outline-offset:2px; }
  .acg-tap{ min-height:44px; min-width:44px; }
  @keyframes acg-spin{ to{ transform:rotate(360deg); } }
  .acg-spin{ animation:acg-spin 1s linear infinite; }
  @media (prefers-reduced-motion: reduce){ .acg-anim{ transition:none !important; animation:none !important; } }
`;

/* ---------- Copy / i18n scaffold ----------------------------------------
   Architecture supports en / hi / as. Only English is populated with real
   copy right now — hi/as fall back to English strings until translated,
   but the switcher, persisted preference, and lookup path all work today
   so translation is a content task, not an engineering one, later. */
const LOCALES = { en: "English", hi: "हिन्दी", as: "অসমীয়া" };

const EN = {
  appName: "ACAT CyberGuard",
  tagline: "Independent volunteer cyber-safety initiative",
  nav_home: "Home", nav_alerts: "Alerts", nav_report: "Report",
  nav_evidence: "Evidence", nav_reports: "Reports",
  dash_status_title: "Security status",
  dash_status_ok: "No active critical alerts",
  dash_latest_alert: "Latest ACAT alert",
  dash_read_alert: "Read alert",
  dash_emergency_title: "Emergency Capture",
  dash_emergency_sub: "Preserve evidence now",
  dash_emergency_cta: "Start incident",
  dash_recent_title: "Recent incidents",
  dash_recent_empty: "No incidents yet. If something suspicious happens, start Emergency Capture to preserve evidence.",
  soon_title: "Coming in a later phase",
  soon_report: "Structured incident reporting is being built in Phase 2-3. Emergency Capture will let you start an incident and preserve evidence immediately.",
  soon_evidence: "The Evidence Locker (secure uploads, SHA-256 integrity hashing, signed access) arrives in Phase 4.",
  soon_reports: "My Reports will track your Incident ID and status once incident creation ships in Phase 2.",
  soon_close: "Got it",
  alerts_title: "ACAT Alerts",
  alerts_empty: "No alerts right now. You'll be notified here when ACAT publishes a verified warning.",
  alert_what_happening: "What is happening?",
  alert_who: "Who may be affected?",
  alert_do: "What to do now",
  alert_avoid: "What to avoid",
  alert_source: "Source / verification",
  guides_title: "Safety guides",
  about_title: "About ACAT",
  about_body1: "Assam Cyber Aegis Team (ACAT) is an independent, volunteer-run community initiative. ACAT is not a government agency, a bank, the police, or CERT-In, and does not guarantee fund recovery or legal outcomes.",
  about_body2: "CyberGuard helps you respond calmly, preserve evidence, and stay organised while you use official channels for serious cases.",
  about_official_title: "Official channels for urgent cases",
  about_official_body: "If money has been transferred or personal documents are compromised, contact the national cyber crime helpline 1930 and file a report at cybercrime.gov.in without delay.",
  privacy_title: "Privacy Center",
  privacy_collected_title: "What we collect",
  privacy_collected_body: "Only what's needed to handle an incident: the details you enter, evidence you choose to upload, and basic account info. We never ask for passwords, OTPs, PINs, card CVV, recovery codes, or private keys.",
  privacy_why_title: "Why it's collected",
  privacy_why_body: "Incident handling, communicating with you about your report, safety guidance, and operational accountability. Nothing more.",
  privacy_retention_title: "Retention",
  privacy_retention_body: "Incident data is kept only as long as your case and policy require, then deleted or archived per ACAT's retention policy.",
  privacy_export_title: "Export or delete your data",
  privacy_export_body: "You'll be able to request an export or deletion of your data from Settings once account sync is enabled.",
  privacy_notif_title: "Notifications",
  privacy_device_title: "On this device",
  privacy_device_body: "Language and notification preferences are currently stored on this device only.",
  settings_title: "Settings",
  settings_language: "Language",
  settings_language_note: "Hindi and Assamese interfaces are on the way — shown in English for now.",
  settings_notifications: "Alert notifications",
  settings_notifications_sub: "Get notified when ACAT publishes a verified alert",
  settings_privacy_link: "Privacy Center",
  settings_about_link: "About ACAT",
  severity_informational: "Informational", severity_warning: "Warning",
  severity_high: "High", severity_critical: "Critical",
  back: "Back",

  onboard_title: "Welcome to ACAT CyberGuard",
  onboard_sub: "What should we call you?",
  onboard_placeholder: "Your name",
  onboard_cta: "Continue",

  auth_title: "Sign in to ACAT CyberGuard",
  auth_sub: "Enter your email. We'll send you a sign-in link and a 6-digit code — this keeps your reports and evidence tied to your account so you can come back to them later.",
  auth_email_placeholder: "you@example.com",
  auth_send_code: "Send code",
  auth_sending: "Sending…",
  auth_invalid_email: "Enter a valid email address.",
  auth_send_failed: "Couldn't send the email. Check the address and try again.",
  auth_check_email_title: "Check your email",
  auth_check_email_sub: "We sent a link and a 6-digit code to",
  auth_check_email_hint: "Click the link in that email, or enter the code below.",
  auth_code_placeholder: "6-digit code",
  auth_verify: "Verify & continue",
  auth_verifying: "Verifying…",
  auth_code_invalid: "That code didn't work. Check it and try again.",
  auth_use_different_email: "Use a different email",
  auth_resend_code: "Resend code",

  type_scam: "Scam / fraud", type_phishing: "Phishing",
  type_account: "Account compromise", type_harassment: "Harassment",
  type_fakeprofile: "Fake profile", type_malware: "Malware / suspicious file",
  type_other: "Other",

  report_type_title: "What happened?",
  report_type_sub: "This helps ACAT route your report correctly. You can add more detail next.",
  report_details_title: "A few details",
  field_occurred: "When did this happen (approx.)?",
  field_platform: "Platform / channel",
  field_platform_placeholder: "e.g. WhatsApp, SMS, a bank call",
  field_description: "What happened?",
  field_description_placeholder: "Describe what happened in your own words. Don't include passwords, OTPs, or card details.",
  field_impact: "Financial impact",
  impact_none: "No money lost", impact_low: "Under ₹10,000",
  impact_mid: "₹10,000 – ₹1,00,000", impact_high: "Over ₹1,00,000",
  impact_prefer_not: "Prefer not to say",
  field_urgency: "Urgency",
  urgency_low: "Low", urgency_medium: "Medium", urgency_high: "High — money moving now",
  field_contact: "Preferred contact channel",
  contact_app: "In-app notification", contact_phone: "Phone", contact_email: "Email",
  field_consent: "I understand ACAT CyberGuard is an independent volunteer initiative and does not replace official reporting channels.",
  report_no_secrets: "Never include passwords, OTPs, PINs, CVV, recovery codes, or private keys here.",
  report_submit: "Submit report",
  report_created_title: "Incident created",
  report_created_sub: "Save this Incident ID — you'll use it to track your report.",
  report_view_incident: "View incident",
  report_done: "Back to dashboard",
  copied: "Copied",

  incident_summary: "Summary", incident_timeline: "Timeline", incident_next_steps: "Next steps",
  incident_evidence_note: "Evidence uploads open once the Evidence Locker ships in Phase 4.",
  incident_type_label: "Type", incident_platform_label: "Platform",
  incident_occurred_label: "Occurred", incident_impact_label: "Financial impact",

  status_submitted: "Submitted", status_reviewing: "Reviewing", status_guidance: "Guidance",
  status_closed: "Closed", status_needs_information: "Needs information",
  status_escalated: "Escalated", status_archived: "Archived",

  next_submitted: "ACAT will review your report. You'll see updates here — no need to follow up yet.",
  next_reviewing: "An ACAT reviewer is looking at your case.",
  next_guidance: "ACAT has shared guidance for your case below.",
  next_needs_information: "ACAT needs more information from you to continue.",
  next_closed: "This case is closed.",
  next_escalated: "This case has been escalated for further handling.",
  next_archived: "This case has been archived.",

  event_incident_started: "Incident started", event_report_submitted: "Report submitted",

  my_reports_title: "My Reports",
  my_reports_empty: "No reports yet. Start Emergency Capture when something suspicious happens.",

  emergency_intro_title: "Something happened?",
  emergency_intro_sub: "You can save evidence first and report details later.",
  emergency_intro_secondary: "Not urgent? Browse safety guides instead.",
  preserve_title: "Preserve evidence first",
  preserve_sub: "Before anything else:",
  preserve_dont_delete: "Don't delete messages, calls, or files",
  preserve_dont_edit: "Don't edit or crop screenshots",
  preserve_dont_reply: "Don't reply to the suspicious sender unless instructed",
  preserve_dont_share: "Don't share OTP, password, PIN, or card details — with anyone, including someone claiming to help",
  preserve_money_title: "If money was already transferred",
  preserve_money_body: "Contact the national cyber crime helpline 1930 and file at cybercrime.gov.in right away — acting fast matters.",
  preserve_continue: "I understand, continue",
  clock_label: "Incident time",
  continue_label: "Continue",

  evidence_categories_title: "Save evidence",
  evidence_categories_sub: "Mark what you have. Actual uploads open once the Evidence Locker ships in Phase 4 — for now this preserves a timestamped record that you have it.",
  evidence_screenshot: "Screenshot", evidence_message: "Message / export",
  evidence_photo: "Photo / video", evidence_document: "Document",
  evidence_link: "Link / URL", evidence_note: "Note",
  evidence_marked: "Marked", evidence_note_placeholder: "Write down what you remember while it's fresh — names, numbers, links, anything useful.",
  evidence_note_save: "Save note",
  evidence_count_one: "item noted", evidence_count_other: "items noted",

  created_mid_sub: "Your evidence notes are saved. Finish your report now, or continue later — this incident will wait for you in My Reports.",
  created_continue: "Continue report",
  created_save_later: "Save for later",

  status_draft: "In progress",
  next_draft: "Pick up where you left off — continue capturing evidence or submit your report when you're ready.",
  incident_continue_capture: "Continue capturing evidence",
  event_evidence_added: "Evidence noted",
  event_evidence_hash_generated: "Integrity hash generated",

  evidence_locker_title: "Evidence Locker",
  evidence_locker_empty: "No evidence saved yet. Evidence you preserve during Emergency Capture — or add here — will appear per incident.",
  evidence_add_more: "Add evidence",
  evidence_link_placeholder: "Paste the link here",
  evidence_link_save: "Save link",
  evidence_hashing: "Hashing…",
  evidence_verify: "Verify integrity",
  evidence_verified: "Integrity verified",
  evidence_verify_mismatch: "Hash mismatch — file may have changed",
  evidence_view: "View",
  evidence_download: "Download",
  evidence_hash_label: "SHA-256",
  evidence_malware_note: "Malware scanning isn't wired up yet — files are stored securely but not yet scanned before staff can view them.",
  evidence_file_too_large: "That file is over 10 MB — try a smaller file or compress it first.",
  evidence_upload_failed: "Upload failed — check your connection and try again.",
  startup_failed: "Couldn't connect — check your Supabase setup (URL, anon key, and that Anonymous sign-ins is enabled).",
  action_failed: "That didn't go through — check your connection and try again.",
  staff_action_failed: "Action failed — your account may not be marked as staff yet (see staff_roles in Supabase).",
  incident_open_locker: "Open in Evidence Locker",

  event_status_changed: "Status updated",
  event_acat_guidance: "ACAT guidance",
  event_user_message: "Message sent",
  event_user_acknowledgement: "Marked as read",

  guidance_latest_title: "Latest guidance from ACAT",
  guidance_reply_placeholder: "Add a note or answer for ACAT",
  guidance_reply_send: "Send",
  guidance_acknowledge: "Mark as read",

  settings_staff_link: "Staff view (demo)",
  settings_staff_note: "Simulates the ACAT reviewer role until real staff accounts exist on the backend.",
  staff_title: "ACAT Staff (Demo)",
  staff_exit: "Exit staff view",
  staff_filter_open: "Open",
  staff_filter_all: "All",
  staff_queue_empty: "No incidents in the queue.",
  staff_compose_placeholder: "Write your message to the reporter…",
  staff_send: "Send",
  staff_cancel: "Cancel",
  staff_start_review: "Start review",
  staff_send_guidance: "Send guidance",
  staff_send_update: "Send update",
  staff_request_info: "Request info",
  staff_escalate: "Escalate",
  staff_close: "Close case",
  staff_archive: "Archive",
};

const STRINGS = { en: EN, hi: EN, as: EN };
function useT(lang) {
  return useCallback((key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key, [lang]);
}

/* ---------- Data provider abstraction -----------------------------------
   Every method maps to a real Supabase table/query — see supabase_schema.sql
   for the tables and RLS policies these calls rely on. Nothing in the UI
   layer talks to Supabase directly; it only ever calls this `api` object. */
const INCIDENT_TYPES = [
  { id: "scam", labelKey: "type_scam" },
  { id: "phishing", labelKey: "type_phishing" },
  { id: "account", labelKey: "type_account" },
  { id: "harassment", labelKey: "type_harassment" },
  { id: "fakeprofile", labelKey: "type_fakeprofile" },
  { id: "malware", labelKey: "type_malware" },
  { id: "other", labelKey: "type_other" },
];

const STATUS_ORDER = ["draft", "submitted", "reviewing", "guidance", "closed"];
const STATUS_META = {
  draft: { color: "var(--acg-accent)" },
  submitted: { color: "var(--acg-text-muted)" },
  reviewing: { color: "var(--acg-warning)" },
  guidance: { color: "var(--acg-primary)" },
  closed: { color: "var(--acg-success)" },
  needs_information: { color: "var(--acg-warning)" },
  escalated: { color: "var(--acg-danger)" },
  archived: { color: "var(--acg-text-muted)" },
};

const EVIDENCE_CATEGORIES = [
  { id: "screenshot", labelKey: "evidence_screenshot" },
  { id: "message_export", labelKey: "evidence_message" },
  { id: "photo_video", labelKey: "evidence_photo" },
  { id: "document", labelKey: "evidence_document" },
  { id: "link_url", labelKey: "evidence_link" },
  { id: "note", labelKey: "evidence_note" },
];

/* Cryptographically random Incident ID: ACAT-YYYY-XXXXXX. No PII encoded,
   non-sequential, per rules.md's Incident ID Rules. */
function generateIncidentCode() {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  const bytes = new Uint8Array(6);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length];
  return `ACAT-${year}-${code}`;
}
function generateEventId() {
  const bytes = new Uint8Array(8);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* Live "incident clock" — shown through the capture flow per design.md so
   the person can see time is being tracked without it feeling clinical. */
function useElapsedSeconds(startIso) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startIso) return undefined;
    const startMs = new Date(startIso).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);
  return elapsed;
}
function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
function IncidentClockBar({ t, startedAt }) {
  const elapsed = useElapsedSeconds(startedAt);
  return (
    <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-xs acg-muted">
      <Clock size={13} className="acg-accent-text" />
      <span>{t("clock_label")}</span>
      <span className="font-mono">{formatElapsed(elapsed)}</span>
    </div>
  );
}

/* ---------- Evidence file helpers (Phase 4→5, real backend) -------------
   Hashing happens client-side with SubtleCrypto before upload — this is the
   integrity hash from architecture.md. The file itself goes to Supabase
   Storage; only its metadata + hash live in Postgres. */
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB — real backend, no more artifact-storage ceiling

async function sha256Hex(arrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ---------- Row <-> app-shape mapping -------------------------------------
   Every screen in this app was written against the shapes below (an
   incident carrying its own `evidence` and `timeline` arrays, snake_case
   swapped for the odd camelCase field). Keeping that mapping isolated here
   means zero UI components needed to change when the data source did. */
function mapEvidenceRow(row) {
  return {
    id: row.id,
    category: row.category,
    note: row.note,
    url: row.url,
    file: row.file_name
      ? { name: row.file_name, mime: row.file_mime, size: row.file_size, sha256: row.file_sha256, storagePath: row.storage_path }
      : null,
    added_at: row.added_at,
  };
}
function mapTimelineRow(row) {
  return {
    id: row.id,
    event_type: row.event_type,
    category: row.category,
    from: row.from_status,
    to: row.to_status,
    message: row.message,
    hash: row.hash,
    created_at: row.created_at,
  };
}
function mapIncidentRow(row) {
  return {
    id: row.id, // real DB uuid — used for all navigation/foreign-key lookups
    incident_code: row.incident_code,
    user_id: row.user_id,
    type: row.type,
    status: row.status,
    severity: row.severity,
    occurred_at: row.occurred_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    submitted_at: row.submitted_at,
    closed_at: row.closed_at,
    report: row.report || {},
    evidence: (row.evidence || []).map(mapEvidenceRow).sort((a, b) => new Date(a.added_at) - new Date(b.added_at)),
    timeline: (row.timeline_events || []).map(mapTimelineRow).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  };
}
function mapAlertRow(row) {
  return {
    id: row.id, severity: row.severity, category: row.category, title: row.title,
    summary: row.summary, what: row.what, who: row.who, doNow: row.do_now, avoid: row.avoid,
    source: row.source, published: row.published_at, updated: row.updated_at,
  };
}

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

function makeDataProvider() {
  return {
    async getAlerts() {
      const { data, error } = await supabase.from("alerts").select("*").order("published_at", { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(mapAlertRow);
    },
    async getAlert(id) {
      const { data, error } = await supabase.from("alerts").select("*").eq("id", id).maybeSingle();
      if (error || !data) return null;
      return mapAlertRow(data);
    },
    async getGuides() {
      const { data, error } = await supabase.from("guides").select("*").order("created_at", { ascending: true });
      if (error) { console.error(error); return []; }
      return (data || []).map((r) => ({ id: r.id, title: r.title, body: r.body }));
    },

    async getProfile() {
      const userId = await currentUserId();
      if (!userId) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) { console.error(error); return null; }
      return data ? { name: data.name } : null;
    },
    async setProfile(profile) {
      const userId = await currentUserId();
      if (!userId) return;
      const { error } = await supabase.from("profiles").upsert({ id: userId, name: profile.name });
      if (error) throw error;
    },

    async getIncidents() {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, evidence(*), timeline_events(*)")
        .order("created_at", { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(mapIncidentRow);
    },
    async getIncident(id) {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, evidence(*), timeline_events(*)")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return mapIncidentRow(data);
    },
    // Mirrors POST /api/incidents (create draft) + PATCH /api/incidents/:id
    // + POST /api/incidents/:id/submit from architecture.md, split into
    // small mutations so each Emergency Capture step persists immediately.
    // Status transitions (setStatus/addGuidance below) are the ones a real
    // deployment must lock to staff accounts server-side — see the RLS
    // policies on timeline_events in supabase_schema.sql.
    async createDraftIncident() {
      const userId = await currentUserId();
      if (!userId) throw new Error("Not signed in");
      const now = new Date().toISOString();
      const code = generateIncidentCode();
      const { data, error } = await supabase.from("incidents").insert({
        incident_code: code,
        user_id: userId,
        type: null,
        status: "draft",
        severity: "unassessed",
        report: { platform: "", description: "", impact: "impact_prefer_not", urgency: "urgency_low", contact: "contact_app", consent_version: null },
      }).select().single();
      if (error) throw error;
      await supabase.from("timeline_events").insert({ incident_id: data.id, event_type: "incident_started", created_at: now });
      return mapIncidentRow({ ...data, evidence: [], timeline_events: [{ id: generateEventId(), event_type: "incident_started", created_at: now }] });
    },
    async _touch(id) {
      await supabase.from("incidents").update({ updated_at: new Date().toISOString() }).eq("id", id);
    },
    async setIncidentType(id, type) {
      const { error } = await supabase.from("incidents").update({ type, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    async addEvidenceNote(id, { category, note }) {
      const now = new Date().toISOString();
      const { error } = await supabase.from("evidence").insert({ incident_id: id, category, note: note || "", added_at: now });
      if (error) throw error;
      await supabase.from("timeline_events").insert({ incident_id: id, event_type: "evidence_added", category, created_at: now });
      await this._touch(id);
    },
    async addEvidenceLink(id, { url }) {
      const now = new Date().toISOString();
      const { error } = await supabase.from("evidence").insert({ incident_id: id, category: "link_url", url, added_at: now });
      if (error) throw error;
      await supabase.from("timeline_events").insert({ incident_id: id, event_type: "evidence_added", category: "link_url", created_at: now });
      await this._touch(id);
    },
    // Signed URL for viewing/downloading/re-hashing a stored file. Expires
    // quickly on purpose — this stands in for "signed access" from
    // architecture.md rather than ever exposing the bucket publicly.
    async getEvidenceUrl(storagePath) {
      const { data, error } = await supabase.storage.from("evidence").createSignedUrl(storagePath, 600);
      if (error) throw error;
      return data.signedUrl;
    },
    async addEvidenceFile(id, { category, file, sha256 }) {
      const userId = await currentUserId();
      const token = crypto.randomUUID();
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const storagePath = `${userId}/${id}/${token}${ext}`;
      const { error: upErr } = await supabase.storage.from("evidence").upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;
      const now = new Date().toISOString();
      const { error } = await supabase.from("evidence").insert({
        incident_id: id, category, file_name: file.name, file_mime: file.type,
        file_size: file.size, file_sha256: sha256, storage_path: storagePath, added_at: now,
      });
      if (error) throw error;
      await supabase.from("timeline_events").insert([
        { incident_id: id, event_type: "evidence_added", category, created_at: now },
        { incident_id: id, event_type: "evidence_hash_generated", category, hash: sha256, created_at: now },
      ]);
      await this._touch(id);
    },
    async submitReport(id, reportFields) {
      const now = new Date().toISOString();
      const { data: current } = await supabase.from("incidents").select("created_at").eq("id", id).single();
      const { error } = await supabase.from("incidents").update({
        occurred_at: reportFields.occurredAt || current?.created_at || now,
        report: {
          platform: reportFields.platform || "",
          description: reportFields.description || "",
          impact: reportFields.impact || "impact_prefer_not",
          urgency: reportFields.urgency || "urgency_low",
          contact: reportFields.contact || "contact_app",
          consent_version: "v1",
        },
        status: "submitted",
        submitted_at: now,
        updated_at: now,
      }).eq("id", id);
      if (error) throw error;
      await supabase.from("timeline_events").insert({ incident_id: id, event_type: "report_submitted", created_at: now });
    },
    // Phase 5 — Guidance & Status. RLS only allows these timeline_events
    // inserts (and status changes matter for what's shown to the reporter)
    // from accounts present in staff_roles — see supabase_schema.sql. The
    // simulated Staff view in Settings calls the same functions real staff
    // tooling would; only a real staff_roles row makes them succeed.
    async setStatus(id, status) {
      const { data: current, error: readErr } = await supabase.from("incidents").select("status").eq("id", id).single();
      if (readErr) throw readErr;
      if (current.status === status) return;
      const now = new Date().toISOString();
      const { error } = await supabase.from("incidents").update({
        status, updated_at: now, closed_at: status === "closed" ? now : null,
      }).eq("id", id);
      if (error) throw error;
      await supabase.from("timeline_events").insert({ incident_id: id, event_type: "status_changed", from_status: current.status, to_status: status, created_at: now });
    },
    async addGuidance(id, message) {
      const { error } = await supabase.from("timeline_events").insert({ incident_id: id, event_type: "acat_guidance", message, created_at: new Date().toISOString() });
      if (error) throw error;
    },
    async addUserMessage(id, message) {
      const { error } = await supabase.from("timeline_events").insert({ incident_id: id, event_type: "user_message", message, created_at: new Date().toISOString() });
      if (error) throw error;
      await this._touch(id);
    },
    async addAcknowledgement(id) {
      const { error } = await supabase.from("timeline_events").insert({ incident_id: id, event_type: "user_acknowledgement", created_at: new Date().toISOString() });
      if (error) throw error;
      await this._touch(id);
    },

    // Device-level UI prefs (language, notification toggle) — not worth a
    // DB round trip or a schema change, so these stay in localStorage even
    // on the real backend.
    async getPref(key, fallback) {
      try {
        const v = localStorage.getItem(`acg-pref-${key}`);
        return v !== null ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },
    async setPref(key, value) {
      try { localStorage.setItem(`acg-pref-${key}`, JSON.stringify(value)); } catch { /* best-effort */ }
    },
  };
}
const api = makeDataProvider();

/* ---------- Small shared UI bits ---------------------------------------- */
function SeverityBadge({ severity, t }) {
  const map = {
    critical: { color: "var(--acg-danger)", label: t("severity_critical"), icon: <Siren size={14} /> },
    high: { color: "var(--acg-danger)", label: t("severity_high"), icon: <AlertTriangle size={14} /> },
    warning: { color: "var(--acg-warning)", label: t("severity_warning"), icon: <AlertTriangle size={14} /> },
    informational: { color: "var(--acg-text-muted)", label: t("severity_informational"), icon: <Info size={14} /> },
  };
  const s = map[severity] || map.informational;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
      style={{ color: s.color, border: `1px solid ${s.color}` }}>
      {s.icon}{s.label}
    </span>
  );
}

function StatusBadge({ status, t }) {
  const meta = STATUS_META[status] || STATUS_META.submitted;
  const label = t(`status_${status}`);
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
      style={{ color: meta.color, border: `1px solid ${meta.color}` }}>
      <Circle size={8} fill={meta.color} stroke="none" />{label}
    </span>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div className="acg-surface acg-border-b flex items-center gap-2 px-4 py-3 sticky top-0 z-10">
      {onBack ? (
        <button onClick={onBack} aria-label="Back" className="acg-tap acg-focus flex items-center justify-center rounded-lg -ml-2">
          <ChevronLeft size={22} />
        </button>
      ) : <Shield size={22} className="acg-accent-text" />}
      <h1 className="text-base font-semibold flex-1 truncate">{title}</h1>
      {right}
    </div>
  );
}

function BottomNav({ active, onChange, t }) {
  const items = [
    { key: "home", label: t("nav_home"), icon: Home },
    { key: "alerts", label: t("nav_alerts"), icon: FileWarning },
    { key: "report", label: t("nav_report"), icon: Siren, emphasized: true },
    { key: "evidence", label: t("nav_evidence"), icon: FolderLock },
    { key: "reports", label: t("nav_reports"), icon: ClipboardList },
  ];
  return (
    <nav className="acg-surface acg-border-t fixed bottom-0 left-0 right-0 flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        if (it.emphasized) {
          return (
            <button key={it.key} onClick={() => onChange(it.key)} aria-label={it.label}
              className="acg-focus flex flex-col items-center justify-center gap-1 -mt-4 px-3">
              <span className="acg-primary-btn acg-tap flex items-center justify-center rounded-full shadow-lg" style={{ width: 52, height: 52, boxShadow: "0 4px 14px rgba(46,139,87,0.45)" }}>
                <Icon size={24} />
              </span>
              <span className="text-[11px] font-medium" style={{ color: "var(--acg-primary)" }}>{it.label}</span>
            </button>
          );
        }
        return (
          <button key={it.key} onClick={() => onChange(it.key)} aria-label={it.label}
            className="acg-focus acg-tap flex flex-col items-center justify-center gap-1 flex-1 py-2">
            <Icon size={20} color={isActive ? "var(--acg-accent)" : "var(--acg-text-muted)"} />
            <span className="text-[11px]" style={{ color: isActive ? "var(--acg-accent)" : "var(--acg-text-muted)" }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* Desktop-width companion to BottomNav — same tab keys/behaviour (including
   the "report" key launching Emergency Capture instead of switching tabs),
   just laid out as a persistent left rail instead of a bottom bar so wide
   screens read as a website, not a stretched phone screen. */
function SidebarNav({ active, onChange, t }) {
  const items = [
    { key: "home", label: t("nav_home"), icon: Home },
    { key: "alerts", label: t("nav_alerts"), icon: FileWarning },
    { key: "report", label: t("nav_report"), icon: Siren, emphasized: true },
    { key: "evidence", label: t("nav_evidence"), icon: FolderLock },
    { key: "reports", label: t("nav_reports"), icon: ClipboardList },
  ];
  return (
    <nav className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 acg-surface acg-border-b md:border-b-0 md:border-r px-3 py-6 gap-1">
      <div className="flex items-center gap-2 px-2 mb-6">
        <Shield size={22} className="acg-accent-text" />
        <span className="font-semibold text-sm">{t("appName")}</span>
      </div>
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onChange(it.key)}
            className="acg-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left"
            style={{
              background: it.emphasized ? "var(--acg-primary)" : isActive ? "var(--acg-surface-2)" : "transparent",
              color: it.emphasized ? "#F4F7F5" : isActive ? "var(--acg-accent)" : "var(--acg-text-muted)",
            }}>
            <Icon size={18} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

function ComingSoonModal({ open, onClose, body, t }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="acg-surface-2 w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Circle size={18} className="acg-accent-text" />
            <h2 className="font-semibold">{t("soon_title")}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="acg-tap acg-focus flex items-center justify-center -mt-2 -mr-2 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <p className="acg-muted text-sm leading-relaxed mb-4">{body}</p>
        <button onClick={onClose} className="acg-primary-btn acg-focus w-full rounded-xl py-3 font-medium">{t("soon_close")}</button>
      </div>
    </div>
  );
}

/* ---------- Screens ------------------------------------------------------ */
function DashboardScreen({ t, alerts, incidents, onOpenAlert, onEmergency, onOpenGuides, onOpenIncident }) {
  const latest = alerts[0];
  const recent = incidents.slice(0, 2);
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="acg-surface rounded-2xl p-4">
        <p className="text-xs acg-muted mb-1">{t("dash_status_title")}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full" style={{ width: 8, height: 8, background: "var(--acg-success)" }} />
          <p className="font-medium">{t("dash_status_ok")}</p>
        </div>
      </div>

      {latest && (
        <button onClick={() => onOpenAlert(latest.id)} className="acg-surface acg-focus rounded-2xl p-4 text-left w-full">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="acg-warning-text" />
            <p className="text-xs acg-muted">{t("dash_latest_alert")}</p>
          </div>
          <p className="font-semibold mb-1 leading-snug">{latest.title}</p>
          <p className="acg-muted text-sm mb-3 leading-relaxed">{latest.summary}</p>
          <span className="acg-accent-text text-sm font-medium inline-flex items-center gap-1">
            {t("dash_read_alert")} <ChevronRight size={16} />
          </span>
        </button>
      )}

      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(145deg, var(--acg-primary-strong), var(--acg-surface-2))", border: "1px solid var(--acg-border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Siren size={18} />
          <p className="font-semibold">{t("dash_emergency_title")}</p>
        </div>
        <p className="text-sm mb-3" style={{ color: "rgba(244,247,245,0.85)" }}>{t("dash_emergency_sub")}</p>
        <button onClick={onEmergency} className="acg-focus w-full rounded-xl py-3 font-semibold" style={{ background: "var(--acg-accent)", color: "#1A1400" }}>
          {t("dash_emergency_cta")}
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">{t("dash_recent_title")}</p>
        {recent.length === 0 ? (
          <div className="acg-surface rounded-2xl p-4">
            <p className="acg-muted text-sm leading-relaxed">{t("dash_recent_empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((inc) => (
              <button key={inc.id} onClick={() => onOpenIncident(inc.id)} className="acg-surface acg-focus rounded-2xl p-4 w-full flex items-center justify-between text-left">
                <div className="pr-3">
                  <p className="font-mono text-sm font-medium">{inc.incident_code}</p>
                  <p className="text-xs acg-muted">{t(INCIDENT_TYPES.find((x) => x.id === inc.type)?.labelKey || "type_other")}</p>
                </div>
                <StatusBadge status={inc.status} t={t} />
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={onOpenGuides} className="acg-surface acg-focus rounded-2xl p-4 flex items-center justify-between w-full text-left">
        <span className="flex items-center gap-3">
          <BookOpen size={18} className="acg-accent-text" />
          <span className="font-medium text-sm">{t("guides_title")}</span>
        </span>
        <ChevronRight size={18} className="acg-muted" />
      </button>
    </div>
  );
}

function AlertsListScreen({ t, alerts, onOpenAlert }) {
  return (
    <div className="px-4 py-4 space-y-3">
      {alerts.length === 0 && <p className="acg-muted text-sm">{t("alerts_empty")}</p>}
      {alerts.map((a) => (
        <button key={a.id} onClick={() => onOpenAlert(a.id)} className="acg-surface acg-focus rounded-2xl p-4 text-left w-full block">
          <div className="flex items-center justify-between mb-2">
            <SeverityBadge severity={a.severity} t={t} />
            <span className="acg-muted text-xs">{a.category}</span>
          </div>
          <p className="font-semibold leading-snug mb-1">{a.title}</p>
          <p className="acg-muted text-sm leading-relaxed">{a.summary}</p>
        </button>
      ))}
    </div>
  );
}

function AlertDetailScreen({ t, alert }) {
  if (!alert) return <div className="px-4 py-4"><p className="acg-muted text-sm">Alert not found.</p></div>;
  const rows = [
    { label: t("alert_what_happening"), val: alert.what },
    { label: t("alert_who"), val: alert.who },
    { label: t("alert_do"), val: alert.doNow, tone: "success" },
    { label: t("alert_avoid"), val: alert.avoid, tone: "danger" },
  ];
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <SeverityBadge severity={alert.severity} t={t} />
        <span className="acg-muted text-xs">{new Date(alert.published).toLocaleDateString()}</span>
      </div>
      <h2 className="text-lg font-semibold leading-snug">{alert.title}</h2>
      {rows.map((r) => (
        <div key={r.label} className="acg-surface rounded-2xl p-4">
          <p className={`text-xs font-semibold mb-1 ${r.tone === "success" ? "acg-success-text" : r.tone === "danger" ? "acg-danger-text" : "acg-muted"}`}>{r.label}</p>
          <p className="text-sm leading-relaxed">{r.val}</p>
        </div>
      ))}
      <div className="acg-surface-2 rounded-2xl p-4">
        <p className="text-xs acg-muted mb-1">{t("alert_source")}</p>
        <p className="text-sm leading-relaxed">{alert.source}</p>
      </div>
    </div>
  );
}

function GuidesScreen({ t, guides, openId, onOpen }) {
  if (openId) {
    const g = guides.find((x) => x.id === openId);
    return (
      <div className="px-4 py-4 space-y-3">
        <h2 className="text-lg font-semibold leading-snug">{g.title}</h2>
        <p className="text-sm leading-relaxed acg-muted">{g.body}</p>
      </div>
    );
  }
  return (
    <div className="px-4 py-4 space-y-3">
      {guides.map((g) => (
        <button key={g.id} onClick={() => onOpen(g.id)} className="acg-surface acg-focus rounded-2xl p-4 flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="acg-accent-text" />
            <span className="font-medium text-sm">{g.title}</span>
          </div>
          <ChevronRight size={18} className="acg-muted" />
        </button>
      ))}
    </div>
  );
}

/* ---------- Onboarding (lightweight local identity, ahead of real auth) - */
/* ---------- Email sign-in (replaces anonymous-only auth) -----------------
   Step 1: collect email, ask Supabase to send a magic link + OTP code.
   Step 2: user either clicks the emailed link (session picked up
   automatically via supabase-js's onAuthStateChange listener in the root
   component) or types the 6-digit code here, which calls verifyOtp directly.
   Requires the Email provider enabled in Supabase Auth (on by default). */
function EmailAuthScreen({ t }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("email"); // 'email' | 'code'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const sendCode = async () => {
    if (!isValidEmail(email)) { setError(t("auth_invalid_email")); return; }
    setBusy(true); setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (err) throw err;
      setStage("code");
    } catch (e) {
      console.error(e);
      setError(t("auth_send_failed"));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!code.trim()) return;
    setBusy(true); setError(null);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (err) throw err;
      // On success, supabase-js updates the session and the root
      // component's onAuthStateChange listener takes it from here.
    } catch (e) {
      console.error(e);
      setError(t("auth_code_invalid"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="acg-root min-h-screen flex flex-col justify-center px-6 py-10 mx-auto w-full max-w-sm" style={{ minHeight: 640 }}>
      <style>{TOKENS}</style>
      <Shield size={36} className="acg-accent-text mb-4" />

      {stage === "email" ? (
        <>
          <h1 className="text-xl font-semibold mb-2">{t("auth_title")}</h1>
          <p className="acg-muted text-sm leading-relaxed mb-6">{t("auth_sub")}</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendCode()}
            placeholder={t("auth_email_placeholder")}
            autoComplete="email"
            className="acg-surface acg-focus rounded-xl px-4 py-3 text-sm mb-3"
            style={{ color: "var(--acg-text)" }}
          />
          {error && <p className="acg-danger-text text-xs mb-3">{error}</p>}
          <button
            disabled={!email.trim() || busy}
            onClick={sendCode}
            className="acg-focus w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            style={{ background: email.trim() && !busy ? "var(--acg-primary)" : "var(--acg-border)", color: "var(--acg-text)", opacity: email.trim() && !busy ? 1 : 0.6 }}
          >
            {busy && <Loader2 size={16} className="acg-spin" />}
            {busy ? t("auth_sending") : t("auth_send_code")}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold mb-2">{t("auth_check_email_title")}</h1>
          <p className="acg-muted text-sm leading-relaxed mb-1">
            {t("auth_check_email_sub")} <span style={{ color: "var(--acg-text)" }}>{email.trim()}</span>
          </p>
          <p className="acg-muted text-sm leading-relaxed mb-6">{t("auth_check_email_hint")}</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && verify()}
            placeholder={t("auth_code_placeholder")}
            inputMode="numeric"
            className="acg-surface acg-focus rounded-xl px-4 py-3 text-sm mb-3 tracking-widest text-center"
            style={{ color: "var(--acg-text)" }}
          />
          {error && <p className="acg-danger-text text-xs mb-3">{error}</p>}
          <button
            disabled={!code.trim() || busy}
            onClick={verify}
            className="acg-focus w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2 mb-3"
            style={{ background: code.trim() && !busy ? "var(--acg-primary)" : "var(--acg-border)", color: "var(--acg-text)", opacity: code.trim() && !busy ? 1 : 0.6 }}
          >
            {busy && <Loader2 size={16} className="acg-spin" />}
            {busy ? t("auth_verifying") : t("auth_verify")}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button onClick={() => { setStage("email"); setCode(""); setError(null); }} className="acg-focus acg-muted underline underline-offset-2">
              {t("auth_use_different_email")}
            </button>
            <button onClick={sendCode} disabled={busy} className="acg-focus acg-accent-text underline underline-offset-2">
              {t("auth_resend_code")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function OnboardingScreen({ t, onSubmit }) {
  const [name, setName] = useState("");
  return (
    <div className="acg-root min-h-screen flex flex-col justify-center px-6 py-10 mx-auto w-full max-w-sm" style={{ minHeight: 640 }}>
      <style>{TOKENS}</style>
      <Shield size={36} className="acg-accent-text mb-4" />
      <h1 className="text-xl font-semibold mb-2">{t("onboard_title")}</h1>
      <p className="acg-muted text-sm leading-relaxed mb-6">{t("onboard_sub")}</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("onboard_placeholder")}
        className="acg-surface acg-focus rounded-xl px-4 py-3 text-sm mb-4"
        style={{ color: "var(--acg-text)" }}
      />
      <button
        disabled={!name.trim()}
        onClick={() => onSubmit(name.trim())}
        className="acg-focus w-full rounded-xl py-3 font-semibold"
        style={{ background: name.trim() ? "var(--acg-primary)" : "var(--acg-border)", color: "var(--acg-text)", opacity: name.trim() ? 1 : 0.6 }}
      >
        {t("onboard_cta")}
      </button>
    </div>
  );
}

/* ---------- Emergency Capture flow (Phase 3) -----------------------------
   Intro -> Preserve-first warning -> Type -> Evidence categories -> Created
   (continue report or save for later) -> Report details (Phase 2) -> Done */
function EmergencyIntroScreen({ t, onStart, onGuides }) {
  return (
    <div className="px-4 py-10 flex flex-col items-center text-center space-y-4">
      <div className="rounded-full flex items-center justify-center" style={{ width: 72, height: 72, background: "rgba(217,180,74,0.12)" }}>
        <Siren size={34} className="acg-accent-text" />
      </div>
      <h2 className="text-xl font-semibold">{t("emergency_intro_title")}</h2>
      <p className="acg-muted text-sm leading-relaxed">{t("emergency_intro_sub")}</p>
      <button onClick={onStart} className="acg-focus w-full rounded-xl py-3 font-semibold" style={{ background: "var(--acg-accent)", color: "#1A1400" }}>
        {t("dash_emergency_cta")}
      </button>
      <button onClick={onGuides} className="acg-muted text-sm underline underline-offset-2">{t("emergency_intro_secondary")}</button>
    </div>
  );
}

function PreserveScreen({ t, onContinue }) {
  const rules = ["preserve_dont_delete", "preserve_dont_edit", "preserve_dont_reply", "preserve_dont_share"];
  return (
    <div className="px-4 py-4 space-y-4">
      <p className="acg-muted text-sm">{t("preserve_sub")}</p>
      <div className="acg-surface rounded-2xl p-4 space-y-3">
        {rules.map((k) => (
          <div key={k} className="flex items-start gap-2">
            <X size={16} className="acg-danger-text shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{t(k)}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(214,69,69,0.08)", border: "1px solid var(--acg-danger)" }}>
        <p className="text-sm font-semibold acg-danger-text mb-1">{t("preserve_money_title")}</p>
        <p className="text-sm leading-relaxed">{t("preserve_money_body")}</p>
      </div>
      <button onClick={onContinue} className="acg-primary-btn acg-focus w-full rounded-xl py-3 font-semibold">{t("preserve_continue")}</button>
    </div>
  );
}

/* Shared category grid — used both by the Emergency Capture wizard step and
   by "Add evidence" inside the Evidence Locker, so the two entry points
   behave identically. */
function EvidenceCaptureGrid({ t, evidence, onAddNote, onAddLink, onAddFile, hashingCategory }) {
  const [openPanel, setOpenPanel] = useState(null); // 'note' | 'link' | null
  const [text, setText] = useState("");
  const fileInputRef = useRef(null);
  const [pendingFileCategory, setPendingFileCategory] = useState(null);

  const countFor = (catId) => evidence.filter((e) => e.category === catId).length;
  const acceptFor = (catId) => (catId === "document" ? ".pdf,.doc,.docx,.txt,image/*" : "image/*,video/*");

  const handleCardTap = (catId) => {
    if (catId === "note") { setOpenPanel((p) => (p === "note" ? null : "note")); return; }
    if (catId === "link_url") { setOpenPanel((p) => (p === "link" ? null : "link")); return; }
    setPendingFileCategory(catId);
    fileInputRef.current?.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingFileCategory) return;
    onAddFile(pendingFileCategory, file);
    setPendingFileCategory(null);
  };
  const saveNote = () => { if (!text.trim()) return; onAddNote(text.trim()); setText(""); setOpenPanel(null); };
  const saveLink = () => { if (!text.trim()) return; onAddLink(text.trim()); setText(""); setOpenPanel(null); };

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept={pendingFileCategory ? acceptFor(pendingFileCategory) : undefined}
        onChange={handleFileChange} className="hidden" />
      <div className="grid grid-cols-2 gap-3">
        {EVIDENCE_CATEGORIES.map((c) => {
          const n = countFor(c.id);
          const isHashing = hashingCategory === c.id;
          return (
            <button key={c.id} disabled={isHashing} onClick={() => handleCardTap(c.id)}
              className="acg-focus rounded-2xl p-4 text-left flex flex-col gap-2"
              style={{ background: n > 0 ? "rgba(46,139,87,0.14)" : "var(--acg-surface)", border: `1px solid ${n > 0 ? "var(--acg-primary)" : "var(--acg-border)"}` }}>
              <span className="text-sm font-medium">{t(c.labelKey)}</span>
              {isHashing ? (
                <span className="text-xs acg-accent-text flex items-center gap-1"><Loader2 size={12} className="acg-spin acg-anim" />{t("evidence_hashing")}</span>
              ) : n > 0 ? (
                <span className="text-xs acg-success-text flex items-center gap-1"><Check size={12} />{n} {n === 1 ? t("evidence_count_one") : t("evidence_count_other")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {openPanel === "note" && (
        <div className="acg-surface rounded-2xl p-4 space-y-3">
          <textarea rows={3} className={inputCls} style={inputStyle} placeholder={t("evidence_note_placeholder")}
            value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={saveNote} className="acg-primary-btn acg-focus w-full rounded-xl py-2.5 font-medium">{t("evidence_note_save")}</button>
        </div>
      )}
      {openPanel === "link" && (
        <div className="acg-surface rounded-2xl p-4 space-y-3">
          <input className={inputCls} style={inputStyle} placeholder={t("evidence_link_placeholder")}
            value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={saveLink} className="acg-primary-btn acg-focus w-full rounded-xl py-2.5 font-medium">{t("evidence_link_save")}</button>
        </div>
      )}
    </div>
  );
}

function EvidenceCategoriesScreen({ t, incident, onAddNote, onAddLink, onAddFile, hashingCategory, onContinue }) {
  const evidence = incident?.evidence || [];
  return (
    <div className="px-4 py-4 space-y-4">
      <p className="acg-muted text-sm leading-relaxed">{t("evidence_categories_sub")}</p>
      <EvidenceCaptureGrid t={t} evidence={evidence} onAddNote={onAddNote} onAddLink={onAddLink} onAddFile={onAddFile} hashingCategory={hashingCategory} />
      <p className="text-xs acg-muted">{evidence.length} {evidence.length === 1 ? t("evidence_count_one") : t("evidence_count_other")}</p>
      <button onClick={onContinue} className="acg-primary-btn acg-focus w-full rounded-xl py-3 font-semibold">{t("continue_label")}</button>
    </div>
  );
}

function EmergencyCreatedScreen({ t, incident, onContinueReport, onSaveLater }) {
  if (!incident) return null;
  const count = (incident.evidence || []).length;
  return (
    <div className="px-4 py-6 flex flex-col items-center text-center space-y-4">
      <div className="rounded-full flex items-center justify-center" style={{ width: 64, height: 64, background: "rgba(46,139,87,0.14)" }}>
        <Shield size={30} className="acg-success-text" />
      </div>
      <h2 className="text-lg font-semibold">{t("report_created_title")}</h2>
      <div className="acg-surface rounded-2xl px-5 py-3">
        <span className="font-mono text-lg tracking-wide">{incident.incident_code}</span>
      </div>
      <p className="acg-muted text-sm">{new Date(incident.created_at).toLocaleString()} · {count} {count === 1 ? t("evidence_count_one") : t("evidence_count_other")}</p>
      <p className="acg-muted text-sm leading-relaxed">{t("created_mid_sub")}</p>
      <div className="w-full space-y-2 pt-2">
        <button onClick={onContinueReport} className="acg-primary-btn acg-focus w-full rounded-xl py-3 font-semibold">{t("created_continue")}</button>
        <button onClick={onSaveLater} className="acg-focus w-full rounded-xl py-3 font-medium acg-muted">{t("created_save_later")}</button>
      </div>
    </div>
  );
}

/* ---------- Report Incident flow (Phase 2 core; guided capture is Phase 3) */
function ReportTypeScreen({ t, onSelect }) {
  return (
    <div className="px-4 py-4 space-y-3">
      <p className="acg-muted text-sm leading-relaxed mb-1">{t("report_type_sub")}</p>
      {INCIDENT_TYPES.map((ty) => (
        <button key={ty.id} onClick={() => onSelect(ty.id)} className="acg-surface acg-focus rounded-2xl p-4 flex items-center justify-between w-full text-left">
          <span className="font-medium text-sm">{t(ty.labelKey)}</span>
          <ChevronRight size={18} className="acg-muted" />
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="text-xs font-semibold acg-muted block mb-1.5">{children}</label>;
}
const inputCls = "acg-surface acg-focus rounded-xl px-3 py-2.5 text-sm w-full";
const inputStyle = { color: "var(--acg-text)" };

function ChipGroup({ options, value, onChange, t }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className="acg-focus acg-tap rounded-xl px-3 py-2 text-xs font-medium"
          style={{ background: value === opt ? "var(--acg-primary)" : "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
          {t(opt)}
        </button>
      ))}
    </div>
  );
}

function ReportDetailsScreen({ t, draft, onChange, onSubmit, submitting }) {
  const canSubmit = draft.description?.trim() && draft.consent;
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: "rgba(217,180,74,0.08)", border: "1px solid var(--acg-warning)" }}>
        <Info size={16} className="acg-warning-text shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">{t("report_no_secrets")}</p>
      </div>

      <div>
        <FieldLabel>{t("field_occurred")}</FieldLabel>
        <input type="date" className={inputCls} style={inputStyle}
          value={draft.occurredAt ? draft.occurredAt.slice(0, 10) : ""}
          onChange={(e) => onChange("occurredAt", e.target.value ? new Date(e.target.value).toISOString() : "")} />
      </div>

      <div>
        <FieldLabel>{t("field_platform")}</FieldLabel>
        <input className={inputCls} style={inputStyle} placeholder={t("field_platform_placeholder")}
          value={draft.platform || ""} onChange={(e) => onChange("platform", e.target.value)} />
      </div>

      <div>
        <FieldLabel>{t("field_description")}</FieldLabel>
        <textarea rows={4} className={inputCls} style={inputStyle} placeholder={t("field_description_placeholder")}
          value={draft.description || ""} onChange={(e) => onChange("description", e.target.value)} />
      </div>

      <div>
        <FieldLabel>{t("field_impact")}</FieldLabel>
        <ChipGroup t={t} options={["impact_none", "impact_low", "impact_mid", "impact_high", "impact_prefer_not"]}
          value={draft.impact} onChange={(v) => onChange("impact", v)} />
      </div>

      <div>
        <FieldLabel>{t("field_urgency")}</FieldLabel>
        <ChipGroup t={t} options={["urgency_low", "urgency_medium", "urgency_high"]}
          value={draft.urgency} onChange={(v) => onChange("urgency", v)} />
      </div>

      <div>
        <FieldLabel>{t("field_contact")}</FieldLabel>
        <ChipGroup t={t} options={["contact_app", "contact_phone", "contact_email"]}
          value={draft.contact} onChange={(v) => onChange("contact", v)} />
      </div>

      <label className="flex items-start gap-2 pt-1">
        <input type="checkbox" className="mt-1" checked={!!draft.consent} onChange={(e) => onChange("consent", e.target.checked)} />
        <span className="text-xs leading-relaxed acg-muted">{t("field_consent")}</span>
      </label>

      <button disabled={!canSubmit || submitting} onClick={onSubmit}
        className="acg-focus w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
        style={{ background: canSubmit ? "var(--acg-primary)" : "var(--acg-border)", opacity: canSubmit ? 1 : 0.6 }}>
        <Send size={16} />{t("report_submit")}
      </button>
    </div>
  );
}

function ReportCreatedScreen({ t, incident, onViewIncident, onDone }) {
  const [copied, setCopied] = useState(false);
  if (!incident) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(incident.incident_code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="px-4 py-6 flex flex-col items-center text-center space-y-4">
      <div className="rounded-full flex items-center justify-center" style={{ width: 64, height: 64, background: "rgba(63,174,112,0.12)" }}>
        <FileCheck2 size={30} className="acg-success-text" />
      </div>
      <h2 className="text-lg font-semibold">{t("report_created_title")}</h2>
      <p className="acg-muted text-sm">{t("report_created_sub")}</p>
      <button onClick={copy} className="acg-surface acg-focus rounded-2xl px-5 py-3 flex items-center gap-3">
        <span className="font-mono text-lg tracking-wide">{incident.incident_code}</span>
        {copied ? <Check size={18} className="acg-success-text" /> : <Copy size={18} className="acg-muted" />}
      </button>
      <div className="w-full space-y-2 pt-2">
        <button onClick={onViewIncident} className="acg-primary-btn acg-focus w-full rounded-xl py-3 font-semibold">{t("report_view_incident")}</button>
        <button onClick={onDone} className="acg-focus w-full rounded-xl py-3 font-medium acg-muted">{t("report_done")}</button>
      </div>
    </div>
  );
}

/* ---------- Incident Detail + Timeline ----------------------------------- */
const TIMELINE_ICONS = {
  incident_started: Siren,
  evidence_added: FilePlus2,
  evidence_hash_generated: Fingerprint,
  report_submitted: Send,
  status_changed: ArrowRightLeft,
  acat_guidance: MessageCircle,
  user_message: MessageSquare,
  user_acknowledgement: ThumbsUp,
};

function timelineLabel(ev, t) {
  if (ev.event_type === "evidence_added") {
    return `${t("event_evidence_added")} — ${t(EVIDENCE_CATEGORIES.find((c) => c.id === ev.category)?.labelKey || ev.category)}`;
  }
  if (ev.event_type === "evidence_hash_generated") {
    return `${t("event_evidence_hash_generated")}${ev.hash ? ` — ${ev.hash.slice(0, 10)}…` : ""}`;
  }
  if (ev.event_type === "status_changed") {
    return `${t("event_status_changed")}: ${t(`status_${ev.from}`)} → ${t(`status_${ev.to}`)}`;
  }
  return t(`event_${ev.event_type}`);
}
function timelineDetail(ev) {
  if (ev.event_type === "acat_guidance" || ev.event_type === "user_message") return ev.message;
  return null;
}
function TimelineList({ t, timeline }) {
  return (
    <div className="acg-surface rounded-2xl p-4 space-y-4">
      {timeline.map((ev, i) => {
        const Icon = TIMELINE_ICONS[ev.event_type] || Circle;
        const detail = timelineDetail(ev);
        return (
          <div key={ev.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
                <Icon size={14} className="acg-accent-text" />
              </span>
              {i < timeline.length - 1 && <span style={{ width: 1, flex: 1, background: "var(--acg-border)" }} />}
            </div>
            <div className="pb-1">
              <p className="text-sm font-medium">{timelineLabel(ev, t)}</p>
              {detail && <p className="text-sm leading-relaxed mt-0.5">{detail}</p>}
              <p className="text-xs acg-muted mt-0.5">{new Date(ev.created_at).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IncidentDetailScreen({ t, incident, onContinueCapture, onOpenLocker, onSendMessage, onAcknowledge }) {
  const [reply, setReply] = useState("");
  if (!incident) return <div className="px-4 py-4"><p className="acg-muted text-sm">Incident not found.</p></div>;
  const typeLabel = incident.type ? t(INCIDENT_TYPES.find((x) => x.id === incident.type)?.labelKey || "type_other") : "—";
  const evidenceCount = (incident.evidence || []).length;
  const latestGuidance = [...incident.timeline].reverse().find((e) => e.event_type === "acat_guidance");
  const showGuidancePanel = ["guidance", "needs_information"].includes(incident.status) && latestGuidance;
  const sendReply = () => { if (!reply.trim()) return; onSendMessage(reply.trim()); setReply(""); };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm">{incident.incident_code}</span>
        <StatusBadge status={incident.status} t={t} />
      </div>

      {incident.status === "draft" && (
        <button onClick={onContinueCapture} className="acg-primary-btn acg-focus w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
          <FilePlus2 size={16} />{t("incident_continue_capture")}
        </button>
      )}

      {showGuidancePanel && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(46,139,87,0.1)", border: "1px solid var(--acg-primary)" }}>
          <p className="text-xs font-semibold acg-success-text flex items-center gap-1"><MessageCircle size={14} />{t("guidance_latest_title")}</p>
          <p className="text-sm leading-relaxed">{latestGuidance.message}</p>
          <div className="flex gap-2">
            <button onClick={onAcknowledge} className="acg-focus rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
              <ThumbsUp size={12} />{t("guidance_acknowledge")}
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <input className={inputCls} style={inputStyle} placeholder={t("guidance_reply_placeholder")} value={reply} onChange={(e) => setReply(e.target.value)} />
            <button onClick={sendReply} disabled={!reply.trim()} className="acg-primary-btn acg-focus rounded-xl px-3" style={{ opacity: reply.trim() ? 1 : 0.6 }}><Send size={16} /></button>
          </div>
        </div>
      )}

      <div className="acg-surface rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold acg-muted">{t("incident_summary")}</p>
        <div className="grid grid-cols-2 gap-y-2 text-sm pt-1">
          <span className="acg-muted">{t("incident_type_label")}</span><span>{typeLabel}</span>
          {incident.report.platform && (<><span className="acg-muted">{t("incident_platform_label")}</span><span>{incident.report.platform}</span></>)}
          {incident.occurred_at && (<><span className="acg-muted">{t("incident_occurred_label")}</span><span>{new Date(incident.occurred_at).toLocaleDateString()}</span></>)}
          <span className="acg-muted">{t("incident_impact_label")}</span><span>{t(incident.report.impact)}</span>
        </div>
        {incident.report.description && (
          <p className="text-sm leading-relaxed pt-2 acg-border-t" style={{ paddingTop: 10 }}>{incident.report.description}</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold acg-muted mb-2">{t("incident_timeline")}</p>
        <TimelineList t={t} timeline={incident.timeline} />
      </div>

      <div className="acg-surface-2 rounded-2xl p-4">
        <p className="text-xs font-semibold acg-muted mb-1">{t("incident_next_steps")}</p>
        <p className="text-sm leading-relaxed">{t(`next_${incident.status}`)}</p>
      </div>

      {evidenceCount > 0 ? (
        <button onClick={onOpenLocker} className="acg-focus w-full rounded-xl py-3 font-medium flex items-center justify-center gap-2" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
          <FolderLock size={16} className="acg-accent-text" />{t("incident_open_locker")}
        </button>
      ) : (
        <div className="rounded-2xl p-4 flex items-start gap-2" style={{ border: "1px dashed var(--acg-border)" }}>
          <FolderLock size={16} className="acg-muted shrink-0 mt-0.5" />
          <p className="text-xs acg-muted leading-relaxed">{t("incident_evidence_note")}</p>
        </div>
      )}
    </div>
  );
}

function MyReportsScreen({ t, incidents, onOpen }) {
  if (incidents.length === 0) {
    return <div className="px-4 py-4"><p className="acg-muted text-sm leading-relaxed">{t("my_reports_empty")}</p></div>;
  }
  return (
    <div className="px-4 py-4 space-y-3">
      {incidents.map((inc) => (
        <button key={inc.id} onClick={() => onOpen(inc.id)} className="acg-surface acg-focus rounded-2xl p-4 w-full text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm font-medium">{inc.incident_code}</span>
            <StatusBadge status={inc.status} t={t} />
          </div>
          <p className="text-xs acg-muted mb-1">{t(INCIDENT_TYPES.find((x) => x.id === inc.type)?.labelKey || "type_other")} · {new Date(inc.created_at).toLocaleDateString()}</p>
          <p className="text-xs leading-relaxed">{t(`next_${inc.status}`)}</p>
        </button>
      ))}
    </div>
  );
}

/* ---------- Evidence Locker (Phase 4) ------------------------------------
   Metadata + hash live in Postgres; raw file bytes live in Supabase Storage
   and are only ever accessed through short-lived signed URLs (see
   getEvidenceUrl) — never a public link. */
function EvidenceItemCard({ t, item }) {
  const [status, setStatus] = useState("idle"); // idle | working | verified | mismatch | error
  const [previewUrl, setPreviewUrl] = useState(null);
  const isFile = !!item.file;
  const isImage = isFile && item.file.mime?.startsWith("image/");
  const catLabel = t(EVIDENCE_CATEGORIES.find((c) => c.id === item.category)?.labelKey || item.category);
  const Icon = item.category === "link_url" ? Link2 : item.category === "note" ? BookOpen : isImage ? Image : FileText;

  const handleView = async () => {
    setStatus("working");
    try { setPreviewUrl(await api.getEvidenceUrl(item.file.storagePath)); setStatus("idle"); }
    catch { setStatus("error"); }
  };
  const handleVerify = async () => {
    setStatus("working");
    try {
      const url = await api.getEvidenceUrl(item.file.storagePath);
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const hash = await sha256Hex(buf);
      setStatus(hash === item.file.sha256 ? "verified" : "mismatch");
    } catch { setStatus("error"); }
  };
  const handleDownload = async () => {
    const url = await api.getEvidenceUrl(item.file.storagePath);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = item.file.name;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="acg-surface rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: "var(--acg-surface-2)" }}>
          <Icon size={18} className="acg-accent-text" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.file?.name || (item.category === "link_url" ? item.url : item.note) || catLabel}</p>
          <p className="text-xs acg-muted">{catLabel} · {new Date(item.added_at).toLocaleString()}{item.file ? ` · ${formatBytes(item.file.size)}` : ""}</p>
        </div>
      </div>

      {item.file?.sha256 && (
        <div className="acg-surface-2 rounded-xl px-3 py-2 flex items-center gap-2 min-w-0">
          <Fingerprint size={12} className="acg-muted shrink-0" />
          <span className="text-xs font-mono truncate">{t("evidence_hash_label")}: {item.file.sha256.slice(0, 20)}…</span>
        </div>
      )}

      {previewUrl && isImage && <img src={previewUrl} alt="" className="rounded-xl max-h-48 w-full object-cover" />}

      {item.file && (
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleView} className="acg-focus rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>{t("evidence_view")}</button>
          <button onClick={handleDownload} className="acg-focus rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>{t("evidence_download")}</button>
          <button onClick={handleVerify} className="acg-focus rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
            {status === "working" ? <Loader2 size={12} className="acg-spin acg-anim" /> : <ShieldCheck size={12} />}{t("evidence_verify")}
          </button>
          {status === "verified" && <span className="text-xs acg-success-text flex items-center gap-1"><ShieldCheck size={12} />{t("evidence_verified")}</span>}
          {status === "mismatch" && <span className="text-xs acg-danger-text">{t("evidence_verify_mismatch")}</span>}
        </div>
      )}

      {item.category === "link_url" && (
        <a href={item.url} target="_blank" rel="noreferrer" className="text-xs acg-accent-text underline break-all block">{item.url}</a>
      )}
    </div>
  );
}

function EvidenceLockerHome({ t, incidents, onOpen }) {
  const withEvidence = incidents.filter((i) => (i.evidence || []).length > 0);
  if (withEvidence.length === 0) {
    return <div className="px-4 py-4"><p className="acg-muted text-sm leading-relaxed">{t("evidence_locker_empty")}</p></div>;
  }
  return (
    <div className="px-4 py-4 space-y-3">
      {withEvidence.map((inc) => {
        const n = inc.evidence.length;
        return (
          <button key={inc.id} onClick={() => onOpen(inc.id)} className="acg-surface acg-focus rounded-2xl p-4 w-full flex items-center justify-between text-left">
            <div>
              <p className="font-mono text-sm font-medium">{inc.incident_code}</p>
              <p className="text-xs acg-muted">{n} {n === 1 ? t("evidence_count_one") : t("evidence_count_other")}</p>
            </div>
            <ChevronRight size={18} className="acg-muted" />
          </button>
        );
      })}
    </div>
  );
}

function EvidenceLockerDetail({ t, incident, onAddNote, onAddLink, onAddFile, hashingCategory, showAdd, onToggleAdd }) {
  if (!incident) return <div className="px-4 py-4"><p className="acg-muted text-sm">Incident not found.</p></div>;
  const evidence = incident.evidence || [];
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm">{incident.incident_code}</span>
        <StatusBadge status={incident.status} t={t} />
      </div>

      <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: "rgba(217,180,74,0.08)", border: "1px solid var(--acg-warning)" }}>
        <Info size={14} className="acg-warning-text shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">{t("evidence_malware_note")}</p>
      </div>

      {evidence.length === 0 ? (
        <p className="acg-muted text-sm leading-relaxed">{t("evidence_locker_empty")}</p>
      ) : (
        <div className="space-y-3">{evidence.map((item) => <EvidenceItemCard key={item.id} t={t} item={item} />)}</div>
      )}

      <button onClick={onToggleAdd} className="acg-focus w-full rounded-xl py-3 font-medium flex items-center justify-center gap-2" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
        <FilePlus2 size={16} />{t("evidence_add_more")}
      </button>
      {showAdd && (
        <div className="acg-surface rounded-2xl p-4">
          <EvidenceCaptureGrid t={t} evidence={evidence} onAddNote={onAddNote} onAddLink={onAddLink} onAddFile={onAddFile} hashingCategory={hashingCategory} />
        </div>
      )}
    </div>
  );
}

function AboutScreen({ t }) {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="acg-surface rounded-2xl p-4 space-y-3">
        <p className="text-sm leading-relaxed">{t("about_body1")}</p>
        <p className="text-sm leading-relaxed acg-muted">{t("about_body2")}</p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(214,69,69,0.08)", border: "1px solid var(--acg-danger)" }}>
        <p className="text-sm font-semibold acg-danger-text mb-1">{t("about_official_title")}</p>
        <p className="text-sm leading-relaxed mb-3">{t("about_official_body")}</p>
        <div className="flex flex-col gap-2 text-sm">
          <a className="inline-flex items-center gap-1 acg-accent-text" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">cybercrime.gov.in <ExternalLink size={14} /></a>
          <span className="acg-muted">National Cyber Crime Helpline: 1930</span>
        </div>
      </div>
    </div>
  );
}

function PrivacyScreen({ t, notifOn, onToggleNotif }) {
  return (
    <div className="px-4 py-4 space-y-3">
      {[
        ["privacy_collected_title", "privacy_collected_body"],
        ["privacy_why_title", "privacy_why_body"],
        ["privacy_retention_title", "privacy_retention_body"],
        ["privacy_export_title", "privacy_export_body"],
      ].map(([title, body]) => (
        <div key={title} className="acg-surface rounded-2xl p-4">
          <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Lock size={14} className="acg-accent-text" />{t(title)}</p>
          <p className="text-sm leading-relaxed acg-muted">{t(body)}</p>
        </div>
      ))}
      <div className="acg-surface rounded-2xl p-4 flex items-center justify-between">
        <div className="pr-3">
          <p className="text-sm font-semibold">{t("privacy_notif_title")}</p>
          <p className="text-xs acg-muted">{t("settings_notifications_sub")}</p>
        </div>
        <ToggleSwitch on={notifOn} onChange={onToggleNotif} />
      </div>
      <div className="acg-surface-2 rounded-2xl p-4">
        <p className="text-sm font-semibold mb-1">{t("privacy_device_title")}</p>
        <p className="text-sm leading-relaxed acg-muted">{t("privacy_device_body")}</p>
      </div>
    </div>
  );
}

function ToggleSwitch({ on, onChange }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="acg-focus acg-tap rounded-full relative shrink-0" style={{ width: 46, height: 28, background: on ? "var(--acg-primary)" : "var(--acg-border)" }}>
      <span className="absolute rounded-full bg-white" style={{ width: 22, height: 22, top: 3, left: on ? 21 : 3, transition: "left 0.15s ease" }} />
    </button>
  );
}

function SettingsScreen({ t, lang, onChangeLang, notifOn, onToggleNotif, onNavigate, onEnterStaffView }) {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="acg-surface rounded-2xl p-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Globe size={16} className="acg-accent-text" />{t("settings_language")}</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(LOCALES).map(([code, label]) => (
            <button key={code} onClick={() => onChangeLang(code)}
              className="acg-focus acg-tap rounded-xl px-3 py-2 text-sm font-medium"
              style={{ background: lang === code ? "var(--acg-primary)" : "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs acg-muted mt-3 leading-relaxed">{t("settings_language_note")}</p>
      </div>

      <div className="acg-surface rounded-2xl p-4 flex items-center justify-between">
        <div className="pr-3">
          <p className="text-sm font-semibold">{t("settings_notifications")}</p>
          <p className="text-xs acg-muted">{t("settings_notifications_sub")}</p>
        </div>
        <ToggleSwitch on={notifOn} onChange={onToggleNotif} />
      </div>

      <div className="acg-surface rounded-2xl overflow-hidden">
        <button onClick={() => onNavigate("privacy")} className="acg-focus w-full flex items-center justify-between px-4 py-3 acg-border-b">
          <span className="text-sm font-medium flex items-center gap-2"><Lock size={16} className="acg-accent-text" />{t("settings_privacy_link")}</span>
          <ChevronRight size={16} className="acg-muted" />
        </button>
        <button onClick={() => onNavigate("about")} className="acg-focus w-full flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium flex items-center gap-2"><Info size={16} className="acg-accent-text" />{t("settings_about_link")}</span>
          <ChevronRight size={16} className="acg-muted" />
        </button>
      </div>

      <div className="acg-surface rounded-2xl p-4">
        <button onClick={onEnterStaffView} className="acg-focus w-full flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2"><ClipboardList size={16} className="acg-accent-text" />{t("settings_staff_link")}</span>
          <ChevronRight size={16} className="acg-muted" />
        </button>
        <p className="text-xs acg-muted mt-2 leading-relaxed">{t("settings_staff_note")}</p>
      </div>
    </div>
  );
}

/* ---------- App shell / router ------------------------------------------ */
/* ---------- Staff View (Phase 5, simulated) ------------------------------
   Stands in for a real reviewer role until staff accounts exist on a real
   backend. Reuses the same TOKENS/data layer — nothing here is a separate
   app, just a different lens on the same incidents. */
function StaffShell({ t, incidents, onExit, onOpen }) {
  const [filter, setFilter] = useState("open");
  const list = incidents
    .filter((i) => i.status !== "draft")
    .filter((i) => (filter === "all" ? true : !["closed", "archived"].includes(i.status)))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="acg-root min-h-full w-full max-w-md md:max-w-2xl mx-auto relative" style={{ minHeight: 640 }}>
      <style>{TOKENS}</style>
      <div className="acg-surface acg-border-b flex items-center gap-2 px-4 py-3 sticky top-0 z-10">
        <Shield size={20} className="acg-accent-text" />
        <h1 className="text-base font-semibold flex-1 truncate">{t("staff_title")}</h1>
        <button onClick={onExit} className="acg-focus text-xs acg-accent-text underline underline-offset-2">{t("staff_exit")}</button>
      </div>
      <div className="px-4 pt-3 flex gap-2">
        {["open", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="acg-focus rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: filter === f ? "var(--acg-primary)" : "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>
            {t(f === "open" ? "staff_filter_open" : "staff_filter_all")}
          </button>
        ))}
      </div>
      <div className="px-4 py-4 space-y-3">
        {list.length === 0 && <p className="acg-muted text-sm">{t("staff_queue_empty")}</p>}
        {list.map((inc) => (
          <button key={inc.id} onClick={() => onOpen(inc.id)} className="acg-surface acg-focus rounded-2xl p-4 w-full flex items-center justify-between text-left">
            <div>
              <p className="font-mono text-sm font-medium">{inc.incident_code}</p>
              <p className="text-xs acg-muted">{t(INCIDENT_TYPES.find((x) => x.id === inc.type)?.labelKey || "type_other")} · {new Date(inc.created_at).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={inc.status} t={t} />
          </button>
        ))}
      </div>
    </div>
  );
}

function StaffIncidentDetail({ t, incident, onBack, onStartReview, onSendGuidance, onSendUpdate, onRequestInfo, onEscalate, onCloseCase, onArchive }) {
  const [composeMode, setComposeMode] = useState(null); // 'guidance' | 'update' | 'info' | 'close' | null
  const [message, setMessage] = useState("");
  if (!incident) return null;
  const typeLabel = incident.type ? t(INCIDENT_TYPES.find((x) => x.id === incident.type)?.labelKey || "type_other") : "—";

  const send = () => {
    if (!message.trim() && composeMode !== "close") return;
    if (composeMode === "guidance") onSendGuidance(message.trim());
    if (composeMode === "update") onSendUpdate(message.trim());
    if (composeMode === "info") onRequestInfo(message.trim());
    if (composeMode === "close") onCloseCase(message.trim());
    setMessage("");
    setComposeMode(null);
  };

  return (
    <div className="acg-root min-h-full w-full max-w-md md:max-w-2xl mx-auto relative" style={{ minHeight: 640 }}>
      <style>{TOKENS}</style>
      <div className="acg-surface acg-border-b flex items-center gap-2 px-4 py-3 sticky top-0 z-10">
        <button onClick={onBack} aria-label="Back" className="acg-tap acg-focus flex items-center justify-center -ml-2"><ChevronLeft size={22} /></button>
        <h1 className="text-base font-semibold flex-1 truncate">{incident.incident_code}</h1>
        <StatusBadge status={incident.status} t={t} />
      </div>

      <div className="px-4 py-4 space-y-4" style={{ paddingBottom: 140 }}>
        <div className="acg-surface rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold acg-muted">{t("incident_summary")}</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm pt-1">
            <span className="acg-muted">{t("incident_type_label")}</span><span>{typeLabel}</span>
            {incident.report.platform && (<><span className="acg-muted">{t("incident_platform_label")}</span><span>{incident.report.platform}</span></>)}
            <span className="acg-muted">{t("incident_impact_label")}</span><span>{t(incident.report.impact)}</span>
          </div>
          {incident.report.description && <p className="text-sm leading-relaxed pt-2 acg-border-t" style={{ paddingTop: 10 }}>{incident.report.description}</p>}
        </div>

        {(incident.evidence || []).length > 0 && (
          <div>
            <p className="text-xs font-semibold acg-muted mb-2">{t("nav_evidence")}</p>
            <div className="space-y-3">{incident.evidence.map((item) => <EvidenceItemCard key={item.id} t={t} item={item} />)}</div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold acg-muted mb-2">{t("incident_timeline")}</p>
          <TimelineList t={t} timeline={incident.timeline} />
        </div>
      </div>

      <div className="acg-surface acg-border-t fixed bottom-0 left-0 right-0 p-4 space-y-2" style={{ maxWidth: 448, margin: "0 auto" }}>
        {composeMode ? (
          <div className="space-y-2">
            <textarea rows={3} className={inputCls} style={inputStyle} placeholder={t("staff_compose_placeholder")}
              value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={send} disabled={!message.trim() && composeMode !== "close"} className="acg-primary-btn acg-focus flex-1 rounded-xl py-2.5 font-medium">{t("staff_send")}</button>
              <button onClick={() => { setComposeMode(null); setMessage(""); }} className="acg-focus rounded-xl py-2.5 px-4 font-medium" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>{t("staff_cancel")}</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {incident.status === "submitted" && (
              <button onClick={onStartReview} className="acg-primary-btn acg-focus rounded-xl py-2.5 px-3 text-sm font-medium">{t("staff_start_review")}</button>
            )}
            {["reviewing", "needs_information"].includes(incident.status) && (
              <button onClick={() => setComposeMode("guidance")} className="acg-primary-btn acg-focus rounded-xl py-2.5 px-3 text-sm font-medium">{t("staff_send_guidance")}</button>
            )}
            {incident.status === "guidance" && (
              <button onClick={() => setComposeMode("update")} className="acg-primary-btn acg-focus rounded-xl py-2.5 px-3 text-sm font-medium">{t("staff_send_update")}</button>
            )}
            {incident.status === "reviewing" && (
              <button onClick={() => setComposeMode("info")} className="acg-focus rounded-xl py-2.5 px-3 text-sm font-medium" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>{t("staff_request_info")}</button>
            )}
            {["reviewing", "guidance", "needs_information"].includes(incident.status) && (
              <button onClick={onEscalate} className="acg-focus acg-danger-text rounded-xl py-2.5 px-3 text-sm font-medium" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-danger)" }}>{t("staff_escalate")}</button>
            )}
            {["reviewing", "guidance", "needs_information", "escalated"].includes(incident.status) && (
              <button onClick={() => setComposeMode("close")} className="acg-focus rounded-xl py-2.5 px-3 text-sm font-medium" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>{t("staff_close")}</button>
            )}
            {incident.status === "closed" && (
              <button onClick={onArchive} className="acg-focus acg-muted rounded-xl py-2.5 px-3 text-sm font-medium" style={{ background: "var(--acg-surface-2)", border: "1px solid var(--acg-border)" }}>{t("staff_archive")}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ACATCyberGuard() {
  const [lang, setLang] = useState("en");
  const [notifOn, setNotifOn] = useState(true);
  const [tab, setTab] = useState("home");
  const [stack, setStack] = useState([]); // secondary screens pushed on top of a tab
  const [alerts, setAlerts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [comingSoon, setComingSoon] = useState(null);
  const [profile, setProfileState] = useState(undefined); // undefined = loading, null = needs onboarding
  const [draftIncidentId, setDraftIncidentId] = useState(null); // incident being built through Emergency Capture
  const [draft, setDraft] = useState({}); // final report-details form state (Phase 2 step, reused by Phase 3)
  const [submitting, setSubmitting] = useState(false);
  const [hashingCategory, setHashingCategory] = useState(null);
  const [evidenceError, setEvidenceError] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [role, setRole] = useState("user");
  const [staffIncidentId, setStaffIncidentId] = useState(null);
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const t = useT(lang);

  useEffect(() => {
    if (!evidenceError) return undefined;
    const id = setTimeout(() => setEvidenceError(null), 4500);
    return () => clearTimeout(id);
  }, [evidenceError]);

  const refreshIncidents = useCallback(async () => setIncidents(await api.getIncidents()), []);

  // Real email sign-in (magic link + OTP) replaces the old anonymous-only
  // auth. This just tracks the current session; the actual sign-in UI is
  // EmailAuthScreen, and clicking the emailed link or entering the code
  // both end up here via Supabase's own auth-state event.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setSession(data.session ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        setAlerts(await api.getAlerts());
        setGuides(await api.getGuides());
        setLang(await api.getPref("lang", "en"));
        setNotifOn(await api.getPref("notifOn", true));
        setProfileState(await api.getProfile());
        await refreshIncidents();
      } catch (err) {
        console.error("Startup failed — check Supabase URL/anon key.", err);
        setEvidenceError(t("startup_failed"));
      }
    })();
  }, [session, refreshIncidents]);

  const changeLang = async (code) => { setLang(code); await api.setPref("lang", code); };
  const toggleNotif = async (v) => { setNotifOn(v); await api.setPref("notifOn", v); };
  const completeOnboarding = async (name) => {
    const p = { name };
    try { await api.setProfile(p); setProfileState(p); }
    catch { setEvidenceError(t("action_failed")); }
  };

  const top = stack[stack.length - 1];
  const push = (screen) => setStack((s) => [...s, screen]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const resetDraftForm = () => setDraft({ impact: "impact_prefer_not", urgency: "urgency_low", contact: "contact_app" });

  // Start the full Emergency Capture wizard (Phase 3): intro -> preserve
  // warning -> type -> evidence categories -> created -> report details.
  const startEmergencyCapture = () => {
    setDraftIncidentId(null);
    resetDraftForm();
    setStack([{ type: "emergencyIntro" }]);
  };
  const changeTab = (key) => {
    if (key === "report") return startEmergencyCapture();
    setStack([]);
    setTab(key);
  };

  const beginCapture = async () => {
    try {
      const inc = await api.createDraftIncident();
      await refreshIncidents();
      setDraftIncidentId(inc.id);
      push({ type: "emergencyType" });
    } catch { setEvidenceError(t("action_failed")); }
  };
  const chooseType = async (type) => {
    try {
      await api.setIncidentType(draftIncidentId, type);
      await refreshIncidents();
      push({ type: "emergencyEvidence" });
    } catch { setEvidenceError(t("action_failed")); }
  };
  const addNoteTo = async (incidentId, note) => {
    try { await api.addEvidenceNote(incidentId, { category: "note", note }); await refreshIncidents(); }
    catch { setEvidenceError(t("action_failed")); }
  };
  const addLinkTo = async (incidentId, url) => {
    try { await api.addEvidenceLink(incidentId, { url }); await refreshIncidents(); }
    catch { setEvidenceError(t("action_failed")); }
  };
  const addFileTo = async (incidentId, category, file) => {
    if (file.size > MAX_FILE_BYTES) { setEvidenceError(t("evidence_file_too_large")); return; }
    setHashingCategory(category);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const sha256 = await sha256Hex(buf);
      await api.addEvidenceFile(incidentId, { category, file, sha256 });
      await refreshIncidents();
    } catch {
      setEvidenceError(t("evidence_upload_failed"));
    } finally {
      setHashingCategory(null);
    }
  };
  const resumeCapture = (id) => {
    setDraftIncidentId(id);
    resetDraftForm();
    push({ type: "emergencyEvidence" });
  };

  const submitReport = async () => {
    setSubmitting(true);
    try {
      await api.submitReport(draftIncidentId, draft);
      await refreshIncidents();
      push({ type: "reportCreated", id: draftIncidentId });
    } catch {
      setEvidenceError(t("action_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const finishReportFlow = () => { setStack([]); setTab("home"); };
  const saveForLater = () => { setStack([]); setTab("home"); };

  const sendUserMessage = async (id, message) => {
    try { await api.addUserMessage(id, message); await refreshIncidents(); }
    catch { setEvidenceError(t("action_failed")); }
  };
  const acknowledgeGuidance = async (id) => {
    try { await api.addAcknowledgement(id); await refreshIncidents(); }
    catch { setEvidenceError(t("action_failed")); }
  };

  // Staff (simulated) actions — see role toggle in Settings. These only
  // succeed for a Supabase user present in staff_roles; anyone else gets
  // an RLS error, surfaced here as the same toast rather than a crash.
  const staffAction = async (fn) => {
    try { await fn(); await refreshIncidents(); }
    catch { setEvidenceError(t("staff_action_failed")); }
  };
  const staffStartReview = (id) => staffAction(() => api.setStatus(id, "reviewing"));
  const staffSendGuidance = (id, message) => staffAction(async () => { await api.addGuidance(id, message); await api.setStatus(id, "guidance"); });
  const staffSendUpdate = (id, message) => staffAction(() => api.addGuidance(id, message));
  const staffRequestInfo = (id, message) => staffAction(async () => { await api.addGuidance(id, message); await api.setStatus(id, "needs_information"); });
  const staffEscalate = (id) => staffAction(() => api.setStatus(id, "escalated"));
  const staffCloseCase = (id, message) => staffAction(async () => { if (message) await api.addGuidance(id, message); await api.setStatus(id, "closed"); });
  const staffArchive = (id) => staffAction(() => api.setStatus(id, "archived"));

  if (role === "staff") {
    const staffIncident = incidents.find((i) => i.id === staffIncidentId);
    return staffIncidentId ? (
      <StaffIncidentDetail t={t} incident={staffIncident}
        onBack={() => setStaffIncidentId(null)}
        onStartReview={() => staffStartReview(staffIncidentId)}
        onSendGuidance={(msg) => staffSendGuidance(staffIncidentId, msg)}
        onSendUpdate={(msg) => staffSendUpdate(staffIncidentId, msg)}
        onRequestInfo={(msg) => staffRequestInfo(staffIncidentId, msg)}
        onEscalate={() => staffEscalate(staffIncidentId)}
        onCloseCase={(msg) => staffCloseCase(staffIncidentId, msg)}
        onArchive={() => staffArchive(staffIncidentId)} />
    ) : (
      <StaffShell t={t} incidents={incidents} onExit={() => setRole("user")} onOpen={setStaffIncidentId} />
    );
  }

  let title = t("appName");
  let body = null;
  const draftIncident = incidents.find((i) => i.id === draftIncidentId);

  if (top?.type === "alertDetail") {
    title = t("nav_alerts");
    body = <AlertDetailScreen t={t} alert={alerts.find((a) => a.id === top.id)} />;
  } else if (top?.type === "guides") {
    title = t("guides_title");
    body = <GuidesScreen t={t} guides={guides} openId={top.guideId} onOpen={(id) => push({ type: "guides", guideId: id })} />;
  } else if (top?.type === "settings") {
    title = t("settings_title");
    body = <SettingsScreen t={t} lang={lang} onChangeLang={changeLang} notifOn={notifOn} onToggleNotif={toggleNotif}
      onNavigate={(dest) => push({ type: dest })} onEnterStaffView={() => setRole("staff")} />;
  } else if (top?.type === "privacy") {
    title = t("privacy_title");
    body = <PrivacyScreen t={t} notifOn={notifOn} onToggleNotif={toggleNotif} />;
  } else if (top?.type === "about") {
    title = t("about_title");
    body = <AboutScreen t={t} />;
  } else if (top?.type === "emergencyIntro") {
    title = t("dash_emergency_title");
    body = <EmergencyIntroScreen t={t} onStart={() => push({ type: "emergencyPreserve" })} onGuides={() => push({ type: "guides" })} />;
  } else if (top?.type === "emergencyPreserve") {
    title = t("preserve_title");
    body = <PreserveScreen t={t} onContinue={beginCapture} />;
  } else if (top?.type === "emergencyType") {
    title = t("report_type_title");
    body = (
      <>
        <IncidentClockBar t={t} startedAt={draftIncident?.created_at} />
        <ReportTypeScreen t={t} onSelect={chooseType} />
      </>
    );
  } else if (top?.type === "emergencyEvidence") {
    title = t("evidence_categories_title");
    body = (
      <>
        <IncidentClockBar t={t} startedAt={draftIncident?.created_at} />
        <EvidenceCategoriesScreen t={t} incident={draftIncident}
          onAddNote={(note) => addNoteTo(draftIncidentId, note)}
          onAddLink={(url) => addLinkTo(draftIncidentId, url)}
          onAddFile={(cat, file) => addFileTo(draftIncidentId, cat, file)}
          hashingCategory={hashingCategory}
          onContinue={() => push({ type: "emergencyCreated" })} />
      </>
    );
  } else if (top?.type === "emergencyCreated") {
    title = t("report_created_title");
    body = <EmergencyCreatedScreen t={t} incident={draftIncident}
      onContinueReport={() => push({ type: "reportDetails" })} onSaveLater={saveForLater} />;
  } else if (top?.type === "reportDetails") {
    title = t("report_details_title");
    body = <ReportDetailsScreen t={t} draft={draft} onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))} onSubmit={submitReport} submitting={submitting} />;
  } else if (top?.type === "reportCreated") {
    title = t("report_created_title");
    body = <ReportCreatedScreen t={t} incident={incidents.find((i) => i.id === top.id)}
      onViewIncident={() => push({ type: "incidentDetail", id: top.id })} onDone={finishReportFlow} />;
  } else if (top?.type === "incidentDetail") {
    title = t("nav_reports");
    body = <IncidentDetailScreen t={t} incident={incidents.find((i) => i.id === top.id)}
      onContinueCapture={() => resumeCapture(top.id)}
      onOpenLocker={() => { setShowAddPanel(false); push({ type: "evidenceLockerDetail", id: top.id }); }}
      onSendMessage={(msg) => sendUserMessage(top.id, msg)}
      onAcknowledge={() => acknowledgeGuidance(top.id)} />;
  } else if (top?.type === "evidenceLockerDetail") {
    title = t("evidence_locker_title");
    body = <EvidenceLockerDetail t={t} incident={incidents.find((i) => i.id === top.id)}
      showAdd={showAddPanel} onToggleAdd={() => setShowAddPanel((s) => !s)}
      onAddNote={(note) => addNoteTo(top.id, note)}
      onAddLink={(url) => addLinkTo(top.id, url)}
      onAddFile={(cat, file) => addFileTo(top.id, cat, file)}
      hashingCategory={hashingCategory} />;
  } else if (tab === "home") {
    title = t("appName");
    body = <DashboardScreen t={t} alerts={alerts} incidents={incidents} onOpenAlert={(id) => push({ type: "alertDetail", id })}
      onEmergency={startEmergencyCapture} onOpenGuides={() => push({ type: "guides" })} onOpenIncident={(id) => push({ type: "incidentDetail", id })} />;
  } else if (tab === "alerts") {
    title = t("alerts_title");
    body = <AlertsListScreen t={t} alerts={alerts} onOpenAlert={(id) => push({ type: "alertDetail", id })} />;
  } else if (tab === "reports") {
    title = t("my_reports_title");
    body = <MyReportsScreen t={t} incidents={incidents} onOpen={(id) => push({ type: "incidentDetail", id })} />;
  } else if (tab === "evidence") {
    title = t("evidence_locker_title");
    body = <EvidenceLockerHome t={t} incidents={incidents} onOpen={(id) => { setShowAddPanel(false); push({ type: "evidenceLockerDetail", id }); }} />;
  }

  if (session === undefined) return null; // brief load, avoids auth-screen flash
  if (session === null) return <EmailAuthScreen t={t} />;
  if (profile === undefined) return null; // brief load, avoids onboarding flash
  if (profile === null) return <OnboardingScreen t={t} onSubmit={completeOnboarding} />;

  return (
    <div className="acg-root min-h-full w-full relative md:flex" style={{ minHeight: 640 }}>
      <style>{TOKENS}</style>
      <SidebarNav active={tab} onChange={changeTab} t={t} />
      <div className="w-full md:flex-1 md:min-w-0">
        <div className="w-full max-w-md md:max-w-3xl mx-auto md:px-6">
          <TopBar
            title={title}
            onBack={stack.length ? pop : null}
            right={!stack.length && tab === "home" ? (
              <button onClick={() => push({ type: "settings" })} aria-label={t("settings_title")} className="acg-tap acg-focus flex items-center justify-center rounded-lg">
                <Bell size={20} color={notifOn ? "var(--acg-accent)" : "var(--acg-text-muted)"} />
              </button>
            ) : null}
          />
          <div className="pb-24 md:pb-10">{body}</div>
        </div>
      </div>
      <div className="md:hidden">
        <BottomNav active={tab} onChange={changeTab} t={t} />
      </div>
      <ComingSoonModal open={!!comingSoon} body={comingSoon} onClose={() => setComingSoon(null)} t={t} />
      {evidenceError && (
        <div className="fixed left-4 right-4 md:left-auto md:right-8 z-40 rounded-xl px-4 py-3 text-sm max-w-md md:w-96 mx-auto md:mx-0" style={{ bottom: 84, background: "var(--acg-danger)", color: "#fff" }}>
          {evidenceError}
        </div>
      )}
    </div>
  );
}
