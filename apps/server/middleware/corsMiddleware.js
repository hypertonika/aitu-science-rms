// // import Cors from 'cors';
// const cors = require('cors');
// const dotenv = require('dotenv');

// // Настройте параметры CORS
// const allowedOrigins = [process.env.LOCAL_ORIGIN, process.env.PRODUCTION_ORIGIN].filter(Boolean);
// const corsOptions = {
//   origin: allowedOrigins,
//   methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
//   credentials: true,
// };

// // Middleware для обработки CORS
// function runMiddleware(req, res, fn) {
//   return new Promise((resolve, reject) => {
//     fn(req, res, (result) => {
//       if (result instanceof Error) {
//         return reject(result);
//       }
//       return resolve(result);
//     });
//   });
// }

// const corsMiddleware = (req, res) => runMiddleware(req, res, Cors(corsOptions));

// export default corsMiddleware;