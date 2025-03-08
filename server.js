const express = require("express");
const cors = require("cors");

const paymentsRoutes = require("./routes/payments.routes");
const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api", paymentsRoutes);

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(PORT, () => {
  console.log(`Example api listining at http://localhost:${PORT}`);
});
