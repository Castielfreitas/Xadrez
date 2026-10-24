import {identityRows} from './i18n-identity.js';
import {financeRows} from './i18n-finance.js';
import {shopRows} from './i18n-shop.js';
import {lessonRows,paymentRows} from './i18n-lessons.js';
export const LANGUAGES={pt:'Português',en:'English',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano'};
export const LOCALES={pt:'pt-BR',en:'en-US',es:'es-ES',fr:'fr-FR',de:'de-DE',it:'it-IT'};
export function detectLanguage(languages=[]){for(const language of languages){const code=String(language).toLowerCase().split(/[-_]/)[0];if(LANGUAGES[code])return code;}return 'en';}
const rows=`
Rating de exibição|Display rating|Rating de visualización|Classement affiché|Angezeigte Wertung|Rating visualizzato
Valor visual e indicativo. A força do motor permanece no nível máximo.|Indicative display only. Engine strength stays at maximum.|Valor visual e indicativo. La fuerza del motor permanece al máximo.|Valeur indicative affichée. La force du moteur reste maximale.|Nur ein Anzeigewert. Die Engine bleibt auf maximaler Stärke.|Valore indicativo. La forza del motore resta massima.
Recurso de extensão detectado: lances bloqueados. Desative-o para continuar. O relógio permanece ativo.|Extension resource detected: moves are blocked. Disable it to continue. The clock is still running.|Recurso de extensión detectado: jugadas bloqueadas. Desactívalo para continuar. El reloj sigue activo.|Extension détectée : coups bloqués. Désactivez-la pour continuer. Le chronomètre reste actif.|Erweiterungsressource erkannt: Züge gesperrt. Deaktiviere sie, um fortzufahren. Die Uhr läuft weiter.|Risorsa di estensione rilevata: mosse bloccate. Disattivala per continuare. Il tempo continua a scorrere.

Inscrever Cassandra - computador — a inscrição será debitada da minha carteira em reais. Em caso de cancelamento ou vitória da Cassandra, a devolução ou o prêmio será creditado nessa carteira.|Enter Cassandra - computer — entry is charged to my BRL wallet. If cancelled or Cassandra wins, the refund or prize returns to that wallet.|Inscribir a Cassandra - computadora — la entrada se debita de mi cartera BRL. Si se cancela o gana Cassandra, la devolución o premio irá a esa cartera.|Inscrire Cassandra - ordinateur — l'inscription est débitée de mon portefeuille BRL. En cas d'annulation ou de victoire de Cassandra, le remboursement ou prix revient à ce portefeuille.|Cassandra - Computer anmelden — der Einsatz wird meiner BRL-Wallet belastet. Bei Absage oder Sieg von Cassandra gehen Erstattung oder Preis an diese Wallet.|Iscrivi Cassandra - computer — l'iscrizione viene addebitata al mio portafoglio BRL. In caso di annullamento o vittoria di Cassandra, rimborso o premio torna a quel portafoglio.
Ao se inscrever, você aceita essa participação. Partidas contra Sandra não alteram o rating. Se o computador vencer, o prêmio será destinado à carteira do organizador.|By registering, you accept this participation. Games against Sandra do not affect rating. If the computer wins, the prize goes to the organizer's wallet.|Al inscribirte, aceptas esta participación. Jugar contra Sandra no afecta el rating. Si gana la computadora, el premio va a la cartera del organizador.|L'inscription vaut acceptation de cette participation. Les parties contre Sandra ne modifient pas le classement. Si l'ordinateur gagne, le prix va au portefeuille de l'organisateur.|Mit der Anmeldung akzeptierst du diese Teilnahme. Partien gegen Sandra verändern die Wertung nicht. Gewinnt der Computer, geht der Preis an die Wallet des Veranstalters.|Iscrivendoti, accetti questa partecipazione. Le partite contro Sandra non cambiano il rating. Se vince il computer, il premio va al portafoglio dell'organizzatore.

Não criada|Not created|No creada|Non créée|Nicht erstellt|Non creata
Recarga mínima: R$ 5,00.|Minimum deposit: R$ 5.00.|Recarga mínima: R$ 5,00.|Dépôt minimum : 5,00 R$.|Mindesteinzahlung: R$ 5,00.|Ricarica minima: R$ 5,00.
A recarga mínima é de R$ 5,00.|The minimum deposit is R$ 5.00.|La recarga mínima es R$ 5,00.|Le dépôt minimum est de 5,00 R$.|Die Mindesteinzahlung beträgt R$ 5,00.|La ricarica minima è R$ 5,00.
Recarga não criada: o valor mínimo é R$ 5,00.|Deposit not created: minimum amount is R$ 5.00.|Recarga no creada: el mínimo es R$ 5,00.|Dépôt non créé : montant minimum 5,00 R$.|Einzahlung nicht erstellt: Mindestbetrag R$ 5,00.|Ricarica non creata: minimo R$ 5,00.

Seu saldo em reais pode ser usado nas partidas e torneios da Arena.|Your BRL balance can be used in Arena games and tournaments.|Tu saldo en BRL puede usarse en partidas y torneos de Arena.|Votre solde en BRL peut être utilisé dans les parties et tournois Arena.|Dein BRL-Guthaben kann für Arena-Partien und Turniere verwendet werden.|Il saldo BRL può essere usato nelle partite e nei tornei Arena.
Carteira administrativa|Administrative wallet|Cartera administrativa|Portefeuille administratif|Verwaltungs-Wallet|Portafoglio amministrativo
Consulte a receita, o saldo e o extrato em reais na carteira.|View revenue, balance and BRL transactions in the wallet.|Consulta ingresos, saldo y movimientos en BRL en la cartera.|Consultez les revenus, le solde et les mouvements en BRL dans le portefeuille.|Einnahmen, Guthaben und BRL-Umsätze findest du in der Wallet.|Consulta ricavi, saldo e movimenti in BRL nel portafoglio.
Abrir carteira em reais|Open BRL wallet|Abrir cartera en BRL|Ouvrir le portefeuille BRL|BRL-Wallet öffnen|Apri portafoglio BRL

Como receber|How to receive|Cómo recibir|Comment recevoir|Auszahlungsweg|Come ricevere
Pix · chave CPF do titular|Pix · holder's CPF key|Pix · clave CPF del titular|Pix · clé CPF du titulaire|Pix · CPF-Schlüssel des Inhabers|Pix · chiave CPF del titolare
TED · conta bancária no Brasil|TED · Brazilian bank account|TED · cuenta bancaria en Brasil|TED · compte bancaire au Brésil|TED · Bankkonto in Brasilien|TED · conto bancario in Brasile
Conta bancária do titular|Holder's bank account|Cuenta bancaria del titular|Compte bancaire du titulaire|Bankkonto des Inhabers|Conto bancario del titolare
Código do banco|Bank code|Código bancario|Code banque|Bankcode|Codice banca
Agência sem dígito|Branch without check digit|Agencia sin dígito|Agence sans clé|Filiale ohne Prüfziffer|Filiale senza cifra di controllo
Dígito da agência (se houver)|Branch check digit (if any)|Dígito de agencia (si existe)|Clé de l'agence (si présente)|Prüfziffer der Filiale (falls vorhanden)|Cifra di controllo filiale (se presente)
Conta sem dígito|Account without check digit|Cuenta sin dígito|Compte sans clé|Kontonummer ohne Prüfziffer|Conto senza cifra di controllo
Dígito da conta|Account check digit|Dígito de cuenta|Clé du compte|Prüfziffer des Kontos|Cifra di controllo del conto
Tipo de conta|Account type|Tipo de cuenta|Type de compte|Kontoart|Tipo di conto
Conta corrente|Checking account|Cuenta corriente|Compte courant|Girokonto|Conto corrente
Conta poupança|Savings account|Cuenta de ahorro|Compte épargne|Sparkonto|Conto di risparmio
Cartão de crédito ou débito|Credit or debit card|Tarjeta de crédito o débito|Carte de crédit ou de débit|Kredit- oder Debitkarte|Carta di credito o debito
Saques por Pix ou TED para conta do titular, após aprovação administrativa.|Pix or TED withdrawals to the holder's account after administrative approval.|Retiros Pix o TED a la cuenta del titular tras aprobación administrativa.|Retraits Pix ou TED vers le compte du titulaire après approbation administrative.|Pix- oder TED-Auszahlungen an das Konto des Inhabers nach Freigabe.|Prelievi Pix o TED al conto del titolare dopo approvazione amministrativa.
O nome e o CPF serão os da sua identidade aprovada. Informe uma conta sua no Brasil.|Your verified name and CPF will be used. Enter your own Brazilian bank account.|Se usarán tu nombre y CPF verificados. Introduce tu cuenta en Brasil.|Votre nom et CPF vérifiés seront utilisés. Indiquez votre compte au Brésil.|Dein verifizierter Name und CPF werden verwendet. Gib dein eigenes Konto in Brasilien an.|Saranno usati nome e CPF verificati. Inserisci un tuo conto in Brasile.
A TED depende do horário e do processamento bancário. O saldo fica reservado até a confirmação ou devolução.|TED depends on banking hours and processing. Funds stay reserved until confirmation or return.|TED depende del horario y procesamiento bancario. El saldo queda reservado hasta confirmación o devolución.|TED dépend des horaires et du traitement bancaire. Le solde reste réservé jusqu'à confirmation ou restitution.|TED hängt von Bankzeiten und Verarbeitung ab. Das Guthaben bleibt bis zur Bestätigung oder Rückgabe reserviert.|TED dipende dagli orari e dall'elaborazione bancaria. Il saldo resta riservato fino a conferma o restituzione.
O pagamento com cartão é concluído na página segura do processador de pagamentos. Depois, volte à carteira para acompanhar a confirmação.|Card payment is completed on the secure payment page. Then return to your wallet to track confirmation.|El pago con tarjeta se completa en la página segura del procesador de pagos. Luego vuelve a la cartera para ver la confirmación.|Le paiement par carte se termine sur la page de paiement sécurisée. Revenez ensuite au portefeuille pour suivre la confirmation.|Die Kartenzahlung erfolgt auf der sicheren Zahlungsseite. Kehre danach zur Wallet zurück, um die Bestätigung zu verfolgen.|Il pagamento con carta si completa sulla pagina di pagamento sicura. Poi torna al portafoglio per seguire la conferma.
Autorizo o envio dos dados bancários informados ao processador de pagamentos. O saque será destinado à minha conta e ficará reservado até a conclusão.|I authorize sharing these bank details with the payment processor. The withdrawal goes to my own account and remains reserved until completion.|Autorizo enviar estos datos bancarios al procesador de pagos. El retiro irá a mi cuenta y quedará reservado hasta completarse.|J'autorise l'envoi de ces coordonnées bancaires au prestataire de paiement. Le retrait ira vers mon compte et restera réservé jusqu'à sa conclusion.|Ich erlaube die Weitergabe dieser Bankdaten an den Zahlungsdienstleister. Die Auszahlung geht auf mein Konto und bleibt bis zum Abschluss reserviert.|Autorizzo l'invio dei dati bancari al gestore dei pagamenti. Il prelievo va al mio conto e resta riservato fino al completamento.

Entrada em reais · busca automática|BRL entry · automatic matchmaking|Entrada en BRL · búsqueda automática|Entrée en BRL · recherche automatique|BRL-Einsatz · automatische Spielersuche|Ingresso in BRL · ricerca automatica
Retomar treino|Resume practice|Continuar práctica|Reprendre l'entraînement|Training fortsetzen|Riprendi allenamento
Criar desafio +|Create challenge +|Crear desafío +|Créer un défi +|Herausforderung erstellen +|Crea una sfida +
Rápido · 10 min|Rapid · 10 min|Rápidas · 10 min|Rapide · 10 min|Schnellschach · 10 min|Rapido · 10 min
Modos de jogo|Game modes|Modos de juego|Modes de jeu|Spielmodi|Modalità di gioco
Modos disponíveis|Available modes|Modos disponibles|Modes disponibles|Verfügbare Modi|Modalità disponibili
Entre para ver valores|Log in to see amounts|Inicia sesión para ver importes|Connectez-vous pour voir les montants|Anmelden, um Beträge zu sehen|Accedi per vedere gli importi

Arena · Xadrez competitivo|Arena · Competitive chess|Arena · Ajedrez competitivo|Arena · Échecs compétitifs|Arena · Wettkampfschach|Arena · Scacchi competitivi
Jogar|Play|Jugar|Jouer|Spielen|Gioca
Torneios|Tournaments|Torneos|Tournois|Turniere|Tornei
Ranking|Leaderboard|Clasificación|Classement|Rangliste|Classifica
Jogadores|Players|Jugadores|Joueurs|Spieler|Giocatori
Aprender|Learn|Aprender|Apprendre|Lernen|Impara
Fair play|Fair play|Juego limpio|Fair-play|Fairplay|Fair play
Meus confrontos|My matches|Mis partidas|Mes parties|Meine Partien|Le mie partite
Carteira|Wallet|Cartera|Portefeuille|Wallet|Portafoglio
Administração|Administration|Administración|Administration|Verwaltung|Amministrazione
Entrar|Log in|Iniciar sesión|Se connecter|Anmelden|Accedi
Sair|Log out|Cerrar sesión|Se déconnecter|Abmelden|Esci
Cadastrar|Sign up|Registrarse|S'inscrire|Registrieren|Registrati
Criar conta|Create account|Crear cuenta|Créer un compte|Konto erstellen|Crea account
Nome|Name|Nombre|Nom|Name|Nome
Nome de usuário|Username|Nombre de usuario|Nom d'utilisateur|Benutzername|Nome utente
Senha|Password|Contraseña|Mot de passe|Passwort|Password
E-mail|Email|Correo electrónico|E-mail|E-Mail|Email
Confirmar senha|Confirm password|Confirmar contraseña|Confirmer le mot de passe|Passwort bestätigen|Conferma password
Idioma|Language|Idioma|Langue|Sprache|Lingua
Automático|Automatic|Automático|Automatique|Automatisch|Automatico
SEU PRÓXIMO LANCE|YOUR NEXT MOVE|TU PRÓXIMA JUGADA|VOTRE PROCHAIN COUP|DEIN NÄCHSTER ZUG|LA TUA PROSSIMA MOSSA
Jogue com confiança.|Play with confidence.|Juega con confianza.|Jouez en confiance.|Spiele mit Vertrauen.|Gioca con fiducia.
Regras claras.|Clear rules.|Reglas claras.|Des règles claires.|Klare Regeln.|Regole chiare.
Competição justa.|Fair competition.|Competición justa.|Une compétition équitable.|Fairer Wettbewerb.|Competizione leale.
Conheça o fair play ↗|Explore fair play ↗|Conoce el juego limpio ↗|Découvrir le fair-play ↗|Fairplay entdecken ↗|Scopri il fair play ↗
Visitante|Guest|Visitante|Visiteur|Gast|Ospite
Entre para jogar online|Log in to play online|Inicia sesión para jugar online|Connectez-vous pour jouer en ligne|Zum Online-Spielen anmelden|Accedi per giocare online
Visitante · entre para jogar online|Guest · log in to play online|Visitante · inicia sesión para jugar online|Visiteur · connectez-vous pour jouer|Gast · zum Spielen anmelden|Ospite · accedi per giocare
Jogar online|Play online|Jugar online|Jouer en ligne|Online spielen|Gioca online
Escolha seu tempo · grátis|Choose your time · free|Elige tu ritmo · gratis|Choisissez la cadence · gratuit|Bedenkzeit wählen · kostenlos|Scegli il tempo · gratis
Contra o computador|Play the computer|Contra el ordenador|Contre l'ordinateur|Gegen den Computer|Contro il computer
8 níveis · escolha sua cor e ritmo|8 levels · choose your side and time|8 niveles · elige color y ritmo|8 niveaux · choisissez couleur et cadence|8 Stufen · Farbe und Zeit wählen|8 livelli · scegli colore e tempo
Jogar com entrada|Play for a prize|Jugar con inscripción|Jouer avec inscription|Mit Einsatz spielen|Gioca con iscrizione
Disponível em breve|Coming soon|Próximamente|Bientôt disponible|Demnächst verfügbar|Prossimamente
Selecionado|Selected|Seleccionado|Sélectionné|Ausgewählt|Selezionato
PARA QUEM PENSA À FRENTE|THINK ONE MOVE AHEAD|PIENSA UNA JUGADA MÁS ALLÁ|PENSEZ UN COUP À L'AVANCE|DENKE EINEN ZUG VORAUS|PENSA UNA MOSSA AVANTI
Seu talento.|Your talent.|Tu talento.|Votre talent.|Dein Talent.|Il tuo talento.
Seu próximo|Your next|Tu próximo|Votre prochain|Deine nächste|La tua prossima
Seu próximo desafio.|Your next challenge.|Tu próximo desafío.|Votre prochain défi.|Deine nächste Herausforderung.|La tua prossima sfida.
desafio.|challenge.|desafío.|défi.|Herausforderung.|sfida.
Encontre seu adversário, entre na mesa|Find your opponent, take your seat|Encuentra rival, toma tu lugar|Trouvez un adversaire, prenez place|Finde deinen Gegner, nimm Platz|Trova un avversario, prendi posto
e faça cada lance valer.|and make every move count.|y haz que cada jugada cuente.|et faites compter chaque coup.|und lass jeden Zug zählen.|e fai valere ogni mossa.
Criar desafio|Create challenge|Crear desafío|Créer un défi|Herausforderung erstellen|Crea una sfida
Explorar torneios|Explore tournaments|Explorar torneos|Explorer les tournois|Turniere entdecken|Esplora tornei
Valores e taxa visíveis antes do aceite|Entry and fee shown before acceptance|Importes y comisión antes de aceptar|Montants et frais avant acceptation|Beträge und Gebühr vor Annahme|Importi e commissione prima di accettare
Uma boa partida|A great game|Una buena partida|Une belle partie|Eine gute Partie|Una bella partita
começa com você.|starts with you.|empieza contigo.|commence avec vous.|beginnt mit dir.|inizia con te.
Aqueça seu jogo|Warm up your game|Calienta tu juego|Échauffez votre jeu|Spiel dich warm|Riscalda il tuo gioco
Tabuleiro livre no mesmo aparelho|Free board on this device|Tablero libre en este dispositivo|Échiquier libre sur cet appareil|Freies Brett auf diesem Gerät|Scacchiera libera su questo dispositivo
Jogue online|Play online|Juega online|Jouez en ligne|Spiele online|Gioca online
Desafie outros jogadores|Challenge other players|Desafía a otros jugadores|Défiez d'autres joueurs|Fordere andere Spieler heraus|Sfida altri giocatori
Entre na competição|Join the competition|Únete a la competición|Rejoignez la compétition|Mach beim Wettbewerb mit|Entra nella competizione
Treino|Practice|Práctica|Entraînement|Training|Allenamento
Evolua lance a lance|Improve with every move|Mejora con cada jugada|Progressez coup après coup|Verbessere dich Zug für Zug|Migliora mossa dopo mossa
Partidas justas|Fair games|Partidas justas|Des parties équitables|Faire Partien|Partite corrette
ESCOLHA SUA MESA|CHOOSE YOUR TABLE|ELIGE TU MESA|CHOISISSEZ VOTRE TABLE|WÄHLE DEINEN TISCH|SCEGLI IL TUO TAVOLO
Desafios abertos|Open challenges|Desafíos abiertos|Défis ouverts|Offene Herausforderungen|Sfide aperte
Todas as mesas|All tables|Todas las mesas|Toutes les tables|Alle Tische|Tutti i tavoli
Grátis|Free|Gratis|Gratuit|Kostenlos|Gratis
Com entrada|With entry fee|Con inscripción|Avec inscription|Mit Einsatz|Con iscrizione
Todos|All|Todos|Tous|Alle|Tutti
JOGADOR / RATING|PLAYER / RATING|JUGADOR / RATING|JOUEUR / CLASSEMENT|SPIELER / WERTUNG|GIOCATORE / RATING
RITMO|TIME CONTROL|RITMO|CADENCE|BEDENKZEIT|CADENZA
ENTRADA|ENTRY|INSCRIPCIÓN|INSCRIPTION|EINSATZ|ISCRIZIONE
PRÊMIO LÍQUIDO|NET PRIZE|PREMIO NETO|GAIN NET|NETTOGEWINN|PREMIO NETTO
Nenhum desafio neste ritmo. Crie a próxima mesa.|No challenges at this time control. Create one.|No hay desafíos a este ritmo. Crea uno.|Aucun défi à cette cadence. Créez-en un.|Keine Herausforderung mit dieser Bedenkzeit. Erstelle eine.|Nessuna sfida con questa cadenza. Creane una.
O saldo fica reservado até a homologação do resultado.|Funds stay reserved until the result is confirmed.|El saldo queda reservado hasta confirmar el resultado.|Le solde reste réservé jusqu'à confirmation du résultat.|Das Guthaben bleibt bis zur Bestätigung reserviert.|Il saldo resta riservato fino alla conferma del risultato.
INSCRIÇÕES ABERTAS|REGISTRATION OPEN|INSCRIPCIONES ABIERTAS|INSCRIPTIONS OUVERTES|ANMELDUNG OFFEN|ISCRIZIONI APERTE
SEU PRÓXIMO TROFÉU|YOUR NEXT TROPHY|TU PRÓXIMO TROFEO|VOTRE PROCHAIN TROPHÉE|DEINE NÄCHSTE TROPHÄE|IL TUO PROSSIMO TROFEO
A competição|The competition|La competición|La compétition|Der Wettbewerb|La competizione
começa aqui.|starts here.|empieza aquí.|commence ici.|beginnt hier.|inizia qui.
Enfrente jogadores da sua faixa e avance até a grande final.|Face players in your rating band and reach the final.|Compite con jugadores de tu nivel y llega a la final.|Affrontez des joueurs de votre niveau jusqu'à la finale.|Spiele gegen deine Wertungsgruppe und erreiche das Finale.|Affronta giocatori del tuo livello fino alla finale.
Formato|Format|Formato|Format|Format|Formato
Mata-mata|Knockout|Eliminación directa|Élimination directe|K.-o.-System|Eliminazione diretta
Empate|Draw|Tablas|Nulle|Remis|Patta
Revanche|Rematch|Revancha|Revanche|Revanche|Rivincita
Ver torneios|View tournaments|Ver torneos|Voir les tournois|Turniere ansehen|Vedi tornei
Cada lance conta.|Every move counts.|Cada jugada cuenta.|Chaque coup compte.|Jeder Zug zählt.|Ogni mossa conta.
Regras e privacidade|Rules and privacy|Reglas y privacidad|Règles et confidentialité|Regeln und Datenschutz|Regole e privacy
AVANCE A CADA VITÓRIA|ADVANCE WITH EVERY WIN|AVANZA CON CADA VICTORIA|AVANCEZ À CHAQUE VICTOIRE|MIT JEDEM SIEG WEITER|AVANZA CON OGNI VITTORIA
Torneios da Arena|Arena tournaments|Torneos de Arena|Tournois Arena|Arena-Turniere|Tornei Arena
Inscreva-se, aceite o confronto e conquiste seu lugar na final.|Register, accept your match and earn your place in the final.|Inscríbete, acepta tu partida y gana tu lugar en la final.|Inscrivez-vous, acceptez la partie et gagnez votre place en finale.|Melde dich an, nimm die Partie an und erreiche das Finale.|Iscriviti, accetta la partita e conquista la finale.
Entrar para organizar|Log in to organize|Accede para organizar|Se connecter pour organiser|Zum Organisieren anmelden|Accedi per organizzare
Em andamento e inscrições|Live and open|En curso y abiertas|En cours et ouvertes|Laufend und offen|In corso e aperte
Realizados|Completed|Finalizados|Terminés|Abgeschlossen|Conclusi
Cancelados|Cancelled|Cancelados|Annulés|Abgesagt|Annullati
Nenhum torneio nesta aba.|No tournaments in this tab.|No hay torneos en esta pestaña.|Aucun tournoi dans cet onglet.|Keine Turniere in diesem Tab.|Nessun torneo in questa scheda.
Inscrições abertas|Registration open|Inscripciones abiertas|Inscriptions ouvertes|Anmeldung offen|Iscrizioni aperte
Em andamento|In progress|En curso|En cours|Laufend|In corso
Concluído|Completed|Finalizado|Terminé|Abgeschlossen|Concluso
Cancelado|Cancelled|Cancelado|Annulé|Abgesagt|Annullato
Campeão|Champion|Campeón|Champion|Sieger|Campione
Premiação creditada|Prize credited|Premio acreditado|Prix crédité|Gewinn gutgeschrieben|Premio accreditato
Premiação em confirmação|Prize awaiting confirmation|Premio en confirmación|Prix en attente de confirmation|Gewinn wird bestätigt|Premio in attesa di conferma
INSCRIÇÃO|ENTRY FEE|INSCRIPCIÓN|INSCRIPTION|ANMELDEGEBÜHR|ISCRIZIONE
PRÊMIO FIXO|FIXED PRIZE|PREMIO FIJO|PRIX FIXE|FESTER PREIS|PREMIO FISSO
PRÊMIO GARANTIDO|GUARANTEED PRIZE|PREMIO GARANTIZADO|PRIX GARANTI|GARANTIERTER PREIS|PREMIO GARANTITO
PRÊMIO ATUAL|CURRENT PRIZE|PREMIO ACTUAL|PRIX ACTUEL|AKTUELLER PREIS|PREMIO ATTUALE
Participar do torneio|Join tournament|Participar en el torneo|Participer au tournoi|Am Turnier teilnehmen|Partecipa al torneo
Participar do campeonato|Join championship|Participar en el campeonato|Participer au championnat|An Meisterschaft teilnehmen|Partecipa al campionato
Ver campeonato e classificação|View tournament and standings|Ver torneo y clasificación|Voir tournoi et classement|Turnier und Tabelle ansehen|Vedi torneo e classifica
Inscrito|Registered|Inscrito|Inscrit|Angemeldet|Iscritto
Inscritos|Registered players|Inscritos|Inscrits|Angemeldete Spieler|Iscritti
Começa em|Starts in|Comienza en|Commence dans|Beginnt in|Inizia tra
Classificação ao vivo|Live standings|Clasificación en vivo|Classement en direct|Live-Tabelle|Classifica in diretta
Atualizada|Updated|Actualizada|Actualisé|Aktualisiert|Aggiornata
Inscrição|Entry fee|Inscripción|Inscription|Anmeldegebühr|Iscrizione
Premiação|Prize|Premio|Prix|Preis|Premio
Jogador|Player|Jugador|Joueur|Spieler|Giocatore
PAÍS|COUNTRY|PAÍS|PAYS|LAND|PAESE
PONTOS|POINTS|PUNTOS|POINTS|PUNKTE|PUNTI
Jogar contra o computador|Play against the computer|Jugar contra el ordenador|Jouer contre l'ordinateur|Gegen den Computer spielen|Gioca contro il computer
Escolha entre oito níveis, defina o ritmo e pratique seus próximos lances. Estas partidas não alteram seu rating.|Choose from eight levels, set the time control and practise. These games do not affect your rating.|Elige entre ocho niveles, configura el ritmo y practica. Estas partidas no modifican tu rating.|Choisissez parmi huit niveaux et entraînez-vous. Ces parties ne modifient pas votre classement.|Wähle aus acht Stufen und trainiere. Diese Partien ändern deine Wertung nicht.|Scegli fra otto livelli e allenati. Queste partite non modificano il rating.
Online|Online|Online|En ligne|Online|Online
Computador|Computer|Ordenador|Ordinateur|Computer|Computer
Configuração da partida|Game settings|Configuración de partida|Paramètres de partie|Partie-Einstellungen|Impostazioni partita
Dificuldade|Difficulty|Dificultad|Difficulté|Schwierigkeit|Difficoltà
Suas peças|Your pieces|Tus piezas|Vos pièces|Deine Figuren|I tuoi pezzi
Brancas|White|Blancas|Blancs|Weiß|Bianco
Pretas|Black|Negras|Noirs|Schwarz|Nero
Aleatórias|Random|Aleatorias|Aléatoires|Zufällig|Casuali
Tempo por jogador|Time per player|Tiempo por jugador|Temps par joueur|Zeit pro Spieler|Tempo per giocatore
Incremento por lance|Increment per move|Incremento por jugada|Incrément par coup|Inkrement pro Zug|Incremento per mossa
Sem relógio|Untimed|Sin reloj|Sans pendule|Ohne Uhr|Senza orologio
Começar partida|Start game|Comenzar partida|Commencer la partie|Partie starten|Inizia partita
Voltar|Back|Volver|Retour|Zurück|Indietro
Nova partida|New game|Nueva partida|Nouvelle partie|Neue Partie|Nuova partita
Voltar lance|Take back|Retroceder jugada|Annuler le coup|Zug zurücknehmen|Annulla mossa
Desistir|Resign|Abandonar|Abandonner|Aufgeben|Abbandona
Girar tabuleiro|Flip board|Girar tablero|Retourner l'échiquier|Brett drehen|Ruota scacchiera
Som ligado|Sound on|Sonido activado|Son activé|Ton an|Audio attivo
Som desligado|Sound off|Sonido desactivado|Son désactivé|Ton aus|Audio disattivato
Volume|Volume|Volumen|Volume|Lautstärke|Volume
Testar som|Test sound|Probar sonido|Tester le son|Ton testen|Prova audio
Destruição|Capture effect|Efecto de captura|Effet de capture|Schlageffekt|Effetto cattura
Brancas jogam|White to move|Juegan blancas|Trait aux blancs|Weiß am Zug|Muove il bianco
Pretas jogam|Black to move|Juegan negras|Trait aux noirs|Schwarz am Zug|Muove il nero
Computador pensando…|Computer thinking…|El ordenador está pensando…|L'ordinateur réfléchit…|Computer denkt…|Il computer sta pensando…
Lances|Moves|Jugadas|Coups|Züge|Mosse
Ocultar|Hide|Ocultar|Masquer|Ausblenden|Nascondi
Mostrar|Show|Mostrar|Afficher|Anzeigen|Mostra
Revisar lances|Review moves|Revisar jugadas|Revoir les coups|Züge ansehen|Rivedi mosse
Aguardando o primeiro lance.|Waiting for the first move.|Esperando la primera jugada.|En attente du premier coup.|Warte auf den ersten Zug.|In attesa della prima mossa.
Baixar PGN ↓|Download PGN ↓|Descargar PGN ↓|Télécharger PGN ↓|PGN herunterladen ↓|Scarica PGN ↓
Ocultar tabuleiro ao sair da tela|Hide board when leaving the page|Ocultar tablero al salir de la página|Masquer l'échiquier en quittant la page|Brett beim Verlassen ausblenden|Nascondi scacchiera uscendo dalla pagina
Você|You|Tú|Vous|Du|Tu
Adversário|Opponent|Rival|Adversaire|Gegner|Avversario
Primeiros lances|First moves|Primeras jugadas|Premiers coups|Erste Züge|Prime mosse
Iniciante|Beginner|Principiante|Débutant|Anfänger|Principiante
Aprendiz|Learner|Aprendiz|Apprenti|Lernender|Apprendista
Intermediário|Intermediate|Intermedio|Intermédiaire|Fortgeschritten|Intermedio
Desafiador|Challenger|Desafiante|Challenger|Herausforderer|Sfidante
Avançado|Advanced|Avanzado|Avancé|Experte|Avanzato
Especialista|Expert|Experto|Expert|Spezialist|Esperto
Máximo|Maximum|Máximo|Maximum|Maximum|Massimo
Vitória|Victory|Victoria|Victoire|Sieg|Vittoria
Derrota|Defeat|Derrota|Défaite|Niederlage|Sconfitta
Você deu xeque-mate no seu oponente.|You checkmated your opponent.|Has dado jaque mate a tu rival.|Vous avez fait échec et mat.|Du hast deinen Gegner mattgesetzt.|Hai dato scacco matto al tuo avversario.
Seu oponente deu xeque-mate.|Your opponent checkmated you.|Tu rival te ha dado jaque mate.|Votre adversaire vous a fait échec et mat.|Dein Gegner hat dich mattgesetzt.|Il tuo avversario ti ha dato scacco matto.
Saldo em reais|Balance in BRL|Saldo en BRL|Solde en BRL|Guthaben in BRL|Saldo in BRL
Recarregar saldo|Add funds|Recargar saldo|Ajouter des fonds|Guthaben aufladen|Ricarica saldo
Sacar via Pix|Withdraw via Pix|Retirar por Pix|Retirer via Pix|Per Pix auszahlen|Preleva via Pix
Transferir para jogador|Send to player|Transferir a jugador|Envoyer à un joueur|An Spieler senden|Invia a un giocatore
Atualizar carteira|Refresh wallet|Actualizar cartera|Actualiser le portefeuille|Wallet aktualisieren|Aggiorna portafoglio
Saques|Withdrawals|Retiros|Retraits|Auszahlungen|Prelievi
Recargas|Deposits|Recargas|Dépôts|Einzahlungen|Ricariche
Extrato em reais|BRL transactions|Movimientos en BRL|Opérations en BRL|BRL-Umsätze|Movimenti in BRL
Forma de pagamento|Payment method|Forma de pago|Mode de paiement|Zahlungsmethode|Metodo di pagamento
Cartão de crédito|Credit card|Tarjeta de crédito|Carte bancaire|Kreditkarte|Carta di credito
Valor em reais|Amount in BRL|Importe en BRL|Montant en BRL|Betrag in BRL|Importo in BRL
Continuar para pagamento|Continue to payment|Continuar al pago|Continuer vers le paiement|Weiter zur Zahlung|Continua al pagamento
Solicitar saque|Request withdrawal|Solicitar retiro|Demander un retrait|Auszahlung anfordern|Richiedi prelievo
Transferir saldo em reais|Transfer BRL balance|Transferir saldo en BRL|Transférer le solde en BRL|BRL-Guthaben übertragen|Trasferisci saldo in BRL
Jogador destinatário|Recipient player|Jugador destinatario|Joueur destinataire|Empfänger|Giocatore destinatario
Selecione o jogador|Select a player|Selecciona un jugador|Sélectionnez un joueur|Spieler auswählen|Seleziona un giocatore
Revisar transferência|Review transfer|Revisar transferencia|Vérifier le transfert|Überweisung prüfen|Rivedi trasferimento
Confirmar transferência|Confirm transfer|Confirmar transferencia|Confirmer le transfert|Überweisung bestätigen|Conferma trasferimento
Confirmar envio|Confirm transfer|Confirmar envío|Confirmer l'envoi|Senden bestätigen|Conferma invio
Destinatário|Recipient|Destinatario|Destinataire|Empfänger|Destinatario
Transferência concluída.|Transfer complete.|Transferencia completada.|Transfert terminé.|Überweisung abgeschlossen.|Trasferimento completato.
Transferência enviada|Transfer sent|Transferencia enviada|Transfert envoyé|Überweisung gesendet|Trasferimento inviato
Transferência recebida|Transfer received|Transferencia recibida|Transfert reçu|Überweisung erhalten|Trasferimento ricevuto
Pague com cartão|Pay by card|Pagar con tarjeta|Payer par carte|Mit Karte bezahlen|Paga con carta
Pague com Pix|Pay with Pix|Pagar con Pix|Payer avec Pix|Mit Pix bezahlen|Paga con Pix
Acessar checkout seguro ↗|Open secure payment ↗|Abrir pago seguro ↗|Ouvrir le paiement sécurisé ↗|Sichere Zahlung öffnen ↗|Apri pagamento sicuro ↗
Pix copia e cola|Copy-and-paste Pix code|Código Pix para copiar|Code Pix à copier|Pix-Code zum Kopieren|Codice Pix da copiare
Verifique sua identidade em Fair play para movimentar reais.|Verify your identity in Fair play to use BRL funds.|Verifica tu identidad en Juego limpio para usar BRL.|Vérifiez votre identité dans Fair-play pour utiliser des BRL.|Verifiziere deine Identität unter Fairplay für BRL-Zahlungen.|Verifica la tua identità in Fair play per usare BRL.
Operações em BRL exigem CPF e destino de saque do titular no Brasil.|BRL transactions require a Brazilian CPF and a withdrawal destination in the holder's name in Brazil.|Las operaciones en BRL requieren CPF brasileño y un destino de retiro a nombre del titular en Brasil.|Les opérations en BRL exigent un CPF brésilien et un compte de retrait au nom du titulaire au Brésil.|BRL-Zahlungen erfordern eine brasilianische CPF und ein Auszahlungskonto des Inhabers in Brasilien.|Le operazioni in BRL richiedono CPF brasiliano e destinazione di prelievo intestata al titolare in Brasile.
Saques para chave Pix CPF do titular, após aprovação administrativa.|Withdrawals go to the holder's CPF Pix key after administrative approval.|Retiros a la clave Pix CPF del titular, tras aprobación administrativa.|Retraits vers la clé Pix CPF du titulaire après approbation administrative.|Auszahlung an den CPF-Pix-Schlüssel des Inhabers nach Freigabe.|Prelievi alla chiave Pix CPF del titolare dopo approvazione amministrativa.
Carteira em revisão.|Wallet under review.|Cartera en revisión.|Portefeuille en vérification.|Wallet wird geprüft.|Portafoglio in revisione.
Recargas e saques ainda não estão disponíveis.|Deposits and withdrawals are not available yet.|Recargas y retiros aún no disponibles.|Dépôts et retraits indisponibles pour le moment.|Ein- und Auszahlungen sind noch nicht verfügbar.|Ricariche e prelievi non ancora disponibili.
Confirme seu e-mail|Confirm your email|Confirma tu correo|Confirmez votre e-mail|Bestätige deine E-Mail|Conferma la tua email
Já confirmei · entrar|Already confirmed · log in|Ya confirmé · entrar|Déjà confirmé · connexion|Bereits bestätigt · anmelden|Già confermato · accedi
Reenviar confirmação|Resend confirmation|Reenviar confirmación|Renvoyer la confirmation|Bestätigung erneut senden|Invia di nuovo la conferma
Aceitar|Accept|Aceptar|Accepter|Annehmen|Accetta
Cancelar|Cancel|Cancelar|Annuler|Abbrechen|Annulla
Salvar|Save|Guardar|Enregistrer|Speichern|Salva
Fechar|Close|Cerrar|Fermer|Schließen|Chiudi
Confirmar|Confirm|Confirmar|Confirmer|Bestätigen|Conferma
Procurar|Search|Buscar|Rechercher|Suchen|Cerca
Buscar|Search|Buscar|Rechercher|Suchen|Cerca
Amigos|Friends|Amigos|Amis|Freunde|Amici
Convidar|Invite|Invitar|Inviter|Einladen|Invita
Adicionar amigo|Add friend|Añadir amigo|Ajouter un ami|Freund hinzufügen|Aggiungi amico
Perfil|Profile|Perfil|Profil|Profil|Profilo
Online agora|Online now|En línea ahora|En ligne maintenant|Jetzt online|Online adesso
Todos os jogadores|All players|Todos los jugadores|Tous les joueurs|Alle Spieler|Tutti i giocatori
Nenhum jogador encontrado.|No players found.|No se encontraron jugadores.|Aucun joueur trouvé.|Keine Spieler gefunden.|Nessun giocatore trovato.
Configurações|Settings|Configuración|Paramètres|Einstellungen|Impostazioni
Aparência do tabuleiro|Board appearance|Apariencia del tablero|Apparence de l'échiquier|Brettgestaltung|Aspetto della scacchiera
Aprenda xadrez|Learn chess|Aprende ajedrez|Apprendre les échecs|Schach lernen|Impara gli scacchi
Recomeçar|Restart|Reiniciar|Recommencer|Neustart|Ricomincia
Ver dica|Show hint|Ver pista|Voir un indice|Tipp anzeigen|Mostra suggerimento
Próxima lição →|Next lesson →|Siguiente lección →|Leçon suivante →|Nächste Lektion →|Lezione successiva →
Lances da lição|Lesson moves|Jugadas de la lección|Coups de la leçon|Lektionszüge|Mosse della lezione
Selecione sua peça e depois a casa de destino.|Select your piece, then the destination square.|Selecciona tu pieza y luego la casilla de destino.|Sélectionnez une pièce puis sa case d'arrivée.|Wähle die Figur und dann das Zielfeld.|Seleziona un pezzo e poi la casa di destinazione.
Lição concluída|Lesson completed|Lección completada|Leçon terminée|Lektion abgeschlossen|Lezione completata
Aguardando seu primeiro lance.|Waiting for your first move.|Esperando tu primera jugada.|En attente de votre premier coup.|Warte auf deinen ersten Zug.|In attesa della tua prima mossa.
Essa peça não pode fazer esse lance. Tente outra casa.|That piece cannot make this move. Try another square.|Esa pieza no puede hacer esa jugada. Prueba otra casilla.|Ce coup n'est pas possible. Essayez une autre case.|Dieser Zug ist nicht möglich. Versuche ein anderes Feld.|Questo pezzo non può fare quella mossa. Prova un'altra casa.
Lance legal! Procure o lance que resolve o objetivo desta lição.|Legal move! Find the move that solves this lesson.|¡Jugada legal! Busca la que resuelve esta lección.|Coup légal ! Cherchez celui qui résout cette leçon.|Legal! Finde den Zug, der die Aufgabe löst.|Mossa legale! Cerca quella che risolve la lezione.
Bom lance! O adversário respondeu. Encontre a próxima jogada da sequência.|Good move! Find the next move after the opponent's reply.|¡Buena jugada! Encuentra la siguiente tras la respuesta rival.|Bon coup ! Trouvez la suite après la réponse adverse.|Guter Zug! Finde nach der Antwort den nächsten Zug.|Buona mossa! Trova la continuazione dopo la risposta.
`;
const dict=new Map((rows+lessonRows+paymentRows+shopRows+financeRows+identityRows).trim().split('\n').map(line=>{const [pt,...translations]=line.split('|');return [pt.toLocaleLowerCase('pt-BR'),Object.fromEntries(['en','es','fr','de','it'].map((lang,i)=>[lang,translations[i]]))];}));
export const hasTranslation=(value,language)=>language==='pt'||Boolean(dict.get(String(value).trim().toLocaleLowerCase('pt-BR'))?.[language]);
export function translateText(value,language='pt'){
 if(language==='pt'||!LANGUAGES[language]||typeof value!=='string')return value;
 const lead=value.match(/^\s*/)[0],trail=value.match(/\s*$/)[0],text=value.trim();if(!text)return value;
 let translated=dict.get(text.toLocaleLowerCase('pt-BR'))?.[language];
 if(!translated){const arrow=text.match(/^([←↗+✓▾]\s*)(.+)$/);if(arrow){const tail=translateText(arrow[2],language);if(tail!==arrow[2])translated=arrow[1]+tail;}}
 if(!translated&&text.endsWith(':')){const label=translateText(text.slice(0,-1),language);if(label!==text.slice(0,-1))translated=label+':';}
 if(!translated){const level=text.match(/^Nível (\d+) · (.+)$/);if(level)translated=({en:'Level',es:'Nivel',fr:'Niveau',de:'Stufe',it:'Livello'})[language]+' '+level[1]+' · '+translateText(level[2],language);}
 if(!translated){const compound=text.match(/^(Computador|Arena|Jogar|Torneios|Lances|Em andamento e inscrições|Realizados|Cancelados)\s*([·/]\s*.+|\d+)$/);if(compound)translated=translateText(compound[1],language)+' '+(compound[2].startsWith('·')?'· '+translateText(compound[2].slice(1).trim(),language):compound[2].startsWith('/')?'/ '+translateText(compound[2].slice(1).trim(),language):compound[2]);}
 const patterns=[
 [/^Meus itens \((\d+)\)$/,['My items ($1)','Mis artículos ($1)','Mes articles ($1)','Meine Artikel ($1)','I miei articoli ($1)']],
 [/^Confirmo a compra deste item por (.+), com débito do meu saldo em reais\.$/,['I confirm purchasing this item for $1 using my BRL wallet balance.','Confirmo la compra por $1 con mi saldo BRL.','Je confirme cet achat pour $1 avec mon solde BRL.','Ich bestätige den Kauf für $1 aus meinem BRL-Guthaben.','Confermo l’acquisto per $1 dal mio saldo BRL.']],
 [/^Comprar por (.+)$/,['Buy for $1','Comprar por $1','Acheter pour $1','Für $1 kaufen','Acquista per $1']],

  [/^(\d+) campeonatos? disponíveis$/,['Available tournaments: $1','Torneos disponibles: $1','Tournois disponibles : $1','Verfügbare Turniere: $1','Tornei disponibili: $1']],

  [/^(\d+) de (\d+) concluídas neste aparelho$/,['$1 of $2 completed on this device','$1 de $2 completadas en este dispositivo','$1 sur $2 terminées sur cet appareil','$1 von $2 auf diesem Gerät abgeschlossen','$1 di $2 completate su questo dispositivo']],
  [/^Seu lance (\d+) de (\d+)$/,['Your move $1 of $2','Tu jugada $1 de $2','Votre coup $1 sur $2','Dein Zug $1 von $2','La tua mossa $1 di $2']],
  [/^· (\d+) tentativas?$/,['· $1 attempts','· $1 intentos','· $1 essais','· $1 Versuche','· $1 tentativi']],
  [/^Dica: mova a peça de ([a-h][1-8]) para ([a-h][1-8])\.$/,['Hint: move from $1 to $2.','Pista: mueve de $1 a $2.','Indice : jouez de $1 à $2.','Tipp: Ziehe von $1 nach $2.','Suggerimento: muovi da $1 a $2.']],
  [/^(\d+) minutos$/,['$1 min','$1 min','$1 min','$1 min','$1 min']],
  [/^(\d+) segundos$/,['$1 s','$1 s','$1 s','$1 s','$1 s']],
  [/^Taxa ([\d.,]+)%$/,['Fee $1%','Comisión $1%','Frais $1%','Gebühr $1%','Commissione $1%']],
  [/^Reservado em partidas, torneios e saques: (.+)$/,['Reserved for games, tournaments and withdrawals: $1','Reservado para partidas, torneos y retiros: $1','Réservé pour parties, tournois et retraits : $1','Für Partien, Turniere und Auszahlungen reserviert: $1','Riservato per partite, tornei e prelievi: $1']],
  [/^Saldo disponível: (.+)\. Ambos os jogadores precisam ter identidade aprovada\.$/,['Available: $1. Both players need verified identities.','Disponible: $1. Ambos jugadores deben tener identidad verificada.','Disponible : $1. Les deux identités doivent être vérifiées.','Verfügbar: $1. Beide Identitäten müssen verifiziert sein.','Disponibile: $1. Entrambe le identità devono essere verificate.']],
 ];
 if(!translated){for(const [pattern,templates] of patterns){if(pattern.test(text)){translated=text.replace(pattern,templates[['en','es','fr','de','it'].indexOf(language)]);break;}}}
 if(!translated&&text.startsWith('Muito bem! '))translated=({en:'Well done! ',es:'¡Muy bien! ',fr:'Très bien ! ',de:'Sehr gut! ',it:'Molto bene! '})[language]+translateText(text.slice(11),language);
 if(!translated)return value;
 if(text.length>2&&text===text.toLocaleUpperCase())translated=translated.toLocaleUpperCase(LOCALES[language]);
 return lead+translated+trail;
}
const LANGUAGE_FLAGS={
 pt:['Brasil','🇧🇷','<rect width="24" height="16" fill="#169b62"/><path d="m12 2 10 6-10 6L2 8z" fill="#ffdf45"/><circle cx="12" cy="8" r="3.4" fill="#2253a1"/><path d="M9 7q3-1 6 2" fill="none" stroke="white" stroke-width=".8"/>'],
 en:['English','🇬🇧','<rect width="24" height="16" fill="#21468b"/><path d="m0 0 24 16M24 0 0 16" stroke="white" stroke-width="4"/><path d="m0 0 24 16M24 0 0 16" stroke="#cf3348" stroke-width="1.5"/><path d="M12 0v16M0 8h24" stroke="white" stroke-width="6"/><path d="M12 0v16M0 8h24" stroke="#cf3348" stroke-width="3"/>'],
 es:['España','🇪🇸','<rect width="24" height="16" fill="#c72b3f"/><path d="M0 4h24v8H0z" fill="#ffd34e"/><path d="M6 6h3v4H6z" fill="#c72b3f"/>'],
 fr:['France','🇫🇷','<path fill="#24479a" d="M0 0h8v16H0z"/><path fill="white" d="M8 0h8v16H8z"/><path fill="#ed3545" d="M16 0h8v16h-8z"/>'],
 de:['Deutschland','🇩🇪','<rect width="24" height="16" fill="#f4c644"/><path d="M0 0h24v5.34H0z" fill="#17191d"/><path d="M0 5.33h24v5.34H0z" fill="#df3d45"/>'],
 it:['Italia','🇮🇹','<path fill="#209970" d="M0 0h8v16H0z"/><path fill="white" d="M8 0h8v16H8z"/><path fill="#e4424d" d="M16 0h8v16h-8z"/>']
};
export function languageFlag(code){const flag=LANGUAGE_FLAGS[code]||LANGUAGE_FLAGS.en;return `<svg class="language-flag" viewBox="0 0 24 16" aria-hidden="true">${flag[2]}</svg>`;}
let current='pt';
export const languageLocale=()=>LOCALES[current];
export function initLanguage({root=document.body,storage=localStorage,languages=window.navigator?.languages||[],onChange=()=>{}}={}){
 let preference;try{preference=storage.getItem('arena-language');}catch{}
 current=LANGUAGES[preference]?preference:detectLanguage(languages);
 const originals=new WeakMap(),attrs=new WeakMap();let queued=false;
 const skip=node=>node.parentElement?.closest('script,style,code,pre,[translate="no"],[data-no-translate],.board,.hero-board,.player-link,.avatar,.moves-grid,.move-list');
 function apply(){queued=false;const walk=document.createTreeWalker(root,4);let node;while((node=walk.nextNode())){if(skip(node))continue;let saved=originals.get(node);if(!saved||node.nodeValue!==saved.rendered)saved={original:node.nodeValue};const value=translateText(saved.original,current);saved.rendered=value;originals.set(node,saved);if(node.nodeValue!==value)node.nodeValue=value;}
  for(const el of root.querySelectorAll('[placeholder],[aria-label],[title]')){if(el.closest('[translate="no"],.board,.hero-board,.avatar'))continue;let saved=attrs.get(el)||{};for(const key of ['placeholder','aria-label','title']){const value=el.getAttribute(key);if(value===null)continue;let a=saved[key];if(!a||value!==a.rendered)a={original:value};a.rendered=translateText(a.original,current);saved[key]=a;if(value!==a.rendered)el.setAttribute(key,a.rendered);}attrs.set(el,saved);}
  document.documentElement.lang=LOCALES[current];document.title=translateText('Arena · Xadrez competitivo',current);
 }
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(apply);}}):null;observer?.observe(root,{childList:true,subtree:true,characterData:true});
 function change(choice){preference=LANGUAGES[choice]?choice:'auto';try{storage.setItem('arena-language',preference);}catch{}current=LANGUAGES[preference]?preference:detectLanguage(languages);for(const picker of root.querySelectorAll('.language-picker')){const flag=picker.querySelector('.language-flag');if(flag)flag.outerHTML=languageFlag(current);const select=picker.querySelector('[data-language-select]');if(select)for(const option of select.querySelectorAll('option'))option.selected=option.value===preference;}apply();onChange(current);}
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-language-select]'))change(e.target.value);});apply();
 return {apply,change,get language(){return current},selector(){return `<label class="language-picker">${languageFlag(current)}<span class="language-label">Idioma</span><select data-language-select aria-label="Idioma"><option value="auto" ${!LANGUAGES[preference]?'selected':''}>Automático</option>${Object.entries(LANGUAGES).map(([key,name])=>`<option translate="no" value="${key}" ${preference===key?'selected':''}>${LANGUAGE_FLAGS[key][1]} ${name}</option>`).join('')}</select></label>`;}};
}
