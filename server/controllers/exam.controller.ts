import { NextFunction, type Request, type Response } from "express";
import { logActivity } from "../utils/activitiesLog";
import Exam from "../models/Exam";
import Subject from "../models/Subject";
import Submission from "../models/Submission";
import { inngest } from "../inngest";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";

// @desc    Trigger AI Exam Generation
// @route   POST /api/exams/generate
export const triggerExamGeneration = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      title,
      subject,
      class: classId,
      duration,
      dueDate,
      topic,
      difficulty,
      count,
    } = req.body;
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) return next(new ErrorHandler("Subject not found", 400));

    const teacherId = req.user?._id;
    const draftExam = await Exam.create({
      title: title || `Auto-Generated: ${topic}`,
      subject,
      class: classId,
      teacher: teacherId,
      duration: duration || 60,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
      isActive: false, // Draft mode
      questions: [], // Empty for now, Inngest will fill this
    });

    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `User triggered exam generation: ${draftExam._id}`,
      });
    }

    await inngest.send({
      name: "exam/generate",
      data: {
        examId: draftExam._id,
        topic,
        subjectName: subjectDoc.name,
        difficulty: difficulty || "Medium",
        count: count || 10,
      },
    });
    res.status(202).json({
      Success: true,
      message: "Exam generation started.",
      examId: draftExam._id,
    });
  },
);

// @desc    Create/Publish Exam we won't use it
// @route   POST /api/exams
export const createExam = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const exam = await Exam.create({
      ...req.body,
      teacher: req.user?._id,
    });

    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "User created a new exam",
      });
    }

    res
      .status(201)
      .json({ success: true, message: "Exam Created Successfully" });
  },
);

// @desc    Get Exams (Student sees available, Teacher sees created)
// @route   GET /api/exams
export const getExams = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    let query = {};

    if (user?.role === "student") {
      // Students see exams for their class only
      query = { class: user.studentClass, isActive: true };
    } else if (user?.role === "teacher") {
      // Teachers see exams they created
      query = { teacher: user?._id };
    }

    const exams = await Exam.find(query)
      .populate("subject", "name")
      .populate("class", "name section")
      .select("-questions.correctAnswer"); // Hide answers!

    res.json({ success: true, exams });
  },
);

// @desc    Get exam by id
// @route   POST /api/exams/:id
export const getExamById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const examId = req.params.id;
    const user = req.user;

    // 1. Initialize the query
    let query = Exam.findById(examId)
      .populate("subject", "name code")
      .populate("class", "name section")
      .populate("teacher", "name email");

    // 2. Conditional Logic: Reveal answers for Teachers/Admins
    // The '+' syntax forces selection of fields marked as { select: false } in Schema
    if (user?.role === "teacher" || user?.role === "admin") {
      // @ts-ignore
      query = query.select("+questions.correctAnswer");
    }

    // 3. Execute Query
    const exam = await query;

    // 4. Handle Not Found
    if (!exam) {
      return next(new ErrorHandler("Exam not found", 400));
    }

    // 5. Security Check (Optional but recommended)
    // Ensure student belongs to the class this exam is assigned to
    if (user?.role === "student") {
      // Assuming user.studentClass is a string or ObjectId
      // We compare it with the exam.class._id (which might be populated or an ID)
      const examClassId = exam.class._id
        ? exam.class._id.toString()
        : exam.class.toString();
      const userClassId = user.studentClass ? user.studentClass.toString() : "";

      if (examClassId !== userClassId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to view this exam." });
      }
    }

    res.status(200).json(exam);
  },
);

// @desc    Toggle Exam Status (Active/Inactive)
// @route   PATCH /api/exams/:id/status
// @access  Private (Teacher/Admin)
export const toggleExamStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const examId = req.params.id;
    const user = req.user;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    // Security Check: Ensure the user owns the exam (if not Admin)
    if (
      user?.role !== "admin" &&
      exam.teacher.toString() !== user?._id.toString()
    ) {
      return next(new ErrorHandler("Not authorized to modify this exam", 403));
    }

    // Toggle the status
    exam.isActive = !exam.isActive;
    await exam.save();

    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "User toggled exam status",
      });
    }

    res.json({
      success: true,
      message: `Exam is now ${exam.isActive ? "Active" : "Inactive"}`,
      _id: exam._id,
      isActive: exam.isActive,
    });
  },
);

// @desc    Submit & Auto-Grade Exam let these happen inside inngest
// @route   POST /api/exams/:id/submit
export const submitExam = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { answers } = req.body;
    const studentId = req.user?._id;
    const examId = req.params.id;

    // Trigger Inngest function to handle submission
    await inngest.send({
      name: "exam/submit",
      data: {
        examId,
        studentId,
        answers,
      },
    });

    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "User submitted an exam",
      });
    }

    res.status(201).json({
      success: true,
      message: "Exam submission received and is being processed.",
    });
  },
);

// @desc    Get Exam Results (For Student)
// @route   GET /api/exams/:id/result
export const getExamResult = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const studentId = req.user?._id;
    const examId = req.params.id;

    const submission = await Submission.findOne({
      exam: examId,
      student: studentId,
    }).populate({
      path: "exam",
      select: "title questions._id questions.correctAnswer", // <--- FORCE SELECT correct answers
    });
    if (!submission) {
      return next(new ErrorHandler("No submission found", 404));
    }

    res.json({ success: true, submission });
  },
);
