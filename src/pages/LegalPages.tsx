import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL, GAME_PRIVACY_URL } from '@/lib/site';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-lg uppercase text-bone mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Mail() {
  return <a href={`mailto:${CONTACT_EMAIL}`} className="text-blood hover:text-blood-hover">{CONTACT_EMAIL}</a>;
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blood hover:text-blood-hover break-words">{children}</a>;
}

export function ImpressumPage() {
  const { lang } = useI18n();
  return (
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-3xl mx-auto px-4 lg:px-8">
        <h1 className="font-heading text-3xl uppercase text-bone mb-8">Impressum</h1>
        {lang === 'en' && (
          <p className="text-xs text-bone-muted font-body mb-6 p-3 border border-bg-steel bg-bg-surface">
            This is the legally required notice (Legal Notice) for a German website. The German version below is binding.
          </p>
        )}
        <div className="space-y-6 text-sm text-bone-muted font-body font-light leading-relaxed">
          <Section title="Angaben gemäß § 5 DDG">
            <p>KaMa Studios<br />Inhaber: Johannes Bauer<br />Schilfweg 6<br />51069 Köln<br />Deutschland</p>
          </Section>
          <Section title="Kontakt">
            <p>E-Mail: <Mail /></p>
          </Section>
          <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
            <p>Johannes Bauer, Anschrift wie oben.</p>
          </Section>
          <Section title="Verbraucherstreitbeilegung">
            <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          </Section>
        </div>
      </section>
    </div>
  );
}

export function DatenschutzPage() {
  const { lang } = useI18n();
  return (
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-3xl mx-auto px-4 lg:px-8">
        <h1 className="font-heading text-3xl uppercase text-bone mb-8">Datenschutzerklärung</h1>
        {lang === 'en' && (
          <p className="text-xs text-bone-muted font-body mb-6 p-3 border border-bg-steel bg-bg-surface">
            This is the privacy policy for this website. The German version below is binding. The game has its own privacy policy:{' '}
            <ExtLink href={GAME_PRIVACY_URL}>game privacy policy</ExtLink>.
          </p>
        )}
        <div className="space-y-6 text-sm text-bone-muted font-body font-light leading-relaxed">
          <p>
            Diese Datenschutzerklärung gilt für die Website zombierealitybreach.com. Für das Spiel Zombie Reality Breach gilt eine
            eigene Datenschutzerklärung: <ExtLink href={GAME_PRIVACY_URL}>{GAME_PRIVACY_URL}</ExtLink>
          </p>

          <Section title="1. Verantwortlicher">
            <p>KaMa Studios, Inhaber Johannes Bauer<br />Schilfweg 6, 51069 Köln, Deutschland<br />E-Mail: <Mail /></p>
          </Section>

          <Section title="2. Hosting über Cloudflare">
            <p>
              Diese Website wird über Cloudflare (Cloudflare Workers) bereitgestellt, einen Dienst der Cloudflare Inc.,
              101 Townsend St., San Francisco, CA 94107, USA. Cloudflare übernimmt auch die Namensauflösung (DNS). Beim
              Aufruf der Website verarbeitet Cloudflare technisch notwendige Verbindungsdaten, insbesondere Ihre IP-Adresse,
              Datum und Uhrzeit des Zugriffs, die aufgerufene Seite und den Browsertyp, um die Website auszuliefern und vor
              Angriffen zu schützen. Wir werten diese Daten nicht aus.
            </p>
            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren und
              zuverlässigen Bereitstellung der Website. Die Übermittlung in die USA erfolgt auf Grundlage des
              EU-US Data Privacy Framework (Angemessenheitsbeschluss der EU-Kommission, Art. 45 DSGVO).
            </p>
          </Section>

          <Section title="3. E-Mail an uns">
            <p>
              Schreiben Sie uns an die genannte Adresse, wird Ihre Nachricht über Cloudflare Email Routing an unser
              Postfach weitergeleitet und dort zur Bearbeitung Ihres Anliegens verwendet (Art. 6 Abs. 1 lit. b bzw. f DSGVO).
              Wir löschen sie, sobald sie nicht mehr gebraucht wird und keine Aufbewahrungspflicht besteht.
            </p>
          </Section>

          <Section title="4. Keine Cookies, kein Tracking">
            <p>
              Diese Website setzt keine Cookies, verwendet keine Analyse- oder Tracking-Dienste und keine Werbedienste.
              Es gibt keine Kontaktformulare, keine Benutzerkonten und keine Newsletter. Ein Cookie-Banner ist daher nicht
              erforderlich.
            </p>
          </Section>

          <Section title="5. Schriftarten">
            <p>
              Die verwendeten Schriftarten sind lokal in die Website eingebunden und werden vom selben Server geladen wie
              die Website. Es findet keine Verbindung zu externen Schriftanbietern (z.&nbsp;B. Google Fonts) statt.
            </p>
          </Section>

          <Section title="6. Kontakt per E-Mail">
            <p>
              Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre Angaben (E-Mail-Adresse, Inhalt der Nachricht),
              um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO bzw. Art. 6 Abs. 1 lit. b
              DSGVO, wenn Ihre Anfrage auf einen Vertrag gerichtet ist. Wir löschen die Daten, sobald sie für die
              Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </Section>

          <Section title="7. Externe Links">
            <p>
              Die Website enthält Links zu externen Angeboten, z.&nbsp;B. zum Meta Quest Store. Erst wenn Sie einen solchen
              Link anklicken, werden Daten an den jeweiligen Anbieter übertragen; dort gilt dessen Datenschutzerklärung.
            </p>
          </Section>

          <Section title="8. Ihre Rechte">
            <p>
              Sie haben nach der DSGVO das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
              Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen eine
              Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Wenden Sie sich dafür an <Mail />.
            </p>
            <p>
              Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO),
              z.&nbsp;B. bei der Landesbeauftragten für Datenschutz und Informationsfreiheit Nordrhein-Westfalen.
            </p>
          </Section>

          <p className="text-xs text-bone-muted/60">Stand: Oktober 2026</p>
        </div>
      </section>
    </div>
  );
}
