import React, { useRef } from 'react';
import { Download, Share2, QrCode, Calendar, Clock, MapPin, Armchair, User, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const TicketCard = ({ ticket, bookingId, showDownload = true }) => {
  const ticketRef = useRef(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;

    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' });
      
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`ShowFlix-Ticket-${bookingId}.pdf`);
      
      toast.success('Ticket downloaded successfully!', { id: 'pdf-gen' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', { id: 'pdf-gen' });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Movie Ticket - ${ticket.movie}`,
      text: `I've booked tickets for ${ticket.movie} on ${formatDate(ticket.date)} at ${formatTime(ticket.date)}!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      toast.success('Ticket details copied to clipboard!');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Ticket Card for Display */}
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl overflow-hidden shadow-2xl"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">S</span>
              </div>
              <span className="font-bold text-lg">ShowFlix</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">
              E-TICKET
            </span>
          </div>
        </div>

        {/* Movie Info */}
        <div className="p-4 border-b border-dashed border-gray-300">
          <div className="flex gap-4">
            {ticket.moviePoster && (
              <img 
                src={ticket.moviePoster} 
                alt={ticket.movie}
                className="w-20 h-28 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">
                {ticket.movie}
              </h3>
              {ticket.movieLanguage && (
                <p className="text-sm text-gray-500 mt-1">
                  {ticket.movieLanguage} {ticket.movieRuntime && `• ${ticket.movieRuntime} min`}
                </p>
              )}
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <span>{formatDate(ticket.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>{formatTime(ticket.date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theater Info */}
        <div className="p-4 border-b border-dashed border-gray-300">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">{ticket.theater}</p>
              {ticket.screen && (
                <p className="text-sm text-gray-500">{ticket.screen}</p>
              )}
              {ticket.address && (
                <p className="text-sm text-gray-400 mt-1">{ticket.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seats & Amount */}
        <div className="p-4 border-b border-dashed border-gray-300">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Armchair className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-gray-900">Seats</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ticket.seats?.map((seat, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium"
                  >
                    {seat}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Total Paid</span>
              </div>
              <p className="text-2xl font-bold text-red-600">₹{ticket.amount}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-dashed border-gray-300">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Booked by</p>
              <p className="font-medium text-gray-900">{ticket.userName || ticket.user}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-6 text-center bg-gray-50">
          {ticket.qrCode ? (
            <div className="inline-block bg-white p-4 rounded-xl shadow-md">
              <img 
                src={ticket.qrCode} 
                alt="Ticket QR Code"
                className="w-40 h-40"
              />
              <p className="text-xs text-gray-500 mt-2">
                Scan at theater entry
              </p>
            </div>
          ) : (
            <div className="inline-block bg-white p-4 rounded-xl shadow-md">
              <QrCode className="w-40 h-40 text-gray-300" />
              <p className="text-xs text-gray-500 mt-2">
                QR Code not generated yet
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-4 font-mono">
            Booking ID: {bookingId}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Booked on {new Date(ticket.bookedAt || ticket.generatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-3 text-center">
          <p className="text-xs text-gray-500">
            Please arrive 15 minutes before show time • No outside food allowed
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {showDownload && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TicketCard;
