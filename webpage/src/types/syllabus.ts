export interface MeetingTime {
    day: string;
    start_time: string;
    end_time: string;
    location: string | null;
}

export interface Instructor {
    name: string | null;
    email: string | null;
    office_hours: string | null;
}

export interface ExamDate {
    type: string;
    date: string;
    time: string | null;
    location: string | null;
}

export interface Assignment {
    name: string;
    due_date: string;
    due_time: string | null;
    description: string | null;
}

export interface Project {
    name: string;
    due_date: string;
    due_time: string | null;
    description: string | null;
}

export interface GradeWeight {
    component: string;
    weight: number;
}

export interface ParsedSyllabus {
    class_name: string;
    instructor: Instructor;
    meeting_times: Record<string, MeetingTime[]>;
    exam_dates: ExamDate[];
    assignments: Assignment[];
    projects: Project[];
    grading_weights: GradeWeight[];
}
