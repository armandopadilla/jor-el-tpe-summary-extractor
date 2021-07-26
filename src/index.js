/**
 * Consume summary extractor Messages.  Runs it through
 * https://www.npmjs.com/package/@trashhalo/node-summarizer - TextRank.
 */
const SummarizerManager = require('node-summarizer').SummarizerManager;

// ENV
const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;

const handler = async (event, context, cb) => {
    try {
        // Check if we have a message
        if (!event) return cb(new Error('No even found.'));
        if (event.Records[0].Sns.Message === '') return cb(new Error('No data to process.'));

        // Get the data
        const { input, type, rawDataId } = JSON.parse(event.Records[0].Sns.Message);

        // Check if the message is for "Text" processing and if it has data to process.
        if (!input || input === '') return cb(new Error('input could not be found or is empty.'));
        if (type !== 'text') return cb(new Error('Type not valid.'));

        // Run the summary extractor using texttrack.
        const Summarizer = new SummarizerManager(input, 5);
        const summary = await Summarizer.getSummaryByRank();

        // Save to the DB
        const dbConn = await mysql.createConnection({
            host: DB_HOST,
            user: DB_PASSWORD,
            password: DB_PASSWORD,
            database: DB_DATABASE,
        });

        const sql = 'UPDATE data SET summary = ? WHERE id = ?';
        await dbConn.execute(sql, [summary, rawDataId]);

        // Done
        return cb(null);
    } catch (error) {
        return cb(error.message);
    }
};

module.exports = handler;
