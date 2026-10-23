# Preços e dashboards financeiros

## Acessos

- **Loja → Preços da loja**: somente administradores. Regras por categoria, coleção dentro da categoria ou SKU. O botão **Definir preço** em cada item abre seu editor direto.
- **Finanças**: administrador recebe a visão da plataforma e pode alternar para sua carteira. Demais usuários recebem apenas o próprio resumo.
- **Administração** e **Carteira** também oferecem atalhos.

## Preços

Precedência: SKU > coleção/categoria > categoria > preço padrão do catálogo. Faixa configurável de R$ 1,00 a R$ 10.000,00. Remover regra restaura o preço herdado. Cada alteração usa revisão otimista e registra auditoria. O preço é resolvido dentro da transação da compra e comparado ao valor confirmado pelo usuário; diferenças retornam 409 sem débito. Recibos anteriores e estornos preservam o preço original. O endpoint público retorna somente regras/revisão, sem histórico financeiro, inventários ou identificação do administrador.

## Dashboards

O servidor calcula relatórios da carteira BRL do ambiente ativo, sem misturar créditos antigos ou sandbox. Períodos de 7, 30, 90 dias, histórico completo ou intervalo personalizado de até 366 dias; dias seguem America/Sao_Paulo. Séries diárias para até 93 dias e mensais para períodos maiores.

Usuários veem saldo disponível/reservado, entradas, saídas, prêmios, resultado de partidas, recargas, saques, transferências, compras/estornos e extrato próprio. Administradores veem totais das carteiras, receita por origem, estornos, custos registrados, receita já retirada, operações pendentes, conciliação e situação financeira acumulada dos torneios. Saldos atuais e pendências são explicitamente separados dos indicadores por período.

Reservar/liberar saldo tem variação total zero e não é despesa/receita. Saques pagos reduzem saldo reservado. Transferências internas e recargas não são receita da plataforma. Resultado de jogos usa prêmios menos entradas liquidadas e aportes efetivados, incluindo financiamento do computador e complementos de premiação. O resultado líquido da plataforma desconta estornos e custos registrados de processamento; não inclui despesas externas não registradas. Saldo contábil estimado não é consulta ao saldo bancário do processador.

A conferência usa saldo inicial + entradas − saídas = saldo final. O total administrativo dos usuários exclui o saldo da plataforma; o extrato identifica separadamente as duas carteiras. A diferença acumulada entre saldos e lançamentos é exibida, sem correção automática.

## Exportação e segurança

Extrato paginado em 50 linhas. CSV exporta todas as linhas filtradas até 10.000; acima disso exige reduzir o período. Células potencialmente interpretadas como fórmula são neutralizadas. Dados bancários criptografados, documentos, CPF, e-mails, tokens e erros privados do processador não são exportados.

As rotas autenticam a sessão no servidor. O escopo plataforma e a alteração de preços exigem o papel administrativo configurado no servidor; informar um usuário ou escopo na URL não concede acesso. O dashboard pessoal filtra pelo ator autenticado, inclusive quando o próprio administrador escolhe sua carteira.
