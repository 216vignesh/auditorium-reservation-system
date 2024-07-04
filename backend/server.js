const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const bookingRoutes = require('./routes/bookings');

app.use('/api', bookingRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'routes/uploads')));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
