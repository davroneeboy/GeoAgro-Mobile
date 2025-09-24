import React, { useEffect, useState } from 'react';
import { Card, Col, Descriptions, Row, Spin, message, Space, Button, Table, Divider, Image, Tag, Modal, Input } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { moderationApi } from '../../services/adminApi';
import { API_BASE_URL2 } from '../../../config';

function resolveImageSrc(item) {
  const pick = (obj, keys) => keys.map(k => obj?.[k]).find(Boolean);
  let v = null;
  if (typeof item === 'string') {
    v = item;
  } else if (item && typeof item === 'object') {
    v = pick(item, ['url', 'image_url', 'image', 'src', 'file']);
    if (v && typeof v === 'object') v = v.url || v.path || null;
  }
  if (!v) return null;
  const isAbsolute = /^https?:\/\//i.test(v);
  if (isAbsolute) return v;
  const base = API_BASE_URL2 || '';
  return base.replace(/\/$/, '') + '/' + String(v).replace(/^\//, '');
}

export default function ModerationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await moderationApi.detail(id);
      setData(res);
    } catch (e) {
      message.error('Не удалось загрузить детали плантации');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const run = async (action, comment) => {
    try {
      setSaving(true);
      await moderationApi.bulkActions({ action, plantation_ids: [Number(id)], comment: comment || (action === 'reject' ? 'Отклонено' : action === 'approve' ? 'Одобрено' : 'Сброшено') });
      message.success('Статус обновлён');
      await load();
    } catch (e) {
      message.error('Не удалось выполнить действие');
    } finally {
      setSaving(false);
    }
  };

  const confirmAction = (action) => {
    const titles = { approve: 'Одобрить плантацию?', reject: 'Отклонить плантацию?', reset: 'Сбросить модерацию?' };
    const okTexts = { approve: 'Одобрить', reject: 'Отклонить', reset: 'Сбросить' };
    let localComment = '';
    Modal.confirm({
      title: titles[action],
      okText: okTexts[action],
      cancelText: 'Отмена',
      okButtonProps: { danger: action === 'reject', loading: saving },
      content: action === 'reject' ? (
        <div>
          <div className="text-xs text-gray-500 mb-1">Комментарий (обязательно)</div>
          <Input.TextArea rows={3} onChange={(e) => { localComment = e.target.value; }} />
        </div>
      ) : 'Подтвердите действие',
      onOk: () => {
        if (action === 'reject' && !String(localComment || '').trim()) {
          message.warning('Введите комментарий для отклонения');
          return Promise.reject();
        }
        return run(action, localComment);
      },
    });
  };

  if (loading) return <Spin />;
  if (!data) return null;

  const fruitAreas = data.fruit_areas || [];
  const investments = data.investments || [];
  const subsidies = data.subsidies || [];
  const trellises = data.trellises || [];
  const reservoirs = data.reservoirs || [];
  const images = (data.images || []).map(resolveImageSrc).filter(Boolean);

  return (
    <div className="space-y-4">
      <Space wrap>
        <Button type="primary" onClick={() => confirmAction('approve')}>Одобрить</Button>
        <Button danger onClick={() => confirmAction('reject')}>Отклонить</Button>
        <Button onClick={() => confirmAction('reset')}>Сбросить</Button>
        <Button onClick={() => navigate(-1)}>Назад</Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={`Плантация #${data.id}`}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Статус"><Tag color={data.status === 'approved' ? 'green' : data.status === 'rejected' ? 'red' : 'default'}>{data.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Ожидание (ч)">{data.waiting_time_hours ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Создано">{data.created_at ? new Date(data.created_at).toLocaleString() : '—'}</Descriptions.Item>
              <Descriptions.Item label="Обновлено">{data.updated_at ? new Date(data.updated_at).toLocaleString() : '—'}</Descriptions.Item>
              <Descriptions.Item label="Создатель">{data.created_by?.username || '—'}</Descriptions.Item>
              <Descriptions.Item label="Проверено">{data.is_checked ? 'Да' : 'Нет'}</Descriptions.Item>
              <Descriptions.Item label="Отклонено">{data.is_rejected ? 'Да' : 'Нет'}</Descriptions.Item>
              <Descriptions.Item label="Комментарий модерации">{data.moderation_comment || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Фермер / Локация">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Фермер">{data.farmer?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Телефон">{data.farmer?.phone_number || '—'}</Descriptions.Item>
              <Descriptions.Item label="ИНН">{data.farmer?.inn ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Год основания">{data.farmer?.established_year ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Адрес">{data.farmer?.address || '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{data.farmer?.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Район">{data.district?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Регион">{data.district?.region ?? '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card title="Участок / Площади">
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Общая площадь (га)">{data.total_area ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Поливная площадь (га)">{data.irrigation_area ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Непригодная (га)">{data.not_usable_area ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Год закладки сада">{data.garden_established_year ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Тип земли">{data.land_type ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Систем ирригации">{data.irrigation_systems_count ?? 0}</Descriptions.Item>
          <Descriptions.Item label="Насосные станции">{data.pump_station_count ?? 0}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Фруктовые площади">
        <Table
          size="small"
          columns={[
            { title: 'Фрукт', dataIndex: 'fruit_name' },
            { title: 'Сорт', dataIndex: 'variety_name' },
            { title: 'Подвой', dataIndex: 'rootstock_name' },
            { title: 'Год посадки', dataIndex: 'planted_year', width: 120 },
            { title: 'Площадь (га)', dataIndex: 'area', width: 140, align: 'right' },
            { title: 'Схема', dataIndex: 'schema' },
            { title: 'Огорожено', dataIndex: 'fenced', render: (v) => v ? 'Да' : 'Нет', width: 100 },
            { title: 'Вес', dataIndex: 'weight', width: 100 },
          ]}
          dataSource={(data.fruit_areas || [])}
          rowKey={(r) => r.id}
          pagination={false}
        />
      </Card>

      {!!(data.investments || []).length && (
        <Card title="Инвестиции">
          <Table size="small" pagination={false} rowKey={(r, i) => i} columns={[
            { title: 'Тип', dataIndex: 'type' },
            { title: 'Сумма', dataIndex: 'amount', align: 'right' },
            { title: 'Описание', dataIndex: 'description' },
          ]} dataSource={data.investments} />
        </Card>
      )}

      {!!(data.subsidies || []).length && (
        <Card title="Субсидии">
          <Table size="small" pagination={false} rowKey={(r, i) => i} columns={[
            { title: 'Назначение', dataIndex: 'purpose' },
            { title: 'Сумма', dataIndex: 'amount', align: 'right' },
            { title: 'Описание', dataIndex: 'description' },
          ]} dataSource={data.subsidies} />
        </Card>
      )}

      {!!(data.trellises || []).length && (
        <Card title="Шпалеры">
          <Table size="small" pagination={false} rowKey={(r, i) => i} columns={[
            { title: 'Тип', dataIndex: 'type' },
            { title: 'Кол-во', dataIndex: 'count', align: 'right' },
            { title: 'Описание', dataIndex: 'description' },
          ]} dataSource={data.trellises} />
        </Card>
      )}

      {!!(data.reservoirs || []).length && (
        <Card title="Резервуары">
          <Table size="small" pagination={false} rowKey={(r, i) => i} columns={[
            { title: 'Тип', dataIndex: 'type' },
            { title: 'Объём', dataIndex: 'capacity', align: 'right' },
            { title: 'Описание', dataIndex: 'description' },
          ]} dataSource={data.reservoirs} />
        </Card>
      )}

      {!!images.length && (
        <Card title="Изображения">
          <Space wrap>
            {images.map((src, idx) => (
              <Image key={idx} width={160} src={src} alt={String(idx)} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ))}
          </Space>
        </Card>
      )}

      {!!data.prev_data && (
        <Card title="Предыдущие данные">
          <pre className="text-xs overflow-auto p-2 bg-gray-50 rounded" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data.prev_data, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
} 