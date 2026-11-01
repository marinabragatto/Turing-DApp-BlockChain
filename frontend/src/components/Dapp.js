import React from "react";

// ethers para interagir com a blockchain e com o contrato
import { ethers } from "ethers";

// Artefatos do contrato (gerados pelo scripts/deploy.js)
import TuringArtifact from "../contracts/Turing.json";
import contractAddress from "../contracts/contract-address.json";

// Componentes apenas de apresentação
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Vote } from "./Vote";
import { Admin } from "./Admin";
import { Ranking } from "./Ranking";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

// Id padrão da rede Hardhat
const HARDHAT_NETWORK_ID = "31337";

// Código de erro quando o usuário rejeita a transação
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Codinome da professora (papel especial: superusuária e fora das listas)
const PROFESSORA = "roberta";

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      // Nome e símbolo do token
      tokenData: undefined,
      // Endereço e saldo do usuário conectado
      selectedAddress: undefined,
      balance: undefined,
      // true se for owner ou professora
      isAdmin: false,
      // Codinomes dos alunos, lidos do contrato (sem a professora)
      codinomes: [],
      // [{ nome, saldo }] ordenado por saldo
      ranking: [],
      // Transação em andamento e possíveis erros
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {this.state.tokenData.name} ({this.state.tokenData.symbol})
            </h1>
            <p>
              Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
              <b>
                {this.state.balance.toString()} {this.state.tokenData.symbol}
              </b>
              .
            </p>
            {this.state.isAdmin && (
              <span className="badge bg-warning text-dark">Superusuário</span>
            )}
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {/* Aguardando a transação ser minerada */}
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {/* Erro na transação */}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {/* Só renderiza Vote/Admin depois de a lista de codinomes chegar,
                para o select já abrir com um valor válido */}
            {this.state.codinomes.length > 0 && (
              <Vote
                codinomes={this.state.codinomes}
                vote={(cod, qtd) => this._vote(cod, qtd)}
              />
            )}

            {/* Apenas owner / professora */}
            {this.state.isAdmin && this.state.codinomes.length > 0 && (
              <Admin
                codinomes={this.state.codinomes}
                issueToken={(cod, qtd) => this._issueToken(cod, qtd)}
                votingOn={() => this._votingOn()}
                votingOff={() => this._votingOff()}
              />
            )}

            <Ranking ranking={this.state.ranking} />
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    this._checkNetwork();

    this._initialize(selectedAddress);

    // Reinicializa sempre que o usuário trocar de conta
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });
  }

  _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });

    this._initializeEthers();
    this._getTokenData();
    this._checkIsAdmin();
    this._updateRanking(); // também carrega a lista de codinomes
    this._startListeningEvents();
    this._startPollingData();
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    this._token = new ethers.Contract(
      contractAddress.Turing,
      TuringArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  // Polling do saldo do usuário conectado
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;

    // Evita listeners duplicados ao trocar de conta
    if (this._token) {
      this._token.removeAllListeners("Transfer");
    }
  }

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  // Descobre se o usuário conectado é o owner ou a professora
  async _checkIsAdmin() {
    const owner = await this._token.owner();
    const prof = await this._token.users(PROFESSORA);
    const me = this.state.selectedAddress.toLowerCase();

    this.setState({
      isAdmin: me === owner.toLowerCase() || me === prof.toLowerCase(),
    });
  }

  // Lê os codinomes do contrato (sem a professora), busca o saldo de cada
  // aluno e ordena do maior para o menor
  async _updateRanking() {
    const todos = await this._token.getCodinomes();
    const alunos = todos.filter((nome) => nome !== PROFESSORA);

    const rows = await Promise.all(
      alunos.map(async (nome) => {
        const addr = await this._token.users(nome);
        const saldo = await this._token.balanceOf(addr);
        return { nome, saldo: saldo.toNumber() }; // decimals = 0
      })
    );

    rows.sort((a, b) => b.saldo - a.saldo);
    this.setState({ ranking: rows, codinomes: alunos });
  }

  // vote() e issueToken() fazem _mint, que emite o evento Transfer
  _startListeningEvents() {
    this._token.on("Transfer", () => {
      this._updateRanking();
      this._updateBalance();
    });
  }

  // Molde único para enviar qualquer transação
  async _sendTx(action) {
    try {
      this._dismissTransactionError();

      const tx = await action();
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _vote(cod, qtd) {
    return this._sendTx(() => this._token.vote(cod, qtd));
  }

  _issueToken(cod, qtd) {
    return this._sendTx(() => this._token.issueToken(cod, qtd));
  }

  _votingOn() {
    return this._sendTx(() => this._token.votingOn());
  }

  _votingOff() {
    return this._sendTx(() => this._token.votingOff());
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // Transforma um erro de RPC em mensagem legível
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    const chainIdHex = `0x${Number(HARDHAT_NETWORK_ID).toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  // Verifica se a rede selecionada é a localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }
}