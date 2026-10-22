# Arena Xadrez — checklist final da release 2026-10-22

## A. Experiência e tráfego
- [x] Hero com tabuleiro em perspectiva 3D e peças reais da Arena, sem biblioteca externa nem imagem pesada
- [x] Troféus dourados com volume, mantendo menus com traço fino
- [x] Rating em ambas as laterais da mesa, com valores indicativos explicitamente rotulados para bots
- [x] Modal do rei em 3D, seleção visual de modalidades, leitura de classificação dentro do campeonato
- [x] Jogadas online renderizadas imediatamente, com confirmação atômica do servidor e rollback se rejeitadas
- [x] Som de arrasto contínuo e captura como colapso/desmoronamento
- [x] Computador local com pequeno intervalo perceptível (~230 ms), sem demora adicional contra Casandra/online

## B. KYC automatizado (Didit)
- [x] Função Edge isolada `arena-kyc` com endpoints GET health, POST start e GET status (todos exceto health exigem sessão Supabase com e-mail confirmado)
- [x] Cada jogador cria uma sessão própria; não é permitido reutilizar identidade de outro usuário
- [x] Consulta da decisão diretamente no provedor; resultado aprovado exige documento com CPF válido, idade >=18, prova de vida e comparação facial aprovadas, AML por padrão
- [x] Resultado de Sandbox *não* aprova carteira em produção
- [x] Registros criptografados com esquema compatível com o armazenamento legado; deduplicação por hash HMAC e atualização atômica com compare-and-swap
- [x] Controle de tentativas, tabelas inacessíveis diretamente a anon/authenticated e RLS habilitado
- [x] Abertura e consulta do KYC pela carteira e pelo formulário de identidade
- [ ] Criar conta comercial Didit, workflow com **ID Verification + Liveness + Face Match + AML**, validar CPF brasileiro com documentos reais e configurar segredos de função `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_ENVIRONMENT` (sandbox antes de live)
- [ ] Homologar ponta a ponta uma sessão Didit Sandbox **com credenciais próprias do usuário** e depois produção; validar atualização financeira e recuperação após rede instável

Não informe senhas ou tokens no chat. Faça isso em [Supabase Edge Function Secrets](https://supabase.com/dashboard/project/kjqovtvhgulwufdzfmif/settings/functions).

## C. Piloto fechado
- [x] As três contas humanas presentes em Auth na data desta migração foram adicionadas à tabela `arena_pilot_accounts`
- [x] `max_deposit_cents = 100`, escopo Sandbox; validação no handler financeiro sem afetar jogadores gratuitos
- [ ] Ativar somente o Sandbox Asaas e simular depósitos/estornos/saques para os titulares individualmente
- [ ] Após autorização contratual específica do Asaas, chaves e webhooks PROD separados, KYC **produtivo** aprovado por usuário e conciliação real, liberar piloto fechado (limite R$1) com dois jogadores e administrador
- [ ] Incluir tributos, taxas e despesas no cálculo de margem líquida; validar a legalidade da premiação

## D. Infraestrutura financeira existente
- [x] Carteira, jogos em BRL e `production_enabled` continuam desativados por padrão
- [x] Verificação de prontidão, webhook Asaas autenticado, registros idempotentes e rotina de estorno/chargeback
- [ ] Aprovação formal do Asaas ao modelo torneio pago com premiação
- [ ] Chave Asaas produtiva, webhook PROD e configuração de conciliação testada
- [ ] Antifraude, LGPD, suporte operacional, política de estorno e contabilidade de premiações
- [ ] Ensaiar conciliação de saldo, prêmios, estorno Pix e saque com comprovante externo real

## E. Publicação
- [x] Testes automatizados e build devem passar no CI antes de merge
- [ ] Deployment Vercel `main` `Production` no último SHA aprovado
- [ ] Smoke test no domínio `https://arena-xadrez.vercel.app` em desktop e móvel
- [ ] Métricas de estabilidade, eventos de conversão e campanhas inicialmente pausadas

**Tráfego:** o site de jogos gratuitos pode receber visitantes após a publicação e testes do frontend. **Não anuncie depósitos, torneios com prêmio real ou saques enquanto B/C/D permanecerem pendentes.** O KYC automatizado é configurável; não está ativo sem uma conta Didit conectada.
