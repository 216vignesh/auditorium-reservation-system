# Auditorium Reservation System for Guru Nanak Khalsa College, Mumbai, India

This is a full stack application for reserving auditorium in Guru Nanak Khalsa College, Mumbai, India. This application was developed to ease the workload of administrative staff in manually reserving an auditorium. This application offers multiple interesting features like multi level approvals, verified email based booking, options to upload reports and photographs, creating admins, editing booking forms by admin. React.js is used for front end and Node.js for backend with MySQL database.
The application is currently hosted on local server as per the requirement of the college.

To run this application on local machine, make sure you have Xampp server with Apache and MySQL. Clone this repository and start the Apache server.
Go to localhost/phpmyadmin and create a new schema bookings.
Under bookings schema, create 4 tables, bookings, form_configurations, report_files and users.
The structure of each table is as shown below:
bookings:
![image](https://github.com/user-attachments/assets/8be8f8f5-ce92-44c9-beee-f1ab0090de8f)

form_configurations
![image](https://github.com/user-attachments/assets/ae395bf4-ebf1-4661-a96d-5753862a755b)

report_files:
![image](https://github.com/user-attachments/assets/94451b6b-5f37-4dcf-81c1-1b392b01055d)

users:
![image](https://github.com/user-attachments/assets/34287ae1-f228-4324-8bfc-fe899a8c5479)

Then go to root of the project and run "npm install" command

Then go to backend folder and run "npm install"

Now from root, run "npm start" and "nodemon server" from backend folder.

Below is the video of the application:
https://youtu.be/8pMkZY_ryEg

