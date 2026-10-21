# DoGoBlock no Chromebook com envio de código Arduino offline

Este guia instala o DoGoBlock em um Chromebook para programar e enviar código
para placas Arduino **sem internet**. Ele é voltado para professores e para a
equipe de TI que prepara os Chromebooks da escola.

São duas partes:

| Parte | O que faz | Onde roda |
| --- | --- | --- |
| **App DoGoBlock** (PWA) | Editor de blocos. Depois de instalado e aberto uma vez com internet, abre mesmo sem conexão. | Chrome |
| **DoGoBlock Agent Offline** | Compila o código Arduino no próprio Chromebook. Também grava placas que o Chrome não consegue gravar sozinho. | Linux do ChromeOS |

Com internet, o editor continua compilando pela Dogoblock API. O Agent só é
usado quando a API não responde.

## O que funciona sem internet

| Recurso | Sem internet |
| --- | --- |
| Abrir o editor e montar blocos | Sim |
| Enviar programa para Arduino Uno e Nano | Sim, com o Agent Offline aberto |
| Enviar programa para Arduino Leonardo | Experimental: com o Agent Offline e a placa compartilhada com o Linux (passo 6) |
| Modo tempo real (palco) com Arduino Uno e Nano | Sim |
| Salvar e abrir projetos pelo menu Arquivo, no computador | Sim |
| Login, projetos na nuvem e comunidade | Não |
| Sprites, cenários e sons da biblioteca | Só os que já foram usados com internet |
| Programar micro:bit (MicroPython) | Não, porque a compilação ainda depende da API |
| Extensões de aprendizado de máquina | Só se já foram carregadas com internet |

## Requisitos

- Chromebook com processador **Intel ou AMD (x86_64)**. O Agent Offline ainda
  não tem versão para Chromebooks ARM (MediaTek, Qualcomm). Para conferir,
  depois de ativar o Linux, rode `uname -m` no Terminal: o resultado precisa ser
  `x86_64`.
- Linux (ambiente de desenvolvimento do Linux) disponível. Em Chromebooks
  gerenciados pela escola, o administrador precisa liberar esse recurso (veja
  [Chromebooks gerenciados](#chromebooks-gerenciados)).
- Espaço livre para o Linux. O assistente do ChromeOS sugere o tamanho do disco,
  e o Agent Offline instalado ocupa cerca de 500 MB dentro dele.
- Internet na primeira instalação.

## 1. Instalar o app DoGoBlock

1. Abra o DoGoBlock Web no Chrome, com internet.
2. Clique em **Baixar app**, no topo do site ou na barra do editor. Se o botão
   não aparecer, use o ícone de instalação na barra de endereço ou o menu **⋮ >
   Transmitir, salvar e compartilhar > Instalar DoGoBlock**.
3. O DoGoBlock abre em uma janela própria e ganha um ícone no Acesso rápido.
4. **Deixe o app aberto com internet por cerca de 2 minutos.** Nesse tempo ele
   baixa os arquivos que usa offline. Isso só acontece na janela do app
   instalado, não em uma aba comum do Chrome.

Para conferir: desligue o Wi-Fi, feche e abra o app pelo ícone. O editor deve
aparecer normalmente.

## 2. Ativar o Linux

1. Abra **Configurações > Sobre o ChromeOS > Desenvolvedores**.
2. Em **Ambiente de desenvolvimento do Linux**, clique em **Configurar** e siga
   o assistente. O tamanho de disco sugerido é suficiente.
3. Ao final, o Terminal do Linux abre sozinho.

## 3. Instalar o DoGoBlock Agent Offline

Baixe o arquivo `DoGoBlock-Agent-Offline_v…_linux_….deb` fornecido pela equipe
DoGoBlock. Use a versão **Offline**: o Agent comum não compila código.

**Pelo app Arquivos:** clique duas vezes no `.deb`, escolha **Instalar com o
Linux** e aguarde a mensagem de conclusão.

**Pelo Terminal:** mova o arquivo para **Arquivos do Linux** e rode:

```bash
sudo apt install ./DoGoBlock-Agent-Offline_v*_linux_*.deb
```

Se já existir um DoGoBlock Agent instalado, a versão Offline o substitui.

## 4. Abrir o Agent

1. No Acesso rápido, abra a pasta **Apps do Linux** e clique em **DoGoBlock
   Agent**.
2. A janela do Agent deve mostrar **Compilador Arduino offline incluido**. Se
   mostrar "Programas Arduino sao compilados pela Dogoblock API", a versão
   instalada é a comum: volte ao passo 3.
3. Fechar a janela não encerra o Agent; ele continua funcionando em segundo
   plano.

O Linux não inicia sozinho quando o Chromebook liga. **Abra o DoGoBlock Agent no
começo de cada aula** em que for enviar código sem internet.

## 5. Conferir a ligação entre o Chrome e o Agent

Com o Agent aberto, acesse `http://127.0.0.1:20111/` no Chrome. A página deve
mostrar o texto `openblock-link-server`.

O ChromeOS normalmente encaminha a porta do Linux para o Chrome sozinho. Se a
página não abrir:

1. Confirme que o Agent está aberto (passo 4).
2. Em **Configurações > Sobre o ChromeOS > Desenvolvedores > Ambiente de
   desenvolvimento do Linux**, procure **Encaminhamento de portas**, adicione a
   porta **20111** (TCP) e ative.
3. Se o Chrome pedir permissão para o DoGoBlock acessar apps e serviços deste
   dispositivo, clique em **Permitir**.

## 6. Enviar um programa sem internet

### Arduino Uno e Nano

1. Conecte a placa pelo cabo USB. **Não** compartilhe a placa com o Linux: ela
   precisa ficar com o Chrome.
2. No DoGoBlock, escolha a placa e conecte. O Chrome mostra a lista de portas
   seriais; selecione a da placa.
3. Monte o programa no modo programação e clique em **Enviar**.
4. Sem internet, a janela de envio mostra "Compilando offline no DoGoBlock
   Agent...". O primeiro envio de cada placa pode levar até 1 minuto, e os
   seguintes são mais rápidos.

### Arduino Leonardo (experimental)

O Chrome não grava o Leonardo diretamente, então o envio passa inteiro pelo
Agent. Para gravar, o Leonardo reinicia e reaparece no USB como outro
dispositivo. Se o ChromeOS perguntar de novo se deve conectá-lo ao Linux,
aceite. Este caminho ainda precisa ser validado em cada modelo de Chromebook.

1. Conecte a placa e abra **Configurações > Sobre o ChromeOS > Desenvolvedores >
   Ambiente de desenvolvimento do Linux > Gerenciar dispositivos USB**.
2. Ative a placa (geralmente aparece como "Arduino Leonardo").
3. No DoGoBlock, conecte a placa usando o **DoGoBlock Link** (o Agent) em vez do
   Web Serial e clique em **Enviar**.

Enquanto a placa estiver compartilhada com o Linux, o Chrome não a enxerga. Para
voltar a usar Web Serial, desative o compartilhamento no mesmo menu.

## Chromebooks gerenciados

No Google Admin Console, a equipe de TI pode preparar todos os Chromebooks de
uma vez:

- **Liberar o Linux:** em **Dispositivos > Chrome > Configurações > Usuários e
  navegadores**, permita o ambiente de desenvolvimento do Linux para a unidade
  organizacional dos alunos.
- **Instalar o app para todos:** em **Dispositivos > Chrome > Apps e
  extensões > Usuários e navegadores**, adicione o DoGoBlock como app da Web
  pela URL e marque **Forçar instalação**. Os alunos ainda precisam abrir o app
  uma vez com internet (passo 1, item 4).
- **Portas seriais:** as políticas `SerialAllowUsbDevicesForUrls` e
  `SerialAskForUrls` controlam o acesso do site às placas USB.

O Agent Offline precisa ser instalado em cada Chromebook, porque o Linux de cada
usuário é separado.

## Solução de problemas

| Mensagem ou sintoma | O que fazer |
| --- | --- |
| "O DoGoBlock Agent nao foi encontrado em 127.0.0.1:20111" | Abra o Agent (passo 4) e confira o passo 5. |
| "O DoGoBlock Agent aberto nao compila programas offline" | O Agent instalado é o comum. Instale a versão Offline (passo 3). |
| "O DoGoBlock Agent recusou a compilacao pedida por este endereco do editor" | O editor foi aberto por um endereço que o Agent não reconhece. Use o endereço oficial do DoGoBlock Web e avise a equipe DoGoBlock. |
| O editor não abre sem internet | Abra o app instalado uma vez com internet e espere cerca de 2 minutos (passo 1). |
| A placa não aparece na lista do Chrome | Desative o compartilhamento da placa com o Linux e reconecte o cabo. |
| "Web Serial USB currently supports only Arduino Uno and Nano" | Para o Leonardo, siga a seção [Arduino Leonardo](#arduino-leonardo-experimental). |
| O envio falha com "Build failed" | Erro no código gerado. Teste o mesmo projeto com internet para ver a mensagem da API. |
