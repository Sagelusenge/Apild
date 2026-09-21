export default function Pagination({ page = 1, pages = 1, onChange }) {
  if (pages <= 1) return null;
  return <nav className="pagination" aria-label="Pagination">
    <button disabled={page <= 1} onClick={() => onChange(page - 1)}>Precedent</button>
    <span>Page {page} sur {pages}</span>
    <button disabled={page >= pages} onClick={() => onChange(page + 1)}>Suivant</button>
  </nav>;
}
