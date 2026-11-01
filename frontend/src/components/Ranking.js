import React from "react";

// Ranking dos alunos por saldo de Turings.
// Recebe `ranking` já ordenado: [{ nome, saldo }, ...]
export function Ranking({ ranking }) {
  return (
    <div className="mb-4">
      <h4>Ranking</h4>

      {ranking.length === 0 ? (
        <p>Carregando ranking...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Codinome</th>
              <th>Turings</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((item, i) => (
              <tr key={item.nome}>
                <td>{i + 1}</td>
                <td>{item.nome}</td>
                <td>{item.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}