const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// API endpoint для проверки версии
app.get('/api/app/version', (req, res) => {
  const versionInfo = {
    version: "2.1.6",                    // ← Версия 2.1.6
    build_number: 216,                   // ← Build number 216
    download_url: "https://github.com/farkhodovv/geoagro/releases/download/v2.1.6/geoAgro-v2.1.6", // ← Правильный URL для v2.1.6
    changelog: "Добавлена поддержка десятичных чисел в полях ввода, улучшена система обновлений, исправлены ошибки с разрешениями",
    force_update: false
  };
  
  res.json(versionInfo);
});

// API endpoint для получения списка версий
app.get('/api/app/versions', (req, res) => {
  const versions = [
    {
      version: "2.1.6",
      build_number: 216,
      download_url: "https://github.com/farkhodovv/geoagro/releases/download/v2.1.6/geoAgro-v2.1.6",
      changelog: "Добавлена поддержка десятичных чисел в полях ввода, улучшена система обновлений, исправлены ошибки с разрешениями",
      force_update: false,
      release_date: "2024-01-27"
    },
    {
      version: "2.1.5",
      build_number: 215,
      download_url: "https://github.com/farkhodovv/geoagro/releases/download/v2.1.5/getAgro-v2.1.5.apk",
      changelog: "Исправлены проблемы с разрешениями для обновлений, улучшены сообщения об ошибках на узбекском языке",
      force_update: false,
      release_date: "2024-01-27"
    },
    {
      version: "2.1.4",
      build_number: 214,
      download_url: "https://github.com/farkhodovv/geoagro/releases/download/v2.1.4/getAgro-v2.1.4.apk",
      changelog: "Новый логотип приложения, система обновлений на узбекском языке",
      force_update: false,
      release_date: "2024-01-26"
    },
    {
      version: "2.1.3",
      build_number: 213,
      download_url: "https://github.com/farkhodovv/geoagro/releases/download/v2.1.3/getAgro-v2.1.3.apk",
      changelog: "Добавлена система автоматических обновлений",
      force_update: false,
      release_date: "2024-01-26"
    }
  ];
  
  res.json(versions);
});

// Health check для Render
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'GEO AGRO Update Server',
    endpoints: {
      version: '/api/app/version',
      versions: '/api/app/versions',
      health: '/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Сервер обновлений запущен на порту ${PORT}`);
});
