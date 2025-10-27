// Simple React UMD app to fetch /cards, filter and export results.
// Uses React and ReactDOM from UMD bundles included in index.html.
(function () {
  const e = React.createElement;

  function toCSV(items) {
    if (!items || items.length === 0) return '';
    const keys = Object.keys(items[0]);
    const rows = items.map(it => keys.map(k => {
      const v = it[k] == null ? '' : String(it[k]).replace(/"/g, '""');
      return `"${v}"`;
    }).join(','));
    return [keys.join(','), ...rows].join('\n');
  }

  function App() {
    const [cards, setCards] = React.useState([]);
    const [query, setQuery] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const [page, setPage] = React.useState(1);
    const [total, setTotal] = React.useState(0);

    React.useEffect(() => {
      setLoading(true);
      fetch(`/cards?limit=25&page=${page}`)
        .then(r => {
          if (!r.ok) throw new Error('Network response was not ok');
          return r.json();
        })
        .then(data => {
          if (data && Array.isArray(data.items)) {
            setCards(data.items);
            setTotal(Number(data.total) || 0);
          } else if (Array.isArray(data)) {
            setCards(data);
            setTotal(data.length);
          } else {
            setCards([]);
            setTotal(0);
          }
        })
        .catch(err => setError(String(err)))
        .finally(() => setLoading(false));
    }, [page]);

    const filtered = React.useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return cards;
      return cards.filter(c => {
        return (c.name && c.name.toLowerCase().includes(q)) ||
               (c.type && c.type.toLowerCase().includes(q)) ||
               (c.text && c.text.toLowerCase().includes(q)) ||
               (c.ability && c.ability.toLowerCase().includes(q)) ||
               (String(c.release_year || '').toLowerCase().includes(q));
      });
    }, [cards, query]);

    function downloadJSON() {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'cards.json'; a.click();
      URL.revokeObjectURL(url);
    }

    function downloadCSV() {
      const csv = toCSV(filtered);
      const blob = new Blob([csv], {type: 'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'cards.csv'; a.click();
      URL.revokeObjectURL(url);
    }

    const totalPages = Math.max(1, Math.ceil(total / 25));

    function goTo(next) {
      setPage(next);
      window.scrollTo(0, 0);
    }

    return e('div', {style: {fontFamily: 'Arial, sans-serif', padding: 16}},
      e('h2', null, 'MTG Cards - Filter & Export'),
      e('div', {style: {marginBottom: 8}},
        e('input', {
          placeholder: 'Filter by name, type, text, ability, year...',
          value: query,
          onChange: ev => setQuery(ev.target.value),
          style: {padding: '6px 8px', width: '60%'}
        }),
        e('button', {onClick: () => setQuery(''), style: {marginLeft: 8}}, 'Clear')
      ),
      loading && e('div', null, 'Loading...'),
      error && e('div', {style: {color: 'red'}}, error),
      e('div', {style: {margin: '12px 0'}},
        e('button', {onClick: downloadJSON}, 'Download JSON'),
        e('button', {onClick: downloadCSV, style: {marginLeft: 8}}, 'Download CSV')
      ),
      e('div', null, `${filtered.length} / ${total} shown`),
      e('div', {style: {marginTop: 8, marginBottom: 8}},
        e('button', {onClick: () => goTo(1), disabled: page === 1}, '<<'),
        e('button', {onClick: () => goTo(Math.max(1, page-1)), disabled: page === 1, style: {marginLeft: 8}}, '<'),
        e('span', {style: {margin: '0 8px'}}, `Page ${page} / ${totalPages}`),
        e('button', {onClick: () => goTo(Math.min(totalPages, page+1)), disabled: page === totalPages, style: {marginLeft: 8}}, '>'),
        e('button', {onClick: () => goTo(totalPages), disabled: page === totalPages, style: {marginLeft: 8}}, '>>')
      ),
      e('table', {style: {width: '100%', borderCollapse: 'collapse', marginTop: 8}},
        e('thead', null, e('tr', null,
          ['id','name','release_year','cost','type','subtype','ability','power','toughness','text','rarity'].map(h =>
            e('th', {key: h, style: {borderBottom: '1px solid #ddd', textAlign: 'left', padding: '6px'}}, h)
          )
        )),
        e('tbody', null, filtered.map(card =>
          e('tr', {key: card.id || Math.random()},
            ['id','name','release_year','cost','type','subtype','ability','power','toughness','text','rarity'].map(k =>
              e('td', {key: k, style: {padding: '6px', borderBottom: '1px solid #f2f2f2'}}, card[k] == null ? '' : String(card[k]))
            )
          )
        ))
      )
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Support both <div id="app"> and <div id="root"> (index.html uses #root)
    const mount = document.getElementById('app') || document.getElementById('root');
    if (!mount) return;
    // React 18 recommends createRoot, but UMD usage can still call ReactDOM.render for simplicity here.
    if (ReactDOM.createRoot) {
      try {
        ReactDOM.createRoot(mount).render(React.createElement(App));
        return;
      } catch (err) {
        // fall through to render()
      }
    }
    ReactDOM.render(React.createElement(App), mount);
  });
})();
