export interface ExpenseEmailData {
  householdName: string;
  expenseTitle: string;
  category: string;
  amountFormatted: string;
  paidByName: string;
  dateFormatted: string;
  timeFormatted?: string | null;
  memberShareFormatted?: string;
  notes?: string;
  appUrl: string;
  supportEmail?: string;
}

export function renderExpenseHtml(data: ExpenseEmailData): { subject: string; html: string; text: string } {
  const subject = `[${data.householdName}] New Expense: ${data.expenseTitle} (${data.amountFormatted})`;
  const support = data.supportEmail || "support@expense-netlify.vercel.app";
  const dateTime = data.timeFormatted ? `${data.dateFormatted} at ${data.timeFormatted}` : data.dateFormatted;

  const text = [
    `FAMILY EXPENSE TRACKER`,
    `Household: ${data.householdName}`,
    `----------------------------------------`,
    `NEW EXPENSE RECORDED`,
    `Title: ${data.expenseTitle}`,
    `Amount: ${data.amountFormatted}`,
    `Paid by: ${data.paidByName}`,
    `Date: ${dateTime}`,
    `Category: ${data.category}`,
    data.memberShareFormatted ? `Your Calculated Share: ${data.memberShareFormatted}` : "",
    data.notes ? `Notes: ${data.notes}` : "",
    ``,
    `View in Family Expense Tracker: ${data.appUrl}`,
    ``,
    `Need help? Contact ${support}`,
  ].filter(Boolean).join("\n");

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(data.expenseTitle)}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 12px !important; }
      .content-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px;">
  <center>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      
      <!-- Brand Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #0d9488 0%, #059669 100%); padding: 26px 30px; text-align: left;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Family Expense Tracker</span>
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">${escapeHtml(data.householdName)}</h1>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Body -->
      <tr>
        <td class="content-padding" style="padding: 30px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">New Expense Added</span>
                <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a;">${escapeHtml(data.expenseTitle)}</h2>
                <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b;">Recorded on ${escapeHtml(dateTime)}</p>
              </td>
            </tr>

            <!-- Amount Highlight Box -->
            <tr>
              <td style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Total Amount</td>
                  </tr>
                  <tr>
                    <td style="font-size: 30px; font-weight: 800; color: #0f172a; padding: 4px 0 0 0;">${escapeHtml(data.amountFormatted)}</td>
                  </tr>
                  ${data.memberShareFormatted ? `
                  <tr>
                    <td style="padding-top: 10px; font-size: 13px; font-weight: 600; color: #0d9488;">
                      Your calculated share: <strong style="font-size: 14px;">${escapeHtml(data.memberShareFormatted)}</strong>
                    </td>
                  </tr>` : ""}
                </table>
              </td>
            </tr>

            <!-- Expense Details Table -->
            <tr>
              <td style="padding-top: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Paid by</td>
                    <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right;">${escapeHtml(data.paidByName)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Category</td>
                    <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right; text-transform: capitalize;">${escapeHtml(data.category)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Date</td>
                    <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${escapeHtml(dateTime)}</td>
                  </tr>
                  ${data.notes ? `
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Note</td>
                    <td style="padding: 10px 0; font-weight: 500; color: #334155; text-align: right;">${escapeHtml(data.notes)}</td>
                  </tr>` : ""}
                </table>
              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td style="padding-top: 30px; text-align: center;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <a href="${data.appUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 28px; border-radius: 10px; box-shadow: 0 2px 8px rgba(13,148,136,0.3);">
                        Open in Family Expense Tracker &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
          This is an automated notification from ${escapeHtml(data.householdName)} on Family Expense Tracker.<br />
          If you have questions, contact your household administrator or email <a href="mailto:${support}" style="color: #64748b; text-decoration: underline;">${support}</a>.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export interface DueReminderEmailData {
  householdName: string;
  debtorName: string;
  receiverName: string;
  amountFormatted: string;
  receiverEsewa?: string | null;
  notes?: string;
  appUrl: string;
  supportEmail?: string;
}

export function renderDueReminderHtml(data: DueReminderEmailData): { subject: string; html: string; text: string } {
  const subject = `[${data.householdName}] Payment Reminder: ${data.amountFormatted} due to ${data.receiverName}`;
  const support = data.supportEmail || "support@expense-netlify.vercel.app";

  const text = [
    `FAMILY EXPENSE TRACKER`,
    `Household: ${data.householdName}`,
    `----------------------------------------`,
    `PAYMENT REMINDER FOR ${data.debtorName.toUpperCase()}`,
    `Amount Due: ${data.amountFormatted}`,
    `Pay to: ${data.receiverName}`,
    data.receiverEsewa ? `eSewa Number: ${data.receiverEsewa}` : "",
    data.notes ? `Note from Admin: ${data.notes}` : "",
    ``,
    `Open Family Expense Tracker to settle up: ${data.appUrl}`,
    ``,
    `Need help? Contact ${support}`,
  ].filter(Boolean).join("\n");

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Reminder</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    @media only screen and (max-width: 600px) {
      .content-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px;">
  <center>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      
      <!-- Brand Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #0d9488 0%, #059669 100%); padding: 26px 30px; text-align: left;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Family Expense Tracker</span>
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">${escapeHtml(data.householdName)}</h1>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Body -->
      <tr>
        <td class="content-padding" style="padding: 30px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Payment Reminder</span>
                <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Hi ${escapeHtml(data.debtorName)},</h2>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
                  You have an outstanding due balance in <strong>${escapeHtml(data.householdName)}</strong>. Please review and settle up when convenient.
                </p>
              </td>
            </tr>

            <!-- Due Amount Highlight Box -->
            <tr>
              <td style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #991b1b; letter-spacing: 0.05em;">Amount Due</td>
                  </tr>
                  <tr>
                    <td style="font-size: 32px; font-weight: 800; color: #b91c1c; padding: 4px 0 0 0;">${escapeHtml(data.amountFormatted)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top: 8px; font-size: 14px; font-weight: 600; color: #7f1d1d;">
                      Pay to: <strong>${escapeHtml(data.receiverName)}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${data.receiverEsewa ? `
            <!-- eSewa Payment Box -->
            <tr>
              <td style="padding-top: 16px;">
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 18px; color: #166534; font-size: 14px;">
                  <strong style="display: block; margin-bottom: 4px;">eSewa Payment Details:</strong>
                  Phone Number: <strong style="font-size: 16px; color: #14532d;">${escapeHtml(data.receiverEsewa)}</strong>
                </div>
              </td>
            </tr>` : ""}

            ${data.notes ? `
            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #0d9488;">
                  <strong>Note:</strong> ${escapeHtml(data.notes)}
                </p>
              </td>
            </tr>` : ""}

            <!-- CTA Button -->
            <tr>
              <td style="padding-top: 30px; text-align: center;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <a href="${data.appUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 28px; border-radius: 10px; box-shadow: 0 2px 8px rgba(13,148,136,0.3);">
                        View Balance & Settle Up &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
          Automated reminder sent from ${escapeHtml(data.householdName)} on Family Expense Tracker.<br />
          Need assistance? Contact <a href="mailto:${support}" style="color: #64748b; text-decoration: underline;">${support}</a>.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
