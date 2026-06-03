/**
 * The translation ontology — one source of truth for every UI string, in all six
 * supported languages. The interface language follows the chat language (the
 * language you talk to the agent in); `modelLanguage` is separate (the language
 * the agent writes the model content in).
 *
 * Deliberately NOT translated (loanwords / brand): `Org/`, `core`, `supporting`,
 * `platform`, `log`. They stay identical across languages.
 *
 * Keys are dotted and flat. A value of the form "a|b" renders `a` plain followed
 * by `b` emphasised (the editorial muted second half) — see <Tx>.
 */

/* eslint-disable react-refresh/only-export-components -- shared i18n module: the
   provider, the <Tx> helper, and the string data deliberately live together. */
import { createContext, type ReactNode, useContext } from 'react';

export const LANGS = ['en', 'it', 'es', 'fr', 'de', 'pt'] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

/** The browser's preferred language if we support it, else English. */
export function detectLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2).toLowerCase() : 'en';
  return isLang(nav) ? nav : 'en';
}

type Entry = Record<Lang, string>;
const S = (en: string, it: string, es: string, fr: string, de: string, pt: string): Entry => ({ en, it, es, fr, de, pt });

export const STRINGS: Record<string, Entry> = {
  // ---- Welcome ----
  'welcome.headline': S(
    'Welcome to your |organization.',
    'Benvenuto nella tua |organizzazione.',
    'Bienvenido a tu |organización.',
    'Bienvenue dans votre |organisation.',
    'Willkommen in deiner |Organisation.',
    'Bem-vindo à sua |organização.',
  ),
  'welcome.lead': S(
    'The promises it keeps to the world, and the parts inside that keep them — mapped from your own documents, guided by an agent.',
    'Le promesse che fa al mondo e le parti, al suo interno, che le mantengono — ricostruite dai tuoi documenti, con la guida di un agente.',
    'Las promesas que le hace al mundo y las partes internas que las sostienen — reconstruidas a partir de tus documentos, con la ayuda de un agente.',
    'Les promesses qu’elle fait au monde et les rouages internes qui les tiennent — reconstitués à partir de vos documents, accompagné par un agent.',
    'Die Versprechen, die sie der Welt gibt, und das, was sie im Innern trägt — aus deinen eigenen Dokumenten rekonstruiert, begleitet von einem Agenten.',
    'As promessas que faz ao mundo e as partes internas que as sustentam — reconstruídas a partir dos seus documentos, com a ajuda de um agente.',
  ),
  'welcome.cta': S('Get started', 'Inizia', 'Empezar', 'Commencer', 'Loslegen', 'Começar'),
  'welcome.privacy': S(
    'Runs entirely in your browser. There is no server — nothing you write is uploaded. Your documents and model stay on your computer (or your own GitHub repo), and your key is encrypted on your device.',
    'Funziona tutto nel tuo browser. Non c’è nessun server: niente di ciò che scrivi finisce online. Documenti e modello restano sul tuo computer (o sul tuo repository GitHub), e la chiave resta cifrata sul tuo dispositivo.',
    'Todo ocurre en tu navegador. No hay ningún servidor: nada de lo que escribes sale a internet. Los documentos y el modelo se quedan en tu ordenador (o en tu repositorio de GitHub), y tu clave queda cifrada en tu dispositivo.',
    'Tout se passe dans votre navigateur. Aucun serveur : rien de ce que vous écrivez ne part en ligne. Vos documents et le modèle restent sur votre ordinateur (ou votre dépôt GitHub), et votre clé reste chiffrée sur votre appareil.',
    'Alles passiert in deinem Browser. Keinen Server: nichts, was du schreibst, geht online. Dokumente und Modell bleiben auf deinem Computer (oder in deinem GitHub-Repository), und dein Schlüssel bleibt auf deinem Gerät verschlüsselt.',
    'Tudo acontece no seu navegador. Não há servidor nenhum: nada do que escreve vai para a internet. Documentos e modelo ficam no seu computador (ou no seu repositório do GitHub), e a sua chave fica cifrada no seu dispositivo.',
  ),

  // ---- Wizard: step mastheads ----
  'wiz.languages.title': S('Languages', 'Lingue', 'Idiomas', 'Langues', 'Sprachen', 'Idiomas'),
  'wiz.languages.headline': S(
    'Two languages, |if you like.',
    'Due lingue, |se ti va.',
    'Dos idiomas, |si quieres.',
    'Deux langues, |si vous le souhaitez.',
    'Zwei Sprachen, |wenn du magst.',
    'Dois idiomas, |se quiser.',
  ),
  'wiz.languages.lead': S(
    'Talk to the agent in one. Write the model in another.',
    'Una lingua per parlare con l’agente, un’altra per scrivere il modello.',
    'Un idioma para hablar con el agente y otro para escribir el modelo.',
    'Une langue pour parler à l’agent, une autre pour écrire le modèle.',
    'Eine Sprache, um mit dem Agenten zu sprechen, eine andere fürs Modell.',
    'Uma língua para falar com o agente e outra para escrever o modelo.',
  ),
  'wiz.identity.title': S('Identity', 'Identità', 'Identidad', 'Identité', 'Identität', 'Identidade'),
  'wiz.identity.headline': S(
    'Whose organization |is this?',
    'Di chi è |questa organizzazione?',
    '¿De quién es |esta organización?',
    'À qui est |cette organisation ?',
    'Wessen Organisation |ist das?',
    'De quem é |esta organização?',
  ),
  'wiz.identity.lead': S(
    'The name and mark become the app’s own — header, tab, icon.',
    'Nome e simbolo diventano quelli dell’app: intestazione, scheda del browser, icona.',
    'El nombre y el símbolo pasan a ser los de la app: cabecera, pestaña, icono.',
    'Le nom et le symbole deviennent ceux de l’app : en-tête, onglet, icône.',
    'Name und Symbol werden zu denen der App: Kopfzeile, Browser-Tab, Icon.',
    'O nome e o símbolo passam a ser os da app: cabeçalho, separador, ícone.',
  ),
  'wiz.model.title': S('Model', 'Modello', 'Modelo', 'Modèle', 'Modell', 'Modelo'),
  'wiz.model.headline': S(
    'Bring your own |intelligence.',
    'Porta la tua |intelligenza.',
    'Trae tu propia |inteligencia.',
    'Apportez votre propre |intelligence.',
    'Bring deine eigene |Intelligenz mit.',
    'Traga a sua própria |inteligência.',
  ),
  'wiz.model.lead': S(
    'No server. Your key stays encrypted on your device — never shown, never uploaded.',
    'Nessun server: la tua chiave resta cifrata sul dispositivo, non viene mai mostrata né caricata online.',
    'Ningún servidor: tu clave queda cifrada en el dispositivo, nunca se muestra ni se sube a internet.',
    'Aucun serveur : votre clé reste chiffrée sur l’appareil, jamais affichée ni envoyée en ligne.',
    'Kein Server: dein Schlüssel bleibt auf dem Gerät verschlüsselt, wird nie angezeigt und nie hochgeladen.',
    'Nenhum servidor: a sua chave fica cifrada no dispositivo, nunca é mostrada nem enviada para a internet.',
  ),
  'wiz.storage.title': S('Storage', 'Archiviazione', 'Almacenamiento', 'Stockage', 'Speicher', 'Armazenamento'),
  'wiz.storage.headline': S(
    'Where the model |lives.',
    'Dove vive |il modello.',
    'Dónde vive |el modelo.',
    'Où vit |le modèle.',
    'Wo das Modell |lebt.',
    'Onde vive |o modelo.',
  ),
  'wiz.storage.lead': S(
    'A folder on this computer, or a GitHub repo. Either way the files are yours.',
    'Una cartella su questo computer oppure un repository GitHub: in ogni caso i file restano tuoi.',
    'Una carpeta en este ordenador o un repositorio de GitHub: en cualquier caso, los archivos son tuyos.',
    'Un dossier sur cet ordinateur ou un dépôt GitHub : dans les deux cas, les fichiers sont à vous.',
    'Ein Ordner auf diesem Computer oder ein GitHub-Repository: So oder so gehören die Dateien dir.',
    'Uma pasta neste computador ou um repositório do GitHub: em qualquer caso, os ficheiros são seus.',
  ),

  // ---- Wizard: fields & controls ----
  'wiz.chatLang': S(
    'I talk to the agent in',
    'Parlo con l’agente in',
    'Hablo con el agente en',
    'Je parle à l’agent en',
    'Ich spreche mit dem Agenten auf',
    'Falo com o agente em',
  ),
  'wiz.modelLang': S(
    'The model is written in',
    'Il modello è scritto in',
    'El modelo se escribe en',
    'Le modèle est écrit en',
    'Das Modell wird geschrieben auf',
    'O modelo é escrito em',
  ),
  'wiz.name': S('Name', 'Nome', 'Nombre', 'Nom', 'Name', 'Nome'),
  'wiz.namePlaceholder': S('e.g. Acme', 'es. Acme', 'p. ej. Acme', 'p. ex. Acme', 'z. B. Acme', 'ex. Acme'),
  'wiz.required': S('required', 'obbligatorio', 'obligatorio', 'requis', 'erforderlich', 'obrigatório'),
  'wiz.optional': S('optional', 'facoltativo', 'opcional', 'facultatif', 'optional', 'opcional'),
  'wiz.logo': S('Logo', 'Logo', 'Logo', 'Logo', 'Logo', 'Logo'),
  'wiz.logo.hint': S(
    'A square image works best — it shows as a small mark.',
    'Meglio un’immagine quadrata: comparirà come un piccolo simbolo.',
    'Mejor una imagen cuadrada: aparecerá como una pequeña marca.',
    'Préférez une image carrée : elle apparaîtra comme une petite marque.',
    'Am besten ein quadratisches Bild: es erscheint als kleines Zeichen.',
    'De preferência uma imagem quadrada: aparecerá como uma pequena marca.',
  ),
  'wiz.upload': S('Upload logo', 'Carica logo', 'Subir logo', 'Importer un logo', 'Logo hochladen', 'Carregar logo'),
  'wiz.replace': S('Replace', 'Sostituisci', 'Reemplazar', 'Remplacer', 'Ersetzen', 'Substituir'),
  'wiz.remove': S('Remove', 'Rimuovi', 'Quitar', 'Retirer', 'Entfernen', 'Remover'),
  'wiz.apiKey': S('Anthropic API key', 'Chiave API Anthropic', 'Clave API de Anthropic', 'Clé API Anthropic', 'Anthropic-API-Schlüssel', 'Chave API da Anthropic'),
  'wiz.keepCurrent': S(
    'leave blank to keep current',
    'lascia vuoto per mantenere quella attuale',
    'déjalo en blanco para mantener la actual',
    'laissez vide pour garder l’actuelle',
    'leer lassen, um den aktuellen zu behalten',
    'deixe em branco para manter a atual',
  ),
  'wiz.opus.desc': S(' — stronger, deeper', ' — più forte, più profondo', ' — más fuerte, más profundo', ' — plus puissant, plus profond', ' — stärker, tiefer', ' — mais forte, mais profundo'),
  'wiz.sonnet.desc': S(' — faster, lighter', ' — più veloce, più leggero', ' — más rápido, más ligero', ' — plus rapide, plus léger', ' — schneller, leichter', ' — mais rápido, mais leve'),
  'wiz.source.local': S('This computer', 'Questo computer', 'Este ordenador', 'Cet ordinateur', 'Dieser Computer', 'Este computador'),
  'wiz.source.github': S('GitHub repo', 'Repo GitHub', 'Repo de GitHub', 'Dépôt GitHub', 'GitHub-Repo', 'Repo do GitHub'),
  'wiz.chooseFolder': S('Choose folder…', 'Scegli cartella…', 'Elegir carpeta…', 'Choisir un dossier…', 'Ordner wählen…', 'Escolher pasta…'),
  'wiz.changeFolder': S('Change folder', 'Cambia cartella', 'Cambiar carpeta', 'Changer de dossier', 'Ordner ändern', 'Mudar de pasta'),
  'wiz.folder.hint': S(
    'Use a Chromium browser (Edge / Chrome). Pick an empty folder to start from scratch, or an existing model to continue it. The browser shows only the folder’s name, not its full path.',
    'Usa un browser Chromium (Edge / Chrome). Scegli una cartella vuota per partire da zero, o un modello esistente per continuarlo. Il browser mostra solo il nome della cartella, non il percorso completo.',
    'Usa un navegador Chromium (Edge / Chrome). Elige una carpeta vacía para empezar de cero, o un modelo existente para continuarlo. El navegador solo muestra el nombre de la carpeta, no su ruta completa.',
    'Utilisez un navigateur Chromium (Edge / Chrome). Choisissez un dossier vide pour partir de zéro, ou un modèle existant pour le continuer. Le navigateur n’affiche que le nom du dossier, pas son chemin complet.',
    'Verwende einen Chromium-Browser (Edge / Chrome). Wähle einen leeren Ordner für einen Neuanfang oder ein bestehendes Modell, um es fortzusetzen. Der Browser zeigt nur den Ordnernamen, nicht den vollständigen Pfad.',
    'Use um navegador Chromium (Edge / Chrome). Escolha uma pasta vazia para começar do zero, ou um modelo existente para continuá-lo. O navegador mostra apenas o nome da pasta, não o caminho completo.',
  ),
  'wiz.gh.repo': S('Repository', 'Repository', 'Repositorio', 'Dépôt', 'Repository', 'Repositório'),
  'wiz.gh.branch': S('Branch', 'Branch', 'Rama', 'Branche', 'Branch', 'Ramo'),
  'wiz.gh.token': S('Access token', 'Token di accesso', 'Token de acceso', 'Jeton d’accès', 'Zugriffstoken', 'Token de acesso'),
  'wiz.gh.connect': S('Connect', 'Connetti', 'Conectar', 'Connecter', 'Verbinden', 'Conectar'),
  'wiz.gh.reconnect': S('Reconnect', 'Riconnetti', 'Reconectar', 'Reconnecter', 'Neu verbinden', 'Reconectar'),
  'wiz.gh.connecting': S('Connecting…', 'Connessione…', 'Conectando…', 'Connexion…', 'Verbinde…', 'A conectar…'),
  'wiz.gh.help': S(
    'Need a token? On GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate. Give it access to this one repository, with permission Contents: Read and write.',
    'Ti serve un token? Su GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate. Dagli accesso a questo solo repository, con permesso Contents: Read and write.',
    '¿Necesitas un token? En GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate. Dale acceso solo a este repositorio, con permiso Contents: Read and write.',
    'Besoin d’un jeton ? Sur GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate. Donnez-lui accès à ce seul dépôt, avec la permission Contents: Read and write.',
    'Brauchst du ein Token? Auf GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate. Gib ihm Zugriff nur auf dieses Repository, mit der Berechtigung Contents: Read and write.',
    'Precisa de um token? No GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate. Dê acesso apenas a este repositório, com permissão Contents: Read and write.',
  ),
  'wiz.gh.openPage': S('Open that page →', 'Apri quella pagina →', 'Abrir esa página →', 'Ouvrir cette page →', 'Diese Seite öffnen →', 'Abrir essa página →'),
  'wiz.gh.tokenNote': S(
    'The token is encrypted on your device and never shown again.',
    'Il token è cifrato sul tuo dispositivo e non viene più mostrato.',
    'El token está cifrado en tu dispositivo y no se vuelve a mostrar.',
    'Le jeton est chiffré sur votre appareil et n’est plus jamais affiché.',
    'Das Token ist auf deinem Gerät verschlüsselt und wird nie wieder angezeigt.',
    'O token é cifrado no seu dispositivo e nunca mais é mostrado.',
  ),
  'wiz.gh.badRepo': S(
    'Use the form owner/repo (or paste the repo URL).',
    'Usa il formato owner/repo (o incolla l’URL del repo).',
    'Usa el formato owner/repo (o pega la URL del repo).',
    'Utilisez le format owner/repo (ou collez l’URL du dépôt).',
    'Verwende das Format owner/repo (oder füge die Repo-URL ein).',
    'Use o formato owner/repo (ou cole o URL do repo).',
  ),
  'wiz.gh.noToken': S('Paste a token below.', 'Incolla un token qui sotto.', 'Pega un token abajo.', 'Collez un jeton ci-dessous.', 'Füge unten ein Token ein.', 'Cole um token abaixo.'),
  'wiz.back': S('Back', 'Indietro', 'Atrás', 'Retour', 'Zurück', 'Voltar'),
  'wiz.continue': S('Continue', 'Continua', 'Continuar', 'Continuer', 'Weiter', 'Continuar'),
  'wiz.enter': S('Enter', 'Entra', 'Entrar', 'Entrer', 'Los', 'Entrar'),
  'wiz.need.name': S('a name', 'un nome', 'un nombre', 'un nom', 'einen Namen', 'um nome'),
  'wiz.need.key': S('an API key', 'una chiave API', 'una clave API', 'une clé API', 'einen API-Schlüssel', 'uma chave API'),
  'wiz.need.source': S('a folder or repo', 'una cartella o un repo', 'una carpeta o un repo', 'un dossier ou un dépôt', 'einen Ordner oder ein Repo', 'uma pasta ou repo'),
  // "Still need {0}." — {0} is the joined list
  'wiz.missing': S('Still need {0}.', 'Manca ancora {0}.', 'Falta todavía {0}.', 'Il manque encore {0}.', 'Es fehlt noch {0}.', 'Ainda falta {0}.'),
  'wiz.summary.empty': S('empty — start fresh', 'vuota — si parte da zero', 'vacía — empezar de cero', 'vide — repartir de zéro', 'leer — von vorn beginnen', 'vazia — começar do zero'),
  'wiz.summary.model': S('existing model · {0} files', 'modello esistente · {0} file', 'modelo existente · {0} archivos', 'modèle existant · {0} fichiers', 'bestehendes Modell · {0} Dateien', 'modelo existente · {0} ficheiros'),
  'wiz.summary.files': S('{0} files inside', '{0} file dentro', '{0} archivos dentro', '{0} fichiers à l’intérieur', '{0} Dateien darin', '{0} ficheiros dentro'),

  // ---- Key gate / reconnect ----
  'key.prompt': S(
    'Enter your Anthropic key to continue. It stays encrypted on your device — never shown, never in the folder.',
    'Inserisci la tua chiave Anthropic per continuare. Resta cifrata sul dispositivo: non viene mai mostrata né salvata nella cartella.',
    'Introduce tu clave de Anthropic para continuar. Queda cifrada en el dispositivo: nunca se muestra ni se guarda en la carpeta.',
    'Saisissez votre clé Anthropic pour continuer. Elle reste chiffrée sur l’appareil : jamais affichée, jamais enregistrée dans le dossier.',
    'Gib deinen Anthropic-Schlüssel ein, um fortzufahren. Er bleibt auf dem Gerät verschlüsselt: nie angezeigt, nie im Ordner gespeichert.',
    'Introduza a sua chave Anthropic para continuar. Fica cifrada no dispositivo: nunca é mostrada nem guardada na pasta.',
  ),
  'key.continue': S('Continue', 'Continua', 'Continuar', 'Continuer', 'Weiter', 'Continuar'),
  'key.settings': S('Settings', 'Impostazioni', 'Ajustes', 'Réglages', 'Einstellungen', 'Definições'),
  'connect.title': S('Reconnect your folder', 'Riconnetti la tua cartella', 'Reconecta tu carpeta', 'Reconnectez votre dossier', 'Ordner neu verbinden', 'Reconecte a sua pasta'),
  'connect.choose': S('Choose folder', 'Scegli cartella', 'Elegir carpeta', 'Choisir un dossier', 'Ordner wählen', 'Escolher pasta'),

  // ---- Shell ----
  'shell.settings': S('Settings', 'Impostazioni', 'Ajustes', 'Réglages', 'Einstellungen', 'Definições'),
  'shell.readonly': S('read-only', 'sola lettura', 'solo lectura', 'lecture seule', 'schreibgeschützt', 'só leitura'),
  'shell.loading': S('loading…', 'caricamento…', 'cargando…', 'chargement…', 'lädt…', 'a carregar…'),
  'nav.org': S('Org', 'Org', 'Org', 'Org', 'Org', 'Org'),
  'nav.chat': S('Chat', 'Chat', 'Chat', 'Chat', 'Chat', 'Chat'),
  'nav.map': S('Map', 'Mappa', 'Mapa', 'Carte', 'Karte', 'Mapa'),
  'nav.sections': S('Sections', 'Sezioni', 'Secciones', 'Sections', 'Bereiche', 'Secções'),

  // ---- Files pane ----
  'files.contracts': S('Contracts', 'Contratti', 'Contratos', 'Contrats', 'Verträge', 'Contratos'),
  'files.nodes': S('Nodes', 'Nodi', 'Nodos', 'Nœuds', 'Knoten', 'Nós'),
  'files.todo': S('{0} to do', '{0} da fare', '{0} por hacer', '{0} à faire', '{0} zu erledigen', '{0} por fazer'),
  'files.empty': S('nothing yet', 'ancora niente', 'todavía nada', 'rien encore', 'noch nichts', 'ainda nada'),
  'org.improve': S('Improve', 'Migliora', 'Mejorar', 'Améliorer', 'Verbessern', 'Melhorar'),
  'org.review': S('Review', 'Revisione', 'Revisar', 'Réviser', 'Prüfen', 'Rever'),
  'org.improveClean': S(
    'The model is complete — nothing to improve.',
    'Il modello è completo — niente da migliorare.',
    'El modelo está completo — nada que mejorar.',
    'Le modèle est complet — rien à améliorer.',
    'Das Modell ist vollständig — nichts zu verbessern.',
    'O modelo está completo — nada a melhorar.',
  ),
  'org.improveDone': S(
    'Improved over {0} round(s); {1} gap(s) left.',
    'Migliorato in {0} round; restano {1} lacune.',
    'Mejorado en {0} ronda(s); quedan {1} lagunas.',
    'Amélioré en {0} tour(s) ; il reste {1} manque(s).',
    'In {0} Runde(n) verbessert; {1} Lücke(n) übrig.',
    'Melhorado em {0} ronda(s); restam {1} lacunas.',
  ),
  'org.reviewClean': S(
    'Reads as coherent — nothing flagged.',
    'Risulta coerente — nessun rilievo.',
    'Resulta coherente — nada señalado.',
    'Cohérent — rien à signaler.',
    'Wirkt kohärent — nichts markiert.',
    'Parece coerente — nada assinalado.',
  ),
  'org.reviewFound': S(
    'Found {0} thing(s) to look at:',
    'Trovate {0} cose da guardare:',
    'Encontradas {0} cosas para revisar:',
    '{0} chose(s) à examiner :',
    '{0} Sache(n) zu prüfen:',
    'Encontradas {0} coisas a ver:',
  ),

  // ---- Chat ----
  'chat.message': S('Message…', 'Scrivi un messaggio…', 'Escribe un mensaje…', 'Écrire un message…', 'Nachricht…', 'Escreva uma mensagem…'),
  'chat.new': S('New', 'Nuova', 'Nueva', 'Nouvelle', 'Neu', 'Nova'),
  'chat.newChat': S('New chat', 'Nuova chat', 'Nuevo chat', 'Nouveau chat', 'Neuer Chat', 'Novo chat'),
  'chat.rename': S('Rename', 'Rinomina', 'Renombrar', 'Renommer', 'Umbenennen', 'Renomear'),
  'chat.delete': S('Delete', 'Elimina', 'Eliminar', 'Supprimer', 'Löschen', 'Eliminar'),
  'chat.deleteChat': S('Delete chat', 'Elimina chat', 'Eliminar chat', 'Supprimer le chat', 'Chat löschen', 'Eliminar chat'),
  'chat.deleteConfirm': S('Delete this chat?', 'Eliminare questa chat?', '¿Eliminar este chat?', 'Supprimer ce chat ?', 'Diesen Chat löschen?', 'Eliminar este chat?'),
  'chat.cancel': S('Cancel', 'Annulla', 'Cancelar', 'Annuler', 'Abbrechen', 'Cancelar'),
  'chat.save': S('Save', 'Salva', 'Guardar', 'Enregistrer', 'Speichern', 'Guardar'),
  'chat.switch': S('Switch chat', 'Cambia chat', 'Cambiar de chat', 'Changer de chat', 'Chat wechseln', 'Mudar de chat'),
  'chat.attach': S('Attach files', 'Allega file', 'Adjuntar archivos', 'Joindre des fichiers', 'Dateien anhängen', 'Anexar ficheiros'),
  'chat.send': S('Send', 'Invia', 'Enviar', 'Envoyer', 'Senden', 'Enviar'),
  'chat.jump': S('Jump to latest', 'Vai all’ultimo', 'Ir al último', 'Aller au dernier', 'Zum Neuesten springen', 'Ir ao mais recente'),
  'chat.images': S('{0} image(s)', '{0} immagine/i', '{0} imagen(es)', '{0} image(s)', '{0} Bild(er)', '{0} imagem(ns)'),
  'chat.unsupported': S(
    'Skipped {0} — for now only images and text files (md, txt, csv…). For a PDF, paste its text.',
    'Saltati {0} — per ora solo immagini e file di testo (md, txt, csv…). Per un PDF, incolla il testo.',
    'Omitidos {0} — por ahora solo imágenes y archivos de texto (md, txt, csv…). Para un PDF, pega el texto.',
    'Ignorés {0} — pour l’instant seulement images et fichiers texte (md, txt, csv…). Pour un PDF, collez le texte.',
    'Übersprungen: {0} — vorerst nur Bilder und Textdateien (md, txt, csv…). Für ein PDF den Text einfügen.',
    'Ignorados {0} — por agora só imagens e ficheiros de texto (md, txt, csv…). Para um PDF, cole o texto.',
  ),

  // ---- Workspace / map ----
  'ws.map': S('Map', 'Mappa', 'Mapa', 'Carte', 'Karte', 'Mapa'),
  'ws.file': S('File', 'File', 'Archivo', 'Fichier', 'Datei', 'Ficheiro'),
  'ws.pickItem': S(
    'select a contract or node on the left',
    'seleziona un contratto o un nodo a sinistra',
    'selecciona un contrato o un nodo a la izquierda',
    'sélectionnez un contrat ou un nœud à gauche',
    'wähle links einen Vertrag oder Knoten',
    'selecione um contrato ou nó à esquerda',
  ),
  'ws.mapEmpty': S(
    'the map fills in as you map',
    'la mappa prende forma man mano che procedi',
    'el mapa toma forma a medida que avanzas',
    'la carte se dessine au fil de votre travail',
    'die Karte entsteht nach und nach',
    'o mapa ganha forma à medida que avança',
  ),

  // ---- Diff card ----
  'diff.apply': S('Apply', 'Applica', 'Aplicar', 'Appliquer', 'Anwenden', 'Aplicar'),
  'diff.reject': S('Reject', 'Rifiuta', 'Rechazar', 'Rejeter', 'Ablehnen', 'Rejeitar'),

  // ---- Errors ----
  'err.keyRejected': S(
    'Your Anthropic API key was rejected. Open settings and check it.',
    'La tua chiave API Anthropic è stata rifiutata. Apri le impostazioni e controllala.',
    'Tu clave API de Anthropic fue rechazada. Abre los ajustes y revísala.',
    'Votre clé API Anthropic a été refusée. Ouvrez les réglages et vérifiez-la.',
    'Dein Anthropic-API-Schlüssel wurde abgelehnt. Öffne die Einstellungen und prüfe ihn.',
    'A sua chave API da Anthropic foi rejeitada. Abra as definições e verifique-a.',
  ),
  'err.rateLimited': S(
    'Rate limited by Anthropic — wait a moment and try again.',
    'Limite di frequenza da Anthropic — aspetta un momento e riprova.',
    'Límite de tasa de Anthropic — espera un momento e inténtalo de nuevo.',
    'Limite de débit d’Anthropic — attendez un instant et réessayez.',
    'Ratenlimit von Anthropic — warte einen Moment und versuche es erneut.',
    'Limite de taxa da Anthropic — espere um momento e tente novamente.',
  ),
  'err.overloaded': S(
    'Anthropic is overloaded right now — try again shortly.',
    'Anthropic è sovraccarico in questo momento — riprova tra poco.',
    'Anthropic está sobrecargado ahora mismo — inténtalo de nuevo en breve.',
    'Anthropic est surchargé en ce moment — réessayez bientôt.',
    'Anthropic ist gerade überlastet — versuche es gleich erneut.',
    'A Anthropic está sobrecarregada agora — tente novamente em breve.',
  ),
  'err.network': S(
    'Couldn’t reach Anthropic. Check your connection — and if you attached a large PDF or image, it may be too big: try a smaller file or paste the text.',
    'Impossibile raggiungere Anthropic. Controlla la connessione — e se hai allegato un PDF o un’immagine pesante, potrebbe essere troppo grande: prova un file più piccolo o incolla il testo.',
    'No se pudo contactar con Anthropic. Revisa tu conexión — y si adjuntaste un PDF o una imagen grande, puede ser demasiado: prueba un archivo más pequeño o pega el texto.',
    'Impossible de joindre Anthropic. Vérifiez votre connexion — et si vous avez joint un PDF ou une image volumineux, c’est peut-être trop lourd : essayez un fichier plus petit ou collez le texte.',
    'Anthropic konnte nicht erreicht werden. Prüfe deine Verbindung — und falls du ein großes PDF oder Bild angehängt hast, ist es vielleicht zu groß: nimm eine kleinere Datei oder füge den Text ein.',
    'Não foi possível contactar a Anthropic. Verifique a ligação — e se anexou um PDF ou imagem grande, pode ser demasiado: tente um ficheiro mais pequeno ou cole o texto.',
  ),
  'err.generic': S(
    'Something went wrong. Try again.',
    'Qualcosa è andato storto. Riprova.',
    'Algo salió mal. Inténtalo de nuevo.',
    'Une erreur s’est produite. Réessayez.',
    'Etwas ist schiefgelaufen. Versuche es erneut.',
    'Algo correu mal. Tente novamente.',
  ),

  // ---- Settings ----
  'set.title': S('Settings', 'Impostazioni', 'Ajustes', 'Réglages', 'Einstellungen', 'Definições'),
  'set.close': S('Close', 'Chiudi', 'Cerrar', 'Fermer', 'Schließen', 'Fechar'),
  'set.languages': S('Languages', 'Lingue', 'Idiomas', 'Langues', 'Sprachen', 'Idiomas'),
  'set.organization': S('Organization', 'Organizzazione', 'Organización', 'Organisation', 'Organisation', 'Organização'),
  'set.model': S('Model', 'Modello', 'Modelo', 'Modèle', 'Modell', 'Modelo'),
  'set.folder': S('Folder', 'Cartella', 'Carpeta', 'Dossier', 'Ordner', 'Pasta'),
  'set.source': S('Source', 'Sorgente', 'Fuente', 'Source', 'Quelle', 'Origem'),
  'set.disconnect': S(
    'Disconnect & reset',
    'Disconnetti e azzera',
    'Desconectar y restablecer',
    'Déconnecter et réinitialiser',
    'Trennen & zurücksetzen',
    'Desligar e repor',
  ),
  'set.disconnectConfirm': S(
    'Forget this source and your keys? Your files stay where they are.',
    'Dimenticare questa sorgente e le tue chiavi? I file restano dove sono.',
    '¿Olvidar esta fuente y tus claves? Tus archivos se quedan donde están.',
    'Oublier cette source et vos clés ? Vos fichiers restent où ils sont.',
    'Diese Quelle und deine Schlüssel vergessen? Deine Dateien bleiben, wo sie sind.',
    'Esquecer esta origem e as suas chaves? Os ficheiros ficam onde estão.',
  ),
  'set.disconnectDo': S('Disconnect', 'Disconnetti', 'Desconectar', 'Déconnecter', 'Trennen', 'Desligar'),
  'set.changeFolder': S('Change folder…', 'Cambia cartella…', 'Cambiar carpeta…', 'Changer de dossier…', 'Ordner ändern…', 'Mudar de pasta…'),
  'set.folderHint': S(
    'Changing the folder reloads the app on the new model.',
    'Cambiare cartella ricarica l’app sul nuovo modello.',
    'Cambiar la carpeta recarga la app con el nuevo modelo.',
    'Changer de dossier recharge l’app sur le nouveau modèle.',
    'Ein Ordnerwechsel lädt die App mit dem neuen Modell neu.',
    'Mudar de pasta recarrega a app com o novo modelo.',
  ),
  'set.langWarn': S(
    'Existing content stays in {0}. To make the whole model {1}, ask the agent to translate it — each change is a diff card you approve.',
    'I contenuti esistenti restano in {0}. Per portare tutto il modello in {1}, chiedi all’agente di tradurlo — ogni modifica è una diff card che approvi.',
    'El contenido existente se queda en {0}. Para pasar todo el modelo a {1}, pídele al agente que lo traduzca — cada cambio es una diff card que apruebas.',
    'Le contenu existant reste en {0}. Pour passer tout le modèle en {1}, demandez à l’agent de le traduire — chaque changement est une diff card que vous approuvez.',
    'Bestehende Inhalte bleiben auf {0}. Um das ganze Modell auf {1} zu bringen, bitte den Agenten, es zu übersetzen — jede Änderung ist eine Diff-Karte, die du bestätigst.',
    'O conteúdo existente fica em {0}. Para passar todo o modelo para {1}, peça ao agente para traduzi-lo — cada alteração é uma diff card que aprova.',
  ),
};

export function translate(lang: Lang, key: string, ...vars: (string | number)[]): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  let out = entry[lang] ?? entry.en;
  vars.forEach((v, i) => {
    out = out.replace(`{${i}}`, String(v));
  });
  return out;
}

const LangContext = createContext<Lang>('en');

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** Returns a translator bound to the current UI language. */
export function useT(): (key: string, ...vars: (string | number)[]) => string {
  const lang = useContext(LangContext);
  return (key, ...vars) => translate(lang, key, ...vars);
}

/** Render a "plain|emphasised" string with the editorial muted second half. */
export function Tx({ s }: { s: string }) {
  const i = s.indexOf('|');
  if (i === -1) return <>{s}</>;
  return (
    <>
      {s.slice(0, i)} <em>{s.slice(i + 1)}</em>
    </>
  );
}
