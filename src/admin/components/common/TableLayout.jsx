import React from 'react';
import { Button, Input, Space } from 'antd';

export default function TableLayout({ searchPlaceholder, onSearchChange, onOpenFilters, actions, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input.Search placeholder={searchPlaceholder} allowClear onChange={(e) => onSearchChange?.(e.target.value)} className="max-w-sm" />
        <Space>
          {actions}
          {onOpenFilters && <Button onClick={onOpenFilters}>Фильтры</Button>}
        </Space>
      </div>
      {children}
    </div>
  );
} 