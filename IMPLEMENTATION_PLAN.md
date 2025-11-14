# Plan d'Implémentation - Token Optimization & API Improvements

**Date:** 2025-11-14
**Version actuelle:** 1.0.6
**Version cible:** 1.1.0

---

## 📋 Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Analyse Critique](#analyse-critique)
3. [Fonctionnalités Sous-Utilisées](#fonctionnalités-sous-utilisées)
4. [Plan d'Implémentation](#plan-dimplémentation)
5. [Risques & Mitigations](#risques--mitigations)
6. [Timeline & Effort](#timeline--effort)

---

## 🎯 Résumé Exécutif

### Problème Principal
Le serveur MCP actuel utilise seulement **30% des capacités** de l'API Obsidian Local REST (v3.2.0), ce qui entraîne:
- **Consommation excessive de tokens AI** (jusqu'à 10,000 tokens pour éditer 1 ligne)
- **Performance dégradée** (search: 2-3s au lieu de 100ms)
- **API calls inefficaces** (1000+ GET au lieu de 1 POST)

### Solution Proposée
**Approche 2: Multi-outils spécialisés** avec optimisations critiques:
- ✅ **98% réduction tokens AI** (edit_file + patch_file)
- ✅ **95% amélioration performance** (native search API)
- ✅ **50% réduction complexity** (active file API)

### Impact Attendu
| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Tokens AI (édition) | 10,000 | 200 | **98%** |
| Search performance | 2-3s | 100ms | **95%** |
| API calls (search) | 1000+ | 1 | **99%** |
| UX (edit active file) | 3-4 calls | 1 call | **75%** |

---

## 🔴 Analyse Critique

### Problème 1: Search Inefficace (CRITIQUE)

**État actuel:** `src/tools/search.ts`
```typescript
// On réinvente la roue:
// 1. walkVault() → Liste TOUS les fichiers
// 2. Lit chaque fichier (GET x1000)
// 3. Pattern matching manuel ligne par ligne
// Performance: 2-3 secondes pour 1000 fichiers
```

**API disponible mais NON UTILISÉE:**
```http
POST /search/simple/
Body: { query: "texte", contextLength: 100 }
```

**Impact:**
- ❌ 1000+ GET requests au lieu de 1 POST
- ❌ Pas d'indexation native Obsidian
- ❌ Performance dégradée (gros vaults: 5000+ notes)
- ❌ Coût API élevé

**Priorité:** 🔴 **CRITIQUE** - À fixer AVANT tout le reste

---

### Problème 2: Édition Coûteuse en Tokens

**État actuel:** Pour changer 1 ligne
```typescript
// AI doit envoyer:
1. read_file("note.md") → Reçoit 5000 tokens
2. AI traite et régénère TOUT le fichier → 5000 tokens
3. write_file("note.md", fullContent) → Envoie 5000 tokens

// Total: ~10,000 tokens pour 1 ligne modifiée
```

**Impact:**
- ❌ Consommation excessive tokens API
- ❌ Coûts élevés pour utilisateurs
- ❌ Latence accrue
- ❌ Limite contexte atteinte rapidement

**Priorité:** 🔴 **CRITIQUE** - Token Optimization v1.1

---

### Problème 3: Pas d'Édition Structurée

**PATCH API disponible (v3.0+) mais NON UTILISÉE:**
```http
PATCH /vault/{path}
Operation: replace | append | prepend
Target-Type: heading | block | frontmatter
Target: Section Title
```

**Use cases manquants:**
- Modifier un heading spécifique
- Éditer frontmatter (tags, status, etc.)
- Append sous une section
- Modifier block référencé

**Impact:**
- ❌ AI doit réécrire fichier complet
- ❌ Pas d'opérations atomiques
- ❌ Risque écrasement concurrent

**Priorité:** 🔥 **URGENT** - Ajouter patch_file

---

### Problème 4: Active File Ignoré

**API disponible mais NON UTILISÉE:**
```http
GET /active/      # Fichier actuellement ouvert
POST /active/     # Append au fichier actif
PATCH /active/    # Modifier fichier actif
```

**Use case typique:**
```
User: "Edit this file" (dans Obsidian)
AI actuel:
  1. "Quel fichier?" → find_files
  2. Lire → read_file
  3. Éditer → write_file
  Total: 3-4 API calls

AI optimal avec /active/:
  1. edit_active_file({ old_string, new_string })
  Total: 1 API call
```

**Impact:**
- ❌ 3-4x plus d'API calls
- ❌ Tokens gaspillés pour trouver le path
- ❌ UX dégradée (AI doit deviner)

**Priorité:** 🟡 **IMPORTANT** - Phase 2

---

## 🔍 Fonctionnalités Sous-Utilisées

### 1. Search API Native (v1.0+) 🔴 CRITIQUE

**Endpoint:** `POST /search/simple/`

**Capacités:**
- Recherche full-text indexée
- Support regex
- Context lines configurables
- Scores de pertinence

**Fiabilité:** ✅ Très stable (API core depuis v1.0)

**Implémentation actuelle:** ❌ Aucune (on fait manuellement)

**Action:** Remplacer `src/tools/search.ts` complètement

---

### 2. PATCH API (v3.0.1+) 🔥 URGENT

**Endpoint:** `PATCH /vault/{path}` avec headers

**Capacités:**
- Édition par heading
- Édition frontmatter
- Édition par block reference
- 3 opérations: append/prepend/replace

**Fiabilité:** ✅ Stable depuis 18 mois (nov 2023)

**Implémentation actuelle:** ❌ Partiellement (seulement append)

**Action:** Ajouter outil `patch_file` complet

---

### 3. Active File API (v1.0+) 🟡 IMPORTANT

**Endpoints:** `/active/` (GET, POST, PUT, PATCH, DELETE)

**Capacités:**
- Accès direct au fichier ouvert
- Pas besoin de path
- Édition contextuelle

**Fiabilité:** ✅ Très stable (API core)

**Implémentation actuelle:** ❌ Aucune

**Action:** Ajouter outils `*_active_file`

---

### 4. Periodic Notes API (v3.1.0) ⏰ OPTIONNEL

**Endpoints:** `/periodic/{period}/` et `/periodic/{y}/{m}/{d}/{period}/`

**Capacités:**
- Daily/Weekly/Monthly notes
- Dates arbitraires
- Auto-création

**Fiabilité:** ✅ Stable (mars 2024)

**Implémentation actuelle:** ❌ Aucune

**Action:** Roadmap v2.0+ (si demandé par users)

---

### 5. Commands API (v2.0+) ⏰ OPTIONNEL

**Endpoints:** `GET /commands/` et `POST /commands/{id}/`

**Capacités:**
- Liste commandes disponibles
- Exécution commandes Obsidian
- Intégration workflows

**Fiabilité:** ✅ Stable

**Implémentation actuelle:** ❌ Aucune

**Action:** Roadmap v2.0+ (cas d'usage limités)

---

### 6. Open File API (v1.0+) ⏰ OPTIONNEL

**Endpoint:** `POST /open/{path}`

**Capacités:**
- Ouvrir fichier dans UI Obsidian
- Navigation guidée

**Fiabilité:** ✅ Stable

**Implémentation actuelle:** ❌ Aucune

**Action:** Roadmap v1.3+ (nice-to-have)

---

### 7. Tags Endpoint (PR #199) ⏳ EN ATTENTE

**Endpoint:** `GET /tags`

**Capacités:**
- Liste tous les tags du vault
- Suggestions intelligentes

**Fiabilité:** ⚠️ PR ouverte (nov 2025), pas encore mergée

**Implémentation actuelle:** ❌ Aucune

**Action:** Attendre merge, puis ajouter en v1.3+

---

### 8. HTML Rendering (PR #195) ⏳ EN ATTENTE

**Endpoint:** `GET /vault/{path}` avec `Accept: text/html`

**Capacités:**
- Contenu rendu en HTML
- Prévisualisation sans parser

**Fiabilité:** ⚠️ PR ouverte (nov 2025), pas encore mergée

**Implémentation actuelle:** ❌ Aucune

**Action:** Attendre merge, évaluer intérêt

---

### 9. File Move Operation (PR #191) ⚠️ INCERTAIN

**Endpoint:** `MOVE /vault/{path}` avec header `Destination`

**Capacités:**
- Déplacer fichiers
- Préserver liens internes
- Création dirs auto

**Fiabilité:** ⚠️ PR en discussion, peut ne pas être mergée

**Implémentation actuelle:** ✅ On a `move_file` (fonctionne différemment)

**Action:** Attendre résolution discussions (WebDAV-style proposé)

---

## 🚀 Plan d'Implémentation

### Phase 0: Correctifs Critiques (AVANT TOUT) 🔴

**Objectif:** Fixer inefficacités majeures

#### 0.1 Remplacer Search par API Native

**Fichiers modifiés:**
- `src/client/obsidian.ts` - Ajouter méthode `searchSimple()`
- `src/tools/search.ts` - Réécrire complètement

**Changements:**
- Supprimer: `walkVault()` + boucle de lecture fichiers
- Ajouter: `client.searchSimple()` → Appel `POST /search/simple/`
- Retour: Format standardisé avec scores de pertinence

**Tests:**
- Query simple
- Query regex
- Context lines
- Max results
- Performance benchmark (doit être <200ms)

**Impact:**
- ✅ 95% plus rapide (100ms vs 2-3s)
- ✅ 99% moins d'API calls (1 POST vs 1000 GET)
- ✅ Utilise indexation native

**Effort:** 2h

**Risque:** 🟢 Faible (API stable v1.0+)

**Priorité:** 🔴 **CRITIQUE - À faire en premier**

---

### Phase 1: Token Optimization Core 🔥

**Objectif:** Réduire 98% tokens AI pour éditions

#### 1.1 Ajouter `edit_file` (Pattern Matching)

**Outil nouveau:** `edit_file`

**API:**
```typescript
edit_file({
  path: string,              // Chemin fichier
  old_string: string,        // Texte exact à remplacer
  new_string: string,        // Nouveau texte
  replace_all?: boolean      // Remplacer toutes occurrences (défaut: false)
})
```

**Description pour AI:**
```
Surgically edit file content using exact string replacement.
Use this for arbitrary text edits anywhere in the file.
For structured edits (headings/frontmatter), use patch_file instead.

IMPORTANT:
- old_string must match exactly (including whitespace/indentation)
- Include enough context to make old_string unique
- If multiple matches exist, you'll get an error (use replace_all or add more context)
```

**Implémentation:**

**Fichiers à créer:**
- `src/tools/edit.ts` - Logique principale
- `src/types/tools.ts` - Type `EditFileArgs`

**Fichiers à modifier:**
- `src/server/http.ts` - Enregistrer tool schema

**Logique:**
1. Lire fichier complet (`readFile`)
2. Compter occurrences de `old_string`
3. Valider unicité (ou `replace_all=true`)
4. Remplacer via `content.replace()` ou `.replaceAll()`
5. Écrire fichier (`writeFile`)
6. Invalider cache

**Gestion erreurs:**
- 0 occurrence → "old_string not found"
- N occurrences sans `replace_all` → "Found N, use replace_all or add context"

**Tests clés:** (8 tests)
- Replacement unique, multiple (error), replace_all
- Not found, indentation, multiligne, unicode

**Impact:**
- ✅ 98% réduction tokens AI (200 vs 10,000)
- ✅ Pattern familier (comme Edit tool Claude Code)
- ✅ Édition arbitraire (pas limité aux sections)

**Effort:** 4h (80 lignes code + 50 lignes tests)

**Risque:** 🟡 Moyen
- old_string doit être unique → Erreurs possibles
- Mitigation: Messages d'erreur clairs + guidance

**Priorité:** 🔥 **URGENT**

---

#### 1.2 Ajouter `patch_file` (Édition Structurée)

**Outil nouveau:** `patch_file`

**API:**
```typescript
patch_file({
  path: string,                                    // Chemin fichier
  operation: 'append' | 'prepend' | 'replace',    // Opération
  target_type: 'heading' | 'block' | 'frontmatter', // Type cible
  target: string,                                  // Titre/ID/Clé
  content: string                                  // Nouveau contenu
})
```

**Description pour AI:**
```
Edit structured content (headings, blocks, frontmatter) using Obsidian's native PATCH API.
More efficient than edit_file for section-based edits.

Use cases:
- Modify a specific heading: target_type='heading', target='Section Title'
- Update frontmatter field: target_type='frontmatter', target='status'
- Edit block reference: target_type='block', target='^block-id'

Operations:
- append: Add content after target
- prepend: Add content before target
- replace: Replace target content entirely
```

**Implémentation:**

**Fichiers à créer:**
- `src/tools/patch.ts` - Logique principale

**Fichiers à modifier:**
- `src/client/obsidian.ts` - Ajouter `patchFile(path, operation, targetType, target, content)`
- `src/types/tools.ts` - Type `PatchFileArgs`
- `src/server/http.ts` - Enregistrer tool schema

**Logique:**
1. Valider params (operation, target_type, target requis)
2. Appeler `PATCH /vault/{path}` avec headers:
   - `Operation`: append/prepend/replace
   - `Target-Type`: heading/block/frontmatter
   - `Target`: identifiant section
3. Retourner succès/erreur

**Gestion erreurs:**
- Target not found → Propagé par API Obsidian
- Invalid operation/target_type → Validation côté tool

**Tests clés:** (8 tests)
- Replace/append/prepend heading
- Frontmatter update/create
- Block reference, target not found, validation

**Impact:**
- ✅ 95% réduction tokens pour éditions structurées
- ✅ API native (pas de parsing manuel)
- ✅ Opérations atomiques
- ✅ Support frontmatter natif

**Effort:** 4h (100 lignes code + 60 lignes tests)

**Risque:** 🟢 Faible (API stable v3.0+ depuis 18 mois)

**Priorité:** 🔥 **URGENT**

---

#### 1.3 Améliorer `write_file` (Bonus)

**Modification:** Ajouter mode `prepend`

**Actuellement supporté:**
- `create` - Créer (erreur si existe)
- `overwrite` - Écraser
- `append` - Ajouter à la fin

**À ajouter:**
- `prepend` - Ajouter au début

**Logique:**
- Si `prepend` + fichier existe: Lire contenu → Préfixer nouveau contenu
- Si `prepend` + fichier n'existe pas: Créer avec contenu

**Changement minimal:** Ajouter enum `'prepend'` + condition if dans `src/tools/write.ts`

**Tests:** (3 tests)
- Prepend existant, prepend nouveau, préserver contenu

**Impact:**
- ✅ Complète les modes d'écriture
- ✅ Cas d'usage: ajouter header/notice en haut

**Effort:** 1h (20 lignes)

**Risque:** 🟢 Très faible

**Priorité:** 🟡 **BONUS** (si temps disponible)

---

### Phase 2: Active File Support 🟡

**Objectif:** Réduire 50% tokens pour éditer fichier actif

#### 2.1 Ajouter Active File Tools

**Outils nouveaux:**
1. `read_active_file` - Lire fichier actif
2. `edit_active_file` - Éditer fichier actif (pattern matching)
3. `patch_active_file` - Patch fichier actif (structuré)
4. `write_active_file` - Écrire fichier actif (modes)

**Implémentation:**

**Fichiers à créer:**
- `src/tools/active.ts` - 4 fonctions (read/edit/patch/write)

**Fichiers à modifier:**
- `src/client/obsidian.ts` - 4 méthodes:
  - `readActiveFile()` → `GET /active/`
  - `writeActiveFile(content)` → `PUT /active/`
  - `appendActiveFile(content)` → `POST /active/`
  - `patchActiveFile(operation, targetType, target, content)` → `PATCH /active/`
- `src/server/http.ts` - Enregistrer 4 tool schemas

**Logique:** Identique aux outils réguliers mais sans paramètre `path`
- `read_active_file` → Aucun param
- `edit_active_file` → old_string, new_string, replace_all
- `patch_active_file` → operation, target_type, target, content
- `write_active_file` → content, mode

**Gestion erreurs:**
- Aucun fichier actif → "No active file. Please open a file in Obsidian."

**Tests:** (14 tests)
- read: 2 tests, edit: 4 tests, patch: 4 tests, write: 4 tests

**Impact:**
- ✅ 50% réduction tokens (pas besoin find path)
- ✅ UX naturelle ("edit this file")
- ✅ Moins d'erreurs (pas de path invalide)

**Effort:** 3h (120 lignes code + 40 lignes tests)

**Risque:** 🟢 Faible (API stable core)

**Priorité:** 🟡 **IMPORTANT** (après Phase 1)

---

### Phase 3: Fonctionnalités Avancées ⏰

**Objectif:** Optimisations supplémentaires

#### 3.1 Partial Read File

**Outil modifié:** `read_file`

**Nouveaux params:** `offset` (ligne début), `limit` (nb lignes)

**Use case:** Lire lignes 100-120 au lieu de 5000 lignes complètes

**Logique:** Split content par lignes → slice(offset, offset+limit)

**Impact:**
- ✅ 94% réduction tokens pour grands fichiers
- ✅ Preview rapide de sections

**Effort:** 2h

**Priorité:** ⏰ **OPTIONNEL** (v1.2)

---

#### 3.2 List Tags (Attendre PR #199)

**Condition:** Attendre merge de PR #199

**Outil nouveau:** `list_tags`

**API:**
```typescript
list_tags()  // Retourne tous les tags du vault
```

**Use case:**
- Suggestions tags pour nouvelles notes
- Exploration vault

**Effort:** 1h (après merge PR)

**Priorité:** ⏳ **EN ATTENTE** (v1.3+)

---

#### 3.3 Commands API

**Outils nouveaux:**
- `list_commands` - Liste commandes disponibles
- `execute_command` - Exécute commande Obsidian

**Use cases:**
- Automatisation workflows
- Intégration templates
- Export PDF

**Effort:** 3h

**Priorité:** ⏰ **OPTIONNEL** (v2.0)

---

#### 3.4 Periodic Notes

**Outils nouveaux:**
- `get_daily_note` - Note du jour
- `create_periodic_note` - Créer note périodique

**Use cases:**
- Journaling automatisé
- Notes hebdo/mensuelles

**Effort:** 4h

**Priorité:** ⏰ **OPTIONNEL** (v2.0, si demandé users)

---

## ⚠️ Risques & Mitigations

### Risque 1: edit_file - Unicité old_string 🟡

**Description:** old_string peut apparaître plusieurs fois

**Impact:** Échec édition, retry AI nécessaire

**Probabilité:** Moyenne (30%)

**Mitigation:**
1. Messages d'erreur détaillés:
   ```
   Found 5 occurrences. Either:
   1. Use replace_all=true, OR
   2. Include more context in old_string
   ```
2. Documentation claire avec exemples
3. Flag `replace_all` bien documenté

**Sévérité après mitigation:** 🟢 Faible

---

### Risque 2: PATCH API - Target not found 🟢

**Description:** Heading/block spécifié n'existe pas

**Impact:** Erreur retournée par API Obsidian

**Probabilité:** Faible (10%)

**Mitigation:**
1. Erreur propagée clairement à AI
2. AI retry avec target différent
3. Suggestion: "Use find_files or read_file to verify target exists"

**Sévérité après mitigation:** 🟢 Très faible

---

### Risque 3: Search API - Regex invalide 🟢

**Description:** Query regex malformée

**Impact:** Erreur API

**Probabilité:** Faible (5%)

**Mitigation:**
1. Try-catch dans tool
2. Message clair: "Invalid regex pattern"
3. Fallback: recherche littérale

**Sévérité après mitigation:** 🟢 Très faible

---

### Risque 4: Active File - Aucun fichier ouvert ⚠️

**Description:** User n'a pas de fichier actif dans Obsidian

**Impact:** Erreur 404 ou vide

**Probabilité:** Moyenne (20%)

**Mitigation:**
1. Erreur claire: "No active file. Please open a file in Obsidian."
2. Documentation: "Works only when a file is open in Obsidian"
3. Fallback suggestion: "Use regular edit_file with path instead"

**Sévérité après mitigation:** 🟢 Faible

---

### Risque 5: Breaking Changes - Backward Compat 🟢

**Description:** Nouvelles fonctionnalités cassent ancien code

**Impact:** Régression

**Probabilité:** Très faible (2%)

**Mitigation:**
1. Tous les anciens tools inchangés
2. Nouveaux tools = ajouts purs
3. Tests de régression complets
4. Versioning sémantique strict

**Sévérité après mitigation:** 🟢 Très faible

---

### Risque 6: Performance Régression 🟢

**Description:** Nouvelles features dégradent perfs

**Impact:** Latence accrue

**Probabilité:** Très faible (1%)

**Mitigation:**
1. Benchmarks avant/après
2. Cache existant préservé
3. Tests performance automatisés
4. Rollback plan si régression >10%

**Sévérité après mitigation:** 🟢 Très faible

---

## 📊 Timeline & Effort

### Phase 0: Correctifs Critiques

| Tâche | Effort | Priorité | Risque |
|-------|--------|----------|--------|
| 0.1 Fix Search API | 2h | 🔴 CRITIQUE | 🟢 Faible |
| **Total Phase 0** | **2h** | - | - |

**Délai:** 1 jour

---

### Phase 1: Token Optimization Core

| Tâche | Effort | Priorité | Risque |
|-------|--------|----------|--------|
| 1.1 edit_file | 4h | 🔥 URGENT | 🟡 Moyen |
| 1.2 patch_file | 4h | 🔥 URGENT | 🟢 Faible |
| 1.3 write_file prepend | 1h | 🟡 BONUS | 🟢 Faible |
| Tests intégration | 1h | 🔥 URGENT | - |
| **Total Phase 1** | **10h** | - | - |

**Délai:** 2 jours

---

### Phase 2: Active File Support

| Tâche | Effort | Priorité | Risque |
|-------|--------|----------|--------|
| 2.1 Active File Tools (x4) | 3h | 🟡 IMPORTANT | 🟢 Faible |
| Tests | 1h | 🟡 IMPORTANT | - |
| **Total Phase 2** | **4h** | - | - |

**Délai:** 1 jour

---

### Phase 3: Fonctionnalités Avancées (Optionnel)

| Tâche | Effort | Priorité | Risque |
|-------|--------|----------|--------|
| 3.1 Partial read_file | 2h | ⏰ OPTIONNEL | 🟢 Faible |
| 3.2 list_tags (après PR) | 1h | ⏳ EN ATTENTE | 🟢 Faible |
| 3.3 Commands API | 3h | ⏰ OPTIONNEL | 🟢 Faible |
| 3.4 Periodic Notes | 4h | ⏰ OPTIONNEL | 🟢 Faible |
| **Total Phase 3** | **10h** | - | - |

**Délai:** 2 jours (si tout implémenté)

---

### Documentation & Release

| Tâche | Effort | Priorité |
|-------|--------|----------|
| Mise à jour README.md | 1h | 🔥 URGENT |
| Mise à jour TECHNICAL.md | 1h | 🔥 URGENT |
| CHANGELOG.md | 0.5h | 🔥 URGENT |
| Exemples d'usage | 0.5h | 🟡 IMPORTANT |
| **Total Doc** | **3h** | - |

---

### TOTAL EFFORT

| Phase | Effort | Statut |
|-------|--------|--------|
| Phase 0 (Critique) | 2h | 🔴 Obligatoire |
| Phase 1 (Core) | 10h | 🔴 Obligatoire |
| Phase 2 (Active) | 4h | 🟡 Recommandé |
| Phase 3 (Avancé) | 10h | ⏰ Optionnel |
| Documentation | 3h | 🔴 Obligatoire |
| **MINIMUM VIABLE** | **15h** | Phase 0+1+Doc |
| **RECOMMANDÉ** | **19h** | Phase 0+1+2+Doc |
| **COMPLET** | **29h** | Toutes phases |

---

## 🎯 Ordre d'Exécution Recommandé

### Sprint 1 (6h) - Fondations Critiques
1. **Phase 0:** Fix Search (2h) 🔴
2. **Phase 1.1:** edit_file (4h) 🔥

**Livrables:** Search optimisé + edit_file fonctionnel

**Impact immédiat:**
- 95% performance search
- 98% réduction tokens édition

---

### Sprint 2 (5h) - Compléter Core
1. **Phase 1.2:** patch_file (4h) 🔥
2. **Tests intégration** (1h) 🔥

**Livrables:** Suite complète édition + tests

**Impact immédiat:**
- Édition structurée native
- Frontmatter support

---

### Sprint 3 (4h) - Active File
1. **Phase 2:** Active File Tools (3h) 🟡
2. **Tests** (1h) 🟡

**Livrables:** Support fichier actif

**Impact immédiat:**
- 50% réduction tokens contexte actif
- UX améliorée

---

### Sprint 4 (3h) - Documentation & Release
1. **Documentation** (3h) 🔴
2. **Release v1.1.0**

**Livrables:**
- README, TECHNICAL, CHANGELOG mis à jour
- Release GitHub + npm

---

### Sprints Optionnels (10h+)
- **Phase 3:** Features avancées selon besoins
- **Phase 3.2:** Attendre merge PR #199 pour tags

---

## 📈 Métriques de Succès

### KPIs Phase 0 (Search)
- ✅ Temps recherche: <200ms (actuellement 2-3s)
- ✅ API calls search: 1 (actuellement 1000+)
- ✅ Tests passent: 100%

### KPIs Phase 1 (Token Optimization)
- ✅ Tokens AI édition: <500 (actuellement 10,000)
- ✅ Réduction tokens: >95%
- ✅ Taux succès edit_file: >90%
- ✅ Tests coverage: >80%

### KPIs Phase 2 (Active File)
- ✅ Tokens AI (edit actif): <300 (actuellement 1000+)
- ✅ API calls: 1 (actuellement 3-4)
- ✅ Tests passent: 100%

### KPIs Globaux
- ✅ Aucune régression performance
- ✅ Backward compatibility: 100%
- ✅ Documentation complète
- ✅ Zero breaking changes

---

## 🔄 Stratégie de Release

### v1.1.0 - Token Optimization (Recommandé)

**Inclut:**
- Phase 0 (Search fix)
- Phase 1 (edit_file + patch_file)
- Documentation

**Changelog:**
```markdown
## v1.1.0 - Token Optimization (2025-11-XX)

### 🚀 New Features
- **edit_file**: Surgical file editing with pattern matching (98% token reduction)
- **patch_file**: Native structured editing (headings/frontmatter/blocks)
- **write_file**: Added prepend mode

### 🔧 Improvements
- **search**: Now uses native /search/simple/ API (95% faster)
- API calls reduced by 99% for search operations

### 📊 Performance
- Search: 2-3s → 100ms (95% improvement)
- Edit tokens: 10,000 → 200 (98% reduction)

### 🐛 Bug Fixes
- None (pure feature additions)

### ⚠️ Breaking Changes
- None (backward compatible)
```

---

### v1.2.0 - Active File Support (Optionnel)

**Inclut:**
- Phase 2 (Active file tools)

**Changelog:**
```markdown
## v1.2.0 - Active File Support (2025-11-XX)

### 🚀 New Features
- **read_active_file**: Read currently open file (no path needed)
- **edit_active_file**: Edit active file with pattern matching
- **patch_active_file**: Patch structured content in active file
- **write_active_file**: Write to active file with modes

### 📊 Performance
- Active file operations: 50% token reduction (no path lookup needed)
- API calls reduced by 75% for active file workflows

### ⚠️ Breaking Changes
- None (backward compatible)
```

---

### v1.3.0+ - Advanced Features (Futur)

**Inclut:**
- Phase 3 (Partial read, tags, commands, etc.)

**À déterminer** selon feedback utilisateurs

---

## 📝 Checklist Pré-Release

### Code
- [ ] Phase 0: Search fix implémenté
- [ ] Phase 1.1: edit_file implémenté + testé
- [ ] Phase 1.2: patch_file implémenté + testé
- [ ] Phase 1.3: write_file prepend ajouté
- [ ] Tous les tests passent (npm run test)
- [ ] TypeScript compile sans erreurs (npx tsc --noEmit)
- [ ] Aucune régression (tests anciens tools)

### Documentation
- [ ] README.md mis à jour (nouveaux tools)
- [ ] TECHNICAL.md mis à jour (specs API)
- [ ] CHANGELOG.md complété
- [ ] Exemples d'usage ajoutés
- [ ] ROADMAP.md mis à jour (marquer v1.1 comme complété)

### Tests
- [ ] Tests unitaires edit_file (8 tests min)
- [ ] Tests unitaires patch_file (8 tests min)
- [ ] Tests intégration Phase 0+1
- [ ] Tests performance (benchmarks search)
- [ ] Tests backward compatibility

### Quality
- [ ] Code review complet
- [ ] Pas de console.log debug restants
- [ ] Gestion erreurs robuste
- [ ] Messages erreurs clairs pour AI

### Release
- [ ] Version bump package.json
- [ ] Git tag créé
- [ ] npm publish
- [ ] GitHub release notes
- [ ] Annonce communauté (si applicable)

---

## 🔗 Références

### Documentation Obsidian Local REST API
- **OpenAPI Spec:** https://coddingtonbear.github.io/obsidian-local-rest-api/openapi.yaml
- **GitHub Repo:** https://github.com/coddingtonbear/obsidian-local-rest-api
- **Releases:** https://github.com/coddingtonbear/obsidian-local-rest-api/releases

### Versions API Clés
- **v3.2.0** (Mai 2024): /openapi.yaml endpoint
- **v3.1.0** (Mars 2024): Periodic notes dates arbitraires
- **v3.0.1** (Nov 2023): PATCH v2 (heading/block/frontmatter)

### PRs à Surveiller
- **#199** - Tags endpoint (nov 2025) - Attendre merge
- **#195** - HTML rendering (nov 2025) - Évaluer intérêt
- **#191** - File move (oct 2025) - Discussions en cours

### Autres Serveurs MCP (Référence)
- mcp-obsidian: https://github.com/MarkusPfundstein/mcp-obsidian
- obsidian-mcp-rest: https://github.com/PublikPrinciple/obsidian-mcp-rest

---

## 📞 Contact & Questions

Pour questions sur cette implémentation:
1. Créer issue GitHub
2. Référencer ce document: `IMPLEMENTATION_PLAN.md`
3. Taguer avec label approprié: `enhancement`, `question`, `help wanted`

---

**Document Version:** 1.0
**Dernière mise à jour:** 2025-11-14
**Auteur:** Claude (AI Assistant)
**Statut:** ✅ Ready for Implementation
