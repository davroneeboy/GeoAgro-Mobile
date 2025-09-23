import React, { useEffect } from 'react';
import { Form, Input, Modal, Select } from 'antd';

const regions = ['Tashkent', 'Samarkand', 'Khorezm'];

export default function DistrictFormModal({ open, onCancel, onSubmit, initialValues }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues || { name: '', region: undefined, slug: '' });
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit?.(values);
  };

  return (
    <Modal open={open} title={initialValues ? 'Редактировать район' : 'Добавить район'} onCancel={onCancel} onOk={handleOk} okText="Сохранить">
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Укажите название' }]}>
          <Input placeholder="Xiva sh" onChange={(e) => {
            const v = e.target.value || '';
            const slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (!form.getFieldValue('slug')) form.setFieldValue('slug', slug);
          }} />
        </Form.Item>
        <Form.Item name="region" label="Регион" rules={[{ required: true, message: 'Выберите регион' }]}>
          <Select options={regions.map(r => ({ value: r, label: r }))} placeholder="Выберите регион" />
        </Form.Item>
        <Form.Item name="slug" label="Slug для URL" rules={[{ required: true, message: 'Укажите slug' }]}>
          <Input placeholder="xiva-sh" />
        </Form.Item>
      </Form>
    </Modal>
  );
} 