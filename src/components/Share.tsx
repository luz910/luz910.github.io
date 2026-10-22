import { useState } from 'react';
import { Link2, Mail, Share2, Check } from 'lucide-react';
import { SocialIcon } from './SocialIcons';

export function Share({ title }: { title: string }) {
  const url = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { name: 'WhatsApp', icon: <SocialIcon name="whatsapp" />, href: `https://wa.me/?text=${enc(title + ' ' + url)}` },
    { name: 'LinkedIn', icon: <SocialIcon name="linkedin" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { name: 'Facebook', icon: <SocialIcon name="facebook" />, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: 'X', icon: <SocialIcon name="x" />, href: `https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}` },
    { name: 'Correo', icon: <Mail className="h-4 w-4" />, href: `mailto:?subject=${enc(title)}&body=${enc(url)}` },
  ];
  const btn = 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition hover:border-orange hover:text-orange-deep';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-ink">Compartir</span>
      {'share' in navigator && (
        <button className={btn} aria-label="Compartir desde el dispositivo" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          <Share2 className="h-4 w-4" />
        </button>
      )}
      {links.map((l) => (
        <a key={l.name} className={btn} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`Compartir en ${l.name}`} title={l.name}>
          {l.icon}
        </a>
      ))}
      <button className={btn} aria-label="Copiar enlace" title="Copiar enlace" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
        {copied ? <Check className="h-4 w-4 text-green-700" /> : <Link2 className="h-4 w-4" />}
      </button>
      <span aria-live="polite" className="sr-only">{copied ? 'Enlace copiado' : ''}</span>
    </div>
  );
}
