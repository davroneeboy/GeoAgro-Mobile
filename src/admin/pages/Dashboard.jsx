import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, message, List } from 'antd';
import { dashboardApi } from '../services/adminApi';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [quick, setQuick] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuick, setLoadingQuick] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await dashboardApi.getDashboard();
        setData(res);
      } catch (e) {
        message.error('Не удалось загрузить дашборд');
      } finally {
        setLoading(false);
      }
    };
    const loadQuick = async () => {
      try {
        setLoadingQuick(true);
        const res = await dashboardApi.getQuickStats();
        setQuick(res);
      } catch {}
      finally { setLoadingQuick(false); }
    };
    load();
    loadQuick();
  }, []);

  const quickCards = [];
  if (typeof quick?.users_active_today === 'number') {
    quickCards.push({ title: 'Активны сегодня', value: quick.users_active_today });
  }
  if (typeof quick?.plantations_created_this_week === 'number') {
    quickCards.push({ title: 'Создано плантаций (неделя)', value: quick.plantations_created_this_week });
  }
  // Не показываем "На модерации" и "Одобрено (месяц)", чтобы не дублировать и не ссылаться на отсутствующие поля API

  return (
    <div className="space-y-4">
      {quickCards.length > 0 && (
        <Row gutter={[16, 16]}>
          {quickCards.map((c, i) => (
            <Col key={i} xs={24} sm={12} md={6}><Card loading={loadingQuick}><Statistic title={c.title} value={c.value} /></Card></Col>
          ))}
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Плантаций" value={data?.overview?.total_plantations ?? 0} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Пользователи" value={data?.overview?.total_users ?? 0} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="На модерации" value={data?.overview?.pending_moderation ?? 0} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Одобрено сегодня" value={data?.overview?.approved_today ?? 0} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Плантации" loading={loading}>
            <div className="grid grid-cols-2 gap-2">
              <div>Всего: {data?.plantations?.total ?? 0}</div>
              <div>Одобрено: {data?.plantations?.approved ?? 0}</div>
              <div>Отклонено: {data?.plantations?.rejected ?? 0}</div>
              <div>На модерации: {data?.plantations?.pending ?? 0}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Пользователи" loading={loading}>
            <div className="grid grid-cols-2 gap-2">
              <div>Обычные: {data?.users?.by_role?.regular ?? 0}</div>
              <div>Суперпользователи: {data?.users?.by_role?.superuser ?? 0}</div>
              <div>Главы регионов: {data?.users?.by_role?.head_of_region ?? 0}</div>
              <div>Только просмотр: {data?.users?.by_role?.only_view ?? 0}</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Последние плантации" loading={loading}>
            <List
              dataSource={data?.recent_activities?.recent_plantations || []}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <span>#{item.id} — {item.district_name}</span>
                    <span className="text-gray-500 text-sm">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Последние модерации" loading={loading}>
            <List
              dataSource={data?.recent_activities?.recent_moderations || []}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <span>#{item.id} — {item.status}</span>
                    <span className="text-gray-500 text-sm">{item.moderated_at ? new Date(item.moderated_at).toLocaleString() : ''}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 