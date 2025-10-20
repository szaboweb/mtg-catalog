const express = require('express');
const bodyParser = require('body-parser');
const cardRoutes = require('./routes/cards');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.use('/cards', cardRoutes);

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

