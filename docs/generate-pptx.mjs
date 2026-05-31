import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';

const C = {
  rouge:    'DD0031',
  gris:     '1A1A2E',
  blanc:    'FFFFFF',
  clair:    'F4F4F4',
  vert:     '4CAF50',
  jaune:    'FFC107',
  bleu:     '2196F3',
  texte:    '333333',
  code:     '1E1E2E',
  codeText: 'CDD6F4',
};
const FONT = 'Calibri';

function slideTitre(titre, sous) {
  const s = pptx.addSlide();
  s.background = { color: C.gris };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.18, fill: { color: C.rouge } });
  s.addText(titre, { x: 0.5, y: 1.8, w: 12.33, h: 1.2, fontSize: 40, bold: true, color: C.blanc, fontFace: FONT, align: 'center' });
  if (sous) s.addText(sous, { x: 0.5, y: 3.2, w: 12.33, h: 0.6, fontSize: 20, color: C.rouge, fontFace: FONT, align: 'center' });
}

function slideSection(temps, titre, couleur = C.rouge) {
  const s = pptx.addSlide();
  s.background = { color: C.gris };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.18, fill: { color: couleur } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.5, w: 13.33, h: 1.6, fill: { color: couleur } });
  s.addText(temps, { x: 0.5, y: 2.55, w: 12.33, h: 0.5, fontSize: 14, color: C.blanc, fontFace: FONT, align: 'center' });
  s.addText(titre, { x: 0.5, y: 3.0, w: 12.33, h: 0.9, fontSize: 32, bold: true, color: C.blanc, fontFace: FONT, align: 'center' });
}

function bullets(items) {
  return items.map(b => ({
    text: typeof b === 'string' ? b : b.text,
    options: {
      bullet: typeof b === 'object' && b.sub ? { indent: 20 } : true,
      fontSize: typeof b === 'object' && b.sub ? 14 : 16,
      color: C.texte, fontFace: FONT, breakLine: true,
    },
  }));
}

function slideContenu(titre, items) {
  const s = pptx.addSlide();
  s.background = { color: C.clair };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.7, fill: { color: C.rouge } });
  s.addText(titre, { x: 0.3, y: 0.1, w: 12.73, h: 0.5, fontSize: 18, bold: true, color: C.blanc, fontFace: FONT });
  s.addText(bullets(items), { x: 0.5, y: 0.9, w: 12.33, h: 5.5, valign: 'top' });
}

function slideAvantApres(titre, avant, apres, cmd) {
  const s = pptx.addSlide();
  s.background = { color: C.clair };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.7, fill: { color: C.rouge } });
  s.addText(titre, { x: 0.3, y: 0.1, w: 12.73, h: 0.5, fontSize: 18, bold: true, color: C.blanc, fontFace: FONT });
  const h = cmd ? 3.5 : 4.2;
  s.addText('AVANT', { x: 0.3, y: 0.85, w: 6, h: 0.35, fontSize: 13, bold: true, color: C.rouge, fontFace: FONT });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.2, w: 5.9, h, fill: { color: C.code } });
  s.addText(avant, { x: 0.4, y: 1.25, w: 5.7, h: h - 0.2, fontSize: 11, color: C.codeText, fontFace: 'Courier New', valign: 'top' });
  s.addText('APRÈS', { x: 7.0, y: 0.85, w: 6, h: 0.35, fontSize: 13, bold: true, color: C.vert, fontFace: FONT });
  s.addShape(pptx.ShapeType.rect, { x: 7.0, y: 1.2, w: 6.0, h, fill: { color: C.code } });
  s.addText(apres, { x: 7.1, y: 1.25, w: 5.8, h: h - 0.2, fontSize: 11, color: C.codeText, fontFace: 'Courier New', valign: 'top' });
  if (cmd) {
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 4.85, w: 12.7, h: 0.45, fill: { color: C.gris } });
    s.addText('$ ' + cmd, { x: 0.5, y: 4.88, w: 12.3, h: 0.4, fontSize: 12, color: C.jaune, fontFace: 'Courier New' });
  }
}

function slideCode(titre, code, noteItems) {
  const s = pptx.addSlide();
  s.background = { color: C.clair };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.7, fill: { color: C.rouge } });
  s.addText(titre, { x: 0.3, y: 0.1, w: 12.73, h: 0.5, fontSize: 18, bold: true, color: C.blanc, fontFace: FONT });
  const h = noteItems ? 3.8 : 4.8;
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.9, w: 12.7, h, fill: { color: C.code } });
  s.addText(code, { x: 0.4, y: 0.95, w: 12.5, h: h - 0.15, fontSize: 12, color: C.codeText, fontFace: 'Courier New', valign: 'top' });
  if (noteItems) {
    s.addText(noteItems.map(n => ({ text: n, options: { bullet: true, fontSize: 13, color: C.texte, fontFace: FONT, breakLine: true } })),
      { x: 0.3, y: 4.85, w: 12.7, h: 1.5, valign: 'top' });
  }
}

// ── TITRE ────────────────────────────────────────────────────────────────────
slideTitre('Dojo Angular Signals', '4 heures · domaine bancaire clients / comptes');

// ── AGENDA ───────────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: C.clair };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.7, fill: { color: C.rouge } });
  s.addText('Déroulement', { x: 0.3, y: 0.1, w: 12.73, h: 0.5, fontSize: 18, bold: true, color: C.blanc, fontFace: FONT });
  s.addTable([
    [{ text: 'Temps', options: { bold: true } }, { text: 'Sujet', options: { bold: true } }, { text: 'Concept clé', options: { bold: true } }],
    ['0:00 – 0:15', 'Lecture de l\'app', '—'],
    ['0:15 – 0:45', 'Exercice 1', 'signal()'],
    ['0:45 – 1:15', 'Exercice 2', 'computed()'],
    ['1:15 – 1:45', 'Exercice 3', 'input()'],
    ['1:45 – 2:15', 'Exercice 4', 'output()'],
    ['2:15 – 3:00', 'Exercice 5', 'toSignal() + toObservable()'],
    ['3:00 – 3:30', 'Exercice 6', 'effect() + viewChild()'],
    ['3:30 – 3:50', 'Exercice 7', 'Refactoring façade'],
    ['3:50 – 4:00', 'Debrief', 'linkedSignal · resource()'],
  ], { x: 0.3, y: 0.85, w: 12.7, fontSize: 14, fontFace: FONT, border: { color: 'CCCCCC' }, fill: { color: C.blanc }, colW: [2.2, 5.5, 5.0], rowH: 0.52 });
}

// ── CONTRAINTES ───────────────────────────────────────────────────────────────
slideContenu('Contraintes du dojo', [
  'Pas de composant abstrait créé uniquement pour montrer les Signals',
  'Chaque exercice reste dans le domaine clients / comptes',
  'Chaque changement est testable avec Jest ou vérifiable à l\'écran',
  'Chaque exercice part d\'un exemple déjà présent dans le projet',
]);

// ── 0:00 LECTURE ─────────────────────────────────────────────────────────────
slideSection('0:00 – 0:15', 'Lecture fonctionnelle de l\'app');
slideContenu('Lecture de l\'app', [
  'Identifier les flux sans toucher au code',
  { text: 'ClientsComponent → liste, recherche, pagination, ajout', sub: true },
  { text: 'AccountsFacade → état partagé des comptes', sub: true },
  { text: 'AccountListComponent / AccountCardComponent', sub: true },
  'Repérer les exemples déjà présents',
  { text: 'signal(), computed(), input(), output(), toSignal(), effect()', sub: true },
  '',
  '$ npm test  →  85 tests verts sur la branche init',
]);

slideContenu('Architecture du projet — asymétrie intentionnelle', [
  'Feature accounts — pattern complet (modèle à suivre) :',
  { text: 'AccountsApiService  →  accès HTTP uniquement', sub: true },
  { text: 'AccountsFacade  →  état + logique métier (signals, computed, CRUD)', sub: true },
  { text: 'AccountsComponent  →  délègue tout à la facade (~40 lignes)', sub: true },
  '',
  'Feature clients — pattern intentionnellement incomplet (terrain des exercices 1–6) :',
  { text: 'ClientsApiService  →  accès HTTP uniquement', sub: true },
  { text: 'ClientsComponent  →  gère son propre état avec des signals locaux', sub: true },
  { text: 'DashboardComponent  →  idem, appelle l\'API directement', sub: true },
  '',
  'Progression pédagogique : signals dans le composant (exercices 1–6) → signals dans une facade (exercice 7)',
  { text: 'Ne pas chercher à "corriger" l\'asymétrie — elle est le support des exercices', sub: true },
]);

// ── EX.1 signal() ─────────────────────────────────────────────────────────────
slideSection('0:15 – 0:45', 'Exercice 1 — signal()');

// Rappel : recalcul de template SANS signal
{
  const s = pptx.addSlide();
  s.background = { color: C.clair };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.7, fill: { color: C.rouge } });
  s.addText('Rappel — comment Angular recalcule le template sans Signal', {
    x: 0.3, y: 0.1, w: 12.73, h: 0.5, fontSize: 18, bold: true, color: C.blanc, fontFace: FONT,
  });

  // Colonne gauche : sans signal
  s.addText('Sans Signal — Zone.js', { x: 0.3, y: 0.85, w: 5.8, h: 0.4, fontSize: 14, bold: true, color: C.rouge, fontFace: FONT });
  s.addText(bullets([
    'Zone.js intercepte tous les événements async (click, HTTP, setTimeout…)',
    'À chaque événement → Angular parcourt TOUS les composants depuis la racine',
    'Avec OnPush : vérifie seulement si une @Input() référence a changé',
    'Un champ ordinaire (adding = false) ne notifie rien → Angular peut rater le changement',
    'Risque : template non mis à jour, appel manuel à markForCheck() nécessaire',
  ]), { x: 0.3, y: 1.3, w: 5.9, h: 4.5, valign: 'top' });

  // Séparateur
  s.addShape(pptx.ShapeType.line, { x: 6.5, y: 0.85, w: 0, h: 5.0, line: { color: 'CCCCCC', width: 1 } });

  // Colonne droite : avec signal
  s.addText('Avec Signal — Réactivité fine', { x: 6.7, y: 0.85, w: 6.3, h: 0.4, fontSize: 14, bold: true, color: C.vert, fontFace: FONT });
  s.addText(bullets([
    'Angular enregistre quels blocs de template lisent quel signal',
    'Quand signal.set() est appelé → seuls les blocs dépendants sont invalidés',
    'Pas besoin de Zone.js pour déclencher la détection',
    '@if (adding()) lit le signal → Angular sait exactement quand le réévaluer',
    'Mise à jour chirurgicale : ni trop tôt, ni trop tard',
  ]), { x: 6.7, y: 1.3, w: 6.2, h: 4.5, valign: 'top' });
}

slideContenu('signal() — notion', [
  'État local mutable — se lit avec () — se modifie avec .set() / .update()',
  'Angular ne recalcule que les parties du template qui lisent ce signal',
  '',
  'Exemples déjà présents dans ClientsComponent :',
  { text: 'readonly search = signal(\'\')', sub: true },
  { text: 'readonly loading = signal(false)', sub: true },
  { text: 'readonly error = signal<string | null>(null)', sub: true },
  { text: 'readonly adding = signal(false)  ← cible de l\'exercice', sub: true },
]);
slideAvantApres(
  'Exercice 1 — adding : champ ordinaire → signal()',
  'adding = false;\n\nstartAdd(): void {\n  this.adding = true;\n}\n\ncancelAdd(): void {\n  this.adding = false;\n}\n\n// Template\n@if (!adding) { ... }\n@if (adding) { ... }',
  'readonly adding = signal(false);\n\nstartAdd(): void {\n  this.adding.set(true);\n}\n\ncancelAdd(): void {\n  this.adding.set(false);\n}\n\n// Template\n@if (!adding()) { ... }\n@if (adding()) { ... }',
  'npm test -- --runTestsByPath src/.../clients.component.spec.ts',
);

// ── EX.2 computed() ───────────────────────────────────────────────────────────
slideSection('0:45 – 1:15', 'Exercice 2 — computed()');
slideContenu('computed() — notion', [
  'État dérivé en lecture seule — mémoïsé par Angular',
  'Recalculé uniquement quand une dépendance change',
  'Un getter recalcule à chaque lecture, un computed() ne recalcule pas inutilement',
  '',
  'Exemples déjà présents dans AccountsFacade :',
  { text: 'readonly filteredAccounts = computed(() => ...)', sub: true },
  { text: 'readonly totalBalance = computed(() => ...)', sub: true },
  { text: 'readonly blockedAccountsCount = computed(() => ...)  ← après ex.2', sub: true },
]);
slideAvantApres(
  'Exercice 2 — blockedAccountsCount : getter → computed()',
  '// AccountsFacade\nget blockedAccountsCount(): number {\n  return this.filteredAccounts()\n    .filter(a => a.status === \'blocked\')\n    .length;\n}\n\n// AccountsComponent\nget blockedAccountsCount(): number {\n  return this.accountsFacade\n    .blockedAccountsCount;\n}\n\n// Template\n{{ blockedAccountsCount }}',
  '// AccountsFacade\nreadonly blockedAccountsCount =\n  computed(() =>\n    this.filteredAccounts()\n      .filter(a => a.status === \'blocked\')\n      .length\n  );\n\n// AccountsComponent\nreadonly blockedAccountsCount =\n  this.accountsFacade.blockedAccountsCount;\n\n// Template\n{{ blockedAccountsCount() }}',
  'npm test -- --runTestsByPath src/.../accounts.component.spec.ts',
);

// ── EX.3 input() ──────────────────────────────────────────────────────────────
slideSection('1:15 – 1:45', 'Exercice 3 — input()');
slideContenu('input() — notion', [
  'input() déclare une entrée de composant sous forme de signal',
  'Se lit avec showStatus() — vraie dépendance réactive',
  '@Input() classique lu dans computed() ne crée PAS de dépendance signal',
  '',
  'Exemples déjà présents dans AccountCardComponent :',
  { text: 'account = input.required<Account>()', sub: true },
  { text: 'clientId = input.required<string>()', sub: true },
  { text: '@Input() showStatus = true  ← cible de l\'exercice', sub: true },
]);
slideAvantApres(
  'Exercice 3 — showStatus : @Input() → input()',
  'import { ..., Input, computed,\n  input } from \'@angular/core\';\n\n@Input() showStatus = true;\n\nreadonly visibleStatusLabel =\n  computed(() =>\n    this.showStatus\n      ? this.statusLabel()\n      : null\n  );',
  'import { ..., computed,\n  input } from \'@angular/core\';\n\nshowStatus = input(true);\n\nreadonly visibleStatusLabel =\n  computed(() =>\n    this.showStatus()\n      ? this.statusLabel()\n      : null\n  );',
  'npm test -- --runTestsByPath src/.../account-card.component.spec.ts',
);

// ── EX.4 output() ─────────────────────────────────────────────────────────────
slideSection('1:45 – 2:15', 'Exercice 4 — output()');
slideContenu('output() — notion', [
  'output() remplace @Output() + EventEmitter',
  'L\'enfant émet une intention — le parent décide de l\'action',
  '',
  'Exemples déjà présents dans AccountListComponent :',
  { text: 'editRequested = output<Account>()', sub: true },
  { text: 'saveRequested = output<void>()', sub: true },
  { text: '@Output() selectedRequested = new EventEmitter<Account>()  ← cible', sub: true },
  '',
  'Discussion : signal avec equal custom',
  { text: 'signal<Account | null>(null, { equal: () => false })', sub: true },
]);
slideAvantApres(
  'Exercice 4 — selectedRequested : EventEmitter → output()',
  'import { ..., EventEmitter,\n  Output, effect, signal } from \'@angular/core\';\n\n@Output() selectedRequested =\n  new EventEmitter<Account>();\n\nconstructor() {\n  effect(() => {\n    const a = this.selectedAccount();\n    if (a) this.selectedRequested.emit(a);\n  });\n}',
  'import { ..., effect,\n  output, signal } from \'@angular/core\';\n\nselectedRequested =\n  output<Account>();\n\nconstructor() {\n  effect(() => {\n    const a = this.selectedAccount();\n    if (a) this.selectedRequested.emit(a);\n  });\n}',
  'npm test -- --runTestsByPath src/.../accounts.component.spec.ts',
);

// ── EX.5 toSignal + toObservable ──────────────────────────────────────────────
slideSection('2:15 – 3:00', 'Exercice 5 — toSignal() + toObservable()');
slideContenu('Interop RxJS ↔ Signals', [
  'Certaines APIs Angular restent des Observables (route.paramMap, HTTP…)',
  'toSignal() : Observable → Signal',
  'toObservable() : Signal → Observable',
  '',
  'Règle : ne pas tout bridger systématiquement',
  { text: 'Rester Signal si pas d\'opérateur RxJS nécessaire', sub: true },
  { text: 'toObservable() utile pour debounce, combineLatest, multicast', sub: true },
]);
slideAvantApres(
  'Ex.5 Partie 1 — clientId : subscription → toSignal() (AccountsComponent)',
  'private readonly clientId$ =\n  this.route.paramMap\n    .pipe(map(p => p.get(\'id\')));\nreadonly clientId =\n  signal<string | null>(null);\n\nconstructor() {\n  this.clientId$\n    .pipe(takeUntilDestroyed(\n      this.destroyRef))\n    .subscribe(id => {\n      this.clientId.set(id);\n      this.accountsFacade.load(id);\n    });\n}',
  'readonly clientId: Signal<string|null> =\n  toSignal(\n    this.route.paramMap\n      .pipe(map(p => p.get(\'id\'))),\n    { initialValue: null }\n  );\n\nconstructor() {\n  this.accountsFacade\n    .setTypeFilter(this.initialTypeFilter());\n  effect(() => {\n    this.accountsFacade\n      .load(this.clientId());\n  });\n}',
  'npm test -- --runTestsByPath src/.../accounts.component.spec.ts',
);
slideAvantApres(
  'Ex.5 Partie 2 — HTTP : firstValueFrom → toSignal() (DashboardComponent)',
  'private readonly clientsState =\n  signal<ClientActivity[]>([]);\nreadonly loading = signal(false);\nreadonly error = signal<string|null>(null);\n\nasync reload(): Promise<void> {\n  this.loading.set(true);\n  try {\n    const data = await firstValueFrom(\n      this.clientsApi.getAll());\n    this.clientsState.set(data);\n  } catch (err) {\n    this.error.set(err.message);\n  } finally {\n    this.loading.set(false);\n  }\n}',
  'private readonly clientsQuery =\n  toSignal(\n    this.clientsApi.getAll().pipe(\n      map(clients => ({ clients,\n        loading: false, error: null })),\n      catchError(err => of({\n        clients: [], loading: false,\n        error: err.message })),\n      startWith(initialClientsQuery)\n    ),\n    { initialValue: initialClientsQuery }\n  );\nreadonly loading = computed(() =>\n  this.clientsQuery().loading);\nreadonly error = computed(() =>\n  this.clientsQuery().error);',
  'npm test -- --runTestsByPath src/.../dashboard.component.spec.ts',
);
slideCode(
  'Ex.5 Partie 3 — toObservable() : démonstration',
  '// Déjà présent dans ClientsComponent\nreadonly debouncedSearch$ =\n  toObservable(this.search)\n    .pipe(debounceTime(300));\n\n// Cas d\'usage naturels\n// ▸ debounce sur un champ de recherche\n// ▸ combiner deux signals via combineLatest()\n// ▸ partager un état signal avec un service Observable',
  [
    'toSignal() et toObservable() sont les deux directions du pont',
    'Préférer le monde Signal si aucun opérateur RxJS n\'est nécessaire',
    'Cet exercice est une démonstration — pas de code à produire',
  ],
);

// ── EX.6 effect() + viewChild() ───────────────────────────────────────────────
slideSection('3:00 – 3:30', 'Exercice 6 — effect() + viewChild()');
slideContenu('effect() + viewChild() — notion', [
  'effect() exécute un effet de bord quand des signals changent',
  'Ne pas remplacer computed() — effect() n\'a pas de valeur de retour',
  '',
  'Exemples déjà présents dans ClientsComponent :',
  { text: 'effect(() => { document.title = totalClients() > 0 ? ... })', sub: true },
  { text: 'effect(() => { this.firstNameInput()?.nativeElement.focus() })', sub: true },
  '',
  'viewChild() expose un élément du template comme un signal',
  { text: 'private readonly firstNameInput = viewChild<ElementRef>(\'firstNameRef\')', sub: true },
]);
slideAvantApres(
  'Ex.6 Partie 1 — clampCurrentPage() → effect()',
  '// deleteClient() appelle manuellement :\nthis.clientsState.update(...);\nthis.clampCurrentPage();\n\nprivate clampCurrentPage(): void {\n  const clamped = this.pageSlice().page;\n  if (clamped !== this.page()) {\n    this.page.set(clamped);\n  }\n}',
  '// Ajouter dans le constructeur :\neffect(() => {\n  const clamped = this.pageSlice().page;\n  if (clamped !== this.page()) {\n    this.page.set(clamped);\n  }\n});\n\n// deleteClient() :\nthis.clientsState.update(...);\n// supprimer this.clampCurrentPage()\n\n// Supprimer la méthode',
  'npm test -- --runTestsByPath src/.../clients.component.spec.ts',
);
slideAvantApres(
  'Ex.6 Partie 2 — viewChild() + focus conditionnel',
  '// Exemple baseline présent :\nprivate readonly firstNameInput =\n  viewChild<ElementRef>(\'firstNameRef\');\n\n// effect sans condition (avant)\neffect(() => {\n  this.firstNameInput()\n    ?.nativeElement.focus();\n});\n\n// Template\n<input #firstNameRef ... />',
  '// Ajouter la condition sur adding()\neffect(() => {\n  if (this.adding()) {\n    this.firstNameInput()\n      ?.nativeElement.focus();\n  }\n});\n\n// Deux dépendances :\n// adding() → déclenche l\'effet\n// firstNameInput() → DOM disponible',
  null,
);

// ── EX.7 hasActiveFilter ──────────────────────────────────────────────────────
slideSection('3:30 – 3:50', 'Exercice 7 — Refactoring façade');
slideContenu('Refactoring façade — notion', [
  'Exposer des computed() lisibles — pas seulement les données brutes',
  'La règle métier devient testable et indépendante du composant',
  '',
  'Exemples déjà présents dans AccountsFacade :',
  { text: 'readonly filteredAccounts = computed(() => ...)', sub: true },
  { text: 'readonly totalBalance = computed(() => ...)', sub: true },
  { text: 'readonly blockedAccountsCount = computed(() => ...)', sub: true },
  '',
  'Exercice : ajouter hasActiveFilter — savoir si un filtre est actif',
]);
slideAvantApres(
  'Exercice 7 — hasActiveFilter dans AccountsFacade',
  '// AccountsFacade — absent\nreadonly typeFilter =\n  signal<AccountTypeFilter>(\'all\');\nreadonly loading = signal(false);\n\n// AccountsComponent\nreadonly typeFilter =\n  this.accountsFacade.typeFilter;\n\n// Template\n\'Aucun compte trouvé.\'',
  '// AccountsFacade\nreadonly hasActiveFilter = computed(() =>\n  this.search().trim().length > 0\n  || this.typeFilter() !== \'all\'\n);\n\n// AccountsComponent\nreadonly hasActiveFilter =\n  this.accountsFacade.hasActiveFilter;\n\n// Template\n{{ hasActiveFilter()\n  ? \'Aucun compte ne correspond.\'\n  : \'Aucun compte trouvé.\' }}',
  'npm test -- --runTestsByPath src/.../accounts.component.spec.ts',
);

// ── DEBRIEF ───────────────────────────────────────────────────────────────────
slideSection('3:50 – 4:00', 'Debrief', C.gris);
slideContenu('Questions de fin', [
  'Quels états sont de bons candidats pour signal() ?',
  'Quelles valeurs doivent rester en computed() ?',
  'Quels effets de bord sont acceptables dans effect() ?',
  'Où RxJS reste-t-il naturel par rapport aux Signals ?',
  'Quelles migrations apportent une vraie valeur dans ce projet ?',
]);
slideContenu('Bonus — si le groupe avance vite', [
  'linkedSignal()',
  { text: 'Synchroniser un draft d\'édition avec la sélection courante', sub: true },
  { text: 'Pertinent pour les formulaires editAccount / editMode', sub: true },
  '',
  'resource()',
  { text: 'Remplacer le pattern loading/error par une ressource déclarative', sub: true },
  { text: 'Expérimental — à présenter comme non obligatoire', sub: true },
  '',
  'model()',
  { text: 'Two-way binding signal — remplacement des paires input/output', sub: true },
]);

await pptx.writeFile({ fileName: 'docs/dojo-angular-signals.pptx' });
console.log('docs/dojo-angular-signals.pptx généré');
