let app;
try {
  app = require('../dist/app').default;
} catch (error) {
  app = (req, res) => {
    res.status(500).json({
      error: 'Failed to load app',
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  };
}

module.exports = app;
