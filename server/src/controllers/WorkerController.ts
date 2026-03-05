import { Router } from "express";
import db from "../db";
import { Worker } from "../models/Worker";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CONFIG from "../config";

const router = Router();

/**
 * POST /api/worker/login
 * Public worker login route
 */
router.post("/login", async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number & password required",
      });
    }

    const workerRepo = db.getRepository(Worker);

    const worker = await workerRepo.findOne({
      where: { mobileNumber },
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const valid = await bcrypt.compare(password, worker.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Generate worker token
    const token = jwt.sign(
      { id: worker.id, role: "WORKER" },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      worker,
      token,
    });
  } catch (err) {
    console.error("Worker Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const workerRepo = db.getRepository(Worker);

    const workers = await workerRepo.find({
      select: ["id", "name", "mobileNumber"]
    });

    res.json({
      success: true,
      workers,
    });

  } catch (err) {
    console.error("Worker List Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


export default router;
