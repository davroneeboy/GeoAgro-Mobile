import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, message, List, Table, Typography, Divider, Empty } from 'antd';
import { dashboardApi } from '../services/adminApi';
import { formatNumberShort } from '../utils/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [quick, setQuick] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuick, setLoadingQuick] = useState(false);

  // Русские метки для известных ключей (секций/полей)
  const labelMap = {
    // quick stats
    users_active_today: 'Bugun faol',
    active_users_today: 'Bugun faol',
    plantations_created_this_week: 'Haftada yaratilgan plantatsiyalar',
    created_today: 'Bugun yaratilgan',
    created_this_week: 'Haftada yaratilgan',
    created_this_month: 'Oydagi yaratilgan',
    approved_month: 'Oydagi tasdiqlangan',
    pending_moderation: 'Moderatsiyada',
    approved_today: 'Bugun tasdiqlangan',
    total_plantations: 'Plantatsiyalar',
    total_users: 'Foydalanuvchilar',

    // общие поля
    id: 'ID',
    name: 'Nomi',
    created_at: 'Yaratilgan',
    moderated_at: 'Moderatsiya qilingan',
    status: 'Holat',
    district_name: 'Tuman',
    farmer_name: 'Fermer',
    waiting_time_hours: 'Kutish (soat)',
    total_area: 'Maydon',
    irrigation_area: 'Sug‘oriladigan maydon',
    planted_area: 'Ekilgan',
    total_planted_area: 'Ekilgan',

    // сводки
    total: 'Jami',
    approved: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
    pending: 'Moderatsiyada',

    // users.by_role
    regular: 'Oddiy',
    superuser: 'Superfoydalanuvchilar',
    head_of_region: 'Viloyat rahbarlari',
    only_view: 'Faqat ko‘rish',

    // секции
    Moderation: 'Moderatsiya',
    Regions: 'Hududlar',
    Trends: 'Trendlar',
    'Last updated': 'So‘nggi yangilanish',

    // колонки Regions/Trends
    plantations_count: 'Plantatsiyalar',
    approved_count: 'Tasdiqlangan',
    pending_count: 'Moderatsiyada',
    users_count: 'Foydalanuvchilar',
    area: 'Maydon',
    'Plantations count': 'Plantatsiyalar',
    'Approved count': 'Tasdiqlangan',
    'Pending count': 'Moderatsiyada',
    'Users count': 'Foydalanuvchilar',
    'Plantations change percent': 'Plantatsiyalar o‘zgarishi (%)',
    'Current month plantations': 'Joriy oy plantatsiyalari',
    'Previous month plantations': 'O‘tgan oy plantatsiyalari',
    'Average moderation time': 'O‘rtacha moderatsiya vaqti',
    'Rejected today': 'Bugun rad etilgan',
    'Approved this week': 'Haftada tasdiqlangan',
    'Rejected this week': 'Haftada rad etilgan',
  };

  const statusLabel = (status) => {
    const map = { approved: 'Tasdiqlangan', rejected: 'Rad etilgan', pending: 'Moderatsiyada' };
    return map[status] || status;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await dashboardApi.getDashboard();
        setData(res);
      } catch (e) {
        message.error('Dashboardni yuklab bo‘lmadi');
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

  const prettifyKey = (key) => {
    if (!key) return '';
    if (labelMap[key]) return labelMap[key];
    return String(key)
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (s) => s.toUpperCase());
  };

  const tryFormatValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'number') return formatNumberShort(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'string') {
      const ms = Date.parse(value);
      if (!Number.isNaN(ms) && /[T:-]/.test(value)) {
        try { return new Date(value).toLocaleString(); } catch {}
      }
      const asNum = Number(value);
      if (!Number.isNaN(asNum)) return formatNumberShort(asNum);
      return labelMap[value] || value;
    }
    if (typeof value === 'object') {
      if ('name' in value) return String(value.name);
      if ('title' in value) return String(value.title);
      if ('label' in value) return String(value.label);
      if ('id' in value) return `#${value.id}`;
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
  };

  const buildColumnsFromRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const keys = Array.from(rows.reduce((acc, row) => {
      Object.keys(row || {}).forEach((k) => acc.add(k));
      return acc;
    }, new Set()));
    return keys.map((k) => ({
      title: prettifyKey(k),
      dataIndex: k,
      key: k,
      render: (v) => tryFormatValue(v),
    }));
  };

  const renderArray = (title, arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return (
        <Card title={title} bordered>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ma’lumot yo‘q" />
        </Card>
      );
    }
    const first = arr[0];
    const isPrimitive = ['string', 'number', 'boolean'].includes(typeof first);
    if (isPrimitive) {
      return (
        <Card title={title} bordered>
          <List
            dataSource={arr}
            renderItem={(item) => <List.Item>{tryFormatValue(item)}</List.Item>}
          />
        </Card>
      );
    }
    return (
      <Card title={title} bordered>
        <Table
          rowKey={(row, idx) => row?.id ?? idx}
          dataSource={arr}
          columns={buildColumnsFromRows(arr)}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    );
  };

  const renderObjectGrid = (obj) => {
    const entries = Object.entries(obj || {});
    const numericOrString = entries.filter(([, v]) => ['number', 'string', 'boolean'].includes(typeof v));
    if (numericOrString.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-2">
        {numericOrString.map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500">{prettifyKey(k)}:</span> {tryFormatValue(v)}
          </div>
        ))}
      </div>
    );
  };

  const quickCards = Object.entries(quick || {})
    .filter(([k, v]) => typeof v === 'number' && !['pending_moderation', 'approved_month'].includes(k))
    .map(([k, v]) => ({ title: prettifyKey(k), value: v }));

  const reservedSections = new Set(['overview', 'plantations', 'users', 'recent_activities']);
  const otherSections = Object.entries(data || {})
    .filter(([k]) => !reservedSections.has(k))
    .map(([k, v]) => ({ key: k, value: v }));

  return (
    <div className="space-y-4">
      {quickCards.length > 0 && (
        <Row gutter={[16, 16]}>
          {quickCards.map((c, i) => (
            <Col key={i} xs={24} sm={12} md={6}>
              <Card loading={loadingQuick}>
                <Statistic title={c.title} value={formatNumberShort(c.value)} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Plantatsiyalar" value={formatNumberShort(data?.overview?.total_plantations ?? 0)} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Foydalanuvchilar" value={formatNumberShort(data?.overview?.total_users ?? 0)} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Moderatsiyada" value={formatNumberShort(data?.overview?.pending_moderation ?? 0)} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card loading={loading}><Statistic title="Bugun tasdiqlangan" value={formatNumberShort(data?.overview?.approved_today ?? 0)} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Plantatsiyalar" loading={loading}>
            {renderObjectGrid(data?.plantations) || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ma’lumot yo‘q" />}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Foydalanuvchilar" loading={loading}>
            <div className="grid grid-cols-2 gap-2">
              <div>{prettifyKey('regular')}: {formatNumberShort(data?.users?.by_role?.regular ?? 0)}</div>
              <div>{prettifyKey('superuser')}: {formatNumberShort(data?.users?.by_role?.superuser ?? 0)}</div>
              <div>{prettifyKey('head_of_region')}: {formatNumberShort(data?.users?.by_role?.head_of_region ?? 0)}</div>
              <div>{prettifyKey('only_view')}: {formatNumberShort(data?.users?.by_role?.only_view ?? 0)}</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="So‘nggi plantatsiyalar" loading={loading}>
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
          <Card title="So‘nggi moderatsiyalar" loading={loading}>
            <List
              dataSource={data?.recent_activities?.recent_moderations || []}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <span>#{item.id} — {statusLabel(item.status)}</span>
                    <span className="text-gray-500 text-sm">{item.moderated_at ? new Date(item.moderated_at).toLocaleString() : ''}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {otherSections.length > 0 && (
        <>
          <Divider />
          <Typography.Title level={4}>Qo‘shimcha ma’lumotlar</Typography.Title>
          <Row gutter={[16, 16]}>
            {otherSections.map(({ key, value }) => (
              <Col key={key} xs={24} md={12}>
                {Array.isArray(value)
                  ? renderArray(prettifyKey(key), value)
                  : (
                    <Card title={prettifyKey(key)} bordered>
                      {typeof value === 'object' && value
                        ? renderObjectGrid(value) || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ma’lumot yo‘q" />
                        : <div>{tryFormatValue(value)}</div>}
                    </Card>
                  )}
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
} 