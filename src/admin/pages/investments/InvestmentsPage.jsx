import React from 'react';
import { Alert, Button } from 'antd';
import { Link } from 'react-router-dom';

export default function InvestmentsPage() {
  return (
    <div className="space-y-3">
      <Alert
        showIcon
        type="info"
        message="Раздел 'Инвестиции'"
        description={
          <div>
            В текущей версии данные по инвестициям доступны на карточке плантации в разделе модерации. 
            Перейдите в очередь модерации и откройте детали нужной плантации, чтобы увидеть вложенные инвестиции.
          </div>
        }
      />
      <Link to="/admin/moderation">
        <Button type="primary">Открыть очередь модерации</Button>
      </Link>
    </div>
  );
} 