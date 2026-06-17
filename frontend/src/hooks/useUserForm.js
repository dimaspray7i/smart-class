import { useState } from 'react';

export function useUserForm(roles = []) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'siswa',
    is_active: true,
    class_id: '',
    subjects: [],
  });
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'siswa',
      is_active: true,
      class_id: '',
      subjects: [],
    });
    setErrors({});
  };

  const setFormWithUser = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active !== false,
      class_id: user.class_id || '',
      subjects: user.profile?.subjects?.map(s => s.id) || [],
    });
    setErrors({});
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    resetForm,
    setFormWithUser,
  };
}
