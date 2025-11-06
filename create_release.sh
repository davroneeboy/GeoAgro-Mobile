#!/bin/bash

# Скрипт для создания GitHub Release с APK файлом

# Настройки
GITHUB_USERNAME="your-username"
REPO_NAME="your-repo"
VERSION="2.1.2"
BUILD_NUMBER="212"
APK_PATH="app/build/outputs/flutter-apk/app-release.apk"
CHANGELOG="Исправлены ошибки в системе обновлений, добавлена поддержка десятичных чисел в полях площадей"

# Проверяем наличие APK файла
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK файл не найден: $APK_PATH"
    echo "Сначала соберите приложение: flutter build apk --release"
    exit 1
fi

# Создаем тег
echo "🏷️  Создаем тег v$VERSION..."
git tag -a "v$VERSION" -m "Release version $VERSION"

# Пушим тег
echo "📤 Пушим тег..."
git push origin "v$VERSION"

# Создаем Release через GitHub CLI
echo "🚀 Создаем Release..."
gh release create "v$VERSION" \
    --title "GEO AGRO v$VERSION" \
    --notes "$CHANGELOG" \
    --target main \
    "$APK_PATH"

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "✅ Release создан успешно!"
    echo "📱 APK доступен по ссылке:"
    echo "https://github.com/$GITHUB_USERNAME/$REPO_NAME/releases/download/v$VERSION/app-release.apk"
    echo ""
    echo "🔗 Обновите URL в render_server.js:"
    echo "download_url: \"https://github.com/$GITHUB_USERNAME/$REPO_NAME/releases/download/v$VERSION/app-release.apk\""
else
    echo "❌ Ошибка при создании Release"
    exit 1
fi 