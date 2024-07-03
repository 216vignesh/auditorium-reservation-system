const express = require('express');
const router = express.Router();
const db = require('../../src/database');
const moment = require('moment-timezone');


router.post('/book-auditorium', (req, res) => {
    const { auditorium_id, start_time, end_time } = req.body;
    console.log(auditorium_id)
    console.log(start_time)
    console.log(end_time)
    if (!auditorium_id || !start_time || !end_time) {
        return res.status(400).send("Missing data");
    }
    const requestedDuration = new Date(end_time) - new Date(start_time);
    const durationHMS = new Date(requestedDuration).toISOString().substr(11, 8);
    // console.log(start_time);
    // Correcting the availability check
    const checkAvailability = `
        SELECT * FROM bookings
        WHERE auditorium_id = ?
        AND NOT (end_time <= ? OR start_time >= ?)`;
        
    db.query(checkAvailability, [auditorium_id, start_time, end_time], (err, results) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).send({ message: "Error checking availability", err });
        }

        if (results.length > 0) {
        //     const setVariables = `
        //     SET @operational_start = '06:00:00',
        //     @operational_end = '22:00:00',
        //     @duration = ?;
        //     `;
            
        //     // If there's an overlap, suggest other times
        //     const getSuggestions = `
        //     WITH recursive time_slots AS (
        //         SELECT
        //             @operational_start AS start_time,
        //             ADDTIME(@operational_start, @duration) AS end_time
        //         FROM dual
        //         WHERE ADDTIME(@operational_start, @duration) <= @operational_end
        //         UNION ALL
        //         SELECT
        //             ADDTIME(start_time, @duration),
        //             ADDTIME(end_time, @duration)
        //         FROM time_slots
        //         WHERE ADDTIME(end_time, @duration) <= @operational_end
        //     )
        //     SELECT ts.start_time, ts.end_time
        //     FROM time_slots ts
        //     LEFT JOIN bookings b ON ts.start_time < b.end_time AND ts.end_time > b.start_time AND b.auditorium_id = ?
        //     WHERE b.id IS NULL
        //         AND NOT (ts.start_time < '13:00:00' AND ts.end_time > '12:00:00')
        //     ORDER BY ts.start_time;
        // `;

        // db.query(setVariables, [durationHMS], (err, result) => {
        //     if (err) {
        //         return res.status(500).send({ message: "Error setting session variables", err });
        //     }
        
        //     // If successful, execute the second query to get suggestions
        //     db.query(getSuggestions, [auditorium_id], (err, suggestions) => {
        //         if (err) {
        //             return res.status(500).send({ message: "Error fetching available time slots", err });
        //         }
            return res.status(200).send({ available: false, message:"Slot not available for booking. Please choose another slot" });
        //     });
        // });
        } else {
            // If no overlaps, book the auditorium
            const bookAuditorium = `
                INSERT INTO bookings (auditorium_id, start_time, end_time, status)
                VALUES (?, ?, ?, 'pending')`;

            db.query(bookAuditorium, [auditorium_id, start_time, end_time], (err, result) => {
                if (err) {
                    return res.status(500).send({ message: "Error booking auditorium", err });
                }
                res.status(201).send({ available: true, message: "Booking successful and pending approval", bookingId: result.insertId });
            });
        }
    });
});





module.exports = router;