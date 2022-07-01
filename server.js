require('dotenv').config();
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const xlsx = require('json-as-xlsx');
const app = express();
const connectionString = process.env.DB_URL;

const settings = {
  writeOptions: {
    type: 'buffer',
    bookType: 'xlsx',
  },
};

MongoClient.connect(connectionString, { useUnifiedTopology: true })
  .then((client) => {
    console.log('Connected to Database');
    const db = client.db('Test');
    const employeesCollection = db.collection('employees');

    app.set('view engine', 'ejs');

    // Middleware
    app.use(express.static('public'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Read all results
    app.get('/', (req, res) => {
      employeesCollection
        .find()
        .sort({ sort: req.body.sort })
        .toArray()
        .then((results) => {
          res.render('index.ejs', { employees: results });
        })
        .catch((error) => console.error(error));
    });

    app.get('/sort', (req, res) => {
      employeesCollection
        .find()
        .sort({})
        .toArray()
        .then((results) => {
          // res.render('index.ejs', { employees: results });
          console.log(results);
        })
        .catch((error) => console.error(error));
    });

    // Read all results in JSON format
    app.get('/api', (req, res) => {
      employeesCollection
        .find({}, { _id: 0 })
        .toArray()
        .then((results) => {
          res.json(results);
        })
        .catch((error) => console.error(error));
    });

    // Read from search bar
    app.get('/employees/search', (req, res) => {
      employeesCollection
        .find({
          'first-name': {
            $regex: `^${req.query['first-name']}`,
            $options: 'i',
          },
          'last-name': {
            $regex: `^${req.query['last-name']}`,
            $options: 'i',
          },
        })
        .toArray()
        .then((results) => {
          res.render('index.ejs', { employees: results });
        })
        .catch((error) => console.error(error));
    });

    // Create
    app.post('/employees', (req, res) => {
      employeesCollection
        .insertOne(req.body)
        .then((result) => {
          res.redirect('/');
        })
        .catch((error) => console.error(error));
    });

    // Create from excel spreadsheet
    app.post('/employees/upload', (req, res) => {
      employeesCollection
        .insertMany(req.body)
        .then((result) => {
          res.json('Success');
          // res.render('index.ejs', { employees: results });
        })
        .catch((error) => console.error(error));
    });

    // download excel spreadsheet
    app.get('/employees/download', (req, res) => {
      employeesCollection
        .find()
        .toArray()
        .then((results) => {
          const data = [
            {
              sheet: 'Employees',
              columns: [
                { label: 'First Name', value: 'first-name' },
                { label: 'Last Name', value: 'last-name' },
                { label: 'Floor', value: 'floor' },
                { label: 'Admin', value: 'admin' },
              ],
              content: results,
            },
          ];
          const buffer = xlsx(data, settings);
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-disposition': 'attachment; filename=Employees.xlsx',
          });
          res.end(buffer);
        });
    });

    // Update
    app.put('/employees/update', (req, res) => {
      employeesCollection
        .findOneAndUpdate(
          {
            'first-name': req.body.originalData['first-name'],
            'last-name': req.body.originalData['last-name'],
            floor: req.body.originalData.floor,
            admin: req.body.originalData.admin,
          },
          {
            $set: {
              'first-name': req.body.formData['first-name'],
              'last-name': req.body.formData['last-name'],
              floor: req.body.formData.floor,
              admin: req.body.formData.admin,
            },
          },
          {
            upsert: true,
          }
        )
        .then((result) => {
          res.json('Success');
        })
        .catch((error) => console.error(error));
    });

    // Delete
    app.delete('/employees', (req, res) => {
      employeesCollection
        .findOneAndDelete({
          'first-name': req.body['first-name'],
          'last-name': req.body['last-name'],
        })
        .then((result) => {
          if (result.deletedCount === 0) {
            return res.json('No employee to remove');
          }
          res.json('Removed employee');
        })
        .catch((error) => console.error(error));
    });

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => console.log(`Listening on ${PORT}`));
  })
  .catch((error) => console.error(error));
