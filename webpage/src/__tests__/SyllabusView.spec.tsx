import { test, expect } from "@playwright/experimental-ct-react";
import SyllabusView from "@/components/syllabus/SyllabusView";
import type { ParsedSyllabus } from "@/types/syllabus";

const sample: ParsedSyllabus = {
    class_name: "CMSC 426: Principles of Computer Security",
    instructor: {
        name: "Dr. Enis Golaszewski",
        email: "golaszewski@umbc.edu",
        office_hours:
            "Wednesday 4:00-5:00pm in ITE373; Thursday 4:00-5:00pm in ITE373; Remotely (webex) by appointment",
    },
    meeting_times: {
        "Section 01": [
            { day: "Tuesday",  start_time: "1:00 PM", end_time: "2:15 PM", location: "Janet & Walter Sondheim 204" },
            { day: "Thursday", start_time: "1:00 PM", end_time: "2:15 PM", location: "Janet & Walter Sondheim 204" },
        ],
        "Section 02": [
            { day: "Tuesday",  start_time: "2:30 PM", end_time: "3:45 PM", location: "Performing Arts & Humanities 108" },
            { day: "Thursday", start_time: "2:30 PM", end_time: "3:45 PM", location: "Performing Arts & Humanities 108" },
        ],
    },
    exam_dates: [
        { type: "EXAM 1", date: "2026-03-13", time: null, location: null },
        { type: "EXAM 2", date: "2026-04-23", time: null, location: null },
        {
            type: "Final Exam (Comprehensive)",
            date: "May 14 for Section 3; May 19 for Section 2",
            time: "1:00-3:00pm",
            location: null,
        },
    ],
    assignments: [
        { name: "HW1", due_date: "February 5",  due_time: null, description: "Symmetric Encryption & Asymmetric Encryption" },
        { name: "HW2", due_date: "February 19", due_time: null, description: "Key Exchange and RNG Cryptanalysis" },
        { name: "HW3", due_date: "March 5",     due_time: null, description: "Command Injection" },
        { name: "HW4", due_date: "March 26",    due_time: null, description: "Stack Buffer Overflow" },
        { name: "HW5", due_date: "April 9",     due_time: null, description: "Incident Response" },
        { name: "HW6", due_date: "April 23",    due_time: null, description: "Web-based Exploitation" },
        { name: "HW7", due_date: "May 7",       due_time: null, description: "Security of GenAI" },
    ],
    projects: [],
    grading_weights: [
        { component: "Assignments (7)",        weight: 0.4 },
        { component: "In-class Exercises (2)", weight: 0.1 },
        { component: "Mid-term Exams (2)",     weight: 0.3 },
        { component: "Final Exam (1)",         weight: 0.2 },
    ],
};

test.describe("SyllabusView", () => {
    test.describe("course header", () => {
        test("renders the course name", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("CMSC 426: Principles of Computer Security")).toBeVisible();
        });

        test("renders instructor name", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText(/Dr\. Enis Golaszewski/)).toBeVisible();
        });

        test("renders instructor email as a mailto link", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByRole("link", { name: "golaszewski@umbc.edu" }))
                .toHaveAttribute("href", "mailto:golaszewski@umbc.edu");
        });

        test("renders office hours", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText(/Wednesday 4:00-5:00pm in ITE373/)).toBeVisible();
        });

        test("omits office hours line when null", async ({ mount }) => {
            const c = await mount(
                <SyllabusView
                    syllabus={{ ...sample, instructor: { ...sample.instructor, office_hours: null } }}
                    onReset={() => {}}
                />
            );
            await expect(c.getByText(/Office hours/)).toBeHidden();
        });
    });

    test.describe("schedule card", () => {
        test("renders both section headers", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("Section 01")).toBeVisible();
            await expect(c.getByText("Section 02")).toBeVisible();
        });

        test("renders meeting days", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("Tuesday").first()).toBeVisible();
            await expect(c.getByText("Thursday").first()).toBeVisible();
        });

        test("renders meeting time ranges", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("1:00 PM–2:15 PM").first()).toBeVisible();
            await expect(c.getByText("2:30 PM–3:45 PM").first()).toBeVisible();
        });

        test("renders locations", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("Janet & Walter Sondheim 204").first()).toBeVisible();
            await expect(c.getByText("Performing Arts & Humanities 108").first()).toBeVisible();
        });

        test("hides the schedule card when meeting_times is empty", async ({ mount }) => {
            const c = await mount(
                <SyllabusView syllabus={{ ...sample, meeting_times: {} }} onReset={() => {}} />
            );
            await expect(c.getByText("Schedule")).toBeHidden();
        });
    });

    test.describe("assignments card", () => {
        test("renders all 7 homework entries", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            for (let i = 1; i <= 7; i++) {
                await expect(c.getByText(`HW${i}`)).toBeVisible();
            }
        });

        test("renders assignment due dates", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("February 5")).toBeVisible();
            await expect(c.getByText("May 7")).toBeVisible();
        });

        test("hides the assignments card when array is empty", async ({ mount }) => {
            const c = await mount(
                <SyllabusView syllabus={{ ...sample, assignments: [] }} onReset={() => {}} />
            );
            // exact:true prevents matching "Assignments (7)" in the grading card
            await expect(c.getByText("Assignments", { exact: true })).toBeHidden();
        });
    });

    test.describe("exams card", () => {
        test("renders all exam names", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("EXAM 1")).toBeVisible();
            await expect(c.getByText("EXAM 2")).toBeVisible();
            await expect(c.getByText("Final Exam (Comprehensive)")).toBeVisible();
        });

        test("renders exam dates", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText(/2026-03-13/)).toBeVisible();
            await expect(c.getByText(/2026-04-23/)).toBeVisible();
        });

        test("appends exam time when present", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText(/1:00-3:00pm/)).toBeVisible();
        });
    });

    test.describe("projects card", () => {
        test("hides the projects card when projects is empty", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("Projects")).toBeHidden();
        });

        test("renders projects when present", async ({ mount }) => {
            const c = await mount(
                <SyllabusView
                    syllabus={{
                        ...sample,
                        projects: [{ name: "Final Project", due_date: "2026-12-10", due_time: null, description: null }],
                    }}
                    onReset={() => {}}
                />
            );
            await expect(c.getByText("Projects")).toBeVisible();
            await expect(c.getByText("Final Project")).toBeVisible();
        });
    });

    test.describe("grading card", () => {
        test("renders all grading components", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            await expect(c.getByText("Assignments (7)")).toBeVisible();
            await expect(c.getByText("In-class Exercises (2)")).toBeVisible();
            await expect(c.getByText("Mid-term Exams (2)")).toBeVisible();
            await expect(c.getByText("Final Exam (1)")).toBeVisible();
        });

        test("converts weights to percentages", async ({ mount }) => {
            const c = await mount(<SyllabusView syllabus={sample} onReset={() => {}} />);
            // exact:true avoids matching parent elements that also contain these substrings
            await expect(c.getByText("40%", { exact: true })).toBeVisible();
            await expect(c.getByText("10%", { exact: true })).toBeVisible();
            await expect(c.getByText("30%", { exact: true })).toBeVisible();
            await expect(c.getByText("20%", { exact: true })).toBeVisible();
        });
    });

    test.describe("reset button", () => {
        test("calls onReset when Parse another is clicked", async ({ mount }) => {
            let wasCalled = false;
            const c = await mount(
                <SyllabusView syllabus={sample} onReset={() => { wasCalled = true; }} />
            );
            await c.getByRole("button", { name: "Parse another" }).click();
            await expect.poll(() => wasCalled).toBe(true);
        });
    });
});
