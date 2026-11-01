import React, { useState } from "react";

// Painel do superusuário (owner / professora).
// Não tem lógica de blockchain: só chama os callbacks recebidos.
export function Admin({ issueToken, votingOn, votingOff, codinomes }) {
  const [codinome, setCodinome] = useState(codinomes[0]);
  const [qtd, setQtd] = useState(1);

  return (
    <div className="mb-4 p-3 border rounded">
      <h4>Administração</h4>

      <h5>Emitir Turings</h5>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          issueToken(codinome, qtd);
        }}
      >
        <div className="form-group">
          <label>Codinome</label>
          <select
            className="form-control"
            value={codinome}
            onChange={(e) => setCodinome(e.target.value)}
          >
            {codinomes.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantidade de Turings</label>
          <input
            className="form-control"
            type="number"
            min="1"
            step="1"
            value={qtd}
            onChange={(e) => setQtd(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <input
            className="btn btn-primary"
            type="submit"
            value="Emitir Turings"
          />
        </div>
      </form>

      <hr />

      <h5>Votação</h5>
      <button className="btn btn-success mr-2 me-2" onClick={votingOn}>
        Ligar votação
      </button>
      <button className="btn btn-danger" onClick={votingOff}>
        Pausar votação
      </button>
    </div>
  );
}