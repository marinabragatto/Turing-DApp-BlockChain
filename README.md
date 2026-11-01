# Turing DApp

DApp de votação da disciplina de **Blockchain** - UFES, com a criptomoeda **Turing (TT)** que é um token ERC-20.

Permite que usuários votem nos colegas, que recebem Turings quando votados. Além de um ranking com quantos Turings cada aluno possui. A conta da professora e o owner do contrato também podem emitir Turings e ligar ou pausar a votação.

Esta entrega roda numa **blockchain local** do Hardhat, com contas de teste.

---
### 1. Instalar as dependências

```sh
npm install
cd frontend
npm install
cd ..
```

### 2. Subir a blockchain local (Terminal 1)

```sh
npx hardhat node
```

Deixe este terminal aberto.

### 3. Publicar o contrato (Terminal 2)

```sh
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Rodar o site (Terminal 3)

```sh
cd frontend
npm start
```

Abra [http://localhost:3000](http://localhost:3000).

---

Baseado no [hardhat-boilerplate](https://github.com/NomicFoundation/hardhat-boilerplate), da Nomic Foundation.