import React, { useEffect, useState } from 'react';
import { Button, Popconfirm, Space, Table, Tag, message, Input } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import FarmerFormModal from '../../components/farmers/FarmerFormModal';
import { referencesApi } from '../../services/adminApi';
import { exportSimpleSheet } from '../../../utils/excelExport';

export default function FarmersPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [regionFilter, setRegionFilter] = useState(undefined);
  const [districtFilter, setDistrictFilter] = useState(undefined);

  const fetchList = async (page = 1, pageSize = 20, search = '', region = regionFilter, district = districtFilter) => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (region) params.region = region;
      if (district) params.district = district;
      const res = await referencesApi.farmers.list(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) {
      message.error('Не удалось загрузить фермеров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1, pagination.pageSize, q, regionFilter, districtFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionFilter, districtFilter]);

  const handleTableChange = (pag) => {
    fetchList(pag.current, pag.pageSize, q, regionFilter, districtFilter);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing?.id) {
        await referencesApi.farmers.update(editing.id, values);
      } else {
        const payload = {
          name: values.name,
          director_name: values.director,
          phone_number: values.phone,
          inn: values.inn ? Number(values.inn) : undefined,
          established_year: values.year ? Number(values.year) : undefined,
          founder_name: values.founder || undefined,
          address: values.address || undefined,
          email: values.email || undefined,
          district: values.district ? Number(values.district) : undefined,
        };
        await referencesApi.farmers.create(payload);
      }
      message.success('Сохранено');
      setModalOpen(false);
      setEditing(null);
      fetchList(pagination.current, pagination.pageSize, q, regionFilter, districtFilter);
    } catch (e) {
      message.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await referencesApi.farmers.delete(id);
      message.success('Удалено');
      fetchList(pagination.current, pagination.pageSize, q, regionFilter, districtFilter);
    } catch (e) {
      message.error('Ошибка удаления');
    }
  };

  const toEditValues = (r) => ({
    id: r.id,
    name: r.name,
    director: r.director_name,
    phone: r.phone_number,
    inn: r.inn,
    year: r.established_year,
    founder: r.founder_name,
    address: r.address,
    email: r.email,
    district: r.district?.id || r.district,
  });

  const exportXlsx = () => {
    const rows = (data || []).map(r => ({ id: r.id, name: r.name, district: typeof r.district === 'object' ? (r.district?.name || r.district?.id) : (r.district || ''), year: r.established_year }));
    exportSimpleSheet(rows, [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Название', key: 'name', width: 28 },
      { header: 'Район', key: 'district', width: 24 },
      { header: 'Год', key: 'year', width: 12 },
    ], 'farmers.xlsx', 'Farmers');
  };

  return (
    <div>
      <PageHeader title="Фермеры" extra={<Space><Button onClick={exportXlsx}>Экспорт</Button><Button type="primary" onClick={() => { setEditing(null); setModalOpen(true); }}>Добавить</Button></Space>} />
      <TableLayout searchPlaceholder="Поиск фермеров" onSearchChange={(val) => { setQ(val); fetchList(1, pagination.pageSize, val, regionFilter, districtFilter); }} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'Хўжалик номи', dataIndex: 'name' },
            { title: 'Район', dataIndex: 'district', render: (v) => <Tag>{typeof v === 'object' ? (v?.name || v?.id) : v}</Tag> },
            { title: 'Год', dataIndex: 'established_year', render: (y) => <Tag color={y % 2 ? 'green' : 'blue'}>{y}</Tag> },
            { title: 'Действия', key: 'actions', render: (_, record) => (
              <Space>
                <Button size="small" onClick={() => { setEditing(toEditValues(record)); setModalOpen(true); }}>Изм.</Button>
                <Popconfirm title="Удалить?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger>Удалить</Button>
                </Popconfirm>
              </Space>
            ) },
          ]}
          dataSource={data}
          loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }}
          onChange={handleTableChange}
          rowKey={(r) => r.id}
        />
      </TableLayout>

      <FilterDrawer open={open} onClose={() => setOpen(false)} onReset={() => { setOpen(false); setRegionFilter(undefined); setDistrictFilter(undefined); fetchList(1, pagination.pageSize, '', undefined, undefined); }} onApply={() => setOpen(false)}>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Регион (ID)</div>
            <Input placeholder="Напр. 1" value={regionFilter || ''} onChange={(e) => setRegionFilter(e.target.value || undefined)} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Район (ID)</div>
            <Input placeholder="Напр. 1" value={districtFilter || ''} onChange={(e) => setDistrictFilter(e.target.value || undefined)} />
          </div>
        </div>
      </FilterDrawer>

      <FarmerFormModal open={modalOpen} initialValues={editing} onCancel={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />
    </div>
  );
} 