import React, { useEffect } from 'react';
import { Form, Input, Modal, Select, Switch } from 'antd';

const roles = [
  { value: 0, label: 'Обычный' },
  { value: 1, label: 'Superuser' },
  { value: 2, label: 'Head of Region' },
  { value: 3, label: 'Только просмотр' },
];

export default function UserFormModal({ open, onCancel, onSubmit, initialValues }) {
  const [form] = Form.useForm();
  const isEdit = !!initialValues?.id;

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues || { username: '', email: '', first_name: '', last_name: '', role: undefined, district: undefined, is_active: true });
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      username: values.username,
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      user_role: values.role,
      district: values.district ? Number(values.district) : undefined,
      is_active: values.is_active,
      ...(isEdit ? {} : { password: values.password }),
    };
    onSubmit?.(payload);
  };

  return (
    <Modal open={open} title={isEdit ? 'Редактировать пользователя' : 'Добавить пользователя'} onCancel={onCancel} onOk={handleOk} okText="Сохранить">
      <Form form={form} layout="vertical">
        <Form.Item name="username" label="Логин" rules={[{ required: true, message: 'Укажите логин' }]}>
          <Input />
        </Form.Item>
        {!isEdit && (
          <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Укажите пароль' }]}>
            <Input.Password />
          </Form.Item>
        )}
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Неверный email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="first_name" label="Имя">
          <Input />
        </Form.Item>
        <Form.Item name="last_name" label="Фамилия">
          <Input />
        </Form.Item>
        <Form.Item name="role" label="Роль" rules={[{ required: true, message: 'Выберите роль' }]}>
          <Select options={roles} placeholder="Выберите роль" />
        </Form.Item>
        <Form.Item name="district" label="Район (ID)">
          <Input placeholder="Напр. 1" inputMode="numeric" />
        </Form.Item>
        <Form.Item name="is_active" label="Активен" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
} 