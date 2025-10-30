// Перевод действий модерации в человекочитаемый вид
// Поддерживаем как базовые, так и возможные синонимы с бэка
export const translateAction = (action) => {
  if (!action) return '';
  const key = String(action).toLowerCase();
  const map = {
    create: "Yaratish",
    update: "Yangilash",
    approve: "Tasdiqlash",
    reject: "Rad etish",
    delete: "O'chirish",
    delete_request: "O'chirish so'rovi",
    modify: "O'zgartirish",
    review: "Ko'rib chiqish",
  };
  return map[key] || action;
};

export default translateAction;


