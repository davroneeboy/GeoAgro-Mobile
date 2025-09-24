import React, { useEffect } from 'react';
import { Form, Input, Modal } from 'antd';

export default function FruitFormModal({ open, onCancel, onSubmit, initialValues }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues || { name: '' });
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit?.(values);
  };

  return (
    <Modal open={open} title={initialValues ? 'Редактировать фрукт' : 'Добавить фрукт'} onCancel={onCancel} onOk={handleOk} okText="Сохранить">
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Название фрукта" rules={[{ required: true, message: 'Укажите название' }]}>
          <Input placeholder="Манго" />
        </Form.Item>
      </Form>
    </Modal>
  );
} 