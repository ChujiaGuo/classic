import { test, expect } from "@playwright/experimental-ct-react";
import SyllabusUpload from "@/components/syllabus/SyllabusUpload";
import type { ParsedSyllabus } from "@/types/syllabus";

const mockSyllabus: ParsedSyllabus = {
    class_name: "CMSC 426: Principles of Computer Security",
    instructor: { name: "Dr. Enis Golaszewski", email: "golaszewski@umbc.edu", office_hours: null },
    meeting_times: {
        "Section 01": [
            { day: "Tuesday", start_time: "1:00 PM", end_time: "2:15 PM", location: "Janet & Walter Sondheim 204" },
        ],
    },
    exam_dates: [],
    assignments: [{ name: "HW1", due_date: "February 5", due_time: null, description: null }],
    projects: [],
    grading_weights: [{ component: "Assignments (7)", weight: 0.4 }],
};

const pdfFile = {
    name: "syllabus.pdf",
    mimeType: "application/pdf" as const,
    buffer: Buffer.from("pdf content"),
};

test.describe("SyllabusUpload", () => {
    test.describe("upload form", () => {
        test("renders the upload form on initial load", async ({ mount }) => {
            const c = await mount(<SyllabusUpload />);
            await expect(c.getByText("Parse a syllabus")).toBeVisible();
            await expect(c.getByRole("button", { name: "Parse syllabus" })).toBeVisible();
        });

        test("disables the parse button when no file is selected", async ({ mount }) => {
            const c = await mount(<SyllabusUpload />);
            await expect(c.getByRole("button", { name: "Parse syllabus" })).toBeDisabled();
        });

        test("enables the parse button after a file is selected", async ({ mount }) => {
            const c = await mount(<SyllabusUpload />);
            await c.locator("input[type=file]").setInputFiles(pdfFile);
            await expect(c.getByRole("button", { name: "Parse syllabus" })).toBeEnabled();
        });
    });

    test.describe("successful parse", () => {
        test("shows SyllabusView after a successful parse", async ({ mount, page }) => {
            await page.route("**/api/parse", (route) =>
                route.fulfill({ contentType: "application/json", body: JSON.stringify(mockSyllabus) })
            );
            const c = await mount(<SyllabusUpload />);
            await c.locator("input[type=file]").setInputFiles(pdfFile);
            await c.getByRole("button", { name: "Parse syllabus" }).click();
            await expect(c.getByText("CMSC 426: Principles of Computer Security")).toBeVisible();
        });

        test("shows the Parse another button after a successful parse", async ({ mount, page }) => {
            await page.route("**/api/parse", (route) =>
                route.fulfill({ contentType: "application/json", body: JSON.stringify(mockSyllabus) })
            );
            const c = await mount(<SyllabusUpload />);
            await c.locator("input[type=file]").setInputFiles(pdfFile);
            await c.getByRole("button", { name: "Parse syllabus" }).click();
            await expect(c.getByRole("button", { name: "Parse another" })).toBeVisible();
        });

        test("returns to the upload form when Parse another is clicked", async ({ mount, page }) => {
            await page.route("**/api/parse", (route) =>
                route.fulfill({ contentType: "application/json", body: JSON.stringify(mockSyllabus) })
            );
            const c = await mount(<SyllabusUpload />);
            await c.locator("input[type=file]").setInputFiles(pdfFile);
            await c.getByRole("button", { name: "Parse syllabus" }).click();
            await expect(c.getByRole("button", { name: "Parse another" })).toBeVisible();
            await c.getByRole("button", { name: "Parse another" }).click();
            await expect(c.getByText("Parse a syllabus")).toBeVisible();
        });
    });

    test.describe("failed parse", () => {
        test("shows an error message when the server returns an error", async ({ mount, page }) => {
            await page.route("**/api/parse", (route) =>
                route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ error: "could not extract text from PDF" }),
                })
            );
            const c = await mount(<SyllabusUpload />);
            await c.locator("input[type=file]").setInputFiles(pdfFile);
            await c.getByRole("button", { name: "Parse syllabus" }).click();
            await expect(c.getByText("could not extract text from PDF")).toBeVisible();
        });

        test("shows an error message when fetch throws", async ({ mount, page }) => {
            await page.route("**/api/parse", (route) => route.abort());
            const c = await mount(<SyllabusUpload />);
            await c.locator("input[type=file]").setInputFiles(pdfFile);
            await c.getByRole("button", { name: "Parse syllabus" }).click();
            await expect(c.getByText("Request failed — is the gateway running?")).toBeVisible();
        });
    });
});
