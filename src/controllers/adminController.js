const Route = require('../models/Route');
const AccessLog = require('../models/AccessLog');
const Config = require('../models/Config');
const crypto = require('crypto');

const getStats = async (req, res) => {
  try {
    const totalRoutes = await Route.countDocuments();
    const temporaryRoutes = await Route.countDocuments({ category: 'temporary' });
    const totalLogs = await AccessLog.countDocuments();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayLogs = await AccessLog.countDocuments({ timestamp: { $gte: startOfDay } });

    const topRoutes = await AccessLog.aggregate([
      { $group: { _id: '$routeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: '_id',
          as: 'routeInfo',
        },
      },
      { $unwind: { path: '$routeInfo', preserveNullAndEmptyArrays: true } },
      { $match: { routeInfo: { $ne: null } } },
      {
        $project: {
          _id: 0,
          routeId: '$_id',
          path: '$routeInfo.path',
          name: '$routeInfo.name',
          visits: '$count',
        },
      },
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyLogs = await AccessLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const logMap = new Map(dailyLogs.map((l) => [l._id, l.count]));
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      activityData.push({ date: dateStr, count: logMap.get(dateStr) || 0 });
    }

    const recentLogs = await AccessLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('routeId', 'path name');

    res.json({
      totalRoutes,
      temporaryRoutes,
      totalLogs,
      todayLogs,
      topRoutes,
      activityData,
      recentLogs,
    });
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportRoutes = async (req, res) => {
  try {
    const { password } = req.query;
    const routes = await Route.find().lean();

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      routes: routes.map((r) => ({
        path: r.path,
        name: r.name,
        category: r.category,
        contentType: r.contentType,
        contentEncoding: r.contentEncoding || 'text',
        content: r.content,
        tags: r.tags || [],
        corsConfig: r.corsConfig || {},
        customHeaders: r.customHeaders || [],
      })),
    };

    let responseData;
    if (password) {
      const key = crypto.scryptSync(password, 'hoster-salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      const json = JSON.stringify(exportData);
      const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
      responseData = {
        encrypted: true,
        iv: iv.toString('hex'),
        data: encrypted.toString('hex'),
      };
    } else {
      responseData = exportData;
    }

    res.setHeader('Content-Disposition', 'attachment; filename="hoster-routes.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(responseData);
  } catch (error) {
    console.error('Error exporting routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const importRoutes = async (req, res) => {
  try {
    const { password, data: importPayload, overwrite } = req.body;

    let exportData;
    if (importPayload.encrypted) {
      if (!password) {
        return res.status(400).json({ message: 'Password required to decrypt this export' });
      }
      try {
        const key = crypto.scryptSync(password, 'hoster-salt', 32);
        const iv = Buffer.from(importPayload.iv, 'hex');
        const encryptedBuf = Buffer.from(importPayload.data, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
        exportData = JSON.parse(decrypted.toString('utf8'));
      } catch {
        return res.status(400).json({ message: 'Invalid password or corrupted export file' });
      }
    } else {
      exportData = importPayload;
    }

    if (!exportData.routes || !Array.isArray(exportData.routes)) {
      return res.status(400).json({ message: 'Invalid export format' });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const r of exportData.routes) {
      try {
        const existing = await Route.findOne({ path: r.path });
        if (existing) {
          if (overwrite) {
            await Route.findByIdAndUpdate(existing._id, {
              name: r.name,
              category: r.category,
              contentType: r.contentType,
              contentEncoding: r.contentEncoding || 'text',
              content: r.content,
              tags: r.tags || [],
              corsConfig: r.corsConfig || {},
              updatedAt: new Date(),
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await Route.create({
            path: r.path,
            name: r.name,
            category: r.category || 'classic',
            contentType: r.contentType,
            contentEncoding: r.contentEncoding || 'text',
            content: r.content,
            tags: r.tags || [],
            corsConfig: r.corsConfig || {},
            temporarySince: r.category === 'temporary' ? new Date() : null,
          });
          created++;
        }
      } catch (err) {
        errors.push({ path: r.path, error: err.message });
      }
    }

    res.json({ message: 'Import complete', created, updated, skipped, errors });
  } catch (error) {
    console.error('Error importing routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCorsConfig = async (req, res) => {
  try {
    const config = await Config.findOne({ key: 'cors' });
    if (!config) {
      return res.json({
        allowOrigin: process.env.CORS_ALLOW_ORIGIN || '*',
        allowMethods: process.env.CORS_ALLOW_METHODS || 'GET,POST,OPTIONS,DELETE,PUT',
        allowHeaders: process.env.CORS_ALLOW_HEADERS || '*',
      });
    }
    res.json(config.value);
  } catch (error) {
    console.error('Error getting CORS config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCorsConfig = async (req, res) => {
  try {
    const { allowOrigin, allowMethods, allowHeaders } = req.body;
    const value = { allowOrigin, allowMethods, allowHeaders };

    await Config.findOneAndUpdate(
      { key: 'cors' },
      { key: 'cors', value },
      { upsert: true, new: true }
    );

    res.json({ message: 'CORS config updated', value });
  } catch (error) {
    console.error('Error updating CORS config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCustomHeadersConfig = async (req, res) => {
  try {
    const config = await Config.findOne({ key: 'customHeaders' });
    res.json(config ? config.value : []);
  } catch (error) {
    console.error('Error getting custom headers config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCustomHeadersConfig = async (req, res) => {
  try {
    const { headers } = req.body;
    const value = Array.isArray(headers) ? headers.filter((h) => h.key) : [];

    await Config.findOneAndUpdate(
      { key: 'customHeaders' },
      { key: 'customHeaders', value },
      { upsert: true, new: true }
    );

    res.json({ message: 'Custom headers config updated', value });
  } catch (error) {
    console.error('Error updating custom headers config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStats,
  getAllLogs,
  exportRoutes,
  importRoutes,
  getCorsConfig,
  updateCorsConfig,
  getCustomHeadersConfig,
  updateCustomHeadersConfig,
};
