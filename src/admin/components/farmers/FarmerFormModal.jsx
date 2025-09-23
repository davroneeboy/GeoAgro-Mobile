import React, { useEffect } from 'react';
import { Form, Input, Modal, Select } from 'antd';

const districts = ['Buloqboshi', 'Parkent', 'Zangiota'];

export default function FarmerFormModal({ open, onCancel, onSubmit, initialValues }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues || { name: '', director: '', phone: '', inn: '', year: undefined, district: undefined, address: '', email: '' });
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit?.(values);
  };

  return (
    <Modal open={open} title={initialValues ? 'Редактировать фермера' : 'Добавить фермера'} onCancel={onCancel} onOk={handleOk} okText="Сохранить">
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Фермер хўжалик номи" rules={[{ required: true, message: 'Укажите название' }]}>
          <Input placeholder="Пахтаобод истикболи" />
        </Form.Item>
        <Form.Item name="director" label="Хўжалик директори" rules={[{ required: true, message: 'Укажите директора' }]}>
          <Input placeholder="Чоршанбиев Шерзод" />
        </Form.Item>
        <Form.Item name="phone" label="Телефон рақами" rules={[{ required: true, message: 'Укажите телефон' }]}>
          <Input placeholder="99890..." />
        </Form.Item>
        <Form.Item name="inn" label="ИНН" rules={[{ required: true, message: 'Укажите ИНН' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="year" label="Ташкил этилган йил" rules={[{ required: true, message: 'Укажите год' }]}>
          <Input placeholder="2020" />
        </Form.Item>
        <Form.Item name="district" label="Туман" rules={[{ required: true, message: 'Выберите район' }]}>
          <Select options={districts.map(d => ({ value: d, label: d }))} placeholder="Выберите район" />
        </Form.Item>
        <Form.Item name="address" label="Яшаш манзили">
          <Input.TextArea rows={3} placeholder="Адрес" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Неверный email' }]}>
          <Input placeholder="name@domain.com" />
        </Form.Item>
      </Form>
    </Modal>
  );
} 