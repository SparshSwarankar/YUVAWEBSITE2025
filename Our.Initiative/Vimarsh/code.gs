// Google Apps Script - Event Registration System Backend
// Deploy as Web App: Execute as "Me", Access "Anyone"

// Configuration - Replace with your actual values
const CONFIG = {
  SPREADSHEET_ID: '1CZehhqMkgJegEm6uTZH0iMP08LGfEIraA0_jIj2QBnY',
  RAZORPAY_KEY_ID: 'rzp_live_RCnlaKffG5VeY0',
  RAZORPAY_KEY_SECRET: 'XmdiZBFSi7z0FzUCVxIi7jjc',
  REGISTRATION_AMOUNT: 100, // paise (₹300 = 30000 paise) - default student amount
  EVENT_NAME: 'Vimarsh 2025',
  ORGANIZATION_NAME: 'YUVA-Youth United For Vision & Action',
  SUPPORT_EMAIL: 'yuvavimarsh.helpdesk@gmail.com',
  WEBHOOK_SECRET: 'vimarsh_2025_webhook_secret_key_12345',
  ADMIN_KEY: 'Vimarsh0987'
};

const ADMIN_EMAILS = ['yuvavimarsh.helpdesk@gmail.com'];

function isAdmin() {
  try {
    const email = (Session.getActiveUser() && Session.getActiveUser().getEmail()) || '';
    return ADMIN_EMAILS.indexOf(email.toLowerCase()) > -1;
  } catch (err) {
    return false;
  }
}

// Sheet column indices (0-based) - Updated for new form fields
const COLUMNS = {
  FIRST_NAME: 0,
  LAST_NAME: 1,
  AGE: 2,
  BLOOD_GROUP: 3,
  COLLEGE: 4,
  EMAIL: 5,
  MOBILE: 6,
  STATE: 7,
  PREVIOUS_VIMARSH: 8,
  HOW_YOU_KNOW: 9,
  PAYMENT_CATEGORY: 10,
  UNIQUE_ID: 11,
  PAYMENT_STATUS: 12,
  QR_URL: 13,
  CHECKED_IN_STATUS: 14,
  REGISTRATION_DATE: 15,
  PAYMENT_ID: 16,
  ORDER_ID: 17
};

/**
 * Create standardized JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  if (data) response.data = data;
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Generate unique ID for registration
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `VIM${timestamp}${random}`;
}

/**
 * Admin gate
 * - For public web apps, Session.getActiveUser().getEmail() is often blank.
 * - We therefore also accept a secret adminKey query param as a fallback.
 */
function isAdmin(e) {
  try {
    const email = (Session.getActiveUser() && Session.getActiveUser().getEmail()) || '';
    if (email && ADMIN_EMAILS.indexOf(email.toLowerCase()) > -1) return true;
  } catch (err) {
    // ignore
  }
  if (e && e.parameter && e.parameter.adminKey === CONFIG.ADMIN_KEY) return true;
  return false;
}

/**
 * Handle POST requests
 * - Frontend uses URL-encoded form (no preflight)
 * - Razorpay webhooks use JSON and include signature header
 */
function doPost(e) {
  try {
    const postType = (e.postData && e.postData.type) || '';
    const isJson = postType.indexOf('application/json') > -1;

    // Webhook requests (JSON with signature header)
    const headers = (e.postData && e.postData.headers) || {};
    const webhookSignature =
      headers['x-razorpay-signature'] ||
      headers['X-Razorpay-Signature'] ||
      (e.parameter && e.parameter['x-razorpay-signature']) ||
      '';

    if (isJson && webhookSignature) {
      return handleRazorpayWebhook(e);
    }

    // Frontend requests
    const data = isJson
      ? JSON.parse(e.postData.contents || '{}')
      : (e.parameter || {});

    const action = (data.action || '').toString();

    switch (action) {
      case 'createOrder':
        return handleCreateOrder(data);
      case 'confirmPayment':
        return handlePaymentConfirmation(data);
      case 'checkIn':
        return handleCheckIn(data);
      case 'getRegistrations':
        return handleGetRegistrations(data);
      case 'checkEmail':
        return handleCheckEmail(data);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Handle GET requests (QR scan → admin check-in)
 */
function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();

  if (action === 'checkin') {
    if (!isAdmin(e)) {
      const uid = (e.parameter.uniqueId || e.parameter.uid || '').toString();
      const webAppUrl = ScriptApp.getService().getUrl();
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Admin Check-in</title>
            <style>
              body{font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;margin:0;padding:24px;color:#333}
              .card{max-width:520px;margin:40px auto;background:#fff;border:1px solid #e6e8f0;border-radius:12px;padding:24px;box-shadow:0 10px 24px rgba(0,0,0,0.06)}
              .title{display:flex;align-items:center;gap:10px;margin:0 0 8px}
              .muted{color:#667085}
              .row{display:flex;gap:8px;margin-top:12px}
              input[type=password]{flex:1;padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;font-size:16px}
              button{background:#6366f1;color:#fff;border:none;border-radius:8px;padding:10px 14px;font-weight:600;cursor:pointer}
              .hint{font-size:12px;color:#98a2b3;margin-top:8px}
            </style>
          </head>
          <body>
            <div class="card">
              <h2 class="title">🔒 Admin validation required</h2>
              <p class="muted">Enter the admin key to proceed with check-in.</p>
              <form id="kform" method="GET" action="${webAppUrl}">
                <input type="hidden" name="action" value="checkin" />
                <input type="hidden" name="uniqueId" value="${uid}" />
                <div class="row">
                  <input type="password" name="adminKey" placeholder="Enter admin key" autocomplete="one-time-code" required />
                  <button type="submit">Continue</button>
                </div>
                <div class="hint">Tip: Works even if you're not signed into Google.</div>
              </form>
            </div>
          </body>
        </html>`;
      return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    const uniqueId = e.parameter.uniqueId || e.parameter.uid || '';
    const result = performCheckIn(uniqueId);

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${result.success ? 'Check-in Successful' : 'Check-in Failed'}</title>
          <style>
            body { font-family: Arial, sans-serif; background:#f6f7fb; margin:0; padding:24px; color:#333; }
            .card { max-width: 520px; margin: 40px auto; background:#fff; border:1px solid #e6e8f0; border-radius:12px; padding:24px; box-shadow: 0 10px 24px rgba(0,0,0,0.06); }
            .status { display:flex; align-items:center; gap:12px; }
            .ok { color:#0f9d58; }
            .bad { color:#d93025; }
            .pill { display:inline-block; padding:6px 10px; border-radius:999px; background:#eef2ff; color:#3539aa; font-size:12px; }
            .muted { color:#667085; }
            .grid { margin-top:16px; display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
            .box { background:#fafbff; border:1px solid #edf0ff; border-radius:8px; padding:12px; }
            .label { font-size:12px; color:#6b7280; margin-bottom:4px; }
            .val { font-weight:600; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="status">
              <div class="${result.success ? 'ok' : 'bad'}">${result.success ? '✔' : '✖'}</div>
              <h2 style="margin:0;">${result.success ? 'Check-in successful' : 'Check-in failed'}</h2>
            </div>
            <p class="muted" style="margin-top:8px;">${result.message}</p>
            ${result.data ? `
              <div class="grid">
                <div class="box"><div class="label">Name</div><div class="val">${(result.data.name || '').toString()}</div></div>
                <div class="box"><div class="label">College</div><div class="val">${(result.data.college || '').toString()}</div></div>
                <div class="box"><div class="label">Unique ID</div><div class="val">${(result.data.uniqueId || '').toString()}</div></div>
                <div class="box"><div class="label">Check-in Time</div><div class="val">${(result.data.checkInTime || '').toString()}</div></div>
              </div>
              ${result.data.alreadyCheckedIn ? `<p class="pill" style="margin-top:12px;">Already checked in earlier</p>` : ''}
            ` : ''}
          </div>
        </body>
      </html>`;
    return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return createResponse(false, 'Invalid GET request. Please provide a valid action.');
}

/**
 * Create order in Razorpay
 */
function handleCreateOrder(data) {
  try {
    const uniqueId = generateUniqueId();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.mobile) {
      return createResponse(false, 'Missing required fields');
    }

    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    if (!sheet) throw new Error('Registrations sheet not found');

    const existingRegistration = findRegistrationByEmail(data.email);
    if (existingRegistration && existingRegistration.paymentStatus === 'Completed') {
      return createResponse(false, 'Email already registered with completed payment');
    }

    // Determine amount based on payment category
    let amount = CONFIG.REGISTRATION_AMOUNT; // Default student amount
    if (data.paymentCategory === 'Teacher' || data.paymentCategory === 'Other') {
      amount = 100000; // ₹1000 = 100000 paise
    }

    const orderData = {
      amount: amount,
      currency: 'INR',
      receipt: uniqueId,
      notes: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        uniqueId: uniqueId,
        college: data.college || '',
        paymentCategory: data.paymentCategory || 'student',
        event: CONFIG.EVENT_NAME
      }
    };

    const razorpayOrder = createRazorpayOrder(orderData);

    const rowData = [
      data.firstName,
      data.lastName,
      data.age || '',
      data.bloodGroup || '',
      data.college || '',
      data.email,
      data.mobile,
      data.state || '',
      data.previousVimarsh || '',
      data.howYouKnow || '',
      data.paymentCategory || 'Student',
      uniqueId,
      'Pending',
      '',
      'No',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      '',
      razorpayOrder.id
    ];

    sheet.appendRow(rowData);

    return createResponse(true, 'Order created successfully', {
      orderId: razorpayOrder.id,
      uniqueId: uniqueId,
      amount: amount
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return createResponse(false, 'Failed to create order: ' + error.toString());
  }
}

/**
 * Create order in Razorpay API
 */
function createRazorpayOrder(orderData) {
  const url = 'https://api.razorpay.com/v1/orders';
  const auth = Utilities.base64Encode(`${CONFIG.RAZORPAY_KEY_ID}:${CONFIG.RAZORPAY_KEY_SECRET}`);

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(orderData),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const result = JSON.parse(response.getContentText());

  if (code !== 200 && code !== 201) {
    throw new Error('Razorpay API error: ' + (result && result.error ? result.error.description : 'Unknown error'));
  }

  return result;
}

/**
 * Handle payment confirmation (manual, from frontend)
 */
function handlePaymentConfirmation(data) {
  try {
    const isValid = verifyPaymentSignature(
      data.orderId,
      data.paymentId,
      data.signature
    );

    if (!isValid) {
      return createResponse(false, 'Invalid payment signature');
    }

    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();

    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.ORDER_ID] === data.orderId) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) return createResponse(false, 'Registration not found');

    sheet.getRange(rowIndex, COLUMNS.PAYMENT_STATUS + 1).setValue('Completed');
    sheet.getRange(rowIndex, COLUMNS.PAYMENT_ID + 1).setValue(data.paymentId);

    const uniqueId = values[rowIndex - 1][COLUMNS.UNIQUE_ID];
    const qrUrl = generateQRCode(uniqueId);
    sheet.getRange(rowIndex, COLUMNS.QR_URL + 1).setValue(qrUrl);

    const registrationDetails = {
      firstName: values[rowIndex - 1][COLUMNS.FIRST_NAME],
      lastName: values[rowIndex - 1][COLUMNS.LAST_NAME],
      email: values[rowIndex - 1][COLUMNS.EMAIL],
      college: values[rowIndex - 1][COLUMNS.COLLEGE],
      paymentCategory: values[rowIndex - 1][COLUMNS.PAYMENT_CATEGORY],
      uniqueId: uniqueId,
      qrUrl: qrUrl
    };

    sendPaymentConfirmationEmail(registrationDetails, data.paymentId);

    return createResponse(true, 'Payment confirmed successfully', {
      uniqueId: uniqueId,
      qrUrl: qrUrl
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return createResponse(false, 'Payment confirmation failed: ' + error.toString());
  }
}

/**
 * Handle Razorpay webhook events
 */
function handleRazorpayWebhook(e) {
  try {
    const headers = e.postData.headers || {};
    const signature =
      headers['x-razorpay-signature'] ||
      headers['X-Razorpay-Signature'] ||
      e.parameter['x-razorpay-signature'];

    if (!signature) return createResponse(false, 'No signature found');

    const body = e.postData.contents || '';
    const isValidSignature = verifyWebhookSignature(body, signature);
    if (!isValidSignature) return createResponse(false, 'Invalid signature');

    const webhookData = JSON.parse(body);
    const event = webhookData.event;
    const payload = webhookData.payload;

    switch (event) {
      case 'payment.captured':
        return handlePaymentCaptured(payload.payment.entity);
      case 'payment.failed':
        return handlePaymentFailed(payload.payment.entity);
      case 'order.paid':
        return handleOrderPaid(payload.order.entity, payload.payment.entity);
      default:
        return createResponse(true, 'Event received but not processed');
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return createResponse(false, 'Webhook processing failed: ' + error.toString());
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(body, signature) {
  try {
    const expectedSignature = Utilities.computeHmacSha256Signature(
      body,
      CONFIG.WEBHOOK_SECRET,
      Utilities.Charset.UTF_8
    );
    const expectedSignatureHex = expectedSignature.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
    return signature === expectedSignatureHex;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Handle successful payment capture
 */
function handlePaymentCaptured(payment) {
  try {
    const orderId = payment.order_id;
    const paymentId = payment.id;

    const updated = updatePaymentStatus(orderId, paymentId, 'Completed');
    if (updated) {
      const uniqueId = getUniqueIdFromOrder(orderId);
      if (uniqueId) {
        const qrUrl = generateQRCode(uniqueId);
        updateQRCode(uniqueId, qrUrl);
        const registrationDetails = getRegistrationDetailsByUniqueId(uniqueId);
        if (registrationDetails) sendPaymentConfirmationEmail(registrationDetails, paymentId);
      }
      return createResponse(true, 'Payment processed successfully');
    }
    return createResponse(false, 'Failed to update payment status');
  } catch (error) {
    console.error('Error handling payment captured:', error);
    return createResponse(false, 'Error processing payment: ' + error.toString());
  }
}

/**
 * Handle failed payment
 */
function handlePaymentFailed(payment) {
  try {
    const orderId = payment.order_id;
    const paymentId = payment.id;

    const updated = updatePaymentStatus(orderId, paymentId, 'Failed');
    if (updated) {
      const uniqueId = getUniqueIdFromOrder(orderId);
      if (uniqueId) {
        const registrationDetails = getRegistrationDetailsByUniqueId(uniqueId);
        if (registrationDetails) sendPaymentFailureEmail(registrationDetails);
      }
      return createResponse(true, 'Payment failure processed');
    }
    return createResponse(false, 'Failed to update payment status');
  } catch (error) {
    console.error('Error handling payment failed:', error);
    return createResponse(false, 'Error processing payment failure: ' + error.toString());
  }
}

/**
 * Handle order paid event
 */
function handleOrderPaid(order, payment) {
  try {
    return handlePaymentCaptured(payment);
  } catch (error) {
    console.error('Error handling order paid:', error);
    return createResponse(false, 'Error processing order paid: ' + error.toString());
  }
}

/**
 * Update payment status in the spreadsheet
 */
function updatePaymentStatus(orderId, paymentId, status) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.ORDER_ID] === orderId) {
        sheet.getRange(i + 1, COLUMNS.PAYMENT_STATUS + 1).setValue(status);
        sheet.getRange(i + 1, COLUMNS.PAYMENT_ID + 1).setValue(paymentId);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error updating payment status:', error);
    return false;
  }
}

/**
 * Get unique ID from order ID
 */
function getUniqueIdFromOrder(orderId) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.ORDER_ID] === orderId) return values[i][COLUMNS.UNIQUE_ID];
    }
    return null;
  } catch (error) {
    console.error('Error getting unique ID:', error);
    return null;
  }
}

/**
 * Generate QR code for registration
 * - Encodes a check-in URL restricted to admin (email or ADMIN_KEY)
 * - Adds white border padding and explicit colors for dark mode
 */
function generateQRCode(uniqueId) {
  try {
    const webAppUrl = ScriptApp.getService().getUrl(); // deployed /exec URL
    const checkInUrl = `${webAppUrl}?action=checkin&uniqueId=${encodeURIComponent(uniqueId)}`;

    // White background + margin helps scanning in dark mode
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&margin=20&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(checkInUrl)}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

/**
 * Update QR code in spreadsheet
 */
function updateQRCode(uniqueId, qrUrl) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.UNIQUE_ID] === uniqueId) {
        sheet.getRange(i + 1, COLUMNS.QR_URL + 1).setValue(qrUrl);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error updating QR code:', error);
    return false;
  }
}

/**
 * Get registration details by unique ID
 */
function getRegistrationDetailsByUniqueId(uniqueId) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.UNIQUE_ID] === uniqueId) {
        return {
          firstName: values[i][COLUMNS.FIRST_NAME],
          lastName: values[i][COLUMNS.LAST_NAME],
          email: values[i][COLUMNS.EMAIL],
          college: values[i][COLUMNS.COLLEGE],
          paymentCategory: values[i][COLUMNS.PAYMENT_CATEGORY],
          uniqueId: uniqueId,
          qrUrl: values[i][COLUMNS.QR_URL]
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting registration details:', error);
    return null;
  }
}

/**
 * Find registration by email
 */
function findRegistrationByEmail(email) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if ((values[i][COLUMNS.EMAIL] || '').toString().toLowerCase() === (email || '').toString().toLowerCase()) {
        return {
          paymentStatus: values[i][COLUMNS.PAYMENT_STATUS],
          uniqueId: values[i][COLUMNS.UNIQUE_ID]
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding registration by email:', error);
    return null;
  }
}

/**
 * Send payment confirmation email
 */
function sendPaymentConfirmationEmail(registrationDetails, paymentId) {
  try {
    const subject = `✅ Payment Confirmed - ${CONFIG.EVENT_NAME} Registration`;

    // Determine amount based on payment category
    let amount = 300; // Default student amount
    if (registrationDetails.paymentCategory === 'Teacher' || registrationDetails.paymentCategory === 'Other') {
      amount = 1000;
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Registration Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to ${CONFIG.EVENT_NAME}</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hi ${registrationDetails.firstName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Your payment for <strong>${CONFIG.EVENT_NAME}</strong> has been confirmed successfully!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #333; margin-top: 0;">Registration Details:</h3>
            <ul style="list-style: none; padding: 0; color: #666;">
              <li style="padding: 5px 0;"><strong>Name:</strong> ${registrationDetails.firstName} ${registrationDetails.lastName}</li>
              <li style="padding: 5px 0;"><strong>Unique ID:</strong> <code style="background: #f1f3f4; padding: 2px 6px; border-radius: 4px;">${registrationDetails.uniqueId}</code></li>
              <li style="padding: 5px 0;"><strong>Payment ID:</strong> ${paymentId}</li>
              <li style="padding: 5px 0;"><strong>Amount:</strong> ₹${amount}</li>
              <li style="padding: 5px 0;"><strong>Category:</strong> ${registrationDetails.paymentCategory}</li>
              <li style="padding: 5px 0;"><strong>College:</strong> ${registrationDetails.college}</li>
            </ul>
          </div>
          ${registrationDetails.qrUrl ? `
          <div style="text-align: center; margin: 20px 0;">
            <h4 style="color: #333;">Your QR Code:</h4>
            <img src="${registrationDetails.qrUrl}" alt="Registration QR Code" style="max-width: 220px; background:#fff; padding:10px; border: 2px solid #ddd; border-radius: 8px;">
            <p style="color: #666; font-size: 14px; margin-top: 10px;">Show this QR code at the event for quick check-in</p>
          </div>
          ` : ''}
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border: 1px solid #b3d9ff; margin: 20px 0;">
            <h4 style="color: #0056b3; margin-top: 0;">Need Help?</h4>
            <p style="color: #0056b3; margin-bottom: 0;">If you have any questions, contact: <a href="mailto:${CONFIG.SUPPORT_EMAIL}" style="color: #0056b3;">${CONFIG.SUPPORT_EMAIL}</a></p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 14px; margin-bottom: 5px;">Best regards,</p>
            <p style="color: #333; font-weight: bold; margin: 0;">${CONFIG.ORGANIZATION_NAME}</p>
          </div>
        </div>
      </div>
    `;
    GmailApp.sendEmail(registrationDetails.email, subject, '', {
      htmlBody: htmlBody,
      name: CONFIG.ORGANIZATION_NAME
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

/**
 * Send payment failure email
 */
function sendPaymentFailureEmail(registrationDetails) {
  try {
    const subject = `❌ Payment Failed - ${CONFIG.EVENT_NAME} Registration`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Payment Failed</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">${CONFIG.EVENT_NAME} Registration</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hi ${registrationDetails.firstName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">We're sorry to inform you that your payment was not successful.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #333; margin-top: 0;">Registration Details:</h3>
            <ul style="list-style: none; padding: 0; color: #666;">
              <li style="padding: 5px 0;"><strong>Name:</strong> ${registrationDetails.firstName} ${registrationDetails.lastName}</li>
              <li style="padding: 5px 0;"><strong>Unique ID:</strong> ${registrationDetails.uniqueId}</li>
              <li style="padding: 5px 0;"><strong>Category:</strong> ${registrationDetails.paymentCategory}</li>
            </ul>
          </div>
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border: 1px solid #b3d9ff; margin: 20px 0;">
            <h4 style="color: #0056b3; margin-top: 0;">Need Help?</h4>
            <p style="color: #0056b3; margin-bottom: 0;">If you continue to face issues, contact: <a href="mailto:${CONFIG.SUPPORT_EMAIL}" style="color: #0056b3;">${CONFIG.SUPPORT_EMAIL}</a></p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 14px; margin-bottom: 5px;">Best regards,</p>
            <p style="color: #333; font-weight: bold; margin: 0;">${CONFIG.ORGANIZATION_NAME}</p>
          </div>
        </div>
      </div>
    `;
    GmailApp.sendEmail(registrationDetails.email, subject, '', {
      htmlBody: htmlBody,
      name: CONFIG.ORGANIZATION_NAME
    });
  } catch (error) {
    console.error('Error sending failure email:', error);
  }
}

/**
 * Verify payment signature for manual confirmation
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = Utilities.computeHmacSha256Signature(
      body,
      CONFIG.RAZORPAY_KEY_SECRET,
      Utilities.Charset.UTF_8
    );
    const expectedSignatureHex = expectedSignature.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
    return signature === expectedSignatureHex;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Core check-in logic (reusable)
 */
function performCheckIn(uniqueId) {
  try {
    if (!uniqueId) return { success: false, message: 'Unique ID is required' };

    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.UNIQUE_ID] === uniqueId) {
        if (values[i][COLUMNS.PAYMENT_STATUS] !== 'Completed') {
          return { success: false, message: 'Payment not completed for this registration' };
        }
        if (values[i][COLUMNS.CHECKED_IN_STATUS] === 'Yes') {
          return {
            success: false,
            message: 'Already checked in',
            data: {
              name: `${values[i][COLUMNS.FIRST_NAME]} ${values[i][COLUMNS.LAST_NAME]}`,
              college: values[i][COLUMNS.COLLEGE],
              uniqueId: uniqueId,
              alreadyCheckedIn: true
            }
          };
        }
        sheet.getRange(i + 1, COLUMNS.CHECKED_IN_STATUS + 1).setValue('Yes');
        return {
          success: true,
          message: 'Check-in marked successfully',
          data: {
            name: `${values[i][COLUMNS.FIRST_NAME]} ${values[i][COLUMNS.LAST_NAME]}`,
            college: values[i][COLUMNS.COLLEGE],
            uniqueId: uniqueId,
            checkInTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          }
        };
      }
    }
    return { success: false, message: 'Registration not found with this Unique ID' };
  } catch (error) {
    console.error('Error in performCheckIn:', error);
    return { success: false, message: 'Check-in failed: ' + error.toString() };
  }
}

/**
 * Check-in API
 */
function handleCheckIn(data) {
  const result = performCheckIn(data.uniqueId);
  return createResponse(result.success, result.message, result.data || null);
}

/**
 * Check if email is already registered
 */
function handleCheckEmail(data) {
  try {
    const email = data.email;
    if (!email) {
      return createResponse(false, 'Email is required');
    }

    const existingRegistration = findRegistrationByEmail(email);
    if (existingRegistration) {
      return createResponse(true, 'Email check completed', {
        alreadyRegistered: true,
        paymentStatus: existingRegistration.paymentStatus
      });
    } else {
      return createResponse(true, 'Email check completed', {
        alreadyRegistered: false,
        paymentStatus: null
      });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    return createResponse(false, 'Failed to check email: ' + error.toString());
  }
}

/**
 * Get all registrations (admin)
 */
function handleGetRegistrations(data) {
  try {
    if (data.adminKey !== CONFIG.ADMIN_KEY) {
      return createResponse(false, 'Unauthorized access');
    }
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return createResponse(true, 'No registrations found', { registrations: [] });
    }

    const registrations = [];
    for (let i = 1; i < values.length; i++) {
      registrations.push({
        firstName: values[i][COLUMNS.FIRST_NAME],
        lastName: values[i][COLUMNS.LAST_NAME],
        age: values[i][COLUMNS.AGE],
        bloodGroup: values[i][COLUMNS.BLOOD_GROUP],
        college: values[i][COLUMNS.COLLEGE],
        email: values[i][COLUMNS.EMAIL],
        mobile: values[i][COLUMNS.MOBILE],
        state: values[i][COLUMNS.STATE],
        previousVimarsh: values[i][COLUMNS.PREVIOUS_VIMARSH],
        howYouKnow: values[i][COLUMNS.HOW_YOU_KNOW],
        paymentCategory: values[i][COLUMNS.PAYMENT_CATEGORY],
        uniqueId: values[i][COLUMNS.UNIQUE_ID],
        paymentStatus: values[i][COLUMNS.PAYMENT_STATUS],
        checkedIn: values[i][COLUMNS.CHECKED_IN_STATUS],
        registrationDate: values[i][COLUMNS.REGISTRATION_DATE]
      });
    }

    return createResponse(true, 'Registrations retrieved successfully', {
      registrations: registrations,
      totalCount: registrations.length,
      completedPayments: registrations.filter(r => r.paymentStatus === 'Completed').length,
      checkedInCount: registrations.filter(r => r.checkedIn === 'Yes').length
    });
  } catch (error) {
    console.error('Error getting registrations:', error);
    return createResponse(false, 'Failed to get registrations: ' + error.toString());
  }
}

/**
 * Utilities and tests
 */
function testWebhookSetup() {
  console.log('🧪 Testing webhook configuration...');
  console.log('✅ Webhook Secret configured:', !!CONFIG.WEBHOOK_SECRET);
  console.log('✅ Razorpay credentials configured:', !!CONFIG.RAZORPAY_KEY_ID && !!CONFIG.RAZORPAY_KEY_SECRET);
  console.log('✅ Spreadsheet ID configured:', !!CONFIG.SPREADSHEET_ID);
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    console.log('✅ Sheet access: OK');
    console.log('📊 Sheet has', sheet.getLastRow(), 'rows');
    testRazorpayConnection();
  } catch (error) {
    console.error('❌ Sheet access failed:', error);
  }
}

function testRazorpayConnection() {
  try {
    const url = 'https://api.razorpay.com/v1/payments';
    const auth = Utilities.base64Encode(`${CONFIG.RAZORPAY_KEY_ID}:${CONFIG.RAZORPAY_KEY_SECRET}`);
    const options = {
      method: 'get',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      console.log('✅ Razorpay API connection: OK');
    } else {
      console.error('❌ Razorpay API connection failed:', response.getResponseCode());
    }
  } catch (error) {
    console.error('❌ Error testing Razorpay connection:', error);
  }
}

function resendConfirmationEmail(uniqueId) {
  try {
    const registrationDetails = getRegistrationDetailsByUniqueId(uniqueId);
    if (!registrationDetails) return false;

    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();

    let paymentId = '';
    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.UNIQUE_ID] === uniqueId) {
        paymentId = values[i][COLUMNS.PAYMENT_ID];
        break;
      }
    }

    sendPaymentConfirmationEmail(registrationDetails, paymentId);
    return true;
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    return false;
  }
}

function getRegistrationStats() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return { total: 0, completed: 0, pending: 0, failed: 0, checkedIn: 0 };
    }

    let stats = { total: values.length - 1, completed: 0, pending: 0, failed: 0, checkedIn: 0 };
    for (let i = 1; i < values.length; i++) {
      const paymentStatus = values[i][COLUMNS.PAYMENT_STATUS];
      const checkedInStatus = values[i][COLUMNS.CHECKED_IN_STATUS];
      if (paymentStatus === 'Completed') stats.completed++;
      else if (paymentStatus === 'Pending') stats.pending++;
      else if (paymentStatus === 'Failed') stats.failed++;
      if (checkedInStatus === 'Yes') stats.checkedIn++;
    }
    return stats;
  } catch (error) {
    console.error('Error getting registration stats:', error);
    return null;
  }
}

function initializeSpreadsheet() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    if (!sheet) { console.error('Registrations sheet not found'); return; }
    if (sheet.getLastRow() > 0) { console.log('Sheet already has data, skipping initialization'); return; }

    const headers = [
      'First Name', 'Last Name', 'Age', 'Blood Group', 'College', 'Email', 'Mobile', 'State',
      'Previous Vimarsh', 'How You Know', 'Payment Category', 'Unique ID', 'Payment Status',
      'QR URL', 'Checked In Status', 'Registration Date', 'Payment ID', 'Order ID'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    console.log('✅ Spreadsheet initialized with headers');
  } catch (error) {
    console.error('❌ Error initializing spreadsheet:', error);
  }
}

function simulateWebhookEvent(eventType = 'payment.captured') {
  const testPayload = {
    event: eventType,
    payload: {
      payment: {
        entity: {
          id: 'pay_test123456789',
          order_id: 'order_test123456789',
          amount: CONFIG.REGISTRATION_AMOUNT,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };
  const mockRequest = {
    postData: {
      contents: JSON.stringify(testPayload),
      headers: { 'x-razorpay-signature': 'test_signature' }
    }
  };
  return handleRazorpayWebhook(mockRequest);
}

function cleanupTestEntries() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Registrations');
    const values = sheet.getDataRange().getValues();
    let deletedCount = 0;
    for (let i = values.length - 1; i >= 1; i--) {
      const email = values[i][COLUMNS.EMAIL];
      const uniqueId = values[i][COLUMNS.UNIQUE_ID];
      if ((email && (email.includes('test') || email.includes('example'))) ||
        (uniqueId && (uniqueId.includes('test') || uniqueId.includes('TEST')))) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    console.log(`🧹 Cleaned up ${deletedCount} test entries`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up test entries:', error);
    return 0;
  }
}

/**
 * Verify Razorpay signature helpers
 */
function verifyWebhookSignature(body, signature) {
  try {
    const expectedSignature = Utilities.computeHmacSha256Signature(
      body,
      CONFIG.WEBHOOK_SECRET,
      Utilities.Charset.UTF_8
    );
    const expectedSignatureHex = expectedSignature.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
    return signature === expectedSignatureHex;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

function createCorsResponse(obj) {
  return HtmlService.createHtmlOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
