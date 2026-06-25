import type { ParsedSyllabus } from "@/types/syllabus";

function parseDate(dateStr: string): string | null {
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return `${m[1]}${m[2]}${m[3]}`;
}

function parseTime(timeStr: string): string | null {
    const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = m[2];
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}${min}00`;
}

function nextDay(ymd: string): string {
    const d = new Date(
        parseInt(ymd.slice(0, 4)),
        parseInt(ymd.slice(4, 6)) - 1,
        parseInt(ymd.slice(6, 8)) + 1
    );
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function addOneHour(ymd: string, hms: string): string {
    const d = new Date(
        parseInt(ymd.slice(0, 4)),
        parseInt(ymd.slice(4, 6)) - 1,
        parseInt(ymd.slice(6, 8)),
        parseInt(hms.slice(0, 2)) + 1,
        parseInt(hms.slice(2, 4))
    );
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
}

function escapeValue(s: string): string {
    return s
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

let uidCounter = 0;
function uid(): string {
    return `${Date.now()}-${++uidCounter}@classic`;
}

interface EventSpec {
    summary: string;
    dateStr: string;
    timeStr?: string | null;
    description?: string | null;
    location?: string | null;
}

function buildVEVENT(e: EventSpec): string[] {
    const ymd = parseDate(e.dateStr);
    if (!ymd) return [];

    const lines: string[] = [
        "BEGIN:VEVENT",
        `UID:${uid()}`,
        `SUMMARY:${escapeValue(e.summary)}`,
    ];

    const hms = e.timeStr ? parseTime(e.timeStr) : null;
    if (hms) {
        lines.push(`DTSTART:${ymd}T${hms}`);
        lines.push(`DTEND:${addOneHour(ymd, hms)}`);
    } else {
        lines.push(`DTSTART;VALUE=DATE:${ymd}`);
        lines.push(`DTEND;VALUE=DATE:${nextDay(ymd)}`);
    }

    if (e.description) lines.push(`DESCRIPTION:${escapeValue(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeValue(e.location)}`);

    lines.push("END:VEVENT");
    return lines;
}

export function generateICS(syllabus: ParsedSyllabus): string {
    const course = syllabus.class_name || "Course";

    const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Classic//Syllabus Parser//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ];

    if (syllabus.assignments.length > 0) {
        // Find the earliest parseable date across all events as a fallback for undated assignments
        const earliest = [
            ...syllabus.assignments.map(a => parseDate(a.due_date)),
            ...syllabus.exam_dates.map(e => parseDate(e.date)),
            ...syllabus.projects.map(p => parseDate(p.due_date)),
        ].filter((d): d is string => d !== null).sort()[0];

        const fallback = earliest
            ? `${earliest.slice(0, 4)}-${earliest.slice(4, 6)}-${earliest.slice(6, 8)}`
            : null;

        for (const a of syllabus.assignments) {
            const hasDatedDate = parseDate(a.due_date) !== null;
            lines.push(...buildVEVENT({
                summary: `${course} — ${a.name}`,
                dateStr: hasDatedDate ? a.due_date : (fallback ?? a.due_date),
                timeStr: hasDatedDate ? a.due_time : null,
                description: a.description,
            }));
        }
    }

    for (const e of syllabus.exam_dates) {
        lines.push(...buildVEVENT({
            summary: `${course} — ${e.type}`,
            dateStr: e.date,
            timeStr: e.time,
            location: e.location,
        }));
    }

    for (const p of syllabus.projects) {
        lines.push(...buildVEVENT({
            summary: `${course} — ${p.name}`,
            dateStr: p.due_date,
            timeStr: p.due_time,
            description: p.description,
        }));
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
}

export function downloadICS(syllabus: ParsedSyllabus): void {
    const content = generateICS(syllabus);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(syllabus.class_name || "syllabus").replace(/[/\\:*?"<>|]/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
