# Procédure d'ajout d'un nouveau bot dans le contexte du MTE.

### 1. Ajouter une adresse mail à pamela

### 2. Créer un compte tchap avec l'adresse

1. Créer le compte
2. Récupérer le token
3. Sauver le code de récupération

### 3. Ajouter token dans les secrets d'ansible

```
- name: tchap-bot-777-access-token-v1.0
  data: syt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  state: present
```

### 4. Modifier les projets ``mel-docker`` et `cluster-web` en conséquence

### 5. Dupliquer le code d'un bot et changer le fichier `config.ts`

### 6. Ajouter le bot à la liste dans `bot.service.ts`

### 7. Enlever / Ajouter des scripts qui lui sont propres dans le dossier `scripts`
