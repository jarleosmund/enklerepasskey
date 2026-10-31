// ---------- Tema ----------
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch {}
document.getElementById("themeToggle").addEventListener("click", () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
});

// ---------- Innloggingsdemo ----------
const flows = {
  password: [
    { text: "Du skriver passordet ditt.", packet: null },
    { text: "Passordet sendes over nettet til nettsiden.", packet: { label: "🗝️ Hemmelig123!", cls: "bad", to: 100 },
      note: { cls: "bad", text: "En falsk nettside (phishing) får passordet like lett som den ekte." } },
    { text: "Nettsiden sammenligner med det den har lagret.", packet: null,
      note: { cls: "bad", text: "Blir nettsiden hacket, kan passordene lekke, og brukes på andre sider der du har samme passord." } },
    { text: "Du er logget inn.", packet: null },
  ],
  passkey: [
    { text: "Nettsiden sender en tilfeldig utfordring.", packet: { label: "🎲 utfordring", cls: "", from: 100, to: 0 } },
    { text: "Du bekrefter med fingeravtrykk, ansikt eller PIN.", packet: null,
      note: { cls: "good", text: "Biometrien blir på enheten din. Den sendes aldri noe sted." } },
    { text: "Enheten signerer utfordringen med den private nøkkelen.", packet: { label: "✍️ signatur", cls: "good", from: 0, to: 100 },
      note: { cls: "good", text: "Signaturen virker bare for denne nettsiden og bare denne gangen. Ubrukelig for en svindler." } },
    { text: "Nettsiden sjekker signaturen med din offentlige nøkkel. Du er inne.", packet: null,
      note: { cls: "good", text: "Nettsiden lagrer ingen hemmeligheter som kan stjeles." } },
  ],
};

let currentFlow = "password";
let playing = false;
const flowSteps = document.getElementById("flowSteps");
const packet = document.getElementById("packet");
const playBtn = document.getElementById("playFlow");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function renderFlow() {
  flowSteps.innerHTML = flows[currentFlow]
    .map(s => `<li>${s.text}${s.note ? `<span class="note ${s.note.cls}">${s.note.text}</span>` : ""}</li>`)
    .join("");
  packet.style.opacity = 0;
}

const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

async function playFlow() {
  if (playing) return;
  playing = true;
  playBtn.disabled = true;
  renderFlow();
  const items = [...flowSteps.children];
  for (const [i, step] of flows[currentFlow].entries()) {
    items[i].classList.add("on");
    if (step.packet) {
      const p = step.packet;
      packet.style.transition = "none";
      packet.style.left = (p.from ?? 0) + "%";
      packet.textContent = p.label;
      packet.className = "packet " + p.cls;
      packet.offsetWidth; // tving reflow før animasjon
      packet.style.transition = "";
      packet.style.opacity = 1;
      packet.style.left = p.to + "%";
      await wait(1100);
      packet.style.opacity = 0;
    }
    await wait(900);
  }
  playing = false;
  playBtn.disabled = false;
  playBtn.textContent = "↻ Spill av igjen";
}

document.querySelectorAll("[data-flow]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (playing) return;
    currentFlow = btn.dataset.flow;
    document.querySelectorAll("[data-flow]").forEach(b => b.setAttribute("aria-selected", b === btn));
    playBtn.textContent = "▶ Spill av";
    renderFlow();
  });
});
playBtn.addEventListener("click", playFlow);
renderFlow();

// ---------- Enhetsfaner ----------
const tabs = document.querySelectorAll("#deviceTabs [data-tab]");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.setAttribute("aria-selected", t === tab));
    document.querySelectorAll("#deviceTabs [data-panel]").forEach(p => {
      p.hidden = p.dataset.panel !== tab.dataset.tab;
    });
  });
});

// ---------- FAQ ----------
const faq = [
  { cat: "sikkerhet", q: "Er passkeys virkelig tryggere enn passord?",
    a: `<p>Ja. De tre vanligste måtene kontoer blir overtatt på er phishing (falske nettsider), gjenbrukte passord og lekkasjer fra hackede nettsider. Passkeys stopper alle tre:</p>
        <p>• En passkey virker bare på den ekte nettsiden, så en falsk side kan ikke bruke den.<br>• Hver nettside får sin egen nøkkel.<br>• Nettsiden lagrer bare den offentlige nøkkelen, som er verdiløs for en tyv.</p>` },
  { cat: "sikkerhet", q: "Får nettsiden (eller Apple/Google/Microsoft) fingeravtrykket eller ansiktet mitt?",
    a: `<p>Nei. Biometrien brukes bare lokalt for å låse opp enheten, akkurat som når du låser opp telefonen. Nettsiden får bare en kryptografisk signatur, og vet ikke engang om du brukte finger, ansikt eller PIN.</p>` },
  { cat: "tap", q: "Hva skjer hvis jeg mister eller knuser telefonen?",
    a: `<p>Det kommer an på hvor passkeyen var lagret:</p>
        <p>• <strong>Synkronisert</strong> (iCloud-nøkkelring, Google Passordbehandler, 1Password osv.): Logg inn på den nye telefonen med samme konto, så er passkeyene der igjen.<br>
        • <strong>Bare på enheten</strong> (f.eks. lokal Windows Hello eller sikkerhetsnøkkel): Den er borte. Logg inn på en annen måte (passord, reservekode, e-post), slett den gamle passkeyen i kontoinnstillingene og lag en ny.</p>
        <p>Tips: Ha alltid minst to måter å komme inn på viktige kontoer.</p>` },
  { cat: "tap", q: "Kan en tyv bruke passkeyene hvis de stjeler telefonen min?",
    a: `<p>Ikke uten å låse opp telefonen. Passkeys krever fingeravtrykk, ansikt eller enhetskoden hver gang. Bruk derfor en god skjermlås, ikke 1234, og fjern den stjålne enheten fra Apple-, Google- eller Microsoft-kontoen din så fort som mulig.</p>` },
  { cat: "tap", q: "Hva om jeg glemmer PIN-koden?",
    a: `<p>PIN-en til Windows Hello eller telefonen kan tilbakestilles ved å logge inn med kontoen din (Microsoft-, Apple- eller Google-konto). Passkeyene for selve nettsidene påvirkes ikke av at du bytter PIN.</p>` },
  { cat: "praktisk", q: "Må jeg slutte å bruke passord nå?",
    a: `<p>Nei. Passkeys kommer i tillegg til passordet hos de fleste tjenester i dag. Du kan begynne med de viktigste kontoene (e-post, Google/Apple/Microsoft, nettbank der det støttes) og la passordet være igjen som reserve. Noen tjenester lar deg fjerne passordet helt når du er komfortabel med det.</p>` },
  { cat: "praktisk", q: "Hvilke nettsider støtter passkeys?",
    a: `<p>Stadig flere. Blant de store: Google, Microsoft, Apple, Amazon, PayPal, GitHub, LinkedIn, WhatsApp, TikTok, X, Adobe, Nintendo, Best Buy og mange flere. Se etter «Passkeys» eller «Påloggingsmetoder» under sikkerhetsinnstillingene. Oversikter finnes på <a href="https://passkeys.directory" rel="noopener">passkeys.directory</a>.</p>` },
  { cat: "enheter", q: "Kan jeg bruke en passkey fra iPhonen på en Windows-PC?",
    a: `<p>Ja. Velg «Bruk en telefon eller et nettbrett» når PC-en spør, og skann QR-koden med iPhone-kameraet. Bluetooth må være på begge enhetene. Det sjekker at telefonen er fysisk i nærheten, så ingen kan gjøre dette på avstand.</p>
        <p>Vil du slippe QR-koden hver gang, kan du lage en egen passkey på PC-en i tillegg, eller bruke en passordbehandler som finnes på begge.</p>` },
  { cat: "enheter", q: "Jeg har iPhone og Windows-PC. Hva bør jeg velge?",
    a: `<p>Tre gode valg:</p>
        <p>1. <strong>Passordbehandler</strong> (1Password, Bitwarden, Proton Pass osv.) finnes på begge og synkroniserer alt.<br>
        2. <strong>iCloud-nøkkelring på iPhone</strong>, og QR-kode når du er på PC-en.<br>
        3. <strong>To passkeys per konto</strong>: én på iPhonen og én i Windows Hello. De fleste tjenester tillater flere.</p>` },
  { cat: "enheter", q: "Kan jeg ha flere passkeys for samme konto?",
    a: `<p>Ja, hos de fleste tjenester. Det er faktisk lurt: én på telefonen, én på PC-en og gjerne én på en sikkerhetsnøkkel. Mister du én, har du fortsatt de andre.</p>` },
  { cat: "enheter", q: "Kan jeg flytte passkeys fra én leverandør til en annen?",
    a: `<p>Dette har lenge vært vanskelig, men er i ferd med å bli mulig. FIDO Alliance har laget en standard for sikker overføring (Credential Exchange), og Apple, Google og flere passordbehandlere har begynt å støtte den. Til nå har løsningen vært å lage en ny passkey hos den nye leverandøren for hver konto.</p>` },
  { cat: "praktisk", q: "Jeg slettet en passkey på nettsiden, men den dukker fortsatt opp. Hvorfor?",
    a: `<p>Å slette passkeyen i kontoinnstillingene på nettsiden fjerner bare låsen hos dem. Selve nøkkelen ligger fortsatt i passordbehandleren eller på enheten din, og vil bli foreslått, men ikke virke. Slett den også der: i appen «Passord» (Apple), Google Passordbehandler, passordbehandleren din eller Windows-innstillingene.</p>` },
  { cat: "windows", q: "Hvor ser jeg passkeyene mine i Windows?",
    a: `<p>Windows 11: <kbd>Innstillinger</kbd> → <kbd>Kontoer</kbd> → <kbd>Passkeys</kbd>. Der ser du passkeys lagret lokalt med Windows Hello og kan slette dem. Passkeys i en passordbehandler eller på telefonen vises i den respektive appen.</p>` },
  { cat: "windows", q: "Synkroniseres Windows Hello-passkeys til de andre PC-ene mine?",
    a: `<p>Tradisjonelt nei. En passkey lagret med Windows Hello ligger i TPM-brikken på den ene PC-en. Microsoft har begynt å rulle ut synkronisering via Microsoft-kontoen og støtte for tredjeparts passordbehandlere direkte i Windows 11, men hvis du vil være sikker på å ha passkeyene overalt, er en passordbehandler eller telefonen det tryggeste valget i dag.</p>` },
  { cat: "windows", q: "Hva skjer med passkeyene hvis jeg nullstiller eller bytter PC?",
    a: `<p>Passkeys som bare er lagret lokalt i Windows Hello forsvinner. Før du nullstiller: sjekk at du kan logge inn på kontoene dine på en annen måte (telefon, passordbehandler eller passord). På den nye PC-en lager du nye passkeys.</p>` },
  { cat: "windows", q: "Trenger jeg kamera eller fingeravtrykkleser for å bruke Windows Hello?",
    a: `<p>Nei. Windows Hello-PIN virker på alle PC-er med Windows 10 eller 11. Kamera med infrarød støtte eller fingeravtrykkleser er bare mer behagelig. Du kan også kjøpe en USB-fingeravtrykkleser.</p>` },
  { cat: "windows", q: "Er ikke en PIN på 4–6 siffer mindre sikker enn et langt passord?",
    a: `<p>Overraskende nok ikke. PIN-en er knyttet til akkurat denne PC-en og TPM-brikken. Den sendes aldri over nettet, og etter noen feil forsøk låser TPM-en seg. En tyv må altså ha PC-en din fysisk <em>og</em> vite PIN-en. Et passord kan derimot brukes av hvem som helst, hvor som helst i verden.</p>` },
  { cat: "sikkerhet", q: "Hva er forskjellen på passkey og tofaktor (2FA) med SMS eller kodeapp?",
    a: `<p>2FA legger et ekstra steg oppå passordet. Det hjelper, men SMS-koder og kodeapp-koder kan fortsatt lures ut av deg på en falsk nettside. En passkey kombinerer to faktorer i ett steg: noe du <em>har</em> (enheten) og noe du <em>er eller vet</em> (biometri/PIN). Den kan ikke phishes. Derfor ber mange tjenester ikke om ekstra kode når du bruker passkey.</p>` },
  { cat: "praktisk", q: "Kan jeg logge inn på en lånt eller offentlig PC med passkey?",
    a: `<p>Ja, med QR-koden: velg «Bruk en telefon» og skann med din egen telefon. Passkeyen blir ikke lagret på den lånte PC-en. Husk å logge ut etterpå, som alltid.</p>` },
  { cat: "praktisk", q: "Kan andre i familien bruke passkeyen min?",
    a: `<p>En passkey er personlig og krever din biometri eller PIN. Noen passordbehandlere (og Apples Passord-app) lar deg dele passkeys med familie i en delt gruppe. Ellers kan hver person lage sin egen passkey hvis tjenesten tillater flere brukere.</p>` },
  { cat: "sikkerhet", q: "Hva om Apple, Google eller passordbehandleren min blir hacket?",
    a: `<p>Synkroniserte passkeys er ende-til-ende-kryptert. Leverandøren har ikke nøklene for å dekryptere dem. Selv om noen fikk tak i den krypterte dataen, kan den ikke brukes uten en av dine opplåste enheter. Ønsker du maksimal kontroll, kan du bruke en fysisk sikkerhetsnøkkel.</p>` },
];

const catLabels = { sikkerhet: "Sikkerhet", tap: "Mistet enhet", enheter: "Enheter", windows: "Windows", praktisk: "Praktisk" };
const faqList = document.getElementById("faqList");
const faqEmpty = document.getElementById("faqEmpty");
const faqSearch = document.getElementById("faqSearch");
let activeCat = "alle";

const stripTags = html => html.replace(/<[^>]+>/g, " ");
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function highlight(html, term) {
  if (!term) return html;
  const re = new RegExp(`(${escapeRe(term)})`, "gi");
  // marker bare tekst, ikke inni HTML-tagger
  return html.split(/(<[^>]+>)/).map(part => part.startsWith("<") ? part : part.replace(re, "<mark>$1</mark>")).join("");
}

function renderFaq() {
  const term = faqSearch.value.trim();
  const lc = term.toLowerCase();
  const items = faq.filter(f =>
    (activeCat === "alle" || f.cat === activeCat) &&
    (!lc || (f.q + " " + stripTags(f.a)).toLowerCase().includes(lc))
  );
  faqList.innerHTML = items.map(f => `
    <details${lc ? " open" : ""}>
      <summary>${highlight(f.q, term)}</summary>
      <div class="answer">${highlight(f.a, term)}<p class="muted"><small>${catLabels[f.cat]}</small></p></div>
    </details>`).join("");
  faqEmpty.hidden = items.length > 0;
}

faqSearch.addEventListener("input", renderFaq);
document.querySelectorAll("#faqChips .chip").forEach(chip => {
  chip.addEventListener("click", () => {
    activeCat = chip.dataset.cat;
    document.querySelectorAll("#faqChips .chip").forEach(c => c.classList.toggle("active", c === chip));
    renderFaq();
  });
});
renderFaq();

// ---------- Aktiv lenke i menyen ----------
const navLinks = document.querySelectorAll(".nav a");
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach(s => observer.observe(s));
