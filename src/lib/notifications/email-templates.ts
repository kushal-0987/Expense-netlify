export interface ExpenseEmailData {
  householdName: string;
  expenseTitle: string;
  category: string;
  amountFormatted: string;
  paidByName: string;
  dateFormatted: string;
  memberShareFormatted?: string;
  notes?: string;
  appUrl: string;
}

export function renderExpenseHtml(data: ExpenseEmailData): { subject: string; html: string; text: string } {
  const subject = `[${data.householdName}] New expense: ${data.expenseTitle} (${data.amountFormatted})`;
  
  const text = [
    `New Expense Added to ${data.householdName}`,
    `----------------------------------------`,
    `Title: ${data.expenseTitle}`,
    `Amount: ${data.amountFormatted}`,
    `Paid by: ${data.paidByName}`,
    `Date: ${data.dateFormatted}`,
    `Category: ${data.category}`,
    data.memberShareFormatted ? `Your Share: ${data.memberShareFormatted}` : "",
    data.notes ? `Notes: ${data.notes}` : "",
    ``,
    `View in Family Expense Tracker: ${data.appUrl}`,
  ].filter(Boolean).join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.expenseTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0d9488 0%, #059669 100%); padding: 24px 28px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px; }
    .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
    .amount-box { background: #f1f5f9; border-radius: 12px; padding: 18px 20px; margin: 16px 0 24px; }
    .amount-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px; }
    .amount-val { font-size: 28px; font-weight: 800; color: #0f172a; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-val { font-weight: 600; color: #0f172a; }
    .btn-wrap { margin-top: 28px; text-align: center; }
    .btn { display: inline-block; background: #0d9488; color: #ffffff !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 10px; }
    .footer { padding: 16px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Family Expense Tracker</h1>
      <p>${data.householdName}</p>
    </div>
    <div class="content">
      <span class="badge">New Expense</span>
      <h2 style="margin: 0 0 4px; font-size: 22px; color: #0f172a;">${data.expenseTitle}</h2>
      
      <div class="amount-box">
        <div class="amount-label">Total Expense</div>
        <div class="amount-val">${data.amountFormatted}</div>
        ${data.memberShareFormatted ? `<div style="margin-top: 8px; font-size: 13px; color: #0d9488; font-weight: 600;">Your calculated share: ${data.memberShareFormatted}</div>` : ""}
      </div>

      <div class="detail-row">
        <span class="detail-label">Paid by</span>
        <span class="detail-val">${data.paidByName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Category</span>
        <span class="detail-val">${data.category}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-val">${data.dateFormatted}</span>
      </div>
      ${data.notes ? `
      <div class="detail-row" style="border-bottom: none;">
        <span class="detail-label">Notes</span>
        <span class="detail-val">${data.notes}</span>
      </div>` : ""}

      <div class="btn-wrap">
        <a href="${data.appUrl}" class="btn">Open Family Expense Tracker</a>
      </div>
    </div>
    <div class="footer">
      This is an automated push notification from ${data.householdName}.
    </div>
  </div>
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
}

export function renderDueReminderHtml(data: DueReminderEmailData): { subject: string; html: string; text: string } {
  const subject = `[${data.householdName}] Payment reminder: ${data.amountFormatted} due to ${data.receiverName}`;
  
  const text = [
    `Payment Reminder from ${data.householdName}`,
    `-----------------------------------------`,
    `Hi ${data.debtorName},`,
    `You have an outstanding balance of ${data.amountFormatted} to ${data.receiverName}.`,
    data.receiverEsewa ? `Pay via eSewa number: ${data.receiverEsewa}` : "",
    data.notes ? `Note: ${data.notes}` : "",
    ``,
    `Open the app to settle up or view balances: ${data.appUrl}`,
  ].filter(Boolean).join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0d9488 0%, #059669 100%); padding: 24px 28px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
    .amount-box { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 18px 20px; margin: 16px 0 24px; }
    .amount-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #991b1b; letter-spacing: 0.05em; margin-bottom: 4px; }
    .amount-val { font-size: 28px; font-weight: 800; color: #b91c1c; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-val { font-weight: 600; color: #0f172a; }
    .btn-wrap { margin-top: 28px; text-align: center; }
    .btn { display: inline-block; background: #0d9488; color: #ffffff !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 10px; }
    .esewa-box { background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 10px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #166534; }
    .footer { padding: 16px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Family Expense Tracker</h1>
      <p>${data.householdName}</p>
    </div>
    <div class="content">
      <span class="badge">Payment Due</span>
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #0f172a;">Reminder for ${data.debtorName}</h2>
      <p style="margin: 0; font-size: 14px; color: #475569;">You have an outstanding due balance in ${data.householdName}:</p>
      
      <div class="amount-box">
        <div class="amount-label">Amount Owed</div>
        <div class="amount-val">${data.amountFormatted}</div>
      </div>

      <div class="detail-row">
        <span class="detail-label">Pay to</span>
        <span class="detail-val">${data.receiverName}</span>
      </div>

      ${data.receiverEsewa ? `
      <div class="esewa-box">
        <strong>eSewa Payment Number:</strong> ${data.receiverEsewa}
      </div>` : ""}

      ${data.notes ? `
      <div class="detail-row" style="border-bottom: none;">
        <span class="detail-label">Note</span>
        <span class="detail-val">${data.notes}</span>
      </div>` : ""}

      <div class="btn-wrap">
        <a href="${data.appUrl}" class="btn">Settle Up in App</a>
      </div>
    </div>
    <div class="footer">
      Automated payment reminder from ${data.householdName}.
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
