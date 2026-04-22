import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate secure ticket token
const generateTicketToken = (bookingId, userId) => {
  const data = `${bookingId}:${userId}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Generate PDF ticket
const generateTicketPDF = async (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `ShowFlix Ticket - ${booking.movie.title}`,
          Author: 'ShowFlix',
          Subject: 'Movie Ticket'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e');
      
      // Header
      doc.fillColor('#E50914')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('SHOWFLIX', 50, 50);
      
      doc.fillColor('#ffffff')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('E-TICKET', 50, 90);

      // Booking ID
      doc.fillColor('#E50914')
         .fontSize(14)
         .font('Helvetica')
         .text(`Booking ID: ${booking.bookingId}`, 50, 130);

      // Movie Details Section
      doc.fillColor('#ffffff')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('Movie Details', 50, 170);

      doc.fillColor('#cccccc')
         .fontSize(14)
         .font('Helvetica')
         .text(`Title: ${booking.movie.title}`, 50, 200);

      doc.text(`Language: ${booking.movie.lang || 'English'}`, 50, 225);
      doc.text(`Runtime: ${booking.movie.runtime || 'N/A'} minutes`, 50, 250);

      // Show Details Section
      doc.fillColor('#ffffff')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('Show Details', 50, 300);

      const showDate = new Date(booking.show.showDateTime);
      doc.fillColor('#cccccc')
         .fontSize(14)
         .font('Helvetica')
         .text(`Date: ${showDate.toLocaleDateString('en-US', { 
           weekday: 'long', 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`, 50, 330);

      doc.text(`Time: ${showDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`, 50, 355);

      doc.text(`Theater: ${booking.show.theater?.name || 'Cineplex Downtown'}`, 50, 380);
      doc.text(`Screen: ${booking.show.theater?.screen || 'Screen 1'}`, 50, 405);

      // Seat Details
      doc.fillColor('#ffffff')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('Seat Details', 50, 455);

      doc.fillColor('#cccccc')
         .fontSize(14)
         .font('Helvetica')
         .text(`Seats: ${booking.bookedSeats.join(', ')}`, 50, 485);

      doc.text(`Number of Tickets: ${booking.bookedSeats.length}`, 50, 510);

      // Payment Details
      doc.fillColor('#ffffff')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('Payment Details', 50, 560);

      doc.fillColor('#cccccc')
         .fontSize(14)
         .font('Helvetica')
         .text(`Ticket Price: ₹${booking.ticketPrice}`, 50, 590);

      doc.text(`Convenience Fee: ₹${booking.convenienceFee}`, 50, 615);

      doc.fillColor('#E50914')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(`Total Amount: ₹${booking.totalAmount}`, 50, 645);

      // User Details
      doc.fillColor('#ffffff')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(`Booked by: ${booking.user.name}`, 50, 690);

      doc.fillColor('#cccccc')
         .fontSize(12)
         .font('Helvetica')
         .text(`Email: ${booking.user.email}`, 50, 715);

      // QR Code Section - Will be added after generation
      doc.fillColor('#ffffff')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Scan at Theater Entry', 400, 170);

      // Generate QR code
      const ticketToken = generateTicketToken(booking.bookingId, booking.user._id.toString());
      const ticketData = {
        token: ticketToken,
        bookingId: booking.bookingId,
        movie: booking.movie.title,
        theater: booking.show.theater?.name || 'Cineplex Downtown',
        screen: booking.show.theater?.screen || 'Screen 1',
        date: booking.show.showDateTime,
        seats: booking.bookedSeats,
        amount: booking.totalAmount,
        user: booking.user.name,
        status: booking.bookingStatus,
        generatedAt: new Date().toISOString()
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(ticketData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      // Add QR code to PDF
      const qrImage = doc.openImage(qrCodeDataUrl);
      if (qrImage) {
        doc.image(qrImage, 400, 210, { width: 150, height: 150 });
      }

      // Footer
      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica')
         .text('This is a computer-generated ticket. No signature required.', 50, 760, { align: 'center' });

      doc.text('Please arrive 30 minutes before the show.', 50, 775, { align: 'center' });

      doc.fillColor('#E50914')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Enjoy your movie! 🎬', 50, 795, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Send ticket email
export const sendTicketEmail = async (booking) => {
  try {
    console.log('[Email Service] Starting to send ticket email...');
    
    // Populate booking data if not already populated
    const bookingData = {
      bookingId: booking.bookingId,
      movie: {
        title: booking.movie?.title || 'Unknown Movie',
        lang: booking.movie?.lang || 'English',
        runtime: booking.movie?.runtime || 'N/A'
      },
      show: {
        showDateTime: booking.show?.showDateTime || new Date(),
        theater: {
          name: booking.show?.theater?.name || 'Cineplex Downtown',
          screen: booking.show?.theater?.screen || 'Screen 1'
        }
      },
      bookedSeats: booking.bookedSeats || [],
      ticketPrice: booking.ticketPrice || 0,
      convenienceFee: booking.convenienceFee || 0,
      totalAmount: booking.totalAmount || 0,
      user: {
        name: booking.user?.name || 'Valued Customer',
        email: booking.user?.email || '',
        _id: booking.user?._id || booking.user
      },
      bookingStatus: booking.bookingStatus || 'confirmed'
    };

    // Generate PDF
    console.log('[Email Service] Generating PDF ticket...');
    const pdfBuffer = await generateTicketPDF(bookingData);
    console.log('[Email Service] PDF generated successfully');

    // Create email transporter
    const transporter = createTransporter();

    // Email content
    const showDate = new Date(bookingData.show.showDateTime);
    const mailOptions = {
      from: {
        name: 'ShowFlix',
        address: process.env.SMTP_USER
      },
      to: bookingData.user.email,
      subject: `🎬 Your ShowFlix Ticket - ${bookingData.movie.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; padding: 40px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E50914; font-size: 36px; margin: 0;">SHOWFLIX</h1>
            <h2 style="color: #ffffff; font-size: 24px; margin: 10px 0;">Booking Confirmed! 🎉</h2>
          </div>
          
          <div style="background-color: #16213e; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #ffffff; margin-top: 0;">Booking Details</h3>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Movie:</strong> ${bookingData.movie.title}</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Date:</strong> ${showDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Time:</strong> ${showDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Theater:</strong> ${bookingData.show.theater.name}</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Seats:</strong> ${bookingData.bookedSeats.join(', ')}</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Total Amount:</strong> <span style="color: #E50914; font-size: 18px; font-weight: bold;">₹${bookingData.totalAmount}</span></p>
          </div>

          <div style="background-color: #0f3460; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #ffffff; margin-top: 0;">Important Information</h3>
            <ul style="color: #cccccc; margin: 10px 0; padding-left: 20px;">
              <li>Please arrive 30 minutes before the show</li>
              <li>Bring a valid ID proof</li>
              <li>Show this ticket QR code at the entrance</li>
              <li>Tickets are non-refundable</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #cccccc; font-size: 14px;">Thank you for booking with ShowFlix!</p>
            <p style="color: #E50914; font-size: 18px; font-weight: bold;">Enjoy your movie! 🎬</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `ShowFlix-Ticket-${bookingData.bookingId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // Send email
    console.log('[Email Service] Sending email to:', bookingData.user.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Email sent successfully! Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send OTP email for password reset
export const sendOTPEmail = async (email, otp, userName) => {
  try {
    console.log('[Email Service] Sending OTP email to:', email);
    
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'ShowFlix',
        address: process.env.SMTP_USER
      },
      to: email,
      subject: '🔐 ShowFlix Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; padding: 40px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E50914; font-size: 36px; margin: 0;">SHOWFLIX</h1>
            <h2 style="color: #ffffff; font-size: 24px; margin: 10px 0;">Password Reset Request</h2>
          </div>
          
          <div style="background-color: #16213e; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="color: #cccccc; margin-bottom: 20px;">Hello ${userName || 'User'},</p>
            <p style="color: #cccccc; margin-bottom: 20px;">We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div style="background-color: #0f3460; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #ffffff; font-size: 14px; margin-bottom: 10px;">Your OTP Code:</p>
              <p style="color: #E50914; font-size: 48px; font-weight: bold; letter-spacing: 10px; margin: 0;">${otp}</p>
            </div>
            
            <p style="color: #cccccc; margin-top: 20px;">This OTP will expire in <strong style="color: #E50914;">10 minutes</strong></p>
          </div>

          <div style="background-color: #0f3460; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #ffffff; margin-top: 0;">Important Security Information</h3>
            <ul style="color: #cccccc; margin: 10px 0; padding-left: 20px;">
              <li>Do not share this OTP with anyone</li>
              <li>ShowFlix staff will never ask for your OTP</li>
              <li>This OTP expires in 10 minutes</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #cccccc; font-size: 14px;">Need help? Contact our support team</p>
            <p style="color: #E50914; font-size: 18px; font-weight: bold;">Thank you! 🎬</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] OTP email sent successfully! Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('[Email Service] Error sending OTP email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default { sendTicketEmail, sendOTPEmail };
