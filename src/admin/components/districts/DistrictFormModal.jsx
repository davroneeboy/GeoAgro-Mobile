import React, { useEffect } from 'react';
import { Form, Input, Modal } from 'antd';

export default function DistrictFormModal({ open, onCancel, onSubmit, initialValues }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues || { name: '', region: undefined });
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    // region должен быть числом
    const payload = { ...values, region: values.region ? Number(values.region) : undefined };
    onSubmit?.(payload);
  };

  return (
    <Modal open={open} title={initialValues ? 'Редактировать район' : 'Добавить район'} onCancel={onCancel} onOk={handleOk} okText="Сохранить">
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Укажите название' }]}>
          <Input placeholder="Новый район" />
        </Form.Item>
        <Form.Item name="region" label="Регион (ID)" rules={[{ required: true, message: 'Укажите ID региона' }]}>
          <Input placeholder="Напр. 1" inputMode="numeric" />
        </Form.Item>
      </Form>
    </Modal>
  );
} 