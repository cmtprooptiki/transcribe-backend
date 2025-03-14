import express from "express";
import cors from "cors";
import session from "express-session";
import db from "./config/Database.js";
import dotenv from "dotenv";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import bodyParser from "body-parser";
import Users from "./models/UserModel.js";

import multer from "multer";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

// Load environment variables
dotenv.config();

ffmpeg.setFfmpegPath(ffmpegPath.path);

const app = express();
const PORT = process.env.APP_PORT || 5000;
const SEGMENT_DURATION = 300; // 5 minutes (300 seconds)

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:8080" }));

// Session Setup
const sessionStore = SequelizeStore(session.Store);
const store = new sessionStore({ db: db });

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { secure: "auto" },
  })
);

(async () => {
  await db.sync();
  await Users.sequelize.sync();
})();

store.sync();

// File Upload Setup
const upload = multer({ dest: "uploads/" });

// Transcription Route
app.post("/transcribe", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("Uploaded File Details:", req.file);

  const originalExtension = getFileExtension(req.file.mimetype);
  const renamedFilePath = `${req.file.path}.${originalExtension}`;

  fs.renameSync(req.file.path, renamedFilePath);

  console.log("Renamed File Path:", renamedFilePath);

  try {
    const transcription = await segmentAndTranscribe(renamedFilePath);
    res.json({ text: transcription.trim() });
  } catch (error) {
    res.status(500).json({ error: "Error in transcription process" });
  }
});

// Function to get file extension from MIME type
function getFileExtension(mimeType) {
  const mimeMap = {
    "audio/flac": "flac",
    "audio/m4a": "m4a",
    "audio/mp3": "mp3",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mpga": "mpga",
    "audio/oga": "oga",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/webm": "webm",
  };
  return mimeMap[mimeType] || "mp3";
}

// Function to split audio into segments and transcribe
async function segmentAndTranscribe(filePath) {
  return new Promise((resolve, reject) => {
    const outputDir = "segments/";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const segmentPath = `${outputDir}segment_%03d.mp3`;

    ffmpeg(filePath)
      .outputOptions([
        "-f segment",
        `-segment_time ${SEGMENT_DURATION}`,
        "-c copy",
      ])
      .output(segmentPath)
      .on("end", async () => {
        console.log("Segmentation complete!");

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith(".mp3"));
        let fullTranscription = "";

        for (const file of files) {
          console.log("Transcribing:", file);
          const segmentTranscription = await transcribeSegment(`${outputDir}${file}`);
          fullTranscription += segmentTranscription + " ";
          fs.unlinkSync(`${outputDir}${file}`);
        }

        fs.unlinkSync(filePath);
        resolve(fullTranscription);
      })
      .on("error", (err) => {
        console.error("FFmpeg Error:", err);
        reject(err);
      })
      .run();
  });
}

// Function to transcribe a single segment
async function transcribeSegment(segmentPath) {
  try {
    console.log("Sending segment to Whisper:", segmentPath);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(segmentPath));
    formData.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Segment Transcription Complete:", response.data.text);
    return response.data.text;
  } catch (error) {
    console.error("Whisper API Error for Segment:", error.response?.data || error.message);
    return "[Error in segment transcription]";
  }
}

// Routes
app.use(UserRoute);
app.use(AuthRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
