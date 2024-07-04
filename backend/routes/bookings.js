const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../src/database');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const multer = require('multer');
const app = express();
const path = require('path');
const crypto = require('crypto');
// const uploadsPath = path.join(__dirname, 'uploads');
//app.use('/uploads', express.static(path.join(__dirname, 'routes/uploads')));
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vigneshs1006@gmail.com',
        pass: 'tinh spef lafm yymw'
    }
});

function sendEmail(to, subject, text) {
    let mailOptions = {
        from: 'vigneshs1006@gmail.com',
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

router.post('/send-verification-code', (req, res) => {
    const { email } = req.body;
    const verificationCode = crypto.randomBytes(3).toString('hex');

    // Send email with verification code
    const mailOptions = {
        from: 'vigneshs1006@gmail.com',
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is ${verificationCode}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send({ message: 'Error sending verification code' });
        }
        res.status(200).send({ message: 'Verification code sent', verificationCode });
    });
});
router.post('/check-auditorium', (req, res) => {
    const { auditorium_id, start_time, end_time } = req.body;

    if (!start_time || !end_time) {
        return res.status(400).json({ message: "Missing data" });
    }

    let fetchSlots;
    let queryParams;

    if (auditorium_id) {
        fetchSlots = `
            SELECT start_time, end_time, auditorium_name 
            FROM bookings 
            WHERE auditorium_id = ?
            AND DATE(start_time) >= DATE(?)
            AND DATE(end_time) <= DATE(?)
            AND status != 'Cancelled';
        `;
        queryParams = [auditorium_id, start_time, end_time];
    } else {
        fetchSlots = `
            SELECT start_time, end_time, auditorium_name 
            FROM bookings 
            WHERE DATE(start_time) >= DATE(?)
            AND DATE(end_time) <= DATE(?)
            AND status != 'Cancelled';
        `;
        queryParams = [start_time, end_time];
    }

    db.query(fetchSlots, queryParams, (err, slots) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ message: "Error fetching slots", err });
        }

        if (auditorium_id) {
            const checkAvailability = `
                SELECT * FROM bookings
                WHERE auditorium_id = ?
                AND NOT (end_time <= ? OR start_time >= ?);
            `;
            db.query(checkAvailability, [auditorium_id, start_time, end_time], (err, results) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return res.status(500).json({ message: "Error checking availability", err });
                }

                if (results.length > 0) {
                    return res.status(200).json({
                        available: false,
                        message: "Slot not available for booking. Please choose another slot",
                        occupiedSlots: slots.map(slot => ({
                            start: moment(slot.start_time).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                            end: moment(slot.end_time).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                            auditorium_name: slot.auditorium_name
                        }))
                    });
                } else {
                    return res.status(200).json({
                        available: true,
                        message: "Auditorium is available for booking.",
                        link: `/book-form?auditorium_id=${auditorium_id}&start_time=${encodeURIComponent(start_time)}&end_time=${encodeURIComponent(end_time)}`,
                        occupiedSlots: slots.map(slot => ({
                            start: moment(slot.start_time).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                            end: moment(slot.end_time).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                            auditorium_name: slot.auditorium_name
                        }))
                    });
                }
            });
        } else {
            return res.status(200).json({
                occupiedSlots: slots.map(slot => ({
                    start: moment(slot.start_time).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                    end: moment(slot.end_time).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                    auditorium_name: slot.auditorium_name
                }))
            });
        }
    });
});


router.post('/book-auditorium', (req, res) => {
    const { auditorium_id, auditorium_name, start_time, end_time, email, form_content } = req.body;
    if (!auditorium_id || !start_time || !end_time || !form_content) {
        return res.status(400).send("Missing data");
    }
    const checkQuery = `
        SELECT COUNT(*) AS unsubmitted_reports
        FROM bookings
        WHERE email = ?
        AND report_submitted = 'No';
    `;
    db.query(checkQuery, [email], (err, result) => {
        if (err) {
            console.error("Error checking previous reports:", err);
            return res.status(500).send({ message: "Error checking previous reports", err });
        }
        const firstRow = result[0];
        if (firstRow.unsubmitted_reports > 0) {
            return res.send({ message: "You have not yet submitted previous reservation's reports and photographs. Please submit it first before making a new booking" });
        } else {
            const bookAuditorium = `
                INSERT INTO bookings (auditorium_id, start_time, end_time, status, form_content, auditorium_name, email, report_submitted)
                VALUES (?, ?, ?, 'Admin approval pending', ?, ?, ?,'No')`;

            db.query(bookAuditorium, [auditorium_id, start_time, end_time, form_content, auditorium_name, email], (err, result) => {
                if (err) {
                    console.error("Error booking auditorium:", err);
                    return res.status(500).send({ message: "Error booking auditorium", err });
                }
                
                sendEmail(email, "Your Booking Details", `Dear User, Your booking request number is ${result.insertId} for ${auditorium_name}. It is currently pending with admin for approval.`);
                
                const getAdminEmailsQuery = `
                    SELECT email FROM users WHERE usertype = 'Admin';
                `;
                db.query(getAdminEmailsQuery, (err, adminResults) => {
                    if (err) {
                        console.error("Error fetching admin emails:", err);
                        return res.status(500).send({ message: "Error fetching admin emails", err });
                    }
                    const adminEmails = adminResults.map(admin => admin.email);
                    adminEmails.forEach(adminEmail => {
                        sendEmail(adminEmail, "New Booking Notification", `A new booking was made for ${auditorium_name} and needs your attention for approval.`);
                    });
                    res.status(201).send({ message: "Booking successful and pending approval", bookingId: result.insertId });
                });
            });
        }
    });
});


router.get('/booking-requests', (req, res) => {
    const query = 'SELECT * FROM bookings WHERE status = "Admin approval pending"';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
        
    });
});
router.get('/booking-requests-principal', (req, res) => {
    const query = 'SELECT * FROM bookings WHERE status = "Principal approval pending"';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
        
    });
});

router.post('/update-booking-status', (req, res) => {
    const { id, newStatus, reason } = req.body;
    console.log(reason);
    const statusUpdate = newStatus === 'Denied' ? `${newStatus}: ${reason}` : newStatus;
    const query = 'UPDATE bookings SET status = ? WHERE id = ?';
    db.query(query, [statusUpdate, id], (err, result) => {
        if (err) return res.status(500).send(err);

        // Fetch booking details to send emails
        const bookingDetailsQuery = 'SELECT email, auditorium_name FROM bookings WHERE id = ?';
        db.query(bookingDetailsQuery, [id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).send('Failed to fetch booking details.');
            }
            const { email, auditorium_name } = results[0];

            if (newStatus === 'Denied') {
                // Send denial email with the reason
                sendEmail(email, "Booking Denial Notification", `Dear User, Your booking request for ${auditorium_name} has been denied. Reason: ${reason}`);
                const deleteBooking="DELETE FROM bookings WHERE id=?"
                db.query(deleteBooking,[id],(err,results) => {
                    if(err)
                        {
                            console.error("Error deleting the record", err);
                        }
                });
            }
            else{
                sendEmail(email, "Booking Notification", `Dear User, Your booking request for ${auditorium_name} has been approved by admin and pending for approval by Principal.`);
                const getPrincipalEmail = 'SELECT email FROM users WHERE usertype = "Principal"';
                db.query(getPrincipalEmail, (err, principalResults) => {
                    if (err || principalResults.length === 0) {
                        console.error("Error fetching principal's email:", err);
                        return;
                    }
                    const principalEmail = principalResults[0].email;
                    sendEmail(principalEmail, "New Booking Notification", `A booking request for ${auditorium_name} is pending for your action.`);
                });
            }

            res.json({ message: 'Booking status updated successfully!' });
        });
    });
});
router.post('/update-booking-status-principal', (req, res) => {
    const { id, newStatus, reason } = req.body;
    console.log(reason);
    const statusUpdate = newStatus === 'Denied' ? `${newStatus}: ${reason}` : newStatus;
    const query = 'UPDATE bookings SET status = ? WHERE id = ?';
    db.query(query, [statusUpdate, id], (err, result) => {
        if (err) return res.status(500).send(err);

        // Fetch booking details to send emails
        const bookingDetailsQuery = 'SELECT email, auditorium_name FROM bookings WHERE id = ?';
        db.query(bookingDetailsQuery, [id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).send('Failed to fetch booking details.');
            }
            const { email, auditorium_name } = results[0];

            if (newStatus === 'Denied') {
                // Send denial email with the reason
                sendEmail(email, "Booking Denial Notification", `Dear User, Your booking request for ${auditorium_name} has been denied. Reason: ${reason}`);
                const deleteBooking="DELETE FROM bookings WHERE id=?"
                db.query(deleteBooking,[id],(err,results) => {
                    if(err)
                        {
                            console.error("Error deleting the record", err);
                        }
                });
            }
            else{
                sendEmail(email, "Booking Notification", `Dear User, Your booking request for ${auditorium_name} has been approved and is active`);
                
            }

            res.json({ message: 'Booking status updated successfully!' });
        });
    });
});

router.post('/create-admin', async (req, res) => {
    const { email, password } = req.body;
    const userType = 'Admin';

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "SELECT * FROM users WHERE email = ? AND userType = ?";

    db.query(query, [email, userType], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return;
        }
        if (results.length > 0) {
            return res.status(500).send({ message: "Admin with this email already exists", err });
        }
        else{
            const query2 = 'INSERT INTO users (email,password,usertype) VALUES (?,?,?)';
            db.query(query2, [email, hashedPassword, userType], (err, result) => {
                if (err) {
                    console.error("Error creating admin", err);
                    return res.status(500).send({ message: "Error creating admin", err });
                }
            res.status(201).send({ message: "Admin created successfully"});
        });
        }


    });
    
});
router.post('/reset-admin-password', async (req, res) => {
    const { email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password = ? WHERE email = ?';

    db.query(query, [hashedPassword, email], (err, result) => {
        if (err) {
            console.error('Error during the password reset:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No user found with that email' });
        }
        res.json({ message: 'Password reset successfully!' });
    });
});
const getUserByEmail = (email, callback) => {
    const query = "SELECT * FROM users WHERE email = ? AND userType = 'Admin'";
    db.query(query, [email], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback(null, null);
        callback(null, results[0]);
    });
};
const getPrincipalByEmail = (email, callback) => {
    const query = "SELECT * FROM users WHERE email = ? AND userType = 'Principal'";
    db.query(query, [email], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback(null, null);
        callback(null, results[0]);
    });
};
// router.post('/login', (req, res) => {
//     const { email, password } = req.body;
    
//     getUserByEmail(email, (err, user) => {
//         if (err) {
//             return res.status(500).json({ message: 'Server error' });
//         }
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         bcrypt.compare(password, user.password, (err, isMatch) => {
//             if (err) {
//                 return res.status(500).json({ message: 'Error checking password' });
//             }
//             if (isMatch) {
//                 return res.status(200).json({ message: 'Login successful' });
//             } else {
//                 return res.status(401).json({ message: 'Invalid credentials' });
//             }
//         });
//     });
// });


router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Modified query to select user without specifying the user type
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = results[0];
        console.log(user);

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Error checking password' });
            }
            if (isMatch) {
                // Send back the user type to the client to determine the navigation route
                res.json({ message: 'Login successful', userType: user.usertype });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        });
    });
});
router.post('/save-form-config', (req, res) => {
    const { config } = req.body;
    const query = "INSERT INTO form_configurations (config) VALUES (?) ON DUPLICATE KEY UPDATE config = VALUES(config)";
    db.query(query, [JSON.stringify(config)], (err, result) => {
        if (err) {
            console.error('Failed to save form configuration:', err);
            return res.status(500).json({ message: 'Failed to save form configuration' });
        }
        res.json({ message: 'Form configuration saved successfully' });
    });
});
router.post('/fetch-bookings', (req, res) => {
    const { email, reportSubmitted } = req.body;
    const query = 'SELECT * FROM bookings WHERE email = ? AND report_submitted = ? AND status=?';
    db.query(query, [email, reportSubmitted,'Active'], (err, results) => {
        if (err) {
            console.error('Failed to fetch bookings:', err);
            return res.status(500).send('Failed to fetch bookings');
        }
        res.json({ bookings: results });
    });
});

router.get('/get-form-config', (req, res) => {
    const query = "SELECT config FROM form_configurations ORDER BY id DESC LIMIT 1";
    db.query(query, (err, results) => {
        if (err || results.length === 0) {
            console.error('Failed to fetch form configuration:', err);
            return res.status(500).json({ message: 'Failed to fetch form configuration' });
        }
        try {
            const config = JSON.parse(results[0].config);
            res.json({ config });
        } catch (parseErr) {
            console.error('Error parsing form config:', parseErr);
            return res.status(500).json({ message: 'Error parsing form configuration', error: parseErr });
        }
    });
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'routes/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix+ path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

router.post('/upload-report/:bookingId', upload.fields([{ name: 'reportFile', maxCount: 1 }, { name: 'photoFile', maxCount: 5 }]), (req, res) => {
    console.log("Received request for booking ID:", req.params.bookingId);
    console.log("Files received:", req.files);
    const { bookingId } = req.params;
    if (!req.files.reportFile || req.files.reportFile.length === 0) {
        return res.status(400).send({ message: "Report file is required." });
    }
    const files = req.files.reportFile.concat(req.files.photoFile || []);
    files.forEach(file => {
        const fileType = file.fieldname === 'reportFile' ? 'report' : 'photo';
        const relativePath = `uploads/${file.filename}`;
        const insertQuery = 'INSERT INTO report_files (booking_id, file_path, file_type) VALUES (?, ?, ?)';
        db.query(insertQuery, [bookingId, relativePath, fileType], (err, result) => {
            if (err) {
                console.error("Error saving file information to database:", err);
                return res.status(500).send({ message: "Failed to save file data in database" });
            }
        });
    });
    const updateBookingQuery = "UPDATE bookings SET report_submitted = 'Yes' WHERE id = ?";
    db.query(updateBookingQuery, [bookingId]);
    const updateStatus = "UPDATE bookings SET status = 'Closed' WHERE id = ?";
    db.query(updateStatus, [bookingId]);

    res.json({ message: "Files uploaded successfully", files: files.map(file => file.path) });
});
router.get('/fetch-report-files', (req, res) => {
    const query = 'SELECT * FROM report_files';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching report files:', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

module.exports = router;