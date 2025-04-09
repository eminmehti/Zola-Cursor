// initDB.js
const sqlite3 = require('sqlite3').verbose();

// 1) Connect (creates "mydb.sqlite" if it doesn't exist)
let db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error('Could not open database', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// 2) Create the userAnswers table if it doesn't already exist
const createUserAnswersTable = `
  CREATE TABLE IF NOT EXISTS userAnswers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT,
    businessCategory TEXT,
    officeSpace TEXT,
    businessActivity TEXT,
    shareholders TEXT,
    visas INTEGER,
    fullName TEXT,
    phoneNumber TEXT,
    email TEXT
  )
`;

// 3) Create the payments table for Stripe integration
const createPaymentsTable = `
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT,
    payment_type TEXT,
    amount REAL,
    currency TEXT,
    status TEXT,
    customer_name TEXT,
    customer_email TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// 4) Create the proposals table to store selected proposals
const createProposalsTable = `
  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    sessionId TEXT,
    recommendedFreeZone TEXT,
    proposalDetails TEXT,
    selected BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES userAnswers (id)
  )
`;

// Execute the table creation queries
db.run(createUserAnswersTable, (err) => {
  if (err) {
    console.error('Error creating userAnswers table:', err.message);
  } else {
    console.log('userAnswers table created or already exists.');
    
    // Create payments table after userAnswers table is created
    db.run(createPaymentsTable, (err) => {
      if (err) {
        console.error('Error creating payments table:', err.message);
      } else {
        console.log('payments table created or already exists.');
        
        // Check if the redirect_url column exists in the payments table
        db.get("PRAGMA table_info(payments)", (err, rows) => {
          if (err) {
            console.error("Error checking payments table structure:", err);
            return;
          }
          
          // Check if redirect_url column exists
          const hasRedirectUrl = rows.some(row => row.name === 'redirect_url');
          
          if (!hasRedirectUrl) {
            console.log("Adding redirect_url column to payments table...");
            db.run("ALTER TABLE payments ADD COLUMN redirect_url TEXT", (err) => {
              if (err) {
                console.error("Error adding redirect_url column:", err);
              } else {
                console.log("Successfully added redirect_url column to payments table");
              }
            });
          }
        });
        
        // Create proposals table after payments table is created
        db.run(createProposalsTable, (err) => {
          if (err) {
            console.error('Error creating proposals table:', err.message);
          } else {
            console.log('proposals table created or already exists.');
          }
          
          // Close the database connection
          db.close();
        });
      }
    });
  }
});
