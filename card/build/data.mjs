// Single source of truth for the contact card.
// Every value here was taken from the owner's own published portfolio
// (index.html JSON-LD, README.md) — nothing is invented.

export const CARD_URL =
  process.env.CARD_URL || 'https://karthick-a.github.io/portfolio/card/';

export const person = {
  first: 'Karthick',
  last: 'A',
  fullName: 'Karthick A',
  title: 'Embedded Systems Engineer',
  company: 'Spark Invotech Pvt Ltd',
  blurb: 'Automotive ECU electronics, PCB design and industrial IoT.',
  city: 'Chennai, India',
  email: 'karthick.rd.dev@gmail.com',        // technical
  emailBiz: 'sparkinvotech.ceo@gmail.com',    // business / everything else
  phone: '+91 70948 28457',
  phoneDigits: '+917094828457',
  whatsapp: '917094828457',
  website: 'https://karthick-a.github.io/portfolio/',
  linkedin: 'https://linkedin.com/in/karthick-a-83a352211',
  github: 'https://github.com/KARTHICK-A',
};

// vCard 3.0 text values must escape backslash, comma, semicolon and newline,
// or a comma silently truncates the value in strict parsers.
const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

// The QR payload is deliberately leaner than the .vcf file: parameters such as
// TYPE=INTERNET are dropped because they cost bytes and change nothing for any
// scanner. The .vcf download carries the full record.
export const vcardQR = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `N:${person.last};${person.first};;;`,
  `FN:${person.fullName}`,
  `TITLE:${esc(person.title)}`,
  `ORG:${esc(person.company)}`,
  `TEL:${person.phoneDigits}`,
  `EMAIL:${person.email}`,
  `EMAIL:${person.emailBiz}`,
  `URL:${person.website}`,
  'END:VCARD',
].join('\r\n') + '\r\n';

// Full record for the downloadable file — no size pressure here.
export const vcardFile = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `N:${person.last};${person.first};;;`,
  `FN:${person.fullName}`,
  `TITLE:${esc(person.title)}`,
  `ORG:${esc(person.company)}`,
  `TEL;TYPE=CELL,VOICE:${person.phoneDigits}`,
  `EMAIL;TYPE=INTERNET,PREF:${person.email}`,
  `EMAIL;TYPE=INTERNET,WORK:${person.emailBiz}`,
  `URL:${person.website}`,
  'ADR;TYPE=WORK:;;;Chennai;Tamil Nadu;;India',
  `X-SOCIALPROFILE;TYPE=linkedin:${person.linkedin}`,
  `X-SOCIALPROFILE;TYPE=github:${person.github}`,
  `NOTE:${esc(person.blurb)}`,
  'END:VCARD',
].join('\r\n') + '\r\n';

export const links = [
  { label: 'Email',    sub: person.email,              href: `mailto:${person.email}`, ext: false },
  { label: 'Business', sub: person.emailBiz,           href: `mailto:${person.emailBiz}`, ext: false },
  { label: 'Phone',    sub: person.phone,              href: `tel:${person.phoneDigits}`, ext: false },
  { label: 'WhatsApp', sub: person.phone,              href: `https://wa.me/${person.whatsapp}`, ext: true },
  { label: 'Website',  sub: 'karthick-a.github.io/portfolio', href: person.website, ext: true },
  { label: 'LinkedIn', sub: 'in/karthick-a-83a352211', href: person.linkedin, ext: true },
  { label: 'GitHub',   sub: 'KARTHICK-A',              href: person.github, ext: true },
];
