import React, { useEffect, useState } from 'react';
import ApiService from '../../service/ApiService';
import AdminLayout from '../admin/AdminLayout';
import { format } from 'date-fns';

function ManageBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await ApiService.getAllBookings();
            const fetchedBookings = response.bookingList || response;

            const enrichedBookings = await Promise.all(
                fetchedBookings.map(async (booking) => {
                    try {
                        const detailed = await ApiService.getBookingByConfirmationCode(booking.bookingConfirmationCode);
                        return detailed.booking || booking;
                    } catch (err) {
                        console.warn("Detaildaten konnten nicht geladen werden:", err);
                        return booking;
                    }
                })
            );

            setBookings(enrichedBookings);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message);
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Do you really want to cancel this booking?')) return;

        try {
            const response = await ApiService.cancelBooking(bookingId);
            if (response.statusCode === 200) {
                setSuccessMessage('Booking cancelled successfully');
                fetchBookings();
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message);
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };

    const isValidDate = (value) => {
        const date = new Date(value);
        return value && !isNaN(date.getTime());
    };

    return (
        <AdminLayout>
            <div className="manage-bookings-container">
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <h2 style={{ marginBottom: '1rem' }}>Manage Bookings</h2>

                <table className="bookings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f5f5f5' }}>
                        <tr>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Confirmation Code</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>User Name</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>User Email</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Event Date</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(booking => (
                            <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.bookingConfirmationCode}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.user?.name || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.user?.email || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{isValidDate(booking.event?.eventDate) ? format(new Date(booking.event.eventDate), 'dd.MM.yyyy') : '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd', color: booking.status === 'CANCELLED' ? 'red' : 'green' }}>
                                    {booking.status}
                                </td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    {booking.status === 'ACTIVE' && (
                                        <button onClick={() => handleCancel(booking.id)} style={{ padding: '5px 10px', cursor: 'pointer' }}>Cancel</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

export default ManageBookingsPage;
