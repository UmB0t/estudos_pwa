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
      <div className="table-wrapper">
        <div className="empty-results">Nenhuma linha retornada pela consulta.</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span className="section-subtitle">{title}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {rows.length} {rows.length === 1 ? 'linha' : 'linhas'}
          </span>
        </div>
      )}
      <div className="table-wrapper">
        {rows.length === 0 ? (
          <div className="empty-results">Nenhuma linha retornada pela consulta.</div>
        ) : (
          <table className="sql-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>
                      {cell === null || cell === undefined ? (
                        <span className="null-badge">NULL</span>
                      ) : typeof cell === 'boolean' ? (
                        cell ? 'TRUE' : 'FALSE'
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
