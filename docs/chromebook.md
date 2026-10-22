# DoGoBlock no Chromebook com envio de código Arduino offline

Este guia instala o DoGoBlock em um Chromebook para programar e enviar código
para placas Arduino **sem internet**. Ele é voltado para professores e para a
equipe de TI que prepara os Chromebooks da escola.

São duas partes:

| Parte | O que faz | Onde roda |
| --- | --- | --- |
| **App DoGoBlock** (PWA) | Editor de blocos. Depois de instalado e aberto uma vez com internet, abre mesmo sem conexão. | Chrome |
| **DoGoBlock Agent Offline** | Compila o código Arduino no próprio Chromebook. Também grava placas que o Chrome não consegue gravar sozinho. | Linux do ChromeOS |

A conexão escolhida na janela de conexão do editor define onde o código é
compilado:

- **DoGoBlock Link** (o Agent): compila no próprio Chromebook, **sem internet**.
  A placa precisa estar compartilhada com o Linux.
- **Web Serial USB**: compila na Dogoblock API, **só com internet**. A placa fica
  com o Chrome.

## O que funciona sem internet

| Recurso | Sem internet |
| --- | --- |
| Abrir o editor e montar blocos | Sim |
| Enviar programa para Arduino Uno e Nano | Sim, pelo DoGoBlock Link (passo 6) |
| Enviar programa para Arduino Leonardo | Experimental, pelo DoGoBlock Link (passo 6) |
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

Sem internet, o envio sempre passa pelo **DoGoBlock Link** (o Agent):

1. Conecte a placa pelo cabo USB e abra **Configurações > Sobre o ChromeOS >
   Desenvolvedores > Ambiente de desenvolvimento do Linux > Gerenciar
   dispositivos USB**.
2. Ative a placa (por exemplo "USB2.0-Serial" para clones com CH340, ou
   "Arduino Uno").
3. No DoGoBlock, escolha a placa, abra a janela de conexão e escolha **Conexão:
   DoGoBlock Link**. A placa aparece na lista; clique para conectar.
4. Monte o programa no modo programação e clique em **Enviar**. A janela de
   envio mostra "Compilando offline no DoGoBlock Link...". O primeiro envio de
   cada placa demora alguns segundos a mais, porque o Agent prepara os arquivos
   base da placa; os seguintes são mais rápidos.

**Leonardo (experimental):** para gravar, ele reinicia e reaparece no USB como
outro dispositivo. Se o ChromeOS perguntar de novo se deve conectá-lo ao Linux,
aceite. Este caminho ainda precisa ser validado em cada modelo de Chromebook.

Enquanto a placa estiver compartilhada com o Linux, o Chrome não a enxerga. Para
usar **Web Serial USB** (só com internet), desative o compartilhamento no mesmo
menu e reconecte o cabo.

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
| A placa não aparece na lista do Chrome (Web Serial USB) | Desative o compartilhamento da placa com o Linux, reconecte o cabo e clique em **Atualizar**. |
| A placa não aparece na lista do DoGoBlock Link | Ative a placa em **Gerenciar dispositivos USB** do Linux, reconecte o cabo e clique em **Atualizar**. Se continuar sem aparecer, marque **Mostrar todos os dispositivos conectáveis**. |
| A placa aparece no DoGoBlock Link, mas não conecta | No Terminal, rode `sudo usermod -aG dialout $USER` e desligue e ligue o Linux. |
| "Web Serial USB currently supports only Arduino Uno and Nano" | Para o Leonardo, use o DoGoBlock Link (passo 6). |
| O envio falha com "Build failed" | Erro no código gerado. Teste o mesmo projeto com internet para ver a mensagem da API. |
