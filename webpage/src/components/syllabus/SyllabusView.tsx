"use client";

import type { ReactNode } from "react";
import type { ParsedSyllabus, MeetingTime } from "@/types/syllabus";

export default function SyllabusView({
    syllabus,
    onReset,
}: {
    syllabus: ParsedSyllabus;
    onReset: () => void;
}) {
    const meetingSections = Object.entries(syllabus.meeting_times ?? {});

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Course header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-neutral-900 leading-tight">
                        {syllabus.class_name || "Untitled Course"}
                    </h2>
                    {syllabus.instructor.name && (
                        <p className="text-sm text-neutral-600">
                            {syllabus.instructor.name}
                            {syllabus.instructor.email && (
                                <>
                                    {" · "}
                                    <a
                                        href={`mailto:${syllabus.instructor.email}`}
                                        className="hover:underline"
                                    >
                                        {syllabus.instructor.email}
                                    </a>
                                </>
                            )}
                        </p>
                    )}
                    {syllabus.instructor.office_hours && (
                        <p className="text-xs text-neutral-400">
                            Office hours: {syllabus.instructor.office_hours}
                        </p>
                    )}
                </div>
                <button
                    onClick={onReset}
                    className="shrink-0 text-xs text-neutral-400 hover:text-neutral-700 border border-neutral-200 rounded-md px-3 py-1.5 transition-colors"
                >
                    Parse another
                </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {meetingSections.length > 0 && (
                    <Card title="Schedule">
                        {meetingSections.map(([section, times]) => (
                            <div key={section} className="mb-4 last:mb-0">
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                                    {section}
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {times.map((t: MeetingTime, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="w-24 font-medium text-neutral-700 shrink-0">{t.day}</span>
                                            <span className="text-neutral-500">{t.start_time}–{t.end_time}</span>
                                            {t.location && (
                                                <span className="text-neutral-400 text-xs ml-auto">{t.location}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </Card>
                )}

                {syllabus.assignments.length > 0 && (
                    <Card title="Assignments">
                        <ul className="flex flex-col divide-y divide-neutral-100">
                            {syllabus.assignments.map((a, i) => (
                                <li key={i} className="flex items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0 text-sm">
                                    <span className="text-neutral-700 flex-1">{a.name}</span>
                                    <span className="text-neutral-400 text-xs whitespace-nowrap shrink-0">
                                        {a.due_date}{a.due_time ? ` · ${a.due_time}` : ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {syllabus.exam_dates.length > 0 && (
                    <Card title="Exams">
                        <ul className="flex flex-col divide-y divide-neutral-100">
                            {syllabus.exam_dates.map((e, i) => (
                                <li key={i} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                                    <span className="text-sm font-medium text-neutral-700">{e.type}</span>
                                    <span className="text-xs text-neutral-400">
                                        {e.date}
                                        {e.time ? ` · ${e.time}` : ""}
                                        {e.location ? ` · ${e.location}` : ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {syllabus.projects.length > 0 && (
                    <Card title="Projects">
                        <ul className="flex flex-col divide-y divide-neutral-100">
                            {syllabus.projects.map((p, i) => (
                                <li key={i} className="flex items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0 text-sm">
                                    <span className="text-neutral-700 flex-1">{p.name}</span>
                                    <span className="text-neutral-400 text-xs whitespace-nowrap shrink-0">
                                        {p.due_date}{p.due_time ? ` · ${p.due_time}` : ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {syllabus.grading_weights.length > 0 && (
                    <Card title="Grading">
                        <ul className="flex flex-col gap-3">
                            {syllabus.grading_weights.map((g, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-700">{g.component}</span>
                                        <span className="text-neutral-400 text-xs">
                                            {(g.weight * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                                        <div
                                            className="h-full bg-neutral-400 rounded-full transition-all"
                                            style={{ width: `${g.weight * 100}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        </div>
    );
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border border-neutral-200 bg-white p-5 flex flex-col gap-3 ${className}`}>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{title}</h3>
            {children}
        </div>
    );
}
