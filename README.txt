Tailwind Setup Pack
===================
Ce pack ajoute/écrase la config Tailwind/PostCSS + une feuille de style de base.

1) Copiez ces fichiers dans votre projet et remplacez si demandé :
   - postcss.config.js
   - tailwind.config.js
   - src/index.css

2) Installez les dépendances :
     npm i -D tailwindcss postcss autoprefixer

3) Lancez le projet :
     npm run dev

Notes :
- Si vous avez déjà d'autres styles dans src/index.css, sauvegardez-les avant d'écraser.
- Assurez-vous que votre app importe bien './index.css' dans 'src/main.jsx'.
