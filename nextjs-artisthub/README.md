# ArtistHub — Next.js 14 Homepage

Homepage moderna da plataforma **ArtistHub** desenvolvida com **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, fontes Google (**Fraunces + Inter**) e **lucide-react**.

---

## 🚀 Como Correr Localmente

1. Navega para a pasta do projecto:
   ```bash
   cd nextjs-artisthub
   ```

2. Instala as dependências:
   ```bash
   npm install
   ```

3. Inicia o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abre no navegador:
   ```
   http://localhost:3000
   ```

---

## 🌐 Como Publicar no Vercel

Tens duas formas simples de publicar na Vercel:

### Método 1: Ligar ao GitHub (Recomendado)

1. Cria um repositório no teu GitHub (ex: `artisthub-home`).
2. No teu terminal, inicializa o Git e envia os ficheiros:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit ArtistHub Next.js 14 homepage"
   git branch -M main
   git remote add origin https://github.com/SEU_UTILIZADOR/artisthub-home.git
   git push -u origin main
   ```
3. Acede a [vercel.com](https://vercel.com) e faz login com a tua conta GitHub.
4. Clica em **"Add New..."** → **"Project"**.
5. Selecciona o repositório `artisthub-home` e clica em **"Import"**.
6. A Vercel detecta automaticamente que se trata de um projecto **Next.js**. Não precisas alterar nenhuma configuração.
7. Clica em **"Deploy"**. Em menos de 1 minuto a tua aplicação estará online com certificado SSL automático e CDN global.

---

### Método 2: Via Vercel CLI (`vercel --prod`)

1. Instala a CLI da Vercel globalmente no teu computador (caso ainda não tenhas):
   ```bash
   npm i -g vercel
   ```

2. Na pasta do projecto, autentica a tua conta:
   ```bash
   vercel login
   ```

3. Para fazer o deploy directamente para produção:
   ```bash
   vercel --prod
   ```

4. Responde às perguntas interactivas no terminal:
   - **Set up and deploy?**: `y`
   - **Which scope do you want to deploy to?**: Escolhe a tua conta/equipa
   - **Link to existing project?**: `n`
   - **What’s your project’s name?**: `artisthub`
   - **In which directory is your code located?**: `./`
   - **Want to modify these settings?**: `n`

5. A CLI gera de imediato o link público de produção (ex: `https://artisthub.vercel.app`).
