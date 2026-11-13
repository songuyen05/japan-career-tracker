import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
const router = Router();
const validCountries = ["US", "JP"];
const validWorkArrangements = [
    "Remote",
    "Hybrid",
    "On-site",
];
const validStatuses = [
    "Saved",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
];
// Require login for every route in this file.
router.use(requireAuth);
// GET ALL APPLICATIONS
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`SELECT *
       FROM applications
       WHERE user_id = $1
       ORDER BY created_at DESC`, [req.session.userId]);
        return res.json({
            applications: result.rows,
        });
    }
    catch (error) {
        console.error("Fetch applications error:", error);
        return res.status(500).json({
            message: "Unable to retrieve applications.",
        });
    }
});
// CREATE APPLICATION
router.post("/", async (req, res) => {
    try {
        const { company, position, location, salary_min, salary_max, salary_currency, job_url, status, deadline, applied_at, notes, country, work_arrangement, } = req.body;
        if (typeof company !== "string" ||
            !company.trim() ||
            typeof position !== "string" ||
            !position.trim()) {
            return res.status(400).json({
                message: "Company and position are required.",
            });
        }
        const applicationStatus = status ?? "Saved";
        if (!validStatuses.includes(applicationStatus)) {
            return res.status(400).json({
                message: "Invalid application status.",
            });
        }
        const applicationCountry = country ?? "US";
        if (!validCountries.includes(applicationCountry)) {
            return res.status(400).json({
                message: "Country must be US or JP.",
            });
        }
        if (work_arrangement != null &&
            !validWorkArrangements.includes(work_arrangement)) {
            return res.status(400).json({
                message: "Invalid work arrangement.",
            });
        }
        const result = await pool.query(`INSERT INTO applications (
        user_id, company, position, location,
        country, work_arrangement,
        salary_min, salary_max, salary_currency,
        job_url, status, deadline, applied_at, notes
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *`, [
            req.session.userId,
            company.trim(),
            position.trim(),
            location ?? null,
            applicationCountry,
            work_arrangement ?? null,
            salary_min ?? null,
            salary_max ?? null,
            salary_currency ?? (applicationCountry === "JP" ? "JPY" : "USD"),
            job_url ?? null,
            applicationStatus,
            deadline ?? null,
            applied_at ?? null,
            notes ?? null,
        ]);
        return res.status(201).json({
            message: "Application created successfully.",
            application: result.rows[0],
        });
    }
    catch (error) {
        console.error("Create application error:", error);
        return res.status(500).json({
            message: "Unable to create application.",
        });
    }
});
// GET ONE APPLICATION
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(`SELECT *
       FROM applications
       WHERE id = $1 AND user_id = $2`, [req.params.id, req.session.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Application not found.",
            });
        }
        return res.json({
            application: result.rows[0],
        });
    }
    catch (error) {
        console.error("Fetch application error:", error);
        return res.status(500).json({
            message: "Unable to retrieve application.",
        });
    }
});
// UPDATE APPLICATION
router.put("/:id", async (req, res) => {
    try {
        const { company, position, location, salary_min, salary_max, salary_currency, job_url, status, deadline, applied_at, notes, country, work_arrangement, } = req.body;
        if ((company !== undefined &&
            (typeof company !== "string" || !company.trim())) ||
            (position !== undefined &&
                (typeof position !== "string" || !position.trim()))) {
            return res.status(400).json({
                message: "Company and position cannot be empty.",
            });
        }
        if (status !== undefined &&
            (typeof status !== "string" || !validStatuses.includes(status))) {
            return res.status(400).json({
                message: "Invalid application status.",
            });
        }
        if (country !== undefined &&
            !validCountries.includes(country)) {
            return res.status(400).json({
                message: "Country must be US or JP.",
            });
        }
        if (work_arrangement !== undefined &&
            work_arrangement !== null &&
            !validWorkArrangements.includes(work_arrangement)) {
            return res.status(400).json({
                message: "Invalid work arrangement.",
            });
        }
        const result = await pool.query(`UPDATE applications SET
        company = COALESCE($1, company),
        position = COALESCE($2, position),
        location = COALESCE($3, location),
        country = COALESCE($4, country),
        work_arrangement = CASE
          WHEN $5::boolean THEN $6
          ELSE work_arrangement
        END,
        salary_min = COALESCE($7, salary_min),
        salary_max = COALESCE($8, salary_max),
        salary_currency = COALESCE($9, salary_currency),
        job_url = COALESCE($10, job_url),
        status = COALESCE($11, status),
        deadline = COALESCE($12, deadline),
        applied_at = COALESCE($13, applied_at),
        notes = COALESCE($14, notes),
        updated_at = NOW()
      WHERE id = $15 AND user_id = $16
      RETURNING *`, [
            company?.trim(),
            position?.trim(),
            location,
            country,
            work_arrangement !== undefined,
            work_arrangement ?? null,
            salary_min,
            salary_max,
            salary_currency,
            job_url,
            status,
            deadline,
            applied_at,
            notes,
            req.params.id,
            req.session.userId,
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Application not found.",
            });
        }
        return res.json({
            message: "Application updated successfully.",
            application: result.rows[0],
        });
    }
    catch (error) {
        console.error("Update application error:", error);
        return res.status(500).json({
            message: "Unable to update application.",
        });
    }
});
// DELETE APPLICATION
router.delete("/:id", async (req, res) => {
    try {
        const result = await pool.query(`DELETE FROM applications
       WHERE id = $1 AND user_id = $2
       RETURNING id`, [req.params.id, req.session.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Application not found.",
            });
        }
        return res.json({
            message: "Application deleted successfully.",
        });
    }
    catch (error) {
        console.error("Delete application error:", error);
        return res.status(500).json({
            message: "Unable to delete application.",
        });
    }
});
export default router;
