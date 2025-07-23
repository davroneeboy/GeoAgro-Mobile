// Скрипт для очистки localStorage в браузере
// Выполните этот код в консоли браузера (F12 -> Console)

console.log('Очищаем localStorage для модерации...');

// Очищаем все данные модерации
localStorage.removeItem('moderationPage');

// Проверяем результат
console.log('localStorage после очистки:', {
  moderationPage: localStorage.getItem('moderationPage')
});

// Перезагружаем страницу
console.log('Перезагружаем страницу...');
window.location.reload(); 