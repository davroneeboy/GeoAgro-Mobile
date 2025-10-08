import React from 'react';

const PlantationStatusIndicator = ({ plantation }) => {
  if (!plantation) return null;

  const { is_checked, is_rejected, is_deleting } = plantation;

  // Определяем статус плантации
  let status, statusText, statusColor, statusBorderColor, statusIcon;

  if (is_deleting) {
    status = 'deleting';
    statusText = 'O\'chirilmoqda';
    statusColor = 'bg-red-500';
    statusBorderColor = 'border-red-500';
    statusIcon = (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
      </svg>
    );
  } else if (is_checked) {
    status = 'approved';
    statusText = 'Tasdiqlangan';
    statusColor = 'bg-green-500';
    statusBorderColor = 'border-green-500';
    statusIcon = (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    );
  } else if (is_rejected) {
    status = 'rejected';
    statusText = 'Rad etilgan';
    statusColor = 'bg-red-500';
    statusBorderColor = 'border-red-500';
    statusIcon = (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  } else {
    status = 'pending';
    statusText = 'Moderatsiyada';
    statusColor = 'bg-yellow-500';
    statusBorderColor = 'border-yellow-500';
    statusIcon = (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  return (
    <div className={`mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-md border-2 ${statusBorderColor}`}>
      <div className={`w-2 h-2 rounded-full ${statusColor} flex-shrink-0`}></div>
      <div className="flex items-center gap-1.5 text-white">
        <div className="w-3 h-3 flex items-center justify-center">
          {statusIcon}
        </div>
        <span className="text-sm font-medium">{statusText}</span>
      </div>
      {(status === 'approved' || status === 'rejected') && plantation.moderated_at && (
        <div className="text-xs text-gray-400 ml-2">
          {new Date(plantation.moderated_at).toLocaleDateString('ru-RU')}
        </div>
      )}
      {status === 'pending' && plantation.created_at && (
        <div className="text-xs text-gray-400 ml-2">
          {new Date(plantation.created_at).toLocaleDateString('ru-RU')}
        </div>
      )}
    </div>
  );
};

export default PlantationStatusIndicator;
