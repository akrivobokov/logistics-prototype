import React, { useState } from 'react';

const LogisticsPrototype = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const mockData = [
    {
      address: 'Москва, ул. Промышленная, 12',
      items: ['Бетон', 'Арматура', 'Кирпич'],
      time: 2.5,
      cost: 14250,
    },
    {
      address: 'МО, г. Балашиха, ул. Логистическая, 4',
      items: ['Цемент', 'Песок'],
      time: 3.2,
      cost: 12800,
    },
  ];

  const handleSearch = () => {
    const filtered = mockData.filter(entry =>
      entry.items.some(item => item.toLowerCase().includes(query.toLowerCase()))
    );
    setResults(filtered);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Прототип логистической платформы</h1>
      <div style={{ margin: '20px 0' }}>
        <input
          type="text"
          value={query}
          placeholder="Введите название материала..."
          onChange={e => setQuery(e.target.value)}
          style={{ padding: 8, marginRight: 10 }}
        />
        <button onClick={handleSearch}>Поиск</button>
      </div>

      {results.map((r, i) => (
        <div key={i} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
          <strong>Склад:</strong> {r.address}<br />
          <strong>Материалы:</strong> {r.items.join(', ')}<br />
          <strong>Доставка:</strong> {r.time} ч<br />
          <strong>Стоимость:</strong> {r.cost} ₽
        </div>
      ))}

      {results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => alert('Счёт сформирован.')}>Сформировать счёт</button>
        </div>
      )}
    </div>
  );
};

export default LogisticsPrototype;
