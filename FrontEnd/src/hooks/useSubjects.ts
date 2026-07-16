import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/axios';

export interface FptSubjectInfo {
  id: string;
  title: string;
  courseCode: string;
  semester: string;
  majors: string[];
}

export function normalizeSemester(sem: any): string {
  if (!sem) return 'GENERAL';
  const semStr = String(sem).trim();
  // Check if matches K followed by digits (e.g. K5, k5)
  const kMatch = semStr.match(/^K([0-9]+)$/i);
  if (kMatch) {
    return `K${kMatch[1]}`;
  }
  // Check if matches digits anywhere in the string (e.g. Semester 5, Học kỳ 5, 5)
  const digitMatch = semStr.match(/([0-9]+)/);
  if (digitMatch) {
    return `K${digitMatch[1]}`;
  }
  return semStr.toUpperCase();
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<FptSubjectInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<any[]>('/subjects');
      const mapped = response.data.map((s: any) => {
        const codeVal = s.code || s.subjectCode || s.id || '';
        const nameVal = s.name || s.subjectName || '';
        const semVal = s.semesterName || s.semester || s.semesterNo || s.term || '';
        
        let majorsArr: string[] = [];
        const majorsVal = s.majors || s.major || s.majorCode || '';
        if (Array.isArray(majorsVal)) {
          majorsArr = majorsVal.map((m: any) => String(m).trim().toUpperCase());
        } else if (typeof majorsVal === 'string') {
          majorsArr = majorsVal.split(',').map((m: string) => m.trim().toUpperCase());
        }

        return {
          id: codeVal,
          title: nameVal,
          courseCode: codeVal,
          semester: normalizeSemester(semVal),
          majors: majorsArr
        };
      });
      setSubjects(mapped);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, refreshSubjects: fetchSubjects };
}
