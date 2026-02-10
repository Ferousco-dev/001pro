// server.js - ES Module Version (Port 5001)
import express from "express";
import cors from "cors";

import axios from "axios";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Import API routes
import anonymousWallRouter from "./api/anonymousWall.js";

dotenv.config();

// Initialize nodemailer dynamically
let nodemailer;
try {
  const nm = await import("nodemailer");
  nodemailer = nm.default;
} catch (error) {
  console.log("⚠️ Nodemailer not available:", error.message);
}

const app = express();
const PORT = process.env.PORT || 5001;

// NUCLEAR OPTION: Allow EVERYTHING (for debugging)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS request handled:", req.path);
    return res.sendStatus(200);
  }

  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

// Google Generative AI removed

// Gmail SMTP transporter for password reset emails
const GMAIL_USER = process.env.EMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

let gmailTransporter = null; // Will be initialized later

// Upload Drive endpoint
app.post("/upload-drive", async (req, res) => {
  console.log("🟢 POST /upload-drive received");
  console.log("   Headers:", req.headers);
  console.log("   Body keys:", Object.keys(req.body || {}));

  try {
    const { name, type, file } = req.body;

    if (!name || !type || !file) {
      console.log("❌ Missing fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      console.log("❌ No Apps Script URL");
      return res.status(500).json({ error: "Apps Script URL not configured" });
    }

    console.log("✅ Forwarding to Apps Script...");
    const response = await axios.post(appsScriptUrl, { name, type, file });
    console.log("✅ Got response from Apps Script");

    res.json(response.data);
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Failed to upload file via Apps Script" });
  }
});

// Test endpoint
app.get("/upload-drive", (req, res) => {
  res.json({ message: "GET endpoint works! Proxy is functioning." });
});

// Password reset email endpoint
app.post("/api/send-password-reset", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    console.log(`📧 Sending password reset email to: ${email}`);

    // Check if Gmail transporter is available
    if (!gmailTransporter) {
      console.error("❌ Gmail transporter not available");
      return res.status(500).json({ error: "Email service not configured" });
    }

    const mailOptions = {
      from: {
        name: "AnonPro Support",
        address: GMAIL_USER,
      },
      to: email,
      subject: "AnonPro Password Reset",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #0a0a0a;
                margin: 0;
                padding: 0;
                color: #ffffff;
              }
              .wrapper {
                width: 100%;
                table-layout: fixed;
                background-color: #0a0a0a;
                padding-bottom: 40px;
                padding-top: 40px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #111111;
                border-radius: 20px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
              }
              .header {
                padding: 40px 0;
                text-align: center;
                background: linear-gradient(135deg, #1e1e1e 0%, #111111 100%);
              }
              .logo {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 2px solid #3b82f6;
                padding: 5px;
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
              }
              .content {
                padding: 40px;
                text-align: center;
              }
              h1 {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 10px;
                color: #ffffff;
              }
              p {
                font-size: 16px;
                line-height: 1.6;
                color: #a0a0a0;
                margin-bottom: 30px;
              }
              .code-container {
                background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                position: relative;
              }
              .code {
                font-family: 'Courier New', Courier, monospace;
                font-size: 42px;
                font-weight: 800;
                letter-spacing: 12px;
                color: #3b82f6;
                margin: 0;
                text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
              }
              .expiry {
                font-size: 12px;
                color: #ef4444;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 10px;
              }
              .footer {
                padding: 30px;
                text-align: center;
                font-size: 12px;
                color: #666666;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <img src="https://files.catbox.moe/1evgz6.png" alt="AnonPro Logo" class="logo">
                </div>
                <div class="content">
                  <h1>Verification Code</h1>
                  <p>Hello! You requested a security code to access your AnonPro account. Please use the following one-time password:</p>
                  <div class="code-container">
                    <div class="code">${code}</div>
                    <div class="expiry">Expires in 10 minutes</div>
                  </div>
                  <p>If you didn't request this, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                  <p>Securely sent by AnonPro Authentication Services</p>
                  <p>© 2025 AnonPro. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    console.log("📤 Attempting to send email to:", email);
    console.log("📧 From address:", GMAIL_USER);

    const info = await gmailTransporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
    console.log("📧 Accepted recipients:", info.accepted);
    console.log("📧 Rejected recipients:", info.rejected);

    res.json({
      success: true,
      message: "Password reset email sent successfully",
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error) {
    console.error("❌ Email sending error:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error response:", error.response);
    console.error("❌ Error command:", error.command);

    // Check for specific Gmail errors
    if (error.code === "EAUTH") {
      console.error("❌ Gmail authentication failed - check App Password");
    } else if (error.code === "ESOCKET") {
      console.error("❌ Network connection error");
    } else if (error.response && error.response.includes("550")) {
      console.error("❌ Email rejected by Gmail - check recipient address");
    }

    res.status(500).json({
      error: "Failed to send password reset email",
      details: error.message,
      code: error.code,
    });
  }
});

// Test email endpoint
app.post("/api/test-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    console.log(`🧪 Testing email send to: ${email}`);

    const testCode = "123456"; // Test code

    const mailOptions = {
      from: {
        name: "AnonPro Test",
        address: GMAIL_USER,
      },
      to: email,
      subject: "AnonPro Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🧪 AnonPro Email Test</h2>
          <p>This is a test email to verify Gmail SMTP is working.</p>
          <p><strong>Test Code: ${testCode}</strong></p>
          <p>If you received this email, the SMTP configuration is working correctly!</p>
          <hr>
          <p><small>Sent at: ${new Date().toISOString()}</small></p>
        </div>
      `,
    };

    const info = await gmailTransporter.sendMail(mailOptions);

    console.log("✅ Test email sent:", info.messageId);

    res.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      testCode: testCode,
    });
  } catch (error) {
    console.error("❌ Test email error:", error);
    res.status(500).json({
      error: "Test email failed",
      details: error.message,
      code: error.code,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// AnonymousWall API routes
app.use("/api/anonymous-wall", anonymousWallRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize Gmail transporter after server setup
const initializeGmail = async () => {
  if (!nodemailer) {
    console.log("❌ Nodemailer not available, Gmail emails disabled");
    return;
  }

  try {
    gmailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    // Test Gmail connection
    if (gmailTransporter) {
      gmailTransporter.verify((error, success) => {
        if (error) {
          console.log("❌ Gmail SMTP connection failed:", error.message);
          console.log("💡 Check your Gmail App Password and 2FA settings");
        } else {
          console.log("✅ Gmail SMTP connection successful - emails ready!");
        }
      });
    } else {
      console.log("❌ Gmail transporter not initialized");
    }
  } catch (error) {
    console.log("❌ Failed to initialize Gmail transporter:", error.message);
  }
};

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 CORS: Allowing all origins (development mode)`);

  // Initialize Gmail after server starts
  await initializeGmail();
});
