const mongoose = require("mongoose");

const connectionDB = async (database) => {
  await mongoose
    .connect(database)
    .then(() =>
      console.log(`Successfully connected to : ${mongoose.connection.host}`)
    )
    .catch((err) => console.log(`Err : ${err}`));
};


module.exports = connectionDB;