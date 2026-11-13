export function redactPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 3)}****${digits.slice(-2)}`;
}

export function redactEmail(email?: string | null): string | null {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!domain) return '***';
  const head = name!.slice(0, 1);
  return `${head}***@${domain}`;
}

export function redactTin(tin?: string | null): string | null {
  if (!tin) return null;
  if (tin.length <= 4) return '***';
  return `***${tin.slice(-4)}`;
}
