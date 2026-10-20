# Identidade, câmera e integridade — implementação para revisão

Esta implementação NÃO está ativada na produção. Não coletar CPF ou documentos reais antes de concluir o roteiro de implantação abaixo. Não representa um antifraude completo, consulta à Receita, prova de vida, reconhecimento facial ou validação bancária. Pix e dinheiro real continuam desligados.

## Identidade

CPF com dígitos verificadores, rejeição de sequências repetidas, nascimento/maioridade e revisão humana de documento e foto atual com documento. A aprovação é exclusiva de administrador que não seja o titular. CPF repetido entre contas é bloqueado também em submissões concorrentes pelo compare-and-swap. Um número matematicamente válido não prova titularidade. O operador precisa conferir documento, nome, CPF e rosto antes de aprovar e pode exigir verificação externa.

`KYC_ENCRYPTION_KEY`: segredo de 32 bytes em base64 (ou 64 caracteres hexadecimais), somente no servidor Arena. Não reutilizar a chave de serviço, não inserir em código, logs, chat ou variáveis públicas. Gerar diretamente no ambiente seguro de configuração. AES-256-GCM com IV aleatório protege CPF/nome/nascimento e cada imagem. HKDF separa a chave de criptografia da chave HMAC de deduplicação. A mudança desta chave exige migração planejada: uma rotação cega inviabiliza leitura e deduplicação. Sem chave válida, config informa indisponibilidade, envio retorna 503 e ativação das exigências é recusada.

Bucket `arena-trust-private` privado, verificado como privado antes do envio; apenas objetos cifrados, com MIME application/octet-stream. Sem políticas públicas de leitura ou escrita. Apenas o backend privilegiado escreve e lê. O estado público nunca contém ciphertext, hash do CPF, caminhos de documentos, fila de remoção ou dados legíveis. Mesmo o estado do admin contém só resumos; evidências precisam de GET autenticado exclusivo do admin, auditado antes da leitura. Todo retorno usa no-store. Identidade legível e documentos deixam de ser servidos após 30 dias e entram na rotina de remoção; o hash HMAC do CPF permanece enquanto existir a conta para prevenir duplicidade. Antes do lançamento, definir política aplicável para contestação, eliminação de conta e retenção de evidências.

## Câmera

Captura consentida de quadros JPEG a cada 15 segundos, sem áudio; NÃO é vídeo contínuo nem liveness. O usuário tem prévia e botão de desligar. O quadro anterior entra na fila de remoção e há tentativa de apagá-lo logo após persistir o substituto. O árbitro vê os quadros privados, precisa confirmar a sessão e renovar a confirmação em 2 minutos. Só confirmações feitas por admin que não joga contam. Quadros com mais de 30 segundos bloqueiam aceite/lance. O relógio NÃO é pausado: o aviso explica isso antes de ligar e o árbitro deve concluir a preparação antes de aceitar. Queda de câmera não significa fraude; resultados com fiscalização incompleta ficam em revisão. Os quadros não são mais servidos após 5 minutos e entram na limpeza.

Final de torneio usa a regra de câmera apenas na rodada final; a configuração de mesas com entrada pode exigi-la em todas. A câmera usa Permissions-Policy camera=(self), microphone=(). No Android, testar permissão nativa do WebView: sem ela a modalidade fiscalizada deve falhar, não fingir que está ativa.

## Extensões e sinais

A plataforma valida turno, legalidade e relógio no servidor; usa CSP e análise privada Stockfish. O navegador registra, após consentimento, ocultação da página, perda de foco e recursos chrome-extension:/moz-extension: visíveis no DOM. Não varre extensões instaladas, não lê outras abas, não coleta histórico, e não trata qualquer desses sinais como prova. Registros são limitados, privados para o admin e marcados client_untrusted. Nenhum gera banimento ou punição automática. Extensões em mundo isolado, software externo, outra tela e câmera externa não são bloqueáveis por essa observação.

## Implantação antes de coletar dados

1. Reconectar o ChatGPT Codex Connector com escrita APENAS em Castielfreitas/Xadrez e publicar a revisão testada. Não usar a instalação Vercel nem alterar StudyWise.
2. Configurar a chave secreta somente na Vercel equipe xadres/projeto arena-xadrez. Não ativar plano pago.
3. Executar `supabase/trust-cleanup.sql` apenas no Supabase Arena e verificar a execução. Há limpeza oportunista em requisições, mas ela não substitui o agendamento. Monitorar falhas de remoção; a fila persiste para tentativas posteriores. Verificar arquivos órfãos de upload interrompido antes do lançamento.
4. Validar com dados sintéticos: upload, descriptografia apenas pelo admin, isolamento entre contas, bloqueio de CPF duplicado, remoção e auditoria.
5. Validar câmera em dois aparelhos reais, recusa/revogação da permissão, reconexão, falta de árbitro e expiração. Não anunciar proteção anti-extensões absoluta.
6. Somente após essas verificações habilitar as exigências no admin. Não habilitar dinheiro real com base apenas nesta implementação.

## Triagem automática de fair play

O servidor executa Stockfish 19 em fila privada, com concessão temporária persistida por CAS para evitar processamento simultâneo do mesmo lance. Resultados incluem profundidade de ambas as buscas, perda em centipawns e diferença entre as alternativas. Dados ausentes não são substituídos por precisão perfeita.

A regra experimental arena-triage-v1 examina várias partidas e adversários, exclui abertura, posições forçadas, xeques e análises insuficientes. Concordância com engine e baixa perda acumulada podem abrir um caso privado e reter a liberação de prêmios. Tempos observados no servidor são evidência auxiliar. Sinais de foco e extensões são dados não confiáveis e isoladamente não causam punição.

Não é tecnologia proprietária do Chess.com, modelo calibrado, prova de trapaça nem probabilidade de culpa. Não detectar uma regra não certifica jogo limpo. Banimento/suspensão exigem decisão administrativa fundamentada; não há banimento automático por precisão. O administrador pode encerrar casos ou aplicar/reverter restrições com auditoria. Casos abertos impedem liberação manual e automática de prêmios.

Limites operacionais: a fila depende da disponibilidade das funções e das cotas gratuitas; não promete análise instantânea de todas as partidas sob carga. O navegador não pode impedir universalmente extensões, fotografias externas ou assistência em outro aparelho. KYC e câmera permanecem indisponíveis sem a chave privada configurada; câmera oferece quadros periódicos com supervisão humana, sem prova de presença automatizada.

## Rating e desempenho

Glicko-2 mantém pools independentes por ritmo. Torneios e desafios consultam o pool correspondente; verificação externa inicializa apenas pools ainda não disputados. A atualização ocorre uma vez por confronto homologado, com valores antes/depois e variação exibida. O rating geral legado continua disponível por compatibilidade; o ranking competitivo e o tabuleiro usam os pools. Empates reiniciam o confronto sem pontuar até haver vencedor. Treino local e computador não alteram rating competitivo.

Cada confronto iniciado registra no servidor os ratings e a incerteza de ambos. Vitórias repetidas contra adversários mais fortes de contas estabelecidas fornecem contexto de possível rating subestimado, sem abrir casos ou punir isoladamente. Contas provisórias são excluídas desse sinal. Não se atribui um Elo a lances nem se assume fraude por um lance brilhante.
