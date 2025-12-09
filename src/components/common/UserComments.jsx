import React from 'react';

export default function UserComments({ comments = [] }) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-green-900/20 p-4 rounded-lg border border-green-500/30">
      <div className="flex items-center gap-2 mb-2 text-white">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="font-semibold text-green-300">Fermer izohlari</span>
      </div>
      <div className="p-3 rounded-lg border border-green-500/50 bg-green-900/10 space-y-3">
        {comments.map((comment) => (
          <div key={comment?.id} className="border-b border-green-500/30 pb-3 last:border-b-0">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-gray-200 text-sm whitespace-pre-wrap mb-2">{comment?.body || ''}</div>
                <div className="flex items-center gap-4 text-xs text-green-300">
                  {comment?.created_by && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>
                        {comment.created_by.first_name && comment.created_by.last_name
                          ? `${comment.created_by.first_name} ${comment.created_by.last_name}`
                          : comment.created_by.username || 'Noma\'lum foydalanuvchi'}
                      </span>
                    </div>
                  )}
                  {comment?.created_at && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {new Date(comment.created_at).toLocaleString("ru-RU", {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {comment?.image && typeof comment.image === 'string' && (
                <a href={comment.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img src={comment.image} alt="comment" className="w-16 h-16 object-cover rounded border border-green-500/50" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

