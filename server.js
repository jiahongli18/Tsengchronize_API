const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
mongoose.Promise = global.Promise;

//set up express app
const app = express();

//connect to mongodb
mongoose.connect(
  `mongodb+srv://jiahongli18:${process.env.PASS}@cluster0.y82kk.mongodb.net/Tsengchronize?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);
mongoose.Promise = global.Promise;

//middleware
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/static", express.static("./static/"));
app.use("/", require("./routes/api"));

//listen for api call requests
const listener = app.listen(process.env.PORT, () => {
  console.log("App is listening on port " + listener.address().port);
});
