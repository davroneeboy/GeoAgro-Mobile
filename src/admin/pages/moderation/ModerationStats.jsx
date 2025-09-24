import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, message, Table } from 'antd';
import { moderationApi } from '../../services/adminApi';

export default function ModerationStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await moderationApi.stats();
        setData(res);
      } catch (e) {
        message.error('Не удалось загрузить статистику модерации');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Всего" value={data?.overview?.total_plantations ?? 0} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="На модерации" value={data?.overview?.pending_plantations ?? 0} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Одобрено" value={data?.overview?.approved_plantations ?? 0} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Отклонено" value={data?.overview?.rejected_plantations ?? 0} /></Card></Col>
      </Row>

      <Card title="По регионам" loading={loading}>
        <Table
          columns={[
            { title: 'Регион', dataIndex: 'district__region' },
            { title: 'Всего', dataIndex: 'total' },
            { title: 'На модерации', dataIndex: 'pending' },
            { title: 'Одобрено', dataIndex: 'approved' },
            { title: 'Отклонено', dataIndex: 'rejected' },
          ]}
          dataSource={data?.regions_stats || []}
          rowKey={(_, i) => i}
          pagination={false}
        />
      </Card>
    </div>
  );
} 