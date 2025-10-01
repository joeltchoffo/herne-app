import React, { useState } from 'react';
import ApiService from '../../service/ApiService';
import AdminLayout from './AdminLayout';

function AdminEmailPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!subject || !message) {
            setError('Please fill in both Subject and Message.');
            setTimeout(() => setError(''), 4000);
            return;
        }

        try {
            const emailContent = { subject, message };
            const response = await ApiService.sendEmailToAll(emailContent);

            if (response.statusCode === 200 || response.statusCode === 201) {
                setSuccess(response.message || 'Emails sent successfully.');
                setSubject('');
                setMessage('');
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setSuccess(response.message || 'Email sent successfully. Youpiii.');
                setTimeout(() => setError(''), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setTimeout(() => setError(''), 5000);
        }
    };

    return (
        <AdminLayout>
            <div className="admin-email-page" style={{ padding: '2rem', maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📧 Send Email to All Users</h2>

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
                {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}

                <form onSubmit={handleSubmit} className="email-form">
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label><strong>Subject:</strong></label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label><strong>Message:</strong></label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="8"
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                        ></textarea>
                    </div>

                    <button type="submit" className="send-button" style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>
                        Send Email
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}

export default AdminEmailPage;
