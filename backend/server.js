const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
let JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Function to handle JWT rotation every 3 days
async function refreshJWTSecret() {
  try {
    const secretDoc = await Setting.findOne({ key: "jwt_rotation_secret" });
    const dateDoc = await Setting.findOne({ key: "jwt_rotation_last_date" });

    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    if (!secretDoc || !dateDoc || now - new Date(dateDoc.value) > threeDays) {
      const newSecret = crypto.randomBytes(64).toString("hex");

      await Setting.findOneAndUpdate(
        { key: "jwt_rotation_secret" },
        { value: newSecret },
        { upsert: true },
      );
      await Setting.findOneAndUpdate(
        { key: "jwt_rotation_last_date" },
        { value: now.toISOString() },
        { upsert: true },
      );

      JWT_SECRET = newSecret;
      console.log("🔄 JWT Secret has been rotated (valid for 3 days).");
    } else {
      JWT_SECRET = secretDoc.value;
    }
  } catch (err) {
    console.error("Error rotating JWT secret:", err);
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

// Auth Middlewares
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const authAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: "Admin access required" });
    }
  });
};

// Serve frontend static
app.use(express.static(path.join(__dirname, "../froentend")));

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "kalapapreeth17@gmail.com",
    pass: process.env.SMTP_PASS || "",
  },
  tls: { rejectUnauthorized: false },
});

// Email Template Helper
const renderEmailTemplate = (content, title = "Kalpapreeth IT Solutions") => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f9; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 35px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.7; }
        .footer { padding: 25px; text-align: center; font-size: 13px; color: #64748b; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        .otp-box { background: #f8fafc; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; border: 2px solid #e2e8f0; }
        .otp-code { font-size: 38px; font-weight: 800; color: #1e3a8a; letter-spacing: 6px; }
        .highlight { color: #3b82f6; font-weight: 600; }
        .status-badge { display: inline-block; padding: 6px 14px; background: #dcfce7; color: #16a34a; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Kalpapreeth IT Solutions. All rights reserved.<br>
          <span style="margin-top: 8px; display: block; color: #94a3b8;">Helping businesses scale with top 1% technology talent.</span>
        </div>
      </div>
    </body>
    </html>
  `;
};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("✗ MONGODB_URI is not defined in .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✓ Connected to MongoDB Atlas");
    // Initialize JWT secret rotation
    refreshJWTSecret();
    // Check for rotation every hour
    setInterval(refreshJWTSecret, 1000 * 60 * 60);
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message);
  });

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["client", "talent", "admin"],
    default: "client",
  },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  projectType: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const subscriberSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  timestamp: { type: Date, default: Date.now },
});

const hireSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientEmail: String,
  talentId: { type: mongoose.Schema.Types.ObjectId, ref: "Talent" },
  talentName: String,
  talentEmail: String,
  projectName: String,
  projectDescription: String,
  role: String,
  budget: String,
  duration: String,
  message: String,
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed"],
    default: "pending",
  },
  timestamp: { type: Date, default: Date.now },
});

const talentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  email: String,
  title: String,
  bio: String,
  avatar: String,
  skills: [String],
  hourlyRate: String,
  experience: String,
  portfolio: String,
  availability: {
    type: String,
    enum: ["Available", "Busy", "Not Available"],
    default: "Available",
  },
  rating: { type: Number, default: 0 },
  reviews: Number,
  completedProjects: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  liveUrl: String,
  image: String,
  category: String,
  status: { type: String, default: "active" },
  membersNeeded: { type: Number, default: 0 },
  scratchLink: String,
  marketingStatus: { type: String, default: "Not Started" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String,
});

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  purpose: { type: String, enum: ["signup", "login"], default: "signup" },
  tempData: mongoose.Schema.Types.Mixed,
  expiresAt: { type: Date, index: { expireAfterSeconds: 300 } },
});

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  department: String,
  location: String,
  jobType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Freelance"],
  },
  experience: String,
  salary: String,
  skills: [String],
  image: String,
  status: { type: String, enum: ["open", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const jobApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  jobTitle: String,
  candidateName: String,
  candidateEmail: String,
  candidatePhone: String,
  resume: String, // File path
  resumeOriginalName: String,
  enquiryNumber: String,
  portfolioLink: String,
  coverLetter: String,
  status: {
    type: String,
    enum: ["pending", "reviewed", "shortlisted", "rejected"],
    default: "pending",
  },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Enquiry schema to store contact form submissions and counts
const enquirySchema = new mongoose.Schema({
  enquiryNumber: String,
  name: String,
  email: String,
  phone: String,
  projectType: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Contact = mongoose.model("Contact", contactSchema);
const Subscriber = mongoose.model("Subscriber", subscriberSchema);
const Hire = mongoose.model("Hire", hireSchema);
const Talent = mongoose.model("Talent", talentSchema);
const Project = mongoose.model("Project", projectSchema);
const Setting = mongoose.model("Setting", settingSchema);
const OTP = mongoose.model("OTP", otpSchema);
const Job = mongoose.model("Job", jobSchema);
const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);
const Enquiry = mongoose.model("Enquiry", enquirySchema);

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, "../froentend/assets/uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Serve uploads statically
app.use("/assets/uploads", express.static(uploadsDir));
// Temporary debug: list recent enquiries (limit 20)
app.get("/api/debug/enquiries", async (req, res) => {
  try {
    const docs = await Enquiry.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json({ count: docs.length, docs });
  } catch (err) {
    console.error("debug enquiries error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ PAGE ROUTES ============
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/home/home.html")),
);
app.get("/home", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/home/home.html")),
);
app.get("/about", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/about/about.html")),
);
app.get("/blog", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/blog/blog.html")),
);
app.get("/contact", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/contact/contact.html")),
);
app.get("/hire", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/hire/hire.html")),
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/login/login.html")),
);
app.get("/service", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/service/services.html")),
);
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "../froentend/signup/signup.html")),
);
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../froentend/dashboard/dashboard.html"));
});

// ============ UPLOAD ENDPOINT ============
app.post("/api/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.files.file;
    const ext = path.extname(file.name);
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (!allowed.includes(ext.toLowerCase())) {
      return res.status(400).json({ error: "Only image files allowed" });
    }

    const filename =
      Date.now() + "-" + Math.random().toString(36).slice(2, 10) + ext;
    const dest = path.join(uploadsDir, filename);

    await new Promise((resolve, reject) => {
      file.mv(dest, (err) => (err ? reject(err) : resolve()));
    });

    const url = "/assets/uploads/" + filename;
    return res.json({ success: true, url });
  } catch (err) {
    console.error("Upload error", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============ AUTH ENDPOINTS ============

// Step 1: Send OTP for Signup
app.post("/api/auth/send-signup-otp", async (req, res) => {
  const { email, password, name, role, title, skills, experience, company } =
    req.body;

  if (!email || !password || !name || !role) {
    return res
      .status(400)
      .json({ error: "Email, name, password and role are required" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password before temporary storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store OTP
    await OTP.findOneAndUpdate(
      { email, purpose: "signup" },
      {
        email,
        otp,
        purpose: "signup",
        tempData: {
          name,
          password: hashedPassword,
          role,
          title,
          skills,
          experience,
          company,
        },
        expiresAt,
      },
      { upsert: true },
    );

    // Send OTP email
    const emailContent = `
      <h2 style="color: #1e3a8a; margin-top: 0;">Verify Your Email</h2>
      <p>Hello <span class="highlight">${name}</span>,</p>
      <p>Welcome to Kalpapreeth! To complete your registration and secure your account, please use the One-Time Password (OTP) below:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p>This code is valid for <span class="highlight">10 minutes</span>. For security reasons, please do not share this code with anyone.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER || "kalapapreeth17@gmail.com",
      to: email,
      subject: "Verify Your Email - Kalpapreeth",
      html: renderEmailTemplate(emailContent, "Welcome to Kalpapreeth"),
    });

    res.json({
      success: true,
      message: "OTP sent to your email. Valid for 10 minutes.",
    });
  } catch (err) {
    console.error("Send OTP error", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Step 2: Verify OTP and Complete Signup
app.post("/api/auth/verify-signup-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    // Find OTP record
    const otpRecord = await OTP.findOne({ email, purpose: "signup" });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ error: "No OTP request found. Please request OTP again." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res
        .status(400)
        .json({ error: "OTP expired. Please request a new one." });
    }

    // Create user with stored data
    const { name, password, role, title, skills, experience, company } =
      otpRecord.tempData;

    const newUser = await User.create({
      name,
      email,
      password,
      role: role || "client",
      isAdmin: false,
    });

    // If talent, create talent profile
    if (role === "talent") {
      await Talent.create({
        userId: newUser._id,
        name,
        email,
        title,
        skills: skills ? skills.split(",").map((s) => s.trim()) : [],
        experience,
        availability: "Available",
      });
    }

    // Delete OTP record
    await OTP.deleteOne({ email, purpose: "signup" });

    // Generate token
    const user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isAdmin: newUser.isAdmin,
    };
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      message: "Account created successfully!",
      token,
      user,
    });
  } catch (err) {
    console.error("Verify signup OTP error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Step 1: Send OTP for Login
app.post("/api/auth/send-login-otp", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check for admin credentials first
    const ADMIN_EMAIL = "admin@kalpapreeth.com";
    const ADMIN_PASSWORD = "Sheshi@8644";

    let userId = null;
    let isAdmin = false;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Admin login
      isAdmin = true;
      userId = "admin-" + Date.now(); // Use a unique admin ID
    } else {
      // Verify database credentials
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      userId = user._id;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await OTP.findOneAndUpdate(
      { email, purpose: "login" },
      {
        email,
        otp,
        purpose: "login",
        tempData: { userId, isAdmin },
        expiresAt,
      },
      { upsert: true },
    );

    // Send OTP email
    const emailContent = `
      <h2 style="color: #1e3a8a; margin-top: 0;">Login Verification</h2>
      <p>A login attempt was made for your account. Please use the following code to proceed:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p>This security code is valid for <span class="highlight">10 minutes</span>.</p>
      <p style="color: #64748b; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        If you didn't try to log in, we recommend securing your account immediately.
      </p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER || "kalapapreeth17@gmail.com",
      to: email,
      subject: "Your Login Security Code - Kalpapreeth",
      html: renderEmailTemplate(emailContent, "Security Verification"),
    });

    res.json({
      success: true,
      message: "OTP sent to your email. Valid for 10 minutes.",
    });
  } catch (err) {
    console.error("Send login OTP error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Step 2: Verify OTP and Complete Login
app.post("/api/auth/verify-login-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    // Find OTP record
    const otpRecord = await OTP.findOne({ email, purpose: "login" });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ error: "No OTP request found. Please login again." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res
        .status(400)
        .json({ error: "OTP expired. Please login again." });
    }

    // Check if admin login
    if (otpRecord.tempData.isAdmin) {
      // Admin login
      await OTP.deleteOne({ email, purpose: "login" });

      const token = jwt.sign(
        { id: "admin", email: email, isAdmin: true },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.json({
        success: true,
        message: "Login successful",
        token: token,
        user: {
          id: "admin",
          email: email,
          name: "Admin",
          isAdmin: true,
        },
      });
    }

    // Get user data from database
    const user = await User.findById(otpRecord.tempData.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Delete OTP record
    await OTP.deleteOne({ email, purpose: "login" });

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (err) {
    console.error("Verify login OTP error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Direct Login (Email + Password) - Requested by User
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check for admin credentials first
    const ADMIN_EMAIL = "admin@kalpapreeth.com";
    const ADMIN_PASSWORD = "Sheshi@8644";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: "admin", email: email, isAdmin: true },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.json({
        success: true,
        message: "Admin login successful",
        token,
        user: { id: "admin", name: "Admin", email, isAdmin: true },
      });
    }

    // Verify database credentials for regular users
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin || false },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (err) {
    console.error("Direct login error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ CONTACT ENDPOINT ============
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, projectType, message } = req.body;
  console.log("Contact POST body:", { name, email, phone, projectType });

  if (!name || !email || !projectType || !message) {
    return res
      .status(400)
      .json({ error: "All required fields must be filled" });
  }

  try {
    const contact = await Contact.create({
      name,
      email,
      phone: phone || "",
      projectType,
      message,
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
        to: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
        subject: "New Contact Form Submission",
        html: `<h2>New Contact: ${name}</h2><p>Email: ${email}</p><p>Phone: ${phone || "N/A"}</p><p>Type: ${projectType}</p><p>Message: ${message}</p>`,
      });
    } catch (e) {
      console.error("Email failed", e);
    }

    res.json({ success: true, message: "Thank you for your inquiry!" });
  } catch (err) {
    console.error("Contact error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ NEWSLETTER ENDPOINT ============
app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already subscribed" });
    }

    await Subscriber.create({ email });

    // Notify Admin
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
        to: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
        subject: "New Newsletter Subscriber",
        html: `<h2>New Subscriber Alert</h2><p>Email: <b>${email}</b></p>`,
      });
    } catch (e) {}

    // Thank You Email to User
    try {
      const thankYouContent = `
        <h2 style="color: #1e3a8a; margin-top: 0;">You're on the list!</h2>
        <p>Thank you for subscribing to the <span class="highlight">Kalpapreeth Insider</span> newsletter.</p>
        <p>You'll be the first to know about our latest project launches, technology trends, and exclusive insights from our world-class talent pool.</p>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #475569;">"Building the future of IT, one subscription at a time."</p>
        </div>
        <p>Stay tuned for some amazing content coming your way!</p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
        to: email,
        subject: "Welcome to Kalpapreeth Insider",
        html: renderEmailTemplate(thankYouContent, "Subscription Confirmed"),
      });
    } catch (e) {
      console.error("User thank you email failed", e);
    }

    res.json({ success: true, message: "Thank you for subscribing!" });
  } catch (err) {
    console.error("Newsletter error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ TALENT ENDPOINTS ============
// Get all available talents
app.get("/api/talents", async (req, res) => {
  try {
    const talents = await Talent.find({ availability: "Available" }).sort({
      rating: -1,
    });
    res.json(talents);
  } catch (err) {
    console.error("Error fetching talents:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single talent details
app.get("/api/talents/:id", async (req, res) => {
  try {
    const talent = await Talent.findById(req.params.id);
    if (!talent) return res.status(404).json({ error: "Talent not found" });
    res.json(talent);
  } catch (err) {
    console.error("Error fetching talent:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create talent (Admin only)
app.post("/api/talents", authAdmin, async (req, res) => {
  try {
    const talent = await Talent.create(req.body);
    res.json(talent);
  } catch (err) {
    console.error("Error creating talent:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update talent (Admin only)
app.patch("/api/talents/:id", authAdmin, async (req, res) => {
  try {
    const talent = await Talent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!talent) return res.status(404).json({ error: "Talent not found" });
    res.json(talent);
  } catch (err) {
    console.error("Error updating talent:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete talent (Admin only)
app.delete("/api/talents/:id", authAdmin, async (req, res) => {
  try {
    const talent = await Talent.findByIdAndDelete(req.params.id);
    if (!talent) return res.status(404).json({ error: "Talent not found" });
    res.json({ success: true, message: "Talent deleted" });
  } catch (err) {
    console.error("Error deleting talent:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ HIRE ENDPOINT ============
app.post("/api/hire", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const {
    talentId,
    talentName,
    talentEmail,
    projectName,
    projectDescription,
    role,
    budget,
    duration,
    message,
  } = req.body;

  if (!talentId || !projectName || !role) {
    return res
      .status(400)
      .json({ error: "Talent, project name and role are required" });
  }

  try {
    let clientEmail = req.body.clientEmail || "anonymous@client.com";
    let clientId = null;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      clientEmail = decoded.email;
      clientId = decoded.id;
    }

    // Verify talent exists
    const talent = await Talent.findById(talentId);
    if (!talent) return res.status(404).json({ error: "Talent not found" });

    const hire = await Hire.create({
      clientId,
      clientEmail,
      talentId,
      talentName: talent.name,
      talentEmail: talent.email,
      projectName,
      projectDescription,
      role,
      budget: budget || "",
      duration: duration || "",
      message: message || "",
    });

    // Send email to talent
    try {
      const talentContent = `
        <h2 style="color: #1e3a8a; margin-top: 0;">New Opportunity!</h2>
        <p>You have received a new professional hire request via your Kalpapreeth profile.</p>
        <div style="margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 15px; border-bottom: 1px solid #e2e8f0;">
            <span class="status-badge">New Request</span>
          </div>
          <div style="padding: 20px;">
            <p><strong>Project:</strong> <span class="highlight">${projectName}</span></p>
            <p><strong>Proposed Role:</strong> ${role}</p>
            <p><strong>Budget Range:</strong> ${budget || "TBD"}</p>
            <p><strong>Duration:</strong> ${duration || "TBD"}</p>
            <p style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0;">
              <strong>Client Note:</strong><br>
              <span style="font-style: italic; color: #475569;">"${message || "No additional message"}"</span>
            </p>
          </div>
        </div>
        <p>Please log in to your dashboard to review and respond to this request.</p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
        to: talent.email,
        subject: `New Collaboration Request: ${projectName}`,
        html: renderEmailTemplate(talentContent, "Gig Alert"),
      });
    } catch (e) {
      console.error("Email failed:", e);
    }

    res.json({
      success: true,
      message: "Hire request sent to talent!",
      hireId: hire._id,
    });
  } catch (err) {
    console.error("Hire error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's hire requests
app.get("/api/hire-requests", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const hires = await Hire.find({
      $or: [{ clientId: decoded.id }, { talentId: decoded.id }],
    }).sort({ timestamp: -1 });

    res.json(hires);
  } catch (err) {
    console.error("Error fetching hire requests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update hire request status
app.patch("/api/hire/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const hire = await Hire.findById(req.params.id);

    if (!hire) return res.status(404).json({ error: "Hire request not found" });

    // Only talent can accept/reject
    if (hire.talentEmail !== decoded.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    hire.status = req.body.status;
    await hire.save();

    res.json({
      success: true,
      message: `Hire request ${req.body.status}!`,
      hire,
    });
  } catch (err) {
    console.error("Error updating hire:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete hire request
app.delete("/api/hire/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const hire = await Hire.findById(req.params.id);

    if (!hire) return res.status(404).json({ error: "Hire request not found" });

    // Only client can delete
    if (hire.clientId.toString() !== decoded.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Hire.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Hire request cancelled" });
  } catch (err) {
    console.error("Error deleting hire:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ DASHBOARD DATA ENDPOINTS ============

// Admin Stats Endpoint
app.get("/api/admin/stats", authAdmin, async (req, res) => {
  try {
    const [counts, recentHires, recentContacts] = await Promise.all([
      Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Hire.countDocuments(),
        Contact.countDocuments(),
        Talent.countDocuments(),
      ]),
      Hire.find().sort({ _id: -1 }).limit(5).lean(),
      Contact.find().sort({ _id: -1 }).limit(5).lean(),
    ]);

    const [users, projects, hires, contacts, talents] = counts;

    res.json({
      success: true,
      stats: { users, projects, hires, contacts, talents },
      recent: { recentHires, recentContacts },
    });
  } catch (err) {
    console.error("Admin stats error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Client/User Dashboard Data Endpoint
app.get("/api/dashboard-data", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // User-specific data: their own hires and profile
    const [user, myHires, publicProjects] = await Promise.all([
      User.findById(decoded.id).select("-password").lean(),
      Hire.find({
        $or: [{ clientId: decoded.id }, { clientEmail: decoded.email }],
      })
        .sort({ _id: -1 })
        .lean(),
      Project.find({ status: "active" }).limit(10).lean(),
    ]);

    // If admin tokens hit this, they still see their own limited view or we can give more
    // but primarily this is for regular users.

    res.json({
      success: true,
      user,
      hires: myHires,
      projects: publicProjects,
      isClientView: true,
    });
  } catch (err) {
    console.error("Dashboard data error", err);
    res.status(401).json({ error: "Invalid token or session expired" });
  }
});

// ============ PROJECTS CRUD ============
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, projects });
  } catch (err) {
    console.error("projects error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/projects", authAdmin, async (req, res) => {
  const {
    title,
    description,
    liveUrl,
    image,
    category,
    membersNeeded,
    scratchLink,
    marketingStatus,
  } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });

  try {
    const project = await Project.create({
      title,
      description: description || "",
      liveUrl: liveUrl || "",
      image: image || "",
      category: category || "web",
      status: "active",
      membersNeeded: membersNeeded || 0,
      scratchLink: scratchLink || "",
      marketingStatus: marketingStatus || "Not Started",
    });
    res.json({ success: true, project });
  } catch (err) {
    console.error("insert project error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/projects/:id", authAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    liveUrl,
    image,
    category,
    status,
    membersNeeded,
    scratchLink,
    marketingStatus,
  } = req.body;

  try {
    const project = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        liveUrl,
        image,
        category,
        status,
        membersNeeded,
        scratchLink,
        marketingStatus,
        updatedAt: new Date(),
      },
      { new: true },
    ).lean();

    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ success: true, project });
  } catch (err) {
    console.error("update project error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/projects/:id", authAdmin, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.image && project.image.startsWith("/assets/uploads/")) {
      const imagePath = path.join(__dirname, "../froentend", project.image);
      try {
        fs.unlinkSync(imagePath);
      } catch (e) {
        console.warn("Could not delete image", e);
      }
    }

    res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    console.error("delete project error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ SETTINGS ============
app.get("/api/settings", async (req, res) => {
  try {
    const settingsDocs = await Setting.find({}).lean();
    const settings = {};
    settingsDocs.forEach((r) => (settings[r.key] = r.value));
    res.json({ success: true, settings });
  } catch (err) {
    console.error("settings error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/settings", authAdmin, async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "Key required" });

  try {
    await Setting.findOneAndUpdate(
      { key },
      { value: String(value) },
      { upsert: true },
    );
    res.json({ success: true });
  } catch (err) {
    console.error("settings error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ JOB POSTINGS ============
// Get all open jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" }).lean();
    res.json(jobs);
  } catch (err) {
    console.error("get jobs error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single job
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    console.error("get job error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create job (admin only)
app.post("/api/jobs", authAdmin, async (req, res) => {
  const {
    title,
    description,
    department,
    location,
    jobType,
    experience,
    salary,
    skills,
  } = req.body;

  if (!title || !description || !jobType) {
    return res
      .status(400)
      .json({ error: "Title, description, and job type are required" });
  }

  try {
    const newJob = await Job.create({
      title,
      description,
      department,
      location,
      jobType,
      experience,
      salary,
      skills: skills ? skills.split(",").map((s) => s.trim()) : [],
    });

    res.json({ success: true, job: newJob });
  } catch (err) {
    console.error("create job error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update job (admin only)
app.put("/api/jobs/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true },
    );

    if (!updatedJob) return res.status(404).json({ error: "Job not found" });

    res.json({ success: true, job: updatedJob });
  } catch (err) {
    console.error("update job error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete job (admin only)
app.delete("/api/jobs/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const deletedJob = await Job.findByIdAndDelete(req.params.id);
    if (!deletedJob) return res.status(404).json({ error: "Job not found" });

    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    console.error("delete job error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ JOB APPLICATIONS (ATS) ============
// Submit job application
app.post("/api/job-applications", async (req, res) => {
  const {
    jobId,
    candidateName,
    candidateEmail,
    candidatePhone,
    portfolioLink,
    coverLetter,
  } = req.body;

  if (!jobId || !candidateName || !candidateEmail) {
    return res
      .status(400)
      .json({ error: "Job ID, candidate name, and email are required" });
  }

  try {
    // If ALLOWED_HOSTS is set, ensure request originates from allowed host/referrer
    const allowedHosts = (process.env.ALLOWED_HOSTS || "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const hostHeader = req.get("host") || "";
    const referer = req.get("referer") || req.get("origin") || "";
    if (
      allowedHosts.length &&
      !allowedHosts.some((h) => hostHeader.includes(h) || referer.includes(h))
    ) {
      return res
        .status(403)
        .json({ error: "Submissions are only accepted from the website" });
    }

    // Generate an enquiry number for this application
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const enquiryNumber = `JOB-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Handle resume file upload
    let resumePath = null;
    let resumeOriginalName = null;
    let resumeFsPath = null;

    if (req.files && req.files.resume) {
      const resumeFile = req.files.resume;

      // Validate PDF only
      if (resumeFile.mimetype !== "application/pdf") {
        return res
          .status(400)
          .json({ error: "Only PDF files are allowed for resume" });
      }

      // Save resume file
      const uploadsDir = path.join(
        __dirname,
        "../froentend/assets/uploads/resumes",
      );
      fs.mkdirSync(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const fileName = `${timestamp}-${resumeFile.name}`;
      const filePath = path.join(uploadsDir, fileName);

      await resumeFile.mv(filePath);

      resumeFsPath = filePath;
      resumePath = `/assets/uploads/resumes/${fileName}`;
      resumeOriginalName = resumeFile.name;
    }

    // Create application
    const application = await JobApplication.create({
      jobId,
      jobTitle: job.title,
      candidateName,
      candidateEmail,
      candidatePhone,
      enquiryNumber,
      resume: resumePath,
      resumeOriginalName,
      portfolioLink,
      coverLetter,
    });

    const adminEmail =
      process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com";

    // Prepare attachments if resume was uploaded
    const attachments = resumeFsPath
      ? [
          {
            filename: resumeOriginalName,
            path: resumeFsPath,
          },
        ]
      : [];

    await transporter.sendMail({
      from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
      to: adminEmail,
      subject: `New Job Application [${enquiryNumber}]: ${job.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Job Application Received</h2>
          <p><strong>Enquiry Number:</strong> ${enquiryNumber}</p>
          <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <h3 style="margin-top: 0;">${job.title}</h3>
            <h4>Candidate Information</h4>
            <p><strong>Name:</strong> ${candidateName}</p>
            <p><strong>Email:</strong> ${candidateEmail}</p>
            <p><strong>Phone:</strong> ${candidatePhone || "Not provided"}</p>
            <h4>Application Details</h4>
            <p><strong>Portfolio:</strong> ${portfolioLink ? `<a href="${portfolioLink}">${portfolioLink}</a>` : "Not provided"}</p>
            <p><strong>Resume:</strong> ${resumeOriginalName ? resumeOriginalName : "Not provided"}</p>
            ${coverLetter ? `<h4>Cover Letter</h4><p>${coverLetter}</p>` : ""}
            <h4>Action Required</h4>
            <p>Login to the ATS dashboard to review and manage this application.</p>
          </div>
          <p style="color: #666; font-size: 12px;">This is an automated email from your ATS system.</p>
        </div>
      `,
      attachments,
    });

    // Also send confirmation email to candidate
    await transporter.sendMail({
      from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
      to: candidateEmail,
      subject: `Application Received - ${job.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for applying!</h2>
          <p>Dear ${candidateName},</p>
          
          <p>Your application for the position of <strong>${job.title}</strong> has been received successfully.</p>
          
          <p>We appreciate your interest in joining our team. Our hiring team will review your application and contact you soon if we'd like to move forward.</p>
          
          <p style="color: #666; margin-top: 2rem;">Best regards,<br>Kalpa Preeth Team</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Application submitted successfully",
      application,
    });
  } catch (err) {
    console.error("submit application error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all applications (admin)
app.get("/api/job-applications", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const applications = await JobApplication.find()
      .sort({ appliedAt: -1 })
      .lean();
    res.json(applications);
  } catch (err) {
    console.error("get applications error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Contact form submission - store enquiry and email admin
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, projectType, message } = req.body;

  if (!name || !email || !projectType || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const allowedHosts = (process.env.ALLOWED_HOSTS || "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const hostHeader = req.get("host") || "";
    const referer = req.get("referer") || req.get("origin") || "";
    if (
      allowedHosts.length &&
      !allowedHosts.some((h) => hostHeader.includes(h) || referer.includes(h))
    ) {
      return res
        .status(403)
        .json({ error: "Submissions are only accepted from the website" });
    }

    // generate enquiry number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const enquiryNumber = `ENQ-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    const doc = await Enquiry.create({
      enquiryNumber,
      name,
      email,
      phone,
      projectType,
      message,
    });
    console.log("New Enquiry created:", {
      id: doc._id?.toString(),
      enquiryNumber,
    });

    // send email to admin
    const adminEmail =
      process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com";
    await transporter.sendMail({
      from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
      to: adminEmail,
      subject: `New Enquiry [${enquiryNumber}] - ${projectType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Enquiry Received</h2>
          <p><strong>Enquiry Number:</strong> ${enquiryNumber}</p>
          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Project Type:</strong> ${projectType}</p>
            <h4>Message</h4>
            <p>${message}</p>
          </div>
          <p style="color:#666; font-size:12px;">This is an automated email from your website.</p>
        </div>
      `,
    });

    // confirmation email to user (optional)
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
        to: email,
        subject: `We received your enquiry [${enquiryNumber}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h3>Thank you, ${name}</h3>
            <p>We've received your enquiry. Your reference number is <strong>${enquiryNumber}</strong>. Our team will contact you within 24 hours.</p>
            <p>Regards,<br/>Kalpa Preeth Team</p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("Failed to send confirmation email to user", err);
    }

    res.json({ success: true, enquiryNumber, doc });
  } catch (err) {
    console.error("contact submission error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Return count of enquiries received today
app.get("/api/enquiries/today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await Enquiry.countDocuments({ createdAt: { $gte: start } });
    res.json({ count });
  } catch (err) {
    console.error("enquiries today error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get applications for specific job
app.get("/api/jobs/:jobId/applications", authAdmin, async (req, res) => {
  try {
    const applications = await JobApplication.find({ jobId: req.params.jobId })
      .sort({ appliedAt: -1 })
      .lean();
    res.json(applications);
  } catch (err) {
    console.error("get job applications error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update application status (admin)
app.patch("/api/job-applications/:id", authAdmin, async (req, res) => {
  const { status } = req.body;

  if (!["pending", "reviewed", "shortlisted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true },
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Send status update email
    const statusMessages = {
      reviewed: "Your application has been reviewed",
      shortlisted: "Congratulations! You have been shortlisted",
      rejected:
        "Thank you for applying. We have decided to move forward with other candidates",
    };

    const message =
      statusMessages[status] || "Your application status has been updated";

    await transporter.sendMail({
      from: process.env.SMTP_USER || "kalpapreeth.contact01@gmail.com",
      to: application.candidateEmail,
      subject: `Career Update: ${application.jobTitle}`,
      html: renderEmailTemplate(
        `
        <h2 style="color: #1e3a8a; margin-top: 0;">Application Status Update</h2>
        <p>Dear <span class="highlight">${application.candidateName}</span>,</p>
        <p style="font-size: 18px; color: #1e3a8a; font-weight: 600;">${message}</p>
        <p>This update is regarding your application for the position of <strong>${application.jobTitle}</strong>.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 14px;">Our hiring team has updated your application status to: <span class="status-badge">${status}</span></p>
        </div>
        <p>We appreciate your interest in joining Kalpapreeth IT Solutions. If you have any questions, feel free to reply to this email.</p>
      `,
        "HR Update",
      ),
    });

    res.json({ success: true, application });
  } catch (err) {
    console.error("update application error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete application (admin)
app.delete("/api/job-applications/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const deletedApp = await JobApplication.findByIdAndDelete(req.params.id);
    if (!deletedApp)
      return res.status(404).json({ error: "Application not found" });

    res.json({ success: true, message: "Application deleted" });
  } catch (err) {
    console.error("delete application error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Clean URL routing - serve .html files without extension
app.use((req, res, next) => {
  // Skip API routes and static files with extensions
  if (req.path.startsWith("/api/") || req.path.includes(".")) {
    return next();
  }

  const requestedPath = req.path;
  const htmlPath = path.join(
    __dirname,
    "../froentend",
    `${requestedPath}.html`,
  );

  // Check if HTML file exists
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }

  // Check if it's a folder with index.html
  const indexPath = path.join(
    __dirname,
    "../froentend",
    requestedPath,
    "index.html",
  );
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  next();
});

// Error middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║  Kalpapreeth IT Solutions           ║");
  console.log("║  Server running on port " + PORT + "         ║");
  console.log("║  http://localhost:" + PORT + "             ║");
  console.log("╚════════════════════════════════════════╝\n");
});
