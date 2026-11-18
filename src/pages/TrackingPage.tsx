import { useState } from 'react';
type Row = Record<string, string | number | null>;
interface Report { generatedAt: string; days: number; totals: Row; previous: Row; daily: Row[]; campaigns: Row[]; pages: Row[]; events: Row[]; audience: Row[]; game: Row | null; dailyBudget: { used: number; limit: number }; }
const labels: Record<string,string> = { source:'Quelle',medium:'Medium',campaign:'Kampagne',content:'Beitrag',sessions:'Sitzungen',page_views:'Seitenaufrufe',beta_sessions:'Sitzungen mit Beta-Klick',path:'Seite',beta_clicks:'Beta-Klicks',name:'Ereignis',target:'Position / Ziel',value:'Wert',count:'Anzahl',device:'Gerät',browser:'Browser',country:'Land',language:'Sprache',reporting_installations:'Meldende Installationen gesamt',first_reports_in_period:'Erstmeldung im Zeitraum',active_installations_in_period:'Aktiv im Zeitraum',online_installations:'Jetzt online',page_view:'Seitenaufruf',beta_click:'Beta-Zugang',outbound_click:'Externer Link',navigation:'Navigation',download:'Download',contact_click:'Kontakt',scroll:'Scrolltiefe (%)',engaged:'Aktive Zeit (Sekunden)',trailer_start:'Trailer gestartet',trailer_progress:'Trailer-Position (%)',trailer_complete:'Trailer beendet',language_change:'Sprache geändert',client_error:'Seitenfehler' };
function Table({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p className="text-bone-muted py-4">Noch keine Daten im Zeitraum.</p>;
  const columns = Object.keys(rows[0]);
  return <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{columns.map(k => <th key={k} className="p-3 border-b border-bone/30">{labels[k] || k}</th>)}</tr></thead><tbody>{rows.map((row,n) => <tr key={n}>{columns.map(k => <td key={k} className="p-3 border-b border-bone/10">{k === 'name' ? labels[String(row[k])] || String(row[k]) : String(row[k] ?? '—')}</td>)}</tr>)}</tbody></table></div>;
}
function download(report: Report) {
  const rows: Row[] = [ ...report.daily.map(r => ({ type:'daily', ...r })), ...report.campaigns.map(r => ({ type:'campaign', ...r })), ...report.pages.map(r => ({ type:'page', ...r })), ...report.events.map(r => ({ type:'event', ...r })), ...report.audience.map(r => ({ type:'audience', ...r })) ];
  const columns = Array.from(new Set(rows.flatMap(Object.keys)));
  const cell = (v: unknown) => { const raw = String(v ?? ''); return '"' + (/^[=+@-]/.test(raw) ? "'" + raw : raw).replace(/"/g,'""') + '"'; };
  const csv = [columns, ...rows.map(r => columns.map(c => r[c]))].map(r => r.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'zrb-tracking-' + report.generatedAt.slice(0,10) + '.csv'; a.click(); URL.revokeObjectURL(url);
}
export default function TrackingPage() {
  const [key, setKey] = useState(''); const [days, setDays] = useState(7);
  const [report, setReport] = useState<Report | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const [source, setSource] = useState('youtube'); const [campaign, setCampaign] = useState('open-beta'); const [content, setContent] = useState('short-01'); const [medium, setMedium] = useState('organic-social');
  const link = new URL('https://zombierealitybreach.com/');
  for (const [name,value] of Object.entries({source,medium,campaign,content})) link.searchParams.set('utm_' + name,value.toLowerCase().replace(/[^a-z0-9_-]/g,''));
  async function load() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/analytics/report?days=' + days, { headers: { authorization: 'Bearer ' + key }, cache:'no-store' });
      if (!response.ok) throw new Error(response.status === 401 ? 'Zugriffsschlüssel ungültig.' : 'Auswertung derzeit nicht verfügbar (' + response.status + ').');
      setReport(await response.json());
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Abruf fehlgeschlagen.'); } finally { setBusy(false); }
  }
  const sessions = Number(report?.totals?.sessions ?? 0); const beta = Number(report?.totals?.beta_sessions ?? 0);
  const fields: { label:string; value:string; set:(v:string)=>void }[] = [{label:'Quelle',value:source,set:setSource},{label:'Medium',value:medium,set:setMedium},{label:'Kampagne',value:campaign,set:setCampaign},{label:'Beitrag',value:content,set:setContent}];
  return <section className="pt-28 pb-24 px-4 max-w-7xl mx-auto space-y-8">
    <header><h1 className="font-heading text-3xl">Kampagnen-Auswertung</h1><p className="text-bone-muted mt-2">Privater Bereich · Website-Sitzungen und Spielaktivität werden getrennt ausgewiesen.</p></header>
    <form onSubmit={e => { e.preventDefault(); void load(); }} className="flex flex-wrap gap-3 items-end">
      <label>Zugriffsschlüssel<input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} className="block bg-bg-steel border border-bone/30 p-3 rounded" required /></label>
      <label>Zeitraum<select value={days} onChange={e => setDays(Number(e.target.value))} className="block bg-bg-steel p-3 rounded">{[1,7,30,90].map(n => <option key={n} value={n}>{n} Tage</option>)}</select></label>
      <button disabled={busy} className="border border-bone/50 px-5 py-3">{busy ? 'Lädt…' : 'Auswertung laden'}</button>
      {report && <><button type="button" className="underline p-3" onClick={() => download(report)}>CSV exportieren</button><button type="button" className="underline p-3" onClick={() => { setReport(null); setKey(''); }}>Abmelden</button></>}
    </form>
    {message && <p role="alert" className="text-ember">{message}</p>}
    {report && <>
      <p className="text-sm text-bone-muted">Stand {new Date(report.generatedAt).toLocaleString('de-DE',{ timeZone:'Europe/Berlin' })} · letzte {report.days} Tage · Vergleich mit vorherigem gleich langen Zeitraum · Tagesdiagramm in UTC.</p>
      <div className="grid sm:grid-cols-4 gap-4">{[{label:'Sitzungen',value:sessions,metric:'sessions'},{label:'Seitenaufrufe',value:Number(report.totals?.page_views ?? 0),metric:'page_views'},{label:'Sitzungen mit Beta-Klick',value:beta,metric:'beta_sessions'},{label:'Beta-Klickrate',value:sessions ? (beta/sessions*100).toFixed(1)+' %' : '—',metric:''}].map(({label,value,metric}) => <div key={label} className="border border-bone/20 p-5"><p className="text-sm text-bone-muted">{label}</p><strong className="text-3xl">{value}</strong>{metric && <p className="text-xs mt-2">Vorperiode: {report.previous?.[metric] ?? 0}</p>}</div>)}</div>
      <p className="border border-ember/40 p-4">Erfasst werden nur Besuche mit Analyse-Einwilligung. Sitzungen sind keine eindeutigen Personen. Beta-Klicks bestätigen weder Beitritt noch Installation. Werbeblocker und Ablehnungen verursachen Datenlücken.</p>
      <section><h2 className="font-heading text-xl mb-3">Entwicklung pro Tag</h2><div className="space-y-2">{report.daily.map(row => <div key={row.day} className="flex gap-3 items-center text-sm"><span className="w-24 shrink-0">{row.day}</span><div className="bg-blood h-5" style={{width:Math.max(2,Number(row.sessions)/Math.max(1,...report.daily.map(d=>Number(d.sessions)))*70)+'%'}} /><span>{row.sessions} Sitzungen / {row.beta_sessions} Beta</span></div>)}</div></section>
      <section><h2 className="font-heading text-xl">Funnel</h2><Table rows={[{Schritt:'Analyse-Sitzungen',Sitzungen:sessions},{Schritt:'Mindestens 15 Sekunden aktiv',Sitzungen:report.totals?.engaged_sessions ?? 0},{Schritt:'Beta-Zugang angeklickt',Sitzungen:beta}]} /><p className="text-sm text-bone-muted mt-2">Unabhängige Sitzungszählungen: Auch ein schneller Beta-Klick ohne 15 Sekunden zählt. Ein bestätigter Meta-Beitritt ist hier nicht messbar.</p></section>
      <section><h2 className="font-heading text-xl">Spielaktivität (separate Datenquelle)</h2>{report.game ? <Table rows={[report.game]} /> : <p>Nicht verfügbar – keine Nullwerte angenommen.</p>}<p className="text-sm text-bone-muted mt-2">Meldende Installationen aus dem Spiel, keine Personen und keine bestätigten Beta-Mitglieder. Neuinstallation kann erneut zählen. Kein Abgleich mit Website-Sitzungen.</p></section>
      {([['Kampagnen und Quellen',report.campaigns],['Seiten und Beta-Klicks',report.pages],['Interaktionen, Scrolltiefe und Trailer',report.events],['Geräte, Browser, Länder und Sprache',report.audience]] as [string,Row[]][]).map(([title,rows]) => <section key={title}><h2 className="font-heading text-xl mb-3">{title}</h2><Table rows={rows} /></section>)}
      <p className="text-xs text-bone-muted">90 Tage Aufbewahrung. Keine vollständigen IP-Adressen, Referrer-URLs, Querystrings, E-Mail-Adressen oder Formulareingaben in der Analyse. Tagesbudget: {report.dailyBudget.used} / {report.dailyBudget.limit} Ereignisse (UTC). Bei Erreichen endet die Erfassung bis zum nächsten UTC-Tag.</p>
    </>}
    <section className="border border-bone/20 p-5 space-y-4"><h2 className="font-heading text-xl">Kampagnenlink erstellen</h2><p className="text-sm text-bone-muted">Nur Kampagnenkennungen verwenden, keine Namen oder E-Mail-Adressen. Ein eigener content-Wert pro Beitrag ermöglicht den Vergleich.</p><div className="grid sm:grid-cols-4 gap-3">{fields.map(f => <label key={f.label}>{f.label}<input className="block w-full bg-bg-steel border border-bone/30 p-2" value={f.value} onChange={e => f.set(e.target.value)} /></label>)}</div><output className="block break-all text-sm">{link.toString()}</output><button className="border border-bone/30 px-4 py-2" onClick={() => { void navigator.clipboard.writeText(link.toString()).then(() => setMessage('Kampagnenlink kopiert.')).catch(() => setMessage('Bitte den angezeigten Link manuell kopieren.')); }}>Link kopieren</button></section>
  </section>;
}
