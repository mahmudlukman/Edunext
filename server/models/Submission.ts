import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  exam: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  answers: { questionId: string; answer: string }[];
  score: number;
  submittedAt: Date;
}

const SubmissionSchema = new Schema({
  exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  answers: [
    {
      questionId: String,
      answer: String,
    },
  ],
  score: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
});

// Prevent duplicate submissions
SubmissionSchema.index({ exam: 1, student: 1 }, { unique: true });

const Submission = mongoose.model<ISubmission>("Submission", SubmissionSchema);
export default Submission;
