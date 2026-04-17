# Babloo — Stratégie Marketing Complète

*Date : 15 Mars 2026*
*Version : 1.0*
*Statut : Document de référence*

---

## Table des matières

1. [Product Marketing Context](#1-product-marketing-context)
2. [Analyse du Marché Marocain](#2-analyse-du-marché-marocain)
3. [Positionnement & Messaging](#3-positionnement--messaging)
4. [Direction Artistique (DA)](#4-direction-artistique-da)
5. [Customer Journey Map](#5-customer-journey-map)
6. [Stratégie de Lancement — 5 Phases](#6-stratégie-de-lancement)
7. [Stratégie de Canaux (ORB)](#7-stratégie-de-canaux-orb)
8. [Social Media — Plan Détaillé](#8-social-media)
9. [Content Strategy](#9-content-strategy)
10. [Paid Ads Strategy](#10-paid-ads-strategy)
11. [Email Sequences — Lifecycle Complet](#11-email-sequences)
12. [Programme de Parrainage & Croissance Virale](#12-programme-de-parrainage)
13. [Onboarding & Activation CRO](#13-onboarding--activation-cro)
14. [Rétention & Prévention du Churn](#14-rétention--prévention-du-churn)
15. [Free Tool Strategy](#15-free-tool-strategy)
16. [Pages Concurrentielles](#16-pages-concurrentielles)
17. [Analytics & Tracking Plan](#17-analytics--tracking-plan)
18. [Psychologie Marketing — Playbook](#18-psychologie-marketing)
19. [Budget & Ressources](#19-budget--ressources)
20. [KPIs Dashboard](#20-kpis-dashboard)
21. [Roadmap 90 Jours](#21-roadmap-90-jours)

---

## 1. Product Marketing Context

### One-liner
Babloo est la première marketplace marocaine de services à domicile on-demand — ménage, cuisine, garde d'enfants — avec pricing transparent et négociation in-app.

### Fiche produit

| Élément | Détail |
|---------|--------|
| **Type** | Marketplace B2C two-sided (clients ↔ prestataires) |
| **Services** | Ménage (solo/duo/squad), Cuisine, Garde d'enfants |
| **Monnaie** | MAD (dirhams marocains) |
| **Modèle** | Commission par transaction |
| **Tech stack** | React Native (Expo) + Express + PostgreSQL + Socket.IO |
| **Plateformes** | iOS (TestFlight) + Android (Internal Testing) |
| **Langue principale** | Français (+ arabe, anglais) |
| **Marché initial** | Casablanca |

### Jobs to Be Done

Les clients n'achètent pas du ménage. Ils achètent :
1. **Du temps libre** — "Je veux récupérer mes weekends"
2. **De la tranquillité d'esprit** — "Je veux quelqu'un de fiable chez moi"
3. **Un problème résolu** — "J'ai besoin de ça fait, maintenant"

Les pros ne cherchent pas une app. Ils cherchent :
1. **Des revenus prévisibles** — "Je veux savoir combien je gagne ce mois"
2. **De la dignité professionnelle** — "Je veux être traité comme un vrai professionnel"
3. **De la visibilité** — "Je veux que les gens me trouvent"

### Switching Dynamics (JTBD Four Forces)

| Force | Côté Client | Côté Pro |
|-------|-------------|----------|
| **Push** (ce qui repousse du status quo) | Bouche-à-oreille aléatoire, prix opaques, pas de garantie | Revenus irréguliers, pas de visibilité, dépendance |
| **Pull** (ce qui attire vers Babloo) | Prix transparent, pros vérifiés, booking en 1 tap | Flux de clients constant, paiement garanti, profil pro |
| **Habit** (ce qui retient dans le status quo) | "Ma femme de ménage actuelle est OK" | "Mes clients me connaissent déjà" |
| **Anxiety** (ce qui freine le switch) | "Et si le pro est nul ?" "C'est plus cher ?" | "Et si l'app ne m'envoie pas de clients ?" |

---

## 2. Analyse du Marché Marocain

### Données macro

| Indicateur | Valeur |
|-----------|--------|
| Population urbaine | ~20M (60% de 37M) |
| Pénétration smartphone | ~85% de la population |
| Utilisateurs internet | 33M+ |
| Classe moyenne+ urbaine | ~6-8M personnes |
| Marché services à domicile (estimé) | Non structuré, fragmenté |
| Plateformes existantes | Quasi-inexistantes avec traction |

### Spécificités du marché

**Langue :**
- Le français domine dans le business et la tech (applications, stores)
- La darija (dialecte marocain) domine les conversations, WhatsApp, réseaux sociaux
- L'arabe standard pour le contenu officiel
- **Stratégie linguistique Babloo** : UI en français, communication marketing en français + darija, support trilingue

**Canaux de communication :**
- **WhatsApp** = canal n°1 absolu (99% de la population connectée)
- **Instagram** = réseau social principal pour les 18-40 ans
- **Facebook** = encore massif pour les 30-55 ans
- **TikTok** = en explosion chez les 16-30 ans
- **Twitter/X** = marginal au Maroc
- **LinkedIn** = B2B uniquement

**Confiance :**
- La confiance se construit par la **recommandation personnelle** (bouche-à-oreille)
- Le **rating/avis** est un concept encore nouveau mais en croissance
- Le **paiement en cash** reste dominant — prévoir cash on delivery
- La **vérification d'identité** du pro est un différenciateur énorme

**Pricing context :**
- Femme de ménage informelle : 50-100 MAD/session
- Babloo floor prices : 80-260 MAD (compétitif avec le formel, premium vs informel)
- Perception : la transparence des prix est un avantage, pas un inconvénient

### Personas détaillés

#### Persona 1 : Leila — La mère active

| Attribut | Détail |
|----------|--------|
| Âge | 32 ans |
| Ville | Casablanca (Maarif) |
| Situation | Mariée, 2 enfants, travaille |
| Revenus | 15 000-25 000 MAD/mois (foyer) |
| Smartphone | iPhone, utilise Instagram et WhatsApp |
| Frustration principale | "Je ne trouve pas une nounou de confiance" |
| Comportement actuel | Demande à ses amies, groupes WhatsApp de mamans |
| Babloo value prop | "Pros vérifiés, disponibles maintenant, je peux voir les avis" |
| Trigger d'acquisition | Recommandation d'une amie, post Instagram |
| Objection | "Et si la personne n'est pas bien ? Comment je sais ?" |
| Réponse | Rating system, vérification d'identité, chat avant le service |

#### Persona 2 : Karim — Le jeune professionnel

| Attribut | Détail |
|----------|--------|
| Âge | 28 ans |
| Ville | Casablanca (Ain Diab) |
| Situation | Célibataire, appartement, travaille en tech |
| Revenus | 10 000-18 000 MAD/mois |
| Smartphone | Android, utilise Instagram, TikTok, Reddit |
| Frustration principale | "Je n'ai ni le temps ni le réseau pour trouver quelqu'un" |
| Comportement actuel | Cherche sur Facebook, abandonne, vit dans le désordre |
| Babloo value prop | "Un tap, c'est réservé, prix clair" |
| Trigger d'acquisition | Ad Instagram, TikTok reel before/after |
| Objection | "Combien ça coûte exactement ?" |
| Réponse | Pricing engine transparent, estimation instantanée |

#### Persona 3 : Fatima — La pro du ménage

| Attribut | Détail |
|----------|--------|
| Âge | 45 ans |
| Ville | Casablanca (Hay Mohammadi) |
| Situation | Veuve, 3 enfants, travaille comme femme de ménage |
| Revenus | 3 000-5 000 MAD/mois (irrégulier) |
| Smartphone | Android basique, WhatsApp principalement |
| Frustration principale | "Je n'ai pas assez de clients réguliers" |
| Comportement actuel | Bouche-à-oreille, marche dans les quartiers |
| Babloo value prop | "Des clients qui viennent à moi, paiement garanti" |
| Trigger d'acquisition | Recommandation d'une collègue, recrutement terrain Babloo |
| Objection | "L'app est compliquée, je ne sais pas l'utiliser" |
| Réponse | UX ultra-simple, onboarding assisté en personne, support WhatsApp |

---

## 3. Positionnement & Messaging

### Positionnement

> **Pour** les urbains marocains qui ont besoin de services à domicile fiables,
> **Babloo** est la marketplace mobile
> **qui** connecte en un tap avec des pros vérifiés à prix transparent,
> **contrairement** au bouche-à-oreille et aux groupes Facebook
> **parce que** Babloo offre un pricing engine transparent, une négociation encadrée, un chat in-app, et un système de rating qui construit la confiance.

### Messaging Framework

| Niveau | Message |
|--------|---------|
| **Tagline** | "Babloo gère, toi t'as rien à faire." |
| **Value Prop (1 phrase)** | Des pros vérifiés pour ta maison, disponibles maintenant, à prix transparent. |
| **Elevator pitch (30 sec)** | "Tu connais le galère de trouver une femme de ménage ou un bricoleur de confiance au Maroc ? Babloo c'est l'app qui te connecte en un tap avec des pros vérifiés, avec un prix clair et négociable. Tu réserves, le pro arrive, c'est réglé." |
| **Messaging client** | Fini les galères. En un tap, un pro de confiance est chez toi. |
| **Messaging pro** | Plus de clients, plus de revenus, plus de respect. |

### Tone of Voice

| Dimension | Babloo dit... | Babloo ne dit pas... |
|-----------|--------------|---------------------|
| **Tonalité** | "On s'en occupe" | "Nous sommes le leader" |
| **Registre** | Français accessible, touches darija | Français soutenu, corporate |
| **Émotion** | Chaleur, confiance, simplicité | Urgence artificielle, FOMO |
| **Promesse** | "Pros vérifiés, prix transparent" | "Le moins cher", "Garanti 100%" |
| **Humour** | Léger, situationnel (galères du quotidien) | Sarcastique, forcé |

### Objection Handling

| Objection | Réponse marketing |
|-----------|-------------------|
| "C'est trop cher par rapport au bouche-à-oreille" | "Tu paies pour la fiabilité, la vérification, et la tranquillité. Plus de mauvaises surprises." |
| "Je ne fais pas confiance à des inconnus" | "Chaque pro est vérifié. Tu vois ses avis, tu discutes avant sur le chat." |
| "J'ai déjà ma femme de ménage" | "Garde-la ! Babloo est là quand elle n'est pas disponible ou que tu as besoin de quelqu'un d'autre." |
| "L'app va prendre une commission sur le pro" | "La commission permet d'offrir aux pros plus de clients et un paiement garanti. Tout le monde y gagne." |
| "Je préfère appeler directement" | "Avec Babloo, pas besoin d'appeler. Tu réserves en 30 secondes, on s'occupe du reste." |

---

## 4. Direction Artistique (DA)

### 4.1 Identité visuelle — Système complet

#### Palette de couleurs

| Couleur | Hex | Usage | Émotion |
|---------|-----|-------|---------|
| **Navy** | `#0E1442` | Fond principal, texte, logo | Confiance, sérieux, profondeur |
| **Navy Mid** | `#1C2462` | Éléments secondaires | Subtilité |
| **Clay** | `#C4370D` | CTA, accents, actions | Énergie, chaleur, urgence positive |
| **Clay Light** | `#F0835A` | Hover states, badges | Accessibilité |
| **Clay Tint** | `#FBF0EC` | Backgrounds CTA | Douceur |
| **Background** | `#EDEEF6` | Fond app | Calme, propreté |
| **Surface** | `#FFFFFF` | Cartes, modals | Clarté |
| **Success** | `#1A7A50` | Confirmations, ratings + | Positif |
| **Warning** | `#B06B00` | Alertes douces | Attention |
| **Error** | `#C0392B` | Erreurs, annulations | Alerte |
| **Doré** | `#D4A843` | Fidélité, premium, animations | Aspiration, récompense |

#### Typographie

| Usage | Police | Poids | Taille | Feeling |
|-------|--------|-------|--------|---------|
| Display/Hero | Fraunces | Bold (700) | 26px | Élégance, personnalité, premium |
| H1 | Fraunces | SemiBold (600) | 20px | Autorité |
| H2 | Fraunces | SemiBold (600) | 17px | Structure |
| H3 | DM Sans | Bold (700) | 14px | Fonctionnel |
| Body | DM Sans | Regular (400) | 13px | Lisibilité |
| Label | DM Sans | Bold (700) | 10px | Hiérarchie, uppercase |

**Pourquoi ce combo :**
- **Fraunces** (serif) donne à Babloo une personnalité que les apps concurrentes n'ont pas. C'est pas "juste une app de services" — c'est une marque avec du caractère.
- **DM Sans** (sans-serif) assure la lisibilité de tout le contenu fonctionnel. Moderne, propre, neutre.
- Le contraste serif/sans-serif crée une hiérarchie visuelle naturelle.

#### Logo

- **Forme** : Badge arrondi navy (#0E1442)
- **Icône** : Marteau blanc stylisé
- **Symbolique** : Solidité (le badge), action/service (le marteau), accessibilité (les formes rondes)
- **Déclinaisons nécessaires** :
  - Logo complet (badge + "Babloo" texte)
  - Badge seul (app icon, favicon)
  - Version monochrome (blanc sur fond sombre, navy sur fond clair)
  - Version horizontale (pour headers, bannières)

### 4.2 Recommandations DA — Ce qui manque

#### A. Système d'illustrations

**Style recommandé :** Flat illustrations semi-stylisées
- Palette : navy + clay + doré + surface
- Personnages : traits simples, pas de visages détaillés (pour être universel)
- Diversité : hommes et femmes marocains de tous âges et teints
- Scènes : toujours montrer le **RÉSULTAT** (maison propre, repas servi, enfant souriant)

**Application :**

| Context | Illustration |
|---------|-------------|
| Empty state — pas de commandes | Personnage avec un balai, souriant, attendant |
| Empty state — pas de messages | Bulle de chat avec des étoiles |
| Onboarding slide 1 | Téléphone avec les 3 services |
| Onboarding slide 2 | Pro qui arrive à la porte |
| Onboarding slide 3 | Maison qui brille (résultat) |
| Erreur/maintenance | Marteau + clé à molette en croix, friendly |
| Success/commande terminée | Confettis + check mark navy |
| Store listing | Screenshots avec illustrations overlay |

#### B. Motion Design Guidelines

| Élément | Spécification |
|---------|--------------|
| **Easing standard** | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` |
| **Durée standard** | 200-300ms pour les micro-interactions |
| **Bounce CTA** | Overshoot léger (1.05 scale) puis settle |
| **Transitions écrans** | Slide horizontal (push), 250ms |
| **Modals** | Scale up from 0.95 + fade in, 200ms |
| **Toast notifications** | Slide down from top, 200ms, auto-dismiss 3s |
| **Loading states** | Pulse animation sur le placeholder content |
| **Splash screen** | Animation du marteau (voir prompt Kling 2.1) |
| **Success** | Confettis burst depuis le centre, 1.5s |
| **Pull to refresh** | Marteau qui tape, loop pendant le chargement |

#### C. Direction photographique

| Type | Direction |
|------|-----------|
| **Photos de pros** | Portrait naturel, sourire, en tenue de travail, fond neutre ou en situation |
| **Photos de service** | Mains au travail (pas de visage), gros plans sur le détail du travail bien fait |
| **Photos de résultat** | Avant/après, lumière naturelle, intérieurs marocains modernes |
| **Photos lifestyle** | Famille détendue, jeune pro dans son appart propre, enfant qui joue |
| **Tonalité** | Chaude, lumière naturelle, couleurs saturées mais pas artificielles |
| **À éviter** | Stock photos génériques, photos trop "western", poses artificielles |

#### D. Brand Voice Document

**Principes d'écriture Babloo :**

1. **Parle comme un ami, pas comme une entreprise**
   - ✅ "On s'en occupe, t'inquiète"
   - ❌ "Nous prenons en charge votre demande"

2. **Utilise le "tu", pas le "vous"**
   - L'app tutoie l'utilisateur — c'est plus proche, plus marocain
   - Exception : communications officielles (CGV, factures)

3. **Mélange français + darija quand c'est naturel**
   - ✅ "Kolchi mréglé" dans une story Instagram
   - ✅ "C'est réglé !" dans l'app
   - ❌ Forcer la darija partout

4. **Sois direct, pas verbeux**
   - ✅ "Prix estimé : 130 MAD"
   - ❌ "Votre estimation de prix préliminaire est de 130 MAD"

5. **Célèbre, ne culpabilise pas**
   - ✅ "Bravo ! Ta maison est nickel grâce à Babloo"
   - ❌ "N'oubliez pas de noter votre prestataire"

---

## 5. Customer Journey Map

### Côté Client

```
AWARENESS                    CONSIDERATION              DECISION                    ACTIVATION                  RETENTION
─────────────────────────── ──────────────────────────── ──────────────────────────── ──────────────────────────── ──────────────────────
"J'ai un problème"           "Babloo peut m'aider ?"      "J'essaie"                   "Ça marche !"                "J'y retourne"

Touchpoints :                Touchpoints :                Touchpoints :                Touchpoints :                Touchpoints :
• Reel Instagram             • App Store listing          • Signup (phone + OTP)       • 1ère commande terminée     • Push "Besoin d'un coup
• Recommandation amie        • Screenshots app            • Choix du service           • Rating du pro                de main ?"
• Ad Facebook                • Prix affiché               • Estimation de prix         • Notification de suivi      • Parrainage
• TikTok before/after        • Avis dans le store         • Confirmation               • Email de bienvenue         • Programme fidélité
• Bouche-à-oreille                                        • Chat avec le pro                                        • Saisonnalité (Ramadan,
                                                          • Paiement                                                  rentrée, fêtes)

Émotion :                    Émotion :                    Émotion :                    Émotion :                    Émotion :
😤 Frustration               🤔 Curiosité + méfiance      😬 Anxiété + espoir          😊 Soulagement + surprise    😌 Confiance + habitude

Action marketing :           Action marketing :           Action marketing :           Action marketing :           Action marketing :
Créer la demande             Rassurer + montrer           Réduire la friction          Célébrer + demander          Fidéliser + faire
(content, ads, social)       (social proof, pricing)      (UX, chat, estimation)       (rating, parrainage)         revenir (push, email,
                                                                                                                     fidélité)
```

### Moments de vérité

| Moment | Impact | Action |
|--------|--------|--------|
| **1er contact avec l'app** | Première impression = décision de rester ou partir | Store listing impeccable, screenshots qui montrent la valeur |
| **Estimation de prix** | "C'est combien ?" = question n°1 | Pricing engine instantané, prix clair avant même le signup |
| **1er chat avec un pro** | "Cette personne est-elle fiable ?" | Profil pro complet (photo, avis, badge vérifié), chat rapide |
| **1er service terminé** | "Est-ce que ça valait le coup ?" | Qualité du service + facilité du process = aha moment |
| **Rating post-service** | Moment de satisfaction max = meilleur moment pour le parrainage | CTA parrainage dans l'écran de rating |

---

## 6. Stratégie de Lancement

### Phase 1 — Internal Launch (Semaines 1-2)

**Objectif :** Valider le flow complet avec des utilisateurs friendly

| Action | Détail | KPI |
|--------|--------|-----|
| Recruter 10-15 bêta-testeurs | Amis, famille, réseau — mix clients et pros | 10+ testeurs actifs |
| Tester le flow end-to-end | Signup → Réservation → Chat → Négociation → Service → Rating | 0 bugs critiques |
| Collecter feedback qualitatif | Interviews 15min post-service, formulaire | 10+ feedbacks documentés |
| Fixer les bugs critiques | Priorité : auth, paiement, statut | Tous bugs P0 fixés |

### Phase 2 — Alpha Launch (Semaines 3-4)

**Objectif :** Première validation externe + waitlist

| Action | Détail | KPI |
|--------|--------|-----|
| Landing page Babloo.ma | Headline + vidéo teaser + formulaire waitlist | Page live |
| Waitlist setup | Email + téléphone, "Sois parmi les premiers" | 100+ signups |
| Vidéo teaser 30s | Animation logo + before/after + "Bientôt à Casablanca" | Vidéo prête |
| Compte Instagram | Feed initial 9 posts (branding + teaser + tips) | Compte live, 9 posts |
| SEO basique | Domaine, meta tags, Google My Business | Indexé |
| Ciblage géo | Casablanca uniquement — ne pas diluer | Focus confirmé |

### Phase 3 — Beta Launch (Semaines 5-8)

**Objectif :** Premières transactions réelles

| Action | Détail | KPI |
|--------|--------|-----|
| Recrutement de 10-20 pros | Un par un, vérification d'identité, onboarding en personne | 10+ pros actifs |
| Ouverture à 50-100 clients | Depuis la waitlist, par batch de 20 | 50+ clients inscrits |
| Parrainage WhatsApp basique | Chaque client reçoit un lien de parrainage | Taux de partage |
| Contenu organique Instagram | 3 posts/semaine : before/after, tips, BTS | Engagement rate > 3% |
| Support WhatsApp | Ligne directe pour les premiers clients | Temps de réponse < 30min |
| Collecte témoignages | Après chaque service 4-5 étoiles, demander un témoignage | 10+ témoignages |

### Phase 4 — Early Access (Mois 3)

**Objectif :** Scale contrôlé + début acquisition payante

| Action | Détail | KPI |
|--------|--------|-----|
| Ouvrir par batches 10-20% | Throttle les invitations depuis la waitlist | Activation rate > 40% |
| Instagram/Facebook Ads | 1000-3000 MAD/mois, ciblage Casa, app install | CPI < 15 MAD |
| TikTok content | 3-5 vidéos/semaine : before/after satisfying, "combien ça coûte" | 1 vidéo > 10K vues |
| Micro-influenceurs | 3-5 influenceurs Casa, service gratuit contre story/reel | 3+ collaborations |
| Product-market fit survey | NPS + "Comment vous sentiriez-vous si Babloo n'existait plus ?" | NPS > 40, >40% "très déçu" |
| Métriques dashboard | Mettre en place le tracking complet (voir section 17) | Dashboard live |

### Phase 5 — Full Launch (Mois 4-5)

**Objectif :** Ouverture publique, acquisition à grande échelle

| Action | Détail | KPI |
|--------|--------|-----|
| Store listing optimisé (ASO) | Screenshots, vidéo preview, description optimisée, mots-clés | Conversion rate store > 30% |
| Campagne Social Ads scaled | 5000-10000 MAD/mois, multi-format, retargeting | CPA < 50 MAD |
| PR presse marocaine | Pitch à TelQuel, Médias24, H24Info, Challenge | 3+ articles publiés |
| Programme parrainage complet | In-app, gamifié, WhatsApp optimisé | Referral rate > 15% |
| Expansion géographique | Préparer Rabat (si métriques Casa validées) | Plan Rabat documenté |
| Programme fidélité | LoyaltyTab actif : points, paliers, récompenses | 20% clients inscrits |

---

## 7. Stratégie de Canaux (ORB)

### Owned — Canaux que tu contrôles

| Canal | Rôle | Priorité | Action |
|-------|------|----------|--------|
| **App Babloo** | Produit = premier canal marketing | 🔴 P0 | Onboarding impeccable, push notifications, in-app messaging |
| **Instagram @babloo.ma** | Vitrine de marque, storytelling | 🔴 P0 | Feed daily, stories, reels |
| **Liste WhatsApp Broadcast** | Communication directe, parrainage | 🔴 P0 | Broadcasts ciblés, support |
| **Email list** | Lifecycle, nurture, réactivation | 🟠 P1 | Sequences automatisées |
| **Blog Babloo.ma/blog** | SEO, autorité, contenu evergreen | 🟡 P2 | 2-4 articles/mois |

### Rented — Canaux d'acquisition

| Canal | Rôle | Budget | Timing |
|-------|------|--------|--------|
| **Instagram Ads** | App installs, awareness | 30% du budget ads | Dès Phase 4 |
| **Facebook Ads** | App installs (audience 30+), retargeting | 30% du budget ads | Dès Phase 4 |
| **TikTok Ads** | Awareness, vidéo virale | 20% du budget ads | Phase 5 |
| **Google Ads (Search)** | High-intent ("femme de ménage casablanca") | 15% du budget ads | Phase 5 |
| **App Store / Play Store** | Organic discovery | 5% (ASO invest) | Phase 5 |

### Borrowed — Canaux empruntés

| Canal | Rôle | Coût | Timing |
|-------|------|------|--------|
| **Micro-influenceurs Casa** | Crédibilité + reach | Service gratuit | Phase 4 |
| **Presse marocaine** | Crédibilité + awareness | 0 (earned) | Phase 5 |
| **Blogs/podcasts lifestyle marocains** | SEO + audience qualified | Collaboration | Phase 5 |
| **Partenariats immobilier** | Nouveaux résidents = clients potentiels | Commission | Phase 5+ |
| **Partenariats coworking** | Jeunes pros = persona Karim | Réduction | Phase 5+ |

---

## 8. Social Media

### 8.1 Instagram — Canal principal

**Objectif :** Vitrine de marque + acquisition organique + social proof

**Fréquence :** 1 post/jour + 3-5 stories/jour

**Mix de formats :**

| Format | Fréquence | Objectif |
|--------|-----------|----------|
| **Reels before/after** | 3x/semaine | Viralité, démonstration de valeur |
| **Carrousels tips** | 2x/semaine | Éducation, save + share |
| **Stories daily** | Quotidien | Engagement, BTS, sondages |
| **Posts statiques** | 1x/semaine | Branding, témoignages |
| **Lives** | 1x/mois | Q&A, présentation de pros |

**Calendrier type — Semaine 1 :**

| Jour | Post | Story |
|------|------|-------|
| Lun | Reel : before/after ménage en 30s | Sondage : "Ton appart, propre sur une échelle de 1 à 10 ?" |
| Mar | Carrousel : "5 astuces pour un salon toujours propre" | BTS : team Babloo au bureau |
| Mer | Reel : "Combien ça coûte un ménage avec Babloo ?" | Témoignage client en story |
| Jeu | Post statique : témoignage client + photo résultat | Sondage : "Cuisine maison ou restaurant ?" |
| Ven | Reel : Day-in-the-life d'un pro Babloo | Countdown weekend : "Profite, Babloo gère" |
| Sam | Carrousel : "3 recettes marocaines que nos cuisiniers maîtrisent" | User-generated content repost |
| Dim | Reel : transformation cuisine avant/après | Repos ou repost meilleur contenu semaine |

**Hooks testés et prouvés pour le Maroc :**
- "Personne ne parle de ça au Maroc mais..."
- "Comment j'ai récupéré mes weekends"
- "Combien ça coûte VRAIMENT..."
- "La différence entre un pro Babloo et..."
- "3 ans sans femme de ménage, voilà ce qui s'est passé"

### 8.2 TikTok — Awareness & viralité

**Objectif :** Reach massive, brand awareness, contenu viral

**Fréquence :** 3-5 vidéos/semaine

**Formats gagnants :**

| Format | Potentiel viral | Exemple |
|--------|----------------|---------|
| **Cleaning satisfying** | 🔥🔥🔥 | ASMR nettoyage d'un salon (timelapse) |
| **Before/after transformation** | 🔥🔥🔥 | Split screen avant/après ménage |
| **"Combien ça coûte"** | 🔥🔥 | Prix transparents, réactions |
| **Day in the life** | 🔥🔥 | Journée d'un pro Babloo |
| **Memes darija** | 🔥🔥🔥 | Humor marocain sur le ménage/galères |
| **Reaction format** | 🔥 | Réagir aux pires/meilleurs ménages |

### 8.3 Facebook — Acquisition 30+ & groupes

**Objectif :** Ads ciblées (persona Leila), groupes de mamans

**Actions :**
- Ads app install ciblées femmes 28-45 Casa
- Participation aux groupes de mamans (valeur, pas spam)
- Page Facebook active avec contenu cross-posté depuis Instagram
- Facebook Events pour des opérations spéciales (Ramadan, rentrée)

### 8.4 WhatsApp — Relation client

**Objectif :** Canal n°1 de communication directe

**Actions :**
- **WhatsApp Business** avec catalogue de services
- **Broadcast lists** segmentées (clients actifs, inactifs, pros)
- **Statut WhatsApp** quotidien (tips, promos, BTS)
- **Lien de parrainage** partageable via WhatsApp
- **Support client** via WhatsApp (réponse < 30min)

---

## 9. Content Strategy

### Content Pillars

| Pilier | % | Type | Exemples |
|--------|---|------|----------|
| **Transformations** | 30% | Shareable | Before/after, timelapses, résultats |
| **Tips & Life Hacks** | 25% | Searchable + Shareable | Astuces nettoyage, organisation, recettes |
| **Behind-the-scenes** | 20% | Shareable | Équipe Babloo, recrutement pros, story de la startup |
| **Social Proof** | 15% | Searchable | Témoignages, avis, chiffres, success stories de pros |
| **Product & Promos** | 10% | N/A | Nouvelles features, offres, mises à jour |

### Blog Strategy (Phase 5+)

**Objectif :** SEO + autorité + trafic organique

**Topics prioritaires :**

| Topic | Type | Keyword cible | Buyer Stage |
|-------|------|---------------|-------------|
| "Comment trouver une femme de ménage à Casablanca" | Searchable | femme de ménage casablanca | Awareness |
| "Combien coûte un service de ménage au Maroc" | Searchable | prix ménage maroc | Consideration |
| "Babloo vs bouche-à-oreille : quelle différence ?" | Searchable | services domicile maroc | Decision |
| "10 astuces pour un appartement toujours propre" | Shareable | astuces ménage | Awareness |
| "Guide complet : préparer sa maison pour le Ramadan" | Saisonnier | ménage ramadan maroc | Awareness |
| "Comment devenir pro sur Babloo : guide complet" | Searchable | travailler femme de ménage maroc | Acquisition pro |

---

## 10. Paid Ads Strategy

### Structure de campagnes

```
Compte Meta Ads
├── Campagne 1: App Installs — Broad Casablanca
│   ├── Ad Set: Femmes 25-45 Casa (Persona Leila)
│   │   ├── Reel Before/After Ménage
│   │   ├── Carrousel 3 Services
│   │   └── Vidéo Témoignage Client
│   ├── Ad Set: Hommes 22-35 Casa (Persona Karim)
│   │   ├── Reel "Combien ça coûte"
│   │   ├── Vidéo "Un tap, c'est réglé"
│   │   └── Image Pricing Transparent
│   └── Ad Set: Lookalike — Clients existants
│       ├── Meilleures créas des ad sets ci-dessus
│       └── UGC témoignage
├── Campagne 2: Retargeting — Site/App visitors
│   ├── Ad Set: Visiteurs site 7 derniers jours
│   │   └── Témoignage + CTA "Réserve maintenant"
│   └── Ad Set: App installée, pas de commande
│       └── "Ta première commande t'attend" + code promo
└── Campagne 3: Awareness — Vidéo Views
    └── Ad Set: Broad Casa 18-55
        └── Reel viral before/after (objectif: reach)
```

### Budget recommandé (Phase 4-5)

| Mois | Budget total | Meta Ads | Google Ads | TikTok | ASO |
|------|-------------|----------|------------|--------|-----|
| Mois 3 | 3 000 MAD | 2 000 MAD | 500 MAD | 300 MAD | 200 MAD |
| Mois 4 | 5 000 MAD | 3 000 MAD | 1 000 MAD | 700 MAD | 300 MAD |
| Mois 5 | 8 000 MAD | 4 500 MAD | 1 500 MAD | 1 500 MAD | 500 MAD |
| Mois 6+ | 12 000 MAD | 6 000 MAD | 2 500 MAD | 2 500 MAD | 1 000 MAD |

### KPIs Ads

| Métrique | Cible |
|----------|-------|
| CPI (Cost Per Install) | < 15 MAD |
| CPA (Cost Per First Order) | < 50 MAD |
| CTR | > 1.5% (feed), > 0.5% (stories) |
| ROAS | > 3x sur 90 jours (LTV/CAC) |
| Frequency cap | Max 3x/semaine/personne |

### Ad Copy Templates

**Format PAS (Problem-Agitate-Solve) :**
> "Tu passes ton samedi à nettoyer ? 😤 Pendant que tes amis profitent, toi tu frottes. Avec Babloo, un pro de confiance s'en charge. Toi, tu vis. Réserve en 30 secondes."

**Format Before-After-Bridge :**
> "Avant : 3 heures de ménage chaque weekend. Après : un pro Babloo fait tout en 2h pendant que tu profites. Le pont ? L'app Babloo. Télécharge maintenant."

**Format Social Proof :**
> "250+ services réalisés à Casablanca ce mois. 4.7/5 de moyenne. Leila : 'Enfin une solution fiable pour le ménage.' Essaie Babloo →"

---

## 11. Email Sequences

### Sequence 1 : Welcome (Post-Signup)

| Email | Timing | Sujet | Objectif |
|-------|--------|-------|----------|
| 1 | Immédiat | "Bienvenue sur Babloo 🏠" | Confirmer inscription, expliquer les 3 services |
| 2 | J+1 | "Comment réserver en 30 secondes" | Tutoriel rapide, CTA → 1ère réservation |
| 3 | J+3 | "Leila a réservé hier, voici ce qu'elle en pense" | Social proof, témoignage réel |
| 4 | J+5 | "Ta maison mérite un pro 🔨" | Rappel valeur + code promo 1ère commande (-15 MAD) |
| 5 | J+7 | "Des questions ? On est là" | Support, FAQ, contact WhatsApp |

### Sequence 2 : Post-First-Order

| Email | Timing | Sujet | Objectif |
|-------|--------|-------|----------|
| 1 | Immédiat post-service | "Merci ! Comment c'était ?" | Rappel rating si pas encore fait |
| 2 | J+1 | "Partage Babloo, gagne 20 MAD 💰" | Parrainage, lien WhatsApp personnalisé |
| 3 | J+7 | "Besoin d'un autre coup de main ?" | Re-booking, suggestion de service différent |

### Sequence 3 : Réactivation (Inactifs 30 jours)

| Email | Timing | Sujet | Objectif |
|-------|--------|-------|----------|
| 1 | J+30 | "On ne t'a pas oublié 👋" | Check-in, rappel valeur |
| 2 | J+37 | "Nouveautés Babloo : [feature/promo]" | What's new, raison de revenir |
| 3 | J+45 | "Un petit cadeau pour te retrouver" | Code promo -20 MAD, dernière chance |

### Sequence 4 : Saisonnière

| Événement | Timing | Message |
|-----------|--------|---------|
| **Ramadan** | 2 semaines avant | "Prépare ta maison pour le Ramadan — réserve un ménage en profondeur" |
| **Rentrée scolaire** | 1 semaine avant | "Rentrée tranquille : garde d'enfants + ménage, Babloo gère" |
| **Fêtes (Aïd)** | 1 semaine avant | "Reçois tes invités dans une maison impeccable" |
| **Été** | Début juin | "Appart propre pendant les vacances ? On surveille et on nettoie" |

---

## 12. Programme de Parrainage

### Mécanisme

```
Client A termine une commande notée 4-5★
  └→ Écran rating affiche : "Partage Babloo, gagne 20 MAD"
      └→ Client A partage son lien via WhatsApp
          └→ Client B clique → installe → s'inscrit
              └→ Client B reçoit -20 MAD sur sa 1ère commande
                  └→ Client B termine sa 1ère commande
                      └→ Client A reçoit 20 MAD de crédit
                          └→ Loop ∞
```

### Configuration détaillée

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| Récompense referrer | 20 MAD crédit | ~25% du panier moyen — significatif |
| Récompense referee | -20 MAD sur 1ère commande | Réduit la friction d'essai |
| Mécanique | Double-sided | +25% de conversion vs single-sided |
| Canal principal | WhatsApp | 99% des Marocains l'utilisent |
| Canal secondaire | Code texte (offline) | Pour le bouche-à-oreille en personne |
| Trigger | Après rating 4-5★ | Moment de satisfaction maximum |
| Trigger secondaire | Après 3ème commande | Client fidèle confirmé |
| Cap | 10 parrainages/mois | Anti-abus |
| Expiration crédit | 90 jours | Incite à utiliser |

### Gamification — LoyaltyTab

| Palier | Condition | Récompense |
|--------|-----------|------------|
| 🥉 Bronze | 1 parrainage | Badge "Ambassadeur" |
| 🥈 Silver | 5 parrainages | -10% sur toutes les commandes pendant 1 mois |
| 🥇 Gold | 15 parrainages | -15% permanent + accès prioritaire aux meilleurs pros |

---

## 13. Onboarding & Activation CRO

### Définition de l'activation

| Événement | Type | Impact sur rétention |
|-----------|------|---------------------|
| Signup complété | Acquisition | Baseline |
| 1ère estimation de prix | **Aha moment #1** | Comprend la valeur, voit le prix |
| 1er chat avec un pro | Engagement | Confiance initiée |
| 1ère commande confirmée | Conversion | Engagement financier |
| 1er service terminé + rating | **Aha moment #2** | Confiance validée = rétention |

**North Star Activation :** Signup → 1er service terminé et noté en < 7 jours

### Flow d'onboarding optimisé

```
1. Signup : Phone + OTP (30 sec)
   • Pas de password au signup
   • Pas de champs inutiles
   • "+212" pré-rempli

2. Welcome Screen (5 sec)
   • "Bienvenue [Prénom] 👋"
   • "Babloo gère, toi t'as rien à faire."
   • 3 cartes de services avec illustrations

3. Choix du service (10 sec)
   • 3 cartes visuelles : Ménage, Cuisine, Garde
   • Tap pour sélectionner

4. Configuration rapide (30 sec)
   • Ménage : surface (slider) + type (simple/profond) + team (solo/duo)
   • Cuisine : nombre de personnes
   • Garde : nombre d'enfants + durée

5. Estimation de prix instantanée ← AHA MOMENT #1
   • Prix affiché immédiatement
   • "À partir de X MAD"
   • CTA : "Réserver maintenant"

6. Confirmation + Matching
   • Adresse (géolocalisation)
   • Date et créneau
   • Résumé de la commande

7. Chat avec le pro
   • Discussion pré-service
   • Négociation prix si besoin

8. Service réalisé

9. Rating ← AHA MOMENT #2
   • Étoiles + commentaire optionnel
   • CTA parrainage intégré
```

### Optimisations spécifiques

| Élément | Optimisation | Principe |
|---------|-------------|----------|
| **Signup** | Phone + OTP seulement, pas d'email | Réduire friction (mobile-first Morocco) |
| **Empty states** | Illustrations + CTA clair, pas de page blanche | Guider vers l'action |
| **Prix** | Afficher avant même le signup si possible | Value before commitment |
| **1ère commande** | Code promo -15 MAD via parrainage | Zero-price effect |
| **Après rating** | Animation confettis + "Bravo !" | Célébration = renforcement positif |
| **Push permission** | Demander APRÈS la 1ère commande, pas au signup | Meilleur taux d'opt-in |

### Métriques d'onboarding

| Étape | Cible | Action si en dessous |
|-------|-------|---------------------|
| Signup → Home | 95% | Simplifier le signup |
| Home → Choix service | 60% | Améliorer les cartes de services |
| Choix → Estimation prix | 80% | Réduire les champs de config |
| Estimation → Confirmation | 40% | Travailler le pricing, ajouter social proof |
| Confirmation → Service terminé | 70% | Améliorer le matching, réduire le temps d'attente |
| Service → Rating | 80% | Push notification de rappel |

---

## 14. Rétention & Prévention du Churn

### Signaux de churn (côté client)

| Signal | Risque | Intervention |
|--------|--------|-------------|
| Pas de commande depuis 30 jours | 🟡 Moyen | Push : "Ta maison s'ennuie de Babloo" |
| Pas de commande depuis 60 jours | 🟠 Élevé | Email réactivation + code promo |
| Rating < 3 étoiles | 🔴 Critique | Contact support en 24h, offre de reservice gratuit |
| App désinstallée | 🔴 Critique | Email win-back, SMS |
| Commande annulée 2x de suite | 🟠 Élevé | Appel support pour comprendre le problème |

### Rétention proactive

| Trigger | Action | Canal |
|---------|--------|-------|
| 7 jours sans activité | "Besoin d'un coup de main cette semaine ?" | Push notification |
| 14 jours sans activité | Rappel valeur + témoignage | Email |
| 30 jours sans activité | Code promo -20 MAD | Email + SMS |
| Après un rating 5★ | Demande de parrainage | In-app + WhatsApp |
| Après 5 commandes | "Tu es un client fidèle ! Voici ton badge 🥉" | In-app + email |
| Saisonnalité | Push contextuel (Ramadan, rentrée, fêtes) | Push + email |

### Programme de fidélité (LoyaltyTab)

| Palier | Commandes | Avantages |
|--------|-----------|-----------|
| 🌱 Nouveau | 0-2 | -15 MAD sur 1ère commande (parrainage) |
| ⭐ Régulier | 3-9 | -5% sur chaque commande |
| 💎 Fidèle | 10-24 | -10% + pros prioritaires |
| 👑 VIP | 25+ | -15% + support prioritaire + accès exclusif |

---

## 15. Free Tool Strategy

### Outil gratuit recommandé : "Simulateur de Prix Babloo"

**Concept :** Un widget web (Babloo.ma/prix) où n'importe qui peut estimer le coût d'un service SANS s'inscrire.

| Critère | Score /5 |
|---------|----------|
| Demande de recherche (search demand) | 4 — "prix ménage maroc", "combien coûte femme de ménage" |
| Audience match avec les acheteurs | 5 — Exactement la cible |
| Unicité vs existant | 5 — Rien de comparable au Maroc |
| Chemin naturel vers le produit | 5 — "Réserve maintenant" en bas du résultat |
| Faisabilité | 5 — Le pricing engine existe déjà dans packages/shared |
| Maintenance | 5 — Zéro maintenance (même engine que l'app) |
| Potentiel de liens | 3 — Blogs lifestyle pourraient linker |
| Partageabilité | 4 — "Regarde combien ça coûte" → WhatsApp |
| **Total** | **36/40** — Candidat très fort |

**Implémentation :**
1. Page web simple : sélection service → config → prix affiché instantanément
2. Lead capture optionnel : "Reçois ton estimation par WhatsApp"
3. CTA : "Réserve ce service sur l'app Babloo"
4. SEO : cibler "prix ménage casablanca", "combien coûte garde d'enfants maroc"

---

## 16. Pages Concurrentielles

### Pages à créer (Phase 5+)

| Page | URL | Keyword cible | Priorité |
|------|-----|---------------|----------|
| "Babloo vs Groupes Facebook" | /compare/babloo-vs-facebook | services domicile facebook maroc | 🔴 P0 |
| "Babloo vs Bouche-à-oreille" | /compare/babloo-vs-bouche-a-oreille | trouver femme de ménage maroc | 🔴 P0 |
| "Babloo vs Agences" | /compare/babloo-vs-agences | agence ménage casablanca | 🟠 P1 |
| "Meilleures alternatives aux groupes WhatsApp" | /alternatives/groupes-whatsapp | alternative whatsapp services maison | 🟡 P2 |

### Structure type (Babloo vs Groupes Facebook)

1. Pourquoi les gens cherchent des services sur Facebook (valider leur expérience)
2. Les limites : pas de vérification, arnaques, prix opaques, pas de suivi
3. Babloo : la solution structurée (pricing, chat, rating, vérification)
4. Tableau comparatif détaillé
5. Témoignage d'un client qui est passé de Facebook à Babloo
6. CTA : "Essaie Babloo gratuitement"

---

## 17. Analytics & Tracking Plan

### Events essentiels

| Event | Properties | Trigger |
|-------|-----------|---------|
| `app_opened` | source, first_open | App lancée |
| `signup_started` | method (phone/email) | Écran signup affiché |
| `signup_completed` | method, referral_code | Signup terminé |
| `service_selected` | service_type | Tap sur un service |
| `price_estimated` | service_type, price, surface/guests/children | Prix affiché |
| `order_created` | service_type, price, city | Commande confirmée |
| `chat_message_sent` | order_id, sender_type | Message envoyé |
| `offer_created` | order_id, amount, sender | Offre de prix envoyée |
| `offer_accepted` | order_id, final_price | Prix verrouillé |
| `order_completed` | order_id, duration, final_price | Service terminé |
| `rating_submitted` | order_id, stars, has_comment | Rating soumis |
| `referral_shared` | channel (whatsapp/sms/copy) | Lien de parrainage partagé |
| `referral_converted` | referrer_id, referee_id | Filleul a terminé sa 1ère commande |
| `push_permission_granted` | - | Push autorisé |
| `push_notification_opened` | notification_type | Push cliqué |

### Funnels à tracker

**Funnel d'acquisition :**
```
Store Visit → Install → Signup → 1er Service → Rating → Parrainage
100%          60%       80%      40%           70%      15%
```

**Funnel de commande :**
```
Home → Service Selection → Config → Price Estimate → Confirm → Chat → Complete
100%   60%                 80%      85%              50%       90%    80%
```

### Outils recommandés

| Outil | Usage | Priorité |
|-------|-------|----------|
| **Mixpanel** ou **PostHog** | Product analytics, funnels, retention | 🔴 P0 |
| **Meta Pixel** | Attribution ads Facebook/Instagram | 🔴 P0 |
| **Google Analytics 4** | Web analytics (landing page, blog) | 🟠 P1 |
| **Adjust** ou **AppsFlyer** | Attribution mobile (multi-canal) | 🟡 P2 |

---

## 18. Psychologie Marketing — Playbook

### Principes appliqués à chaque étape

| Étape | Principe | Application concrète |
|-------|----------|---------------------|
| **Store listing** | Social Proof | "500+ services réalisés" dans la description |
| **Store listing** | Authority | "Pros vérifiés" + badge de confiance |
| **Onboarding** | Activation Energy | Phone + OTP seulement, rien d'autre |
| **Home screen** | Paradox of Choice | 3 services seulement, pas de surcharge |
| **Estimation prix** | Anchoring | Montrer le prix estimé AVANT la négociation |
| **Estimation prix** | Framing | "À partir de 80 MAD" (pas "80-200 MAD") |
| **Estimation prix** | Mental Accounting | "Moins cher qu'un restau" (pour Cuisine) |
| **Confirmation** | Loss Aversion | "Pro disponible maintenant — ne le perds pas" |
| **Chat** | IKEA Effect | Le client investit du temps → plus engagé |
| **Négociation** | Contrast Effect | Floor price vs ceiling → le milieu semble raisonnable |
| **Attente du pro** | Goal-Gradient | Timeline de statut avec barre de progression |
| **Rating** | Peak-End Rule | Dernière interaction = rating → rendre ce moment mémorable |
| **Post-service** | Endowment Effect | "Tu as 20 MAD de crédit" (c'est LEUR argent) |
| **Parrainage** | Reciprocity | "Babloo t'a aidé → aide un ami" |
| **Parrainage** | Zero-Price Effect | "Ta prochaine commande -20 MAD" (presque gratuit) |
| **Réactivation** | Mere Exposure | Push réguliers pour rester top-of-mind |
| **Fidélité** | Commitment & Consistency | Paliers → une fois Bronze, on veut Silver |
| **Fidélité** | Mimetic Desire | "Rejoins les 50 clients Gold de Casablanca" |

---

## 19. Budget & Ressources

### Budget marketing — 6 premiers mois

| Poste | Mois 1-2 | Mois 3 | Mois 4 | Mois 5 | Mois 6 | Total |
|-------|----------|--------|--------|--------|--------|-------|
| Domaine + hébergement web | 500 | 0 | 0 | 0 | 0 | 500 |
| Création contenu (photo/vidéo) | 1 000 | 500 | 500 | 500 | 500 | 3 000 |
| Social Ads (Meta/TikTok/Google) | 0 | 3 000 | 5 000 | 8 000 | 12 000 | 28 000 |
| Influenceurs | 0 | 0 | 1 000 | 2 000 | 2 000 | 5 000 |
| Crédits parrainage | 0 | 500 | 1 000 | 2 000 | 3 000 | 6 500 |
| Outils (analytics, email) | 0 | 500 | 500 | 500 | 500 | 2 000 |
| Design (illustrations, motion) | 2 000 | 1 000 | 500 | 500 | 500 | 4 500 |
| **Total** | **3 500** | **5 500** | **8 500** | **13 500** | **18 500** | **49 500** |

**Total 6 mois :** ~50 000 MAD (~4 600€)

### Ressources humaines nécessaires

| Rôle | Profil | Quand | Temps |
|------|--------|-------|-------|
| **Fondateur / Marketing lead** | Toi | Dès maintenant | Full-time |
| **Community manager** | Freelance Casa, bilingue FR/darija | Phase 3 | Part-time (2-3h/jour) |
| **Créateur contenu** | Vidéaste/photographe freelance | Phase 3 | 2 jours/mois |
| **Recruteur terrain (pros)** | Opérationnel sur Casa | Phase 3 | Part-time |
| **Growth marketer** | Freelance ou agence locale | Phase 4-5 | Part-time |

---

## 20. KPIs Dashboard

### North Star Metric
**Nombre de services complétés par semaine**

C'est la métrique qui capture tout : acquisition, activation, rétention, satisfaction, qualité.

### Dashboard de suivi

| Catégorie | Métrique | Cible M3 | Cible M6 | Cible M12 |
|-----------|----------|----------|----------|-----------|
| **Acquisition** | Waitlist signups | 500 | — | — |
| **Acquisition** | App installs/mois | 200 | 1 000 | 5 000 |
| **Acquisition** | CAC (ads) | < 50 MAD | < 40 MAD | < 30 MAD |
| **Activation** | Signup → 1ère commande | 35% | 45% | 50% |
| **Activation** | Time to first booking | < 10 min | < 5 min | < 3 min |
| **Engagement** | Services/semaine | 20 | 100 | 500 |
| **Engagement** | Messages/commande | 5+ | 5+ | 3+ (efficacité) |
| **Rétention** | Repeat rate 30 jours | 25% | 35% | 45% |
| **Rétention** | NPS | > 40 | > 50 | > 60 |
| **Referral** | Referral rate | 10% | 15% | 20% |
| **Revenue** | GMV/mois | 10 000 MAD | 80 000 MAD | 500 000 MAD |
| **Revenue** | Commission/mois | 1 500 MAD | 12 000 MAD | 75 000 MAD |
| **Qualité** | Rating moyen | 4.0+ | 4.3+ | 4.5+ |
| **Qualité** | Taux d'annulation | < 15% | < 10% | < 5% |
| **Supply** | Pros actifs | 15 | 50 | 200 |

---

## 21. Roadmap 90 Jours

### Semaine 1-2 : Foundation

- [ ] Acheter domaine Babloo.ma
- [ ] Créer compte Instagram @babloo.ma
- [ ] Préparer 9 posts feed initial (grid planning)
- [ ] Développer landing page waitlist
- [ ] Créer vidéo teaser 30s (animation logo + concept)
- [ ] Configurer WhatsApp Business
- [ ] Recruter 10 bêta-testeurs (réseau personnel)

### Semaine 3-4 : Alpha

- [ ] Lancer landing page + waitlist
- [ ] Publier les 9 premiers posts Instagram
- [ ] Commencer les stories quotidiennes
- [ ] Tester le flow complet avec les bêta-testeurs
- [ ] Collecter et documenter les feedbacks
- [ ] Fixer tous les bugs critiques
- [ ] Préparer le matériel de recrutement des pros

### Semaine 5-6 : Beta Prep

- [ ] Recruter les 10 premiers pros (terrain, Casablanca)
- [ ] Onboarder chaque pro en personne
- [ ] Inviter les 50 premiers clients depuis la waitlist
- [ ] Lancer le parrainage WhatsApp basique
- [ ] Produire 3 reels before/after
- [ ] Créer le simulateur de prix web (free tool)

### Semaine 7-8 : Beta Live

- [ ] Premières transactions réelles
- [ ] Support WhatsApp actif (réponse < 30min)
- [ ] Collecter les premiers témoignages (rating 4-5★)
- [ ] Publier 3 posts/semaine + stories quotidiennes
- [ ] Analyser les métriques : activation, NPS, repeat
- [ ] Itérer sur le produit selon les feedbacks

### Semaine 9-10 : Early Access

- [ ] Ouvrir par batches de 20% depuis la waitlist
- [ ] Lancer les premiers Instagram Ads (1 000 MAD test)
- [ ] Contacter 3 micro-influenceurs Casa
- [ ] Lancer la séquence email welcome
- [ ] Commencer le contenu TikTok (3 vidéos/semaine)
- [ ] PMF survey : "Comment te sentirais-tu si Babloo n'existait plus ?"

### Semaine 11-12 : Scale

- [ ] Analyser les résultats ads, optimiser les créas gagnantes
- [ ] Scale le budget ads (3 000 MAD/mois)
- [ ] Publier les premières pages comparatives (Babloo vs Facebook)
- [ ] Recruter 10 pros supplémentaires
- [ ] Préparer le store listing ASO pour le full launch
- [ ] Planifier le full launch (PR, ads scaled, programme fidélité)

---

## Annexes

### A. Calendrier saisonnier Maroc

| Période | Opportunité marketing | Action |
|---------|----------------------|--------|
| **Ramadan** (fév-mars) | Grand ménage pré-Ramadan + cuisine ftour | Campagne "Prépare ta maison" |
| **Aïd el-Fitr** | Réception des invités | "Maison impeccable pour l'Aïd" |
| **Été** (juin-août) | Vacances, appartements vides | "On surveille ta maison" |
| **Rentrée** (sept) | Reprise, garde d'enfants | "Rentrée zen avec Babloo" |
| **Aïd el-Adha** | Grand ménage post-Aïd | "On nettoie après l'Aïd" |
| **Fin d'année** (déc) | Réceptions, invités | "Reçois comme un roi" |

### B. Glossaire marketing Babloo

| Terme | Définition Babloo |
|-------|------------------|
| **Pro** | Prestataire de services inscrit sur Babloo |
| **Service** | Une prestation réservée (ménage, cuisine, garde) |
| **Estimation** | Prix calculé par le pricing engine |
| **Négociation** | Échange de prix entre client et pro (floor → ceiling) |
| **Floor** | Prix minimum (calculé automatiquement) |
| **Ceiling** | Prix maximum (floor × 2.5) |
| **Squad** | Équipe de 3+ personnes pour les grands ménages |
| **Deep clean** | Nettoyage en profondeur (× 1.35) |

---

*Document généré le 15 Mars 2026. À mettre à jour chaque mois.*
