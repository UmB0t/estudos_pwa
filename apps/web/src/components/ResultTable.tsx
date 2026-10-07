import React from 'react';
import type { SqlQueryResult } from '@lab/sql-engine';

interface ResultTableProps {
  data: SqlQueryResult;
  title?: string;
}

export const ResultTable: React.FC<ResultTableProps> = ({ data, title }) => {
  const { columns, rows } = data;

  if (columns.length === 0 && rows.length === 0) {
    return (
      <div className="table-card">
        <div className="table-empty">Nenhum registro retornado pela consulta.</div>
      </div>
    );
  }

  return (
    <div className="table-section-wrap">
      {title && (
        <div className="table-header-meta">
          <span className="table-title-label">{title}</span>
          <span className="table-count-badge">
            {rows.length} {rows.length === 1 ? 'linha' : 'linhas'}
          </span>
        </div>
      )}
      <div className="table-card">
        {rows.length === 0 ? (
          <div className="table-empty">0 linhas retornadas pela instrução SQL.</div>
        ) : (
          <div className="table-scroll">
            <table className="vetor-sql-table">
              <thead>
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx}>
                      <span className="col-name">{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>
                        {cell === null || cell === undefined ? (
                          <span className="null-tag">NULL</span>
                        ) : typeof cell === 'boolean' ? (
                          <span className="bool-tag">{cell ? 'TRUE' : 'FALSE'}</span>
                        ) : (
                          <span className="cell-val">{String(cell)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
