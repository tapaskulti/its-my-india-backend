const express = require('express');
const cors = require('cors');

const paymentsRoutes = require('./routes/payments.routes');
const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(
//   cors({
//     // origin: ALLOWED_ORIGINS,
//     origin: function (origin, callback) {
//       // allow requests with no origin
//       // (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       if (
//         // [process.env.FRONT_END1, process.env.FRONT_END2].indexOf(origin) === -1
//         ["https://my-india-frontend-3nlyv.ondigitalocean.app"].indexOf(origin) === -1

//       ) {
//         console.log(origin);
//         // console.log(ALLOWED_ORIGINS.indexOf(origin));
//         var msg =
//           'The CORS policy for this site does not ' +
//           'allow access from the specified Origin.';
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'], // Methods you want to allow
//     allowedHeaders: ['Content-Type', 'Authorization'], // Specify headers you want to allow
//     exposedHeaders: ['Set-Cookie'],
//     credentials: true, // Allow credentials (cookies, authorization headers, etc.)
//   })
// );

const allowedDomains = ["https://itsmyindia.com"];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedDomains.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },    
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

app.use('/api', paymentsRoutes);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(PORT, () => {
  console.log(`Example api listining at http://localhost:${PORT}`);
});
