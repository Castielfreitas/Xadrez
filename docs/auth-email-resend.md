# E-mails da Arena Xadrez

Modelos de confirmação e recuperação: `supabase/templates/confirmation.html` e `recovery.html`. HTML com tabelas, estilos inline, contraste claro sobre grafite, destaque dourado e link de uso único gerado pelo Supabase. Não substituir ConfirmationURL por uma URL fixa.

## Pendência de ativação
A conta Resend consultada em 23/10/2026 não possui domínio. Cota consultada: 100 mensagens/dia e 3.000/mês. Não foi ativado SMTP nem criado segredo sem domínio verificado. Os modelos locais não alteram o serviço hospedado automaticamente.

1. Cadastrar um domínio próprio da Arena no Resend e verificar os registros DNS fornecidos. Não usar domínio de outro projeto.
2. Criar chave restrita ao envio nesse domínio; configurar em Supabase Auth SMTP por canal seguro. Nunca gravar chave neste repositório.
3. Configurar nome do remetente Arena Xadrez e endereço no domínio verificado. Usar parâmetros atuais da documentação Resend SMTP e desativar tracking de links para autenticação.
4. Colar os dois modelos no Supabase Auth Email Templates, com assuntos “Confirme seu e-mail · Arena Xadrez” e “Recupere seu acesso · Arena Xadrez”. Definir Site URL e redirect permitido como https://arena-xadrez.vercel.app/.
5. Validar cadastro e recuperação ponta a ponta em conta de teste autorizada, SPF/DKIM e entrega em inbox. Nenhuma mensagem foi enviada durante a preparação.

Frontend: recuperação solicita e-mail sem revelar se conta existe, reconhece PASSWORD_RECOVERY, exige confirmação de senha com mínimo de 10 caracteres, atualiza pelo SDK autenticado e encerra sessão ao concluir. Links expirados devem ser solicitados novamente.
