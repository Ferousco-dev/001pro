import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Email and code are required",
      });
    }

    console.log("Sending email to:", email);
    console.log("Verification code:", code);
    console.log(
      "Using EMAIL_USER:",
      process.env.EMAIL_USER ? "Defined" : "UNDEFINED",
    );
    console.log(
      "Using EMAIL_APP_PASSWORD:",
      process.env.EMAIL_APP_PASSWORD ? "Defined" : "UNDEFINED",
    );

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log("SMTP connection verified");

    // Send email
    const info = await transporter.sendMail({
      from: `"Password Reset" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Verification Code",
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
              .social-links {
                margin-bottom: 20px;
              }
              .social-link {
                color: #3b82f6;
                text-decoration: none;
                margin: 0 10px;
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
                  <p>If you didn't request this, you can safely ignore this email. Someone might have typed your email address by mistake.</p>
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
    });

    console.log("Email sent successfully:", info.messageId);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
