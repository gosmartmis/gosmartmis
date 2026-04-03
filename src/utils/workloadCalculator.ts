// Pure computation utilities — no mock imports, no DB calls.
// Data is fetched by useTeacherWorkload hook and passed in here.

export interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  classesAssigned: string[];
  subjectsTaught: string[];
  totalPeriodsPerWeek: number;
  totalHoursPerWeek: number;
  workloadLevel: 'low' | 'normal' | 'high' | 'overloaded';
  details: {
    className: string;
    subject: string;
    periodsPerWeek: number;
  }[];
}

export interface WorkloadSummaryResult {
  totalTeachers: number;
  overloadedCount: number;
  highWorkloadCount: number;
  normalWorkloadCount: number;
  lowWorkloadCount: number;
  averageHours: number;
  maxWorkload: TeacherWorkload | null;
  minWorkload: TeacherWorkload | null;
}

const PERIOD_DURATION_MINUTES = 40;
const NORMAL_WORKLOAD_HOURS = 20;
const HIGH_WORKLOAD_HOURS = 25;
const OVERLOAD_THRESHOLD_HOURS = 30;

export interface TimetableRowInput {
  teacher_id: string;
  class_id: string;
  subject_id: string | null;
  teacher_name: string;
  class_name: string;
  subject_name: string;
}

export function computeTeacherWorkloads(
  teachers: { id: string; name: string }[],
  entries: TimetableRowInput[]
): TeacherWorkload[] {
  return teachers
    .map((teacher) => {
      const teacherEntries = entries.filter((e) => e.teacher_id === teacher.id);

      const workloadDetails: { className: string; subject: string; periodsPerWeek: number }[] = [];
      const classesSet = new Set<string>();
      const subjectsSet = new Set<string>();

      teacherEntries.forEach((entry) => {
        classesSet.add(entry.class_name);
        subjectsSet.add(entry.subject_name);

        const existing = workloadDetails.find(
          (d) => d.className === entry.class_name && d.subject === entry.subject_name
        );
        if (existing) {
          existing.periodsPerWeek += 1;
        } else {
          workloadDetails.push({
            className: entry.class_name,
            subject: entry.subject_name,
            periodsPerWeek: 1,
          });
        }
      });

      const totalPeriods = teacherEntries.length;
      const totalHours = parseFloat(
        ((totalPeriods * PERIOD_DURATION_MINUTES) / 60).toFixed(1)
      );

      let workloadLevel: TeacherWorkload['workloadLevel'];
      if (totalHours >= OVERLOAD_THRESHOLD_HOURS) {
        workloadLevel = 'overloaded';
      } else if (totalHours >= HIGH_WORKLOAD_HOURS) {
        workloadLevel = 'high';
      } else if (totalHours >= NORMAL_WORKLOAD_HOURS) {
        workloadLevel = 'normal';
      } else {
        workloadLevel = 'low';
      }

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        classesAssigned: Array.from(classesSet).sort(),
        subjectsTaught: Array.from(subjectsSet).sort(),
        totalPeriodsPerWeek: totalPeriods,
        totalHoursPerWeek: totalHours,
        workloadLevel,
        details: workloadDetails.sort(
          (a, b) =>
            a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject)
        ),
      };
    })
    .sort((a, b) => b.totalHoursPerWeek - a.totalHoursPerWeek);
}

export function computeWorkloadSummary(workloads: TeacherWorkload[]): WorkloadSummaryResult {
  const totalTeachers = workloads.length;
  const overloadedCount = workloads.filter((w) => w.workloadLevel === 'overloaded').length;
  const highWorkloadCount = workloads.filter((w) => w.workloadLevel === 'high').length;
  const normalWorkloadCount = workloads.filter((w) => w.workloadLevel === 'normal').length;
  const lowWorkloadCount = workloads.filter((w) => w.workloadLevel === 'low').length;

  const totalHours = workloads.reduce((sum, w) => sum + w.totalHoursPerWeek, 0);
  const averageHours = parseFloat(
    (totalTeachers > 0 ? totalHours / totalTeachers : 0).toFixed(1)
  );

  return {
    totalTeachers,
    overloadedCount,
    highWorkloadCount,
    normalWorkloadCount,
    lowWorkloadCount,
    averageHours,
    maxWorkload: workloads.length > 0 ? workloads[0] : null,
    minWorkload: workloads.length > 0 ? workloads[workloads.length - 1] : null,
  };
}
