# REPAIR SIMULATOR

**Assistência técnica de dia, cassino à noite** — um roguelike em 3D no estilo visual novel.

![ícone](build/icon.png)

## ▶️ Jogar

- **No navegador:** https://luizhenriquevfernandes2008-ops.github.io/repair-simulator/
- **No Windows (offline):** baixe o `Repair Simulator.exe` na página de [Releases](../../releases) e dê dois cliques.
  O jogo inteiro (modelos 3D, sons, músicas e fontes) está dentro do `.exe`, que abre numa janela própria usando o Microsoft Edge que já vem no Windows.

## Como é o jogo

- **De dia** clientes chegam na sua lojinha (19 personagens com expressões, estilo visual novel). Ouça o problema, negocie o preço e conserte.
- **Bancada 3D** com 34 aparelhos (celulares, tablets, notebooks, consoles, controles, câmeras, rádio, drones, óculos VR...) e 9 ferramentas: parafusos, soprador, palheta, pinça, multímetro, ferro de solda, escova e lupa. Meça os pontos de teste para descobrir o defeito real — o cliente nem sempre sabe o que tem.
- **XP e level up:** a cada nível, escolha 1 de 3 melhorias sorteadas entre 50 (Comum, Rara, Épica e Lendária).
- **Lojinha da esquina:** 32 itens que rotacionam todo dia e vão para a mochila. O maço de cigarro só pode ser usado no cassino, com animação e bônus de sorte (item de ficção — fumar faz mal à saúde).
- **À noite:** cassino com neon (3 caça-níqueis, roleta, raspadinhas, Mega-Sorte e caixa misteriosa — dá pra apostar TUDO) ou a loja de melhorias.
- **Roguelike:** o aluguel sobe todo dia. **Se o dinheiro acabar, o jogo acaba.**
- **Conquistas:** 20 conquistas liberam relíquias permanentes que continuam valendo nas próximas partidas.

Controles: mouse · teclas **1–9** trocam de ferramenta · **I** mochila · **M** som · **F** tela cheia · **Espaço** avança diálogo / gira o caça-níquel.

## Estrutura

| Pasta / arquivo | O que é |
|---|---|
| `versao-navegador/` | O jogo (HTML + JavaScript + three.js). É o que o GitHub Pages publica. |
| `versao-navegador/js/models_data.js` | Modelos 3D embutidos (funciona até abrindo o `index.html` direto do disco). |
| `build/` | Fontes do `.exe` (C#, compilado com o `csc.exe` que já vem no Windows) e o ícone. |
| `CREDITOS.txt` | Autores e licenças de todos os modelos, sons e músicas. |

### Recompilar o `.exe`

```powershell
python build\make_zip.py versao-navegador build\game.zip
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /optimize+ "/out:Repair Simulator.exe" /win32icon:build\icon.ico /resource:build\game.zip,game.zip /r:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.IO.Compression.dll /r:System.Windows.Forms.dll build\Program.cs
```

## Créditos

- **Modelos 3D:** [poly.pizza](https://poly.pizza) — vários autores, licenças CC0 e CC-BY 3.0 (lista completa em `CREDITOS.txt`)
- **Efeitos sonoros:** [Kenney](https://kenney.nl) (CC0)
- **Músicas:** Kevin MacLeod ([incompetech.com](https://incompetech.com)) — Licensed under Creative Commons: By Attribution 4.0
- **Fontes:** Fredoka e Nunito (SIL Open Font License)
- **Motor 3D:** [three.js](https://threejs.org) r147 (MIT)
- **Personagens:** desenhados por código (SVG) especialmente para este jogo
