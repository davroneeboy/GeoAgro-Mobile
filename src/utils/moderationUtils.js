// Перевод действий модерации в человекочитаемый вид
// Поддерживаем как базовые, так и возможные синонимы с бэка
export const translateAction = (action) => {
  if (!action) return '';
  const key = String(action).toLowerCase();
  const map = {
    create: "Yaratish",
    update: "O'zgartirish",
    approve: "Tasdiqlash",
    reject: "Rad etish",
    delete: "O'chirish",
    delete_request: "O'chirish so'rovi",
    modify: "O'zgartirish",
    review: "Ko'rib chiqish",
    // Переводы для action_display с бэка
    "создание": "Yaratish",
    "изменение": "O'zgartirish",
    "Изменение": "O'zgartirish",
    "Создание": "Yaratish",
  };
  return map[key] || action;
};

export default translateAction;




qwe
