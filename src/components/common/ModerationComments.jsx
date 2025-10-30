import React from 'react';
import translateAction from '../../utils/moderationUtils';

export default function ModerationComments({ comments = [] }) {
  const simple = Array.isArray(comments)
    ? comments.filter(mc => !mc?.author && !mc?.action && !mc?.timestamp && !mc?.author_role)
    : [];
  const extended = Array.isArray(comments)
    ? comments.filter(mc => mc?.author || mc?.action || mc?.timestamp || mc?.author_role)
    : [];

  return (
    <>
      {/* Обычные комментарии */}
      {simple.length > 0 && (
        <div className="mb-6 bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-semibold">Moderatsiya kommenti</span>
          </div>
          <div className="p-3 rounded-lg border border-gray-600 bg-gray-800/50 space-y-3">
            {simple.map((mc, idx) => (
              <div key={mc?.id ?? idx} className="border-b border-gray-600 pb-3 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-gray-200 text-sm whitespace-pre-wrap">{mc?.text || ''}</div>
                  </div>
                  {mc?.image && typeof mc.image === 'string' && (
                    <a href={mc.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={mc.image} alt="comment" className="w-16 h-16 object-cover rounded border border-gray-600" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Расширенные комментарии */}
      {extended.length > 0 && (
        <div className="mb-6 bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2 text-white">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-semibold text-blue-300">Maxsus moderatsiya kommenti</span>
          </div>
          <div className="p-3 rounded-lg border border-blue-500/50 bg-blue-900/10 space-y-3">
            {extended.map((mc, idx) => (
              <div key={mc?.id ?? idx} className="border-b border-blue-500/30 pb-3 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-gray-200 text-sm whitespace-pre-wrap mb-2">{mc?.text || ''}</div>
                    <div className="flex items-center gap-4 text-xs text-blue-300">
                      {mc?.author && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Muallif: {mc.author}</span>
                        </div>
                      )}
                      {mc?.author_role && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Rol: {mc.author_role}</span>
                        </div>
                      )}
                      {mc?.timestamp && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {new Date(mc.timestamp).toLocaleString("ru-RU", {
                              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {mc?.action && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Harakat: {translateAction(mc.action)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {mc?.image && typeof mc.image === 'string' && (
                    <a href={mc.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={mc.image} alt="comment" className="w-16 h-16 object-cover rounded border border-blue-500/50" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}


