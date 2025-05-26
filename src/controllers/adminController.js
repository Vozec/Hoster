const Route = require('../models/Route');
const AccessLog = require('../models/AccessLog');

// Get general statistics
const getStats = async (req, res) => {
  try {
    const totalRoutes = await Route.countDocuments();
    const totalLogs = await AccessLog.countDocuments();
    
    // Get the 5 most visited routes
    const topRoutes = await AccessLog.aggregate([
      { $group: { _id: '$routeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: '_id',
          as: 'routeInfo'
        }
      },
      { $unwind: '$routeInfo' },
      {
        $project: {
          _id: 0,
          routeId: '$_id',
          path: '$routeInfo.path',
          name: '$routeInfo.name',
          visits: '$count'
        }
      }
    ]);
    
    // Get recent logs
    const recentLogs = await AccessLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('routeId', 'path name');
    
    res.json({
      totalRoutes,
      totalLogs,
      topRoutes,
      recentLogs
    });
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all logs
const getAllLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const logs = await AccessLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('routeId', 'path name');
    
    const total = await AccessLog.countDocuments();
    
    res.json({
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStats,
  getAllLogs
};
