# Логика работы localStorage в модерации

## Когда localStorage ОЧИЩАЕТСЯ:

### 1. При заходе на страницу без параметра page
```
/moderation (без ?page=...)
```
- localStorage.removeItem('moderationPage')
- Начинаем с первой страницы

### 2. При переходе на главную страницу
- Клик по логотипу/заголовку
- localStorage.removeItem('moderationPage')

### 3. При сбросе фильтров
- Клик по кнопке "Filterlarni tozalash"
- localStorage.removeItem('moderationPage')
- Переход на первую страницу

### 4. При изменении любого фильтра
- Изменение "O'zgarishlar"
- Изменение "Holati" 
- Изменение "Turi"
- localStorage.removeItem('moderationPage')
- Переход на первую страницу

### 5. При получении ошибки 404
- localStorage.removeItem('moderationPage')
- Переход на первую страницу

### 6. При переходе на первую страницу через пагинацию
- Кнопка "Назад" на первой странице
- localStorage.removeItem('moderationPage')

### 7. При клике "Вернуться на первую страницу" в сообщении об ошибке
- localStorage.removeItem('moderationPage')

## Когда localStorage СОХРАНЯЕТСЯ:

### 1. При переходе на страницу с параметром page
```
/moderation?page=5
```
- localStorage.setItem('moderationPage', 5)

### 2. При навигации по пагинации (кроме первой страницы)
- Кнопка "Вперед" → localStorage.setItem('moderationPage', newPage)
- Кнопка "Назад" (если не на первой) → localStorage.setItem('moderationPage', newPage)

## Результат:
- ✅ При закрытии сайта и повторном входе - начинаем с первой страницы
- ✅ При переходе на главную и обратно - начинаем с первой страницы  
- ✅ При изменении фильтров - начинаем с первой страницы
- ✅ При ошибках - начинаем с первой страницы
- ✅ localStorage используется только для навигации внутри сессии 