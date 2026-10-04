# Paiements des restaurants et règles des stores — note de recherche

> Recherche effectuée le **04.10.2026** sur les textes en vigueur à cette date.
> Ces règles changent souvent : **à revérifier avant la phase 5 (paiements) et avant chaque soumission**.
> Ceci n'est pas un avis juridique.

## Question posée

Les restaurants paient des services de **visibilité** (Premium, mise en avant sponsorisée) et accèdent à des **fonctions avancées** (statistiques détaillées, publication d'offres). Peut-on vendre cela hors de l'App Store, et que peut afficher l'app iOS en Suisse ?

## Ce que disent les App Store Review Guidelines

Source : <https://developer.apple.com/app-store/review/guidelines/>

**3.1.1 In-App Purchase** — « If you want to unlock features or functionality within your app, (by way of example: subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), you must use in-app purchase. »

**3.1.3 Other Purchase Methods (préambule)** — « Apps in this section cannot, within the app, encourage users to use a purchasing method other than in-app purchase, except for apps on the United States storefront […]. Developers can send communications outside of the app to their user base about purchasing methods other than in-app purchase. »

**3.1.3(b) Multiplatform Services** — les apps peuvent donner accès à des contenus, abonnements ou fonctionnalités achetés sur le web « provided those items are also available as in-app purchases within the app ».

**3.1.3(f) Free Stand-alone Apps** — une app gratuite compagnon d'un outil web payant n'a pas besoin de l'achat intégré « provided there is no purchasing inside the app, or calls to action for purchase outside of the app ».

**3.1.3(g) Advertising Management Apps** — « Digital purchases for content that is experienced or consumed in an app, including buying advertisements to display in the same app (such as sales of "boosts" for posts in a social media app) must use in-app purchase. »

## Conséquences pour notre projet

| Situation | Risque | Décision |
|---|---|---|
| Un restaurant achète une mise en avant **dans l'app iOS** | Explicitement visé par 3.1.3(g) → achat intégré obligatoire (commission Apple) | ❌ Interdit dans notre conception |
| Tableau de bord Premium (stats, offres) **dans l'app iOS**, payé sur le web | 3.1.3(b) : il faudrait aussi le vendre en achat intégré | ❌ Le tableau de bord reste sur le web |
| Bouton, prix ou lien vers l'espace restaurateur dans l'app iOS | Incitation à un achat externe, autorisée seulement sur le storefront US | ❌ Aucun prix, bouton ni lien |
| L'app iOS affiche des fiches sponsorisées vendues sur le web, sans aucune mention d'achat dans l'app | Publicité vendue hors de l'app, cas courant des apps gratuites financées par la publicité ; aucune fonctionnalité n'est « débloquée » dans l'app | ✅ Retenu, risque résiduel faible documenté dans la checklist de soumission |
| E-mails, démarchage, site web pour informer les restaurants | Autorisé par le préambule de 3.1.3 | ✅ |

## Situation particulière de la Suisse

- Les exceptions permettant des liens vers un paiement externe concernent **le storefront des États-Unis** (et des régimes spécifiques de l'UE liés au Digital Markets Act). La Suisse n'est pas dans l'UE et **aucune exception suisse** n'apparaît dans les règles.
- La Commission de la concurrence (COMCO / WEKO) a ouvert en décembre 2025 une enquête sur **l'accès NFC** des iPhone (paiement sans contact, Twint), pas sur les achats dans les apps. Sources : [SRF](https://www.srf.ch/news/wirtschaft/weko-ermittlungen-weko-ermittelt-wegen-nfc-zugang-auf-apple-geraeten), [inside-it.ch](https://www.inside-it.ch/wettbewerbskommission-ermittelt-gegen-apple-20251211).
- **Conclusion** : rien n'autorise clairement autre chose en Suisse → on applique la règle par défaut : **paiements des restaurants uniquement sur le web, rien dans l'app iOS**.

## Google Play

Source : <https://support.google.com/googleplay/android-developer/answer/9858738>

- La facturation Google Play est obligatoire pour les fonctionnalités et contenus vendus dans l'app, y compris les « cloud software and services (such as […] business productivity software […]) ».
- Exceptions : biens physiques, services consommés hors de l'app, paiements entre particuliers, dons… Pas d'exception explicite pour l'achat de publicité.
- « Apps may not lead users to a payment method other than Google Play's billing system », sauf programmes spécifiques à certains pays.
- **Conclusion** : même conception que pour iOS (app Android 100 % clients).

## Autres règles des stores qui influencent la conception

- **Apple 1.2 (contenus créés par les utilisateurs)** : filtrage, signalement avec réponse rapide, **blocage des utilisateurs abusifs**, coordonnées publiées → prévu en phase 3.
- **Apple 4.8** : si on propose la connexion Google, il faut une alternative équivalente respectueuse de la vie privée (Se connecter avec Apple) → prévu.
- **Apple 5.1.1(v)** : suppression du compte **dans l'app** → prévu.
- **Apple 5.1.1(i)** : lien vers la politique de confidentialité dans App Store Connect **et** dans l'app → prévu.
- **Apple 5.1.2(i)** : le pistage exige l'App Tracking Transparency ; on n'en fait pas → pas d'ATT.
- **Apple 2.3.7** : pas de prix dans les métadonnées (nom, sous-titre, captures).
- **Google Play — suppression de compte** : chemin dans l'app **et** page web de demande de suppression ([source](https://support.google.com/googleplay/android-developer/answer/13327111)).
- **Google Play — nouveaux comptes personnels** : test fermé avec **12 testeurs pendant 14 jours** avant la mise en production ([source](https://support.google.com/googleplay/android-developer/answer/14151465)).
