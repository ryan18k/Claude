# Tester Swiss Halal sur iPhone

> Vérifié le 04.10.2026 dans la documentation officielle d'Expo et d'Apple. Ces règles changent souvent : en cas de doute, demande à Claude de revérifier.

**N'utilise pas l'app Expo Go** : celle de l'App Store s'arrête à la version 54 d'Expo, alors que Swiss Halal utilise la 57 ([source](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)), et la carte n'y fonctionne jamais.

## Choisir une méthode

| Méthode                                | Coût                                | Ordinateur               | Vraie carte       | Limite                                                         |
| -------------------------------------- | ----------------------------------- | ------------------------ | ----------------- | -------------------------------------------------------------- |
| **A. Aperçu dans Safari**              | gratuit                             | Mac ou Windows           | non (version web) | « Me localiser » ne marche pas                                 |
| **B. App de test depuis un Mac**       | gratuit                             | Mac à puce Apple, à jour | **oui**           | à réinstaller tous les 7 jours                                 |
| **C. iPhone virtuel sur le Mac**       | gratuit                             | Mac à puce Apple, à jour | **oui**           | sur l'écran du Mac, pas sur ton iPhone                         |
| **D. App de test construite par Expo** | 109 CHF/an (compte Apple Developer) | Mac ou Windows           | **oui**           | payant ; c'est aussi le compte qu'il faudra pour publier l'app |

**Conseil** : commence par **A** pour voir l'interface aujourd'hui. Pour la vraie app, prends **D** (ce compte Apple sera de toute façon nécessaire pour publier), ou **B** si tu as un Mac récent.

Avec B, C et D, l'ordinateur doit rester allumé, avec l'app lancée, pendant que tu testes.

---

## Le terminal en 30 secondes

Le terminal est la fenêtre où l'on tape les commandes.

- **Ouvrir** : sur Mac, Cmd + Espace, tape « Terminal », puis Entrée. Sur Windows, touche Windows, tape « cmd », puis Entrée (« Invite de commandes » ; n'utilise pas PowerShell).
- **Se placer dans le projet** : chaque nouvelle fenêtre démarre dans ton dossier personnel. Tape d'abord `cd swiss-halal`. **Toutes les commandes de ce guide se tapent dans ce dossier.**
- **Arrêter une commande** qui tourne : **Ctrl + C** (sur Mac aussi : touche _control_).

## Préparation (une seule fois)

1. Installe **Node.js** depuis <https://nodejs.org/fr/download> : choisis la version **v22** ou **v24** (pas la 26). Installe aussi **Git** : sur Windows depuis <https://git-scm.com> (options par défaut) ; sur Mac, tape `git --version` et clique « Installer » si macOS le propose. Ferme puis rouvre le terminal, et vérifie que `node -v` affiche `v22…` ou `v24…`.
2. Active pnpm :
   - **Mac** : `sudo corepack enable`, puis le mot de passe du Mac (il ne s'affiche pas pendant la frappe, c'est normal).
   - **Windows** : touche Windows, tape « cmd », clic droit sur « Invite de commandes » › **Exécuter en tant qu'administrateur**, tape `corepack enable`, puis ferme cette fenêtre.
3. Dans un terminal normal :
   ```bash
   git clone https://github.com/ryan18k/Claude.git swiss-halal
   cd swiss-halal
   git checkout halal-romandie
   pnpm install
   ```
   Si on te demande « Do you want to continue? », tape `Y` puis Entrée.

## Récupérer les dernières modifications

Avant chaque test, dans le dossier `swiss-halal` : `git pull`, puis `pnpm install`.

---

## A. Aperçu dans Safari (gratuit, Mac ou Windows)

Tu vois la vraie interface avec les données fictives, mais avec la **version web** de la carte.

1. Mets l'ordinateur et l'iPhone sur le **même Wi-Fi** (pas un Wi-Fi « invités »).
2. Note l'adresse IP de l'ordinateur :
   - **Mac** : `ipconfig getifaddr en0` (si rien ne s'affiche : `ipconfig getifaddr en1`).
   - **Windows** : `ipconfig`, puis la ligne « Adresse IPv4 » sous « Carte réseau sans fil Wi-Fi ». Mets aussi ton Wi-Fi en réseau privé : _Paramètres › Réseau et Internet › Wi-Fi › (ton réseau) › Type de profil réseau › Réseau privé_.
3. Lance `pnpm web:mobile`. Laisse la fenêtre ouverte et ignore le code QR (il ne sert pas ici). Sur Windows, si le pare-feu le demande pour Node.js, clique « Autoriser l'accès ».
4. Sur l'iPhone, ouvre **Safari** à l'adresse `http://ADRESSE-IP:8081` (par exemple `http://192.168.1.20:8081`). Tu dois voir la carte avec une pastille « Démo ».

Limite : Safari bloque la localisation sur les pages non sécurisées (`http://`). « Me localiser » et le filtre de distance ne marchent donc pas ici ; tout le reste fonctionne.

---

## B. App de test depuis un Mac (gratuit)

C'est la seule façon d'installer la vraie app sur un iPhone **sans payer** ([source](https://docs.expo.dev/develop/development-builds/introduction/)). Avec un compte Apple gratuit, l'app **expire au bout de 7 jours** ([source](https://developer.apple.com/support/compare-memberships/)).

**Il faut :**

- un Mac à puce Apple (M1 ou plus récente) sous **macOS 26.6 ou plus récent** (vérifie : menu Apple › _À propos de ce Mac_). Sinon, prends la méthode D ;
- **Xcode** depuis le Mac App Store (gratuit, plusieurs Go), ouvert une première fois. Xcode n'existe qu'en anglais. Dans _Xcode › Settings… › Locations_, choisis la version d'Xcode dans **Command Line Tools** ;
- ton compte Apple dans Xcode : _Xcode › Settings… › Accounts › +_ › Apple Account. Sélectionne ensuite l'équipe « (ton nom) (Personal Team) » › **Manage Certificates…** › **+** › **Apple Development** › Done ;
- **CocoaPods** : installe Homebrew (<https://brew.sh>), puis `brew install cocoapods` ;
- un iPhone sous **iOS 17 ou plus récent**, et un câble USB.

**Avant la première fois, préviens Claude** : Xcode 27 (celui du Mac App Store) demande un réglage de compatibilité qu'il faut ajouter au projet.

**Étapes :**

1. Branche l'iPhone, déverrouille-le et touche **« Se fier »**.
2. Active le **mode développeur** sur l'iPhone : _Réglages › Confidentialité et sécurité › Mode développeur_ (tout en bas) › active › « Redémarrer » › après le redémarrage, « Activer ». Si l'option n'apparaît pas encore, fais-le après la première installation.
3. Lance `pnpm ios:device` et choisis ton iPhone avec les flèches, puis Entrée. La première fois, compte 10 à 20 minutes. Si le Mac demande ton mot de passe pour « codesign », tape celui de ta session et clique « Toujours autoriser ».
4. Si l'iPhone affiche « Développeur non approuvé » : touche « Annuler », puis _Réglages › Général › VPN et gestion de l'appareil_ › sous « App de développeur », « Apple Development : (ton adresse) » › « Se fier à… » › « Se fier » (sur iOS 18 ou plus récent : « Autoriser et redémarrer »).
5. Ouvre l'app et autorise l'accès au **réseau local**.

**Les fois suivantes** : lance `pnpm dev:mobile` sur le Mac et ouvre l'app sur l'iPhone (même Wi-Fi). Au bout de 7 jours, ou quand Claude te le dit, reconstruis l'app avec `pnpm ios:rebuild`, iPhone branché.

---

## C. iPhone virtuel sur le Mac (gratuit)

Même Mac que pour B, sans iPhone. Dans Xcode : _Settings… › Components_ › télécharge « iOS ». Ensuite, lance `pnpm ios:simulator` : un iPhone virtuel s'ouvre sur l'écran du Mac, avec la vraie carte.

---

## D. App de test construite par Expo (Mac ou Windows, payant)

Expo construit l'app sur ses serveurs (service « EAS ») : tu n'as pas besoin d'Xcode, et **ça marche depuis Windows**.

**Il faut :**

- un abonnement **Apple Developer Program** : 99 USD par an, affiché **109 CHF par an** sur l'App Store suisse. L'inscription se fait sur le web (<https://developer.apple.com/programs/enroll/>), ou dans l'app **Apple Developer** (iPhone sous iOS 26 ou plus récent, ou Mac). Il faut ton compte Apple (authentification à deux facteurs activée), ton nom légal et une pièce d'identité ;
- un compte **Expo** gratuit (<https://expo.dev/signup>) : 15 constructions iOS gratuites par mois ;
- un iPhone sous **iOS 16.4 ou plus récent**.

> ℹ️ Avec un compte Apple **individuel**, ton **nom légal** s'affichera comme vendeur sur l'App Store. Pour afficher le nom d'une entreprise, il faut un compte **organisation** : entreprise inscrite au registre du commerce, numéro D-U-N-S, site web et adresse e-mail professionnelle. À décider avant l'inscription.

**Étapes** (les questions d'Expo sont en anglais : réponds `Y` pour oui, ou Entrée pour accepter la proposition) :

1. Connecte-toi à Expo : `pnpm eas login`.
2. Relie le projet à ton compte : `pnpm eas init`. Copie à Claude les dernières lignes affichées (celles avec « ID »).
3. Enregistre ton iPhone : `pnpm eas device:create` › choisis **Website** › ouvre le lien dans **Safari** sur l'iPhone › « Download Profile » › « Autoriser » › _Réglages › Profil téléchargé › Installer_.
4. Construis l'app de test : `pnpm build:ios:dev`. Connecte-toi à ton compte Apple quand c'est demandé, accepte les propositions, et coche ton iPhone avec la barre d'espace. Avec un compte Apple tout neuf, la première construction peut échouer pendant 1 à 3 jours, le temps qu'Apple enregistre ton iPhone : attends, puis relance la même commande.
5. Quand c'est terminé (de quelques minutes à plus d'une heure avec le compte Expo gratuit), ouvre le lien **Install** sur l'iPhone, ou scanne le code QR avec l'appareil photo.
6. Active le **mode développeur** : _Réglages › Confidentialité et sécurité › Mode développeur_ (tout en bas) › active › « Redémarrer » › après le redémarrage, « Activer ».
7. Sur l'ordinateur, lance `pnpm dev:mobile` (sur Windows, même réglage « Réseau privé » que pour la méthode A). Sur l'iPhone, ouvre l'app Swiss Halal, autorise le **réseau local**, puis touche l'adresse `http://…:8081` sous « Development Servers ». Si elle n'apparaît pas, scanne le code QR du terminal avec l'appareil photo.

Si ça ne marche toujours pas (Wi-Fi d'entreprise, pare-feu), arrête avec Ctrl + C, installe `npm install --global @expo/ngrok` (Mac : `sudo` devant), puis lance `pnpm dev:mobile --tunnel` et scanne le code QR.

**Les fois suivantes** : récupère les dernières modifications, puis seulement l'étape 7. Il ne faut reconstruire (étape 4) que quand Claude te le dit.

---

## L'identifiant de l'app

Chaque app iOS a un identifiant unique. Pour les tests, le projet utilise un identifiant **provisoire** : `ch.swisshalal.dev`.

L'identifiant **définitif** (par exemple `ch.swisshalal.app`) sera choisi avant la publication. Il devient impossible à changer dès le premier envoi d'une version à Apple (TestFlight ou App Store).

Si tu utilises B (compte Apple gratuit) puis D (compte payant), préviens Claude : Apple réserve l'identifiant au premier compte qui l'utilise, et il faudra peut-être en changer pour les tests.
