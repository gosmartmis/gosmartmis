import type { 
  ClassTimetable, 
  TeacherAssignment, 
  TimetableConfig, 
  Period, 
  DaySchedule,
  TimetableConflict 
} from '../types/timetable';

export class TimetableGenerator {
  private config: TimetableConfig;
  private assignments: TeacherAssignment[];
  private timetables: Map<string, ClassTimetable>;
  private teacherSchedule: Map<string, Map<string, Set<number>>>;

  constructor(config: TimetableConfig, assignments: TeacherAssignment[]) {
    this.config = config;
    this.assignments = assignments;
    this.timetables = new Map();
    this.teacherSchedule = new Map();
  }

  /**
   * Generate timetables for all classes
   */
  generateTimetables(classIds: string[]): ClassTimetable[] {
    this.initializeSchedules(classIds);
    
    // Sort assignments by periods per week (descending) to place harder-to-schedule subjects first
    const sortedAssignments = [...this.assignments].sort(
      (a, b) => b.periodsPerWeek - a.periodsPerWeek
    );

    // Assign subjects to timetables
    for (const assignment of sortedAssignments) {
      this.assignSubjectToClasses(assignment);
    }

    // Add breaks
    this.addBreaks();

    return Array.from(this.timetables.values());
  }

  /**
   * Initialize empty schedules for all classes
   */
  private initializeSchedules(classIds: string[]): void {
    for (const classId of classIds) {
      const schedule: DaySchedule[] = this.config.schoolDays.map(day => ({
        day,
        periods: Array.from({ length: this.config.periodsPerDay }, (_, i) => ({
          periodNumber: i + 1,
          startTime: this.calculatePeriodTime(i + 1),
          endTime: this.calculatePeriodTime(i + 2)
        }))
      }));

      this.timetables.set(classId, {
        classId,
        className: classId,
        schedule,
        status: 'draft'
      });
    }
  }

  /**
   * Calculate period start/end time
   */
  private calculatePeriodTime(periodNumber: number): string {
    const [hours, minutes] = this.config.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (periodNumber - 1) * this.config.periodDuration;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Assign a subject to all its classes
   */
  private assignSubjectToClasses(assignment: TeacherAssignment): void {
    for (const classId of assignment.classIds) {
      this.assignSubjectToClass(classId, assignment);
    }
  }

  /**
   * Assign a subject to a specific class
   */
  private assignSubjectToClass(classId: string, assignment: TeacherAssignment): void {
    const timetable = this.timetables.get(classId);
    if (!timetable) return;

    let assignedPeriods = 0;
    const targetPeriods = assignment.periodsPerWeek;

    // Try to distribute periods across different days
    for (const daySchedule of timetable.schedule) {
      if (assignedPeriods >= targetPeriods) break;

      // Try to assign one period per day first
      const availablePeriod = this.findAvailablePeriod(
        classId,
        daySchedule.day,
        assignment.teacherId
      );

      if (availablePeriod !== null) {
        this.assignPeriod(
          classId,
          daySchedule.day,
          availablePeriod,
          assignment
        );
        assignedPeriods++;
      }
    }

    // If we still need more periods, try to add second periods to days
    if (assignedPeriods < targetPeriods) {
      for (const daySchedule of timetable.schedule) {
        if (assignedPeriods >= targetPeriods) break;

        const availablePeriod = this.findAvailablePeriod(
          classId,
          daySchedule.day,
          assignment.teacherId
        );

        if (availablePeriod !== null) {
          this.assignPeriod(
            classId,
            daySchedule.day,
            availablePeriod,
            assignment
          );
          assignedPeriods++;
        }
      }
    }
  }

  /**
   * Find an available period for a class on a specific day
   */
  private findAvailablePeriod(
    classId: string,
    day: string,
    teacherId: string
  ): number | null {
    const timetable = this.timetables.get(classId);
    if (!timetable) return null;

    const daySchedule = timetable.schedule.find(d => d.day === day);
    if (!daySchedule) return null;

    for (const period of daySchedule.periods) {
      // Skip break periods
      if (this.config.breakPeriods.includes(period.periodNumber)) continue;

      // Check if period is empty
      if (period.subject) continue;

      // Check if teacher is available
      if (this.isTeacherBusy(teacherId, day, period.periodNumber)) continue;

      return period.periodNumber;
    }

    return null;
  }

  /**
   * Check if teacher is busy at a specific time
   */
  private isTeacherBusy(teacherId: string, day: string, periodNumber: number): boolean {
    const schedule = this.teacherSchedule.get(teacherId);
    if (!schedule) return false;

    const daySchedule = schedule.get(day);
    if (!daySchedule) return false;

    return daySchedule.has(periodNumber);
  }

  /**
   * Assign a period to a class
   */
  private assignPeriod(
    classId: string,
    day: string,
    periodNumber: number,
    assignment: TeacherAssignment
  ): void {
    const timetable = this.timetables.get(classId);
    if (!timetable) return;

    const daySchedule = timetable.schedule.find(d => d.day === day);
    if (!daySchedule) return;

    const period = daySchedule.periods.find(p => p.periodNumber === periodNumber);
    if (!period) return;

    // Assign subject to period
    period.subject = assignment.subjectName;
    period.teacher = assignment.teacherName;
    period.teacherId = assignment.teacherId;

    // Mark teacher as busy
    if (!this.teacherSchedule.has(assignment.teacherId)) {
      this.teacherSchedule.set(assignment.teacherId, new Map());
    }

    const teacherDaySchedule = this.teacherSchedule.get(assignment.teacherId)!;
    if (!teacherDaySchedule.has(day)) {
      teacherDaySchedule.set(day, new Set());
    }

    teacherDaySchedule.get(day)!.add(periodNumber);
  }

  /**
   * Add breaks to all timetables
   */
  private addBreaks(): void {
    for (const timetable of this.timetables.values()) {
      for (const daySchedule of timetable.schedule) {
        for (const period of daySchedule.periods) {
          if (this.config.breakPeriods.includes(period.periodNumber)) {
            period.isBreak = true;
            period.subject = 'Break';
          }
        }
      }
    }
  }

  /**
   * Validate timetable for conflicts
   */
  validateTimetable(timetable: ClassTimetable): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];

    for (const daySchedule of timetable.schedule) {
      for (const period of daySchedule.periods) {
        if (!period.teacherId || period.isBreak) continue;

        // Check if teacher is teaching another class at the same time
        const teacherConflict = this.checkTeacherConflict(
          period.teacherId,
          daySchedule.day,
          period.periodNumber,
          timetable.classId
        );

        if (teacherConflict) {
          conflicts.push(teacherConflict);
        }
      }
    }

    return conflicts;
  }

  /**
   * Check for teacher conflicts
   */
  private checkTeacherConflict(
    teacherId: string,
    day: string,
    periodNumber: number,
    currentClassId: string
  ): TimetableConflict | null {
    const affectedClasses: string[] = [];

    for (const [classId, timetable] of this.timetables.entries()) {
      if (classId === currentClassId) continue;

      const daySchedule = timetable.schedule.find(d => d.day === day);
      if (!daySchedule) continue;

      const period = daySchedule.periods.find(p => p.periodNumber === periodNumber);
      if (period && period.teacherId === teacherId) {
        affectedClasses.push(classId);
      }
    }

    if (affectedClasses.length > 0) {
      return {
        type: 'teacher',
        message: `Teacher conflict detected`,
        day,
        period: periodNumber,
        affectedClasses: [currentClassId, ...affectedClasses],
        affectedTeacher: teacherId
      };
    }

    return null;
  }

  /**
   * Calculate teacher workload
   */
  calculateTeacherWorkload(teacherId: string): number {
    const schedule = this.teacherSchedule.get(teacherId);
    if (!schedule) return 0;

    let totalPeriods = 0;
    for (const daySchedule of schedule.values()) {
      totalPeriods += daySchedule.size;
    }

    return totalPeriods;
  }
}