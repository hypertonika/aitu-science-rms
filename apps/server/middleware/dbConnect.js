// // import mongoose from 'mongoose';
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');

// const MONGO_URI = process.env.MONGO_URI;

// if (!MONGO_URI) {
//   throw new Error("Please define the MONGO_URI environment variable inside .env");
// }

// let cached = global.mongoose;

// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

// async function dbConnect() {
//   if (cached.conn) {
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     cached.promise = mongoose.connect(MONGO_URI)
//       .then((mongoose) => {
//         return mongoose;
//       })
//       .catch((error) => console.error('MongoDB connection error:', error));
//   }
//   // app.listen(PORT, () => {
//   //   console.log(`Server running on http://localhost:${PORT}`);
//   // });
//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// // export default dbConnect;