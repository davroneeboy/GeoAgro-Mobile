const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Статические файлы (APK файлы)
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// API endpoint для проверки версии
app.get('/api/app/version', (req, res) => {
  // Здесь можно добавить логику для определения последней версии
  // Например, читать из базы данных или конфигурационного файла
  
  const versionInfo = {
    version: "2.1.2",
    build_number: 212,
    download_url: "http://localhost:3000/downloads/app-v2.1.2.apk",
    changelog: "Исправлены ошибки в системе обновлений, добавлена поддержка десятичных чисел в полях площадей",
    force_update: false
  };
  
  res.json(versionInfo);
});

// API endpoint для получения списка всех версий
app.get('/api/app/versions', (req, res) => {
  const versions = [
    {
      version: "2.1.2",
      build_number: 212,
      download_url: "http://localhost:3000/downloads/app-v2.1.2.apk",
      changelog: "Исправлены ошибки в системе обновлений, добавлена поддержка десятичных чисел в полях площадей",
      force_update: false,
      release_date: "2024-01-15"
    },
    {
      version: "2.1.1",
      build_number: 211,
      download_url: "http://localhost:3000/downloads/app-v2.1.1.apk",
      changelog: "Добавлена система обновлений, улучшен интерфейс",
      force_update: false,
      release_date: "2024-01-10"
    },
    {
      version: "2.1.0",
      build_number: 210,
      download_url: "http://localhost:3000/downloads/app-v2.1.0.apk",
      changelog: "Первая версия с поддержкой обновлений",
      force_update: false,
      release_date: "2024-01-05"
    }
  ];
  
  res.json(versions);
});

// API endpoint для принудительного обновления
app.get('/api/app/force-update', (req, res) => {
  const forceUpdateInfo = {
    version: "2.1.3",
    build_number: 213,
    download_url: "http://localhost:3000/downloads/app-v2.1.3.apk",
    changelog: "КРИТИЧЕСКОЕ ОБНОВЛЕНИЕ: Исправлена уязвимость безопасности",
    force_update: true
  };
  
  res.json(forceUpdateInfo);
});

// API endpoint для статистики обновлений
app.post('/api/app/update-stats', (req, res) => {
  const { device_id, current_version, new_version, update_success } = req.body;
  
  // Здесь можно сохранить статистику в базу данных
  console.log('Update stats:', {
    device_id,
    current_version,
    new_version,
    update_success,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Statistics recorded' });
});

// Проверка доступности APK файла
app.get('/api/app/check-file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'downloads', filename);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    res.json({
      exists: true,
      filename: filename,
      size: stats.size,
      last_modified: stats.mtime
    });
  } else {
    res.status(404).json({
      exists: false,
      filename: filename,
      error: 'File not found'
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер обновлений запущен на порту ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/app/version`);
  console.log(`Загрузки: http://localhost:${PORT}/downloads/`);
  console.log('');
  console.log('Для тестирования:');
  console.log('1. Создайте папку "downloads" в той же директории');
  console.log('2. Поместите туда APK файлы');
  console.log('3. Обновите URL в конфигурации приложения на http://localhost:3000');
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found'
  });
}); 