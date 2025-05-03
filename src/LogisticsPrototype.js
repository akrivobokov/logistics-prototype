import React, { useState, useEffect } from 'react';

const LogisticsPrototype = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState(() => {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : [{ email: 'user@example.com', password: 'password', role: 'заказчик' }];
  });
  const [role, setRole] = useState('заказчик');
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [newProject, setNewProject] = useState({ name: '', address: '', kladr: '' });
  const [selectedProjectIndex, setSelectedProjectIndex] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);

  useEffect(() => localStorage.setItem('users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('projects', JSON.stringify(projects)), [projects]);
  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    if (isLoggedIn) localStorage.setItem('email', email);
  }, [isLoggedIn, email]);

  const geocode = async (address) => {
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=e019204f-a16e-46a5-97f1-355bcf9967d7&geocode=${encodeURIComponent(address)}&format=json`
    );
    const data = await response.json();
    const pos = data.response.GeoObjectCollection.featureMember[0]?.GeoObject?.Point?.pos;
    if (!pos) throw new Error('Не удалось получить координаты');
    const [lon, lat] = pos.split(' ').map(Number);
    return { lat, lon };
  };

  const getRouteDistance = async (from, to) => {
    const url = `https://router.transport.yandex.net/v2/route?apikey=e019204f-a16e-46a5-97f1-355bcf9967d7&waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=driving`;
    const res = await fetch(url);
    const data = await res.json();
    const meters = data.routes?.[0]?.legs?.[0]?.distance?.value || 0;
    return meters / 1000;
  };

  const handleSearch = async () => {
    const selectedProject = projects[selectedProjectIndex];
    const destinationCoords = await geocode(selectedProject.address);
    const mockData = [
      { address: 'Москва, ул. Промышленная, 12', items: ['Бетон', 'Арматура'] },
      { address: 'МО, Балашиха, ул. Логистическая, 4', items: ['Цемент', 'Песок'] }
    ];
    const results = await Promise.all(
      mockData
        .filter(entry => entry.items.some(i => i.toLowerCase().includes(query.toLowerCase())))
        .map(async entry => {
          const origin = await geocode(entry.address);
          const distance = await getRouteDistance(origin, destinationCoords);
          const cost = Math.round(distance * 0.3 * 70 * 3);
          return {
            ...entry,
            distance: Math.round(distance),
            cost,
            time: (distance / 40).toFixed(1),
          };
        })
    );
    setResults(results);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) setIsLoggedIn(true);
    else alert('Неверный логин или пароль');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (users.some(u => u.email === email)) {
      alert('Пользователь с таким email уже существует');
    } else {
      setUsers([...users, { email, password, role }]);
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <h2>{isRegistering ? 'Регистрация' : 'Вход'}</h2>
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
          {isRegistering && (
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="заказчик">Заказчик</option>
              <option value="поставщик">Поставщик</option>
              <option value="администратор">Администратор</option>
            </select>
          )}
          <button type="submit">{isRegistering ? 'Зарегистрироваться' : 'Войти'}</button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Уже зарегистрированы?' : 'Регистрация'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => {
        setIsLoggedIn(false);
        setEmail('');
        setPassword('');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('email');
      }} style={{ float: 'right' }}>Выйти</button>

      <h1>Регистрация объектов</h1>
      <form onSubmit={(e) => {
        e.preventDefault();
        setProjects([...projects, newProject]);
        setNewProject({ name: '', address: '', kladr: '' });
        setAddressSuggestions([]);
      }}>
        <input placeholder="Название" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
        <input placeholder="Адрес" value={newProject.address} onChange={async (e) => {
          const val = e.target.value;
          setNewProject({ ...newProject, address: val });
          if (val.length > 3) {
            const res = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Token 073534fd1767cfa65151f83407d76add51206ec4"
              },
              body: JSON.stringify({ query: val })
            });
            const data = await res.json();
            setAddressSuggestions(data.suggestions || []);
          } else {
            setAddressSuggestions([]);
          }
        }} />
        {addressSuggestions.length > 0 && (
          <ul style={{ background: '#fff', border: '1px solid #ccc', margin: 0, padding: '0.5em' }}>
            {addressSuggestions.map((sugg, i) => (
              <li key={i} style={{ cursor: 'pointer', padding: '0.25em 0' }} onClick={() => {
                setNewProject({ ...newProject, address: sugg.value, kladr: sugg.data.kladr_id });
                setAddressSuggestions([]);
              }}>{sugg.value}</li>
            ))}
          </ul>
        )}
        <button type="submit">Добавить</button>
      </form>

      <h3>Ваши объекты:</h3>
      <ul>
        {projects.map((p, i) => <li key={i}>{p.name} — {p.address}</li>)}
      </ul>

      <h2>Поиск материалов</h2>
      <label>Объект доставки:</label>
      <select value={selectedProjectIndex} onChange={e => setSelectedProjectIndex(e.target.value)}>
        <option value="">-- выберите --</option>
        {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
      </select>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Введите материал" />
      <button onClick={() => {
        if (selectedProjectIndex === '') {
          alert('Выберите объект');
        } else {
          handleSearch();
        }
      }}>Поиск</button>

      {results.map((r, i) => (
        <div key={i} style={{ border: '1px solid gray', padding: 10, margin: 10 }}>
          <p><strong>Склад:</strong> {r.address}</p>
          <p><strong>Материалы:</strong> {r.items.join(', ')}</p>
          <p><strong>Расстояние:</strong> {r.distance} км</p>
          <p><strong>Стоимость:</strong> {r.cost} ₽</p>
          <p><strong>Доставка:</strong> {r.time} ч</p>
        </div>
      ))}
    </div>
  );
};

export default LogisticsPrototype;
