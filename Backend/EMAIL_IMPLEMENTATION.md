# Email Ticket Implementation Guide

## Overview
This implementation adds automated email functionality to send ticket PDFs when a booking is confirmed. The system uses **Nodemailer** for email delivery and **PDFKit** for PDF generation.

## Features Implemented

### 1. **PDF Ticket Generation**
- Professional A4-sized ticket with dark theme
- Includes all booking details:
  - Movie information (title, language, runtime)
  - Show details (date, time, theater, screen)
  - Seat information
  - Payment breakdown
  - User details
- QR code embedded in PDF for theater verification
- Branded with ShowFlix colors and styling

### 2. **Email Notification**
- Beautifully formatted HTML email
- PDF ticket attached as downloadable file
- Email sent automatically after booking confirmation
- Includes important information and instructions

### 3. **Integration Points**
The email is triggered in two places:
- **Payment Controller**: After successful Razorpay payment verification
- **Booking Controller**: When a booking is created directly

## Files Modified/Created

### Created Files
1. **Backend/services/emailService.js**
   - Main email service utility
   - PDF generation logic
   - QR code generation
   - Email template and delivery

### Modified Files
1. **Backend/Controllers/paymentController.js**
   - Added email sending after payment verification
   
2. **Backend/Controllers/bookingController.js**
   - Added email sending after booking creation

### Dependencies Added
- `pdfkit` - PDF document generation library

## How It Works

### Flow Diagram
```
User Completes Payment
         ↓
Payment Verified (paymentController)
         ↓
Booking Created in Database
         ↓
Email Service Triggered
         ↓
PDF Generated with QR Code
         ↓
Email Sent with PDF Attachment
         ↓
User Receives Ticket in Email
```

### Email Service Details

#### PDF Generation
```javascript
generateTicketPDF(booking)
```
- Creates A4 PDF with ShowFlix branding
- Adds movie, show, and booking details
- Generates secure QR code with ticket data
- Returns PDF as buffer for email attachment

#### Email Sending
```javascript
sendTicketEmail(booking)
```
- Populates booking data
- Generates PDF ticket
- Creates HTML email template
- Attaches PDF file
- Sends via SMTP (Gmail)

## Configuration

### Environment Variables
Already configured in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kevalkhunt7@gmail.com
SMTP_PASS=izxdvadgjtombcvk
```

### Gmail App Password Setup
If you need to regenerate the app password:
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App Passwords
4. Generate password for "Mail"
5. Update `SMTP_PASS` in `.env`

## Email Template Preview

### Subject
```
🎬 Your ShowFlix Ticket - [Movie Name]
```

### Email Content
- ShowFlix branded header
- Booking confirmation message
- Complete booking details in a styled card
- Important information section
- Thank you message

### Attachment
- **Filename**: `ShowFlix-Ticket-[BookingID].pdf`
- **Format**: A4 PDF
- **Content**: Full ticket with QR code

## Error Handling

The implementation includes robust error handling:
- Email failures don't block the booking process
- Errors are logged with detailed messages
- Try-catch blocks ensure system stability

```javascript
try {
  const emailResult = await sendTicketEmail(populatedBooking);
  if (emailResult.success) {
    console.log('Ticket email sent successfully');
  } else {
    console.error('Failed to send ticket email:', emailResult.error);
  }
} catch (emailError) {
  console.error('Email sending error:', emailError);
  // Don't fail the booking if email fails
}
```

## Testing

### Manual Testing Steps
1. Start the backend server:
   ```bash
   cd Backend
   npm run dev
   ```

2. Make a booking through the frontend

3. Check the console logs:
   ```
   [Payment Controller] Sending ticket email...
   [Email Service] Starting to send ticket email...
   [Email Service] Generating PDF ticket...
   [Email Service] PDF generated successfully
   [Email Service] Sending email to: user@example.com
   [Email Service] Email sent successfully! Message ID: <...>
   [Payment Controller] Ticket email sent successfully
   ```

4. Check the recipient's email inbox

5. Verify the PDF attachment:
   - Open the PDF
   - Check all details are correct
   - Verify QR code is scannable

### Test Email without Booking
You can create a test script to send a sample email:

```javascript
// test-email.js
import { sendTicketEmail } from './services/emailService.js';

const testBooking = {
  bookingId: 'BKTEST123',
  movie: {
    title: 'Test Movie',
    lang: 'English',
    runtime: 120
  },
  show: {
    showDateTime: new Date(),
    theater: {
      name: 'Test Theater',
      screen: 'Screen 1'
    }
  },
  bookedSeats: ['A1', 'A2'],
  ticketPrice: 300,
  convenienceFee: 2,
  totalAmount: 302,
  user: {
    name: 'Test User',
    email: 'test@example.com',
    _id: 'test123'
  },
  bookingStatus: 'confirmed'
};

sendTicketEmail(testBooking);
```

## Customization Options

### Modify Email Template
Edit the HTML in `emailService.js` line 195-245

### Change PDF Design
Modify the `generateTicketPDF` function in `emailService.js`

### Add More Attachments
Update the `attachments` array in mailOptions

### Change Email Sender
Update the `from` field in mailOptions

## Security Features

1. **QR Code Security**
   - Unique token generated per ticket
   - SHA-256 hashing
   - Timestamp-based validation

2. **Email Security**
   - SMTP authentication
   - Secure connection (STARTTLS)
   - No sensitive data in email body

## Performance Considerations

- PDF generation is async and non-blocking
- Email sending happens after response is sent
- Errors don't impact user experience
- Memory-efficient PDF buffer handling

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify Gmail app password is valid
3. Check console for error messages
4. Ensure port 587 is not blocked

### PDF Not Attaching
1. Verify pdfkit is installed: `npm list pdfkit`
2. Check PDF generation logs
3. Ensure booking data is populated

### QR Code Not Showing
1. Verify qrcode package is installed
2. Check QR generation in console
3. Ensure data URL format is correct

## Future Enhancements

- [ ] Add email templates for booking cancellation
- [ ] Send reminder emails before show time
- [ ] Add support for multiple email recipients
- [ ] Implement email delivery tracking
- [ ] Add support for different ticket designs
- [ ] Create admin dashboard for email logs
- [ ] Add retry mechanism for failed emails

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify all environment variables are set
- Test SMTP connection manually
- Review email service implementation

---

**Implementation Date**: April 21, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
