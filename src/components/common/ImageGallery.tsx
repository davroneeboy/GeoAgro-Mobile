import React, { useEffect, useState, useCallback } from 'react';
import ImageWithHeicSupport from './ImageWithHeicSupport';

interface ImageItem {
  id?: number | string;
  image_url: string;
  [key: string]: any;
}

interface ImageGalleryProps {
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * Компонент галереи изображений с навигацией
 * Поддерживает навигацию стрелками, клавиатурой и кнопками
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  initialIndex = 0,
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Обработка навигации клавиатурой
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, images.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50"
      onClick={onClose}
    >
      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Закрыть"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Стрелка влево */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
          aria-label="Предыдущее изображение"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Изображение */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-full max-h-full p-4"
      >
        <ImageWithHeicSupport
          src={currentImage?.image_url}
          alt={`Изображение ${currentIndex + 1} из ${images.length}`}
          className="max-w-full max-h-[90vh] object-contain rounded-md"
        />
      </div>

      {/* Стрелка вправо */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
          aria-label="Следующее изображение"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Счетчик изображений */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm z-10">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Миниатюры внизу (опционально, для больших галерей) */}
      {hasMultipleImages && images.length <= 10 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 z-10">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white'
                  : 'border-transparent opacity-50 hover:opacity-75'
              }`}
            >
              <ImageWithHeicSupport
                src={img.image_url}
                alt={`Миниатюра ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

