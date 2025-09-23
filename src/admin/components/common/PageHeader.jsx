import React from 'react';
import { Space } from 'antd';

export default function PageHeader({ title, extra }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
      <h1 className="text-xl font-semibold m-0">{title}</h1>
      <Space wrap>{extra}</Space>
    </div>
  );
} 