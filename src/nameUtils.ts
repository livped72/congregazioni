// Italian compound surname prefixes
const COMPOUND_PREFIXES = new Set([
  'de', 'di', 'da', 'del', 'della', 'delle', 'dello', 'dei', 'degli',
  'lo', 'la', 'li', 'le', 'san', 'santa', 'sant'
]);

// Male Italian names ending with 'a' or other atypical endings
const MALE_NAMES = new Set([
  'andrea', 'luca', 'mattia', 'nicola', 'elia', 'battista', 'tobia',
  'gianluca', 'gianmaria', 'sasha', 'barnaba', 'costa', 'yurij', 'angelo'
]);

// Female Italian names not ending with 'a'
const FEMALE_NAMES = new Set([
  'elisabetta', 'ines', 'ester', 'noemi', 'miriam', 'ruth', 'carmen',
  'alice', 'beatrice', 'irene', 'adele', 'matilde', 'clelia', 'rachel',
  'nicole', 'marion', 'astrid', 'venere'
]);

export function parseItalianFullName(full: string): { last_name: string; first_name: string } {
  if (!full) return { last_name: '', first_name: '' };
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { last_name: '', first_name: '' };
  if (parts.length === 1) return { last_name: parts[0], first_name: '' };

  const p0 = parts[0].toLowerCase().replace(/[''’`]/g, '');
  if (COMPOUND_PREFIXES.has(p0) && parts.length >= 3) {
    return {
      last_name: `${parts[0]} ${parts[1]}`,
      first_name: parts.slice(2).join(' ')
    };
  }

  return {
    last_name: parts[0],
    first_name: parts.slice(1).join(' ')
  };
}

export function inferGender(firstName: string, privilegeCodes?: string): 'M' | 'F' {
  const priv = (privilegeCodes || '').toUpperCase();
  // Elders, ministerial servants, group overseers are always male
  if (priv.includes('A') || priv.includes('SM') || priv.includes('SOG') || priv.includes('SG')) {
    return 'M';
  }

  const fn = (firstName || '').trim().toLowerCase().split(/\s+/)[0] || '';
  if (!fn) return 'M';
  if (MALE_NAMES.has(fn)) return 'M';
  if (FEMALE_NAMES.has(fn)) return 'F';
  if (fn.endsWith('a')) return 'F';
  if (fn.endsWith('e') && ['adele', 'irene', 'venere', 'clelia'].includes(fn)) return 'F';

  return 'M';
}

export function getDisplayName(lastName?: string, firstName?: string): string {
  const l = (lastName || '').trim();
  const f = (firstName || '').trim();
  if (!l && !f) return '—';
  if (!f) return l;
  if (!l) return f;
  // If last_name and first_name are identical (e.g. from a corrupted previous import)
  if (l.toLowerCase() === f.toLowerCase()) {
    return l;
  }
  return `${l} ${f}`;
}
