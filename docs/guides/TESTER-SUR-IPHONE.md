# Tester Swiss Halal sur iPhone

> Vérifié le 04.10.2026 avec la documentation officielle d'Expo et d'Apple. Ces règles changent souvent : en cas de doute, demande-moi de revérifier.

## ⚠️ Expo Go ne marche pas pour ce projet sur iPhone

L'app **Expo Go** de l'App Store s'arrête au SDK 54 d'Expo, et Swiss Halal utilise le SDK 57 ([source](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)). De plus, la carte (MapLibre) ne fonctionne jamais dans Expo Go. Il faut donc une des méthodes ci-dessous.

## Les 4 méthodes, de la moins chère à la plus complète

| Méthode                                     | Coût                                                             | Ordinateur nécessaire | Vraie carte de l'app    | Limite principale                                              |
| ------------------------------------------- | ---------------------------------------------------------------- | --------------------- | ----------------------- | -------------------------------------------------------------- |
| **A. Aperçu dans Safari**                   | gratuit                                                          | Mac **ou** Windows    | non (carte version web) | « Me localiser » ne fonctionne pas                             |
| **B. App de test installée depuis un Mac**  | gratuit                                                          | Mac récent            | **oui**                 | à réinstaller tous les 7 jours                                 |
| **C. Simulateur d'iPhone sur Mac**          | gratuit                                                          | Mac récent            | **oui**                 | s'affiche sur l'écran du Mac, pas sur ton iPhone               |
| **D. App de test construite dans le cloud** | 99 USD/an (Apple), affiché **109 CHF/an** sur l'App Store suisse | Mac **ou** Windows    | **oui**                 | aucune ; c'est aussi le compte qu'il faudra pour publier l'app |

**Recommandation** : commence par **A** pour voir l'interface aujourd'hui. Pour tester la vraie app, prends **D** (le compte Apple sera de toute façon nécessaire pour publier sur l'App Store), ou **B** si tu as un Mac récent et ne veux pas encore payer.

---

## Préparation commune (une seule fois, sur l'ordinateur)

1. Installe **Git** (<https://git-scm.com>) et **Node.js 22** (<https://nodejs.org>, version LTS 22).
2. Dans un terminal :
   ```bash
   git clone https://github.com/ryan18k/Claude.git swiss-halal
   cd swiss-halal
   git checkout halal-romandie
   corepack enable
   pnpm install
   ```

---

## A. Aperçu dans Safari (gratuit, Mac ou Windows)

Tu vois la vraie interface, avec les données fictives, mais avec la **version web** de la carte.

1. Ordinateur et iPhone sur le **même Wi-Fi** (pas un Wi-Fi « invités »).
2. À la racine du projet : `pnpm web:mobile`
3. Trouve l'adresse IP de l'ordinateur :
   - **Mac** : `ipconfig getifaddr en0`
   - **Windows** : `ipconfig`, puis lis « Adresse IPv4 » de la carte Wi-Fi. Si le pare-feu Windows demande l'autorisation pour Node.js, accepte pour les **réseaux privés**.
4. Sur l'iPhone, ouvre **Safari** à l'adresse `http://ADRESSE-IP:8081` (par exemple `http://192.168.1.20:8081`).

Limite : Safari refuse la localisation sur une page `http://` qui n'est pas sur le téléphone lui-même. « Me localiser » et le filtre de distance afficheront donc un refus. Tout le reste fonctionne.

---

## B. App de test installée depuis un Mac (gratuit, compte Apple gratuit)

C'est la seule façon d'installer la vraie app sur un iPhone **sans payer** ([source](https://docs.expo.dev/develop/development-builds/introduction/)).

**Il faut :**

- un Mac sous **macOS Tahoe 26.2 ou plus récent** (les Mac trop anciens ne peuvent pas construire une app Expo SDK 57) ;
- **Xcode**, depuis le Mac App Store, ouvert une première fois ;
- ton identifiant Apple ajouté dans Xcode : _Xcode › Réglages › Comptes_ ;
- un iPhone sous **iOS 16.4 ou plus récent** et un câble USB.

**Limites du compte Apple gratuit** : l'app expire au bout de **7 jours** (il faut la réinstaller depuis le Mac), maximum 3 appareils ([source](https://developer.apple.com/support/compare-memberships/)).

**Avant la première fois**, dis-le-moi : je dois ajouter dans le projet l'**identifiant de l'app** (voir plus bas) et, si ton Mac a **Xcode 27**, un réglage de compatibilité (`expo-build-properties`).

**Étapes :**

1. Branche l'iPhone au Mac, déverrouille-le et touche **« Se fier »**.
2. Active le **mode développeur** sur l'iPhone : _Réglages › Confidentialité et sécurité › Mode développeur_ › activer › redémarrer › « Activer ». Si l'option n'apparaît pas encore, fais-le après la première installation.
3. Dans le terminal : `cd apps/mobile` puis `pnpm ios:device`, et choisis ton iPhone.
4. Si l'iPhone affiche « Développeur non approuvé » : _Réglages › Général › VPN et gestion de l'appareil_ › ton identifiant Apple › **Approuver**.
5. À l'ouverture de l'app, autorise l'accès au **réseau local**.

**Les fois suivantes** : lance `pnpm dev:mobile` sur le Mac et ouvre l'app sur l'iPhone (même Wi-Fi). Il n'y a besoin de reconstruire qu'après 7 jours ou si j'ajoute un module natif.

---

## C. Simulateur d'iPhone sur Mac (gratuit)

Même Mac et même Xcode que pour B, sans iPhone ni câble :

```bash
cd apps/mobile
pnpm ios:simulator
```

Un iPhone virtuel s'ouvre sur l'écran du Mac, avec la vraie carte.

---

## D. App de test construite dans le cloud (Mac ou Windows, compte Apple payant)

Le service **EAS** d'Expo construit l'app dans le cloud ; ton ordinateur n'a pas besoin d'Xcode. **Ça marche depuis Windows.**

**Il faut :**

- un abonnement **Apple Developer Program** : 99 USD par an, affiché **109 CHF par an** sur l'App Store suisse. L'inscription se fait dans l'app **Apple Developer** sur l'iPhone, avec ton identifiant Apple (double authentification activée), ton nom légal et une pièce d'identité ;
- un compte **Expo** gratuit (<https://expo.dev/signup>) : 15 constructions iOS gratuites par mois ;
- un iPhone sous **iOS 16.4 ou plus récent**.

> ℹ️ Avec un compte Apple **individuel**, c'est ton **nom légal** qui s'affichera comme vendeur sur l'App Store. Pour afficher un nom d'entreprise, il faut un compte **organisation** (entreprise inscrite au registre du commerce et numéro D-U-N-S). À décider avant l'inscription.

**Avant la première fois**, dis-le-moi : j'ajoute l'**identifiant de l'app** dans le projet.

**Étapes :**

1. Installe l'outil EAS : `npm install --global eas-cli`, puis connecte-toi : `eas login`.
2. `cd apps/mobile` puis `eas init`. Cette commande relie le projet à ton compte Expo ; envoie-moi la modification de `app.json` (ou committe-la).
3. Enregistre ton iPhone : `eas device:create` › choisis **Website** › ouvre le lien sur l'iPhone › _Télécharger le profil_ › _Réglages › Profil téléchargé › Installer_.
4. Construis l'app de test : `pnpm build:ios:dev`. Connecte-toi à ton compte Apple quand c'est demandé, accepte de créer le certificat, et sélectionne ton iPhone.
5. Quand la construction est terminée (de quelques minutes à plus d'une heure en version gratuite), ouvre le lien **Install** sur l'iPhone ou scanne le QR code avec l'appareil photo.
6. Active le **mode développeur** : _Réglages › Confidentialité et sécurité › Mode développeur_ › redémarrer › « Activer ».
7. Sur l'ordinateur, lance `pnpm dev:mobile`, puis ouvre l'app sur l'iPhone (même Wi-Fi) et autorise l'accès au **réseau local**.

Si l'iPhone ne trouve pas l'ordinateur (pare-feu, Wi-Fi d'entreprise) : `npm install --global @expo/ngrok`, puis `pnpm --filter @swisshalal/mobile start --tunnel`.

**Les fois suivantes** : seulement l'étape 7. Les modifications de code s'affichent en direct. Il faut reconstruire seulement si j'ajoute un module natif.

---

## L'identifiant de l'app (« bundle identifier »)

Les méthodes B, C et D demandent un identifiant unique, au format « nom de domaine inversé », par exemple `ch.swisshalal.app`. Il devient **définitif une fois l'app publiée** sur l'App Store. Choisis-le avant le premier test. L'idéal est un nom de domaine que tu possèdes, ou que tu comptes acheter (ex. `swisshalal.ch` → `ch.swisshalal.app`).
