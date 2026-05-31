// node docs/generate-pptx.js
const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

const W = 13.33;

const RED    = 'DD0031';
const WHITE  = 'FFFFFF';
const DARK   = '1E1E1E';
const LGRAY  = 'F4F4F4';
const MGRAY  = 'C8C8C8';
const PINK   = 'FFB3C0';
const CODE   = '1E1E1E';
const CODETX = 'D4D4D4';
const AMBER  = 'FFF3CD';
const AMBERBORDER = 'FFC107';

// ── helpers ─────────────────────────────────────────────

function sectionSlide(num, title) {
  const s = pptx.addSlide();
  s.background = { color: RED };
  if (num) {
    s.addText(`Exercice ${num}`, {
      x: 0.5, y: 1.8, w: W - 1, h: 0.7,
      fontSize: 18, color: PINK, align: 'center',
    });
  }
  s.addText(title, {
    x: 0.5, y: 2.5, w: W - 1, h: 1.8,
    fontSize: 40, bold: true, color: WHITE, align: 'center', valign: 'middle',
  });
  return s;
}

function contentSlide(title, barColor) {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  s.addText(title, {
    x: 0, y: 0, w: W, h: 1.1,
    fill: { color: barColor || RED },
    color: WHITE, bold: true, fontSize: 22,
    valign: 'middle', margin: 0.2,
  });
  return s;
}

function fileTag(s, files, y) {
  const text = Array.isArray(files) ? files.join('   ·   ') : files;
  s.addText('📁  ' + text, {
    x: 0.4, y: y || 1.2, w: W - 0.8, h: 0.42,
    fill: { color: LGRAY },
    color: '333333', fontSize: 11, fontFace: 'Courier New',
    valign: 'middle', margin: 0.08,
    line: { color: MGRAY, pt: 0.5 },
  });
}

function taskBox(s, text, y, h) {
  s.addText(text, {
    x: 0.4, y: y || 1.7, w: W - 0.8, h: h || 0.55,
    fill: { color: AMBER },
    color: '333333', fontSize: 13, bold: false,
    valign: 'middle', margin: 0.1,
    line: { color: AMBERBORDER, pt: 1 },
  });
}

function codeBlock(s, text, x, y, w, h) {
  s.addText(text, {
    x: x !== undefined ? x : 0.4,
    y: y !== undefined ? y : 1.3,
    w: w || 12.5, h: h || 1.5,
    fill: { color: CODE }, color: CODETX,
    fontFace: 'Courier New', fontSize: 11,
    valign: 'top', margin: 0.1,
  });
}

function table(s, rows, x, y, w, colW) {
  const data = rows.map((row, ri) =>
    row.map(cell => ({
      text: cell || '',
      options: {
        fontSize: 12, valign: 'middle',
        color:   ri === 0 ? WHITE : DARK,
        bold:    ri === 0,
        fill:    ri === 0 ? RED : (ri % 2 === 1 ? WHITE : LGRAY),
        margin: [3, 5, 3, 5],
      },
    }))
  );
  s.addTable(data, {
    x: x !== undefined ? x : 0.4,
    y: y !== undefined ? y : 1.3,
    w: w || 12.5, colW,
    rowH: 0.42,
    border: { pt: 0.5, color: MGRAY },
  });
}

// ── Slide 1 — Cover ──────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: RED };
  s.addText('Angular Signals', {
    x: 0.5, y: 1.5, w: W - 1, h: 2,
    fontSize: 52, bold: true, color: WHITE, align: 'center', valign: 'bottom',
  });
  s.addText('Support de dojo', {
    x: 0.5, y: 3.8, w: W - 1, h: 0.8,
    fontSize: 22, color: PINK, align: 'center',
  });
  s.addText('Zone.js · Signals · RxJS interop', {
    x: 0.5, y: 5.5, w: W - 1, h: 0.6,
    fontSize: 14, color: PINK, align: 'center',
  });
}

// ── Slide 2 — Le problème ────────────────────────────────
{
  const s = contentSlide('Le problème que Signals résout');
  table(s,
    [
      ['', 'Zone.js seul', 'Signals + OnPush', 'Signals + Zoneless'],
      ['Détection', 'Scan de TOUS les composants après chaque async', 'Seuls les composants dirty', 'Seuls les lecteurs du signal'],
      ['Déclencheur', 'setTimeout / Promise / fetch (patché)', '.set() ou Zone.js encore présent', '.set() uniquement'],
      ['Déclaration', 'Rien — Zone.js devine', 'signal() à déclarer', 'signal() à déclarer'],
    ],
    0.4, 1.3, 12.5, [2.2, 3.4, 3.4, 3.5]
  );
  s.addText('RxJS résout un problème différent : coordonner des flux asynchrones (HTTP, WebSocket, combineLatest…)', {
    x: 0.4, y: 5.4, w: 12.5, h: 0.6,
    fontSize: 13, color: '555555', italic: true,
  });
}

// ── Slide 3 — Intention d'architecture ───────────────────
{
  const s = contentSlide('Intention d\'architecture du dojo');
  s.addText('Le projet montre volontairement deux patterns Signals.', {
    x: 0.4, y: 1.25, w: 12.5, h: 0.45,
    fontSize: 15, color: DARK, bold: true,
  });
  table(s,
    [
      ['Pattern', 'Objectif pédagogique', 'Exemples'],
      ['Signals dans le composant', 'Comprendre signal(), computed(), effect() sur un état local', 'ClientsComponent, DashboardComponent'],
      ['Signals dans une facade', 'Partager l\'état, encapsuler les règles métier, exposer asReadonly()', 'AccountsFacade, MovementsFacade'],
    ],
    0.4, 2.0, 12.5, [3.0, 5.5, 4.0]
  );
  s.addText('L\'asymétrie est intentionnelle : on commence simple dans un composant, puis on extrait vers une facade quand l\'état devient plus riche ou partagé.', {
    x: 0.4, y: 5.0, w: 12.5, h: 0.8,
    fontSize: 13, color: '333333',
    fill: { color: AMBER }, margin: 0.1,
    line: { color: AMBERBORDER, pt: 1 },
  });
}

// ── Slide 4 — Zone.js section ────────────────────────────
sectionSlide(null, 'Zone.js');

// ── Slide 4 — Ce que fait Zone.js ────────────────────────
{
  const s = contentSlide('Zone.js — Ce qu\'il fait');
  s.addText([
    { text: 'Remplace silencieusement les APIs async au démarrage : ', options: { bold: true } },
    { text: 'setTimeout · Promise · fetch · addEventListener · XMLHttpRequest', options: {} },
  ], { x: 0.4, y: 1.3, w: 12.5, h: 0.55, fontSize: 14, color: DARK });
  s.addText('Quand un callback async se termine → Angular lance un cycle de détection sur TOUS les composants', {
    x: 0.4, y: 1.9, w: 12.5, h: 0.5, fontSize: 14, color: DARK,
  });
  codeBlock(s,
    `// Zone.js seul — re-rend TOUT le composant\nsetTimeout(() => { this.name = 'Alice'; }, 1000);\n\n` +
    `// Signals + Zone.js (ce projet, OnPush) — Zone déclenche le cycle, seuls les lecteurs de name() sont mis à jour\nsetTimeout(() => { this.name.set('Alice'); }, 1000);\n\n` +
    `// Signals + Zoneless — setTimeout non patché, seul .set() déclenche\nsetTimeout(() => { this.name.set('Alice'); }, 1000);`,
    0.4, 2.55, 12.5, 3.2
  );
}

// ── Slide 5 — OnPush ─────────────────────────────────────
{
  const s = contentSlide('OnPush — Déclencheurs de re-render');
  s.addText('@Component({ changeDetection: ChangeDetectionStrategy.OnPush })', {
    x: 0.4, y: 1.25, w: 12.5, h: 0.45,
    fontFace: 'Courier New', fontSize: 12,
    fill: { color: CODE }, color: CODETX, margin: 0.08,
  });
  table(s,
    [
      ['Déclencheur', 'Re-render ?'],
      ['Un input() signal reçoit une nouvelle valeur', 'Oui ✓'],
      ['Un @Input() reçoit une nouvelle référence', 'Oui ✓'],
      ['Un async pipe émet une valeur', 'Oui ✓'],
      ['cdr.markForCheck() appelé manuellement', 'Oui ✓'],
      ['Une propriété de classe classique change', 'Non ✗'],
      ['Un @Input() ou input() reçoit le même objet muté', 'Non ✗'],
    ],
    0.4, 1.8, 12.5, [9.5, 3.0]
  );
  s.addText('OnPush ne supprime pas Zone.js — il saute juste ce composant s\'il n\'est pas dirty', {
    x: 0.4, y: 6.4, w: 12.5, h: 0.45,
    fontSize: 12, color: '888888', italic: true,
  });
}

// ── Slide 6 — Zoneless ───────────────────────────────────
{
  const s = contentSlide('Mode Zoneless — Angular 18+');
  codeBlock(s,
    `// app.config.ts\n// Avant  : provideZoneChangeDetection({ eventCoalescing: true })\n// Après  : provideZonelessChangeDetection()\n\n` +
    `// angular.json\n// Avant  : "polyfills": ["zone.js"]\n// Après  : "polyfills": []`,
    0.4, 1.3, 12.5, 2.8
  );
  s.addText('État actuel du projet : Zone.js encore présent. Tous les composants sont déjà en OnPush + Signals.\nLe mode Zoneless est la prochaine étape possible.', {
    x: 0.4, y: 4.25, w: 12.5, h: 0.9,
    fontSize: 13, color: '333333',
    fill: { color: AMBER }, margin: 0.1,
    line: { color: AMBERBORDER, pt: 1 },
  });
}

// ── Slide 7 — signal() section ───────────────────────────
sectionSlide(1, 'signal()');

// ── Slide 8 — signal() consigne ──────────────────────────
{
  const s = contentSlide('Exercice 1 — signal() : consigne');
  fileTag(s, 'src/app/features/clients/pages/clients/clients.component.ts', 1.2);
  taskBox(s, 'Convertir la propriété adding = false en signal, mettre à jour startAdd(), cancelAdd(), saveAdd() et le template.', 1.7, 0.65);
  codeBlock(s,
    `// Avant\nadding = false;\nstartAdd(): void  { this.adding = true; }\ncancelAdd(): void { this.adding = false; }\n\n` +
    `// Après\nreadonly adding = signal(false);\nstartAdd(): void  { this.adding.set(true); }\ncancelAdd(): void { this.adding.set(false); }\n\n` +
    `// Template : @if (!adding) → @if (!adding())`,
    0.4, 2.45, 12.5, 3.5
  );
  s.addText('npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts', {
    x: 0.4, y: 6.1, w: 12.5, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: '555555',
    fill: { color: LGRAY }, margin: 0.06,
  });
}

// ── Slide 9 — signal() comparaisons ──────────────────────
{
  const s = contentSlide('signal() — Comparaisons & quand utiliser');
  table(s,
    [
      ['Zone.js + propriété classique', 'signal()'],
      ['Re-rend tout le composant à chaque cycle', 'Re-rend seulement les lecteurs du signal'],
      ['Détection après chaque async', 'Détection déclenchée par .set()'],
    ],
    0.4, 1.3, 6.1, [3.0, 3.0]
  );
  table(s,
    [
      ['BehaviorSubject', 'signal()'],
      ['.subscribe() ou async pipe', 'Lecture directe avec ()'],
      ['Désabonnement à gérer hors async pipe', 'Pas de désabonnement'],
      ['Adapté aux flux async', 'Adapté à l\'état UI synchrone'],
    ],
    6.6, 1.3, 6.3, [3.15, 3.15]
  );
  table(s,
    [
      ['Situation', 'Outil'],
      ['État UI local : booléen, texte, page courante', 'signal()'],
      ['Valeur calculée à partir d\'autres signals', 'computed() — pas signal()'],
      ['Valeur émise par un Observable HTTP / route', 'toSignal()'],
    ],
    0.4, 4.2, 12.5, [7.0, 5.5]
  );
}

// ── Slide 10 — computed() section ────────────────────────
sectionSlide(2, 'computed()');

// ── Slide 11 — computed() consigne ───────────────────────
{
  const s = contentSlide('Exercice 2 — computed() : consigne');
  fileTag(s, [
    'accounts.facade.ts',
    'accounts.component.ts',
    'accounts.component.html',
  ], 1.2);
  taskBox(s, 'Transformer le getter blockedAccountsCount en computed() dans la facade, relayer le signal dans le composant, ajouter () dans le template.', 1.7, 0.65);
  codeBlock(s,
    `// accounts.facade.ts — AVANT\nget blockedAccountsCount(): number {\n  return this.filteredAccounts().filter(a => a.status === 'blocked').length;\n}\n\n` +
    `// accounts.facade.ts — APRÈS\nreadonly blockedAccountsCount = computed(() =>\n  this.filteredAccounts().filter(a => a.status === 'blocked').length\n);\n\n` +
    `// AccountsComponent : get blockedAccountsCount() { ... }  →  readonly blockedAccountsCount = this.accountsFacade.blockedAccountsCount;\n` +
    `// Template : {{ blockedAccountsCount }}  →  {{ blockedAccountsCount() }}`,
    0.4, 2.45, 12.5, 3.5
  );
  s.addText('npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts', {
    x: 0.4, y: 6.1, w: 12.5, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: '555555',
    fill: { color: LGRAY }, margin: 0.06,
  });
}

// ── Slide 12 — computed() comparaisons ───────────────────
{
  const s = contentSlide('computed() — Comparaisons & quand utiliser');
  table(s,
    [
      ['Getter + Zone.js', 'computed()'],
      ['Recalculé à chaque cycle', 'Recalculé si une dépendance change'],
      ['Règle dans le composant', 'Règle dans la facade, partageable'],
    ],
    0.4, 1.3, 6.1, [3.0, 3.0]
  );
  table(s,
    [
      ['combineLatest + map', 'computed()'],
      ['Observable qui émet', 'Valeur synchrone mémorisée'],
      ['async pipe requis', 'Lecture directe avec ()'],
    ],
    6.6, 1.3, 6.3, [3.15, 3.15]
  );
  table(s,
    [
      ['Situation', 'Outil'],
      ['Total, compteur, libellé dérivé de signals', 'computed()'],
      ['Règle dépendant du temps (debounce, delay)', 'pipe RxJS'],
      ['Effet de bord (HTTP, log, focus)', 'effect() — pas computed()'],
    ],
    0.4, 4.0, 12.5, [7.0, 5.5]
  );
}

// ── Slide 13 — input() section ────────────────────────────
sectionSlide(3, 'input()');

// ── Slide 14 — input() consigne ──────────────────────────
{
  const s = contentSlide('Exercice 3 — input() : consigne');
  fileTag(s, 'src/app/features/accounts/components/account-card/account-card.component.ts', 1.2);
  taskBox(s, 'Transformer @Input() showStatus = true en showStatus = input(true). Retirer Input des imports. Ajouter () lors de la lecture dans le computed.', 1.7, 0.65);
  codeBlock(s,
    `// AVANT\n@Input() showStatus = true;\nreadonly visibleStatusLabel = computed(() => this.showStatus ? this.statusLabel() : null);\n\n` +
    `// APRÈS\nshowStatus = input(true);\nreadonly visibleStatusLabel = computed(() => this.showStatus() ? this.statusLabel() : null);\n\n` +
    `// Point clé : @Input() dans computed() = pas de dépendance réelle\n//              input()   dans computed() = dépendance réelle → invalidation automatique`,
    0.4, 2.45, 12.5, 3.5
  );
  s.addText('npm test -- --runTestsByPath src/app/features/accounts/components/account-card/account-card.component.spec.ts', {
    x: 0.4, y: 6.1, w: 12.5, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: '555555',
    fill: { color: LGRAY }, margin: 0.06,
  });
}

// ── Slide 15 — input() comparaisons ──────────────────────
{
  const s = contentSlide('input() — Comparaisons & quand utiliser');
  table(s,
    [
      ['@Input() classique', 'input()'],
      ['Lu dans computed() sans dépendance', 'Lu dans computed() → dépendance réelle'],
      ['Zone.js déclenche après chaque cycle', 'Re-render si la valeur change'],
    ],
    0.4, 1.3, 12.5, [6.25, 6.25]
  );
  table(s,
    [
      ['Situation', 'Outil'],
      ['Entrée lue dans un computed() ou effect()', 'input()'],
      ['Entrée requise sans valeur par défaut', 'input.required<T>()'],
      ['Valeur bidirectionnelle parent ↔ enfant', 'model() — Angular 17.2+'],
    ],
    0.4, 4.0, 12.5, [7.0, 5.5]
  );
}

// ── Slide 16 — output() section ──────────────────────────
sectionSlide(4, 'output()');

// ── Slide 17 — output() consigne ─────────────────────────
{
  const s = contentSlide('Exercice 4 — output() : consigne');
  fileTag(s, 'src/app/features/accounts/components/account-list/account-list.component.ts', 1.2);
  taskBox(s, 'Transformer @Output() selectedRequested = new EventEmitter<Account>() en output(). Retirer EventEmitter et Output des imports.', 1.7, 0.65);
  codeBlock(s,
    `// AVANT\n@Output() selectedRequested = new EventEmitter<Account>();\n\n` +
    `// APRÈS\nselectedRequested = output<Account>();\n\n` +
    `// L'émission dans l'effect() reste identique :\nthis.selectedRequested.emit(account);\n\n` +
    `// Principe : l'enfant émet une INTENTION → le parent exécute l'ACTION`,
    0.4, 2.45, 12.5, 3.5
  );
  s.addText('npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts', {
    x: 0.4, y: 6.1, w: 12.5, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: '555555',
    fill: { color: LGRAY }, margin: 0.06,
  });
}

// ── Slide 18 — output() comparaisons ─────────────────────
{
  const s = contentSlide('output() — Comparaisons & quand utiliser');
  table(s,
    [
      ['@Output() + EventEmitter', 'output()'],
      ['Hérite de Subject RxJS', 'Pas d\'Observable interne'],
      ['Souvent détourné comme flux RxJS', 'Contrat pensé pour le parent direct'],
    ],
    0.4, 1.3, 12.5, [6.25, 6.25]
  );
  table(s,
    [
      ['Situation', 'Outil'],
      ['Événement vers le parent direct', 'output()'],
      ['Événement global ou cross-composant', 'Subject dans un service'],
      ['Flux avec opérateurs (debounce, merge…)', 'Subject dans le composant'],
    ],
    0.4, 4.0, 12.5, [7.0, 5.5]
  );
}

// ── Slide 19 — toSignal section ──────────────────────────
sectionSlide(5, 'toSignal() + toObservable()');

// ── Slide 20 — toSignal consigne ─────────────────────────
{
  const s = contentSlide('Exercice 5 — toSignal() : consigne (parties 1 & 2)');
  fileTag(s, [
    'accounts/pages/accounts/accounts.component.ts  [partie 1]',
    'clients/pages/dashboard/dashboard.component.ts  [partie 2]',
  ], 1.2);
  taskBox(s,
    'Partie 1 : remplacer la souscription manuelle à paramMap par toSignal() + déplacer le chargement dans un effect().\n' +
    'Partie 2 : remplacer firstValueFrom() + états manuels par toSignal() + pipe(map, catchError, startWith).\n' +
    'Partie 3 : lire debouncedSearch$ dans clients.component.ts (démo — pas de modification).',
    1.7, 0.9);
  codeBlock(s,
    `// Partie 1 — APRÈS (accounts.component.ts)\nreadonly clientId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))), { initialValue: null });\nconstructor() { effect(() => { this.accountsFacade.load(this.clientId()); }); }\n\n` +
    `// Partie 2 — APRÈS (dashboard.component.ts)\nprivate readonly clientsQuery = toSignal(\n  this.clientsApi.getAll().pipe(\n    map(clients => ({ clients, loading: false, error: null })),\n    catchError(err => of({ clients: [], loading: false, error: err.message })),\n    startWith({ clients: [], loading: true, error: null })\n  ), { initialValue: { clients: [], loading: true, error: null } }\n);`,
    0.4, 2.7, 12.5, 3.2
  );
  s.addText('npm test -- --runTestsByPath …/accounts.component.spec.ts    &    …/dashboard.component.spec.ts', {
    x: 0.4, y: 6.05, w: 12.5, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: '555555',
    fill: { color: LGRAY }, margin: 0.06,
  });
}

// ── Slide 21 — toSignal comparaisons ─────────────────────
{
  const s = contentSlide('toSignal() — Comparaisons & quand utiliser');
  table(s,
    [
      ['Observable + .subscribe()', 'toSignal()'],
      ['takeUntilDestroyed requis', 'Abonnement géré automatiquement'],
      ['Copie manuelle dans un signal', 'toSignal() crée et alimente le signal'],
    ],
    0.4, 1.3, 12.5, [6.25, 6.25]
  );
  table(s,
    [
      ['Situation', 'Outil'],
      ['paramMap / queryParamMap dans un composant signal', 'toSignal()'],
      ['Observable HTTP one-shot', 'toSignal() + pipe(map, catchError, startWith)'],
      ['Debounce, distinctUntilChanged sur un signal', 'toObservable() + pipe()'],
      ['Flux continu (WebSocket, polling)', 'RxJS pur'],
      ['Requête POST / PUT / DELETE', 'firstValueFrom() dans une méthode async'],
    ],
    0.4, 3.9, 12.5, [7.0, 5.5]
  );
}

// ── Slide 22 — effect() section ──────────────────────────
sectionSlide(6, 'effect() + viewChild()');

// ── Slide 23 — effect() consigne ─────────────────────────
{
  const s = contentSlide('Exercice 6 — effect() + viewChild() : consigne');
  fileTag(s, 'src/app/features/clients/pages/clients/clients.component.ts', 1.2);
  taskBox(s,
    'Partie 1 : ajouter un effect() de clamping dans le constructeur, supprimer this.clampCurrentPage() dans deleteClient() et supprimer la méthode.\n' +
    'Partie 2 : conditionner le focus sur adding() dans l\'effet viewChild existant.',
    1.7, 0.9);
  codeBlock(s,
    `// Partie 1 — Ajouter dans le constructeur\neffect(() => {\n  const clamped = this.pageSlice().page;\n  if (clamped !== this.page()) this.page.set(clamped);\n});\n// → supprimer this.clampCurrentPage() dans deleteClient() + supprimer la méthode\n\n` +
    `// Partie 2 — viewChild conditionné\n// Avant  : effect(() => { this.firstNameInput()?.nativeElement.focus(); });\n// Après  : effect(() => { if (this.adding()) this.firstNameInput()?.nativeElement.focus(); });`,
    0.4, 2.7, 12.5, 3.2
  );
  s.addText('npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts', {
    x: 0.4, y: 6.05, w: 12.5, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: '555555',
    fill: { color: LGRAY }, margin: 0.06,
  });
}

// ── Slide 24 — effect() comparaisons ─────────────────────
{
  const s = contentSlide('effect() — Comparaisons & quand utiliser');
  table(s,
    [
      ['Appel impératif après mutation', 'effect()'],
      ['On doit penser à appeler la méthode', 'Déclenché automatiquement'],
      ['Bug si on oublie l\'appel', 'Moins de risque — l\'effet observe les dépendances'],
    ],
    0.4, 1.3, 12.5, [6.25, 6.25]
  );
  table(s,
    [
      ['Situation', 'Outil'],
      ['Titre, focus, scroll après changement d\'état', 'effect()'],
      ['Correction d\'état cohérent (clamping, reset)', 'effect()'],
      ['Valeur calculée à partir de signals', 'computed() — pas effect()'],
      ['Effet déclenché par un Observable', 'tap() RxJS dans le pipe'],
    ],
    0.4, 4.0, 12.5, [7.0, 5.5]
  );
}

// ── Slide 25 — Exercice 7 section ────────────────────────
sectionSlide(7, 'Refactoring facade');

// ── Slide 26 — Exercice 7 consigne ───────────────────────
{
  const s = contentSlide('Exercice 7 — Refactoring facade : consigne');
  fileTag(s, [
    'accounts/services/accounts.facade.ts',
    'accounts/pages/accounts/accounts.component.ts',
    'accounts/pages/accounts/accounts.component.html',
  ], 1.2);
  taskBox(s, 'Ajouter hasActiveFilter comme computed() dans la facade, l\'exposer dans le composant et l\'utiliser dans le template pour personnaliser le message vide.', 1.7, 0.65);
  codeBlock(s,
    `// accounts.facade.ts — ajouter après typeFilter\nreadonly hasActiveFilter = computed(() =>\n  this.search().trim().length > 0 || this.typeFilter() !== 'all'\n);\n\n` +
    `// AccountsComponent\nreadonly hasActiveFilter = this.accountsFacade.hasActiveFilter;\n\n` +
    `// accounts.component.html\n{{ hasActiveFilter() ? 'Aucun compte ne correspond aux filtres.' : 'Aucun compte trouvé.' }}`,
    0.4, 2.45, 12.5, 3.5
  );
  s.addText('npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts', {
    x: 0.4, y: 6.1, w: 12.5, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: '555555',
    fill: { color: LGRAY }, margin: 0.06,
  });
}

// ── Slide 27 — Récapitulatif ──────────────────────────────
{
  const s = contentSlide('Récapitulatif — Signal ou RxJS ?');
  table(s,
    [
      ['Utiliser Signals', 'Utiliser RxJS'],
      ['État UI local synchrone', 'Flux impliquant le temps (debounceTime, delay…)'],
      ['Valeur dérivée d\'autres états locaux', 'Combinaison de sources (combineLatest, merge)'],
      ['Entrée / sortie de composant réactive', 'Source continue (WebSocket, polling)'],
      ['Effet de bord sur un état signal', 'Commande async (POST, PUT, DELETE)'],
      ['Consommer un Observable dans un composant', 'Multicasting (shareReplay, share)'],
    ],
    0.4, 1.3, 12.5, [6.25, 6.25]
  );
  s.addText('Zone d\'intersection : Signal → toObservable() → pipe(operators) → toSignal()', {
    x: 0.4, y: 5.8, w: 12.5, h: 0.55,
    fontSize: 13, color: '333333', italic: true,
    fill: { color: LGRAY }, margin: 0.1,
  });
}

// ── Slide 28 — 7 règles ───────────────────────────────────
{
  const s = contentSlide('7 règles à retenir');
  const rules = [
    '1.  computed()   →  calcul pur uniquement — jamais d\'appel HTTP',
    '2.  effect()     →  effets de bord uniquement — n\'expose jamais de valeur',
    '3.  L\'enfant émet une INTENTION, le parent exécute l\'ACTION',
    '4.  Ne pas bridger signal ↔ RxJS systématiquement — rester dans un seul monde',
    '5.  Zone.js peut coexister — migrer progressivement, pas tout d\'un coup',
    '6.  input() dans computed() = dépendance réelle   /   @Input() = non',
    '7.  toSignal() gère le désabonnement — ne pas ajouter takeUntilDestroyed',
  ];
  const parts = rules.map(r => ({
    text: r,
    options: { fontSize: 15, color: DARK, bullet: false, paraSpaceBefore: 6, paraSpaceAfter: 6 },
  }));
  s.addText(parts, { x: 0.4, y: 1.3, w: 12.5, h: 5.8, valign: 'top' });
}

// ── Write file ────────────────────────────────────────────
pptx.writeFile({ fileName: 'docs/dojo-signals.pptx' })
  .then(() => console.log('PPTX généré : docs/dojo-signals.pptx'))
  .catch(err => console.error('Erreur :', err));
