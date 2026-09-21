import EmptyState from './EmptyState';

export default function Table({ columns, rows = [], rowKey = 'id' }) {
  if (!rows.length) return <EmptyState />;
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row) => <tr key={row[rowKey]}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody>
  </table></div>;
}
