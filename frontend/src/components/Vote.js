import React, { useState } from "react";

// Formulário de voto: escolhe o codinome e a quantidade (1 ou 2 Turings).
// Não tem lógica de blockchain: só chama o callback `vote`.
export function Vote({ vote, codinomes }) {
  const [codinome, setCodinome] = useState(codinomes[0]);
  const [qtd, setQtd] = useState(1);

  return (
    <div className="mb-4">
      <h4>Votar</h4>
      <form
        onSubmit={(event) => {
          // Evita recarregar a página
          event.preventDefault();
          vote(codinome, qtd);
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
          <label>Quantidade de Turings (1 ou 2)</label>
          <input
            className="form-control"
            type="number"
            min="1"
            max="2"
            step="1"
            value={qtd}
            onChange={(e) => setQtd(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Votar" />
        </div>
      </form>
    </div>
  );
}