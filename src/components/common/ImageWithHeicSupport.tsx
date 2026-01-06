import React, { useState, useEffect, useRef } from 'react';
import { isHeicImage, convertHeicToJpeg } from '../../utils/imageUtils';
import { getAccessToken } from '../../utils/apiUtils';

interface ImageWithHeicSupportProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Компонент для отображения изображений с поддержкой HEIC формата
 * Автоматически конвертирует HEIC изображения в JPEG для отображения в браузере
 */
const ImageWithHeicSupport: React.FC<ImageWithHeicSupportProps> = ({ 
  src, 
  alt = '', 
  className = '', 
  onClick,
  onError,
  ...props 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);
  
  // Получаем токен авторизации для загрузки изображений
  const accessToken = getAccessToken();

  useEffect(() => {
    // Освобождаем предыдущий blob URL, если он был
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!src) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Если это HEIC изображение, конвертируем его
    if (isHeicImage(src)) {
      convertHeicToJpeg(src, accessToken)
        .then((convertedUrl) => {
          if (convertedUrl) {
            blobUrlRef.current = convertedUrl;
            setImageUrl(convertedUrl);
            setIsLoading(false);
          } else {
            // Если конвертация не удалась, показываем placeholder или скрываем
            setHasError(true);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error('Ошибка обработки HEIC изображения:', error);
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      // Для обычных изображений просто используем оригинальный URL
      setImageUrl(src);
      setIsLoading(false);
    }

    // Cleanup: освобождаем blob URL при размонтировании или изменении src
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src]);

  // Если изображение загружается, показываем placeholder
  if (isLoading) {
    return (
      <div 
        className={`${className} bg-gray-700 flex items-center justify-center`}
        style={{ minHeight: '100px' }}
      >
        <span className="text-gray-400 text-sm">Загрузка...</span>
      </div>
    );
  }

  // Если произошла ошибка или нет URL, показываем placeholder или оригинальный URL
  if (hasError || !imageUrl) {
    // Если это HEIC и конвертация не удалась, попробуем показать оригинальный URL
    // (хотя браузер не сможет его отобразить, но пользователь увидит, что файл существует)
    if (src && isHeicImage(src)) {
      return (
        <div 
          className={`${className} bg-gray-700 flex flex-col items-center justify-center`}
          style={{ minHeight: '100px' }}
        >
          <span className="text-gray-400 text-xs mb-1">HEIC формат</span>
          <span className="text-gray-500 text-xs">Конвертация не удалась</span>
          <a 
            href={src} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 text-xs mt-2 hover:underline"
          >
            Скачать файл
          </a>
        </div>
      );
    }
    
    return (
      <div 
        className={`${className} bg-gray-700 flex items-center justify-center`}
        style={{ minHeight: '100px' }}
      >
        <span className="text-gray-400 text-sm">Изображение недоступно</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={(e) => {
        setHasError(true);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};

export default ImageWithHeicSupport;

