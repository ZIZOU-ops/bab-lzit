# V2 First Fixes — Codex Prompts

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 6 V2 issues across auth, pro-accept flow, chat agreement, tracking, pro history, and icons.

**Architecture:** Monorepo (pnpm) — `apps/mobile` (Expo/React Native), `apps/api` (Express/Prisma), `packages/shared` (types/validation/FSM). Socket.IO for real-time, Expo push notifications, PostgreSQL on Railway.

**Tech Stack:** React Native 0.83, Expo 55, React Navigation, React Query, Socket.IO, Prisma 6, Zod, Lucide React Native (new for icons).

---

## Ordre d'execution

1. **Theme A** — Fix Auth (2 prompts) — branche `v2/fix-auth-case-sensitivity`
2. **Theme B** — Pro Accept Flow (3 prompts) — branche `v2/pro-accept-flow`
3. **Theme C** — Chat Agreement + Tracking (4 prompts) — branche `v2/chat-agreement-tracking`
4. **Theme D** — Pro History (1 prompt) — branche `v2/pro-history-rating`
5. **Theme E** — Icons Premium (2 prompts) — branche `v2/icons-premium`
6. **Theme F** — Notifications enrichies (1 prompt) — branche `v2/enriched-notifications`

---

## THEME A : Fix Auth Case Sensitivity

### Prompt A1 — API: Email case-insensitive login/signup

**Branche:** `v2/fix-auth-case-sensitivity`
**A donner a Codex:**

```
Contexte: Monorepo pnpm. L'API backend est dans apps/api. L'authentification par email est case-sensitive, ce qui fait que "Client1@babloo.test" ne trouve pas l'utilisateur "client1@babloo.test".

Objectif: Rendre le login et signup email case-insensitive.

Fichier a modifier: apps/api/src/services/auth.service.ts

Modifications:
1. Dans la fonction login() (ligne 70), normaliser l'email en lowercase avant le lookup:
   - Ajouter: const normalizedEmail = email.toLowerCase().trim();
   - Changer le findUnique pour utiliser normalizedEmail au lieu de email

2. Dans la fonction signup() (ligne 42-44), normaliser l'email en lowercase:
   - Ajouter: const normalizedEmail = input.email ? input.email.toLowerCase().trim() : undefined;
   - Utiliser normalizedEmail pour le findUnique de duplication ET pour la creation du user

Contraintes:
- Ne PAS toucher aux fonctions OTP (otpRequest, otpVerify) car elles utilisent le phone, pas l'email
- Ne PAS toucher a la logique de refresh/logout
- Garder la meme structure de code
- Ne PAS ajouter de nouvelle dependance

Criteres de validation:
- login("Client1@babloo.test", "password123") doit fonctionner si l'utilisateur est enregistre avec "client1@babloo.test"
- signup avec "Test@Email.COM" doit stocker "test@email.com" en base
- Les tests existants doivent continuer a passer

Commit message: "fix(api): normalize email to lowercase for case-insensitive auth"
```

---

### Prompt A2 — Mobile: Disable auto-capitalize on email inputs

**Branche:** `v2/fix-auth-case-sensitivity` (meme branche)
**A donner a Codex:**

```
Contexte: Monorepo pnpm. L'app mobile est dans apps/mobile. Le composant Input (apps/mobile/src/components/Input.tsx) ne forward pas la prop autoCapitalize au TextInput natif. Du coup, iOS met automatiquement la premiere lettre en majuscule dans les champs email.

Objectif: Ajouter le support de autoCapitalize dans le composant Input, et l'utiliser sur tous les champs email de l'app.

Fichiers a modifier:

1. apps/mobile/src/components/Input.tsx
   - Ajouter autoCapitalize dans l'interface InputProps: autoCapitalize?: TextInputProps['autoCapitalize']
   - Passer autoCapitalize au TextInput interne (ligne 43-56)

2. apps/mobile/src/screens/auth/SignInEmailScreen.tsx
   - Sur le composant Input pour l'email (ligne 64-71), ajouter: autoCapitalize="none"

3. apps/mobile/src/screens/auth/SignUpEmailScreen.tsx
   - Sur le composant Input pour l'email (ligne 80-87), ajouter: autoCapitalize="none"

Contraintes:
- Ne PAS modifier ForgotPasswordScreen.tsx car il utilise un champ telephone, pas email
- Ne PAS modifier le style ou le layout
- Ne PAS ajouter de validation email cote mobile
- La prop autoCapitalize doit etre optionnelle (undefined par defaut = comportement natif par defaut)

Criteres de validation:
- Sur l'ecran de login, le clavier ne doit PAS mettre de majuscule au premier caractere du champ email
- Sur l'ecran de signup, idem pour le champ email
- Le champ "Nom complet" en signup doit toujours avoir l'auto-capitalize par defaut (premiere lettre majuscule)
- L'app compile sans erreur

Commit message: "fix(mobile): disable auto-capitalize on email input fields"
```

---

## THEME B : Pro Accept Flow

### Prompt B1 — API: Endpoint de confirmation d'assignment par la pro

**Branche:** `v2/pro-accept-flow` (creer depuis v2)
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Backend dans apps/api. Actuellement quand le systeme matche une pro a une commande, un OrderAssignment est cree avec status "assigned". Mais il n'y a pas d'endpoint pour que la pro confirme explicitement l'assignment. Le endpoint POST /pro/assignments/:assignmentId/decline existe deja dans apps/api/src/routes/pro.routes.ts (ligne 562-606).

Objectif: Ajouter un endpoint POST /v1/pro/assignments/:assignmentId/confirm qui permet a la pro de confirmer son assignment, et qui envoie une push notification au client.

Fichier a modifier: apps/api/src/routes/pro.routes.ts

Ajouter AVANT le block "POST /v1/pro/assignments/:assignmentId/decline" (ligne 562):

Nouveau endpoint:
- Route: POST /v1/pro/assignments/:assignmentId/confirm
- Parse assignmentId avec le schema existant assignmentIdSchema
- Trouver le professional via userId
- Trouver l'assignment par ID, verifier que professionalId === professional.id
- Verifier que l'order est en status "negotiating" et l'assignment en status "assigned"
- Mettre a jour l'assignment: status = "confirmed", confirmedAt = new Date()
- Envoyer une push notification au client via notificationService.sendPushNotification():
  - title: "Professionnelle trouvee!"
  - body: "Une professionnelle a accepte votre demande"
  - data: { type: "offer", orderId: order.id }
  (il faut importer notificationService depuis '../services/notification.service')
- Retourner { data: updated }

Fichier a modifier aussi: apps/api/src/services/notification.service.ts
- Ajouter une nouvelle fonction exportee:
  export async function notifyProAccepted(orderId: string, clientUserId: string, proName: string)
  - Appelle sendPushNotification(clientUserId, "Professionnelle trouvee!", `${proName} a accepte votre demande`, { type: "offer", orderId })

Contraintes:
- Reutiliser les patterns existants (asyncHandler, assignmentIdSchema, AppError, memes patterns que le decline)
- Ne PAS modifier les endpoints existants
- Le pattern doit etre coherent avec le reste du fichier
- Ne PAS toucher au schema Prisma

Criteres de validation:
- POST /v1/pro/assignments/:assignmentId/confirm avec un JWT pro valide doit:
  - Retourner 200 avec l'assignment confirme
  - Mettre a jour le status en "confirmed" en base
  - Envoyer une push au client
- Doit retourner 404 si l'assignment n'existe pas
- Doit retourner 409 si l'assignment n'est pas en status "assigned"
- Doit retourner 403 si ce n'est pas la pro assignee

Commit message: "feat(api): add POST /pro/assignments/:id/confirm endpoint with push notification"
```

---

### Prompt B2 — Mobile: Mutation + bouton Accepter cote pro

**Branche:** `v2/pro-accept-flow`
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Mobile dans apps/mobile. Actuellement dans OffersScreen.tsx (apps/mobile/src/screens/pro/OffersScreen.tsx), le bouton "Accepter" (ligne 301-304) navigue directement vers le chat sans appeler le backend. Il faut qu'il appelle d'abord le nouvel endpoint de confirmation, puis navigue vers le chat.

Objectif: Creer la mutation de confirmation et l'integrer dans le bouton "Accepter" de OffersScreen.

Fichier a creer: apps/mobile/src/services/mutations/proConfirmAssignment.ts

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface ConfirmAssignmentInput {
  assignmentId: string;
}

export function useConfirmAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId }: ConfirmAssignmentInput) => {
      const res = await api.post(`/pro/assignments/${assignmentId}/confirm`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

Fichier a modifier: apps/mobile/src/screens/pro/OffersScreen.tsx

Modifications:
1. Importer useConfirmAssignment depuis '../../services/mutations/proConfirmAssignment'
2. Dans le composant OffersScreen, ajouter: const confirmAssignment = useConfirmAssignment();
3. Remplacer le bouton "Accepter" dans le renderItem (ligne 301-304). Actuellement il fait:
   onPress={() => nav.navigate('Chat', { orderId: item.id })}

   Le remplacer par:
   onPress={() => {
     confirmAssignment.mutate(
       { assignmentId: item.assignmentId },
       {
         onSuccess: () => {
           nav.navigate('Chat', { orderId: item.id });
         },
         onError: (err: any) => {
           Alert.alert('Erreur', err?.response?.data?.error?.message ?? 'Impossible d\'accepter.');
         },
       },
     );
   }}
   loading={confirmAssignment.isPending}

Contraintes:
- Ne PAS modifier la structure du FlatList ou des filtres
- Ne PAS toucher au tab "Equipes" ou au bouton "Rejoindre"
- Garder le bouton "Voir details" en dessous intact
- Pattern identique au decline existant dans proAssignment.ts

Criteres de validation:
- Quand la pro appuie sur "Accepter", un appel API est fait
- Si succes: navigation vers le chat
- Si erreur: Alert affichee
- Loading spinner pendant l'appel
- L'app compile sans erreur

Commit message: "feat(mobile): wire pro Accept button to confirm assignment endpoint"
```

---

### Prompt B3 — Mobile: Ameliorer la SearchScreen client avec attente realiste

**Branche:** `v2/pro-accept-flow`
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Mobile dans apps/mobile. Le SearchScreen.tsx (apps/mobile/src/screens/booking/SearchScreen.tsx) a deja une animation de recherche (spinner, barre de progression, 3 phases de texte). Mais la barre progresse sur 10s et timeout immediatement. Le probleme: la pro doit d'abord confirmer (cote pro) avant que le status passe a "negotiating". Il faut une phase d'attente plus longue et realiste.

Objectif: Ameliorer SearchScreen pour avoir 2 phases:
- Phase 1 "Recherche" (10s): l'animation actuelle — le systeme cherche une pro disponible
- Phase 2 "Attente d'acceptation" (illimitee, polling): la pro a ete assignee mais n'a pas encore confirme. Afficher un message different et continuer a poll.

Fichier a modifier: apps/mobile/src/screens/booking/SearchScreen.tsx

Modifications:

1. Changer le state `phase` pour avoir 3 valeurs: 'searching' | 'waiting' | 'results'

2. Ajouter un nouveau tableau de statuts pour la phase waiting:
   const WAITING_STATUS = [
     'En attente d\'une professionnelle…',
     'Votre demande a ete transmise…',
     'Nous attendons sa confirmation…',
   ];

3. Quand le polling detecte que l'order a des assignments mais que le status n'est pas encore "negotiating":
   - Passer en phase 'waiting'
   - Afficher une UI differente: icone check (pas spinner), texte "Professionnelle trouvee!", sous-texte "En attente de sa confirmation..."
   - Continuer a cycler les WAITING_STATUS
   - Ne PAS afficher le timeout

4. Quand le status passe a "negotiating": passer en phase 'results' (comportement actuel)

5. Augmenter le timeout de 10s a 60s pour la phase searching. Ne jamais timeout pendant la phase waiting.

6. Pour la phase 'waiting', afficher:
   - Un cercle avec un CheckIcon vert (importer depuis ../../components) au lieu du spinner
   - Le titre "Professionnelle trouvee!"
   - Le sous-titre "En attente de sa confirmation..."
   - La barre de progression remplie a 100% (statique)
   - Le texte de status qui cycle entre les WAITING_STATUS

Contraintes:
- Ne PAS modifier la phase 'results' (affichage de la pro trouvee)
- Garder le polling toutes les 2s
- Garder la detection de l'order.status === 'negotiating' pour la transition finale
- Garder toute la logique de navigation existante
- Ne PAS ajouter de nouvelle dependance

Criteres de validation:
- Phase 1 (searching): spinner + barre qui avance pendant 10s + textes qui cyclent
- Si une assignment existe mais status pas encore "negotiating": transition vers phase 2
- Phase 2 (waiting): check vert + "Professionnelle trouvee!" + poll continu
- Quand le status passe a "negotiating": transition vers results avec la carte de la pro
- Timeout seulement en phase 1 (60s), jamais en phase 2
- L'app compile sans erreur

Commit message: "feat(mobile): add realistic waiting phase to SearchScreen"
```

---

## THEME C : Chat Agreement + Suivi Realiste

### Prompt C1 — Mobile: Message systeme d'accord + bouton Suivi dans le Chat

**Branche:** `v2/chat-agreement-tracking` (creer depuis v2)
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Mobile dans apps/mobile. Le ChatScreen.tsx (apps/mobile/src/screens/chat/ChatScreen.tsx) affiche les messages et la barre de negociation. Quand un prix est accepte (offer:accepted via socket), le status de l'order passe a "accepted" et la NegotiationBar disparait (car isNegotiating passe a false). Mais aucun message systeme n'apparait, et il n'y a pas de bouton pour aller vers le suivi.

Objectif: Quand l'order passe a "accepted" (prix valide), afficher:
1. Un message systeme dans le chat: "Vous vous etes mis d'accord sur le prix de [prix] dhs"
2. Un bouton "Continuer vers le Suivi" qui navigue vers StatusTracking

Fichier a modifier: apps/mobile/src/screens/chat/ChatScreen.tsx

Modifications:

1. Detecter quand l'order est en status 'accepted'. Ajouter:
   const isAccepted = order?.status === 'accepted';
   const agreedPrice = order?.finalPrice;

2. Dans le FlatList, ajouter un ListHeaderComponent (affiche en haut de la liste inversee, donc en bas visuellement). Si isAccepted et agreedPrice:
   - Afficher un bloc style "message systeme" (centré, fond colors.successBg, bordure colors.success, coins arrondis 12px):
     - Icone CheckIcon (size 20, color colors.success)
     - Texte: "Vous vous etes mis d'accord sur le prix de {agreedPrice} dhs" (bold, colors.navy, 13px, centre)
   - En dessous, un bouton (style similaire au Button primary mais plus petit):
     - Label: "Continuer vers le Suivi"
     - onPress: naviguer vers StatusTracking avec params { orderId }
     - Style: fond colors.navy, texte blanc, borderRadius full, paddingVertical 10, paddingHorizontal 20

3. Ajouter l'import de CheckIcon depuis '../../components'

4. Ajouter les styles:
   - systemMessage: alignSelf 'center', backgroundColor colors.successBg (utiliser la meme fonction withAlpha si besoin: withAlpha(colors.success, 0.1)), borderWidth 1, borderColor withAlpha(colors.success, 0.3), borderRadius 12, padding 16, alignItems 'center', gap 8, marginVertical 12, maxWidth '85%'
   - systemMessageText: fontFamily 'DMSans_600SemiBold', fontSize 13, color colors.navy, textAlign 'center'
   - continueButton: backgroundColor colors.navy, borderRadius 999, paddingVertical 10, paddingHorizontal 20, marginTop 8
   - continueButtonText: color colors.white (ou colors.surface), fontFamily 'DMSans_700Bold', fontSize 13

Contraintes:
- Ne PAS modifier le rendu des messages normaux (bulles)
- Ne PAS modifier la NegotiationBar
- Ne PAS modifier la logique socket
- Le message systeme doit apparaitre SEULEMENT quand order.status === 'accepted' et order.finalPrice existe
- Navigation: utiliser nav.navigate('StatusTracking', { orderId }) — verifier que cette route existe dans OrdersStack

Criteres de validation:
- Quand le prix est accepte, un message systeme vert apparait dans le chat
- Le message affiche le prix convenu
- Le bouton "Continuer vers le Suivi" navigue vers StatusTracking
- Si l'order n'est pas encore accepted, rien n'apparait
- L'app compile sans erreur

Commit message: "feat(mobile): show agreement message and tracking button in chat"
```

---

### Prompt C2 — API: Service de simulation realiste des etapes de suivi

**Branche:** `v2/chat-agreement-tracking`
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Backend dans apps/api. Quand une offre est acceptee, l'order passe en status "accepted". Ensuite la pro doit manuellement changer les statuts (en_route, in_progress, completed) via le bouton dans ProOrderDetailScreen. Pour la V2 demo, on veut une simulation automatique avec des delais realistes.

Objectif: Creer un service de simulation qui, apres que l'order passe en "accepted", programme les transitions automatiques avec des delais de ~2 minutes entre chaque etape.

Fichier a creer: apps/api/src/services/simulation.service.ts

```typescript
import { prisma } from '../db';
import { isValidTransition } from '@babloo/shared';
import * as notificationService from './notification.service';

// Durees en millisecondes entre chaque etape
const STEP_DELAYS = {
  accepted_to_en_route: 2 * 60 * 1000,    // 2 min
  en_route_to_in_progress: 2 * 60 * 1000,  // 2 min
  in_progress_to_completed: 2 * 60 * 1000, // 2 min
};

// Store des timers actifs (orderId -> timeout[])
const activeSimulations = new Map<string, NodeJS.Timeout[]>();

export function startSimulation(orderId: string, scheduledStartAt?: Date | null) {
  // Annuler une simulation precedente si elle existe
  cancelSimulation(orderId);

  const timers: NodeJS.Timeout[] = [];

  // Calculer le delai initial: si scheduledStartAt est dans le futur, attendre
  // Sinon, commencer apres STEP_DELAYS.accepted_to_en_route
  let initialDelay = STEP_DELAYS.accepted_to_en_route;
  if (scheduledStartAt) {
    const now = Date.now();
    const scheduledMs = scheduledStartAt.getTime();
    // La pro part 30 min avant l'heure prevue
    const departureMs = scheduledMs - 30 * 60 * 1000;
    if (departureMs > now) {
      initialDelay = departureMs - now;
    }
  }

  // Etape 1: accepted -> en_route
  const t1 = setTimeout(async () => {
    await transitionOrder(orderId, 'accepted', 'en_route');
  }, initialDelay);
  timers.push(t1);

  // Etape 2: en_route -> in_progress
  const t2 = setTimeout(async () => {
    await transitionOrder(orderId, 'en_route', 'in_progress');
  }, initialDelay + STEP_DELAYS.en_route_to_in_progress);
  timers.push(t2);

  // Etape 3: in_progress -> completed
  const t3 = setTimeout(async () => {
    await transitionOrder(orderId, 'in_progress', 'completed');
    // Envoyer le prompt de notation
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { clientId: true } });
    if (order) {
      notificationService.notifyRatePrompt(orderId, order.clientId).catch(console.error);
    }
    activeSimulations.delete(orderId);
  }, initialDelay + STEP_DELAYS.en_route_to_in_progress + STEP_DELAYS.in_progress_to_completed);
  timers.push(t3);

  activeSimulations.set(orderId, timers);
}

export function cancelSimulation(orderId: string) {
  const timers = activeSimulations.get(orderId);
  if (timers) {
    for (const t of timers) clearTimeout(t);
    activeSimulations.delete(orderId);
  }
}

async function transitionOrder(orderId: string, fromStatus: string, toStatus: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order || order.status !== fromStatus) return; // Order already moved, skip

    if (!isValidTransition(order.status as any, toStatus as any)) return;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus as any },
      });
      await tx.statusEvent.create({
        data: {
          orderId,
          fromStatus: fromStatus as any,
          toStatus: toStatus as any,
          actorRole: 'system',
        },
      });
    });

    notificationService.notifyStatusChange(orderId, fromStatus, toStatus).catch(console.error);
  } catch (err) {
    console.error(`[simulation] Failed to transition order ${orderId} from ${fromStatus} to ${toStatus}:`, err);
  }
}
```

Fichier a modifier: apps/api/src/services/negotiation.service.ts
- Dans la fonction acceptOffer() (ligne 142-220), apres la transaction (ligne 217), ajouter:
  ```
  // Demarrer la simulation de suivi pour la demo
  import { startSimulation } from './simulation.service';
  // ... (importer en haut du fichier)
  ```
  Apres `return result;` (ligne 219), ajouter AVANT le return:
  ```
  // Start demo simulation for status tracking
  const fullOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { scheduledStartAt: true } });
  startSimulation(orderId, fullOrder?.scheduledStartAt);
  ```

Fichier a modifier: apps/api/src/socket/handlers.ts
- Dans handleOfferAccept (ligne 108-135), apres la ligne qui emit 'order:updated', ajouter:
  ```
  import { startSimulation } from '../services/simulation.service';
  // ... (importer en haut du fichier)
  ```
  Apres `io.to(roomName(orderId)).emit('order:updated', result.order);` (ligne 131), ajouter:
  ```
  // Start demo simulation
  const fullOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { scheduledStartAt: true } });
  startSimulation(orderId, fullOrder?.scheduledStartAt);
  ```

Contraintes:
- Le champ actorRole "system" doit etre accepte par Prisma. Verifier dans le schema que ActorRole inclut 'system'. Si non, utiliser 'pro' comme fallback.
- Le service doit etre stateless (les timers sont en memoire, perdus au redemarrage — c'est OK pour la demo)
- Ne PAS modifier le schema Prisma
- Architecture extensible: le pattern startSimulation/cancelSimulation pourra etre remplace par un vrai service GPS

Criteres de validation:
- Quand une offre est acceptee (via REST ou Socket), la simulation demarre
- Apres ~2 min, l'order passe en "en_route" + notification push envoyee
- Apres ~4 min total, "in_progress" + notification
- Apres ~6 min total, "completed" + notification + prompt de notation
- Si scheduledStartAt est dans le futur, le premier delai est ajuste
- Les transitions sont verifiees (pas de saut si l'order a deja change de status)

Commit message: "feat(api): add demo simulation service for realistic status progression"
```

---

### Prompt C3 — Mobile: Refondre StatusTrackingScreen avec donnees reelles

**Branche:** `v2/chat-agreement-tracking`
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Mobile dans apps/mobile. Le StatusTrackingScreen.tsx (apps/mobile/src/screens/orders/StatusTrackingScreen.tsx) utilise actuellement des donnees hardcodees (MOCK_TIMELINE, mock order data). Il faut le refondre pour utiliser les vraies donnees de l'API.

Objectif: Refondre StatusTrackingScreen pour:
1. Recevoir orderId en params et fetcher les vraies donnees
2. Afficher les status events reels depuis l'API
3. Ecouter les updates en temps reel via socket/polling
4. Animer les transitions entre etapes

Fichier a modifier: apps/mobile/src/screens/orders/StatusTrackingScreen.tsx

Remplacer TOUT le contenu par:

Le composant doit:
1. Recevoir { orderId } dans route.params
2. Utiliser useOrder(orderId) depuis '../../services/queries/orders' pour fetcher l'order
3. Utiliser useSocket() et useSocketEvents(orderId) pour les updates temps reel
4. Polling: refetch l'order toutes les 5s tant que le status n'est pas "completed" ou "cancelled"

5. Timeline basee sur les vrais status avec ce mapping:
   const TRACKING_STEPS = [
     { status: 'accepted', label: 'Confirmee', icon: CheckIcon },
     { status: 'en_route', label: 'En route vers vous', icon: LocationPinIcon },
     { status: 'in_progress', label: 'Prestation en cours', icon: ClockIcon },
     { status: 'completed', label: 'Prestation terminee', icon: StarIcon },
   ];

6. Pour chaque step, verifier si un statusEvent existe pour ce status dans order.statusEvents. Si oui, afficher l'heure reelle. Si non, afficher "--:--".

7. Le step actif est le dernier statusEvent trouve. Utiliser le pulse animate existant sur le dot actif.

8. Garder les sections existantes (pro info, details commande) mais les alimenter avec les vraies donnees:
   - Pro: depuis order.assignments[0].professional.user.fullName
   - Service: order.serviceType avec le label fr
   - Prix: order.finalPrice ?? order.floorPrice
   - Adresse: order.location

9. Animation de transition: quand un nouveau statusEvent arrive (le nombre de statusEvents augmente), faire un petit flash vert (scale + opacity) sur le nouveau step pendant 500ms.

10. Quand status = "completed": afficher un bouton "Evaluer le service" qui navigue vers Rating screen avec { orderId }.

Imports necessaires:
- useOrder depuis '../../services/queries/orders'
- useSocket depuis '../../contexts/SocketContext'
- useSocketEvents depuis '../../hooks/useSocketEvents'
- CheckIcon, LocationPinIcon, ClockIcon, StarIcon depuis '../../components'
- useQueryClient depuis '@tanstack/react-query'
- Animated, Easing depuis 'react-native'

Contraintes:
- Garder le meme design general (timeline verticale, cards)
- Utiliser les memes couleurs et typo (colors.success pour done, colors.clay pour active, colors.borderStrong pour pending)
- Si order.statusEvents est vide ou undefined, fallback sur le status actuel de l'order
- Ne PAS supprimer l'animation pulse sur le dot actif
- Taille du composant raisonnable (pas plus de 300 lignes)

Criteres de validation:
- L'ecran affiche les vraies etapes avec les heures reelles
- Quand une nouvelle transition arrive (simulation toutes les 2 min), l'UI se met a jour
- Le dot actif pulse
- Les etapes passees sont en vert, l'active en clay, les futures en gris
- Le bouton "Evaluer" apparait quand completed
- L'app compile sans erreur

Commit message: "feat(mobile): refactor StatusTrackingScreen with real data and live updates"
```

---

### Prompt C4 — Mobile: Banniere de suivi sur la HomeScreen

**Branche:** `v2/chat-agreement-tracking`
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Mobile dans apps/mobile. Le HomeScreen.tsx (apps/mobile/src/screens/home/HomeScreen.tsx) n'affiche pas de banniere de suivi quand le client a une commande active. Il faut ajouter une banniere "Suivre votre professionnelle" quand un order est en status accepted/en_route/in_progress.

Objectif: Ajouter une banniere cliquable en haut du ScrollView de HomeScreen, visible quand le client a au moins un order actif.

Fichier a modifier: apps/mobile/src/screens/home/HomeScreen.tsx

Modifications:

1. Importer useOrders depuis '../../services/queries/orders' (la query de liste des orders client)
   et useMemo depuis 'react'

2. Dans le composant, fetcher les orders:
   const { data: ordersData } = useOrders();

   Filtrer pour trouver le premier order actif:
   const activeOrder = useMemo(() => {
     if (!ordersData?.pages) return null;
     const allOrders = ordersData.pages.flatMap((p: any) => p.data ?? []);
     return allOrders.find((o: any) => ['accepted', 'en_route', 'in_progress'].includes(o.status)) ?? null;
   }, [ordersData]);

3. Si activeOrder existe, afficher une banniere AVANT le promoCard dans le ScrollView:

   <Pressable
     style={styles.trackingBanner}
     onPress={() => nav.getParent()?.navigate('OrdersTab', {
       screen: 'StatusTracking',
       params: { orderId: activeOrder.id },
     })}
   >
     <View style={styles.trackingDot} />
     <View style={styles.trackingContent}>
       <Text style={styles.trackingTitle}>Suivre votre professionnelle</Text>
       <Text style={styles.trackingSub}>
         {activeOrder.status === 'en_route' ? 'En route vers vous' :
          activeOrder.status === 'in_progress' ? 'Prestation en cours' :
          'Commande confirmee'}
       </Text>
     </View>
     <ChevronRightIcon size={16} color={colors.white} />
   </Pressable>

4. Ajouter l'import de ChevronRightIcon (deja importe probablement) et Pressable

5. Styles de la banniere:
   trackingBanner: {
     backgroundColor: colors.navy,
     borderRadius: radius.lg,
     padding: 16,
     flexDirection: 'row',
     alignItems: 'center',
     gap: 12,
     marginBottom: 16,
   },
   trackingDot: {
     width: 10,
     height: 10,
     borderRadius: 999,
     backgroundColor: colors.success,
   },
   trackingContent: {
     flex: 1,
   },
   trackingTitle: {
     color: colors.white,
     fontFamily: 'DMSans_700Bold',
     fontSize: 14,
   },
   trackingSub: {
     color: 'rgba(255,255,255,0.6)',
     fontFamily: 'DMSans_500Medium',
     fontSize: 12,
     marginTop: 2,
   },

Contraintes:
- Ne PAS modifier le promoCard, la grille de services, ni le LocationModal
- La banniere ne doit apparaitre QUE quand il y a un order actif
- Si pas d'order actif, rien ne change a l'affichage actuel
- Navigation vers l'onglet Orders > StatusTracking avec l'orderId
- Ne PAS ajouter de polling specifique (les orders se rafraichissent naturellement)

Criteres de validation:
- Quand le client a un order en "en_route": banniere visible avec "En route vers vous"
- Clic sur la banniere: navigue vers StatusTracking
- Quand aucun order actif: pas de banniere, homescreen identique
- L'app compile sans erreur

Commit message: "feat(mobile): add active order tracking banner on HomeScreen"
```

---

## THEME D : Pro History with Ratings

### Prompt D1 — API + Mobile: Afficher note/commentaire/pourboire dans ProOrderDetail

**Branche:** `v2/pro-history-rating` (creer depuis v2)
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Le ProOrderDetailScreen (apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx) affiche les details d'une commande cote pro mais ne montre PAS la note, le commentaire ou le pourboire du client. Les donnees existent en base (tables Rating et champ tipAmount sur Order) mais ne sont pas incluses dans la query pro orders.

Objectif: Afficher la note (etoiles), le commentaire et le pourboire dans le ProOrderDetailScreen pour les commandes terminees.

Fichier a modifier: apps/api/src/routes/pro.routes.ts

Dans le endpoint GET /v1/pro/orders (ligne 74-135), modifier le include de l'order (ligne 103) pour ajouter:
```
rating: {
  select: {
    stars: true,
    comment: true,
    createdAt: true,
  },
},
```
Ajouter aussi tipAmount dans la selection (il est deja retourne car c'est un champ de Order, mais verifier).

Le mapping data (ligne 124-131) doit inclure rating et tipAmount:
```
const data = page.map((assignment) => ({
  ...assignment.order,
  assignmentStatus: assignment.status,
  assignmentId: assignment.id,
  assignedAt: assignment.assignedAt,
  confirmedAt: assignment.confirmedAt,
  isLead: assignment.isLead,
}));
```
Comme on spread ...assignment.order, rating et tipAmount devraient etre inclus automatiquement si l'include est bon.

Fichier a modifier: apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx

Apres la Card "HISTORIQUE" (ligne 137-159), ajouter une nouvelle Card conditionnelle pour les commandes "completed":

```tsx
{order.status === 'completed' && (
  <Card style={styles.sectionCard}>
    <Text style={styles.sectionLabel}>AVIS DU CLIENT</Text>
    {order.rating ? (
      <>
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={styles.ratingStar}>
              {i < order.rating.stars ? '★' : '☆'}
            </Text>
          ))}
          <Text style={styles.ratingValue}>{order.rating.stars}/5</Text>
        </View>
        {order.rating.comment ? (
          <Text style={styles.ratingComment}>"{order.rating.comment}"</Text>
        ) : null}
      </>
    ) : (
      <Text style={styles.noRating}>Pas encore d'avis</Text>
    )}
    {order.tipAmount != null && order.tipAmount > 0 ? (
      <View style={styles.tipRow}>
        <Text style={styles.tipLabel}>Pourboire</Text>
        <Text style={styles.tipValue}>{order.tipAmount} MAD</Text>
      </View>
    ) : null}
  </Card>
)}
```

Ajouter les styles:
```
ratingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
  marginBottom: spacing.sm,
},
ratingStar: {
  fontSize: 20,
  color: '#F5A623',
},
ratingValue: {
  marginLeft: 8,
  fontFamily: 'DMSans_700Bold',
  fontSize: 14,
  color: colors.navy,
},
ratingComment: {
  fontFamily: 'DMSans_400Regular',
  fontSize: 13,
  color: colors.textSec,
  fontStyle: 'italic',
  lineHeight: 20,
  marginBottom: spacing.sm,
},
noRating: {
  fontFamily: 'DMSans_500Medium',
  fontSize: 13,
  color: colors.textMuted,
},
tipRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: spacing.sm,
  paddingTop: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.border,
},
tipLabel: {
  fontFamily: 'DMSans_500Medium',
  fontSize: 13,
  color: colors.textSec,
},
tipValue: {
  fontFamily: 'DMSans_700Bold',
  fontSize: 14,
  color: colors.success,
},
```

Contraintes:
- Ne PAS modifier les autres Cards existantes
- La section "AVIS DU CLIENT" ne doit apparaitre QUE pour les commandes terminees (status === 'completed')
- Si pas de rating, afficher "Pas encore d'avis"
- Si pas de pourboire ou pourboire = 0, ne pas afficher la ligne pourboire
- Ne PAS modifier le schema Prisma

Criteres de validation:
- Sur une commande terminee avec rating: etoiles + commentaire affiches
- Sur une commande terminee sans rating: "Pas encore d'avis"
- Pourboire affiche si > 0
- Sur une commande en cours: section "AVIS" non affichee
- L'app compile sans erreur

Commit message: "feat: show client rating, comment and tip in ProOrderDetailScreen"
```

---

## THEME E : Icons Premium

### Prompt E1 — Mobile: Installer Lucide et remplacer les icones generiques

**Branche:** `v2/icons-premium` (creer depuis v2)
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Mobile dans apps/mobile. Les icones sont toutes dans apps/mobile/src/components/icons.tsx, dessinees a la main en SVG avec react-native-svg. Elles sont basiques et peu coherentes. On veut remplacer les icones generiques par Lucide React Native tout en gardant des icones custom pour les 3 services principaux.

Objectif:
1. Installer lucide-react-native
2. Remplacer les icones generiques par les equivalents Lucide
3. Garder les icones de service (CleaningIcon, CookingIcon, BabysittingIcon) en SVG custom mais les ameliorer
4. Normaliser les tailles

Etape 1 - Installation:
Depuis la racine du monorepo, executer:
cd apps/mobile && pnpm add lucide-react-native

Etape 2 - Modifier apps/mobile/src/components/icons.tsx:

Remplacer le fichier pour:
- Importer les icones Lucide correspondantes
- Re-exporter avec les memes noms pour ne rien casser

Mapping des icones a remplacer par Lucide:
- HomeIcon -> Home (lucide)
- OrdersIcon -> ClipboardList (lucide)
- SettingsIcon -> Settings (lucide)
- ChatIcon -> MessageCircle (lucide)
- SearchIcon -> Search (lucide)
- ChevronDownIcon -> ChevronDown (lucide)
- ChevronRightIcon -> ChevronRight (lucide)
- ArrowRightIcon -> ArrowRight (lucide)
- BackIcon -> ArrowLeft (lucide)
- CheckIcon -> Check (lucide)
- CloseIcon -> X (lucide)
- InfoIcon -> Info (lucide)
- WarningIcon -> AlertTriangle (lucide)
- CameraIcon -> Camera (lucide)
- MicIcon -> Mic (lucide)
- SendIcon -> Send (lucide)
- LocationPinIcon -> MapPin (lucide)
- ClockIcon -> Clock (lucide)
- StarIcon -> Star (lucide)
- StarOutlineIcon -> Star avec strokeWidth different (lucide)
- LoyaltyIcon -> Heart (lucide)
- PlumbingIcon -> Wrench (lucide)
- ElectricalIcon -> Zap (lucide)
- ITIcon -> Monitor (lucide)

Structure du fichier:
```typescript
import {
  Home, ClipboardList, Settings, MessageCircle, Search,
  ChevronDown, ChevronRight, ArrowRight, ArrowLeft,
  Check, X, Info, AlertTriangle,
  Camera, Mic, Send, MapPin, Clock,
  Star, Heart, Wrench, Zap, Monitor,
} from 'lucide-react-native';
import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../theme';

interface IconProps {
  size?: number;
  color?: string;
}

// ── Lucide re-exports (generic icons) ──
export const HomeIcon = ({ size = 24, color = colors.navy }: IconProps) => <Home size={size} color={color} strokeWidth={1.8} />;
export const OrdersIcon = ({ size = 24, color = colors.navy }: IconProps) => <ClipboardList size={size} color={color} strokeWidth={1.8} />;
// ... (tous les mappings ci-dessus avec le meme pattern)

// ── Custom SVG (service-specific icons) ──
// Garder CleaningIcon, CookingIcon, BabysittingIcon en SVG custom
// mais ameliorer les paths pour un style plus premium (trait fin, arrondi)
```

Pour les 3 icones de service custom (CleaningIcon, CookingIcon, BabysittingIcon):
- Garder en SVG custom car elles representent des concepts specifiques
- Utiliser strokeWidth={1.5} (au lieu de 1.8) pour un look plus fin
- viewBox "0 0 24 24" normalise
- CleaningIcon: un spray bottle ou un balai stylise
- CookingIcon: une toque de chef ou un plat avec cloche
- BabysittingIcon: silhouette adulte + enfant ou berceau

Contraintes:
- TOUS les composants qui importent des icones doivent continuer a fonctionner sans modification (memes noms, memes props)
- Le default size reste 24, le default color reste colors.navy
- Ne PAS modifier les fichiers qui importent les icones
- lucide-react-native depend de react-native-svg qui est deja installe

Criteres de validation:
- Toutes les icones s'affichent correctement dans l'app
- Style coherent entre toutes les icones
- Les icones de service sont visuellement distinctes et premium
- L'app compile sans erreur
- Aucun warning TypeScript

Commit message: "feat(mobile): replace generic icons with Lucide, redesign service icons"
```

---

### Prompt E2 — Mobile: Normaliser les tailles d'icones dans l'app

**Branche:** `v2/icons-premium`
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Mobile dans apps/mobile. Apres le remplacement des icones par Lucide (prompt precedent), il faut normaliser les tailles dans toute l'app. Actuellement les tailles varient arbitrairement.

Objectif: Auditer tous les usages d'icones dans l'app et normaliser selon ces regles:
- Navigation tabs (bottom bar): size={24}
- Actions dans les headers/barres: size={20}
- Icones inline (dans du texte, chips): size={14} ou size={16}
- Icones de service (grille HomeScreen): size={28}
- Icones decoratives (promoCard, etc.): size={14}

Fichiers a auditer et modifier:
- apps/mobile/src/navigation/MainTabs.tsx
- apps/mobile/src/navigation/ProMainTabs.tsx
- apps/mobile/src/screens/home/HomeScreen.tsx
- apps/mobile/src/screens/booking/SearchScreen.tsx
- apps/mobile/src/screens/orders/StatusTrackingScreen.tsx
- apps/mobile/src/screens/chat/ChatScreen.tsx
- apps/mobile/src/screens/pro/OffersScreen.tsx
- Tout autre fichier qui utilise les icones

Methode:
1. Chercher toutes les occurrences de "Icon" suivi de "size=" dans apps/mobile/src/
2. Appliquer les regles de taille ci-dessus
3. Verifier la coherence entre l'app client et l'app pro

Contraintes:
- Ne modifier QUE les props size, pas la logique ni le layout
- Ne PAS modifier les icones elles-memes (fichier icons.tsx)
- Si une icone a deja la bonne taille, ne pas la toucher

Criteres de validation:
- Les icones de navigation sont toutes a 24px
- Les icones d'action sont a 20px
- Les icones inline sont a 14-16px
- Les icones de service sont a 28px
- Coherence visuelle entre app client et app pro
- L'app compile sans erreur

Commit message: "fix(mobile): normalize icon sizes across client and pro apps"
```

---

## THEME F : Notifications enrichies

### Prompt F1 — API + Mobile: Enrichir les payloads de notification

**Branche:** `v2/enriched-notifications` (creer depuis v2)
**A donner a Codex:**

```
Contexte: Monorepo pnpm. Backend dans apps/api. Les push notifications actuelles (apps/api/src/services/notification.service.ts) envoient des payloads minimaux. Par exemple notifyStatusChange envoie juste "Statut: En route" sans contexte.

Objectif: Enrichir les payloads de notification pour:
1. Inclure plus de contexte (nom de la pro, type de service, prix)
2. Structurer les data pour une future integration Live Activity
3. Ameliorer les titres et messages

Fichier a modifier: apps/api/src/services/notification.service.ts

Modifications:

1. notifyStatusChange (ligne 159-193): enrichir avec le nom de la pro et le service
   ```typescript
   export async function notifyStatusChange(orderId: string, _fromStatus: string, toStatus: string) {
     const order = await prisma.order.findUnique({
       where: { id: orderId },
       select: {
         clientId: true,
         serviceType: true,
         finalPrice: true,
         location: true,
         assignments: {
           where: { isLead: true },
           select: {
             professional: {
               select: {
                 userId: true,
                 user: { select: { fullName: true } },
               },
             },
           },
         },
       },
     });
     if (!order) return;

     const proName = order.assignments[0]?.professional?.user?.fullName ?? 'Votre professionnelle';
     const typedStatus = toStatus as OrderStatus;
     const statusLabel = statusLabelFr[typedStatus] ?? toStatus;

     // Messages enrichis par statut
     const statusMessages: Record<string, { title: string; body: string }> = {
       en_route: { title: `${proName} est en route`, body: `Elle se dirige vers ${order.location}` },
       in_progress: { title: 'Prestation en cours', body: `${proName} a commence votre ${serviceTypeLabelFr[order.serviceType] ?? 'service'}` },
       completed: { title: 'Prestation terminee!', body: `${proName} a termine. N'oubliez pas de laisser un avis!` },
     };

     const msg = statusMessages[toStatus] ?? { title: 'Commande mise a jour', body: `Statut: ${statusLabel}` };

     // Structured data for future Live Activity
     const data: Record<string, string> = {
       type: 'status',
       orderId,
       status: toStatus,
       proName,
       serviceType: order.serviceType,
       ...(order.finalPrice != null ? { finalPrice: String(order.finalPrice) } : {}),
     };

     // Send to client
     await sendPushNotification(order.clientId, msg.title, msg.body, data);

     // Send minimal update to pro
     const proUserId = order.assignments[0]?.professional?.userId;
     if (proUserId) {
       await sendPushNotification(proUserId, 'Statut mis a jour', `Commande: ${statusLabel}`, { type: 'status', orderId, status: toStatus });
     }
   }
   ```

2. Ajouter le mapping des types de service en francais:
   ```typescript
   const serviceTypeLabelFr: Record<string, string> = {
     menage: 'menage',
     cuisine: 'service cuisine',
     childcare: 'garde d\'enfants',
   };
   ```

3. notifyNewOffer (ligne 196-203): enrichir avec le nom de la pro
   ```typescript
   export async function notifyNewOffer(orderId: string, proUserId: string) {
     const pro = await prisma.user.findUnique({ where: { id: proUserId }, select: { fullName: true } });
     await sendPushNotification(
       proUserId,
       'Nouvelle mission',
       'Vous avez ete assignee a une nouvelle mission',
       { type: 'offer', orderId, proName: pro?.fullName ?? '' },
     );
   }
   ```

4. notifyProAccepted (celle ajoutee dans le Prompt B1): s'assurer qu'elle inclut aussi serviceType dans le data payload

Contraintes:
- Ne PAS modifier sendToToken, removePushToken, ou la logique d'envoi Expo
- Ne PAS ajouter de dependances
- Garder la compatibilite avec le handler de notification cote mobile (notifications.ts)
- Les valeurs dans data doivent toutes etre des strings (contrainte Expo)
- Ne PAS casser les notifications existantes pour les messages (notifyNewMessage)

Criteres de validation:
- Notification "en_route": titre "Fatima est en route", body "Elle se dirige vers Agdal, Rabat"
- Notification "completed": titre "Prestation terminee!", body inclut le nom de la pro
- Les data payloads incluent proName, serviceType, finalPrice
- Les notifications au pro restent simples
- L'app mobile continue de router correctement (le type dans data n'a pas change)

Commit message: "feat(api): enrich push notification payloads with context data"
```

---

## Resume des branches et commits

| Branche | Commits | Theme |
|---------|---------|-------|
| `v2/fix-auth-case-sensitivity` | 2 commits | A |
| `v2/pro-accept-flow` | 3 commits | B |
| `v2/chat-agreement-tracking` | 4 commits | C |
| `v2/pro-history-rating` | 1 commit | D |
| `v2/icons-premium` | 2 commits | E |
| `v2/enriched-notifications` | 1 commit | F |

**Total: 13 commits sur 6 branches**

Chaque branche est mergeable independamment dans v2 (sauf B et C qui partagent la logique d'acceptation — merger B avant C).
