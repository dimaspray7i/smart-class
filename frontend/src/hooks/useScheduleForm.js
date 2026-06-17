import { useState, useMemo, useCallback } from 'react';

export function useScheduleForm(teachers) {
  const [formData, setFormData] = useState({
    class_id: '', subject_id: '', teacher_id: '', day: 'senin',
    start_time: '07:00', end_time: '08:30', room: '', is_active: true
  });
  const [errors, setErrors] = useState({});

  const filteredTeachers = useMemo(() => {
    if (!formData.subject_id) return teachers;
    const targetSubjectId = Number(formData.subject_id);
    return teachers.filter(t => {
      const teacherSubjects = t.profile?.subjects || [];
      return teacherSubjects.some(s => s.id === targetSubjectId);
    });
  }, [teachers, formData.subject_id]);

  const resetForm = useCallback(() => {
    setFormData({
      class_id: '', subject_id: '', teacher_id: '', day: 'senin',
      start_time: '07:00', end_time: '08:30', room: '', is_active: true
    });
    setErrors({});
  }, []);

  const setFormWithSchedule = useCallback((schedule) => {
    setFormData({
      class_id: schedule.class_id,
      subject_id: schedule.subject_id,
      teacher_id: schedule.teacher_id,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room || '',
      is_active: schedule.is_active !== false
    });
    setErrors({});
  }, []);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    filteredTeachers,
    resetForm,
    setFormWithSchedule,
  };
}
