import { useState } from 'react';

export function useClassForm() {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: 'X',
    major: '',
    capacity: '',
    status: 'active',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      level: 'X',
      major: '',
      capacity: '',
      status: 'active',
      description: '',
    });
    setErrors({});
  };

  const setFormWithClass = (cls) => {
    setFormData({
      name: cls.name,
      code: cls.code,
      level: cls.level,
      major: cls.major || '',
      capacity: cls.capacity || '',
      status: cls.status || 'active',
      description: cls.description || '',
    });
    setErrors({});
  };

  return { formData, setFormData, errors, setErrors, resetForm, setFormWithClass };
}
