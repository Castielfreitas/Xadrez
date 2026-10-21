# Arte das peças e som

As peças usam uma renderização própria de madeira Staunton gerada pela ferramenta integrada image_gen, com transparência. É uma aparência 3D renderizada em sprites, sem câmera 3D interativa. A versão final foi convertida para WebP sem recortar as peças; o atlas está incorporado em public/pieces-3d.css (cerca de 216 KB). O código de seleção está em src/pieces.js.

Prompt de geração: Production chess game sprite atlas, 6 equal columns and 2 rows, king queen rook bishop knight pawn in both rows, light polished boxwood above dark polished ebony, photorealistic premium 3D Staunton, carved details and wood grain, three-quarter frontal slightly elevated camera, consistent lighting, true alpha transparency, no text/grid/board.

Prompt de refinamento: Preserve all 12 realistic wooden pieces and exact order. Correct layout to 6 equally sized columns and 2 rows, shared baseline and transparent margin, ensure complete king crosses, no overlap or labels, same camera and lighting.

Áudio original sintetizado no navegador: impacto de madeira no movimento, impacto mais grave e estalo na captura, volume ajustável com 85% inicial. Captura e xeque são camadas independentes. O contexto de áudio suspenso é retomado após interação. A destruição da peça dura 1,35 segundo e respeita a preferência de movimento reduzido.
