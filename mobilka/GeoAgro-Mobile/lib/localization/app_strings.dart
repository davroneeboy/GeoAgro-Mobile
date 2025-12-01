/// Centralized strings for the application (Uzbek language)
/// All UI text should be referenced from here
class AppStrings {
  AppStrings._();

  // ===== AUTH =====
  static const String login = "Kirish";
  static const String username = "Foydalanuvchi nomi";
  static const String password = "Parol";
  static const String loginError = "Bunday foydalanuvchi yo'q.";
  static const String serverError = "Server ochib qolgan bo'lishi mumkin.";
  static const String networkError = "Internet yoki server bilan muammo yuz berdi.";
  static const String loginRequired = "Kirish kerak";

  // ===== PLANTATION TYPES =====
  static const String plantationType = "Plantatsiya turi";
  static const String bog = "Bog`";
  static const String uzumzor = "Uzumzor";
  static const String issiqxona = "Issiqxona";
  
  // Bog types
  static const String bogIntensiv = "Intensiv";
  static const String bogMahalliy = "Mahalliy";
  
  // Bog subtypes
  static const String bogPakana = "Pakana";
  static const String bogYarimPakana = "Yarim pakana";
  
  // Uzum types
  static const String uzumXoraki = "Xo`raki";
  static const String uzumKishmish = "Kishmish bop";
  static const String uzumSanoat = "Sanoat bop (vino bop)";
  
  // Issiqxona types
  static const String issiqxonaMahalliy = "Mahalliy";
  static const String issiqxonaZamonaviy = "Zamonaviy";

  // ===== LAND TYPES =====
  static const String yerTuri = "Yer turi";
  static const String yerLalmi = "Lalmi";
  static const String yerTogoldi = "Tog`oldi";
  static const String yerAdir = "Adir";
  static const String yerSuvli = "Suvli maydon";

  // ===== SUBSIDY TYPES =====
  static const String subsidiyaLimon = "Limon";
  static const String subsidiyaShpalier = "Shpalier";
  static const String subsidiyaKochat = "Ko`chat";
  static const String subsidiyaQuduq = "Quduq";
  static const String subsidiyaTomchilatib = "Tomchilatib";
  static const String subsidiyaMuqobilenergiya = "Muqobilenergiya";

  // ===== REGIONS =====
  static const String regionTashkent = "Tashkent";
  static const String regionAndijan = "Andijan";
  static const String regionBukhara = "Bukhara";
  static const String regionFergana = "Fergana";
  static const String regionJizzakh = "Jizzakh";
  static const String regionKashkadarya = "Kashkadarya";
  static const String regionNavoi = "Navoi";
  static const String regionNamangan = "Namangan";
  static const String regionSamarkand = "Samarkand";
  static const String regionSirdarya = "Sirdarya";
  static const String regionSurkhandarya = "Surkhandarya";
  static const String regionKarakalpakstan = "Karakalpakstan";

  // ===== VALIDATION ERRORS =====
  static const String errorRequired = "Bu maydon majburiy";
  static const String errorTimeNotSelected = "Vaqt tanlanmagan, vaqtni to`ldiring";
  static const String errorPlantationTypeNotSelected = "Plantatsiya turi tanlanmagan, tanlovni bajaring";
  static const String errorBogTypeNotSelected = "Bog turi tanlanmagan, tanlovni bajaring";
  static const String errorUzumTypeNotSelected = "Uzum turi tanlanmagan, tanlovni bajaring";
  static const String errorIssiqxonaTypeNotSelected = "Issiqxona turi tanlanmagan, tanlovni bajaring";
  static const String errorYerTypeNotSelected = "Yer turi tanlanmagan, tanlovni bajaring";
  static const String errorNotUsableAreaInvalid = "Foydalanishga yaroqsiz yerlar noto'g'ri yoki bo'sh, to'ldiring";
  static const String errorNotUsableAreaNegative = "Foydalanishga yaroqsiz maydon manfiy bo'lishi mumkin emas";
  static const String errorEmptyAreaInvalid = "Ochiq maydon noto'g'ri yoki bo'sh, to'ldiring";
  static const String errorEmptyAreaNegative = "Ochiq maydon manfiy bo'lishi mumkin emas";

  // ===== FORM LABELS =====
  static const String labelYerTuri = "Yer turi";
  static const String labelNotUsableArea = "Foydalanishga yaroqsiz maydon";
  static const String hintYerTuriNotSelected = "yer turi tanlanmagan";
  static const String hintYerTuriNotSelectedAlt = "yer turini tanlanmagan";
  static const String hintIssiqxonaTypeNotSelected = "issiqxona turi tanlanmagan";
  static const String hintUzumTypeNotSelected = "uzumzor turi tanlanmagan";
  static const String hintNotUsableArea = "yaroqsiz maydon kiritilmagan";

  // ===== BUTTONS =====
  static const String buttonAdd = "Qo'shish";
  static const String buttonSave = "Saqlash";
  static const String buttonCancel = "Bekor qilish";
  static const String buttonDelete = "O'chirish";
  static const String buttonEdit = "Tahrirlash";
  static const String buttonSearch = "Qidirish";
  static const String buttonTryAgain = "Qayta urinib ko'ring";

  // ===== MESSAGES =====
  static const String messageUnexpectedError = "Kutilmagan xatolik";
  static const String messageDataProcessingError = "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
  static const String messageDeleteRequest = "O'chirish so'rovi";

  // ===== HOME PAGE =====
  static const String homeTitle = "GEO Agro";
  static const String approved = "Tasdiqlangan";
  static const String pending = "Ko'rib chiqilmoqda";
  static const String recheck = "Qayta ko'rib chiqish";

  // ===== PLANTATION FIELDS =====
  static const String fieldHudud = "Hudud";
  static const String fieldFermer = "Fermer";
  static const String fieldYerTuriField = "Yer turi";
  static const String fieldYerMaydoni = "Yer maydoni";
  static const String fieldId = "ID";
  static const String fieldBogTashkilTopganYil = "Bog tashkil topgan yil";
  static const String fieldQoshilganVaqt = "Qo'shilgan vaqt";
  static const String fieldYil = "yil";
  static const String fieldGa = "ga";

  // ===== PLANTATION DATA =====
  static String plantationYear(int year) => "$year ${AppStrings.fieldYil}";

  // ===== MAPS =====
  static const String mapCreatePlantation = "Plantatsiya yaratish";
  static const String mapViewPlantation = "Plantatsiyani ko'rish";

  // ===== FARMERS =====
  static const String farmers = "Fermerlar";
  static const String farmerCreate = "Fermer yaratish";
  static const String farmerSearch = "Fermer qidirish";
  static const String farmerPlantations = "Fermer plantatsiyalari";
  static const String farmerStatistics = "Fermerlar statistikasi";

  // ===== NOTIFICATIONS =====
  static const String notifications = "Xabarnomalar";
  static const String notificationUnread = "O'qilmagan xabarnomalar";

  // ===== EMPTY STATES =====
  static const String emptyStateNoData = "Ma'lumot topilmadi";
  static const String emptyStateNoResults = "Natijalar topilmadi";
}

/// Helper class for getting localized values from maps
class AppLocalizedMaps {
  AppLocalizedMaps._();

  static Map<int, String> get plantationTypes => {
    1: AppStrings.bog,
    2: AppStrings.uzumzor,
    3: AppStrings.issiqxona,
  };

  static Map<int, String> get issiqxonaTypes => {
    1: AppStrings.issiqxonaMahalliy,
    2: AppStrings.issiqxonaZamonaviy,
  };

  static Map<int, String> get uzumTypes => {
    1: AppStrings.uzumXoraki,
    2: AppStrings.uzumKishmish,
    3: AppStrings.uzumSanoat,
  };

  static Map<int, String> get bogTypes => {
    1: AppStrings.bogIntensiv,
    2: AppStrings.bogMahalliy,
  };

  static Map<int, String> get bogSubtypes => {
    1: AppStrings.bogPakana,
    2: AppStrings.bogYarimPakana,
  };

  static Map<int, String> get yerTuri => {
    1: AppStrings.yerLalmi,
    2: AppStrings.yerTogoldi,
    3: AppStrings.yerAdir,
    4: AppStrings.yerSuvli,
  };

  static Map<int, String> get subsidyTypes => {
    1: AppStrings.subsidiyaLimon,
    2: AppStrings.subsidiyaShpalier,
    3: AppStrings.subsidiyaKochat,
    4: AppStrings.subsidiyaQuduq,
    5: AppStrings.subsidiyaTomchilatib,
    6: AppStrings.subsidiyaMuqobilenergiya,
  };

  static Map<int, String> get regions => {
    1: AppStrings.regionTashkent,
    2: AppStrings.regionAndijan,
    3: AppStrings.regionBukhara,
    4: AppStrings.regionFergana,
    5: AppStrings.regionJizzakh,
    6: AppStrings.regionKashkadarya,
    7: AppStrings.regionNavoi,
    8: AppStrings.regionNamangan,
    9: AppStrings.regionSamarkand,
    10: AppStrings.regionSirdarya,
    11: AppStrings.regionSurkhandarya,
    12: AppStrings.regionKarakalpakstan,
  };
}

