# Arena Atelier

A loja vende cosméticos de uso pessoal com licença não exclusiva. O selo azul indica um avatar Premium adquirido e equipado; não significa identidade verificada, reputação ou aprovação de fair play. A propriedade é consultada no servidor. Copiar ou enviar uma imagem não concede o selo ou efeitos oficiais.

## Catálogo

16 coleções, 16 arquétipos vetoriais originais, 8 paletas e 4 ornamentos compõem 8.192 variações de avatar. Há 512 molduras e 512 efeitos (9.216 SKUs). São variações procedurais, não milhares de ilustrações desenhadas individualmente. Avatares custam R$ 4,90–7,90; molduras R$ 2,90–5,90; efeitos R$ 3,90–6,90. O preço canônico está em `src/shop-catalog.js` e é validado no servidor.

## Compra e receita

O usuário entra com e-mail confirmado, possui identidade financeira aprovada e saldo BRL disponível. A confirmação mostra item, valor e consentimento. `shop-buy` valida o SKU e o preço esperado, então grava débito, receita da plataforma, pedido e propriedade numa única transação CAS. Repetir o identificador não cobra novamente. Saldo reservado em partidas não pode ser gasto na loja. Créditos antigos não são convertidos em reais. Nenhuma nova cobrança no processador é criada pela compra; recargas seguem o fluxo existente da carteira.

`shop-summary` retorna somente o inventário e pedidos do próprio usuário. Administradores recebem também vendas e receita líquida de estornos. `shop-equip` aceita apenas itens ativos do inventário. O estado público contém somente a seleção validada e o indicador Premium derivado, sem pedidos ou saldos. Alterar a foto de perfil remove o avatar equipado, preservando moldura/efeito.

`shop-refund` exige administrador e motivo, devolve o valor à carteira BRL uma vez, reverte a receita disponível e revoga o item. Não envia estorno externo nem remove bloqueios financeiros. Se a receita disponível foi retirada, é preciso recompor essa disponibilidade antes do estorno. Contabilidade e auditoria retêm o pedido original.

## Validação

213 testes automatizados passaram, incluindo concorrência, idempotência, saldo insuficiente, preço adulterado, propriedade, isolamento de dados, estorno, rotas HTTP autenticadas e confirmação de compra na interface. O build frontend e o bundle Supabase foram concluídos. Testes automatizados utilizam carteira de teste isolada e não comprovam um débito real de produção. A verificação pública da implantação e eventual compra real devem ser registradas separadamente.
