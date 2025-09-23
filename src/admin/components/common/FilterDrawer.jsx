import React from 'react';
import { Button, Drawer, Space } from 'antd';

export default function FilterDrawer({ open, onClose, onReset, onApply, children, width = 360, title = 'Фильтры' }) {
  return (
    <Drawer title={title} open={open} onClose={onClose} width={width} destroyOnClose>
      <div className="space-y-4">
        {children}
        <Space>
          <Button onClick={onReset}>Сбросить</Button>
          <Button type="primary" onClick={onApply}>Применить</Button>
        </Space>
      </div>
    </Drawer>
  );
} 