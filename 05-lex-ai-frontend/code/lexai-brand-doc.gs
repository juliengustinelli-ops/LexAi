/**
 * LexAi Document Branding Script
 * --------------------------------
 * How to use:
 * 1. Open your Google Doc
 * 2. Click Extensions → Apps Script
 * 3. Paste this entire script and click Save
 * 4. Click Run → applyLexAiBranding
 * 5. Approve permissions when prompted
 *
 * To reuse for a new client: just update CLIENT_NAME at the top.
 */

const CLIENT_NAME = '[Client Name]';  // <-- change this per client

// Brand colors
const TEAL       = '#00c2b5';
const DARK       = '#0b0d19';
const GRAY       = '#888888';
const LIGHT_GRAY = '#aaaaaa';
const BODY_COLOR = '#333333';
const WHITE      = '#ffffff';

// Logo image URL (hosted on lexaib2b.com)
const LOGO_URL = 'https://lexaib2b.com/lexai-logo-full.png';

// Section labels to detect and style teal
const SECTION_LABELS = ['WHAT WE DO', 'HOW WE WORK', 'OUR SERVICES', 'ABOUT US', 'CONTACT'];

// Headings that follow each section label
const HEADINGS = [
  'We help businesses turn AI into a competitive advantage.',
  'Product developers who work hand-in-hand with your team.',
  'Three ways to work with us.',
  'Built by practitioners, not theorists.',
  'Get in touch.'
];

// Service item titles
const SERVICE_TITLES = [
  'End-to-End AI Product Development',
  'AI Integration & Enablement',
  'Strategy & Advisory'
];

function applyLexAiBranding() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();

  // ── 1. Clear existing content and insert header ──
  body.clear();
  insertHeader(body, doc);

  // ── 2. Re-insert content with branding ──
  insertContent(body);

  // ── 3. Set page margins ──
  body.setMarginTop(54);
  body.setMarginBottom(54);
  body.setMarginLeft(72);
  body.setMarginRight(72);

  doc.saveAndClose();
  DocumentApp.openById(doc.getId());
}

function insertHeader(body, doc) {
  // Try to insert logo image
  try {
    const imageBlob = UrlFetchApp.fetch(LOGO_URL).getBlob();
    const img = body.appendImage(imageBlob);
    img.setWidth(180);
    img.setHeight(60);
  } catch (e) {
    // Fallback: text logo
    const logoP = body.appendParagraph('LexAi');
    logoP.editAsText()
      .setFontSize(0, 2, 20).setBold(0, 2, true).setForegroundColor(0, 2, DARK)
      .setFontSize(3, 4, 20).setBold(3, 4, true).setForegroundColor(3, 4, TEAL);
    logoP.setSpacingAfter(4);
  }

  // Meta line: For [Client] · Authors · Date
  const meta = body.appendParagraph(
    `For ${CLIENT_NAME}  ·  Julien Gustinelli & Eric Park  ·  April 2026`
  );
  styleSmall(meta, LIGHT_GRAY);
  meta.setSpacingAfter(12);

  // Teal rule (using underscores as a visual divider)
  const rule = body.appendParagraph('____________________________________________________________');
  rule.editAsText().setForegroundColor(TEAL).setFontSize(8);
  rule.setSpacingAfter(24);
}

function insertContent(body) {

  // ── WHAT WE DO ──
  appendSectionLabel(body, 'What We Do');
  appendHeading(body, 'We help businesses turn AI into a competitive advantage.');
  appendBody(body, 'Whether automating internal processes or building LLM-powered chat experiences, we build AI systems that address high-impact business challenges.');

  appendDivider(body);

  // ── HOW WE WORK ──
  appendSectionLabel(body, 'How We Work');
  appendHeading(body, 'Product developers who work hand-in-hand with your team.');
  appendBody(body, 'We are product developers who work hand-in-hand with clients to design and ship custom AI solutions inside companies that want to expand their capabilities.');
  appendBody(body, 'Our clients often have ambiguous business problems. And that\'s OK.');
  appendBody(body, 'We run discovery workshops to identify the highest-impact opportunities where automation can drive meaningful efficiencies, then build the workflows and products that operationalize them.');
  appendBody(body, 'In short, we accelerate your business by applying AI to the right problems.');

  appendDivider(body);

  // ── OUR SERVICES ──
  appendSectionLabel(body, 'Our Services');
  appendHeading(body, 'Three ways to work with us.');
  appendServiceItem(body, 'End-to-End AI Product Development',
    'We partner with teams to identify where AI can materially impact revenue, cost, or operational efficiency. From discovery through deployment, we design and ship custom solutions that integrate seamlessly into your existing workflows.');
  appendServiceItem(body, 'AI Integration & Enablement',
    'For teams with a clear AI use case but limited internal capacity, we design and deploy the solution — often placing a working MVP in front of users within days.');
  appendServiceItem(body, 'Strategy & Advisory',
    'We advise leadership teams on how to thoughtfully integrate AI into their business. We conduct structured discovery to surface the most valuable use cases, evaluate vendor and tooling landscapes, and assess data readiness.');

  appendDivider(body);

  // ── ABOUT US ──
  appendSectionLabel(body, 'About Us');
  appendHeading(body, 'Built by practitioners, not theorists.');
  appendBody(body, 'Eric and Julien bring together over 15 years of tech experience, spanning lean startups to industry giants like Google and Amazon. We are entrepreneurs who have built products from zero-to-one, advised early-stage AI founders, and contributed to the development of Google Gemini — serving as trusted thought partners across product, engineering, and R&D.');

  appendSubheading(body, 'Modeling');
  appendBullet(body, 'Operationalized quality standards for Google Gemini, training model outputs to drive go/no-go decisions across major releases for millions of users');
  appendBullet(body, 'Trained an LLM-powered agent to crawl and scrape thousands of Meta ads to collect market data for outbound campaigns');

  appendSubheading(body, 'Documents & Data');
  appendBullet(body, 'Created Python-based RAG pipelines from scratch grounded in proprietary financial documents stored in vector databases with security filters');
  appendBullet(body, 'Deployed a microservice for a 200-person firm that creates real-time visualizations of survey data using Qualtrics and Tableau');

  appendSubheading(body, 'General AI Expertise');
  appendBullet(body, 'LLM integration & API orchestration, generative AI platform development, prompt engineering, agentic workflows, enterprise AI deployment, and conversational AI/NLU design');
  appendBullet(body, 'Experience with most major LLM apps and models for productivity and software development');

  appendSubheading(body, 'Product Development');
  appendBullet(body, 'Built an early-warning system for a Series A SaaS startup that uses Slack to proactively alert technical teams of data migration issues');
  appendBullet(body, 'Created a rules-based eligibility system for credit recovery on behalf of NYCDOE, the largest school district in the US');

  appendDivider(body);

  // ── CONTACT ──
  appendSectionLabel(body, 'Contact');
  appendHeading(body, 'Get in touch.');
  appendContactLine(body, 'Eric Park', 'eric@lexaib2b.com');
  appendContactLine(body, 'Julien Gustinelli', 'julien@lexaib2b.com');
}

// ── Helpers ──

function appendSectionLabel(body, text) {
  const p = body.appendParagraph(text.toUpperCase());
  p.setSpacingBefore(20);
  p.setSpacingAfter(4);
  const t = p.editAsText();
  t.setFontSize(8);
  t.setBold(true);
  t.setForegroundColor(TEAL);
  t.setFontFamily('Arial');
}

function appendHeading(body, text) {
  const p = body.appendParagraph(text);
  p.setSpacingBefore(4);
  p.setSpacingAfter(10);
  const t = p.editAsText();
  t.setFontSize(15);
  t.setBold(true);
  t.setForegroundColor(DARK);
  t.setFontFamily('Arial');
}

function appendSubheading(body, text) {
  const p = body.appendParagraph(text);
  p.setSpacingBefore(14);
  p.setSpacingAfter(4);
  const t = p.editAsText();
  t.setFontSize(9);
  t.setBold(true);
  t.setForegroundColor(DARK);
  t.setFontFamily('Arial');
}

function appendBody(body, text) {
  const p = body.appendParagraph(text);
  p.setSpacingAfter(8);
  const t = p.editAsText();
  t.setFontSize(10);
  t.setBold(false);
  t.setForegroundColor(BODY_COLOR);
  t.setFontFamily('Arial');
}

function appendBullet(body, text) {
  const p = body.appendListItem(text);
  p.setNestingLevel(0);
  p.setListId(p);
  p.setSpacingAfter(4);
  const t = p.editAsText();
  t.setFontSize(10);
  t.setForegroundColor(BODY_COLOR);
  t.setFontFamily('Arial');
}

function appendServiceItem(body, title, description) {
  const p = body.appendParagraph('');
  p.setSpacingBefore(10);
  p.setSpacingAfter(8);
  const t = p.editAsText();
  t.appendText(title + '\n');
  const titleEnd = title.length;
  t.setFontSize(0, titleEnd - 1, 11);
  t.setBold(0, titleEnd - 1, true);
  t.setForegroundColor(0, titleEnd - 1, DARK);
  t.appendText(description);
  const fullLen = p.getText().length;
  t.setFontSize(titleEnd + 1, fullLen - 1, 10);
  t.setBold(titleEnd + 1, fullLen - 1, false);
  t.setForegroundColor(titleEnd + 1, fullLen - 1, BODY_COLOR);
  t.setFontFamily('Arial');
}

function appendContactLine(body, name, email) {
  const p = body.appendParagraph('');
  p.setSpacingAfter(6);
  const t = p.editAsText();
  t.appendText(name + '  ');
  const nameEnd = name.length + 2;
  t.setFontSize(0, nameEnd - 1, 10);
  t.setBold(0, nameEnd - 1, true);
  t.setForegroundColor(0, nameEnd - 1, DARK);
  t.appendText(email);
  const fullLen = p.getText().length;
  t.setFontSize(nameEnd, fullLen - 1, 10);
  t.setBold(nameEnd, fullLen - 1, false);
  t.setForegroundColor(nameEnd, fullLen - 1, TEAL);
  t.setFontFamily('Arial');
}

function appendDivider(body) {
  const p = body.appendParagraph('');
  p.setSpacingBefore(20);
  p.setSpacingAfter(4);
  p.editAsText().setForegroundColor(LIGHT_GRAY);
}

function styleSmall(p, color) {
  const t = p.editAsText();
  t.setFontSize(8);
  t.setForegroundColor(color || LIGHT_GRAY);
  t.setFontFamily('Arial');
  t.setBold(false);
}
